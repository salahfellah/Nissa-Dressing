import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { AddressInput, MemberDashboardDto, MeDto, ProfileInput } from '@nissa/shared';
import type { ListingStatus, OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { SettingsService } from '../settings/settings.service';
import { StripeService } from '../stripe/stripe.service';
import { AuthService } from '../auth/auth.service';
import { NotificationsService } from '../notifications/notifications.service';
import { addDays } from '../common/utils/dates';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly settings: SettingsService,
    private readonly mail: MailService,
    private readonly auth: AuthService,
    private readonly notifications: NotificationsService,
  ) {}

  private async requireUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Nous ne retrouvons pas ce compte.');
    return user;
  }

  // ————— Tableau de bord de l'espace personnel (CDC §3.2) —————

  /**
   * Ce que la sœur a vendu, acheté, déposé, et ce qu'il reste de son mois offert.
   *
   * Les commandes annulées et remboursées sont écartées des totaux : elles
   * n'ont rien rapporté ni rien coûté, et les compter donnerait une somme que
   * la sœur ne retrouverait ni sur son relevé ni dans « Mes ventes ».
   *
   * Le montant des ventes est le reversement (`sellerPayoutCents`), pas le prix
   * payé par l'acheteuse : c'est la somme qui arrive sur son compte, commission
   * et frais de port déduits.
   */
  async dashboard(userId: string): Promise<MemberDashboardDto> {
    const maintenant = new Date();
    const abouties: OrderStatus[] = ['PAID', 'SHIPPED', 'RECEIVED'];

    const [
      nbVentes,
      ventes,
      reversees,
      aExpedier,
      nbAchats,
      achats,
      aRecevoir,
      parStatut,
      misesEnAvant,
      user,
    ] = await Promise.all([
      this.prisma.order.count({ where: { sellerId: userId, status: { in: abouties } } }),
      this.prisma.order.aggregate({
        where: { sellerId: userId, status: { in: abouties } },
        _sum: { sellerPayoutCents: true },
      }),
      this.prisma.order.aggregate({
        where: {
          sellerId: userId,
          status: { in: abouties },
          stripeTransferId: { not: null },
        },
        _sum: { sellerPayoutCents: true },
      }),
      this.prisma.order.count({ where: { sellerId: userId, status: 'PAID' } }),
      this.prisma.order.count({ where: { buyerId: userId, status: { in: abouties } } }),
      this.prisma.order.aggregate({
        where: { buyerId: userId, status: { in: abouties } },
        _sum: { totalCents: true },
      }),
      this.prisma.order.count({ where: { buyerId: userId, status: 'SHIPPED' } }),
      this.prisma.listing.groupBy({
        by: ['status'],
        where: { sellerId: userId },
        _count: { _all: true },
      }),
      this.prisma.listing.count({
        where: { sellerId: userId, boostedUntil: { gt: maintenant } },
      }),
      this.requireUser(userId),
    ]);

    const annonces = (statut: ListingStatus): number =>
      parStatut.find((ligne) => ligne.status === statut)?._count._all ?? 0;

    const settings = await this.settings.get();
    const finDuMoisOffert = user.freeBoostUntil;
    const resteEnMs = finDuMoisOffert ? finDuMoisOffert.getTime() - maintenant.getTime() : 0;

    return {
      sales: {
        count: nbVentes,
        payoutCents: ventes._sum.sellerPayoutCents ?? 0,
        transferredCents: reversees._sum.sellerPayoutCents ?? 0,
        toShip: aExpedier,
      },
      purchases: {
        count: nbAchats,
        spentCents: achats._sum.totalCents ?? 0,
        toReceive: aRecevoir,
      },
      listings: {
        published: annonces('PUBLISHED'),
        pendingReview: annonces('PENDING_REVIEW'),
        sold: annonces('SOLD'),
        boosted: misesEnAvant,
      },
      freeBoost:
        finDuMoisOffert && resteEnMs > 0
          ? {
              until: finDuMoisOffert.toISOString(),
              // Arrondi au jour supérieur : tant qu'il reste des heures, il
              // reste « un jour » — annoncer 0 alors que le mois court encore
              // ferait croire à une mise en avant déjà éteinte.
              daysLeft: Math.ceil(resteEnMs / 86_400_000),
              totalDays: settings.freeBoostDays,
            }
          : null,
    };
  }

  // ————— Frais d'accès de 5 € (CDC §3.1) —————

  async createAccessFeeCheckout(userId: string): Promise<{ url: string; isMock: boolean }> {
    const user = await this.requireUser(userId);

    if (user.accessFeePaidAt) {
      throw new ConflictException('Vos frais d’accès sont déjà réglés, baraka Allahu fiki.');
    }
    if (user.status !== 'AWAITING_PAYMENT') {
      throw new BadRequestException(
        'Votre candidature doit d’abord être acceptée par l’administratrice.',
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

    await this.notifications.notify(updated.id, {
      kind: 'ACCESS_FEE_PAID',
      title: 'Frais d’accès réglés',
      message: 'Merci ma sœur ! Votre mois de mise en avant offert vous attend : connectez-vous pour terminer la configuration.',
      link: '/connexion',
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
        // Le numéro donné à l'inscription est le seul moyen de joindre la sœur :
        // enregistrer une adresse sans téléphone ne doit pas l'effacer. On ne
        // l'écrase donc que si un nouveau numéro est effectivement fourni.
        ...(input.phone?.trim() ? { phone: input.phone.trim() } : {}),
      },
    });

    return this.auth.toMeDto(user);
  }

  // ————— Stripe Connect (CDC §3.2 / §4.3) —————

  private shouldRecreateStripeAccount(error: unknown): boolean {
    const stripeError = error as Error & {
      code?: string;
      param?: string;
      raw?: { code?: string; param?: string };
    };

    return (
      (stripeError.code === 'resource_missing' && stripeError.param === 'account') ||
      (stripeError.raw?.code === 'resource_missing' && stripeError.raw?.param === 'account') ||
      /No such account/i.test(stripeError.message ?? '')
    );
  }

  /**
   * Ouvre l'onboarding Stripe Connect. Les coordonnées bancaires sont saisies
   * chez Stripe : aucune donnée bancaire ne transite ni n'est stockée ici.
   */
  async startStripeOnboarding(userId: string): Promise<{ url: string; isMock: boolean }> {
    const user = await this.requireUser(userId);

    if (this.stripe.bypassConnect) {
      const accountId =
        user.stripeAccountId ??
        (await this.stripe.createConnectedAccount({
          email: user.email,
          userId: user.id,
        }));
      const updated = await this.prisma.user.update({
        where: { id: user.id },
        data: { stripeAccountId: accountId, stripeConnectStatus: 'COMPLETE' },
      });

      if (user.stripeConnectStatus !== 'COMPLETE') {
        await this.notifications.notify(updated.id, {
          kind: 'STRIPE_READY',
          title: 'Compte de paiement pret en test',
          message: 'Stripe Connect est ignore en local : vous pouvez tester les ventes tout de suite.',
          link: '/compte',
        });
      }

      return { url: '/compte', isMock: this.stripe.isMock };
    }

    try {
      const createAndStoreAccount = async (): Promise<string> => {
        const accountId = await this.stripe.createConnectedAccount({
          email: user.email,
          userId: user.id,
        });
        await this.prisma.user.update({
          where: { id: user.id },
          data: { stripeAccountId: accountId, stripeConnectStatus: 'PENDING' },
        });
        return accountId;
      };

      let accountId = user.stripeAccountId;
      if (!accountId || accountId.startsWith('acct_mock_')) {
        accountId = await createAndStoreAccount();
      }

      try {
        return { url: await this.stripe.createOnboardingLink(accountId), isMock: this.stripe.isMock };
      } catch (error) {
        if (!this.stripe.isMock && this.shouldRecreateStripeAccount(error)) {
          this.logger.warn(
            `Compte Stripe introuvable pour ${user.email} (${accountId}) : recréation en test mode.`,
          );
          const replacementAccountId = await createAndStoreAccount();
          return {
            url: await this.stripe.createOnboardingLink(replacementAccountId),
            isMock: this.stripe.isMock,
          };
        }
        throw error;
      }
    } catch (error) {
      // Un refus de Stripe porte presque toujours la marche à suivre — activer
      // Connect, changer de version d'API. Le remplacer par « un souci
      // inattendu » oblige à aller lire les journaux du serveur pour découvrir
      // une réponse que Stripe avait déjà donnée.
      const detail = (error as Error).message;
      this.logger.error(`Onboarding Stripe impossible pour ${user.email} : ${detail}`);
      throw new ConflictException(`Stripe a refusé la configuration : ${detail}`);
    }
  }

  /** Interroge Stripe et met à jour le statut du compte connecté. */
  async refreshStripeStatus(userId: string): Promise<MeDto> {
    const user = await this.requireUser(userId);

    if (this.stripe.bypassConnect) {
      const accountId =
        user.stripeAccountId ??
        (await this.stripe.createConnectedAccount({
          email: user.email,
          userId: user.id,
        }));
      const updated = await this.prisma.user.update({
        where: { id: user.id },
        data: { stripeAccountId: accountId, stripeConnectStatus: 'COMPLETE' },
      });

      if (user.stripeConnectStatus !== 'COMPLETE') {
        await this.notifications.notify(user.id, {
          kind: 'STRIPE_READY',
          title: 'Coordonnees bancaires operationnelles en test',
          message: 'Stripe Connect est ignore en local : vous pouvez publier et vendre sans formulaire bancaire.',
          link: '/compte',
        });
      }

      return this.auth.toMeDto(updated);
    }

    if (!user.stripeAccountId) {
      return this.auth.toMeDto(user);
    }

    const ready = await this.stripe.isAccountReady(user.stripeAccountId);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { stripeConnectStatus: ready ? 'COMPLETE' : 'PENDING' },
    });

    // On ne prévient qu'au passage à COMPLETE : la re-vérification droite
    // gauche ne doit pas répéter le message à chaque fois.
    if (ready && user.stripeConnectStatus !== 'COMPLETE') {
      await this.notifications.notify(user.id, {
        kind: 'STRIPE_READY',
        title: 'Coordonnées bancaires opérationnelles',
        message: 'Vous pouvez maintenant publier des annonces : chacune de vos ventes pourra être reversée.',
        link: '/configuration-compte',
      });
    }

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
        message: 'Renseignez votre adresse postale pour continuer.',
        step: 'address',
      });
    }

    if (user.status === 'MEMBER') {
      return this.auth.toMeDto(user);
    }

    if (user.status !== 'ONBOARDING' && user.status !== 'PAYMENT_DONE') {
      throw new BadRequestException('Votre compte n’est plus à l’étape de configuration.');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { status: 'MEMBER' },
    });

    return this.auth.toMeDto(updated);
  }
}
