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
        const session = event.data.object;
        const kind = session.metadata?.kind;

        if (kind === 'access_fee' && session.metadata?.userId) {
          await this.account.confirmAccessFeePaid(session.metadata.userId);
        } else if (kind === 'order' && session.metadata?.orderId) {
          // `payment_intent` n'est renseigné qu'ici, sur la session complétée.
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
        if (ref !== user.id) throw new ForbiddenException('Ce paiement ne t’est pas destiné.');
        await this.account.confirmAccessFeePaid(user.id);
        return { message: 'Paiement accepté.', redirect: '/bienvenue' };
      }

      case 'commande': {
        const order = await this.prisma.order.findUnique({
          where: { id: ref },
          select: { buyerId: true },
        });
        if (!order || order.buyerId !== user.id) {
          throw new ForbiddenException('Ce paiement ne t’est pas destiné.');
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
          throw new ForbiddenException('Ce paiement ne t’est pas destiné.');
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
        return { message: 'Coordonnées bancaires enregistrées.', redirect: '/configuration-compte' };
      }

      default:
        throw new BadRequestException('Ce type de paiement est inconnu.');
    }
  }
}
