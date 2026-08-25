'use client';

import type { MeDto } from '@nissa/shared';
import { Check, CreditCard, MapPin } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import AddressForm from '@/components/account/AddressForm';
import StripeCard from '@/components/account/StripeCard';
import { RequireStatus } from '@/components/guards';
import { Alert, Button, Card, Logo, Spinner } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

/** En-tête d'une étape, cochée dès qu'elle est remplie. */
function StepHeader({
  done,
  icon: Icon,
  title,
  subtitle,
}: {
  done: boolean;
  icon: typeof MapPin;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <span
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
          done ? 'bg-orDore text-white' : 'bg-sable text-brunProfond'
        }`}
      >
        {done ? <Check size={18} /> : <Icon size={18} />}
      </span>
      <div>
        <h2 className="font-playfair text-lg text-brunProfond">{title}</h2>
        <p className="text-xs text-taupe mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

/**
 * Configuration du compte à la première connexion — CDC §3.2.
 *
 * L'adresse postale est exigée : elle figure sur le bordereau d'envoi. Stripe
 * Connect ne l'est pas encore — on ne ferme pas la porte à une sœur qui souhaite
 * d'abord acheter. Il redevient obligatoire au moment de publier une annonce.
 */
function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  const hasAddress = Boolean(user?.address);
  const stripeReady = user?.stripeConnectStatus === 'COMPLETE';

  // Retour depuis Stripe : on réinterroge le statut du compte connecté.
  useEffect(() => {
    if (searchParams.get('retour') === '1') {
      void api.post<MeDto>('/account/stripe/refresh').then(setUser).catch(() => undefined);
    }
  }, [searchParams, setUser]);

  const finish = async () => {
    setError(null);
    setIsFinishing(true);
    try {
      setUser(await api.post<MeDto>('/account/onboarding/complete'));
      router.replace('/catalogue');
    } catch (exception) {
      setError(
        exception instanceof ApiError
          ? exception.message
          : 'Nous n’avons pas pu finaliser ton compte. Réessaie dans un instant.',
      );
      setIsFinishing(false);
    }
  };

  return (
    <main className="min-h-screen p-6 py-12 max-w-2xl mx-auto fade-in">
      <div className="text-center mb-10">
        <Logo size="small" />
        <h1 className="text-2xl font-playfair mt-8 mb-2 text-brunProfond">
          Bienvenue {user?.prenom} !
        </h1>
        <p className="text-sm text-taupe max-w-md mx-auto leading-relaxed">
          Encore quelques informations et tu pourras commencer. Tu pourras les modifier à tout
          moment depuis ton espace personnel.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card className="mb-6">
        <StepHeader
          done={hasAddress}
          icon={MapPin}
          title="Ton adresse postale"
          subtitle="Elle figure comme adresse d’expédition sur le bordereau de tes ventes."
        />
        <AddressForm />
      </Card>

      <Card className="mb-6">
        <StepHeader
          done={stripeReady}
          icon={CreditCard}
          title="Tes coordonnées bancaires"
          subtitle="Pour recevoir le paiement de tes ventes."
        />
        <StripeCard compact />
        {!stripeReady && (
          <p className="text-xs text-taupe mt-3 text-center">
            Tu peux passer cette étape et y revenir plus tard : elle n’est indispensable que pour
            publier une annonce.
          </p>
        )}
      </Card>

      <Button onClick={finish} isLoading={isFinishing} disabled={!hasAddress}>
        Entrer sur Nissa Dressing
      </Button>

      {!hasAddress && (
        <p className="text-xs text-taupe mt-3 text-center">
          Enregistre d’abord ton adresse postale pour continuer.
        </p>
      )}
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <RequireStatus allowed={['ONBOARDING', 'PAYMENT_DONE']}>
      <Suspense fallback={<Spinner />}>
        <OnboardingContent />
      </Suspense>
    </RequireStatus>
  );
}
