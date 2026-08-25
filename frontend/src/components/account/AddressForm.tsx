'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { addressSchema, type AddressInput, type MeDto } from '@nissa/shared';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Button, Input } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

/**
 * Adresse postale — CDC §3.2.
 *
 * Partagée entre la configuration du compte et l'espace personnel : c'est la
 * même adresse qui sert de livraison pour les achats et d'expédition sur les
 * bordereaux de vente, elle ne doit donc exister qu'à un seul endroit.
 */
export default function AddressForm({
  submitLabel,
  onSaved,
}: {
  submitLabel?: string;
  onSaved?: (me: MeDto) => void;
}) {
  const { user, setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: 'France' },
  });

  // Pré-remplit avec l'adresse connue, et propose le nom de la membre par défaut.
  useEffect(() => {
    if (!user) return;
    reset({
      recipientName: user.address?.recipientName ?? `${user.prenom} ${user.nom}`,
      line1: user.address?.line1 ?? '',
      line2: user.address?.line2 ?? '',
      postalCode: user.address?.postalCode ?? '',
      city: user.address?.city ?? '',
      country: user.address?.country ?? 'France',
      phone: user.address?.phone ?? '',
    });
  }, [user, reset]);

  const onSubmit = async (data: AddressInput) => {
    setError(null);
    try {
      const me = await api.put<MeDto>('/account/address', data);
      setUser(me);
      onSaved?.(me);
    } catch (exception) {
      setError(
        exception instanceof ApiError
          ? exception.message
          : 'Ton adresse n’a pas pu être enregistrée. Réessaie dans un instant.',
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="Nom du destinataire"
        required
        error={errors.recipientName?.message}
        {...register('recipientName')}
      />
      <Input label="Adresse" required error={errors.line1?.message} {...register('line1')} />
      <Input
        label="Complément d’adresse"
        hint="Bâtiment, appartement, digicode…"
        error={errors.line2?.message}
        {...register('line2')}
      />

      <div className="flex flex-col sm:flex-row sm:gap-4">
        <div className="sm:w-1/3">
          <Input
            label="Code postal"
            required
            error={errors.postalCode?.message}
            {...register('postalCode')}
          />
        </div>
        <div className="flex-1">
          <Input label="Ville" required error={errors.city?.message} {...register('city')} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:gap-4">
        <div className="flex-1">
          <Input label="Pays" required error={errors.country?.message} {...register('country')} />
        </div>
        <div className="flex-1">
          <Input
            label="Téléphone"
            type="tel"
            hint="Utile en cas de souci de livraison."
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>
      </div>

      <Button type="submit" variant="secondary" isLoading={isSubmitting}>
        {submitLabel ?? (user?.address ? 'Mettre à jour mon adresse' : 'Enregistrer mon adresse')}
      </Button>
    </form>
  );
}
