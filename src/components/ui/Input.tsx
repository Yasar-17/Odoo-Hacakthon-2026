import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = "", ...props }, ref) => {
  return (
    <div className="space-y-2">
      {label && <label className="block text-label-md uppercase tracking-wider text-secondary">{label}</label>}
      <input
        ref={ref}
        className={`w-full bg-surface-pure border border-border-light px-4 py-3 rounded font-body-md text-body-md text-primary placeholder:text-on-tertiary-container focus:outline-none focus:border-border-bold focus:ring-0 transition-colors ${
          error ? "border-error" : ""
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
});

Input.displayName = "Input";
export default Input;
