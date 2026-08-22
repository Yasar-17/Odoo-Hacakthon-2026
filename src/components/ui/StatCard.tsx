import Icon from "@/components/ui/Icon";

interface StatCardProps {
  value: string | number;
  label: string;
  icon: string;
  trend?: { value: string; tone: "default" | "error" };
}

export default function StatCard({ value, label, icon, trend }: StatCardProps) {
  return (
    <div className="bg-surface-pure rounded-xl p-6 ambient-shadow ambient-shadow-hover border border-border-light flex flex-col gap-4 animate-fade-in-up">
      <div className="flex justify-between items-start">
        <div className="w-11 h-11 bg-secondary-container rounded-xl text-on-secondary-container flex items-center justify-center">
          <Icon name={icon} className="text-[22px]" filled />
        </div>
        {trend && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              trend.tone === "error"
                ? "bg-error-container text-on-error-container"
                : "bg-surface-container-low text-secondary"
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-secondary mb-1">{label}</p>
        <h3 className="font-headline text-[28px] font-bold text-primary leading-none">{value}</h3>
      </div>
    </div>
  );
}
