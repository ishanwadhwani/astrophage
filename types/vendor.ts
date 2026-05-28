export type BillStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
export type PaymentMode = "CASH" | "UPI" | "BANK_TRANSFER" | "CARD";
export type BillFrequency = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

export interface Vendor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  pan: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  notes: string | null;
  businessId: string;
  _count: { bills: number };
}

export interface Bill {
  id: string;
  businessId: string;
  vendorId: string;
  number: string | null;
  description: string;
  amount: number;
  dueDate: string;
  status: BillStatus;
  notes: string | null;
  vendor: { id: string; name: string };
  payments: { amount: number }[];
  createdAt: string;
}

export interface CreateVendorPayload {
  name: string;
  email?: string;
  phone?: string;
  gstin?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  notes?: string;
  businessId: string;
}

export interface CreateBillPayload {
  businessId: string;
  vendorId: string;
  number?: string;
  description: string;
  amount: number;
  dueDate: string;
  notes?: string;
}

export interface RecordBillPaymentPayload {
  billId: string;
  amount: number;
  mode: PaymentMode;
  referenceNumber?: string;
  paymentDate?: string;
  notes?: string;
}

export interface VendorForm {
  name: string;
  email: string;
  phone: string;
  gstin: string;
  pan: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
}

export interface BillForm {
  vendorId: string;
  number: string;
  description: string;
  amount: number;
  dueDate: string;
  notes: string;
}

export interface PaymentForm {
  amount: number;
  mode: PaymentMode;
  referenceNumber: string;
  paymentDate: string;
  notes: string;
}

export interface RecurringBill {
  id: string;
  businessId: string;
  vendorId: string;
  description: string;
  amount: number;
  frequency: BillFrequency;
  nextDueDate: string;
  isActive: boolean;
  notes: string | null;
  vendor: { id: string; name: string };
}

export interface CreateRecurringBillPayload {
  businessId: string;
  vendorId: string;
  description: string;
  amount: number;
  frequency: BillFrequency;
  nextDueDate: string;
  notes?: string;
}
