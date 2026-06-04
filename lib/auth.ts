import { axiosInstance } from "./axiosInstance";
import {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  BusinessSummary,
  User,
} from "@/types/auth";

export const registerUser = async (
  payload: RegisterPayload,
): Promise<AuthResponse> => {
  const res = await axiosInstance.post<AuthResponse>(
    "/api/auth/register",
    payload,
  );
  return res.data;
};

export const loginUser = async (
  payload: LoginPayload,
): Promise<AuthResponse> => {
  const res = await axiosInstance.post<AuthResponse>(
    "/api/auth/login",
    payload,
  );
  return res.data;
};

export const saveAuth = (data: AuthResponse): void => {
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  document.cookie = `auth-token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
};

export const getUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
};

// currently active business
export const getCurrentBusiness = (): BusinessSummary | null => {
  return getUser()?.business ?? null;
};

// businesses the user owns
export const getAllBusinesses = (): BusinessSummary[] => {
  return getUser()?.businesses ?? [];
};

// Switch active business — updates localStorage, reloads page
export const switchBusiness = (business: BusinessSummary): void => {
  const user = getUser();
  if (!user) return;
  const updated = { ...user, business };
  localStorage.setItem("user", JSON.stringify(updated));
  window.location.href = "/dashboard";
};

export const logout = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  document.cookie = "auth-token=; path=/; max-age=0; SameSite=Strict";
  window.location.href = "/login";
};
