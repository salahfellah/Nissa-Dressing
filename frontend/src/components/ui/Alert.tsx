'use client';

import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

const styles: Record<AlertVariant, { wrapper: string; icon: ReactNode }> = {
  info: {
    wrapper: 'bg-white border-l-3 border-orDore text-brunProfond',
    icon: <Info size={16} className="text-orDore shrink-0 mt-0.5" />,
  },
  success: {
    wrapper: 'bg-emerald-50 border-l-3 border-emerald-600 text-emerald-900',
    icon: <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />,
  },
  warning: {
    wrapper: 'bg-amber-50 border-l-3 border-amber-500 text-amber-900',
    icon: <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />,
  },
  error: {
    wrapper: 'bg-red-50 border-l-3 border-red-500 text-red-900',
    icon: <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />,
  },
};

export default function Alert({
  variant = 'info',
  title,
  children,
  onClose,
}: {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
  onClose?: () => void;
}) {
  const style = styles[variant];

  return (
    <div className={`flex gap-3 p-4 rounded-sm text-sm mb-4 ${style.wrapper}`} role="alert">
      {style.icon}
      <div className="flex-1 leading-relaxed">
        {title && <p className="font-semibold mb-1">{title}</p>}
        {children}
      </div>
      {onClose && (
        <button onClick={onClose} aria-label="Fermer" className="shrink-0 opacity-60 hover:opacity-100">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
