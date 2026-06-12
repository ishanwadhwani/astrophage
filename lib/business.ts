import { axiosInstance, invalidateCache } from "./axiosInstance";
import { Business, BankDetails } from "@/types/business";
import { BusinessSummary } from "@/types/auth";

export const fetchBusiness = async (id: string): Promise<Business> => {
  const res = await axiosInstance.get<Business>(`/api/businesses/${id}`);
  return res.data;
};

export const createBusiness = async (
  name: string,
): Promise<BusinessSummary> => {
  const res = await axiosInstance.post<BusinessSummary>("/api/businesses", {
    name,
  });
  return res.data;
};

export const updateBusiness = async (
  id: string,
  data: Partial<Business>,
): Promise<Business> => {
  const res = await axiosInstance.put<Business>(`/api/businesses/${id}`, data);
  invalidateCache(`/api/businesses/${id}`);
  return res.data;
};

export const deleteBusiness = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/businesses/${id}`);
};

export const saveBankDetails = async (
  businessId: string,
  data: Omit<BankDetails, "id">,
): Promise<BankDetails> => {
  const res = await axiosInstance.put<BankDetails>(
    `/api/businesses/${businessId}/bank-details`,
    data,
  );
  invalidateCache(`/api/businesses/${businessId}`);
  return res.data;
};

export const fetchNextInvoiceNumber = async (
  businessId: string,
): Promise<string> => {
  const res = await axiosInstance.get<{ number: string }>(
    `/api/businesses/${businessId}/next-number`,
  );
  return res.data.number;
};

export const updateInvoicePrefix = async (
  businessId: string,
  invoicePrefix: string,
): Promise<Business> => {
  const res = await axiosInstance.put<Business>(
    `/api/businesses/${businessId}/prefix`,
    { invoicePrefix },
  );
  invalidateCache(`/api/businesses/${businessId}`);
  return res.data;
};
