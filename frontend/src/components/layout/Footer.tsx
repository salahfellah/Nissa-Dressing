import { LEGAL_PAGES } from '@nissa/shared';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '../ui';

const groupLabels = {
  legal: 'Légal',
  vente: 'Vente & achats',
  communaute: 'Communauté',
} as const;

/** Pied de page — porte les 8 pages légales exigées par le CDC §2.2. */
export default function Footer() {
  return (
    <footer className="bg-brunProfond text-sable pt-16 pb-24 md:pb-8 border-t-8 border-orDore">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-12">
          <div>
            <div className="bg-beigeClair p-4 rounded-sm inline-block mb-4">
              <Logo size="small" />
            </div>
            <p className="text-sm font-light leading-relaxed opacity-80">
              La marketplace de seconde main éthique, réservée aux sœurs. Chaque inscription et
              chaque annonce sont vérifiées manuellement.
            </p>
          </div>

          {(Object.keys(groupLabels) as (keyof typeof groupLabels)[]).map((group) => (
            <div key={group}>
              <h2 className="font-playfair text-lg text-orDore mb-4">{groupLabels[group]}</h2>
              <ul className="space-y-3 text-sm font-light opacity-90">
                {LEGAL_PAGES.filter((page) => page.group === group).map((page) => (
                  <li key={page.slug}>
                    <Link
                      href={`/legal/${page.slug}`}
                      className="hover:text-white hover:underline transition-all"
                    >
                      {page.navLabel}
                    </Link>
                  </li>
                ))}
                {group === 'communaute' && (
                  <li>
                    <Link href="/aide" className="hover:text-white hover:underline transition-all">
                      Centre d’aide & contact
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-sable/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-light opacity-60">
          <p>&copy; {new Date().getFullYear()} Nissa Dressing. Tous droits réservés.</p>
          <p className="flex items-center gap-2">
            <ShieldCheck size={16} />
            Paiement sécurisé via Stripe Connect — fonds conservés jusqu’à réception
          </p>
        </div>
      </div>
    </footer>
  );
}
