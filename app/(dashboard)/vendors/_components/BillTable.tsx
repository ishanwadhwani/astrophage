import { Receipt, Trash2, CreditCard } from "lucide-react";
import { Bill, BillStatus } from "@/types/vendor";
import PermissionGate from "@/components/ui/PermissionGate";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });

const statusConfig = {
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
  const cfg = statusConfig[status as keyof typeof statusConfig];
  if (!cfg) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function DueDateCell({
  dateStr,
  status,
}: {
  dateStr: string;
  status: BillStatus;
}) {
  if (status === "PAID" || status === "CANCELLED") {
    return (
      <span className="text-muted-foreground whitespace-nowrap tabular-nums">
        {new Date(dateStr).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </span>
    );
  }
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  const label = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  if (diffDays < 0)
    return (
      <span className="flex items-center gap-1.5 text-status-overdue-foreground font-semibold whitespace-nowrap tabular-nums">
        {label}
        <span className="text-[9px] font-bold uppercase tracking-wide bg-status-overdue px-1.5 py-0.5 rounded">
          Overdue
        </span>
      </span>
    );
  if (diffDays <= 7)
    return (
      <span className="flex items-center gap-1.5 text-status-pending-foreground font-medium whitespace-nowrap tabular-nums">
        {label}
        <span className="text-[9px] font-bold uppercase tracking-wide bg-status-pending px-1.5 py-0.5 rounded">
          Soon
        </span>
      </span>
    );
  return (
    <span className="text-muted-foreground whitespace-nowrap tabular-nums">
      {label}
    </span>
  );
}

interface Props {
  bills: Bill[];
  onPay: (bill: Bill) => void;
  onDelete: (id: string) => void;
}

export default function BillTable({ bills, onPay, onDelete }: Props) {
  if (bills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
          <Receipt className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">No bills</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add your first bill to track payables
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/40 border-b border-border">
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
        <tbody className="divide-y divide-border/60">
          {bills.map((bill) => {
            const paid = (bill.payments ?? []).reduce(
              (s, p) => s + p.amount,
              0,
            );
            const outstanding = bill.amount - paid;
            const paidPct =
              bill.amount > 0
                ? Math.min(100, (paid / bill.amount) * 100)
                : 0;

            return (
              <tr
                key={bill.id}
                className="group hover:bg-muted/30 transition-colors duration-100"
              >
                {/* Description + bill# */}
                <td className="px-4 py-3">
                  <p className="font-semibold text-foreground">
                    {bill.description}
                  </p>
                  {bill.number && (
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      #{bill.number}
                    </p>
                  )}
                </td>

                {/* Vendor */}
                <td className="px-4 py-3 text-muted-foreground">
                  {bill.vendor.name}
                </td>

                {/* Due Date */}
                <td className="px-4 py-3">
                  <DueDateCell dateStr={bill.dueDate} status={bill.status} />
                </td>

                {/* Amount + progress bar */}
                <td className="px-4 py-3">
                  <p className="font-semibold text-foreground tabular-nums">
                    {fmt(bill.amount)}
                  </p>
                  {paid > 0 && outstanding > 0 && (
                    <div className="mt-1.5 w-16 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-status-paid-foreground/70 rounded-full"
                        style={{ width: `${paidPct}%` }}
                      />
                    </div>
                  )}
                </td>

                {/* Outstanding */}
                <td className="px-4 py-3">
                  <span
                    className={
                      outstanding > 0
                        ? "text-status-overdue-foreground font-semibold tabular-nums"
                        : "text-status-paid-foreground font-semibold tabular-nums"
                    }
                  >
                    {fmt(outstanding)}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <StatusBadge status={bill.status} />
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-end gap-1">
                    {bill.status !== "PAID" && bill.status !== "CANCELLED" && (
                      <PermissionGate permission="bill:payment">
                        <button
                          onClick={() => onPay(bill)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Pay
                        </button>
                      </PermissionGate>
                    )}
                    <PermissionGate permission="bill:delete">
                      <button
                        onClick={() => onDelete(bill.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
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
