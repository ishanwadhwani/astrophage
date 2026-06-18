import { axiosInstance, invalidateCache } from "./axiosInstance";
import {
  Invoice,
  InvoiceStatus,
  InvoiceSortOrder,
  InvoiceStats,
  PaginatedInvoicesResponse,
  CreateInvoicePayload,
  RecordPaymentPayload,
  RecurringInvoice,
  CreateRecurringInvoicePayload,
  RecurringInvoiceDetail,
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
  invalidateCache();
  return res.data;
};

export const updateInvoiceStatus = async (
  id: string,
  status: string,
): Promise<Invoice> => {
  const res = await axiosInstance.put<Invoice>(`/api/invoices/${id}`, {
    status,
  });
  invalidateCache();
  return res.data;
};

export const deleteInvoice = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/invoices/${id}`);
  invalidateCache();
};

export const fetchDeletedInvoices = async (businessId: string) => {
  const res = await axiosInstance.get(`/api/invoices/bin/list`, {
    params: { businessId },
  });
  return res.data;
};
export const restoreInvoice = async (id: string) => {
  await axiosInstance.put(`/api/invoices/bin/${id}/restore`);
};
export const permanentDeleteInvoice = async (id: string) => {
  await axiosInstance.delete(`/api/invoices/bin/${id}`);
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
  invalidateCache();
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
  invalidateCache("/api/invoices");
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
  invalidateCache();
  return res.data;
};

export const toggleRecurringInvoice = async (
  id: string,
): Promise<RecurringInvoice> => {
  const res = await axiosInstance.put<RecurringInvoice>(
    `/api/invoices/recurring/${id}`,
  );
  invalidateCache("/api/invoices");
  return res.data;
};

export const deleteRecurringInvoice = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/invoices/recurring/${id}`);
  invalidateCache("/api/invoices");
};

export const fetchRecurringInvoiceDetail = async (
  id: string,
  businessId: string,
): Promise<RecurringInvoiceDetail> => {
  const res = await axiosInstance.get<RecurringInvoiceDetail>(
    `/api/invoices/recurring/${id}/detail`,
    { params: { businessId } },
  );
  return res.data;
};

export const bulkDeleteInvoices = async (
  ids: string[],
  businessId: string,
): Promise<{ deleted: number }> => {
  const res = await axiosInstance.delete<{ deleted: number }>(
    "/api/invoices/bulk",
    { data: { ids, businessId } },
  );
  invalidateCache();
  return res.data;
};

export const fetchInvoiceStats = async (
  businessId: string,
): Promise<InvoiceStats> => {
  const res = await axiosInstance.get<InvoiceStats>("/api/invoices/stats", {
    params: { businessId },
  });
  return res.data;
};

export const fetchInvoicesPaginated = async (
  businessId: string,
  params: {
    page: number;
    pageSize: number;
    sort: InvoiceSortOrder;
    search?: string;
    status?: InvoiceStatus | "ALL";
    dateFrom?: string;
    dateTo?: string;
  },
): Promise<PaginatedInvoicesResponse> => {
  const query: Record<string, unknown> = {
    businessId,
    page: params.page,
    pageSize: params.pageSize,
    sort: params.sort,
  };
  if (params.search) query.search = params.search;
  if (params.status && params.status !== "ALL") query.status = params.status;
  if (params.dateFrom) query.dateFrom = params.dateFrom;
  if (params.dateTo) query.dateTo = params.dateTo;

  const res = await axiosInstance.get<PaginatedInvoicesResponse>(
    "/api/invoices",
    { params: query },
  );
  return res.data;
};
