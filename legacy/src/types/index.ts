// Types du domaine, alignés sur le CDC "Marketplace 1500" §3

export type MemberStatus =
  | 'guest'
  | 'pending_review'
  | 'rejected'
  | 'awaiting_payment'
  | 'payment_done'
  | 'onboarding'
  | 'member';

export interface User {
  id: string;
  nom: string;
  prenom: string;
  pseudo: string;
  email: string;
  status: MemberStatus;
  isAdmin: boolean;
  adresse?: PostalAddress;
  stripeConnectStatus?: 'not_started' | 'pending' | 'complete';
  createdAt: string;
}

export interface PostalAddress {
  ligne1: string;
  ligne2?: string;
  codePostal: string;
  ville: string;
  pays: string;
}

export type ListingStatus = 'pending_review' | 'published' | 'rejected' | 'sold';

export type PackageFormat = 'petit' | 'moyen' | 'grand';

export type ItemCondition = 'neuf_etiquette' | 'neuf' | 'tres_bon_etat' | 'bon_etat' | 'satisfaisant';

export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  categoryId: string;
  subcategoryId: string;
  size: string;
  material: string;
  color: string;
  condition: ItemCondition;
  brand: string | null; // null = "Sans marque"
  price: number;
  photos: string[];
  packageFormat: PackageFormat;
  description: string;
  status: ListingStatus;
  rejectionReason?: string;
  isBoosted: boolean;
  boostExpiresAt?: string;
  createdAt: string;
}

export type OrderStatus = 'paid' | 'shipped' | 'received' | 'refunded';

export interface Order {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  price: number;
  shippingFee: number;
  commission: number;
  shippingAddress: PostalAddress;
  status: OrderStatus;
  waybillUrl?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  orderId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export type ReturnRequestStatus = 'pending_review' | 'accepted' | 'rejected' | 'refunded';

export interface ReturnRequest {
  id: string;
  orderId: string;
  requestedBy: string;
  reason: string;
  photos: string[];
  status: ReturnRequestStatus;
  returnWaybillUrl?: string;
  createdAt: string;
}
