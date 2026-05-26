// components/shared/InvoiceDownloadButton.tsx
"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/invoice/InvoicePDF";
import type { Invoice } from "@/types/invoice";

export default function InvoiceDownloadButton({
  invoice,
}: {
  invoice: Invoice;
}) {
  return (
    <PDFDownloadLink
      document={<InvoicePDF invoice={invoice} />}
      fileName={`invoice-${invoice.number}.pdf`}
    >
      {({ loading }) => (
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground">
          {loading ? "Preparing PDF..." : "Download PDF"}
        </button>
      )}
    </PDFDownloadLink>
  );
}
