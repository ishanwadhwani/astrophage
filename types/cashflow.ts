export interface CashflowInvoice {
  id: string;
  number: string;
  clientName: string;
  outstanding: number;
  status: string;
}

export interface CashflowBill {
  id: string;
  vendorName: string;
  description: string;
  outstanding: number;
  status: string;
}

export interface CashflowDay {
  date: string;
  expectedIn: number;
  expectedOut: number;
  invoices: CashflowInvoice[];
  bills: CashflowBill[];
}

export interface CashflowSummary {
  totalExpectedIn: number;
  totalExpectedOut: number;
  overdueAmount: number;
  overduePayables: number;
  largestSingleDay: number;
  daysWithCash: number;
}

export interface CashflowData {
  timeline: CashflowDay[];
  summary: CashflowSummary;
}
