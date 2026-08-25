import { useState } from 'react';
import { Heart, ShieldCheck, ShoppingBag, ChevronRight } from 'lucide-react';
import { categories } from '../../data/categories';
import Badge from '../../components/ui/Badge';

// Données de démonstration en attendant l'API listings — à remplacer par fetchListings().
const mockProducts = [
  { id: 1, title: 'Abaya Dubaï Brodée', brand: 'Sans marque', size: 'Taille L', price: 45, originalPrice: 89, categoryId: 'femme', image: 'https://placehold.co/600x800/E8E1D6/4A4136?text=Abaya+Dubai', isBoosted: true },
  { id: 2, title: 'Khimar Soie de Médine', brand: 'Nissa Collection', size: 'Taille Unique', price: 15, originalPrice: 25, categoryId: 'accessoires', image: 'https://placehold.co/600x800/B8ADA0/FFFFFF?text=Khimar', isBoosted: false },
  { id: 3, title: 'Ensemble Jilbeb 2 pièces', brand: 'Sans marque', size: 'Taille M', price: 30, originalPrice: 45, categoryId: 'femme', image: 'https://placehold.co/600x800/4A4136/F6F1E8?text=Jilbeb', isBoosted: false },
  { id: 4, title: 'Qamis Enfant Blanc', brand: 'Sunna Kids', size: '6 ans', price: 20, originalPrice: 35, categoryId: 'enfant-garcon', image: 'https://placehold.co/600x800/E8E1D6/111111?text=Qamis+Enfant', isBoosted: false },
  { id: 5, title: 'Robe Cérémonie Bébé', brand: 'Sans marque', size: '12 mois', price: 18, originalPrice: 30, categoryId: 'bebe-fille', image: 'https://placehold.co/600x800/F6F1E8/C8A96A?text=Robe+Bebe', isBoosted: false },
  { id: 6, title: 'Sac à main minimaliste', brand: 'Zara', size: 'Unique', price: 25, originalPrice: 40, categoryId: 'accessoires', image: 'https://placehold.co/600x800/B8ADA0/111111?text=Sac+A+Main', isBoosted: true },
  { id: 7, title: 'Manteau Légiféré Oversize', brand: 'Modesty', size: 'Taille S', price: 65, originalPrice: 110, categoryId: 'femme', image: 'https://placehold.co/600x800/4A4136/E8E1D6?text=Manteau', isBoosted: false },
  { id: 8, title: 'Hijab Jersey Premium', brand: 'Sans marque', size: 'Unique', price: 8, originalPrice: 15, categoryId: 'accessoires', image: 'https://placehold.co/600x800/E8E1D6/4A4136?text=Hijab', isBoosted: false },
];

export default function CatalogPage() {
  const [activeCategoryId, setActiveCategoryId] = useState<string>('toutes');

  // Annonces boostées en tête (CDC §3.5), puis reste du catalogue.
  const filtered = (
    activeCategoryId === 'toutes' ? mockProducts : mockProducts.filter((p) => p.categoryId === activeCategoryId)
  ).slice().sort((a, b) => Number(b.isBoosted) - Number(a.isBoosted));

  const activeLabel =
    activeCategoryId === 'toutes' ? 'Toutes' : categories.find((c) => c.id === activeCategoryId)?.label ?? '';

  return (
    <>
      <nav className="bg-white border-b border-sable overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex space-x-8 whitespace-nowrap py-3">
            <li>
              <button
                onClick={() => setActiveCategoryId('toutes')}
                className={`text-xs uppercase tracking-widest font-medium transition-colors pb-1 border-b-2 ${
                  activeCategoryId === 'toutes' ? 'border-orDore text-brunProfond' : 'border-transparent text-taupe hover:text-brunProfond'
                }`}
              >
                Toutes
              </button>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <button
                  onClick={() => setActiveCategoryId(category.id)}
                  className={`text-xs uppercase tracking-widest font-medium transition-colors pb-1 border-b-2 ${
                    activeCategoryId === category.id
                      ? 'border-orDore text-brunProfond'
                      : 'border-transparent text-taupe hover:text-brunProfond'
                  }`}
                >
                  {category.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="bg-brunProfond rounded-sm overflow-hidden mb-12 flex flex-col md:flex-row shadow-lg">
          <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center">
            <span className="text-orDore text-xs tracking-[0.2em] uppercase mb-4 font-semibold">
              Le dressing de la femme musulmane
            </span>
            <h2 className="font-playfair text-3xl md:text-5xl text-beigeClair mb-6 leading-tight">
              L'élégance modeste, <br />en toute confiance.
            </h2>
            <p className="text-sable text-sm md:text-base leading-relaxed mb-8 max-w-lg font-light">
              Nissa Dressing célèbre la féminité modeste. Une marketplace réservée exclusivement aux sœurs, avec
              des articles conformes, modérés manuellement, et des paiements 100% sécurisés.
            </p>
          </div>
          <div className="md:w-2/5 bg-sable flex flex-col justify-center items-center p-8 border-l border-taupe/30">
            <div className="space-y-6 w-full max-w-xs">
              <div className="flex items-center gap-4 bg-white/60 p-4 rounded-sm backdrop-blur-sm">
                <ShieldCheck className="text-orDore" size={24} />
                <div>
                  <h4 className="text-sm font-semibold text-brunProfond">100% Vérifié</h4>
                  <p className="text-xs text-brunProfond/70">Inscription sur vocal strict</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/60 p-4 rounded-sm backdrop-blur-sm">
                <ShoppingBag className="text-orDore" size={24} />
                <div>
                  <h4 className="text-sm font-semibold text-brunProfond">Paiement sécurisé</h4>
                  <p className="text-xs text-brunProfond/70">Argent protégé jusqu'à réception</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="font-playfair text-2xl md:text-3xl text-noirIntense">
              {activeCategoryId === 'toutes' ? 'Dernières nouveautés' : activeLabel}
            </h3>
            <p className="text-taupe text-sm mt-2 font-light">Des pépites dénichées par la communauté.</p>
          </div>
          <button className="text-brunProfond text-sm font-medium hover:text-orDore flex items-center gap-1 transition-colors">
            Voir tout <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 xl:gap-8">
          {filtered.map((product) => (
            <div key={product.id} className="group cursor-pointer flex flex-col">
              <div className="relative bg-white aspect-[3/4] mb-3 overflow-hidden rounded-sm border border-sable">
                <img
                  src={product.image}
                  alt={product.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <button className="absolute top-2 right-2 p-2 bg-white/80 rounded-full text-taupe hover:text-orDore hover:bg-white backdrop-blur-sm transition-all shadow-sm">
                  <Heart size={18} />
                </button>
                {product.isBoosted && (
                  <div className="absolute top-2 left-2">
                    <Badge>Mis en avant</Badge>
                  </div>
                )}
              </div>

              <div className="flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-medium text-noirIntense line-clamp-1">{product.title}</h4>
                  <div className="flex flex-col items-end ml-2">
                    <span className="text-sm font-semibold text-brunProfond">{product.price} €</span>
                    <span className="text-xs text-taupe line-through">{product.originalPrice} €</span>
                  </div>
                </div>
                <p className="text-xs text-taupe mb-2">{product.size} • {product.brand}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
