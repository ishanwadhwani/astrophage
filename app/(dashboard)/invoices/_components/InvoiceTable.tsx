"use client";

import Link from "next/link";
import { Eye, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";

import { Invoice } from "@/types/invoice";
import PermissionGate from "@/components/ui/PermissionGate";

const statusConfig: Record<
  string,
  { dot: string; bg: string; text: string; border: string; label: string }
> = {
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

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? {
    dot: "bg-muted-foreground/40",
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
    label: status,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });

const getOutstanding = (invoice: Invoice) => {
  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  return invoice.total - paid;
};

interface Props {
  invoices: Invoice[];
  selected: Set<string>;
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  onDelete: (id: string) => void;
  // Pagination
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  loading?: boolean;
}

export default function InvoiceTable({
  invoices,
  selected = new Set<string>(),
  onSelect,
  onSelectAll,
  onDelete,
  page,
  pageSize,
  total,
  onPageChange,
  loading = false,
}: Props) {
  const totalPages = Math.ceil(total / pageSize);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  if (!loading && invoices.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
          <Search className="w-5 h-5 text-muted-foreground/50" />
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">
          No invoices match
        </p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your search or filter criteria
        </p>
      </div>
    );
  }

  const allSelected =
    invoices.length > 0 && invoices.every((inv) => selected.has(inv.id));
  const someSelected = invoices.some((inv) => selected.has(inv.id));

  const COL_HEADERS = [
    "Invoice",
    "Client",
    "Date",
    "Due Date",
    "Total",
    "Outstanding",
    "Status",
    "",
  ];

  return (
    <div className={`transition-opacity duration-150 ${loading ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={onSelectAll}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
              </th>
              {COL_HEADERS.map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {invoices.map((invoice) => {
              const outstanding = getOutstanding(invoice);
              const isSelected = selected.has(invoice.id);

              return (
                <tr
                  key={invoice.id}
                  className={`group transition-colors duration-100 ${
                    isSelected ? "bg-primary/5" : "hover:bg-muted/30"
                  }`}
                >
                  <td className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelect(invoice.id)}
                      className="w-4 h-4 accent-primary rounded cursor-pointer"
                    />
                  </td>

                  <td className="px-4 py-3.5">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      #{invoice.number}
                    </Link>
                  </td>

                  <td className="px-4 py-3.5 text-muted-foreground max-w-40 truncate">
                    {invoice.client.name}
                  </td>

                  <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap tabular-nums">
                    {new Date(invoice.invoiceDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>

                  <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap tabular-nums">
                    {new Date(invoice.dueDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  <td className="px-4 py-3.5 font-medium text-foreground tabular-nums whitespace-nowrap">
                    {fmt(invoice.total)}
                  </td>

                  <td className="px-4 py-3.5 tabular-nums whitespace-nowrap">
                    <span
                      className={
                        outstanding > 0
                          ? "font-semibold text-status-overdue-foreground"
                          : "text-status-paid-foreground font-medium"
                      }
                    >
                      {fmt(outstanding)}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <StatusBadge status={invoice.status} />
                  </td>

                  <td className="px-4 py-3.5 text-right opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        title="View invoice"
                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <PermissionGate permission="invoice:delete">
                        <button
                          onClick={() => onDelete(invoice.id)}
                          title="Delete invoice"
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </PermissionGate>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
          <p className="text-xs text-muted-foreground tabular-nums">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {from}–{to}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">{total}</span>{" "}
            invoices
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page numbers — show at most 5 around current */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - page) <= 1,
              )
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-1.5 text-xs text-muted-foreground"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => onPageChange(p as number)}
                    className={`min-w-7 h-7 px-2 rounded-lg text-xs font-medium transition-all ${
                      page === p
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
