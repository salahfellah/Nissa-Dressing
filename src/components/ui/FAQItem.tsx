import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { FAQItem as FAQType } from '../../data/mockData';

export default function FAQItem({ item }: { item: FAQType }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-[#E8E1D6] last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-5 text-left transition-colors hover:text-[#C8A96A]"
      >
        <span className="text-sm font-medium text-[#4A4136] pr-4">{item.question}</span>
        <ChevronDown
          size={18}
          className={`text-[#C8A96A] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-5' : 'max-h-0'}`}
      >
        <p className="text-sm text-[#B8ADA0] leading-relaxed">{item.answer}</p>
      </div>
    </div>
  );
}
