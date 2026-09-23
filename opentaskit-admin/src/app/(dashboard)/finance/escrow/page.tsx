"use client";

import * as React from "react";
import {
  Wallet,
  Search,
  ArrowUpRight,
  RotateCcw,
  TrendingUp,
  RefreshCw,
  Inbox,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import type { PaginatedPaymentsResponse, PaymentRecord, PaymentStatus } from "@/types/payment";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_META: Record<PaymentStatus, { label: string; className: string }> = {
  INITIATED: { label: "Initiated", className: "text-muted-foreground" },
  PENDING: { label: "Pending", className: "text-amber-600 border-amber-500/30" },
  COMPLETED: { label: "Completed", className: "text-emerald-600 border-emerald-500/30" },
  FAILED: { label: "Failed", className: "text-red-600 border-red-500/30" },
  CANCELLED: { label: "Cancelled", className: "text-muted-foreground" },
};

const ESCROW_LABELS: Record<string, { label: string; className: string }> = {
  HELD: { label: "Held in escrow", className: "bg-blue-500/10 text-blue-600" },
  RELEASED: { label: "Released to tasker", className: "bg-emerald-500/10 text-emerald-600" },
  REFUNDED: { label: "Refunded to poster", className: "bg-amber-500/10 text-amber-600" },
};

export default function EscrowLedgerPage() {
  const [payments, setPayments] = React.useState<PaymentRecord[]>([]);
  const [metrics, setMetrics] = React.useState({
    activeEscrowTotal: 0,
    releasedToTaskersTotal: 0,
    refundedToPostersTotal: 0,
    platformFeeTotal: 0,
  });
  const [totalPages, setTotalPages] = React.useState<number>(1);
  const [page, setPage] = React.useState<number>(1);
  const [limit] = React.useState<number>(10);

  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchPayments = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await adminFetch(`/api/backend/admin/payments?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load payments ledger (HTTP ${res.status})`);
      }
      const data: PaginatedPaymentsResponse = await res.json();
      setPayments(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setMetrics(data.metrics);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load payments ledger from backend.");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter]);

  React.useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Escrow Ledger & PayHere Transactions
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit locked task escrows, tasker payouts, poster refunds, and platform fee revenue.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 text-xs"
          onClick={fetchPayments}
          disabled={isLoading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-red-700 dark:text-red-400 text-xs font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Escrow Vault Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Escrow Held
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              LKR {metrics.activeEscrowTotal.toLocaleString()}
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              Safely locked in active tasks
            </span>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Released to Taskers
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              LKR {metrics.releasedToTaskersTotal.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-600 mt-0.5 block font-medium">
              Net of platform fee
            </span>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Refunded to Posters
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
              <RotateCcw className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              LKR {metrics.refundedToPostersTotal.toLocaleString()}
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              Cancelled / arbitrated refunds
            </span>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Platform Fee Revenue
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              LKR {metrics.platformFeeTotal.toLocaleString()}
            </div>
            <span className="text-[11px] text-purple-600 mt-0.5 block font-medium">
              Deducted on escrow release
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search task title, payer name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="h-9 w-44 text-xs">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Order ID</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Task</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Payer</TableHead>
                  <TableHead className="text-xs font-semibold text-right whitespace-nowrap">Amount</TableHead>
                  <TableHead className="text-xs font-semibold text-right whitespace-nowrap">Platform Fee</TableHead>
                  <TableHead className="text-xs font-semibold text-center whitespace-nowrap">Payment</TableHead>
                  <TableHead className="text-xs font-semibold text-center whitespace-nowrap">Escrow</TableHead>
                  <TableHead className="text-xs font-semibold text-right whitespace-nowrap">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-xs text-muted-foreground">
                      <Inbox className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground/60" />
                      No payment records found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => {
                    const statusMeta = STATUS_META[payment.status];
                    const escrowMeta = payment.escrowHold
                      ? ESCROW_LABELS[payment.escrowHold.status]
                      : null;
                    return (
                      <TableRow key={payment.id} className="text-xs hover:bg-muted/40">
                        <TableCell className="font-mono text-[11px] text-foreground whitespace-nowrap">
                          {payment.payhereOrderId}
                        </TableCell>
                        <TableCell className="whitespace-nowrap max-w-xs truncate text-foreground font-medium">
                          {payment.task?.title || "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{payment.payer?.fullName}</span>
                            <span className="text-[11px] text-muted-foreground">{payment.payer?.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap font-bold text-foreground">
                          {payment.currency} {payment.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap font-semibold text-muted-foreground">
                          {payment.escrowHold?.platformFee
                            ? `LKR ${payment.escrowHold.platformFee.toLocaleString()}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <Badge variant="outline" className={`text-[10px] font-semibold ${statusMeta.className}`}>
                            {statusMeta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          {escrowMeta ? (
                            <Badge variant="secondary" className={`text-[10px] font-semibold ${escrowMeta.className}`}>
                              {escrowMeta.label}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                          {new Date(payment.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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
    </div>
  );
}
