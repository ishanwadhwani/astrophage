import { Bill } from "@/types/vendor";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });

const getOutstanding = (bill: Bill) => {
  const paid = (bill.payments ?? []).reduce((s, p) => s + p.amount, 0);
  return bill.amount - paid;
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-status-pending text-status-pending-foreground",
  PAID: "bg-status-paid text-status-paid-foreground",
  OVERDUE: "bg-status-overdue text-status-overdue-foreground",
  CANCELLED: "bg-status-cancelled text-status-cancelled-foreground",
};

interface Props {
  bills: Bill[];
  onPay: (bill: Bill) => void;
  onDelete: (id: string) => void;
}

export default function BillTable({ bills, onPay, onDelete }: Props) {
  if (bills.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        No bills yet. Add your first bill.
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
            "Due Date",
            "Amount",
            "Outstanding",
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
        {bills.map((bill) => {
          const outstanding = getOutstanding(bill);
          return (
            <tr key={bill.id} className="hover:bg-muted/30 transition">
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">
                  {bill.description}
                </p>
                {bill.number && (
                  <p className="text-xs text-muted-foreground">
                    #{bill.number}
                  </p>
                )}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {bill.vendor.name}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(bill.dueDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="px-4 py-3 font-medium text-foreground">
                {fmt(bill.amount)}
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
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[bill.status]}`}
                >
                  {bill.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-3">
                  {bill.status !== "PAID" && bill.status !== "CANCELLED" && (
                    <button
                      onClick={() => onPay(bill)}
                      className="text-xs font-semibold text-primary hover:text-primary/80 transition"
                    >
                      Pay
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(bill.id)}
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
  );
}
