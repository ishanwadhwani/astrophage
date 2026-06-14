"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, IndianRupee, CheckCircle2, AlertCircle, Clock,
  Mail, Phone, MapPin, Building2, ReceiptText,
  TrendingUp, User, Calendar, FileText, CreditCard,
} from "lucide-react";
import { ClientDetail, ClientInvoiceRow } from "@/types/client";
import { fetchClientDetail } from "@/lib/clients";
import { getUser } from "@/lib/auth";
import { LoadingState } from "@/components/ui/LoadingState";
import { Tooltip } from "@/components/ui/Tooltip";
import DataTable, { TableColumn } from "@/components/shared/DataTable";

// ── Formatters ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// ── Config maps ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  DRAFT:     { label: "Draft",     cls: "bg-status-draft text-status-draft-foreground border-status-draft-foreground/20",               dot: "bg-status-draft-foreground"              },
  PENDING:   { label: "Pending",   cls: "bg-status-pending text-status-pending-foreground border-status-pending-foreground/20",         dot: "bg-status-pending-foreground"            },
  PAID:      { label: "Paid",      cls: "bg-status-paid text-status-paid-foreground border-status-paid-foreground/20",                 dot: "bg-status-paid-foreground"               },
  OVERDUE:   { label: "Overdue",   cls: "bg-status-overdue text-status-overdue-foreground border-status-overdue-foreground/20",        dot: "bg-status-overdue-foreground animate-pulse" },
  CANCELLED: { label: "Cancelled", cls: "bg-status-cancelled text-status-cancelled-foreground border-status-cancelled-foreground/20",  dot: "bg-status-cancelled-foreground"          },
};

const RELIABILITY_CONFIG: Record<string, {
  label: string; cls: string; dot: string; desc: string; icon: React.ReactNode;
}> = {
  excellent: { label: "Excellent Payer", cls: "bg-status-paid/15 text-status-paid-foreground border-status-paid-foreground/25",         dot: "bg-status-paid-foreground animate-pulse",    desc: "Pays on time 90%+ of the time",             icon: <CheckCircle2 className="w-3 h-3" /> },
  good:      { label: "Good Payer",      cls: "bg-status-paid/10 text-status-paid-foreground border-status-paid-foreground/20",         dot: "bg-status-paid-foreground/70",              desc: "Pays on time 70–90% of the time",           icon: <CheckCircle2 className="w-3 h-3" /> },
  fair:      { label: "Fair Payer",      cls: "bg-status-pending/15 text-status-pending-foreground border-status-pending-foreground/25", dot: "bg-status-pending-foreground",              desc: "Pays on time 50–70% of the time",           icon: <Clock className="w-3 h-3" /> },
  poor:      { label: "Slow Payer",      cls: "bg-status-overdue/15 text-status-overdue-foreground border-status-overdue-foreground/25", dot: "bg-status-overdue-foreground animate-pulse", desc: "Often pays late — consider stricter terms", icon: <AlertCircle className="w-3 h-3" /> },
  new:       { label: "New Client",      cls: "bg-muted text-muted-foreground border-border",                                           dot: "bg-muted-foreground",                       desc: "Not enough payment history yet",            icon: <User className="w-3 h-3" /> },
};

const AVATAR_COLORS = [
  { bg: "bg-chart-1/20", text: "text-chart-1", ring: "ring-chart-1/30" },
  { bg: "bg-chart-3/20", text: "text-chart-3", ring: "ring-chart-3/30" },
  { bg: "bg-chart-2/20", text: "text-chart-2", ring: "ring-chart-2/30" },
  { bg: "bg-chart-4/20", text: "text-chart-4", ring: "ring-chart-4/30" },
  { bg: "bg-primary/20", text: "text-primary",  ring: "ring-primary/30" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = getUser();
  const businessId = user?.business?.id;

  const [data, setData] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!businessId || !id) return;
    fetchClientDetail(id, businessId)
      .then((d) => { setData(d); setTimeout(() => setMounted(true), 60); })
      .catch(() => router.push("/clients"))
      .finally(() => setLoading(false));
  }, [id, businessId, router]);

  if (loading) return <LoadingState page="clients" />;
  if (!data) return null;

  const { client, summary, invoices } = data;
  const rel = RELIABILITY_CONFIG[summary.reliability];
  const avatarColor = AVATAR_COLORS[client.name.charCodeAt(0) % AVATAR_COLORS.length];
  const initials = client.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const collectionPct =
    summary.totalBilled > 0
      ? Math.min(100, Math.round((summary.totalCollected / summary.totalBilled) * 100))
      : 0;

  const animCls = `transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`;

  const addressParts = [
    client.address,
    [client.city, client.state].filter(Boolean).join(", "),
    client.pincode,
  ].filter(Boolean);

  const columns: TableColumn<ClientInvoiceRow>[] = [
    {
      key: "number",
      header: "Invoice",
      render: (r) => (
        <Link href={`/invoices/${r.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
          #{r.number}
        </Link>
      ),
    },
    {
      key: "invoiceDate",
      header: "Date",
      render: (r) => (
        <span className="text-muted-foreground text-xs whitespace-nowrap">{fmtDate(r.invoiceDate)}</span>
      ),
    },
    {
      key: "dueDate",
      header: "Due",
      render: (r) => (
        <span className="text-muted-foreground text-xs whitespace-nowrap">{fmtDate(r.dueDate)}</span>
      ),
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      render: (r) => (
        <span className="font-medium text-foreground tabular-nums">{fmt(r.total)}</span>
      ),
    },
    {
      key: "outstanding",
      header: "Outstanding",
      align: "right",
      render: (r) => (
        <span className={`font-semibold tabular-nums ${r.outstanding > 0 ? "text-status-overdue-foreground" : "text-status-paid-foreground"}`}>
          {fmt(r.outstanding)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const s = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.DRAFT;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
            {s.label}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className={`flex items-start gap-4 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}>
        <Link
          href="/clients"
          className="mt-1 flex items-center justify-center w-8 h-8 rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-all shrink-0 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold ring-2 shrink-0 ${avatarColor.bg} ${avatarColor.text} ${avatarColor.ring}`}>
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground leading-tight">{client.name}</h1>
            <Tooltip content={rel.desc} side="right">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border cursor-help ${rel.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${rel.dot}`} />
                {rel.icon}
                {rel.label}
              </span>
            </Tooltip>
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {client.email && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="w-3 h-3 shrink-0" />{client.email}
              </span>
            )}
            {client.phone && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="w-3 h-3 shrink-0" />+91 {client.phone}
              </span>
            )}
            {(client.city || client.state) && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 shrink-0" />
                {[client.city, client.state].filter(Boolean).join(", ")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <div className={`bg-card border border-border rounded-2xl p-5 ${animCls}`} style={{ transitionDelay: "60ms" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Billed</p>
            <div className="w-7 h-7 rounded-lg bg-chart-1/10 flex items-center justify-center">
              <IndianRupee className="w-3.5 h-3.5 text-chart-1" />
            </div>
          </div>
          <p className="text-xl font-bold text-foreground tabular-nums">{fmt(summary.totalBilled)}</p>
          <p className="text-xs text-muted-foreground mt-1">{summary.invoiceCount} invoice{summary.invoiceCount !== 1 ? "s" : ""}</p>
        </div>

        <div className={`bg-card border border-border rounded-2xl p-5 ${animCls}`} style={{ transitionDelay: "100ms" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Collected</p>
            <div className="w-7 h-7 rounded-lg bg-status-paid/20 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-status-paid-foreground" />
            </div>
          </div>
          <p className="text-xl font-bold text-status-paid-foreground tabular-nums">{fmt(summary.totalCollected)}</p>
          <p className="text-xs text-muted-foreground mt-1">{summary.paidCount} paid</p>
        </div>

        <div className={`bg-card border border-border rounded-2xl p-5 ${animCls}`} style={{ transitionDelay: "140ms" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Outstanding</p>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${summary.totalOutstanding > 0 ? "bg-status-overdue/20" : "bg-muted"}`}>
              <AlertCircle className={`w-3.5 h-3.5 ${summary.totalOutstanding > 0 ? "text-status-overdue-foreground" : "text-muted-foreground"}`} />
            </div>
          </div>
          <p className={`text-xl font-bold tabular-nums ${summary.totalOutstanding > 0 ? "text-status-overdue-foreground" : "text-foreground"}`}>
            {fmt(summary.totalOutstanding)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {summary.overdueCount > 0 ? `${summary.overdueCount} overdue` : summary.pendingCount > 0 ? `${summary.pendingCount} pending` : "all clear"}
          </p>
        </div>

        <div className={`bg-card border border-border rounded-2xl p-5 ${animCls}`} style={{ transitionDelay: "180ms" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avg Days to Pay</p>
            <Tooltip content="Average days from invoice date to full payment, across all settled invoices" side="top">
              <div className="w-7 h-7 rounded-lg bg-chart-3/10 flex items-center justify-center cursor-help">
                <Clock className="w-3.5 h-3.5 text-chart-3" />
              </div>
            </Tooltip>
          </div>
          <p className="text-xl font-bold text-foreground tabular-nums">
            {summary.avgDaysToPay !== null ? summary.avgDaysToPay : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {summary.avgDaysToPay !== null ? "days average" : "no data yet"}
          </p>
        </div>

      </div>

      {/* ── Collection overview ─────────────────────────────────────────── */}
      <div className={`bg-card border border-border rounded-2xl p-5 ${animCls}`} style={{ transitionDelay: "220ms" }}>
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-sm font-bold text-foreground">Collection Overview</h2>
            <p className="text-xs text-muted-foreground mt-0.5">How much of the billed amount has been recovered</p>
          </div>
          <span className="text-sm font-bold text-foreground tabular-nums">{collectionPct}%</span>
        </div>

        <div className="mt-4 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-status-paid-foreground rounded-full transition-all duration-1000 ease-out"
            style={{ width: mounted ? `${collectionPct}%` : "0%" }}
          />
        </div>

        {summary.onTimeRate !== null ? (
          <div className="flex items-center gap-5 mt-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-status-paid-foreground shrink-0" />
              {summary.onTimeCount} on time
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-status-overdue-foreground shrink-0" />
              {summary.lateCount} late
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5 text-chart-3" />
              <span><span className="font-semibold text-foreground">{summary.onTimeRate}%</span> on-time rate</span>
            </span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mt-3">
            Payment behaviour will appear once invoices are settled.
          </p>
        )}
      </div>

      {/* ── Two-column: Contact + Invoice History ──────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">

        {/* Contact card */}
        <div className={`w-full lg:w-72 shrink-0 bg-card border border-border rounded-2xl overflow-hidden ${animCls}`} style={{ transitionDelay: "280ms" }}>
          <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <h2 className="text-sm font-bold text-foreground">Contact Details</h2>
          </div>

          <div className="divide-y divide-border/50">
            {client.email && (
              <ContactRow icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={client.email} />
            )}
            {client.phone && (
              <ContactRow icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={`+91 ${client.phone}`} />
            )}
            {client.gstin && (
              <ContactRow icon={<Building2 className="w-3.5 h-3.5" />} label="GSTIN" value={client.gstin} mono />
            )}
            {client.pan && (
              <ContactRow icon={<CreditCard className="w-3.5 h-3.5" />} label="PAN" value={client.pan} mono />
            )}
            {addressParts.length > 0 && (
              <ContactRow
                icon={<MapPin className="w-3.5 h-3.5" />}
                label="Address"
                value={addressParts.join("\n")}
                multiline
              />
            )}
            {client.notes && (
              <ContactRow icon={<FileText className="w-3.5 h-3.5" />} label="Notes" value={client.notes} multiline />
            )}
            <ContactRow
              icon={<Calendar className="w-3.5 h-3.5" />}
              label="Client Since"
              value={fmtDate(client.createdAt)}
            />
          </div>
        </div>

        {/* Invoice history */}
        <div className={`flex-1 min-w-0 bg-card border border-border rounded-2xl overflow-hidden ${animCls}`} style={{ transitionDelay: "320ms" }}>
          <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-chart-1/10 flex items-center justify-center shrink-0">
                <ReceiptText className="w-3.5 h-3.5 text-chart-1" />
              </div>
              <h2 className="text-sm font-bold text-foreground">Invoice History</h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {summary.paidCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-status-paid text-status-paid-foreground border border-status-paid-foreground/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-paid-foreground" />
                  {summary.paidCount} paid
                </span>
              )}
              {summary.pendingCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-status-pending text-status-pending-foreground border border-status-pending-foreground/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-pending-foreground" />
                  {summary.pendingCount} pending
                </span>
              )}
              {summary.overdueCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-status-overdue text-status-overdue-foreground border border-status-overdue-foreground/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-overdue-foreground animate-pulse" />
                  {summary.overdueCount} overdue
                </span>
              )}
            </div>
          </div>

          <DataTable
            columns={columns}
            data={invoices}
            keyExtractor={(r) => r.id}
            emptyText="No invoices for this client yet."
          />
        </div>

      </div>
    </div>
  );
}

// ── ContactRow ────────────────────────────────────────────────────────────────

function ContactRow({
  icon, label, value, mono = false, multiline = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-3.5">
      <div className="mt-0.5 text-muted-foreground/60 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className={`text-sm text-foreground mt-0.5 break-words ${mono ? "font-mono tracking-wide" : "font-medium"} ${multiline ? "whitespace-pre-line leading-relaxed" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
