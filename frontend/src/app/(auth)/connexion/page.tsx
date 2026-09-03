'use client';

import { loginSchema, type LoginInput } from '@nissa/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { GuestOnly } from '@/components/guards';
import { Alert, Button, Input, Logo } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { STATUS_ROUTE, useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setFormError(null);
    try {
      const me = await login(data.email, data.password);
      // Chaque statut a son écran : une membre en cours d'inscription ne doit pas
      // atterrir sur le catalogue (CDC §3.1).
      router.replace(STATUS_ROUTE[me.status] ?? '/catalogue');
    } catch (error) {
      if (error instanceof ApiError) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          setError(field as keyof LoginInput, { message });
        }
        setFormError(error.message);
      } else {
        setFormError('Connexion impossible. Réessayez dans un instant.');
      }
    }
  };

  return (
    <GuestOnly>
      <main className="flex flex-col min-h-screen p-6 fade-in max-w-md mx-auto">
        <Link
          href="/"
          className="text-sm inline-flex items-center gap-2 mb-8 text-brunProfond hover:text-orDore"
        >
          <ArrowLeft size={16} />
          Retour
        </Link>

        <div className="flex-1">
          <div className="mb-10 text-center">
            <Logo size="small" />
            <h1 className="text-2xl font-playfair mt-8 mb-2 text-brunProfond">Bon retour</h1>
            <p className="text-sm text-taupe">Connectez-vous pour accéder à votre dressing</p>
          </div>

          {formError && <Alert variant="error">{formError}</Alert>}

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
            <Input
              label="Mot de passe"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="text-right mb-6">
              <Link href="/mot-de-passe-oublie" className="text-xs hover:underline text-taupe">
                Mot de passe oublié ?
              </Link>
            </div>

            <Button type="submit" isLoading={isSubmitting}>
              Me connecter
            </Button>
          </form>
        </div>

        <p className="text-center mt-8 pb-4 text-sm text-brunProfond">
          Pas encore membre ?{' '}
          <Link href="/inscription" className="font-semibold underline text-orDore">
            S’inscrire
          </Link>
        </p>
      </main>
    </GuestOnly>
  );
}
