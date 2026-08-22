"use client";

import { SelectHTMLAttributes, forwardRef } from "react";
import Icon from "@/components/ui/Icon";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, className = "", children, ...props }, ref) => {
  return (
    <div className="space-y-2">
      {label && <label className="block text-label-md uppercase tracking-wider text-secondary">{label}</label>}
      <div className="relative">
        <select
          ref={ref}
          className={`w-full bg-surface-pure border border-border-light px-4 py-3 pr-10 rounded-lg text-sm text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 cursor-pointer appearance-none ${className}`}
          {...props}
        >
          {children}
        </select>
        <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-outline pointer-events-none" />
      </div>
    </div>
  );
});

Select.displayName = "Select";
export default Select;
