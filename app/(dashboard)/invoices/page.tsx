"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

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

  // const handleClearDate = () => {
  //   setDateRange({ from: "", to: "" });
  // };

  const { confirm, success, error } = useToast();

  useEffect(() => {
    // setLoading(true);
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

  // useEffect(() => {
  //   setSelected(new Set());
  // }, [search, status]);

  // const handleSearchChange = (value: string) => {
  //   setSearch(value);
  //   setSelected(new Set());
  // };

  // const handleStatusChange = (value: InvoiceStatus | "ALL") => {
  //   setStatus(value);
  //   setSelected(new Set());
  // };

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

  const handleDelete = async (id: string) => {
    if (!confirm) return;
    try {
      await deleteInvoice(id);
      setInvoices((prev) => prev.filter((i) => i.id !== id));
    } catch {}
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
      {/* Header */}
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
            <RecurringInvoiceExportButton items={recurring} label="Export" />
          )}{" "}
          <PermissionGate permission="invoice:create">
            <button
              onClick={() =>
                pageTab === "invoices"
                  ? router.push("/invoices/create")
                  : setRecurringModal(true)
              }
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
            >
              {pageTab === "invoices" ? "New Invoice" : "Add Recurring"}
            </button>
          </PermissionGate>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl px-5 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Outstanding
          </p>
          <p className="text-xl font-bold text-foreground">
            {fmt(stats.totalReceivables)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl px-5 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Overdue
          </p>
          <p
            className={`text-xl font-bold ${
              stats.overdueCount > 0
                ? "text-status-overdue-foreground"
                : "text-foreground"
            }`}
          >
            {stats.overdueCount} invoice{stats.overdueCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl px-5 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Paid
          </p>
          <p className="text-xl font-bold text-status-paid-foreground">
            {stats.paidCount} invoice{stats.paidCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* tab switcher */}
      <div className="flex items-center gap-1 bg-muted rounded-xl p-1 w-fit">
        {(["invoices", "recurring"] as PageTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setPageTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
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

      <PermissionGate permission="invoice:create">
        <button
          onClick={() =>
            pageTab === "invoices"
              ? router.push("/invoices/create")
              : setRecurringModal(true)
          }
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
        >
          {pageTab === "invoices" ? "New invoice" : "Add Recurring"}
        </button>
      </PermissionGate>

      <InvoiceFilters
        search={search}
        status={status}
        dateRange={dateRange}
        onSearch={setSearch}
        onStatusChange={setStatus}
        onDateRange={setDateRange}
        onClearDate={() => setDateRange({ from: "", to: "" })}
        totalCount={invoices.length}
        filteredCount={filtered.length}
      />

      {selected.size > 0 && (
        <div className="flex items-center justify-between px-5 py-3 mb-4 bg-primary/5 border border-primary/20 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
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

      {pageTab === "invoices" && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {invoices.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-sm mb-3">
                No invoices yet.
              </p>
              <Link
                href="/invoices/create"
                className="text-sm font-semibold text-primary hover:text-primary/80 transition"
              >
                Create your first invoice →
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

      {pageTab === "recurring" && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
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
      )}
    </div>
  );
}
