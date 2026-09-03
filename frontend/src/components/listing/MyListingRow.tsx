'use client';

import { LISTING_STATUS_LABELS, formatPrice, type ListingDto, type ListingStatus } from '@nissa/shared';
import { ImageOff, Sparkles, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Badge, Button } from '@/components/ui';

const STATUS_VARIANT: Record<ListingStatus, 'warning' | 'success' | 'danger' | 'neutral'> = {
  PENDING_REVIEW: 'warning',
  PUBLISHED: 'success',
  REJECTED: 'danger',
  SOLD: 'neutral',
};

/** Une annonce dans « Mes annonces » — CDC §3.3 / §3.5. */
export default function MyListingRow({
  listing,
  isBusy,
  boostPriceCents,
  onBuyBoost,
  onRemove,
}: {
  listing: ListingDto;
  isBusy: boolean;
  boostPriceCents: number;
  onBuyBoost: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="bg-white border border-sable rounded-sm p-4 flex flex-col sm:flex-row gap-4">
      <Link
        href={`/article/${listing.id}`}
        className="w-full sm:w-24 h-32 shrink-0 bg-sable rounded-sm overflow-hidden"
      >
        {listing.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <span className="w-full h-full flex items-center justify-center text-taupe">
            <ImageOff size={22} />
          </span>
        )}
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
          <Link
            href={`/article/${listing.id}`}
            className="font-medium text-brunProfond hover:text-orDore"
          >
            {listing.title}
          </Link>
          <span className="flex items-center gap-2">
            {listing.isBoosted && (
              <Badge>
                <Sparkles size={10} />
                En avant
              </Badge>
            )}
            <Badge variant={STATUS_VARIANT[listing.status]}>
              {LISTING_STATUS_LABELS[listing.status]}
            </Badge>
          </span>
        </div>

        <p className="text-sm text-brunProfond font-semibold">{formatPrice(listing.priceCents)}</p>
        <p className="text-xs text-taupe mt-0.5">
          {listing.categoryLabel} · {listing.size} · {listing.favoriteCount} favori
          {listing.favoriteCount > 1 ? 's' : ''}
        </p>

        {listing.status === 'REJECTED' && listing.rejectionReason && (
          <p className="mt-2 text-xs text-red-700 bg-red-50 border-l-2 border-red-400 p-2 rounded-sm">
            <strong>Ce qui a été relevé :</strong> {listing.rejectionReason}
            <br />
            Vous pouvez corriger votre annonce et la proposer à nouveau.
          </p>
        )}

        {listing.isBoosted && listing.boostedUntil && (
          <p className="mt-2 text-xs text-taupe">
            Mise en avant jusqu’au {new Date(listing.boostedUntil).toLocaleDateString('fr-FR')}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mt-3">
          {listing.status === 'PUBLISHED' && !listing.isBoosted && (
            <>
              <Button
                variant="secondary"
                fullWidth={false}
                className="text-xs py-2 px-3"
                isLoading={isBusy}
                onClick={onBuyBoost}
              >
                <Sparkles size={13} />
                Mettre en avant — {formatPrice(boostPriceCents)}/mois
              </Button>
            </>
          )}

          {listing.status !== 'SOLD' && (
            <Button
              variant="ghost"
              fullWidth={false}
              className="text-xs py-2 px-3 text-red-600"
              isLoading={isBusy}
              onClick={onRemove}
            >
              <Trash2 size={13} />
              Retirer
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}
