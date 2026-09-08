export type TaskStatus = "OPEN" | "ASSIGNED" | "COMPLETED" | "CANCELLED";
export type LocationType = "IN_PERSON" | "REMOTE";

export interface TaskUser {
  id: string;
  fullName: string;
  phoneNumber?: string;
  createdAt?: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
}

export interface TaskListItem {
  id: string;
  title: string;
  details?: string | null;
  images: string[];
  categoryId: string;
  locationType: LocationType;
  address?: string | null;
  budget: number;
  isBudgetFlexible?: boolean;
  paymentMethod?: string | null;
  timeType?: string | null;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  status: TaskStatus;
  userId: string;
  createdAt: string;
  updatedAt?: string;
  category?: TaskCategory;
  user?: TaskUser;
  _count?: {
    offers: number;
  };
}

export interface PaginatedTasksResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: TaskListItem[];
}

export interface TaskDetail extends TaskListItem {
  latitude?: number | null;
  longitude?: number | null;
  user: TaskUser;
  category: TaskCategory;
}
