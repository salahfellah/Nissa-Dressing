import type { ReactNode } from 'react';

export type BadgeVariant = 'gold' | 'neutral' | 'success' | 'danger' | 'warning' | 'info';

const variantClasses: Record<BadgeVariant, string> = {
  gold: 'bg-orDore text-white',
  neutral: 'bg-sable text-brunProfond',
  success: 'bg-emerald-700 text-white',
  danger: 'bg-red-600 text-white',
  warning: 'bg-amber-500 text-white',
  info: 'bg-brunProfond text-beigeClair',
};

export default function Badge({
  children,
  variant = 'gold',
  className = '',
  title,
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  /** Infobulle — par exemple le détail d'une erreur d'envoi. */
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 text-[0.7rem] font-medium py-1 px-2.5 rounded-sm ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
