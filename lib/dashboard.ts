import { axiosInstance } from "./axiosInstance";
import { DashboardData, DashboardCharts } from "@/types/dashboard";

export const fetchDashboard = async (
  businessId: string,
): Promise<DashboardData> => {
  const res = await axiosInstance.get<DashboardData>(
    `/api/dashboard/${businessId}`,
  );
  return res.data;
};

export const fetchDashboardCharts = async (
  businessId: string,
): Promise<DashboardCharts> => {
  const res = await axiosInstance.get<DashboardCharts>(
    `/api/dashboard/${businessId}/charts`,
  );
  return res.data;
};
