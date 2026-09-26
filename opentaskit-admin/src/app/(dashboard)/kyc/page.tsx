"use client";

import * as React from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Inbox,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import type { KycVerification, KycStatus, PaginatedKycResponse } from "@/types/kyc";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const DOCUMENT_LABELS: Record<string, string> = {
  NIC: "National ID (NIC)",
  PASSPORT: "Passport",
  DRIVING_LICENSE: "Driving Licence",
};

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function KycPage() {
  // Live KYC Queue Data & Pagination State
  const [submissions, setSubmissions] = React.useState<KycVerification[]>([]);
  const [counts, setCounts] = React.useState({ pending: 0, verified: 0, rejected: 0, total: 0 });
  const [totalPages, setTotalPages] = React.useState<number>(1);
  const [page, setPage] = React.useState<number>(1);
  const [limit] = React.useState<number>(10);

  // Filters State
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("PENDING");

  // Page-level Loading & Error
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [successBanner, setSuccessBanner] = React.useState<string | null>(null);

  // Inspection Modal State
  const [selectedSubmission, setSelectedSubmission] = React.useState<KycVerification | null>(null);
  const [showRejectForm, setShowRejectForm] = React.useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = React.useState<string>("");
  const [isReviewing, setIsReviewing] = React.useState<boolean>(false);
  const [reviewError, setReviewError] = React.useState<string | null>(null);

  // Debounce search input (300ms)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch KYC Queue with Server-Side Filtering & Pagination
  const fetchSubmissions = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));

      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      }

      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      const res = await adminFetch(`/api/backend/admin/kyc?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load KYC verification queue (HTTP ${res.status})`);
      }

      const data: PaginatedKycResponse = await res.json();
      setSubmissions(data.data || []);
      setTotalPages(data.meta?.totalPages || 1);
      setCounts(data.counts || { pending: 0, verified: 0, rejected: 0, total: 0 });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load KYC submissions from backend.");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter]);

  React.useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const openInspectionModal = (submission: KycVerification) => {
    setSelectedSubmission(submission);
    setShowRejectForm(false);
    setRejectionReason("");
    setReviewError(null);
  };

  // Approve or Reject (PATCH /admin/kyc/:id/review)
  const submitReview = async (id: string, status: KycStatus, reason?: string) => {
    setIsReviewing(true);
    setReviewError(null);
    try {
      const res = await adminFetch(`/api/backend/admin/kyc/${id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          status === "REJECTED" ? { status, rejectionReason: reason } : { status }
        ),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || `Failed to submit review (HTTP ${res.status})`);
      }

      setSuccessBanner(
        status === "VERIFIED"
          ? "Identity verified and badge granted successfully."
          : "Submission rejected and the applicant has been notified."
      );
      setSelectedSubmission(null);
      setShowRejectForm(false);
      setRejectionReason("");
      await fetchSubmissions();
    } catch (err: unknown) {
      setReviewError(err instanceof Error ? err.message : "Failed to submit review.");
    } finally {
      setIsReviewing(false);
    }
  };

  const setQuickRejectionReason = (reason: string) => {
    setRejectionReason(reason);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Identity / KYC Verification Queue
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review submitted National ID cards and live photos to grant verified provider badges.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-semibold text-amber-600 border-amber-500/30 bg-amber-500/10 px-3 py-1">
            <Clock className="h-3.5 w-3.5 mr-1" />
            <span>{counts.pending} Pending Reviews</span>
          </Badge>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="flex items-center justify-between gap-3 p-3.5 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="p-1 hover:bg-emerald-500/20 rounded text-emerald-700 dark:text-emerald-400 cursor-pointer"
            aria-label="Dismiss message"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Metrics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Total Submissions</div>
            <div className="text-xl font-bold text-foreground mt-0.5">{counts.total}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Pending Review</div>
            <div className="text-xl font-bold text-amber-600 mt-0.5">{counts.pending}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Verified</div>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">{counts.verified}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Rejected</div>
            <div className="text-xl font-bold text-destructive mt-0.5">{counts.rejected}</div>
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
                placeholder="Search applicant name, email, National ID number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-40 text-xs cursor-pointer">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Submissions</SelectItem>
                  <SelectItem value="PENDING">Pending Review</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchSubmissions}
                disabled={isLoading}
                className="h-9 px-3 gap-1.5 text-xs cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Submissions Table with responsive horizontal scroll */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Applicant</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Document</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">National ID Number</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Submitted Date</TableHead>
                  <TableHead className="text-xs font-semibold text-center whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right whitespace-nowrap">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* 1. Loading Skeleton */}
                {isLoading ? (
                  [1, 2, 3, 4, 5].map((idx) => (
                    <TableRow key={idx} className="text-xs">
                      <TableCell>
                        <div className="space-y-1.5 max-w-sm">
                          <div className="h-3.5 w-48 bg-muted/60 rounded animate-pulse" />
                          <div className="h-2.5 w-24 bg-muted/40 rounded animate-pulse" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="h-5 w-24 bg-muted/40 rounded-full animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-3.5 w-24 bg-muted/50 rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-3.5 w-24 bg-muted/40 rounded animate-pulse" />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="h-5 w-16 bg-muted/40 rounded-full mx-auto animate-pulse" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="h-7 w-16 bg-muted/40 rounded ml-auto animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  /* 2. Error State */
                  <TableRow>
                    <TableCell colSpan={6} className="h-36 text-center text-xs">
                      <div className="flex flex-col items-center justify-center gap-2 py-4">
                        <AlertCircle className="h-6 w-6 text-destructive shrink-0" />
                        <p className="font-semibold text-foreground">{error}</p>
                        <p className="text-muted-foreground text-[11px] max-w-sm">
                          Ensure the NestJS backend is running at http://localhost:3000.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchSubmissions}
                          className="mt-2 h-8 px-3 text-xs gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Try Again</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : submissions.length === 0 ? (
                  /* 3. Empty State */
                  <TableRow>
                    <TableCell colSpan={6} className="h-36 text-center text-xs text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-1.5 py-6">
                        <Inbox className="h-6 w-6 text-muted-foreground/60" />
                        <span className="font-medium">No KYC submissions found matching the criteria.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  /* 4. Live Submissions Data */
                  submissions.map((sub) => (
                    <TableRow
                      key={sub.id}
                      className="text-xs hover:bg-muted/40 cursor-pointer"
                      onClick={() => openInspectionModal(sub)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <Avatar className="h-8 w-8 border shrink-0">
                            <AvatarFallback className="text-[11px] font-semibold bg-muted">
                              {initialsOf(sub.user?.fullName || sub.fullName || "?")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-semibold text-foreground block">
                              {sub.user?.fullName || sub.fullName || "Unknown"}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {sub.user?.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className="text-[10px] font-medium">
                          {DOCUMENT_LABELS[sub.documentType] || sub.documentType}
                        </Badge>
                      </TableCell>

                      <TableCell className="font-mono text-xs font-medium text-foreground whitespace-nowrap">
                        {sub.idNumber}
                      </TableCell>

                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {new Date(sub.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>

                      <TableCell className="text-center whitespace-nowrap">
                        <Badge
                          variant={sub.status === "VERIFIED" ? "outline" : sub.status === "PENDING" ? "secondary" : "destructive"}
                          className={`text-[10px] font-semibold ${
                            sub.status === "VERIFIED"
                              ? "text-emerald-600 border-emerald-500/30"
                              : sub.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              : "bg-destructive/15 text-destructive"
                          }`}
                        >
                          {sub.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant={sub.status === "PENDING" ? "default" : "outline"}
                          className={`h-8 text-xs gap-1.5 cursor-pointer ${
                            sub.status === "PENDING"
                              ? "bg-[#0094F7] hover:bg-[#007cd6] text-white"
                              : ""
                          }`}
                          onClick={() => openInspectionModal(sub)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Inspect</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t text-xs text-muted-foreground">
            <div>
              {counts.total > 0 ? (
                <span>
                  Page <strong className="text-foreground">{page}</strong> of{" "}
                  <strong className="text-foreground">{totalPages}</strong> · {counts.total} submissions
                </span>
              ) : (
                <span>0 submissions recorded</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1 cursor-pointer"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Previous</span>
              </Button>
              <span className="px-2 font-medium text-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1 cursor-pointer"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KYC Inspection Modal Dialog */}
      <Dialog
        open={!!selectedSubmission}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSubmission(null);
            setShowRejectForm(false);
            setReviewError(null);
          }
        }}
      >
        {selectedSubmission && (
          <DialogContent className="w-[95vw] sm:w-[92vw] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
            {/* Modal Header */}
            <DialogHeader className="p-4 sm:p-6 border-b bg-muted/10 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border shrink-0">
                    <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
                      {initialsOf(selectedSubmission.user?.fullName || selectedSubmission.fullName || "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                      <span>{selectedSubmission.user?.fullName || selectedSubmission.fullName}</span>
                      <Badge
                        variant={selectedSubmission.status === "VERIFIED" ? "outline" : "secondary"}
                        className="text-[10px]"
                      >
                        {selectedSubmission.status}
                      </Badge>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5" asChild>
                      <div>
                        <span>National ID: {selectedSubmission.idNumber}</span>
                        <span>•</span>
                        <span>{selectedSubmission.user?.email}</span>
                        {selectedSubmission.user?.phoneNumber && (
                          <>
                            <span>•</span>
                            <span>{selectedSubmission.user.phoneNumber}</span>
                          </>
                        )}
                        {selectedSubmission.dob && (
                          <>
                            <span>•</span>
                            <span>DOB: {new Date(selectedSubmission.dob).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </DialogDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1">
                    {DOCUMENT_LABELS[selectedSubmission.documentType] || selectedSubmission.documentType} Verification
                  </Badge>
                </div>
              </div>
            </DialogHeader>

            {/* Scrollable Inspection Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Document Photos Grid (3 Columns on Desktop, 2 on Tablet, 1 on Mobile) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Front Side Document */}
                <Card className="border-border/60 overflow-hidden shadow-xs flex flex-col">
                  <CardHeader className="p-3 border-b bg-muted/20 flex flex-row items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      1. National ID (Front)
                    </span>
                    {selectedSubmission.frontPhotoUrl && (
                      <a
                        href={selectedSubmission.frontPhotoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Full</span>
                      </a>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 flex-1 flex items-center justify-center bg-muted/30 min-h-[260px]">
                    {selectedSubmission.frontPhotoUrl ? (
                      <img
                        src={selectedSubmission.frontPhotoUrl}
                        alt="National ID Front"
                        className="max-h-64 w-auto max-w-full rounded-xl object-contain border shadow-sm"
                      />
                    ) : (
                      <div className="text-center text-xs text-muted-foreground">Not provided</div>
                    )}
                  </CardContent>
                </Card>

                {/* 2. Back Side Document */}
                <Card className="border-border/60 overflow-hidden shadow-xs flex flex-col">
                  <CardHeader className="p-3 border-b bg-muted/20 flex flex-row items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      2. National ID (Back)
                    </span>
                    {selectedSubmission.backPhotoUrl && (
                      <a
                        href={selectedSubmission.backPhotoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Full</span>
                      </a>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 flex-1 flex items-center justify-center bg-muted/30 min-h-[260px]">
                    {selectedSubmission.backPhotoUrl ? (
                      <img
                        src={selectedSubmission.backPhotoUrl}
                        alt="National ID Back"
                        className="max-h-64 w-auto max-w-full rounded-xl object-contain border shadow-sm"
                      />
                    ) : (
                      <div className="text-center text-xs text-muted-foreground">
                        Not provided
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 3. Live Selfie Verification */}
                <Card className="border-border/60 overflow-hidden shadow-xs flex flex-col md:col-span-2 lg:col-span-1">
                  <CardHeader className="p-3 border-b bg-muted/20 flex flex-row items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      3. Live Selfie Match
                    </span>
                    {selectedSubmission.selfieUrl && (
                      <a
                        href={selectedSubmission.selfieUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Full</span>
                      </a>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 flex-1 flex items-center justify-center bg-muted/30 min-h-[260px]">
                    {selectedSubmission.selfieUrl ? (
                      <img
                        src={selectedSubmission.selfieUrl}
                        alt="Live Selfie Check"
                        className="max-h-64 w-auto max-w-full rounded-xl object-contain border shadow-sm"
                      />
                    ) : (
                      <div className="text-center text-xs text-muted-foreground">Not provided</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Review Error */}
              {reviewError && (
                <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 text-xs text-destructive">
                  {reviewError}
                </div>
              )}

              {/* Rejection Form with Quick Reasons */}
              {showRejectForm && (
                <div className="flex flex-col gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Specify Rejection Reason (Sent to user notification)</span>
                    </span>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "National ID photo is blurry or unreadable",
                      "Name on ID does not match account name",
                      "Document has expired",
                      "Selfie photo does not match National ID photo",
                      "Corner of ID card is cropped or obscured",
                    ].map((reason) => (
                      <Button
                        key={reason}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] bg-background hover:bg-muted"
                        onClick={() => setQuickRejectionReason(reason)}
                      >
                        {reason}
                      </Button>
                    ))}
                  </div>

                  <Textarea
                    placeholder="Type or customize reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="text-xs min-h-[80px] bg-background"
                  />
                </div>
              )}

              {/* Existing Rejection Note if already rejected */}
              {selectedSubmission.rejectionReason && (
                <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 text-xs text-destructive">
                  <strong className="block font-semibold mb-1">Rejection Reason:</strong>
                  {selectedSubmission.rejectionReason}
                </div>
              )}

              {/* Existing Review Notes / Reviewer if already reviewed */}
              {selectedSubmission.reviewNotes && (
                <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 text-xs text-muted-foreground">
                  <strong className="block font-semibold mb-1 text-foreground">Reviewer Notes:</strong>
                  {selectedSubmission.reviewNotes}
                  {selectedSubmission.reviewedBy && (
                    <span className="block mt-1">
                      — {selectedSubmission.reviewedBy.fullName}
                      {selectedSubmission.reviewedAt &&
                        `, ${new Date(selectedSubmission.reviewedAt).toLocaleDateString()}`}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions Footer Bar */}
            <div className="w-full px-6 py-4 sm:px-8 sm:py-5 border-t bg-muted/20 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                className="h-10 px-5 text-xs font-medium"
                onClick={() => setSelectedSubmission(null)}
                disabled={isReviewing}
              >
                Close
              </Button>

              {selectedSubmission.status === "PENDING" && (
                <div className="flex flex-wrap items-center gap-3">
                  {!showRejectForm ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 px-5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => setShowRejectForm(true)}
                      disabled={isReviewing}
                    >
                      <XCircle className="h-4 w-4 mr-1.5" />
                      <span>Reject KYC</span>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="destructive"
                      className="h-10 px-5 text-xs font-medium"
                      disabled={!rejectionReason.trim() || isReviewing}
                      onClick={() => submitReview(selectedSubmission.id, "REJECTED", rejectionReason.trim())}
                    >
                      {isReviewing ? (
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-1.5" />
                      )}
                      <span>Confirm Rejection</span>
                    </Button>
                  )}

                  <Button
                    type="button"
                    className="h-10 px-6 sm:px-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold shadow-sm text-xs"
                    disabled={isReviewing}
                    onClick={() => submitReview(selectedSubmission.id, "VERIFIED")}
                  >
                    {isReviewing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    <span>Approve & Grant Verified Badge</span>
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
