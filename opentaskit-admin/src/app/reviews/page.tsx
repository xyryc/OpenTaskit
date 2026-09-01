"use client";

import * as React from "react";
import Link from "next/link";
import {
  Star,
  Search,
  Filter,
  Eye,
  EyeOff,
  MoreHorizontal,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  User,
  ExternalLink,
  RotateCcw,
} from "lucide-react";

import { MOCK_REVIEWS, ReviewRecord } from "@/data/mock-data";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

export default function ReviewsPage() {
  const [reviews, setReviews] = React.useState<ReviewRecord[]>(MOCK_REVIEWS);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [ratingFilter, setRatingFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [selectedReview, setSelectedReview] = React.useState<ReviewRecord | null>(null);
  const [moderationReason, setModerationReason] = React.useState<string>("");

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      r.reviewerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.revieweeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.taskTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.comment.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRating =
      ratingFilter === "ALL" || r.rating === parseInt(ratingFilter, 10);

    const matchesStatus =
      statusFilter === "ALL" || r.status === statusFilter;

    return matchesSearch && matchesRating && matchesStatus;
  });

  const toggleHideReview = (id: string, currentStatus: string, reason?: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: currentStatus === "PUBLISHED" ? "HIDDEN" : "PUBLISHED",
              moderationReason:
                currentStatus === "PUBLISHED"
                  ? reason || "Hidden by administrator for violating review guidelines."
                  : undefined,
            }
          : r
      )
    );
    setSelectedReview(null);
    setModerationReason("");
  };

  const handleDeleteReview = (id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setSelectedReview(null);
  };

  const openModerationModal = (review: ReviewRecord) => {
    setSelectedReview(review);
    setModerationReason(review.moderationReason || "");
  };

  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        ).toFixed(1)
      : "5.0";

  const hiddenCount = reviews.filter((r) => r.status === "HIDDEN").length;

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

      {/* Metrics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Total Community Reviews</div>
            <div className="text-xl font-bold text-foreground mt-0.5">{reviews.length} Reviews</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Average Marketplace Rating</div>
            <div className="text-xl font-bold text-foreground mt-0.5 flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>{avgRating} / 5.0</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">5-Star Ratings</div>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">
              {reviews.filter((r) => r.rating === 5).length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Hidden / Moderated</div>
            <div className="text-xl font-bold text-destructive mt-0.5">
              {hiddenCount}
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
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
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

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-36 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="HIDDEN">Hidden Only</SelectItem>
                </SelectContent>
              </Select>
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
                {filteredReviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                      No reviews found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReviews.map((review) => (
                    <TableRow key={review.id} className="text-xs hover:bg-muted/40">
                      {/* Reviewer */}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{review.reviewerName}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {review.reviewerRole === "POSTER" ? "Job Poster" : "Service Provider"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Reviewee */}
                      <TableCell className="whitespace-nowrap">
                        <span className="font-medium text-foreground">{review.revieweeName}</span>
                      </TableCell>

                      {/* Task */}
                      <TableCell>
                        <div className="flex flex-col gap-0.5 max-w-xs">
                          <span className="font-medium text-foreground truncate block">
                            {review.taskTitle}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {review.taskId}
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
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {review.comment}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center whitespace-nowrap">
                        <Badge
                          variant={review.status === "PUBLISHED" ? "outline" : "destructive"}
                          className={`text-[10px] font-semibold ${
                            review.status === "PUBLISHED"
                              ? "text-emerald-600 border-emerald-500/30"
                              : "bg-destructive/15 text-destructive font-bold"
                          }`}
                        >
                          {review.status}
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
                                review.status === "PUBLISHED" ? "text-destructive" : "text-emerald-600"
                              }`}
                              onClick={() => toggleHideReview(review.id, review.status)}
                            >
                              {review.status === "PUBLISHED" ? (
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
                              onClick={() => handleDeleteReview(review.id)}
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
                      variant={selectedReview.status === "PUBLISHED" ? "outline" : "destructive"}
                      className="text-[10px]"
                    >
                      {selectedReview.status}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Task: {selectedReview.taskTitle} ({selectedReview.taskId})
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
                  "{selectedReview.comment}"
                </div>
              </div>

              {/* Reviewer & Recipient Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border bg-muted/10">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                    Author ({selectedReview.reviewerRole})
                  </span>
                  <span className="font-semibold text-foreground mt-0.5 block">
                    {selectedReview.reviewerName}
                  </span>
                </div>
                <div className="p-3 rounded-lg border bg-muted/10">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                    Recipient
                  </span>
                  <span className="font-semibold text-foreground mt-0.5 block">
                    {selectedReview.revieweeName}
                  </span>
                </div>
              </div>

              {/* Moderation Reason Input */}
              {selectedReview.status === "PUBLISHED" ? (
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
                onClick={() => setSelectedReview(null)}
              >
                Close
              </Button>

              <div className="flex items-center gap-2">
                {selectedReview.status === "PUBLISHED" ? (
                  <Button
                    type="button"
                    variant="destructive"
                    className="h-9 px-4 text-xs font-semibold gap-1.5"
                    onClick={() => toggleHideReview(selectedReview.id, "PUBLISHED", moderationReason)}
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Hide from Public</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
                    onClick={() => toggleHideReview(selectedReview.id, "HIDDEN")}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Restore / Publish Review</span>
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
