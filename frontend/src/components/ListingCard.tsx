'use client';

import { CONDITION_LABELS, formatPrice, type ListingDto } from '@nissa/shared';
import { Heart, ImageOff } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useFavorites } from '@/lib/providers';
import { Badge } from './ui';

/** Vignette d'annonce du catalogue — CDC §3.5. */
export default function ListingCard({ listing }: { listing: ListingDto }) {
  const { isMember } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  const cover = listing.photos[0];
  const favorite = isFavorite(listing.id);

  return (
    <article className="group flex flex-col">
      <div className="relative bg-white aspect-3/4 mb-3 overflow-hidden rounded-sm border border-sable">
        <Link href={`/article/${listing.id}`} className="block w-full h-full">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={listing.title}
              loading="lazy"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <span className="w-full h-full flex flex-col items-center justify-center gap-2 bg-sable text-taupe">
              <ImageOff size={26} />
              <span className="text-[0.6rem] uppercase tracking-wider">Photo à venir</span>
            </span>
          )}
        </Link>

        {isMember && (
          <button
            type="button"
            onClick={() => void toggleFavorite(listing.id)}
            aria-label={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            aria-pressed={favorite}
            className="absolute top-2 right-2 p-2 bg-white/90 rounded-full text-taupe hover:text-orDore hover:bg-white backdrop-blur-sm transition-all shadow-sm"
          >
            <Heart size={18} className={favorite ? 'fill-orDore text-orDore' : ''} />
          </button>
        )}

        {listing.isBoosted && (
          <span className="absolute top-2 left-2">
            <Badge>Mise en avant</Badge>
          </span>
        )}

        {listing.status === 'SOLD' && (
          <span className="absolute inset-0 bg-noirIntense/60 flex items-center justify-center">
            <Badge variant="neutral">Vendu</Badge>
          </span>
        )}
      </div>

      <div className="flex flex-col grow">
        <div className="flex justify-between items-start gap-2 mb-1">
          <Link href={`/article/${listing.id}`} className="min-w-0">
            <h3 className="text-sm font-medium text-noirIntense line-clamp-2 hover:text-orDore transition-colors">
              {listing.title}
            </h3>
          </Link>
          <span className="text-sm font-semibold text-brunProfond whitespace-nowrap">
            {formatPrice(listing.priceCents)}
          </span>
        </div>

        <p className="text-xs text-taupe">
          {listing.size} · {listing.brand ?? 'Sans marque'}
        </p>
        <p className="text-xs text-taupe mt-0.5">{CONDITION_LABELS[listing.condition]}</p>

        <p className="text-[0.7rem] text-taupe mt-1">
          + {formatPrice(listing.shippingCents)} de frais de port
        </p>
      </div>
    </article>
  );
}
