'use client';

import type { MeDto, MemberStatus } from '@nissa/shared';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from './api';

/**
 * Route d'accueil de chaque statut du parcours d'inscription — CDC §3.1 / §3.2.
 * C'est la table qui pilote toutes les redirections de garde.
 */
export const STATUS_ROUTE: Record<MemberStatus, string> = {
  PENDING_REVIEW: '/en-attente',
  REJECTED: '/candidature-refusee',
  AWAITING_PAYMENT: '/paiement',
  PAYMENT_DONE: '/bienvenue',
  ONBOARDING: '/configuration-compte',
  MEMBER: '/catalogue',
};

/**
 * Témoin posé par l'API à la connexion (voir SESSION_HINT_COOKIE côté serveur).
 * Il ne contient aucun secret : il indique seulement qu'une session a existé,
 * ce qui évite d'interroger l'API — et de récolter un 401 — à chaque visite.
 */
const TEMOIN_SESSION = 'nd_session';

const aUnTemoinDeSession = (): boolean =>
  typeof document !== 'undefined' &&
  document.cookie.split('; ').some((cookie) => cookie.startsWith(`${TEMOIN_SESSION}=`));

interface AuthContextValue {
  user: MeDto | null;
  /** `true` tant que la session initiale n'a pas été résolue. */
  isLoading: boolean;
  isMember: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<MeDto>;
  /** Ferme la session et ramène à l'accueil. */
  logout: () => Promise<void>;
  refresh: () => Promise<MeDto | null>;
  setUser: (user: MeDto | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async (): Promise<MeDto | null> => {
    try {
      const me = await api.get<MeDto>('/auth/me');
      setUser(me);
      return me;
    } catch (error) {
      // Le jeton d'accès a pu expirer alors que le jeton de rafraîchissement
      // est encore valable : on tente une rotation avant de conclure.
      if (error instanceof ApiError && error.status === 401 && aUnTemoinDeSession()) {
        try {
          const me = await api.post<MeDto>('/auth/refresh');
          setUser(me);
          return me;
        } catch {
          setUser(null);
          return null;
        }
      }
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    // Sans témoin, personne ne s'est jamais connectée depuis ce navigateur :
    // inutile d'appeler l'API pour se l'entendre confirmer par un 401.
    if (!aUnTemoinDeSession()) {
      setIsLoading(false);
      return;
    }
    void refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  const login = useCallback(async (email: string, password: string): Promise<MeDto> => {
    const me = await api.post<MeDto>('/auth/login', { email, password });
    setUser(me);
    return me;
  }, []);

  /**
   * La déconnexion recharge la page sur l'accueil plutôt que de naviguer côté
   * client : cela évite que les gardes de route, voyant la session disparaître,
   * redirigent au même instant vers /connexion — et cela repart d'un état
   * mémoire entièrement propre.
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
      if (typeof window !== 'undefined') window.location.assign('/');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isMember: user?.status === 'MEMBER',
      isAdmin: user?.role === 'ADMIN',
      login,
      logout,
      refresh,
      setUser,
    }),
    [user, isLoading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l’intérieur d’un AuthProvider.');
  }
  return context;
}
