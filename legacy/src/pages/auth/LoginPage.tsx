import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../components/ui/Logo';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Adresse e-mail invalide.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/catalogue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 fade-in max-w-md mx-auto">
      <button onClick={() => navigate('/')} className="text-sm flex items-center mb-8 text-brunProfond">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour
      </button>

      <div className="flex-1">
        <div className="mb-10 text-center">
          <Logo size="small" />
          <h2 className="text-2xl font-playfair mt-8 mb-2 text-brunProfond">Bon retour</h2>
          <p className="text-sm text-taupe">Connecte-toi pour accéder à ton dressing</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          <Input
            label="Adresse e-mail"
            type="email"
            placeholder="soeur@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            error={error ?? undefined}
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
            <Link to="/mot-de-passe-oublie" className="text-xs hover:underline text-taupe">
              Mot de passe oublié ?
            </Link>
          </div>

          <Button type="submit" variant="primary" className="mt-4" disabled={isSubmitting}>
            Me connecter
          </Button>
        </form>
      </div>

      <div className="text-center mt-8 pb-4 text-sm text-brunProfond">
        Pas encore membre ?{' '}
        <Link to="/inscription" className="font-semibold underline text-orDore">
          S'inscrire
        </Link>
      </div>
    </div>
  );
}
