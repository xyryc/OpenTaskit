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
} from "lucide-react";

import type {
  PaginatedPayoutsResponse,
  PayoutRequestRecord,
  PayoutStatus,
} from "@/types/payment";
import { adminFetch } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardHeader,
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

const STATUS_META: Record<PayoutStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "text-amber-600 border-amber-500/30" },
  APPROVED: { label: "Approved", className: "text-blue-600 border-blue-500/30" },
  REJECTED: { label: "Rejected", className: "text-red-600 border-red-500/30" },
  PAID: { label: "Paid", className: "text-emerald-600 border-emerald-500/30" },
};

export default function PayoutsPage() {
  const [payouts, setPayouts] = React.useState<PayoutRequestRecord[]>([]);
  const [totalPages, setTotalPages] = React.useState<number>(1);
  const [page, setPage] = React.useState<number>(1);
  const [limit] = React.useState<number>(10);

  const [statusFilter, setStatusFilter] = React.useState<string>("PENDING");
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [successBanner, setSuccessBanner] = React.useState<string | null>(null);

  const [selected, setSelected] = React.useState<PayoutRequestRecord | null>(null);
  const [adminNotes, setAdminNotes] = React.useState<string>("");
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false);
  const [processError, setProcessError] = React.useState<string | null>(null);

  const fetchPayouts = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await adminFetch(`/api/backend/admin/payouts?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load payout requests (HTTP ${res.status})`);
      }
      const data: PaginatedPayoutsResponse = await res.json();
      setPayouts(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load payout requests from backend.");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, statusFilter]);

  React.useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const openInspectionModal = (payout: PayoutRequestRecord) => {
    setSelected(payout);
    setAdminNotes("");
    setProcessError(null);
  };

  const process = async (status: PayoutStatus) => {
    if (!selected) return;
    setIsProcessing(true);
    setProcessError(null);
    try {
      const res = await adminFetch(`/api/backend/admin/payouts/${selected.id}/process`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes: adminNotes || undefined }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || `Failed to process payout (HTTP ${res.status})`);
      }
      setSuccessBanner(
        status === "PAID"
          ? "Payout marked as paid."
          : status === "REJECTED"
          ? "Payout rejected and funds returned to the tasker's wallet."
          : "Payout approved."
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Withdrawal Requests
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review and process tasker withdrawal requests via manual bank transfer.
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

      {successBanner && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-red-700 dark:text-red-400 text-xs font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-end">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="h-9 w-40 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
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
                    const statusMeta = STATUS_META[payout.status];
                    return (
                      <TableRow key={payout.id} className="text-xs hover:bg-muted/40">
                        <TableCell className="whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {payout.wallet?.user.fullName}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {payout.wallet?.user.email}
                            </span>
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
                          </div>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap font-bold text-foreground">
                          LKR {payout.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <Badge variant="outline" className={`text-[10px] font-semibold ${statusMeta.className}`}>
                            {statusMeta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                          {new Date(payout.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px]"
                            disabled={payout.status !== "PENDING"}
                            onClick={() => openInspectionModal(payout)}
                          >
                            Review
                          </Button>
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

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Landmark className="h-4.5 w-4.5 text-[#0094F7]" />
                Process Withdrawal
              </DialogTitle>
              <DialogDescription className="text-xs">
                {selected.wallet?.user.fullName} · LKR {selected.amount.toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-border/60 p-3 space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank</span>
                  <span className="font-medium text-foreground">{selected.bankAccount?.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Branch</span>
                  <span className="font-medium text-foreground">{selected.bankAccount?.branch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account holder</span>
                  <span className="font-medium text-foreground">{selected.bankAccount?.accountHolderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account number</span>
                  <span className="font-mono font-medium text-foreground">{selected.bankAccount?.accountNumber}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Admin notes (optional)</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Transferred via online banking on..."
                  className="text-xs min-h-[70px]"
                />
              </div>

              {processError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-[11px]">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{processError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 px-3.5 text-xs text-red-600 border-red-500/30 hover:bg-red-500/10 gap-1.5"
                  disabled={isProcessing}
                  onClick={() => process("REJECTED")}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Reject</span>
                </Button>
                <Button
                  type="button"
                  className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
                  disabled={isProcessing}
                  onClick={() => process("PAID")}
                >
                  {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  <span>Mark as Paid</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
