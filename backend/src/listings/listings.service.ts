import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CATEGORIES,
  type CatalogueFacetsDto,
  type ListingDto,
  type ListingFilters,
  type ListingInput,
  type PaginatedDto,
} from '@nissa/shared';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { UploadsService } from '../uploads/uploads.service';
import { MailService } from '../mail/mail.service';
import { StripeService } from '../stripe/stripe.service';
import { NotificationsService } from '../notifications/notifications.service';
import { addDays } from '../common/utils/dates';
import { toListingDto } from './listings.mapper';

@Injectable()
export class ListingsService {
  private readonly adminEmail: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly uploads: UploadsService,
    private readonly mail: MailService,
    private readonly stripe: StripeService,
    private readonly notifications: NotificationsService,
    config: ConfigService,
  ) {
    this.adminEmail = config.getOrThrow<{ email: string }>('admin').email;
  }

  // ————— Catalogue public (CDC §3.5) —————

  /**
   * Recherche du catalogue.
   *
   * Seules les annonces PUBLISHED sont visibles : une annonce vendue disparaît
   * automatiquement du catalogue (CDC §3.6). Les annonces boostées remontent en
   * tête, quel que soit le tri demandé (CDC §3.5).
   */
  async search(filters: ListingFilters, viewerId?: string): Promise<PaginatedDto<ListingDto>> {
    const where: Prisma.ListingWhereInput = { status: 'PUBLISHED' };

    if (filters.sellerId) where.sellerId = filters.sellerId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.subcategoryId) where.subcategoryId = filters.subcategoryId;
    if (filters.size) where.size = filters.size;
    if (filters.material) where.material = filters.material;
    if (filters.color) where.color = filters.color;
    if (filters.condition) where.condition = filters.condition as never;
    if (filters.brand) where.brand = { contains: filters.brand, mode: 'insensitive' };

    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      where.priceCents = {
        ...(filters.priceMin !== undefined ? { gte: filters.priceMin } : {}),
        ...(filters.priceMax !== undefined ? { lte: filters.priceMax } : {}),
      };
    }

    if (filters.q?.trim()) {
      const q = filters.q.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { material: { contains: q, mode: 'insensitive' } },
        { color: { contains: q, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ListingOrderByWithRelationInput[] = [
      // `boostedUntil` dans le futur remonte l'annonce ; `nulls: last` écarte les
      // annonces sans boost, et un boost expiré retombe naturellement au tri suivant.
      { boostedUntil: { sort: 'desc', nulls: 'last' } },
    ];
    if (filters.sort === 'price_asc') orderBy.push({ priceCents: 'asc' });
    else if (filters.sort === 'price_desc') orderBy.push({ priceCents: 'desc' });
    else orderBy.push({ publishedAt: 'desc' });
    orderBy.push({ createdAt: 'desc' });

    const skip = (filters.page - 1) * filters.perPage;

    const [rows, total, settings] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        orderBy,
        skip,
        take: filters.perPage,
        include: {
          seller: { select: { id: true, pseudo: true, createdAt: true } },
          _count: { select: { favorites: true } },
          ...(viewerId
            ? { favorites: { where: { userId: viewerId }, select: { id: true } } }
            : {}),
        },
      }),
      this.prisma.listing.count({ where }),
      this.settings.get(),
    ]);

    return {
      items: rows.map((row) => toListingDto(row, { uploads: this.uploads, settings })),
      total,
      page: filters.page,
      perPage: filters.perPage,
      totalPages: Math.max(1, Math.ceil(total / filters.perPage)),
    };
  }

  /**
   * Compteurs par catégorie affichés sur les cases du catalogue.
   *
   * Ils portent sur les annonces réellement visibles — même filtre `PUBLISHED`
   * que la recherche — pour qu'une case ne puisse pas annoncer un chiffre que
   * la recherche correspondante ne retrouve pas.
   */
  async facets(): Promise<CatalogueFacetsDto> {
    const rows = await this.prisma.listing.groupBy({
      by: ['categoryId'],
      where: { status: 'PUBLISHED' },
      _count: { _all: true },
    });

    const parCategorie = new Map(rows.map((row) => [row.categoryId, row._count._all]));

    return {
      total: rows.reduce((somme, row) => somme + row._count._all, 0),
      // Les catégories vides sont renvoyées à zéro plutôt qu'omises : le front
      // affiche la grille complète et doit pouvoir écrire « aucun article ».
      categories: CATEGORIES.map((categorie) => ({
        categoryId: categorie.id,
        count: parCategorie.get(categorie.id) ?? 0,
      })),
    };
  }

  /** Page article. Une annonce non publiée n'est visible que par sa vendeuse ou l'administratrice. */
  async findOne(
    id: string,
    viewer?: { id: string; role: string },
  ): Promise<ListingDto> {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, pseudo: true, createdAt: true } },
        _count: { select: { favorites: true } },
        ...(viewer ? { favorites: { where: { userId: viewer.id }, select: { id: true } } } : {}),
      },
    });

    if (!listing) throw new NotFoundException('Cette annonce n’existe plus ou a été retirée.');

    const isOwner = viewer?.id === listing.sellerId;
    const isAdmin = viewer?.role === 'ADMIN';
    if (listing.status !== 'PUBLISHED' && !isOwner && !isAdmin) {
      throw new NotFoundException('Cette annonce n’est plus disponible.');
    }

    const [settings, sellerStats] = await Promise.all([
      this.settings.get(),
      this.sellerStats(listing.sellerId),
    ]);

    if (listing.status === 'PUBLISHED' && !isOwner) {
      // Compteur de vues indicatif : ne doit jamais faire échouer l'affichage.
      this.prisma.listing
        .update({ where: { id }, data: { viewCount: { increment: 1 } } })
        .catch(() => undefined);
    }

    return toListingDto(listing, { uploads: this.uploads, settings, sellerStats });
  }

  /**
   * Compteurs affichés sur le profil public de la vendeuse.
   *
   * Une vente est comptée dès que l'acheteuse a payé : à cet instant l'article
   * est vendu et quitte le catalogue. Sont donc incluses les commandes PAID,
   * SHIPPED et RECEIVED — et exclues les commandes annulées, remboursées ou
   * jamais payées, qui ne sont pas des ventes.
   */
  private async sellerStats(sellerId: string): Promise<{ listingCount: number; salesCount: number }> {
    const [listingCount, salesCount] = await Promise.all([
      this.prisma.listing.count({ where: { sellerId, status: 'PUBLISHED' } }),
      this.prisma.order.count({
        where: { sellerId, status: { in: ['PAID', 'SHIPPED', 'RECEIVED'] } },
      }),
    ]);
    return { listingCount, salesCount };
  }

  // ————— Dépôt d'annonce (CDC §3.3) —————

  /**
   * Crée une annonce au statut PENDING_REVIEW : rien n'est publié sans validation
   * manuelle de l'administratrice (CDC §3.3).
   */
  async create(sellerId: string, input: ListingInput): Promise<ListingDto> {
    const seller = await this.prisma.user.findUnique({ where: { id: sellerId } });
    if (!seller) throw new NotFoundException('Nous ne retrouvons pas ce compte.');

    // Le reversement passe par Stripe Connect : sans compte connecté opérationnel,
    // la vente ne pourrait pas être payée (CDC §3.2).
    if (!this.stripe.bypassConnect && seller.stripeConnectStatus !== 'COMPLETE') {
      const stripeMessage =
        seller.stripeConnectStatus === 'PENDING'
          ? 'Terminez le formulaire Stripe, puis actualisez votre compte : c’est ce qui vous permettra d’être payée de vos ventes.'
          : 'Configurez d’abord vos coordonnées bancaires via Stripe : c’est ce qui vous permettra d’être payée de vos ventes.';
      throw new BadRequestException({
        message: stripeMessage,
        step: 'stripe_connect',
      });
    }
    if (!seller.addressLine1 || !seller.postalCode || !seller.city) {
      throw new BadRequestException({
        message: 'Renseignez votre adresse postale : elle figure sur le bordereau d’envoi.',
        step: 'address',
      });
    }

    const listing = await this.prisma.listing.create({
      data: {
        sellerId,
        title: input.title.trim(),
        categoryId: input.categoryId,
        subcategoryId: input.subcategoryId,
        size: input.size,
        material: input.material,
        color: input.color,
        condition: input.condition as never,
        brand: input.brand?.trim() || null,
        priceCents: input.priceCents,
        photos: input.photos,
        packageFormat: input.packageFormat as never,
        description: input.description.trim(),
        status: 'PENDING_REVIEW',
      },
      include: { seller: { select: { id: true, pseudo: true, createdAt: true } } },
    });

    await this.mail.send('listingSubmitted', seller.email, {
      prenom: seller.prenom,
      title: listing.title,
    });
    await this.mail.send('newListingToAdmin', this.adminEmail, {
      pseudo: seller.pseudo,
      title: listing.title,
      adminUrl: this.mail.url('/admin/annonces'),
    });

    await this.notifications.notify(sellerId, {
      kind: 'LISTING_SUBMITTED',
      title: 'Annonce envoyée en validation',
      message: `« ${listing.title} » est entre les mains de l’administratrice. Vous serez prévenue dès qu’elle paraîtra.`,
      link: '/mes-annonces',
    });

    const settings = await this.settings.get();
    return toListingDto(listing, { uploads: this.uploads, settings });
  }

  /** Modification possible tant que l'annonce n'est pas publiée ou vendue. */
  async update(id: string, sellerId: string, input: ListingInput): Promise<ListingDto> {
    const existing = await this.prisma.listing.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Nous ne retrouvons pas cette annonce.');
    if (existing.sellerId !== sellerId) {
      throw new ForbiddenException('Cette annonce n’est pas la vôtre.');
    }
    if (existing.status === 'SOLD') {
      throw new ConflictException('Cette annonce est vendue : elle ne peut plus être modifiée.');
    }

    const removedPhotos = existing.photos.filter((p) => !input.photos.includes(p));

    const listing = await this.prisma.listing.update({
      where: { id },
      data: {
        title: input.title.trim(),
        categoryId: input.categoryId,
        subcategoryId: input.subcategoryId,
        size: input.size,
        material: input.material,
        color: input.color,
        condition: input.condition as never,
        brand: input.brand?.trim() || null,
        priceCents: input.priceCents,
        photos: input.photos,
        packageFormat: input.packageFormat as never,
        description: input.description.trim(),
        // Toute modification repasse par la modération (CDC §3.3).
        status: 'PENDING_REVIEW',
        rejectionReason: null,
        moderatedAt: null,
        moderatedById: null,
      },
      include: { seller: { select: { id: true, pseudo: true, createdAt: true } } },
    });

    if (removedPhotos.length) await this.uploads.removeMany(removedPhotos);

    const settings = await this.settings.get();
    return toListingDto(listing, { uploads: this.uploads, settings });
  }

  async remove(id: string, sellerId: string): Promise<{ message: string }> {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: { order: { select: { id: true } } },
    });

    if (!listing) throw new NotFoundException('Nous ne retrouvons pas cette annonce.');
    if (listing.sellerId !== sellerId) {
      throw new ForbiddenException('Cette annonce n’est pas la vôtre.');
    }
    if (listing.order) {
      throw new ConflictException(
        'Cette annonce est liée à une commande : elle ne peut pas être supprimée.',
      );
    }

    await this.prisma.listing.delete({ where: { id } });
    await this.uploads.removeMany(listing.photos);

    return { message: 'Annonce supprimée.' };
  }

  async findMine(sellerId: string, status?: string): Promise<ListingDto[]> {
    const rows = await this.prisma.listing.findMany({
      where: { sellerId, ...(status ? { status: status as never } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { favorites: true } } },
    });

    const settings = await this.settings.get();
    return rows.map((row) => toListingDto(row, { uploads: this.uploads, settings }));
  }

  // ————— Boost (CDC §3.5) —————

  /*
   * Le mois offert ne se réclame plus : toute annonce publiée pendant qu'il
   * court est mise en avant d'office (voir AdminService.reviewListing). La
   * méthode « useFreeBoost » qui vivait ici, et son point d'entrée
   * POST /listings/:id/boost/free, n'avaient plus d'objet.
   */

  async createBoostCheckout(
    listingId: string,
    sellerId: string,
  ): Promise<{ url: string; isMock: boolean }> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { seller: { select: { email: true } } },
    });

    if (!listing) throw new NotFoundException('Nous ne retrouvons pas cette annonce.');
    if (listing.sellerId !== sellerId) throw new ForbiddenException('Cette annonce n’est pas la vôtre.');
    if (listing.status !== 'PUBLISHED') {
      throw new BadRequestException('Seule une annonce en ligne peut être mise en avant.');
    }

    const settings = await this.settings.get();
    const session = await this.stripe.createBoostCheckout({
      listingId,
      email: listing.seller.email,
      title: listing.title,
      priceCents: settings.boostPriceCents,
    });

    return { url: session.url, isMock: this.stripe.isMock };
  }

  /** Active (ou prolonge) un boost payé — appelé par le webhook ou le paiement simulé. */
  async confirmBoostPaid(listingId: string, subscriptionId?: string): Promise<void> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { seller: { select: { email: true, prenom: true } } },
    });
    if (!listing) return;

    const from =
      listing.boostedUntil && listing.boostedUntil.getTime() > Date.now()
        ? listing.boostedUntil
        : new Date();
    const boostedUntil = addDays(from, 30);

    await this.prisma.listing.update({
      where: { id: listingId },
      data: { boostedUntil, ...(subscriptionId ? { stripeBoostSubscriptionId: subscriptionId } : {}) },
    });

    await this.mail.send('boostActivated', listing.seller.email, {
      prenom: listing.seller.prenom,
      title: listing.title,
      until: boostedUntil.toLocaleDateString('fr-FR'),
    });

    await this.notifications.notify(listing.sellerId, {
      kind: 'BOOST_ACTIVATED',
      title: 'Mise en avant renouvelée',
      message: `« ${listing.title} » reste en tête du catalogue jusqu’au ${boostedUntil.toLocaleDateString('fr-FR')}.`,
      link: '/mes-annonces',
    });
  }

  async cancelBoost(listingId: string, sellerId: string): Promise<{ message: string }> {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Nous ne retrouvons pas cette annonce.');
    if (listing.sellerId !== sellerId) throw new ForbiddenException('Cette annonce n’est pas la vôtre.');

    if (listing.stripeBoostSubscriptionId) {
      await this.stripe.cancelBoostSubscription(listing.stripeBoostSubscriptionId);
    }

    await this.prisma.listing.update({
      where: { id: listingId },
      data: { stripeBoostSubscriptionId: null },
    });

    return {
      message:
        'Le renouvellement est annulé. La mise en avant reste active jusqu’à la fin de la période payée.',
    };
  }
}
