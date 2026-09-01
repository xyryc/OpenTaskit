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

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  tasksCount: number;
  createdAt: string;
}

export interface TaskRecord {
  id: string;
  title: string;
  details: string;
  images: string[];
  categoryId: string;
  categoryName: string;
  locationType: "IN_PERSON" | "ONLINE";
  address?: string;
  budgetType: "TOTAL" | "HOURLY";
  budgetAmount: number;
  hourlyHours?: number;
  hourlyRate?: number;
  status: "OPEN" | "ASSIGNED" | "COMPLETED" | "CANCELLED" | "EXPIRED";
  posterId: string;
  posterName: string;
  posterEmail: string;
  posterPhone: string;
  providerId?: string;
  providerName?: string;
  offersCount: number;
  createdAt: string;
}

export interface DisputeRecord {
  id: string;
  taskId: string;
  taskTitle: string;
  escrowAmount: number;
  initiatorRole: "POSTER" | "PROVIDER";
  initiatorName: string;
  initiatorEmail: string;
  respondentName: string;
  respondentEmail: string;
  reason: string;
  description: string;
  evidenceImages: string[];
  status: "OPEN" | "REFUNDED_TO_POSTER" | "RELEASED_TO_PROVIDER";
  resolutionNote?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface TransactionRecord {
  id: string;
  taskId?: string;
  taskTitle?: string;
  type: "ESCROW_LOCK" | "ESCROW_RELEASE" | "ESCROW_REFUND" | "CARD_PAYMENT" | "PLATFORM_FEE";
  amount: number;
  fee: number;
  gateway: "STRIPE" | "PAYHERE" | "CARD_ONLINE";
  status: "SUCCESS" | "PENDING" | "REFUNDED" | "FAILED";
  userName: string;
  userEmail: string;
  createdAt: string;
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

export const MOCK_CATEGORIES: CategoryRecord[] = [
  {
    id: "CAT-001",
    name: "Cleaning & Housekeeping",
    slug: "cleaning-housekeeping",
    icon: "Sparkles",
    description: "Deep house cleaning, move-in/move-out, sofa and carpet shampooing.",
    isActive: true,
    tasksCount: 48,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "CAT-002",
    name: "Handyman & Repairs",
    slug: "handyman-repairs",
    icon: "Wrench",
    description: "Plumbing, electrical wiring, carpentry, wall mounting, and general repairs.",
    isActive: true,
    tasksCount: 62,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "CAT-003",
    name: "Delivery & Courier",
    slug: "delivery-courier",
    icon: "Truck",
    description: "Same-day parcel courier, intercity delivery, and grocery pick-up.",
    isActive: true,
    tasksCount: 34,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "CAT-004",
    name: "Tech & IT Support",
    slug: "tech-it-support",
    icon: "Laptop",
    description: "Computer repair, Wi-Fi setup, software installation, and web design.",
    isActive: true,
    tasksCount: 22,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "CAT-005",
    name: "Gardening & Landscaping",
    slug: "gardening-landscaping",
    icon: "TreePine",
    description: "Lawn mowing, tree trimming, garden maintenance, and landscaping.",
    isActive: true,
    tasksCount: 18,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "CAT-006",
    name: "Event Help & Photography",
    slug: "event-photography",
    icon: "Camera",
    description: "Event catering, photography, party setups, and helpers.",
    isActive: false,
    tasksCount: 0,
    createdAt: "2026-02-15T00:00:00Z",
  },
];

export const MOCK_TASKS: TaskRecord[] = [
  {
    id: "TSK-891",
    title: 'Mount 65" TV on Concrete Wall with Cable Concealment',
    details: "Need a professional handyman to mount a 65 inch Samsung smart TV securely onto a solid concrete wall. Must bring own drill and wall mount brackets. Conceal cables with trunking.",
    images: [
      "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&auto=format&fit=crop&q=80",
    ],
    categoryId: "CAT-002",
    categoryName: "Handyman & Repairs",
    locationType: "IN_PERSON",
    address: "Kollupitiya, Colombo 03",
    budgetType: "TOTAL",
    budgetAmount: 6500,
    status: "OPEN",
    posterId: "USR-003",
    posterName: "Ruwan Nandana",
    posterEmail: "ruwan.nandana@gmail.com",
    posterPhone: "+94 76 345 8921",
    offersCount: 3,
    createdAt: "2026-09-01T09:30:00Z",
  },
  {
    id: "TSK-892",
    title: "Deep Clean 3 Bedroom Apartment Before Moving In",
    details: "Thorough deep cleaning needed for a newly painted 3-bedroom apartment. Includes scrubbing 2 bathrooms, kitchen cabinets, floor polishing, and window glass wiping.",
    images: [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&auto=format&fit=crop&q=80",
    ],
    categoryId: "CAT-001",
    categoryName: "Cleaning & Housekeeping",
    locationType: "IN_PERSON",
    address: "Stanley Tilakaratne Mawatha, Nugegoda",
    budgetType: "TOTAL",
    budgetAmount: 14000,
    status: "ASSIGNED",
    posterId: "USR-007",
    posterName: "Sanduni Wickramasinghe",
    posterEmail: "sanduni.w@gmail.com",
    posterPhone: "+94 77 823 4512",
    providerId: "USR-001",
    providerName: "Kasun Perera",
    offersCount: 5,
    createdAt: "2026-08-31T14:10:00Z",
  },
  {
    id: "TSK-893",
    title: "Urgent Document Parcel Delivery from Kandy to Colombo",
    details: "Pick up legal documents from Kandy city center and deliver to Colombo 07 legal firm by 4:00 PM today. Requires careful handling.",
    images: [],
    categoryId: "CAT-003",
    categoryName: "Delivery & Courier",
    locationType: "IN_PERSON",
    address: "Kandy to Colombo 07",
    budgetType: "TOTAL",
    budgetAmount: 8000,
    status: "COMPLETED",
    posterId: "USR-003",
    posterName: "Ruwan Nandana",
    posterEmail: "ruwan.nandana@gmail.com",
    posterPhone: "+94 76 345 8921",
    providerId: "USR-002",
    providerName: "Dilshan Alwis",
    offersCount: 2,
    createdAt: "2026-08-30T08:00:00Z",
  },
  {
    id: "TSK-894",
    title: "Fix Wi-Fi Mesh Network and Office Router Configuration",
    details: "Small office network keeps dropping connections during video conferences. Need someone to diagnose router, re-configure DHCP range, and optimize mesh satellites.",
    images: [],
    categoryId: "CAT-004",
    categoryName: "Tech & IT Support",
    locationType: "IN_PERSON",
    address: "Battaramulla, Sri Jayawardenepura Kotte",
    budgetType: "HOURLY",
    budgetAmount: 3000,
    hourlyHours: 3,
    hourlyRate: 1000,
    status: "OPEN",
    posterId: "USR-002",
    posterName: "Dilshan Alwis",
    posterEmail: "dilshan.alwis@outlook.com",
    posterPhone: "+94 71 889 2314",
    offersCount: 1,
    createdAt: "2026-09-01T11:00:00Z",
  },
  {
    id: "TSK-895",
    title: "Overgrown Garden Grass Cut and Yard Cleanup",
    details: "Approx 15 perches garden. Grass is overgrown after recent monsoon rains. Need grass cutting, weeding flower beds, and disposing garden waste bags.",
    images: [
      "https://images.unsplash.com/photo-1558904541-efa8c4a08931?w=800&auto=format&fit=crop&q=80",
    ],
    categoryId: "CAT-005",
    categoryName: "Gardening & Landscaping",
    locationType: "IN_PERSON",
    address: "Thalawathugoda",
    budgetType: "TOTAL",
    budgetAmount: 7500,
    status: "CANCELLED",
    posterId: "USR-007",
    posterName: "Sanduni Wickramasinghe",
    posterEmail: "sanduni.w@gmail.com",
    posterPhone: "+94 77 823 4512",
    offersCount: 0,
    createdAt: "2026-08-28T16:20:00Z",
  },
];

export const MOCK_DISPUTES: DisputeRecord[] = [
  {
    id: "DSP-104",
    taskId: "TSK-892",
    taskTitle: "Deep Clean 3 Bedroom Apartment Before Moving In",
    escrowAmount: 14000,
    initiatorRole: "POSTER",
    initiatorName: "Sanduni Wickramasinghe",
    initiatorEmail: "sanduni.w@gmail.com",
    respondentName: "Kasun Perera",
    respondentEmail: "kasun.p@gmail.com",
    reason: "Service not completed",
    description: "Provider arrived 3 hours late and left without cleaning the 2 bathrooms and kitchen cabinets as agreed in the task requirements. Floors were left wet and unpolished.",
    evidenceImages: [
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&auto=format&fit=crop&q=80",
    ],
    status: "OPEN",
    createdAt: "2026-09-01T09:45:00Z",
  },
  {
    id: "DSP-103",
    taskId: "TSK-891",
    taskTitle: 'Mount 65" TV on Concrete Wall with Cable Concealment',
    escrowAmount: 6500,
    initiatorRole: "PROVIDER",
    initiatorName: "Dilshan Alwis",
    initiatorEmail: "dilshan.alwis@outlook.com",
    respondentName: "Ruwan Nandana",
    respondentEmail: "ruwan.nandana@gmail.com",
    reason: "Requester unavailable",
    description: "I arrived at the location at the scheduled time. Contacted requester multiple times by phone and chat, but no one opened the gate or answered. Waited 45 minutes.",
    evidenceImages: [],
    status: "OPEN",
    createdAt: "2026-09-01T08:15:00Z",
  },
  {
    id: "DSP-102",
    taskId: "TSK-880",
    taskTitle: "Plumbing Pipe Leak Repair Under Kitchen Sink",
    escrowAmount: 4500,
    initiatorRole: "POSTER",
    initiatorName: "Amila Kaluarachchi",
    initiatorEmail: "amila.k@gmail.com",
    respondentName: "Chathura Senanayake",
    respondentEmail: "chathura.s@gmail.com",
    reason: "Poor quality",
    description: "Pipe continued to leak heavily 1 hour after provider claimed it was fixed.",
    evidenceImages: [
      "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&auto=format&fit=crop&q=80",
    ],
    status: "REFUNDED_TO_POSTER",
    resolutionNote: "Full refund issued to poster after verifying plumbing leak evidence photos.",
    createdAt: "2026-08-27T11:20:00Z",
    resolvedAt: "2026-08-28T14:00:00Z",
  },
];

export const MOCK_TRANSACTIONS: TransactionRecord[] = [
  {
    id: "TXN-901",
    taskId: "TSK-891",
    taskTitle: 'Mount 65" TV on Concrete Wall',
    type: "ESCROW_LOCK",
    amount: 6500,
    fee: 650,
    gateway: "CARD_ONLINE",
    status: "SUCCESS",
    userName: "Ruwan Nandana",
    userEmail: "ruwan.nandana@gmail.com",
    createdAt: "2026-09-01T09:30:00Z",
  },
  {
    id: "TXN-902",
    taskId: "TSK-892",
    taskTitle: "Deep Clean 3 Bedroom Apartment",
    type: "ESCROW_LOCK",
    amount: 14000,
    fee: 1400,
    gateway: "STRIPE",
    status: "SUCCESS",
    userName: "Sanduni Wickramasinghe",
    userEmail: "sanduni.w@gmail.com",
    createdAt: "2026-08-31T14:10:00Z",
  },
  {
    id: "TXN-903",
    taskId: "TSK-893",
    taskTitle: "Urgent Document Parcel Delivery",
    type: "ESCROW_RELEASE",
    amount: 8000,
    fee: 800,
    gateway: "PAYHERE",
    status: "SUCCESS",
    userName: "Dilshan Alwis",
    userEmail: "dilshan.alwis@outlook.com",
    createdAt: "2026-08-30T17:45:00Z",
  },
  {
    id: "TXN-904",
    taskId: "TSK-880",
    taskTitle: "Plumbing Pipe Leak Repair",
    type: "ESCROW_REFUND",
    amount: 4500,
    fee: 0,
    gateway: "STRIPE",
    status: "REFUNDED",
    userName: "Amila Kaluarachchi",
    userEmail: "amila.k@gmail.com",
    createdAt: "2026-08-28T14:00:00Z",
  },
  {
    id: "TXN-905",
    type: "CARD_PAYMENT",
    amount: 25000,
    fee: 500,
    gateway: "PAYHERE",
    status: "SUCCESS",
    userName: "Kasun Perera",
    userEmail: "kasun.p@gmail.com",
    createdAt: "2026-08-29T10:15:00Z",
  },
];
