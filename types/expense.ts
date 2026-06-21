export type ExpenseCategory =
  | "RENT"
  | "UTILITIES"
  | "SUPPLIES"
  | "MARKETING"
  | "TRAVEL"
  | "PROFESSIONAL_FEES"
  | "MAINTENANCE"
  | "MISCELLANEOUS";

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "RENT", label: "Rent" },
  { value: "UTILITIES", label: "Utilities" },
  { value: "SUPPLIES", label: "Supplies" },
  { value: "MARKETING", label: "Marketing" },
  { value: "TRAVEL", label: "Travel" },
  { value: "PROFESSIONAL_FEES", label: "Professional Fees" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "MISCELLANEOUS", label: "Miscellaneous" },
];

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  notes: string | null;
  isRecurring: boolean;
}

export interface ExpensesResponse {
  expenses: Expense[];
  summary: {
    total: number;
    count: number;
    byCategory: Record<string, number>;
  };
}
