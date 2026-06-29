import { axiosInstance } from "./axiosInstance";

export interface ExtractedBill {
  vendorName: string | null;
  vendorGstin: string | null;
  billNumber: string | null;
  description: string | null;
  taxableAmount: number | null;
  gstRate: number | null;
  gstAmount: number | null;
  total: number | null;
  billDate: string | null;
  dueDate: string | null;
  isForeign: boolean;
  currency: string | null;
}

export const extractBillFromFile = async (
  file: File,
): Promise<ExtractedBill> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axiosInstance.post<{ extracted: ExtractedBill }>(
    "/api/extract/bill",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data.extracted;
};
