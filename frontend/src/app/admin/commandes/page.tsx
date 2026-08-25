'use client';

import { ORDER_STATUS_LABELS, formatPrice, type OrderStatus } from '@nissa/shared';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import DataTable, { type Column } from '@/components/DataTable';
import { Alert, Badge, EmptyState, SectionTitle, Select, Spinner } from '@/components/ui';
import { api } from '@/lib/api';

interface AdminOrderRow {
  id: string;
  reference: string;
  listingTitle: string;
  buyerPseudo: string;
  sellerPseudo: string;
  status: OrderStatus;
  totalCents: number;
  commissionCents: number;
  sellerPayoutCents: number;
  hasReturnRequest: boolean;
  returnStatus: string | null;
  createdAt: string;
}

const STATUS_VARIANT: Record<OrderStatus, 'warning' | 'gold' | 'success' | 'danger' | 'neutral'> = {
  PENDING_PAYMENT: 'warning',
  PAID: 'gold',
  SHIPPED: 'gold',
  RECEIVED: 'success',
  CANCELLED: 'neutral',
  REFUNDED: 'danger',
};

/** Suivi des commandes — CDC §3.9. */
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    api
      .get<AdminOrderRow[]>('/admin/orders', { query: { status: status || undefined } })
      .then(setOrders)
      .catch(() => setError('Les commandes n’ont pas pu être chargées.'))
      .finally(() => setIsLoading(false));
  }, [status]);

  const escrowTotal = orders
    .filter((order) => order.status === 'PAID' || order.status === 'SHIPPED')
    .reduce((sum, order) => sum + order.sellerPayoutCents, 0);

  const columns: Column<AdminOrderRow>[] = [
    {
      header: 'Référence',
      hideLabelOnMobile: true,
      className: 'whitespace-nowrap',
      cell: (order) => (
        <span className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/commande/${order.id}`}
            className="font-medium text-brunProfond hover:text-orDore"
          >
            {order.reference}
          </Link>
          {order.hasReturnRequest && <Badge variant="danger">Litige</Badge>}
        </span>
      ),
    },
    {
      header: 'Article',
      className: 'text-taupe max-w-56 truncate',
      cell: (order) => order.listingTitle,
    },
    { header: 'Acheteuse', className: 'text-taupe', cell: (order) => order.buyerPseudo },
    { header: 'Vendeuse', className: 'text-taupe', cell: (order) => order.sellerPseudo },
    {
      header: 'Statut',
      cell: (order) => (
        <Badge variant={STATUS_VARIANT[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
      ),
    },
    {
      header: 'Total',
      className: 'text-brunProfond whitespace-nowrap',
      cell: (order) => formatPrice(order.totalCents),
    },
    {
      header: 'Commission',
      className: 'text-brunProfond whitespace-nowrap',
      cell: (order) => formatPrice(order.commissionCents),
    },
    {
      header: 'Date',
      className: 'text-xs text-taupe whitespace-nowrap',
      cell: (order) => new Date(order.createdAt).toLocaleDateString('fr-FR'),
    },
  ];

  return (
    <>
      <SectionTitle subtitle="Toutes les transactions de la plateforme.">
        Commandes ({orders.length})
      </SectionTitle>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="sm:w-64">
          <Select
            label="Filtrer par statut"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Toutes (hors paiements en attente)</option>
            {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        {escrowTotal > 0 && (
          <p className="text-sm text-taupe">
            Sous séquestre sur cette sélection :{' '}
            <strong className="text-brunProfond">{formatPrice(escrowTotal)}</strong>
          </p>
        )}
      </div>

      {isLoading ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={36} />}
          title="Aucune commande"
          description="Les transactions apparaîtront ici dès la première vente."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={orders}
          rowKey={(order) => order.id}
          caption="Liste des commandes"
        />
      )}
    </>
  );
}
