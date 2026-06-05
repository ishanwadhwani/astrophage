import { axiosInstance } from "./axiosInstance";
import {
  Invoice,
  CreateInvoicePayload,
  RecordPaymentPayload,
  RecurringInvoice,
  CreateRecurringInvoicePayload,
} from "@/types/invoice";

export const fetchInvoices = async (businessId: string): Promise<Invoice[]> => {
  const res = await axiosInstance.get<Invoice[]>("/api/invoices", {
    params: { businessId },
  });
  return res.data;
};

export const fetchInvoice = async (id: string): Promise<Invoice> => {
  const res = await axiosInstance.get<Invoice>(`/api/invoices/${id}`);
  return res.data;
};

export const createInvoice = async (
  payload: CreateInvoicePayload,
): Promise<Invoice> => {
  const res = await axiosInstance.post<Invoice>("/api/invoices", payload);
  return res.data;
};

export const updateInvoiceStatus = async (
  id: string,
  status: string,
): Promise<Invoice> => {
  const res = await axiosInstance.put<Invoice>(`/api/invoices/${id}`, {
    status,
  });
  return res.data;
};

export const deleteInvoice = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/invoices/${id}`);
};

export const recordPayment = async (
  payload: RecordPaymentPayload,
): Promise<{
  payment: Record<string, unknown>;
  invoiceStatus: string;
  totalPaid: number;
  outstanding: number;
}> => {
  const res = await axiosInstance.post("/api/payments", payload);
  return res.data;
};

export const emailInvoice = async (
  id: string,
  recipientEmail: string,
): Promise<void> => {
  await axiosInstance.post(`/api/invoices/${id}/email`, {
    recipientEmail,
  });
};

export const markInvoiceGSTFiled = async (id: string): Promise<void> => {
  await axiosInstance.put(`/api/invoices/${id}/mark-filed`);
};

export const fetchRecurringInvoices = async (
  businessId: string,
): Promise<RecurringInvoice[]> => {
  const res = await axiosInstance.get<RecurringInvoice[]>(
    "/api/invoices/recurring",
    { params: { businessId } },
  );
  return res.data;
};

export const createRecurringInvoice = async (
  payload: CreateRecurringInvoicePayload,
): Promise<RecurringInvoice> => {
  const res = await axiosInstance.post<RecurringInvoice>(
    "/api/invoices/recurring",
    payload,
  );
  return res.data;
};

export const toggleRecurringInvoice = async (
  id: string,
): Promise<RecurringInvoice> => {
  const res = await axiosInstance.put<RecurringInvoice>(
    `/api/invoices/recurring/${id}`,
  );
  return res.data;
};

export const deleteRecurringInvoice = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/invoices/recurring/${id}`);
};

export const bulkDeleteInvoices = async (
  ids: string[],
  businessId: string,
): Promise<{ deleted: number }> => {
  const res = await axiosInstance.delete<{ deleted: number }>(
    "/api/invoices/bulk",
    { data: { ids, businessId } },
  );
  return res.data;
};
