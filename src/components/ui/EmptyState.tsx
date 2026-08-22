interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  className?: string;
}

export default function EmptyState({ icon, title, description, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-6 py-16 animate-fade-in ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-[32px] text-outline">{icon}</span>
      </div>
      <p className="font-headline text-lg font-semibold text-primary">{title}</p>
      {description && <p className="text-sm text-secondary mt-1.5 max-w-xs">{description}</p>}
    </div>
  );
}
