"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MessageSquareWarning } from "lucide-react";

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
  accent = "default",
  isCurrency = false,
  rawValue,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "default" | "danger" | "success" | "warning";
  isCurrency?: boolean;
  rawValue?: number;
}) {
  const color = {
    default: "text-foreground",
    danger: "text-status-overdue-foreground",
    success: "text-status-paid-foreground",
    warning: "text-status-pending-foreground",
  }[accent];

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        {label}
      </p>
      <p className={`text-2xl font-bold ${color}`}>
        {isCurrency && rawValue !== undefined ? (
          <AnimatedNumber value={rawValue} prefix="₹" decimals={2} />
        ) : (
          value
        )}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
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
            {["Invoice", "Client", "Due", "Outstanding", "Status", ""].map(
              (h) => (
                <th
                  key={h}
                  className="text-left pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                >
                  {h}
                </th>
              ),
            )}
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
              <td className="py-3 font-semibold text-foreground">
                {fmt(inv.outstanding)}
              </td>
              <td className="py-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[inv.status]}`}
                >
                  {inv.status}
                </span>
              </td>
              <td className="py-3 text-right">
                {showWhatsApp && inv.clientPhone && businessName && (
                  <button
                    onClick={() =>
                      openWhatsApp(
                        inv.clientPhone!,
                        invoiceReminderMessage(inv, businessName),
                      )
                    }
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#25D366] hover:text-[#25D366]/80 transition"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Remind
                  </button>
                )}
              </td>
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
            {["Description", "Vendor", "Due", "Outstanding", "Status"].map(
              (h) => (
                <th
                  key={h}
                  className="text-left pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {bills.map((bill) => (
            <tr key={bill.id} className="hover:bg-muted/30 transition">
              <td className="py-3 font-medium text-foreground">
                {bill.description}
              </td>
              <td className="py-3 text-muted-foreground">{bill.vendorName}</td>
              <td className="py-3 text-muted-foreground">
                {new Date(bill.dueDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </td>
              <td className="py-3 font-semibold text-status-overdue-foreground">
                {fmt(bill.outstanding)}
              </td>
              <td className="py-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[bill.status]}`}
                >
                  {bill.status}
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
  const styles = {
    danger: {
      wrap: "bg-status-overdue/10 border-status-overdue-foreground/20",
      icon: "bg-status-overdue text-status-overdue-foreground",
      text: "text-status-overdue-foreground",
      btn: "bg-status-overdue-foreground text-white",
    },
    warning: {
      wrap: "bg-status-pending/10 border-status-pending-foreground/20",
      icon: "bg-status-pending text-status-pending-foreground",
      text: "text-status-pending-foreground",
      btn: "bg-status-pending-foreground text-white",
    },
  }[variant];

  return (
    <div
      className={`flex items-start gap-4 border rounded-2xl px-5 py-4 ${styles.wrap}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${styles.icon}`}
      >
        <MessageSquareWarning className="w-4 h-5" />
      </div>
      <div className="flex-1">
        <p className={`text-sm font-semibold ${styles.text}`}>{message}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
      <Link
        href={href}
        className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg hover:opacity-90 transition ${styles.btn}`}
      >
        View
      </Link>
    </div>
  );
}

const RevenueChart = dynamic(() => import("./_components/RevenueChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[220px] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  ),
});

const StatusChart = dynamic(() => import("./_components/StatusChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[220px] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  ),
});

export default function DashboardPage() {
  const user = getUser();
  const { businessId } = useBusiness();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);

  useEffect(() => {
    if (!businessId) return;

    const fetchData = async () => {
      try {
        const [result, chartResult] = await Promise.allSettled([
          fetchDashboard(businessId),
          fetchDashboardCharts(businessId),
        ]);
        if (result.status === "fulfilled") setData(result.value);
        if (chartResult.status === "fulfilled") setCharts(chartResult.value);
        // setData(result);
      } catch {
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [businessId]);

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

  const isSetupIncomplete =
    !user?.business?.name || data.stats.totalClients === 0;

  const net = stats.totalReceivables - stats.totalPayables;
  const hour = new Date().getHours();
  const greeting =
    hour >= 5 && hour < 12
      ? "Good morning"
      : hour >= 12 && hour < 17
        ? "Good afternoon"
        : hour >= 17 && hour < 22
          ? "Good evening"
          : "Welcome back";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here is what needs your attention today
        </p>
      </div>

      {/* reminder message to fill up the details */}
      {isSetupIncomplete && (
        <div className="flex items-center gap-4 bg-primary/8 border border-primary/20 rounded-2xl px-5 py-4">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              Complete your setup
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add your GSTIN, bank details, and first client to start generating
              valid invoices
            </p>
          </div>
          <Link
            href="/settings"
            className="shrink-0 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition"
          >
            Complete setup →
          </Link>
        </div>
      )}

      {/* Stats — 6 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total Receivables"
          value={fmt(stats.totalReceivables)}
          rawValue={stats.totalReceivables}
          isCurrency
          sub="Across all pending invoices"
        />
        <StatCard
          label="Total Payables"
          value={fmt(stats.totalPayables)}
          rawValue={stats.totalPayables}
          isCurrency
          sub="Bills outstanding"
          accent={stats.totalPayables > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Net Position"
          value={fmt(Math.abs(net))}
          rawValue={net}
          isCurrency
          sub={net >= 0 ? "Surplus" : "Deficit"}
          accent={net >= 0 ? "success" : "danger"}
        />
        <StatCard
          label="Overdue Receivables"
          value={fmt(stats.overdueAmount)}
          rawValue={stats.overdueAmount}
          isCurrency
          sub={`${overdueInvoices.length} invoice${overdueInvoices.length !== 1 ? "s" : ""} past due`}
          accent={stats.overdueAmount > 0 ? "danger" : "default"}
        />
        <StatCard
          label="Overdue Payables"
          value={fmt(stats.overduePayables)}
          rawValue={stats.overduePayables}
          isCurrency
          sub={`${overdueB.length} bill${overdueB.length !== 1 ? "s" : ""} past due`}
          accent={stats.overduePayables > 0 ? "danger" : "default"}
        />
        <StatCard
          label="Collected This Month"
          value={fmt(stats.paidThisMonth)}
          rawValue={stats.paidThisMonth}
          isCurrency
          accent={stats.paidThisMonth > 0 ? "success" : "default"}
        />
      </div>

      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue trend */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">
                Revenue Trend
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Invoiced vs collected vs spent — last 6 months
              </p>
            </div>
            <div className="px-4 py-4">
              <RevenueChart data={charts.monthlyTrend} />
            </div>
          </div>

          {/* Status breakdown */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">
                Invoice Breakdown
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                By status — all time
              </p>
            </div>
            <div className="px-4 py-2">
              <StatusChart data={charts.statusBreakdown} />
            </div>
          </div>
        </div>
      )}

      {/* Alert banners */}
      {overdueInvoices.length > 0 && (
        <AlertBanner
          message={`${overdueInvoices.length} overdue invoice${overdueInvoices.length !== 1 ? "s" : ""} — ${fmt(stats.overdueAmount)} uncollected`}
          sub="Chase these clients today to protect your cashflow"
          href="/invoices"
          variant="danger"
        />
      )}

      {overdueB.length > 0 && (
        <AlertBanner
          message={`${overdueB.length} overdue bill${overdueB.length !== 1 ? "s" : ""} — ${fmt(stats.overduePayables)} unpaid`}
          sub="Pay these vendors to avoid late fees and strained relationships"
          href="/vendors"
          variant="warning"
        />
      )}

      {/* Receivables grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard
          title="Overdue Invoices"
          count={overdueInvoices.length}
          href="/invoices"
        >
          <InvoiceTable
            invoices={overdueInvoices.slice(0, 5)}
            emptyText="No overdue invoices."
            showWhatsApp
            businessName={user?.business?.name}
          />
        </SectionCard>

        <SectionCard
          title="Invoices Due in 7 Days"
          count={dueSoonInvoices.length}
          href="/invoices"
        >
          <InvoiceTable
            invoices={dueSoonInvoices.slice(0, 5)}
            emptyText="No invoices due in the next 7 days."
            showWhatsApp
            businessName={user?.business?.name}
          />
        </SectionCard>
      </div>

      {/* Payables grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard
          title="Overdue Bills"
          count={overdueB.length}
          href="/vendors"
        >
          <BillTable
            bills={overdueB.slice(0, 5)}
            emptyText="No overdue bills."
          />
        </SectionCard>

        <SectionCard
          title="Bills Due in 7 Days"
          count={dueSoonBills.length}
          href="/vendors"
        >
          <BillTable
            bills={dueSoonBills.slice(0, 5)}
            emptyText="No bills due in the next 7 days."
          />
        </SectionCard>
      </div>

      {/* Recent invoices */}
      <SectionCard title="Recent Invoices" href="/invoices">
        <InvoiceTable
          invoices={recentInvoices}
          emptyText="No invoices yet."
          showWhatsApp
          businessName={user?.business?.name}
        />
      </SectionCard>
    </div>
  );
}
