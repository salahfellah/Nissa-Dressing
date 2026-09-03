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

/**
 * Nature d'une notification interne — miroir de l'enum Prisma.
 *
 * Les fiches « À faire » (TODO_*) ne sont pas stockées : elles sont recalculées
 * à chaque lecture de la liste, à partir de l'état réel du compte. Les autres
 * sont des événements enregistrés.
 */
export const NotificationKind = {
  // ————— Événements : ce qui s'est passé —————
  LISTING_SUBMITTED: 'LISTING_SUBMITTED',
  LISTING_APPROVED: 'LISTING_APPROVED',
  LISTING_REJECTED: 'LISTING_REJECTED',
  ORDER_PAID: 'ORDER_PAID',
  ORDER_SOLD: 'ORDER_SOLD',
  ORDER_SHIPPED: 'ORDER_SHIPPED',
  ORDER_RECEIVED: 'ORDER_RECEIVED',
  PAYOUT_RELEASED: 'PAYOUT_RELEASED',
  AUTO_CONFIRMED: 'AUTO_CONFIRMED',
  MESSAGE: 'MESSAGE',
  ACCESS_FEE_PAID: 'ACCESS_FEE_PAID',
  BOOST_ACTIVATED: 'BOOST_ACTIVATED',
  APPLICATION_ACCEPTED: 'APPLICATION_ACCEPTED',
  STRIPE_READY: 'STRIPE_READY',
  RETURN_REQUESTED: 'RETURN_REQUESTED',
  RETURN_ACCEPTED: 'RETURN_ACCEPTED',
  RETURN_REJECTED: 'RETURN_REJECTED',
  REFUND_ISSUED: 'REFUND_ISSUED',
  INFO: 'INFO',

  // ————— Rappels : ce qu'il reste à faire —————
  TODO_ACCESS_FEE: 'TODO_ACCESS_FEE',
  TODO_ONBOARDING: 'TODO_ONBOARDING',
  TODO_STRIPE: 'TODO_STRIPE',
  TODO_LISTING_REVIEW: 'TODO_LISTING_REVIEW',
  TODO_SHIP: 'TODO_SHIP',
  TODO_CONFIRM_RECEPTION: 'TODO_CONFIRM_RECEPTION',
  TODO_ADMIN_REVIEW: 'TODO_ADMIN_REVIEW',
} as const;
export type NotificationKind = (typeof NotificationKind)[keyof typeof NotificationKind];
