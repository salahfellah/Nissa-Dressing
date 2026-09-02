import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RETURN_REASON_LABELS, type ReturnRequestDto, type ReturnRequestInput } from '@nissa/shared';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { PdfService } from '../pdf/pdf.service';
import { StripeService } from '../stripe/stripe.service';
import { SettingsService } from '../settings/settings.service';
import { UploadsService } from '../uploads/uploads.service';

/**
 * Retours et remboursements — CDC §3.7.
 *
 * L'acheteuse ouvre une demande avec photos ; l'administratrice l'examine. En cas
 * d'acceptation, un bordereau de retour est généré et le message d'excuse type est
 * envoyé ; le remboursement Stripe intervient une fois le retour confirmé.
 */
@Injectable()
export class ReturnsService {
  private readonly logger = new Logger(ReturnsService.name);
  private readonly adminEmail: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly pdf: PdfService,
    private readonly stripe: StripeService,
    private readonly uploads: UploadsService,
    private readonly settings: SettingsService,
    config: ConfigService,
  ) {
    this.adminEmail = config.getOrThrow<{ email: string }>('admin').email;
  }

  private toDto(request: {
    id: string;
    orderId: string;
    requestedById: string;
    reason: string;
    description: string;
    photos: string[];
    status: string;
    adminNote: string | null;
    createdAt: Date;
    order: { reference: string };
    requestedBy: { pseudo: string };
  }): ReturnRequestDto {
    return {
      id: request.id,
      orderId: request.orderId,
      orderReference: request.order.reference,
      requestedById: request.requestedById,
      requestedByPseudo: request.requestedBy.pseudo,
      reason: RETURN_REASON_LABELS[request.reason as keyof typeof RETURN_REASON_LABELS] ?? request.reason,
      description: request.description,
      photos: this.uploads.publicPhotoUrls(request.photos),
      status: request.status as ReturnRequestDto['status'],
      adminNote: request.adminNote,
      createdAt: request.createdAt.toISOString(),
    };
  }

  private readonly include = {
    order: { select: { reference: true } },
    requestedBy: { select: { pseudo: true } },
  };

  async create(orderId: string, buyerId: string, input: ReturnRequestInput): Promise<ReturnRequestDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { returnRequest: { select: { id: true } }, buyer: true },
    });

    if (!order) throw new NotFoundException('Nous ne retrouvons pas cette commande.');
    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('Seule l’acheteuse peut ouvrir une demande de retour.');
    }
    if (order.returnRequest) {
      throw new ConflictException('Une demande de retour est déjà ouverte pour cette commande.');
    }
    if (!['PAID', 'SHIPPED', 'RECEIVED'].includes(order.status)) {
      throw new ConflictException('Cette commande ne permet pas d’ouvrir une demande de retour.');
    }

    // La fenêtre de réclamation se ferme avec la réception acquise. Sans cette
    // limite, la vendeuse resterait exposée à un retour des mois après la
    // livraison, alors même que son paiement a été reversé.
    const { autoConfirmDays } = await this.settings.get();
    const echeance = order.shippedAt
      ? order.shippedAt.getTime() + autoConfirmDays * 86_400_000
      : null;

    if (order.autoConfirmedAt || (echeance !== null && Date.now() > echeance)) {
      throw new ConflictException(
        `Le délai de ${autoConfirmDays} jours pour signaler un souci est écoulé : cette commande est considérée comme reçue et conforme. Écris-nous depuis le centre d’aide si la situation le justifie.`,
      );
    }

    const request = await this.prisma.returnRequest.create({
      data: {
        orderId,
        requestedById: buyerId,
        reason: input.reason as never,
        description: input.description.trim(),
        photos: input.photos,
        status: 'PENDING_REVIEW',
      },
      include: this.include,
    });

    await this.mail.send('returnRequested', order.buyer.email, {
      prenom: order.buyer.prenom,
      reference: order.reference,
    });
    await this.mail.send('newReturnToAdmin', this.adminEmail, {
      pseudo: order.buyer.pseudo,
      reference: order.reference,
      adminUrl: this.mail.url('/admin/litiges'),
    });

    return this.toDto(request);
  }

  async findMine(userId: string): Promise<ReturnRequestDto[]> {
    const rows = await this.prisma.returnRequest.findMany({
      where: { OR: [{ requestedById: userId }, { order: { sellerId: userId } }] },
      orderBy: { createdAt: 'desc' },
      include: this.include,
    });
    return rows.map((row) => this.toDto(row));
  }

  async findOne(id: string, viewer: { id: string; role: string }): Promise<ReturnRequestDto> {
    const request = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: { ...this.include, order: { select: { reference: true, buyerId: true, sellerId: true } } },
    });

    if (!request) throw new NotFoundException('Nous ne retrouvons pas cette demande de retour.');

    const order = request.order as unknown as { reference: string; buyerId: string; sellerId: string };
    if (order.buyerId !== viewer.id && order.sellerId !== viewer.id && viewer.role !== 'ADMIN') {
      throw new ForbiddenException('Cette demande ne t’est pas destinée.');
    }

    return this.toDto(request as never);
  }

  // ————— Décision de l'administratrice —————

  async review(id: string, accepted: boolean, note?: string): Promise<ReturnRequestDto> {
    const request = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: { order: { include: { buyer: true } } },
    });

    if (!request) throw new NotFoundException('Nous ne retrouvons pas cette demande de retour.');
    if (request.status !== 'PENDING_REVIEW') {
      throw new ConflictException('Cette demande a déjà été traitée.');
    }

    const updated = await this.prisma.returnRequest.update({
      where: { id },
      data: {
        status: accepted ? 'ACCEPTED' : 'REJECTED',
        adminNote: note?.trim() || null,
        reviewedAt: new Date(),
      },
      include: this.include,
    });

    const buyer = request.order.buyer;
    if (accepted) {
      await this.mail.send('returnAccepted', buyer.email, {
        prenom: buyer.prenom,
        reference: request.order.reference,
        returnSlipUrl: this.mail.url(`/retours/${id}/bordereau`),
      });
    } else {
      await this.mail.send('returnRejected', buyer.email, {
        prenom: buyer.prenom,
        reference: request.order.reference,
        note: note ?? null,
      });
    }

    return this.toDto(updated);
  }

  /** Retour reçu et vérifié : déclenche le remboursement Stripe (CDC §3.7). */
  async refund(id: string): Promise<ReturnRequestDto> {
    const request = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: { order: { include: { buyer: true } } },
    });

    if (!request) throw new NotFoundException('Nous ne retrouvons pas cette demande de retour.');
    if (request.status === 'REFUNDED') {
      throw new ConflictException('Cette commande a déjà été remboursée.');
    }
    if (request.status !== 'ACCEPTED' && request.status !== 'RETURN_SHIPPED') {
      throw new ConflictException('Le retour doit d’abord être accepté.');
    }

    const order = request.order;
    let refundId: string | null = null;

    if (order.stripePaymentIntentId) {
      try {
        refundId = await this.stripe.refund({
          paymentIntentId: order.stripePaymentIntentId,
          amountCents: order.totalCents,
        });
      } catch (error) {
        this.logger.error(
          `Remboursement Stripe impossible pour ${order.reference} : ${(error as Error).message}`,
        );
        throw new ConflictException(
          'Le remboursement Stripe n’a pas abouti. Vérifie le paiement dans le tableau de bord Stripe.',
        );
      }
    }

    const now = new Date();
    const [updated] = await this.prisma.$transaction([
      this.prisma.returnRequest.update({
        where: { id },
        data: { status: 'REFUNDED', refundedAt: now },
        include: this.include,
      }),
      this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'REFUNDED',
          refundedAt: now,
          ...(refundId ? { stripeRefundId: refundId } : {}),
        },
      }),
    ]);

    await this.mail.send('refundIssued', order.buyer.email, {
      prenom: order.buyer.prenom,
      reference: order.reference,
      amountCents: order.totalCents,
    });

    return this.toDto(updated);
  }

  /** Bordereau de retour PDF — expéditrice et destinataire inversées (CDC §3.7). */
  async returnSlip(
    id: string,
    viewer: { id: string; role: string },
  ): Promise<{ buffer: Buffer; filename: string }> {
    const request = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: { order: { include: { listing: { select: { title: true, packageFormat: true } } } } },
    });

    if (!request) throw new NotFoundException('Nous ne retrouvons pas cette demande de retour.');
    if (request.requestedById !== viewer.id && viewer.role !== 'ADMIN') {
      throw new ForbiddenException('Ce bordereau ne t’est pas destiné.');
    }
    if (request.status === 'PENDING_REVIEW' || request.status === 'REJECTED') {
      throw new ConflictException(
        'Ton bordereau de retour sera prêt dès que ta demande aura été acceptée.',
      );
    }

    const order = request.order;
    const buffer = await this.pdf.generateWaybill({
      reference: order.reference,
      createdAt: new Date(),
      itemTitle: order.listing.title,
      packageFormat: order.listing.packageFormat,
      isReturn: true,
      // Retour : l'acheteuse renvoie le colis à la vendeuse.
      from: {
        recipientName: order.shipRecipientName,
        line1: order.shipLine1,
        line2: order.shipLine2,
        postalCode: order.shipPostalCode,
        city: order.shipCity,
        country: order.shipCountry,
        phone: order.shipPhone,
      },
      to: {
        recipientName: order.fromRecipientName,
        line1: order.fromLine1,
        line2: order.fromLine2,
        postalCode: order.fromPostalCode,
        city: order.fromCity,
        country: order.fromCountry,
        phone: order.fromPhone,
      },
    });

    await this.prisma.returnRequest.update({
      where: { id },
      data: { returnWaybillGeneratedAt: new Date() },
    });

    return { buffer, filename: `bordereau-retour-${order.reference}.pdf` };
  }
}
