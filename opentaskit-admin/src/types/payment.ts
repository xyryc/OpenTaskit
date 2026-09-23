export type PaymentStatus = "INITIATED" | "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type EscrowStatus = "HELD" | "RELEASED" | "REFUNDED";

export interface PaymentTaskSummary {
  id: string;
  title: string;
  status: string;
}

export interface PaymentPayerSummary {
  id: string;
  fullName: string;
  email: string;
}

export interface EscrowHoldRecord {
  id: string;
  taskId: string;
  paymentId: string;
  amount: number;
  platformFee: number;
  status: EscrowStatus;
  releasedAt: string | null;
  refundedAt: string | null;
  resolutionSource: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  taskId: string;
  payerId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payhereOrderId: string;
  payherePaymentId: string | null;
  createdAt: string;
  updatedAt: string;
  task?: PaymentTaskSummary;
  payer?: PaymentPayerSummary;
  escrowHold?: EscrowHoldRecord | null;
}

export interface PaginatedPaymentsResponse {
  data: PaymentRecord[];
  metrics: {
    activeEscrowTotal: number;
    releasedToTaskersTotal: number;
    refundedToPostersTotal: number;
    platformFeeTotal: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type PayoutStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";

export interface BankAccountSummary {
  id: string;
  bankName: string;
  branch: string;
  accountHolderName: string;
  accountNumber: string;
}

export interface PayoutWalletSummary {
  id: string;
  user: { id: string; fullName: string; email: string };
}

export interface PayoutRequestRecord {
  id: string;
  walletId: string;
  bankAccountId: string;
  amount: number;
  status: PayoutStatus;
  processedById: string | null;
  processedAt: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  bankAccount?: BankAccountSummary;
  wallet?: PayoutWalletSummary;
}

export interface PaginatedPayoutsResponse {
  data: PayoutRequestRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
