export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
}

export interface MyProfileStats {
  tasksPosted: number;
  offersSubmitted: number;
  tasksCompleted: number;
  unreadNotifications: number;
}

export interface UpdateMyProfilePayload {
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills?: string[];
}

export interface MyProfileResponse {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  status: string;
  avatarUrl: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  skills: string[];
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  createdAt: string;
  stats: MyProfileStats;
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
  avatarUrl?: string | null;
  isVerified?: boolean;
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

export interface UpdateTaskPayload {
  title?: string;
  details?: string;
  categoryId?: string;
  images?: string[];
  locationType?: LocationApiType;
  address?: string;
  latitude?: number;
  longitude?: number;
  budget?: number;
  isBudgetFlexible?: boolean;
  paymentMethod?: PaymentApiMethod;
  timeType?: TimeApiType;
  scheduledDate?: string;
  scheduledTime?: string;
  status?: TaskApiStatus;
}

export interface PaginatedTasksResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: TaskItem[];
}





export type OfferApiStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface OfferUserSummary {
  id: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string | null;
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  createdAt?: string;
}

export interface OfferItem {
  id: string;
  taskId: string;
  userId: string;
  amount: number;
  message: string;
  status: OfferApiStatus;
  createdAt: string;
  updatedAt: string;
  user?: OfferUserSummary;
}

export interface AcceptOfferResponse {
  message: string;
  offer: OfferItem;
}

export interface RejectOfferResponse {
  message: string;
  offer: OfferItem;
}

export interface CompleteTaskResponse {
  message: string;
  task: TaskItem;
}

export interface CancelTaskResponse {
  message: string;
  task: TaskItem;
}

export interface CreateOfferPayload {
  amount: number;
  message: string;
}

export interface MyOfferTaskSummary {
  id: string;
  title: string;
  budget: number;
  status: TaskApiStatus;
  address?: string | null;
  locationType: LocationApiType;
  user?: TaskUserSummary;
}

export interface MyOfferItem {
  id: string;
  taskId: string;
  amount: number;
  message: string;
  status: OfferApiStatus;
  createdAt: string;
  task: MyOfferTaskSummary;
}

export interface UpdateOfferResponse {
  id: string;
  taskId: string;
  amount: number;
  message: string;
  status: OfferApiStatus;
  updatedAt: string;
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


