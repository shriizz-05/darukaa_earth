export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export type AuthResponse = {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type ApiErrorBody = {
  status?: number;
  error?: string;
  message?: string;
  details?: string[];
  fieldErrors?: Record<string, string>;
};
