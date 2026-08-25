'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  // Échap ferme la fenêtre : on n'oblige personne à viser la petite croix.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-noirIntense/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-beigeClair w-full max-w-lg rounded-sm shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-sable sticky top-0 bg-beigeClair">
          <h3 className="font-playfair text-lg text-brunProfond">{title}</h3>
          <button onClick={onClose} aria-label="Fermer" className="text-taupe hover:text-brunProfond">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
