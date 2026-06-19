import { axiosInstance } from "./axiosInstance";
import { GSTReport } from "@/types/gst";
import {
  VendorSpendingRow,
  HealthReport,
  HsnRow,
  HsnSummaryReport,
} from "@/types/reports";

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

export const fetchHsnSummary = async (
  businessId: string,
  from: string,
  to: string,
): Promise<HsnSummaryReport> => {
  const res = await axiosInstance.get<HsnSummaryReport>(
    `/api/businesses/${businessId}/hsn-summary`,
    { params: { from, to } },
  );
  return res.data;
};
