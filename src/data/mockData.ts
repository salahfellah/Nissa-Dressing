export interface Product {
  id: number;
  title: string;
  brand: string;
  size: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  condition: string;
  seller: string;
  rating: number;
  isNew: boolean;
  isFeatured: boolean;
}

export interface Category {
  id: number;
  title: string;
  image: string;
  itemCount: number;
}

export interface Testimonial {
  id: number;
  name: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
}

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export const PRODUCTS: Product[] = [
  { id: 1, title: 'Robe Cérémonie Brodée Or', brand: 'Nissa Collection', size: 'L', price: 45, originalPrice: 89, category: 'Femme', image: 'https://images.pexels.com/photos/33539326/pexels-photo-33539326.jpeg?auto=compress&cs=tinysrgb&w=600', condition: 'Neuf', seller: 'Amina', rating: 4.8, isNew: false, isFeatured: true },
  { id: 2, title: 'Abaya Dubaï Soie', brand: 'Nissa Collection', size: 'Unique', price: 15, originalPrice: 25, category: 'Femme', image: 'https://images.pexels.com/photos/37577297/pexels-photo-37577297.jpeg?auto=compress&cs=tinysrgb&w=600', condition: 'Neuf', seller: 'Fatima', rating: 4.5, isNew: true, isFeatured: false },
  { id: 3, title: 'Khimar Dentelle Noire', brand: 'Modesty', size: 'M', price: 30, originalPrice: 45, category: 'Accessoires', image: 'https://images.unsplash.com/photo-1630735988694-12186aedd73d?w=600', condition: 'Très bon état', seller: 'Khadija', rating: 4.7, isNew: false, isFeatured: false },
  { id: 4, title: 'Robe Maxi Fluide Beige', brand: 'Orient Chic', size: 'S', price: 55, originalPrice: 80, category: 'Femme', image: 'https://images.pexels.com/photos/35009921/pexels-photo-35009921.jpeg?auto=compress&cs=tinysrgb&w=600', condition: 'Neuf', seller: 'Layla', rating: 4.9, isNew: true, isFeatured: true },
  { id: 5, title: 'Hijab Jersey Premium Noir', brand: 'Sans marque', size: 'Unique', price: 8, originalPrice: 15, category: 'Accessoires', image: 'https://images.unsplash.com/photo-1561442748-c50715dc32f6?w=600', condition: 'Neuf', seller: 'Mariam', rating: 4.3, isNew: false, isFeatured: false },
  { id: 6, title: 'Sac à main en Cuir Marron', brand: 'Zara', size: 'Unique', price: 35, originalPrice: 60, category: 'Accessoires', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600', condition: 'Très bon état', seller: 'Sofia', rating: 4.6, isNew: false, isFeatured: true },
  { id: 7, title: 'Abaya Drapée Premium Grise', brand: 'Modesty', size: 'S', price: 65, originalPrice: 110, category: 'Femme', image: 'https://images.pexels.com/photos/33838442/pexels-photo-33838442.jpeg?auto=compress&cs=tinysrgb&w=600', condition: 'Neuf', seller: 'Aicha', rating: 4.7, isNew: true, isFeatured: false },
  { id: 8, title: 'Hijab Chiffon Fleuri Rose', brand: 'Nissa Collection', size: 'Unique', price: 12, originalPrice: 20, category: 'Accessoires', image: 'https://images.unsplash.com/photo-1772625717865-a6300f44543e?w=600', condition: 'Neuf', seller: 'Yasmin', rating: 4.4, isNew: true, isFeatured: false },
  { id: 9, title: 'Khimar Coton Léger Blanc', brand: 'Sans marque', size: 'Unique', price: 18, originalPrice: 30, category: 'Accessoires', image: 'https://images.unsplash.com/photo-1614739524797-a12dacf0be77?w=600', condition: 'Neuf', seller: 'Nour', rating: 4.8, isNew: false, isFeatured: false },
  { id: 10, title: 'Abaya Cape Soie Noire', brand: 'Orient Chic', size: 'XL', price: 75, originalPrice: 120, category: 'Femme', image: 'https://images.pexels.com/photos/34430765/pexels-photo-34430765.jpeg?auto=compress&cs=tinysrgb&w=600', condition: 'Neuf', seller: 'Ines', rating: 4.9, isNew: true, isFeatured: true },
  { id: 11, title: 'Robe d\'Hiver Épaisse Bordeaux', brand: 'Modesty', size: 'M', price: 40, originalPrice: 65, category: 'Femme', image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600', condition: 'Très bon état', seller: 'Leila', rating: 4.5, isNew: false, isFeatured: false },
  { id: 12, title: 'Sandales Perles Fait Main', brand: 'Artisanat', size: '38', price: 25, originalPrice: 40, category: 'Accessoires', image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600', condition: 'Neuf', seller: 'Hind', rating: 4.6, isNew: true, isFeatured: false },
  { id: 13, title: 'Qamis Enfant Blanc', brand: 'Sunna Kids', size: '6 ans', price: 20, originalPrice: 35, category: 'Enfant Garçon', image: 'https://images.unsplash.com/photo-1502898746234-cdef14a6eec4?w=600', condition: 'Neuf', seller: 'Oumaima', rating: 4.2, isNew: false, isFeatured: false },
  { id: 14, title: 'Hijab Coton Bio Écru', brand: 'Éthique', size: 'Unique', price: 10, originalPrice: 18, category: 'Accessoires', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600', condition: 'Neuf', seller: 'Salma', rating: 4.7, isNew: true, isFeatured: false },
  { id: 15, title: 'Robe d\'Été Fleurie', brand: 'Zara', size: 'S', price: 28, originalPrice: 45, category: 'Femme', image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600', condition: 'Bon état', seller: 'Rania', rating: 4.3, isNew: false, isFeatured: false },
  { id: 16, title: 'Ceinture Tissée Large', brand: 'Artisanat', size: 'Unique', price: 8, category: 'Accessoires', image: 'https://images.unsplash.com/photo-1589363460779-cd717d2ed8fa?w=600', condition: 'Neuf', seller: 'Mona', rating: 4.1, isNew: true, isFeatured: false },
  { id: 17, title: 'Sac à Dos en Daïm', brand: 'Sans marque', size: 'Unique', price: 30, originalPrice: 50, category: 'Accessoires', image: 'https://images.unsplash.com/photo-1575024842588-7b2fb090ff24?w=600', condition: 'Très bon état', seller: 'Amira', rating: 4.5, isNew: false, isFeatured: false },
  { id: 18, title: 'Abaya Drapée Premium', brand: 'Nissa Collection', size: 'M', price: 55, originalPrice: 90, category: 'Femme', image: 'https://images.pexels.com/photos/35324598/pexels-photo-35324598.jpeg?auto=compress&cs=tinysrgb&w=600', condition: 'Neuf', seller: 'Kenza', rating: 4.8, isNew: false, isFeatured: true },
  { id: 19, title: 'Khimar Coton Léger Beige', brand: 'Modesty', size: 'Unique', price: 14, originalPrice: 22, category: 'Accessoires', image: 'https://images.unsplash.com/photo-1632469188022-b5db09a70fbc?w=600', condition: 'Neuf', seller: 'Sarah', rating: 4.4, isNew: true, isFeatured: false },
  { id: 20, title: 'Bottines Montantes Marron', brand: 'Zara', size: '39', price: 40, originalPrice: 70, category: 'Accessoires', image: 'https://images.unsplash.com/photo-1485125639709-a60c3a500bf1?w=600', condition: 'Très bon état', seller: 'Imane', rating: 4.6, isNew: false, isFeatured: false },
  { id: 21, title: 'Robe Maxi Fluide Verte', brand: 'Orient Chic', size: 'L', price: 50, originalPrice: 80, category: 'Femme', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600', condition: 'Neuf', seller: 'Nadia', rating: 4.7, isNew: true, isFeatured: false },
  { id: 22, title: 'Collier Argent Fait Main', brand: 'Artisanat', size: 'Unique', price: 15, category: 'Accessoires', image: 'https://images.unsplash.com/photo-1569388330292-79cc1ec67270?w=600', condition: 'Neuf', seller: 'Lina', rating: 4.3, isNew: true, isFeatured: false },
  { id: 23, title: 'Hijab Soie Naturelle', brand: 'Nissa Collection', size: 'Unique', price: 22, originalPrice: 38, category: 'Accessoires', image: 'https://images.pexels.com/photos/34151151/pexels-photo-34151151.jpeg?auto=compress&cs=tinysrgb&w=600', condition: 'Neuf', seller: 'Dounia', rating: 4.9, isNew: false, isFeatured: true },
  { id: 24, title: 'Sac Banane Tendance', brand: 'Zara', size: 'Unique', price: 18, originalPrice: 30, category: 'Accessoires', image: 'https://images.unsplash.com/photo-1758817864979-56da98f34f8d?w=600', condition: 'Bon état', seller: 'Yasmine', rating: 4.2, isNew: false, isFeatured: false },
];

export const CATEGORIES: Category[] = [
  { id: 1, title: 'Femme', image: 'https://images.pexels.com/photos/9218626/pexels-photo-9218626.jpeg?cs=srgb&dl=pexels-pnw-production-9218626.jpg&fm=jpg', itemCount: 48 },
  { id: 2, title: 'Accessoires', image: 'https://images.pexels.com/photos/36553500/pexels-photo-36553500.jpeg?auto=compress&cs=tinysrgb&w=600', itemCount: 67 },
  { id: 3, title: 'Enfant Fille', image: 'https://images.pexels.com/photos/19010879/pexels-photo-19010879.jpeg?auto=compress&cs=tinysrgb&w=600', itemCount: 32 },
  { id: 4, title: 'Enfant Garçon', image: 'https://images.pexels.com/photos/23491466/pexels-photo-23491466.jpeg?auto=compress&cs=tinysrgb&w=600', itemCount: 28 },
  { id: 5, title: 'Bébé Fille', image: 'https://images.pexels.com/photos/37332169/pexels-photo-37332169.jpeg?auto=compress&cs=tinysrgb&w=600', itemCount: 24 },
  { id: 6, title: 'Bébé Garçon', image: 'https://images.pexels.com/photos/36778161/pexels-photo-36778161.jpeg?auto=compress&cs=tinysrgb&w=600', itemCount: 19 },
];

export const TESTIMONIALS: Testimonial[] = [
  { id: 1, name: 'Amina B.', avatar: 'https://images.unsplash.com/photo-1753487050317-919a2b26a6ed?w=100', rating: 5, text: "J'ai trouvé une abaya magnifique à un prix incroyable. La qualité était encore mieux que sur les photos. Vendeuse adorable et envoi rapide !", date: 'Mars 2026' },
  { id: 2, name: 'Fatima Z.', avatar: 'https://images.unsplash.com/photo-1770802675212-3a604a2852b2?w=100', rating: 5, text: 'Nissa Dressing a complètement changé ma façon de shopping. Une communauté de confiance où chaque annonce est vérifiée. Je recommande à toutes mes sœurs.', date: 'Février 2026' },
  { id: 3, name: 'Khadija M.', avatar: 'https://images.unsplash.com/photo-1772876159855-47fcb39862a9?w=100', rating: 4, text: "Très satisfaite de mon achat. Le khimar était exactement comme décrit et la livraison a été rapide. Seul petit bémol : les frais de port étaient un peu élevés.", date: 'Janvier 2026' },
  { id: 4, name: 'Layla R.', avatar: 'https://images.unsplash.com/photo-1614739524797-a12dacf0be77?w=100', rating: 5, text: "Vendre sur Nissa a été une expérience formidable. L'inscription vocale m'a rassurée sur la sécurité de la plateforme. J'ai vendu mes articles en moins d'une semaine !", date: 'Décembre 2025' },
  { id: 5, name: 'Ines T.', avatar: 'https://images.unsplash.com/photo-1561442748-c50715dc32f6?w=100', rating: 5, text: "Enfin une plateforme qui comprend nos besoins ! Des vêtements modestes de qualité, entre sœurs de confiance. Le paiement sécurisé est un vrai plus.", date: 'Novembre 2025' },
  { id: 6, name: 'Mariam D.', avatar: 'https://images.unsplash.com/photo-1752794674886-fb12817a5e96?w=100', rating: 4, text: "Super expérience ! Les hijabs en jersey sont d'une qualité exceptionnelle. Le service client a été très réactif quand j'ai eu une question sur ma commande.", date: 'Octobre 2025' },
];

export const FAQS: FAQItem[] = [
  { id: 1, question: "Qu'est-ce que Nissa Dressing ?", answer: "Nissa Dressing est une marketplace de seconde main 100% réservée aux femmes musulmanes voilées. Nous proposons une plateforme sécurisée pour acheter et vendre des vêtements et accessoires modestes entre sœurs de confiance." },
  { id: 2, question: "Comment fonctionne l'inscription ?", answer: "L'inscription se fait en plusieurs étapes : un questionnaire d'éligibilité, vos informations personnelles, et un enregistrement vocal pour confirmer votre identité. Ce processus garantit que notre communauté reste un espace sûr et réservé aux sœurs." },
  { id: 3, question: 'Comment sont vérifiées les annonces ?', answer: "Chaque annonce est modérée manuellement par notre équipe avant d'être publiée. Nous vérifions la conformité des articles, la qualité des photos, et nous nous assurons que les descriptions sont précises et honnêtes." },
  { id: 4, question: 'Les paiements sont-ils sécurisés ?', answer: 'Oui, tous les paiements sont traités via Stripe Connect, une solution de paiement internationalement reconnue. Votre argent est protégé jusqu\'à ce que vous receviez et confirmiez votre commande.' },
  { id: 5, question: 'Comment puis-je vendre mes articles ?', answer: "Il vous suffit de créer un compte, de prendre des photos de vos articles, de les décrire avec précision et de fixer votre prix. Une fois votre annonce modérée et approuvée, elle sera visible par toute la communauté." },
  { id: 6, question: 'Quels sont les frais applicables ?', answer: "La création de compte est accessible à vie pour un montant unique de 5€. Pour les ventes, une commission de 8% est prélevée sur le prix de vente pour couvrir les frais de modération et de maintenance de la plateforme." },
];

export const FEATURES: FeatureItem[] = [
  { icon: 'ShieldCheck', title: 'Trusted Marketplace', description: "Une communauté exclusive de sœurs vérifiées. Chaque membre est authentifié par un enregistrement vocal pour garantir un environnement de confiance." },
  { icon: 'Lock', title: 'Secure Payments', description: "Paiements 100% sécurisés via Stripe Connect. Votre argent est protégé jusqu'à réception et confirmation de votre commande." },
  { icon: 'Sparkles', title: 'Quality Products', description: 'Chaque annonce est modérée manuellement par notre équipe. Nous garantissons des produits conformes à leur description et de qualité.' },
  { icon: 'Truck', title: 'Fast Delivery', description: 'Expédition rapide avec suivi inclus. La plupart des colis sont livrés sous 3 à 5 jours ouvrés en France métropolitaine.' },
  { icon: 'Users', title: 'Community Driven', description: "Une communauté bienveillante de plus de 5000 membres. Des sœurs unies par les mêmes valeurs, l'entraide et le partage." },
  { icon: 'Tag', title: 'Easy Selling', description: "Vendez en quelques clics. Publiez vos annonces gratuitement, gérez vos ventes facilement et touchez une communauté engagée." },
];

export const STATS: StatItem[] = [
  { value: '5000+', label: 'Membres actifs' },
  { value: '12000+', label: 'Annonces publiées' },
  { value: '98%', label: 'Avis positifs' },
  { value: '50+', label: 'Villes desservies' },
];

export const PROMO_BANNER = {
  title: 'Discover Unique Modest Fashion',
  subtitle: "Des pièces uniques sélectionnées avec soin par notre communauté. Chaque article raconte une histoire.",
  cta: 'Explorer la collection',
  image: 'https://images.unsplash.com/photo-1744653551668-ba7635bba924?w=800',
};

export const HERO_DATA = {
  title: "L'Élégance Modeste,\nen Toute Confiance",
  subtitle: 'La première marketplace de seconde main réservée aux sœurs. Des articles conformes, modérés manuellement, et des paiements 100% sécurisés.',
  primaryCta: 'Explorer le catalogue',
  secondaryCta: 'Comment ça marche ?',
};
