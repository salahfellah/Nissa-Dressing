// Arbre de catégories — retranscription intégrale du tableau CDC §3.4.
// Les `note` reprennent mot pour mot les mentions conditionnelles du cahier des charges :
// elles sont affichées à la vendeuse au moment du dépôt d'annonce et servent de rappel
// à l'administratrice en file de modération.

import type { SizeGroup } from './sizes';

export interface Subcategory {
  id: string;
  label: string;
  /** Mention conditionnelle du CDC (burkini mastour, manteaux légiférés, articles neufs uniquement). */
  note?: string;
  /** Force un référentiel de tailles différent de celui de la catégorie parente. */
  sizeGroup?: SizeGroup;
  /** L'article n'est acceptable que neuf (CDC §3.4 : sous-vêtements, maillots, chaussettes). */
  newOnly?: boolean;
}

export interface Category {
  id: string;
  label: string;
  /** Libellé court pour la navigation mobile. */
  shortLabel: string;
  sizeGroup: SizeGroup;
  subcategories: Subcategory[];
}

const sub = (
  id: string,
  label: string,
  extra: Omit<Subcategory, 'id' | 'label'> = {},
): Subcategory => ({ id, label, ...extra });

const UNIQUE: Pick<Subcategory, 'sizeGroup'> = { sizeGroup: 'unique' };

export const CATEGORIES: Category[] = [
  {
    id: 'femme',
    label: 'Femme',
    shortLabel: 'Femme',
    sizeGroup: 'femme',
    subcategories: [
      sub('femme-pull', 'Pull'),
      sub('femme-tee-shirt', 'Tee-shirt'),
      sub('femme-debardeur', 'Débardeur'),
      sub('femme-robe', 'Robe'),
      sub('femme-jupe', 'Jupe'),
      sub('femme-abaya', 'Abaya'),
      sub('femme-khimar', 'Khimar'),
      sub('femme-short', 'Short'),
      sub('femme-pyjama', 'Pyjama'),
      sub('femme-haut-pyjama', 'Haut de pyjama'),
      sub('femme-bas-pyjama', 'Bas de pyjama'),
      sub('femme-nuisette', 'Nuisette'),
      sub('femme-jilbeb', 'Jilbeb'),
      sub('femme-ensemble', 'Ensemble'),
      sub('femme-hijab', 'Hijab', UNIQUE),
      sub('femme-bas-jilbeb', 'Bas de jilbeb'),
      sub('femme-haut-jilbeb', 'Haut de jilbeb'),
      sub('femme-burkini', 'Burkini', {
        note: 'Accepté uniquement s’il est mastour de haut en bas.',
      }),
      sub('femme-manteaux-vestes', 'Manteaux / vestes', {
        note: 'Uniquement si légiférés.',
      }),
      sub('femme-combinaisons', 'Combinaisons'),
    ],
  },
  {
    id: 'accessoires',
    label: 'Accessoires',
    shortLabel: 'Accessoires',
    sizeGroup: 'unique',
    subcategories: [
      sub('acc-epingles-aimants', 'Épingles / aimants'),
      sub('acc-sous-hijab', 'Sous-hijab'),
      sub('acc-gants-mitaines', 'Gants / mitaines'),
      sub('acc-sac', 'Sac'),
      sub('acc-sac-a-dos', 'Sac à dos'),
      sub('acc-sac-a-langer', 'Sac à langer'),
      sub('acc-manchettes', 'Manchettes'),
      sub('acc-echarpe', 'Écharpe'),
      sub('acc-collants', 'Collants', { sizeGroup: 'femme' }),
      sub('acc-half-niqab', 'Half niqab'),
      sub('acc-niqab', 'Niqab'),
      sub('acc-sittar', 'Sittar'),
      // CDC §6 : le placement définitif (Femme ou Accessoires) reste à arbitrer.
      // Rattachés à Accessoires, conformément au tableau source §3.4.
      sub('acc-sous-vetements-maillots', 'Sous-vêtements / maillots de bain', {
        note: 'Neufs uniquement.',
        newOnly: true,
        sizeGroup: 'femme',
      }),
      sub('acc-chaussettes', 'Chaussettes', {
        note: 'Neuves uniquement.',
        newOnly: true,
        sizeGroup: 'pointure-femme',
      }),
    ],
  },
  {
    id: 'enfant-fille',
    label: 'Enfant fille',
    shortLabel: 'Fille',
    sizeGroup: 'enfant',
    subcategories: [
      sub('ef-pull', 'Pull'),
      sub('ef-tee-shirt', 'Tee-shirt'),
      sub('ef-debardeur', 'Débardeur'),
      sub('ef-robe', 'Robe'),
      sub('ef-jupe', 'Jupe'),
      sub('ef-abaya', 'Abaya'),
      sub('ef-khimar', 'Khimar'),
      sub('ef-short', 'Short'),
      sub('ef-pyjama', 'Pyjama'),
      sub('ef-haut-pyjama', 'Haut de pyjama'),
      sub('ef-bas-pyjama', 'Bas de pyjama'),
      sub('ef-jilbeb', 'Jilbeb'),
      sub('ef-ensemble', 'Ensemble'),
      sub('ef-hijab', 'Hijab', UNIQUE),
      sub('ef-bas-jilbeb', 'Bas de jilbeb'),
      sub('ef-haut-jilbeb', 'Haut de jilbeb'),
      sub('ef-combinaisons', 'Combinaisons'),
    ],
  },
  {
    id: 'enfant-garcon',
    label: 'Enfant garçon',
    shortLabel: 'Garçon',
    sizeGroup: 'enfant',
    subcategories: [
      sub('eg-qamis', 'Qamis'),
      sub('eg-ensemble', 'Ensemble'),
      sub('eg-hauts-pulls', 'Hauts / pulls'),
      sub('eg-debardeur', 'Débardeur'),
      sub('eg-pantalon', 'Pantalon'),
      sub('eg-tee-shirt', 'Tee-shirt'),
      sub('eg-manteaux-vestes', 'Manteaux / vestes'),
    ],
  },
  {
    id: 'bebe-fille',
    label: 'Bébé fille',
    shortLabel: 'Bébé fille',
    sizeGroup: 'bebe',
    subcategories: [
      sub('bf-bodies', 'Bodies'),
      sub('bf-pyjama', 'Pyjama'),
      sub('bf-ensemble', 'Ensemble'),
      sub('bf-robe', 'Robe'),
      sub('bf-vestes-manteaux', 'Vestes / manteaux'),
      sub('bf-chaussons', 'Chaussons', { sizeGroup: 'pointure-bebe' }),
      sub('bf-tee-shirt', 'Tee-shirt'),
      sub('bf-pull', 'Pull'),
      sub('bf-haut-pyjama', 'Haut de pyjama'),
      sub('bf-bas-pyjama', 'Bas de pyjama'),
      sub('bf-debardeur', 'Débardeur'),
      sub('bf-chaussettes', 'Chaussettes', { sizeGroup: 'pointure-bebe' }),
      sub('bf-jupe', 'Jupe'),
      sub('bf-combinaisons', 'Combinaisons'),
      sub('bf-grenouilleres', 'Grenouillères'),
      sub('bf-shorts', 'Shorts'),
    ],
  },
  {
    id: 'bebe-garcon',
    label: 'Bébé garçon',
    shortLabel: 'Bébé garçon',
    sizeGroup: 'bebe',
    subcategories: [
      sub('bg-bodies', 'Bodies'),
      sub('bg-pyjama', 'Pyjama'),
      sub('bg-ensemble', 'Ensemble'),
      sub('bg-vestes-manteaux', 'Vestes / manteaux'),
      sub('bg-chaussons', 'Chaussons', { sizeGroup: 'pointure-bebe' }),
      sub('bg-tee-shirt', 'Tee-shirt'),
      sub('bg-pull', 'Pull'),
      sub('bg-haut-pyjama', 'Haut de pyjama'),
      sub('bg-bas-pyjama', 'Bas de pyjama'),
      sub('bg-debardeur', 'Débardeur'),
      sub('bg-chaussettes', 'Chaussettes', { sizeGroup: 'pointure-bebe' }),
      sub('bg-grenouilleres', 'Grenouillères'),
      sub('bg-pantalons', 'Pantalons'),
      sub('bg-shorts', 'Shorts'),
    ],
  },
];

const CATEGORY_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

const SUBCATEGORY_BY_ID = new Map(
  CATEGORIES.flatMap((c) =>
    c.subcategories.map((s) => [s.id, { category: c, subcategory: s }] as const),
  ),
);

export const findCategory = (id: string): Category | undefined => CATEGORY_BY_ID.get(id);

export const findSubcategory = (subcategoryId: string) => SUBCATEGORY_BY_ID.get(subcategoryId);

/** Vrai si la sous-catégorie appartient bien à la catégorie — garde-fou côté API. */
export function isValidCategoryPair(categoryId: string, subcategoryId: string): boolean {
  const found = SUBCATEGORY_BY_ID.get(subcategoryId);
  return !!found && found.category.id === categoryId;
}

/** Référentiel de tailles applicable : la sous-catégorie prime sur la catégorie. */
export function sizeGroupFor(categoryId: string, subcategoryId: string): SizeGroup {
  const found = SUBCATEGORY_BY_ID.get(subcategoryId);
  if (found?.subcategory.sizeGroup) return found.subcategory.sizeGroup;
  return found?.category.sizeGroup ?? CATEGORY_BY_ID.get(categoryId)?.sizeGroup ?? 'unique';
}

export function categoryPathLabel(categoryId: string, subcategoryId: string): string {
  const found = SUBCATEGORY_BY_ID.get(subcategoryId);
  if (!found) return findCategory(categoryId)?.label ?? categoryId;
  return `${found.category.label} · ${found.subcategory.label}`;
}
