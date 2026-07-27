import { ArrowLeft, Search, ChevronRight, ShieldCheck, Sparkles, Menu, X } from 'lucide-react';
import { useState } from 'react';
import Logo from '../components/ui/Logo';
import Footer from '../components/ui/Footer';
import { useInView } from '../hooks/useInView';
import { CATEGORIES, PRODUCTS } from '../data/mockData';
import type { AppView } from '../types';

function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isInView } = useInView(0.1);
  return (
    <div ref={ref} className={`${className} ${isInView ? 'animate-slide-up' : 'invisible-init'}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function Categories({ onNavigate }: { onNavigate?: (view: AppView) => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F6F1E8] font-montserrat text-[#111111] selection:bg-[#C8A96A] selection:text-white overflow-x-hidden">
      <div className="bg-[#4A4136] text-[#F6F1E8] text-xs py-2 px-4 text-center font-light tracking-wide">
        Marketplace sécurisée 100% entre sœurs • Inscription vocale obligatoire • Paiements Stripe protégés
      </div>

      <header className="sticky top-0 z-50 bg-[#F6F1E8]/95 backdrop-blur-sm border-b border-[#E8E1D6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <button onClick={() => onNavigate?.('home')} className="text-[#4A4136] hover:text-[#C8A96A] transition-colors flex items-center gap-2 text-sm">
                <ArrowLeft size={20} />
                <span className="hidden sm:inline text-xs uppercase tracking-widest">Retour</span>
              </button>
            </div>

            <div className="flex-shrink-0 cursor-pointer" onClick={() => onNavigate?.('home')}>
              <Logo size="small" />
            </div>

            <div className="hidden md:flex flex-1 max-w-xs mx-8 relative">
              <input
                type="text"
                placeholder="Rechercher une catégorie..."
                className="w-full bg-white border border-[#E8E1D6] rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-[#C8A96A] focus:border-[#C8A96A] transition-colors"
              />
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8ADA0]" />
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-[#4A4136] p-2">
                {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <AnimatedSection>
          <section className="relative bg-[#4A4136] overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #C8A96A 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-5">
                  <Sparkles size={14} className="text-[#C8A96A]" />
                  <span className="text-[#E8E1D6] text-xs tracking-wider font-light">{CATEGORIES.length} catégories • {PRODUCTS.length} articles</span>
                </div>
                <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl text-[#F6F1E8] mb-5 leading-tight">
                  Browse by Category
                </h1>
                <p className="text-[#E8E1D6] text-sm md:text-base font-light max-w-xl mx-auto">
                  Explorez notre sélection d'articles organisée par catégorie. Des milliers de pièces uniques, vérifiées et modérées avec soin par notre communauté.
                </p>
              </div>
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection delay={100}>
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {CATEGORIES.map((category) => (
                <a
                  key={category.id}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="group relative block overflow-hidden rounded-sm aspect-[3/4] shadow-sm hover:shadow-xl transition-all duration-500"
                >
                  <img
                    src={category.image}
                    alt={category.title}
                    loading="lazy"
                    className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute inset-0 bg-[#C8A96A]/0 group-hover:bg-[#C8A96A]/10 transition-colors duration-500" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <h3 className="text-white font-playfair text-2xl md:text-3xl mb-2">{category.title}</h3>
                    <div className="flex items-center justify-between">
                      <p className="text-white/80 text-sm tracking-wide">{category.itemCount} articles disponibles</p>
                      <span className="text-[#C8A96A] group-hover:translate-x-1 transition-transform duration-300">
                        <ChevronRight size={20} />
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <section className="bg-white py-16 md:py-20 border-y border-[#E8E1D6]">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <div className="w-14 h-14 rounded-full bg-[#F6F1E8] flex items-center justify-center mx-auto mb-5 border border-[#E8E1D6]">
                <ShieldCheck size={24} className="text-[#C8A96A]" />
              </div>
              <h2 className="font-playfair text-2xl md:text-3xl text-[#111111] mb-4">Vous ne trouvez pas ce que vous cherchez ?</h2>
              <p className="text-[#B8ADA0] text-sm font-light mb-8 max-w-md mx-auto">
                Publiez une annonce ou contactez directement notre communauté. Des milliers de sœurs prêtes à vous aider.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button onClick={() => onNavigate?.('home')} className="bg-[#C8A96A] hover:bg-[#b09355] text-white px-6 py-3 rounded-sm text-sm font-medium transition-all duration-300">
                  Explorer les articles
                </button>
                <button className="border border-[#4A4136] text-[#4A4136] px-6 py-3 rounded-sm text-sm font-medium hover:bg-[#4A4136] hover:text-[#F6F1E8] transition-all duration-300">
                  Publier une annonce
                </button>
              </div>
            </div>
          </section>
        </AnimatedSection>
      </main>

      <Footer />
    </div>
  );
}
