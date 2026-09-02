import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  RETURN_REASON_LABELS,
  type AdminMemberDto,
  type AdminStatsDto,
  type ContactRequestDto,
  type EmailLogDto,
  type ListingDto,
  type PendingApplicationDto,
  type ReturnRequestDto,
} from '@nissa/shared';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { SettingsService } from '../settings/settings.service';
import { UploadsService } from '../uploads/uploads.service';
import { toListingDto } from '../listings/listings.mapper';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly settings: SettingsService,
    private readonly uploads: UploadsService,
  ) {}

  // ————— Tableau de bord —————

  async stats(): Promise<AdminStatsDto> {
    const [
      pendingApplications,
      pendingListings,
      pendingReturns,
      publishedListings,
      members,
      escrow,
      released,
    ] = await Promise.all([
      this.prisma.user.count({ where: { status: 'PENDING_REVIEW' } }),
      this.prisma.listing.count({ where: { status: 'PENDING_REVIEW' } }),
      this.prisma.returnRequest.count({ where: { status: 'PENDING_REVIEW' } }),
      this.prisma.listing.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.user.count({ where: { role: 'MEMBER', status: 'MEMBER' } }),
      // Fonds encaissés mais non encore reversés : le séquestre en cours.
      // Depuis que le reversement est validé à la main, une commande reçue
      // mais non reversée reste de l'argent détenu par la plateforme — l'omettre
      // ferait disparaître du tableau de bord des sommes bien présentes.
      this.prisma.order.aggregate({
        where: {
          OR: [
            { status: { in: ['PAID', 'SHIPPED'] } },
            { status: 'RECEIVED', stripeTransferId: null },
          ],
        },
        _sum: { sellerPayoutCents: true },
        _count: true,
      }),
      // La commission n'est acquise qu'au moment du reversement : c'est en ne
      // transférant que la part de la vendeuse qu'elle reste à la plateforme.
      // Avant ce transfert, la totalité est encore indistincte sur le compte.
      this.prisma.order.aggregate({
        where: { status: 'RECEIVED', stripeTransferId: { not: null } },
        _sum: { commissionCents: true },
      }),
    ]);

    return {
      pendingApplications,
      pendingListings,
      pendingReturns,
      publishedListings,
      members,
      ordersInEscrow: escrow._count,
      escrowCents: escrow._sum.sellerPayoutCents ?? 0,
      revenueCents: released._sum.commissionCents ?? 0,
    };
  }

  // ————— File de validation des inscriptions (CDC §3.9) —————

  async pendingApplications(): Promise<PendingApplicationDto[]> {
    const users = await this.prisma.user.findMany({
      where: { status: 'PENDING_REVIEW' },
      orderBy: { createdAt: 'asc' },
    });

    return users.map((user) => ({
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      pseudo: user.pseudo,
      email: user.email,
      // L'audio n'est jamais servi statiquement : il passe par une route authentifiée.
      audioOathUrl: user.audioOathPath ? `/admin/applications/${user.id}/audio` : null,
      createdAt: user.createdAt.toISOString(),
    }));
  }

  /** Chemin disque de l'audio de serment, pour diffusion par le contrôleur. */
  async applicationAudioPath(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { audioOathPath: true },
    });

    if (!user?.audioOathPath) {
      throw new NotFoundException('Aucun enregistrement audio n’accompagne cette candidature.');
    }

    return this.uploads.absolutePath(user.audioOathPath);
  }

  /**
   * Décision sur une candidature — CDC §3.1.
   *
   * Acceptée : la candidate passe en AWAITING_PAYMENT et reçoit le lien de paiement
   * des frais d'accès. Refusée : l'audio de serment est supprimé sans délai, cette
   * donnée vocale n'ayant plus de finalité (RGPD, CDC §4.3).
   */
  async reviewApplication(userId: string, accepted: boolean, reason?: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Nous ne retrouvons pas cette candidature.');
    if (user.status !== 'PENDING_REVIEW') {
      throw new ConflictException('Cette candidature a déjà été traitée.');
    }

    const settings = await this.settings.get();

    if (accepted) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { status: 'AWAITING_PAYMENT', reviewedAt: new Date(), rejectionReason: null },
      });

      await this.mail.send('applicationAccepted', user.email, {
        prenom: user.prenom,
        accessFeeCents: settings.accessFeeCents,
        freeBoostDays: settings.freeBoostDays,
        paymentUrl: this.mail.url('/paiement'),
      });

      return { message: `Candidature de ${user.pseudo} acceptée. E-mail de paiement envoyé.` };
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        rejectionReason: reason?.trim() || null,
        audioOathPath: null,
      },
    });

    if (user.audioOathPath) {
      await this.uploads.remove(user.audioOathPath);
    }

    await this.mail.send('applicationRejected', user.email, {
      prenom: user.prenom,
      reason: reason?.trim() || null,
    });

    return { message: `Candidature de ${user.pseudo} refusée.` };
  }

  // ————— File de modération des annonces (CDC §3.9) —————

  async pendingListings(): Promise<ListingDto[]> {
    const [rows, settings] = await Promise.all([
      this.prisma.listing.findMany({
        where: { status: 'PENDING_REVIEW' },
        orderBy: { createdAt: 'asc' },
        include: {
          seller: { select: { id: true, pseudo: true, createdAt: true } },
          _count: { select: { favorites: true } },
        },
      }),
      this.settings.get(),
    ]);

    return rows.map((row) => toListingDto(row, { uploads: this.uploads, settings }));
  }

  async reviewListing(
    listingId: string,
    adminId: string,
    accepted: boolean,
    reason?: string,
  ): Promise<{ message: string }> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { seller: true },
    });

    if (!listing) throw new NotFoundException('Nous ne retrouvons pas cette annonce.');
    if (listing.status !== 'PENDING_REVIEW') {
      throw new ConflictException('Cette annonce a déjà été modérée.');
    }

    await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        status: accepted ? 'PUBLISHED' : 'REJECTED',
        rejectionReason: accepted ? null : reason?.trim() || null,
        moderatedAt: new Date(),
        moderatedById: adminId,
        ...(accepted ? { publishedAt: new Date() } : {}),
      },
    });

    if (accepted) {
      await this.mail.send('listingApproved', listing.seller.email, {
        prenom: listing.seller.prenom,
        title: listing.title,
        listingUrl: this.mail.url(`/article/${listing.id}`),
      });
      return { message: `Annonce « ${listing.title} » publiée.` };
    }

    await this.mail.send('listingRejected', listing.seller.email, {
      prenom: listing.seller.prenom,
      title: listing.title,
      reason: reason?.trim() || null,
    });
    return { message: `Annonce « ${listing.title} » refusée.` };
  }

  /** Retrait d'une annonce déjà publiée (contenu signalé a posteriori). */
  async unpublishListing(listingId: string, adminId: string, reason: string): Promise<{ message: string }> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { seller: true },
    });

    if (!listing) throw new NotFoundException('Nous ne retrouvons pas cette annonce.');
    if (listing.status !== 'PUBLISHED') {
      throw new ConflictException('Seule une annonce en ligne peut être retirée.');
    }

    await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason.trim(),
        moderatedAt: new Date(),
        moderatedById: adminId,
      },
    });

    await this.mail.send('listingRejected', listing.seller.email, {
      prenom: listing.seller.prenom,
      title: listing.title,
      reason: reason.trim(),
    });

    return { message: `Annonce « ${listing.title} » retirée du catalogue.` };
  }

  // ————— Membres —————

  async members(query?: string, status?: string): Promise<AdminMemberDto[]> {
    const users = await this.prisma.user.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(query
          ? {
              OR: [
                { pseudo: { contains: query, mode: 'insensitive' as const } },
                { email: { contains: query, mode: 'insensitive' as const } },
                { nom: { contains: query, mode: 'insensitive' as const } },
                { prenom: { contains: query, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        _count: { select: { listings: true, ordersAsBuyer: true, ordersAsSeller: true } },
      },
    });

    return users.map((user) => ({
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      pseudo: user.pseudo,
      email: user.email,
      role: user.role,
      status: user.status,
      stripeConnectStatus: user.stripeConnectStatus,
      listingCount: user._count.listings,
      orderCount: user._count.ordersAsBuyer + user._count.ordersAsSeller,
      createdAt: user.createdAt.toISOString(),
    }));
  }

  // ————— Commandes & litiges —————

  async orders(status?: string) {
    const orders = await this.prisma.order.findMany({
      where: status ? { status: status as never } : { status: { not: 'PENDING_PAYMENT' } },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        listing: { select: { title: true } },
        buyer: { select: { pseudo: true } },
        seller: { select: { pseudo: true } },
        returnRequest: { select: { id: true, status: true } },
      },
    });

    return orders.map((order) => ({
      id: order.id,
      reference: order.reference,
      listingTitle: order.listing.title,
      buyerPseudo: order.buyer.pseudo,
      sellerPseudo: order.seller.pseudo,
      status: order.status,
      totalCents: order.totalCents,
      commissionCents: order.commissionCents,
      sellerPayoutCents: order.sellerPayoutCents,
      // `stripeTransferId` vide sur une commande reçue = en attente du
      // reversement par l'administratrice.
      payoutDone: Boolean(order.stripeTransferId),
      awaitingPayout: order.status === 'RECEIVED' && !order.stripeTransferId,
      hasReturnRequest: Boolean(order.returnRequest),
      returnStatus: order.returnRequest?.status ?? null,
      paidAt: order.paidAt?.toISOString() ?? null,
      shippedAt: order.shippedAt?.toISOString() ?? null,
      receivedAt: order.receivedAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
    }));
  }

  /** File des demandes de retour, les plus anciennes en attente d'abord (CDC §3.7). */
  async returnRequests(status?: string): Promise<ReturnRequestDto[]> {
    const rows = await this.prisma.returnRequest.findMany({
      where: status ? { status: status as never } : {},
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
      take: 200,
      include: {
        order: { select: { reference: true } },
        requestedBy: { select: { pseudo: true } },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      orderId: row.orderId,
      orderReference: row.order.reference,
      requestedById: row.requestedById,
      requestedByPseudo: row.requestedBy.pseudo,
      reason: RETURN_REASON_LABELS[row.reason as keyof typeof RETURN_REASON_LABELS] ?? row.reason,
      description: row.description,
      photos: this.uploads.publicPhotoUrls(row.photos),
      status: row.status,
      adminNote: row.adminNote,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  // ————— Support & journal des e-mails —————

  async contactRequests(): Promise<ContactRequestDto[]> {
    const rows = await this.prisma.contactRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      pseudo: row.pseudo,
      message: row.message,
      handledAt: row.handledAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async markContactHandled(id: string): Promise<{ message: string }> {
    await this.prisma.contactRequest.update({
      where: { id },
      data: { handledAt: new Date() },
    });
    return { message: 'Demande marquée comme traitée.' };
  }

  async emailLogs(): Promise<EmailLogDto[]> {
    const rows = await this.prisma.emailLog.findMany({
      orderBy: { sentAt: 'desc' },
      take: 100,
      select: { id: true, to: true, subject: true, template: true, sentAt: true, error: true },
    });

    return rows.map((row) => ({
      id: row.id,
      to: row.to,
      subject: row.subject,
      template: row.template,
      sentAt: row.sentAt.toISOString(),
      error: row.error,
    }));
  }

  async emailBody(id: string): Promise<string> {
    const row = await this.prisma.emailLog.findUnique({ where: { id }, select: { body: true } });
    if (!row) throw new NotFoundException('E-mail introuvable.');
    return row.body;
  }
}
