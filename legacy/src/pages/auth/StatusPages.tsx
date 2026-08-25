import { useNavigate } from 'react-router-dom';
import Logo from '../../components/ui/Logo';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

// Écrans de la machine à états du membre (CDC §3.1) : un par statut intermédiaire.

function StatusShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center max-w-md mx-auto">
      <Logo size="small" />
      <h2 className="text-2xl font-playfair mt-10 mb-4 text-brunProfond">{title}</h2>
      {children}
    </div>
  );
}

export function PendingReviewPage() {
  return (
    <StatusShell title="Candidature en cours d'examen">
      <p className="text-sm text-brunProfond leading-relaxed">
        Ta demande d'inscription a été transmise à notre équipe. Tu recevras un e-mail dès qu'elle aura été
        examinée.
      </p>
    </StatusShell>
  );
}

export function ApplicationRejectedPage() {
  const navigate = useNavigate();
  return (
    <StatusShell title="Candidature refusée">
      <p className="text-sm text-brunProfond leading-relaxed mb-8">
        Ta demande d'inscription n'a pas été retenue par l'administratrice.
      </p>
      <Button variant="secondary" onClick={() => navigate('/')}>
        Retour à l'accueil
      </Button>
    </StatusShell>
  );
}

export function AwaitingPaymentPage() {
  const { paySuccess } = useAuth();
  const navigate = useNavigate();

  const handlePay = async () => {
    await paySuccess();
    navigate('/bienvenue');
  };

  return (
    <StatusShell title="Ta candidature est acceptée !">
      <p className="text-sm text-brunProfond leading-relaxed mb-8">
        Une dernière étape : règle les frais d'accès de <strong>5 €</strong>. Cela te donne un accès à vie à la
        plateforme et un boost d'annonce offert pendant 1 mois.
      </p>
      <Button variant="primary" onClick={handlePay}>
        Payer 5 € (Stripe)
      </Button>
    </StatusShell>
  );
}

export function PaymentDonePage() {
  const navigate = useNavigate();
  return (
    <StatusShell title="Paiement accepté">
      <p className="text-sm text-brunProfond leading-relaxed mb-8">
        Tu peux désormais te connecter avec tes identifiants et rejoindre le site pour commencer à vendre.
      </p>
      <Button variant="primary" onClick={() => navigate('/connexion')}>
        Aller à la connexion
      </Button>
    </StatusShell>
  );
}

export function OnboardingPage() {
  const { completeOnboarding } = useAuth();
  const navigate = useNavigate();

  const handleComplete = async () => {
    await completeOnboarding();
    navigate('/catalogue');
  };

  return (
    <StatusShell title="Configure ton compte">
      <p className="text-sm text-brunProfond leading-relaxed mb-8">
        Avant de vendre, renseigne tes informations personnelles, ton adresse postale et tes coordonnées
        bancaires (via Stripe Connect — aucune donnée bancaire n'est stockée sur le site).
      </p>
      <Button variant="primary" onClick={handleComplete}>
        Configurer avec Stripe Connect
      </Button>
    </StatusShell>
  );
}
