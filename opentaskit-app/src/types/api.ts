export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LogoutPayload {
  refreshToken: string;
}

export interface RefreshPayload {
  refreshToken: string;
}

export interface RefreshResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
}

export interface MessageResponse {
  message: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    tasks: number;
  };
}

export type TaskApiStatus = 'OPEN' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
export type LocationApiType = 'REMOTE' | 'IN_PERSON';

export interface FilterTasksQuery {
  search?: string;
  categoryId?: string;
  status?: TaskApiStatus;
  locationType?: LocationApiType;
  minBudget?: number;
  maxBudget?: number;
  page?: number;
  limit?: number;
}

export interface TaskUserSummary {
  id: string;
  fullName: string;
  phoneNumber?: string;
  createdAt?: string;
}

export interface TaskItem {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  description: string;
  budget: number;
  locationType: LocationApiType;
  locationName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  dueDate?: string | null;
  status: TaskApiStatus;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
  };
  user: TaskUserSummary;
}

export interface PaginatedTasksResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: TaskItem[];
}




export interface ApiErrorResponse {
  status: number;
  error: string;
  message: string | string[];
  timestamp?: string;
  path?: string;
}

export interface ParsedApiError {
  status?: number;
  generalMessage: string;
  fieldErrors: Record<string, string>;
}


