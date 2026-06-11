"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Sector, ResponsiveContainer } from "recharts";
import type { SectorProps } from "recharts";
import { StatusBreakdown } from "@/types/dashboard";

const STATUS_COLORS: Record<string, string> = {
  PAID:      "hsl(173,80%,40%)",
  PENDING:   "hsl(38,92%,50%)",
  OVERDUE:   "hsl(340,75%,55%)",
  DRAFT:     "hsl(215,19%,55%)",
  CANCELLED: "hsl(215,16%,72%)",
};

const STATUS_LABELS: Record<string, string> = {
  PAID: "Paid", PENDING: "Pending", OVERDUE: "Overdue",
  DRAFT: "Draft", CANCELLED: "Cancelled",
};

const fmtCompact = (n: number) =>
  n >= 10_000_000 ? `₹${(n / 10_000_000).toFixed(1)}Cr`
  : n >= 100_000  ? `₹${(n / 100_000).toFixed(1)}L`
  : n >= 1_000    ? `₹${(n / 1_000).toFixed(0)}K`
  : `₹${n.toLocaleString("en-IN")}`;

// Hovered segment expands outward — no tooltip needed
const ActiveShape = (props: SectorProps) => {
  const { cx = 0, cy = 0, innerRadius = 0, outerRadius = 0,
          startAngle = 0, endAngle = 0, fill = "" } = props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius - 3}
      outerRadius={outerRadius + 7}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.15))", transition: "all 0.2s ease" }}
    />
  );
};

export default function StatusChart({ data }: { data: StatusBreakdown[] }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  if (!data.length)
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        No invoice data yet
      </div>
    );

  const totalCount = data.reduce((s, d) => s + d.count, 0);
  const totalAmount = data.reduce((s, d) => s + d.total, 0);

  const chartData = data.map((entry) => ({
    ...entry,
    color: STATUS_COLORS[entry.status] ?? "hsl(var(--muted-foreground))",
    label: STATUS_LABELS[entry.status] ?? entry.status,
  }));

  const active = activeIdx !== null ? chartData[activeIdx] : null;

  return (
    <div className="flex flex-col">
      {/* Donut */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={176}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="total"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={74}
              paddingAngle={3}
              strokeWidth={0}
              {...(activeIdx !== null ? { activeIndex: activeIdx } : {})}
              activeShape={ActiveShape}
              onMouseEnter={(_, idx) => setActiveIdx(idx)}
              onMouseLeave={() => setActiveIdx(null)}
            >
              {chartData.map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={entry.color}
                  style={{
                    opacity: activeIdx === null || activeIdx === i ? 1 : 0.45,
                    transition: "opacity 0.2s ease",
                    cursor: "pointer",
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center label — switches to hovered segment info */}
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center transition-all duration-200"
        >
          {active ? (
            <>
              <p
                className="text-xl font-bold tabular-nums leading-none transition-all duration-200"
                style={{ color: active.color }}
              >
                {active.count}
              </p>
              <p className="mt-1 text-[10px] font-semibold text-muted-foreground transition-all duration-200">
                {active.label}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
                {fmtCompact(active.total)}
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-foreground tabular-nums leading-none">
                {totalCount}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">invoices</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
                {fmtCompact(totalAmount)}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Rich legend */}
      <div className="mt-2 space-y-2 px-1">
        {chartData.map((entry, i) => (
          <div
            key={entry.status}
            className="flex items-center gap-2.5 text-xs rounded-lg px-1.5 py-1 cursor-default transition-colors duration-150"
            style={{ background: activeIdx === i ? `${entry.color}12` : "transparent" }}
            onMouseEnter={() => setActiveIdx(i)}
            onMouseLeave={() => setActiveIdx(null)}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0 transition-transform duration-150"
              style={{
                background: entry.color,
                transform: activeIdx === i ? "scale(1.4)" : "scale(1)",
              }}
            />
            <span className="flex-1 text-muted-foreground">{entry.label}</span>
            <span className="font-semibold text-foreground tabular-nums">{entry.count}</span>
            <span className="w-20 text-right text-muted-foreground tabular-nums">
              {fmtCompact(entry.total)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
