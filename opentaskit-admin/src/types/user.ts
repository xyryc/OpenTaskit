export type UserRole = "USER" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED";

export interface UserKycSummary {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  documentType: "NIC" | "PASSPORT" | "DRIVING_LICENSE";
  createdAt: string;
}

export interface UserKycDetail {
  id: string;
  documentType: "NIC" | "PASSPORT" | "DRIVING_LICENSE";
  idNumber: string;
  fullName?: string | null;
  frontPhotoUrl: string;
  backPhotoUrl?: string | null;
  selfieUrl?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}

export interface UserCounts {
  tasks: number;
  offers: number;
  savedTasks?: number;
}

export interface AdminUserListItem {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string | null;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  location?: string | null;
  createdAt: string;
  updatedAt: string;
  kycVerifications?: UserKycSummary[];
  _count?: UserCounts;

  // Mock / UI fallback for wallet as instructed
  walletBalance?: number;
  escrowLockedBalance?: number;
}

export interface AdminUsersStats {
  totalUsers: number;
  totalRegularUsers: number;
  totalAdmins: number;
  totalSuspended: number;
  totalVerified: number;
  totalPendingKyc: number;
}

export interface PaginatedUsersResponse {
  data: AdminUserListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats?: AdminUsersStats;
}

export interface UserTaskItem {
  id: string;
  title: string;
  budget: number;
  status: string;
  createdAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
  } | null;
  _count?: {
    offers: number;
  };
}

export interface UserOfferItem {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  task?: {
    id: string;
    title: string;
    budget: number;
    status: string;
  } | null;
}

export interface AdminUserDetail {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  skills?: string[];
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  termsAcceptedAt?: string;
  createdAt: string;
  updatedAt: string;
  kycVerifications?: UserKycDetail[];
  tasksCompletedCount?: number;
  _count?: UserCounts;
  tasks?: UserTaskItem[];
  offers?: UserOfferItem[];

  // Mock / UI fallback for wallet as instructed
  walletBalance?: number;
  escrowLockedBalance?: number;
}

export interface UpdateUserStatusPayload {
  status: UserStatus;
  reason?: string;
}
