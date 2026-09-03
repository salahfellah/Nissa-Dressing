'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordFormSchema, type ResetPasswordFormInput } from '@nissa/shared';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Button, ButtonLink, Input, Logo, Spinner } from '@/components/ui';
import { api, ApiError } from '@/lib/api';

function ResetPasswordForm() {
  const token = useSearchParams().get('token') ?? '';
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { token },
  });

  const onSubmit = async (data: ResetPasswordFormInput) => {
    setError(null);
    try {
      // La confirmation reste au navigateur : l'API ne reçoit que le mot de passe.
      await api.post('/auth/reset-password', { token, password: data.password });
      setDone(true);
    } catch (exception) {
      setError(
        exception instanceof ApiError ? exception.message : 'Réinitialisation impossible.',
      );
    }
  };

  if (!token) {
    return (
      <>
        <Alert variant="error" title="Lien invalide">
          Ce lien de réinitialisation est incomplet. Refaites une demande depuis la page de connexion.
        </Alert>
        <ButtonLink href="/mot-de-passe-oublie" variant="secondary">
          Refaire une demande
        </ButtonLink>
      </>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-6 bg-orDore text-white">
          <Check size={26} />
        </div>
        <p className="text-sm text-brunProfond leading-relaxed mb-8">
          Votre mot de passe a bien été mis à jour. Toutes vos autres sessions ont été fermées par
          sécurité.
        </p>
        <ButtonLink href="/connexion">Me connecter</ButtonLink>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-taupe text-center mb-6">Choisissez un nouveau mot de passe.</p>

      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Nouveau mot de passe"
          type="password"
          autoComplete="new-password"
          hint="8 caractères minimum, avec une majuscule, une minuscule et un chiffre."
          required
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirmez le nouveau mot de passe"
          type="password"
          autoComplete="new-password"
          required
          error={errors.passwordConfirmation?.message}
          {...register('passwordConfirmation')}
        />
        <Button type="submit" isLoading={isSubmitting} className="mt-2">
          Enregistrer
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex flex-col min-h-screen p-6 fade-in max-w-md mx-auto justify-center">
      <div className="mb-10 text-center">
        <Logo size="small" />
        <h1 className="text-2xl font-playfair mt-8 mb-2 text-brunProfond">Nouveau mot de passe</h1>
      </div>

      {/* useSearchParams impose une frontière Suspense en rendu statique. */}
      <Suspense fallback={<Spinner />}>
        <ResetPasswordForm />
      </Suspense>

      <p className="text-center mt-8 text-sm">
        <Link href="/connexion" className="underline text-taupe hover:text-brunProfond">
          Retour à la connexion
        </Link>
      </p>
    </main>
  );
}
