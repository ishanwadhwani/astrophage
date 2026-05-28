"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Invoice } from "@/types/invoice";
import { fetchInvoices, deleteInvoice } from "@/lib/invoices";
import { getUser } from "@/lib/auth";
import { LoadingState } from "@/components/ui/LoadingState";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-status-draft text-status-draft-foreground",
  PENDING: "bg-status-pending text-status-pending-foreground",
  PAID: "bg-status-paid text-status-paid-foreground",
  OVERDUE: "bg-status-overdue text-status-overdue-foreground",
  CANCELLED: "bg-status-cancelled text-status-cancelled-foreground",
};

const getOutstanding = (invoice: Invoice): number => {
  const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  return invoice.total - totalPaid;
};

export default function InvoicePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const user = getUser();
  const businessId = user?.business?.id;

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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this invoice?")) return;
    try {
      await deleteInvoice(id);
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/invoices/create"
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition"
        >
          New invoice
        </Link>
      </div>
      {loading ? (
        <LoadingState page="invoices" />
      ) : invoices.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No invoices yet. Create your first one.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Invoice
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Client
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Due Date
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Total
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Outstanding
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((invoice) => {
                const outstanding = getOutstanding(invoice);
                return (
                  <tr key={invoice.id} className="hover:bg-muted/50 transition">
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
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(invoice.dueDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      ₹{invoice.total.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={
                          outstanding > 0
                            ? "text-status-overdue-foreground font-medium"
                            : "text-status-paid-foreground"
                        }
                      >
                        ₹{outstanding.toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[invoice.status]}`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className="text-destructive hover:text-destructive/70 text-xs transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
