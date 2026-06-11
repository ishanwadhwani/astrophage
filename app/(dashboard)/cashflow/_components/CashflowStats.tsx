"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp, TrendingDown, ArrowLeftRight,
  AlertCircle, Clock, Activity,
} from "lucide-react";
import { CashflowSummary } from "@/types/cashflow";

const fmtCompact = (n: number) =>
  n >= 10_000_000 ? `₹${(n / 10_000_000).toFixed(1)}Cr`
  : n >= 100_000  ? `₹${(n / 100_000).toFixed(1)}L`
  : n >= 1_000    ? `₹${(n / 1_000).toFixed(0)}K`
  : `₹${Math.round(n)}`;

const fmtFull = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

interface Props {
  summary: CashflowSummary;
  selectedDays: number;
}

export default function CashflowStats({ summary, selectedDays }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const id = setTimeout(() => setMounted(true), 40); return () => clearTimeout(id); }, []);

  const net = summary.totalExpectedIn - summary.totalExpectedOut;
  const coverage = summary.totalExpectedOut > 0
    ? Math.round((summary.totalExpectedIn / summary.totalExpectedOut) * 100)
    : null;

  const cards = [
    {
      label: "Expected Inflows",
      value: fmtFull(summary.totalExpectedIn),
      sub: `Next ${selectedDays} days`,
      icon: TrendingUp,
      iconBg: "bg-chart-1/10",
      iconColor: "text-chart-1",
    },
    {
      label: "Expected Outflows",
      value: fmtFull(summary.totalExpectedOut),
      sub: "Bills & recurring due",
      icon: TrendingDown,
      iconBg: "bg-chart-3/10",
      iconColor: "text-chart-3",
    },
    {
      label: "Net Cashflow",
      value: (net >= 0 ? "+" : "−") + fmtCompact(Math.abs(net)),
      sub: net >= 0 ? "Surplus — inflows lead" : "Deficit — outflows lead",
      icon: ArrowLeftRight,
      iconBg: net >= 0 ? "bg-chart-2/10" : "bg-muted",
      iconColor: net >= 0 ? "text-chart-2" : "text-muted-foreground",
    },
    {
      label: "Overdue Receivables",
      value: fmtFull(summary.overdueAmount),
      sub: summary.overdueAmount > 0 ? "Needs immediate action" : "All clear",
      icon: AlertCircle,
      iconBg: summary.overdueAmount > 0 ? "bg-status-overdue" : "bg-muted",
      iconColor: summary.overdueAmount > 0 ? "text-status-overdue-foreground" : "text-muted-foreground",
    },
    {
      label: "Overdue Payables",
      value: fmtFull(summary.overduePayables),
      sub: summary.overduePayables > 0 ? "Pay to avoid late fees" : "All clear",
      icon: Clock,
      iconBg: summary.overduePayables > 0 ? "bg-chart-4/10" : "bg-muted",
      iconColor: summary.overduePayables > 0 ? "text-chart-4" : "text-muted-foreground",
    },
    {
      label: coverage !== null ? `Coverage ${coverage}%` : "Coverage",
      value: coverage !== null ? `${coverage}%` : "—",
      sub: coverage === null ? "No outflows in period"
        : coverage >= 100 ? "Inflows cover outflows"
        : "Shortfall — top up needed",
      icon: Activity,
      iconBg: coverage === null || coverage >= 100 ? "bg-chart-2/10" : "bg-chart-4/10",
      iconColor: coverage === null || coverage >= 100 ? "text-chart-2" : "text-chart-4",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((c, i) => (
        <div
          key={c.label}
          className={`bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/5 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
          style={{ transitionDelay: mounted ? `${i * 55}ms` : "0ms" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
              {c.label}
            </p>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${c.iconBg}`}>
              <c.icon className={`w-3.5 h-3.5 ${c.iconColor}`} />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold text-foreground tabular-nums leading-none">{c.value}</p>
            <p className="mt-1.5 text-[11px] text-muted-foreground leading-tight">{c.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
