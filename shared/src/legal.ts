// Les 8 pages légales du pied de page — CDC §2.2.
//
// Le forfait couvre « leur intégration au site, non leur rédaction » (CDC §2.4) :
// le contenu de chaque page vit dans apps/web/content/legal/<slug>.md et porte un
// marqueur [À FOURNIR PAR LA CLIENTE] tant que le texte définitif n'a pas été transmis.

export interface LegalPageMeta {
  slug: string;
  title: string;
  /** Libellé court dans le pied de page. */
  navLabel: string;
  /** Regroupement dans le pied de page. */
  group: 'legal' | 'vente' | 'communaute';
  description: string;
}

export const LEGAL_PAGES: LegalPageMeta[] = [
  {
    slug: 'cgu',
    title: 'Conditions générales d’utilisation',
    navLabel: 'CGU',
    group: 'legal',
    description: 'Règles d’accès et d’utilisation de la plateforme Nissa Dressing.',
  },
  {
    slug: 'conditions-de-vente',
    title: 'Conditions générales de vente',
    navLabel: 'Conditions de vente',
    group: 'vente',
    description: 'Cadre des transactions entre membres : commande, paiement, livraison.',
  },
  {
    slug: 'politique-de-remboursement',
    title: 'Politique de remboursement',
    navLabel: 'Remboursements',
    group: 'vente',
    description: 'Conditions d’ouverture d’un litige, de retour et de remboursement.',
  },
  {
    slug: 'mentions-legales',
    title: 'Mentions légales',
    navLabel: 'Mentions légales',
    group: 'legal',
    description: 'Éditeur, hébergeur et coordonnées de la plateforme.',
  },
  {
    slug: 'rgpd',
    title: 'Politique de confidentialité (RGPD)',
    navLabel: 'Confidentialité (RGPD)',
    group: 'legal',
    description:
      'Données collectées, base légale, durées de conservation, droits des membres et exercice du droit à l’effacement.',
  },
  {
    slug: 'regles-fiscales',
    title: 'Règles fiscales des plateformes (DAC7)',
    navLabel: 'Règles fiscales (DAC7)',
    group: 'vente',
    description:
      'Obligations déclaratives de la plateforme et information des vendeuses au titre de la directive DAC7.',
  },
  {
    slug: 'charte-de-moderation',
    title: 'Charte de modération des annonces',
    navLabel: 'Charte de modération',
    group: 'communaute',
    description:
      'Critères de conformité appliqués à chaque annonce avant publication : articles acceptés, photos, représentations d’âme.',
  },
  {
    slug: 'paiement-securise',
    title: 'Paiement sécurisé',
    navLabel: 'Paiement sécurisé',
    group: 'communaute',
    description:
      'Fonctionnement du séquestre Stripe Connect : l’argent n’est reversé à la vendeuse qu’à la confirmation de réception.',
  },
];

export const LEGAL_SLUGS = LEGAL_PAGES.map((p) => p.slug);

export const findLegalPage = (slug: string): LegalPageMeta | undefined =>
  LEGAL_PAGES.find((p) => p.slug === slug);

/** Marqueur inséré dans les fichiers markdown en attente du texte définitif. */
export const LEGAL_PLACEHOLDER_MARKER = '[À FOURNIR PAR LA CLIENTE]';
