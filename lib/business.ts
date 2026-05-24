import { axiosInstance } from "./axiosInstance";
import { Business, BankDetails } from "@/types/business";

export const fetchBusiness = async (id: string): Promise<Business> => {
  const res = await axiosInstance.get<Business>(`/api/businesses/${id}`);
  return res.data;
};

export const updateBusiness = async (
  id: string,
  data: Partial<Business>
): Promise<Business> => {
  const res = await axiosInstance.put<Business>(`/api/businesses/${id}`, data);
  return res.data;
};

export const saveBankDetails = async (
  businessId: string,
  data: Omit<BankDetails, "id">
): Promise<BankDetails> => {
  const res = await axiosInstance.put<BankDetails>(
    `/api/businesses/${businessId}/bank-details`,
    data
  );
  return res.data;
};