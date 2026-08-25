import type { NextConfig } from 'next';
import { join } from 'node:path';

const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const apiUrl = new URL(apiOrigin);

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Le paquet @nissa/shared vit à côté du front (../shared) et y est relié par une
  // dépendance `file:`. Sans cette racine explicite, Turbopack borne sa résolution
  // au dossier frontend/ et ne suit pas le lien symbolique vers le paquet.
  turbopack: {
    root: join(import.meta.dirname, '..'),
  },
  outputFileTracingRoot: join(import.meta.dirname, '..'),

  // Le paquet est distribué compilé, mais Next doit le transpiler pour l'inclure
  // dans les bundles client.
  transpilePackages: ['@nissa/shared'],

  images: {
    remotePatterns: [
      {
        protocol: apiUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: apiUrl.hostname,
        port: apiUrl.port || undefined,
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
