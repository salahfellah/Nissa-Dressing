'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordFormSchema, type ChangePasswordFormInput } from '@nissa/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Button, Input } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

/**
 * Changement de mot de passe.
 *
 * Toutes les sessions sont fermées côté serveur après un changement : on
 * reconnecte donc la membre, en l'en prévenant plutôt que de la laisser
 * découvrir une déconnexion inexpliquée.
 */
export default function PasswordForm() {
  const router = useRouter();
  const { logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormInput>({ resolver: zodResolver(changePasswordFormSchema) });

  const onSubmit = async (data: ChangePasswordFormInput) => {
    setError(null);
    try {
      // La confirmation reste au navigateur : l'API ne reçoit que les deux mots de passe.
      await api.post('/account/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      reset();
      setDone(true);
      setTimeout(() => void logout().then(() => router.push('/connexion')), 2500);
    } catch (exception) {
      setError(
        exception instanceof ApiError
          ? exception.message
          : 'Votre mot de passe n’a pas pu être modifié.',
      );
    }
  };

  if (done) {
    return (
      <Alert variant="success" title="Mot de passe modifié">
        Par sécurité, vos autres sessions ont été fermées. Nous vous redirigeons vers la connexion…
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="Mot de passe actuel"
        type="password"
        autoComplete="current-password"
        required
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
      <Input
        label="Nouveau mot de passe"
        type="password"
        autoComplete="new-password"
        hint="8 caractères minimum, avec une majuscule, une minuscule et un chiffre."
        required
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <Input
        label="Confirmez le nouveau mot de passe"
        type="password"
        autoComplete="new-password"
        required
        error={errors.newPasswordConfirmation?.message}
        {...register('newPasswordConfirmation')}
      />

      <Button type="submit" variant="secondary" isLoading={isSubmitting}>
        Modifier mon mot de passe
      </Button>
    </form>
  );
}
