"use client";

import { useState } from "react";
import Link from "next/link";
import { CashflowDay } from "@/types/cashflow";

const fmtFull = (n: number) =>
  "₹" +
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtCompact = (n: number) =>
  n >= 100000
    ? "₹" + (n / 100000).toFixed(1) + "L"
    : n >= 1000
      ? "₹" + (n / 1000).toFixed(1) + "K"
      : "₹" + n;

const weekday = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-IN", { weekday: "long" });

const monthShort = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-IN", { month: "short" });

const dayNum = (dateStr: string) => new Date(dateStr).getDate();

const isToday = (dateStr: string) =>
  new Date(dateStr).toDateString() === new Date().toDateString();

interface Props {
  activeDays: CashflowDay[];
}

export default function CashflowTimeline({ activeDays }: Props) {
  // All days start expanded — same initial view, but collapsible for power users
  const [expandedDays, setExpandedDays] = useState<Set<string>>(
    () => new Set(activeDays.map((d) => d.date)),
  );

  const toggleDay = (date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  if (activeDays.length === 0) return null;

  const maxFlow = Math.max(
    ...activeDays.map((d) =>
      Math.max(
        d.expectedIn + d.projectedIn,
        d.expectedOut + d.projectedOut,
      ),
    ),
    1,
  );

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Section header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Day-by-Day Breakdown
            </h2>
            <p className="text-xs text-muted-foreground">
              {activeDays.length} active{" "}
              {activeDays.length === 1 ? "day" : "days"}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Inflow
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-overdue-foreground" />
            Outflow
          </span>
        </div>
      </div>

      {/* Day cards */}
      <div className="p-4 space-y-2">
        {activeDays.map((day) => {
          const net = day.expectedIn - day.expectedOut;
          const todayDay = isToday(day.date);
          const hasOverdue =
            day.invoices.some((i) => i.status === "OVERDUE") ||
            day.bills.some((b) => b.status === "OVERDUE");
          const isExpanded = expandedDays.has(day.date);
          const inTotal = day.expectedIn + day.projectedIn;
          const outTotal = day.expectedOut + day.projectedOut;
          const inPct = (inTotal / maxFlow) * 100;
          const outPct = (outTotal / maxFlow) * 100;
          const itemCount = day.invoices.length + day.bills.length;

          return (
            <div
              key={day.date}
              className={`rounded-xl border transition-colors ${
                todayDay
                  ? "border-primary/40 bg-primary/[0.025] shadow-sm"
                  : "border-border/70 hover:border-border"
              }`}
            >
              {/* Clickable summary row */}
              <button
                onClick={() => toggleDay(day.date)}
                className="w-full px-5 py-4 flex items-center gap-4 text-left group"
              >
                {/* Calendar date block */}
                <div
                  className={`flex-shrink-0 w-11 text-center ${
                    todayDay ? "text-primary" : "text-foreground"
                  }`}
                >
                  <div
                    className={`text-2xl font-bold leading-none tabular-nums ${
                      todayDay ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {dayNum(day.date)}
                  </div>
                  <div
                    className={`text-[10px] font-semibold uppercase tracking-wide mt-0.5 ${
                      todayDay ? "text-primary/70" : "text-muted-foreground"
                    }`}
                  >
                    {monthShort(day.date)}
                  </div>
                  {todayDay && (
                    <div className="mt-1.5 px-1 py-0.5 bg-primary text-primary-foreground text-[8px] font-bold rounded uppercase tracking-wider leading-none">
                      Today
                    </div>
                  )}
                </div>

                {/* Weekday + flow bars */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      {weekday(day.date)}
                    </span>
                    {hasOverdue && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-status-overdue text-status-overdue-foreground uppercase tracking-wide">
                        Overdue
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
                        <span className="w-14 flex-shrink-0 text-right text-[10px] font-semibold text-primary tabular-nums">
                          {fmtCompact(inTotal)}
                        </span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${inPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {outTotal > 0 && (
                      <div className="flex items-center gap-2.5">
                        <span className="w-14 flex-shrink-0 text-right text-[10px] font-semibold text-status-overdue-foreground tabular-nums">
                          {fmtCompact(outTotal)}
                        </span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-status-overdue-foreground rounded-full"
                            style={{ width: `${outPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Net + chevron */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                      Net
                    </div>
                    <div
                      className={`text-sm font-bold tabular-nums ${
                        net >= 0
                          ? "text-status-paid-foreground"
                          : "text-status-overdue-foreground"
                      }`}
                    >
                      {net >= 0 ? "+" : ""}
                      {fmtCompact(net)}
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border border-border flex items-center justify-center transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  >
                    <svg
                      className="w-3 h-3 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Expanded detail panel */}
              {isExpanded && (day.invoices.length > 0 || day.bills.length > 0) && (
                <div className="px-5 pb-4 border-t border-border/50 pt-3">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Inflows */}
                    {day.invoices.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <svg
                            className="w-3 h-3 text-primary flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M5 10l7-7m0 0l7 7m-7-7v18"
                            />
                          </svg>
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                            Inflows
                          </span>
                          <span className="ml-auto text-[10px] font-semibold text-primary tabular-nums">
                            {fmtFull(day.expectedIn)}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {day.invoices.map((inv) => (
                            <div
                              key={inv.id}
                              className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Link
                                  href={`/invoices/${inv.id}`}
                                  className="text-[11px] font-bold text-primary hover:underline flex-shrink-0"
                                >
                                  #{inv.number}
                                </Link>
                                <span className="text-[11px] text-muted-foreground truncate">
                                  {inv.clientName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {inv.status === "OVERDUE" && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-status-overdue text-status-overdue-foreground">
                                    Overdue
                                  </span>
                                )}
                                <span className="text-[11px] font-semibold text-foreground tabular-nums">
                                  {fmtFull(inv.outstanding)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Outflows */}
                    {day.bills.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <svg
                            className="w-3 h-3 text-status-overdue-foreground flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M19 14l-7 7m0 0l-7-7m7 7V3"
                            />
                          </svg>
                          <span className="text-[10px] font-bold text-status-overdue-foreground uppercase tracking-wider">
                            Outflows
                          </span>
                          <span className="ml-auto text-[10px] font-semibold text-status-overdue-foreground tabular-nums">
                            {fmtFull(day.expectedOut)}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {day.bills.map((bill) => (
                            <div
                              key={bill.id}
                              className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-status-overdue/8 hover:bg-status-overdue/15 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[11px] font-medium text-foreground flex-shrink-0">
                                  {bill.vendorName}
                                </span>
                                {bill.description && (
                                  <span className="text-[11px] text-muted-foreground truncate">
                                    {bill.description}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {bill.status === "OVERDUE" && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-status-overdue text-status-overdue-foreground">
                                    Overdue
                                  </span>
                                )}
                                <span className="text-[11px] font-semibold text-status-overdue-foreground tabular-nums">
                                  {fmtFull(bill.outstanding)}
                                </span>
                              </div>
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
    </div>
  );
}
