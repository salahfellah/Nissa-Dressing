import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Providers } from '@/lib/providers';
import './globals.css';

/*
 * Polices hébergées localement (public/fonts), et non chargées depuis le CDN
 * Google. Deux raisons :
 *  - le navigateur des visiteuses ne contacte aucun tiers, ce que la politique
 *    de confidentialité du site s'engage à respecter ;
 *  - le build ne dépend pas d'un accès réseau sortant.
 * Ce sont des polices variables : un seul fichier couvre toutes les graisses.
 */
const montserrat = localFont({
  src: [{ path: '../../public/fonts/montserrat-variable.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-montserrat-loaded',
  display: 'swap',
  fallback: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
});

const playfair = localFont({
  src: [
    { path: '../../public/fonts/playfair-variable.woff2', weight: '400 900', style: 'normal' },
    { path: '../../public/fonts/playfair-italic-variable.woff2', weight: '400 900', style: 'italic' },
  ],
  variable: '--font-playfair-loaded',
  display: 'swap',
  fallback: ['ui-serif', 'Georgia', 'Times New Roman', 'serif'],
});

export const metadata: Metadata = {
  title: {
    default: 'Nissa Dressing — la marketplace des sœurs',
    template: '%s · Nissa Dressing',
  },
  description:
    'Marketplace de vêtements et accessoires conformes entre sœurs : abayas, khimars, jilbebs, niqabs, vêtements enfants et bébés. Inscriptions et annonces vérifiées manuellement, paiement sécurisé.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#4A4136',
  width: 'device-width',
  initialScale: 1,
  // Le zoom reste possible : le bloquer nuit à l'accessibilité.
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${montserrat.variable} ${playfair.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
