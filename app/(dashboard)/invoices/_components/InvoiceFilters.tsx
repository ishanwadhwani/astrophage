"use client";

import { InvoiceStatus } from "@/types/invoice";
import { Search, X } from "lucide-react";

const STATUS_TABS: { label: string; value: InvoiceStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "Paid", value: "PAID" },
  { label: "Draft", value: "DRAFT" },
  { label: "Cancelled", value: "CANCELLED" },
];

interface DateRange {
  from: string;
  to: string;
}

interface Props {
  search: string;
  status: InvoiceStatus | "ALL";
  dateRange: DateRange;
  onSearch: (v: string) => void;
  onStatusChange: (v: InvoiceStatus | "ALL") => void;
  onDateRange: (v: DateRange) => void;
  onClearDate: () => void;
  totalCount: number;
  filteredCount: number;
}

export default function InvoiceFilters({
  search,
  status,
  dateRange,
  onSearch,
  onStatusChange,
  onDateRange,
  onClearDate,
  totalCount,
  filteredCount,
}: Props) {
  const hasDateFilter = dateRange.from || dateRange.to;

  const inputClass =
    "px-3 py-2 bg-card border border-input rounded-lg text-sm text-foreground outline-none focus:border-primary transition-all";

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by invoice number or client name..."
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-input rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
          />
          {search && (
            <button
              onClick={() => onSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
            >
              <X />
            </button>
          )}
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) =>
              onDateRange({ ...dateRange, from: e.target.value })
            }
            className={inputClass}
          />
          <span className="text-muted-foreground text-xs">to</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => onDateRange({ ...dateRange, to: e.target.value })}
            className={inputClass}
          />
          {hasDateFilter && (
            <button
              onClick={onClearDate}
              className="text-xs text-muted-foreground hover:text-foreground transition px-1"
            >
              <X />
            </button>
          )}
        </div>
      </div>

      {/* Status tabs + result count */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onStatusChange(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                status === tab.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground shrink-0">
          {filteredCount === totalCount
            ? `${totalCount} invoice${totalCount !== 1 ? "s" : ""}`
            : `${filteredCount} of ${totalCount} invoices`}
        </p>
      </div>
    </div>
  );
}
