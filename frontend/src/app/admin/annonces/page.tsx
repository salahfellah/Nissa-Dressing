'use client';

import type { ListingDto } from '@nissa/shared';
import { ClipboardCheck, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import ModerationCard from '@/components/admin/ModerationCard';
import { Alert, EmptyState, SectionTitle, Spinner } from '@/components/ui';
import { api, ApiError } from '@/lib/api';

/** File de modération des annonces — CDC §3.9. */
export default function AdminListingsPage() {
  const [listings, setListings] = useState<ListingDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setListings(await api.get<ListingDto[]>('/admin/listings'));
      setError(null);
    } catch {
      setError('La file de modération n’a pas pu être chargée.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (id: string, accepted: boolean) => {
    // Un refus sans motif laisserait la vendeuse sans piste pour corriger.
    if (!accepted && !reasons[id]?.trim()) {
      setError('Indique un motif de refus : il est transmis à la vendeuse pour qu’elle corrige.');
      return;
    }

    setBusyId(id);
    setError(null);
    try {
      const { message } = await api.post<{ message: string }>(`/admin/listings/${id}/review`, {
        accepted,
        reason: reasons[id] ?? '',
      });
      setNotice(message);
      await load();
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : 'L’action n’a pas pu aboutir.');
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <>
      <SectionTitle subtitle="Vérifie la conformité des articles et des photos avant publication.">
        Annonces à modérer ({listings.length})
      </SectionTitle>

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

      {listings.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck size={36} />}
          title="La file est vide"
          description="Les nouvelles annonces apparaîtront ici avant leur mise en ligne."
        />
      ) : (
        <ul className="space-y-6">
          {listings.map((listing) => (
            <li key={listing.id}>
              <ModerationCard
                listing={listing}
                reason={reasons[listing.id] ?? ''}
                isBusy={busyId === listing.id}
                onReasonChange={(value) =>
                  setReasons((previous) => ({ ...previous, [listing.id]: value }))
                }
                onApprove={() => void review(listing.id, true)}
                onReject={() => void review(listing.id, false)}
              />
            </li>
          ))}
        </ul>
      )}

      <p className="flex items-center gap-2 text-xs text-taupe mt-8">
        <TriangleAlert size={14} />
        Chaque décision déclenche un e-mail automatique à la vendeuse.
      </p>
    </>
  );
}
