'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { signupFormSchema, type SignupFormInput } from '@nissa/shared';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import DeclinedStep from '@/components/signup/DeclinedStep';
import EligibilityStep from '@/components/signup/EligibilityStep';
import IdentityStep from '@/components/signup/IdentityStep';
import OathStep from '@/components/signup/OathStep';
import SubmittedStep from '@/components/signup/SubmittedStep';
import { Stepper } from '@/components/ui';
import { api, ApiError } from '@/lib/api';

type Step = 'eligibility' | 'declined' | 'identity' | 'oath' | 'submitted';

/**
 * Parcours d'inscription en trois temps — CDC §3.1.
 *
 * Cette page ne fait qu'enchaîner les étapes et porter le formulaire ; chaque
 * écran vit dans components/signup/.
 */
export default function SignupPage() {
  const [step, setStep] = useState<Step>('eligibility');
  const [audio, setAudio] = useState<File | Blob | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignupFormInput>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { isVeiled: true },
  });

  const submitApplication = async () => {
    if (!audio) return;

    setFormError(null);
    setIsSubmitting(true);

    try {
      const values = form.getValues();
      const payload = new FormData();
      payload.append('prenom', values.prenom);
      payload.append('nom', values.nom);
      // Le pseudo est facultatif : laissé vide, il n'est pas transmis, et l'API
      // en fabrique un. Envoyer une chaîne vide échouerait sur la longueur.
      if (values.pseudo?.trim()) payload.append('pseudo', values.pseudo.trim());
      payload.append('email', values.email);
      payload.append('phone', values.phone);
      payload.append('password', values.password);
      payload.append('isVeiled', 'true');
      payload.append('acceptsTerms', 'true');
      payload.append(
        'audio',
        audio instanceof File ? audio : new File([audio], 'serment.webm', { type: 'audio/webm' }),
      );

      await api.upload('/auth/signup', payload);
      setStep('submitted');
    } catch (exception) {
      if (exception instanceof ApiError) {
        const fields = Object.entries(exception.fieldErrors);
        for (const [field, message] of fields) {
          form.setError(field as keyof SignupFormInput, { message });
        }
        // Les erreurs portent sur le formulaire : on y ramène la candidate.
        if (fields.length) setStep('identity');
        setFormError(exception.message);
      } else {
        setFormError('Votre candidature n’a pas pu être envoyée. Réessayez dans un instant.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepNumber = step === 'identity' ? 2 : step === 'oath' || step === 'submitted' ? 3 : 1;
  const showChrome = step !== 'declined' && step !== 'submitted';

  return (
    <main className="flex flex-col min-h-screen p-6 max-w-md mx-auto">
      {showChrome && (
        <>
          {step === 'eligibility' ? (
            <Link
              href="/"
              className="text-sm inline-flex items-center gap-2 mb-4 text-brunProfond hover:text-orDore"
            >
              <ArrowLeft size={16} />
              Retour
            </Link>
          ) : (
            <button
              onClick={() => setStep(step === 'oath' ? 'identity' : 'eligibility')}
              className="text-sm inline-flex items-center gap-2 mb-4 text-brunProfond hover:text-orDore self-start"
            >
              <ArrowLeft size={16} />
              Retour
            </button>
          )}

          {step !== 'eligibility' && <Stepper current={stepNumber} total={3} />}
        </>
      )}

      <div className="flex-1">
        {step === 'eligibility' && (
          <EligibilityStep
            onAccept={() => setStep('identity')}
            onDecline={() => setStep('declined')}
          />
        )}

        {step === 'declined' && <DeclinedStep />}

        {step === 'identity' && (
          <IdentityStep form={form} formError={formError} onSubmit={() => setStep('oath')} />
        )}

        {step === 'oath' && (
          <OathStep
            audio={audio}
            onAudioChange={setAudio}
            formError={formError}
            isSubmitting={isSubmitting}
            onSubmit={submitApplication}
          />
        )}

        {step === 'submitted' && <SubmittedStep />}
      </div>
    </main>
  );
}
