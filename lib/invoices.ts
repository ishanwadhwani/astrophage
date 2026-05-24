import { axiosInstance } from "./axiosInstance";
import {
  Invoice,
  CreateInvoicePayload,
  RecordPaymentPayload,
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
