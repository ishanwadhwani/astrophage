"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  TrendingUp,
  TrendingDown,
  Landmark,
  AlertCircle,
  Clock,
  BadgeCheck,
  MessageCircle,
  Info,
  FileText,
  Receipt,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

import {
  DashboardData,
  DashboardInvoice,
  DashboardBill,
  DashboardCharts,
} from "@/types/dashboard";
import { fetchDashboard, fetchDashboardCharts } from "@/lib/dashboard";
import { getUser } from "@/lib/auth";
import { useBusiness } from "@/hooks/useBusiness";
import { openWhatsApp, invoiceReminderMessage } from "@/lib/whatsapp";
import { LoadingState } from "@/components/ui/LoadingState";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { fetchBusiness } from "@/lib/business";
import PermissionGate from "@/components/ui/PermissionGate";
import { Tooltip } from "@/components/ui/Tooltip";

// Helpers

const fmt = (n: number) =>
  "₹" +
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtCompact = (n: number) =>
  n >= 10_000_000
    ? `₹${(n / 10_000_000).toFixed(1)}Cr`
    : n >= 100_000
      ? `₹${(n / 100_000).toFixed(1)}L`
      : n >= 1_000
        ? `₹${(n / 1_000).toFixed(0)}K`
        : `₹${n}`;

const STATUS_CFG = {
  DRAFT: {
    dot: "bg-status-draft-foreground/40",
    bg: "bg-status-draft",
    text: "text-status-draft-foreground",
    border: "border-status-draft-foreground/15",
    label: "Draft",
  },
  PENDING: {
    dot: "bg-status-pending-foreground",
    bg: "bg-status-pending",
    text: "text-status-pending-foreground",
    border: "border-status-pending-foreground/20",
    label: "Pending",
  },
  PAID: {
    dot: "bg-status-paid-foreground",
    bg: "bg-status-paid",
    text: "text-status-paid-foreground",
    border: "border-status-paid-foreground/20",
    label: "Paid",
  },
  OVERDUE: {
    dot: "bg-status-overdue-foreground",
    bg: "bg-status-overdue",
    text: "text-status-overdue-foreground",
    border: "border-status-overdue-foreground/20",
    label: "Overdue",
  },
  CANCELLED: {
    dot: "bg-status-cancelled-foreground/40",
    bg: "bg-status-cancelled",
    text: "text-status-cancelled-foreground",
    border: "border-status-cancelled-foreground/15",
    label: "Cancelled",
  },
};

// Sub-components

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status as keyof typeof STATUS_CFG];
  if (!cfg)
    return <span className="text-xs text-muted-foreground">{status}</span>;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatCard({
  label,
  rawValue,
  sub,
  tip,
  icon: Icon,
  iconBg,
  iconColor,
  delay,
  mounted,
}: {
  label: string;
  rawValue: number;
  sub?: string;
  tip?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  delay: number;
  mounted: boolean;
}) {
  return (
    <div
      className={`bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/5 ${
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
      style={{ transitionDelay: mounted ? `${delay}ms` : "0ms" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {tip && (
            <Tooltip content={tip} side="top">
              <HelpCircle className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-help" />
            </Tooltip>
          )}
        </div>
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}
        >
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground tabular-nums">
          <AnimatedNumber value={rawValue} prefix="₹" decimals={2} />
        </p>
        {sub && (
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function AlertBanner({
  message,
  sub,
  href,
  variant,
}: {
  message: string;
  sub: string;
  href: string;
  variant: "danger" | "warning";
}) {
  const isWarning = variant === "warning";
  const Icon = isWarning ? Clock : AlertCircle;
  const accentBg = isWarning ? "bg-chart-4" : "bg-status-overdue-foreground";
  const iconClass = isWarning
    ? "text-chart-4"
    : "text-status-overdue-foreground";

  return (
    <div className="relative flex items-start gap-4 overflow-hidden rounded-2xl border border-border bg-card px-5 py-4">
      <div
        className={`absolute inset-y-0 left-0 w-0.75 rounded-l-2xl ${accentBg} opacity-70`}
      />
      <Icon className={`mt-0.5 w-4 h-4 shrink-0 ${iconClass}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{message}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
      </div>
      <Link
        href={href}
        className="shrink-0 flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
      >
        View <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

function SectionCard({
  title,
  count,
  href,
  icon: Icon,
  children,
  mounted,
  delay,
}: {
  title: string;
  count?: number;
  href?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  mounted?: boolean;
  delay?: number;
}) {
  return (
    <div
      className={`bg-card border border-border rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-md hover:shadow-black/5 ${
        mounted !== undefined
          ? mounted
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3"
          : ""
      }`}
      style={{ transitionDelay: mounted && delay ? `${delay}ms` : "0ms" }}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          )}
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {count !== undefined && count > 0 && (
            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {count}
            </span>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function InvoiceTable({
  invoices,
  emptyText,
  showWhatsApp,
  businessName,
}: {
  invoices: DashboardInvoice[];
  emptyText: string;
  showWhatsApp?: boolean;
  businessName?: string;
}) {
  if (invoices.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border">
            {["Invoice", "Client", "Due", "Outstanding", "Status", ""].map(
              (h) => (
                <th
                  key={h}
                  className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground last:pr-0"
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {invoices.map((inv, i) => (
            <tr
              key={inv.id}
              className="group transition-colors hover:bg-muted/30"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <td className="py-3 pr-4">
                <Link
                  href={`/invoices/${inv.id}`}
                  className="font-medium text-foreground transition-colors hover:text-primary"
                >
                  #{inv.number}
                </Link>
              </td>
              <td className="py-3 pr-4 text-muted-foreground">{inv.clientName}</td>
              <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground tabular-nums">
                {new Date(inv.dueDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </td>
              <td className="py-3 pr-4 font-semibold text-foreground tabular-nums">
                {fmt(inv.outstanding)}
              </td>
              <td className="py-3 pr-4">
                <StatusBadge status={inv.status} />
              </td>
              <PermissionGate permission="invoice:edit">
                <td className="py-3 text-right">
                  {showWhatsApp && inv.clientPhone && businessName && (
                    <button
                      onClick={() =>
                        openWhatsApp(
                          inv.clientPhone!,
                          invoiceReminderMessage(inv, businessName),
                        )
                      }
                      className="flex items-center gap-1.5 text-xs font-semibold opacity-0 transition-all group-hover:opacity-100"
                      style={{ color: "#25D366" }}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Remind
                    </button>
                  )}
                </td>
              </PermissionGate>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BillTable({
  bills,
  emptyText,
}: {
  bills: DashboardBill[];
  emptyText: string;
}) {
  if (bills.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-border">
            {["Description", "Vendor", "Due", "Outstanding", "Status"].map(
              (h) => (
                <th
                  key={h}
                  className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground last:pr-0"
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {bills.map((bill, i) => (
            <tr
              key={bill.id}
              className="transition-colors hover:bg-muted/30"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <td className="py-3 pr-4 font-medium text-foreground">
                {bill.description}
              </td>
              <td className="py-3 pr-4 text-muted-foreground">{bill.vendorName}</td>
              <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground tabular-nums">
                {new Date(bill.dueDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </td>
              <td className="py-3 pr-4 font-semibold text-foreground tabular-nums">
                {fmt(bill.outstanding)}
              </td>
              <td className="py-3">
                <StatusBadge status={bill.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Dynamic chart imports ──────────────────────────────────────────────────────

const ChartSpinner = () => (
  <div className="flex h-55 items-center justify-center">
    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
  </div>
);

const RevenueChart = dynamic(() => import("./_components/RevenueChart"), {
  ssr: false,
  loading: () => <ChartSpinner />,
});

const StatusChart = dynamic(() => import("./_components/StatusChart"), {
  ssr: false,
  loading: () => <ChartSpinner />,
});

// Page

export default function DashboardPage() {
  const user = getUser();
  const { businessId } = useBusiness();

  const [data, setData] = useState<DashboardData | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupIncomplete, setSetupIncomplete] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!businessId) return;

    fetchBusiness(businessId)
      .then((biz) => setSetupIncomplete(!biz.gstin && !biz.state))
      .catch(() => {});

    const load = async () => {
      try {
        const [result, chartResult] = await Promise.allSettled([
          fetchDashboard(businessId),
          fetchDashboardCharts(businessId),
        ]);
        if (result.status === "fulfilled") setData(result.value);
        if (chartResult.status === "fulfilled") setCharts(chartResult.value);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [businessId]);

  // Trigger entry animations after data lands
  useEffect(() => {
    if (!loading && data) {
      const id = window.setTimeout(() => setMounted(true), 50);
      return () => window.clearTimeout(id);
    }
  }, [loading, data]);

  // 6-month chart summary — must be before any early return (Rules of Hooks)
  const chartSummary = useMemo(() => {
    if (!charts) return null;
    return {
      invoiced: charts.monthlyTrend.reduce((s, m) => s + m.invoiced, 0),
      collected: charts.monthlyTrend.reduce((s, m) => s + m.collected, 0),
      spent: charts.monthlyTrend.reduce((s, m) => s + m.spent, 0),
    };
  }, [charts]);

  if (loading) return <LoadingState page="dashboard" />;
  if (!data) return null;

  const {
    stats,
    overdueInvoices,
    dueSoonInvoices,
    overdueB,
    dueSoonBills,
    recentInvoices,
  } = data;

  const hour = new Date().getHours();
  const greeting =
    hour >= 5 && hour < 12
      ? "Good morning"
      : hour >= 12 && hour < 17
        ? "Good afternoon"
        : hour >= 17 && hour < 22
          ? "Good evening"
          : "Welcome back";

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Stat cards config

  const statCards = [
    {
      label: "Total Receivables",
      rawValue: stats.totalReceivables,
      icon: TrendingUp,
      iconBg: "bg-chart-1/10",
      iconColor: "text-chart-1",
      sub: `${stats.totalClients} active client${stats.totalClients !== 1 ? "s" : ""}`,
      tip: "Unpaid invoice balances across all clients.",
    },
    {
      label: "Total Payables",
      rawValue: stats.totalPayables,
      icon: TrendingDown,
      iconBg: "bg-chart-4/10",
      iconColor: "text-chart-4",
      sub: "Bills outstanding",
      tip: "Unpaid bill balances across all vendors.",
    },
    {
      label: "GST This Month",
      rawValue: Math.abs(stats.gstPayable),
      icon: Landmark,
      iconBg: stats.gstPayable >= 0 ? "bg-status-pending/15" : "bg-status-paid/15",
      iconColor:
        stats.gstPayable >= 0
          ? "text-status-pending-foreground"
          : "text-status-paid-foreground",
      sub:
        stats.gstPayable >= 0
          ? "Payable to government"
          : "Credit — carry forward",
      tip: "Output GST minus input credit, this month.",
    },
    {
      label: "Overdue Receivables",
      rawValue: stats.overdueAmount,
      icon: AlertCircle,
      iconBg: stats.overdueAmount > 0 ? "bg-status-overdue" : "bg-muted",
      iconColor:
        stats.overdueAmount > 0
          ? "text-status-overdue-foreground"
          : "text-muted-foreground",
      sub: `${overdueInvoices.length} invoice${overdueInvoices.length !== 1 ? "s" : ""} past due`,
      tip: "Invoices past due and still unpaid — chase these.",
    },
    {
      label: "Overdue Payables",
      rawValue: stats.overduePayables,
      icon: Clock,
      iconBg: stats.overduePayables > 0 ? "bg-chart-4/10" : "bg-muted",
      iconColor:
        stats.overduePayables > 0 ? "text-chart-4" : "text-muted-foreground",
      sub: `${overdueB.length} bill${overdueB.length !== 1 ? "s" : ""} past due`,
      tip: "Bills past due that you haven't paid yet — pay these.",
    },
    {
      label: "Collected This Month",
      rawValue: stats.paidThisMonth,
      icon: BadgeCheck,
      iconBg: "bg-chart-2/10",
      iconColor: "text-chart-2",
      sub: new Date().toLocaleString("en-IN", { month: "long" }),
      tip: "Cash actually received this month — not just invoiced.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className={`transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
      >
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}, {user?.name?.split(" ")[0]}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{today}</p>
      </div>

      {/* Setup banner */}
      {setupIncomplete && (
        <div
          className={`flex items-start gap-4 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 transition-all duration-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
          style={{ transitionDelay: "100ms" }}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <Info className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              Complete your setup
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Add your GSTIN and state to start generating valid GST invoices
            </p>
          </div>
          <Link
            href="/settings"
            className="shrink-0 flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Setup <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {statCards.map((card, idx) => (
          <StatCard
            key={card.label}
            {...card}
            delay={idx * 60}
            mounted={mounted}
          />
        ))}
      </div>

      {/* Charts */}
      {charts && (
        <div
          className={`grid grid-cols-1 gap-6 lg:grid-cols-3 transition-all duration-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
          style={{ transitionDelay: "380ms" }}
        >
          {/* Revenue trend — 2/3 width */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden min-w-0">
            {/* Header with 6-month summary */}
            <div className="border-b border-border px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-semibold text-foreground">
                      Revenue Trend
                    </h2>
                    <Tooltip
                      content="Invoiced = billed. Collected = cash received. Spent = expenses & bills paid."
                      side="bottom"
                    >
                      <HelpCircle className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-help" />
                    </Tooltip>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Invoiced · Collected · Spent — last 6 months
                  </p>
                </div>
                {chartSummary && (
                  <div className="flex items-center gap-5">
                    {[
                      {
                        label: "Invoiced",
                        value: chartSummary.invoiced,
                        color: "text-chart-2",
                      },
                      {
                        label: "Collected",
                        value: chartSummary.collected,
                        color: "text-chart-1",
                      },
                      {
                        label: "Spent",
                        value: chartSummary.spent,
                        color: "text-chart-3",
                      },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {label}
                        </p>
                        <p
                          className={`text-sm font-bold tabular-nums ${color}`}
                        >
                          {fmtCompact(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Legend row */}
            <div className="flex items-center gap-5 px-5 pt-3 pb-0">
              {[
                { label: "Invoiced", color: "hsl(173,80%,40%)" },
                { label: "Collected", color: "hsl(221,83%,53%)" },
                { label: "Spent", color: "hsl(258,90%,66%)" },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: color }}
                  />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
            <div className="px-4 pb-4 pt-1 overflow-hidden">
              <RevenueChart data={charts.monthlyTrend} />
            </div>
          </div>

          {/* Invoice status breakdown — 1/3 width */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden min-w-0">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">
                Invoice Breakdown
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                By status — all time
              </p>
            </div>
            <div className="px-4 py-4">
              <StatusChart data={charts.statusBreakdown} />
            </div>
          </div>
        </div>
      )}

      {/* Alert notices */}
      {(overdueInvoices.length > 0 || overdueB.length > 0) && (
        <div
          className={`space-y-3 transition-all duration-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
          style={{ transitionDelay: "460ms" }}
        >
          {overdueInvoices.length > 0 && (
            <AlertBanner
              message={`${overdueInvoices.length} overdue invoice${overdueInvoices.length !== 1 ? "s" : ""} — ${fmt(stats.overdueAmount)} uncollected`}
              sub="Chase these clients to protect your cashflow"
              href="/invoices"
              variant="danger"
            />
          )}
          {overdueB.length > 0 && (
            <AlertBanner
              message={`${overdueB.length} overdue bill${overdueB.length !== 1 ? "s" : ""} — ${fmt(stats.overduePayables)} unpaid`}
              sub="Pay these vendors to avoid late fees"
              href="/vendors"
              variant="warning"
            />
          )}
        </div>
      )}

      {/* Receivables tables */}
      <div
        className={`grid grid-cols-1 gap-6 lg:grid-cols-2 transition-all duration-500 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
        style={{ transitionDelay: "520ms" }}
      >
        <SectionCard
          title="Overdue Invoices"
          count={overdueInvoices.length}
          href="/invoices"
          icon={AlertCircle}
        >
          <InvoiceTable
            invoices={overdueInvoices.slice(0, 5)}
            emptyText="No overdue invoices"
            showWhatsApp
            businessName={user?.business?.name}
          />
        </SectionCard>

        <SectionCard
          title="Due in 7 Days"
          count={dueSoonInvoices.length}
          href="/invoices"
          icon={Clock}
        >
          <InvoiceTable
            invoices={dueSoonInvoices.slice(0, 5)}
            emptyText="No invoices due this week"
            showWhatsApp
            businessName={user?.business?.name}
          />
        </SectionCard>
      </div>

      {/* Payables tables */}
      <div
        className={`grid grid-cols-1 gap-6 lg:grid-cols-2 transition-all duration-500 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
        style={{ transitionDelay: "580ms" }}
      >
        <SectionCard
          title="Overdue Bills"
          count={overdueB.length}
          href="/vendors"
          icon={Receipt}
        >
          <BillTable
            bills={overdueB.slice(0, 5)}
            emptyText="No overdue bills"
          />
        </SectionCard>

        <SectionCard
          title="Bills Due in 7 Days"
          count={dueSoonBills.length}
          href="/vendors"
          icon={Clock}
        >
          <BillTable
            bills={dueSoonBills.slice(0, 5)}
            emptyText="No bills due this week"
          />
        </SectionCard>
      </div>

      {/* Recent invoices */}
      <div
        className={`transition-all duration-500 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
        style={{ transitionDelay: "640ms" }}
      >
        <SectionCard title="Recent Invoices" href="/invoices" icon={FileText}>
          <InvoiceTable
            invoices={recentInvoices}
            emptyText="No invoices yet"
            showWhatsApp
            businessName={user?.business?.name}
          />
        </SectionCard>
      </div>
    </div>
  );
}
