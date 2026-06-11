"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUp, ArrowDown, ChevronDown, ChevronLeft, ChevronRight,
  CalendarDays, RefreshCw, AlertCircle, ArrowUpDown,
} from "lucide-react";
import { CashflowDay } from "@/types/cashflow";

const PAGE_SIZE = 5;

const fmtFull = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtCompact = (n: number) =>
  n >= 100_000 ? `₹${(n / 100_000).toFixed(1)}L`
  : n >= 1_000 ? `₹${(n / 1_000).toFixed(1)}K`
  : `₹${n}`;

const weekday = (s: string) =>
  new Date(s).toLocaleDateString("en-IN", { weekday: "long" });

const monthShort = (s: string) =>
  new Date(s).toLocaleDateString("en-IN", { month: "short" });

const dayNum = (s: string) => new Date(s).getDate();

const isToday = (s: string) =>
  new Date(s).toDateString() === new Date().toDateString();

interface Props { activeDays: CashflowDay[] }

export default function CashflowTimeline({ activeDays }: Props) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [mounted,      setMounted]      = useState(false);
  const [upcoming, setUpcoming] = useState(true); // true = upcoming first (soonest), false = past first
  const [page,     setPage]     = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(id);
  }, []);

  const toggleDay = (date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  };

  // All hooks above — safe to derive values now
  const sorted = useMemo(
    () => upcoming ? [...activeDays].reverse() : [...activeDays],
    [activeDays, upcoming],
  );

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  // Clamp page in case sort changed; avoids the setState-in-effect pattern
  const safePage   = Math.min(page, Math.max(0, totalPages - 1));
  const pageDays   = sorted.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const maxFlow = Math.max(
    ...activeDays.map((d) =>
      Math.max(d.expectedIn + d.projectedIn, d.expectedOut + d.projectedOut)
    ), 1,
  );

  if (activeDays.length === 0) return null;

  return (
    <div
      className={`bg-card border border-border rounded-2xl overflow-hidden transition-all duration-500 ${
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <CalendarDays className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Day-by-Day Breakdown</h2>
            <p className="text-xs text-muted-foreground">
              {activeDays.length} active {activeDays.length === 1 ? "day" : "days"}
              {totalPages > 1 && ` · page ${page + 1} of ${totalPages}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort toggle */}
          <button
            onClick={() => { setUpcoming((v) => !v); setPage(0); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-all duration-150"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {upcoming ? "Upcoming Bills" : "Present Bills"}
          </button>

          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-chart-1" />Confirmed
            </span>
            <span className="flex items-center gap-1.5">
              <RefreshCw className="w-2.5 h-2.5" />Recurring
            </span>
          </div>
        </div>
      </div>

      {/* Day cards */}
      <div className="p-4 space-y-2">
        {pageDays.map((day, idx) => {
          const net       = day.expectedIn - day.expectedOut;
          const todayDay  = isToday(day.date);
          const hasOverdue =
            day.invoices.some((i) => i.status === "OVERDUE") ||
            day.bills.some((b) => b.status === "OVERDUE");
          const isExpanded = expandedDays.has(day.date);
          const inTotal   = day.expectedIn + day.projectedIn;
          const outTotal  = day.expectedOut + day.projectedOut;
          const inPct     = (inTotal / maxFlow) * 100;
          const outPct    = (outTotal / maxFlow) * 100;
          const itemCount = day.invoices.length + day.bills.length
            + day.projectedInvoices.length + day.projectedBills.length;

          return (
            <div
              key={day.date}
              className={`rounded-xl border transition-all duration-300 ${
                todayDay
                  ? "border-primary/40 bg-primary/2.5 shadow-sm"
                  : "border-border/70 hover:border-border hover:shadow-sm hover:shadow-black/5"
              }`}
              style={{
                transitionDelay: mounted ? `${idx * 30}ms` : "0ms",
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(8px)",
              }}
            >
              {/* Summary row */}
              <button
                onClick={() => toggleDay(day.date)}
                className="w-full px-5 py-4 flex items-center gap-4 text-left group"
              >
                {/* Date block */}
                <div className={`shrink-0 w-11 text-center ${todayDay ? "text-primary" : "text-foreground"}`}>
                  <div className={`text-2xl font-bold leading-none tabular-nums ${todayDay ? "text-primary" : "text-foreground"}`}>
                    {dayNum(day.date)}
                  </div>
                  <div className={`text-[10px] font-semibold uppercase tracking-wide mt-0.5 ${todayDay ? "text-primary/70" : "text-muted-foreground"}`}>
                    {monthShort(day.date)}
                  </div>
                  {todayDay && (
                    <div className="mt-1.5 px-1 py-0.5 bg-primary text-primary-foreground text-[8px] font-bold rounded uppercase tracking-wider leading-none">
                      Today
                    </div>
                  )}
                </div>

                {/* Bars */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-xs font-medium text-muted-foreground">{weekday(day.date)}</span>
                    {hasOverdue && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-status-overdue text-status-overdue-foreground">
                        <AlertCircle className="w-2.5 h-2.5" />Overdue
                      </span>
                    )}
                    {itemCount > 0 && (
                      <span className="text-[10px] text-muted-foreground/60">
                        {itemCount} {itemCount === 1 ? "item" : "items"}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {inTotal > 0 && (
                      <div className="flex items-center gap-2.5">
                        <ArrowUp className="w-2.5 h-2.5 text-chart-1 shrink-0" />
                        <span className="w-14 shrink-0 text-right text-[10px] font-semibold text-chart-1 tabular-nums">
                          {fmtCompact(inTotal)}
                        </span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full flex">
                            <div className="h-full bg-chart-1 rounded-l-full transition-all duration-500"
                              style={{ width: `${(day.expectedIn / inTotal) * inPct}%` }} />
                            <div className="h-full bg-chart-1/40 rounded-r-full transition-all duration-500"
                              style={{ width: `${(day.projectedIn / inTotal) * inPct}%` }} />
                          </div>
                        </div>
                      </div>
                    )}
                    {outTotal > 0 && (
                      <div className="flex items-center gap-2.5">
                        <ArrowDown className="w-2.5 h-2.5 text-chart-3 shrink-0" />
                        <span className="w-14 shrink-0 text-right text-[10px] font-semibold text-chart-3 tabular-nums">
                          {fmtCompact(outTotal)}
                        </span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full flex">
                            <div className="h-full bg-chart-3 rounded-l-full transition-all duration-500"
                              style={{ width: `${(day.expectedOut / outTotal) * outPct}%` }} />
                            <div className="h-full bg-chart-3/40 rounded-r-full transition-all duration-500"
                              style={{ width: `${(day.projectedOut / outTotal) * outPct}%` }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Net + chevron */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Net</div>
                    <div className={`text-sm font-bold tabular-nums ${net >= 0 ? "text-chart-2" : "text-chart-3"}`}>
                      {net >= 0 ? "+" : ""}{fmtCompact(net)}
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-lg border border-border flex items-center justify-center transition-all duration-200 ${isExpanded ? "bg-muted rotate-180" : "group-hover:bg-muted/50"}`}>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>
              </button>

              {/* Expanded panel */}
              {isExpanded && itemCount > 0 && (
                <div className="px-5 pb-5 border-t border-border/50 pt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* Confirmed inflows */}
                    {day.invoices.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <ArrowUp className="w-3 h-3 text-chart-1 shrink-0" />
                          <span className="text-[10px] font-bold text-chart-1 uppercase tracking-wider">Inflows</span>
                          <span className="ml-auto text-[10px] font-semibold text-chart-1 tabular-nums">{fmtFull(day.expectedIn)}</span>
                        </div>
                        <div className="space-y-1">
                          {day.invoices.map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-chart-1/5 hover:bg-chart-1/10 transition-colors">
                              <div className="flex items-center gap-2 min-w-0">
                                <Link href={`/invoices/${inv.id}`} className="text-[11px] font-bold text-chart-1 hover:underline shrink-0">
                                  #{inv.number}
                                </Link>
                                <span className="text-[11px] text-muted-foreground truncate">{inv.clientName}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {inv.status === "OVERDUE" && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-status-overdue text-status-overdue-foreground">Overdue</span>
                                )}
                                <span className="text-[11px] font-semibold text-foreground tabular-nums">{fmtFull(inv.outstanding)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recurring inflows */}
                    {day.projectedInvoices.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <RefreshCw className="w-3 h-3 text-chart-1/60 shrink-0" />
                          <span className="text-[10px] font-bold text-chart-1/70 uppercase tracking-wider">Recurring Inflows</span>
                          <span className="ml-auto text-[10px] font-semibold text-chart-1/70 tabular-nums">{fmtFull(day.projectedIn)}</span>
                        </div>
                        <div className="space-y-1">
                          {day.projectedInvoices.map((pi, i) => (
                            <div key={i} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-chart-1/5">
                              <span className="text-[11px] text-muted-foreground truncate">{pi.clientName}</span>
                              <span className="text-[11px] font-semibold text-foreground tabular-nums shrink-0">{fmtFull(pi.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Confirmed outflows */}
                    {day.bills.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <ArrowDown className="w-3 h-3 text-chart-3 shrink-0" />
                          <span className="text-[10px] font-bold text-chart-3 uppercase tracking-wider">Outflows</span>
                          <span className="ml-auto text-[10px] font-semibold text-chart-3 tabular-nums">{fmtFull(day.expectedOut)}</span>
                        </div>
                        <div className="space-y-1">
                          {day.bills.map((bill) => (
                            <div key={bill.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-chart-3/5 hover:bg-chart-3/10 transition-colors">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[11px] font-medium text-foreground shrink-0">{bill.vendorName}</span>
                                {bill.description && (
                                  <span className="text-[11px] text-muted-foreground truncate">{bill.description}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {bill.status === "OVERDUE" && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-status-overdue text-status-overdue-foreground">Overdue</span>
                                )}
                                <span className="text-[11px] font-semibold text-chart-3 tabular-nums">{fmtFull(bill.outstanding)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recurring outflows */}
                    {day.projectedBills.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <RefreshCw className="w-3 h-3 text-chart-3/60 shrink-0" />
                          <span className="text-[10px] font-bold text-chart-3/70 uppercase tracking-wider">Recurring Outflows</span>
                          <span className="ml-auto text-[10px] font-semibold text-chart-3/70 tabular-nums">{fmtFull(day.projectedOut)}</span>
                        </div>
                        <div className="space-y-1">
                          {day.projectedBills.map((pb, i) => (
                            <div key={i} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-chart-3/5">
                              <span className="text-[11px] text-muted-foreground truncate">{pb.vendorName}</span>
                              <span className="text-[11px] font-semibold text-foreground tabular-nums shrink-0">{fmtFull(pb.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-border flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length} days
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-border text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                  i === page
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-border text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
