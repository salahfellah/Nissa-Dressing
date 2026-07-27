import { Heart, Eye } from 'lucide-react';
import { useState } from 'react';
import type { Product } from '../../data/mockData';

export default function ProductCard({ product }: { product: Product }) {
  const [isFav, setIsFav] = useState(false);

  return (
    <div className="group cursor-pointer flex flex-col">
      <div className="relative bg-[#F6F1E8] aspect-[3/4] mb-3 overflow-hidden rounded-sm border border-[#E8E1D6] shadow-sm group-hover:shadow-md transition-all duration-500">
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-500" />
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
          <button
            onClick={() => setIsFav(!isFav)}
            className={`p-2.5 rounded-full shadow-md backdrop-blur-sm transition-all duration-300 ${
              isFav
                ? 'bg-[#C8A96A] text-white'
                : 'bg-white/90 text-[#4A4136] hover:bg-white'
            }`}
          >
            <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
          </button>
          <button className="p-2.5 rounded-full bg-white/90 text-[#4A4136] hover:bg-white shadow-md backdrop-blur-sm transition-all duration-300">
            <Eye size={16} />
          </button>
        </div>
        {product.isNew && (
          <div className="absolute top-3 left-3 bg-[#4A4136] text-[#F6F1E8] text-[0.6rem] uppercase tracking-[0.15em] font-semibold py-1 px-2.5 rounded-sm shadow-sm">
            Nouveau
          </div>
        )}
        {product.isFeatured && !product.isNew && (
          <div className="absolute top-3 left-3 bg-[#C8A96A] text-white text-[0.6rem] uppercase tracking-[0.15em] font-semibold py-1 px-2.5 rounded-sm shadow-sm">
            Une
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent h-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      <div className="flex flex-col flex-grow px-0.5">
        <div className="flex justify-between items-start mb-1">
          <h4 className="text-sm font-medium text-[#111111] line-clamp-1 leading-tight">{product.title}</h4>
          <span className="text-sm font-semibold text-[#4A4136] ml-2 whitespace-nowrap">{product.price} €</span>
        </div>
        <p className="text-xs text-[#B8ADA0] mb-1.5">
          {product.size} • {product.brand}
        </p>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[0.6rem] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium ${
            product.condition === 'Neuf'
              ? 'bg-green-100 text-green-800'
              : product.condition === 'Très bon état'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-orange-100 text-orange-800'
          }`}>
            {product.condition}
          </span>
          <div className="flex items-center gap-1 text-[#C8A96A]">
            <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-[0.6rem] text-[#4A4136]">{product.rating}</span>
          </div>
        </div>
        <div className="mt-auto pt-2 flex items-center justify-between border-t border-[#E8E1D6]/50">
          <span className="text-[0.6rem] text-[#B8ADA0] uppercase tracking-widest">{product.category}</span>
          <span className="text-[0.55rem] text-[#B8ADA0]">par {product.seller}</span>
        </div>
      </div>
    </div>
  );
}