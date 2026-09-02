// Paramètres de plateforme.
//
// Les quatre points laissés « à définir » par le CDC §6 (commission, prix du boost,
// frais de port, frais d'accès) vivent ici sous forme de valeurs par défaut, sont
// persistés en base (table Setting) et sont modifiables par l'administratrice depuis
// le back-office — sans redéploiement. Aucun montant n'est codé en dur ailleurs.

import { CommissionPayer, PackageFormat } from './enums';

export interface PlatformSettings {
  /** Frais d'accès uniques, en centimes. CDC §1.2 : 5 € à vie. */
  accessFeeCents: number;
  /** Durée du boost offert à l'inscription, en jours. CDC §3.1 : 1 mois. */
  freeBoostDays: number;
  /** Prix de l'abonnement boost mensuel, en centimes. CDC §6 : « à définir ». */
  boostPriceCents: number;
  /** Taux de commission plateforme, en pourcentage du prix de l'article. CDC §6. */
  commissionPercent: number;
  /** Part fixe de la commission, en centimes (0 = pourcentage seul). */
  commissionFixedCents: number;
  /** Qui supporte la commission. CDC §6 : « à la charge de l'acheteuse ou de la vendeuse ». */
  commissionPayer: CommissionPayer;
  /** Frais de port par format de colis, en centimes. CDC §3.3 : à la charge de l'acheteuse. */
  shippingFeesCents: Record<PackageFormat, number>;
  /** Adresse e-mail recevant les demandes du formulaire de contact. CDC §3.8. */
  supportEmail: string;
  /**
   * Délai laissé à l'acheteuse pour confirmer la réception, en jours à compter
   * de l'expédition.
   *
   * Sans limite, une acheteuse qui a bien reçu son colis mais ne clique jamais
   * bloque l'argent de la vendeuse indéfiniment. Passé ce délai la réception
   * est acquise, le reversement devient possible et la fenêtre de réclamation
   * se ferme.
   */
  autoConfirmDays: number;
}

export const DEFAULT_SETTINGS: PlatformSettings = {
  accessFeeCents: 500,
  freeBoostDays: 30,
  boostPriceCents: 299,
  commissionPercent: 10,
  commissionFixedCents: 0,
  commissionPayer: 'BUYER',
  shippingFeesCents: {
    PETIT: 490,
    MOYEN: 690,
    GRAND: 990,
  },
  supportEmail: 'contact@nissa-dressing.fr',
  autoConfirmDays: 14,
};

export const SETTINGS_KEY = 'platform';

export interface PriceBreakdown {
  /** Prix demandé par la vendeuse. */
  itemPriceCents: number;
  /** Frais de port, fonction du format de colis. */
  shippingCents: number;
  /** Commission prélevée par la plateforme. */
  commissionCents: number;
  /** Total débité à l'acheteuse. */
  totalCents: number;
  /** Montant reversé à la vendeuse à la confirmation de réception. */
  sellerPayoutCents: number;
  commissionPayer: CommissionPayer;
}

/**
 * Calcule le détail d'une transaction — CDC §3.6.
 *
 * Commission à la charge de l'acheteuse : elle s'ajoute au total, la vendeuse
 * touche l'intégralité de son prix. À la charge de la vendeuse : le total de
 * l'acheteuse est inchangé, la commission est déduite du reversement.
 */
export function computePrice(
  itemPriceCents: number,
  packageFormat: PackageFormat,
  settings: PlatformSettings,
): PriceBreakdown {
  const shippingCents = settings.shippingFeesCents[packageFormat] ?? 0;
  const commissionCents = Math.round(
    (itemPriceCents * settings.commissionPercent) / 100 + settings.commissionFixedCents,
  );

  const buyerPays = settings.commissionPayer === 'BUYER';

  return {
    itemPriceCents,
    shippingCents,
    commissionCents,
    totalCents: itemPriceCents + shippingCents + (buyerPays ? commissionCents : 0),
    sellerPayoutCents: buyerPays ? itemPriceCents : itemPriceCents - commissionCents,
    commissionPayer: settings.commissionPayer,
  };
}

/** Formate des centimes en euros — un seul formateur pour tout le projet. */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export const euros = (cents: number): number => cents / 100;
export const toCents = (euros: number): number => Math.round(euros * 100);

/**
 * Convertit un numéro tel qu'il a été saisi en numéro utilisable par wa.me,
 * qui n'accepte que des chiffres, indicatif pays compris et sans « + ».
 *
 * Un numéro français est presque toujours écrit au format national
 * (06 12 34 56 78) : le zéro initial est alors remplacé par l'indicatif, sans
 * quoi le lien WhatsApp ne mène à personne.
 */
export function whatsappNumber(
  phone: string | null | undefined,
  indicatifParDefaut = '33',
): string | null {
  if (!phone) return null;

  const chiffres = phone.replace(/\D/g, '');
  if (chiffres.length < 6) return null;

  // Déjà international : l'indicatif est dans le numéro.
  if (phone.trim().startsWith('+') || phone.trim().startsWith('00')) {
    return chiffres.replace(/^00/, '');
  }
  if (chiffres.startsWith('0')) return indicatifParDefaut + chiffres.slice(1);
  return chiffres;
}
