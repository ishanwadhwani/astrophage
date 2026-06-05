"use client";

import {
  PieChart,
  Pie,
//   Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { StatusBreakdown } from "@/types/dashboard";

const STATUS_COLORS: Record<string, string> = {
  PAID: "hsl(142,76%,36%)",
  PENDING: "hsl(38,92%,50%)",
  OVERDUE: "hsl(0,72%,51%)",
  DRAFT: "hsl(215,19%,35%)",
  CANCELLED: "hsl(215,16%,47%)",
};

type StatusSlice = {
  status: string;
  count: number;
  total: number;
};

type TooltipEntry = {
  payload: StatusSlice;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipEntry[];
};

type PieLabelRenderProps = {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
};

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;

  const d = payload[0].payload;

  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-foreground">{d.status}</p>
      <p className="text-muted-foreground mt-1">
        {d.count} invoice{d.count !== 1 ? "s" : ""}
      </p>
      <p className="text-muted-foreground">{fmt(d.total)}</p>
    </div>
  );
};

const renderLabel = ({
  cx = 0,
  cy = 0,
  midAngle = 0,
  innerRadius = 0,
  outerRadius = 0,
  percent = 0,
}: PieLabelRenderProps) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fill="white"
      fontSize={11}
      fontWeight={600}
    >
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

export default function StatusChart({ data }: { data: StatusBreakdown[] }) {
  if (!data.length)
    return (
      <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
        No invoice data yet
      </div>
    );

  const chartData = data.map((entry) => ({
    ...entry,
    fill: STATUS_COLORS[entry.status] ?? "hsl(var(--muted))",
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="total"
          nameKey="status"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          labelLine={false}
          label={renderLabel}
        >
          {/* {data.map((entry) => (
            <Cell
              key={entry.status}
              fill={STATUS_COLORS[entry.status] ?? "hsl(var(--muted))"}
            />
          ))} */}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11 }}
          formatter={(value) => (
            <span style={{ color: "hsl(var(--muted-foreground))" }}>
              {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
