export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
  termsAcceptedAt?: string;
}

export interface AdminLoginPayload {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: AdminUser;
}

export interface ApiError {
  statusCode?: number;
  message: string | string[];
  error?: string;
}
