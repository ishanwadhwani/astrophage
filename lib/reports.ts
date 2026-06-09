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
