export interface BankDetails {
  id: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  accountType: string;
  bankName: string;
}

export interface Business {
  id: string;
  name: string;
  gstin: string | null;
  pan: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  email: string | null;
  phone: string | null;
  invoicePrefix: string | null; 
  invoiceCount?: number;
  bankDetails: BankDetails | null;
  upiId: string | null;
}

export interface UpdateBusinessPayload {
  name?: string;
  gstin?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  email?: string;
  phone?: string;
  upiId?: string;
}

export interface BankDetailsPayload {
  accountName: string;
  accountNumber: string;
  ifsc: string;
  accountType: string;
  bankName: string;
}

export interface BusinessForm {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  gstin: string;
  pan: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  upiId?: string;
}

export interface BankForm {
  accountName: string;
  accountNumber: string;
  ifsc: string;
  accountType: string;
  bankName: string;
}
