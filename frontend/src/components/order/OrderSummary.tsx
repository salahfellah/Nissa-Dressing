'use client';

import { formatPrice, type OrderDto } from '@nissa/shared';
import { ImageOff } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui';

/** Récapitulatif de l'article et du détail des montants. */
export default function OrderSummary({ order }: { order: OrderDto }) {
  const isBuyer = order.viewerRole === 'BUYER';

  return (
    <Card className="mb-6">
      <div className="flex gap-4">
        <Link
          href={`/article/${order.listingId}`}
          className="w-20 h-24 shrink-0 bg-sable rounded-sm overflow-hidden"
        >
          {order.listing.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={order.listing.photos[0]}
              alt={order.listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-taupe">
              <ImageOff size={20} />
            </span>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <h2 className="font-medium text-brunProfond">{order.listing.title}</h2>
          <p className="text-xs text-taupe mt-1">Taille {order.listing.size}</p>

          <dl className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-taupe">Article</dt>
              <dd className="text-brunProfond">{formatPrice(order.price.itemPriceCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-taupe">Frais de port</dt>
              <dd className="text-brunProfond">{formatPrice(order.price.shippingCents)}</dd>
            </div>
            {order.price.commissionPayer === 'BUYER' && order.price.commissionCents > 0 && (
              <div className="flex justify-between">
                <dt className="text-taupe">Frais de protection</dt>
                <dd className="text-brunProfond">{formatPrice(order.price.commissionCents)}</dd>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-sable font-semibold">
              <dt className="text-brunProfond">{isBuyer ? 'Total payé' : 'Total acheteuse'}</dt>
              <dd className="text-brunProfond">{formatPrice(order.price.totalCents)}</dd>
            </div>
            {!isBuyer && (
              <div className="flex justify-between text-orDore font-semibold">
                <dt>Ce que vous recevez</dt>
                <dd>{formatPrice(order.price.sellerPayoutCents)}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </Card>
  );
}
