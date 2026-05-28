import { axiosInstance } from "./axiosInstance";
import {
  Vendor,
  Bill,
  CreateVendorPayload,
  CreateBillPayload,
  RecordBillPaymentPayload,
  RecurringBill,
  CreateRecurringBillPayload,
} from "@/types/vendor";

export const fetchVendors = async (businessId: string): Promise<Vendor[]> => {
  const res = await axiosInstance.get<Vendor[]>("/api/vendors", {
    params: { businessId },
  });
  return res.data;
};

export const createVendor = async (
  payload: CreateVendorPayload,
): Promise<Vendor> => {
  const res = await axiosInstance.post<Vendor>("/api/vendors", payload);
  return res.data;
};

export const deleteVendor = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/vendors/${id}`);
};

export const fetchBills = async (businessId: string): Promise<Bill[]> => {
  const res = await axiosInstance.get<Bill[]>("/api/vendors/bills", {
    params: { businessId },
  });
  return res.data;
};

export const createBill = async (payload: CreateBillPayload): Promise<Bill> => {
  const res = await axiosInstance.post<Bill>("/api/vendors/bills", payload);
  return res.data;
};

export const recordBillPayment = async (
  payload: RecordBillPaymentPayload,
): Promise<{ payment: unknown; billStatus: string; outstanding: number }> => {
  const res = await axiosInstance.post("/api/vendors/bills/payments", payload);
  return res.data;
};

export const deleteBill = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/vendors/bills/${id}`);
};

export const fetchRecurringBills = async (
  businessId: string,
): Promise<RecurringBill[]> => {
  const res = await axiosInstance.get<RecurringBill[]>(
    "/api/vendors/recurring",
    { params: { businessId } },
  );
  return res.data;
};

export const createRecurringBill = async (
  payload: CreateRecurringBillPayload,
): Promise<RecurringBill> => {
  const res = await axiosInstance.post<RecurringBill>(
    "/api/vendors/recurring",
    payload,
  );
  return res.data;
};

export const toggleRecurringBill = async (
  id: string,
): Promise<RecurringBill> => {
  const res = await axiosInstance.put<RecurringBill>(
    `/api/vendors/recurring/${id}`,
  );
  return res.data;
};

export const deleteRecurringBill = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/vendors/recurring/${id}`);
};
