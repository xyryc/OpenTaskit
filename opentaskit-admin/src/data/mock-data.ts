export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: "POSTER" | "PROVIDER" | "DUAL" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "BANNED" | "PENDING_VERIFICATION";
  isKycVerified: boolean;
  kycDocumentType?: "NIC" | "PASSPORT" | "DRIVING_LICENSE";
  kycSubmittedAt?: string;
  avatarUrl?: string;
  rating: number;
  reviewCount: number;
  tasksPostedCount: number;
  tasksCompletedCount: number;
  walletBalance: number;
  escrowLockedBalance: number;
  createdAt: string;
  location: string;
}

export interface KycSubmission {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  documentType: "NIC" | "PASSPORT" | "DRIVING_LICENSE";
  idNumber: string;
  frontImageUrl: string;
  backImageUrl?: string;
  selfieImageUrl: string;
  submittedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewerNote?: string;
  accountRole: "PROVIDER" | "DUAL" | "POSTER";
}

export const MOCK_USERS: UserRecord[] = [
  {
    id: "USR-001",
    fullName: "Kasun Perera",
    email: "kasun.p@gmail.com",
    phoneNumber: "+94 77 123 4567",
    role: "PROVIDER",
    status: "PENDING_VERIFICATION",
    isKycVerified: false,
    kycDocumentType: "NIC",
    kycSubmittedAt: "2026-09-01T10:15:00Z",
    rating: 4.9,
    reviewCount: 28,
    tasksPostedCount: 2,
    tasksCompletedCount: 45,
    walletBalance: 34500,
    escrowLockedBalance: 12000,
    createdAt: "2026-03-12T08:30:00Z",
    location: "Colombo 03",
  },
  {
    id: "USR-002",
    fullName: "Dilshan Alwis",
    email: "dilshan.alwis@outlook.com",
    phoneNumber: "+94 71 889 2314",
    role: "DUAL",
    status: "ACTIVE",
    isKycVerified: true,
    kycDocumentType: "NIC",
    kycSubmittedAt: "2026-04-10T14:20:00Z",
    rating: 4.8,
    reviewCount: 64,
    tasksPostedCount: 14,
    tasksCompletedCount: 82,
    walletBalance: 58200,
    escrowLockedBalance: 25000,
    createdAt: "2026-01-18T11:00:00Z",
    location: "Nugegoda",
  },
  {
    id: "USR-003",
    fullName: "Ruwan Nandana",
    email: "ruwan.nandana@gmail.com",
    phoneNumber: "+94 76 345 8921",
    role: "POSTER",
    status: "ACTIVE",
    isKycVerified: true,
    kycDocumentType: "DRIVING_LICENSE",
    kycSubmittedAt: "2026-05-02T09:10:00Z",
    rating: 5.0,
    reviewCount: 12,
    tasksPostedCount: 19,
    tasksCompletedCount: 0,
    walletBalance: 8500,
    escrowLockedBalance: 14000,
    createdAt: "2026-02-24T16:45:00Z",
    location: "Kandy",
  },
  {
    id: "USR-004",
    fullName: "Amila Kaluarachchi",
    email: "amila.k@gmail.com",
    phoneNumber: "+94 70 456 1278",
    role: "PROVIDER",
    status: "PENDING_VERIFICATION",
    isKycVerified: false,
    kycDocumentType: "PASSPORT",
    kycSubmittedAt: "2026-09-01T08:45:00Z",
    rating: 4.7,
    reviewCount: 19,
    tasksPostedCount: 1,
    tasksCompletedCount: 31,
    walletBalance: 21000,
    escrowLockedBalance: 8000,
    createdAt: "2026-06-05T12:20:00Z",
    location: "Galle",
  },
  {
    id: "USR-005",
    fullName: "Nadeesha Fernando",
    email: "nadeesha.f@yahoo.com",
    phoneNumber: "+94 72 901 3456",
    role: "DUAL",
    status: "SUSPENDED",
    isKycVerified: false,
    kycDocumentType: "NIC",
    kycSubmittedAt: "2026-07-15T11:30:00Z",
    rating: 3.2,
    reviewCount: 8,
    tasksPostedCount: 6,
    tasksCompletedCount: 9,
    walletBalance: 4200,
    escrowLockedBalance: 0,
    createdAt: "2026-04-20T10:15:00Z",
    location: "Dehiwala",
  },
  {
    id: "USR-006",
    fullName: "Chathura Senanayake",
    email: "chathura.s@gmail.com",
    phoneNumber: "+94 78 612 9845",
    role: "PROVIDER",
    status: "PENDING_VERIFICATION",
    isKycVerified: false,
    kycDocumentType: "DRIVING_LICENSE",
    kycSubmittedAt: "2026-09-01T06:30:00Z",
    rating: 4.9,
    reviewCount: 38,
    tasksPostedCount: 0,
    tasksCompletedCount: 54,
    walletBalance: 49000,
    escrowLockedBalance: 16500,
    createdAt: "2026-03-01T15:00:00Z",
    location: "Battaramulla",
  },
  {
    id: "USR-007",
    fullName: "Sanduni Wickramasinghe",
    email: "sanduni.w@gmail.com",
    phoneNumber: "+94 77 823 4512",
    role: "POSTER",
    status: "ACTIVE",
    isKycVerified: true,
    kycDocumentType: "NIC",
    kycSubmittedAt: "2026-05-18T14:10:00Z",
    rating: 4.9,
    reviewCount: 15,
    tasksPostedCount: 22,
    tasksCompletedCount: 0,
    walletBalance: 12000,
    escrowLockedBalance: 6500,
    createdAt: "2026-02-10T11:40:00Z",
    location: "Negombo",
  },
];

export const MOCK_KYC_SUBMISSIONS: KycSubmission[] = [
  {
    id: "KYC-101",
    userId: "USR-001",
    userName: "Kasun Perera",
    userEmail: "kasun.p@gmail.com",
    userPhone: "+94 77 123 4567",
    documentType: "NIC",
    idNumber: "199428501234",
    frontImageUrl: "https://images.unsplash.com/photo-1633265486064-086b219458ec?w=800&auto=format&fit=crop&q=80",
    backImageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80",
    selfieImageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
    submittedAt: "2026-09-01T10:15:00Z",
    status: "PENDING",
    accountRole: "PROVIDER",
  },
  {
    id: "KYC-102",
    userId: "USR-004",
    userName: "Amila Kaluarachchi",
    userEmail: "amila.k@gmail.com",
    userPhone: "+94 70 456 1278",
    documentType: "NIC",
    idNumber: "199184192034",
    frontImageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80",
    backImageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80",
    selfieImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
    submittedAt: "2026-09-01T08:45:00Z",
    status: "PENDING",
    accountRole: "PROVIDER",
  },
  {
    id: "KYC-103",
    userId: "USR-006",
    userName: "Chathura Senanayake",
    userEmail: "chathura.s@gmail.com",
    userPhone: "+94 78 612 9845",
    documentType: "NIC",
    idNumber: "199649821034",
    frontImageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&auto=format&fit=crop&q=80",
    backImageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80",
    selfieImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80",
    submittedAt: "2026-09-01T06:30:00Z",
    status: "PENDING",
    accountRole: "PROVIDER",
  },
  {
    id: "KYC-104",
    userId: "USR-005",
    userName: "Nadeesha Fernando",
    userEmail: "nadeesha.f@yahoo.com",
    userPhone: "+94 72 901 3456",
    documentType: "NIC",
    idNumber: "199874102934",
    frontImageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80",
    backImageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80",
    selfieImageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80",
    submittedAt: "2026-08-30T14:10:00Z",
    status: "REJECTED",
    reviewerNote: "Photo is blurry and national ID number text is unreadable.",
    accountRole: "DUAL",
  },
];
