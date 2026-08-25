// Arbre de catégories, retranscrit du CDC §3.4 (tableau Catégorie / Sous-catégories).
// Le placement sous-vêtements/maillots/chaussettes est en attente d'arbitrage (CDC §6) :
// actuellement rattaché à "Accessoires" comme dans le tableau source.

export interface Category {
  id: string;
  label: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  label: string;
  note?: string; // mention conditionnelle du CDC (ex : burkini, manteaux légiférés)
}

const sub = (id: string, label: string, note?: string): Subcategory => ({ id, label, note });

export const categories: Category[] = [
  {
    id: 'femme',
    label: 'Femme',
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
      sub('femme-hijab', 'Hijab'),
      sub('femme-bas-jilbeb', 'Bas de jilbeb'),
      sub('femme-haut-jilbeb', 'Haut de jilbeb'),
      sub('femme-burkini', 'Burkini', 'Accepté uniquement s’il est mastour de haut en bas'),
      sub('femme-manteaux-vestes', 'Manteaux / vestes', 'Uniquement si légiférés'),
      sub('femme-combinaisons', 'Combinaisons'),
    ],
  },
  {
    id: 'accessoires',
    label: 'Accessoires',
    subcategories: [
      sub('acc-epingles-aimants', 'Épingles / aimants'),
      sub('acc-sous-hijab', 'Sous-hijab'),
      sub('acc-gants-mitaines', 'Gants / mitaines'),
      sub('acc-sac', 'Sac'),
      sub('acc-sac-a-dos', 'Sac à dos'),
      sub('acc-sac-a-langer', 'Sac à langer'),
      sub('acc-manchettes', 'Manchettes'),
      sub('acc-echarpe', 'Écharpe'),
      sub('acc-collants', 'Collants'),
      sub('acc-half-niqab', 'Half niqab'),
      sub('acc-niqab', 'Niqab'),
      sub('acc-sittar', 'Sittar'),
      sub('acc-sous-vetements-maillots', 'Sous-vêtements / maillots de bain', 'Neufs uniquement'),
      sub('acc-chaussettes', 'Chaussettes', 'Neuves uniquement'),
    ],
  },
  {
    id: 'enfant-fille',
    label: 'Enfant — Fille',
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
      sub('ef-hijab', 'Hijab'),
      sub('ef-bas-jilbeb', 'Bas de jilbeb'),
      sub('ef-haut-jilbeb', 'Haut de jilbeb'),
      sub('ef-combinaisons', 'Combinaisons'),
    ],
  },
  {
    id: 'enfant-garcon',
    label: 'Enfant — Garçon',
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
    label: 'Bébé — Fille',
    subcategories: [
      sub('bf-bodies', 'Bodies'),
      sub('bf-pyjama', 'Pyjama'),
      sub('bf-ensemble', 'Ensemble'),
      sub('bf-robe', 'Robe'),
      sub('bf-vestes-manteaux', 'Vestes / manteaux'),
      sub('bf-chaussons', 'Chaussons'),
      sub('bf-tee-shirt', 'Tee-shirt'),
      sub('bf-pull', 'Pull'),
      sub('bf-haut-pyjama', 'Haut de pyjama'),
      sub('bf-bas-pyjama', 'Bas de pyjama'),
      sub('bf-debardeur', 'Débardeur'),
      sub('bf-chaussettes', 'Chaussettes'),
      sub('bf-jupe', 'Jupe'),
      sub('bf-combinaisons', 'Combinaisons'),
      sub('bf-grenouilleres', 'Grenouillères'),
      sub('bf-shorts', 'Shorts'),
    ],
  },
  {
    id: 'bebe-garcon',
    label: 'Bébé — Garçon',
    subcategories: [
      sub('bg-bodies', 'Bodies'),
      sub('bg-pyjama', 'Pyjama'),
      sub('bg-ensemble', 'Ensemble'),
      sub('bg-vestes-manteaux', 'Vestes / manteaux'),
      sub('bg-chaussons', 'Chaussons'),
      sub('bg-tee-shirt', 'Tee-shirt'),
      sub('bg-pull', 'Pull'),
      sub('bg-haut-pyjama', 'Haut de pyjama'),
      sub('bg-bas-pyjama', 'Bas de pyjama'),
      sub('bg-debardeur', 'Débardeur'),
      sub('bg-chaussettes', 'Chaussettes'),
      sub('bg-grenouilleres', 'Grenouillères'),
      sub('bg-pantalons', 'Pantalons'),
      sub('bg-shorts', 'Shorts'),
    ],
  },
];

export const findCategory = (id: string) => categories.find((c) => c.id === id);

export const findSubcategory = (categoryId: string, subcategoryId: string) =>
  findCategory(categoryId)?.subcategories.find((s) => s.id === subcategoryId);
