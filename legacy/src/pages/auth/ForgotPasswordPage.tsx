import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/ui/Logo';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import * as authApi from '../../api/auth';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await authApi.requestPasswordReset(email);
    setSent(true);
  };

  return (
    <div className="flex flex-col min-h-screen p-6 fade-in max-w-md mx-auto">
      <button onClick={() => navigate('/connexion')} className="text-sm flex items-center mb-8 text-brunProfond">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour
      </button>

      <div className="flex-1">
        <div className="mb-10 text-center">
          <Logo size="small" />
          <h2 className="text-2xl font-playfair mt-8 mb-2 text-brunProfond">Mot de passe oublié</h2>
          <p className="text-sm text-taupe">
            {sent
              ? 'Si un compte existe pour cette adresse, un e-mail de réinitialisation vient de t\'être envoyé.'
              : 'Renseigne ton e-mail, nous t\'enverrons un lien de réinitialisation.'}
          </p>
        </div>

        {!sent && (
          <form onSubmit={handleSubmit} className="space-y-2">
            <Input
              label="Adresse e-mail"
              type="email"
              placeholder="soeur@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" className="mt-4">
              Envoyer le lien
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
