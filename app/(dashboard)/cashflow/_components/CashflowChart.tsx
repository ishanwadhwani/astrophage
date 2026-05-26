"use client";

import { useState } from "react";
import { CashflowDay } from "@/types/cashflow";

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

const dayLabel = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

// ─── Tooltip ─────────────────────────────────────────────

function Tooltip({ day, x, y }: { day: CashflowDay; x: number; y: number }) {
  return (
    <div
      className="fixed z-50 bg-card border border-border rounded-xl shadow-lg p-3 pointer-events-none min-w-48"
      style={{ left: x - 96, top: y - 130 }}
    >
      <p className="text-xs font-semibold text-foreground mb-2">
        {dayLabel(day.date)}
      </p>

      {day.expectedIn > 0 && (
        <div className="mb-1.5">
          <p className="text-xs text-muted-foreground mb-1">In</p>
          {day.invoices.map((inv) => (
            <div key={inv.id} className="flex justify-between gap-3 text-xs">
              <span className="text-muted-foreground truncate">
                #{inv.number} · {inv.clientName}
              </span>
              <span className="font-medium text-primary flex-shrink-0">
                {fmt(inv.outstanding)}
              </span>
            </div>
          ))}
        </div>
      )}

      {day.expectedOut > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Out</p>
          {day.bills.map((bill) => (
            <div key={bill.id} className="flex justify-between gap-3 text-xs">
              <span className="text-muted-foreground truncate">
                {bill.vendorName}
              </span>
              <span className="font-medium text-status-overdue-foreground flex-shrink-0">
                {fmt(bill.outstanding)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Chart ────────────────────────────────────────────────

interface Props {
  timeline: CashflowDay[];
  max: number;
}

export default function CashflowChart({ timeline, max }: Props) {
  const [tooltip, setTooltip] = useState<{
    day: CashflowDay;
    x: number;
    y: number;
  } | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const BAR_W = 10;
  const INNER_GAP = 2;
  const GAP = 6;
  const H = 160;
  const PAD_LEFT = 68;
  const PAD_TOP = 16;
  const DAY_W = BAR_W * 2 + INNER_GAP + GAP;
  const totalW = timeline.length * DAY_W;

  const barH = (val: number) =>
    max > 0 ? Math.max((val / max) * H, val > 0 ? 4 : 0) : 0;

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-primary" />
          Inflow (Receivables)
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-status-overdue-foreground" />
          Outflow (Bills)
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded-sm bg-primary/40" />
          Today
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          width={totalW + PAD_LEFT}
          height={PAD_TOP + H + 36}
          className="block"
        >
          {/* Y-axis gridlines */}
          {[0.25, 0.5, 0.75, 1].map((frac) => {
            const y = PAD_TOP + H - frac * H;
            return (
              <g key={frac}>
                <line
                  x1={PAD_LEFT}
                  x2={totalW + PAD_LEFT}
                  y1={y}
                  y2={y}
                  stroke="hsl(var(--border))"
                  strokeWidth={0.5}
                  strokeDasharray="4 4"
                />
                <text
                  x={PAD_LEFT - 6}
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

          {/* Baseline */}
          <line
            x1={PAD_LEFT}
            x2={totalW + PAD_LEFT}
            y1={PAD_TOP + H}
            y2={PAD_TOP + H}
            stroke="hsl(var(--border))"
            strokeWidth={1}
          />

          {/* Bars */}
          {timeline.map((day, i) => {
            const dayX = PAD_LEFT + i * DAY_W;
            const inBarH = barH(day.expectedIn);
            const outBarH = barH(day.expectedOut);
            const isToday = day.date === today;
            const hasOverdue = day.invoices.some(
              (inv) => inv.status === "OVERDUE",
            );
            const hasData = day.expectedIn > 0 || day.expectedOut > 0;

            return (
              <g key={day.date}>
                {/* Today marker */}
                {isToday && (
                  <rect
                    x={dayX}
                    y={PAD_TOP}
                    width={BAR_W * 2 + INNER_GAP}
                    height={H}
                    fill="hsl(var(--primary) / 0.05)"
                    rx={2}
                  />
                )}

                {/* Inflow bar */}
                <rect
                  x={dayX}
                  y={PAD_TOP + H - inBarH}
                  width={BAR_W}
                  height={inBarH}
                  rx={3}
                  fill={
                    hasOverdue
                      ? "hsl(var(--status-overdue-foreground))"
                      : isToday
                        ? "hsl(var(--primary))"
                        : "hsl(var(--primary) / 0.5)"
                  }
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onMouseEnter={(e) => {
                    if (!hasData) return;
                    const r = e.currentTarget.getBoundingClientRect();
                    setTooltip({ day, x: r.left + r.width / 2, y: r.top });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />

                {/* Outflow bar */}
                <rect
                  x={dayX + BAR_W + INNER_GAP}
                  y={PAD_TOP + H - outBarH}
                  width={BAR_W}
                  height={outBarH}
                  rx={3}
                  fill="hsl(var(--status-overdue-foreground) / 0.7)"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onMouseEnter={(e) => {
                    if (!hasData) return;
                    const r = e.currentTarget.getBoundingClientRect();
                    setTooltip({ day, x: r.left + r.width / 2, y: r.top });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />

                {/* Today underline */}
                {isToday && (
                  <rect
                    x={dayX}
                    y={PAD_TOP + H + 6}
                    width={BAR_W * 2 + INNER_GAP}
                    height={3}
                    rx={1.5}
                    fill="hsl(var(--primary))"
                  />
                )}

                {/* Date label every 5 days */}
                {i % 5 === 0 && (
                  <text
                    x={dayX + (BAR_W * 2 + INNER_GAP) / 2}
                    y={PAD_TOP + H + 22}
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

      {tooltip && <Tooltip day={tooltip.day} x={tooltip.x} y={tooltip.y} />}
    </div>
  );
}
