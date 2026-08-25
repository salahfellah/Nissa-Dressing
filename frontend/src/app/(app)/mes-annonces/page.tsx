'use client';

import type { ListingDto, ListingStatus } from '@nissa/shared';
import { Gift, Tag } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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

/** Mes annonces — suivi de modération et mise en avant (CDC §3.3 / §3.5). */
function MyListingsContent() {
  const { user, refresh } = useAuth();
  const settings = usePlatformSettings();

  const [listings, setListings] = useState<ListingDto[]>([]);
  const [tab, setTab] = useState<'all' | ListingStatus>('all');
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
      setError('Tes annonces n’ont pas pu être chargées. Réessaie dans un instant.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const freeBoostAvailable =
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

  const visible = tab === 'all' ? listings : listings.filter((listing) => listing.status === tab);

  if (isLoading) return <Spinner label="Nous rassemblons tes annonces…" />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-2">
        <SectionTitle subtitle="Suis la validation, les ventes et la mise en avant de tes pièces.">
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

      {freeBoostAvailable && (
        <Alert variant="info" title="Ton mois de mise en avant t’attend">
          <span className="inline-flex items-center gap-1.5">
            <Gift size={14} />
            À utiliser avant le {new Date(user!.freeBoostUntil!).toLocaleDateString('fr-FR')}, sur
            l’annonce de ton choix.
          </span>
        </Alert>
      )}

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-1">
        {TABS.map((item) => {
          const count =
            item.id === 'all'
              ? listings.length
              : listings.filter((listing) => listing.status === item.id).length;

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
        <EmptyState
          icon={<Tag size={36} />}
          title={tab === 'all' ? 'Aucune annonce pour l’instant' : 'Rien dans cet onglet'}
          description="Dépose ta première pièce : elle sera visible dès qu’elle aura été validée."
          action={
            <ButtonLink href="/vendre" fullWidth={false}>
              Vendre un article
            </ButtonLink>
          }
        />
      ) : (
        <ul className="space-y-4">
          {visible.map((listing) => (
            <MyListingRow
              key={listing.id}
              listing={listing}
              isBusy={busyId === listing.id}
              freeBoostAvailable={freeBoostAvailable}
              boostPriceCents={settings.boostPriceCents}
              onUseFreeBoost={() =>
                void act(
                  listing.id,
                  async () => {
                    await api.post(`/listings/${listing.id}/boost/free`);
                    await Promise.all([load(), refresh()]);
                  },
                  'Ton annonce est désormais en tête des résultats.',
                )
              }
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
                  'Ton annonce a été retirée.',
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
      <MyListingsContent />
    </RequireMember>
  );
}
