"use client";

import { InvoiceStatus } from "@/types/invoice";
import { Search, X, CalendarDays } from "lucide-react";

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
  {
    label: "Paid",
    value: "PAID",
    dot: "bg-status-paid-foreground",
  },
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

  return (
    <div className="space-y-3">
      {/* ── Search + Date range ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by invoice number or client name..."
            className="w-full pl-9 pr-9 py-2.5 bg-card border border-input rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
          />
          {search && (
            <button
              onClick={() => onSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Date range — themed unified container */}
        <div className="flex items-center bg-card border border-input rounded-xl overflow-hidden shrink-0 focus-within:ring-2 focus-within:ring-ring/30 focus-within:border-primary transition-all">
          <div className="flex items-center gap-2 px-3 py-2.5">
            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) =>
                onDateRange({ ...dateRange, from: e.target.value })
              }
              className="bg-transparent text-sm text-foreground outline-none w-28 cursor-pointer date-themed"
            />
          </div>

          <div className="w-px h-5 bg-border shrink-0" />

          <div className="flex items-center gap-2 px-3 py-2.5">
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) =>
                onDateRange({ ...dateRange, to: e.target.value })
              }
              className="bg-transparent text-sm text-foreground outline-none w-28 cursor-pointer date-themed"
            />
          </div>

          {hasDateFilter && (
            <>
              <div className="w-px h-5 bg-border shrink-0" />
              <button
                onClick={onClearDate}
                title="Clear date filter"
                className="px-2.5 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Status tabs + result count ─────────────────────────────── */}
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

        <p className="text-xs text-muted-foreground shrink-0">
          {filteredCount === totalCount
            ? `${totalCount} invoice${totalCount !== 1 ? "s" : ""}`
            : `${filteredCount} of ${totalCount} invoices`}
        </p>
      </div>
    </div>
  );
}
