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
export type LocationApiType = 'IN_PERSON' | 'REMOTE';
export type TimeApiType = 'ASAP' | 'SPECIFIC_DATE' | 'FLEXIBLE';
export type PaymentApiMethod = 'CASH' | 'CARD' | 'WALLET';

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
  details: string;
  images: string[];
  locationType: LocationApiType;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  budget: number;
  isBudgetFlexible: boolean;
  paymentMethod: PaymentApiMethod;
  timeType: TimeApiType;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  status: TaskApiStatus;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
    description?: string | null;
  };
  user: TaskUserSummary;
  _count?: {
    offers: number;
  };
}

export interface CreateTaskPayload {
  title: string;
  details: string;
  categoryId: string;
  images?: string[];
  locationType?: LocationApiType;
  address?: string;
  latitude?: number;
  longitude?: number;
  budget: number;
  isBudgetFlexible?: boolean;
  paymentMethod?: PaymentApiMethod;
  timeType?: TimeApiType;
  scheduledDate?: string;
  scheduledTime?: string;
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


