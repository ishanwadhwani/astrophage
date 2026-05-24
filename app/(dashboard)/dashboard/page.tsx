"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardData, DashboardInvoice } from "@/types/dashboard";
import { fetchDashboard } from "@/lib/dashboard";
import { getUser } from "@/lib/auth";
import { useBusiness } from "@/hooks/useBusiness";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-status-draft text-status-draft-foreground",
  PENDING: "bg-status-pending text-status-pending-foreground",
  PAID: "bg-status-paid text-status-paid-foreground",
  OVERDUE: "bg-status-overdue text-status-overdue-foreground",
  CANCELLED: "bg-status-cancelled text-status-cancelled-foreground",
};

const fmt = (amount: number) =>
  "₹" +
  amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "default" | "danger" | "success";
}) {
  const valueColor =
    accent === "danger"
      ? "text-status-overdue-foreground"
      : accent === "success"
        ? "text-status-paid-foreground"
        : "text-foreground";

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        {label}
      </p>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function InvoiceTable({
  invoices,
  emptyText,
}: {
  invoices: DashboardInvoice[];
  emptyText: string;
}) {
  if (invoices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Invoice
            </th>
            <th className="text-left pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Client
            </th>
            <th className="text-left pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Due
            </th>
            <th className="text-right pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Outstanding
            </th>
            <th className="text-left pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide pl-4">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {invoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-muted/30 transition">
              <td className="py-3 font-medium text-foreground">
                <Link
                  href={`/invoices/${inv.id}`}
                  className="hover:text-primary transition"
                >
                  #{inv.number}
                </Link>
              </td>
              <td className="py-3 text-muted-foreground">{inv.clientName}</td>
              <td className="py-3 text-muted-foreground">
                {new Date(inv.dueDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </td>
              <td className="py-3 text-right font-semibold text-foreground">
                {fmt(inv.outstanding)}
              </td>
              <td className="py-3 pl-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    statusStyles[inv.status] ?? ""
                  }`}
                >
                  {inv.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionCard({
  title,
  count,
  href,
  children,
}: {
  title: string;
  count?: number;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {count !== undefined && count > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              {count}
            </span>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="text-xs font-medium text-primary hover:text-primary/80 transition"
          >
            View all →
          </Link>
        )}
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}

export default function DashboardPage() {
  const user = getUser();
  const { businessId } = useBusiness();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;

    const fetchData = async () => {
      try {
        const result = await fetchDashboard(businessId);
        setData(result);
      } catch {
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [businessId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { stats, overdueInvoices, dueSoonInvoices, recentInvoices } = data;

  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12
      ? "Good morning"
      : greetingHour < 17
        ? "Good afternoon"
        : "Good evening";

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here is what needs your attention today
        </p>
      </div>

      {/* ── Stat cards ──────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Receivables"
          value={fmt(stats.totalReceivables)}
          sub="Across all pending invoices"
        />
        <StatCard
          label="Overdue"
          value={fmt(stats.overdueAmount)}
          sub={`${overdueInvoices.length} invoice${overdueInvoices.length !== 1 ? "s" : ""} past due`}
          accent={stats.overdueAmount > 0 ? "danger" : "default"}
        />
        <StatCard
          label="Collected This Month"
          value={fmt(stats.paidThisMonth)}
          accent={stats.paidThisMonth > 0 ? "success" : "default"}
        />
        <StatCard
          label="Total Clients"
          value={String(stats.totalClients)}
          sub="Active client accounts"
        />
      </div>

      {/* ── Action banner — only shown when overdue exists ── */}
      {overdueInvoices.length > 0 && (
        <div className="flex items-start gap-4 bg-status-overdue/10 border border-status-overdue-foreground/20 rounded-2xl px-5 py-4">
          <div className="w-8 h-8 rounded-full bg-status-overdue flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-status-overdue-foreground"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-status-overdue-foreground">
              {overdueInvoices.length} overdue invoice
              {overdueInvoices.length !== 1 ? "s" : ""} need attention
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {fmt(stats.overdueAmount)} is past due. Chase these clients today
              to protect your cashflow.
            </p>
          </div>
          <Link
            href="/invoices"
            className="flex-shrink-0 px-3 py-1.5 bg-status-overdue-foreground text-white text-xs font-semibold rounded-lg hover:opacity-90 transition"
          >
            View all
          </Link>
        </div>
      )}

      {/* ── Main grid ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue */}
        <SectionCard
          title="Overdue"
          count={overdueInvoices.length}
          href="/invoices"
        >
          <InvoiceTable
            invoices={overdueInvoices.slice(0, 5)}
            emptyText="No overdue invoices. You are all caught up."
          />
        </SectionCard>

        {/* Due in 7 days */}
        <SectionCard
          title="Due in 7 Days"
          count={dueSoonInvoices.length}
          href="/invoices"
        >
          <InvoiceTable
            invoices={dueSoonInvoices.slice(0, 5)}
            emptyText="No invoices due in the next 7 days."
          />
        </SectionCard>
      </div>

      {/* Recent invoices — full width */}
      <SectionCard title="Recent Invoices" href="/invoices">
        <InvoiceTable
          invoices={recentInvoices}
          emptyText="No invoices yet. Create your first one."
        />
      </SectionCard>
    </div>
  );
}
