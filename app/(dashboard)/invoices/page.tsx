"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trash2,
  FilePlus,
  Banknote,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Info,
} from "lucide-react";

import { Invoice, InvoiceStatus, RecurringInvoice } from "@/types/invoice";
import {
  fetchInvoices,
  deleteInvoice,
  fetchRecurringInvoices,
  toggleRecurringInvoice,
  deleteRecurringInvoice,
  bulkDeleteInvoices,
} from "@/lib/invoices";
import { getUser } from "@/lib/auth";
import { LoadingState } from "@/components/ui/LoadingState";
import InvoiceFilters from "./_components/InvoiceFilters";
import InvoiceTable from "./_components/InvoiceTable";
import RecurringInvoiceTable from "./_components/RecurringInvoiceTable";
import AddRecurringInvoiceModal from "./_components/AddRecurringInvoiceModal";
import { fetchClients } from "@/lib/clients";
import { Client } from "@/types/client";
import InvoiceExportButton, {
  RecurringInvoiceExportButton,
} from "./_components/ExportButton";
import { useToast } from "@/components/ui/Toast";
import PermissionGate from "@/components/ui/PermissionGate";

export default function InvoicesPage() {
  const user = getUser();
  const router = useRouter();
  const businessId = user?.business?.id;
  type PageTab = "invoices" | "recurring";

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "ALL">("ALL");
  const [pageTab, setPageTab] = useState<PageTab>("invoices");
  const [recurring, setRecurring] = useState<RecurringInvoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [recurringModal, setRecurringModal] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  const { confirm, success, error } = useToast();

  useEffect(() => {
    if (!businessId) return;

    const fetchData = async () => {
      try {
        const [invoiceResult, recurringResult, clientResult] =
          await Promise.allSettled([
            fetchInvoices(businessId),
            fetchRecurringInvoices(businessId),
            fetchClients(businessId),
          ]);

        if (invoiceResult.status === "fulfilled")
          setInvoices(invoiceResult.value);
        if (recurringResult.status === "fulfilled")
          setRecurring(recurringResult.value);
        if (clientResult.status === "fulfilled") setClients(clientResult.value);
      } catch {
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [businessId]);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesStatus = status === "ALL" || inv.status === status;

      const query = search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        inv.number.toLowerCase().includes(query) ||
        inv.client.name.toLowerCase().includes(query);

      const invDate = new Date(inv.invoiceDate);
      const matchesFrom =
        !dateRange.from || invDate >= new Date(dateRange.from);
      const matchesTo =
        !dateRange.to || invDate <= new Date(dateRange.to + "T23:59:59");

      return matchesStatus && matchesSearch && matchesFrom && matchesTo;
    });
  }, [invoices, search, status, dateRange]);

  const stats = useMemo(() => {
    const totalReceivables = invoices
      .filter((i) => i.status === "PENDING" || i.status === "OVERDUE")
      .reduce((s, i) => {
        const paid = i.payments.reduce((p, pay) => p + pay.amount, 0);
        return s + (i.total - paid);
      }, 0);

    const overdueCount = invoices.filter((i) => i.status === "OVERDUE").length;
    const paidCount = invoices.filter((i) => i.status === "PAID").length;

    return { totalReceivables, overdueCount, paidCount };
  }, [invoices]);

  const handleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelected((prev) =>
      prev.size === filtered.length
        ? new Set()
        : new Set(filtered.map((i) => i.id)),
    );
  };

  const handleBulkDelete = async () => {
    const confirmed = await confirm({
      title: `Delete ${selected.size} invoice${selected.size !== 1 ? "s" : ""}`,
      message:
        "This will permanently delete the selected invoices and all their payment records.",
      confirmText: "Delete all",
      danger: true,
    });
    if (!confirmed) return;

    try {
      const result = await bulkDeleteInvoices([...selected], businessId!);
      setInvoices((prev) => prev.filter((i) => !selected.has(i.id)));
      setSelected(new Set());
      success(
        `${result.deleted} invoice${result.deleted !== 1 ? "s" : ""} deleted`,
      );
    } catch {
      error("Failed to delete invoices");
    }
  };

  // const handleDelete = async (id: string) => {
  //   if (!confirm) return;
  //   try {
  //     await deleteInvoice(id);
  //     setInvoices((prev) => prev.filter((i) => i.id !== id));
  //   } catch {}
  // };

  const handleDelete = async (id: string) => {
    const invoice = invoices.find((i) => i.id === id);
    if (!invoice) return;

    const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
    const outstanding = invoice.total - paid;

    const confirmed = await confirm({
      title: `Move invoice #${invoice.number} to bin?`,
      message:
        `This invoice will be removed from your active list and excluded from ` +
        `receivables, collected totals, the dashboard, and GST reports. ` +
        (outstanding > 0
          ? `₹${outstanding.toLocaleString("en-IN")} of outstanding receivables will no longer be counted. `
          : ``) +
        (paid > 0
          ? `₹${paid.toLocaleString("en-IN")} of recorded payments will be excluded from your collected total. `
          : ``) +
        `You can restore it anytime from the Recycle Bin.`,
      confirmText: "Move to bin",
      danger: true,
    });
    if (!confirmed) return;

    try {
      await deleteInvoice(id);
      setInvoices((prev) => prev.filter((i) => i.id !== id));
      success(
        "Moved to bin",
        `Invoice #${invoice.number} can be restored from the bin.`,
      );
    } catch {
      error("Failed to delete invoice");
    }
  };

  const fmt = (n: number) =>
    "₹" +
    n.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  if (loading) return <LoadingState page="invoices" />;

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} total
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pageTab === "invoices" ? (
            <PermissionGate permission="report:export">
              <InvoiceExportButton invoices={filtered} label="Export" />
            </PermissionGate>
          ) : (
            <PermissionGate permission="report:export">
              <RecurringInvoiceExportButton items={recurring} label="Export" />
            </PermissionGate>
          )}

          <PermissionGate permission="invoice:create">
            <button
              onClick={() =>
                pageTab === "invoices"
                  ? router.push("/invoices/create")
                  : setRecurringModal(true)
              }
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 transition-all duration-200 shadow-sm shadow-primary/15"
            >
              {pageTab === "invoices" ? (
                <>
                  <FilePlus className="w-4 h-4" />
                  New Invoice
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Add Recurring
                </>
              )}
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* ── KPI cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Outstanding */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Outstanding
              </p>
              <p className="text-2xl font-bold text-foreground tabular-nums mt-2 leading-none">
                {fmt(stats.totalReceivables)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Pending &amp; overdue receivables
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>

        {/* Overdue */}
        <div
          className={`bg-card border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 ${
            stats.overdueCount > 0
              ? "border-status-overdue-foreground/25"
              : "border-border"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Overdue
              </p>
              <p
                className={`text-2xl font-bold tabular-nums mt-2 leading-none ${
                  stats.overdueCount > 0
                    ? "text-status-overdue-foreground"
                    : "text-foreground"
                }`}
              >
                {stats.overdueCount}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.overdueCount === 1
                  ? "Invoice needs attention"
                  : "Invoices need attention"}
              </p>
            </div>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                stats.overdueCount > 0 ? "bg-status-overdue" : "bg-muted"
              }`}
            >
              <AlertTriangle
                className={`w-5 h-5 ${
                  stats.overdueCount > 0
                    ? "text-status-overdue-foreground"
                    : "text-muted-foreground"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Paid */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Collected
              </p>
              <p className="text-2xl font-bold text-status-paid-foreground tabular-nums mt-2 leading-none">
                {stats.paidCount}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.paidCount === 1
                  ? "Invoice fully paid"
                  : "Invoices fully paid"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-status-paid flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-status-paid-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab switcher ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-muted rounded-xl p-1 w-fit">
        {(["invoices", "recurring"] as PageTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setPageTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 capitalize ${
              pageTab === t
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "invoices"
              ? `Invoices (${invoices.length})`
              : `Recurring (${recurring.length})`}
          </button>
        ))}
      </div>

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <InvoiceFilters
        search={search}
        status={status}
        dateRange={dateRange}
        onSearch={setSearch}
        onStatusChange={setStatus}
        onDateRange={setDateRange}
        totalCount={invoices.length}
        filteredCount={filtered.length}
      />

      {/* ── Bulk selection bar ───────────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between px-5 py-3 bg-primary/5 border border-primary/20 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="text-sm text-foreground">
            <span className="font-bold text-primary">{selected.size}</span>{" "}
            invoice{selected.size !== 1 ? "s" : ""} selected
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelected(new Set())}
              className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear selection
            </button>

            <PermissionGate permission="invoice:delete">
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 bg-background border border-destructive/30 text-destructive px-4 py-2 rounded-lg text-sm font-semibold hover:bg-destructive/10 hover:border-destructive/50 shadow-sm transition-all active:scale-[0.98]"
              >
                <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                Delete {selected.size}
              </button>
            </PermissionGate>
          </div>
        </div>
      )}

      {/* ── Invoice table ─────────────────────────────────────────────── */}
      {pageTab === "invoices" && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {invoices.length === 0 ? (
            <div className="text-center py-20 px-6">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <FilePlus className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <p className="text-base font-semibold text-foreground mb-1.5">
                No invoices yet
              </p>
              <p className="text-sm text-muted-foreground mb-5">
                Create your first invoice to start tracking payments
              </p>
              <Link
                href="/invoices/create"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <FilePlus className="w-4 h-4" />
                Create your first invoice
              </Link>
            </div>
          ) : (
            <InvoiceTable
              invoices={filtered}
              selected={selected}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              onDelete={handleDelete}
            />
          )}
        </div>
      )}

      {/* Recurring table  */}
      {pageTab === "recurring" && (
        <>
          <div className="flex items-start gap-3 bg-primary/5 border border-primary/15 rounded-xl px-4 py-3">
            <Info className="w-4 h-4 text-primary mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Recurring invoices are{" "}
              <strong className="text-foreground">templates</strong> that
              automatically generate a real invoice each cycle (weekly, monthly,
              etc.). Click any row to see the invoices it has generated. Paused
              templates stop generating until reactivated.
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <RecurringInvoiceTable
              items={recurring}
              onToggle={async (id) => {
                const updated = await toggleRecurringInvoice(id);
                setRecurring((prev) =>
                  prev.map((r) => (r.id === id ? updated : r)),
                );
              }}
              onDelete={async (id) => {
                if (!confirm) return;
                await deleteRecurringInvoice(id);
                setRecurring((prev) => prev.filter((r) => r.id !== id));
              }}
            />
            <AddRecurringInvoiceModal
              isOpen={recurringModal}
              businessId={businessId!}
              clients={clients}
              onClose={() => setRecurringModal(false)}
              onCreated={(ri) => setRecurring((prev) => [ri, ...prev])}
            />
          </div>
        </>
      )}
    </div>
  );
}
