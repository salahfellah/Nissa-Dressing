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
          : 'Stripe est momentanément indisponible. Réessaie dans un instant.',
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
    try {
      setUser(await api.post<MeDto>('/account/stripe/refresh'));
    } catch {
      /* Le statut sera relu au prochain chargement. */
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
          <Alert variant="success" title="Ton compte de paiement est prêt">
            Tu peux vendre sereinement : les fonds te sont reversés dès qu’une acheteuse confirme
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
          <Alert variant="info" title="Tes coordonnées bancaires ne passent pas par le site">
            La saisie se fait directement chez Stripe, notre prestataire de paiement. Nissa Dressing
            n’a jamais accès à ton IBAN.
          </Alert>
          <Button onClick={start} isLoading={isConnecting} variant="secondary">
            <CreditCard size={16} />
            Configurer avec Stripe
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
