import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import SplashPage from './pages/auth/SplashPage';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import SignupPage from './pages/auth/SignupPage';
import {
  PendingReviewPage,
  ApplicationRejectedPage,
  AwaitingPaymentPage,
  PaymentDonePage,
  OnboardingPage,
} from './pages/auth/StatusPages';
import CatalogPage from './pages/catalog/CatalogPage';

const STATUS_ROUTE: Record<string, string> = {
  pending_review: '/en-attente',
  rejected: '/candidature-refusee',
  awaiting_payment: '/paiement',
  payment_done: '/bienvenue',
  onboarding: '/configuration-compte',
};

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  if (status === 'member') return <Navigate to="/catalogue" replace />;
  if (status !== 'guest' && STATUS_ROUTE[status]) return <Navigate to={STATUS_ROUTE[status]} replace />;
  return <>{children}</>;
}

function RequireStatus({ allowed, children }: { allowed: string[]; children: React.ReactNode }) {
  const { status } = useAuth();
  if (!allowed.includes(status)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RequireMember({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  if (status !== 'member') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<GuestOnly><SplashPage /></GuestOnly>} />
      <Route path="/connexion" element={<GuestOnly><LoginPage /></GuestOnly>} />
      <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
      {/* Pas de GuestOnly ici : submitSignup fait passer le statut à pending_review pendant
          que la page affiche encore son écran de confirmation ("Merci !") — un guard réactif
          la ferait disparaître avant que la candidate ne la voie. */}
      <Route path="/inscription" element={<SignupPage />} />

      <Route
        path="/en-attente"
        element={<RequireStatus allowed={['pending_review']}><PendingReviewPage /></RequireStatus>}
      />
      <Route
        path="/candidature-refusee"
        element={<RequireStatus allowed={['rejected']}><ApplicationRejectedPage /></RequireStatus>}
      />
      <Route
        path="/paiement"
        element={<RequireStatus allowed={['awaiting_payment']}><AwaitingPaymentPage /></RequireStatus>}
      />
      <Route
        path="/bienvenue"
        element={<RequireStatus allowed={['payment_done']}><PaymentDonePage /></RequireStatus>}
      />
      <Route
        path="/configuration-compte"
        element={<RequireStatus allowed={['onboarding']}><OnboardingPage /></RequireStatus>}
      />

      <Route element={<AppLayout />}>
        <Route
          path="/catalogue"
          element={<RequireMember><CatalogPage /></RequireMember>}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
