import React from 'react';

type SelectProps = {
  label: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  onBlur?: React.FocusEventHandler<HTMLSelectElement>;
  required?: boolean;
  error?: string;
  name?: string;
  children: React.ReactNode;
};

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, value, onChange, onBlur, required = false, error, name, children },
  ref
) {
  return (
    <div className="mb-4 w-full text-left">
      <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-brunProfond">
        {label} {required && '*'}
      </label>
      <select
        ref={ref}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        className={`w-full p-3 bg-white/50 border rounded-sm text-noirIntense focus:outline-none focus:border-orDore transition-colors ${
          error ? 'border-red-400' : 'border-sable'
        }`}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
});

export default Select;
