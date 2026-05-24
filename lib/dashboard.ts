import { axiosInstance } from "./axiosInstance";
import { DashboardData } from "@/types/dashboard";

export const fetchDashboard = async (
  businessId: string
): Promise<DashboardData> => {
  const res = await axiosInstance.get<DashboardData>(
    `/api/dashboard/${businessId}`
  );
  return res.data;
};