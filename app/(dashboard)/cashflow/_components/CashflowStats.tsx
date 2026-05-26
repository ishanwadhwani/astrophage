import { CashflowSummary } from "@/types/cashflow";

const fmt = (n: number) =>
  "₹" +
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

interface Props {
  summary: CashflowSummary;
  selectedDays: number;
}

export default function CashflowStats({ summary, selectedDays }: Props) {
  const net = summary.totalExpectedIn - summary.totalExpectedOut;

  const stats = [
    {
      label: "Expected In",
      value: fmt(summary.totalExpectedIn),
      sub: `Next ${selectedDays} days`,
      color: "text-primary",
    },
    {
      label: "Expected Out",
      value: fmt(summary.totalExpectedOut),
      sub: "Bills due in period",
      color: "text-status-overdue-foreground",
    },
    {
      label: "Net Cashflow",
      value: fmt(Math.abs(net)),
      sub: net >= 0 ? "Surplus" : "Deficit",
      color:
        net >= 0
          ? "text-status-paid-foreground"
          : "text-status-overdue-foreground",
    },
    {
      label: "Overdue Receivables",
      value: fmt(summary.overdueAmount),
      sub: "Needs immediate action",
      color:
        summary.overdueAmount > 0
          ? "text-status-overdue-foreground"
          : "text-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-card border border-border rounded-2xl p-5"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {s.label}
          </p>
          <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}
