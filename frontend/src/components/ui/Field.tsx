'use client';

import { forwardRef, useId, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Champs de formulaire.
 *
 * Tous partagent le même habillage (libellé, aide, erreur), ce qui rend les
 * messages cohérents d'un écran à l'autre. Le libellé est relié au champ par
 * `htmlFor`/`id`, et l'aide comme l'erreur par `aria-describedby` : toucher le
 * libellé donne le focus au champ, et un lecteur d'écran annonce l'erreur.
 */

const control = (hasError: boolean): string =>
  `w-full p-3 bg-white border rounded-sm text-noirIntense placeholder:text-taupe/70 focus:outline-none focus:border-orDore focus:ring-1 focus:ring-orDore transition-colors ${
    hasError ? 'border-red-400' : 'border-sable'
  }`;

interface FieldShellProps {
  id: string;
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

function FieldShell({ id, label, required, error, hint, children }: FieldShellProps) {
  return (
    <div className="mb-4 w-full text-left">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium mb-2 text-brunProfond"
        >
          {label} {required && <span className="text-orDore">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p id={`${id}-aide`} className="mt-1.5 text-xs text-taupe">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-erreur`} className="mt-1.5 text-xs text-red-600 flex items-start gap-1">
          <AlertCircle size={12} className="shrink-0 mt-0.5" />
          {error}
        </p>
      )}
    </div>
  );
}

/** Attributs d'accessibilité communs à tous les contrôles. */
const aria = (id: string, error?: string, hint?: string) => ({
  id,
  'aria-invalid': error ? true : undefined,
  'aria-describedby': error ? `${id}-erreur` : hint ? `${id}-aide` : undefined,
});

/** Conservé pour les cas où un contrôle sur mesure a besoin du même habillage. */
export function Field({
  label,
  required,
  error,
  hint,
  children,
}: Omit<FieldShellProps, 'id'> & { id?: string }) {
  const generated = useId();
  return (
    <FieldShell id={generated} label={label} required={required} error={error} hint={hint}>
      {children}
    </FieldShell>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, required, className = '', id, onWheel, ...rest },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;

  /**
   * Un `input[type=number]` qui a le focus voit sa valeur changer quand la
   * molette passe dessus : la page défile, le montant bouge, et rien de ce que
   * la vendeuse a fait ne ressemblait à une saisie. Une annonce déposée à 45 €
   * s'est ainsi retrouvée publiée à 44,61 € — trente-neuf crans de 0,01 €.
   *
   * Le champ perd le focus au premier cran : la page continue de défiler
   * normalement et la valeur ne bouge plus. Le garde-fou vit ici plutôt que
   * sur chaque appel, car il protège aussi la commission, le prix du boost et
   * les frais de port du back-office, où une valeur changée à l'insu de
   * l'administratrice se répercute sur toutes les commandes.
   */
  const figerAuDefilement = (event: React.WheelEvent<HTMLInputElement>) => {
    if (event.currentTarget.type === 'number') event.currentTarget.blur();
    onWheel?.(event);
  };

  return (
    <FieldShell id={fieldId} label={label} required={required} error={error} hint={hint}>
      <input
        ref={ref}
        required={required}
        className={`${control(!!error)} ${className}`}
        onWheel={figerAuDefilement}
        {...aria(fieldId, error, hint)}
        {...rest}
      />
    </FieldShell>
  );
});

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, required, className = '', id, children, ...rest },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;

  return (
    <FieldShell id={fieldId} label={label} required={required} error={error} hint={hint}>
      <select
        ref={ref}
        required={required}
        className={`${control(!!error)} ${className}`}
        {...aria(fieldId, error, hint)}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
});

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, required, rows = 4, className = '', id, ...rest },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;

  return (
    <FieldShell id={fieldId} label={label} required={required} error={error} hint={hint}>
      <textarea
        ref={ref}
        rows={rows}
        required={required}
        className={`${control(!!error)} resize-y ${className}`}
        {...aria(fieldId, error, hint)}
        {...rest}
      />
    </FieldShell>
  );
});
