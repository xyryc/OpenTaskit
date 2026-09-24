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

export interface LegalDocSection {
  id: string;
  heading: string;
  body: string;
}

export interface LegalDocumentResponse {
  slug: string;
  title: string;
  version: string;
  sections: LegalDocSection[];
  updatedAt: string;
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

export interface ProviderServiceRecord {
  id: string;
  name: string;
  fromPrice: number;
  createdAt: string;
}

export interface PortfolioItemRecord {
  id: string;
  title: string;
  imageUrl: string;
  createdAt: string;
}

export interface CreateServicePayload {
  name: string;
  fromPrice: number;
}

export interface CreatePortfolioItemPayload {
  title: string;
  imageUrl: string;
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
  services: ProviderServiceRecord[];
  portfolio: PortfolioItemRecord[];
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

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
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

export type TaskApiStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'AWAITING_CONFIRMATION' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
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
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sortBy?: string;
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
  distanceKm?: number | null;
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

export interface StartTaskResponse {
  message: string;
  task: TaskItem;
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

export interface ReviewUserSummary {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface ReviewTaskSummary {
  id: string;
  title: string;
  images?: string[];
}

export interface ReviewItem {
  id: string;
  taskId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  text: string;
  tags: string[];
  createdAt: string;
  fromUser?: ReviewUserSummary;
  toUser?: ReviewUserSummary;
  task?: ReviewTaskSummary;
}

export interface CreateReviewPayload {
  rating: number;
  text: string;
  tags?: string[];
}

export interface UserReviewsQuery {
  page?: number;
  limit?: number;
}

export interface UserReviewsResponse {
  user: {
    id: string;
    fullName: string;
    averageRating: number;
    totalReviews: number;
  };
  distribution: Record<number, number>;
  topTags: { tag: string; count: number }[];
  reviews: ReviewItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MyReviewsResponse {
  received: ReviewItem[];
  given: ReviewItem[];
  totalReceived: number;
  totalGiven: number;
}

export interface MyReviewsQuery {
  type?: 'all' | 'received' | 'given';
}

export interface PublicProfileReview {
  id: string;
  rating: number;
  text: string;
  tags: string[];
  createdAt: string;
  fromUser: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
  task?: {
    id: string;
    title: string;
    images?: string[];
  };
}

export type KycDocumentType = 'NIC' | 'DRIVING_LICENSE' | 'PASSPORT';
export type KycStatusValue = 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface KycVerificationRecord {
  id: string;
  documentType: KycDocumentType;
  idNumber: string;
  fullName: string | null;
  dob: string | null;
  frontPhotoUrl: string | null;
  backPhotoUrl: string | null;
  selfieUrl: string | null;
  status: KycStatusValue;
  rejectionReason: string | null;
  reviewNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MyKycResponse {
  isVerified: boolean;
  status: KycStatusValue;
  verification: KycVerificationRecord | null;
}

export interface PublicProfileResponse {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  skills: string[];
  rating: number;
  reviewCount: number;
  createdAt: string;
  memberSince: string;
  services: ProviderServiceRecord[];
  portfolio: PortfolioItemRecord[];
  stats: {
    tasksCompleted: number;
    tasksPosted: number;
  };
  recentReviews: PublicProfileReview[];
}

export type DisputeReason =
  | 'WORK_UNSATISFACTORY'
  | 'TASKER_NO_SHOW'
  | 'POSTER_UNRESPONSIVE'
  | 'PAYMENT_ISSUE'
  | 'HARASSMENT'
  | 'OTHER';
export type DisputeStatusValue = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
export type DisputeResolutionValue =
  | 'REFUND_POSTER'
  | 'PAY_TASKER'
  | 'CANCELLED_NO_PENALTY'
  | 'DISMISSED';

export interface DisputeUserSummary {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  email?: string;
}

export interface DisputeTaskSummary {
  id: string;
  title: string;
  status: string;
  budget: number;
}

export interface DisputeItem {
  id: string;
  taskId: string;
  raisedById: string;
  againstUserId: string;
  reason: DisputeReason;
  description: string;
  evidenceUrls: string[];
  status: DisputeStatusValue;
  resolution: DisputeResolutionValue | null;
  resolutionNotes: string | null;
  resolvedById: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  task?: DisputeTaskSummary;
  raisedBy?: DisputeUserSummary;
  againstUser?: DisputeUserSummary;
  resolvedBy?: { id: string; fullName: string } | null;
}

export interface CreateDisputePayload {
  reason: DisputeReason;
  description: string;
  evidenceUrls?: string[];
}

export interface MyDisputesQuery {
  status?: DisputeStatusValue;
  role?: 'raised' | 'received' | 'all';
  page?: number;
  limit?: number;
}

export interface MyDisputesResponse {
  data: DisputeItem[];
  openCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ---------------------------------------------------------------------------
// Messages / Chat
// ---------------------------------------------------------------------------

export interface ChatUserSummary {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  lastActiveAt: string;
}

export interface MessageRecord {
  id: string;
  taskId: string;
  senderId: string;
  receiverId: string;
  text: string | null;
  attachmentUrl: string | null;
  isRead: boolean;
  createdAt: string;
  sender?: ChatUserSummary;
}

export interface CreateMessagePayload {
  text?: string;
  attachmentUrl?: string;
  toUserId?: string;
}

export interface MessageThreadResponse {
  task: {
    id: string;
    title: string;
    status: string;
    budget: number;
    address: string | null;
    locationType: 'IN_PERSON' | 'REMOTE';
    category: { id: string; name: string; slug: string; icon: string | null } | null;
  };
  otherUser: ChatUserSummary;
  messages: MessageRecord[];
}

export interface ConversationLastMessage {
  id: string;
  text: string | null;
  attachmentUrl: string | null;
  senderId: string;
  isRead: boolean;
  createdAt: string;
}

export interface ConversationItem {
  taskId: string;
  task: { id: string; title: string; status: string; budget: number };
  otherUser: ChatUserSummary;
  lastMessage: ConversationLastMessage;
  unreadCount: number;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export type NotificationTypeValue =
  | 'OFFER'
  | 'TASK'
  | 'MESSAGE'
  | 'REVIEW'
  | 'PAYMENT'
  | 'DISPUTE'
  | 'SYSTEM';

export interface NotificationRecord {
  id: string;
  type: NotificationTypeValue;
  title: string;
  body: string;
  isRead: boolean;
  taskId: string | null;
  actionUrl: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsQuery {
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface NotificationsResponse {
  unreadCount: number;
  notifications: NotificationRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ---------------------------------------------------------------------------
// Payments & Escrow
// ---------------------------------------------------------------------------

export type WalletTransactionType =
  | 'ESCROW_RELEASE'
  | 'PLATFORM_FEE'
  | 'WITHDRAWAL'
  | 'ADJUSTMENT';

export interface WalletTransactionItem {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  balanceAfter: number;
  taskId: string | null;
  escrowHoldId: string | null;
  payoutRequestId: string | null;
  description: string | null;
  createdAt: string;
}

export interface MyWalletResponse {
  id: string;
  userId: string;
  availableBalance: number;
  transactions: WalletTransactionItem[];
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatusValue =
  | 'INITIATED'
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type EscrowStatusValue = 'HELD' | 'RELEASED' | 'REFUNDED';

export interface EscrowHoldSummary {
  id: string;
  taskId: string;
  amount: number;
  platformFee: number;
  status: EscrowStatusValue;
  releasedAt: string | null;
  refundedAt: string | null;
}

export interface PaymentTaskStatus {
  id: string;
  taskId: string;
  amount: number;
  currency: string;
  status: PaymentStatusValue;
  createdAt: string;
  escrowHold: EscrowHoldSummary | null;
}

export interface InitiateCheckoutResponse {
  checkoutUrl: string;
  sandbox: boolean;
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  currency: string;
  amount: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  hash: string;
}

export interface WalletTopUpStatus {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatusValue;
  createdAt: string;
}

export interface BankAccountItem {
  id: string;
  userId: string;
  bankName: string;
  branch: string;
  accountHolderName: string;
  accountNumber: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateBankAccountPayload {
  bankName: string;
  branch: string;
  accountHolderName: string;
  accountNumber: string;
}

export type PayoutStatusValue = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';

export interface PayoutRequestItem {
  id: string;
  walletId: string;
  bankAccountId: string;
  amount: number;
  status: PayoutStatusValue;
  processedAt: string | null;
  adminNotes: string | null;
  createdAt: string;
  bankAccount?: BankAccountItem;
}

export interface CreatePayoutRequestPayload {
  bankAccountId: string;
  amount: number;
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

export type ReportCategoryValue =
  | 'TASK_OR_PROVIDER_ISSUE'
  | 'PAYMENT_OR_WALLET'
  | 'ACCOUNT_AND_LOGIN'
  | 'SAFETY_AND_TRUST'
  | 'APP_BUG_TECHNICAL'
  | 'OTHER';

export type ReportStatusValue = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';

export interface CreateProblemReportPayload {
  category: ReportCategoryValue;
  description: string;
  taskRef?: string;
  images?: string[];
}

export interface ProblemReportResponse {
  id: string;
  userId: string;
  category: ReportCategoryValue;
  description: string;
  taskRef: string | null;
  images: string[];
  status: ReportStatusValue;
  adminNotes: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactConfigResponse {
  supportEmail: string;
  supportHotline: string;
  whatsappSupportNumber: string;
}



