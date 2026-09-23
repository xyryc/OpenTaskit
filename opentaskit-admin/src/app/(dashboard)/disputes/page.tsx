"use client";

import * as React from "react";
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  Eye,
  Gavel,
  RotateCcw,
  Ban,
  Wallet,
  RefreshCw,
  Inbox,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import type {
  DisputeRecord,
  DisputeResolution,
  PaginatedDisputesResponse,
} from "@/types/dispute";
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

const REASON_LABELS: Record<string, string> = {
  WORK_UNSATISFACTORY: "Work unsatisfactory",
  TASKER_NO_SHOW: "Tasker no-show",
  POSTER_UNRESPONSIVE: "Poster unresponsive",
  PAYMENT_ISSUE: "Payment issue",
  HARASSMENT: "Harassment",
  OTHER: "Other",
};

const RESOLUTION_LABELS: Record<DisputeResolution, string> = {
  REFUND_POSTER: "Refunded to poster",
  PAY_TASKER: "Paid to tasker",
  CANCELLED_NO_PENALTY: "Cancelled, no penalty",
  DISMISSED: "Dismissed",
};

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function DisputesPage() {
  const [disputes, setDisputes] = React.useState<DisputeRecord[]>([]);
  const [metrics, setMetrics] = React.useState({ openCount: 0, underReviewCount: 0, resolvedCount: 0 });
  const [totalPages, setTotalPages] = React.useState<number>(1);
  const [page, setPage] = React.useState<number>(1);
  const [limit] = React.useState<number>(10);

  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("OPEN");

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [successBanner, setSuccessBanner] = React.useState<string | null>(null);

  const [selectedDispute, setSelectedDispute] = React.useState<DisputeRecord | null>(null);
  const [resolutionNote, setResolutionNote] = React.useState<string>("");
  const [isResolving, setIsResolving] = React.useState<boolean>(false);
  const [resolveError, setResolveError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchDisputes = React.useCallback(async () => {
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

      const res = await adminFetch(`/api/backend/admin/disputes?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load disputes queue (HTTP ${res.status})`);
      }

      const data: PaginatedDisputesResponse = await res.json();
      setDisputes(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setMetrics(data.metrics || { openCount: 0, underReviewCount: 0, resolvedCount: 0 });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load disputes from backend.");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter]);

  React.useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const openArbitrationModal = (dispute: DisputeRecord) => {
    setSelectedDispute(dispute);
    setResolutionNote("");
    setResolveError(null);
  };

  const submitResolution = async (id: string, resolution: DisputeResolution) => {
    setIsResolving(true);
    setResolveError(null);
    try {
      const res = await adminFetch(`/api/backend/admin/disputes/${id}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolution,
          ...(resolutionNote.trim() ? { resolutionNotes: resolutionNote.trim() } : {}),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || `Failed to resolve dispute (HTTP ${res.status})`);
      }

      setSuccessBanner(`Case resolved: ${RESOLUTION_LABELS[resolution]}.`);
      setSelectedDispute(null);
      setResolutionNote("");
      await fetchDisputes();
    } catch (err: unknown) {
      setResolveError(err instanceof Error ? err.message : "Failed to resolve dispute.");
    } finally {
      setIsResolving(false);
    }
  };

  const totalActive = metrics.openCount + metrics.underReviewCount;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Dispute Resolution & Arbitration
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Arbitrate contested jobs, review submitted evidence, and issue a verdict between posters and taskers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-xs font-semibold px-3 py-1 gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{totalActive} Active Disputes</span>
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

      {/* Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Open</div>
            <div className="text-xl font-bold text-destructive mt-0.5">{metrics.openCount}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Under Review</div>
            <div className="text-xl font-bold text-amber-600 mt-0.5">{metrics.underReviewCount}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Resolved</div>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">{metrics.resolvedCount}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Total Active</div>
            <div className="text-xl font-bold text-foreground mt-0.5">{totalActive}</div>
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
                placeholder="Search task title, description, party names..."
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
                  <SelectValue placeholder="Status filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Disputes</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="DISMISSED">Dismissed</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchDisputes}
                disabled={isLoading}
                className="h-9 px-3 gap-1.5 text-xs cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Disputes Table */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Task</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Reason</TableHead>
                  <TableHead className="text-xs font-semibold text-right whitespace-nowrap">Job Value</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Raised By</TableHead>
                  <TableHead className="text-xs font-semibold text-center whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right whitespace-nowrap">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
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
                        <div className="h-5 w-28 bg-muted/40 rounded-full animate-pulse" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="h-3.5 w-16 bg-muted/50 rounded ml-auto animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-3.5 w-24 bg-muted/50 rounded animate-pulse" />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="h-5 w-16 bg-muted/40 rounded-full mx-auto animate-pulse" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="h-7 w-20 bg-muted/40 rounded ml-auto animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : error ? (
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
                          onClick={fetchDisputes}
                          className="mt-2 h-8 px-3 text-xs gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Try Again</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : disputes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-36 text-center text-xs text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-1.5 py-6">
                        <Inbox className="h-6 w-6 text-muted-foreground/60" />
                        <span className="font-medium">No dispute cases found matching your criteria.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  disputes.map((dispute) => (
                    <TableRow
                      key={dispute.id}
                      className="text-xs hover:bg-muted/40 cursor-pointer"
                      onClick={() => openArbitrationModal(dispute)}
                    >
                      <TableCell>
                        <div className="flex flex-col gap-0.5 max-w-xs">
                          <span className="font-semibold text-foreground truncate block">
                            {dispute.task?.title || "Unknown task"}
                          </span>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {dispute.id.slice(0, 8)}...
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className="text-[10px] font-medium border-destructive/30 text-destructive bg-destructive/5">
                          {REASON_LABELS[dispute.reason] || dispute.reason}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right whitespace-nowrap font-bold text-foreground">
                        LKR {(dispute.task?.budget ?? 0).toLocaleString()}
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        <span className="font-medium text-foreground">
                          {dispute.raisedBy?.fullName || "Unknown"}
                        </span>
                      </TableCell>

                      <TableCell className="text-center whitespace-nowrap">
                        <Badge
                          variant={dispute.status === "OPEN" ? "destructive" : dispute.status === "UNDER_REVIEW" ? "secondary" : "outline"}
                          className={`text-[10px] font-semibold ${
                            dispute.status === "OPEN"
                              ? "bg-destructive/15 text-destructive font-bold"
                              : dispute.status === "UNDER_REVIEW"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              : dispute.status === "DISMISSED"
                              ? "text-muted-foreground border-border"
                              : "text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
                          }`}
                        >
                          {dispute.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant={dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW" ? "default" : "outline"}
                          className={`h-8 text-xs gap-1.5 cursor-pointer ${
                            dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW"
                              ? "bg-destructive hover:bg-destructive/90 text-white font-medium"
                              : ""
                          }`}
                          onClick={() => openArbitrationModal(dispute)}
                        >
                          {dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW" ? (
                            <Gavel className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                          <span>{dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW" ? "Arbitrate" : "View Case"}</span>
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
              Page <strong className="text-foreground">{page}</strong> of{" "}
              <strong className="text-foreground">{totalPages}</strong>
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

      {/* Arbitration Modal Dialog */}
      <Dialog open={!!selectedDispute} onOpenChange={(open) => !open && setSelectedDispute(null)}>
        {selectedDispute && (
          <DialogContent className="w-[95vw] sm:w-[92vw] md:max-w-4xl lg:max-w-5xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
            {/* Modal Header */}
            <DialogHeader className="p-4 sm:p-6 border-b bg-muted/10 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                    <Gavel className="h-5 w-5 text-destructive" />
                    <span>{selectedDispute.task?.title || "Dispute"}</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Case #{selectedDispute.id.slice(0, 8).toUpperCase()} · Task status: {selectedDispute.task?.status}
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Badge variant="outline" className="text-xs font-bold px-3 py-1 border-primary text-primary">
                    Job Value: LKR {(selectedDispute.task?.budget ?? 0).toLocaleString()}
                  </Badge>
                </div>
              </div>
            </DialogHeader>

            {/* Scrollable Inspection Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Dispute Reason & Statement */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Claim Statement by {selectedDispute.raisedBy?.fullName}
                  </span>
                  <Badge variant="destructive" className="text-[10px]">
                    Reason: {REASON_LABELS[selectedDispute.reason] || selectedDispute.reason}
                  </Badge>
                </div>
                <div className="p-4 rounded-xl border bg-muted/20 text-xs leading-relaxed text-foreground">
                  {selectedDispute.description}
                </div>
              </div>

              {/* Both Parties Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border-border/60 shadow-xs">
                  <CardHeader className="p-3 pb-1 border-b bg-muted/20">
                    <span className="text-[11px] font-semibold text-foreground">Raised By</span>
                  </CardHeader>
                  <CardContent className="p-3 text-xs flex items-center gap-2.5">
                    <Avatar className="h-8 w-8 border shrink-0">
                      <AvatarFallback className="text-[11px] font-semibold bg-muted">
                        {initialsOf(selectedDispute.raisedBy?.fullName || "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-semibold text-foreground block">
                        {selectedDispute.raisedBy?.fullName}
                      </span>
                      <span className="text-muted-foreground text-[11px]">
                        {selectedDispute.raisedBy?.email}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 shadow-xs">
                  <CardHeader className="p-3 pb-1 border-b bg-muted/20">
                    <span className="text-[11px] font-semibold text-foreground">Against</span>
                  </CardHeader>
                  <CardContent className="p-3 text-xs flex items-center gap-2.5">
                    <Avatar className="h-8 w-8 border shrink-0">
                      <AvatarFallback className="text-[11px] font-semibold bg-muted">
                        {initialsOf(selectedDispute.againstUser?.fullName || "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-semibold text-foreground block">
                        {selectedDispute.againstUser?.fullName}
                      </span>
                      <span className="text-muted-foreground text-[11px]">
                        {selectedDispute.againstUser?.email}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Evidence Photos Gallery */}
              {selectedDispute.evidenceUrls.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                    Submitted Evidence Photos ({selectedDispute.evidenceUrls.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedDispute.evidenceUrls.map((img, idx) => (
                      <div
                        key={idx}
                        className="border rounded-xl overflow-hidden bg-muted/30 p-2 flex items-center justify-center min-h-40"
                      >
                        <a href={img} target="_blank" rel="noopener noreferrer">
                          <img
                            src={img}
                            alt={`Evidence ${idx + 1}`}
                            className="max-h-40 w-auto rounded-lg object-contain"
                          />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolve Error */}
              {resolveError && (
                <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 text-xs text-destructive">
                  {resolveError}
                </div>
              )}

              {/* Resolution Note Section */}
              {selectedDispute.status === "OPEN" || selectedDispute.status === "UNDER_REVIEW" ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Arbitration Notes (optional, saved in the audit trail):
                  </label>
                  <Textarea
                    placeholder="Enter reason for the settlement decision..."
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    className="text-xs min-h-[70px]"
                  />
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs text-foreground space-y-1">
                  <div className="font-semibold text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      Case {selectedDispute.status === "DISMISSED" ? "Dismissed" : "Resolved"}
                      {selectedDispute.resolution ? `: ${RESOLUTION_LABELS[selectedDispute.resolution]}` : ""}
                    </span>
                  </div>
                  {selectedDispute.resolutionNotes && (
                    <p className="text-muted-foreground">{selectedDispute.resolutionNotes}</p>
                  )}
                  {selectedDispute.resolvedBy && (
                    <p className="text-muted-foreground text-[11px]">
                      — {selectedDispute.resolvedBy.fullName}
                      {selectedDispute.resolvedAt && `, ${new Date(selectedDispute.resolvedAt).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="w-full px-6 py-4 sm:px-8 sm:py-5 border-t bg-muted/20 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                className="h-10 px-5 text-xs font-medium"
                onClick={() => setSelectedDispute(null)}
                disabled={isResolving}
              >
                Close
              </Button>

              {(selectedDispute.status === "OPEN" || selectedDispute.status === "UNDER_REVIEW") && (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 px-3.5 text-xs text-muted-foreground gap-1.5"
                    disabled={isResolving}
                    onClick={() => submitResolution(selectedDispute.id, "DISMISSED")}
                  >
                    <Ban className="h-3.5 w-3.5" />
                    <span>Dismiss</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 px-3.5 text-xs text-slate-600 border-slate-400/40 hover:bg-slate-500/10 gap-1.5"
                    disabled={isResolving}
                    onClick={() => submitResolution(selectedDispute.id, "CANCELLED_NO_PENALTY")}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Cancel, no penalty</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 px-3.5 text-xs text-blue-600 border-blue-500/30 hover:bg-blue-500/10 gap-1.5"
                    disabled={isResolving}
                    onClick={() => submitResolution(selectedDispute.id, "REFUND_POSTER")}
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    <span>Refund poster</span>
                  </Button>
                  <Button
                    type="button"
                    className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
                    disabled={isResolving}
                    onClick={() => submitResolution(selectedDispute.id, "PAY_TASKER")}
                  >
                    {isResolving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    <span>Pay tasker</span>
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
