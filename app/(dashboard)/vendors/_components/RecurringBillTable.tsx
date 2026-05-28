import { RecurringBill } from "@/types/vendor";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });

const FREQ_LABELS: Record<string, string> = {
  WEEKLY: "Every week",
  MONTHLY: "Every month",
  QUARTERLY: "Every quarter",
  YEARLY: "Every year",
};

interface Props {
  items: RecurringBill[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function RecurringBillTable({
  items,
  onToggle,
  onDelete,
}: Props) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        No recurring bills set up yet.
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead className="bg-muted/60 border-b border-border">
        <tr>
          {[
            "Description",
            "Vendor",
            "Amount",
            "Frequency",
            "Next Due",
            "Status",
          ].map((h) => (
            <th
              key={h}
              className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
            >
              {h}
            </th>
          ))}
          <th className="px-4 py-3" />
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {items.map((rb) => (
          <tr key={rb.id} className="hover:bg-muted/30 transition">
            <td className="px-4 py-3 font-medium text-foreground">
              {rb.description}
            </td>
            <td className="px-4 py-3 text-muted-foreground">
              {rb.vendor.name}
            </td>
            <td className="px-4 py-3 font-semibold text-foreground">
              {fmt(rb.amount)}
            </td>
            <td className="px-4 py-3 text-muted-foreground">
              {FREQ_LABELS[rb.frequency]}
            </td>
            <td className="px-4 py-3 text-muted-foreground">
              {new Date(rb.nextDueDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </td>
            <td className="px-4 py-3">
              <button
                onClick={() => onToggle(rb.id)}
                className={`px-2 py-1 rounded-full text-xs font-semibold transition ${
                  rb.isActive
                    ? "bg-status-paid text-status-paid-foreground"
                    : "bg-status-cancelled text-status-cancelled-foreground"
                }`}
              >
                {rb.isActive ? "Active" : "Paused"}
              </button>
            </td>
            <td className="px-4 py-3 text-right">
              <button
                onClick={() => onDelete(rb.id)}
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
