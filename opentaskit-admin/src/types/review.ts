export interface ReviewUser {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  role?: string;
  email?: string;
}

export interface ReviewTask {
  id: string;
  title: string;
  status?: string;
  budget?: number;
}

export interface AdminReviewItem {
  id: string;
  rating: number;
  text: string;
  tags: string[];
  taskId: string;
  fromUserId: string;
  toUserId: string;
  isHidden: boolean;
  moderationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  fromUser: ReviewUser;
  toUser: ReviewUser;
  task: ReviewTask;
}

export interface AdminReviewsStats {
  totalReviews: number;
  averageRating: number;
  fiveStarCount: number;
  hiddenCount: number;
}

export interface PaginatedAdminReviewsResponse {
  data: AdminReviewItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: AdminReviewsStats;
}
