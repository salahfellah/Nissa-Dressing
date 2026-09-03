'use client';

import { formatPrice } from '@nissa/shared';
import { Check, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { RequireStatus } from '@/components/guards';
import StatusShell from '@/components/StatusShell';
import { Alert, Button } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { usePlatformSettings } from '@/lib/providers';

/** Règlement des frais d'accès à vie — CDC §3.1. */
export default function AccessPaymentPage() {
  const settings = usePlatformSettings();
  const { logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const startPayment = async () => {
    setError(null);
    setIsRedirecting(true);
    try {
      const { url } = await api.post<{ url: string }>('/account/access-fee/checkout');
      // Stripe Checkout en production, page de paiement simulée en développement.
      window.location.href = url;
    } catch (exception) {
      setError(
        exception instanceof ApiError ? exception.message : 'Le paiement n’a pas pu démarrer. Réessayez dans un instant.',
      );
      setIsRedirecting(false);
    }
  };

  return (
    <RequireStatus allowed={['AWAITING_PAYMENT']}>
      <StatusShell title="Votre candidature est acceptée !">
        <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-6 bg-orDore text-white">
          <Check size={26} />
        </div>

        <p className="text-sm text-brunProfond leading-relaxed mb-6">
          Bienvenue parmi nous. Il ne vous reste qu’une étape : régler la participation unique de{' '}
          <strong>{formatPrice(settings.accessFeeCents)}</strong>.
        </p>

        <ul className="bg-white border border-sable rounded-sm p-5 mb-6 text-sm text-left space-y-3">
          {[
            'Accès à vie à la plateforme',
            `${settings.freeBoostDays} jours de boost d’annonce offerts`,
            'Aucun abonnement, aucun frais caché',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-brunProfond">
              <Check size={16} className="text-orDore shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>

        {error && <Alert variant="error">{error}</Alert>}

        <Button onClick={startPayment} isLoading={isRedirecting}>
          Payer {formatPrice(settings.accessFeeCents)}
        </Button>

        <p className="flex items-center justify-center gap-2 mt-4 text-xs text-taupe">
          <ShieldCheck size={14} />
          Paiement sécurisé par Stripe — aucune donnée bancaire n’est conservée sur le site
        </p>

        <button
          onClick={() => void logout()}
          className="mt-6 text-xs underline text-taupe hover:text-brunProfond"
        >
          Se déconnecter
        </button>
      </StatusShell>
    </RequireStatus>
  );
}
