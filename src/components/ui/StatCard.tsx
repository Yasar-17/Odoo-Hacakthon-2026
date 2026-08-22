interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  value: string | number;
  label: string;
  trend?: { value: string; positive: boolean };
}

export default function StatCard({ icon, iconBg, value, label, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-medium font-mono ${trend.positive ? "text-success-text" : "text-danger-text"}`}>
            {trend.positive ? "+" : ""}{trend.value}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold font-mono text-surface-900">{value}</div>
      <div className="text-sm text-surface-500 mt-0.5">{label}</div>
    </div>
  );
}
