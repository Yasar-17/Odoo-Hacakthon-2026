interface BadgeProps {
  variant?: "success" | "warning" | "danger" | "info" | "default";
  children: React.ReactNode;
  className?: string;
}

const variants: Record<string, string> = {
  success: "bg-success-light text-success-text",
  warning: "bg-warning-light text-warning-text",
  danger: "bg-danger-light text-danger-text",
  info: "bg-info-light text-info-text",
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
