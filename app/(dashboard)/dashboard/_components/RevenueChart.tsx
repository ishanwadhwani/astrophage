"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MonthlyTrend } from "@/types/dashboard";

type TooltipItem = { name?: string | number; value?: number | string; color?: string };
type CustomTooltipProps = { active?: boolean; payload?: TooltipItem[]; label?: string | number };

const fmt = (n: number) =>
  n >= 10_000_000 ? `₹${(n / 10_000_000).toFixed(1)}Cr`
  : n >= 100_000  ? `₹${(n / 100_000).toFixed(1)}L`
  : n >= 1_000    ? `₹${(n / 1_000).toFixed(0)}K`
  : `₹${n}`;

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-lg min-w-40">
      <p className="mb-2 text-xs font-semibold text-foreground">{label}</p>
      {payload.map((p, i) => (
        <div key={`${String(p.name)}-${i}`} className="flex items-center gap-2 py-0.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: p.color ?? "currentColor" }}
          />
          <span className="flex-1 capitalize text-xs text-muted-foreground">
            {String(p.name ?? "Value")}
          </span>
          <span className="pl-4 text-xs font-semibold text-foreground">
            {fmt(Number(p.value ?? 0))}
          </span>
        </div>
      ))}
    </div>
  );
};

// Calm palette: teal (invoiced) · blue (collected) · purple (spent — NOT red)
const C = {
  invoiced:  "hsl(173,80%,40%)",
  collected: "hsl(221,83%,53%)",
  spent:     "hsl(258,90%,66%)",
};

export default function RevenueChart({ data }: { data: MonthlyTrend[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          {(["invoiced", "collected", "spent"] as const).map((key) => (
            <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor={C[key]} stopOpacity={0.18} />
              <stop offset="95%" stopColor={C[key]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          vertical={false}
          opacity={0.6}
        />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={fmt}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} />

        <Area
          type="monotone"
          dataKey="invoiced"
          stroke={C.invoiced}
          strokeWidth={2}
          fill="url(#grad-invoiced)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
          name="Invoiced"
        />
        <Area
          type="monotone"
          dataKey="collected"
          stroke={C.collected}
          strokeWidth={2}
          fill="url(#grad-collected)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
          name="Collected"
        />
        <Area
          type="monotone"
          dataKey="spent"
          stroke={C.spent}
          strokeWidth={2}
          fill="url(#grad-spent)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
          name="Spent"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
