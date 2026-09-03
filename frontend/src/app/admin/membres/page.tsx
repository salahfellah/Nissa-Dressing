'use client';

import { MEMBER_STATUS_LABELS, type AdminMemberDto } from '@nissa/shared';
import { Search, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import DataTable, { type Column } from '@/components/DataTable';
import { Alert, Badge, EmptyState, SectionTitle, Select, Spinner } from '@/components/ui';
import { api } from '@/lib/api';

const STATUS_VARIANT = {
  PENDING_REVIEW: 'warning',
  REJECTED: 'danger',
  AWAITING_PAYMENT: 'warning',
  PAYMENT_DONE: 'info',
  ONBOARDING: 'info',
  MEMBER: 'success',
} as const;

const STRIPE_LABELS = {
  COMPLETE: 'Opérationnel',
  PENDING: 'En cours',
  NOT_STARTED: 'Non configuré',
} as const;

/** Gestion des membres — CDC §3.9. */
export default function AdminMembersPage() {
  const [members, setMembers] = useState<AdminMemberDto[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Anti-rebond sur la recherche : évite une requête par frappe.
    const timer = setTimeout(() => {
      setIsLoading(true);
      api
        .get<AdminMemberDto[]>('/admin/members', {
          query: { q: query || undefined, status: status || undefined },
        })
        .then(setMembers)
        .catch(() => setError('La liste des membres n’a pas pu être chargée.'))
        .finally(() => setIsLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query, status]);

  const columns: Column<AdminMemberDto>[] = [
    {
      header: 'Pseudo',
      hideLabelOnMobile: true,
      cell: (member) => (
        <span className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-brunProfond">{member.pseudo}</span>
          {member.role === 'ADMIN' && <Badge variant="info">Admin</Badge>}
        </span>
      ),
    },
    {
      header: 'Identité',
      cell: (member) => (
        <span className="text-taupe">
          <span className="block">
            {member.prenom} {member.nom}
          </span>
          <span className="block text-xs break-all">{member.email}</span>
        </span>
      ),
    },
    {
      header: 'Statut',
      cell: (member) => (
        <Badge variant={STATUS_VARIANT[member.status]}>{MEMBER_STATUS_LABELS[member.status]}</Badge>
      ),
    },
    {
      header: 'Stripe',
      cell: (member) => (
        <span className="text-xs text-taupe">{STRIPE_LABELS[member.stripeConnectStatus]}</span>
      ),
    },
    { header: 'Annonces', cell: (member) => member.listingCount },
    { header: 'Commandes', cell: (member) => member.orderCount },
    {
      header: 'Inscrite le',
      className: 'text-xs text-taupe whitespace-nowrap',
      cell: (member) => new Date(member.createdAt).toLocaleDateString('fr-FR'),
    },
  ];

  return (
    <>
      <SectionTitle subtitle="Recherche par pseudo, e-mail ou nom.">
        Membres ({members.length})
      </SectionTitle>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
        <div className="flex-1 relative">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une membre…"
            aria-label="Rechercher une membre"
            className="w-full bg-white border border-sable rounded-sm py-3 pl-4 pr-11 text-sm focus:outline-none focus:border-orDore"
          />
          <Search
            size={16}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-taupe pointer-events-none"
          />
        </div>

        <div className="sm:w-64">
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filtrer par statut"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(MEMBER_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : members.length === 0 ? (
        <EmptyState
          icon={<Users size={36} />}
          title="Aucune membre trouvée"
          description="Essayez une autre recherche ou changez de filtre."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={members}
          rowKey={(member) => member.id}
          caption="Liste des membres"
        />
      )}
    </>
  );
}
