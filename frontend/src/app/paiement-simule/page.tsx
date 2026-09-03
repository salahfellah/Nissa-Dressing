'use client';

import { formatPrice } from '@nissa/shared';
import { CreditCard, Lock, TriangleAlert } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Alert, Button, Logo, Spinner } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const INTENT_LABELS: Record<string, { title: string; description: string }> = {
  acces: {
    title: 'Frais d’accès à vie',
    description: 'Accès illimité à Nissa Dressing, boost d’annonce offert inclus.',
  },
  commande: {
    title: 'Paiement de votre commande',
    description:
      'Le montant est conservé en séquestre et ne sera reversé à la vendeuse qu’à la confirmation de réception.',
  },
  boost: {
    title: 'Mise en avant mensuelle',
    description: 'Votre annonce apparaît en tête des résultats pendant 30 jours.',
  },
  connect: {
    title: 'Coordonnées bancaires',
    description: 'Simulation de l’onboarding Stripe Connect pour recevoir vos paiements.',
  },
};

/**
 * Page de paiement simulée — active uniquement quand aucune clé Stripe n'est
 * configurée (STRIPE_MODE=mock côté API).
 *
 * Elle remplace Stripe Checkout pour rendre l'ensemble du parcours jouable en
 * local : inscription, commande avec séquestre, boost, onboarding vendeuse.
 * Dès qu'une vraie clé Stripe est renseignée, l'API refuse ces confirmations et
 * la redirection pointe vers le vrai Checkout.
 */
function SimulatedPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();

  const intent = searchParams.get('intent') ?? '';
  const ref = searchParams.get('ref') ?? '';
  const amountCents = Number(searchParams.get('montant') ?? 0);

  const [error, setError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const meta = INTENT_LABELS[intent];

  const confirm = async () => {
    setError(null);
    setIsPaying(true);
    try {
      const { redirect } = await api.post<{ redirect: string }>('/payments/simulate/confirm', {
        intent,
        ref,
      });
      await refresh();
      router.replace(redirect);
    } catch (exception) {
      setError(
        exception instanceof ApiError ? exception.message : 'La confirmation a échoué.',
      );
      setIsPaying(false);
    }
  };

  if (!meta) {
    return (
      <Alert variant="error" title="Paiement inconnu">
        Ce lien de paiement n’est pas valide. Reprenez depuis la page précédente.
      </Alert>
    );
  }

  return (
    <>
      <Alert variant="warning" title="Environnement de démonstration">
        Aucune clé Stripe n’est configurée sur ce serveur : ce paiement est simulé et aucun montant
        réel n’est débité. Renseignez <code>STRIPE_SECRET_KEY</code> dans{' '}
        <code>apps/api/.env</code> pour activer les paiements réels.
      </Alert>

      <div className="bg-white border border-sable rounded-sm overflow-hidden">
        <div className="bg-brunProfond text-beigeClair p-5 flex items-center gap-3">
          <CreditCard size={20} className="text-orDore" />
          <div>
            <p className="text-sm font-semibold">{meta.title}</p>
            <p className="text-xs opacity-70">Paiement simulé</p>
          </div>
        </div>

        <div className="p-6">
          <p className="text-sm text-brunProfond leading-relaxed mb-6">{meta.description}</p>

          {amountCents > 0 && (
            <div className="flex justify-between items-baseline border-t border-b border-sable py-4 mb-6">
              <span className="text-sm text-taupe uppercase tracking-wider">Montant</span>
              <span className="text-2xl font-playfair text-brunProfond">
                {formatPrice(amountCents)}
              </span>
            </div>
          )}

          {error && <Alert variant="error">{error}</Alert>}

          <Button onClick={confirm} isLoading={isPaying}>
            <Lock size={15} />
            Confirmer le paiement
          </Button>

          <button
            onClick={() => router.back()}
            className="mt-4 mx-auto block text-xs underline text-taupe hover:text-brunProfond"
          >
            Annuler
          </button>
        </div>
      </div>
    </>
  );
}

export default function SimulatedPaymentPage() {
  return (
    <main className="min-h-screen p-6 py-12 max-w-md mx-auto fade-in">
      <div className="text-center mb-8">
        <Logo size="small" />
      </div>

      <p className="flex items-center justify-center gap-2 text-xs text-taupe mb-6">
        <TriangleAlert size={14} />
        Page de paiement de développement
      </p>

      <Suspense fallback={<Spinner />}>
        <SimulatedPaymentContent />
      </Suspense>
    </main>
  );
}
