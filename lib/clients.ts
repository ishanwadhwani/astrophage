import { axiosInstance } from "./axiosInstance";
import { Client, CreateClientPayload, UpdateClientPayload } from "@/types/client";

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

export const updateClient = async (
  id: string,
  payload: UpdateClientPayload
): Promise<Client> => {
  const res = await axiosInstance.put<Client>(`/api/clients/${id}`, payload);
  return res.data;
};

export const deleteClient = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/clients/${id}`);
};
