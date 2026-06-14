export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  state?: string;
  city?: string;
  address?: string;
  pincode?: string;
  gstin?: string;
  pan?: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientPayload {
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

export interface UpdateClientPayload {
  name?: string;
  email?: string;
  phone?: string;
  gstin?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  notes?: string;
}

export interface ClientForm {
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
  countryCode: "+91";
}
