interface StatCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  delay: number;
  mounted: boolean;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  delay,
  mounted,
}: StatCardProps) {
  return (
    <div
      className={`bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/5 ${
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
      style={{ transitionDelay: mounted ? `${delay}ms` : "0ms" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}
        >
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        </div>
      </div>
      <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
    </div>
  );
}
