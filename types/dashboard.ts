export interface DashboardStats {
  totalReceivables: number;
  overdueAmount: number;
  paidThisMonth: number;
  totalClients: number;
}

export interface DashboardInvoice {
  id: string;
  number: string;
  clientName: string;
  total: number;
  outstanding: number;
  dueDate: string;
  status: string;
}

export interface DashboardData {
  stats: DashboardStats;
  overdueInvoices: DashboardInvoice[];
  dueSoonInvoices: DashboardInvoice[];
  recentInvoices: DashboardInvoice[];
}