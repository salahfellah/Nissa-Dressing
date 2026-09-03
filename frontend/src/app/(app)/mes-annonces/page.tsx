'use client';

import type { ListingDto, ListingStatus } from '@nissa/shared';
import { Gift, Search, Tag, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { RequireMember } from '@/components/guards';
import MyListingRow from '@/components/listing/MyListingRow';
import { Alert, ButtonLink, EmptyState, SectionTitle, Spinner } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { usePlatformSettings } from '@/lib/providers';

const TABS: { id: 'all' | ListingStatus; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'PENDING_REVIEW', label: 'En attente' },
  { id: 'PUBLISHED', label: 'En ligne' },
  { id: 'REJECTED', label: 'À corriger' },
  { id: 'SOLD', label: 'Vendues' },
];

/**
 * Prépare un texte pour la comparaison : « Abaya Médine » doit se retrouver en
 * tapant « medine », sans accent et sans se soucier de la casse.
 */
const pourLaRecherche = (valeur: string): string =>
  valeur
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/** Champs sur lesquels porte la recherche d'une annonce. */
const texteIndexable = (listing: ListingDto): string =>
  pourLaRecherche(
    [
      listing.title,
      listing.brand ?? '',
      listing.categoryLabel,
      listing.size,
      listing.color,
      listing.material,
    ].join(' '),
  );

/** Mes annonces — suivi de modération et mise en avant (CDC §3.3 / §3.5). */
function MyListingsContent() {
  const { user, refresh } = useAuth();
  const settings = usePlatformSettings();
  const searchParams = useSearchParams();

  const [listings, setListings] = useState<ListingDto[]>([]);
  const [tab, setTab] = useState<'all' | ListingStatus>('all');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setListings(await api.get<ListingDto[]>('/listings/mine'));
      setError(null);
    } catch {
      setError('Vos annonces n’ont pas pu être chargées. Réessayez dans un instant.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Retour de Stripe après l'achat d'une mise en avant : l'API relit la session
  // chez Stripe avant le rechargement, sinon l'annonce s'afficherait sans son
  // boost tant que le webhook n'est pas passé.
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const ouvrir = async () => {
      if (sessionId) {
        await api.post('/payments/confirm', { sessionId }).catch(() => undefined);
      }
      await load();
    };

    void ouvrir();
  }, [load, sessionId]);

  const boost = searchParams.get('boost');

  useEffect(() => {
    if (boost === 'ok') {
      setNotice('Votre annonce est désormais en tête des résultats.');
    } else if (boost === 'annule') {
      setError('La mise en avant a été interrompue : rien n’a été débité.');
    }
  }, [boost]);

  // Le mois offert ne se réclame pas : il s'applique de lui-même à chaque
  // annonce qui paraît tant qu'il court. On l'annonce, on ne le propose plus.
  const moisOffertEnCours =
    !!user?.freeBoostUntil && new Date(user.freeBoostUntil).getTime() > Date.now();

  /** Enveloppe commune aux actions : gestion du chargement et des erreurs. */
  const act = async (id: string, action: () => Promise<void>, success?: string) => {
    setBusyId(id);
    setError(null);
    try {
      await action();
      if (success) setNotice(success);
    } catch (exception) {
      setError(
        exception instanceof ApiError ? exception.message : 'L’action n’a pas pu aboutir.',
      );
    } finally {
      setBusyId(null);
    }
  };

  // La recherche s'applique avant les onglets : les compteurs reflètent alors ce
  // que la recherche a retenu, et un onglet vide se comprend d'un coup d'œil.
  const found = useMemo(() => {
    const terme = pourLaRecherche(query.trim());
    if (!terme) return listings;

    // Chaque mot doit se retrouver : « abaya noire » filtre plus finement que
    // la chaîne entière, qui ne correspondrait à rien.
    const mots = terme.split(/\s+/);
    return listings.filter((listing) => {
      const texte = texteIndexable(listing);
      return mots.every((mot) => texte.includes(mot));
    });
  }, [listings, query]);

  const visible = tab === 'all' ? found : found.filter((listing) => listing.status === tab);

  if (isLoading) return <Spinner label="Nous rassemblons vos annonces…" />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-2">
        <SectionTitle subtitle="Suivez la validation, les ventes et la mise en avant de vos pièces.">
          Mes annonces
        </SectionTitle>
        <ButtonLink href="/vendre" fullWidth={false} className="mb-6">
          Vendre un article
        </ButtonLink>
      </div>

      {notice && (
        <Alert variant="success" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {moisOffertEnCours && (
        <Alert variant="info" title="Votre mois de mise en avant est en cours">
          <span className="inline-flex items-center gap-1.5">
            <Gift size={14} />
            Jusqu’au {new Date(user!.freeBoostUntil!).toLocaleDateString('fr-FR')}, chaque annonce
            publiée part d’elle-même en tête du catalogue. Vous n’avez rien à faire.
          </span>
        </Alert>
      )}

      {listings.length > 0 && (
        <div className="relative mb-4" role="search">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-taupe pointer-events-none"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher dans mes annonces (titre, marque, taille, couleur…)"
            aria-label="Rechercher dans mes annonces"
            className="w-full bg-white border border-sable rounded-full py-2.5 pl-11 pr-11 text-sm focus:outline-none focus:ring-1 focus:ring-orDore focus:border-orDore transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Effacer la recherche"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-taupe hover:text-brunProfond transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-1">
        {TABS.map((item) => {
          const count =
            item.id === 'all'
              ? found.length
              : found.filter((listing) => listing.status === item.id).length;

          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`px-4 py-2 text-xs uppercase tracking-wider rounded-sm whitespace-nowrap transition-colors ${
                tab === item.id
                  ? 'bg-brunProfond text-beigeClair'
                  : 'bg-white border border-sable text-taupe hover:text-brunProfond'
              }`}
            >
              {item.label} ({count})
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        query.trim() ? (
          <EmptyState
            icon={<Search size={36} />}
            title="Aucune annonce ne correspond"
            description={`Rien ne ressort pour « ${query.trim()} »${
              tab === 'all' ? '' : ' dans cet onglet'
            }. Essayez un autre mot, ou effacez la recherche.`}
            action={
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-sm underline text-taupe hover:text-brunProfond"
              >
                Effacer la recherche
              </button>
            }
          />
        ) : (
          <EmptyState
            icon={<Tag size={36} />}
            title={tab === 'all' ? 'Aucune annonce pour l’instant' : 'Rien dans cet onglet'}
            description="Déposez votre première pièce : elle sera visible dès qu’elle aura été validée."
            action={
              <ButtonLink href="/vendre" fullWidth={false}>
                Vendre un article
              </ButtonLink>
            }
          />
        )
      ) : (
        <ul className="space-y-4">
          {visible.map((listing) => (
            <MyListingRow
              key={listing.id}
              listing={listing}
              isBusy={busyId === listing.id}
              boostPriceCents={settings.boostPriceCents}
              onBuyBoost={() =>
                void act(listing.id, async () => {
                  const { url } = await api.post<{ url: string }>(
                    `/listings/${listing.id}/boost/checkout`,
                  );
                  window.location.href = url;
                })
              }
              onRemove={() => {
                if (!window.confirm('Retirer définitivement cette annonce ?')) return;
                void act(
                  listing.id,
                  async () => {
                    await api.delete(`/listings/${listing.id}`);
                    await load();
                  },
                  'Votre annonce a été retirée.',
                );
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MyListingsPage() {
  return (
    <RequireMember>
      <Suspense fallback={<Spinner />}>
        <MyListingsContent />
      </Suspense>
    </RequireMember>
  );
}
