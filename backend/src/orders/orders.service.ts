import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { computePrice, type CreateOrderInput, type OrderDto } from '@nissa/shared';
import type { Order, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { StripeService } from '../stripe/stripe.service';
import { MailService } from '../mail/mail.service';
import { UploadsService } from '../uploads/uploads.service';
import { PdfService } from '../pdf/pdf.service';
import { NotificationsService } from '../notifications/notifications.service';
import { orderReference } from '../common/utils/reference';
import { iso } from '../common/utils/dates';

import {
  DELIVERY_AUTO_CONFIRM_CRON,
  PENDING_ORDER_CLEANUP_CRON,
  PENDING_PAYMENT_TTL_MINUTES,
} from '../config/runtime';

type OrderWithRelations = Order & {
  listing: { id: string; title: string; photos: string[]; priceCents: number; packageFormat: string; size: string };
  buyer: { id: string; pseudo: string; email: string; prenom: string };
  seller: { id: string; pseudo: string; email: string; prenom: string };
  returnRequest?: { id: string } | null;
  _count?: { messages: number };
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly stripe: StripeService,
    private readonly mail: MailService,
    private readonly uploads: UploadsService,
    private readonly pdf: PdfService,
    private readonly notifications: NotificationsService,
  ) {}

  private readonly include = {
    listing: {
      select: { id: true, title: true, photos: true, priceCents: true, packageFormat: true, size: true },
    },
    buyer: { select: { id: true, pseudo: true, email: true, prenom: true } },
    seller: { select: { id: true, pseudo: true, email: true, prenom: true } },
    returnRequest: { select: { id: true } },
  } satisfies Prisma.OrderInclude;

  /**
   * Date limite de confirmation : l'expédition plus le délai de plateforme.
   * Nulle tant que le colis n'est pas parti — le compte à rebours ne peut pas
   * démarrer avant l'envoi.
   */
  private confirmationDeadline(shippedAt: Date | null, autoConfirmDays: number): Date | null {
    return shippedAt ? new Date(shippedAt.getTime() + autoConfirmDays * 86_400_000) : null;
  }

  private async toDto(order: OrderWithRelations, viewerId: string): Promise<OrderDto> {
    const settings = await this.settings.get();
    const unreadMessages = await this.prisma.message.count({
      where: { orderId: order.id, senderId: { not: viewerId }, readAt: null },
    });

    return {
      id: order.id,
      reference: order.reference,
      listingId: order.listingId,
      listing: {
        id: order.listing.id,
        title: order.listing.title,
        photos: this.uploads.publicPhotoUrls(order.listing.photos),
        priceCents: order.listing.priceCents,
        packageFormat: order.listing.packageFormat as never,
        size: order.listing.size,
      },
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      buyerPseudo: order.buyer.pseudo,
      sellerPseudo: order.seller.pseudo,
      viewerRole: order.buyerId === viewerId ? 'BUYER' : 'SELLER',
      status: order.status,
      price: {
        itemPriceCents: order.itemPriceCents,
        shippingCents: order.shippingCents,
        commissionCents: order.commissionCents,
        totalCents: order.totalCents,
        sellerPayoutCents: order.sellerPayoutCents,
        commissionPayer: settings.commissionPayer,
      },
      shippingAddress: {
        recipientName: order.shipRecipientName,
        line1: order.shipLine1,
        line2: order.shipLine2,
        postalCode: order.shipPostalCode,
        city: order.shipCity,
        country: order.shipCountry,
        phone: order.shipPhone,
      },
      paidAt: iso(order.paidAt),
      shippedAt: iso(order.shippedAt),
      receivedAt: iso(order.receivedAt),
      refundedAt: iso(order.refundedAt),
      confirmationDeadline: iso(
        this.confirmationDeadline(order.shippedAt, settings.autoConfirmDays),
      ),
      autoConfirmed: Boolean(order.autoConfirmedAt),
      hasReturnRequest: Boolean(order.returnRequest),
      unreadMessages,
      createdAt: order.createdAt.toISOString(),
    };
  }

  // ————— Création de commande (CDC §3.6) —————

  /**
   * Crée la commande et renvoie l'URL de paiement.
   *
   * L'unicité de `listingId` sur Order sert de réservation : deux acheteuses ne
   * peuvent pas engager la même pièce. Une commande restée impayée est libérée
   * automatiquement au bout de 30 minutes (voir releaseStalePendingOrders).
   */
  async create(
    buyerId: string,
    input: CreateOrderInput,
  ): Promise<{ order: OrderDto; paymentUrl: string; isMock: boolean }> {
    const [listing, buyer, settings] = await Promise.all([
      this.prisma.listing.findUnique({
        where: { id: input.listingId },
        include: { seller: true },
      }),
      this.prisma.user.findUnique({ where: { id: buyerId } }),
      this.settings.get(),
    ]);

    if (!listing) throw new NotFoundException('Cette annonce n’existe plus.');
    if (!buyer) throw new NotFoundException('Nous ne retrouvons pas ce compte.');
    if (listing.status !== 'PUBLISHED') {
      throw new ConflictException('Cet article vient de trouver preneuse.');
    }
    if (listing.sellerId === buyerId) {
      throw new BadRequestException('Vous ne pouvez pas acheter votre propre article.');
    }
    if (!this.stripe.bypassConnect) {
      if (listing.seller.stripeConnectStatus !== 'COMPLETE' || !listing.seller.stripeAccountId) {
      throw new ConflictException(
        'La vendeuse n’a pas encore finalisé son compte de paiement. Cet article n’est pas commandable pour le moment.',
      );
    }
      const sellerStripeReady = await this.stripe
      .isAccountReady(listing.seller.stripeAccountId)
      .catch((error) => {
        this.logger.warn(
          `Compte Stripe vendeuse illisible avant commande (${listing.sellerId}) : ${(error as Error).message}`,
        );
        return false;
      });
      if (!sellerStripeReady) {
      await this.prisma.user.update({
        where: { id: listing.sellerId },
        data: { stripeConnectStatus: 'PENDING' },
      });
      throw new ConflictException(
        'La vendeuse doit terminer sa configuration Stripe avant que cet article puisse être acheté.',
      );
      }
    }
    if (!listing.seller.addressLine1 || !listing.seller.postalCode || !listing.seller.city) {
      throw new ConflictException(
        'La vendeuse n’a pas finalisé son compte. Cet article n’est pas commandable pour le moment.',
      );
    }

    const price = computePrice(listing.priceCents, listing.packageFormat, settings);

    let created: OrderWithRelations;
    try {
      created = (await this.prisma.order.create({
        data: {
          reference: orderReference(),
          listingId: listing.id,
          buyerId,
          sellerId: listing.sellerId,
          itemPriceCents: price.itemPriceCents,
          shippingCents: price.shippingCents,
          commissionCents: price.commissionCents,
          totalCents: price.totalCents,
          sellerPayoutCents: price.sellerPayoutCents,
          status: 'PENDING_PAYMENT',
          // Adresse de livraison figée : elle alimente le bordereau (CDC §3.6).
          shipRecipientName: input.shippingAddress.recipientName,
          shipLine1: input.shippingAddress.line1,
          shipLine2: input.shippingAddress.line2 || null,
          shipPostalCode: input.shippingAddress.postalCode,
          shipCity: input.shippingAddress.city,
          shipCountry: input.shippingAddress.country,
          shipPhone: input.shippingAddress.phone || null,
          // Adresse de l'expéditrice, figée elle aussi.
          fromRecipientName:
            listing.seller.recipientName ?? `${listing.seller.prenom} ${listing.seller.nom}`,
          fromLine1: listing.seller.addressLine1,
          fromLine2: listing.seller.addressLine2,
          fromPostalCode: listing.seller.postalCode,
          fromCity: listing.seller.city,
          fromCountry: listing.seller.country ?? 'France',
          fromPhone: listing.seller.phone,
        },
        include: this.include,
      })) as OrderWithRelations;
    } catch (error) {
      if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
        throw new ConflictException(
          'Une autre sœur est en train de finaliser cet achat. Réessayez dans quelques minutes.',
        );
      }
      throw error;
    }

    const checkout = await this.stripe.createOrderCheckout({
      orderId: created.id,
      reference: created.reference,
      email: buyer.email,
      title: listing.title,
      totalCents: price.totalCents,
    });

    await this.prisma.order.update({
      where: { id: created.id },
      data: { stripeCheckoutSessionId: checkout.sessionId },
    });

    return {
      order: await this.toDto(created, buyerId),
      paymentUrl: checkout.url,
      isMock: this.stripe.isMock,
    };
  }

  /**
   * Encaissement confirmé : les fonds sont sous séquestre sur le compte plateforme.
   * L'annonce est retirée du catalogue (CDC §3.6). Idempotent.
   */
  async confirmPaid(orderId: string, paymentIntentId?: string): Promise<void> {
    const order = (await this.prisma.order.findUnique({
      where: { id: orderId },
      include: this.include,
    })) as OrderWithRelations | null;

    if (!order) throw new NotFoundException('Nous ne retrouvons pas cette commande.');
    if (order.status !== 'PENDING_PAYMENT') return;

    // On résout dès maintenant PaymentIntent et charge : la charge est
    // indispensable pour libérer le séquestre plus tard, et la retrouver après
    // coup obligerait à repartir de la session Checkout.
    const settled = await this.stripe.settlePayment(paymentIntentId ?? null);

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          ...(settled.paymentIntentId ? { stripePaymentIntentId: settled.paymentIntentId } : {}),
          ...(settled.chargeId ? { stripeChargeId: settled.chargeId } : {}),
        },
      }),
      this.prisma.listing.update({
        where: { id: order.listingId },
        data: { status: 'SOLD', soldAt: new Date() },
      }),
    ]);

    await this.mail.send('orderPaidBuyer', order.buyer.email, {
      prenom: order.buyer.prenom,
      reference: order.reference,
      title: order.listing.title,
      totalCents: order.totalCents,
      orderUrl: this.mail.url(`/commande/${order.id}`),
    });
    await this.mail.send('orderPaidSeller', order.seller.email, {
      prenom: order.seller.prenom,
      reference: order.reference,
      title: order.listing.title,
      payoutCents: order.sellerPayoutCents,
      orderUrl: this.mail.url(`/commande/${order.id}`),
    });

    // Les deux sœurs sont prévenues dans le site : l'une sait que son argent est
    // sous séquestre, l'autre qu'il reste à expédier le colis.
    await this.notifications.notify(order.buyerId, {
      kind: 'ORDER_PAID',
      title: `Commande ${order.reference} réglée`,
      message: `« ${order.listing.title} » est réservé pour vous. Votre sœur vendeuse a été prévenue.`,
      link: `/commande/${order.id}`,
    });
    await this.notifications.notify(order.sellerId, {
      kind: 'ORDER_SOLD',
      title: 'Votre article a trouvé une acheteuse',
      message: `« ${order.listing.title} » vient d’être réglé : expédiez la commande ${order.reference}.`,
      link: `/commande/${order.id}`,
    });
  }

  // ————— Suivi (CDC §3.6) —————

  async markShipped(orderId: string, sellerId: string): Promise<OrderDto> {
    const order = (await this.prisma.order.findUnique({
      where: { id: orderId },
      include: this.include,
    })) as OrderWithRelations | null;

    if (!order) throw new NotFoundException('Nous ne retrouvons pas cette commande.');
    if (order.sellerId !== sellerId) throw new ForbiddenException('Cette commande n’est pas la vôtre.');
    if (order.status !== 'PAID') {
      throw new ConflictException('Cette commande ne peut pas encore être marquée comme expédiée.');
    }

    const updated = (await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'SHIPPED', shippedAt: new Date() },
      include: this.include,
    })) as OrderWithRelations;

    await this.mail.send('orderShipped', order.buyer.email, {
      prenom: order.buyer.prenom,
      reference: order.reference,
      title: order.listing.title,
      orderUrl: this.mail.url(`/commande/${order.id}`),
    });

    await this.notifications.notify(order.buyerId, {
      kind: 'ORDER_SHIPPED',
      title: `Commande ${order.reference} expédiée`,
      message: `« ${order.listing.title} » est en route. Dès réception, pensez à confirmer : votre sœur récupérera alors son argent.`,
      link: `/commande/${order.id}`,
    });

    return this.toDto(updated, sellerId);
  }

  /**
   * Confirmation de réception par l'acheteuse — c'est l'événement qui libère le
   * séquestre et transfère les fonds à la vendeuse (CDC §3.6, mécanique type Vinted).
   */
  async confirmReception(orderId: string, buyerId: string): Promise<OrderDto> {
    const order = (await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { ...this.include, seller: true },
    })) as (OrderWithRelations & { seller: { stripeAccountId: string | null } }) | null;

    if (!order) throw new NotFoundException('Nous ne retrouvons pas cette commande.');
    if (order.buyerId !== buyerId) throw new ForbiddenException('Cette commande n’est pas la vôtre.');
    if (order.status !== 'SHIPPED' && order.status !== 'PAID') {
      throw new ConflictException('Cette commande ne peut plus être confirmée.');
    }

    // La confirmation de réception ne libère plus les fonds d'elle-même.
    // L'argent reste sur le compte de la plateforme jusqu'à ce que
    // l'administratrice valide le reversement depuis le back-office : c'est
    // elle qui arbitre, notamment si un litige est ouvert entre-temps.
    const updated = (await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'RECEIVED',
        receivedAt: new Date(),
      },
      include: this.include,
    })) as OrderWithRelations;

    await this.mail.send('orderReceivedSeller', updated.seller.email, {
      prenom: updated.seller.prenom,
      reference: updated.reference,
      payoutCents: updated.sellerPayoutCents,
    });

    await this.notifications.notify(updated.sellerId, {
      kind: 'ORDER_RECEIVED',
      title: `Commande ${updated.reference} reçue`,
      message: `Votre sœur a bien reçu « ${updated.listing.title} ». Le reversement suivra dès validation, baraka Allahu fiki.`,
      link: `/commande/${updated.id}`,
    });

    return this.toDto(updated, buyerId);
  }

  /**
   * Reversement à la vendeuse, déclenché par l'administratrice (back-office).
   *
   * Les fonds sont restés sur le compte de la plateforme depuis l'encaissement.
   * Ce transfert est le seul moment où ils en sortent, et la commission n'est
   * jamais transférée : elle reste acquise en ne bougeant pas.
   */
  async releasePayout(orderId: string): Promise<OrderDto> {
    const order = (await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { ...this.include, seller: true, returnRequest: { select: { status: true } } },
    })) as
      | (OrderWithRelations & {
          seller: { stripeAccountId: string | null };
          returnRequest: { status: string } | null;
        })
      | null;

    if (!order) throw new NotFoundException('Nous ne retrouvons pas cette commande.');

    if (order.status !== 'RECEIVED') {
      throw new ConflictException(
        'Le reversement n’est possible qu’une fois la réception confirmée par l’acheteuse.',
      );
    }

    // Idempotence : un double clic ne doit pas payer deux fois.
    if (order.stripeTransferId) {
      throw new ConflictException('Cette commande a déjà été reversée.');
    }

    // Un litige ouvert gèle l'argent : on ne paie pas la vendeuse tant que le
    // retour n'a pas été tranché en sa faveur.
    if (order.returnRequest && order.returnRequest.status !== 'REJECTED') {
      throw new ConflictException(
        'Un retour est en cours sur cette commande : tranche-le avant de reverser.',
      );
    }

    if (!this.stripe.bypassConnect && !order.seller.stripeAccountId) {
      throw new ConflictException(
        'La vendeuse n’a pas terminé son inscription Stripe : le reversement est impossible.',
      );
    }

    // Un refus de Stripe doit être lisible par l'administratrice : c'est elle
    // qui décide quoi faire ensuite (relancer la vendeuse pour qu'elle termine
    // son inscription, réessayer plus tard). Une erreur générique la laisserait
    // sans piste. La commande reste en attente : rien n'est marqué comme reversé.
    let transferId: string;
    try {
      transferId = await this.stripe.releaseEscrow({
        destinationAccountId: order.seller.stripeAccountId ?? 'acct_mock_bypass',
        amountCents: order.sellerPayoutCents,
        orderId: order.id,
        reference: order.reference,
        chargeId: order.stripeChargeId,
      });
    } catch (error) {
      const detail = (error as Error).message;
      this.logger.error(`Reversement refusé pour ${order.reference} : ${detail}`);
      throw new ConflictException(
        `Stripe a refusé le reversement : ${detail}. La commande reste en attente, vous pouvez réessayer.`,
      );
    }

    const updated = (await this.prisma.order.update({
      where: { id: orderId },
      data: { stripeTransferId: transferId },
      include: this.include,
    })) as OrderWithRelations;

    this.logger.log(`Reversement ${transferId} pour la commande ${updated.reference}.`);

    await this.mail.send('payoutReleased', updated.seller.email, {
      prenom: updated.seller.prenom,
      reference: updated.reference,
      payoutCents: updated.sellerPayoutCents,
    });

    await this.notifications.notify(updated.sellerId, {
      kind: 'PAYOUT_RELEASED',
      title: `Reversement de la commande ${updated.reference} effectué`,
      message: 'Le montant de votre vente a été versé sur votre compte bancaire. Qu’Allah vous bénisse !',
      link: `/commande/${updated.id}`,
    });

    return this.toDto(updated, updated.sellerId);
  }

  // ————— Consultation —————

  async findMine(userId: string, role: 'buyer' | 'seller' | 'all' = 'all'): Promise<OrderDto[]> {
    const where: Prisma.OrderWhereInput =
      role === 'buyer'
        ? { buyerId: userId }
        : role === 'seller'
          ? { sellerId: userId }
          : { OR: [{ buyerId: userId }, { sellerId: userId }] };

    const orders = (await this.prisma.order.findMany({
      where: { ...where, status: { not: 'PENDING_PAYMENT' } },
      orderBy: { createdAt: 'desc' },
      include: this.include,
    })) as OrderWithRelations[];

    return Promise.all(orders.map((order) => this.toDto(order, userId)));
  }

  async findOne(orderId: string, viewer: { id: string; role: string }): Promise<OrderDto> {
    const order = (await this.prisma.order.findUnique({
      where: { id: orderId },
      include: this.include,
    })) as OrderWithRelations | null;

    if (!order) throw new NotFoundException('Nous ne retrouvons pas cette commande.');
    if (order.buyerId !== viewer.id && order.sellerId !== viewer.id && viewer.role !== 'ADMIN') {
      throw new ForbiddenException('Cette commande n’est pas la vôtre.');
    }

    return this.toDto(order, viewer.id);
  }

  /** Bordereau d'envoi PDF — CDC §3.6. Réservé à la vendeuse (et à l'administratrice). */
  async waybill(orderId: string, viewer: { id: string; role: string }): Promise<{ buffer: Buffer; filename: string }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { listing: { select: { title: true, packageFormat: true } } },
    });

    if (!order) throw new NotFoundException('Nous ne retrouvons pas cette commande.');
    if (order.sellerId !== viewer.id && viewer.role !== 'ADMIN') {
      throw new ForbiddenException('Le bordereau d’envoi est réservé à la vendeuse.');
    }
    if (order.status === 'PENDING_PAYMENT') {
      throw new ConflictException('Votre bordereau sera prêt dès que le paiement sera confirmé.');
    }

    const buffer = await this.pdf.generateWaybill({
      reference: order.reference,
      createdAt: order.paidAt ?? order.createdAt,
      itemTitle: order.listing.title,
      packageFormat: order.listing.packageFormat,
      totalCents: order.totalCents,
      from: {
        recipientName: order.fromRecipientName,
        line1: order.fromLine1,
        line2: order.fromLine2,
        postalCode: order.fromPostalCode,
        city: order.fromCity,
        country: order.fromCountry,
        phone: order.fromPhone,
      },
      to: {
        recipientName: order.shipRecipientName,
        line1: order.shipLine1,
        line2: order.shipLine2,
        postalCode: order.shipPostalCode,
        city: order.shipCity,
        country: order.shipCountry,
        phone: order.shipPhone,
      },
    });

    return { buffer, filename: `bordereau-${order.reference}.pdf` };
  }

  /**
   * Libère les annonces réservées par une commande jamais payée : sans cela, un
   * abandon de panier retirerait définitivement l'article du catalogue.
   */
  /**
   * Acquiert la réception des commandes livrées restées sans réponse.
   *
   * Sans ce garde-fou, une acheteuse qui a bien reçu son colis mais ne clique
   * jamais immobilise l'argent de la vendeuse indéfiniment : l'administratrice
   * n'a alors aucun moment légitime pour reverser. Passé le délai, la réception
   * est acquise et la fenêtre de réclamation se ferme.
   *
   * Les commandes déjà en litige sont écartées : un retour ouvert se tranche à
   * la main, il ne doit pas expirer sous l'effet d'une horloge.
   */
  @Cron(DELIVERY_AUTO_CONFIRM_CRON, { name: 'reception-acquise' })
  async autoConfirmDeliveredOrders(): Promise<void> {
    try {
      const { autoConfirmDays } = await this.settings.get();
      const cutoff = new Date(Date.now() - autoConfirmDays * 86_400_000);

      const orders = (await this.prisma.order.findMany({
        where: { status: 'SHIPPED', shippedAt: { lt: cutoff }, returnRequest: { is: null } },
        include: this.include,
      })) as OrderWithRelations[];

      for (const order of orders) {
        const now = new Date();
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: 'RECEIVED', receivedAt: now, autoConfirmedAt: now },
        });

        await this.mail.send('receptionAutoConfirmed', order.buyer.email, {
          prenom: order.buyer.prenom,
          reference: order.reference,
          jours: autoConfirmDays,
        });
        await this.mail.send('orderReceivedSeller', order.seller.email, {
          prenom: order.seller.prenom,
          reference: order.reference,
          payoutCents: order.sellerPayoutCents,
        });

        await this.notifications.notify(order.buyerId, {
          kind: 'AUTO_CONFIRMED',
          title: `Commande ${order.reference} : réception acquise`,
          message: `Le délai de ${autoConfirmDays} jours est écoulé, la commande est considérée comme reçue. Si un souci existe, écrivez-nous depuis le centre d’aide.`,
          link: `/commande/${order.id}`,
        });
        await this.notifications.notify(order.sellerId, {
          kind: 'ORDER_RECEIVED',
          title: `Commande ${order.reference} reçue`,
          message: `« ${order.listing.title} » est considéré comme livré. Le reversement suivra une fois validé, in cha Allah.`,
          link: `/commande/${order.id}`,
        });

        this.logger.log(
          `Réception acquise pour ${order.reference} : sans réponse ${autoConfirmDays} jours après l'expédition.`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Vérification des réceptions non confirmées impossible : ${(error as Error).message}`,
      );
    }
  }

  @Cron(PENDING_ORDER_CLEANUP_CRON, { name: 'liberation-commandes-impayees' })
  async releaseStalePendingOrders(): Promise<void> {
    const cutoff = new Date(Date.now() - PENDING_PAYMENT_TTL_MINUTES * 60_000);

    try {
      const { count } = await this.prisma.order.deleteMany({
        where: { status: 'PENDING_PAYMENT', createdAt: { lt: cutoff } },
      });
      if (count > 0) {
        this.logger.log(`${count} commande(s) impayée(s) annulée(s), articles remis en vente.`);
      } else {
        this.logger.debug(`Aucune commande impayée à libérer (seuil ${cutoff.toISOString()}).`);
      }
    } catch (error) {
      this.logger.error(`Nettoyage des commandes impayées impossible : ${(error as Error).message}`);
    }
  }
}
