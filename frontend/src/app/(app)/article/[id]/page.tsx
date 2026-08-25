'use client';

import { formatPrice, type ListingDto } from '@nissa/shared';
import { ArrowLeft, Heart } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ListingAttributes from '@/components/listing/ListingAttributes';
import PhotoGallery from '@/components/listing/PhotoGallery';
import PurchasePanel from '@/components/listing/PurchasePanel';
import SellerCard from '@/components/listing/SellerCard';
import { Alert, ButtonLink, Spinner } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useFavorites } from '@/lib/providers';

/** Page article — CDC §3.5, et point d'entrée du tunnel d'achat §3.6. */
export default function ListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isMember } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [listing, setListing] = useState<ListingDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ListingDto>(`/listings/${id}`)
      .then(setListing)
      .catch((exception) =>
        setError(
          exception instanceof ApiError
            ? exception.message
            : 'Nous ne retrouvons pas cet article.',
        ),
      )
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <Spinner label="Nous préparons l’article…" />;

  if (error || !listing) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Alert variant="error" title="Article introuvable">
          {error ?? 'Cette annonce n’existe plus ou a été retirée du catalogue.'}
        </Alert>
        <ButtonLink href="/recherche" variant="secondary">
          Voir le catalogue
        </ButtonLink>
      </div>
    );
  }

  const isOwner = user?.id === listing.sellerId;
  const favorite = isFavorite(listing.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <button
        onClick={() => router.back()}
        className="text-sm inline-flex items-center gap-2 mb-6 text-brunProfond hover:text-orDore"
      >
        <ArrowLeft size={16} />
        Retour
      </button>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <PhotoGallery
          photos={listing.photos}
          title={listing.title}
          isBoosted={listing.isBoosted}
          soldLabel={
            listing.status === 'SOLD'
              ? 'Vendu'
              : listing.status !== 'PUBLISHED'
                ? 'Indisponible'
                : undefined
          }
        />

        <div>
          <p className="text-xs uppercase tracking-widest text-taupe mb-2">{listing.categoryLabel}</p>

          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="font-playfair text-2xl md:text-3xl text-noirIntense">{listing.title}</h1>
            {isMember && !isOwner && (
              <button
                onClick={() => void toggleFavorite(listing.id)}
                aria-label={favorite ? 'Retirer de mes favoris' : 'Ajouter à mes favoris'}
                aria-pressed={favorite}
                className="p-2.5 border border-sable rounded-full text-taupe hover:text-orDore hover:border-orDore transition-colors shrink-0"
              >
                <Heart size={20} className={favorite ? 'fill-orDore text-orDore' : ''} />
              </button>
            )}
          </div>

          <p className="font-playfair text-3xl text-brunProfond mb-1">
            {formatPrice(listing.priceCents)}
          </p>
          <p className="text-sm text-taupe mb-6">
            + {formatPrice(listing.shippingCents)} de frais de port —{' '}
            <span className="italic">à la charge de l’acheteuse</span>
          </p>

          <ListingAttributes listing={listing} />

          {listing.seller && <SellerCard seller={listing.seller} />}

          <PurchasePanel listing={listing} />
        </div>
      </div>
    </div>
  );
}
