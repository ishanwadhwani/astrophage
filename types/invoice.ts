import { Business, BankDetails } from "./business";

export type InvoiceStatus =
  | "DRAFT"
  | "PENDING"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";
export type TaxType = "IGST" | "CGST_SGST";
export type TemplateType = "BASE" | "CUSTOM";
export type PaymentMode = "CASH" | "UPI" | "BANK_TRANSFER" | "CARD";

export interface LineItem {
  id: string;
  description: string;
  hsnSac: string | null;
  quantity: number;
  rate: number;
  amount: number;
  gstRate: number;
  igst: number;
  cgst: number;
  sgst: number;
  total: number;
}

export interface LineItemInput {
  description: string;
  hsnSac?: string;
  quantity: number;
  rate: number;
  gstRate: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  mode: PaymentMode;
  referenceNumber: string | null;
  paymentDate: string;
  notes: string | null;
}

export interface Invoice {
  id: string;
  number: string;
  businessId: string;
  clientId: string;
  invoiceDate: string;
  dueDate: string;
  placeOfSupply: string;
  taxType: TaxType;
  status: InvoiceStatus;
  notes: string | null;
  subtotal: number;
  totalTax: number;
  total: number;
  isGstInvoice: boolean;
  gstFilingDate: string | null;
  templateType: TemplateType;
  lineItems: LineItem[];
  payments: Payment[];
  createdAt: string;

  business: Business & { bankDetails: BankDetails | null };
  client: {
    id: string;
    name: string;
    gstin?: string | null;
    pan?: string | null;
    address?: string | null;
    pincode?: number | null;
    city?: string | null;
    state?: string | null;
  };
}

export interface CreateInvoicePayload {
  number: string;
  clientId: string;
  businessId: string;
  dueDate: string;
  placeOfSupply: string;
  notes?: string;
  isGstInvoice: boolean;
  templateType?: TemplateType;
  lineItems: LineItemInput[];
}

export interface RecordPaymentPayload {
  invoiceId: string;
  amount: number;
  mode: PaymentMode;
  referenceNumber?: string;
  paymentDate?: string;
  notes?: string;
}
