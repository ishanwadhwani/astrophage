export interface VendorSpendingRow {
  vendorId: string;
  vendorName: string;
  gstin: string | null;
  billCount: number;
  totalBilled: number;
  totalPaid: number;
  outstanding: number;
}

export interface HealthReport {
  period: { from: string; to: string };
  cashflow: { cashIn: number; cashOut: number; netCashflow: number };
  profitLoss: {
    totalBilled: number;
    taxableRevenue: number;
    gstCollected: number;
    totalExpenses: number;
    grossProfit: number;
    profitMargin: number;
  };
  position: {
    receivablesOutstanding: number;
    payablesOutstanding: number;
    netPosition: number;
  };
  topExpenses: { vendor: string; amount: number }[];
  monthlyTrend: {
    month: string;
    cashIn: number;
    cashOut: number;
    net: number;
  }[];
}

export interface HsnRow {
  hsnSac: string;
  description: string;
  unit: string;
  totalQty: number;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  totalTax: number;
  total: number;
}

export interface HsnSummaryReport {
  period: { from: string; to: string };
  rows: HsnRow[];
  summary: {
    totalTaxable: number;
    totalIgst: number;
    totalCgst: number;
    totalSgst: number;
    totalTax: number;
    grandTotal: number;
  };
  codeCount: number;
}
