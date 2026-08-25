// Formes de données renvoyées par l'API et consommées par le front.
// Ce sont des vues « sûres » : jamais de passwordHash, jamais d'identifiant Stripe
// exposé au navigateur, jamais l'audio de serment ailleurs qu'en back-office.

import type {
  ItemCondition,
  ListingStatus,
  MemberStatus,
  OrderStatus,
  PackageFormat,
  ReturnStatus,
  Role,
  StripeConnectStatus,
} from './enums';
import type { PriceBreakdown } from './settings';

export interface AddressDto {
  recipientName: string;
  line1: string;
  line2?: string | null;
  postalCode: string;
  city: string;
  country: string;
  phone?: string | null;
}

/** Utilisatrice connectée — /auth/me. */
export interface MeDto {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  pseudo: string;
  role: Role;
  status: MemberStatus;
  stripeConnectStatus: StripeConnectStatus;
  address: AddressDto | null;
  /** Fin du boost offert à l'inscription (CDC §3.1), ISO. */
  freeBoostUntil: string | null;
  hasPaidAccessFee: boolean;
  createdAt: string;
}

/** Profil public d'une vendeuse, affiché sur la page article. */
export interface PublicSellerDto {
  id: string;
  pseudo: string;
  memberSince: string;
  /**
   * Compteurs publics de la vendeuse, calculés uniquement là où ils sont
   * affichés (page article). Ils sont absents des listes — catalogue, favoris,
   * file de modération — qui ne les demandent pas : un compteur non calculé
   * reste indéfini plutôt que de valoir zéro.
   */
  listingCount?: number;
  salesCount?: number;
}

export interface ListingDto {
  id: string;
  sellerId: string;
  seller?: PublicSellerDto;
  title: string;
  categoryId: string;
  subcategoryId: string;
  categoryLabel: string;
  size: string;
  material: string;
  color: string;
  condition: ItemCondition;
  brand: string | null;
  priceCents: number;
  photos: string[];
  packageFormat: PackageFormat;
  /** Frais de port déduits du format de colis, à la charge de l'acheteuse (CDC §3.3). */
  shippingCents: number;
  description: string;
  status: ListingStatus;
  rejectionReason: string | null;
  isBoosted: boolean;
  boostedUntil: string | null;
  isFavorite?: boolean;
  favoriteCount: number;
  createdAt: string;
}

/**
 * Nombre d'annonces réellement en ligne dans une catégorie.
 *
 * Le référentiel `CATEGORIES` décrit ce que le site *accepte* ; il ne dit rien
 * de ce qu'il *contient*. Les deux ont longtemps été confondus dans les cases
 * du catalogue, qui annonçaient le nombre de sous-catégories du référentiel :
 * une case « 20 » menait alors à une recherche vide.
 */
export interface CategoryCountDto {
  categoryId: string;
  count: number;
}

/** Compteurs du catalogue, calculés sur les seules annonces PUBLISHED. */
export interface CatalogueFacetsDto {
  /** Total des annonces en ligne, toutes catégories confondues. */
  total: number;
  /** Toutes les catégories du référentiel, y compris celles à zéro. */
  categories: CategoryCountDto[];
}

export interface PaginatedDto<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface OrderDto {
  id: string;
  reference: string;
  listingId: string;
  listing: Pick<ListingDto, 'id' | 'title' | 'photos' | 'priceCents' | 'packageFormat' | 'size'>;
  buyerId: string;
  sellerId: string;
  buyerPseudo: string;
  sellerPseudo: string;
  /** Rôle de l'utilisatrice courante dans cette commande. */
  viewerRole: 'BUYER' | 'SELLER';
  status: OrderStatus;
  price: PriceBreakdown;
  shippingAddress: AddressDto;
  paidAt: string | null;
  shippedAt: string | null;
  receivedAt: string | null;
  refundedAt: string | null;
  hasReturnRequest: boolean;
  unreadMessages: number;
  createdAt: string;
}

export interface MessageDto {
  id: string;
  orderId: string;
  senderId: string;
  senderPseudo: string;
  body: string;
  isMine: boolean;
  createdAt: string;
}

export interface ConversationDto {
  orderId: string;
  reference: string;
  otherPartyPseudo: string;
  listingTitle: string;
  listingPhoto: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  orderStatus: OrderStatus;
}

export interface ReturnRequestDto {
  id: string;
  orderId: string;
  orderReference: string;
  requestedById: string;
  requestedByPseudo: string;
  reason: string;
  description: string;
  photos: string[];
  status: ReturnStatus;
  adminNote: string | null;
  createdAt: string;
}

// ————— Back-office (CDC §3.9) —————

/** Candidature en file de validation : inclut l'audio de serment. */
export interface PendingApplicationDto {
  id: string;
  nom: string;
  prenom: string;
  pseudo: string;
  email: string;
  /** URL de l'audio de serment — accessible aux seules administratrices. */
  audioOathUrl: string | null;
  createdAt: string;
}

export interface AdminMemberDto {
  id: string;
  nom: string;
  prenom: string;
  pseudo: string;
  email: string;
  role: Role;
  status: MemberStatus;
  stripeConnectStatus: StripeConnectStatus;
  listingCount: number;
  orderCount: number;
  createdAt: string;
}

export interface AdminStatsDto {
  pendingApplications: number;
  pendingListings: number;
  pendingReturns: number;
  publishedListings: number;
  members: number;
  ordersInEscrow: number;
  /** Montant actuellement sous séquestre, en centimes. */
  escrowCents: number;
  /** Commissions encaissées sur les commandes libérées, en centimes. */
  revenueCents: number;
}

export interface ContactRequestDto {
  id: string;
  email: string;
  pseudo: string;
  message: string;
  handledAt: string | null;
  createdAt: string;
}

/** Journal des e-mails — permet de vérifier le parcours sans SMTP en développement. */
export interface EmailLogDto {
  id: string;
  to: string;
  subject: string;
  template: string;
  sentAt: string;
  error: string | null;
}
