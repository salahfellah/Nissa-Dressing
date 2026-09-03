import type { NotificationKind } from '@nissa/shared';
import {
  AlertTriangle,
  ArrowUp,
  BadgeCheck,
  Banknote,
  Bell,
  CheckCircle,
  CheckCheck,
  ClipboardList,
  CreditCard,
  HandCoins,
  MessageCircle,
  Package,
  PackageCheck,
  PackageX,
  RotateCcw,
  Send,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
  UserPlus,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

/** Icône cohérente pour chaque nature de notification. */
export function kindMeta(kind: NotificationKind): { icon: LucideIcon; label: string } {
  switch (kind) {
    case 'ORDER_PAID':
      return { icon: CheckCircle, label: 'Paiement confirmé' };
    case 'ORDER_SOLD':
      return { icon: ShoppingCart, label: 'Article vendu' };
    case 'ORDER_SHIPPED':
      return { icon: Truck, label: 'Colis expédié' };
    case 'ORDER_RECEIVED':
      return { icon: PackageCheck, label: 'Réception confirmée' };
    case 'PAYOUT_RELEASED':
      return { icon: Banknote, label: 'Reversement effectué' };
    case 'AUTO_CONFIRMED':
      return { icon: CheckCheck, label: 'Réception acquise' };
    case 'MESSAGE':
      return { icon: MessageCircle, label: 'Nouveau message' };
    case 'LISTING_SUBMITTED':
      return { icon: Send, label: 'Annonce envoyée' };
    case 'LISTING_APPROVED':
      return { icon: Sparkles, label: 'Annonce publiée' };
    case 'LISTING_REJECTED':
      return { icon: AlertTriangle, label: 'Annonce refusée' };
    case 'ACCESS_FEE_PAID':
      return { icon: BadgeCheck, label: 'Frais d’accès réglés' };
    case 'BOOST_ACTIVATED':
      return { icon: ArrowUp, label: 'Mise en avant activée' };
    case 'APPLICATION_ACCEPTED':
      return { icon: ShieldCheck, label: 'Candidature acceptée' };
    case 'STRIPE_READY':
      return { icon: CreditCard, label: 'Coordonnées bancaires' };
    case 'RETURN_REQUESTED':
      return { icon: RotateCcw, label: 'Retour demandé' };
    case 'RETURN_ACCEPTED':
      return { icon: PackageX, label: 'Retour accepté' };
    case 'RETURN_REJECTED':
      return { icon: XCircle, label: 'Retour refusé' };
    case 'REFUND_ISSUED':
      return { icon: HandCoins, label: 'Remboursement' };
    case 'INFO':
      return { icon: Bell, label: 'Information' };

    // ————— Rappels —————
    case 'TODO_ACCESS_FEE':
      return { icon: ShoppingCart, label: 'À faire' };
    case 'TODO_ONBOARDING':
      return { icon: UserPlus, label: 'À faire' };
    case 'TODO_STRIPE':
      return { icon: CreditCard, label: 'À faire' };
    case 'TODO_LISTING_REVIEW':
      return { icon: ClipboardList, label: 'À faire' };
    case 'TODO_SHIP':
      return { icon: Package, label: 'À faire' };
    case 'TODO_CONFIRM_RECEPTION':
      return { icon: PackageCheck, label: 'À faire' };
    case 'TODO_ADMIN_REVIEW':
      return { icon: ShieldCheck, label: 'À faire' };

    default:
      return { icon: Bell, label: 'Notification' };
  }
}

/**
 * Formate une date ISO en français relatif.
 *
 * - Postérieur à 7 jours → date courte (24/09)
 * - Postérieur à 24 h → « X j » (un seul jour)
 * - Postérieur à 1 h → « X h »
 * - Moins d'1 h → « à l'instant »
 */
export function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;

  if (diff < 0) return 'à l’instant';
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'à l’instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}