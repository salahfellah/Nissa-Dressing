import React from 'react';

type BadgeProps = {
  children: React.ReactNode;
  variant?: 'gold' | 'neutral' | 'success' | 'danger';
};

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  gold: 'bg-orDore text-white',
  neutral: 'bg-sable text-brunProfond',
  success: 'bg-emerald-600 text-white',
  danger: 'bg-red-500 text-white',
};

export default function Badge({ children, variant = 'gold' }: BadgeProps) {
  return (
    <span
      className={`inline-block text-[0.65rem] uppercase tracking-wider font-semibold py-1 px-2 rounded-sm shadow-sm ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
