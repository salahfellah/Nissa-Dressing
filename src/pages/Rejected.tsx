import Button from '../components/ui/Button';
import { COLORS } from '../theme/colors';
import type { AppView } from '../types';

export default function Rejected({ onNavigate }: { onNavigate: (view: AppView) => void }) {
  return (
    <div className="flex flex-col h-full justify-center fade-in text-center mt-20 max-w-md mx-auto px-6">
      <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: COLORS.sable }}>
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h2 className="text-2xl font-playfair mb-4" style={{ color: COLORS.brunProfond }}>Désolée</h2>
      <p className="text-sm mb-8 leading-relaxed px-4" style={{ color: COLORS.brunProfond }}>
        Cette marketplace est exclusivement réservée aux femmes musulmanes voilées afin de garantir la conformité
        religieuse des articles mis en vente entre sœurs.
        <br />
        <br />
        Merci de ta compréhension.
      </p>
      <Button onClick={() => onNavigate('splash')} variant="secondary">
        Retour à l'accueil
      </Button>
    </div>
  );
}
