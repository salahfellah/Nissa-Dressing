import {
  categoryPathLabel,
  type ListingDto,
  type PlatformSettings,
  type PublicSellerDto,
} from '@nissa/shared';
import type { Listing, User } from '@prisma/client';
import type { UploadsService } from '../uploads/uploads.service';

export type ListingWithRelations = Listing & {
  seller?: Pick<User, 'id' | 'pseudo' | 'createdAt'> | null;
  _count?: { favorites: number };
  favorites?: { id: string }[];
};

export interface MapListingOptions {
  uploads: UploadsService;
  settings: PlatformSettings;
  /** Nombre d'annonces publiées / ventes de la vendeuse, si déjà chargé. */
  sellerStats?: { listingCount: number; salesCount: number };
  /** Renseigné quand la requête est faite par une membre connectée. */
  isFavorite?: boolean;
}

const isBoostActive = (boostedUntil: Date | null): boolean =>
  !!boostedUntil && boostedUntil.getTime() > Date.now();

export function toListingDto(listing: ListingWithRelations, opts: MapListingOptions): ListingDto {
  const seller: PublicSellerDto | undefined = listing.seller
    ? {
        id: listing.seller.id,
        pseudo: listing.seller.pseudo,
        memberSince: listing.seller.createdAt.toISOString(),
        // Les compteurs ne sont repris que s'ils ont été calculés : un `?? 0`
        // afficherait « 0 annonce en ligne » sur une vendeuse qui en a dix.
        ...opts.sellerStats,
      }
    : undefined;

  return {
    id: listing.id,
    sellerId: listing.sellerId,
    seller,
    title: listing.title,
    categoryId: listing.categoryId,
    subcategoryId: listing.subcategoryId,
    categoryLabel: categoryPathLabel(listing.categoryId, listing.subcategoryId),
    size: listing.size,
    material: listing.material,
    color: listing.color,
    condition: listing.condition,
    brand: listing.brand,
    priceCents: listing.priceCents,
    photos: opts.uploads.publicPhotoUrls(listing.photos),
    packageFormat: listing.packageFormat,
    // Les frais de port découlent du format de colis et restent à la charge
    // de l'acheteuse (CDC §3.3).
    shippingCents: opts.settings.shippingFeesCents[listing.packageFormat] ?? 0,
    description: listing.description,
    status: listing.status,
    rejectionReason: listing.rejectionReason,
    isBoosted: isBoostActive(listing.boostedUntil),
    boostedUntil: listing.boostedUntil?.toISOString() ?? null,
    isFavorite: opts.isFavorite ?? (listing.favorites ? listing.favorites.length > 0 : undefined),
    favoriteCount: listing._count?.favorites ?? 0,
    createdAt: listing.createdAt.toISOString(),
  };
}
