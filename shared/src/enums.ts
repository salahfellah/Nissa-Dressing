// Enums du domaine — miroir exact des enums Prisma (apps/api/prisma/schema.prisma).
// Source de vérité partagée entre le front (Next) et l'API (Nest).

export const Role = {
  MEMBER: 'MEMBER',
  ADMIN: 'ADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

/**
 * Machine à états du membre — CDC §3.1 / §3.2.
 *
 * PENDING_REVIEW → REJECTED
 *                → AWAITING_PAYMENT → PAYMENT_DONE → ONBOARDING → MEMBER
 */
export const MemberStatus = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  REJECTED: 'REJECTED',
  AWAITING_PAYMENT: 'AWAITING_PAYMENT',
  PAYMENT_DONE: 'PAYMENT_DONE',
  ONBOARDING: 'ONBOARDING',
  MEMBER: 'MEMBER',
} as const;
export type MemberStatus = (typeof MemberStatus)[keyof typeof MemberStatus];

export const MEMBER_STATUS_ORDER: MemberStatus[] = [
  MemberStatus.PENDING_REVIEW,
  MemberStatus.AWAITING_PAYMENT,
  MemberStatus.PAYMENT_DONE,
  MemberStatus.ONBOARDING,
  MemberStatus.MEMBER,
];

/** Statut d'une annonce — CDC §3.3 (modération manuelle avant publication). */
export const ListingStatus = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  PUBLISHED: 'PUBLISHED',
  REJECTED: 'REJECTED',
  SOLD: 'SOLD',
} as const;
export type ListingStatus = (typeof ListingStatus)[keyof typeof ListingStatus];

/** Format de colis — CDC §3.3 (aide contextuelle fournie dans PACKAGE_FORMATS). */
export const PackageFormat = {
  PETIT: 'PETIT',
  MOYEN: 'MOYEN',
  GRAND: 'GRAND',
} as const;
export type PackageFormat = (typeof PackageFormat)[keyof typeof PackageFormat];

export const ItemCondition = {
  NEUF_ETIQUETTE: 'NEUF_ETIQUETTE',
  NEUF: 'NEUF',
  TRES_BON_ETAT: 'TRES_BON_ETAT',
  BON_ETAT: 'BON_ETAT',
  SATISFAISANT: 'SATISFAISANT',
} as const;
export type ItemCondition = (typeof ItemCondition)[keyof typeof ItemCondition];

/**
 * Cycle de vie d'une commande — CDC §3.6.
 * Le séquestre Stripe n'est libéré qu'au passage SHIPPED → RECEIVED.
 */
export const OrderStatus = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAID: 'PAID',
  SHIPPED: 'SHIPPED',
  RECEIVED: 'RECEIVED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

/** Demande de retour — CDC §3.7. */
export const ReturnStatus = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  RETURN_SHIPPED: 'RETURN_SHIPPED',
  REFUNDED: 'REFUNDED',
} as const;
export type ReturnStatus = (typeof ReturnStatus)[keyof typeof ReturnStatus];

/** Onboarding Stripe Connect — CDC §3.2 (aucune donnée bancaire stockée sur le site). */
export const StripeConnectStatus = {
  NOT_STARTED: 'NOT_STARTED',
  PENDING: 'PENDING',
  COMPLETE: 'COMPLETE',
} as const;
export type StripeConnectStatus = (typeof StripeConnectStatus)[keyof typeof StripeConnectStatus];

/** Qui supporte la commission — arbitrage CDC §6, paramétrable en back-office. */
export const CommissionPayer = {
  BUYER: 'BUYER',
  SELLER: 'SELLER',
} as const;
export type CommissionPayer = (typeof CommissionPayer)[keyof typeof CommissionPayer];
