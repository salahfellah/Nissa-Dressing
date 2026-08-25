import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import AudioRecorder from '../../components/ui/AudioRecorder';
import { useAuth } from '../../context/AuthContext';

type Step = 'eligibility' | 'rejected' | 'form' | 'audio' | 'success';

const STATUS_ROUTE: Record<string, string> = {
  pending_review: '/en-attente',
  rejected: '/candidature-refusee',
  awaiting_payment: '/paiement',
  payment_done: '/bienvenue',
  onboarding: '/configuration-compte',
  member: '/catalogue',
};

const signupSchema = z.object({
  prenom: z.string().min(1, 'Prénom requis'),
  nom: z.string().min(1, 'Nom requis'),
  pseudo: z.string().min(3, 'Le pseudo doit contenir au moins 3 caractères'),
  email: z.string().email('Adresse e-mail invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  cgu: z.literal(true, { message: 'Tu dois accepter les CGU pour continuer' }),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const navigate = useNavigate();
  const { submitSignup, status } = useAuth();
  const [step, setStep] = useState<Step>('eligibility');
  const [formData, setFormData] = useState<SignupFormData | null>(null);
  const [audioFile, setAudioFile] = useState<File | Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ne redirige que si la candidate arrive déjà dans un autre statut (ex : lien direct
  // vers /inscription pendant qu'elle a une demande en cours). Ne réagit pas au changement
  // de statut déclenché par submitSignup() plus bas, pour laisser l'écran "Merci !" s'afficher.
  const initialStatusRef = useRef(status);
  useEffect(() => {
    const initialStatus = initialStatusRef.current;
    if (initialStatus !== 'guest') {
      navigate(STATUS_ROUTE[initialStatus] ?? '/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({ resolver: zodResolver(signupSchema) });

  const onFormSubmit = (data: SignupFormData) => {
    setFormData(data);
    setStep('audio');
  };

  const handleFinalSubmit = async () => {
    if (!formData) return;
    setIsSubmitting(true);
    try {
      await submitSignup({ ...formData, audioFile: 'recorded' });
      setStep('success');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = step === 'form' ? 2 : step === 'audio' || step === 'success' ? 3 : 1;

  return (
    <div className="flex flex-col min-h-screen p-6 max-w-md mx-auto">
      {step !== 'rejected' && step !== 'success' && (
        <button
          onClick={() => (step === 'eligibility' ? navigate('/') : setStep('eligibility'))}
          className="text-sm flex items-center mb-4 text-brunProfond"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour
        </button>
      )}

      {step !== 'eligibility' && step !== 'rejected' && step !== 'success' && (
        <div className="w-full flex space-x-2 mb-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className={`h-1 flex-1 rounded-full transition-colors ${progress >= n ? 'bg-orDore' : 'bg-sable'}`} />
          ))}
        </div>
      )}

      <div className="flex-1">
        {step === 'eligibility' && (
          <div className="flex flex-col h-full justify-center fade-in text-center">
            <h2 className="text-2xl font-playfair mb-6 text-brunProfond">Avant de commencer...</h2>
            <p className="text-sm mb-10 leading-relaxed text-brunProfond">
              Nissa Dressing est une marketplace strictement réservée à une communauté spécifique pour garantir
              l'éthique et la conformité des articles.
            </p>
            <div className="p-8 rounded-sm mb-10 shadow-sm bg-white border border-sable">
              <h3 className="text-xl font-medium mb-8 text-orDore">Es-tu voilée ?</h3>
              <div className="space-y-4">
                <Button onClick={() => setStep('form')} variant="primary">
                  Oui
                </Button>
                {/* Le refus est terminal : pas de retour possible vers le formulaire (CDC §3.1). */}
                <Button onClick={() => setStep('rejected')} variant="secondary">
                  Non
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'rejected' && (
          <div className="flex flex-col h-full justify-center fade-in text-center mt-20">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-sable">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-playfair mb-4 text-brunProfond">Désolée</h2>
            <p className="text-sm mb-8 leading-relaxed px-4 text-brunProfond">
              Cette marketplace est exclusivement réservée aux femmes musulmanes voilées afin de garantir la
              conformité religieuse des articles mis en vente entre sœurs.
              <br />
              <br />
              Merci de ta compréhension.
            </p>
            <Button onClick={() => navigate('/')} variant="secondary">
              Retour à l'accueil
            </Button>
          </div>
        )}

        {step === 'form' && (
          <div className="fade-in pb-10">
            <div className="mb-8 text-center mt-6">
              <h2 className="text-2xl font-playfair mb-2 text-brunProfond">Tes informations</h2>
              <p className="text-sm text-taupe">Rejoins la communauté Nissa Dressing</p>
            </div>

            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-2">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input label="Prénom" required {...register('prenom')} error={errors.prenom?.message} />
                </div>
                <div className="flex-1">
                  <Input label="Nom" required {...register('nom')} error={errors.nom?.message} />
                </div>
              </div>
              <Input label="Pseudo (affiché sur le site)" required {...register('pseudo')} error={errors.pseudo?.message} />
              <Input label="Adresse e-mail" type="email" required {...register('email')} error={errors.email?.message} />
              <Input label="Mot de passe" type="password" required {...register('password')} error={errors.password?.message} />

              <label className="flex items-start gap-2 text-xs text-brunProfond mt-4">
                <input type="checkbox" {...register('cgu')} className="mt-0.5" />
                J'accepte les conditions générales d'utilisation et la politique de confidentialité.
              </label>
              {errors.cgu && <p className="text-xs text-red-500">{errors.cgu.message}</p>}

              <Button type="submit" variant="primary" className="mt-8">
                Continuer
              </Button>
            </form>
          </div>
        )}

        {step === 'audio' && (
          <div className="fade-in text-center mt-10">
            <h2 className="text-2xl font-playfair mb-4 text-brunProfond">Vérification</h2>
            <p className="text-sm mb-8 leading-relaxed text-brunProfond">
              Pour préserver la confiance au sein de notre communauté, nous procédons à une vérification stricte.
            </p>

            <AudioRecorder onChange={setAudioFile} />

            <Button onClick={handleFinalSubmit} variant="primary" disabled={!audioFile || isSubmitting}>
              Soumettre ma candidature
            </Button>
            <button onClick={() => setStep('form')} className="mt-4 text-xs underline text-taupe">
              Retour
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col h-full justify-center fade-in text-center mt-20">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-orDore">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-playfair mb-4 text-brunProfond">Merci !</h2>
            <p className="text-sm mb-6 leading-relaxed text-brunProfond">
              Ta demande d'inscription a bien été transmise à notre équipe. Elle sera examinée avec attention.
            </p>
            <div className="p-4 bg-white/60 rounded-sm mb-8 text-xs text-left border-l-[3px] border-orDore">
              <p className="font-semibold mb-2 text-brunProfond">Prochaine étape :</p>
              <p className="text-brunProfond">
                Un e-mail te sera envoyé sous peu. En cas d'acceptation, une participation financière unique de{' '}
                <strong>5 €</strong> te sera demandée. Elle te donnera un accès à vie à la plateforme et un boost
                d'annonce gratuit pendant 1 mois.
              </p>
            </div>
            <Button onClick={() => navigate('/')} variant="secondary">
              Retour à l'accueil
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
