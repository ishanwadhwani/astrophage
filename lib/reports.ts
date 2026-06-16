import { axiosInstance } from "./axiosInstance";
import { GSTReport } from "@/types/gst";

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

export const fetchGSTReport = async (
  businessId: string,
  from: string,
  to: string,
): Promise<GSTReport> => {
  const res = await axiosInstance.get<GSTReport>(
    `/api/businesses/${businessId}/gst-report`,
    { params: { from, to } },
  );
  return res.data;
};

export interface VendorSpendingReport {
  period: { from: string; to: string };
  summary: { totalSpent: number; totalPaid: number; totalOutstanding: number };
  vendors: VendorSpendingRow[];
}

export const fetchVendorSpending = async (
  businessId: string,
  from: string,
  to: string,
): Promise<VendorSpendingReport> => {
  const res = await axiosInstance.get<VendorSpendingReport>(
    `/api/businesses/${businessId}/vendor-spending`,
    { params: { from, to } },
  );
  return res.data;
};

export const fetchHealthReport = async (
  businessId: string,
  from: string,
  to: string,
): Promise<HealthReport> => {
  const res = await axiosInstance.get<HealthReport>(
    `/api/businesses/${businessId}/health-report`,
    { params: { from, to } },
  );
  return res.data;
};
