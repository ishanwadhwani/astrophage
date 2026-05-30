"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { GSTReport, GSTInvoiceRow } from "@/types/gst";
import { fetchGSTReport } from "@/lib/reports";
import { getUser } from "@/lib/auth";
import { LoadingState } from "@/components/ui/LoadingState";
import { markInvoiceGSTFiled } from "@/lib/invoices";

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
      const data = await fetchGSTReport(businessId, from, to);
      setReport(data);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">GST Report</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Summary of all GST invoices for filing
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePreset(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                preset === p.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              From
            </label>
            <input
              type="date"
              value={from}
              max={today}
              onChange={(e) => {
                setFrom(e.target.value);
                setPreset("");
              }}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              To
            </label>
            <input
              type="date"
              value={to}
              max={today}
              onChange={(e) => {
                setTo(e.target.value);
                setPreset("");
              }}
              className={inputClass}
            />
          </div>
          <button
            onClick={handleFetch}
            disabled={loading || !from || !to}
            className="px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && <LoadingState page="default" />}

      {/* Report */}
      {!loading && fetched && report && (
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
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline
                    points={
                      sortOrder === "desc"
                        ? "19,12 12,19 5,12"
                        : "5,12 12,5 19,12"
                    }
                  />
                </svg>
                {sortOrder === "desc" ? "Newest first" : "Oldest first"}
              </button>
            </div>

            <button
              onClick={() => exportCSV(filtered, report.period)}
              className="flex items-center gap-2 px-4 py-2 border border-border text-sm font-semibold rounded-lg text-muted-foreground hover:bg-muted transition-all"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </button>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                No invoices match this filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 border-b border-border">
                    <tr>
                      {[
                        "Invoice",
                        "Date",
                        "Client",
                        "GSTIN",
                        "Tax Type",
                        "Taxable",
                        "IGST",
                        "CGST",
                        "SGST",
                        "Total",
                        "Filing",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((inv) => (
                      <tr key={inv.id} className="hover:bg-muted/30 transition">
                        <td className="px-3 py-3 font-medium text-foreground whitespace-nowrap">
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="hover:text-primary transition"
                          >
                            #{inv.number}
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                          {fmtDate(inv.invoiceDate)}
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {inv.clientName}
                        </td>
                        <td className="px-3 py-3 text-muted-foreground font-mono text-xs">
                          {inv.clientGstin}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              inv.taxType === "IGST"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {inv.taxType === "IGST" ? "IGST" : "CGST+SGST"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right text-muted-foreground whitespace-nowrap">
                          {fmt(inv.taxableValue)}
                        </td>
                        <td className="px-3 py-3 text-right text-muted-foreground whitespace-nowrap">
                          {inv.igst > 0 ? fmt(inv.igst) : "—"}
                        </td>
                        <td className="px-3 py-3 text-right text-muted-foreground whitespace-nowrap">
                          {inv.cgst > 0 ? fmt(inv.cgst) : "—"}
                        </td>
                        <td className="px-3 py-3 text-right text-muted-foreground whitespace-nowrap">
                          {inv.sgst > 0 ? fmt(inv.sgst) : "—"}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-foreground whitespace-nowrap">
                          {fmt(inv.total)}
                        </td>
                        <td className="px-3 py-3">
                          {inv.filingStatus === "FILED" ? (
                            <div>
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-status-paid text-status-paid-foreground">
                                Filed
                              </span>
                              <p className="text-xs text-muted-foreground mt-1">
                                {fmtDate(inv.gstFilingDate!)}
                              </p>
                            </div>
                          ) : (
                            <button
                              onClick={async () => {
                                try {
                                  await markInvoiceGSTFiled(inv.id);
                                  // Update local state
                                  setReport((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          invoices: prev.invoices.map((i) =>
                                            i.id === inv.id
                                              ? {
                                                  ...i,
                                                  filingStatus:
                                                    "FILED" as const,
                                                  gstFilingDate:
                                                    new Date().toISOString(),
                                                }
                                              : i,
                                          ),
                                        }
                                      : prev,
                                  );
                                } catch {}
                              }}
                              className="px-2 py-1 rounded-full text-xs font-semibold bg-status-pending text-status-pending-foreground hover:opacity-80 transition"
                            >
                              Mark Filed
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
            Only invoices marked as GST invoices will appear here
          </p>
        </div>
      )}
    </div>
  );
}
