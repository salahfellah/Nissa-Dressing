'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { STATUS_ROUTE, useAuth } from '@/lib/auth-context';
import { Spinner } from './ui';

/**
 * Gardes de parcours — pendant du CDC §3.1 / §3.2 côté navigation.
 *
 * L'API applique les mêmes règles ; ces gardes ne servent qu'à éviter d'afficher
 * un écran auquel la visiteuse n'a pas droit. Elles ne sont jamais la seule
 * protection : toute route sensible est également fermée côté serveur.
 */

/** Réservé aux membres ayant terminé leur inscription. */
export function RequireMember({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isMember } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || isMember) return;
    router.replace(user ? (STATUS_ROUTE[user.status] ?? '/connexion') : '/connexion');
  }, [isLoading, isMember, user, router]);

  if (isLoading) return <Spinner />;
  if (!isMember) return <Spinner label="Redirection…" />;

  return <>{children}</>;
}

/** Réservé à l'administratrice (back-office, CDC §3.9). */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || isAdmin) return;
    router.replace('/connexion');
  }, [isLoading, isAdmin, router]);

  if (isLoading) return <Spinner />;
  if (!isAdmin) return <Spinner label="Redirection…" />;

  return <>{children}</>;
}

/**
 * Écrans d'un statut intermédiaire (en attente, paiement, configuration).
 * Une membre déjà en règle est renvoyée vers le catalogue, une visiteuse vers
 * l'accueil : chaque statut n'a qu'un seul écran légitime.
 */
export function RequireStatus({
  allowed,
  children,
}: {
  allowed: string[];
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const isAllowed = !!user && allowed.includes(user.status);

  useEffect(() => {
    if (isLoading || isAllowed) return;
    router.replace(user ? (STATUS_ROUTE[user.status] ?? '/') : '/connexion');
  }, [isLoading, isAllowed, user, router]);

  if (isLoading) return <Spinner />;
  if (!isAllowed) return <Spinner label="Redirection…" />;

  return <>{children}</>;
}

/** Écrans d'authentification : une session déjà ouverte est redirigée. */
export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !user) return;
    router.replace(STATUS_ROUTE[user.status] ?? '/catalogue');
  }, [isLoading, user, router]);

  if (isLoading) return <Spinner />;
  if (user) return <Spinner label="Redirection…" />;

  return <>{children}</>;
}
