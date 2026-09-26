"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  ShieldCheck,
  MoreHorizontal,
  Eye,
  Ban,
  RotateCcw,
  Star,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";

import type { AdminUserListItem, AdminUsersStats, PaginatedUsersResponse } from "@/types/user";
import { adminFetch } from "@/lib/api-client";
import { exportToCsv, CsvColumn } from "@/lib/export-csv";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  // Data and Pagination
  const [users, setUsers] = React.useState<AdminUserListItem[]>([]);
  const [totalUsers, setTotalUsers] = React.useState<number>(0);
  const [totalPages, setTotalPages] = React.useState<number>(1);
  const [page, setPage] = React.useState<number>(1);
  const limit = 10;

  // Stats
  const [stats, setStats] = React.useState<AdminUsersStats>({
    totalUsers: 0,
    totalRegularUsers: 0,
    totalAdmins: 0,
    totalSuspended: 0,
    totalVerified: 0,
    totalPendingKyc: 0,
  });

  // State flags
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [successBanner, setSuccessBanner] = React.useState<string | null>(null);

  // Moderation Dialog State
  const [selectedUserForAction, setSelectedUserForAction] = React.useState<AdminUserListItem | null>(null);
  const [isActionLoading, setIsActionLoading] = React.useState<boolean>(false);

  // Debounce search input (300ms)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Users from Backend API
  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }
      if (roleFilter !== "ALL") {
        params.append("role", roleFilter);
      }
      if (statusFilter !== "ALL") {
        params.append("status", statusFilter);
      }

      const res = await adminFetch(`/api/backend/users?${params.toString()}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch users (HTTP ${res.status})`);
      }

      const responseData: PaginatedUsersResponse = await res.json();
      setUsers(responseData.data || []);
      setTotalUsers(responseData.total || 0);
      setTotalPages(responseData.totalPages || 1);

      if (responseData.stats) {
        setStats(responseData.stats);
      }
    } catch (err: any) {
      console.error("Failed to load users:", err);
      setError(err.message || "Unable to load users from the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, roleFilter, statusFilter]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Suspend / Reactivate Status Toggle
  const handleToggleStatus = async (user: AdminUserListItem) => {
    const newStatus = user.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    setIsActionLoading(true);

    try {
      const res = await adminFetch(`/api/backend/users/${user.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to update status (HTTP ${res.status})`);
      }

      setSuccessBanner(
        `User "${user.fullName}" has been successfully ${newStatus === "SUSPENDED" ? "suspended" : "reactivated"}.`
      );

      // Auto dismiss banner after 5 seconds
      setTimeout(() => {
        setSuccessBanner((prev) => (prev ? null : prev));
      }, 5000);

      setSelectedUserForAction(null);
      await fetchUsers();
    } catch (err: any) {
      console.error("Failed to update user status:", err);
      setError(err.message || "Failed to update account status.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Export CSV Handler
  const handleExportCsv = () => {
    const columns: CsvColumn<AdminUserListItem>[] = [
      { key: "id", label: "User ID" },
      { key: "fullName", label: "Full Name" },
      { key: "email", label: "Email" },
      { key: "phoneNumber", label: "Phone Number" },
      { key: "role", label: "Role" },
      { key: "status", label: "Account Status" },
      {
        key: (u) =>
          u.isVerified || u.kycVerifications?.[0]?.status === "APPROVED"
            ? "Verified"
            : u.kycVerifications?.[0]?.status === "PENDING"
            ? "Pending Review"
            : "Unverified",
        label: "KYC Status",
      },
      {
        key: (u) => u.kycVerifications?.[0]?.documentType || "N/A",
        label: "KYC Document",
      },
      { key: "rating", label: "Rating" },
      { key: "reviewCount", label: "Reviews" },
      { key: (u) => u._count?.tasks ?? 0, label: "Tasks Posted" },
      { key: (u) => u._count?.offers ?? 0, label: "Offers Made" },
      { key: (u) => u.walletBalance, label: "Wallet Balance (LKR)" },
      { key: (u) => u.escrowLockedBalance, label: "Locked Escrow (LKR)" },
      { key: (u) => u.location || "Not specified", label: "Location" },
      { key: "createdAt", label: "Joined At" },
    ];

    exportToCsv("opentaskit_users", users, columns);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            User Directory & Accounts
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage posters, verified service providers, balances, and account restrictions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs"
            onClick={handleExportCsv}
            disabled={users.length === 0}
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
          <Button size="sm" className="h-9 gap-1.5 text-xs bg-[#0094F7] hover:bg-[#007cd6] text-white" asChild>
            <Link href="/kyc">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Review KYC Queue ({stats.totalPendingKyc})</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Success Banner */}
      {successBanner && (
        <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="p-1 hover:bg-emerald-500/20 rounded transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-destructive hover:bg-destructive/20"
            onClick={fetchUsers}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Total Users</div>
            <div className="text-xl font-bold text-foreground mt-0.5">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Verified Users</div>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">
              {stats.totalVerified}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Pending KYC</div>
            <div className="text-xl font-bold text-amber-500 mt-0.5">
              {stats.totalPendingKyc}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Suspended</div>
            <div className="text-xl font-bold text-destructive mt-0.5">
              {stats.totalSuspended}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={roleFilter}
                onValueChange={(val) => {
                  setRoleFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-36 text-xs">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="USER">Regular Users</SelectItem>
                  <SelectItem value="ADMIN">Administrators</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-40 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PENDING_VERIFICATION">Pending KYC</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>

              {(searchQuery || roleFilter !== "ALL" || statusFilter !== "ALL") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setRoleFilter("ALL");
                    setStatusFilter("ALL");
                    setPage(1);
                  }}
                  className="h-9 text-xs text-muted-foreground"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Users Table */}
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold">User</TableHead>
                <TableHead className="text-xs font-semibold">Role</TableHead>
                <TableHead className="text-xs font-semibold">KYC Status</TableHead>
                <TableHead className="text-xs font-semibold">Location</TableHead>
                <TableHead className="text-xs font-semibold text-center">Rating</TableHead>
                <TableHead className="text-xs font-semibold text-right">Wallet</TableHead>
                <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center text-xs text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-[#0094F7]" />
                      <span>Loading user records...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-xs text-muted-foreground">
                    No users found matching the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const kycDoc = user.kycVerifications?.[0];
                  const isKycVerified = user.isVerified || kycDoc?.status === "APPROVED";
                  const isKycPending = !isKycVerified && kycDoc?.status === "PENDING";
                  const kycDocType = kycDoc?.documentType;

                  return (
                    <TableRow key={user.id} className="text-xs hover:bg-muted/40">
                      {/* User Profile */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border">
                            {user.avatarUrl && (
                              <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                            )}
                            <AvatarFallback className="text-[11px] font-semibold bg-muted text-foreground">
                              {user.fullName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <Link
                                href={`/users/${user.id}`}
                                className="hover:underline hover:text-[#0094F7] transition-colors"
                              >
                                {user.fullName}
                              </Link>
                              {isKycVerified && (
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground block">
                              {user.email} · {user.phoneNumber}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Role */}
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-semibold ${
                            user.role === "ADMIN"
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          {user.role}
                        </Badge>
                      </TableCell>

                      {/* KYC Badge */}
                      <TableCell>
                        {isKycVerified ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-emerald-600 border-emerald-500/30 font-medium"
                          >
                            Verified {kycDocType ? `(${kycDocType})` : ""}
                          </Badge>
                        ) : isKycPending ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-amber-600 border-amber-500/30 font-medium animate-pulse"
                          >
                            Pending Review
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Unverified</span>
                        )}
                      </TableCell>

                      {/* Location */}
                      <TableCell className="text-muted-foreground">
                        {user.location || "Not specified"}
                      </TableCell>

                      {/* Rating */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 font-semibold text-foreground">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span>{(user.rating ?? 0).toFixed(1)}</span>
                          <span className="text-muted-foreground font-normal text-[10px]">
                            ({user.reviewCount ?? 0})
                          </span>
                        </div>
                      </TableCell>

                      {/* Wallet */}
                      <TableCell className="text-right font-semibold text-foreground">
                        LKR {user.walletBalance.toLocaleString()}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        <Badge
                          variant={user.status === "ACTIVE" ? "outline" : "destructive"}
                          className={`text-[10px] font-semibold ${
                            user.status === "ACTIVE"
                              ? "text-emerald-600 border-emerald-500/30"
                              : "bg-destructive/15 text-destructive font-bold"
                          }`}
                        >
                          {user.status}
                        </Badge>
                      </TableCell>

                      {/* Action Dropdown */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel className="text-xs font-semibold">
                              Manage Account
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-xs gap-2 cursor-pointer" asChild>
                              <Link href={`/users/${user.id}`}>
                                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>View Full Profile</span>
                              </Link>
                            </DropdownMenuItem>
                            {isKycPending && (
                              <DropdownMenuItem className="text-xs gap-2 cursor-pointer" asChild>
                                <Link href="/kyc">
                                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>Inspect KYC</span>
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className={`text-xs gap-2 cursor-pointer ${
                                user.status === "SUSPENDED" ? "text-emerald-600" : "text-destructive"
                              }`}
                              onClick={() => setSelectedUserForAction(user)}
                            >
                              {user.status === "SUSPENDED" ? (
                                <>
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  <span>Reactivate User</span>
                                </>
                              ) : (
                                <>
                                  <Ban className="h-3.5 w-3.5" />
                                  <span>Suspend Account</span>
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination Bar */}
          {!isLoading && totalUsers > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t gap-3">
              <div className="text-xs text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{users.length}</span> of{" "}
                <span className="font-semibold text-foreground">{totalUsers}</span> users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </Button>
                <span className="text-xs text-muted-foreground px-2">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Moderation Confirmation Dialog */}
      <Dialog
        open={!!selectedUserForAction}
        onOpenChange={(open) => !open && setSelectedUserForAction(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {selectedUserForAction?.status === "SUSPENDED"
                ? "Reactivate User Account"
                : "Suspend User Account"}
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed pt-1.5">
              {selectedUserForAction?.status === "SUSPENDED"
                ? `Are you sure you want to reactivate ${selectedUserForAction?.fullName}'s account? They will regain full access to post tasks, submit offers, and log in.`
                : `Are you sure you want to suspend ${selectedUserForAction?.fullName}'s account? They will be immediately blocked from signing in, posting tasks, or accepting offers.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              disabled={isActionLoading}
              onClick={() => setSelectedUserForAction(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant={selectedUserForAction?.status === "SUSPENDED" ? "default" : "destructive"}
              className={`text-xs gap-1.5 ${
                selectedUserForAction?.status === "SUSPENDED"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : ""
              }`}
              disabled={isActionLoading}
              onClick={() => selectedUserForAction && handleToggleStatus(selectedUserForAction)}
            >
              {isActionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {selectedUserForAction?.status === "SUSPENDED"
                ? "Reactivate Account"
                : "Suspend Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
