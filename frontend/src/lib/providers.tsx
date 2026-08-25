'use client';

import { DEFAULT_SETTINGS, type PlatformSettings } from '@nissa/shared';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { AuthProvider, useAuth } from './auth-context';

// ————— Paramètres publics (frais de port, prix du boost, commission) —————

const SettingsContext = createContext<PlatformSettings>(DEFAULT_SETTINGS);

function PlatformSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    // En cas d'échec, les valeurs par défaut du paquet partagé restent affichées :
    // aucun prix ne peut apparaître vide à l'écran.
    api
      .get<PlatformSettings>('/settings/public')
      .then((value) => setSettings({ ...DEFAULT_SETTINGS, ...value }))
      .catch(() => undefined);
  }, []);

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export const usePlatformSettings = (): PlatformSettings => useContext(SettingsContext);

// ————— Favoris (CDC §3.5) —————

interface FavoritesContextValue {
  favoriteIds: Set<string>;
  isFavorite: (listingId: string) => boolean;
  toggleFavorite: (listingId: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue>({
  favoriteIds: new Set(),
  isFavorite: () => false,
  toggleFavorite: async () => undefined,
});

function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { isMember } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isMember) {
      setFavoriteIds(new Set());
      return;
    }
    api
      .get<string[]>('/favorites/ids')
      .then((ids) => setFavoriteIds(new Set(ids)))
      .catch(() => undefined);
  }, [isMember]);

  const toggleFavorite = useCallback(async (listingId: string) => {
    // Bascule optimiste : le cœur réagit immédiatement, et l'état est rétabli
    // si l'API refuse.
    setFavoriteIds((previous) => {
      const next = new Set(previous);
      if (next.has(listingId)) next.delete(listingId);
      else next.add(listingId);
      return next;
    });

    try {
      const { isFavorite } = await api.post<{ isFavorite: boolean }>(`/favorites/${listingId}`);
      setFavoriteIds((previous) => {
        const next = new Set(previous);
        if (isFavorite) next.add(listingId);
        else next.delete(listingId);
        return next;
      });
    } catch {
      setFavoriteIds((previous) => {
        const next = new Set(previous);
        if (next.has(listingId)) next.delete(listingId);
        else next.add(listingId);
        return next;
      });
    }
  }, []);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favoriteIds,
      isFavorite: (listingId: string) => favoriteIds.has(listingId),
      toggleFavorite,
    }),
    [favoriteIds, toggleFavorite],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export const useFavorites = (): FavoritesContextValue => useContext(FavoritesContext);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PlatformSettingsProvider>
        <FavoritesProvider>{children}</FavoritesProvider>
      </PlatformSettingsProvider>
    </AuthProvider>
  );
}
