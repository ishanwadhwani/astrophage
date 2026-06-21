import { axiosInstance, invalidateCache } from "./axiosInstance";
import { ExpensesResponse, Expense, ExpenseCategory } from "@/types/expense";

export const fetchExpenses = async (
  businessId: string,
  from?: string,
  to?: string,
): Promise<ExpensesResponse> => {
  const res = await axiosInstance.get<ExpensesResponse>("/api/expenses", {
    params: { businessId, from, to },
  });
  return res.data;
};

export const createExpense = async (payload: {
  businessId: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  notes?: string;
  isRecurring?: boolean;
}): Promise<Expense> => {
  const res = await axiosInstance.post<Expense>("/api/expenses", payload);
  invalidateCache();
  return res.data;
};

export const updateExpense = async (
  id: string,
  payload: Partial<{
    title: string;
    category: ExpenseCategory;
    amount: number;
    expenseDate: string;
    notes: string;
    isRecurring: boolean;
  }>,
): Promise<Expense> => {
  const res = await axiosInstance.put<Expense>(`/api/expenses/${id}`, payload);
  invalidateCache();
  return res.data;
};

export const deleteExpense = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/expenses/${id}`);
  invalidateCache();
};
