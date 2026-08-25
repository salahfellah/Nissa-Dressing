'use client';

import type { PendingApplicationDto } from '@nissa/shared';
import { Check, Inbox, Volume2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, EmptyState, SectionTitle, Spinner, Textarea } from '@/components/ui';
import { api, ApiError, downloadUrl } from '@/lib/api';

/**
 * File de validation des inscriptions — CDC §3.9.
 *
 * L'administratrice écoute l'audio de serment, puis accepte (la candidate reçoit
 * le lien de paiement) ou refuse (l'audio est supprimé sur-le-champ).
 */
export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<PendingApplicationDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setApplications(await api.get<PendingApplicationDto[]>('/admin/applications'));
      setError(null);
    } catch {
      setError('La file de validation n’a pas pu être chargée.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (id: string, accepted: boolean) => {
    if (!accepted && !window.confirm('Refuser cette candidature ? L’audio sera supprimé.')) {
      return;
    }

    setBusyId(id);
    setError(null);
    try {
      const { message } = await api.post<{ message: string }>(`/admin/applications/${id}/review`, {
        accepted,
        reason: reasons[id] ?? '',
      });
      setNotice(message);
      await load();
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : 'Action impossible.');
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <>
      <SectionTitle subtitle="Écoute l’enregistrement de serment avant de statuer.">
        Candidatures en attente ({applications.length})
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

      {applications.length === 0 ? (
        <EmptyState
          icon={<Inbox size={36} />}
          title="Aucune candidature en attente"
          description="Les nouvelles demandes d’inscription apparaîtront ici, avec leur enregistrement audio."
        />
      ) : (
        <ul className="space-y-4">
          {applications.map((application) => (
            <li key={application.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <h2 className="font-playfair text-lg text-brunProfond">{application.pseudo}</h2>
                    <p className="text-sm text-taupe">
                      {application.prenom} {application.nom} · {application.email}
                    </p>
                    <p className="text-xs text-taupe mt-1">
                      Déposée le{' '}
                      {new Date(application.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs uppercase tracking-wider text-taupe mb-2 flex items-center gap-2">
                    <Volume2 size={14} />
                    Dépôt de serment
                  </p>

                  {application.audioOathUrl ? (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <audio
                      src={downloadUrl(application.audioOathUrl)}
                      controls
                      preload="none"
                      className="w-full"
                    />
                  ) : (
                    <p className="text-sm text-taupe italic">
                      Aucun enregistrement audio n’est associé à cette candidature.
                    </p>
                  )}
                </div>

                <Textarea
                  label="Motif (optionnel, transmis en cas de refus)"
                  rows={2}
                  value={reasons[application.id] ?? ''}
                  onChange={(event) =>
                    setReasons((previous) => ({ ...previous, [application.id]: event.target.value }))
                  }
                />

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => void review(application.id, true)}
                    isLoading={busyId === application.id}
                  >
                    <Check size={16} />
                    Accepter — envoyer le lien de paiement
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => void review(application.id, false)}
                    isLoading={busyId === application.id}
                  >
                    <X size={16} />
                    Refuser
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
