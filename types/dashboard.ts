export interface DashboardStats {
  totalReceivables: number;
  overdueAmount: number;
  totalPayables: number;
  overduePayables: number;
  paidThisMonth: number;
  totalClients: number;
  gstPayable: number;
  outputGst: number;
  inputGst: number;
}

export interface DashboardInvoice {
  id: string;
  number: string;
  clientName: string;
  clientPhone: string | null;
  total: number;
  outstanding: number;
  dueDate: string;
  status: string;
}

export interface DashboardBill {
  id: string;
  vendorName: string;
  description: string;
  total: number;
  outstanding: number;
  dueDate: string;
  status: string;
}

export interface DashboardData {
  stats: DashboardStats;
  overdueInvoices: DashboardInvoice[];
  dueSoonInvoices: DashboardInvoice[];
  overdueB: DashboardBill[];
  dueSoonBills: DashboardBill[];
  recentInvoices: DashboardInvoice[];
}

export interface MonthlyTrend {
  month: string;
  invoiced: number;
  collected: number;
  spent: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
  total: number;
}

export interface DashboardCharts {
  monthlyTrend: MonthlyTrend[];
  statusBreakdown: StatusBreakdown[];
}
