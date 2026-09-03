'use client';

import { Home, MessageCircle, PlusCircle, Search, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const items = [
  { href: '/catalogue', label: 'Accueil', icon: Home },
  { href: '/recherche', label: 'Recherche', icon: Search },
  { href: '/vendre', label: 'Vendre', icon: PlusCircle },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/compte', label: 'Compte', icon: User },
];

/** Barre de navigation mobile — CDC : le site doit être pleinement utilisable au doigt. */
export default function MobileBottomNav() {
  const pathname = usePathname();
  const { isMember, user } = useAuth();

  if (!isMember) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-sable flex justify-around items-center h-16"
      aria-label="Navigation principale"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        // Sur mobile, c'est ici que la sœur retrouve son compte : autant qu'elle
        // y lise son pseudo, seul endroit de l'écran qui dise sous quel compte
        // elle navigue. Un pseudo garde sa casse — « Oum Khadîja » n'est pas un
        // libellé de menu — et se coupe proprement s'il est long.
        const pseudo = href === '/compte' ? (user?.pseudo?.trim() ?? '') : '';
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-col items-center gap-1 text-[0.6rem] uppercase tracking-wide transition-colors max-w-[20%] ${
              isActive ? 'text-orDore' : 'text-taupe'
            }`}
          >
            <Icon size={20} />
            <span className={`max-w-full truncate ${pseudo ? 'normal-case' : ''}`}>
              {pseudo || label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
