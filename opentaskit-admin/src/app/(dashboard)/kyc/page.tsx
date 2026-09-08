"use client";

import * as React from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

import { MOCK_KYC_SUBMISSIONS, KycSubmission } from "@/data/mock-data";
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
  DialogFooter,
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

export default function KycPage() {
  const [submissions, setSubmissions] = React.useState<KycSubmission[]>(MOCK_KYC_SUBMISSIONS);
  const [selectedSubmission, setSelectedSubmission] = React.useState<KycSubmission | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>("PENDING");
  const [rejectionReason, setRejectionReason] = React.useState<string>("");
  const [showRejectForm, setShowRejectForm] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.idNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleApprove = (id: string) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "APPROVED" } : s))
    );
    setSelectedSubmission(null);
    setShowRejectForm(false);
  };

  const handleReject = (id: string) => {
    if (!rejectionReason.trim()) return;
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: "REJECTED",
              reviewerNote: rejectionReason,
            }
          : s
      )
    );
    setSelectedSubmission(null);
    setShowRejectForm(false);
    setRejectionReason("");
  };

  const openInspectionModal = (submission: KycSubmission) => {
    setSelectedSubmission(submission);
    setShowRejectForm(false);
    setRejectionReason("");
  };

  const setQuickRejectionReason = (reason: string) => {
    setRejectionReason(reason);
  };

  const pendingCount = submissions.filter((s) => s.status === "PENDING").length;

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
            <span>{pendingCount} Pending Reviews</span>
          </Badge>
        </div>
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-40 text-xs">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Submissions</SelectItem>
                  <SelectItem value="PENDING">Pending Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
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
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Account Role</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Submitted Date</TableHead>
                  <TableHead className="text-xs font-semibold text-center whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right whitespace-nowrap">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                      No KYC submissions found matching the criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubmissions.map((sub) => (
                    <TableRow key={sub.id} className="text-xs hover:bg-muted/40">
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <Avatar className="h-8 w-8 border shrink-0">
                            <AvatarFallback className="text-[11px] font-semibold bg-muted">
                              {sub.userName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-semibold text-foreground block">
                              {sub.userName}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {sub.userEmail}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className="text-[10px] font-medium">
                          National ID (NIC)
                        </Badge>
                      </TableCell>

                      <TableCell className="font-mono text-xs font-medium text-foreground whitespace-nowrap">
                        {sub.idNumber}
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        <Badge variant="secondary" className="text-[10px]">
                          {sub.accountRole}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {new Date(sub.submittedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>

                      <TableCell className="text-center whitespace-nowrap">
                        <Badge
                          variant={sub.status === "APPROVED" ? "outline" : sub.status === "PENDING" ? "secondary" : "destructive"}
                          className={`text-[10px] font-semibold ${
                            sub.status === "APPROVED"
                              ? "text-emerald-600 border-emerald-500/30"
                              : sub.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              : "bg-destructive/15 text-destructive"
                          }`}
                        >
                          {sub.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant={sub.status === "PENDING" ? "default" : "outline"}
                          className={`h-8 text-xs gap-1.5 ${
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
        </CardContent>
      </Card>

      {/* KYC Inspection Modal Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        {selectedSubmission && (
          <DialogContent className="w-[95vw] sm:w-[92vw] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
            {/* Modal Header */}
            <DialogHeader className="p-4 sm:p-6 border-b bg-muted/10 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border shrink-0">
                    <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
                      {selectedSubmission.userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                      <span>{selectedSubmission.userName}</span>
                      <Badge
                        variant={selectedSubmission.status === "APPROVED" ? "outline" : "secondary"}
                        className="text-[10px]"
                      >
                        {selectedSubmission.status}
                      </Badge>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                      <span>National ID: {selectedSubmission.idNumber}</span>
                      <span>•</span>
                      <span>{selectedSubmission.userEmail}</span>
                      <span>•</span>
                      <span>{selectedSubmission.userPhone}</span>
                    </DialogDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1">
                    National ID (NIC) Verification
                  </Badge>
                </div>
              </div>
            </DialogHeader>

            {/* Scrollable Inspection Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Document Photos Grid (3 Columns on Desktop, 2 on Tablet, 1 on Mobile) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Front Side Document */}
                <Card className="border-border/60 overflow-hidden shadow-xs flex flex-col">
                  <CardHeader className="p-3 border-b bg-muted/20 flex flex-row items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      1. National ID (Front)
                    </span>
                    <a
                      href={selectedSubmission.frontImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Full</span>
                    </a>
                  </CardHeader>
                  <CardContent className="p-4 flex-1 flex items-center justify-center bg-muted/30 min-h-[260px]">
                    <img
                      src={selectedSubmission.frontImageUrl}
                      alt="National ID Front"
                      className="max-h-64 w-auto max-w-full rounded-xl object-contain border shadow-sm"
                    />
                  </CardContent>
                </Card>

                {/* 2. Back Side Document */}
                <Card className="border-border/60 overflow-hidden shadow-xs flex flex-col">
                  <CardHeader className="p-3 border-b bg-muted/20 flex flex-row items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      2. National ID (Back)
                    </span>
                    {selectedSubmission.backImageUrl && (
                      <a
                        href={selectedSubmission.backImageUrl}
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
                    {selectedSubmission.backImageUrl ? (
                      <img
                        src={selectedSubmission.backImageUrl}
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
                    <a
                      href={selectedSubmission.selfieImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Full</span>
                    </a>
                  </CardHeader>
                  <CardContent className="p-4 flex-1 flex items-center justify-center bg-muted/30 min-h-[260px]">
                    <img
                      src={selectedSubmission.selfieImageUrl}
                      alt="Live Selfie Check"
                      className="max-h-64 w-auto max-w-full rounded-xl object-contain border shadow-sm"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Rejection Form with Quick Reasons */}
              {showRejectForm && (
                <div className="flex flex-col gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Specify Rejection Reason (Sent to user notification & email)</span>
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
              {selectedSubmission.reviewerNote && (
                <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 text-xs text-destructive">
                  <strong className="block font-semibold mb-1">Previous Rejection Note:</strong>
                  {selectedSubmission.reviewerNote}
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
                    >
                      <XCircle className="h-4 w-4 mr-1.5" />
                      <span>Reject KYC</span>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="destructive"
                      className="h-10 px-5 text-xs font-medium"
                      disabled={!rejectionReason.trim()}
                      onClick={() => handleReject(selectedSubmission.id)}
                    >
                      Confirm Rejection
                    </Button>
                  )}

                  <Button
                    type="button"
                    className="h-10 px-6 sm:px-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold shadow-sm text-xs"
                    onClick={() => handleApprove(selectedSubmission.id)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
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
