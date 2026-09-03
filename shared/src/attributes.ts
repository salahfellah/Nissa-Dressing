// Attributs d'annonce : état, matière, couleur, format de colis — CDC §3.3.

import { ItemCondition, PackageFormat, ListingStatus, OrderStatus, ReturnStatus, MemberStatus } from './enums';

export const CONDITION_LABELS: Record<ItemCondition, string> = {
  NEUF_ETIQUETTE: 'Neuf avec étiquette',
  NEUF: 'Neuf sans étiquette',
  TRES_BON_ETAT: 'Très bon état',
  BON_ETAT: 'Bon état',
  SATISFAISANT: 'Satisfaisant',
};

export const CONDITION_HELP: Record<ItemCondition, string> = {
  NEUF_ETIQUETTE: 'Jamais porté, étiquette d’origine encore attachée.',
  NEUF: 'Jamais porté, sans étiquette.',
  TRES_BON_ETAT: 'Porté quelques fois, aucun défaut visible.',
  BON_ETAT: 'Porté régulièrement, légères marques d’usage.',
  SATISFAISANT: 'Usure visible ou petit défaut — à décrire précisément.',
};

/** États acceptés pour les sous-catégories marquées « neufs uniquement » (CDC §3.4). */
export const NEW_ONLY_CONDITIONS: ItemCondition[] = ['NEUF_ETIQUETTE', 'NEUF'];

export const CONDITIONS: ItemCondition[] = [
  'NEUF_ETIQUETTE',
  'NEUF',
  'TRES_BON_ETAT',
  'BON_ETAT',
  'SATISFAISANT',
];

export interface PackageFormatOption {
  id: PackageFormat;
  label: string;
  /** Aide contextuelle imposée par le CDC §3.3. */
  help: string;
}

export const PACKAGE_FORMATS: PackageFormatOption[] = [
  { id: 'PETIT', label: 'Petit', help: 'Tient dans une grande enveloppe' },
  { id: 'MOYEN', label: 'Moyen', help: 'Tient dans une boîte à chaussures' },
  { id: 'GRAND', label: 'Grand', help: 'Tient dans un carton de déménagement' },
];

export const PACKAGE_FORMAT_LABELS: Record<PackageFormat, string> = {
  PETIT: 'Petit',
  MOYEN: 'Moyen',
  GRAND: 'Grand',
};

export const MATERIALS = [
  'Coton',
  'Polyester',
  'Viscose',
  'Soie',
  'Satin',
  'Mousseline',
  'Laine',
  'Lin',
  'Jersey',
  'Nidha',
  'Crêpe',
  'Medina silk',
  'Denim',
  'Velours',
  'Nylon',
  'Autre',
];

export const COLORS: { name: string; hex: string }[] = [
  { name: 'Noir', hex: '#111111' },
  { name: 'Blanc', hex: '#FFFFFF' },
  { name: 'Beige', hex: '#E8E1D6' },
  { name: 'Taupe', hex: '#B8ADA0' },
  { name: 'Marron', hex: '#6B4F3A' },
  { name: 'Gris', hex: '#9CA3AF' },
  { name: 'Bleu marine', hex: '#1E3A5F' },
  { name: 'Bleu', hex: '#3B82F6' },
  { name: 'Vert', hex: '#2F6B4F' },
  { name: 'Kaki', hex: '#7C7B4F' },
  { name: 'Bordeaux', hex: '#6B2737' },
  { name: 'Rouge', hex: '#B91C1C' },
  { name: 'Rose', hex: '#E8B4C0' },
  { name: 'Violet', hex: '#6D5A8C' },
  { name: 'Jaune', hex: '#D9B44A' },
  { name: 'Moutarde', hex: '#B8860B' },
  { name: 'Doré', hex: '#C8A96A' },
  { name: 'Argenté', hex: '#C0C0C0' },
  { name: 'Multicolore', hex: 'linear-gradient' },
];

export const COLOR_NAMES = COLORS.map((c) => c.name);

// ————— Libellés de statuts —————

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  PENDING_REVIEW: 'Candidature en cours d’examen',
  REJECTED: 'Candidature refusée',
  AWAITING_PAYMENT: 'En attente de paiement',
  PAYMENT_DONE: 'Paiement accepté',
  ONBOARDING: 'Configuration du compte',
  MEMBER: 'Membre',
};

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  PENDING_REVIEW: 'En attente de validation',
  PUBLISHED: 'En ligne',
  REJECTED: 'Refusée',
  SOLD: 'Vendue',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'En attente de paiement',
  PAID: 'Payée',
  SHIPPED: 'Expédiée',
  RECEIVED: 'Reçue',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
};

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  PENDING_REVIEW: 'Demande en cours d’examen',
  ACCEPTED: 'Retour accepté',
  REJECTED: 'Demande refusée',
  RETURN_SHIPPED: 'Retour expédié',
  REFUNDED: 'Remboursée',
};

/**
 * Avertissement photos imposé par le CDC §3.3 — affiché tel quel au-dessus de
 * l'uploader du formulaire de dépôt d'annonce.
 */
export const PHOTO_WARNING = {
  title: 'Avant d’ajouter vos photos',
  rules: [
    'Les photos ne doivent pas être prises portées sur vous ou sur une tierce personne.',
    'Exception : les vêtements couvrants (abaya, khimar, hijab, jilbeb, sittar, niqab, gants) peuvent être photographiés portés.',
    'Tout vêtement comportant une représentation d’âme (être animé) sera refusé.',
  ],
} as const;

/** Sous-catégories pour lesquelles la photo portée est tolérée (CDC §3.3). */
export const COVERING_GARMENT_SUBCATEGORIES = [
  'femme-abaya',
  'femme-khimar',
  'femme-hijab',
  'femme-jilbeb',
  'femme-haut-jilbeb',
  'femme-bas-jilbeb',
  'acc-sittar',
  'acc-niqab',
  'acc-half-niqab',
  'acc-gants-mitaines',
  'ef-abaya',
  'ef-khimar',
  'ef-hijab',
  'ef-jilbeb',
  'ef-haut-jilbeb',
  'ef-bas-jilbeb',
];

export const allowsWornPhotos = (subcategoryId: string): boolean =>
  COVERING_GARMENT_SUBCATEGORIES.includes(subcategoryId);
