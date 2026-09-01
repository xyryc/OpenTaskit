"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ShieldCheck,
  ShieldAlert,
  Star,
  Wallet,
  Clock,
  Ban,
  RotateCcw,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  ArrowUpRight,
} from "lucide-react";

import { MOCK_USERS, UserRecord } from "@/data/mock-data";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const [user, setUser] = React.useState<UserRecord | undefined>(() =>
    MOCK_USERS.find((u) => u.id === userId) ?? MOCK_USERS[0]
  );

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-sm font-semibold text-foreground">User not found.</p>
        <Button variant="outline" size="sm" className="mt-3 text-xs" asChild>
          <Link href="/users">Back to User Directory</Link>
        </Button>
      </div>
    );
  }

  const toggleStatus = () => {
    setUser((prev) =>
      prev
        ? {
            ...prev,
            status: prev.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED",
          }
        : undefined
    );
  };

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
              {user.isKycVerified && (
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              )}
            </h2>
            <span className="text-xs text-muted-foreground">User ID: {user.id}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user.status === "PENDING_VERIFICATION" && (
            <Button size="sm" className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white" asChild>
              <Link href="/kyc">Review KYC Submission</Link>
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className={`h-8 text-xs gap-1.5 ${
              user.status === "SUSPENDED" ? "text-emerald-600 border-emerald-500/30" : "text-destructive border-destructive/30"
            }`}
            onClick={toggleStatus}
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

      {/* User Profile Summary Card */}
      <Card className="border-border/60 shadow-xs">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 border">
                <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                  {user.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">{user.fullName}</h3>
                  <Badge variant="secondary" className="text-xs font-semibold">
                    {user.role}
                  </Badge>
                  <Badge
                    variant={user.status === "ACTIVE" ? "outline" : "destructive"}
                    className={`text-[10px] font-semibold ${
                      user.status === "ACTIVE"
                        ? "text-emerald-600 border-emerald-500/30"
                        : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {user.status}
                  </Badge>
                </div>
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
                    {user.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
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
                  <span>{user.rating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground font-normal">({user.reviewCount})</span>
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
          <TabsTrigger value="overview" className="text-xs">Overview & Activity</TabsTrigger>
          <TabsTrigger value="kyc" className="text-xs">KYC & Verification</TabsTrigger>
          <TabsTrigger value="financials" className="text-xs">Financial History</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border/60 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase font-semibold">
                  Tasks Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{user.tasksCompletedCount}</div>
                <span className="text-xs text-muted-foreground mt-0.5 block">As Service Provider</span>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase font-semibold">
                  Tasks Posted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{user.tasksPostedCount}</div>
                <span className="text-xs text-muted-foreground mt-0.5 block">As Task Poster</span>
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
                <span className="text-xs text-muted-foreground mt-0.5 block">Held in active tasks</span>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: KYC */}
        <TabsContent value="kyc" className="mt-4 space-y-4">
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">
                  Identity Verification (National ID)
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Review submitted identity documents and manage verification status.
                </CardDescription>
              </div>
              <Badge
                variant={user.isKycVerified ? "outline" : user.status === "PENDING_VERIFICATION" ? "secondary" : "destructive"}
                className={user.isKycVerified ? "text-emerald-600 border-emerald-500/30 font-semibold" : ""}
              >
                {user.isKycVerified ? "Identity Verified" : user.status === "PENDING_VERIFICATION" ? "Pending Review" : "Unverified"}
              </Badge>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <span className="text-muted-foreground">Document Type</span>
                  <span className="font-semibold text-foreground">{user.kycDocumentType || "National ID"}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <span className="text-muted-foreground">Submitted At</span>
                  <span className="font-medium text-foreground">
                    {user.kycSubmittedAt ? new Date(user.kycSubmittedAt).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </div>

              {/* Document Previews */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex flex-col gap-2">
                  <span className="font-semibold text-foreground">National ID Card (Front)</span>
                  <div className="p-2 border rounded-xl bg-muted/30 flex items-center justify-center min-h-[160px]">
                    <img
                      src="https://images.unsplash.com/photo-1633265486064-086b219458ec?w=800&auto=format&fit=crop&q=80"
                      alt="National ID Front"
                      className="max-h-40 rounded-lg object-contain"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="font-semibold text-foreground">Live Selfie Match</span>
                  <div className="p-2 border rounded-xl bg-muted/30 flex items-center justify-center min-h-[160px]">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80"
                      alt="Selfie Check"
                      className="max-h-40 rounded-lg object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                {!user.isKycVerified ? (
                  <Button
                    size="sm"
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                    onClick={() => {
                      setUser((prev) =>
                        prev
                          ? { ...prev, isKycVerified: true, status: "ACTIVE" }
                          : undefined
                      );
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Approve & Grant "Identity Verified" Badge</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => {
                      setUser((prev) =>
                        prev
                          ? { ...prev, isKycVerified: false, status: "ACTIVE" }
                          : undefined
                      );
                    }}
                  >
                    <span>Revoke Verified Badge</span>
                  </Button>
                )}
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
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Available Cash Balance</span>
                <span className="font-bold text-foreground">LKR {user.walletBalance.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Funds in Escrow Vault</span>
                <span className="font-bold text-emerald-600">LKR {user.escrowLockedBalance.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
