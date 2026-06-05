"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { MonthlyTrend } from "@/types/dashboard";

type TooltipItem = {
  name?: string | number;
  value?: number | string;
  color?: string;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string | number;
};

const fmt = (n: number) =>
  n >= 100000
    ? "₹" + (n / 100000).toFixed(1) + "L"
    : n >= 1000
      ? "₹" + (n / 1000).toFixed(0) + "K"
      : "₹" + n;

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-3 text-sm shadow-lg">
      <p className="mb-2 font-semibold text-foreground">{label}</p>

      {payload.map((p, index) => (
        <div
          key={`${p.name ?? "item"}-${index}`}
          className="flex items-center gap-2 py-0.5"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: p.color ?? "currentColor" }}
          />
          <span className="capitalize text-muted-foreground">
            {String(p.name ?? "Value")}
          </span>
          <span className="ml-auto pl-4 font-medium text-foreground">
            {fmt(Number(p.value ?? 0))}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function RevenueChart({ data }: { data: MonthlyTrend[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(221,83%,53%)" stopOpacity={0.15} />
            <stop offset="95%" stopColor="hsl(221,83%,53%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(173,80%,40%)" stopOpacity={0.15} />
            <stop offset="95%" stopColor="hsl(173,80%,40%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(0,72%,51%)" stopOpacity={0.1} />
            <stop offset="95%" stopColor="hsl(0,72%,51%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          vertical={false}
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
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
        />
        <Area
          type="monotone"
          dataKey="invoiced"
          stroke="hsl(173,80%,40%)"
          strokeWidth={2}
          fill="url(#colorInvoiced)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
          name="Invoiced"
        />
        <Area
          type="monotone"
          dataKey="collected"
          stroke="hsl(221,83%,53%)"
          strokeWidth={2}
          fill="url(#colorCollected)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
          name="Collected"
        />
        <Area
          type="monotone"
          dataKey="spent"
          stroke="hsl(0,72%,51%)"
          strokeWidth={2}
          fill="url(#colorSpent)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
          name="Spent"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
