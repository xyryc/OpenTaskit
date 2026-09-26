"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  ShieldCheck,
  Star,
  Ban,
  RotateCcw,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Layers,
  Tag,
  Clock,
  X,
} from "lucide-react";

import type { AdminUserDetail } from "@/types/user";
import { adminFetch } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DOCUMENT_LABELS: Record<string, string> = {
  NIC: "National ID (NIC)",
  PASSPORT: "Passport",
  DRIVING_LICENSE: "Driving Licence",
};

export default function UserDetailPage() {
  const params = useParams();
  const userId = params?.id as string;

  const [user, setUser] = React.useState<AdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [successBanner, setSuccessBanner] = React.useState<string | null>(null);

  // Moderation state
  const [isConfirmOpen, setIsConfirmOpen] = React.useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = React.useState<boolean>(false);

  // Fetch Single User from Backend API
  const fetchUser = React.useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await adminFetch(`/api/backend/users/${userId}`);

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("User not found.");
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch user (HTTP ${res.status})`);
      }

      const data: AdminUserDetail = await res.json();
      setUser(data);
    } catch (err: any) {
      console.error("Failed to load user details:", err);
      setError(err.message || "Failed to load user profile.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Handle Suspend / Reactivate Status Toggle
  const handleToggleStatus = async () => {
    if (!user) return;
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

      setUser((prev) => (prev ? { ...prev, status: newStatus } : prev));
      setSuccessBanner(
        `User "${user.fullName}" has been successfully ${
          newStatus === "SUSPENDED" ? "suspended" : "reactivated"
        }.`
      );

      setTimeout(() => {
        setSuccessBanner((prev) => (prev ? null : prev));
      }, 5000);

      setIsConfirmOpen(false);
    } catch (err: any) {
      console.error("Failed to update status:", err);
      setError(err.message || "Failed to update account status.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="icon" className="h-8 w-8" asChild>
            <Link href="/users">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
        </div>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-6 flex items-center justify-center min-h-[220px]">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-[#0094F7]" />
              <span className="text-xs text-muted-foreground">Loading user profile...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not Found or Fatal Error State
  if (!user || error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto">
        <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-3">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground">User Not Found</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {error || "The requested user account could not be found or has been removed."}
        </p>
        <Button variant="outline" size="sm" className="mt-4 text-xs" asChild>
          <Link href="/users">Back to User Directory</Link>
        </Button>
      </div>
    );
  }

  const latestKyc = user.kycVerifications?.[0];
  const isKycVerified = user.isVerified || latestKyc?.status === "APPROVED";
  const isKycPending = !isKycVerified && latestKyc?.status === "PENDING";
  const kycDocLabel = latestKyc?.documentType
    ? DOCUMENT_LABELS[latestKyc.documentType] || latestKyc.documentType
    : "Not Submitted";

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="icon" className="h-8 w-8" asChild>
            <Link href="/users">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>{user.fullName}</span>
              {isKycVerified && (
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              )}
            </h2>
            <span className="text-xs text-muted-foreground">User ID: {user.id}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isKycPending && (
            <Button size="sm" className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white" asChild>
              <Link href="/kyc">Review KYC Submission</Link>
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className={`h-8 text-xs gap-1.5 ${
              user.status === "SUSPENDED"
                ? "text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                : "text-destructive border-destructive/30 hover:bg-destructive/10"
            }`}
            onClick={() => setIsConfirmOpen(true)}
          >
            {user.status === "SUSPENDED" ? (
              <>
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reactivate Account</span>
              </>
            ) : (
              <>
                <Ban className="h-3.5 w-3.5" />
                <span>Suspend Account</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs animate-in fade-in">
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

      {/* User Profile Summary Card */}
      <Card className="border-border/60 shadow-xs">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 border">
                {user.avatarUrl && (
                  <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                )}
                <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                  {user.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">{user.fullName}</h3>
                  <Badge
                    variant="secondary"
                    className={`text-xs font-semibold ${
                      user.role === "ADMIN"
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {user.role}
                  </Badge>
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
                </div>
                {user.headline && (
                  <p className="text-xs text-foreground/80 font-medium">{user.headline}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {user.phoneNumber}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {user.location || "Not specified"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined{" "}
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l md:pl-6 pt-4 md:pt-0">
              <div>
                <div className="text-xs text-muted-foreground font-medium">Rating</div>
                <div className="flex items-center gap-1 text-base font-bold text-foreground mt-0.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span>{(user.rating ?? 0).toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    ({user.reviewCount ?? 0})
                  </span>
                </div>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div>
                <div className="text-xs text-muted-foreground font-medium">Wallet Balance</div>
                <div className="text-base font-bold text-foreground mt-0.5">
                  LKR {user.walletBalance.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="h-10 bg-muted/40 p-1 border">
          <TabsTrigger value="overview" className="text-xs">
            Overview & Activity
          </TabsTrigger>
          <TabsTrigger value="kyc" className="text-xs">
            KYC & Verification
          </TabsTrigger>
          <TabsTrigger value="financials" className="text-xs">
            Financial History
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border/60 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase font-semibold">
                  Tasks Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {user.tasksCompletedCount ?? 0}
                </div>
                <span className="text-xs text-muted-foreground mt-0.5 block">
                  As Service Provider
                </span>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase font-semibold">
                  Tasks Posted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {user._count?.tasks ?? 0}
                </div>
                <span className="text-xs text-muted-foreground mt-0.5 block">
                  As Task Poster
                </span>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase font-semibold">
                  Escrow in Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  LKR {user.escrowLockedBalance.toLocaleString()}
                </div>
                <span className="text-xs text-muted-foreground mt-0.5 block">
                  Held in active tasks
                </span>
              </CardContent>
            </Card>
          </div>

          {/* User Bio / Skills if available */}
          {(user.bio || (user.skills && user.skills.length > 0)) && (
            <Card className="border-border/60 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase font-semibold">
                  Profile Bio & Skills
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.bio && (
                  <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {user.bio}
                  </p>
                )}
                {user.skills && user.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {user.skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[11px] font-normal">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Posted Tasks */}
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">
                  Recent Tasks Posted
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Tasks published by this user to the platform.
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" asChild>
                <Link href="/tasks">
                  <span>Manage All Tasks</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {!user.tasks || user.tasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No tasks posted by this user yet.
                </div>
              ) : (
                <div className="divide-y">
                  {user.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-muted/30 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <Link href="/tasks" className="hover:underline hover:text-[#0094F7]">
                            {task.title}
                          </Link>
                          <Badge variant="outline" className="text-[10px] font-medium">
                            {task.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                          {task.category && (
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {task.category.name}
                            </span>
                          )}
                          <span>{task._count?.offers ?? 0} offers submitted</span>
                          <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="font-bold text-foreground sm:text-right shrink-0">
                        LKR {task.budget.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Offers / Bids */}
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">
                Recent Offers & Bids
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Offers this user submitted on tasks posted by others.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {!user.offers || user.offers.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No offers submitted by this user yet.
                </div>
              ) : (
                <div className="divide-y">
                  {user.offers.map((offer) => (
                    <div
                      key={offer.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-muted/30 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <span>{offer.task?.title || "Task"}</span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-medium ${
                              offer.status === "ACCEPTED"
                                ? "text-emerald-600 border-emerald-500/30"
                                : offer.status === "REJECTED"
                                ? "text-destructive border-destructive/30"
                                : ""
                            }`}
                          >
                            {offer.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                          {offer.task?.budget !== undefined && (
                            <span>Task Budget: LKR {offer.task.budget.toLocaleString()}</span>
                          )}
                          <span>{new Date(offer.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="font-bold text-foreground sm:text-right shrink-0">
                        Offer: LKR {offer.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: KYC */}
        <TabsContent value="kyc" className="mt-4 space-y-4">
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">
                  Identity Verification ({kycDocLabel})
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Review submitted identity documents and manage verification status.
                </CardDescription>
              </div>
              <Badge
                variant={isKycVerified ? "outline" : isKycPending ? "secondary" : "destructive"}
                className={
                  isKycVerified
                    ? "text-emerald-600 border-emerald-500/30 font-semibold"
                    : isKycPending
                    ? "text-amber-600 border-amber-500/30 bg-amber-500/10"
                    : ""
                }
              >
                {isKycVerified
                  ? "Identity Verified"
                  : isKycPending
                  ? "Pending Review"
                  : latestKyc?.status === "REJECTED"
                  ? "Rejected"
                  : "Unverified"}
              </Badge>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <span className="text-muted-foreground">Document Type</span>
                  <span className="font-semibold text-foreground">{kycDocLabel}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <span className="text-muted-foreground">Submitted At</span>
                  <span className="font-medium text-foreground">
                    {latestKyc?.createdAt
                      ? new Date(latestKyc.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                {latestKyc?.idNumber && (
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 sm:col-span-2">
                    <span className="text-muted-foreground">Document ID Number</span>
                    <span className="font-mono font-semibold text-foreground">
                      {latestKyc.idNumber}
                    </span>
                  </div>
                )}
              </div>

              {/* Document Previews */}
              {latestKyc ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex flex-col gap-2">
                    <span className="font-semibold text-foreground">ID Document (Front)</span>
                    <div className="p-2 border rounded-xl bg-muted/30 flex items-center justify-center min-h-[160px]">
                      <img
                        src={latestKyc.frontPhotoUrl}
                        alt="ID Document Front"
                        className="max-h-40 rounded-lg object-contain"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="font-semibold text-foreground">Live Selfie Match</span>
                    <div className="p-2 border rounded-xl bg-muted/30 flex items-center justify-center min-h-[160px]">
                      {latestKyc.selfieUrl ? (
                        <img
                          src={latestKyc.selfieUrl}
                          alt="Selfie Check"
                          className="max-h-40 rounded-lg object-contain"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">No selfie submitted</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl border bg-muted/20 text-center text-xs text-muted-foreground">
                  This user has not submitted any identity documents yet.
                </div>
              )}

              {/* Action Links */}
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-xs text-muted-foreground">
                  KYC reviews, approvals, and rejections are managed via the dedicated verification queue.
                </span>
                <Button size="sm" className="text-xs bg-[#0094F7] hover:bg-[#007cd6] text-white gap-1.5" asChild>
                  <Link href="/kyc">
                    <span>Inspect KYC Queue</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Financials */}
        <TabsContent value="financials" className="mt-4">
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">
                Wallet Ledger & Balances
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Overview of user wallet funds and active escrow holds.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Available Cash Balance</span>
                <span className="font-bold text-foreground">
                  LKR {user.walletBalance.toLocaleString()}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Funds in Escrow Vault</span>
                <span className="font-bold text-emerald-600">
                  LKR {user.escrowLockedBalance.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Moderation Confirmation Modal */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {user.status === "SUSPENDED" ? "Reactivate User Account" : "Suspend User Account"}
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed pt-1.5">
              {user.status === "SUSPENDED"
                ? `Are you sure you want to reactivate ${user.fullName}'s account? They will regain full access to OpenTaskit immediately.`
                : `Are you sure you want to suspend ${user.fullName}'s account? They will be immediately blocked from signing in, posting tasks, and receiving payouts.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              disabled={isActionLoading}
              onClick={() => setIsConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant={user.status === "SUSPENDED" ? "default" : "destructive"}
              className={`text-xs gap-1.5 ${
                user.status === "SUSPENDED"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : ""
              }`}
              disabled={isActionLoading}
              onClick={handleToggleStatus}
            >
              {isActionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {user.status === "SUSPENDED" ? "Reactivate Account" : "Suspend Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
