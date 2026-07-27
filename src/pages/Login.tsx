import { useState } from 'react';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { COLORS } from '../theme/colors';
import type { AppView } from '../types';

export default function Login({
  onNavigate,
  onAuthComplete,
}: {
  onNavigate: (view: AppView) => void;
  onAuthComplete: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Simulation de connexion
    console.log('Login attempt:', { email, password });
    onAuthComplete();
  };

  return (
    <div className="flex flex-col min-h-screen p-6 fade-in max-w-md mx-auto">
      <button onClick={() => onNavigate('splash')} className="text-sm flex items-center mb-8" style={{ color: COLORS.brunProfond }}>
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour
      </button>

      <div className="flex-1">
        <div className="mb-10 text-center">
          <Logo size="small" />
          <h2 className="text-2xl font-playfair mt-8 mb-2" style={{ color: COLORS.brunProfond }}>Bon retour</h2>
          <p className="text-sm" style={{ color: COLORS.taupe }}>Connecte-toi pour accéder à ton dressing</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          <Input
            label="Adresse e-mail"
            type="email"
            placeholder="soeur@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="text-right mb-6">
            <a href="#" className="text-xs hover:underline" style={{ color: COLORS.taupe }}>Mot de passe oublié ?</a>
          </div>

          <Button type="submit" variant="primary" className="mt-4">
            Me connecter
          </Button>
        </form>
      </div>

      <div className="text-center mt-8 pb-4 text-sm" style={{ color: COLORS.brunProfond }}>
        Pas encore membre ?{' '}
        <button onClick={() => onNavigate('signup')} className="font-semibold underline" style={{ color: COLORS.orDore }}>
          S'inscrire
        </button>
      </div>
    </div>
  );
}
