'use client';

import { ORDER_STATUS_LABELS, type OrderDto } from '@nissa/shared';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { RequireMember } from '@/components/guards';
import OrderActions from '@/components/order/OrderActions';
import OrderSummary from '@/components/order/OrderSummary';
import OrderTimeline from '@/components/order/OrderTimeline';
import ShippingAddressCard from '@/components/order/ShippingAddressCard';
import { Alert, Badge, ButtonLink, Spinner } from '@/components/ui';
import { api, ApiError } from '@/lib/api';

/** Suivi d'une commande — CDC §3.6. */
function OrderContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [order, setOrder] = useState<OrderDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setOrder(await api.get<OrderDto>(`/orders/${id}`));
      setError(null);
    } catch (exception) {
      setError(
        exception instanceof ApiError
          ? exception.message
          : 'Nous ne retrouvons pas cette commande.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const payment = searchParams.get('paiement');
    if (payment === 'ok') {
      setNotice('Ton paiement est confirmé. La vendeuse est prévenue et prépare ton colis.');
    } else if (payment === 'annule') {
      setError('Le paiement a été interrompu. Ta commande t’attend, tu peux reprendre quand tu veux.');
    }
  }, [searchParams]);

  if (isLoading) return <Spinner label="Nous ouvrons ta commande…" />;

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Alert variant="error" title="Commande introuvable">
          {error ?? 'Cette commande n’existe pas ou ne t’est pas destinée.'}
        </Alert>
        <ButtonLink href="/achats" variant="secondary">
          Retour à mes achats
        </ButtonLink>
      </div>
    );
  }

  const isBuyer = order.viewerRole === 'BUYER';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <button
        onClick={() => router.back()}
        className="text-sm inline-flex items-center gap-2 mb-6 text-brunProfond hover:text-orDore"
      >
        <ArrowLeft size={16} />
        Retour
      </button>

      <header className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="font-playfair text-2xl md:text-3xl text-noirIntense">
            Commande {order.reference}
          </h1>
          <p className="text-sm text-taupe mt-1">
            {isBuyer ? `Vendue par ${order.sellerPseudo}` : `Achetée par ${order.buyerPseudo}`} · le{' '}
            {new Date(order.createdAt).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <Badge variant={order.status === 'REFUNDED' ? 'danger' : 'gold'}>
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
      </header>

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

      <OrderTimeline status={order.status} />
      <OrderSummary order={order} />
      <ShippingAddressCard address={order.shippingAddress} />

      <OrderActions
        order={order}
        onUpdated={(updated, message) => {
          setOrder(updated);
          setNotice(message);
        }}
      />
    </div>
  );
}

export default function OrderPage() {
  return (
    <RequireMember>
      <Suspense fallback={<Spinner />}>
        <OrderContent />
      </Suspense>
    </RequireMember>
  );
}
