"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  MoreHorizontal,
  Eye,
  Ban,
  RotateCcw,
  Star,
  Users,
  Download,
} from "lucide-react";

import { MOCK_USERS, UserRecord } from "@/data/mock-data";
import { exportToCsv, CsvColumn } from "@/lib/export-csv";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [users, setUsers] = React.useState<UserRecord[]>(MOCK_USERS);

  // Filtered user list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phoneNumber.includes(searchQuery) ||
      u.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === "ALL" ||
      (roleFilter === "PROVIDER" && (u.role === "PROVIDER" || u.role === "DUAL")) ||
      (roleFilter === "POSTER" && (u.role === "POSTER" || u.role === "DUAL")) ||
      u.role === roleFilter;

    const matchesStatus =
      statusFilter === "ALL" || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const toggleUserStatus = (userId: string, currentStatus: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            status: currentStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED",
          };
        }
        return u;
      })
    );
  };

  const handleExportCsv = () => {
    const columns: CsvColumn<UserRecord>[] = [
      { key: "id", label: "User ID" },
      { key: "fullName", label: "Full Name" },
      { key: "email", label: "Email" },
      { key: "phoneNumber", label: "Phone Number" },
      { key: "role", label: "Role" },
      { key: "status", label: "Account Status" },
      { key: (u) => (u.isKycVerified ? "Verified" : "Unverified"), label: "KYC Status" },
      { key: (u) => u.kycDocumentType || "N/A", label: "KYC Document" },
      { key: "rating", label: "Rating" },
      { key: "reviewCount", label: "Reviews" },
      { key: "tasksPostedCount", label: "Tasks Posted" },
      { key: "tasksCompletedCount", label: "Tasks Completed" },
      { key: "walletBalance", label: "Wallet Balance (LKR)" },
      { key: "escrowLockedBalance", label: "Locked Escrow (LKR)" },
      { key: "location", label: "Location" },
      { key: "createdAt", label: "Joined At" },
    ];

    exportToCsv("opentaskit_users", filteredUsers, columns);
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
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
          <Button size="sm" className="h-9 gap-1.5 text-xs bg-[#0094F7] hover:bg-[#007cd6] text-white" asChild>
            <Link href="/kyc">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Review KYC Queue ({users.filter(u => u.status === "PENDING_VERIFICATION").length})</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Total Users</div>
            <div className="text-xl font-bold text-foreground mt-0.5">{users.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Verified Providers</div>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">
              {users.filter((u) => u.isKycVerified && (u.role === "PROVIDER" || u.role === "DUAL")).length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Pending KYC</div>
            <div className="text-xl font-bold text-amber-500 mt-0.5">
              {users.filter((u) => u.status === "PENDING_VERIFICATION").length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Suspended</div>
            <div className="text-xl font-bold text-destructive mt-0.5">
              {users.filter((u) => u.status === "SUSPENDED").length}
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
                placeholder="Search by name, email, phone, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-9 w-36 text-xs">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="POSTER">Posters</SelectItem>
                  <SelectItem value="PROVIDER">Providers</SelectItem>
                  <SelectItem value="DUAL">Dual-Role</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
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
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-xs text-muted-foreground">
                    No users found matching the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="text-xs hover:bg-muted/40">
                    {/* User Profile */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border">
                          <AvatarFallback className="text-[11px] font-semibold bg-muted text-foreground">
                            {user.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <span>{user.fullName}</span>
                            {user.isKycVerified && (
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
                          user.role === "PROVIDER"
                            ? "bg-blue-500/10 text-[#0094F7]"
                            : user.role === "DUAL"
                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>

                    {/* KYC Badge */}
                    <TableCell>
                      {user.isKycVerified ? (
                        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 font-medium">
                          Verified ({user.kycDocumentType})
                        </Badge>
                      ) : user.status === "PENDING_VERIFICATION" ? (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30 font-medium animate-pulse">
                          Pending Review
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">Unverified</span>
                      )}
                    </TableCell>

                    {/* Location */}
                    <TableCell className="text-muted-foreground">{user.location}</TableCell>

                    {/* Rating */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 font-semibold text-foreground">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>{user.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground font-normal text-[10px]">
                          ({user.reviewCount})
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
                            : user.status === "PENDING_VERIFICATION"
                            ? "text-amber-600 border-amber-500/30 bg-amber-500/10"
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
                          {user.status === "PENDING_VERIFICATION" && (
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
                            onClick={() => toggleUserStatus(user.id, user.status)}
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
