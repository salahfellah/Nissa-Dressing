import { Star } from 'lucide-react';
import type { Testimonial } from '../../data/mockData';

export default function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="bg-white rounded-sm p-6 shadow-sm border border-[#E8E1D6] hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            className={i < testimonial.rating ? 'text-[#C8A96A] fill-[#C8A96A]' : 'text-[#E8E1D6]'}
          />
        ))}
      </div>
      <p className="text-sm text-[#4A4136] leading-relaxed mb-6 italic">"{testimonial.text}"</p>
      <div className="flex items-center gap-3">
        <img
          src={testimonial.avatar}
          alt={testimonial.name}
          className="w-10 h-10 rounded-full object-cover border border-[#E8E1D6]"
        />
        <div>
          <p className="text-sm font-medium text-[#111111]">{testimonial.name}</p>
          <p className="text-xs text-[#B8ADA0]">{testimonial.date}</p>
        </div>
      </div>
    </div>
  );
}
