import { axiosInstance, invalidateCache } from "./axiosInstance";
import { EmployeesResponse, Employee } from "@/types/employee";

export const fetchEmployees = async (
  businessId: string,
): Promise<EmployeesResponse> => {
  const res = await axiosInstance.get<EmployeesResponse>("/api/employees", {
    params: { businessId },
  });
  return res.data;
};

export const createEmployee = async (payload: {
  businessId: string;
  name: string;
  role?: string;
  monthlySalary: number;
  startDate: string;
  exitDate?: string | null;
  email?: string;
  phone?: string;
}): Promise<Employee> => {
  const res = await axiosInstance.post<Employee>("/api/employees", payload);
  invalidateCache();
  return res.data;
};

export const updateEmployee = async (
  id: string,
  payload: Partial<{
    name: string;
    role: string;
    monthlySalary: number;
    startDate: string;
    exitDate: string | null;
    email: string;
    phone: string;
  }>,
): Promise<Employee> => {
  const res = await axiosInstance.put<Employee>(
    `/api/employees/${id}`,
    payload,
  );
  invalidateCache();
  return res.data;
};

export const deleteEmployee = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/employees/${id}`);
  invalidateCache();
};
