"use client";

import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, className = "", children, ...props }, ref) => {
  return (
    <div className="space-y-2">
      {label && <label className="block text-label-md uppercase tracking-wider text-secondary">{label}</label>}
      <select
        ref={ref}
        className={`w-full bg-surface-pure border border-border-light px-4 py-2.5 rounded-lg text-body-sm text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
});

Select.displayName = "Select";
export default Select;
