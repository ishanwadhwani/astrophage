import { axiosInstance } from "./axiosInstance";
import { CashflowData } from "@/types/cashflow";

export const fetchCashflow = async (
  businessId: string,
  days: number = 30
): Promise<CashflowData> => {
  const res = await axiosInstance.get<CashflowData>(
    `/api/cashflow/${businessId}`,
    { params: { days } }
  );
  return res.data;
};