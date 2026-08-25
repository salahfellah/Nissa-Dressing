'use client';

import { Check } from 'lucide-react';
import { useEffect } from 'react';
import { RequireStatus } from '@/components/guards';
import StatusShell from '@/components/StatusShell';
import { ButtonLink } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';

/** Confirmation du paiement — CDC §3.1 (« Paiement accepté, tu peux te connecter »). */
export default function PaymentDonePage() {
  const { refresh } = useAuth();

  // Retour depuis Stripe Checkout : le statut a pu changer côté serveur.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <RequireStatus allowed={['PAYMENT_DONE', 'ONBOARDING', 'MEMBER']}>
      <StatusShell title="Paiement accepté">
        <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-6 bg-orDore text-white">
          <Check size={26} />
        </div>

        <p className="text-sm text-brunProfond leading-relaxed mb-8">
          Merci ! Ton paiement a bien été accepté et ton accès est désormais actif à vie.
          <br />
          <br />
          Qu’Allah bénisse tes ventes.
        </p>

        <ButtonLink href="/configuration-compte">
          Clique ici pour commencer à vendre
        </ButtonLink>
      </StatusShell>
    </RequireStatus>
  );
}
