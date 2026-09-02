// Schémas de validation partagés front / API.
//
// Une seule définition par formulaire : le front les branche sur react-hook-form,
// l'API les applique via ZodValidationPipe. Impossible qu'un champ valide côté
// navigateur soit refusé côté serveur (ou l'inverse).

import { z } from 'zod';
import { CONDITIONS, NEW_ONLY_CONDITIONS } from './attributes';
import { findSubcategory, isValidCategoryPair, sizeGroupFor } from './categories';
import { isValidSize } from './sizes';

const password = z
  .string()
  .min(8, { message: 'Ton mot de passe doit faire au moins 8 caractères' })
  .max(128, { message: 'Mot de passe trop long' })
  .regex(/[a-z]/, { message: 'Ajoute une minuscule à ton mot de passe' })
  .regex(/[A-Z]/, { message: 'Ajoute une majuscule à ton mot de passe' })
  .regex(/[0-9]/, { message: 'Ajoute un chiffre à ton mot de passe' });

const email = z
  .string()
  .min(1, { message: 'Nous avons besoin de ton adresse e-mail' })
  .email({ message: 'Cette adresse e-mail ne semble pas valide' })
  .transform((v) => v.trim().toLowerCase());

/**
 * Le pseudo s'affiche sur les annonces : il doit pouvoir s'écrire dans la
 * langue de la sœur. La règle précédente n'acceptait que l'ASCII, ce qui
 * refusait « Oum Khadîja » pour son seul accent et « أم خديجة » en entier — sur
 * un site qui invite pourtant à se présenter par un pseudo ou une kunya.
 *
 * `\p{L}` couvre les lettres de toutes les écritures, `\p{M}` les accents et
 * les harakat qui les accompagnent, `\p{Nd}` les chiffres décimaux.
 *
 * Le motif commence et finit par une lettre ou un chiffre. Cette seule
 * contrainte écarte d'un coup les espaces en bordure — deux pseudos qui ne
 * diffèrent que par une espace finale sont indistinguables à l'écran mais
 * distincts pour la contrainte d'unicité — et les pseudos faits de seule
 * ponctuation, qui ne désignent personne.
 */
const pseudo = z
  .string()
  .min(3, { message: 'Ton pseudo doit faire au moins 3 caractères' })
  .max(30, { message: 'Ton pseudo est un peu long (30 caractères maximum)' })
  .regex(/^[\p{L}\p{Nd}][\p{L}\p{M}\p{Nd} ._-]*[\p{L}\p{Nd}]$/u, {
    message:
      'Ton pseudo accepte les lettres, les chiffres, l’espace, le point, le tiret et l’underscore, et commence et finit par une lettre ou un chiffre',
  });

/**
 * À l'inscription, le pseudo est facultatif : une sœur qui n'en a pas en tête
 * ne doit pas être arrêtée sur le premier écran. Le champ est alors absent de
 * l'envoi — et non vide — et l'API en fabrique un à partir du prénom.
 */
const pseudoFacultatif = pseudo.optional();

/**
 * Numéro de téléphone.
 *
 * Demandé dès l'inscription : l'administratrice valide chaque candidature à la
 * main et doit pouvoir joindre la candidate — par WhatsApp le plus souvent —
 * avant de trancher. Le numéro de l'adresse de livraison, lui, n'existe
 * qu'après l'acceptation : trop tard pour ce besoin.
 *
 * Le format reste permissif : on accepte les espaces, points et indicatifs
 * tels que les femmes les écrivent, la normalisation se fait à l'affichage.
 */
const telephone = z
  .string()
  .min(1, { message: 'Nous avons besoin de ton numéro pour te joindre' })
  .regex(/^[0-9+\s().-]{6,20}$/, { message: 'Ce numéro de téléphone ne semble pas valide' });

// ————— Inscription & authentification (CDC §3.1) —————

export const signupSchema = z.object({
  /** Question d'éligibilité « Es-tu voilée ? » — le refus est terminal côté front. */
  isVeiled: z.literal(true, {
    message: 'Nissa Dressing est réservée aux femmes musulmanes voilées',
  }),
  prenom: z.string().min(1, { message: 'Ton prénom, s’il te plaît' }).max(60),
  nom: z.string().min(1, { message: 'Ton nom, s’il te plaît' }).max(60),
  pseudo: pseudoFacultatif,
  email,
  phone: telephone,
  password,
  acceptsTerms: z.literal(true, {
    message: 'Merci d’accepter les CGU et la politique de confidentialité pour continuer',
  }),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { message: 'N’oublie pas ton mot de passe' }),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(10, { message: 'Ce lien de réinitialisation ne semble plus valable' }),
  password,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ————— Espace personnel (CDC §3.2) —————

export const addressSchema = z.object({
  recipientName: z.string().min(1, { message: 'Indique le nom du destinataire' }).max(120),
  line1: z.string().min(1, { message: 'Indique ton adresse' }).max(160),
  // `nullish` et non `optional` : l'API renvoie `null` pour un champ non
  // renseigné (voir AddressDto). Le front réexpédie l'adresse telle qu'il l'a
  // reçue au moment de commander — le schéma doit donc accepter sa propre
  // sortie, sinon toute acheteuse sans complément d'adresse est bloquée.
  line2: z.string().max(160).nullish(),
  postalCode: z
    .string()
    .min(1, { message: 'Indique ton code postal' })
    .regex(/^[0-9A-Za-z\s-]{3,10}$/, { message: 'Ce code postal ne semble pas valide' }),
  city: z.string().min(1, { message: 'Indique ta ville' }).max(80),
  // Pas de `.default()` ici : il rendrait le champ optionnel en entrée et
  // désaccorderait les types d'entrée et de sortie côté react-hook-form.
  // La valeur par défaut « France » est posée dans les `defaultValues` du formulaire.
  country: z.string().min(2, { message: 'Indique ton pays' }).max(60),
  phone: z
    .string()
    .regex(/^[0-9+\s().-]{6,20}$/, { message: 'Ce numéro de téléphone ne semble pas valide' })
    .or(z.literal(''))
    .nullish(),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const profileSchema = z.object({
  prenom: z.string().min(1, { message: 'Ton prénom, s’il te plaît' }).max(60),
  nom: z.string().min(1, { message: 'Ton nom, s’il te plaît' }).max(60),
  pseudo,
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Indique ton mot de passe actuel' }),
  newPassword: password,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ————— Dépôt d'annonce (CDC §3.3) —————

export const listingSchema = z
  .object({
    title: z
      .string()
      .min(3, { message: 'Donne un titre d’au moins 3 caractères' })
      .max(80, { message: 'Ton titre est un peu long (80 caractères maximum)' }),
    categoryId: z.string().min(1, { message: 'Choisis une catégorie' }),
    subcategoryId: z.string().min(1, { message: 'Choisis une sous-catégorie' }),
    size: z.string().min(1, { message: 'Choisis une taille' }),
    material: z.string().min(1, { message: 'Indique la matière' }),
    color: z.string().min(1, { message: 'Indique la couleur' }),
    condition: z.enum(CONDITIONS as [string, ...string[]], { message: 'Indique l’état de ton article' }),
    /** null = « Sans marque » (CDC §3.3). */
    brand: z.string().max(60).nullable(),
    priceCents: z
      .number()
      .int()
      .min(100, { message: 'Le prix minimum est de 1 €' })
      .max(500000, { message: 'Le prix maximum est de 5 000 €' }),
    photos: z
      .array(z.string().min(1))
      .min(1, { message: 'Ajoute au moins une photo de ton article' })
      .max(8, { message: '8 photos maximum, c’est déjà bien !' }),
    packageFormat: z.enum(['PETIT', 'MOYEN', 'GRAND'], { message: 'Choisis un format de colis' }),
    description: z
      .string()
      .min(10, { message: 'Décris ton article en quelques mots' })
      .max(2000, { message: 'Ta description est un peu longue (2 000 caractères maximum)' }),
  })
  .superRefine((data, ctx) => {
    if (!isValidCategoryPair(data.categoryId, data.subcategoryId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['subcategoryId'],
        message: 'Cette sous-catégorie ne fait pas partie de la catégorie choisie',
      });
      return;
    }

    const group = sizeGroupFor(data.categoryId, data.subcategoryId);
    if (!isValidSize(group, data.size)) {
      ctx.addIssue({
        code: 'custom',
        path: ['size'],
        message: 'Cette taille ne figure pas dans le référentiel de la catégorie',
      });
    }

    // CDC §3.4 : sous-vêtements / maillots / chaussettes acceptés neufs uniquement.
    const found = findSubcategory(data.subcategoryId);
    if (found?.subcategory.newOnly && !NEW_ONLY_CONDITIONS.includes(data.condition as never)) {
      ctx.addIssue({
        code: 'custom',
        path: ['condition'],
        message: 'Par respect pour les acheteuses, cette catégorie n’accepte que des articles neufs',
      });
    }
  });
export type ListingInput = z.infer<typeof listingSchema>;

export const listingFiltersSchema = z.object({
  q: z.string().max(120).optional(),
  /** Toutes les annonces en ligne d'une vendeuse — lien du profil public. */
  sellerId: z.string().max(40).optional(),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  size: z.string().optional(),
  material: z.string().optional(),
  color: z.string().optional(),
  condition: z.string().optional(),
  brand: z.string().optional(),
  priceMin: z.coerce.number().int().min(0).optional(),
  priceMax: z.coerce.number().int().min(0).optional(),
  sort: z.enum(['recent', 'price_asc', 'price_desc']).default('recent'),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(60).default(24),
});
export type ListingFilters = z.infer<typeof listingFiltersSchema>;

// ————— Modération (CDC §3.9) —————

export const moderationSchema = z.object({
  accepted: z.boolean(),
  /** Motif optionnel, transmis dans l'e-mail de refus (CDC §3.3). */
  reason: z.string().max(500).optional().or(z.literal('')),
});
export type ModerationInput = z.infer<typeof moderationSchema>;

// ————— Commande (CDC §3.6) —————

export const createOrderSchema = z.object({
  listingId: z.string().min(1),
  shippingAddress: addressSchema,
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const messageSchema = z.object({
  body: z
    .string()
    .min(1, { message: 'Ton message est vide' })
    .max(2000, { message: 'Ton message est un peu long (2 000 caractères maximum)' }),
});
export type MessageInput = z.infer<typeof messageSchema>;

// ————— Retours (CDC §3.7) —————

export const returnRequestSchema = z.object({
  reason: z.enum(['DAMAGED', 'NOT_AS_DESCRIBED', 'WRONG_ITEM', 'NOT_RECEIVED', 'OTHER'], {
    message: 'Choisis un motif',
  }),
  description: z
    .string()
    .min(10, { message: 'Décris le souci en quelques mots, cela nous aidera à t’aider' })
    .max(2000),
  photos: z
    .array(z.string().min(1))
    .min(1, { message: 'Ajoute au moins une photo de ton article de l’article et du problème' })
    .max(6, { message: '6 photos maximum' }),
});
export type ReturnRequestInput = z.infer<typeof returnRequestSchema>;

export const RETURN_REASON_LABELS: Record<ReturnRequestInput['reason'], string> = {
  DAMAGED: 'Article endommagé',
  NOT_AS_DESCRIBED: 'Article non conforme à l’annonce',
  WRONG_ITEM: 'Article reçu différent',
  NOT_RECEIVED: 'Colis jamais reçu',
  OTHER: 'Autre motif',
};

// ————— Aide & support (CDC §3.8) —————

export const contactSchema = z.object({
  email,
  /** Pseudo ou kunya — CDC §3.8. */
  pseudo: z.string().min(1, { message: 'Ton pseudo ou ta kunya, s’il te plaît' }).max(60),
  message: z
    .string()
    .min(10, { message: 'Explique-nous ton souci en quelques mots' })
    .max(3000, { message: 'Ton message est un peu long' }),
});
export type ContactInput = z.infer<typeof contactSchema>;

// ————— Paramètres plateforme (CDC §3.9) —————

export const settingsSchema = z.object({
  accessFeeCents: z.number().int().min(0).max(100000),
  freeBoostDays: z.number().int().min(0).max(365),
  boostPriceCents: z.number().int().min(0).max(100000),
  commissionPercent: z.number().min(0).max(50),
  commissionFixedCents: z.number().int().min(0).max(10000),
  commissionPayer: z.enum(['BUYER', 'SELLER']),
  shippingFeesCents: z.object({
    PETIT: z.number().int().min(0).max(100000),
    MOYEN: z.number().int().min(0).max(100000),
    GRAND: z.number().int().min(0).max(100000),
  }),
  supportEmail: z.string().email({ message: 'Cette adresse e-mail ne semble pas valide' }),
  // Au moins un jour, sans quoi la réception serait acquise avant l'arrivée
  // du colis ; 90 jours au plus, au-delà le séquestre n'a plus de sens.
  autoConfirmDays: z.number().int().min(1).max(90),
});
export type SettingsInput = z.infer<typeof settingsSchema>;
