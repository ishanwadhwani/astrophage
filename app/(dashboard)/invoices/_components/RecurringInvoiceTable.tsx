import { RecurringInvoice } from "@/types/invoice";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });

const FREQ_LABELS: Record<string, string> = {
  WEEKLY: "Every week",
  MONTHLY: "Every month",
  QUARTERLY: "Every quarter",
  YEARLY: "Every year",
};

interface Props {
  items: RecurringInvoice[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function RecurringInvoiceTable({
  items,
  onToggle,
  onDelete,
}: Props) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        No recurring invoices set up yet.
      </div>
    );
  }

  const getTotal = (ri: RecurringInvoice) =>
    ri.lineItems.reduce((s, item) => {
      const amount = item.quantity * item.rate;
      return s + amount + (amount * item.gstRate) / 100;
    }, 0);

  return (
    <table className="w-full text-sm">
      <thead className="bg-muted/60 border-b border-border">
        <tr>
          {[
            "Description",
            "Client",
            "Amount",
            "Frequency",
            "Next Due",
            "GST",
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
        {items.map((ri) => (
          <tr key={ri.id} className="hover:bg-muted/30 transition">
            <td className="px-4 py-3 font-medium text-foreground">
              {ri.lineItems[0]?.description}
            </td>
            <td className="px-4 py-3 text-muted-foreground">
              {ri.client.name}
            </td>
            <td className="px-4 py-3 font-semibold text-foreground">
              {fmt(getTotal(ri))}
              <span className="text-xs font-normal text-muted-foreground ml-1">
                / {FREQ_LABELS[ri.frequency].replace("Every ", "")}
              </span>
            </td>
            <td className="px-4 py-3 text-muted-foreground">
              {FREQ_LABELS[ri.frequency]}
            </td>
            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
              {new Date(ri.nextDueDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </td>
            <td className="px-4 py-3 text-muted-foreground">
              {ri.lineItems[0]?.gstRate}%
            </td>
            <td className="px-4 py-3">
              <button
                onClick={() => onToggle(ri.id)}
                className={`px-2 py-1 rounded-full text-xs font-semibold transition ${
                  ri.isActive
                    ? "bg-status-paid text-status-paid-foreground"
                    : "bg-status-cancelled text-status-cancelled-foreground"
                }`}
              >
                {ri.isActive ? "Active" : "Paused"}
              </button>
            </td>
            <td className="px-4 py-3 text-right">
              <button
                onClick={() => onDelete(ri.id)}
                className="text-xs text-destructive hover:text-destructive/70 transition"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
