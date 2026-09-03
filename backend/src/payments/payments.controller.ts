import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AccountService } from '../account/account.service';
import { ListingsService } from '../listings/listings.service';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { NotificationsService } from '../notifications/notifications.service';

type SimulatedIntent = 'acces' | 'commande' | 'boost' | 'connect';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly stripe: StripeService,
    private readonly account: AccountService,
    private readonly orders: OrdersService,
    private readonly listings: ListingsService,
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Webhook Stripe : source de vérité des paiements en production.
   *
   * La signature est vérifiée sur le corps brut — d'où le `rawBody` activé dans
   * main.ts. Un paiement n'est jamais validé sur la seule foi d'une redirection
   * navigateur, qui est falsifiable.
   */
  @Public()
  @HttpCode(200)
  @Post('webhook')
  async webhook(@Req() req: Request, @Headers('stripe-signature') signature: string) {
    if (this.stripe.isMock) {
      throw new BadRequestException('Stripe est en mode simulé : aucun webhook attendu.');
    }

    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody || !signature) {
      throw new BadRequestException('Requête webhook invalide.');
    }

    let event;
    try {
      event = this.stripe.constructEvent(rawBody, signature);
    } catch (error) {
      this.logger.error(`Signature webhook invalide : ${(error as Error).message}`);
      throw new BadRequestException('Signature invalide.');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        await this.appliquerLaSessionReglee(event.data.object);
        break;
      }

      case 'invoice.paid': {
        // Renouvellement mensuel d'un boost : prolonge la mise en avant.
        const invoice = event.data.object as { subscription?: string | null };
        if (invoice.subscription) {
          const listing = await this.prisma.listing.findFirst({
            where: { stripeBoostSubscriptionId: invoice.subscription },
            select: { id: true },
          });
          if (listing) await this.listings.confirmBoostPaid(listing.id, invoice.subscription);
        }
        break;
      }

      case 'account.updated': {
        const account = event.data.object;
        const ready = Boolean(
          account.charges_enabled && account.payouts_enabled && account.details_submitted,
        );
        const users = await this.prisma.user.findMany({
          where: { stripeAccountId: account.id },
          select: { id: true, stripeConnectStatus: true },
        });
        for (const user of users) {
          const wasComplete = user.stripeConnectStatus === 'COMPLETE';
          if (ready && !wasComplete) {
            await this.notifications.notify(user.id, {
              kind: 'STRIPE_READY',
              title: 'Coordonnées bancaires opérationnelles',
              message: 'Vous pouvez maintenant publier des annonces : chacune de vos ventes pourra être reversée.',
              link: '/configuration-compte',
            });
          }
        }
        await this.prisma.user.updateMany({
          where: { stripeAccountId: account.id },
          data: { stripeConnectStatus: ready ? 'COMPLETE' : 'PENDING' },
        });
        break;
      }

      default:
        this.logger.debug(`Événement Stripe ignoré : ${event.type}`);
    }

    return { received: true };
  }

  /**
   * Applique une session Checkout réglée : c'est le geste commun au webhook et à
   * la relecture faite au retour du navigateur. Chaque branche est idempotente,
   * les deux chemins peuvent donc se croiser sans dommage.
   */
  private async appliquerLaSessionReglee(session: {
    metadata?: Record<string, string> | null;
    payment_intent?: string | { id: string } | null;
    subscription?: string | { id: string } | null;
  }): Promise<void> {
    const kind = session.metadata?.kind;

    if (kind === 'access_fee' && session.metadata?.userId) {
      await this.account.confirmAccessFeePaid(session.metadata.userId);
    } else if (kind === 'order' && session.metadata?.orderId) {
      // `payment_intent` n'est renseigné que sur la session une fois complétée.
      await this.orders.confirmPaid(
        session.metadata.orderId,
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : (session.payment_intent?.id ?? undefined),
      );
    } else if (kind === 'boost' && session.metadata?.listingId) {
      await this.listings.confirmBoostPaid(
        session.metadata.listingId,
        typeof session.subscription === 'string' ? session.subscription : undefined,
      );
    }
  }

  /**
   * Confirme un paiement au retour de Stripe Checkout.
   *
   * Le webhook reste la source de vérité, mais il peut tarder — et en local,
   * Stripe ne peut pas joindre la machine du tout sans `stripe listen`. Sans
   * filet, la sœur revient de Checkout, son statut n'a pas bougé, la garde de
   * route la renvoie vers la page de paiement : elle tourne en rond alors
   * qu'elle a payé.
   *
   * Rien n'est cru sur parole ici : l'URL ne fournit qu'un identifiant de
   * session, que l'API relit chez Stripe pour vérifier qu'elle est bien réglée
   * et qu'elle appartient bien à la personne connectée.
   */
  @HttpCode(200)
  @Post('confirm')
  async confirmFromCheckout(
    @CurrentUser() user: AuthUser,
    @Body() body: { sessionId?: string },
  ): Promise<{ confirmed: boolean }> {
    const sessionId = body?.sessionId?.trim();
    if (!sessionId) {
      throw new BadRequestException('Identifiant de session de paiement manquant.');
    }

    // En mode simulé, la confirmation passe par /payments/simulate/confirm :
    // il n'y a aucune session Checkout à relire chez Stripe.
    if (this.stripe.isMock) return { confirmed: false };

    const session = await this.stripe.retrievePaidSession(sessionId);
    if (!session) return { confirmed: false };

    const metadata = session.metadata ?? {};

    switch (metadata.kind) {
      case 'access_fee':
        if (metadata.userId !== user.id) {
          throw new ForbiddenException('Ce paiement ne vous est pas destiné.');
        }
        break;

      case 'order': {
        const order = metadata.orderId
          ? await this.prisma.order.findUnique({
              where: { id: metadata.orderId },
              select: { buyerId: true },
            })
          : null;
        if (!order || order.buyerId !== user.id) {
          throw new ForbiddenException('Ce paiement ne vous est pas destiné.');
        }
        break;
      }

      case 'boost': {
        const listing = metadata.listingId
          ? await this.prisma.listing.findUnique({
              where: { id: metadata.listingId },
              select: { sellerId: true },
            })
          : null;
        if (!listing || listing.sellerId !== user.id) {
          throw new ForbiddenException('Ce paiement ne vous est pas destiné.');
        }
        break;
      }

      default:
        throw new BadRequestException('Ce type de paiement est inconnu.');
    }

    await this.appliquerLaSessionReglee(session);
    return { confirmed: true };
  }

  /**
   * Confirmation d'un paiement simulé (mode mock uniquement).
   *
   * Remplace le webhook quand aucune clé Stripe n'est configurée, pour que le
   * parcours complet reste jouable en local. Refusé dès qu'une vraie clé est
   * présente : en production, seul le webhook signé fait foi.
   */
  @HttpCode(200)
  @Post('simulate/confirm')
  async confirmSimulated(
    @CurrentUser() user: AuthUser,
    @Body() body: { intent: SimulatedIntent; ref: string },
  ) {
    if (!this.stripe.isMock) {
      throw new ForbiddenException(
        'Les paiements simulés sont désactivés : Stripe est configuré sur ce serveur.',
      );
    }

    const { intent, ref } = body;

    switch (intent) {
      case 'acces': {
        if (ref !== user.id) throw new ForbiddenException('Ce paiement ne vous est pas destiné.');
        await this.account.confirmAccessFeePaid(user.id);
        return { message: 'Paiement accepté.', redirect: '/bienvenue' };
      }

      case 'commande': {
        const order = await this.prisma.order.findUnique({
          where: { id: ref },
          select: { buyerId: true },
        });
        if (!order || order.buyerId !== user.id) {
          throw new ForbiddenException('Ce paiement ne vous est pas destiné.');
        }
        await this.orders.confirmPaid(ref);
        return { message: 'Paiement accepté.', redirect: `/commande/${ref}` };
      }

      case 'boost': {
        const listing = await this.prisma.listing.findUnique({
          where: { id: ref },
          select: { sellerId: true },
        });
        if (!listing || listing.sellerId !== user.id) {
          throw new ForbiddenException('Ce paiement ne vous est pas destiné.');
        }
        await this.listings.confirmBoostPaid(ref);
        return { message: 'Mise en avant activée.', redirect: '/mes-annonces' };
      }

      case 'connect': {
        // L'onboarding simulé marque simplement le compte connecté comme opérationnel.
        await this.prisma.user.update({
          where: { id: user.id },
          data: { stripeConnectStatus: 'COMPLETE' },
        });
        await this.notifications.notify(user.id, {
          kind: 'STRIPE_READY',
          title: 'Coordonnées bancaires opérationnelles',
          message: 'Vous pouvez maintenant publier des annonces : chacune de vos ventes pourra être reversée.',
          link: '/configuration-compte',
        });
        return { message: 'Coordonnées bancaires enregistrées.', redirect: '/configuration-compte' };
      }

      default:
        throw new BadRequestException('Ce type de paiement est inconnu.');
    }
  }
}
