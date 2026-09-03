'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  RETURN_REASON_LABELS,
  returnRequestSchema,
  type ReturnRequestInput,
} from '@nissa/shared';
import { ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { RequireMember } from '@/components/guards';
import PhotoUploader, { type UploadedPhoto } from '@/components/PhotoUploader';
import { Alert, Button, ButtonLink, Card, Select, Textarea } from '@/components/ui';
import { api, ApiError } from '@/lib/api';

/** Demande de retour / remboursement — CDC §3.7. */
function ReturnForm() {
  const { orderId } = useParams<{ orderId: string }>();

  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReturnRequestInput>({
    resolver: zodResolver(returnRequestSchema),
    defaultValues: { photos: [] },
  });

  const onSubmit = async (data: ReturnRequestInput) => {
    setFormError(null);
    try {
      await api.post(`/returns/order/${orderId}`, {
        ...data,
        photos: photos.map((photo) => photo.path),
      });
      setSubmitted(true);
    } catch (exception) {
      setFormError(
        exception instanceof ApiError ? exception.message : 'L’envoi de votre demande a échoué.',
      );
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center fade-in">
        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-orDore text-white">
          <Check size={30} />
        </div>
        <h1 className="text-2xl font-playfair mb-4 text-brunProfond">Demande transmise</h1>
        <p className="text-sm text-brunProfond leading-relaxed mb-8">
          Votre demande de retour a bien été reçue et sera examinée par l’administratrice, photos à
          l’appui. Vous recevrez une réponse par e-mail. En cas d’acceptation, un bordereau de retour
          vous sera fourni et vous serez remboursée dès la confirmation du retour.
        </p>
        <ButtonLink href={`/commande/${orderId}`}>Retour à ma commande</ButtonLink>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <Link
        href={`/commande/${orderId}`}
        className="text-sm inline-flex items-center gap-2 mb-6 text-brunProfond hover:text-orDore"
      >
        <ArrowLeft size={16} />
        Retour à la commande
      </Link>

      <header className="mb-8">
        <h1 className="font-playfair text-2xl md:text-3xl text-noirIntense mb-2">
          Demander un retour
        </h1>
        <p className="text-sm text-taupe">
          Article endommagé ou non conforme à l’annonce ? Décrivez le problème le plus précisément
          possible.
        </p>
      </header>

      {formError && <Alert variant="error">{formError}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Card className="mb-6">
          <Select label="Motif" required error={errors.reason?.message} {...register('reason')}>
            <option value="">Choisir…</option>
            {(Object.keys(RETURN_REASON_LABELS) as (keyof typeof RETURN_REASON_LABELS)[]).map(
              (reason) => (
                <option key={reason} value={reason}>
                  {RETURN_REASON_LABELS[reason]}
                </option>
              ),
            )}
          </Select>

          <Textarea
            label="Description du problème"
            rows={6}
            placeholder="Expliquez ce qui ne va pas : tache, accroc, taille différente, article non reçu…"
            hint="10 caractères minimum."
            required
            error={errors.description?.message}
            {...register('description')}
          />
        </Card>

        <Card className="mb-6">
          <PhotoUploader
            photos={photos}
            onChange={(next) => {
              setPhotos(next);
              setValue(
                'photos',
                next.map((photo) => photo.path),
                { shouldValidate: true },
              );
            }}
            max={6}
            error={errors.photos?.message}
          />
          <p className="text-xs text-taupe -mt-3">
            Photographie l’article <strong>et</strong> le problème constaté : ce sont ces images qui
            permettront de trancher.
          </p>
        </Card>

        <Alert variant="info" title="Ce qu’il se passe ensuite">
          L’administratrice examine votre demande. Si elle est acceptée, vous recevrez un bordereau de
          retour à imprimer. Le remboursement est déclenché une fois le retour confirmé.
        </Alert>

        <Button type="submit" isLoading={isSubmitting}>
          Envoyer ma demande
        </Button>
      </form>
    </div>
  );
}

export default function NewReturnPage() {
  return (
    <RequireMember>
      <ReturnForm />
    </RequireMember>
  );
}
