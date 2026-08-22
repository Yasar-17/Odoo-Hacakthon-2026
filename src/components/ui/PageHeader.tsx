interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-stack-md">
      <div>
        <h1 className="font-headline text-headline-lg-mobile md:text-headline-xl text-primary tracking-tight mb-2">
          {title}
        </h1>
        {subtitle && <p className="text-body-lg text-secondary max-w-2xl">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </header>
  );
}
