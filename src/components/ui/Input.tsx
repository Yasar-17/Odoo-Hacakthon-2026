import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = "", ...props }, ref) => {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-surface-700">{label}</label>}
      <input
        ref={ref}
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
          error ? "border-red-300" : "border-surface-300"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
});

Input.displayName = "Input";
export default Input;
