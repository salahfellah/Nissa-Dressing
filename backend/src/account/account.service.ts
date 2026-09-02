import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { AddressInput, MeDto, ProfileInput } from '@nissa/shared';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { SettingsService } from '../settings/settings.service';
import { StripeService } from '../stripe/stripe.service';
import { AuthService } from '../auth/auth.service';
import { addDays } from '../common/utils/dates';

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly settings: SettingsService,
    private readonly mail: MailService,
    private readonly auth: AuthService,
  ) {}

  private async requireUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Nous ne retrouvons pas ce compte.');
    return user;
  }

  // ————— Frais d'accès de 5 € (CDC §3.1) —————

  async createAccessFeeCheckout(userId: string): Promise<{ url: string; isMock: boolean }> {
    const user = await this.requireUser(userId);

    if (user.accessFeePaidAt) {
      throw new ConflictException('Tes frais d’accès sont déjà réglés, baraka Allahu fiki.');
    }
    if (user.status !== 'AWAITING_PAYMENT') {
      throw new BadRequestException(
        'Ta candidature doit d’abord être acceptée par l’administratrice.',
      );
    }

    const settings = await this.settings.get();
    const session = await this.stripe.createAccessFeeCheckout({
      userId: user.id,
      email: user.email,
      amountCents: settings.accessFeeCents,
    });

    return { url: session.url, isMock: this.stripe.isMock };
  }

  /**
   * Enregistre le paiement des frais d'accès.
   *
   * Appelé par le webhook Stripe en production, et par la page de paiement simulée
   * en mode mock. Idempotent : un double appel ne prolonge pas le boost offert.
   */
  async confirmAccessFeePaid(userId: string): Promise<MeDto> {
    const user = await this.requireUser(userId);

    if (user.accessFeePaidAt) {
      return this.auth.toMeDto(user);
    }

    const settings = await this.settings.get();
    const now = new Date();

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        accessFeePaidAt: now,
        // Le mois de boost offert court dès le paiement (CDC §3.1).
        freeBoostUntil: addDays(now, settings.freeBoostDays),
        status: 'PAYMENT_DONE',
      },
    });

    await this.mail.send('accessFeePaid', updated.email, {
      prenom: updated.prenom,
      loginUrl: this.mail.url('/connexion'),
    });

    return this.auth.toMeDto(updated);
  }

  // ————— Profil & adresse (CDC §3.2) —————

  async updateProfile(userId: string, input: ProfileInput): Promise<MeDto> {
    // Même normalisation qu'à l'inscription : deux écritures Unicode d'un même
    // accent donnent deux pseudos identiques à l'œil que la contrainte
    // d'unicité laisserait pourtant coexister.
    const pseudo = input.pseudo.normalize('NFC');

    const taken = await this.prisma.user.findFirst({
      where: { pseudo, NOT: { id: userId } },
      select: { id: true },
    });
    if (taken) {
      throw new ConflictException({
        message: 'Ce pseudo est déjà pris par une autre sœur.',
        fieldErrors: { pseudo: 'Ce pseudo est déjà pris par une autre sœur.' },
      });
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { nom: input.nom.trim(), prenom: input.prenom.trim(), pseudo },
    });

    return this.auth.toMeDto(user);
  }

  async updateAddress(userId: string, input: AddressInput): Promise<MeDto> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        recipientName: input.recipientName.trim(),
        addressLine1: input.line1.trim(),
        addressLine2: input.line2?.trim() || null,
        postalCode: input.postalCode.trim(),
        city: input.city.trim(),
        country: input.country.trim(),
        phone: input.phone?.trim() || null,
      },
    });

    return this.auth.toMeDto(user);
  }

  // ————— Stripe Connect (CDC §3.2 / §4.3) —————

  /**
   * Ouvre l'onboarding Stripe Connect. Les coordonnées bancaires sont saisies
   * chez Stripe : aucune donnée bancaire ne transite ni n'est stockée ici.
   */
  async startStripeOnboarding(userId: string): Promise<{ url: string; isMock: boolean }> {
    const user = await this.requireUser(userId);

    let accountId = user.stripeAccountId;
    if (!accountId) {
      accountId = await this.stripe.createConnectedAccount({ email: user.email, userId: user.id });
      await this.prisma.user.update({
        where: { id: user.id },
        data: { stripeAccountId: accountId, stripeConnectStatus: 'PENDING' },
      });
    }

    return { url: await this.stripe.createOnboardingLink(accountId), isMock: this.stripe.isMock };
  }

  /** Interroge Stripe et met à jour le statut du compte connecté. */
  async refreshStripeStatus(userId: string): Promise<MeDto> {
    const user = await this.requireUser(userId);

    if (!user.stripeAccountId) {
      return this.auth.toMeDto(user);
    }

    const ready = await this.stripe.isAccountReady(user.stripeAccountId);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { stripeConnectStatus: ready ? 'COMPLETE' : 'PENDING' },
    });

    return this.auth.toMeDto(updated);
  }

  async stripeDashboardLink(userId: string): Promise<{ url: string | null }> {
    const user = await this.requireUser(userId);
    if (!user.stripeAccountId) return { url: null };
    return { url: await this.stripe.createLoginLink(user.stripeAccountId) };
  }

  /**
   * Clôture la configuration du compte : la membre accède au site (statut MEMBER).
   *
   * L'adresse postale est exigée — elle alimente le bordereau d'envoi. Stripe Connect
   * ne l'est pas à ce stade : on ne bloque pas une sœur qui souhaite d'abord acheter.
   * Il redevient obligatoire au moment de publier une annonce (voir ListingsService).
   */
  async completeOnboarding(userId: string): Promise<MeDto> {
    const user = await this.requireUser(userId);

    if (!user.addressLine1 || !user.postalCode || !user.city) {
      throw new BadRequestException({
        message: 'Renseigne ton adresse postale pour continuer.',
        step: 'address',
      });
    }

    if (user.status === 'MEMBER') {
      return this.auth.toMeDto(user);
    }

    if (user.status !== 'ONBOARDING' && user.status !== 'PAYMENT_DONE') {
      throw new BadRequestException('Ton compte n’est plus à l’étape de configuration.');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { status: 'MEMBER' },
    });

    return this.auth.toMeDto(updated);
  }
}
