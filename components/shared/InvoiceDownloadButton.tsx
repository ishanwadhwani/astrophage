"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
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
              <Download className="w-4 h-4" />
              Download PDF
            </>
          )}
        </button>
      )}
    </PDFDownloadLink>
  );
}
