'use client';

import { CATEGORIES } from '@nissa/shared';
import { Bell, Heart, LogOut, MessageCircle, Plus, Search, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import NotificationsBell from '@/components/notifications/NotificationsBell';
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

  /**
   * Qui est connectée ? La question se posait à chaque écran : l'en-tête ne
   * montrait qu'une silhouette anonyme, identique d'un compte à l'autre. Le
   * pseudo — le nom que les autres sœurs voient — et son initiale y répondent
   * d'un coup d'œil, ce qui compte d'autant plus quand plusieurs comptes se
   * partagent le même navigateur (l'administratrice et son compte de membre).
   */
  const pseudo = user?.pseudo?.trim() ?? '';
  // `Array.from` et non `charAt` : une kunya arabe ou un prénom accentué ne
  // doit pas être coupé au milieu d'un caractère.
  const initiale = Array.from(pseudo)[0]?.toLocaleUpperCase() ?? '';

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

                <NotificationsBell />

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
                  title={pseudo ? `Connectée en tant que ${pseudo}` : undefined}
                  className="hover:text-orDore transition-colors flex flex-col items-center gap-1 max-w-28"
                >
                  <span
                    aria-hidden
                    className="w-5 h-5 rounded-full bg-orDore/15 text-orDore flex items-center justify-center text-[0.65rem] font-medium leading-none"
                  >
                    {initiale}
                  </span>
                  <span className="flex flex-col items-center leading-tight max-w-full">
                    <span className="text-[0.7rem] max-w-full truncate">{pseudo || 'Compte'}</span>
                    {/* Le pseudo dit qui est connectée, « Compte » dit où mène
                        le lien : les deux se lisent d'un coup, et la rangée
                        garde une destination nommée comme ses voisines. */}
                    {pseudo && <span className="text-[0.6rem] text-taupe">Compte</span>}
                  </span>
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    className="hover:text-orDore transition-colors flex flex-col items-center gap-1"
                  >
                    <Shield size={20} />
                    <span className="text-[0.7rem] whitespace-nowrap">Tableau de bord Admin</span>
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

            {/*
              Sur mobile la barre du bas est déjà pleine et le panneau déroulant
              n'a pas la place : un simple raccourci vers la page dédiée.
            */}
            {isMember && (
              <Link
                href="/notifications"
                aria-label="Notifications"
                className="md:hidden text-brunProfond hover:text-orDore transition-colors p-1"
              >
                <Bell size={20} />
              </Link>
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
                {user ? (
                  <span className="inline-block text-xs sm:text-sm text-taupe truncate max-w-24 sm:max-w-40">
                    <span className="hidden sm:inline">Connectée : </span>
                    {pseudo}
                  </span>
                ) : (
                  <Link
                    href="/connexion"
                    className="text-xs sm:text-sm text-brunProfond hover:text-orDore transition-colors whitespace-nowrap"
                  >
                    Connexion
                  </Link>
                )}
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
