'use client';

import { CATEGORIES } from '@nissa/shared';
import { Heart, LogOut, MessageCircle, Plus, Search, Shield, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Logo } from '../ui';

export default function Header() {
  const router = useRouter();
  const { user, isMember, isAdmin, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [unread, setUnread] = useState(0);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!isMember) return;
    api
      .get<{ count: number }>('/messages/unread-count')
      .then(({ count }) => setUnread(count))
      .catch(() => undefined);
  }, [isMember]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    router.push(query.trim() ? `/recherche?q=${encodeURIComponent(query.trim())}` : '/recherche');
  };

  const handleLogout = () => void logout();

  const searchField = (className: string) => (
    <form onSubmit={submitSearch} className={`relative ${className}`} role="search">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Rechercher une abaya, un khimar…"
        aria-label="Rechercher un article"
        className="w-full bg-white border border-sable rounded-full py-2.5 pl-4 pr-11 text-sm focus:outline-none focus:ring-1 focus:ring-orDore focus:border-orDore transition-colors"
      />
      <button
        type="submit"
        aria-label="Lancer la recherche"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-taupe hover:text-orDore transition-colors"
      >
        <Search size={18} />
      </button>
    </form>
  );

  return (
    <header className="sticky top-0 z-50 bg-beigeClair/95 backdrop-blur-sm border-b border-sable">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-24 gap-3 sm:gap-4">
          <Link href="/catalogue" className="shrink-0" aria-label="Accueil Nissa Dressing">
            {/* Logo réduit sur mobile : il partage la barre avec les actions. */}
            <span className="hidden sm:block">
              <Logo size="small" />
            </span>
            <span className="sm:hidden">
              <Logo size="tiny" />
            </span>
          </Link>

          {/* Sur mobile la recherche passe sur sa propre ligne (voir plus bas). */}
          {searchField('hidden md:flex flex-1 max-w-lg')}

          <div className="flex items-center gap-3 md:gap-6">
            {isMember && (
              <nav className="hidden md:flex items-center gap-6 text-brunProfond">
                <Link
                  href="/favoris"
                  className="hover:text-orDore transition-colors flex flex-col items-center gap-1"
                >
                  <Heart size={20} />
                  <span className="text-[0.7rem]">Favoris</span>
                </Link>

                <Link
                  href="/messages"
                  className="hover:text-orDore transition-colors flex flex-col items-center gap-1 relative"
                >
                  <MessageCircle size={20} />
                  {unread > 0 && (
                    <span className="absolute -top-1 right-1 bg-orDore text-white text-[0.6rem] rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                  <span className="text-[0.7rem]">Messages</span>
                </Link>

                <Link
                  href="/compte"
                  className="hover:text-orDore transition-colors flex flex-col items-center gap-1"
                >
                  <User size={20} />
                  <span className="text-[0.7rem]">Compte</span>
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    className="hover:text-orDore transition-colors flex flex-col items-center gap-1"
                  >
                    <Shield size={20} />
                    <span className="text-[0.7rem]">Admin</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="hover:text-orDore transition-colors flex flex-col items-center gap-1"
                >
                  <LogOut size={20} />
                  <span className="text-[0.7rem]">Quitter</span>
                </button>
              </nav>
            )}

            {isMember ? (
              <Link
                href="/vendre"
                className="bg-orDore hover:bg-orDoreFonce text-white px-3 sm:px-4 md:px-6 py-2 md:py-2.5 rounded-sm flex items-center gap-1.5 text-xs md:text-sm font-medium tracking-wide transition-colors whitespace-nowrap"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Vendre un article</span>
                <span className="sm:hidden">Vendre</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/connexion"
                  className="text-xs sm:text-sm text-brunProfond hover:text-orDore transition-colors whitespace-nowrap"
                >
                  Connexion
                </Link>
                <Link
                  href="/inscription"
                  className="bg-orDore hover:bg-orDoreFonce text-white px-3 sm:px-4 py-2 rounded-sm text-xs sm:text-sm font-medium tracking-wide transition-colors whitespace-nowrap"
                >
                  {user ? 'Mon parcours' : 'S’inscrire'}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recherche mobile : pleine largeur, sur sa propre ligne. */}
        <div className="md:hidden pb-3">{searchField('flex')}</div>
      </div>

      {/* Navigation catégories : mega-menu au survol sur desktop, rail défilant sur mobile. */}
      <nav
        className="bg-white border-t border-sable"
        onMouseLeave={() => setOpenCategory(null)}
        aria-label="Catégories"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex gap-5 md:gap-8 overflow-x-auto no-scrollbar whitespace-nowrap py-3">
            <li>
              <Link
                href="/catalogue"
                className="text-xs md:text-sm font-medium text-taupe hover:text-brunProfond transition-colors"
              >
                Toutes
              </Link>
            </li>
            {CATEGORIES.map((category) => (
              <li key={category.id} onMouseEnter={() => setOpenCategory(category.id)}>
                <Link
                  href={`/recherche?categoryId=${category.id}`}
                  className={`text-xs md:text-sm font-medium transition-colors ${
                    openCategory === category.id ? 'text-brunProfond' : 'text-taupe hover:text-brunProfond'
                  }`}
                >
                  {/* Libellé court sur mobile : « Bébé fille » plutôt que « Bébé — Fille ». */}
                  <span className="md:hidden">{category.shortLabel}</span>
                  <span className="hidden md:inline">{category.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {openCategory && (
          <div className="hidden md:block absolute left-0 right-0 bg-white border-y border-sable shadow-lg z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <ul className="grid grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-2">
                {CATEGORIES.find((category) => category.id === openCategory)?.subcategories.map(
                  (subcategory) => (
                    <li key={subcategory.id}>
                      <Link
                        href={`/recherche?categoryId=${openCategory}&subcategoryId=${subcategory.id}`}
                        onClick={() => setOpenCategory(null)}
                        className="text-sm text-brunProfond hover:text-orDore transition-colors block py-1"
                      >
                        {subcategory.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
