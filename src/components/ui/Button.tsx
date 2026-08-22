"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  arrow?: boolean;
}

const Arrow = () => (
  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
);

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", loading, arrow, children, disabled, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-label-md uppercase tracking-wider rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed";

    const variants: Record<string, string> = {
      primary: "bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container shadow-sm",
      secondary: "bg-surface-pure border border-outline-variant text-secondary hover:bg-surface-container-low hover:text-primary",
      danger: "bg-error text-on-error hover:brightness-95 focus:ring-error",
      ghost: "text-secondary hover:bg-surface-container-low hover:text-primary",
    };

    const sizes: Record<string, string> = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2.5",
      lg: "px-6 py-3",
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
        {variant === "primary" && arrow && !loading && <Arrow />}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
