'use client';

import type { MeDto } from '@nissa/shared';
import { CreditCard, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Alert, Button } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

/**
 * Compte de paiement Stripe Connect — CDC §3.2 / §4.3.
 *
 * Les coordonnées bancaires sont saisies chez Stripe : le site n'y a jamais
 * accès. C'est dit explicitement à l'écran, parce que confier son IBAN demande
 * de la confiance.
 */
export default function StripeCard({ compact = false }: { compact?: boolean }) {
  const { user, setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const isComplete = user?.stripeConnectStatus === 'COMPLETE';
  const isPending = user?.stripeConnectStatus === 'PENDING';

  const start = async () => {
    setError(null);
    setIsConnecting(true);
    try {
      const { url } = await api.post<{ url: string }>('/account/stripe/onboarding');
      window.location.href = url;
    } catch (exception) {
      setError(
        exception instanceof ApiError
          ? exception.message
          : 'Stripe est momentanément indisponible. Réessayez dans un instant.',
      );
      setIsConnecting(false);
    }
  };

  const openDashboard = async () => {
    try {
      const { url } = await api.get<{ url: string | null }>('/account/stripe/dashboard');
      if (url) window.open(url, '_blank', 'noopener');
      else setNotice('Le tableau de bord Stripe n’est pas disponible en mode simulé.');
    } catch {
      setNotice('Le tableau de bord Stripe n’est pas accessible pour le moment.');
    }
  };

  const refresh = async () => {
    setNotice(null);
    try {
      const me = await api.post<MeDto>('/account/stripe/refresh');
      setUser(me);
      setNotice(
        me.stripeConnectStatus === 'COMPLETE'
          ? 'Votre compte Stripe est prêt.'
          : 'Stripe demande encore des informations. Continuez le formulaire, puis actualisez à nouveau.',
      );
    } catch {
      setNotice('Le statut Stripe n’a pas pu être relu pour le moment.');
    }
  };

  return (
    <>
      {notice && (
        <Alert variant="info" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}
      {error && <Alert variant="error">{error}</Alert>}

      {isComplete ? (
        <>
          <Alert variant="success" title="Votre compte de paiement est prêt">
            Vous pouvez vendre sereinement : les fonds vous sont reversés dès qu’une acheteuse confirme
            avoir bien reçu son colis.
          </Alert>
          {!compact && (
            <Button variant="ghost" fullWidth={false} onClick={openDashboard}>
              <ExternalLink size={15} />
              Ouvrir mon tableau de bord Stripe
            </Button>
          )}
        </>
      ) : (
        <>
          <Alert
            variant={isPending ? 'warning' : 'info'}
            title={
              isPending
                ? 'Votre configuration Stripe est en cours'
                : 'Vos coordonnées bancaires ne passent pas par le site'
            }
          >
            {isPending
              ? 'Terminez le formulaire hébergé par Stripe, puis actualisez votre compte.'
              : 'La saisie se fait directement chez Stripe, notre prestataire de paiement. Nissa Dressing n’a jamais accès à votre IBAN.'}
          </Alert>
          <Button onClick={start} isLoading={isConnecting} variant="secondary">
            <CreditCard size={16} />
            {isPending ? 'Continuer chez Stripe' : 'Configurer avec Stripe'}
          </Button>
          <button
            onClick={() => void refresh()}
            className="mt-3 mx-auto block text-xs underline text-taupe hover:text-brunProfond"
          >
            J’ai terminé chez Stripe — actualiser
          </button>
        </>
      )}
    </>
  );
}
