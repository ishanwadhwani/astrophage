"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { VendorSpendingReport, VendorSpendingRow } from "@/lib/reports";
import DataTable, { TableColumn } from "@/components/shared/DataTable";
import { EmptyCell } from "@/components/ui/EmptyCell";
import PermissionGate from "@/components/ui/PermissionGate";
import { exportToCSV } from "@/lib/csv";
import { Download, TrendingDown, BadgeCheck, AlertCircle } from "lucide-react";
import StatCard from "./StatCard";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  "₹" +
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  report: VendorSpendingReport;
}

export default function VendorTab({ report }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const vendorCards = [
    {
      label: "Total Spent",
      value: fmt(report.summary.totalSpent),
      icon: TrendingDown,
      iconBg: "bg-chart-3/10",
      iconColor: "text-chart-3",
    },
    {
      label: "Total Paid",
      value: fmt(report.summary.totalPaid),
      icon: BadgeCheck,
      iconBg: "bg-chart-2/10",
      iconColor: "text-chart-2",
    },
    {
      label: "Outstanding",
      value: fmt(report.summary.totalOutstanding),
      icon: AlertCircle,
      iconBg:
        report.summary.totalOutstanding > 0 ? "bg-chart-4/10" : "bg-muted",
      iconColor:
        report.summary.totalOutstanding > 0
          ? "text-chart-4"
          : "text-muted-foreground",
    },
  ];

  const columns = useMemo<TableColumn<VendorSpendingRow>[]>(
    () => [
      {
        key: "vendorName",
        header: "Vendor",
        render: (row) => (
          <Link
            href={`/vendors/${row.vendorId}`}
            className="font-semibold text-foreground hover:text-primary transition-colors"
          >
            {row.vendorName}
          </Link>
        ),
      },
      {
        key: "gstin",
        header: "GSTIN",
        render: (row) =>
          row.gstin ? (
            <span className="font-mono text-xs text-muted-foreground">
              {row.gstin}
            </span>
          ) : (
            <EmptyCell />
          ),
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
          <span className="text-chart-2 font-semibold tabular-nums">
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
              row.outstanding > 0 ? "text-chart-3" : "text-chart-2"
            }`}
          >
            {fmt(row.outstanding)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {vendorCards.map((c, i) => (
          <StatCard key={c.label} {...c} delay={i * 60} mounted={mounted} />
        ))}
      </div>

      {/* Toolbar */}
      <div
        className={`flex items-center justify-between gap-4 transition-all duration-500 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
        style={{ transitionDelay: "200ms" }}
      >
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {report.vendors.length}
          </span>{" "}
          vendor{report.vendors.length !== 1 ? "s" : ""} with activity in this
          period
        </p>

        <PermissionGate permission="report:export">
          <button
            onClick={() =>
              exportToCSV(
                "vendor-spending",
                [
                  "Vendor",
                  "GSTIN",
                  "Bills",
                  "Total Billed",
                  "Paid",
                  "Outstanding",
                ],
                report.vendors.map((v) => [
                  v.vendorName,
                  v.gstin ?? "",
                  v.billCount,
                  v.totalBilled.toFixed(2),
                  v.totalPaid.toFixed(2),
                  v.outstanding.toFixed(2),
                ]),
              )
            }
            disabled={report.vendors.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-all"
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
        style={{ transitionDelay: "250ms" }}
      >
        <DataTable
          columns={columns}
          data={report.vendors}
          keyExtractor={(v) => v.vendorId}
          emptyText="No vendor spending in this period."
        />
      </div>
    </>
  );
}
