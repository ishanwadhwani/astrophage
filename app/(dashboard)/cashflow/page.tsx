"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  TrendingUp, TrendingDown, Minus, RefreshCw,
  ChartLine, FilePlus, Receipt, Landmark, HelpCircle,
  ChevronDown, Activity,
} from "lucide-react";

import { CashflowData } from "@/types/cashflow";
import { fetchCashflow } from "@/lib/cashflow";
import { getUser } from "@/lib/auth";
import CashflowStats from "./_components/CashflowStats";
import CashflowTimeline from "./_components/CashflowTimeline";
import { LoadingState } from "@/components/ui/LoadingState";
import { Tooltip } from "@/components/ui/Tooltip";

// Dynamic chart import (Recharts is client-only)
const CashflowChart = dynamic(() => import("./_components/CashflowChart"), {
  ssr: false,
  loading: () => (
    <div className="h-80 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  ),
});

// ── Constants ─────────────────────────────────────────────────────────────────

const RANGES = [
  { label: "2 Weeks", days: 14 },
  { label: "30 Days", days: 30 },
  { label: "60 Days", days: 60 },
  { label: "90 Days", days: 90 },
];

const fmtCompact = (n: number) =>
  n >= 10_000_000 ? `₹${(n / 10_000_000).toFixed(1)}Cr`
  : n >= 100_000  ? `₹${(n / 100_000).toFixed(1)}L`
  : n >= 1_000    ? `₹${(n / 1_000).toFixed(0)}K`
  : `₹${Math.round(n)}`;

// ── Series toggle pill ────────────────────────────────────────────────────────

function SeriesPill({
  label, color, active, onClick,
}: { label: string; color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all duration-150 ${
        active
          ? "border-transparent text-foreground bg-muted"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0 transition-opacity duration-150"
        style={{ background: color, opacity: active ? 1 : 0.3 }}
      />
      {label}
    </button>
  );
}

// ── Insight chip ──────────────────────────────────────────────────────────────

function InsightChip({
  icon: Icon, label, value, positive, tip,
}: { icon: React.ElementType; label: string; value: string; positive?: boolean; tip?: string }) {
  return (
    <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 shrink-0">
      <Icon className={`w-3.5 h-3.5 shrink-0 ${
        positive === undefined ? "text-muted-foreground"
        : positive ? "text-chart-2" : "text-chart-3"
      }`} />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-bold tabular-nums ${
        positive === undefined ? "text-foreground"
        : positive ? "text-chart-2" : "text-chart-3"
      }`}>{value}</span>
      {tip && (
        <Tooltip content={tip} side="top">
          <HelpCircle className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-help" />
        </Tooltip>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CashflowPage() {
  const user = getUser();
  const businessId = user?.business?.id;

  const [data, setData]             = useState<CashflowData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [selectedDays, setSelectedDays] = useState(30);
  const [mounted, setMounted]       = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Chart series toggles
  const [showInflow,    setShowInflow]    = useState(true);
  const [showOutflow,   setShowOutflow]   = useState(true);
  const [showRecurring, setShowRecurring] = useState(true);
  const [showBalance,   setShowBalance]   = useState(true);

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    setMounted(false);
    fetchCashflow(businessId, selectedDays)
      .then((res) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [businessId, selectedDays]);

  useEffect(() => {
    if (!loading && data) {
      const id = setTimeout(() => setMounted(true), 50);
      return () => clearTimeout(id);
    }
  }, [loading, data]);

  // Must be before early returns — Rules of Hooks
  const insights = useMemo(() => {
    if (!data) return [];
    const { timeline, summary } = data;
    const net = summary.totalExpectedIn - summary.totalExpectedOut;
    const chips = [];

    chips.push({
      icon: net >= 0 ? TrendingUp : TrendingDown,
      label: net >= 0 ? "Surplus" : "Deficit",
      value: fmtCompact(Math.abs(net)),
      positive: net >= 0,
      tip: "Inflows minus outflows — what's left over this period.",
    });

    const hasRecurring = timeline.some((d) => d.projectedIn > 0 || d.projectedOut > 0);
    if (hasRecurring) {
      chips.push({
        icon: RefreshCw,
        label: "Includes recurring",
        value: "✓",
        positive: true,
      });
    }

    return chips;
  }, [data]);

  if (loading) return <LoadingState page="cashflow" />;
  if (!data)   return null;

  const { timeline, summary } = data;
  const activeDays = timeline.filter(
    (d) => d.expectedIn > 0 || d.expectedOut > 0 || d.projectedIn > 0 || d.projectedOut > 0,
  );
  const isEmpty = summary.totalExpectedIn === 0 && summary.totalExpectedOut === 0;
  const net     = summary.totalExpectedIn - summary.totalExpectedOut;
  const coverage = summary.totalExpectedOut > 0
    ? Math.round((summary.totalExpectedIn / summary.totalExpectedOut) * 100)
    : null;

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        className={`flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-all duration-500 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cashflow Timeline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Inflows and outflows over the next {selectedDays} days
          </p>
        </div>

        {/* Range selector */}
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1 shrink-0">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setSelectedDays(r.days)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
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

      {/* ── Insight chips ────────────────────────────────────────────────────── */}
      {!isEmpty && (
        <div
          className={`flex flex-wrap gap-2 transition-all duration-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
          style={{ transitionDelay: "80ms" }}
        >
          {insights.map((chip) => (
            <InsightChip key={chip.label} {...chip} />
          ))}

          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
              summary.gstDue > 0
                ? "bg-status-pending/10 border-status-pending/30"
                : summary.gstDue < 0
                  ? "bg-status-paid/10 border-status-paid/30"
                  : "bg-card border-border"
            }`}
          >
            <Landmark
              className={`w-3.5 h-3.5 shrink-0 ${
                summary.gstDue > 0
                  ? "text-status-pending-foreground"
                  : summary.gstDue < 0
                    ? "text-status-paid-foreground"
                    : "text-muted-foreground"
              }`}
            />
            <div className="leading-tight">
              <span
                className={`text-sm font-semibold ${
                  summary.gstDue > 0
                    ? "text-status-pending-foreground"
                    : summary.gstDue < 0
                      ? "text-status-paid-foreground"
                      : "text-muted-foreground"
                }`}
              >
                {summary.gstDue > 0
                  ? `GST ₹${summary.gstDue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                  : summary.gstDue < 0
                    ? `GST credit ₹${Math.abs(summary.gstDue).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                    : "GST ₹0"}
              </span>
              <span className="text-xs text-muted-foreground ml-1.5">
                {summary.gstDue > 0 && summary.gstDueDate
                  ? `due ${new Date(summary.gstDueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                  : summary.gstDue < 0
                    ? "carry forward"
                    : "nothing due this period"}
              </span>
            </div>
            <Tooltip content="A projection based on GST invoices and bills recorded so far this month — not a final filing figure." side="top">
              <HelpCircle className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-help" />
            </Tooltip>
          </div>
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <CashflowStats summary={summary} selectedDays={selectedDays} />

      {/* ── Chart card ──────────────────────────────────────────────────────── */}
      <div
        className={`bg-card border border-border rounded-2xl overflow-hidden transition-all duration-500 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
        style={{ transitionDelay: "360ms" }}
      >
        {/* Card header */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Daily Cashflow</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bars = daily flows · Line = running balance
              </p>
            </div>

            {/* Series toggles */}
            <div className="flex flex-wrap items-center gap-1.5">
              <SeriesPill
                label="Inflows"
                color="hsl(221,83%,53%)"
                active={showInflow}
                onClick={() => setShowInflow((v) => !v)}
              />
              <SeriesPill
                label="Outflows"
                color="hsl(258,90%,66%)"
                active={showOutflow}
                onClick={() => setShowOutflow((v) => !v)}
              />
              <SeriesPill
                label="Recurring"
                color="hsl(221,83%,75%)"
                active={showRecurring}
                onClick={() => setShowRecurring((v) => !v)}
              />
              <SeriesPill
                label="Balance"
                color="hsl(173,80%,40%)"
                active={showBalance}
                onClick={() => setShowBalance((v) => !v)}
              />
            </div>
          </div>
        </div>

        {/* Chart body */}
        <div className="px-4 py-5">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                <ChartLine className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">No cashflow data yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create invoices or add bills to see your cashflow projection
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/invoices/create"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                  Create Invoice
                </Link>
                <Link
                  href="/vendors"
                  className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground text-xs font-semibold rounded-xl hover:bg-muted/80 transition-colors"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  Add a Bill
                </Link>
              </div>
            </div>
          ) : (
            <CashflowChart
              timeline={timeline}
              showInflow={showInflow}
              showOutflow={showOutflow}
              showRecurring={showRecurring}
              showBalance={showBalance}
            />
          )}
        </div>

        {/* Chart legend footer */}
        {!isEmpty && (
          <div className="px-6 py-3 border-t border-border bg-muted/30 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {[
              { color: "hsl(221,83%,53%)",  label: "Confirmed Inflows" },
              { color: "hsl(221,83%,75%)",  label: "Recurring Inflows" },
              { color: "hsl(258,90%,66%)",  label: "Confirmed Outflows" },
              { color: "hsl(258,90%,82%)",  label: "Recurring Outflows" },
              { color: "hsl(173,80%,40%)",  label: "Running Balance", dashed: true },
            ].map(({ color, label, dashed }) => (
              <span key={label} className="flex items-center gap-1.5">
                {dashed ? (
                  <svg className="w-6 h-2 shrink-0" viewBox="0 0 24 8">
                    <line x1="0" y1="4" x2="24" y2="4" stroke={color} strokeWidth="2" strokeDasharray="4 2" />
                  </svg>
                ) : (
                  <span className="w-3 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
                )}
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── More details (secondary metrics) ───────────────────────────────── */}
      {!isEmpty && (
        <div
          className={`bg-card border border-border rounded-2xl overflow-hidden transition-all duration-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
          style={{ transitionDelay: "400ms" }}
        >
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-3.5 text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors"
          >
            More details
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                showDetails ? "rotate-180" : ""
              }`}
            />
          </button>
          {showDetails && (
            <div className="px-6 pb-5 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <ChartLine className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Peak day</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">
                    {summary.largestSingleDay > 0 ? fmtCompact(summary.largestSingleDay) : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Minus className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Active days</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">
                    {summary.daysWithCash > 0 ? summary.daysWithCash : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Coverage</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">
                    {coverage !== null ? `${coverage}%` : "—"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Timeline ────────────────────────────────────────────────────────── */}
      <CashflowTimeline activeDays={activeDays} />

    </div>
  );
}
