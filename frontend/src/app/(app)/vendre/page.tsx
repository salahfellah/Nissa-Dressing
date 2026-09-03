'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { listingSchema, type ListingInput } from '@nissa/shared';
import { Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { RequireMember } from '@/components/guards';
import PhotoUploader, { type UploadedPhoto } from '@/components/PhotoUploader';
import ItemFields from '@/components/sell/ItemFields';
import PricingFields from '@/components/sell/PricingFields';
import SubmittedNotice from '@/components/sell/SubmittedNotice';
import { Alert, Button, Card } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

/**
 * Dépôt d'annonce — CDC §3.3.
 *
 * Cette page n'orchestre que le formulaire et l'envoi ; les trois blocs de
 * saisie vivent dans components/sell/.
 */
function SellForm() {
  const router = useRouter();
  const { user } = useAuth();
  const stripePending = user?.stripeConnectStatus === 'PENDING';

  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [noBrand, setNoBrand] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ListingInput>({
    resolver: zodResolver(listingSchema),
    defaultValues: { brand: null, photos: [], priceCents: 0, packageFormat: 'PETIT' },
  });

  const onSubmit = async (data: ListingInput) => {
    setFormError(null);
    try {
      await api.post('/listings', { ...data, photos: photos.map((photo) => photo.path) });
      setSubmitted(true);
    } catch (exception) {
      if (exception instanceof ApiError) {
        for (const [field, message] of Object.entries(exception.fieldErrors)) {
          form.setError(field as keyof ListingInput, { message });
        }
        setFormError(exception.message);

        // L'API indique l'étape de configuration manquante : on y accompagne la vendeuse.
        if (exception.step === 'stripe_connect' || exception.step === 'address') {
          setTimeout(() => router.push('/compte'), 2500);
        }
      } else {
        setFormError('Votre annonce n’a pas pu être envoyée. Réessayez dans un instant, in cha Allah.');
      }
    }
  };

  if (submitted) {
    return (
      <SubmittedNotice
        onNewListing={() => {
          setSubmitted(false);
          setPhotos([]);
          form.reset();
        }}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <header className="mb-8">
        <h1 className="font-playfair text-2xl md:text-3xl text-noirIntense mb-2">Vendre un article</h1>
        <p className="text-sm text-taupe">
          Prenez le temps de bien décrire votre pièce : c’est ce qui met les sœurs en confiance.
        </p>
      </header>

      {user?.stripeConnectStatus !== 'COMPLETE' && (
        <Alert
          variant="warning"
          title={
            stripePending
              ? 'Votre configuration Stripe est en cours'
              : 'Il vous manque vos coordonnées bancaires'
          }
        >
          {stripePending
            ? 'Terminez le formulaire Stripe, puis actualisez votre compte pour pouvoir publier.'
            : 'Elles sont nécessaires pour que vous puissiez recevoir le paiement de vos ventes.'}{' '}
          <Link href="/compte" className="underline font-semibold">
            {stripePending ? 'Continuer la configuration' : 'Les configurer maintenant'}
          </Link>
        </Alert>
      )}

      {formError && <Alert variant="error">{formError}</Alert>}

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <ItemFields form={form} noBrand={noBrand} onNoBrandChange={setNoBrand} />

        <Card className="mb-6">
          <PhotoUploader
            photos={photos}
            onChange={(next) => {
              setPhotos(next);
              form.setValue(
                'photos',
                next.map((photo) => photo.path),
                { shouldValidate: true },
              );
            }}
            subcategoryId={form.watch('subcategoryId')}
            error={form.formState.errors.photos?.message}
          />
        </Card>

        <PricingFields form={form} />

        <Alert variant="info" title="Chaque annonce est relue avant sa mise en ligne">
          <span className="flex items-start gap-2">
            <Info size={14} className="shrink-0 mt-0.5" />
            <span>
              C’est ce qui garantit la conformité des articles proposés entre sœurs. Vous pouvez
              consulter la{' '}
              <Link href="/legal/charte-de-moderation" target="_blank" className="underline">
                charte de modération
              </Link>{' '}
              pour connaître les critères.
            </span>
          </span>
        </Alert>

        <Button type="submit" isLoading={form.formState.isSubmitting}>
          Soumettre mon annonce
        </Button>
      </form>
    </div>
  );
}

export default function SellPage() {
  return (
    <RequireMember>
      <SellForm />
    </RequireMember>
  );
}
