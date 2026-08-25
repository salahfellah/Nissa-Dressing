import React, { createContext, useContext, useState } from 'react';

interface FavoritesContextValue {
  favoriteIds: string[];
  isFavorite: (listingId: string) => boolean;
  toggleFavorite: (listingId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const isFavorite = (listingId: string) => favoriteIds.includes(listingId);

  const toggleFavorite = (listingId: string) => {
    setFavoriteIds((prev) =>
      prev.includes(listingId) ? prev.filter((id) => id !== listingId) : [...prev, listingId]
    );
  };

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within a FavoritesProvider');
  return ctx;
}
