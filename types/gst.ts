export interface GSTInvoiceRow {
  id: string;
  number: string;
  invoiceDate: string;
  dueDate: string;
  gstFilingDate: string | null;
  clientName: string;
  clientGstin: string;
  clientState: string;
  taxType: "IGST" | "CGST_SGST";
  placeOfSupply: string;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  totalTax: number;
  total: number;
  paid: number;
  outstanding: number;
  status: string;
  filingStatus: "FILED" | "PENDING";
}

export interface GSTSummary {
  totalTaxableValue: number;
  totalIGST: number;
  totalCGST: number;
  totalSGST: number;
  totalTax: number;
  grandTotal: number;
}

export interface GSTReport {
  period: { from: string; to: string };
  summary: GSTSummary;
  invoices: GSTInvoiceRow[];
}
