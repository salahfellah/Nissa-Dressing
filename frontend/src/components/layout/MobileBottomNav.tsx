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
  const { isMember } = useAuth();

  if (!isMember) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-sable flex justify-around items-center h-16"
      aria-label="Navigation principale"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-col items-center gap-1 text-[0.6rem] uppercase tracking-wide transition-colors ${
              isActive ? 'text-orDore' : 'text-taupe'
            }`}
          >
            <Icon size={20} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
