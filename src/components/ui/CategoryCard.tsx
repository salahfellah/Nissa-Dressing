import type { Category } from '../../data/mockData';

export default function CategoryCard({ category, onClick }: { category: Category; onClick?: () => void }) {
  return (
    <a href="#" onClick={(e) => { e.preventDefault(); onClick?.(); }} className="group relative block overflow-hidden rounded-sm aspect-[4/5] shadow-sm hover:shadow-lg transition-all duration-500">
      <img
        src={category.image}
        alt={category.title}
        loading="lazy"
        className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="text-white font-playfair text-xl mb-1">{category.title}</h3>
        <p className="text-white/80 text-xs tracking-wide">{category.itemCount} articles</p>
      </div>
    </a>
  );
}