'use client';

import type { OrderDto } from '@nissa/shared';
import {
  AlarmClock,
  Download,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Truck,
  Undo2,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Alert, Button, ButtonLink } from '@/components/ui';
import { api, ApiError, downloadUrl } from '@/lib/api';

/**
 * Actions disponibles sur une commande, selon le rôle et l'étape — CDC §3.6.
 *
 * La confirmation de réception est irréversible : elle libère les fonds vers la
 * vendeuse. Elle est donc précédée d'une confirmation explicite et d'un rappel
 * de ce qu'elle déclenche.
 */
export default function OrderActions({
  order,
  onUpdated,
}: {
  order: OrderDto;
  onUpdated: (order: OrderDto, notice: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const isBuyer = order.viewerRole === 'BUYER';

  // Jours entiers restants avant que la réception ne soit acquise d'office.
  const joursRestants = order.confirmationDeadline
    ? Math.max(0, Math.ceil((new Date(order.confirmationDeadline).getTime() - Date.now()) / 86_400_000))
    : null;
  const urgent = joursRestants !== null && joursRestants <= 3;

  const run = async (path: string, notice: string) => {
    setIsBusy(true);
    setError(null);
    try {
      onUpdated(await api.post<OrderDto>(path), notice);
    } catch (exception) {
      setError(
        exception instanceof ApiError
          ? exception.message
          : 'L’action n’a pas pu aboutir. Réessaie dans un instant.',
      );
    } finally {
      setIsBusy(false);
    }
  };

  const confirmReception = () => {
    const confirmed = window.confirm(
      'Confirmes-tu avoir bien reçu ton colis ? Le paiement sera aussitôt versé à la vendeuse — cette action ne peut pas être annulée.',
    );
    if (confirmed) void run(`/orders/${order.id}/reception`, 'Réception confirmée. Le paiement a été versé à la vendeuse, baraka Allahu fiki.');
  };

  return (
    <div className="space-y-3">
      {error && <Alert variant="error">{error}</Alert>}

      {!isBuyer && order.status !== 'PENDING_PAYMENT' && (
        <a
          href={downloadUrl(`/orders/${order.id}/bordereau`)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-6 uppercase tracking-widest text-sm font-medium inline-flex justify-center items-center gap-2 rounded-sm bg-orDore text-white border border-orDore hover:bg-orDoreFonce transition-colors"
        >
          <Download size={16} />
          Télécharger le bordereau d’envoi
        </a>
      )}

      {!isBuyer && order.status === 'PAID' && (
        <Button
          variant="secondary"
          isLoading={isBusy}
          onClick={() =>
            void run(`/orders/${order.id}/expedie`, 'Merci ! L’acheteuse vient d’être prévenue.')
          }
        >
          <Truck size={16} />
          J’ai expédié le colis
        </Button>
      )}

      {isBuyer && (order.status === 'SHIPPED' || order.status === 'PAID') && (
        <>
          {joursRestants !== null && (
            <p
              className={`flex items-start gap-2 text-sm rounded-sm p-3 leading-relaxed ${
                urgent
                  ? 'bg-orDore/15 text-brunProfond font-medium'
                  : 'bg-sable/40 text-brunProfond'
              }`}
            >
              <AlarmClock size={16} className="shrink-0 mt-0.5 text-orDore" />
              <span>
                {joursRestants === 0
                  ? 'Dernier jour pour répondre.'
                  : `Il te reste ${joursRestants} jour${joursRestants > 1 ? 's' : ''} pour répondre.`}{' '}
                Sans réponse de ta part, la commande sera considérée comme bien reçue et conforme,
                et tu ne pourras plus signaler de souci.
              </span>
            </p>
          )}

          <Button onClick={confirmReception} isLoading={isBusy}>
            <PackageCheck size={16} />
            Confirmer la réception
          </Button>
          <p className="flex items-start gap-2 text-xs text-taupe leading-relaxed">
            <ShieldCheck size={14} className="shrink-0 mt-0.5 text-orDore" />
            Ton paiement est gardé en sécurité jusque-là. Prends le temps de vérifier ton article
            avant de confirmer — c’est ce geste qui permet le reversement à la vendeuse.
          </p>
        </>
      )}

      {isBuyer && !order.hasReturnRequest && ['PAID', 'SHIPPED', 'RECEIVED'].includes(order.status) && (
        <ButtonLink href={`/retours/nouveau/${order.id}`} variant="ghost">
          <Undo2 size={16} />
          Un souci avec ton article ?
        </ButtonLink>
      )}

      {order.hasReturnRequest && (
        <Alert variant="info" title="Ta demande est entre de bonnes mains">
          L’administratrice l’examine avec attention.{' '}
          <Link href="/compte" className="underline font-semibold">
            Suivre ma demande
          </Link>
        </Alert>
      )}

      <ButtonLink href={`/messages/${order.id}`} variant="secondary">
        <MessageCircle size={16} />
        {isBuyer ? 'Écrire à la vendeuse' : 'Écrire à l’acheteuse'}
        {order.unreadMessages > 0 && ` (${order.unreadMessages})`}
      </ButtonLink>
    </div>
  );
}
