import React from 'react';
import { COLORS } from '../../theme/colors';

export type InputProps = {
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
  helperText?: string;
};

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  helperText,
}: InputProps) {
  return (
    <div className="mb-4 w-full text-left">
      <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: COLORS.brunProfond }}>
        {label} {required && '*'}
        {!required && (
          <span className="normal-case font-normal tracking-normal text-[0.65rem] opacity-60"> (optionnel)</span>
        )}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full p-3 bg-white/50 border focus:outline-none transition-colors rounded-sm"
        style={{ borderColor: COLORS.sable, color: COLORS.noirIntense }}
        onFocus={(e) => (e.target.style.borderColor = COLORS.orDore)}
        onBlur={(e) => (e.target.style.borderColor = COLORS.sable)}
      />
      {helperText && (
        <p className="mt-1.5 text-[0.7rem] opacity-60" style={{ color: COLORS.brunProfond }}>
          {helperText}
        </p>
      )}
    </div>
  );
}
