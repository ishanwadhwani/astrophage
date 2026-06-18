"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilePlus, RefreshCw, Info, Trash2 } from "lucide-react";

import {
  Invoice,
  InvoiceStatus,
  InvoiceSortOrder,
  InvoiceStats,
  RecurringInvoice,
} from "@/types/invoice";
import {
  fetchInvoicesPaginated,
  fetchInvoiceStats,
  deleteInvoice,
  fetchRecurringInvoices,
  toggleRecurringInvoice,
  deleteRecurringInvoice,
  bulkDeleteInvoices,
} from "@/lib/invoices";
import { getUser } from "@/lib/auth";
import { LoadingState } from "@/components/ui/LoadingState";
import { useToast } from "@/components/ui/Toast";
import PermissionGate from "@/components/ui/PermissionGate";
import { fetchClients } from "@/lib/clients";
import { Client } from "@/types/client";

import InvoiceKPICards from "./_components/InvoiceKPICards";
import InvoiceBulkBar from "./_components/InvoiceBulkBar";
import InvoiceFilters from "./_components/InvoiceFilters";
import InvoiceTable from "./_components/InvoiceTable";
import RecurringInvoiceTable from "./_components/RecurringInvoiceTable";
import AddRecurringInvoiceModal from "./_components/AddRecurringInvoiceModal";
import InvoiceExportButton, {
  RecurringInvoiceExportButton,
} from "./_components/ExportButton";

const PAGE_SIZE = 10;

type PageTab = "invoices" | "recurring";

const EMPTY_STATS: InvoiceStats = {
  totalReceivables: 0,
  overdueCount: 0,
  paidCount: 0,
  totalCount: 0,
};

export default function InvoicesPage() {
  const user = getUser();
  const router = useRouter();
  const businessId = user?.business?.id;
  const { confirm, success, error } = useToast();

  //Pagination & filter state
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<InvoiceSortOrder>("newest");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "ALL">("ALL");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  //Data state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<InvoiceStats>(EMPTY_STATS);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);

  //Tab / modal / selection
  const [pageTab, setPageTab] = useState<PageTab>("invoices");
  const [recurring, setRecurring] = useState<RecurringInvoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [recurringModal, setRecurringModal] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Debounce search input (400 ms)
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
      setSelected(new Set());
    }, 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Reset page + selection whenever a filter changes
  const handleStatusChange = (v: InvoiceStatus | "ALL") => {
    setStatus(v);
    setPage(1);
    setSelected(new Set());
  };
  const handleDateRange = (v: { from: string; to: string }) => {
    setDateRange(v);
    setPage(1);
    setSelected(new Set());
  };
  const handleSortChange = (v: InvoiceSortOrder) => {
    setSortOrder(v);
    setPage(1);
    setSelected(new Set());
  };
  const handlePageChange = (p: number) => {
    setPage(p);
    setSelected(new Set());
  };

  // Fetch paginated invoices
  useEffect(() => {
    if (!businessId) {
      const id = setTimeout(() => setInitialized(true), 0);
      return () => clearTimeout(id);
    }

    let canceled = false;

    const doFetch = async () => {
      setLoading(true);
      try {
        const { data, total: t } = await fetchInvoicesPaginated(businessId, {
          page,
          pageSize: PAGE_SIZE,
          sort: sortOrder,
          search: debouncedSearch || undefined,
          status: status !== "ALL" ? status : undefined,
          dateFrom: dateRange.from || undefined,
          dateTo: dateRange.to || undefined,
        });
        if (canceled) return;
        setInvoices(data);
        setTotal(t);
        setInitialized(true);
      } catch {
        if (!canceled) setInitialized(true);
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    void doFetch();

    return () => {
      canceled = true;
    };
  }, [businessId, page, sortOrder, debouncedSearch, status, dateRange]);

  // Fetch recurring, clients, and global stats once on mount
  useEffect(() => {
    if (!businessId) return;
    Promise.allSettled([
      fetchRecurringInvoices(businessId),
      fetchClients(businessId),
      fetchInvoiceStats(businessId),
    ]).then(([recurringRes, clientRes, statsRes]) => {
      if (recurringRes.status === "fulfilled") setRecurring(recurringRes.value);
      if (clientRes.status === "fulfilled") setClients(clientRes.value);
      if (statsRes.status === "fulfilled") setStats(statsRes.value);
    });
  }, [businessId]);

  // Handlers
  const handleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelected((prev) =>
      prev.size === invoices.length
        ? new Set()
        : new Set(invoices.map((i) => i.id)),
    );
  };

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
      setTotal((t) => t - 1);
      setStats((s) => ({
        ...s,
        totalCount: Math.max(0, s.totalCount - 1),
        overdueCount:
          invoice.status === "OVERDUE"
            ? Math.max(0, s.overdueCount - 1)
            : s.overdueCount,
        paidCount:
          invoice.status === "PAID"
            ? Math.max(0, s.paidCount - 1)
            : s.paidCount,
        totalReceivables:
          invoice.status === "PENDING" || invoice.status === "OVERDUE"
            ? Math.max(0, s.totalReceivables - outstanding)
            : s.totalReceivables,
      }));
      success(
        "Moved to bin",
        `Invoice #${invoice.number} can be restored from the bin.`,
      );
    } catch {
      error("Failed to delete invoice");
    }
  };

  const handleBulkDelete = async () => {
    const confirmed = await confirm({
      title: `Delete ${selected.size} invoice${selected.size !== 1 ? "s" : ""}`,
      message:
        "This will move the selected invoices to the bin. You can restore them anytime.",
      confirmText: "Move to bin",
      danger: true,
    });
    if (!confirmed) return;

    try {
      const result = await bulkDeleteInvoices([...selected], businessId!);
      const deletedIds = new Set(selected);
      const deletedInvoices = invoices.filter((i) => deletedIds.has(i.id));
      const { overdueDecrease, paidDecrease, receivablesDecrease } =
        deletedInvoices.reduce(
          (acc, inv) => {
            const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
            return {
              overdueDecrease:
                acc.overdueDecrease + (inv.status === "OVERDUE" ? 1 : 0),
              paidDecrease:
                acc.paidDecrease + (inv.status === "PAID" ? 1 : 0),
              receivablesDecrease:
                acc.receivablesDecrease +
                (inv.status === "PENDING" || inv.status === "OVERDUE"
                  ? Math.max(0, inv.total - paid)
                  : 0),
            };
          },
          { overdueDecrease: 0, paidDecrease: 0, receivablesDecrease: 0 },
        );
      setInvoices((prev) => prev.filter((i) => !deletedIds.has(i.id)));
      setTotal((t) => t - result.deleted);
      setStats((s) => ({
        ...s,
        totalCount: Math.max(0, s.totalCount - result.deleted),
        overdueCount: Math.max(0, s.overdueCount - overdueDecrease),
        paidCount: Math.max(0, s.paidCount - paidDecrease),
        totalReceivables: Math.max(0, s.totalReceivables - receivablesDecrease),
      }));
      setSelected(new Set());
      success(
        `${result.deleted} invoice${result.deleted !== 1 ? "s" : ""} moved to bin`,
      );
    } catch {
      error("Failed to delete invoices");
    }
  };

  if (!initialized) return <LoadingState page="invoices" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {stats.totalCount} invoice{stats.totalCount !== 1 ? "s" : ""} total
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/invoices/bin"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-muted-foreground border border-border rounded-lg hover:bg-muted hover:text-foreground transition-all duration-150"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Bin
          </Link>

          {pageTab === "invoices" ? (
            <PermissionGate permission="report:export">
              <InvoiceExportButton invoices={invoices} label="Export" />
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

      {/* KPI cards */}
      <InvoiceKPICards stats={stats} />

      {/* Tab switcher */}
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
              ? `Invoices (${stats.totalCount})`
              : `Recurring (${recurring.length})`}
          </button>
        ))}
      </div>

      {/* Filters */}
      <InvoiceFilters
        search={searchInput}
        status={status}
        dateRange={dateRange}
        sortOrder={sortOrder}
        onSearch={setSearchInput}
        onStatusChange={handleStatusChange}
        onDateRange={handleDateRange}
        onSortChange={handleSortChange}
        totalCount={stats.totalCount}
        filteredCount={total}
      />

      {/* Bulk selection bar */}
      <InvoiceBulkBar
        count={selected.size}
        onClear={() => setSelected(new Set())}
        onDelete={handleBulkDelete}
      />

      {/* Invoice table */}
      {pageTab === "invoices" && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {!loading && stats.totalCount === 0 ? (
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
              invoices={invoices}
              selected={selected}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              onDelete={handleDelete}
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onPageChange={handlePageChange}
              loading={loading}
            />
          )}
        </div>
      )}

      {/* Recurring table */}
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
