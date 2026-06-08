"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { CashflowDay } from "@/types/cashflow";

const fmt = (n: number) =>
  n >= 100000
    ? "₹" + (n / 100000).toFixed(1) + "L"
    : n >= 1000
      ? "₹" + (n / 1000).toFixed(0) + "K"
      : "₹" + n;

const fmtFull = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });

const dayLabel = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

const dateKey = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

// Tooltip
type CustomTooltipPayloadItem = {
  payload: {
    raw: CashflowDay;
  };
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
};

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const day: CashflowDay = payload[0].payload.raw;
  const net =
    day.expectedIn + day.projectedIn - (day.expectedOut + day.projectedOut);

  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-3 text-sm min-w-52">
      <p className="font-semibold text-foreground mb-2">{dayLabel(day.date)}</p>

      {day.expectedIn > 0 && (
        <div className="flex justify-between gap-4 text-xs py-0.5">
          <span className="text-muted-foreground">Expected in</span>
          <span className="font-medium text-primary">
            {fmtFull(day.expectedIn)}
          </span>
        </div>
      )}
      {day.projectedIn > 0 && (
        <div className="flex justify-between gap-4 text-xs py-0.5">
          <span className="text-muted-foreground">Projected in</span>
          <span className="font-medium text-primary/60">
            {fmtFull(day.projectedIn)}
          </span>
        </div>
      )}
      {day.expectedOut > 0 && (
        <div className="flex justify-between gap-4 text-xs py-0.5">
          <span className="text-muted-foreground">Expected out</span>
          <span className="font-medium text-status-overdue-foreground">
            {fmtFull(day.expectedOut)}
          </span>
        </div>
      )}
      {day.projectedOut > 0 && (
        <div className="flex justify-between gap-4 text-xs py-0.5">
          <span className="text-muted-foreground">Projected out</span>
          <span className="font-medium text-status-overdue-foreground/60">
            {fmtFull(day.projectedOut)}
          </span>
        </div>
      )}

      <div className="flex justify-between gap-4 text-xs pt-2 mt-1 border-t border-border">
        <span className="font-semibold text-foreground">Net</span>
        <span
          className={`font-bold ${net >= 0 ? "text-status-paid-foreground" : "text-status-overdue-foreground"}`}
        >
          {net >= 0 ? "+" : ""}
          {fmtFull(net)}
        </span>
      </div>
    </div>
  );
};

// Chart

interface Props {
  timeline: CashflowDay[];
}

export default function CashflowChart({ timeline }: Props) {
  const today = dateKey(new Date());

  //raw day for tooltip
  const data = timeline.map((d) => ({
    label: dayLabel(d.date),
    expectedIn: d.expectedIn,
    projectedIn: d.projectedIn,
    expectedOut: d.expectedOut,
    projectedOut: d.projectedOut,
    isToday: d.date === today,
    raw: d,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        barGap={2}
      >
        <defs>
          <pattern
            id="projIn"
            patternUnits="userSpaceOnUse"
            width="6"
            height="6"
            patternTransform="rotate(45)"
          >
            <rect width="6" height="6" fill="hsl(221 83% 53% / 0.1)" />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="6"
              stroke="hsl(221 83% 53% / 0.6)"
              strokeWidth="2"
            />
          </pattern>
          <pattern
            id="projOut"
            patternUnits="userSpaceOnUse"
            width="6"
            height="6"
            patternTransform="rotate(45)"
          >
            <rect width="6" height="6" fill="hsl(0 72% 51% / 0.08)" />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="6"
              stroke="hsl(0 72% 51% / 0.5)"
              strokeWidth="2"
            />
          </pattern>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={20}
        />
        <YAxis
          tickFormatter={fmt}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />

        {/* Inflow stack: actual + projected */}
        <Bar
          dataKey="expectedIn"
          stackId="in"
          name="Expected In"
          fill="hsl(221 83% 53%)"
          radius={[0, 0, 0, 0]}
        >
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={d.isToday ? "hsl(221 83% 45%)" : "hsl(221 83% 53%)"}
            />
          ))}
        </Bar>
        <Bar
          dataKey="projectedIn"
          stackId="in"
          name="Projected In"
          fill="url(#projIn)"
          radius={[3, 3, 0, 0]}
        />

        {/* Outflow stack: actual + projected */}
        <Bar
          dataKey="expectedOut"
          stackId="out"
          name="Expected Out"
          fill="hsl(0 72% 51%)"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="projectedOut"
          stackId="out"
          name="Projected Out"
          fill="url(#projOut)"
          radius={[3, 3, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
