interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}

export default function EmptyState({ icon, title, description, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-6 py-16 ${className}`}>
      <div className="w-12 h-12 flex items-center justify-center text-surface-400 mb-4">
        {icon}
      </div>
      <p className="text-sm font-semibold text-surface-900">{title}</p>
      {description && <p className="text-sm text-surface-500 mt-1 max-w-xs">{description}</p>}
    </div>
  );
}
