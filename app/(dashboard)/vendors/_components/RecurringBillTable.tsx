import { RefreshCw, Trash2 } from "lucide-react";
import { RecurringBill } from "@/types/vendor";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });

const FREQ_BADGE: Record<
  string,
  { bg: string; text: string; border: string; label: string }
> = {
  WEEKLY: {
    bg: "bg-chart-5/10",
    text: "text-chart-5",
    border: "border-chart-5/20",
    label: "Weekly",
  },
  MONTHLY: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20",
    label: "Monthly",
  },
  QUARTERLY: {
    bg: "bg-chart-3/10",
    text: "text-chart-3",
    border: "border-chart-3/20",
    label: "Quarterly",
  },
  YEARLY: {
    bg: "bg-chart-4/10",
    text: "text-chart-4",
    border: "border-chart-4/20",
    label: "Yearly",
  },
};

function FrequencyBadge({ frequency }: { frequency: string }) {
  const cfg = FREQ_BADGE[frequency];
  if (!cfg)
    return (
      <span className="text-xs text-muted-foreground">
        {frequency.toLowerCase()}
      </span>
    );
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      {cfg.label}
    </span>
  );
}

function NextDueCell({
  dateStr,
  active = true,
}: {
  dateStr: string;
  active?: boolean;
}) {
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
  if (!active)
    return (
      <span className="text-muted-foreground whitespace-nowrap tabular-nums">
        {label}
      </span>
    );
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
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">
            No recurring bills
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Set up a recurring bill to auto-generate on a schedule
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
        <tbody className="divide-y divide-border/60">
          {items.map((rb) => (
            <tr
              key={rb.id}
              className="group hover:bg-muted/30 transition-colors duration-100"
            >
              {/* Description */}
              <td className="px-4 py-3 font-semibold text-foreground">
                {rb.description}
              </td>

              {/* Vendor */}
              <td className="px-4 py-3 text-muted-foreground">
                {rb.vendor.name}
              </td>

              {/* Amount */}
              <td className="px-4 py-3">
                <span className="font-semibold text-foreground tabular-nums">
                  {fmt(rb.amount)}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  /{" "}
                  {FREQ_BADGE[rb.frequency]?.label?.toLowerCase() ??
                    rb.frequency.toLowerCase()}
                </span>
              </td>

              {/* Frequency */}
              <td className="px-4 py-3">
                <FrequencyBadge frequency={rb.frequency} />
              </td>

              {/* Next Due */}
              <td className="px-4 py-3">
                <NextDueCell dateStr={rb.nextDueDate} active={rb.isActive} />
              </td>

              {/* Status toggle */}
              <td className="px-4 py-3">
                <button
                  onClick={() => onToggle(rb.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                    rb.isActive
                      ? "bg-status-paid text-status-paid-foreground border-status-paid-foreground/20 hover:opacity-80"
                      : "bg-status-draft text-status-draft-foreground border-status-draft-foreground/15 hover:opacity-80"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      rb.isActive
                        ? "bg-status-paid-foreground"
                        : "bg-status-draft-foreground/60"
                    }`}
                  />
                  {rb.isActive ? "Active" : "Paused"}
                </button>
              </td>

              {/* Actions */}
              <td className="px-4 py-3 text-right">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-end">
                  <button
                    onClick={() => onDelete(rb.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
