"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { GstSummary } from "@/lib/reports";
import { exportToCSV } from "@/lib/csv";
import PermissionGate from "@/components/ui/PermissionGate";

interface Props {
  report: GstSummary;
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${
        bold
          ? "font-semibold text-foreground pt-2 border-t border-border"
          : "text-muted-foreground"
      }`}
    >
      <span>{label}</span>
      <span className="tabular-nums">
        ₹{value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
      </span>
    </div>
  );
}

export default function GSTSummaryTab({ report }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const card = `transition-all duration-500 ${
    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
  }`;

  const isPayable = report.netPayable >= 0;

  const handleExport = () => {
    const rows: (string | number)[][] = [
      [
        "Output GST (Sales)",
        report.output.taxable.toFixed(2),
        report.output.igst.toFixed(2),
        report.output.cgst.toFixed(2),
        report.output.sgst.toFixed(2),
        report.output.total.toFixed(2),
      ],
      [
        "Input GST (Purchases)",
        report.input.taxable.toFixed(2),
        report.input.igst.toFixed(2),
        report.input.cgst.toFixed(2),
        report.input.sgst.toFixed(2),
        report.input.total.toFixed(2),
      ],
      [
        isPayable ? "Net Payable to Government" : "Net Credit (carry forward)",
        "",
        "",
        "",
        "",
        Math.abs(report.netPayable).toFixed(2),
      ],
    ];
    if (report.reverseChargeGst > 0) {
      rows.push([
        "Reverse Charge GST (included above)",
        "",
        "",
        "",
        "",
        report.reverseChargeGst.toFixed(2),
      ]);
    }
    exportToCSV(
      "gst-summary",
      ["Section", "Taxable", "IGST", "CGST", "SGST", "Total"],
      rows,
    );
  };

  return (
    <div className="space-y-4">
      {/* Period + export */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {report.period
            ? `${fmtDate(report.period.from)} – ${fmtDate(report.period.to)}`
            : "Summary for the selected period"}
        </p>
        <PermissionGate permission="report:export">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </PermissionGate>
      </div>

      {/* Headline — the number owners care about */}
      <div
        className={`rounded-2xl p-6 border ${card} ${
          isPayable
            ? "bg-status-pending/10 border-status-pending/30"
            : "bg-status-paid/10 border-status-paid/30"
        }`}
      >
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          {isPayable
            ? "GST Payable to Government"
            : "GST Credit (refundable / carry forward)"}
        </p>
        <p className="text-3xl font-bold text-foreground">
          ₹
          {Math.abs(report.netPayable).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Output GST ₹{report.output.total.toLocaleString("en-IN")} − Input
          GST ₹{report.input.total.toLocaleString("en-IN")}
        </p>
      </div>

      {/* Output vs Input breakdown */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${card}`}
        style={{ transitionDelay: mounted ? "80ms" : "0ms" }}
      >
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-3">
            Output GST (on sales)
          </h3>
          <div className="space-y-2 text-sm">
            <Row label="Taxable sales" value={report.output.taxable} />
            <Row label="IGST" value={report.output.igst} />
            <Row label="CGST" value={report.output.cgst} />
            <Row label="SGST" value={report.output.sgst} />
            <Row label="Total output GST" value={report.output.total} bold />
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-3">
            Input GST (claimable)
          </h3>
          <div className="space-y-2 text-sm">
            <Row label="Taxable purchases" value={report.input.taxable} />
            <Row label="IGST" value={report.input.igst} />
            <Row label="CGST" value={report.input.cgst} />
            <Row label="SGST" value={report.input.sgst} />
            <Row label="Total input credit" value={report.input.total} bold />
          </div>
        </div>
      </div>

      {report.reverseChargeGst > 0 && (
        <div
          className={`rounded-xl bg-muted/50 border border-border p-4 text-sm text-muted-foreground ${card}`}
          style={{ transitionDelay: mounted ? "160ms" : "0ms" }}
        >
          Includes ₹{report.reverseChargeGst.toLocaleString("en-IN")}{" "}
          reverse-charge GST on imports — both payable and claimable. Confirm
          RCM treatment with your CA.
        </div>
      )}
    </div>
  );
}
