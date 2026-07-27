import { ChevronRight } from 'lucide-react';

export default function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; onClick?: () => void };
}) {
  return (
    <div className="flex justify-between items-end mb-10">
      <div>
        <h2 className="font-playfair text-3xl md:text-4xl text-[#111111]">{title}</h2>
        {subtitle && <p className="text-[#B8ADA0] text-sm mt-3 font-light max-w-xl">{subtitle}</p>}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="text-[#4A4136] text-sm font-medium hover:text-[#C8A96A] flex items-center gap-1 transition-colors whitespace-nowrap group"
        >
          {action.label}
          <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
  );
}