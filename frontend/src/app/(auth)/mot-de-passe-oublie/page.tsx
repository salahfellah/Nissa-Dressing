'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@nissa/shared';
import { ArrowLeft, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Button, Input, Logo } from '@/components/ui';
import { api, ApiError } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setError(null);
    try {
      await api.post('/auth/forgot-password', data);
      setSentTo(data.email);
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : 'Envoi impossible.');
    }
  };

  return (
    <main className="flex flex-col min-h-screen p-6 fade-in max-w-md mx-auto">
      <Link
        href="/connexion"
        className="text-sm inline-flex items-center gap-2 mb-8 text-brunProfond hover:text-orDore"
      >
        <ArrowLeft size={16} />
        Retour
      </Link>

      <div className="flex-1">
        <div className="mb-10 text-center">
          <Logo size="small" />
          <h1 className="text-2xl font-playfair mt-8 mb-2 text-brunProfond">Mot de passe oublié</h1>
        </div>

        {sentTo ? (
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-6 bg-orDore text-white">
              <MailCheck size={26} />
            </div>
            <p className="text-sm text-brunProfond leading-relaxed">
              Si un compte existe pour <strong>{sentTo}</strong>, un e-mail de réinitialisation vient
              d’être envoyé. Le lien est valable une heure.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-taupe text-center mb-6">
              Renseigne ton adresse e-mail : nous t’enverrons un lien de réinitialisation.
            </p>

            {error && <Alert variant="error">{error}</Alert>}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <Input
                label="Adresse e-mail"
                type="email"
                autoComplete="email"
                placeholder="soeur@exemple.com"
                required
                error={errors.email?.message}
                {...register('email')}
              />
              <Button type="submit" isLoading={isSubmitting} className="mt-2">
                Envoyer le lien
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
