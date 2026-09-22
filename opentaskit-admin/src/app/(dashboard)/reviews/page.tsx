"use client";

import * as React from "react";
import Link from "next/link";
import {
  Star,
  Search,
  Eye,
  EyeOff,
  MoreHorizontal,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  MessageSquare,
} from "lucide-react";

import type {
  AdminReviewItem,
  AdminReviewsStats,
  PaginatedAdminReviewsResponse,
} from "@/types/review";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ReviewsPage() {
  const [reviews, setReviews] = React.useState<AdminReviewItem[]>([]);
  const [totalReviews, setTotalReviews] = React.useState<number>(0);
  const [totalPages, setTotalPages] = React.useState<number>(1);
  const [page, setPage] = React.useState<number>(1);
  const limit = 10;

  const [stats, setStats] = React.useState<AdminReviewsStats>({
    totalReviews: 0,
    averageRating: 5.0,
    fiveStarCount: 0,
    hiddenCount: 0,
  });

  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = React.useState<string>("");
  const [ratingFilter, setRatingFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [successBanner, setSuccessBanner] = React.useState<string | null>(null);

  // Inspection / Moderation Dialog State
  const [selectedReview, setSelectedReview] = React.useState<AdminReviewItem | null>(null);
  const [moderationReason, setModerationReason] = React.useState<string>("");
  const [isModerating, setIsModerating] = React.useState<boolean>(false);

  // Deletion Dialog State
  const [reviewToDelete, setReviewToDelete] = React.useState<AdminReviewItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState<boolean>(false);

  // Debounce search input (300ms)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch reviews from API
  const fetchReviews = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }
      if (ratingFilter !== "ALL") {
        params.append("rating", ratingFilter);
      }
      if (statusFilter !== "ALL") {
        params.append("status", statusFilter);
      }

      const res = await adminFetch(`/api/backend/admin/reviews?${params.toString()}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch reviews (HTTP ${res.status})`);
      }

      const data: PaginatedAdminReviewsResponse = await res.json();
      setReviews(data.data || []);
      setTotalReviews(data.total || 0);
      setTotalPages(data.totalPages || 1);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err: any) {
      console.error("Failed to load reviews:", err);
      setError(err.message || "Failed to load reviews from the server.");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, ratingFilter, statusFilter]);

  React.useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Hide / Restore Review Action
  const handleToggleHide = async (
    review: AdminReviewItem,
    targetHidden: boolean,
    reason?: string
  ) => {
    setIsModerating(true);
    try {
      const res = await adminFetch(`/api/backend/admin/reviews/${review.id}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isHidden: targetHidden,
          moderationReason: targetHidden
            ? reason || "Hidden by administrator for violating review guidelines."
            : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to moderate review (HTTP ${res.status})`);
      }

      setSuccessBanner(
        targetHidden
          ? "Review has been hidden from public member profiles."
          : "Review has been restored and made public."
      );
      setTimeout(() => setSuccessBanner(null), 5000);

      setSelectedReview(null);
      setModerationReason("");
      await fetchReviews();
    } catch (err: any) {
      console.error("Failed to moderate review:", err);
      setError(err.message || "Failed to moderate review.");
    } finally {
      setIsModerating(false);
    }
  };

  // Delete Review Action
  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;
    setIsDeleting(true);

    try {
      const res = await adminFetch(`/api/backend/admin/reviews/${reviewToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete review (HTTP ${res.status})`);
      }

      setSuccessBanner("Review has been permanently deleted and recipient rating recalculated.");
      setTimeout(() => setSuccessBanner(null), 5000);

      setReviewToDelete(null);
      await fetchReviews();
    } catch (err: any) {
      console.error("Failed to delete review:", err);
      setError(err.message || "Failed to delete review.");
    } finally {
      setIsDeleting(false);
    }
  };

  const openModerationModal = (review: AdminReviewItem) => {
    setSelectedReview(review);
    setModerationReason(review.moderationReason || "");
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Reviews & Ratings Moderation
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor community feedback, audit 1-star ratings, and hide defamatory or retaliatory reviews.
          </p>
        </div>
      </div>

      {/* Success Banner */}
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
            onClick={fetchReviews}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Metrics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Total Community Reviews</div>
            <div className="text-xl font-bold text-foreground mt-0.5">
              {stats.totalReviews} Reviews
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Average Marketplace Rating</div>
            <div className="text-xl font-bold text-foreground mt-0.5 flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>{(stats.averageRating ?? 5.0).toFixed(1)} / 5.0</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">5-Star Ratings</div>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">
              {stats.fiveStarCount}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Hidden / Moderated</div>
            <div className="text-xl font-bold text-destructive mt-0.5">
              {stats.hiddenCount}
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
                placeholder="Search reviewer, recipient, task, or comment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs w-full"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={ratingFilter}
                onValueChange={(val) => {
                  setRatingFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-36 text-xs">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-36 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="HIDDEN">Hidden Only</SelectItem>
                </SelectContent>
              </Select>

              {(searchQuery || ratingFilter !== "ALL" || statusFilter !== "ALL") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setRatingFilter("ALL");
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

        {/* Reviews Table */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Reviewer</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Recipient</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Task Reference</TableHead>
                  <TableHead className="text-xs font-semibold text-center whitespace-nowrap">Rating</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Review Feedback</TableHead>
                  <TableHead className="text-xs font-semibold text-center whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center text-xs text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-[#0094F7]" />
                        <span>Loading platform reviews...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : reviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                      No reviews found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  reviews.map((review) => (
                    <TableRow key={review.id} className="text-xs hover:bg-muted/40">
                      {/* Reviewer */}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7 border shrink-0">
                            {review.fromUser?.avatarUrl && (
                              <AvatarImage
                                src={review.fromUser.avatarUrl}
                                alt={review.fromUser.fullName}
                              />
                            )}
                            <AvatarFallback className="text-[10px] font-semibold bg-muted text-foreground">
                              {(review.fromUser?.fullName || "U")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <Link
                              href={`/users/${review.fromUserId}`}
                              className="font-semibold text-foreground hover:underline hover:text-[#0094F7]"
                            >
                              {review.fromUser?.fullName || "User"}
                            </Link>
                            <span className="text-[10px] text-muted-foreground">
                              {review.fromUser?.email || "Community Member"}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Reviewee */}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7 border shrink-0">
                            {review.toUser?.avatarUrl && (
                              <AvatarImage
                                src={review.toUser.avatarUrl}
                                alt={review.toUser.fullName}
                              />
                            )}
                            <AvatarFallback className="text-[10px] font-semibold bg-muted text-foreground">
                              {(review.toUser?.fullName || "U")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <Link
                            href={`/users/${review.toUserId}`}
                            className="font-medium text-foreground hover:underline hover:text-[#0094F7]"
                          >
                            {review.toUser?.fullName || "User"}
                          </Link>
                        </div>
                      </TableCell>

                      {/* Task */}
                      <TableCell>
                        <div className="flex flex-col gap-0.5 max-w-xs">
                          <Link
                            href="/tasks"
                            className="font-medium text-foreground truncate block hover:underline hover:text-[#0094F7]"
                          >
                            {review.task?.title || "Task"}
                          </Link>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {review.taskId.slice(0, 13)}...
                          </span>
                        </div>
                      </TableCell>

                      {/* Rating */}
                      <TableCell className="text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 font-semibold text-foreground">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span>{review.rating}.0</span>
                        </div>
                      </TableCell>

                      {/* Comment */}
                      <TableCell className="max-w-xs">
                        <div className="truncate text-muted-foreground" title={review.text}>
                          {review.text}
                        </div>
                        {review.tags && review.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {review.tags.slice(0, 2).map((t, i) => (
                              <Badge key={i} variant="secondary" className="text-[9px] px-1 py-0">
                                {t}
                              </Badge>
                            ))}
                            {review.tags.length > 2 && (
                              <span className="text-[9px] text-muted-foreground">
                                +{review.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center whitespace-nowrap">
                        <Badge
                          variant={!review.isHidden ? "outline" : "destructive"}
                          className={`text-[10px] font-semibold ${
                            !review.isHidden
                              ? "text-emerald-600 border-emerald-500/30"
                              : "bg-destructive/15 text-destructive font-bold"
                          }`}
                        >
                          {!review.isHidden ? "PUBLISHED" : "HIDDEN"}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel className="text-xs">Review Options</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-xs gap-2 cursor-pointer"
                              onClick={() => openModerationModal(review)}
                            >
                              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Inspect Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className={`text-xs gap-2 cursor-pointer ${
                                !review.isHidden ? "text-destructive" : "text-emerald-600"
                              }`}
                              onClick={() =>
                                review.isHidden
                                  ? handleToggleHide(review, false)
                                  : openModerationModal(review)
                              }
                            >
                              {!review.isHidden ? (
                                <>
                                  <EyeOff className="h-3.5 w-3.5" />
                                  <span>Hide from Profile</span>
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  <span>Restore / Publish</span>
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-xs gap-2 text-destructive focus:text-destructive cursor-pointer"
                              onClick={() => setReviewToDelete(review)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete Review</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {!isLoading && totalReviews > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t gap-3">
              <div className="text-xs text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{reviews.length}</span> of{" "}
                <span className="font-semibold text-foreground">{totalReviews}</span> reviews
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

      {/* Review Inspection / Moderation Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
        {selectedReview && (
          <DialogContent className="w-[95vw] sm:max-w-xl p-0 gap-0 overflow-hidden">
            {/* Header */}
            <DialogHeader className="p-6 border-b bg-muted/10">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                    <span>Review Moderation</span>
                    <Badge
                      variant={!selectedReview.isHidden ? "outline" : "destructive"}
                      className="text-[10px]"
                    >
                      {!selectedReview.isHidden ? "PUBLISHED" : "HIDDEN"}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Task: {selectedReview.task?.title || "Task"} ({selectedReview.taskId.slice(0, 8)}...)
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-1 font-bold text-sm bg-muted/40 px-2.5 py-1 rounded-lg border">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span>{selectedReview.rating}.0 / 5.0</span>
                </div>
              </div>
            </DialogHeader>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Review Text */}
              <div className="space-y-1.5">
                <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                  Submitted Review Feedback
                </span>
                <div className="p-4 rounded-xl border bg-muted/20 text-xs leading-relaxed text-foreground italic">
                  "{selectedReview.text}"
                </div>
                {selectedReview.tags && selectedReview.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedReview.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Reviewer & Recipient Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border bg-muted/10 flex items-center gap-3">
                  <Avatar className="h-10 w-10 border shrink-0">
                    {selectedReview.fromUser?.avatarUrl && (
                      <AvatarImage
                        src={selectedReview.fromUser.avatarUrl}
                        alt={selectedReview.fromUser.fullName}
                      />
                    )}
                    <AvatarFallback className="text-xs font-semibold bg-muted text-foreground">
                      {(selectedReview.fromUser?.fullName || "U")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                      Author / Reviewer
                    </span>
                    <Link
                      href={`/users/${selectedReview.fromUserId}`}
                      className="font-semibold text-foreground mt-0.5 block truncate hover:underline hover:text-[#0094F7]"
                    >
                      {selectedReview.fromUser?.fullName || "User"}
                    </Link>
                    <span className="text-[11px] text-muted-foreground block truncate">
                      {selectedReview.fromUser?.email || "Community Member"}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border bg-muted/10 flex items-center gap-3">
                  <Avatar className="h-10 w-10 border shrink-0">
                    {selectedReview.toUser?.avatarUrl && (
                      <AvatarImage
                        src={selectedReview.toUser.avatarUrl}
                        alt={selectedReview.toUser.fullName}
                      />
                    )}
                    <AvatarFallback className="text-xs font-semibold bg-muted text-foreground">
                      {(selectedReview.toUser?.fullName || "U")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                      Recipient / Target
                    </span>
                    <Link
                      href={`/users/${selectedReview.toUserId}`}
                      className="font-semibold text-foreground mt-0.5 block truncate hover:underline hover:text-[#0094F7]"
                    >
                      {selectedReview.toUser?.fullName || "User"}
                    </Link>
                    <span className="text-[11px] text-muted-foreground block truncate">
                      {selectedReview.toUser?.email || "Community Member"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Moderation Reason Input */}
              {!selectedReview.isHidden ? (
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">
                    Moderation Note (Reason for hiding from public app):
                  </label>
                  <Textarea
                    placeholder="e.g. Contains abusive language, personal phone numbers, or defamatory claims..."
                    value={moderationReason}
                    onChange={(e) => setModerationReason(e.target.value)}
                    className="text-xs min-h-[70px]"
                  />
                </div>
              ) : (
                selectedReview.moderationReason && (
                  <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 text-xs text-destructive">
                    <strong className="block font-semibold mb-0.5">Admin Moderation Reason:</strong>
                    {selectedReview.moderationReason}
                  </div>
                )
              )}
            </div>

            {/* Footer */}
            <div className="w-full px-6 py-4 border-t bg-muted/20 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-9 px-4 text-xs"
                disabled={isModerating}
                onClick={() => setSelectedReview(null)}
              >
                Close
              </Button>

              <div className="flex items-center gap-2">
                {!selectedReview.isHidden ? (
                  <Button
                    type="button"
                    variant="destructive"
                    className="h-9 px-4 text-xs font-semibold gap-1.5"
                    disabled={isModerating}
                    onClick={() => handleToggleHide(selectedReview, true, moderationReason)}
                  >
                    {isModerating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Hide from Public</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
                    disabled={isModerating}
                    onClick={() => handleToggleHide(selectedReview, false)}
                  >
                    {isModerating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Restore / Publish Review</span>
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!reviewToDelete}
        onOpenChange={(open) => !open && setReviewToDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-destructive flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              <span>Delete Community Review</span>
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed pt-1.5">
              Are you sure you want to permanently delete this review? This action cannot be undone and will automatically recalculate the recipient user's average rating and total review count.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              disabled={isDeleting}
              onClick={() => setReviewToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="text-xs gap-1.5"
              disabled={isDeleting}
              onClick={handleDeleteReview}
            >
              {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Permanently Delete</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
