import { axiosInstance } from "./axiosInstance";
import { Client, CreateClientPayload } from "@/types/client";

export const fetchClients = async (businessId: string): Promise<Client[]> => {
  const res = await axiosInstance.get<Client[]>("/api/clients", {
    params: { businessId },
  });
  return res.data;
};

export const createClient = async (
  payload: CreateClientPayload,
): Promise<Client> => {
  const res = await axiosInstance.post<Client>("/api/clients", payload);
  return res.data;
};

export const deleteClient = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/clients/${id}`);
};
