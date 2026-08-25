'use client';

import { ORDER_STATUS_LABELS, formatPrice, type OrderDto, type OrderStatus } from '@nissa/shared';
import { ImageOff, PackageSearch } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Alert, Badge, ButtonLink, EmptyState, SectionTitle, Spinner } from './ui';

const STATUS_VARIANT: Record<OrderStatus, 'warning' | 'success' | 'danger' | 'neutral' | 'gold'> = {
  PENDING_PAYMENT: 'warning',
  PAID: 'gold',
  SHIPPED: 'gold',
  RECEIVED: 'success',
  CANCELLED: 'neutral',
  REFUNDED: 'danger',
};

interface OrderListProps {
  role: 'buyer' | 'seller';
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
}

/** Liste de commandes — utilisée pour « Mes achats » et « Mes ventes » (CDC §3.6). */
export default function OrderList({
  role,
  title,
  subtitle,
  emptyTitle,
  emptyDescription,
}: OrderListProps) {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<OrderDto[]>('/orders', { query: { role } })
      .then(setOrders)
      .catch(() => setError('Tes commandes n’ont pas pu être chargées.'))
      .finally(() => setIsLoading(false));
  }, [role]);

  if (isLoading) return <Spinner label="Chargement…" />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <SectionTitle subtitle={subtitle}>{title}</SectionTitle>

      {error && <Alert variant="error">{error}</Alert>}

      {orders.length === 0 ? (
        <EmptyState
          icon={<PackageSearch size={36} />}
          title={emptyTitle}
          description={emptyDescription}
          action={
            <ButtonLink href={role === 'buyer' ? '/recherche' : '/vendre'} fullWidth={false}>
              {role === 'buyer' ? 'Parcourir le catalogue' : 'Vendre un article'}
            </ButtonLink>
          }
        />
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/commande/${order.id}`}
                className="flex gap-4 bg-white border border-sable rounded-sm p-4 hover:border-orDore transition-colors"
              >
                <span className="w-20 h-24 shrink-0 bg-sable rounded-sm overflow-hidden">
                  {order.listing.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={order.listing.photos[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-taupe">
                      <ImageOff size={20} />
                    </span>
                  )}
                </span>

                <span className="flex-1 min-w-0">
                  <span className="flex flex-wrap items-start justify-between gap-2 mb-1">
                    <span className="font-medium text-brunProfond">{order.listing.title}</span>
                    <Badge variant={STATUS_VARIANT[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </span>

                  <span className="block text-xs text-taupe">
                    {order.reference} · {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                  <span className="block text-xs text-taupe mt-0.5">
                    {role === 'buyer' ? `Vendue par ${order.sellerPseudo}` : `Achetée par ${order.buyerPseudo}`}
                  </span>

                  <span className="block text-sm font-semibold text-brunProfond mt-2">
                    {role === 'buyer'
                      ? formatPrice(order.price.totalCents)
                      : `${formatPrice(order.price.sellerPayoutCents)} à recevoir`}
                  </span>

                  {order.unreadMessages > 0 && (
                    <span className="inline-block mt-2">
                      <Badge variant="info">
                        {order.unreadMessages} message{order.unreadMessages > 1 ? 's' : ''} non lu
                        {order.unreadMessages > 1 ? 's' : ''}
                      </Badge>
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
