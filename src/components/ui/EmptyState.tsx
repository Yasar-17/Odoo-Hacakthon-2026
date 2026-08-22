interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  className?: string;
}

export default function EmptyState({ icon, title, description, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-6 py-16 ${className}`}>
      <span className="material-symbols-outlined text-[48px] text-outline mb-4">{icon}</span>
      <p className="font-headline text-headline-md text-primary">{title}</p>
      {description && <p className="text-body-sm text-secondary mt-1 max-w-xs">{description}</p>}
    </div>
  );
}
