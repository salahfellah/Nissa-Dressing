'use client';

import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

/** États d'attente, de vide et conteneurs de contenu. */

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {icon && <div className="mb-4 text-taupe">{icon}</div>}
      <h3 className="font-playfair text-xl text-brunProfond mb-2">{title}</h3>
      {description && <p className="text-sm text-taupe max-w-sm mb-6 leading-relaxed">{description}</p>}
      {action}
    </div>
  );
}

export function Spinner({ label = 'Un instant…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-taupe gap-3">
      <Loader2 size={28} className="animate-spin text-orDore" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white border border-sable rounded-sm p-6 ${className}`}>{children}</div>;
}

export function SectionTitle({ children, subtitle }: { children: ReactNode; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-playfair text-2xl md:text-3xl text-noirIntense">{children}</h2>
      {subtitle && <p className="text-taupe text-sm mt-2 font-light">{subtitle}</p>}
    </div>
  );
}

/** Fil d'étapes du parcours d'inscription et du dépôt d'annonce. */
export function Stepper({ current, total }: { current: number; total: number }) {
  return (
    <div
      className="w-full flex gap-2 mb-8"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Étape ${current} sur ${total}`}
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={`h-1 flex-1 rounded-full transition-colors ${
            current >= index + 1 ? 'bg-orDore' : 'bg-sable'
          }`}
        />
      ))}
    </div>
  );
}
