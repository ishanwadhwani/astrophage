import { axiosInstance } from "./axiosInstance";
import { NotificationResponse } from "@/types/notification";

export const fetchNotifications = async (
  businessId: string,
): Promise<NotificationResponse> => {
  const res = await axiosInstance.get<NotificationResponse>(
    `/api/notifications/${businessId}`,
  );
  return res.data;
};

export const markAllRead = async (businessId: string): Promise<void> => {
  await axiosInstance.put(`/api/notifications/${businessId}/read-all`);
};

export const markOneRead = async (id: string): Promise<void> => {
  await axiosInstance.put(`/api/notifications/read/${id}`);
};
