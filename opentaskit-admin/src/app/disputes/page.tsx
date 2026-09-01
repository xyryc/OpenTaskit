"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Wallet,
  Clock,
  User,
  ExternalLink,
  Gavel,
  ShieldCheck,
  RotateCcw,
  ArrowRight,
} from "lucide-react";

import { MOCK_DISPUTES, DisputeRecord } from "@/data/mock-data";
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

export default function DisputesPage() {
  const [disputes, setDisputes] = React.useState<DisputeRecord[]>(MOCK_DISPUTES);
  const [selectedDispute, setSelectedDispute] = React.useState<DisputeRecord | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>("OPEN");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [resolutionNote, setResolutionNote] = React.useState<string>("");

  const filteredDisputes = disputes.filter((d) => {
    const matchesSearch =
      d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.taskTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.initiatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.respondentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.reason.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "OPEN" && d.status === "OPEN") ||
      (statusFilter === "RESOLVED" && d.status !== "OPEN");

    return matchesSearch && matchesStatus;
  });

  const openArbitrationModal = (dispute: DisputeRecord) => {
    setSelectedDispute(dispute);
    setResolutionNote(dispute.resolutionNote || "");
  };

  const handleResolveRefundPoster = (id: string) => {
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: "REFUNDED_TO_POSTER",
              resolutionNote:
                resolutionNote.trim() ||
                "Admin arbitrated: 100% escrow refund issued to poster.",
              resolvedAt: new Date().toISOString(),
            }
          : d
      )
    );
    setSelectedDispute(null);
    setResolutionNote("");
  };

  const handleResolveReleaseProvider = (id: string) => {
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: "RELEASED_TO_PROVIDER",
              resolutionNote:
                resolutionNote.trim() ||
                "Admin arbitrated: 100% escrow payout released to provider.",
              resolvedAt: new Date().toISOString(),
            }
          : d
      )
    );
    setSelectedDispute(null);
    setResolutionNote("");
  };

  const openCount = disputes.filter((d) => d.status === "OPEN").length;
  const lockedEscrowTotal = disputes
    .filter((d) => d.status === "OPEN")
    .reduce((acc, d) => acc + d.escrowAmount, 0);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Dispute Resolution & Arbitration
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Arbitrate contested jobs, review submitted evidence, and distribute escrow funds between posters and providers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-xs font-semibold px-3 py-1 gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{openCount} Active Disputes</span>
          </Badge>
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Active Disputed Cases</div>
            <div className="text-xl font-bold text-destructive mt-0.5">{openCount} Cases</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Disputed Escrow Locked</div>
            <div className="text-xl font-bold text-foreground mt-0.5">
              LKR {lockedEscrowTotal.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Resolved Arbitrations</div>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">
              {disputes.filter((d) => d.status !== "OPEN").length} Cases
            </div>
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
                placeholder="Search case ID, task title, reason, party names..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-40 text-xs">
                  <SelectValue placeholder="Status filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Open Disputes Only</SelectItem>
                  <SelectItem value="RESOLVED">Resolved Cases</SelectItem>
                  <SelectItem value="ALL">All Disputes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        {/* Disputes Table */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Case ID</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Task Title</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Dispute Reason</TableHead>
                  <TableHead className="text-xs font-semibold text-right whitespace-nowrap">Escrow Locked</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Claimant</TableHead>
                  <TableHead className="text-xs font-semibold text-center whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right whitespace-nowrap">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDisputes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                      No dispute cases found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDisputes.map((dispute) => (
                    <TableRow key={dispute.id} className="text-xs hover:bg-muted/40">
                      <TableCell className="font-mono font-semibold text-foreground whitespace-nowrap">
                        {dispute.id}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-0.5 max-w-xs">
                          <span className="font-semibold text-foreground truncate block">
                            {dispute.taskTitle}
                          </span>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {dispute.taskId}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className="text-[10px] font-medium border-destructive/30 text-destructive bg-destructive/5">
                          {dispute.reason}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right whitespace-nowrap font-bold text-foreground">
                        LKR {dispute.escrowAmount.toLocaleString()}
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{dispute.initiatorName}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {dispute.initiatorRole === "POSTER" ? "Job Poster" : "Service Provider"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-center whitespace-nowrap">
                        <Badge
                          variant={dispute.status === "OPEN" ? "destructive" : "outline"}
                          className={`text-[10px] font-semibold ${
                            dispute.status === "OPEN"
                              ? "bg-destructive/15 text-destructive font-bold"
                              : dispute.status === "REFUNDED_TO_POSTER"
                              ? "text-blue-600 border-blue-500/30 bg-blue-500/10"
                              : "text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
                          }`}
                        >
                          {dispute.status === "OPEN"
                            ? "Action Required"
                            : dispute.status === "REFUNDED_TO_POSTER"
                            ? "Refunded to Poster"
                            : "Released to Provider"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant={dispute.status === "OPEN" ? "default" : "outline"}
                          className={`h-8 text-xs gap-1.5 ${
                            dispute.status === "OPEN"
                              ? "bg-destructive hover:bg-destructive/90 text-white font-medium"
                              : ""
                          }`}
                          onClick={() => openArbitrationModal(dispute)}
                        >
                          <Gavel className="h-3.5 w-3.5" />
                          <span>{dispute.status === "OPEN" ? "Arbitrate" : "View Case"}</span>
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
                    <span>Dispute Arbitration: {selectedDispute.id}</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Task: {selectedDispute.taskTitle} ({selectedDispute.taskId})
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Badge variant="outline" className="text-xs font-bold px-3 py-1 border-primary text-primary">
                    Escrow Locked: LKR {selectedDispute.escrowAmount.toLocaleString()}
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
                    Claim Statement by {selectedDispute.initiatorName} ({selectedDispute.initiatorRole})
                  </span>
                  <Badge variant="destructive" className="text-[10px]">
                    Reason: {selectedDispute.reason}
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
                    <span className="text-[11px] font-semibold text-foreground">
                      Job Poster (Payer)
                    </span>
                  </CardHeader>
                  <CardContent className="p-3 text-xs">
                    <span className="font-semibold text-foreground block">
                      {selectedDispute.initiatorRole === "POSTER"
                        ? selectedDispute.initiatorName
                        : selectedDispute.respondentName}
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      {selectedDispute.initiatorRole === "POSTER"
                        ? selectedDispute.initiatorEmail
                        : selectedDispute.respondentEmail}
                    </span>
                  </CardContent>
                </Card>

                <Card className="border-border/60 shadow-xs">
                  <CardHeader className="p-3 pb-1 border-b bg-muted/20">
                    <span className="text-[11px] font-semibold text-foreground">
                      Service Provider (Worker)
                    </span>
                  </CardHeader>
                  <CardContent className="p-3 text-xs">
                    <span className="font-semibold text-foreground block">
                      {selectedDispute.initiatorRole === "PROVIDER"
                        ? selectedDispute.initiatorName
                        : selectedDispute.respondentName}
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      {selectedDispute.initiatorRole === "PROVIDER"
                        ? selectedDispute.initiatorEmail
                        : selectedDispute.respondentEmail}
                    </span>
                  </CardContent>
                </Card>
              </div>

              {/* Evidence Photos Gallery */}
              {selectedDispute.evidenceImages.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                    Submitted Evidence Photos ({selectedDispute.evidenceImages.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedDispute.evidenceImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="border rounded-xl overflow-hidden bg-muted/30 p-2 flex items-center justify-center min-h-[160px]"
                      >
                        <img
                          src={img}
                          alt={`Evidence ${idx + 1}`}
                          className="max-h-40 w-auto rounded-lg object-contain"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution Note Section */}
              {selectedDispute.status === "OPEN" ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Arbitration Reason / Settlement Note (Saved in audit ledger):
                  </label>
                  <Textarea
                    placeholder="Enter reason for settlement decision..."
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    className="text-xs min-h-[70px]"
                  />
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs text-foreground space-y-1">
                  <div className="font-semibold text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Case Resolved: {selectedDispute.status.replace(/_/g, " ")}</span>
                  </div>
                  <p className="text-muted-foreground">{selectedDispute.resolutionNote}</p>
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
              >
                Close
              </Button>

              {selectedDispute.status === "OPEN" && (
                <div className="flex flex-wrap items-center gap-3">
                  {/* Outcome 1: 100% Refund to Poster */}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 px-5 text-xs text-blue-600 border-blue-500/30 hover:bg-blue-500/10 font-semibold gap-1.5"
                    onClick={() => handleResolveRefundPoster(selectedDispute.id)}
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>100% Refund to Poster</span>
                  </Button>

                  {/* Outcome 2: 100% Release to Provider */}
                  <Button
                    type="button"
                    className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
                    onClick={() => handleResolveReleaseProvider(selectedDispute.id)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>100% Release to Provider</span>
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
