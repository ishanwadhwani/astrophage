export interface User {
  id: string;
  name: string;
  email: string;
  business: BusinessSummary;
  businesses: BusinessSummary[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  businessName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface BusinessSummary {
  id: string;
  name: string;
  gstin: string | null;
}
