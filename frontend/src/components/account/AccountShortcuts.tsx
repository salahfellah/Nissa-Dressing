import { Heart, Package, ShoppingBag, Tag } from 'lucide-react';
import Link from 'next/link';

const SHORTCUTS = [
  { href: '/achats', label: 'Mes achats', icon: ShoppingBag },
  { href: '/ventes', label: 'Mes ventes', icon: Package },
  { href: '/mes-annonces', label: 'Mes annonces', icon: Tag },
  { href: '/favoris', label: 'Mes favoris', icon: Heart },
];

export default function AccountShortcuts() {
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      {SHORTCUTS.map(({ href, label, icon: Icon }) => (
        <li key={href}>
          <Link
            href={href}
            className="flex flex-col items-center gap-2 bg-white border border-sable rounded-sm p-4 text-center hover:border-orDore transition-colors"
          >
            <Icon size={20} className="text-orDore" />
            <span className="text-xs text-brunProfond">{label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
