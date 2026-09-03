'use client';

import type { SignupFormInput } from '@nissa/shared';
import Link from 'next/link';
import type { UseFormReturn } from 'react-hook-form';
import { Alert, Button, Input } from '@/components/ui';

/** Informations de la candidate et acceptation des CGU — CDC §3.1. */
export default function IdentityStep({
  form,
  formError,
  onSubmit,
}: {
  form: UseFormReturn<SignupFormInput>;
  formError: string | null;
  onSubmit: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <section className="fade-in pb-10">
      <div className="mb-8 text-center mt-2">
        <h1 className="text-2xl font-playfair mb-2 text-brunProfond">Faisons connaissance</h1>
        <p className="text-sm text-taupe">Quelques informations pour créer votre espace.</p>
      </div>

      {formError && <Alert variant="error">{formError}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="flex flex-col sm:flex-row sm:gap-4">
          <div className="flex-1">
            <Input label="Prénom" required error={errors.prenom?.message} {...register('prenom')} />
          </div>
          <div className="flex-1">
            <Input label="Nom" required error={errors.nom?.message} {...register('nom')} />
          </div>
        </div>

        <Input
          label="Pseudo (facultatif)"
          hint="C’est ce nom que les autres sœurs verront sur vos annonces. Laissez vide si vous préférez : nous vous en proposerons un à partir de votre prénom."
          error={errors.pseudo?.message}
          {...register('pseudo')}
        />
        <Input
          label="Adresse e-mail"
          type="email"
          autoComplete="email"
          required
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Numéro de téléphone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="06 12 34 56 78"
          hint="Pour que l’administratrice puisse vous joindre sur WhatsApp au sujet de votre demande. Il n’est jamais montré aux autres sœurs."
          required
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Input
          label="Mot de passe"
          type="password"
          autoComplete="new-password"
          hint="8 caractères minimum, avec une majuscule, une minuscule et un chiffre."
          required
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirmez le mot de passe"
          type="password"
          autoComplete="new-password"
          hint="Saisissez-le une seconde fois : une faute de frappe vous fermerait la porte de votre propre espace."
          required
          error={errors.passwordConfirmation?.message}
          {...register('passwordConfirmation')}
        />

        <label className="flex items-start gap-2 text-xs text-brunProfond mt-4 cursor-pointer">
          <input type="checkbox" className="mt-0.5" {...register('acceptsTerms')} />
          <span>
            J’accepte les{' '}
            <Link href="/legal/cgu" target="_blank" className="underline text-orDore">
              conditions générales d’utilisation
            </Link>{' '}
            et la{' '}
            <Link href="/legal/rgpd" target="_blank" className="underline text-orDore">
              politique de confidentialité
            </Link>
            .
          </span>
        </label>
        {errors.acceptsTerms && (
          <p className="text-xs text-red-600 mt-1">{errors.acceptsTerms.message}</p>
        )}

        <Button type="submit" className="mt-8">
          Continuer
        </Button>
      </form>
    </section>
  );
}
