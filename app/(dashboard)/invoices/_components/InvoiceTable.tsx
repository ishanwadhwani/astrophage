"use client";

import Link from "next/link";
import { Eye, Trash2 } from "lucide-react";

import { Invoice } from "@/types/invoice";
import PermissionGate from "@/components/ui/PermissionGate";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-status-draft text-status-draft-foreground",
  PENDING: "bg-status-pending text-status-pending-foreground",
  PAID: "bg-status-paid text-status-paid-foreground",
  OVERDUE: "bg-status-overdue text-status-overdue-foreground",
  CANCELLED: "bg-status-cancelled text-status-cancelled-foreground",
};

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
}

export default function InvoiceTable({
  invoices,
  selected = new Set<string>(),
  onSelect,
  onSelectAll,
  onDelete,
}: Props) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        No invoices match your search.
      </div>
    );
  }

  const allSelected =
    invoices.length > 0 && invoices.every((inv) => selected.has(inv.id));

  const someSelected = invoices.some((inv) => selected.has(inv.id));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 border-b border-border">
          <tr>
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
            {[
              "Invoice",
              "Client",
              "Date",
              "Due Date",
              "Total",
              "Outstanding",
              "Status",
              "",
            ].map((h) => (
              <th
                key={h}
                className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {invoices.map((invoice, index) => {
            const outstanding = getOutstanding(invoice);
            const isSelected = selected.has(invoice.id);
            return (
              <tr
                key={invoice.id}
                className={`transition group ${
                  isSelected
                    ? "bg-primary/5"
                    : index % 2 === 0
                      ? "bg-card hover:bg-muted/30"
                      : "bg-muted/20 hover:bg-muted/40"
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelect(invoice.id)}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="hover:text-primary transition"
                  >
                    #{invoice.number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {invoice.client.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {new Date(invoice.invoiceDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {new Date(invoice.dueDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 font-medium text-foreground tabular-nums">
                  {fmt(invoice.total)}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  <span
                    className={
                      outstanding > 0
                        ? "font-semibold text-status-overdue-foreground"
                        : "text-status-paid-foreground"
                    }
                  >
                    {fmt(outstanding)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[invoice.status]}`}
                  >
                    {invoice.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right opacity-0 group-hover:opacity-100 transition">
                  <div className="flex items-center justify-end gap-2">
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
  );
}
