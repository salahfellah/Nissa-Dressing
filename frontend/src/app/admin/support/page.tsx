'use client';

import type { ContactRequestDto, EmailLogDto } from '@nissa/shared';
import { Check, ExternalLink, Mail, MailWarning } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import DataTable, { type Column } from '@/components/DataTable';
import { Alert, Badge, Button, Card, EmptyState, SectionTitle, Spinner } from '@/components/ui';
import { api, ApiError, downloadUrl } from '@/lib/api';

/**
 * Support et journal des e-mails — CDC §3.8 / §3.9.
 *
 * Le journal permet de vérifier qu'un e-mail est bien parti (et de le relire)
 * même quand aucun serveur SMTP n'est configuré.
 */
export default function AdminSupportPage() {
  const [requests, setRequests] = useState<ContactRequestDto[]>([]);
  const [emails, setEmails] = useState<EmailLogDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [contactRequests, emailLogs] = await Promise.all([
        api.get<ContactRequestDto[]>('/admin/contact-requests'),
        api.get<EmailLogDto[]>('/admin/emails'),
      ]);
      setRequests(contactRequests);
      setEmails(emailLogs);
      setError(null);
    } catch {
      setError('Les données de support n’ont pas pu être chargées.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markHandled = async (id: string) => {
    setBusyId(id);
    try {
      await api.post(`/admin/contact-requests/${id}/handled`);
      await load();
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : 'Action impossible.');
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) return <Spinner />;

  const pending = requests.filter((request) => !request.handledAt);

  const emailColumns: Column<EmailLogDto>[] = [
    {
      header: 'Objet',
      hideLabelOnMobile: true,
      className: 'text-brunProfond max-w-72 truncate',
      cell: (email) => email.subject,
    },
    {
      header: 'Date',
      className: 'text-xs text-taupe whitespace-nowrap',
      cell: (email) =>
        new Date(email.sentAt).toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
    },
    {
      header: 'Destinataire',
      className: 'text-taupe',
      cell: (email) => <span className="break-all">{email.to}</span>,
    },
    { header: 'Type', className: 'text-xs text-taupe', cell: (email) => email.template },
    {
      header: 'État',
      cell: (email) =>
        email.error ? (
          <Badge variant="danger" title={email.error}>
            Échec
          </Badge>
        ) : (
          <Badge variant="success">Envoyé</Badge>
        ),
    },
    {
      header: 'Contenu',
      cell: (email) => (
        <a
          href={downloadUrl(`/admin/emails/${email.id}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-orDore underline inline-flex items-center gap-1 whitespace-nowrap"
        >
          <ExternalLink size={12} />
          Lire
        </a>
      ),
    },
  ];

  return (
    <>
      <SectionTitle subtitle="Demandes reçues via le formulaire de contact et journal des e-mails envoyés.">
        Support & e-mails
      </SectionTitle>

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ————— Demandes de contact ————— */}
      <h2 className="font-playfair text-xl text-brunProfond mb-4">
        Demandes de contact ({pending.length} en attente)
      </h2>

      {requests.length === 0 ? (
        <EmptyState
          icon={<Mail size={36} />}
          title="Aucune demande"
          description="Les messages envoyés depuis la page d’aide apparaîtront ici."
        />
      ) : (
        <ul className="space-y-3 mb-12">
          {requests.map((request) => (
            <li key={request.id}>
              <Card className={request.handledAt ? 'opacity-60' : ''}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-medium text-brunProfond">{request.pseudo}</p>
                    <p className="text-xs text-taupe">
                      {request.email} ·{' '}
                      {new Date(request.createdAt).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {request.handledAt ? (
                    <Badge variant="success">Traitée</Badge>
                  ) : (
                    <Badge variant="warning">En attente</Badge>
                  )}
                </div>

                <p className="text-sm text-brunProfond leading-relaxed whitespace-pre-wrap bg-beigeClair p-3 rounded-sm mb-3">
                  {request.message}
                </p>

                <div className="flex flex-wrap gap-3">
                  <a
                    href={`mailto:${request.email}?subject=${encodeURIComponent('Nissa Dressing — ta demande')}`}
                    className="text-xs text-orDore underline inline-flex items-center gap-1"
                  >
                    <Mail size={12} />
                    Répondre par e-mail
                  </a>

                  {!request.handledAt && (
                    <Button
                      variant="ghost"
                      fullWidth={false}
                      className="text-xs py-1.5 px-3"
                      isLoading={busyId === request.id}
                      onClick={() => void markHandled(request.id)}
                    >
                      <Check size={13} />
                      Marquer comme traitée
                    </Button>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {/* ————— Journal des e-mails ————— */}
      <h2 className="font-playfair text-xl text-brunProfond mb-1">Journal des e-mails</h2>
      <p className="text-sm text-taupe mb-4">
        100 derniers envois. Utile pour vérifier qu’un e-mail est bien parti — et pour le relire.
      </p>

      {emails.length === 0 ? (
        <EmptyState
          icon={<MailWarning size={36} />}
          title="Aucun e-mail envoyé"
          description="Les e-mails transactionnels apparaîtront ici."
        />
      ) : (
        <DataTable
          columns={emailColumns}
          rows={emails}
          rowKey={(email) => email.id}
          caption="Journal des e-mails envoyés"
        />
      )}
    </>
  );
}
