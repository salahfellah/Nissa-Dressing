import React from 'react';
import { COLORS } from '../../theme/colors';

export type ButtonProps = {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  variant?: 'primary' | 'secondary' | 'outlineGold';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
};

export default function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled = false,
}: ButtonProps) {
  const baseStyle =
    'w-full py-3 px-6 uppercase tracking-widest text-sm font-medium transition-all duration-300 flex justify-center items-center rounded-sm';

  const variants = {
    primary: {
      backgroundColor: COLORS.orDore,
      color: '#fff',
      border: `1px solid ${COLORS.orDore}`,
    },
    secondary: {
      backgroundColor: 'transparent',
      color: COLORS.brunProfond,
      border: `1px solid ${COLORS.brunProfond}`,
    },
    outlineGold: {
      backgroundColor: 'transparent',
      color: COLORS.orDore,
      border: `1px solid ${COLORS.orDore}`,
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${className} ${disabled ? 'opacity-50 pointer-events-none' : 'hover:opacity-80 active:scale-[0.98]'}`}
      style={variants[variant]}
    >
      {children}
    </button>
  );
}
