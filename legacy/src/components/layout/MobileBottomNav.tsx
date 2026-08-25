import { Home, Search, PlusCircle, MessageCircle, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/catalogue', label: 'Accueil', icon: Home },
  { to: '/recherche', label: 'Recherche', icon: Search },
  { to: '/vendre', label: 'Vendre', icon: PlusCircle },
  { to: '/messages', label: 'Messages', icon: MessageCircle },
  { to: '/compte', label: 'Compte', icon: User },
];

export default function MobileBottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-sable flex justify-around items-center h-16">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[0.6rem] uppercase tracking-wide ${
              isActive ? 'text-orDore' : 'text-taupe'
            }`
          }
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
