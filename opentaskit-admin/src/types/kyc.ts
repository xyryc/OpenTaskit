export type KycDocumentType = "NIC" | "DRIVING_LICENSE" | "PASSPORT";
export type KycStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface KycUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  isVerified: boolean;
}

export interface KycReviewer {
  id: string;
  fullName: string;
  email: string;
}

export interface KycVerification {
  id: string;
  documentType: KycDocumentType;
  idNumber: string;
  fullName: string | null;
  dob: string | null;
  frontPhotoUrl: string | null;
  backPhotoUrl: string | null;
  selfieUrl: string | null;
  status: KycStatus;
  rejectionReason: string | null;
  reviewNotes: string | null;
  userId: string;
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: KycUser;
  reviewedBy?: KycReviewer | null;
}

export interface PaginatedKycResponse {
  data: KycVerification[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  counts: {
    pending: number;
    verified: number;
    rejected: number;
    total: number;
  };
}
