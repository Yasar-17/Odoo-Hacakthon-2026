interface BadgeProps {
  variant?: "success" | "warning" | "danger" | "info" | "default";
  children: React.ReactNode;
  className?: string;
}

const variants: Record<string, string> = {
  success: "bg-accent-100 text-accent-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-primary-100 text-primary-700",
  default: "bg-surface-100 text-surface-600",
};

export default function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
