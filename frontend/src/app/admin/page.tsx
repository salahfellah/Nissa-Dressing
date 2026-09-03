'use client';

import {
  CATEGORIES,
  ORDER_STATUS_LABELS,
  formatPrice,
  type AdminStatsDto,
  type OrderStatus,
} from '@nissa/shared';
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
import { CumulativeLine, DailyBars, RankedBars } from '@/components/admin/Charts';
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

  const libelleCategorie = (id: string) =>
    CATEGORIES.find((c) => c.id === id)?.label ?? id;
  const libelleStatut = (statut: string) =>
    ORDER_STATUS_LABELS[statut as OrderStatus] ?? statut;

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
            <p className="text-xs text-taupe mt-1">{label}</p>
            {hint && <p className="text-xs text-taupe mt-1">{hint}</p>}
          </Card>
        ))}
      </div>

      <Alert variant="info" title="À propos du séquestre">
        Le montant « sous séquestre » correspond aux paiements déjà encaissés mais pas encore
        reversés aux vendeuses : ils le seront à la confirmation de réception par les acheteuses.
      </Alert>

      {/* ————— Activité ————— */}
      <Card className="mt-8">
        <h2 className="font-playfair text-lg text-brunProfond mb-1">Activité</h2>
        <p className="text-xs text-taupe mb-5">
          Commandes réglées, jour par jour, sur les trente derniers jours.
        </p>
        <DailyBars data={stats.dailyActivity} />
      </Card>

      {/* —————
        Deux courbes plutôt qu'une à deux échelles : superposer des euros et un
        nombre de commandes sur un même cadre laisserait croire à un rapport
        entre deux grandeurs qui n'en ont aucun.
      ————— */}
      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Card>
          <h2 className="font-playfair text-lg text-brunProfond mb-1">Volume cumulé</h2>
          <p className="text-xs text-taupe mb-5">Somme encaissée depuis trente jours.</p>
          <CumulativeLine
            data={stats.dailyActivity}
            valeur={(jour) => jour.gmvCents}
            format={formatPrice}
            titre="encaissés sur la période"
          />
        </Card>

        <Card>
          <h2 className="font-playfair text-lg text-brunProfond mb-1">Commandes cumulées</h2>
          <p className="text-xs text-taupe mb-5">Nombre de ventes depuis trente jours.</p>
          <CumulativeLine
            data={stats.dailyActivity}
            valeur={(jour) => jour.orders}
            format={(total) => `${total} commande${total > 1 ? 's' : ''}`}
            titre="depuis trente jours"
          />
        </Card>
      </div>

      {/* ————— Deux répartitions ————— */}
      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Card>
          <h2 className="font-playfair text-lg text-brunProfond mb-1">Commandes par statut</h2>
          <p className="text-xs text-taupe mb-5">Où en sont les transactions en cours.</p>
          <RankedBars data={stats.ordersByStatus} libelle={libelleStatut} />
        </Card>

        <Card>
          <h2 className="font-playfair text-lg text-brunProfond mb-1">Catalogue par catégorie</h2>
          <p className="text-xs text-taupe mb-5">Répartition des annonces actuellement en ligne.</p>
          <RankedBars data={stats.listingsByCategory} libelle={libelleCategorie} />
        </Card>
      </div>
    </>
  );
}
