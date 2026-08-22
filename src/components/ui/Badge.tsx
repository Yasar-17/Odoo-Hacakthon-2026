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
  default: "bg-secondary-container text-on-secondary-container",
};

export default function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-label-md ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
