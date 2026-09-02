'use client';

import type { OrderDto } from '@nissa/shared';
import { PackageCheck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

/** Jours entiers restants avant l'échéance, jamais négatif. */
function joursRestants(deadline: string | null): number | null {
  if (!deadline) return null;
  const reste = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(reste / 86_400_000));
}

/**
 * Rappel permanent de confirmer une réception.
 *
 * C'est le seul geste que personne d'autre ne peut faire à la place de
 * l'acheteuse : tant qu'il manque, l'argent de la vendeuse reste bloqué. Il
 * mérite donc mieux qu'un bouton au fond d'une page de commande — le bandeau
 * suit la navigation et ne se ferme pas.
 */
export default function ReceptionReminder() {
  const { isMember } = useAuth();
  const [aConfirmer, setAConfirmer] = useState<OrderDto[]>([]);

  useEffect(() => {
    if (!isMember) {
      setAConfirmer([]);
      return;
    }
    api
      .get<OrderDto[]>('/orders', { query: { role: 'buyer' } })
      // Seules les commandes expédiées appellent une confirmation : avant
      // l'envoi, l'acheteuse n'a rien à constater.
      .then((commandes) => setAConfirmer(commandes.filter((c) => c.status === 'SHIPPED')))
      .catch(() => setAConfirmer([]));
  }, [isMember]);

  if (aConfirmer.length === 0) return null;

  const premiere = aConfirmer[0];
  const jours = joursRestants(premiere.confirmationDeadline);
  const plusieurs = aConfirmer.length > 1;

  const echeance =
    jours === null
      ? null
      : jours === 0
        ? 'Dernier jour pour répondre.'
        : `Il te reste ${jours} jour${jours > 1 ? 's' : ''} pour répondre.`;

  return (
    <div className="sticky top-0 z-40 bg-orDore text-brunProfond border-b border-brunProfond/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <PackageCheck size={18} className="shrink-0" />

        <p className="text-sm font-medium flex-1 min-w-0">
          {plusieurs
            ? `${aConfirmer.length} commandes attendent que tu confirmes leur réception.`
            : `As-tu bien reçu ta commande ${premiere.reference} ?`}
          {echeance && <span className="font-normal"> {echeance}</span>}
        </p>

        <Link
          href={plusieurs ? '/achats' : `/commande/${premiere.id}`}
          className="text-sm font-semibold underline underline-offset-2 whitespace-nowrap hover:text-brunProfond/70"
        >
          {plusieurs ? 'Voir mes achats' : 'Confirmer la réception'}
        </Link>
      </div>
    </div>
  );
}
