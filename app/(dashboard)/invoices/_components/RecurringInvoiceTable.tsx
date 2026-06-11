"use client";

import { RefreshCw, Trash2 } from "lucide-react";
import { RecurringInvoice } from "@/types/invoice";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });

// Frequency badge using the chart color palette
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
  const cfg = FREQ_BADGE[frequency] ?? {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
    label: frequency,
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      {cfg.label}
    </span>
  );
}

// Highlight dates that are today/overdue or coming within 7 days
function NextDueCell({ dateStr }: { dateStr: string }) {
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

  if (diffDays < 0) {
    return (
      <span className="flex items-center gap-1.5 text-status-overdue-foreground font-semibold whitespace-nowrap tabular-nums">
        {label}
        <span className="text-[9px] font-bold uppercase tracking-wide bg-status-overdue px-1.5 py-0.5 rounded">
          Overdue
        </span>
      </span>
    );
  }
  if (diffDays <= 7) {
    return (
      <span className="flex items-center gap-1.5 text-status-pending-foreground font-medium whitespace-nowrap tabular-nums">
        {label}
        <span className="text-[9px] font-bold uppercase tracking-wide bg-status-pending px-1.5 py-0.5 rounded">
          Soon
        </span>
      </span>
    );
  }
  return (
    <span className="text-muted-foreground whitespace-nowrap tabular-nums">
      {label}
    </span>
  );
}

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
      <div className="text-center py-20 px-6">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <RefreshCw className="w-7 h-7 text-muted-foreground/50" />
        </div>
        <p className="text-base font-semibold text-foreground mb-1.5">
          No recurring invoices yet
        </p>
        <p className="text-sm text-muted-foreground">
          Set up a recurring invoice to auto-generate them on a schedule
        </p>
      </div>
    );
  }

  const getTotal = (ri: RecurringInvoice) =>
    (ri.lineItems ?? []).reduce((s, item) => {
      const amount = item.quantity * item.rate;
      return s + amount + (amount * item.gstRate) / 100;
    }, 0);

  const COL_HEADERS = [
    "Description",
    "Client",
    "Amount",
    "Frequency",
    "Next Due",
    "",
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
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
          {items.map((ri) => {
            const total = getTotal(ri);
            const lineItems = ri.lineItems ?? [];
            const itemCount = lineItems.length;
            const firstDesc = lineItems[0]?.description ?? "—";

            return (
              <tr
                key={ri.id}
                className="group hover:bg-muted/30 transition-colors duration-100"
              >
                {/* Description */}
                <td className="px-4 py-3.5 max-w-48">
                  <p className="font-medium text-foreground truncate">
                    {firstDesc}
                  </p>
                  {itemCount > 1 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      +{itemCount - 1} more item{itemCount - 1 !== 1 ? "s" : ""}
                    </p>
                  )}
                </td>

                {/* Client */}
                <td className="px-4 py-3.5 text-muted-foreground max-w-36 truncate">
                  {ri.client.name}
                </td>

                {/* Amount */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span className="font-semibold text-foreground tabular-nums">
                    {fmt(total)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1.5">
                    /{" "}
                    {FREQ_BADGE[ri.frequency]?.label?.toLowerCase() ??
                      ri.frequency.toLowerCase()}
                  </span>
                </td>

                {/* Frequency */}
                <td className="px-4 py-3.5">
                  <FrequencyBadge frequency={ri.frequency} />
                </td>

                {/* Next due */}
                <td className="px-4 py-3.5">
                  <NextDueCell dateStr={ri.nextDueDate} />
                </td>

                {/* Delete */}
                <td className="px-4 py-3.5 text-right opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <button
                    onClick={() => onDelete(ri.id)}
                    title="Delete recurring invoice"
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
