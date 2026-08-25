// Référentiel des tailles.
//
// CDC §6 le classe « À fournir » (capture Telegram non transmise à ce jour). Ce fichier
// tient lieu de référentiel par défaut : il est complet et cohérent, et se remplace en
// éditant les tableaux ci-dessous — aucune autre partie du code ne code de taille en dur.
// Les valeurs sont stockées telles quelles (chaîne) sur l'annonce.

export type SizeGroup = 'femme' | 'enfant' | 'bebe' | 'unique' | 'pointure-femme' | 'pointure-bebe';

export interface SizeReferential {
  group: SizeGroup;
  label: string;
  /** Aide affichée sous le sélecteur de taille du formulaire de dépôt. */
  help?: string;
  values: string[];
}

export const SIZE_REFERENTIALS: Record<SizeGroup, SizeReferential> = {
  femme: {
    group: 'femme',
    label: 'Taille femme',
    help: 'Indique la taille figurant sur l’étiquette. En cas de doute, précise les mensurations dans la description.',
    values: [
      'XS (34)',
      'S (36)',
      'S (38)',
      'M (40)',
      'M (42)',
      'L (44)',
      'L (46)',
      'XL (48)',
      'XL (50)',
      'XXL (52)',
      'XXL (54)',
      '3XL (56)',
      'Taille unique',
    ],
  },
  enfant: {
    group: 'enfant',
    label: 'Taille enfant',
    help: 'Taille exprimée en âge, comme sur l’étiquette.',
    values: [
      '2 ans',
      '3 ans',
      '4 ans',
      '5 ans',
      '6 ans',
      '7 ans',
      '8 ans',
      '9 ans',
      '10 ans',
      '11 ans',
      '12 ans',
      '13 ans',
      '14 ans',
      '15 ans',
      '16 ans',
    ],
  },
  bebe: {
    group: 'bebe',
    label: 'Taille bébé',
    help: 'Taille exprimée en mois, comme sur l’étiquette.',
    values: [
      'Prématuré',
      'Naissance',
      '1 mois',
      '3 mois',
      '6 mois',
      '9 mois',
      '12 mois',
      '18 mois',
      '24 mois',
    ],
  },
  'pointure-femme': {
    group: 'pointure-femme',
    label: 'Pointure',
    values: ['35', '36', '37', '38', '39', '40', '41', '42', '43', 'Taille unique'],
  },
  'pointure-bebe': {
    group: 'pointure-bebe',
    label: 'Pointure bébé / enfant',
    values: ['16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28'],
  },
  unique: {
    group: 'unique',
    label: 'Taille',
    values: ['Taille unique', 'Petit', 'Moyen', 'Grand'],
  },
};

export const sizesFor = (group: SizeGroup): string[] => SIZE_REFERENTIALS[group].values;

export const ALL_SIZES: string[] = Array.from(
  new Set(Object.values(SIZE_REFERENTIALS).flatMap((r) => r.values)),
);

export const isValidSize = (group: SizeGroup, value: string): boolean =>
  SIZE_REFERENTIALS[group].values.includes(value);
