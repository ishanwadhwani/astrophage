import { axiosInstance } from "./axiosInstance";
import { GSTReport } from "@/types/gst";

export const fetchGSTReport = async (
  businessId: string,
  from: string,
  to: string,
): Promise<GSTReport> => {
  const res = await axiosInstance.get<GSTReport>(
    `/api/businesses/${businessId}/gst-report`,
    { params: { from, to } },
  );
  return res.data;
};
