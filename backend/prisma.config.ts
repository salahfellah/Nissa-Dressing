import { defineConfig, env } from 'prisma/config';

// Prisma 7 ne charge plus .env automatiquement : on le fait ici pour que
// `prisma migrate`, `prisma db push` et `prisma studio` trouvent DATABASE_URL.
try {
  process.loadEnvFile();
} catch {
  // .env absent (CI, production avec variables déjà injectées) — on continue.
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
});
