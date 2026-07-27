import { Facebook, Instagram, Twitter, Youtube, Mail, MapPin, ShieldCheck } from 'lucide-react';

const footerLinks = {
  about: [
    { label: 'Qui sommes-nous ?', href: '#' },
    { label: "Le serment d'inscription", href: '#' },
    { label: 'Modération des annonces', href: '#' },
    { label: 'Contactez-nous', href: '#' },
  ],
  help: [
    { label: "Centre d'aide (FAQ)", href: '#' },
    { label: 'Comment vendre ?', href: '#' },
    { label: 'Suivre ma commande', href: '#' },
    { label: 'Politique de remboursement', href: '#' },
  ],
  legal: [
    { label: 'Conditions Générales (CGU/CGV)', href: '#' },
    { label: 'Mentions légales', href: '#' },
    { label: 'Politique de confidentialité (RGPD)', href: '#' },
    { label: 'Règles fiscales (DAC7)', href: '#' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[#F6F1E8] border-t border-[#E8E1D6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-sm bg-[#C8A96A] flex items-center justify-center">
                <ShieldCheck size={18} className="text-white" />
              </div>
              <span className="font-playfair text-xl text-[#111111] tracking-wide">Nissa Dressing</span>
            </div>
            <p className="text-sm text-[#B8ADA0] leading-relaxed mb-6 max-w-sm">
              La marketplace dédiée à la mode modeste de seconde main. Rejoignez une communauté de sœurs de confiance pour acheter et vendre en toute sérénité.
            </p>
            <div className="flex items-center gap-3 mb-4">
              <a href="#" className="w-9 h-9 rounded-full bg-white border border-[#E8E1D6] flex items-center justify-center text-[#4A4136] hover:bg-[#C8A96A] hover:text-white hover:border-[#C8A96A] transition-all duration-300">
                <Facebook size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white border border-[#E8E1D6] flex items-center justify-center text-[#4A4136] hover:bg-[#C8A96A] hover:text-white hover:border-[#C8A96A] transition-all duration-300">
                <Instagram size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white border border-[#E8E1D6] flex items-center justify-center text-[#4A4136] hover:bg-[#C8A96A] hover:text-white hover:border-[#C8A96A] transition-all duration-300">
                <Twitter size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white border border-[#E8E1D6] flex items-center justify-center text-[#4A4136] hover:bg-[#C8A96A] hover:text-white hover:border-[#C8A96A] transition-all duration-300">
                <Youtube size={16} />
              </a>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#B8ADA0]">
              <Mail size={14} />
              <span>contact@nissadressing.com</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#111111] uppercase tracking-widest mb-5">À propos</h4>
            <ul className="space-y-3">
              {footerLinks.about.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-[#B8ADA0] hover:text-[#4A4136] transition-colors">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#111111] uppercase tracking-widest mb-5">Aide</h4>
            <ul className="space-y-3">
              {footerLinks.help.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-[#B8ADA0] hover:text-[#4A4136] transition-colors">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#111111] uppercase tracking-widest mb-5">Légal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-[#B8ADA0] hover:text-[#4A4136] transition-colors">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#E8E1D6] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#B8ADA0]">&copy; {new Date().getFullYear()} Nissa Dressing. Tous droits réservés.</p>
          <div className="flex items-center gap-6 text-xs text-[#B8ADA0]">
            <span className="flex items-center gap-1"><ShieldCheck size={12} /> Paiement sécurisé Stripe</span>
            <span className="flex items-center gap-1"><MapPin size={12} /> France</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
