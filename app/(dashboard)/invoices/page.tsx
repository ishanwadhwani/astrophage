"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Invoice, InvoiceStatus } from "@/types/invoice";
import { fetchInvoices, deleteInvoice } from "@/lib/invoices";
import { getUser } from "@/lib/auth";
import { LoadingState } from "@/components/ui/LoadingState";
import InvoiceFilters from "./_components/InvoiceFilters";
import InvoiceTable from "./_components/InvoiceTable";

export default function InvoicesPage() {
  const user = getUser();
  const businessId = user?.business?.id;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "ALL">("ALL");

  useEffect(() => {
    if (!businessId) return;

    const fetchData = async () => {
      try {
        const data = await fetchInvoices(businessId);
        setInvoices(data);
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

      return matchesStatus && matchesSearch;
    });
  }, [invoices, search, status]);

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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this invoice?")) return;
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
        <Link
          href="/invoices/create"
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
        >
          New invoice
        </Link>
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

      <InvoiceFilters
        search={search}
        status={status}
        onSearch={setSearch}
        onStatusChange={setStatus}
        totalCount={invoices.length}
        filteredCount={filtered.length}
      />
      
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
          <InvoiceTable invoices={filtered} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}
