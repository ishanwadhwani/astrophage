"use client";

import { useMemo } from "react";
import {
  ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { CashflowDay } from "@/types/cashflow";

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  inflow:          "hsl(221,83%,53%)",
  inflowRecurring: "hsl(221,83%,75%)",
  outflow:         "hsl(258,90%,66%)",
  outflowRecurring:"hsl(258,90%,82%)",
  balance:         "hsl(173,80%,40%)",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n >= 10_000_000 ? `₹${(n / 10_000_000).toFixed(1)}Cr`
  : n >= 100_000  ? `₹${(n / 100_000).toFixed(1)}L`
  : n >= 1_000    ? `₹${(n / 1_000).toFixed(0)}K`
  : `₹${Math.round(Math.abs(n))}`;

const fmtFull = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const dayLabel = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ── Data builder (computes running balance) ───────────────────────────────────
type ChartRow = {
  date: string; label: string;
  expectedIn: number; projectedIn: number;
  expectedOut: number; projectedOut: number;
  runningBalance: number; isToday: boolean;
};

function buildData(timeline: CashflowDay[], today: string): ChartRow[] {
  let bal = 0;
  return timeline.map((d) => {
    bal += (d.expectedIn + d.projectedIn) - (d.expectedOut + d.projectedOut);
    return {
      date: d.date,
      label: dayLabel(d.date),
      expectedIn:   d.expectedIn,
      projectedIn:  d.projectedIn,
      expectedOut:  d.expectedOut,
      projectedOut: d.projectedOut,
      runningBalance: bal,
      isToday: d.date === today,
    };
  });
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
type TProps = { active?: boolean; payload?: { payload: ChartRow }[] };

const CustomTooltip = ({ active, payload }: TProps) => {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  const dayNet = (r.expectedIn + r.projectedIn) - (r.expectedOut + r.projectedOut);

  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-3.5 min-w-56 text-xs">
      <p className="font-semibold text-foreground mb-3 text-[13px]">{dayLabel(r.date)}</p>

      {(r.expectedIn > 0 || r.projectedIn > 0) && (
        <div className="mb-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Inflows</p>
          {r.expectedIn > 0 && (
            <div className="flex justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: C.inflow }} />
                Confirmed
              </span>
              <span className="font-semibold tabular-nums" style={{ color: C.inflow }}>+{fmtFull(r.expectedIn)}</span>
            </div>
          )}
          {r.projectedIn > 0 && (
            <div className="flex justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: C.inflowRecurring }} />
                Recurring
              </span>
              <span className="font-semibold tabular-nums" style={{ color: C.inflowRecurring }}>+{fmtFull(r.projectedIn)}</span>
            </div>
          )}
        </div>
      )}

      {(r.expectedOut > 0 || r.projectedOut > 0) && (
        <div className="mb-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Outflows</p>
          {r.expectedOut > 0 && (
            <div className="flex justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: C.outflow }} />
                Confirmed
              </span>
              <span className="font-semibold tabular-nums" style={{ color: C.outflow }}>-{fmtFull(r.expectedOut)}</span>
            </div>
          )}
          {r.projectedOut > 0 && (
            <div className="flex justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: C.outflowRecurring }} />
                Recurring
              </span>
              <span className="font-semibold tabular-nums" style={{ color: C.outflowRecurring }}>-{fmtFull(r.projectedOut)}</span>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-border pt-2 space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Day net</span>
          <span className={`font-bold tabular-nums ${dayNet >= 0 ? "text-chart-2" : "text-chart-3"}`}>
            {dayNet >= 0 ? "+" : ""}{fmtFull(dayNet)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Running balance</span>
          <span className="font-bold tabular-nums" style={{ color: C.balance }}>
            {r.runningBalance >= 0 ? "+" : ""}{fmtFull(r.runningBalance)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Chart ─────────────────────────────────────────────────────────────────────
interface Props {
  timeline: CashflowDay[];
  showInflow?: boolean;
  showOutflow?: boolean;
  showRecurring?: boolean;
  showBalance?: boolean;
}

export default function CashflowChart({
  timeline,
  showInflow   = true,
  showOutflow  = true,
  showRecurring = true,
  showBalance  = true,
}: Props) {
  const today = todayKey();
  const data  = useMemo(() => buildData(timeline, today), [timeline, today]);

  const todayEntry   = data.find((d) => d.isToday);
  const todayLbl     = todayEntry?.label;

  // Determine bar top radius based on whether projected/recurring bars will appear on top
  const inTopRadius  = showInflow && showRecurring ? 0 : 4;
  const outTopRadius = showOutflow && showRecurring ? 0 : 4;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }} barGap={4} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.6} />

        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false} tickLine={false}
          interval="preserveStartEnd" minTickGap={24}
        />
        <YAxis
          tickFormatter={fmt}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false} tickLine={false}
          width={52}
        />

        <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.35)", radius: 6 }} />

        {/* Zero reference */}
        <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1.5} />

        {/* Today marker */}
        {todayLbl && (
          <ReferenceLine
            x={todayLbl}
            stroke="hsl(var(--primary))"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            label={{ value: "Today", position: "insideTopRight", fontSize: 10, fill: "hsl(var(--primary))", fontWeight: 700, dy: -2 }}
          />
        )}

        {/* ── Inflow bars ── */}
        {showInflow && (
          <Bar
            dataKey="expectedIn" stackId="in" name="Confirmed In"
            fill={C.inflow}
            radius={[inTopRadius, inTopRadius, 0, 0]}
            isAnimationActive animationDuration={700} animationEasing="ease-out"
          />
        )}
        {showInflow && showRecurring && (
          <Bar
            dataKey="projectedIn" stackId="in" name="Recurring In"
            fill={C.inflowRecurring}
            radius={[4, 4, 0, 0]}
            isAnimationActive animationDuration={700} animationEasing="ease-out"
          />
        )}

        {/* ── Outflow bars ── */}
        {showOutflow && (
          <Bar
            dataKey="expectedOut" stackId="out" name="Confirmed Out"
            fill={C.outflow}
            radius={[outTopRadius, outTopRadius, 0, 0]}
            isAnimationActive animationDuration={700} animationEasing="ease-out"
          />
        )}
        {showOutflow && showRecurring && (
          <Bar
            dataKey="projectedOut" stackId="out" name="Recurring Out"
            fill={C.outflowRecurring}
            radius={[4, 4, 0, 0]}
            isAnimationActive animationDuration={700} animationEasing="ease-out"
          />
        )}

        {/* ── Running balance line ── */}
        {showBalance && (
          <Line
            type="monotone" dataKey="runningBalance" name="Running Balance"
            stroke={C.balance} strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0, fill: C.balance }}
            isAnimationActive animationDuration={1000} animationEasing="ease-out"
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
