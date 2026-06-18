import { Banknote, AlertTriangle, CheckCircle2 } from "lucide-react";
import { InvoiceStats } from "@/types/invoice";

const fmt = (n: number) =>
  "₹" +
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function InvoiceKPICards({ stats }: { stats: InvoiceStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Outstanding receivables */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Outstanding
            </p>
            <p className="text-2xl font-bold text-foreground tabular-nums mt-2 leading-none">
              {fmt(stats.totalReceivables)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Pending &amp; overdue receivables
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Banknote className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>

      {/* Overdue */}
      <div
        className={`bg-card border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 ${
          stats.overdueCount > 0
            ? "border-status-overdue-foreground/25"
            : "border-border"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Overdue
            </p>
            <p
              className={`text-2xl font-bold tabular-nums mt-2 leading-none ${
                stats.overdueCount > 0
                  ? "text-status-overdue-foreground"
                  : "text-foreground"
              }`}
            >
              {stats.overdueCount}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.overdueCount === 1
                ? "Invoice needs attention"
                : "Invoices need attention"}
            </p>
          </div>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              stats.overdueCount > 0 ? "bg-status-overdue" : "bg-muted"
            }`}
          >
            <AlertTriangle
              className={`w-5 h-5 ${
                stats.overdueCount > 0
                  ? "text-status-overdue-foreground"
                  : "text-muted-foreground"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Collected */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Collected
            </p>
            <p className="text-2xl font-bold text-status-paid-foreground tabular-nums mt-2 leading-none">
              {stats.paidCount}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.paidCount === 1
                ? "Invoice fully paid"
                : "Invoices fully paid"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-status-paid flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-status-paid-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
