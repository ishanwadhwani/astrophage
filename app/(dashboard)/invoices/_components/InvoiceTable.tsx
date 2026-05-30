import Link from "next/link";
import { Invoice } from "@/types/invoice";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-status-draft text-status-draft-foreground",
  PENDING: "bg-status-pending text-status-pending-foreground",
  PAID: "bg-status-paid text-status-paid-foreground",
  OVERDUE: "bg-status-overdue text-status-overdue-foreground",
  CANCELLED: "bg-status-cancelled text-status-cancelled-foreground",
};

const fmt = (n: number) =>
  "₹" +
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getOutstanding = (invoice: Invoice) => {
  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  return invoice.total - paid;
};

interface Props {
  invoices: Invoice[];
  onDelete: (id: string) => void;
}

export default function InvoiceTable({ invoices, onDelete }: Props) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        No invoices match your search.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 border-b border-border">
          <tr>
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
          {invoices.map((invoice) => {
            const outstanding = getOutstanding(invoice);
            return (
              <tr
                key={invoice.id}
                className="hover:bg-muted/30 transition group"
              >
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
                  {new Date(invoice.invoiceDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(invoice.dueDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {fmt(invoice.total)}
                </td>
                <td className="px-4 py-3">
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
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="text-xs font-medium text-primary hover:text-primary/80 transition"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => onDelete(invoice.id)}
                      className="text-xs text-destructive hover:text-destructive/70 transition"
                    >
                      Delete
                    </button>
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
