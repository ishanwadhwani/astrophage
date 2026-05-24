"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { CashflowData, CashflowDay } from "@/types/cashflow";
import { fetchCashflow } from "@/lib/cashflow";
import { getUser } from "@/lib/auth";

const fmt = (n: number) =>
  "₹" +
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const fmtFull = (n: number) =>
  "₹" +
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const isToday = (dateStr: string) =>
  new Date(dateStr).toDateString() === new Date().toDateString();

const dayLabel = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const weekday = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-IN", { weekday: "short" });

// ─── Bar Chart ────────────────────────────────────────────

function CashflowChart({
  timeline,
  max,
  onHover,
}: {
  timeline: CashflowDay[];
  max: number;
  onHover: (day: CashflowDay | null, x: number, y: number) => void;
}) {
  const today = new Date().toISOString().split("T")[0];

  // Only show days with data or every 3rd day for labels
  const BAR_W = 20;
  const GAP = 6;
  const H = 160;
  const PADDING = 72;
  const PADDING_TOP = 16;
  const totalW = timeline.length * (BAR_W + GAP);

  return (
    <div className="overflow-x-auto">
      <svg width={totalW + PADDING} height={PADDING_TOP + H + 40} className="block">
        {/* Gridlines */}
        {[0.25, 0.5, 0.75, 1].map((frac) => {
          const y = PADDING_TOP  + H - frac * H;
          return (
            <g key={frac}>
              <line
                x1={PADDING}
                x2={totalW + PADDING}
                y1={y}
                y2={y}
                stroke="hsl(var(--border))"
                strokeWidth={0.5}
                strokeDasharray="4 4"
              />
              <text
                x={PADDING - 6}
                y={y + 3}
                textAnchor="end" 
                fontSize={9}
                fill="hsl(var(--muted-foreground))"
              >
                {fmt(max * frac)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {timeline.map((day, i) => {
          const x = PADDING + i * (BAR_W + GAP);
          const barH = max > 0 ? (day.expectedIn / max) * H : 0;
          const y = PADDING_TOP  + H - barH;
          const today_ = day.date === today;
          const hasData = day.expectedIn > 0;
          const isOverdue = day.invoices.some(
            (inv) => inv.status === "OVERDUE",
          );

          return (
            <g key={day.date}>
              {/* Bar */}
              <rect
                x={x}
                y={hasData ? y : PADDING_TOP + H}
                width={BAR_W}
                height={hasData ? barH : 0}
                rx={4}
                fill={
                  isOverdue
                    ? "hsl(var(--status-overdue-foreground))"
                    : today_
                      ? "hsl(var(--primary))"
                      : "hsl(var(--primary) / 0.35)"
                }
                className="transition-all cursor-pointer hover:opacity-80"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  onHover(day, rect.left + rect.width / 2, rect.top);
                }}
                onMouseLeave={() => onHover(null, 0, 0)}
              />

              {/* Today indicator */}
              {today_ && (
                <rect
                  x={x}
                  y={PADDING_TOP + H + 6}
                  width={BAR_W}
                  height={3}
                  rx={1.5}
                  fill="hsl(var(--primary))"
                />
              )}

              {/* Date label every 5 days */}
              {i % 5 === 0 && (
                <text
                  x={x + BAR_W / 2}
                  y={PADDING_TOP + H + 22}
                  textAnchor="middle"
                  fontSize={9}
                  fill="hsl(var(--muted-foreground))"
                >
                  {dayLabel(day.date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Tooltip ─────────────────────────────────────────────

function Tooltip({ day, x, y }: { day: CashflowDay; x: number; y: number }) {
  return (
    <div
      className="fixed z-50 bg-card border border-border rounded-xl shadow-lg p-3 pointer-events-none min-w-44"
      style={{ left: x - 88, top: y - 120 }}
    >
      <p className="text-xs font-semibold text-foreground mb-1">
        {dayLabel(day.date)} · {weekday(day.date)}
      </p>
      <p className="text-sm font-bold text-primary mb-2">
        {fmtFull(day.expectedIn)}
      </p>
      {day.invoices.map((inv) => (
        <div key={inv.id} className="flex justify-between gap-3 text-xs">
          <span className="text-muted-foreground truncate">
            #{inv.number} · {inv.clientName}
          </span>
          <span className="font-medium text-foreground flex-shrink-0">
            {fmt(inv.outstanding)}
          </span>
        </div>
      ))}
    </div>
  );
}

const RANGES = [
  { label: "2 Weeks", days: 14 },
  { label: "30 Days", days: 30 },
  { label: "60 Days", days: 60 },
  { label: "90 Days", days: 90 },
];

export default function CashflowPage() {
  const user = getUser();
  const businessId = user?.business?.id;

  const [data, setData] = useState<CashflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(30);
  const [tooltip, setTooltip] = useState<{
    day: CashflowDay;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!businessId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await fetchCashflow(businessId, selectedDays);
        setData(result);
      } catch {
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [businessId, selectedDays]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { timeline, summary } = data;
  const activeDays = timeline.filter((d) => d.expectedIn > 0);

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Cashflow Timeline
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Expected receivables over the next {selectedDays} days
          </p>
        </div>

        {/* Range selector */}
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setSelectedDays(r.days)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedDays === r.days
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary cards ───────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Expected In
          </p>
          <p className="text-2xl font-bold text-primary">
            {fmt(summary.totalExpectedIn)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Next {selectedDays} days
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Overdue Now
          </p>
          <p
            className={`text-2xl font-bold ${
              summary.overdueAmount > 0
                ? "text-status-overdue-foreground"
                : "text-foreground"
            }`}
          >
            {fmt(summary.overdueAmount)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Needs immediate action
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Peak Day
          </p>
          <p className="text-2xl font-bold text-foreground">
            {fmt(summary.largestSingleDay)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Largest single-day inflow
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Active Days
          </p>
          <p className="text-2xl font-bold text-foreground">
            {summary.daysWithCash}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Days with expected cash
          </p>
        </div>
      </div>

      {/* ── Chart ───────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">
            Daily Inflow
          </h2>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-primary" />
              Today
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-primary/35" />
              Expected
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-status-overdue-foreground" />
              Overdue
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          {summary.totalExpectedIn === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No pending receivables in this period.{" "}
              <Link
                href="/invoices/create"
                className="text-primary hover:underline"
              >
                Create an invoice
              </Link>
            </div>
          ) : (
            <CashflowChart
              timeline={timeline}
              max={summary.largestSingleDay}
              onHover={(day, x, y) =>
                setTooltip(day && day.expectedIn > 0 ? { day, x, y } : null)
              }
            />
          )}
        </div>
      </div>

      {/* ── Upcoming payments list ───────────────── */}
      {activeDays.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">
              Upcoming Collections
            </h2>
          </div>

          <div className="divide-y divide-border">
            {activeDays.map((day) => (
              <div key={day.date} className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isToday(day.date)
                          ? "bg-primary"
                          : day.invoices.some((i) => i.status === "OVERDUE")
                            ? "bg-status-overdue-foreground"
                            : "bg-primary/40"
                      }`}
                    />
                    <span className="text-sm font-semibold text-foreground">
                      {isToday(day.date) ? "Today" : dayLabel(day.date)}
                      <span className="text-xs font-normal text-muted-foreground ml-1.5">
                        {weekday(day.date)}
                      </span>
                    </span>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {fmtFull(day.expectedIn)}
                  </span>
                </div>

                <div className="space-y-1.5 pl-4">
                  {day.invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="text-xs font-medium text-primary hover:underline"
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
            ))}
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && <Tooltip day={tooltip.day} x={tooltip.x} y={tooltip.y} />}
    </div>
  );
}
