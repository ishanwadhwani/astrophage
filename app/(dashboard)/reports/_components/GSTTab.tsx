"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GSTReport, GSTInvoiceRow } from "@/types/gst";
import DataTable, { TableColumn } from "@/components/shared/DataTable";
import { EmptyCell } from "@/components/ui/EmptyCell";
import PermissionGate from "@/components/ui/PermissionGate";
import { markInvoiceGSTFiled } from "@/lib/invoices";
import {
  Download,
  ArrowDownUp,
  BadgeCheck,
  Receipt,
  Percent,
  Calculator,
  IndianRupee,
} from "lucide-react";
import StatCard from "./StatCard";

// Helpers

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
    inv.gstFilingDate ? fmtDate(inv.gstFilingDate) : "",
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

// Sub-components

function TaxTypeBadge({ taxType }: { taxType: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
        taxType === "IGST"
          ? "bg-chart-1/10 text-chart-1 border-chart-1/20"
          : "bg-chart-3/10 text-chart-3 border-chart-3/20"
      }`}
    >
      {taxType === "IGST" ? "IGST" : "CGST+SGST"}
    </span>
  );
}

// Component

interface Props {
  report: GSTReport;
  onMarkFiled: (invoiceId: string, date: string) => void;
}

export default function GSTTab({ report, onMarkFiled }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const [filingFilter, setFilingFilter] = useState<"ALL" | "FILED" | "PENDING">(
    "ALL",
  );
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const filtered = useMemo(() => {
    return report.invoices
      .filter(
        (inv) => filingFilter === "ALL" || inv.filingStatus === filingFilter,
      )
      .sort((a, b) => {
        const da = new Date(a.invoiceDate).getTime();
        const db = new Date(b.invoiceDate).getTime();
        return sortOrder === "desc" ? db - da : da - db;
      });
  }, [report, filingFilter, sortOrder]);

  const gstCards = [
    {
      label: "Taxable Value",
      value: fmt(report.summary.totalTaxableValue),
      icon: Receipt,
      iconBg: "bg-chart-1/10",
      iconColor: "text-chart-1",
    },
    {
      label: "Total IGST",
      value: fmt(report.summary.totalIGST),
      icon: Percent,
      iconBg: "bg-chart-2/10",
      iconColor: "text-chart-2",
    },
    {
      label: "Total CGST",
      value: fmt(report.summary.totalCGST),
      icon: Percent,
      iconBg: "bg-chart-3/10",
      iconColor: "text-chart-3",
    },
    {
      label: "Total SGST",
      value: fmt(report.summary.totalSGST),
      icon: Percent,
      iconBg: "bg-chart-4/10",
      iconColor: "text-chart-4",
    },
    {
      label: "Total Tax",
      value: fmt(report.summary.totalTax),
      icon: Calculator,
      iconBg: "bg-muted",
      iconColor: "text-muted-foreground",
    },
    {
      label: "Grand Total",
      value: fmt(report.summary.grandTotal),
      icon: IndianRupee,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
  ];

  const columns = useMemo<TableColumn<GSTInvoiceRow>[]>(
    () => [
      {
        key: "number",
        header: "Invoice",
        render: (row) => (
          <Link
            href={`/invoices/${row.id}`}
            className="font-semibold text-foreground hover:text-primary transition-colors"
          >
            #{row.number}
          </Link>
        ),
      },
      {
        key: "invoiceDate",
        header: "Date",
        render: (row) => (
          <span className="text-muted-foreground whitespace-nowrap tabular-nums">
            {fmtDate(row.invoiceDate)}
          </span>
        ),
      },
      {
        key: "clientName",
        header: "Client",
        render: (row) => (
          <span className="text-foreground">{row.clientName}</span>
        ),
      },
      {
        key: "clientGstin",
        header: "GSTIN",
        render: (row) =>
          row.clientGstin ? (
            <span className="font-mono text-xs text-muted-foreground">
              {row.clientGstin}
            </span>
          ) : (
            <EmptyCell />
          ),
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
        render: (row) =>
          row.igst > 0 ? (
            <span className="text-muted-foreground tabular-nums">
              {fmt(row.igst)}
            </span>
          ) : (
            <EmptyCell />
          ),
      },
      {
        key: "cgst",
        header: "CGST",
        align: "right",
        width: "108px",
        render: (row) =>
          row.cgst > 0 ? (
            <span className="text-muted-foreground tabular-nums">
              {fmt(row.cgst)}
            </span>
          ) : (
            <EmptyCell />
          ),
      },
      {
        key: "sgst",
        header: "SGST",
        align: "right",
        width: "108px",
        render: (row) =>
          row.sgst > 0 ? (
            <span className="text-muted-foreground tabular-nums">
              {fmt(row.sgst)}
            </span>
          ) : (
            <EmptyCell />
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
        width: "130px",
        render: (row) =>
          row.filingStatus === "FILED" ? (
            <div className="flex flex-col items-center gap-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-status-paid text-status-paid-foreground border border-status-paid-foreground/20">
                <BadgeCheck className="w-3 h-3" />
                Filed
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
                    onMarkFiled(row.id, new Date().toISOString());
                  } catch {}
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-status-pending text-status-pending-foreground border border-status-pending-foreground/20 hover:opacity-80 transition-opacity whitespace-nowrap cursor-pointer"
              >
                Mark Filed
              </button>
            </PermissionGate>
          ),
      },
    ],
    [onMarkFiled],
  );

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {gstCards.map((c, i) => (
          <StatCard key={c.label} {...c} delay={i * 50} mounted={mounted} />
        ))}
      </div>

      {/* Toolbar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 transition-all duration-500 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
        style={{ transitionDelay: "320ms" }}
      >
        <div className="flex flex-wrap items-center gap-2">
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
        className={`bg-card border border-border rounded-2xl overflow-hidden transition-all duration-500 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
        style={{ transitionDelay: "370ms" }}
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Receipt className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No invoices match this filter.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            keyExtractor={(row) => row.id}
            emptyText="No invoices match this filter."
          />
        )}
      </div>
    </>
  );
}
