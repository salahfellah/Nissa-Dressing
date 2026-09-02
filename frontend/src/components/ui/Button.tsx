'use client';

import Link from 'next/link';
import { forwardRef, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outlineGold' | 'ghost' | 'danger';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-orDore text-white border border-orDore hover:bg-orDoreFonce hover:border-orDoreFonce',
  secondary: 'bg-transparent text-brunProfond border border-brunProfond hover:bg-brunProfond/5',
  outlineGold: 'bg-transparent text-orDore border border-orDore hover:bg-orDore/10',
  ghost: 'bg-transparent text-brunProfond border border-transparent hover:bg-sable',
  danger: 'bg-red-600 text-white border border-red-600 hover:bg-red-700',
};

const base =
  'py-3 px-6 text-sm font-semibold transition-all duration-200 inline-flex justify-center items-center gap-2 rounded-sm active:scale-[0.98]';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', isLoading = false, fullWidth = true, className = '', children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`${fullWidth ? 'w-full' : ''} ${base} disabled:opacity-50 disabled:pointer-events-none ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {isLoading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
});

/** Même apparence que Button, mais pour une navigation. */
export function ButtonLink({
  href,
  variant = 'primary',
  fullWidth = true,
  className = '',
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`${fullWidth ? 'w-full' : ''} ${base} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
