export type EmploymentStatus = "UPCOMING" | "ACTIVE" | "EXITED";

export interface Employee {
  id: string;
  name: string;
  role: string | null;
  monthlySalary: number;
  startDate: string;
  exitDate: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  status: EmploymentStatus;
}

export interface EmployeeSummary {
  total: number;
  active: number;
  upcoming: number;
  exited: number;
  currentMonthly: number;
  committedAnnual: number;
}

export interface EmployeesResponse {
  employees: Employee[];
  summary: EmployeeSummary;
}
