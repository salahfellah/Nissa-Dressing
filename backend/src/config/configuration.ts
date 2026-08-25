import { join } from 'node:path';

const bool = (value: string | undefined, fallback = false): boolean =>
  value === undefined ? fallback : ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());

const int = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Valeurs de repli, pratiques en développement et dangereuses en production.
 * Elles sont rejetées explicitement au démarrage (voir verifierLaProduction).
 */
const DEV_ACCESS_SECRET = 'dev-access-secret';
const DEV_REFRESH_SECRET = 'dev-refresh-secret';
const DEV_ADMIN_PASSWORD = 'Admin1234';

export interface AppConfig {
  env: string;
  isProduction: boolean;
  port: number;
  webOrigin: string;
  apiPublicUrl: string;
  databaseUrl: string;
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTtl: string;
    refreshTtlDays: number;
  };
  cookieSecure: boolean;
  admin: { email: string; password: string; pseudo: string };
  stripe: {
    /** `live` dès qu'une clé secrète est fournie, `mock` sinon (parcours simulé de bout en bout). */
    mode: 'live' | 'mock';
    secretKey: string;
    webhookSecret: string;
    boostPriceId: string;
  };
  mail: {
    /** `smtp` si un hôte est configuré, `file` sinon (les e-mails sont écrits sur disque). */
    mode: 'smtp' | 'file';
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
    outDir: string;
  };
  uploads: {
    dir: string;
    maxPhotoBytes: number;
    maxAudioBytes: number;
  };
}

/**
 * Refuse de démarrer en production avec une configuration dangereuse.
 *
 * Ces erreurs sont silencieuses autrement : un secret de développement oublié
 * laisse n'importe qui forger un jeton d'administratrice, et des cookies sans
 * `Secure` voyagent en clair. Mieux vaut un démarrage qui échoue bruyamment
 * qu'un site en ligne discrètement vulnérable.
 */
function verifierLaProduction(config: AppConfig): void {
  if (!config.isProduction) return;

  const problemes: string[] = [];

  if (!config.databaseUrl) {
    problemes.push('DATABASE_URL est absent.');
  }
  // Un secret « de remplacement » recopié depuis .env.example est assez long
  // pour passer un simple test de taille : on rejette aussi les formulations
  // qui trahissent une valeur d'exemple jamais remplacée.
  const secretDouteux = (valeur: string): boolean =>
    valeur.length < 32 || /dev|remplacer|change|exemple|secret-a/i.test(valeur);

  if (config.jwt.accessSecret === DEV_ACCESS_SECRET || secretDouteux(config.jwt.accessSecret)) {
    problemes.push(
      'JWT_ACCESS_SECRET est absent, trop court, ou encore une valeur d’exemple. ' +
        'Génère-le : node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"',
    );
  }
  if (config.jwt.refreshSecret === DEV_REFRESH_SECRET || secretDouteux(config.jwt.refreshSecret)) {
    problemes.push('JWT_REFRESH_SECRET est absent, trop court, ou encore une valeur d’exemple.');
  }
  if (config.jwt.accessSecret === config.jwt.refreshSecret) {
    problemes.push('JWT_ACCESS_SECRET et JWT_REFRESH_SECRET doivent être différents.');
  }
  if (config.admin.password === DEV_ADMIN_PASSWORD) {
    problemes.push('ADMIN_PASSWORD est encore le mot de passe de démonstration.');
  }
  if (!config.cookieSecure) {
    problemes.push(
      'COOKIE_SECURE=false en production : les cookies de session circuleraient en clair.',
    );
  }
  if (config.webOrigin.startsWith('http://')) {
    problemes.push(`WEB_ORIGIN n'est pas en HTTPS (${config.webOrigin}).`);
  }
  if (config.stripe.mode === 'live' && !config.stripe.webhookSecret) {
    problemes.push(
      'STRIPE_WEBHOOK_SECRET est absent : les paiements ne pourraient pas être confirmés de façon fiable.',
    );
  }
  if (config.stripe.mode === 'mock') {
    problemes.push(
      'STRIPE_SECRET_KEY est absente : les paiements seraient simulés, donc aucun encaissement réel.',
    );
  }

  if (problemes.length) {
    throw new Error(
      `Configuration de production incomplète :\n  - ${problemes.join('\n  - ')}\n` +
        'Corrige ces points dans les variables d’environnement avant de démarrer.',
    );
  }
}

export const configuration = (): AppConfig => {
  const env = process.env.NODE_ENV ?? 'development';
  const isProduction = env === 'production';
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? '';
  const smtpHost = process.env.SMTP_HOST?.trim() ?? '';
  const uploadDir = process.env.UPLOAD_DIR?.trim() || 'var/uploads';

  const config: AppConfig = {
    env,
    isProduction,
    port: int(process.env.PORT, 4000),
    webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    apiPublicUrl: process.env.API_PUBLIC_URL ?? 'http://localhost:4000',
    databaseUrl: process.env.DATABASE_URL ?? '',
    jwt: {
      accessSecret: process.env.JWT_ACCESS_SECRET ?? DEV_ACCESS_SECRET,
      refreshSecret: process.env.JWT_REFRESH_SECRET ?? DEV_REFRESH_SECRET,
      accessTtl: process.env.ACCESS_TOKEN_TTL ?? '15m',
      refreshTtlDays: int(process.env.REFRESH_TOKEN_TTL_DAYS, 30),
    },
    // En production, les cookies sont `Secure` par défaut : il faut désormais
    // désactiver explicitement la protection, et non penser à l'activer.
    cookieSecure: bool(process.env.COOKIE_SECURE, isProduction),
    admin: {
      email: process.env.ADMIN_EMAIL ?? 'admin@nissa-dressing.fr',
      password: process.env.ADMIN_PASSWORD ?? DEV_ADMIN_PASSWORD,
      pseudo: process.env.ADMIN_PSEUDO ?? 'administratrice',
    },
    stripe: {
      mode: stripeSecretKey ? 'live' : 'mock',
      secretKey: stripeSecretKey,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
      boostPriceId: process.env.STRIPE_BOOST_PRICE_ID ?? '',
    },
    mail: {
      mode: smtpHost ? 'smtp' : 'file',
      host: smtpHost,
      port: int(process.env.SMTP_PORT, 587),
      user: process.env.SMTP_USER ?? '',
      password: process.env.SMTP_PASSWORD ?? '',
      from: process.env.MAIL_FROM ?? 'Nissa Dressing <ne-pas-repondre@nissa-dressing.fr>',
      outDir: join(process.cwd(), 'var', 'mail'),
    },
    uploads: {
      dir: join(process.cwd(), uploadDir),
      maxPhotoBytes: int(process.env.MAX_PHOTO_SIZE_MB, 8) * 1024 * 1024,
      maxAudioBytes: int(process.env.MAX_AUDIO_SIZE_MB, 15) * 1024 * 1024,
    },
  };

  verifierLaProduction(config);

  return config;
};
