"use client";

import { ArrowUpDown } from "lucide-react";
import { InvoiceStatus, InvoiceSortOrder } from "@/types/invoice";
import SearchBar from "@/components/ui/SearchBar";
import DateRangeFilter, { DateRange } from "@/components/ui/DateRangeFilter";

const STATUS_TABS: {
  label: string;
  value: InvoiceStatus | "ALL";
  dot?: string;
}[] = [
  { label: "All", value: "ALL" },
  {
    label: "Pending",
    value: "PENDING",
    dot: "bg-status-pending-foreground",
  },
  {
    label: "Overdue",
    value: "OVERDUE",
    dot: "bg-status-overdue-foreground",
  },
  { label: "Paid", value: "PAID", dot: "bg-status-paid-foreground" },
  {
    label: "Draft",
    value: "DRAFT",
    dot: "bg-status-draft-foreground/60",
  },
  {
    label: "Cancelled",
    value: "CANCELLED",
    dot: "bg-status-cancelled-foreground/50",
  },
];

interface Props {
  search: string;
  status: InvoiceStatus | "ALL";
  dateRange: DateRange;
  sortOrder: InvoiceSortOrder;
  onSearch: (v: string) => void;
  onStatusChange: (v: InvoiceStatus | "ALL") => void;
  onDateRange: (v: DateRange) => void;
  onSortChange: (v: InvoiceSortOrder) => void;
  totalCount: number;
  filteredCount: number;
}

export default function InvoiceFilters({
  search,
  status,
  dateRange,
  sortOrder,
  onSearch,
  onStatusChange,
  onDateRange,
  onSortChange,
  totalCount,
  filteredCount,
}: Props) {
  return (
    <div className="space-y-3">
      {/* Search + Date range */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={onSearch}
          placeholder="Search by invoice number or client name…"
          className="flex-1"
        />
        <DateRangeFilter value={dateRange} onChange={onDateRange} />
      </div>

      {/* Status tabs + result count + sort */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl w-fit border border-border/50 overflow-x-auto hide-scrollbar">
          {STATUS_TABS.map((tab) => {
            const isActive = status === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => onStatusChange(tab.value)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "bg-card text-foreground shadow-sm ring-1 ring-border/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                {tab.dot && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${tab.dot} ${
                      isActive ? "opacity-100" : "opacity-50"
                    }`}
                  />
                )}
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <p className="text-xs text-muted-foreground">
            {filteredCount === totalCount
              ? `${totalCount} invoice${totalCount !== 1 ? "s" : ""}`
              : `${filteredCount} of ${totalCount} invoices`}
          </p>

          {/* Sort toggle */}
          <button
            onClick={() =>
              onSortChange(sortOrder === "newest" ? "oldest" : "newest")
            }
            className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-150"
            title={
              sortOrder === "newest" ? "Sorted: Newest first" : "Sorted: Oldest first"
            }
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {sortOrder === "newest" ? "Newest" : "Oldest"}
          </button>
        </div>
      </div>
    </div>
  );
}
