"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

import DataTable, { TableColumn } from "@/components/shared/DataTable";
import { GSTReport, GSTInvoiceRow } from "@/types/gst";
import {
  fetchGSTReport,
  fetchVendorSpending,
  VendorSpendingReport,
  VendorSpendingRow,
} from "@/lib/reports";
import { getUser } from "@/lib/auth";
import { LoadingState } from "@/components/ui/LoadingState";
import { markInvoiceGSTFiled } from "@/lib/invoices";
import PermissionGate from "@/components/ui/PermissionGate";
import {
  Download,
  ArrowDownUp,
  ReceiptIndianRupee,
  Sheet,
  Calendar,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { EmptyCell } from "@/components/ui/EmptyCell";
import { exportToCSV } from "@/lib/csv";
import { Button } from "@/components/ui/Button";

type ReportType = "gst" | "vendor";

const fmt = (n: number) =>
  "₹" +
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const getPreset = (preset: string): { from: string; to: string } => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const iso = (d: Date) => d.toISOString().split("T")[0];

  switch (preset) {
    case "this_month":
      return {
        from: iso(new Date(year, month, 1)),
        to: iso(new Date(year, month + 1, 0)),
      };
    case "last_month":
      return {
        from: iso(new Date(year, month - 1, 1)),
        to: iso(new Date(year, month, 0)),
      };
    case "this_quarter": {
      const q = Math.floor(month / 3);
      return {
        from: iso(new Date(year, q * 3, 1)),
        to: iso(new Date(year, q * 3 + 3, 0)),
      };
    }
    case "this_fy": {
      // Indian FY: Apr–Mar
      const fyStart = month >= 3 ? year : year - 1;
      return {
        from: iso(new Date(fyStart, 3, 1)),
        to: iso(new Date(fyStart + 1, 2, 31)),
      };
    }
    default:
      return {
        from: iso(new Date(year, month, 1)),
        to: iso(now),
      };
  }
};

const PRESETS = [
  { label: "This Month", value: "this_month" },
  { label: "Last Month", value: "last_month" },
  { label: "This Quarter", value: "this_quarter" },
  { label: "This FY", value: "this_fy" },
];

// CSV Export
const exportCSV = (
  invoices: GSTInvoiceRow[],
  period: { from: string; to: string },
) => {
  const headers = [
    "Invoice No",
    "Invoice Date",
    "Client",
    "Client GSTIN",
    "Place of Supply",
    "Tax Type",
    "Taxable Value",
    "IGST",
    "CGST",
    "SGST",
    "Total Tax",
    "Total",
    "Status",
    "Filing Status",
    "GST Filing Date",
  ];

  const rows = invoices.map((inv) => [
    inv.number,
    fmtDate(inv.invoiceDate),
    inv.clientName,
    inv.clientGstin,
    inv.placeOfSupply,
    inv.taxType === "IGST" ? "IGST" : "CGST+SGST",
    inv.taxableValue.toFixed(2),
    inv.igst.toFixed(2),
    inv.cgst.toFixed(2),
    inv.sgst.toFixed(2),
    inv.totalTax.toFixed(2),
    inv.total.toFixed(2),
    inv.status,
    inv.filingStatus,
    inv.gstFilingDate ? fmtDate(inv.gstFilingDate) : "—",
  ]);

  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${c}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `GST-Report-${period.from}-to-${period.to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// CSV Vendor details export
const exportVendorCSV = (report: VendorSpendingReport) => {
  exportToCSV(
    "vendor-spending",
    ["Vendor", "GSTIN", "Bills", "Total Billed", "Paid", "Outstanding"],
    report.vendors.map((v) => [
      v.vendorName,
      v.gstin ?? "",
      v.billCount,
      v.totalBilled.toFixed(2),
      v.totalPaid.toFixed(2),
      v.outstanding.toFixed(2),
    ]),
  );
};

export default function ReportsPage() {
  const user = getUser();
  const businessId = user?.business?.id;

  const today = new Date().toISOString().split("T")[0];
  const initial = getPreset("this_month");

  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [preset, setPreset] = useState("this_month");
  const [report, setReport] = useState<GSTReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [filingFilter, setFilingFilter] = useState<"ALL" | "FILED" | "PENDING">(
    "ALL",
  );
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [reportType, setReportType] = useState<ReportType>("gst");
  const [vendorReport, setVendorReport] = useState<VendorSpendingReport | null>(
    null,
  );

  const handlePreset = (value: string) => {
    setPreset(value);
    const p = getPreset(value);
    setFrom(p.from);
    setTo(p.to);
  };

  const handleFetch = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      if (reportType === "gst") {
        const data = await fetchGSTReport(businessId, from, to);
        setReport(data);
      } else {
        const data = await fetchVendorSpending(businessId, from, to);
        setVendorReport(data);
      }
      setFetched(true);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!report) return [];
    return report.invoices
      .filter(
        (inv) => filingFilter === "ALL" || inv.filingStatus === filingFilter,
      )
      .sort((a, b) => {
        const dateA = new Date(a.invoiceDate).getTime();
        const dateB = new Date(b.invoiceDate).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
  }, [report, filingFilter, sortOrder]);

  const inputClass =
    "px-3 py-2 bg-card border border-input rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all";

  // VENDORS columns
  const vendorColumns = useMemo<TableColumn<VendorSpendingRow>[]>(
    () => [
      {
        key: "vendorName",
        header: "Vendor",
        render: (row) => (
          <Link
            href={`/vendors/${row.vendorId}`}
            className="font-semibold text-foreground hover:text-primary transition"
          >
            {row.vendorName}
          </Link>
        ),
      },
      {
        key: "gstin",
        header: "GSTIN",
        render: (row) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.gstin ?? <EmptyCell />}
          </span>
        ),
      },
      {
        key: "billCount",
        header: "Bills",
        align: "right",
        render: (row) => (
          <span className="text-muted-foreground tabular-nums">
            {row.billCount}
          </span>
        ),
      },
      {
        key: "totalBilled",
        header: "Total Billed",
        align: "right",
        render: (row) => (
          <span className="font-medium text-foreground tabular-nums">
            {fmt(row.totalBilled)}
          </span>
        ),
      },
      {
        key: "totalPaid",
        header: "Paid",
        align: "right",
        render: (row) => (
          <span className="text-status-paid-foreground tabular-nums">
            {fmt(row.totalPaid)}
          </span>
        ),
      },
      {
        key: "outstanding",
        header: "Outstanding",
        align: "right",
        render: (row) => (
          <span
            className={`font-semibold tabular-nums ${
              row.outstanding > 0
                ? "text-status-overdue-foreground"
                : "text-status-paid-foreground"
            }`}
          >
            {fmt(row.outstanding)}
          </span>
        ),
      },
    ],
    [],
  );

  // GST Columns
  const gstColumns = useMemo<TableColumn<GSTInvoiceRow>[]>(
    () => [
      {
        key: "number",
        header: "Invoice",
        render: (row) => (
          <Link
            href={`/invoices/${row.id}`}
            className="font-semibold text-foreground hover:text-primary transition"
          >
            #{row.number}
          </Link>
        ),
      },
      {
        key: "invoiceDate",
        header: "Date",
        render: (row) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {fmtDate(row.invoiceDate)}
          </span>
        ),
      },
      {
        key: "clientName",
        header: "Client",
        render: (row) => (
          <span className="text-muted-foreground">{row.clientName}</span>
        ),
      },
      {
        key: "clientGstin",
        header: "GSTIN",
        render: (row) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.clientGstin}
          </span>
        ),
      },
      {
        key: "taxType",
        header: "Tax Type",
        render: (row) => (
          <span
            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
              row.taxType === "IGST"
                ? "bg-blue-100 text-blue-700"
                : "bg-purple-100 text-purple-700"
            }`}
          >
            {row.taxType === "IGST" ? "IGST" : "CGST+SGST"}
          </span>
        ),
      },
      {
        key: "taxableValue",
        header: "Taxable",
        align: "right",
        render: (row) => (
          <span className="text-muted-foreground tabular-nums">
            {fmt(row.taxableValue)}
          </span>
        ),
      },
      {
        key: "igst",
        header: "IGST",
        align: "right",
        width: "108px",
        render: (row) => (
          <span
            className={`tabular-nums ${row.igst > 0 ? "text-muted-foreground" : "text-border"}`}
          >
            {row.igst > 0 ? fmt(row.igst) : <EmptyCell />}
          </span>
        ),
      },
      {
        key: "cgst",
        header: "CGST",
        align: "right",
        width: "108px",
        render: (row) => (
          <span
            className={`tabular-nums ${row.cgst > 0 ? "text-muted-foreground" : "text-border"}`}
          >
            {row.cgst > 0 ? fmt(row.cgst) : "—"}
          </span>
        ),
      },
      {
        key: "sgst",
        header: "SGST",
        align: "right",
        width: "108px",
        render: (row) => (
          <span
            className={`tabular-nums ${row.sgst > 0 ? "text-muted-foreground" : "text-border"}`}
          >
            {row.sgst > 0 ? fmt(row.sgst) : "—"}
          </span>
        ),
      },
      {
        key: "total",
        header: "Total",
        align: "right",
        render: (row) => (
          <span className="font-semibold text-foreground tabular-nums whitespace-nowrap">
            {fmt(row.total)}
          </span>
        ),
      },
      {
        key: "filing",
        header: "Filing",
        align: "center",
        width: "120px",
        render: (row) =>
          row.filingStatus === "FILED" ? (
            <div className="flex flex-col items-center gap-0.5">
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-status-paid text-status-paid-foreground">
                Filed
              </span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {fmtDate(row.gstFilingDate!)}
              </span>
            </div>
          ) : (
            <PermissionGate permission="report:gst_file">
              <button
                onClick={async () => {
                  try {
                    await markInvoiceGSTFiled(row.id);
                    setReport((prev) =>
                      prev
                        ? {
                            ...prev,
                            invoices: prev.invoices.map((i) =>
                              i.id === row.id
                                ? {
                                    ...i,
                                    filingStatus: "FILED" as const,
                                    gstFilingDate: new Date().toISOString(),
                                  }
                                : i,
                            ),
                          }
                        : prev,
                    );
                  } catch {}
                }}
                className="px-2 py-1 rounded-full text-xs font-semibold bg-status-pending text-status-pending-foreground hover:opacity-80 transition whitespace-nowrap cursor-pointer"
              >
                Mark Filed
              </button>
            </PermissionGate>
          ),
      },
    ],
    [setReport],
  );

  const handleReportTypeChange = (type: ReportType) => {
    setReportType(type);
    setFetched(false);
    setReport(null);
    setVendorReport(null);
  };

  return (
    <PermissionGate
      permission="report:view"
      fallback={
        <div className="text-center py-16 text-muted-foreground">
          You don&apos;t have access to reports.
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">GST Report</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Summary of all GST invoices for filing
          </p>
        </div>

        {/* tab switchers */}
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1 w-fit">
          <button
            onClick={() => handleReportTypeChange("gst")}
            className={`flex gap-2 items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              reportType === "gst"
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sheet />
            Invoice Report
          </button>
          <button
            onClick={() => handleReportTypeChange("vendor")}
            className={`flex gap-2 items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              reportType === "vendor"
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ReceiptIndianRupee />
            Vendor Bills
          </button>
        </div>

        {/* Filters */}
        <div className="bg-primary/80 border border-border rounded-2xl p-4 sm:p-5 shadow-sm space-y-5 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
          {/* Quick filters */}
          <div className="flex flex-col gap-2">
            <p className="ml-1 text-primary-foreground font-normal">
              Quick Filters
            </p>
            <div className="flex flex-wrap xl:flex-row items-center gap-2">
              {PRESETS.map((p) => {
                const isActive = preset === p.value;
                return (
                  <button
                    key={p.value}
                    onClick={() => handlePreset(p.value)}
                    // size="lg"
                    className={`flex items-center gap-2 px-6 py-3.5 text-sm rounded-xl font-semibold transition-all duration-200 shadow-sm border ${
                      isActive
                        ? "bg-muted text-primary shadow-muted/10"
                        : "bg-muted text-foreground hover:text-foreground/80 hover:bg-muted/90 border-transparent"
                    }`}
                  >
                    <Calendar
                      className={`w-3.5 h-3.5 ${isActive ? "text-primary" : "text-muted-foreground/70"}`}
                      strokeWidth={2.5}
                    />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date range selection */}
          <div className="flex flex-col gap-2">
            <p className="ml-1 text-primary-foreground font-normal">
              Date Filters
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 bg-muted/40 border border-border p-1.5 rounded-2xl w-full sm:w-auto justify-between sm:justify-start">
                <div className="relative flex items-center gap-2.5 px-3 py-1.5 bg-background border border-input/60 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-ring/20 focus-within:border-primary transition-all flex-1 sm:flex-initial">
                  <Calendar
                    className="w-4 h-4 text-muted-foreground shrink-0"
                    strokeWidth={2}
                  />
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-wider leading-tight">
                      From
                    </span>
                    <input
                      type="date"
                      value={from}
                      max={today}
                      onChange={(e) => {
                        setFrom(e.target.value);
                        setPreset("");
                      }}
                      className="bg-transparent border-0 p-0 text-sm font-medium text-foreground outline-none h-6 w-full sm:w-24 cursor-pointer focus:ring-0 [color-scheme:light] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:opacity-0"
                    />
                  </div>
                </div>

                <ArrowRight
                  className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0"
                  strokeWidth={2.5}
                />

                <div className="relative flex items-center gap-2.5 px-3 py-1.5 bg-background border border-input/60 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-ring/20 focus-within:border-primary transition-all flex-1 sm:flex-initial">
                  <Calendar
                    className="w-4 h-4 text-muted-foreground/70 shrink-0"
                    strokeWidth={2}
                  />
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-wider leading-tight">
                      To
                    </span>
                    <input
                      type="date"
                      value={to}
                      max={today}
                      onChange={(e) => {
                        setTo(e.target.value);
                        setPreset("");
                      }}
                      className="bg-transparent border-0 p-0 text-sm font-medium text-foreground outline-none h-6 w-full sm:w-24 cursor-pointer focus:ring-0 [color-scheme:light] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:opacity-0"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleFetch}
                disabled={!from || !to}
                loading={loading}
                size="lg"
                variant="custom"
                className="disabled:opacity-50 active:scale-[0.98] cursor-pointer"
              >
                {loading ? "Generating..." : "Generate Report"}
              </Button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && <LoadingState page="default" />}

        {/* GST Report Results */}
        {!loading && fetched && reportType === "gst" && report && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  label: "Taxable Value",
                  value: fmt(report.summary.totalTaxableValue),
                },
                { label: "Total IGST", value: fmt(report.summary.totalIGST) },
                { label: "Total CGST", value: fmt(report.summary.totalCGST) },
                { label: "Total SGST", value: fmt(report.summary.totalSGST) },
                { label: "Total Tax", value: fmt(report.summary.totalTax) },
                { label: "Grand Total", value: fmt(report.summary.grandTotal) },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-card border border-border rounded-2xl p-5"
                >
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {s.label}
                  </p>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Table header with actions */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
                {(["ALL", "PENDING", "FILED"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilingFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filingFilter === f
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f === "ALL"
                      ? `All (${report.invoices.length})`
                      : f === "PENDING"
                        ? `Unfiled (${report.invoices.filter((i) => i.filingStatus === "PENDING").length})`
                        : `Filed (${report.invoices.filter((i) => i.filingStatus === "FILED").length})`}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setSortOrder((s) => (s === "desc" ? "asc" : "desc"))
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground transition"
                >
                  <ArrowDownUp className="w-4 h-4" />
                  {sortOrder === "desc" ? "Newest first" : "Oldest first"}
                </button>
              </div>
              <PermissionGate permission="report:export">
                <button
                  onClick={() => exportCSV(filtered, report.period)}
                  className="flex items-center gap-2 px-4 py-2 border border-border text-sm font-semibold rounded-lg text-muted-foreground hover:bg-muted transition-all"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </PermissionGate>
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground text-sm">
                  No invoices match this filter.
                </div>
              ) : (
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <DataTable
                    columns={gstColumns}
                    data={filtered}
                    keyExtractor={(row) => row.id}
                    emptyText="No invoices match this filter."
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* Vendor Results */}
        {!loading && fetched && reportType === "vendor" && vendorReport && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Total Spent
                </p>
                <p className="text-xl font-bold text-foreground">
                  {fmt(vendorReport.summary.totalSpent)}
                </p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Total Paid
                </p>
                <p className="text-xl font-bold text-status-paid-foreground">
                  {fmt(vendorReport.summary.totalPaid)}
                </p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Outstanding
                </p>
                <p
                  className={`text-xl font-bold ${
                    vendorReport.summary.totalOutstanding > 0
                      ? "text-status-overdue-foreground"
                      : "text-foreground"
                  }`}
                >
                  {fmt(vendorReport.summary.totalOutstanding)}
                </p>
              </div>
            </div>

            {/* Export action */}
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {vendorReport.vendors.length} vendor
                {vendorReport.vendors.length !== 1 ? "s" : ""} with activity in
                this period
              </p>
              <button
                onClick={() => exportVendorCSV(vendorReport)}
                disabled={vendorReport.vendors.length === 0}
                className="flex items-center gap-2 px-4 py-2 border border-border text-sm font-semibold rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40 transition-all"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <DataTable
                columns={vendorColumns}
                data={vendorReport.vendors}
                keyExtractor={(v) => v.vendorId}
                emptyText="No vendor spending in this period."
              />
            </div>
          </>
        )}

        {/* Empty state before first fetch */}
        {!loading && !fetched && (
          <div className="bg-card border border-border rounded-2xl text-center py-16">
            <p className="text-muted-foreground text-sm mb-1">
              Select a date range and generate the report
            </p>
            <p className="text-xs text-muted-foreground">
              {reportType === "gst"
                ? "Only invoices marked as GST invoices will appear here"
                : "Shows spending grouped by vendor for the selected period"}
            </p>
          </div>
        )}
      </div>
    </PermissionGate>
  );
}
