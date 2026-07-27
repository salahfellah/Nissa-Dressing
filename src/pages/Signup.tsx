import { useState } from 'react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import VoiceMemoRecorder from '../components/ui/VoiceMemoRecorder';
import Rejected from './Rejected';
import { COLORS } from '../theme/colors';
import type { AppView } from '../types';

type SignupFormData = {
  nom: string;
  prenom: string;
  pseudo: string;
  email: string;
  password: string;
  voileMemoUrl: string | null;
};

type SignupStep = 1 | 2 | 3 | 4 | 'rejected';

export default function Signup({
  onNavigate,
  onAuthComplete,
}: {
  onNavigate: (view: AppView) => void;
  onAuthComplete: () => void;
}) {
  const [step, setStep] = useState<SignupStep>(1);
  const [formData, setFormData] = useState<SignupFormData>({
    nom: '',
    prenom: '',
    pseudo: '',
    email: '',
    password: '',
    voileMemoUrl: null,
  });

  const updateForm = <K extends keyof SignupFormData>(field: K, value: SignupFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const goBack = () => {
    if (step === 1) onNavigate('splash');
    else if (typeof step === 'number') setStep((step - 1) as SignupStep);
  };

  // --- Step 1: eligibility pre-check ---
  const renderStep1Eligibility = () => (
    <div className="flex flex-col h-full justify-center fade-in text-center">
      <h2 className="text-2xl font-playfair mb-6" style={{ color: COLORS.brunProfond }}>Avant de commencer...</h2>
      <p className="text-sm mb-10 leading-relaxed" style={{ color: COLORS.brunProfond }}>
        Nissa Dressing est une marketplace strictement réservée à une communauté spécifique pour garantir l'éthique
        et la conformité des articles.
      </p>

      <div className="p-8 rounded-sm mb-10 shadow-sm" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.sable}` }}>
        <h3 className="text-xl font-medium mb-8" style={{ color: COLORS.orDore }}>Es-tu voilée ?</h3>
        <div className="space-y-4">
          <Button onClick={() => setStep(2)} variant="primary">
            Oui
          </Button>
          <Button onClick={() => setStep('rejected')} variant="secondary">
            Non
          </Button>
        </div>
      </div>
    </div>
  );

  // --- Step 2: personal info form ---
  const renderStep2Form = () => (
    <div className="fade-in pb-10">
      <div className="mb-8 text-center mt-6">
        <h2 className="text-2xl font-playfair mb-2" style={{ color: COLORS.brunProfond }}>Tes informations</h2>
        <p className="text-sm" style={{ color: COLORS.taupe }}>Rejoins la communauté Nissa Dressing</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setStep(3);
        }}
        className="space-y-2"
      >
        <div className="flex gap-4">
          <div className="flex-1">
            <Input label="Prénom" value={formData.prenom} onChange={(e) => updateForm('prenom', e.target.value)} required />
          </div>
          <div className="flex-1">
            <Input label="Nom" value={formData.nom} onChange={(e) => updateForm('nom', e.target.value)} required />
          </div>
        </div>
        {/* Pseudo is optional */}
        <Input
          label="Pseudo (Affiché sur le site)"
          value={formData.pseudo}
          onChange={(e) => updateForm('pseudo', e.target.value)}
          helperText="Laisse vide pour utiliser ton prénom par défaut."
        />
        <Input label="Adresse e-mail" type="email" value={formData.email} onChange={(e) => updateForm('email', e.target.value)} required />
        <Input label="Mot de passe" type="password" value={formData.password} onChange={(e) => updateForm('password', e.target.value)} required />

        <Button type="submit" variant="primary" className="mt-8">
          Continuer
        </Button>
      </form>
    </div>
  );

  // --- Step 3: voice memo confirming the voile condition ---
  const renderStep3VoiceMemo = () => (
    <div className="fade-in text-center mt-10">
      <h2 className="text-2xl font-playfair mb-4" style={{ color: COLORS.brunProfond }}>Vérification</h2>
      <p className="text-sm mb-8 leading-relaxed" style={{ color: COLORS.brunProfond }}>
        Pour préserver la confiance au sein de notre communauté, nous procédons à une vérification stricte.
      </p>

      <VoiceMemoRecorder value={formData.voileMemoUrl} onChange={(url) => updateForm('voileMemoUrl', url)} />

      <Button onClick={() => setStep(4)} variant="primary" disabled={!formData.voileMemoUrl} className="mt-8">
        Soumettre ma candidature
      </Button>
      <button onClick={() => setStep(2)} className="mt-4 text-xs underline" style={{ color: COLORS.taupe }}>
        Retour
      </button>
    </div>
  );

  // --- Step 4: success ---
  const renderStep4Success = () => (
    <div className="flex flex-col h-full justify-center fade-in text-center mt-20">
      <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: COLORS.orDore }}>
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-playfair mb-4" style={{ color: COLORS.brunProfond }}>Merci !</h2>
      <p className="text-sm mb-6 leading-relaxed" style={{ color: COLORS.brunProfond }}>
        Ta demande d'inscription a bien été transmise à notre équipe. Elle sera examinée avec attention.
      </p>
      <div className="p-4 bg-white/60 rounded-sm mb-8 text-xs text-left" style={{ borderLeft: `3px solid ${COLORS.orDore}` }}>
        <p className="font-semibold mb-2" style={{ color: COLORS.brunProfond }}>Prochaine étape :</p>
        <p style={{ color: COLORS.brunProfond }}>
          Un e-mail te sera envoyé sous peu. En cas d'acceptation, une participation financière unique de{' '}
          <strong>5 €</strong> te sera demandée. Elle te donnera un accès à vie à la plateforme et un boost
          d'annonce gratuit pendant 1 mois.
        </p>
      </div>
      <Button onClick={() => onNavigate('splash')} variant="secondary">
        Retour à l'accueil
      </Button>
      {/* Demo shortcut: skip the real moderation wait and preview the marketplace */}
      <button onClick={onAuthComplete} className="mt-4 text-xs underline" style={{ color: COLORS.orDore }}>
        (Démo) Prévisualiser le dressing
      </button>
    </div>
  );

  if (step === 'rejected') {
    return <Rejected onNavigate={onNavigate} />;
  }

  return (
    <div className="flex flex-col min-h-screen p-6 max-w-md mx-auto">
      {step !== 4 && (
        <button onClick={goBack} className="text-sm flex items-center mb-4" style={{ color: COLORS.brunProfond }}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour
        </button>
      )}

      {/* Progress Bar */}
      {step <= 3 && (
        <div className="w-full flex space-x-2 mb-8">
          <div className="h-1 flex-1 rounded-full transition-colors" style={{ backgroundColor: step >= 1 ? COLORS.orDore : COLORS.sable }}></div>
          <div className="h-1 flex-1 rounded-full transition-colors" style={{ backgroundColor: step >= 2 ? COLORS.orDore : COLORS.sable }}></div>
          <div className="h-1 flex-1 rounded-full transition-colors" style={{ backgroundColor: step >= 3 ? COLORS.orDore : COLORS.sable }}></div>
        </div>
      )}

      <div className="flex-1">
        {step === 1 && renderStep1Eligibility()}
        {step === 2 && renderStep2Form()}
        {step === 3 && renderStep3VoiceMemo()}
        {step === 4 && renderStep4Success()}
      </div>
    </div>
  );
}
