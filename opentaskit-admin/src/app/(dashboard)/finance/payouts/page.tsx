"use client";

import * as React from "react";
import {
  Landmark,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Inbox,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Send,
  Building2,
  CreditCard,
  User,
  Hash,
  FileText,
} from "lucide-react";

import type {
  PaginatedPayoutsResponse,
  PayoutMetrics,
  PayoutRequestRecord,
  PayoutStatus,
} from "@/types/payment";
import { adminFetch } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const STATUS_META: Record<PayoutStatus, { label: string; className: string; bg: string }> = {
  PENDING: {
    label: "Pending Review",
    className: "text-amber-600 border-amber-500/30",
    bg: "bg-amber-500/10",
  },
  APPROVED: {
    label: "Approved (Queued)",
    className: "text-blue-600 border-blue-500/30",
    bg: "bg-blue-500/10",
  },
  PAID: {
    label: "Paid / Disbursed",
    className: "text-emerald-600 border-emerald-500/30",
    bg: "bg-emerald-500/10",
  },
  REJECTED: {
    label: "Rejected & Refunded",
    className: "text-red-600 border-red-500/30",
    bg: "bg-red-500/10",
  },
};

export default function PayoutsPage() {
  const [payouts, setPayouts] = React.useState<PayoutRequestRecord[]>([]);
  const [metrics, setMetrics] = React.useState<PayoutMetrics | null>(null);
  const [totalPages, setTotalPages] = React.useState<number>(1);
  const [page, setPage] = React.useState<number>(1);
  const [limit] = React.useState<number>(10);

  const [search, setSearch] = React.useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("PENDING");

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [successBanner, setSuccessBanner] = React.useState<string | null>(null);

  // Inspection & Action modal
  const [selected, setSelected] = React.useState<PayoutRequestRecord | null>(null);
  const [activeAction, setActiveAction] = React.useState<"PAID" | "APPROVED" | "REJECTED" | null>(null);
  const [adminNotes, setAdminNotes] = React.useState<string>("");
  const [bankReference, setBankReference] = React.useState<string>("");
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false);
  const [processError, setProcessError] = React.useState<string | null>(null);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPayouts = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

      const res = await adminFetch(`/api/backend/admin/payouts?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load payout requests (HTTP ${res.status})`);
      }
      const data: PaginatedPayoutsResponse = await res.json();
      setPayouts(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load payout requests from backend.");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, statusFilter, debouncedSearch]);

  React.useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const openInspectionModal = (payout: PayoutRequestRecord) => {
    setSelected(payout);
    setAdminNotes(payout.adminNotes || "");
    setBankReference(payout.bankReference || "");
    setProcessError(null);
    if (payout.status === "PENDING") {
      setActiveAction("PAID");
    } else if (payout.status === "APPROVED") {
      setActiveAction("PAID");
    } else {
      setActiveAction(null);
    }
  };

  const handleProcess = async (targetStatus: PayoutStatus) => {
    if (!selected) return;

    if (targetStatus === "REJECTED" && !adminNotes.trim()) {
      setProcessError("A rejection reason is required so the tasker knows why their request was rejected.");
      return;
    }

    setIsProcessing(true);
    setProcessError(null);
    try {
      const res = await adminFetch(`/api/backend/admin/payouts/${selected.id}/process`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          adminNotes: adminNotes.trim() || undefined,
          bankReference: bankReference.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || `Failed to process payout (HTTP ${res.status})`);
      }

      setSuccessBanner(
        targetStatus === "PAID"
          ? `Payout of LKR ${selected.amount.toLocaleString()} marked as transferred & tasker notified.`
          : targetStatus === "REJECTED"
          ? `Payout rejected and LKR ${selected.amount.toLocaleString()} refunded to tasker's wallet.`
          : `Payout approved and queued for bank transfer.`
      );
      setSelected(null);
      await fetchPayouts();
    } catch (err: unknown) {
      setProcessError(err instanceof Error ? err.message : "Failed to process payout.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Withdrawal Requests
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review and disburse tasker wallet withdrawal requests via bank transfer.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 text-xs"
          onClick={fetchPayouts}
          disabled={isLoading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Alerts */}
      {successBanner && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-medium">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="p-1 hover:bg-emerald-500/20 rounded-md transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between text-red-700 dark:text-red-400 text-xs font-medium">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 hover:bg-red-500/20 rounded-md transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Pending Review
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold text-foreground">
              {metrics?.pendingCount ?? 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
              LKR {(metrics?.pendingAmount ?? 0).toLocaleString()} awaiting transfer
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Approved (In-Flight)
            </CardTitle>
            <Send className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold text-foreground">
              {metrics?.approvedCount ?? 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
              LKR {(metrics?.approvedAmount ?? 0).toLocaleString()} queued
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Disbursed (Paid)
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold text-foreground">
              {metrics?.paidCount ?? 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
              LKR {(metrics?.paidAmount ?? 0).toLocaleString()} total paid out
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Rejected & Refunded
            </CardTitle>
            <XCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold text-foreground">
              {metrics?.rejectedCount ?? 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
              LKR {(metrics?.rejectedAmount ?? 0).toLocaleString()} returned to wallet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search tasker, email, bank, account..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-44 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses ({metrics?.totalCount ?? 0})</SelectItem>
                  <SelectItem value="PENDING">Pending Review ({metrics?.pendingCount ?? 0})</SelectItem>
                  <SelectItem value="APPROVED">Approved ({metrics?.approvedCount ?? 0})</SelectItem>
                  <SelectItem value="PAID">Paid ({metrics?.paidCount ?? 0})</SelectItem>
                  <SelectItem value="REJECTED">Rejected ({metrics?.rejectedCount ?? 0})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Tasker</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Bank Account</TableHead>
                  <TableHead className="text-xs font-semibold text-right whitespace-nowrap">Amount</TableHead>
                  <TableHead className="text-xs font-semibold text-center whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right whitespace-nowrap">Requested</TableHead>
                  <TableHead className="text-xs font-semibold text-right whitespace-nowrap">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : payouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                      <Inbox className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground/60" />
                      No payout requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  payouts.map((payout) => {
                    const statusMeta = STATUS_META[payout.status] || STATUS_META.PENDING;
                    const isPending = payout.status === "PENDING";
                    const isApproved = payout.status === "APPROVED";

                    return (
                      <TableRow key={payout.id} className="text-xs hover:bg-muted/40">
                        <TableCell className="whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">
                              {payout.wallet?.user.fullName}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {payout.wallet?.user.email}
                            </span>
                            {payout.wallet?.user.phoneNumber && (
                              <span className="text-[10px] text-muted-foreground/80 font-mono">
                                {payout.wallet?.user.phoneNumber}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {payout.bankAccount?.bankName} — {payout.bankAccount?.branch}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {payout.bankAccount?.accountHolderName} · {payout.bankAccount?.accountNumber}
                            </span>
                            {payout.bankReference && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                                Ref: {payout.bankReference}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap font-bold text-foreground">
                          LKR {payout.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <Badge variant="outline" className={`text-[10px] font-semibold ${statusMeta.className} ${statusMeta.bg}`}>
                            {statusMeta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                          {new Date(payout.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {isPending ? (
                            <Button
                              variant="default"
                              size="sm"
                              className="h-7 text-[11px] font-semibold bg-[#0094F7] hover:bg-[#0080D7] text-white"
                              onClick={() => openInspectionModal(payout)}
                            >
                              Review Request
                            </Button>
                          ) : isApproved ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px] font-semibold border-blue-500/40 text-blue-600 hover:bg-blue-500/10"
                              onClick={() => openInspectionModal(payout)}
                            >
                              Process Transfer
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
                              onClick={() => openInspectionModal(payout)}
                            >
                              View Details
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-[11px] text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inspection & Processing Modal */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2 text-base">
                  <Landmark className="h-4.5 w-4.5 text-[#0094F7]" />
                  <span>Withdrawal Request</span>
                </DialogTitle>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-semibold ${(STATUS_META[selected.status] || STATUS_META.PENDING).className} ${(STATUS_META[selected.status] || STATUS_META.PENDING).bg}`}
                >
                  {(STATUS_META[selected.status] || STATUS_META.PENDING).label}
                </Badge>
              </div>
              <DialogDescription className="text-xs">
                Requested by {selected.wallet?.user.fullName} on {new Date(selected.createdAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs mt-1">
              {/* Amount Banner */}
              <div className="p-3 bg-muted/50 rounded-xl border border-border/60 flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Requested Withdrawal:</span>
                <span className="text-base font-bold text-foreground">
                  LKR {selected.amount.toLocaleString()}
                </span>
              </div>

              {/* Tasker & Bank Details Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-border/60 p-3 space-y-1.5 bg-card">
                  <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                    <User className="h-3.5 w-3.5 text-[#0094F7]" />
                    <span>Tasker Information</span>
                  </div>
                  <div className="font-semibold text-foreground text-[12px]">
                    {selected.wallet?.user.fullName}
                  </div>
                  <div className="text-muted-foreground truncate">{selected.wallet?.user.email}</div>
                  {selected.wallet?.user.phoneNumber && (
                    <div className="text-muted-foreground font-mono">{selected.wallet?.user.phoneNumber}</div>
                  )}
                </div>

                <div className="rounded-xl border border-border/60 p-3 space-y-1.5 bg-card">
                  <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                    <Building2 className="h-3.5 w-3.5 text-[#0094F7]" />
                    <span>Beneficiary Bank</span>
                  </div>
                  <div className="font-semibold text-foreground text-[12px]">
                    {selected.bankAccount?.bankName}
                  </div>
                  <div className="text-muted-foreground">{selected.bankAccount?.branch} Branch</div>
                  <div className="text-muted-foreground font-mono truncate">
                    A/C: {selected.bankAccount?.accountNumber}
                  </div>
                </div>
              </div>

              {/* Account Holder Verification Card */}
              <div className="rounded-xl border border-border/60 p-3 bg-card space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Account Holder Name:</span>
                  <span className="font-semibold text-foreground">{selected.bankAccount?.accountHolderName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Account Number:</span>
                  <span className="font-mono font-bold text-foreground">{selected.bankAccount?.accountNumber}</span>
                </div>
              </div>

              {/* Audit Trail for Finalized Payouts */}
              {(selected.status === "PAID" || selected.status === "REJECTED") && (
                <div className="rounded-xl border border-border/60 p-3 bg-muted/40 space-y-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Processing Audit Record</span>
                  </div>
                  {selected.processedBy && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Processed by Admin:</span>
                      <span className="font-medium text-foreground">{selected.processedBy.fullName}</span>
                    </div>
                  )}
                  {selected.processedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Processed At:</span>
                      <span className="font-medium text-foreground">{new Date(selected.processedAt).toLocaleString()}</span>
                    </div>
                  )}
                  {selected.bankReference && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bank Reference / UTR:</span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {selected.bankReference}
                      </span>
                    </div>
                  )}
                  {selected.adminNotes && (
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Admin Notes / Reason:</span>
                      <p className="text-foreground p-2 rounded-lg bg-card border border-border/40 text-[11px] leading-relaxed">
                        {selected.adminNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Interactive Processing Section for Actionable Payouts */}
              {(selected.status === "PENDING" || selected.status === "APPROVED") && (
                <div className="space-y-3 pt-1 border-t">
                  {/* Action Mode Toggle */}
                  <div className="flex items-center gap-1.5 p-1 bg-muted rounded-xl">
                    <button
                      type="button"
                      onClick={() => { setActiveAction("PAID"); setProcessError(null); }}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        activeAction === "PAID"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Mark as Paid
                    </button>
                    {selected.status === "PENDING" && (
                      <button
                        type="button"
                        onClick={() => { setActiveAction("APPROVED"); setProcessError(null); }}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          activeAction === "APPROVED"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Approve (Queue)
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { setActiveAction("REJECTED"); setProcessError(null); }}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        activeAction === "REJECTED"
                          ? "bg-red-600 text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Reject & Refund
                    </button>
                  </div>

                  {/* Form fields based on selected action */}
                  {activeAction === "PAID" && (
                    <div className="space-y-2.5">
                      <div className="space-y-1">
                        <label className="font-semibold text-foreground flex items-center justify-between">
                          <span>Bank Reference / UTR Number</span>
                          <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
                        </label>
                        <Input
                          type="text"
                          placeholder="e.g. BOC-FT-20260928-8921"
                          value={bankReference}
                          onChange={(e) => setBankReference(e.target.value)}
                          className="h-8.5 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-foreground flex items-center justify-between">
                          <span>Admin notes (optional)</span>
                        </label>
                        <Textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="e.g. Disbursed via Sampath Vishwa online banking transfer..."
                          className="text-xs min-h-[60px]"
                        />
                      </div>
                    </div>
                  )}

                  {activeAction === "APPROVED" && (
                    <div className="space-y-2.5">
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Approving this request verifies the tasker&apos;s bank account and flags it as queued for manual bank transfer. The tasker will be notified.
                      </p>
                      <div className="space-y-1">
                        <label className="font-semibold text-foreground">Admin notes (optional)</label>
                        <Textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="e.g. Verified with bank, scheduled for end-of-day batch transfer..."
                          className="text-xs min-h-[60px]"
                        />
                      </div>
                    </div>
                  )}

                  {activeAction === "REJECTED" && (
                    <div className="space-y-2.5">
                      <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-700 dark:text-red-400 text-[11px] leading-relaxed">
                        <span className="font-bold">Refund Notice:</span> The requested LKR {selected.amount.toLocaleString()} will be automatically credited back into the tasker&apos;s wallet balance.
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-red-600 flex items-center justify-between">
                          <span>Rejection Reason *</span>
                          <span className="text-[10px] font-normal text-muted-foreground">Required</span>
                        </label>
                        <Textarea
                          value={adminNotes}
                          onChange={(e) => { setAdminNotes(e.target.value); setProcessError(null); }}
                          placeholder="e.g. Account number does not match beneficiary name. Please re-enter correct account details..."
                          className="text-xs min-h-[65px] border-red-500/40 focus-visible:ring-red-500/30"
                        />
                      </div>
                    </div>
                  )}

                  {processError && (
                    <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-[11px]">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{processError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8.5 px-3 text-xs"
                      disabled={isProcessing}
                      onClick={() => setSelected(null)}
                    >
                      Cancel
                    </Button>

                    {activeAction === "PAID" && (
                      <Button
                        type="button"
                        size="sm"
                        className="h-8.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
                        disabled={isProcessing}
                        onClick={() => handleProcess("PAID")}
                      >
                        {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        <span>Confirm & Mark as Paid</span>
                      </Button>
                    )}

                    {activeAction === "APPROVED" && (
                      <Button
                        type="button"
                        size="sm"
                        className="h-8.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
                        disabled={isProcessing}
                        onClick={() => handleProcess("APPROVED")}
                      >
                        {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        <span>Approve Payout</span>
                      </Button>
                    )}

                    {activeAction === "REJECTED" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="h-8.5 px-4 text-xs font-semibold gap-1.5 shadow-sm"
                        disabled={isProcessing}
                        onClick={() => handleProcess("REJECTED")}
                      >
                        {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                        <span>Reject & Refund Wallet</span>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
