import { ShieldCheck } from 'lucide-react';
import Logo from '../ui/Logo';

export default function Footer() {
  return (
    <footer className="bg-brunProfond text-sable pt-16 pb-24 md:pb-8 border-t-[8px] border-orDore">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-12">
          <div className="col-span-1 flex flex-col items-start">
            <div className="bg-beigeClair p-4 rounded-sm inline-block mb-4 shadow-sm">
              <Logo size="small" />
            </div>
            <p className="text-sm font-light leading-relaxed mb-6 opacity-80">
              La première marketplace de seconde main éthique, 100% réservée aux sœurs.
            </p>
          </div>

          <div>
            <h4 className="font-playfair text-lg text-orDore mb-4">À propos</h4>
            <ul className="space-y-3 text-sm font-light opacity-90">
              <li><a href="/legal/qui-sommes-nous" className="hover:text-white hover:underline transition-all">Qui sommes-nous ?</a></li>
              <li><a href="/legal/charte-moderation" className="hover:text-white hover:underline transition-all">Charte de modération</a></li>
              <li><a href="/aide" className="hover:text-white hover:underline transition-all">Contactez-nous</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-playfair text-lg text-orDore mb-4">Aide & support</h4>
            <ul className="space-y-3 text-sm font-light opacity-90">
              <li><a href="/aide" className="hover:text-white hover:underline transition-all">Centre d'aide (FAQ)</a></li>
              <li><a href="/legal/remboursement" className="hover:text-white hover:underline transition-all">Politique de remboursement</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-playfair text-lg text-orDore mb-4">Légal</h4>
            <ul className="space-y-3 text-sm font-light opacity-90">
              <li><a href="/legal/cgu" className="hover:text-white hover:underline transition-all">CGU / CGV</a></li>
              <li><a href="/legal/mentions-legales" className="hover:text-white hover:underline transition-all">Mentions légales</a></li>
              <li><a href="/legal/rgpd" className="hover:text-white hover:underline transition-all">Politique de confidentialité (RGPD)</a></li>
              <li><a href="/legal/dac7" className="hover:text-white hover:underline transition-all">Règles fiscales (DAC7)</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-sable/20 pt-8 flex flex-col md:flex-row justify-between items-center text-xs font-light opacity-60">
          <p>&copy; 2026 Nissa Dressing. Tous droits réservés.</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <span>Paiement 100% sécurisé via Stripe Connect</span>
            <ShieldCheck size={16} />
          </div>
        </div>
      </div>
    </footer>
  );
}
