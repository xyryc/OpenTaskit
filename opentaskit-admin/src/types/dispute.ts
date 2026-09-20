export type DisputeReason =
  | "WORK_UNSATISFACTORY"
  | "TASKER_NO_SHOW"
  | "POSTER_UNRESPONSIVE"
  | "PAYMENT_ISSUE"
  | "HARASSMENT"
  | "OTHER";

export type DisputeStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED";

export type DisputeResolution =
  | "REFUND_POSTER"
  | "PAY_TASKER"
  | "SPLIT_PAYMENT"
  | "CANCELLED_NO_PENALTY"
  | "DISMISSED";

export interface DisputeUser {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface DisputeTask {
  id: string;
  title: string;
  status: string;
  budget: number;
}

export interface DisputeRecord {
  id: string;
  taskId: string;
  reason: DisputeReason;
  description: string;
  evidenceUrls: string[];
  status: DisputeStatus;
  resolution: DisputeResolution | null;
  resolutionNotes: string | null;
  raisedById: string;
  againstUserId: string;
  resolvedById: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  task?: DisputeTask;
  raisedBy?: DisputeUser;
  againstUser?: DisputeUser;
  resolvedBy?: { id: string; fullName: string } | null;
}

export interface PaginatedDisputesResponse {
  data: DisputeRecord[];
  metrics: {
    openCount: number;
    underReviewCount: number;
    resolvedCount: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
