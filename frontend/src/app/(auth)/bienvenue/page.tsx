'use client';

import { Check } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { RequireStatus } from '@/components/guards';
import StatusShell from '@/components/StatusShell';
import { Alert, ButtonLink, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

/** Confirmation du paiement — CDC §3.1 (« Paiement accepté, vous pouvez vous connecter »). */
function PaymentDoneContent() {
  const searchParams = useSearchParams();
  const { refresh } = useAuth();

  // Stripe Checkout renvoie ici avec l'identifiant de session. En temps normal
  // le webhook a déjà validé le paiement ; s'il tarde — ou si rien ne le relaie
  // en local — l'API relit la session chez Stripe et conclut elle-même. Sans ce
  // rattrapage, la garde de route renverrait vers /paiement une sœur qui vient
  // pourtant de payer : le fameux aller-retour sans fin.
  const sessionId = searchParams.get('session_id');

  const [isConfirming, setIsConfirming] = useState(Boolean(sessionId));
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    let annule = false;

    const verifier = async () => {
      try {
        if (sessionId) {
          await api.post('/payments/confirm', { sessionId });
        }
        const me = await refresh();
        if (!annule && sessionId && me?.status === 'AWAITING_PAYMENT') setHasFailed(true);
      } catch {
        if (!annule) setHasFailed(true);
      } finally {
        if (!annule) setIsConfirming(false);
      }
    };

    void verifier();
    return () => {
      annule = true;
    };
  }, [sessionId, refresh]);

  if (isConfirming) {
    return (
      <StatusShell title="Validation de votre paiement">
        <Spinner label="Nous vérifions le paiement auprès de Stripe…" />
      </StatusShell>
    );
  }

  // Le paiement n'a pas pu être confirmé : mieux vaut le dire et proposer de
  // reprendre que de renvoyer silencieusement vers la page de paiement.
  if (hasFailed) {
    return (
      <StatusShell title="Paiement non confirmé">
        <Alert variant="warning">
          Stripe ne nous a pas encore confirmé ce règlement. Si votre carte a bien été débitée,
          patientez une minute puis actualisez cette page — sinon, reprenez le paiement.
        </Alert>
        <ButtonLink href="/paiement">Reprendre le paiement</ButtonLink>
      </StatusShell>
    );
  }

  return (
    <RequireStatus allowed={['PAYMENT_DONE', 'ONBOARDING', 'MEMBER']}>
      <StatusShell title="Paiement accepté">
        <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-6 bg-orDore text-white">
          <Check size={26} />
        </div>

        <p className="text-sm text-brunProfond leading-relaxed mb-8">
          Merci ! Votre paiement a bien été accepté et votre accès est désormais actif à vie.
          <br />
          <br />
          Qu’Allah bénisse vos ventes.
        </p>

        <ButtonLink href="/configuration-compte">
          Cliquez ici pour commencer à vendre
        </ButtonLink>
      </StatusShell>
    </RequireStatus>
  );
}

export default function PaymentDonePage() {
  return (
    <Suspense fallback={<Spinner />}>
      <PaymentDoneContent />
    </Suspense>
  );
}
