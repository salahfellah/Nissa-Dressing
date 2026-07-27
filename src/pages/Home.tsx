import { useState } from 'react';
import { Search, Heart, MessageCircle, User, Menu, X, ChevronRight, LogOut, Plus, Mail, ArrowRight, ShieldCheck, Lock, Sparkles, Truck, Tag, Users } from 'lucide-react';
import Logo from '../components/ui/Logo';
import ProductCard from '../components/ui/ProductCard';
import CategoryCard from '../components/ui/CategoryCard';
import TestimonialCard from '../components/ui/TestimonialCard';
import FAQItem from '../components/ui/FAQItem';
import SectionHeader from '../components/ui/SectionHeader';
import Footer from '../components/ui/Footer';
import { useInView } from '../hooks/useInView';
import { PRODUCTS, CATEGORIES, TESTIMONIALS, FAQS, FEATURES, STATS, PROMO_BANNER, HERO_DATA } from '../data/mockData';
import type { AppView } from '../types';

function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isInView } = useInView(0.05);

  return (
    <div
      ref={ref}
      className={`${className} ${isInView ? 'animate-slide-up' : 'invisible-init'}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Home({ onLogout, onNavigate }: { onLogout?: () => void; onNavigate?: (view: AppView) => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [subscribed, setSubscribed] = useState('');

  return (
    <div className="min-h-screen bg-[#F6F1E8] font-montserrat text-[#111111] selection:bg-[#C8A96A] selection:text-white overflow-x-hidden">
      {/* Top Announcement Bar */}
      <div className="bg-[#4A4136] text-[#F6F1E8] text-xs py-2 px-4 text-center font-light tracking-wide">
        Marketplace sécurisée 100% entre sœurs • Inscription vocale obligatoire • Paiements Stripe protégés
      </div>

      {/* ===== SECTION 1: STICKY NAVIGATION ===== */}
      <header className="sticky top-0 z-50 bg-[#F6F1E8]/95 backdrop-blur-sm border-b border-[#E8E1D6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 lg:h-24">
            <div className="flex items-center gap-6">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden text-[#4A4136] p-2 -ml-2">
                {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
              <div className="flex-shrink-0 cursor-pointer">
                <Logo size="small" />
              </div>
              <nav className="hidden lg:flex items-center space-x-6 ml-4 text-xs uppercase tracking-widest font-medium">
                <a href="#" className="text-[#4A4136] hover:text-[#C8A96A] transition-colors">Accueil</a>
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate?.('categories'); }} className="text-[#B8ADA0] hover:text-[#4A4136] transition-colors">Catégories</a>
                <a href="#about" onClick={(e) => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-[#B8ADA0] hover:text-[#4A4136] transition-colors">À propos</a>
                <a href="#contact" onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-[#B8ADA0] hover:text-[#4A4136] transition-colors">Contact</a>
              </nav>
            </div>

            <div className="hidden md:flex flex-1 max-w-xs mx-6 relative">
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full bg-white border border-[#E8E1D6] rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-[#C8A96A] focus:border-[#C8A96A] transition-colors"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8ADA0] hover:text-[#C8A96A] transition-colors">
                <Search size={16} />
              </button>
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="hidden md:flex items-center space-x-3 text-[#4A4136]">
                <button onClick={() => onNavigate?.('login')} className="hover:text-[#C8A96A] transition-colors p-1.5">
                  <Heart size={18} />
                </button>
                <button onClick={() => onNavigate?.('login')} className="hover:text-[#C8A96A] transition-colors p-1.5">
                  <User size={18} />
                </button>
              </div>

              <button onClick={() => onNavigate?.('login')} className="bg-[#C8A96A] hover:bg-[#b09355] text-white px-4 py-2 rounded-sm flex items-center gap-1.5 text-xs font-medium tracking-wide transition-colors shadow-sm whitespace-nowrap">
                <Plus size={15} />
                <span className="hidden sm:inline">Vendre</span>
              </button>

              {onLogout && (
                <button onClick={onLogout} className="hidden md:block text-[#B8ADA0] hover:text-[#4A4136] transition-colors p-1.5">
                  <LogOut size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={`lg:hidden overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-[32rem] pb-4' : 'max-h-0'}`}>
          <div className="px-4 space-y-3">
            <div className="relative md:hidden">
              <input
                type="text"
                placeholder="Rechercher un article..."
                className="w-full bg-white border border-[#E8E1D6] rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-[#C8A96A]"
              />
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8ADA0]" />
            </div>
            <nav className="flex flex-col space-y-1 text-sm">
              <a href="#" className="py-2.5 text-[#4A4136] font-medium border-b border-[#E8E1D6]/50">Accueil</a>
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigate?.('categories'); }} className="py-2.5 text-[#B8ADA0] border-b border-[#E8E1D6]/50">Catégories</a>
              <a href="#about" onClick={(e) => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); setIsMenuOpen(false); }} className="py-2.5 text-[#B8ADA0] border-b border-[#E8E1D6]/50">À propos</a>
              <a href="#contact" onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); setIsMenuOpen(false); }} className="py-2.5 text-[#B8ADA0]">Contact</a>
              <div className="flex gap-3 pt-4">
                <button onClick={() => onNavigate?.('login')} className="flex-1 text-center py-2.5 border border-[#C8A96A] text-[#C8A96A] rounded-sm text-sm font-medium">Connexion</button>
                <button onClick={() => onNavigate?.('signup')} className="flex-1 text-center py-2.5 bg-[#C8A96A] text-white rounded-sm text-sm font-medium">Inscription</button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main>
        {/* ===== SECTION 2: HERO ===== */}
        <section className="relative bg-[#4A4136] overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, #C8A96A 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row min-h-[75vh] lg:min-h-[85vh]">
              <div className="lg:w-3/5 flex flex-col justify-center py-16 lg:py-24 lg:pr-16 animate-fade-up">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 w-fit">
                  <ShieldCheck size={14} className="text-[#C8A96A]" />
                  <span className="text-[#E8E1D6] text-xs tracking-wider font-light">Plateforme 100% entre sœurs</span>
                </div>
                <h1 className="font-playfair text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#F6F1E8] leading-[1.08] mb-6 whitespace-pre-line">
                  {HERO_DATA.title}
                </h1>
                <p className="text-[#E8E1D6] text-sm md:text-base leading-relaxed max-w-xl mb-8 font-light">
                  {HERO_DATA.subtitle}
                </p>
                <div className="flex flex-wrap gap-4">
                  <button onClick={() => onNavigate?.('categories')} className="group bg-[#F6F1E8] text-[#4A4136] px-8 py-3.5 rounded-sm text-sm font-medium hover:bg-white transition-all duration-300 flex items-center gap-2 shadow-lg shadow-black/10">
                    {HERO_DATA.primaryCta}
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </button>
                  <button onClick={() => document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' })} className="border border-[#C8A96A] text-[#C8A96A] px-8 py-3.5 rounded-sm text-sm font-medium hover:bg-[#C8A96A] hover:text-white transition-all duration-300">
                    {HERO_DATA.secondaryCta}
                  </button>
                </div>
                <div className="flex items-center gap-8 mt-12 pt-8 border-t border-white/10">
                  {STATS.slice(0, 3).map((stat) => (
                    <div key={stat.label}>
                      <p className="text-[#C8A96A] font-playfair text-xl md:text-2xl">{stat.value}</p>
                      <p className="text-[#B8ADA0] text-[0.6rem] uppercase tracking-widest mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:w-2/5 flex items-center justify-center py-12 lg:py-24 relative">
                <div className="relative w-full max-w-sm aspect-[3/4] rounded-sm overflow-hidden shadow-2xl">
                  <img
                    src="https://i.pinimg.com/originals/dd/7d/71/dd7d7130243c4e84cfca47115b10b4af.jpg"
                    alt="Nissa Dressing - Mode Modeste"
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#4A4136]/50 via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <div className="bg-white/90 backdrop-blur-sm rounded-sm p-4 shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#C8A96A] flex items-center justify-center flex-shrink-0">
                          <Sparkles size={18} className="text-white" />
                        </div>
                        <div>
                          <p className="text-[#4A4136] text-xs font-semibold">Nouvelle collection</p>
                          <p className="text-[#B8ADA0] text-[0.6rem]">Abayas d'été • Dès 35€</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-4 lg:-left-8 w-24 h-24 border border-[#C8A96A]/30 rounded-sm hidden lg:block" />
                <div className="absolute -top-4 -right-4 lg:-right-8 w-16 h-16 bg-[#C8A96A]/10 rounded-sm hidden lg:block" />
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 3: FEATURED CATEGORIES ===== */}
        <AnimatedSection delay={100}>
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <SectionHeader
              title="Shop by Category"
              subtitle="Explorez notre sélection d'articles par catégorie. Des pièces uniques, vérifiées et modérées avec soin."
              action={{ label: 'Voir toutes les catégories', onClick: () => onNavigate?.('categories') }}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
              {CATEGORIES.map((category) => (
                <CategoryCard key={category.id} category={category} onClick={() => onNavigate?.('categories')} />
              ))}
            </div>
          </section>
        </AnimatedSection>

        {/* ===== SECTION 4: FEATURED PRODUCTS ===== */}
        <AnimatedSection delay={100}>
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28">
            <SectionHeader
              title="Featured Products"
              subtitle="Des pièces sélectionnées par notre communauté. Qualité et élégance modestes."
              action={{ label: 'Voir tout', onClick: () => onNavigate?.('categories') }}
            />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 xl:gap-8">
              {PRODUCTS.filter((p) => p.isFeatured).slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="mt-12 text-center">
              <button onClick={() => onNavigate?.('categories')} className="border border-[#4A4136] text-[#4A4136] px-8 py-3 rounded-sm text-sm font-medium hover:bg-[#4A4136] hover:text-[#F6F1E8] transition-all duration-300 inline-flex items-center gap-2">
                Découvrir tous les articles
                <ChevronRight size={16} />
              </button>
            </div>
          </section>
        </AnimatedSection>

        {/* ===== SECTION 5: PROMOTIONAL BANNER ===== */}
        <AnimatedSection delay={100}>
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28">
            <div className="relative bg-gradient-to-r from-[#4A4136] to-[#5a4e40] rounded-sm overflow-hidden shadow-xl">
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 75% 50%, #C8A96A 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-3/5 p-10 md:p-16 lg:p-20">
                  <span className="text-[#C8A96A] text-xs tracking-[0.2em] uppercase mb-4 block font-semibold">Collection Été 2026</span>
                  <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl text-[#F6F1E8] leading-tight mb-4">
                    {PROMO_BANNER.title}
                  </h2>
                  <p className="text-[#E8E1D6] text-sm md:text-base leading-relaxed mb-8 max-w-lg font-light">
                    {PROMO_BANNER.subtitle}
                  </p>
                  <button onClick={() => onNavigate?.('categories')} className="group bg-[#C8A96A] hover:bg-[#b09355] text-white px-8 py-3.5 rounded-sm text-sm font-medium transition-all duration-300 flex items-center gap-2 shadow-lg shadow-black/20">
                    {PROMO_BANNER.cta}
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
                <div className="md:w-2/5 h-full min-h-[280px] md:min-h-[400px] relative">
                  <img
                    src={PROMO_BANNER.image}
                    alt="Nissa Dressing Collection"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#4A4136]/30" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C8A96A]/40 to-transparent" />
            </div>
          </section>
        </AnimatedSection>

        {/* ===== SECTION 6: WHY CHOOSE US ===== */}
        <AnimatedSection delay={100}>
          <section id="about" className="bg-white py-20 md:py-28 border-y border-[#E8E1D6]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <SectionHeader
                title="Why Choose Nissa ?"
                subtitle="Une plateforme conçue pour vous, par des sœurs. Sécurité, confiance et qualité au cœur de chaque transaction."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {FEATURES.map((feature, i) => (
                  <div key={feature.title} className="group bg-[#F6F1E8] rounded-sm p-6 md:p-8 border border-[#E8E1D6] hover:border-[#C8A96A]/30 hover:shadow-lg transition-all duration-500">
                    <div className="w-12 h-12 rounded-full bg-white border border-[#E8E1D6] flex items-center justify-center mb-5 group-hover:border-[#C8A96A] group-hover:bg-[#C8A96A] group-hover:text-white transition-all duration-500 text-[#4A4136]">
                      {i === 0 && <ShieldCheck size={22} />}
                      {i === 1 && <Lock size={22} />}
                      {i === 2 && <Sparkles size={22} />}
                      {i === 3 && <Truck size={22} />}
                      {i === 4 && <Users size={22} />}
                      {i === 5 && <Tag size={22} />}
                    </div>
                    <h3 className="text-base font-semibold text-[#111111] mb-2">{feature.title}</h3>
                    <p className="text-sm text-[#B8ADA0] leading-relaxed font-light">{feature.description}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-12 border-t border-[#E8E1D6]">
                {STATS.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="font-playfair text-3xl md:text-4xl text-[#C8A96A] mb-1">{stat.value}</p>
                    <p className="text-xs text-[#B8ADA0] uppercase tracking-widest">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* ===== SECTION 7: TESTIMONIALS ===== */}
        <AnimatedSection delay={100}>
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <SectionHeader
              title="Ce que disent nos sœurs"
              subtitle="Rejoignez une communauté bienveillante de plus de 5000 membres. Voici quelques témoignages de nos utilisatrices."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TESTIMONIALS.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </div>
          </section>
        </AnimatedSection>

        {/* ===== SECTION 8: FAQ PREVIEW ===== */}
        <AnimatedSection delay={100}>
          <section id="faq-section" className="bg-white py-20 md:py-28 border-y border-[#E8E1D6]">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="font-playfair text-3xl md:text-4xl text-[#111111] mb-4">Questions Fréquentes</h2>
                <p className="text-[#B8ADA0] text-sm font-light max-w-xl mx-auto">
                  Tout ce que vous devez savoir sur Nissa Dressing. Une plateforme transparente, conçue pour vous.
                </p>
              </div>
              <div className="bg-[#F6F1E8] rounded-sm p-6 md:p-8 border border-[#E8E1D6]">
                {FAQS.map((faq) => (
                  <FAQItem key={faq.id} item={faq} />
                ))}
              </div>
              <div className="text-center mt-8">
                <p className="text-sm text-[#B8ADA0] mb-3">Vous avez d'autres questions ?</p>
                <button onClick={() => document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' })} className="text-[#C8A96A] text-sm font-medium hover:text-[#b09355] transition-colors inline-flex items-center gap-1">
                  Consulter la FAQ complète <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* ===== SECTION 9: NEWSLETTER ===== */}
        <AnimatedSection delay={100}>
          <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="bg-gradient-to-r from-[#4A4136] to-[#5a4e40] rounded-sm p-10 md:p-16 text-center shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #C8A96A 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
              <div className="relative z-10 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-[#C8A96A]/20 flex items-center justify-center mx-auto mb-6">
                  <Mail size={28} className="text-[#C8A96A]" />
                </div>
                <h2 className="font-playfair text-3xl md:text-4xl text-[#F6F1E8] mb-4">Restez inspirée</h2>
                <p className="text-[#E8E1D6] text-sm md:text-base font-light mb-8 max-w-md mx-auto">
                  Recevez nos dernières nouveautés, conseils mode et offres exclusives. Pas de spam, que de l'inspiration modeste.
                </p>
                <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => { e.preventDefault(); setSubscribed('Merci ! Vous êtes abonnée.'); }}>
                  <input
                    type="email"
                    placeholder="Votre adresse email"
                    className="flex-1 bg-white/10 border border-white/20 rounded-sm px-5 py-3 text-sm text-[#F6F1E8] placeholder:text-[#B8ADA0]/60 focus:outline-none focus:border-[#C8A96A] transition-colors"
                  />
                  <button type="submit" className="bg-[#C8A96A] hover:bg-[#b09355] text-white px-6 py-3 rounded-sm text-sm font-medium transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-2">
                    {subscribed ? '✓ Abonnée' : "S'abonner"} <ArrowRight size={16} />
                  </button>
                </form>
                {subscribed && <p className="text-[#C8A96A] text-xs mt-3 font-medium">{subscribed}</p>}
                <p className="text-[#B8ADA0] text-[0.6rem] mt-4 font-light">
                  En vous inscrivant, vous acceptez notre politique de confidentialité. Désabonnement à tout moment.
                </p>
              </div>
            </div>
          </section>
        </AnimatedSection>
      </main>

      {/* ===== SECTION 10: FOOTER ===== */}
      <Footer />
    </div>
  );
}
