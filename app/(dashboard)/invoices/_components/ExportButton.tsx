"use client";

import { Invoice } from "@/types/invoice";
import { exportToCSV, fmtCSVDate, fmtCSVAmount } from "@/lib/csv";

interface Props {
  invoices: Invoice[];
  label?: string;
}

export default function InvoiceExportButton({
  invoices,
  label = "Export CSV",
}: Props) {
  const handleExport = () => {
    const headers = [
      "Invoice No",
      "Invoice Date",
      "Due Date",
      "Client",
      "Client GSTIN",
      "Place of Supply",
      "Tax Type",
      "Subtotal",
      "Tax",
      "Total",
      "Paid",
      "Outstanding",
      "Status",
    ];

    const rows = invoices.map((inv) => {
      const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
      const outstanding = inv.total - paid;
      return [
        inv.number,
        fmtCSVDate(inv.invoiceDate),
        fmtCSVDate(inv.dueDate),
        inv.client.name,
        inv.client.gstin ?? "",
        inv.placeOfSupply,
        inv.taxType === "IGST" ? "IGST" : "CGST+SGST",
        fmtCSVAmount(inv.subtotal),
        fmtCSVAmount(inv.totalTax),
        fmtCSVAmount(inv.total),
        fmtCSVAmount(paid),
        fmtCSVAmount(outstanding),
        inv.status,
      ];
    });

    exportToCSV("invoices", headers, rows);
  };

  return (
    <button
      onClick={handleExport}
      disabled={invoices.length === 0}
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
      {label} {invoices.length > 0 && `(${invoices.length})`}
    </button>
  );
}
