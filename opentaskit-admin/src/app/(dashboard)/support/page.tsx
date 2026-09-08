"use client";

import * as React from "react";
import Link from "next/link";
import {
  LifeBuoy,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Send,
  ExternalLink,
  ImageIcon,
  User,
  Phone,
  Mail,
  HelpCircle,
  FileText,
} from "lucide-react";

import { MOCK_TICKETS, SupportTicketRecord } from "@/data/mock-data";
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

export default function SupportPage() {
  const [tickets, setTickets] = React.useState<SupportTicketRecord[]>(MOCK_TICKETS);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [selectedTicket, setSelectedTicket] = React.useState<SupportTicketRecord | null>(null);
  const [resolutionNote, setResolutionNote] = React.useState<string>("");
  const [notifyUser, setNotifyUser] = React.useState<boolean>(true);

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.taskRef && t.taskRef.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      categoryFilter === "ALL" || t.category === categoryFilter;

    const matchesStatus =
      statusFilter === "ALL" || t.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleSetInProgress = (id: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "IN_PROGRESS" } : t))
    );
    if (selectedTicket?.id === id) {
      setSelectedTicket((prev) => (prev ? { ...prev, status: "IN_PROGRESS" } : null));
    }
  };

  const handleResolveTicket = (id: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: "RESOLVED",
              adminResolutionNote:
                resolutionNote.trim() ||
                "Issue investigated and resolved by platform administrator.",
              resolvedAt: new Date().toISOString(),
            }
          : t
      )
    );
    setSelectedTicket(null);
    setResolutionNote("");
  };

  const openInspectionModal = (ticket: SupportTicketRecord) => {
    setSelectedTicket(ticket);
    setResolutionNote(ticket.adminResolutionNote || "");
  };

  const openCount = tickets.filter((t) => t.status === "OPEN").length;
  const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED").length;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Support Tickets & Problem Reports
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Inbox for user issue reports submitted from the mobile app (wallet issues, login errors, bugs, and safety flags).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-semibold text-destructive border-destructive/30 bg-destructive/5 px-3 py-1 gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{openCount} Open Reports</span>
          </Badge>
        </div>
      </div>

      {/* Metrics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Total Tickets</div>
            <div className="text-xl font-bold text-foreground mt-0.5">{tickets.length}</div>
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
                placeholder="Search ticket ID, user, email, description, task ref..."
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
                  <SelectItem value="OPEN">Open Only</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 w-44 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  <SelectItem value="Task or provider issue">Task/Provider</SelectItem>
                  <SelectItem value="Payment or wallet">Payment/Wallet</SelectItem>
                  <SelectItem value="Account & login">Account/Login</SelectItem>
                  <SelectItem value="Safety & trust">Safety & Trust</SelectItem>
                  <SelectItem value="App bug / technical">Bug/Technical</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        {/* Tickets Table */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Ticket ID</TableHead>
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
                {filteredTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-xs text-muted-foreground">
                      No support tickets found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id} className="text-xs hover:bg-muted/40">
                      {/* Ticket ID */}
                      <TableCell className="font-mono font-semibold text-foreground whitespace-nowrap">
                        {ticket.id}
                      </TableCell>

                      {/* Reporter */}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{ticket.userName}</span>
                          <span className="text-[11px] text-muted-foreground">{ticket.userEmail}</span>
                        </div>
                      </TableCell>

                      {/* Category */}
                      <TableCell className="whitespace-nowrap">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-medium ${
                            ticket.category.includes("Payment")
                              ? "bg-emerald-500/10 text-emerald-600"
                              : ticket.category.includes("Safety")
                              ? "bg-destructive/10 text-destructive font-semibold"
                              : ticket.category.includes("Bug")
                              ? "bg-purple-500/10 text-purple-600"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          {ticket.category}
                        </Badge>
                      </TableCell>

                      {/* Description */}
                      <TableCell>
                        <div className="flex items-center gap-2 max-w-xs truncate text-muted-foreground">
                          {ticket.images.length > 0 && (
                            <span className="flex items-center gap-0.5 text-primary text-[10px] shrink-0 font-medium">
                              <ImageIcon className="h-3 w-3" />
                              {ticket.images.length}
                            </span>
                          )}
                          <span className="truncate">{ticket.description}</span>
                        </div>
                      </TableCell>

                      {/* Task Ref */}
                      <TableCell className="whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                        {ticket.taskRef || "—"}
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {new Date(ticket.createdAt).toLocaleDateString("en-US", {
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
                            ticket.status === "OPEN"
                              ? "destructive"
                              : ticket.status === "IN_PROGRESS"
                              ? "secondary"
                              : "outline"
                          }
                          className={`text-[10px] font-semibold ${
                            ticket.status === "OPEN"
                              ? "bg-destructive/15 text-destructive font-bold"
                              : ticket.status === "IN_PROGRESS"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              : "text-emerald-600 border-emerald-500/30"
                          }`}
                        >
                          {ticket.status === "OPEN"
                            ? "Open"
                            : ticket.status === "IN_PROGRESS"
                            ? "In Progress"
                            : "Resolved"}
                        </Badge>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant={ticket.status === "OPEN" ? "default" : "outline"}
                          className={`h-8 text-xs gap-1.5 ${
                            ticket.status === "OPEN"
                              ? "bg-[#0094F7] hover:bg-[#007cd6] text-white"
                              : ""
                          }`}
                          onClick={() => openInspectionModal(ticket)}
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

      {/* Ticket Inspection & Resolution Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        {selectedTicket && (
          <DialogContent className="w-[95vw] sm:w-[92vw] md:max-w-3xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
            {/* Header */}
            <DialogHeader className="p-6 border-b bg-muted/10 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                    <LifeBuoy className="h-5 w-5 text-primary" />
                    <span>Support Ticket: {selectedTicket.id}</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Category: {selectedTicket.category} · Submitted {new Date(selectedTicket.createdAt).toLocaleString()}
                  </DialogDescription>
                </div>
                <Badge
                  variant={selectedTicket.status === "OPEN" ? "destructive" : "secondary"}
                  className="text-xs font-semibold self-start sm:self-auto px-3 py-1"
                >
                  {selectedTicket.status}
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
                <div className="p-4 rounded-xl border bg-muted/20 text-xs leading-relaxed text-foreground whitespace-pre-line">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Reporter Contact Info Card */}
              <div className="p-4 rounded-xl border bg-muted/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border">
                    <AvatarFallback className="text-xs font-semibold bg-muted">
                      {selectedTicket.userName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="font-semibold text-foreground block">
                      {selectedTicket.userName}
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      {selectedTicket.userEmail} · {selectedTicket.userPhone}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                  <Link href={`/users/${selectedTicket.userId}`}>
                    <span>View User Profile</span>
                  </Link>
                </Button>
              </div>

              {/* Attached Screenshot Evidence */}
              {selectedTicket.images.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                    Attached Screenshots ({selectedTicket.images.length})
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedTicket.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="border rounded-xl overflow-hidden bg-muted/30 p-2 flex items-center justify-center min-h-[160px]"
                      >
                        <img
                          src={img}
                          alt={`Attachment ${idx + 1}`}
                          className="max-h-48 w-auto rounded-lg object-contain"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution Form or Saved Note */}
              {selectedTicket.status !== "RESOLVED" ? (
                <div className="space-y-2 pt-2 border-t">
                  <label className="text-xs font-semibold text-foreground">
                    Admin Resolution Note:
                  </label>
                  <Textarea
                    placeholder="Enter resolution notes and steps taken to resolve this problem report..."
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    className="text-xs min-h-[80px]"
                  />
                  <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      id="notifyUserCheckbox"
                      checked={notifyUser}
                      onChange={(e) => setNotifyUser(e.target.checked)}
                      className="rounded border"
                    />
                    <label htmlFor="notifyUserCheckbox" className="cursor-pointer">
                      Send resolution confirmation email to user ({selectedTicket.userEmail})
                    </label>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs text-foreground space-y-1">
                  <div className="font-semibold text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Report Resolved</span>
                  </div>
                  <p className="text-muted-foreground">{selectedTicket.adminResolutionNote}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="w-full px-6 py-4 border-t bg-muted/20 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                className="h-10 px-5 text-xs font-medium"
                onClick={() => setSelectedTicket(null)}
              >
                Close
              </Button>

              {selectedTicket.status !== "RESOLVED" && (
                <div className="flex flex-wrap items-center gap-3">
                  {selectedTicket.status === "OPEN" && (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 px-5 text-xs text-amber-600 border-amber-500/30 hover:bg-amber-500/10 font-medium"
                      onClick={() => handleSetInProgress(selectedTicket.id)}
                    >
                      <span>Mark In Progress</span>
                    </Button>
                  )}

                  <Button
                    type="button"
                    className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
                    onClick={() => handleResolveTicket(selectedTicket.id)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Resolve Ticket</span>
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
