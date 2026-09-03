'use client';

import {
  BarChart3,
  ClipboardCheck,
  LifeBuoy,
  Package,
  Settings,
  ShoppingBag,
  Undo2,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RequireAdmin } from '@/components/guards';
import { Logo } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';

const NAV = [
  { href: '/admin', label: 'Tableau de bord', icon: BarChart3, exact: true },
  { href: '/admin/inscriptions', label: 'Inscriptions', icon: UserCheck },
  { href: '/admin/annonces', label: 'Annonces', icon: ClipboardCheck },
  { href: '/admin/commandes', label: 'Commandes', icon: ShoppingBag },
  { href: '/admin/litiges', label: 'Litiges & retours', icon: Undo2 },
  { href: '/admin/membres', label: 'Membres', icon: Package },
  { href: '/admin/support', label: 'Support & e-mails', icon: LifeBuoy },
  { href: '/admin/parametres', label: 'Paramètres', icon: Settings },
];

/** Back-office — CDC §3.9. Chrome distinct du site public. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <RequireAdmin>
      <div className="min-h-screen bg-beigeClair">
        <header className="bg-brunProfond text-beigeClair">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-beigeClair px-3 py-2 rounded-sm">
                <Logo size="tiny" />
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-orDore">
                Administration
              </span>
            </div>
            <div className="flex items-center gap-4 min-w-0">
              {/* Le back-office et le site se ressemblent assez pour qu'on oublie
                  sous quel compte on tranche : le pseudo le rappelle. */}
              {user && (
                <span className="inline-block text-xs text-beigeClair/70 truncate max-w-40">
                  Connectée : <span className="text-beigeClair">{user.pseudo}</span>
                </span>
              )}
              <Link
                href="/catalogue"
                className="text-xs underline hover:text-orDore whitespace-nowrap"
              >
                Retour au site
              </Link>
            </div>
          </div>

          <nav className="border-t border-beigeClair/10" aria-label="Navigation du back-office">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <ul className="flex gap-1 overflow-x-auto no-scrollbar">
                {NAV.map(({ href, label, icon: Icon, exact }) => {
                  const isActive = exact ? pathname === href : pathname.startsWith(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex items-center gap-2 px-4 py-3 text-xs uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${
                          isActive
                            ? 'border-orDore text-orDore'
                            : 'border-transparent text-beigeClair/70 hover:text-beigeClair'
                        }`}
                      >
                        <Icon size={15} />
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      </div>
    </RequireAdmin>
  );
}
