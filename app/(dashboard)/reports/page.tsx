"use client";

import { useEffect, useState, useMemo } from "react";
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
  Download, ArrowDownUp, ReceiptIndianRupee, Sheet,
  BadgeCheck, TrendingDown,
  AlertCircle, Receipt, Percent, Calculator,
  IndianRupee, FileBarChart, ChevronRight,
} from "lucide-react";
import { EmptyCell } from "@/components/ui/EmptyCell";
import { exportToCSV } from "@/lib/csv";
import DateRangeFilter, { DateRange } from "@/components/ui/DateRangeFilter";

type ReportType = "gst" | "vendor";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const getThisMonth = (): DateRange => {
  const now = new Date();
  const iso = (d: Date) => d.toISOString().split("T")[0];
  return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(new Date(now.getFullYear(), now.getMonth() + 1, 0)) };
};

// ── CSV exports ───────────────────────────────────────────────────────────────

const exportCSV = (invoices: GSTInvoiceRow[], period: { from: string; to: string }) => {
  const headers = [
    "Invoice No","Invoice Date","Client","Client GSTIN","Place of Supply",
    "Tax Type","Taxable Value","IGST","CGST","SGST","Total Tax","Total",
    "Status","Filing Status","GST Filing Date",
  ];
  const rows = invoices.map((inv) => [
    inv.number, fmtDate(inv.invoiceDate), inv.clientName, inv.clientGstin,
    inv.placeOfSupply, inv.taxType === "IGST" ? "IGST" : "CGST+SGST",
    inv.taxableValue.toFixed(2), inv.igst.toFixed(2), inv.cgst.toFixed(2),
    inv.sgst.toFixed(2), inv.totalTax.toFixed(2), inv.total.toFixed(2),
    inv.status, inv.filingStatus, inv.gstFilingDate ? fmtDate(inv.gstFilingDate) : "",
  ]);
  const csv  = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `GST-Report-${period.from}-to-${period.to}.csv`; a.click();
  URL.revokeObjectURL(url);
};

const exportVendorCSV = (report: VendorSpendingReport) => {
  exportToCSV(
    "vendor-spending",
    ["Vendor","GSTIN","Bills","Total Billed","Paid","Outstanding"],
    report.vendors.map((v) => [
      v.vendorName, v.gstin ?? "", v.billCount,
      v.totalBilled.toFixed(2), v.totalPaid.toFixed(2), v.outstanding.toFixed(2),
    ]),
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, iconBg, iconColor, delay, mounted,
}: {
  label: string; value: string;
  icon: React.ElementType; iconBg: string; iconColor: string;
  delay: number; mounted: boolean;
}) {
  return (
    <div
      className={`bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/5 ${
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
      style={{ transitionDelay: mounted ? `${delay}ms` : "0ms" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        </div>
      </div>
      <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const user       = getUser();
  const businessId = user?.business?.id;

  const [dateRange,     setDateRange]     = useState<DateRange>(getThisMonth());
  const [report,        setReport]        = useState<GSTReport | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [fetched,       setFetched]       = useState(false);
  const [filingFilter,  setFilingFilter]  = useState<"ALL" | "FILED" | "PENDING">("ALL");
  const [sortOrder,     setSortOrder]     = useState<"desc" | "asc">("desc");
  const [reportType,    setReportType]    = useState<ReportType>("gst");
  const [vendorReport,  setVendorReport]  = useState<VendorSpendingReport | null>(null);
  const [mounted,       setMounted]       = useState(false);

  useEffect(() => {
    if (fetched) {
      setMounted(false);
      const id = setTimeout(() => setMounted(true), 60);
      return () => clearTimeout(id);
    }
  }, [fetched, reportType]);

  const handleFetch = async () => {
    if (!businessId) return;
    setLoading(true);
    setMounted(false);
    try {
      if (reportType === "gst") {
        const data = await fetchGSTReport(businessId, dateRange.from, dateRange.to);
        setReport(data);
      } else {
        const data = await fetchVendorSpending(businessId, dateRange.from, dateRange.to);
        setVendorReport(data);
      }
      setFetched(true);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleReportTypeChange = (type: ReportType) => {
    setReportType(type);
    setFetched(false);
    setMounted(false);
    setReport(null);
    setVendorReport(null);
  };

  const filtered = useMemo(() => {
    if (!report) return [];
    return report.invoices
      .filter((inv) => filingFilter === "ALL" || inv.filingStatus === filingFilter)
      .sort((a, b) => {
        const da = new Date(a.invoiceDate).getTime();
        const db = new Date(b.invoiceDate).getTime();
        return sortOrder === "desc" ? db - da : da - db;
      });
  }, [report, filingFilter, sortOrder]);

  // ── Table columns ───────────────────────────────────────────────────────────

  const vendorColumns = useMemo<TableColumn<VendorSpendingRow>[]>(() => [
    {
      key: "vendorName",
      header: "Vendor",
      render: (row) => (
        <Link href={`/vendors/${row.vendorId}`} className="font-semibold text-foreground hover:text-primary transition-colors">
          {row.vendorName}
        </Link>
      ),
    },
    {
      key: "gstin",
      header: "GSTIN",
      render: (row) =>
        row.gstin
          ? <span className="font-mono text-xs text-muted-foreground">{row.gstin}</span>
          : <EmptyCell />,
    },
    {
      key: "billCount",
      header: "Bills",
      align: "right",
      render: (row) => (
        <span className="inline-flex items-center justify-center min-w-6 px-2 py-0.5 rounded-md bg-muted text-xs font-semibold text-muted-foreground tabular-nums">
          {row.billCount}
        </span>
      ),
    },
    {
      key: "totalBilled",
      header: "Total Billed",
      align: "right",
      render: (row) => <span className="font-medium text-foreground tabular-nums">{fmt(row.totalBilled)}</span>,
    },
    {
      key: "totalPaid",
      header: "Paid",
      align: "right",
      render: (row) => <span className="text-chart-2 font-semibold tabular-nums">{fmt(row.totalPaid)}</span>,
    },
    {
      key: "outstanding",
      header: "Outstanding",
      align: "right",
      render: (row) => (
        <span className={`font-semibold tabular-nums ${row.outstanding > 0 ? "text-chart-3" : "text-chart-2"}`}>
          {fmt(row.outstanding)}
        </span>
      ),
    },
  ], []);

  const TaxTypeBadge = ({ taxType }: { taxType: string }) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
      taxType === "IGST"
        ? "bg-chart-1/10 text-chart-1 border-chart-1/20"
        : "bg-chart-3/10 text-chart-3 border-chart-3/20"
    }`}>
      {taxType === "IGST" ? "IGST" : "CGST+SGST"}
    </span>
  );

  const gstColumns = useMemo<TableColumn<GSTInvoiceRow>[]>(() => [
    {
      key: "number",
      header: "Invoice",
      render: (row) => (
        <Link href={`/invoices/${row.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
          #{row.number}
        </Link>
      ),
    },
    {
      key: "invoiceDate",
      header: "Date",
      render: (row) => <span className="text-muted-foreground whitespace-nowrap tabular-nums">{fmtDate(row.invoiceDate)}</span>,
    },
    {
      key: "clientName",
      header: "Client",
      render: (row) => <span className="text-foreground">{row.clientName}</span>,
    },
    {
      key: "clientGstin",
      header: "GSTIN",
      render: (row) =>
        row.clientGstin
          ? <span className="font-mono text-xs text-muted-foreground">{row.clientGstin}</span>
          : <EmptyCell />,
    },
    {
      key: "taxType",
      header: "Tax Type",
      render: (row) => <TaxTypeBadge taxType={row.taxType} />,
    },
    {
      key: "taxableValue",
      header: "Taxable",
      align: "right",
      render: (row) => <span className="text-muted-foreground tabular-nums">{fmt(row.taxableValue)}</span>,
    },
    {
      key: "igst",
      header: "IGST",
      align: "right",
      width: "108px",
      render: (row) =>
        row.igst > 0
          ? <span className="text-muted-foreground tabular-nums">{fmt(row.igst)}</span>
          : <EmptyCell />,
    },
    {
      key: "cgst",
      header: "CGST",
      align: "right",
      width: "108px",
      render: (row) =>
        row.cgst > 0
          ? <span className="text-muted-foreground tabular-nums">{fmt(row.cgst)}</span>
          : <EmptyCell />,
    },
    {
      key: "sgst",
      header: "SGST",
      align: "right",
      width: "108px",
      render: (row) =>
        row.sgst > 0
          ? <span className="text-muted-foreground tabular-nums">{fmt(row.sgst)}</span>
          : <EmptyCell />,
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      render: (row) => <span className="font-semibold text-foreground tabular-nums whitespace-nowrap">{fmt(row.total)}</span>,
    },
    {
      key: "filing",
      header: "Filing",
      align: "center",
      width: "130px",
      render: (row) =>
        row.filingStatus === "FILED" ? (
          <div className="flex flex-col items-center gap-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-status-paid text-status-paid-foreground border border-status-paid-foreground/20">
              <BadgeCheck className="w-3 h-3" />Filed
            </span>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap tabular-nums">
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
                    prev ? {
                      ...prev,
                      invoices: prev.invoices.map((i) =>
                        i.id === row.id
                          ? { ...i, filingStatus: "FILED" as const, gstFilingDate: new Date().toISOString() }
                          : i,
                      ),
                    } : prev,
                  );
                } catch {}
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-status-pending text-status-pending-foreground border border-status-pending-foreground/20 hover:opacity-80 transition-opacity whitespace-nowrap cursor-pointer"
            >
              Mark Filed
            </button>
          </PermissionGate>
        ),
    },
  ], [setReport]);

  // ── GST stat cards config ───────────────────────────────────────────────────

  const gstCards = report ? [
    { label: "Taxable Value", value: fmt(report.summary.totalTaxableValue), icon: Receipt,      iconBg: "bg-chart-1/10",  iconColor: "text-chart-1"  },
    { label: "Total IGST",    value: fmt(report.summary.totalIGST),         icon: Percent,      iconBg: "bg-chart-2/10",  iconColor: "text-chart-2"  },
    { label: "Total CGST",    value: fmt(report.summary.totalCGST),         icon: Percent,      iconBg: "bg-chart-3/10",  iconColor: "text-chart-3"  },
    { label: "Total SGST",    value: fmt(report.summary.totalSGST),         icon: Percent,      iconBg: "bg-chart-4/10",  iconColor: "text-chart-4"  },
    { label: "Total Tax",     value: fmt(report.summary.totalTax),          icon: Calculator,   iconBg: "bg-muted",       iconColor: "text-muted-foreground" },
    { label: "Grand Total",   value: fmt(report.summary.grandTotal),        icon: IndianRupee,  iconBg: "bg-primary/10",  iconColor: "text-primary"  },
  ] : [];

  const vendorCards = vendorReport ? [
    { label: "Total Spent",   value: fmt(vendorReport.summary.totalSpent),       icon: TrendingDown,  iconBg: "bg-chart-3/10", iconColor: "text-chart-3" },
    { label: "Total Paid",    value: fmt(vendorReport.summary.totalPaid),        icon: BadgeCheck,    iconBg: "bg-chart-2/10", iconColor: "text-chart-2" },
    { label: "Outstanding",   value: fmt(vendorReport.summary.totalOutstanding), icon: AlertCircle,
      iconBg: vendorReport.summary.totalOutstanding > 0 ? "bg-chart-4/10" : "bg-muted",
      iconColor: vendorReport.summary.totalOutstanding > 0 ? "text-chart-4" : "text-muted-foreground",
    },
  ] : [];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <PermissionGate
      permission="report:view"
      fallback={
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
            <FileBarChart className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">You don&apos;t have access to reports.</p>
        </div>
      }
    >
      <div className="space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {reportType === "gst"
                ? "GST invoice summary for filing and compliance"
                : "Vendor spending analysis by period"}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 bg-muted rounded-xl p-1 shrink-0">
            <button
              onClick={() => handleReportTypeChange("gst")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                reportType === "gst"
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sheet className="w-4 h-4" />
              Invoice Report
            </button>
            <button
              onClick={() => handleReportTypeChange("vendor")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                reportType === "vendor"
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ReceiptIndianRupee className="w-4 h-4" />
              Vendor Bills
            </button>
          </div>
        </div>

        {/* ── Filter bar ──────────────────────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <DateRangeFilter
            value={dateRange}
            onChange={setDateRange}
            showPresets
            compact
            className="flex-1"
          />
          <button
            onClick={handleFetch}
            disabled={!dateRange.from || !dateRange.to || loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-[0.98] shrink-0"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              : <ChevronRight className="w-4 h-4" />}
            {loading ? "Generating…" : "Generate Report"}
          </button>
        </div>

        {/* ── Loading ─────────────────────────────────────────────────────────── */}
        {loading && <LoadingState page="default" />}

        {/* ── GST Results ─────────────────────────────────────────────────────── */}
        {!loading && fetched && reportType === "gst" && report && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
              {gstCards.map((c, i) => (
                <StatCard key={c.label} {...c} delay={i * 50} mounted={mounted} />
              ))}
            </div>

            {/* Toolbar */}
            <div
              className={`flex flex-wrap items-center justify-between gap-3 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
              style={{ transitionDelay: "320ms" }}
            >
              <div className="flex flex-wrap items-center gap-2">
                {/* Filing filter */}
                <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
                  {(["ALL", "PENDING", "FILED"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilingFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
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
                </div>

                {/* Sort */}
                <button
                  onClick={() => setSortOrder((s) => (s === "desc" ? "asc" : "desc"))}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground transition-all duration-150"
                >
                  <ArrowDownUp className="w-3.5 h-3.5" />
                  {sortOrder === "desc" ? "Newest first" : "Oldest first"}
                </button>
              </div>

              <PermissionGate permission="report:export">
                <button
                  onClick={() => exportCSV(filtered, report.period)}
                  className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </PermissionGate>
            </div>

            {/* Table */}
            <div
              className={`bg-card border border-border rounded-2xl overflow-hidden transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
              style={{ transitionDelay: "370ms" }}
            >
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No invoices match this filter.</p>
                </div>
              ) : (
                <DataTable
                  columns={gstColumns}
                  data={filtered}
                  keyExtractor={(row) => row.id}
                  emptyText="No invoices match this filter."
                />
              )}
            </div>
          </>
        )}

        {/* ── Vendor Results ───────────────────────────────────────────────────── */}
        {!loading && fetched && reportType === "vendor" && vendorReport && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {vendorCards.map((c, i) => (
                <StatCard key={c.label} {...c} delay={i * 60} mounted={mounted} />
              ))}
            </div>

            {/* Toolbar */}
            <div
              className={`flex items-center justify-between gap-4 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
              style={{ transitionDelay: "200ms" }}
            >
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{vendorReport.vendors.length}</span>
                {" "}vendor{vendorReport.vendors.length !== 1 ? "s" : ""} with activity in this period
              </p>
              <PermissionGate permission="report:export">
                <button
                  onClick={() => exportVendorCSV(vendorReport)}
                  disabled={vendorReport.vendors.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </PermissionGate>
            </div>

            {/* Table */}
            <div
              className={`bg-card border border-border rounded-2xl overflow-hidden transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
              style={{ transitionDelay: "250ms" }}
            >
              <DataTable
                columns={vendorColumns}
                data={vendorReport.vendors}
                keyExtractor={(v) => v.vendorId}
                emptyText="No vendor spending in this period."
              />
            </div>
          </>
        )}

        {/* ── Pre-fetch empty state ────────────────────────────────────────────── */}
        {!loading && !fetched && (
          <div className="bg-card border border-border rounded-2xl flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <FileBarChart className="w-7 h-7 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Select a period and generate</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                {reportType === "gst"
                  ? "Only invoices marked as GST invoices will appear here"
                  : "Shows spending grouped by vendor for the selected period"}
              </p>
            </div>
          </div>
        )}

      </div>
    </PermissionGate>
  );
}
