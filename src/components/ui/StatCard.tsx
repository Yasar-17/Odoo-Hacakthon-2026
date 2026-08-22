import Icon from "@/components/ui/Icon";

interface StatCardProps {
  value: string | number;
  label: string;
  icon: string;
  trend?: { value: string; tone: "default" | "error" };
}

export default function StatCard({ value, label, icon, trend }: StatCardProps) {
  return (
    <div className="bg-surface-pure rounded-xl p-6 ambient-shadow ambient-shadow-hover border border-surface-variant flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="w-12 h-12 bg-secondary-container rounded-lg text-on-secondary-container flex items-center justify-center">
          <Icon name={icon} className="text-[24px]" filled />
        </div>
        {trend && (
          <span
            className={`text-label-md uppercase px-2 py-1 rounded-full ${
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
        <p className="text-body-sm text-secondary mb-1">{label}</p>
        <h3 className="font-headline text-headline-lg text-primary">{value}</h3>
      </div>
    </div>
  );
}
