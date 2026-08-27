export type Language = 'en' | 'si' | 'ta';

export type UserMode = 'requester' | 'provider';

export type KycStatus = 'none' | 'pending' | 'verified' | 'rejected';

export type TaskStatus =
'draft' |
'posted' |
'receiving_offers' |
'assigned' |
'in_progress' |
'awaiting_completion' |
'completed' |
'cancelled' |
'disputed';

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export type ScheduleType = 'asap' | 'date' | 'flexible';

/** How the poster settles the agreed price with the tasker. Chosen before the task is posted. */
export type PaymentMethod = 'cash' | 'card' | 'wallet';

export interface PortfolioItem {
  id: string;
  title: string;
  image: string | any;
}

export interface User {
  id: string;
  name: string;
  initials: string;
  tone: string;
  headline: string;
  about: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  successRate: number;
  responseRate: number;
  experienceYears: number;
  verified: boolean;
  kyc: KycStatus;
  memberSince: string;
  location: string;
  distanceKm: number;
  skills: string[];
  /** Service categories this member offers work in — drives the category provider lists. */
  categoryIds: string[];
  services: {name: string;from: number;}[];
  portfolio: PortfolioItem[];
  available: boolean;
  respondsIn: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  tone: string;
}

export interface Schedule {
  type: ScheduleType;
  date?: string;
  time?: string;
}

export interface Task {
  id: string;
  title: string;
  categoryId: string;
  description: string;
  images: (string | any)[];
  budget: number;
  flexibleBudget: boolean;
  location: string;
  distanceKm: number;
  pin: {x: number;y: number;};
  schedule: Schedule;
  /** Selected by the poster before posting so taskers know how they will be paid. */
  paymentMethod: PaymentMethod;
  postedAt: string;
  status: TaskStatus;
  requesterId: string;
  assignedProviderId?: string;
  acceptedOfferId?: string;
  paid?: boolean;
  reviewedByRequester?: boolean;
  reviewedByProvider?: boolean;
  /** Set when the poster deleted the task after a tasker was already assigned. */
  deletionPenalty?: number;
}

export interface Offer {
  id: string;
  taskId: string;
  providerId: string;
  price: number;
  eta: string;
  message: string;
  note?: string;
  status: OfferStatus;
  createdAt: string;
}

export interface Message {
  id: string;
  taskId: string;
  senderId: string;
  text: string;
  at: string;
  attachment?: string;
  status: 'sent' | 'delivered' | 'seen';
}

export type NotificationKind =
'offer' |
'message' |
'task' |
'payment' |
'dispute' |
'review' |
'system';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  at: string;
  read: boolean;
  taskId?: string;
  actionLabel?: string;
  actionTo?: string;
}

export type TransactionKind =
'commission' |
'topup' |
'payment_received' |
'payment_released' |
'adjustment' |
'refund' |
'partial_payment' |
'penalty';

export interface Transaction {
  id: string;
  kind: TransactionKind;
  amount: number;
  at: string;
  title: string;
  subtitle: string;
  taskId?: string;
  status: 'completed' | 'pending' | 'failed';
  method?: string;
}

export interface Review {
  id: string;
  taskId: string;
  fromId: string;
  toId: string;
  rating: number;
  text: string;
  tags: string[];
  at: string;
  role: 'provider' | 'requester';
}

export type DisputeStatus =
'submitted' |
'under_review' |
'waiting_response' |
'decision_made' |
'resolved';

export type DisputeOutcome = 'full_payment' | 'partial_payment' | 'refund' | 'no_refund';

export interface DisputeEvent {
  id: string;
  label: string;
  detail: string;
  at: string;
  done: boolean;
}

export interface Dispute {
  id: string;
  taskId: string;
  raisedById: string;
  reason: string;
  description: string;
  evidence: string[];
  status: DisputeStatus;
  outcome?: DisputeOutcome;
  outcomeAmount?: number;
  timeline: DisputeEvent[];
  responses: {id: string;authorId: string;text: string;at: string;}[];
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'error' | 'info';
}