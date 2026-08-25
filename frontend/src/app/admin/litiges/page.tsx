'use client';

import { RETURN_STATUS_LABELS, type ReturnRequestDto } from '@nissa/shared';
import { BadgeEuro, Check, Undo2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, EmptyState, SectionTitle, Spinner, Textarea } from '@/components/ui';
import { api, ApiError } from '@/lib/api';

/** Litiges et retours — CDC §3.7 / §3.9. */
export default function AdminReturnsPage() {
  const [requests, setRequests] = useState<ReturnRequestDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRequests(await api.get<ReturnRequestDto[]>('/admin/returns'));
      setError(null);
    } catch {
      setError('Les demandes de retour n’ont pas pu être chargées.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (id: string, accepted: boolean) => {
    setBusyId(id);
    setError(null);
    try {
      await api.post(`/admin/returns/${id}/review`, { accepted, reason: notes[id] ?? '' });
      setNotice(
        accepted
          ? 'Retour accepté. Le bordereau de retour et le message d’excuse ont été envoyés.'
          : 'Demande refusée. L’acheteuse en a été informée.',
      );
      await load();
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : 'Action impossible.');
    } finally {
      setBusyId(null);
    }
  };

  const refund = async (id: string) => {
    if (!window.confirm('Confirmer le remboursement ? Cette action est définitive.')) return;

    setBusyId(id);
    setError(null);
    try {
      await api.post(`/admin/returns/${id}/refund`);
      setNotice('Remboursement effectué et acheteuse notifiée.');
      await load();
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : 'Remboursement impossible.');
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) return <Spinner />;

  const pending = requests.filter((request) => request.status === 'PENDING_REVIEW').length;

  return (
    <>
      <SectionTitle subtitle="Examine les photos avant de statuer, puis déclenche le remboursement une fois le retour reçu.">
        Litiges & retours ({pending} en attente)
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

      {requests.length === 0 ? (
        <EmptyState
          icon={<Undo2 size={36} />}
          title="Aucune demande de retour"
          description="Les demandes ouvertes par les acheteuses apparaîtront ici, photos à l’appui."
        />
      ) : (
        <ul className="space-y-6">
          {requests.map((request) => (
            <li key={request.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <h2 className="font-playfair text-lg text-brunProfond">
                      Commande {request.orderReference}
                    </h2>
                    <p className="text-sm text-taupe">
                      Ouverte par {request.requestedByPseudo} le{' '}
                      {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Badge
                    variant={
                      request.status === 'REFUNDED'
                        ? 'success'
                        : request.status === 'REJECTED'
                          ? 'danger'
                          : 'warning'
                    }
                  >
                    {RETURN_STATUS_LABELS[request.status]}
                  </Badge>
                </div>

                <p className="text-xs uppercase tracking-wider text-taupe mb-1">Motif</p>
                <p className="text-sm text-brunProfond mb-3">{request.reason}</p>

                <p className="text-xs uppercase tracking-wider text-taupe mb-1">Description</p>
                <p className="text-sm text-brunProfond leading-relaxed whitespace-pre-wrap bg-beigeClair p-3 rounded-sm mb-4">
                  {request.description}
                </p>

                {request.photos.length > 0 && (
                  <>
                    <p className="text-xs uppercase tracking-wider text-taupe mb-2">
                      Photos ({request.photos.length})
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                      {request.photos.map((photo, index) => (
                        <a
                          key={photo}
                          href={photo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aspect-square bg-sable rounded-sm overflow-hidden"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo}
                            alt={`Preuve ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </>
                )}

                {request.adminNote && (
                  <p className="text-sm text-taupe italic mb-4">Note : « {request.adminNote} »</p>
                )}

                {request.status === 'PENDING_REVIEW' && (
                  <>
                    <Textarea
                      label="Note (transmise à l’acheteuse en cas de refus)"
                      rows={2}
                      value={notes[request.id] ?? ''}
                      onChange={(event) =>
                        setNotes((previous) => ({ ...previous, [request.id]: event.target.value }))
                      }
                    />

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={() => void review(request.id, true)}
                        isLoading={busyId === request.id}
                      >
                        <Check size={16} />
                        Accepter le retour
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => void review(request.id, false)}
                        isLoading={busyId === request.id}
                      >
                        <X size={16} />
                        Refuser
                      </Button>
                    </div>
                  </>
                )}

                {(request.status === 'ACCEPTED' || request.status === 'RETURN_SHIPPED') && (
                  <>
                    <Alert variant="info">
                      Le bordereau de retour a été transmis. Déclenche le remboursement une fois le
                      colis reçu et vérifié.
                    </Alert>
                    <Button onClick={() => void refund(request.id)} isLoading={busyId === request.id}>
                      <BadgeEuro size={16} />
                      Rembourser l’acheteuse
                    </Button>
                  </>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
