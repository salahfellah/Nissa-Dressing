import React from 'react';

type ButtonProps = {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  variant?: 'primary' | 'secondary' | 'outlineGold';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
};

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-orDore text-white border border-orDore',
  secondary: 'bg-transparent text-brunProfond border border-brunProfond',
  outlineGold: 'bg-transparent text-orDore border border-orDore',
};

export default function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 px-6 uppercase tracking-widest text-sm font-medium transition-all duration-300 flex justify-center items-center rounded-sm hover:opacity-80 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
