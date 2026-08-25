'use client';

import { formatPrice, type AdminStatsDto } from '@nissa/shared';
import {
  ClipboardCheck,
  Lock,
  Store,
  TrendingUp,
  Undo2,
  UserCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Alert, Card, SectionTitle, Spinner } from '@/components/ui';
import { api } from '@/lib/api';

/** Tableau de bord du back-office — CDC §3.9. */
export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStatsDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<AdminStatsDto>('/admin/stats')
      .then(setStats)
      .catch(() => setError('Les statistiques n’ont pas pu être chargées.'));
  }, []);

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!stats) return <Spinner />;

  const queues = [
    {
      href: '/admin/inscriptions',
      label: 'Candidatures à examiner',
      count: stats.pendingApplications,
      icon: UserCheck,
    },
    {
      href: '/admin/annonces',
      label: 'Annonces à modérer',
      count: stats.pendingListings,
      icon: ClipboardCheck,
    },
    {
      href: '/admin/litiges',
      label: 'Retours à traiter',
      count: stats.pendingReturns,
      icon: Undo2,
    },
  ];

  const figures = [
    { label: 'Membres actives', value: String(stats.members), icon: Users },
    { label: 'Annonces en ligne', value: String(stats.publishedListings), icon: Store },
    {
      label: 'Sous séquestre',
      value: formatPrice(stats.escrowCents),
      hint: `${stats.ordersInEscrow} commande${stats.ordersInEscrow > 1 ? 's' : ''} en cours`,
      icon: Lock,
    },
    {
      label: 'Commissions encaissées',
      value: formatPrice(stats.revenueCents),
      hint: 'sur les commandes livrées',
      icon: TrendingUp,
    },
  ];

  return (
    <>
      <SectionTitle subtitle="Vue d’ensemble de la plateforme.">Tableau de bord</SectionTitle>

      {/* ————— Files d'attente ————— */}
      <ul className="grid sm:grid-cols-3 gap-4 mb-8">
        {queues.map(({ href, label, count, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className={`block bg-white border rounded-sm p-5 transition-colors ${
                count > 0 ? 'border-orDore hover:bg-orDore/5' : 'border-sable hover:border-taupe'
              }`}
            >
              <span className="flex items-center justify-between mb-3">
                <Icon size={20} className={count > 0 ? 'text-orDore' : 'text-taupe'} />
                <span
                  className={`font-playfair text-3xl ${
                    count > 0 ? 'text-orDore' : 'text-taupe'
                  }`}
                >
                  {count}
                </span>
              </span>
              <span className="block text-sm text-brunProfond">{label}</span>
              {count > 0 && (
                <span className="block text-xs text-orDore mt-1">À traiter →</span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      {/* ————— Chiffres clés ————— */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {figures.map(({ label, value, hint, icon: Icon }) => (
          <Card key={label}>
            <Icon size={18} className="text-taupe mb-3" />
            <p className="font-playfair text-2xl text-brunProfond">{value}</p>
            <p className="text-xs text-taupe uppercase tracking-wider mt-1">{label}</p>
            {hint && <p className="text-xs text-taupe mt-1">{hint}</p>}
          </Card>
        ))}
      </div>

      <Alert variant="info" title="À propos du séquestre">
        Le montant « sous séquestre » correspond aux paiements déjà encaissés mais pas encore
        reversés aux vendeuses : ils le seront à la confirmation de réception par les acheteuses.
      </Alert>
    </>
  );
}
