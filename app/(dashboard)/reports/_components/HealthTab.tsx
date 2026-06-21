"use client";

import { useEffect, useState } from "react";
import { HealthReport } from "@/types/reports";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";

const fmt = (n: number) =>
  "₹" +
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

interface Props {
  report: HealthReport;
}

export default function HealthTab({ report }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const isProfit = report.profitLoss.grossProfit >= 0;
  const isPositiveCash = report.cashflow.netCashflow >= 0;
  const isPositivePosition = report.position.netPosition >= 0;

  const card = `transition-all duration-500 ${
    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
  }`;

  const cashOutPct =
    report.cashflow.cashIn > 0
      ? Math.min((report.cashflow.cashOut / report.cashflow.cashIn) * 100, 100)
      : report.cashflow.cashOut > 0
        ? 100
        : 0;

  const plRows = [
    {
      label: "Revenue (taxable)",
      value: report.profitLoss.taxableRevenue,
      bold: false,
      accent: false,
    },
    {
      label: "GST collected",
      value: report.profitLoss.gstCollected,
      bold: false,
      accent: false,
    },
    {
      label: "Total billed",
      value: report.profitLoss.totalBilled,
      bold: true,
      accent: false,
    },
    {
      label: "Total expenses",
      value: -report.profitLoss.totalExpenses,
      bold: false,
      accent: false,
    },
    {
      label: "Gross profit",
      value: report.profitLoss.grossProfit,
      bold: true,
      accent: true,
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── KPI Hero Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gross Profit */}
        <div
          className={`relative overflow-hidden bg-card border border-border rounded-2xl p-6 ${card}`}
          style={{ transitionDelay: mounted ? "0ms" : "0ms" }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Gross Profit
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Accrual basis
              </p>
            </div>
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                isProfit
                  ? "bg-status-paid text-status-paid-foreground"
                  : "bg-status-overdue text-status-overdue-foreground"
              }`}
            >
              {isProfit ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {report.profitLoss.profitMargin}% margin
            </div>
          </div>

          <p
            className={`text-4xl font-black tabular-nums tracking-tight ${
              isProfit ? "text-foreground" : "text-status-overdue-foreground"
            }`}
          >
            {fmt(report.profitLoss.grossProfit)}
          </p>

          <p className="text-xs text-muted-foreground mt-3">
            Billed{" "}
            <span className="font-semibold text-foreground">
              {fmt(report.profitLoss.totalBilled)}
            </span>{" "}
            · Expenses{" "}
            <span className="font-semibold text-foreground">
              {fmt(report.profitLoss.totalExpenses)}
            </span>
          </p>

          <div
            className={`absolute -bottom-6 -right-6 w-28 h-28 rounded-full blur-2xl opacity-[0.08] ${
              isProfit ? "bg-status-paid-foreground" : "bg-status-overdue-foreground"
            }`}
          />
        </div>

        {/* Net Cashflow */}
        <div
          className={`relative overflow-hidden bg-card border border-border rounded-2xl p-6 ${card}`}
          style={{ transitionDelay: mounted ? "80ms" : "0ms" }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Net Cashflow
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Cash basis
              </p>
            </div>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isPositiveCash ? "bg-status-paid/20" : "bg-status-overdue/20"
              }`}
            >
              {isPositiveCash ? (
                <ArrowDownLeft className="w-4 h-4 text-status-paid-foreground" />
              ) : (
                <ArrowUpRight className="w-4 h-4 text-status-overdue-foreground" />
              )}
            </div>
          </div>

          <p
            className={`text-4xl font-black tabular-nums tracking-tight ${
              isPositiveCash
                ? "text-status-paid-foreground"
                : "text-status-overdue-foreground"
            }`}
          >
            {isPositiveCash ? "+" : ""}
            {fmt(report.cashflow.netCashflow)}
          </p>

          <div className="flex items-center gap-4 mt-3">
            <div>
              <p className="text-[10px] text-muted-foreground">In</p>
              <p className="text-xs font-semibold text-status-paid-foreground tabular-nums">
                {fmt(report.cashflow.cashIn)}
              </p>
            </div>
            <div className="w-px h-6 bg-border" />
            <div>
              <p className="text-[10px] text-muted-foreground">Out</p>
              <p className="text-xs font-semibold text-status-overdue-foreground tabular-nums">
                {fmt(report.cashflow.cashOut)}
              </p>
            </div>
          </div>

          <div
            className={`absolute -bottom-6 -right-6 w-28 h-28 rounded-full blur-2xl opacity-[0.08] ${
              isPositiveCash ? "bg-status-paid-foreground" : "bg-status-overdue-foreground"
            }`}
          />
        </div>

        {/* Net Position */}
        <div
          className={`relative overflow-hidden bg-card border border-border rounded-2xl p-6 ${card}`}
          style={{ transitionDelay: mounted ? "160ms" : "0ms" }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Net Position
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Receivables vs payables
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
          </div>

          <p
            className={`text-4xl font-black tabular-nums tracking-tight ${
              isPositivePosition
                ? "text-foreground"
                : "text-status-overdue-foreground"
            }`}
          >
            {fmt(report.position.netPosition)}
          </p>

          <div className="flex items-center gap-4 mt-3">
            <div>
              <p className="text-[10px] text-muted-foreground">Receivables</p>
              <p className="text-xs font-semibold text-status-paid-foreground tabular-nums">
                {fmt(report.position.receivablesOutstanding)}
              </p>
            </div>
            <div className="w-px h-6 bg-border" />
            <div>
              <p className="text-[10px] text-muted-foreground">Payables</p>
              <p className="text-xs font-semibold text-status-overdue-foreground tabular-nums">
                {fmt(report.position.payablesOutstanding)}
              </p>
            </div>
          </div>

          <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full blur-2xl opacity-[0.06] bg-primary" />
        </div>
      </div>

      {/* ── P&L Statement ──────────────────────────────────────────── */}
      <div
        className={`bg-card border border-border rounded-2xl overflow-hidden ${card}`}
        style={{ transitionDelay: mounted ? "240ms" : "0ms" }}
      >
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Profit &amp; Loss Statement
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Accrual basis — billed vs incurred
            </p>
          </div>
        </div>

        <div className="divide-y divide-border">
          {plRows.map((row) => (
            <div
              key={row.label}
              className={`flex items-center justify-between px-6 py-3.5 ${
                row.accent
                  ? isProfit
                    ? "bg-status-paid/[0.04]"
                    : "bg-status-overdue/[0.04]"
                  : ""
              }`}
            >
              <span
                className={`text-sm ${
                  row.bold
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {row.label}
              </span>
              <span
                className={`tabular-nums text-sm ${
                  row.accent
                    ? row.value >= 0
                      ? "font-bold text-status-paid-foreground"
                      : "font-bold text-status-overdue-foreground"
                    : row.bold
                      ? "font-semibold text-foreground"
                      : "text-foreground"
                }`}
              >
                {row.value < 0
                  ? `(${fmt(Math.abs(row.value))})`
                  : fmt(row.value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Cashflow Visual + Top Expenses ─────────────────────────── */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${card}`}
        style={{ transitionDelay: mounted ? "320ms" : "0ms" }}
      >
        {/* Cashflow breakdown with bars */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-bold text-foreground mb-5">
            Cashflow Breakdown
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground font-medium">
                  Cash In (collected)
                </span>
                <span className="font-bold text-status-paid-foreground tabular-nums">
                  {fmt(report.cashflow.cashIn)}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-status-paid-foreground rounded-full transition-all duration-1000 ease-out"
                  style={{ width: mounted ? "100%" : "0%" }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground font-medium">
                  Cash Out (paid)
                </span>
                <span className="font-bold text-status-overdue-foreground tabular-nums">
                  {fmt(report.cashflow.cashOut)}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-status-overdue-foreground/70 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: mounted ? `${cashOutPct}%` : "0%",
                    transitionDelay: mounted ? "150ms" : "0ms",
                  }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                Net Cashflow
              </span>
              <span
                className={`text-sm font-bold tabular-nums ${
                  isPositiveCash
                    ? "text-status-paid-foreground"
                    : "text-status-overdue-foreground"
                }`}
              >
                {isPositiveCash ? "+" : ""}
                {fmt(report.cashflow.netCashflow)}
              </span>
            </div>
          </div>
        </div>

        {/* Top Expenses */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-bold text-foreground mb-5">
            Top Expenses by Vendor
          </h3>
          {report.topExpenses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No expenses paid in this period.
            </p>
          ) : (
            <div className="space-y-4">
              {report.topExpenses.map((e, i) => {
                const max = report.topExpenses[0].amount;
                const pct = (e.amount / max) * 100;
                return (
                  <div key={e.vendor}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-foreground font-medium truncate max-w-[60%]">
                        {e.vendor}
                      </span>
                      <span className="text-muted-foreground tabular-nums font-semibold">
                        {fmt(e.amount)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: mounted ? `${pct}%` : "0%",
                          transitionDelay: mounted ? `${320 + i * 80}ms` : "0ms",
                          background: `hsl(var(--primary) / ${Math.max(0.3, 0.9 - i * 0.12)})`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Monthly Trend Bar Chart (when data available) ──────────── */}
      {report.monthlyTrend && report.monthlyTrend.length > 1 && (
        <div
          className={`bg-card border border-border rounded-2xl overflow-hidden ${card}`}
          style={{ transitionDelay: mounted ? "400ms" : "0ms" }}
        >
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-sm font-bold text-foreground">
              Monthly Cashflow Trend
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Cash collected vs cash paid per month
            </p>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-end gap-3 h-32">
              {report.monthlyTrend.map((m, i) => {
                const maxVal = Math.max(
                  ...report.monthlyTrend.map((t) =>
                    Math.max(t.cashIn, t.cashOut),
                  ),
                  1,
                );
                const inH = (m.cashIn / maxVal) * 100;
                const outH = (m.cashOut / maxVal) * 100;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="flex items-end gap-0.5 h-24 w-full">
                      <div className="flex-1 flex flex-col justify-end">
                        <div
                          className="bg-status-paid-foreground/70 rounded-t-sm transition-all duration-700 ease-out"
                          style={{
                            height: mounted ? `${inH}%` : "0%",
                            transitionDelay: mounted ? `${400 + i * 60}ms` : "0ms",
                          }}
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-end">
                        <div
                          className="bg-status-overdue-foreground/50 rounded-t-sm transition-all duration-700 ease-out"
                          style={{
                            height: mounted ? `${outH}%` : "0%",
                            transitionDelay: mounted ? `${440 + i * 60}ms` : "0ms",
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-[9px] text-muted-foreground text-center leading-tight">
                      {m.month}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-5 mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-status-paid-foreground/70" />
                <span className="text-xs text-muted-foreground">Cash In</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-status-overdue-foreground/50" />
                <span className="text-xs text-muted-foreground">Cash Out</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
