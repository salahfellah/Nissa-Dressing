/**
 * Réglages d'exécution : limites de débit et tâches planifiées.
 *
 * Les décorateurs @Throttle sont évalués au chargement de la classe, avant que
 * ConfigService n'existe : ces valeurs sont donc lues directement dans
 * l'environnement. Les défauts sont ceux souhaités en production ; les variables
 * ne servent qu'à assouplir la limite pour la suite de tests de bout en bout ou
 * un test de charge, sans toucher au code.
 */

const int = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const MINUTE = 60_000;

/** Plafond général, toutes routes confondues. */
export const GLOBAL_THROTTLE = {
  ttl: int(process.env.THROTTLE_TTL_MS, MINUTE),
  limit: int(process.env.THROTTLE_LIMIT, 120),
};

/**
 * Routes sensibles au bourrage d'identifiants : connexion, inscription,
 * réinitialisation de mot de passe.
 */
export const AUTH_THROTTLE = {
  default: {
    ttl: int(process.env.AUTH_THROTTLE_TTL_MS, MINUTE),
    limit: int(process.env.AUTH_THROTTLE_LIMIT, 10),
  },
};

/** Dépôt de candidature : plus coûteux (upload audio), donc plus contraint. */
export const SIGNUP_THROTTLE = {
  default: {
    ttl: int(process.env.AUTH_THROTTLE_TTL_MS, MINUTE),
    limit: int(process.env.SIGNUP_THROTTLE_LIMIT, 5),
  },
};

/** Formulaire de contact : anti-spam, fenêtre plus large. */
export const CONTACT_THROTTLE = {
  default: {
    ttl: int(process.env.CONTACT_THROTTLE_TTL_MS, 5 * MINUTE),
    limit: int(process.env.CONTACT_THROTTLE_LIMIT, 5),
  },
};

/**
 * Rythme du nettoyage des commandes impayées.
 *
 * Une tâche planifiée qui ne dit rien ne se distingue pas d'une tâche qui ne
 * tourne plus. Le rythme est donc réglable — utile pour vérifier le mécanisme
 * sans attendre dix minutes — et chaque passage laisse une trace.
 */
export const PENDING_ORDER_CLEANUP_CRON =
  process.env.PENDING_ORDER_CLEANUP_CRON?.trim() || '0 */10 * * * *';

/** Délai au-delà duquel une commande impayée libère son article, en minutes. */
export const PENDING_PAYMENT_TTL_MINUTES = int(process.env.PENDING_PAYMENT_TTL_MINUTES, 30);
