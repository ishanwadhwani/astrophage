export interface CashflowInvoice {
  id: string;
  number: string;
  clientName: string;
  outstanding: number;
  status: string;
}

export interface CashflowDay {
  date: string;
  expectedIn: number;
  invoices: CashflowInvoice[];
}

export interface CashflowSummary {
  totalExpectedIn: number;
  overdueAmount: number;
  largestSingleDay: number;
  daysWithCash: number;
}

export interface CashflowData {
  timeline: CashflowDay[];
  summary: CashflowSummary;
}