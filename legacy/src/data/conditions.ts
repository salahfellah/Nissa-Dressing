import type { ItemCondition, PackageFormat } from '../types';

export const conditionLabels: Record<ItemCondition, string> = {
  neuf_etiquette: 'Neuf avec étiquette',
  neuf: 'Neuf sans étiquette',
  tres_bon_etat: 'Très bon état',
  bon_etat: 'Bon état',
  satisfaisant: 'Satisfaisant',
};

export const packageFormats: { id: PackageFormat; label: string; help: string }[] = [
  { id: 'petit', label: 'Petit', help: 'Tient dans une grande enveloppe' },
  { id: 'moyen', label: 'Moyen', help: 'Tient dans une boîte à chaussures' },
  { id: 'grand', label: 'Grand', help: 'Tient dans un carton de déménagement' },
];

export const materials = [
  'Coton',
  'Polyester',
  'Viscose',
  'Soie',
  'Laine',
  'Lin',
  'Jersey',
  'Nylon',
  'Crêpe',
  'Autre',
];

export const colors = [
  'Noir',
  'Blanc',
  'Beige',
  'Marron',
  'Gris',
  'Bleu',
  'Vert',
  'Rouge',
  'Rose',
  'Violet',
  'Jaune',
  'Doré',
  'Argenté',
  'Multicolore',
];

// Référentiel des tailles : non fourni par la cliente à ce stade (CDC §6, point à arbitrer).
// Placeholder générique en attendant — bloque le formulaire de dépôt d'annonce final (Sprint 3).
export const sizesPlaceholder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Taille unique'];
