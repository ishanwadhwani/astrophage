import Link from "next/link";
import { CashflowDay } from "@/types/cashflow";

const fmtFull = (n: number) =>
  "₹" +
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const dayLabel = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

const weekday = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-IN", { weekday: "short" });

const isToday = (dateStr: string) =>
  new Date(dateStr).toDateString() === new Date().toDateString();

interface Props {
  activeDays: CashflowDay[];
}

export default function CashflowTimeline({ activeDays }: Props) {
  if (activeDays.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">
          Day-by-Day Breakdown
        </h2>
      </div>

      <div className="divide-y divide-border">
        {activeDays.map((day) => {
          const net = day.expectedIn - day.expectedOut;
          const todayDay = isToday(day.date);

          return (
            <div key={day.date} className="px-6 py-5">
              {/* Day header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      todayDay
                        ? "bg-primary"
                        : day.invoices.some((i) => i.status === "OVERDUE") ||
                            day.bills.some((b) => b.status === "OVERDUE")
                          ? "bg-status-overdue-foreground"
                          : "bg-primary/40"
                    }`}
                  />
                  <span className="text-sm font-semibold text-foreground">
                    {todayDay ? "Today" : dayLabel(day.date)}
                    <span className="text-xs font-normal text-muted-foreground ml-1.5">
                      {weekday(day.date)}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  {day.expectedIn > 0 && (
                    <span className="text-primary font-semibold">
                      +{fmtFull(day.expectedIn)}
                    </span>
                  )}
                  {day.expectedOut > 0 && (
                    <span className="text-status-overdue-foreground font-semibold">
                      -{fmtFull(day.expectedOut)}
                    </span>
                  )}
                  <span
                    className={`font-bold ${
                      net >= 0
                        ? "text-status-paid-foreground"
                        : "text-status-overdue-foreground"
                    }`}
                  >
                    Net: {net >= 0 ? "+" : ""}
                    {fmtFull(net)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pl-4">
                {/* Inflows */}
                {day.invoices.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                      ↑ Inflow
                    </p>
                    <div className="space-y-1.5">
                      {day.invoices.map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Link
                              href={`/invoices/${inv.id}`}
                              className="text-xs font-medium text-primary hover:underline flex-shrink-0"
                            >
                              #{inv.number}
                            </Link>
                            <span className="text-xs text-muted-foreground truncate">
                              {inv.clientName}
                            </span>
                            {inv.status === "OVERDUE" && (
                              <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-status-overdue text-status-overdue-foreground flex-shrink-0">
                                Overdue
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-foreground flex-shrink-0">
                            {fmtFull(inv.outstanding)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Outflows */}
                {day.bills.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-status-overdue-foreground uppercase tracking-wide mb-2">
                      ↓ Outflow
                    </p>
                    <div className="space-y-1.5">
                      {day.bills.map((bill) => (
                        <div
                          key={bill.id}
                          className="flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-medium text-foreground flex-shrink-0">
                              {bill.vendorName}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {bill.description}
                            </span>
                            {bill.status === "OVERDUE" && (
                              <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-status-overdue text-status-overdue-foreground flex-shrink-0">
                                Overdue
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-status-overdue-foreground flex-shrink-0">
                            {fmtFull(bill.outstanding)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
