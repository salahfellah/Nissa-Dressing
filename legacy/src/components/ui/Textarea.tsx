import React from 'react';

type TextareaProps = {
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
  required?: boolean;
  error?: string;
  name?: string;
  rows?: number;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, placeholder, value, onChange, onBlur, required = false, error, name, rows = 4 },
  ref
) {
  return (
    <div className="mb-4 w-full text-left">
      <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-brunProfond">
        {label} {required && '*'}
      </label>
      <textarea
        ref={ref}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        rows={rows}
        className={`w-full p-3 bg-white/50 border rounded-sm text-noirIntense focus:outline-none focus:border-orDore transition-colors resize-none ${
          error ? 'border-red-400' : 'border-sable'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
});

export default Textarea;
