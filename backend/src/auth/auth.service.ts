import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { LoginInput, MeDto, SignupInput } from '@nissa/shared';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { SettingsService } from '../settings/settings.service';
import { UploadsService } from '../uploads/uploads.service';
import { TokenService } from './token.service';
import { secureToken } from '../common/utils/reference';
import { iso } from '../common/utils/dates';

const BCRYPT_ROUNDS = 12;
const RESET_TTL_MS = 60 * 60 * 1000; // 1 heure

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly adminEmail: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly mail: MailService,
    private readonly settings: SettingsService,
    private readonly uploads: UploadsService,
    config: ConfigService,
  ) {
    this.adminEmail = config.getOrThrow<{ email: string }>('admin').email;
  }

  /**
   * Dépôt d'une candidature — CDC §3.1.
   *
   * Le compte est créé au statut PENDING_REVIEW : il ne permet ni de se connecter
   * au catalogue ni de vendre tant que l'administratrice n'a pas écouté l'audio de
   * serment et accepté la demande.
   */
  async signup(input: SignupInput, audio: Express.Multer.File): Promise<{ message: string }> {
    if (!audio) {
      throw new BadRequestException(
        'L’enregistrement audio est nécessaire pour déposer ta candidature.',
      );
    }

    // « î » s'écrit en Unicode d'un seul point de code ou d'un « i » suivi d'un
    // accent combinant : sans normalisation, deux pseudos identiques à l'œil
    // passeraient tous deux la contrainte d'unicité de la base.
    const pseudoDemande = input.pseudo?.normalize('NFC');

    const [existingEmail, existingPseudo] = await Promise.all([
      this.prisma.user.findUnique({ where: { email: input.email }, select: { id: true } }),
      // Le pseudo est facultatif : il n'y a rien à vérifier quand la sœur n'en
      // a pas choisi — l'API lui en fabrique un plus bas.
      pseudoDemande
        ? this.prisma.user.findUnique({ where: { pseudo: pseudoDemande }, select: { id: true } })
        : Promise.resolve(null),
    ]);

    if (existingEmail) {
      throw new ConflictException({
        message: 'Un compte existe déjà avec cette adresse e-mail.',
        fieldErrors: { email: 'Cette adresse e-mail est déjà utilisée.' },
      });
    }
    if (existingPseudo) {
      throw new ConflictException({
        message: 'Ce pseudo est déjà pris par une autre sœur.',
        fieldErrors: { pseudo: 'Ce pseudo est déjà pris par une autre sœur.' },
      });
    }

    // Choisi ou fabriqué, le pseudo est arrêté avant la création du compte.
    const pseudo = pseudoDemande ?? (await this.genererPseudo(input.prenom));

    const stored = await this.uploads.saveAudio(audio);

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
        nom: input.nom.trim(),
        prenom: input.prenom.trim(),
        pseudo,
        isVeiled: true,
        audioOathPath: stored.path,
        status: 'PENDING_REVIEW',
        acceptedTermsAt: new Date(),
      },
    });

    const settings = await this.settings.get();

    await this.mail.send('signupReceived', user.email, {
      prenom: user.prenom,
      accessFeeCents: settings.accessFeeCents,
    });
    await this.mail.send('newApplicationToAdmin', this.adminEmail, {
      pseudo: user.pseudo,
      adminUrl: this.mail.url('/admin/inscriptions'),
    });

    return {
      message:
        'Ta demande d’inscription a bien été transmise. Un e-mail te sera envoyé sous peu ; en cas d’acceptation, une participation de 5 € te sera demandée.',
    };
  }

  /**
   * Fabrique un pseudo disponible à partir du prénom.
   *
   * Le pseudo étant facultatif, l'API doit savoir en proposer un. La base est
   * translittérée en ASCII : un prénom écrit en arabe donnerait sinon une
   * chaîne vide, d'où le repli « soeur ». Le suffixe n'apparaît qu'en cas de
   * collision, pour que la première sœur d'un prénom garde le pseudo nu.
   */
  private async genererPseudo(prenom: string): Promise<string> {
    const base =
      prenom
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '')
        .slice(0, 20) || 'soeur';

    for (let essai = 0; essai < 50; essai += 1) {
      // Le pseudo doit faire au moins trois caractères : un prénom très court
      // est complété plutôt que refusé.
      const candidat =
        essai === 0 ? base.padEnd(3, '1') : `${base}.${randomBytes(2).toString('hex')}`;

      const pris = await this.prisma.user.findUnique({
        where: { pseudo: candidat },
        select: { id: true },
      });
      if (!pris) return candidat;
    }

    throw new ConflictException({
      message: 'Nous n’arrivons pas à te proposer un pseudo. Choisis-en un, s’il te plaît.',
      fieldErrors: { pseudo: 'Choisis un pseudo, s’il te plaît.' },
    });
  }

  /**
   * Connexion. Les candidatures en attente, refusées ou non payées reçoivent un
   * message explicite plutôt qu'un échec générique : le front les redirige alors
   * vers l'écran correspondant à leur statut.
   */
  async login(input: LoginInput): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });

    // Comparaison systématique, même sans compte : le temps de réponse ne révèle
    // pas si l'adresse existe.
    const matches = user
      ? await bcrypt.compare(input.password, user.passwordHash)
      : await bcrypt.compare(input.password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv');

    if (!user || !matches) {
      throw new UnauthorizedException('Cet e-mail ou ce mot de passe ne correspond pas. Réessaie doucement.');
    }

    if (user.status === 'REJECTED') {
      throw new UnauthorizedException({
        message: 'Ta demande d’inscription n’a pas pu être retenue. Nous en sommes navrées.',
        memberStatus: user.status,
      });
    }

    // Première connexion après paiement : la membre entre dans la configuration
    // de son compte (CDC §3.2). L'écran « Paiement accepté » a fait son office.
    if (user.status === 'PAYMENT_DONE') {
      return this.prisma.user.update({
        where: { id: user.id },
        data: { status: 'ONBOARDING' },
      });
    }

    return user;
  }

  async me(userId: string): Promise<MeDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Nous ne retrouvons pas ce compte.');
    return this.toMeDto(user);
  }

  toMeDto(user: User): MeDto {
    const hasAddress = Boolean(user.addressLine1 && user.postalCode && user.city);

    return {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      pseudo: user.pseudo,
      role: user.role,
      status: user.status,
      stripeConnectStatus: user.stripeConnectStatus,
      address: hasAddress
        ? {
            recipientName: user.recipientName ?? `${user.prenom} ${user.nom}`,
            line1: user.addressLine1 as string,
            line2: user.addressLine2,
            postalCode: user.postalCode as string,
            city: user.city as string,
            country: user.country ?? 'France',
            phone: user.phone,
          }
        : null,
      freeBoostUntil: iso(user.freeBoostUntil),
      hasPaidAccessFee: Boolean(user.accessFeePaidAt),
      createdAt: user.createdAt.toISOString(),
    };
  }

  // ————— Mot de passe oublié —————

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Réponse volontairement identique qu'un compte existe ou non (anti-énumération). */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const message =
      'Si un compte existe pour cette adresse, un e-mail de réinitialisation vient d’être envoyé.';

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message };

    const token = secureToken();
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(token),
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
      },
    });

    await this.mail.send('passwordReset', user.email, {
      prenom: user.prenom,
      resetUrl: this.mail.url(`/reinitialiser-mot-de-passe?token=${token}`),
    });

    return { message };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const reset = await this.prisma.passwordReset.findUnique({
      where: { tokenHash: this.hashToken(token) },
    });

    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      throw new BadRequestException(
        'Ce lien n’est plus valable. Refais simplement une demande, nous t’en renverrons un.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS) },
      }),
      this.prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // Toute session ouverte avec l'ancien mot de passe est invalidée.
    await this.tokens.revokeAllForUser(reset.userId);

    return { message: 'Ton mot de passe a été mis à jour. Tu peux te connecter.' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Nous ne retrouvons pas ce compte.');

    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new BadRequestException({
        message: 'Ce mot de passe actuel ne correspond pas.',
        fieldErrors: { currentPassword: 'Ce mot de passe actuel ne correspond pas.' },
      });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS) },
    });
    await this.tokens.revokeAllForUser(userId);
  }

  static hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  }
}
