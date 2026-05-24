export interface User {
  id: string;
  name: string;
  email: string;
  business: {
    id: string;
    name: string;
  };
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