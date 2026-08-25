import React from 'react';

type InputProps = {
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  required?: boolean;
  error?: string;
  name?: string;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, type = 'text', placeholder, value, onChange, onBlur, required = false, error, name },
  ref
) {
  return (
    <div className="mb-4 w-full text-left">
      <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-brunProfond">
        {label} {required && '*'}
      </label>
      <input
        ref={ref}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        className={`w-full p-3 bg-white/50 border rounded-sm text-noirIntense focus:outline-none focus:border-orDore transition-colors ${
          error ? 'border-red-400' : 'border-sable'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
});

export default Input;
