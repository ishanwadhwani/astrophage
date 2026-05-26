import { axiosInstance } from "./axiosInstance";
import { AuthResponse, LoginPayload, RegisterPayload } from "@/types/auth";

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
  // cookie
  document.cookie = `auth-token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
};

export const getUser = () => {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const logout = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
};
