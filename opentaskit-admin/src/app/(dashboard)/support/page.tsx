"use client";

import * as React from "react";
import Link from "next/link";
import {
  LifeBuoy,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  ExternalLink,
  ImageIcon,
  Phone,
  Mail,
  RefreshCw,
  MessageSquare,
  XCircle,
} from "lucide-react";

import { adminFetch } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type ReportCategory =
  | "TASK_OR_PROVIDER_ISSUE"
  | "PAYMENT_OR_WALLET"
  | "ACCOUNT_AND_LOGIN"
  | "SAFETY_AND_TRUST"
  | "APP_BUG_TECHNICAL"
  | "OTHER";

export type ReportStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "DISMISSED";

export interface ProblemReportItem {
  id: string;
  userId: string;
  category: ReportCategory;
  description: string;
  taskRef: string | null;
  images: string[];
  status: ReportStatus;
  adminNotes: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    avatarUrl?: string | null;
  };
}

const CATEGORY_LABELS: Record<ReportCategory, string> = {
  TASK_OR_PROVIDER_ISSUE: "Task / Provider Issue",
  PAYMENT_OR_WALLET: "Payment & Wallet",
  ACCOUNT_AND_LOGIN: "Account & Login",
  SAFETY_AND_TRUST: "Safety & Trust",
  APP_BUG_TECHNICAL: "App Bug / Technical",
  OTHER: "Other Issue",
};

export default function SupportPage() {
  const [reports, setReports] = React.useState<ProblemReportItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  const [selectedReport, setSelectedReport] = React.useState<ProblemReportItem | null>(null);
  const [targetStatus, setTargetStatus] = React.useState<ReportStatus>("OPEN");
  const [adminNotes, setAdminNotes] = React.useState<string>("");
  const [isUpdating, setIsUpdating] = React.useState<boolean>(false);
  const [updateError, setUpdateError] = React.useState<string | null>(null);

  const loadReports = React.useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await adminFetch(`/api/backend/admin/reports?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load problem reports (HTTP ${res.status})`);
      }
      const data = await res.json();
      setReports(data.data || []);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, categoryFilter, searchQuery]);

  React.useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadReports(true);
  };

  const openInspectionModal = (report: ProblemReportItem) => {
    setSelectedReport(report);
    setTargetStatus(report.status);
    setAdminNotes(report.adminNotes || "");
    setUpdateError(null);
  };

  const handleSaveStatus = async () => {
    if (!selectedReport) return;
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const res = await adminFetch(`/api/backend/admin/reports/${selectedReport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          adminNotes: adminNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || `Failed to update report (HTTP ${res.status})`);
      }

      const updated = await res.json();
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSelectedReport(updated);
    } catch (err: unknown) {
      setUpdateError(err instanceof Error ? err.message : "Failed to update report");
    } finally {
      setIsUpdating(false);
    }
  };

  const openCount = reports.filter((r) => r.status === "OPEN").length;
  const inProgressCount = reports.filter((r) => r.status === "IN_PROGRESS").length;
  const resolvedCount = reports.filter((r) => r.status === "RESOLVED").length;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-[#0094F7]" />
            <span>Problem Reports & Customer Support Desk</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage live user issue reports submitted from the mobile app (wallet issues, login errors, bugs, and safety flags).
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Badge
            variant="outline"
            className="text-xs font-semibold text-destructive border-destructive/30 bg-destructive/5 px-3 py-1 gap-1.5"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{openCount} Open Reports</span>
          </Badge>
        </div>
      </div>

      {/* Metrics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Total Reports</div>
            <div className="text-xl font-bold text-foreground mt-0.5">{reports.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Open (Unassigned)</div>
            <div className="text-xl font-bold text-destructive mt-0.5">{openCount}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Under Investigation</div>
            <div className="text-xl font-bold text-amber-500 mt-0.5">{inProgressCount}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Resolved</div>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">{resolvedCount}</div>
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
                placeholder="Search report ID, user, description, task ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs w-full"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-36 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="DISMISSED">Dismissed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 w-48 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  <SelectItem value="TASK_OR_PROVIDER_ISSUE">Task / Provider Issue</SelectItem>
                  <SelectItem value="PAYMENT_OR_WALLET">Payment & Wallet</SelectItem>
                  <SelectItem value="ACCOUNT_AND_LOGIN">Account & Login</SelectItem>
                  <SelectItem value="SAFETY_AND_TRUST">Safety & Trust</SelectItem>
                  <SelectItem value="APP_BUG_TECHNICAL">Bug / Technical</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        {/* Table Content */}
        <CardContent className="p-0">
          {fetchError ? (
            <div className="p-8 text-center text-xs text-destructive">
              {fetchError}
            </div>
          ) : loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              Loading problem reports...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold whitespace-nowrap">Report ID</TableHead>
                    <TableHead className="text-xs font-semibold whitespace-nowrap">Reporter</TableHead>
                    <TableHead className="text-xs font-semibold whitespace-nowrap">Category</TableHead>
                    <TableHead className="text-xs font-semibold whitespace-nowrap">Issue Description</TableHead>
                    <TableHead className="text-xs font-semibold whitespace-nowrap">Task Ref</TableHead>
                    <TableHead className="text-xs font-semibold whitespace-nowrap">Date</TableHead>
                    <TableHead className="text-xs font-semibold text-center whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-right whitespace-nowrap">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-xs text-muted-foreground">
                        No problem reports found matching your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((report) => (
                      <TableRow key={report.id} className="text-xs hover:bg-muted/40">
                        {/* ID */}
                        <TableCell className="font-mono font-semibold text-foreground whitespace-nowrap">
                          #{report.id.slice(0, 8)}
                        </TableCell>

                        {/* Reporter */}
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-7 w-7 border">
                              {report.user.avatarUrl && (
                                <AvatarImage src={report.user.avatarUrl} alt={report.user.fullName} />
                              )}
                              <AvatarFallback className="text-[10px] font-semibold bg-muted">
                                {report.user.fullName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground">{report.user.fullName}</span>
                              <span className="text-[11px] text-muted-foreground">{report.user.email}</span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Category */}
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] font-medium ${
                              report.category === "PAYMENT_OR_WALLET"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : report.category === "SAFETY_AND_TRUST"
                                ? "bg-destructive/10 text-destructive font-semibold"
                                : report.category === "APP_BUG_TECHNICAL"
                                ? "bg-purple-500/10 text-purple-600"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            {CATEGORY_LABELS[report.category] || report.category}
                          </Badge>
                        </TableCell>

                        {/* Description Preview */}
                        <TableCell>
                          <div className="flex items-center gap-2 max-w-xs truncate text-muted-foreground">
                            {report.images.length > 0 && (
                              <span className="flex items-center gap-0.5 text-[#0094F7] text-[10px] shrink-0 font-medium">
                                <ImageIcon className="h-3 w-3" />
                                {report.images.length}
                              </span>
                            )}
                            <span className="truncate">{report.description}</span>
                          </div>
                        </TableCell>

                        {/* Task Ref */}
                        <TableCell className="whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                          {report.taskRef || "—"}
                        </TableCell>

                        {/* Date */}
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {new Date(report.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="text-center whitespace-nowrap">
                          <Badge
                            variant={
                              report.status === "OPEN"
                                ? "destructive"
                                : report.status === "IN_PROGRESS"
                                ? "secondary"
                                : report.status === "RESOLVED"
                                ? "outline"
                                : "secondary"
                            }
                            className={`text-[10px] font-semibold ${
                              report.status === "OPEN"
                                ? "bg-destructive/15 text-destructive font-bold"
                                : report.status === "IN_PROGRESS"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                : report.status === "RESOLVED"
                                ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/5"
                                : "text-muted-foreground bg-muted"
                            }`}
                          >
                            {report.status.replace("_", " ")}
                          </Badge>
                        </TableCell>

                        {/* Action */}
                        <TableCell className="text-right whitespace-nowrap">
                          <Button
                            size="sm"
                            variant={report.status === "OPEN" ? "default" : "outline"}
                            className={`h-8 text-xs gap-1.5 ${
                              report.status === "OPEN"
                                ? "bg-[#0094F7] hover:bg-[#007cd6] text-white"
                                : ""
                            }`}
                            onClick={() => openInspectionModal(report)}
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
          )}
        </CardContent>
      </Card>

      {/* Ticket Inspection & Resolution Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        {selectedReport && (
          <DialogContent className="w-[95vw] sm:w-[92vw] md:max-w-3xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
            {/* Header */}
            <DialogHeader className="p-6 border-b bg-muted/10 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                    <LifeBuoy className="h-5 w-5 text-[#0094F7]" />
                    <span>Report #{selectedReport.id.slice(0, 8)}</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Category: {CATEGORY_LABELS[selectedReport.category] || selectedReport.category} · Submitted {new Date(selectedReport.createdAt).toLocaleString()}
                  </DialogDescription>
                </div>
                <Badge
                  variant={selectedReport.status === "OPEN" ? "destructive" : "secondary"}
                  className="text-xs font-semibold self-start sm:self-auto px-3 py-1"
                >
                  {selectedReport.status.replace("_", " ")}
                </Badge>
              </div>
            </DialogHeader>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* User Description */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Reported Issue Description
                </span>
                <div className="p-4 rounded-xl border bg-muted/20 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                  {selectedReport.description}
                </div>
              </div>

              {/* Task Ref if present */}
              {selectedReport.taskRef && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Associated Task / Reference
                  </span>
                  <div className="p-3 rounded-lg border bg-muted/10 text-xs font-mono text-foreground flex items-center gap-2">
                    <span>{selectedReport.taskRef}</span>
                  </div>
                </div>
              )}

              {/* Reporter Contact Info Card */}
              <div className="p-4 rounded-xl border bg-muted/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 border shadow-xs">
                    {selectedReport.user.avatarUrl && (
                      <AvatarImage src={selectedReport.user.avatarUrl} alt={selectedReport.user.fullName} />
                    )}
                    <AvatarFallback className="text-xs font-semibold bg-muted">
                      {selectedReport.user.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="font-semibold text-foreground text-sm block">
                      {selectedReport.user.fullName}
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      {selectedReport.user.email}
                      {selectedReport.user.phoneNumber && selectedReport.user.phoneNumber.replace(/[^0-9]/g, "").length >= 7
                        ? ` · ${selectedReport.user.phoneNumber}`
                        : " · (No phone number set)"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {Boolean(
                    selectedReport.user.phoneNumber &&
                    selectedReport.user.phoneNumber.trim().length > 0 &&
                    selectedReport.user.phoneNumber.replace(/[^0-9]/g, "").length >= 7
                  ) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                      asChild
                    >
                      <a
                        href={`https://wa.me/${selectedReport.user.phoneNumber!.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                          `Hello ${selectedReport.user.fullName}, this is OpenTaskit Support regarding your report #${selectedReport.id.slice(0, 8)}.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Chat WhatsApp</span>
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                    <Link href={`/users/${selectedReport.user.id}`}>
                      <span>View Profile</span>
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Attached Screenshot Evidence */}
              {selectedReport.images && selectedReport.images.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                    Attached Screenshots ({selectedReport.images.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {selectedReport.images.map((img, idx) => (
                      <a
                        key={idx}
                        href={img}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative border rounded-xl overflow-hidden bg-muted/30 p-2 flex items-center justify-center min-h-[140px] hover:border-[#0094F7] transition-all"
                      >
                        <img
                          src={img}
                          alt={`Attachment ${idx + 1}`}
                          className="max-h-36 w-auto rounded-lg object-contain group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/60 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="h-3 w-3" />
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution Form */}
              <div className="space-y-3 pt-3 border-t">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <label className="text-xs font-semibold text-foreground">
                    Update Report Status & Admin Notes:
                  </label>
                  <div className="w-48">
                    <Select
                      value={targetStatus}
                      onValueChange={(val) => setTargetStatus(val as ReportStatus)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="DISMISSED">Dismissed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Textarea
                  placeholder="Enter investigation notes, resolution steps taken, or follow-up details..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="text-xs min-h-[90px]"
                />

                {updateError && (
                  <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">
                    {updateError}
                  </div>
                )}

                {selectedReport.resolvedAt && (
                  <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-xs text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      Resolved on {new Date(selectedReport.resolvedAt).toLocaleString()}
                      {selectedReport.resolvedBy ? ` by ${selectedReport.resolvedBy}` : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="w-full px-6 py-4 border-t bg-muted/20 shrink-0 flex items-center justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                className="h-9 px-4 text-xs font-medium"
                onClick={() => setSelectedReport(null)}
              >
                Close
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  disabled={isUpdating}
                  className="h-9 px-5 bg-[#0094F7] hover:bg-[#007cd6] text-white text-xs font-semibold gap-1.5 shadow-sm"
                  onClick={handleSaveStatus}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isUpdating ? "Saving..." : "Save Changes"}</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
