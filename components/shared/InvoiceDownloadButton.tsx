"use client";

import { useState, useEffect } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/invoice/InvoicePDF";
import { generateUPIUrl, generateQRDataUrl } from "@/lib/upi";
import type { Invoice } from "@/types/invoice";

interface Props {
  invoice: Invoice;
  onQRReady?: (dataUrl: string) => void;
}

export default function InvoiceDownloadButton({ invoice, onQRReady }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!invoice.business.upiId) return;

    const generate = async () => {
      try {
        const upiUrl = generateUPIUrl(
          invoice.business.upiId!,
          invoice.business.name,
          invoice.total,
          invoice.number,
        );
        const dataUrl = await generateQRDataUrl(upiUrl);
        setQrDataUrl(dataUrl);
        onQRReady?.(dataUrl);
      } catch {}
    };

    void generate();
  }, [
    invoice.business.upiId,
    invoice.business.name,
    invoice.total,
    invoice.number,
    onQRReady,
  ]);

  return (
    <PDFDownloadLink
      document={<InvoicePDF invoice={invoice} qrDataUrl={qrDataUrl} />}
      fileName={`invoice-${invoice.number}.pdf`}
    >
      {({ loading }) => (
        <button
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Preparing...
            </>
          ) : (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download PDF
            </>
          )}
        </button>
      )}
    </PDFDownloadLink>
  );
}
