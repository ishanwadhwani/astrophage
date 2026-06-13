"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, RefreshCw, BadgeCheck, Clock, IndianRupee,
  FileText, CalendarDays, MapPin, Receipt, Pause, Play,
  ChevronRight, Info, Loader2,
} from "lucide-react";

import { RecurringInvoiceDetail } from "@/types/invoice";
import { fetchRecurringInvoiceDetail, toggleRecurringInvoice } from "@/lib/invoices";
import { getUser } from "@/lib/auth";
import { LoadingState } from "@/components/ui/LoadingState";
import { Tooltip } from "@/components/ui/Tooltip";
import { EmptyCell } from "@/components/ui/EmptyCell";
import { useToast } from "@/components/ui/Toast";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const FREQ_CFG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  WEEKLY:    { label: "Every week",    bg: "bg-chart-5/10",  text: "text-chart-5",  border: "border-chart-5/20"  },
  MONTHLY:   { label: "Every month",   bg: "bg-primary/10",  text: "text-primary",  border: "border-primary/20"  },
  QUARTERLY: { label: "Every quarter", bg: "bg-chart-3/10",  text: "text-chart-3",  border: "border-chart-3/20"  },
  YEARLY:    { label: "Every year",    bg: "bg-chart-4/10",  text: "text-chart-4",  border: "border-chart-4/20"  },
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT:     "bg-status-draft text-status-draft-foreground",
  PENDING:   "bg-status-pending text-status-pending-foreground",
  PAID:      "bg-status-paid text-status-paid-foreground",
  OVERDUE:   "bg-status-overdue text-status-overdue-foreground",
  CANCELLED: "bg-status-cancelled text-status-cancelled-foreground",
};

function StatCard({
  label, value, icon: Icon, iconBg, iconColor, sub, delay = 0, mounted,
}: {
  label: string; value: string; icon: React.ElementType;
  iconBg: string; iconColor: string; sub?: string; delay?: number; mounted: boolean;
}) {
  return (
    <div
      className={`bg-card border border-border rounded-2xl p-5 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/5 ${
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        </div>
      </div>
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function RecurringInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { success, error } = useToast();
  const user = getUser();
  const businessId = user?.business?.id;

  const [data, setData]       = useState<RecurringInvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!businessId || !id) return;
    fetchRecurringInvoiceDetail(id, businessId)
      .then((d) => { setData(d); setTimeout(() => setMounted(true), 60); })
      .catch(() => router.push("/invoices"))
      .finally(() => setLoading(false));
  }, [id, businessId, router]);

  const perCycle = useMemo(() => {
    if (!data) return 0;
    return data.recurring.lineItems.reduce((s, item) => {
      const base = item.quantity * item.rate;
      return s + base + (base * item.gstRate) / 100;
    }, 0);
  }, [data]);

  const handleToggle = async () => {
    if (!data) return;
    setToggling(true);
    try {
      await toggleRecurringInvoice(id);
      setData((prev) => prev
        ? { ...prev, recurring: { ...prev.recurring, isActive: !prev.recurring.isActive } }
        : prev
      );
      success(data.recurring.isActive ? "Recurring invoice paused" : "Recurring invoice resumed", "success");
    } catch {
      error("Failed to update status", "error");
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <LoadingState page="invoices" />;
  if (!data) return null;

  const { recurring, generatedInvoices, summary, count } = data;
  const freqCfg = FREQ_CFG[recurring.frequency] ?? { label: recurring.frequency, bg: "bg-muted", text: "text-muted-foreground", border: "border-border" };
  const isActive = recurring.isActive;

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        className={`flex items-start justify-between gap-4 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
      >
        <div className="flex items-start gap-3">
          <Link
            href="/invoices"
            className="flex items-center justify-center w-9 h-9 mt-0.5 rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-all shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{recurring.client.name}</h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                isActive
                  ? "bg-status-paid text-status-paid-foreground border-status-paid-foreground/20"
                  : "bg-status-cancelled text-status-cancelled-foreground border-status-cancelled-foreground/20"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-status-paid-foreground animate-pulse" : "bg-status-cancelled-foreground/60"}`} />
                {isActive ? "Active" : "Paused"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{freqCfg.label}</span>
              <span className="text-border">·</span>
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Next due {fmtDate(recurring.nextDueDate)}</span>
            </div>
          </div>
        </div>

        {/* Pause / Resume button */}
        <Tooltip
          content={isActive
            ? "Pause this schedule — no new invoices will be generated until resumed."
            : "Resume this schedule — invoices will be generated on the next due date."}
          side="left"
        >
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] shrink-0 ${
              isActive
                ? "bg-muted text-foreground border border-border hover:bg-muted/80"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20"
            }`}
          >
            {toggling
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : isActive
                ? <Pause className="w-3.5 h-3.5" />
                : <Play className="w-3.5 h-3.5" />
            }
            {toggling ? "Updating…" : isActive ? "Pause" : "Resume"}
          </button>
        </Tooltip>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Per Cycle" value={fmt(perCycle)} icon={IndianRupee}
          iconBg="bg-chart-1/10" iconColor="text-chart-1"
          sub="incl. GST" delay={60} mounted={mounted} />
        <StatCard label="Invoices Generated" value={String(count)} icon={RefreshCw}
          iconBg="bg-chart-2/10" iconColor="text-chart-2"
          sub={count === 1 ? "invoice so far" : "invoices so far"} delay={110} mounted={mounted} />
        <StatCard label="Total Collected" value={fmt(summary.totalCollected)} icon={BadgeCheck}
          iconBg="bg-status-paid/30" iconColor="text-status-paid-foreground"
          delay={160} mounted={mounted} />
        <StatCard label="Outstanding" value={fmt(summary.totalPending)} icon={Clock}
          iconBg="bg-chart-4/10" iconColor="text-chart-4"
          delay={210} mounted={mounted} />
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* Left — template card */}
        <div
          className={`w-full lg:w-72 shrink-0 bg-card border border-border rounded-2xl overflow-hidden transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
          style={{ transitionDelay: "260ms" }}
        >
          <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-chart-3/10 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-chart-3" />
            </div>
            <h2 className="text-sm font-bold text-foreground">Template</h2>
          </div>

          <div className="p-5 space-y-5">
            {/* Schedule */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Schedule</p>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" />Frequency
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${freqCfg.bg} ${freqCfg.text} ${freqCfg.border}`}>
                    {freqCfg.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" />Next due
                  </span>
                  <Tooltip content="On this date a new invoice is auto-generated and the next due date advances one cycle." side="left">
                    <span className="font-medium text-foreground tabular-nums cursor-help underline decoration-dotted underline-offset-2 decoration-muted-foreground/40">
                      {fmtDate(recurring.nextDueDate)}
                    </span>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Tax info */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Tax</p>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />Place of supply
                  </span>
                  <span className="font-medium text-foreground">{recurring.placeOfSupply || <EmptyCell />}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5" />GST invoice
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${recurring.isGstInvoice ? "bg-status-paid/30 text-status-paid-foreground" : "bg-muted text-muted-foreground"}`}>
                    {recurring.isGstInvoice ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>

            {/* Line items */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 shrink-0">Line Items</p>
                <div className="flex-1 h-px bg-border/60" />
              </div>
              <div className="space-y-3">
                {recurring.lineItems.map((item, i) => (
                  <div key={item.id ?? i} className="bg-muted/40 rounded-xl p-3">
                    <p className="text-sm font-medium text-foreground leading-snug">{item.description}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × {fmt(item.rate)}
                      </p>
                      <span className="text-xs font-semibold text-chart-3">{item.gstRate}% GST</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right — generated invoices */}
        <div
          className={`flex-1 min-w-0 bg-card border border-border rounded-2xl overflow-hidden transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
          style={{ transitionDelay: "300ms" }}
        >
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-chart-1/10 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-chart-1" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Generated Invoices</h2>
                <p className="text-xs text-muted-foreground">{count} invoice{count !== 1 ? "s" : ""} created from this template</p>
              </div>
            </div>
            <Tooltip
              content="Real invoices auto-created on each due date. They appear in your main invoice list and count toward receivables."
              side="left" variant="info"
            >
              <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
            </Tooltip>
          </div>

          {generatedInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-6">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <RefreshCw className="w-5 h-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">No invoices generated yet</p>
              <p className="text-xs text-muted-foreground max-w-64 leading-relaxed">
                The first invoice will be created automatically when the due date ({fmtDate(recurring.nextDueDate)}) arrives.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Invoice", "Date", "Total", "Paid", "Outstanding", "Status"].map((h) => (
                      <th key={h} className={`px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${["Total","Paid","Outstanding"].includes(h) ? "text-right" : "text-left"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {generatedInvoices.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={`group hover:bg-muted/30 transition-all duration-300 ${mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"}`}
                      style={{ transitionDelay: `${320 + idx * 30}ms` }}
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/invoices/${row.id}`}
                          className="flex items-center gap-1 font-semibold text-foreground hover:text-primary transition-colors group-hover:underline underline-offset-2"
                        >
                          #{row.number}
                          <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap tabular-nums">
                        {fmtDate(row.invoiceDate)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-foreground tabular-nums whitespace-nowrap">
                        {fmt(row.total)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-status-paid-foreground tabular-nums whitespace-nowrap">
                        {fmt(row.paid)}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums whitespace-nowrap">
                        <span className={`font-semibold ${row.outstanding > 0 ? "text-status-overdue-foreground" : "text-status-paid-foreground"}`}>
                          {fmt(row.outstanding)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${STATUS_STYLES[row.status] ?? "bg-muted text-muted-foreground"}`}>
                          {row.status.charAt(0) + row.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
