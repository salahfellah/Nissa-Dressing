'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, type MeDto, type ProfileInput } from '@nissa/shared';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Button, Input } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

/** Informations personnelles — CDC §3.2. */
export default function ProfileForm() {
  const { user, setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    if (user) reset({ prenom: user.prenom, nom: user.nom, pseudo: user.pseudo });
  }, [user, reset]);

  const onSubmit = async (data: ProfileInput) => {
    setError(null);
    setSaved(false);
    try {
      setUser(await api.put<MeDto>('/account/profile', data));
      setSaved(true);
    } catch (exception) {
      setError(
        exception instanceof ApiError
          ? exception.message
          : 'Vos informations n’ont pas pu être enregistrées.',
      );
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {saved && (
        <Alert variant="success" onClose={() => setSaved(false)}>
          Vos informations sont à jour, baraka Allahu fiki.
        </Alert>
      )}
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex flex-col sm:flex-row sm:gap-4">
        <div className="flex-1">
          <Input label="Prénom" required error={errors.prenom?.message} {...register('prenom')} />
        </div>
        <div className="flex-1">
          <Input label="Nom" required error={errors.nom?.message} {...register('nom')} />
        </div>
      </div>

      <Input
        label="Pseudo"
        hint="C’est ce nom que les autres sœurs verront sur vos annonces."
        required
        error={errors.pseudo?.message}
        {...register('pseudo')}
      />

      <Input label="Adresse e-mail" value={user.email} disabled readOnly />

      <Button type="submit" variant="secondary" isLoading={isSubmitting}>
        Enregistrer
      </Button>
    </form>
  );
}
