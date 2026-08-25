'use client';

import {
  CATEGORIES,
  type CatalogueFacetsDto,
  type ListingDto,
  type PaginatedDto,
} from '@nissa/shared';
import { ChevronRight, PackageSearch, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ListingCard from '@/components/ListingCard';
import { Alert, ButtonLink, EmptyState, SectionTitle, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

/** Vitrine du catalogue — CDC §3.5. */
export default function CataloguePage() {
  const { isMember, user } = useAuth();
  const [boosted, setBoosted] = useState<ListingDto[]>([]);
  const [recent, setRecent] = useState<ListingDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // `null` tant que l'API n'a pas répondu : on préfère n'afficher aucun chiffre
  // plutôt qu'un chiffre provisoire qui serait faux.
  const [categoryCounts, setCategoryCounts] = useState<Map<string, number> | null>(null);

  useEffect(() => {
    api
      .get<PaginatedDto<ListingDto>>('/listings', { query: { perPage: 24, sort: 'recent' } })
      .then((page) => {
        // Les annonces boostées remontent déjà côté API ; on les isole pour la
        // bande « Mises en avant ».
        setBoosted(page.items.filter((item) => item.isBoosted).slice(0, 4));
        setRecent(page.items.filter((item) => !item.isBoosted));
      })
      .catch(() =>
        setError('Le catalogue n’a pas pu être chargé. Vérifie que l’API est démarrée.'),
      )
      .finally(() => setIsLoading(false));
  }, []);

  // Les compteurs sont chargés à part : s'ils échouent, le catalogue reste
  // lisible — les cases s'affichent alors sans chiffre plutôt qu'avec un faux.
  useEffect(() => {
    api
      .get<CatalogueFacetsDto>('/listings/facets')
      .then((facets) =>
        setCategoryCounts(new Map(facets.categories.map((c) => [c.categoryId, c.count]))),
      )
      .catch(() => setCategoryCounts(null));
  }, []);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* ————— Bandeau d'accueil ————— */}
        <section className="bg-brunProfond rounded-sm overflow-hidden mb-12 flex flex-col md:flex-row">
          <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center">
            <p className="text-orDore text-xs tracking-[0.2em] uppercase mb-4 font-semibold">
              Le dressing de la femme musulmane
            </p>
            <h1 className="font-playfair text-3xl md:text-5xl text-beigeClair mb-6 leading-tight">
              L’élégance modeste,
              <br />
              en toute confiance.
            </h1>
            <p className="text-sable text-sm md:text-base leading-relaxed mb-8 max-w-lg font-light">
              Une marketplace réservée aux sœurs : chaque inscription est vérifiée, chaque annonce
              est modérée à la main, et le paiement n’est reversé à la vendeuse qu’une fois le colis
              reçu.
            </p>

            {!user && (
              <div className="flex flex-col sm:flex-row gap-3">
                <ButtonLink href="/inscription" fullWidth={false} className="sm:w-auto">
                  Rejoindre la communauté
                </ButtonLink>
                <ButtonLink
                  href="/connexion"
                  variant="outlineGold"
                  fullWidth={false}
                  className="sm:w-auto"
                >
                  Me connecter
                </ButtonLink>
              </div>
            )}
          </div>

          <div className="md:w-2/5 bg-sable flex flex-col justify-center items-center p-8 border-l border-taupe/30">
            <ul className="space-y-5 w-full max-w-xs">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Communauté vérifiée',
                  text: 'Inscription validée à la main, sur serment audio',
                },
                {
                  icon: ShoppingBag,
                  title: 'Paiement protégé',
                  text: 'Ton argent est conservé jusqu’à réception du colis',
                },
                {
                  icon: PackageSearch,
                  title: 'Articles conformes',
                  text: 'Chaque annonce est modérée avant publication',
                },
              ].map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-center gap-4 bg-white/70 p-4 rounded-sm">
                  <Icon className="text-orDore shrink-0" size={22} />
                  <div>
                    <p className="text-sm font-semibold text-brunProfond">{title}</p>
                    <p className="text-xs text-brunProfond/70">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {error && <Alert variant="error">{error}</Alert>}

        {/* ————— Catégories ————— */}
        <section className="mb-12">
          <SectionTitle subtitle="Trouve exactement ce que tu cherches.">Catégories</SectionTitle>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {CATEGORIES.map((category) => {
              const count = categoryCounts?.get(category.id);
              // Une catégorie vide ne renvoie nulle part : la rendre cliquable
              // ne mènerait qu'à une recherche sans résultat.
              const isEmpty = count === 0;

              const content = (
                <>
                  <span
                    className={`block text-sm font-medium ${
                      isEmpty ? 'text-taupe' : 'text-brunProfond'
                    }`}
                  >
                    {category.shortLabel}
                  </span>
                  <span className="block text-xs text-taupe mt-1">
                    {count === undefined
                      ? ' '
                      : isEmpty
                        ? 'Aucun article'
                        : `${count} article${count > 1 ? 's' : ''}`}
                  </span>
                </>
              );

              return (
                <li key={category.id}>
                  {isEmpty ? (
                    <div className="block bg-sable/30 border border-sable rounded-sm p-4 text-center cursor-default">
                      {content}
                    </div>
                  ) : (
                    <Link
                      href={`/recherche?categoryId=${category.id}`}
                      className="block bg-white border border-sable rounded-sm p-4 text-center hover:border-orDore hover:shadow-sm transition-all"
                    >
                      {content}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {isLoading ? (
          <Spinner label="Chargement du catalogue…" />
        ) : (
          <>
            {boosted.length > 0 && (
              <section className="mb-12">
                <SectionTitle subtitle="Les pièces mises en avant par leurs vendeuses.">
                  <span className="inline-flex items-center gap-2">
                    <Sparkles size={20} className="text-orDore" />
                    Coups de cœur
                  </span>
                </SectionTitle>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {boosted.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              </section>
            )}

            {/* Catalogue entièrement vide : on invite plutôt qu'on n'affiche une grille creuse. */}
            {boosted.length === 0 && recent.length === 0 && (
              <EmptyState
                icon={<PackageSearch size={36} />}
                title="Le catalogue est encore vide"
                description={
                  isMember
                    ? 'Sois la première à déposer une annonce : ta pièce sera visible dès sa validation.'
                    : 'Les premières annonces arrivent bientôt, in cha Allah.'
                }
                action={isMember ? <ButtonLink href="/vendre">Vendre un article</ButtonLink> : undefined}
              />
            )}

            {/* La section n'apparaît que si elle a quelque chose à montrer : un titre
                suivi du vide donne l'impression d'une page cassée. */}
            {recent.length > 0 && (
              <section>
                <div className="flex justify-between items-end mb-6">
                  <SectionTitle subtitle="Des pépites dénichées par la communauté.">
                    Dernières nouveautés
                  </SectionTitle>
                  <Link
                    href="/recherche"
                    className="text-brunProfond text-sm font-medium hover:text-orDore flex items-center gap-1 transition-colors shrink-0 pb-6"
                  >
                    Voir tout <ChevronRight size={16} />
                  </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {recent.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
