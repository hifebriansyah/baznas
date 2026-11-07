interface RupiahInputProps {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function RupiahInput({
  id,
  value,
  onChange,
  placeholder = "0",
  required,
  disabled,
  autoFocus,
}: RupiahInputProps) {
  const formatted =
    value > 0 ? new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value) : "";

  return (
    <div className="relative flex items-center">
      <span className="pointer-events-none absolute left-3.5 text-sm font-semibold text-slate-500">
        Rp.
      </span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        value={formatted}
        placeholder={placeholder}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          onChange(digits ? Number(digits) : 0);
        }}
        className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-4 pl-11 font-mono text-sm font-medium text-slate-900 shadow-2xs transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none disabled:bg-slate-100"
      />
    </div>
  );
}
