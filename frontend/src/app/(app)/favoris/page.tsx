'use client';

import type { ListingDto } from '@nissa/shared';
import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { RequireMember } from '@/components/guards';
import ListingCard from '@/components/ListingCard';
import { Alert, ButtonLink, EmptyState, SectionTitle, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { useFavorites } from '@/lib/providers';

/** Mes favoris — CDC §3.5. */
function FavoritesContent() {
  const { favoriteIds } = useFavorites();
  const [listings, setListings] = useState<ListingDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ListingDto[]>('/favorites')
      .then(setListings)
      .catch(() => setError('Tes favoris n’ont pas pu être chargés.'))
      .finally(() => setIsLoading(false));
  }, []);

  // Un cœur décoché retire l'article de la liste sans recharger la page.
  const visible = listings.filter((listing) => favoriteIds.has(listing.id));

  if (isLoading) return <Spinner label="Chargement de tes favoris…" />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <SectionTitle subtitle="Les pièces que tu as mises de côté.">Mes favoris</SectionTitle>

      {error && <Alert variant="error">{error}</Alert>}

      {visible.length === 0 ? (
        <EmptyState
          icon={<Heart size={36} />}
          title="Aucun favori pour le moment"
          description="Touche le cœur d’un article pour le retrouver ici et suivre son prix."
          action={<ButtonLink href="/recherche" fullWidth={false}>Parcourir le catalogue</ButtonLink>}
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {visible.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FavoritesPage() {
  return (
    <RequireMember>
      <FavoritesContent />
    </RequireMember>
  );
}
