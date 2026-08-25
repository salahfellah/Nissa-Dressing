import { useNavigate } from 'react-router-dom';
import Logo from '../../components/ui/Logo';
import Button from '../../components/ui/Button';

export default function SplashPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-between min-h-screen p-8 fade-in max-w-md mx-auto">
      <div className="flex-1 flex flex-col justify-center w-full mt-12">
        <Logo size="large" />

        <div className="mt-12 text-center">
          <p className="text-sm leading-relaxed mb-6 italic text-brunProfond">
            "Célébrer la féminité modeste à travers des créations élégantes et intemporelles."
          </p>
          <div className="flex justify-center items-center space-x-3 text-xs tracking-widest font-semibold text-orDore">
            <span>ÉLÉGANCE</span>
            <span>|</span>
            <span>MODESTIE</span>
            <span>|</span>
            <span>FOI</span>
          </div>
        </div>
      </div>

      <div className="w-full space-y-4 mb-8">
        <Button onClick={() => navigate('/connexion')} variant="primary">
          Se connecter
        </Button>
        <Button onClick={() => navigate('/inscription')} variant="secondary">
          Créer un compte
        </Button>
      </div>
    </div>
  );
}
