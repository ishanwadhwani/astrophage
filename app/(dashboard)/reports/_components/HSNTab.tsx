"use client";

import { useMemo } from "react";
import DataTable, { TableColumn } from "@/components/shared/DataTable";
import { exportToCSV } from "@/lib/csv";
import { HsnRow, HsnSummaryReport } from "@/types/reports";
import { HelpCircle } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });

interface Props {
  report: HsnSummaryReport;
}

export default function HSNTab({ report }: Props) {
  const columns = useMemo<TableColumn<HsnRow>[]>(
    () => [
      {
        key: "hsnSac",
        header: "HSN/SAC",
        render: (r) => (
          <span className="font-mono font-semibold text-foreground">
            {r.hsnSac}
          </span>
        ),
      },
      {
        key: "description",
        header: "Description",
        render: (r) => (
          <span className="text-muted-foreground truncate">{r.description}</span>
        ),
      },
      {
        key: "totalQty",
        header: "Qty",
        align: "right",
        render: (r) => (
          <span className="tabular-nums">
            {r.totalQty} {r.unit}
          </span>
        ),
      },
      {
        key: "taxableValue",
        header: "Taxable",
        align: "right",
        render: (r) => (
          <span className="tabular-nums">{fmt(r.taxableValue)}</span>
        ),
      },
      {
        key: "igst",
        header: "IGST",
        align: "right",
        render: (r) => (
          <span className="tabular-nums text-muted-foreground">
            {r.igst > 0 ? fmt(r.igst) : "—"}
          </span>
        ),
      },
      {
        key: "cgst",
        header: "CGST",
        align: "right",
        render: (r) => (
          <span className="tabular-nums text-muted-foreground">
            {r.cgst > 0 ? fmt(r.cgst) : "—"}
          </span>
        ),
      },
      {
        key: "sgst",
        header: "SGST",
        align: "right",
        render: (r) => (
          <span className="tabular-nums text-muted-foreground">
            {r.sgst > 0 ? fmt(r.sgst) : "—"}
          </span>
        ),
      },
      {
        key: "total",
        header: "Total",
        align: "right",
        render: (r) => (
          <span className="font-semibold tabular-nums text-foreground">
            {fmt(r.total)}
          </span>
        ),
      },
    ],
    [],
  );

  const handleExport = () => {
    exportToCSV(
      "hsn-summary",
      [
        "HSN/SAC",
        "Description",
        "Qty",
        "Unit",
        "Taxable Value",
        "IGST",
        "CGST",
        "SGST",
        "Total Tax",
        "Total",
      ],
      report.rows.map((r) => [
        r.hsnSac,
        r.description,
        r.totalQty,
        r.unit,
        r.taxableValue.toFixed(2),
        r.igst.toFixed(2),
        r.cgst.toFixed(2),
        r.sgst.toFixed(2),
        r.totalTax.toFixed(2),
        r.total.toFixed(2),
      ]),
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Taxable Value
          </p>
          <p className="text-xl font-bold text-foreground">
            {fmt(report.summary.totalTaxable)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Total Tax
          </p>
          <p className="text-xl font-bold text-foreground">
            {fmt(report.summary.totalTax)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Grand Total
          </p>
          <p className="text-xl font-bold text-foreground">
            {fmt(report.summary.grandTotal)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-1.5 mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              HSN/SAC Codes
            </p>
            <Tooltip
              content="HSN (goods) / SAC (services) — government codes classifying what you sold, required on GST returns."
              side="top"
            >
              <HelpCircle className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-help" />
            </Tooltip>
          </div>
          <p className="text-xl font-bold text-foreground">
            {report.codeCount}
          </p>
        </div>
      </div>

      {/* Export */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {report.codeCount} code{report.codeCount !== 1 ? "s" : ""} in this
          period
        </p>
        <button
          onClick={handleExport}
          disabled={report.rows.length === 0}
          className="flex items-center gap-2 px-4 py-2 border border-border text-sm font-semibold rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40 transition-all"
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
        <DataTable
          columns={columns}
          data={report.rows}
          keyExtractor={(r) => r.hsnSac}
          emptyText="No GST invoices in this period to summarize."
        />
      </div>
    </div>
  );
}
