"use client";

import * as React from "react";
import Link from "next/link";
import {
  ClipboardList,
  Search,
  Eye,
  MapPin,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Image as ImageIcon,
  Ban,
  Trash2,
  RefreshCw,
  Inbox,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  CreditCard,
  Phone,
  Layers,
} from "lucide-react";

import type { TaskListItem, TaskDetail, TaskStatus, PaginatedTasksResponse } from "@/types/task";
import type { CategoryItem } from "@/types/category";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function TasksPage() {
  // Live Tasks Data & Pagination State
  const [tasks, setTasks] = React.useState<TaskListItem[]>([]);
  const [totalTasks, setTotalTasks] = React.useState<number>(0);
  const [totalPages, setTotalPages] = React.useState<number>(1);
  const [page, setPage] = React.useState<number>(1);
  const [limit] = React.useState<number>(10);

  // Filters State
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("ALL");

  // Category filter dropdown list
  const [categories, setCategories] = React.useState<CategoryItem[]>([]);

  // Page-level Loading & Error
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [successBanner, setSuccessBanner] = React.useState<string | null>(null);

  // Inspector Modal State (GET /tasks/:id)
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [taskDetail, setTaskDetail] = React.useState<TaskDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = React.useState<boolean>(false);
  const [detailError, setDetailError] = React.useState<string | null>(null);
  const [isModerating, setIsModerating] = React.useState<boolean>(false);

  // Debounce search input (300ms)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Categories for Filter Dropdown
  const fetchCategories = React.useCallback(async () => {
    try {
      const res = await adminFetch("/api/backend/categories?all=true");
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch {
      // Non-blocking for tasks table
    }
  }, []);

  // Fetch Tasks with Server-Side Filtering & Pagination
  const fetchTasks = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));

      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      }

      if (categoryFilter !== "ALL") {
        params.set("categoryId", categoryFilter);
      }

      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      } else {
        // Fetch all statuses across the marketplace lifecycle
        params.set("allStatuses", "true");
      }

      const res = await adminFetch(`/api/backend/tasks?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load marketplace tasks (HTTP ${res.status})`);
      }

      const data: PaginatedTasksResponse = await res.json();
      setTasks(data.data || []);
      setTotalTasks(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load tasks from backend.");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, categoryFilter, statusFilter]);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Inspect Task Details Handler (GET /tasks/:id)
  const handleInspectTask = async (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsLoadingDetail(true);
    setDetailError(null);
    setTaskDetail(null);

    try {
      const res = await adminFetch(`/api/backend/tasks/${taskId}`);
      if (!res.ok) {
        throw new Error(`Failed to retrieve task specifications (HTTP ${res.status})`);
      }
      const data: TaskDetail = await res.json();
      setTaskDetail(data);
    } catch (err: unknown) {
      setDetailError(err instanceof Error ? err.message : "Failed to load task details.");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Moderation: Cancel Task (PATCH /tasks/:id)
  const handleCancelTask = async (taskId: string) => {
    setIsModerating(true);
    try {
      const res = await adminFetch(`/api/backend/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || `Failed to cancel task (HTTP ${res.status})`);
      }

      setSuccessBanner("Task was cancelled successfully.");
      setSelectedTaskId(null);
      setTaskDetail(null);
      await fetchTasks();
    } catch (err: unknown) {
      setDetailError(err instanceof Error ? err.message : "Failed to cancel task.");
    } finally {
      setIsModerating(false);
    }
  };

  // Moderation: Delete Task (DELETE /tasks/:id)
  const handleDeleteTask = async (taskId: string) => {
    setIsModerating(true);
    try {
      const res = await adminFetch(`/api/backend/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || `Failed to delete task (HTTP ${res.status})`);
      }

      setSuccessBanner("Task was removed from marketplace successfully.");
      setSelectedTaskId(null);
      setTaskDetail(null);
      await fetchTasks();
    } catch (err: unknown) {
      setDetailError(err instanceof Error ? err.message : "Failed to delete task.");
    } finally {
      setIsModerating(false);
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case "OPEN":
        return (
          <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 text-[10px] font-semibold">
            Open
          </Badge>
        );
      case "ASSIGNED":
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 text-[10px] font-semibold">
            Assigned
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge variant="outline" className="text-muted-foreground border-border text-[10px] font-semibold">
            Completed
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="destructive" className="text-[10px] font-semibold">
            Cancelled
          </Badge>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Task Moderation & Marketplace
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor live marketplace postings, inspect descriptions, attachments, and manage task lifecycles.
          </p>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="flex items-center justify-between gap-3 p-3.5 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="p-1 hover:bg-emerald-500/20 rounded text-emerald-700 dark:text-emerald-400 cursor-pointer"
            aria-label="Dismiss message"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Metrics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Total Marketplace Tasks</div>
            <div className="text-xl font-bold text-foreground mt-0.5">{totalTasks}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Open for Offers</div>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">
              {tasks.filter((t) => t.status === "OPEN").length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Assigned / In Progress</div>
            <div className="text-xl font-bold text-blue-600 mt-0.5">
              {tasks.filter((t) => t.status === "ASSIGNED").length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Completed</div>
            <div className="text-xl font-bold text-muted-foreground mt-0.5">
              {tasks.filter((t) => t.status === "COMPLETED").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search task title, description, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs w-full"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-36 text-xs cursor-pointer">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select
                value={categoryFilter}
                onValueChange={(val) => {
                  setCategoryFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-44 text-xs cursor-pointer">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchTasks}
                disabled={isLoading}
                className="h-9 px-3 gap-1.5 text-xs cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Tasks Table */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Task Title</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Category</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Poster</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Location</TableHead>
                  <TableHead className="text-xs font-semibold text-right whitespace-nowrap">Budget</TableHead>
                  <TableHead className="text-xs font-semibold text-center whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right whitespace-nowrap">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* 1. Loading Skeleton */}
                {isLoading ? (
                  [1, 2, 3, 4, 5].map((idx) => (
                    <TableRow key={idx} className="text-xs">
                      <TableCell>
                        <div className="space-y-1.5 max-w-sm">
                          <div className="h-3.5 w-48 bg-muted/60 rounded animate-pulse" />
                          <div className="h-2.5 w-24 bg-muted/40 rounded animate-pulse" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="h-5 w-20 bg-muted/40 rounded-full animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-3.5 w-24 bg-muted/50 rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-3.5 w-28 bg-muted/40 rounded animate-pulse" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="h-3.5 w-16 bg-muted/50 rounded ml-auto animate-pulse" />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="h-5 w-16 bg-muted/40 rounded-full mx-auto animate-pulse" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="h-7 w-16 bg-muted/40 rounded ml-auto animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  /* 2. Error State */
                  <TableRow>
                    <TableCell colSpan={7} className="h-36 text-center text-xs">
                      <div className="flex flex-col items-center justify-center gap-2 py-4">
                        <AlertCircle className="h-6 w-6 text-destructive shrink-0" />
                        <p className="font-semibold text-foreground">{error}</p>
                        <p className="text-muted-foreground text-[11px] max-w-sm">
                          Ensure the NestJS backend is running at http://localhost:3000.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchTasks}
                          className="mt-2 h-8 px-3 text-xs gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Try Again</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : tasks.length === 0 ? (
                  /* 3. Empty State */
                  <TableRow>
                    <TableCell colSpan={7} className="h-36 text-center text-xs text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-1.5 py-6">
                        <Inbox className="h-6 w-6 text-muted-foreground/60" />
                        <span className="font-medium">No marketplace tasks found matching your filters.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  /* 4. Live Tasks Data */
                  tasks.map((task) => (
                    <TableRow
                      key={task.id}
                      className="text-xs hover:bg-muted/40 cursor-pointer"
                      onClick={() => handleInspectTask(task.id)}
                    >
                      {/* Task Info */}
                      <TableCell>
                        <div className="flex flex-col gap-0.5 max-w-sm">
                          <span className="font-semibold text-foreground truncate block">
                            {task.title}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="font-mono text-[10px]">{task.id.slice(0, 8)}...</span>
                            <span>•</span>
                            <span>{task._count?.offers ?? 0} offers</span>
                            {task.images && task.images.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <ImageIcon className="h-3 w-3" />
                                  {task.images.length}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Category */}
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="secondary" className="text-[10px] font-medium">
                          {task.category?.name || "General"}
                        </Badge>
                      </TableCell>

                      {/* Poster */}
                      <TableCell className="whitespace-nowrap">
                        <span className="font-medium text-foreground">
                          {task.user?.fullName || "Anonymous Client"}
                        </span>
                      </TableCell>

                      {/* Location */}
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        <div className="flex items-center gap-1.5 max-w-[160px] truncate">
                          {task.locationType === "REMOTE" ? (
                            <>
                              <Globe className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                              <span>Remote / Online</span>
                            </>
                          ) : (
                            <>
                              <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{task.address || "In-Person"}</span>
                            </>
                          )}
                        </div>
                      </TableCell>

                      {/* Budget */}
                      <TableCell className="text-right whitespace-nowrap font-semibold text-foreground">
                        <div>
                          <span>LKR {task.budget?.toLocaleString() || "0"}</span>
                          {task.isBudgetFlexible && (
                            <span className="text-[10px] text-muted-foreground block font-normal">
                              (Flexible)
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center whitespace-nowrap">
                        {getStatusBadge(task.status)}
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1.5 cursor-pointer"
                          onClick={() => handleInspectTask(task.id)}
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

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t text-xs text-muted-foreground">
            <div>
              {totalTasks > 0 ? (
                <span>
                  Showing <strong className="text-foreground">{(page - 1) * limit + 1}</strong> to{" "}
                  <strong className="text-foreground">{Math.min(page * limit, totalTasks)}</strong> of{" "}
                  <strong className="text-foreground">{totalTasks}</strong> tasks
                </span>
              ) : (
                <span>0 tasks recorded</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1 cursor-pointer"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Previous</span>
              </Button>
              <span className="px-2 font-medium text-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1 cursor-pointer"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Inspection & Moderation Dialog (GET /tasks/:id) */}
      <Dialog
        open={!!selectedTaskId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTaskId(null);
            setTaskDetail(null);
            setDetailError(null);
          }
        }}
      >
        <DialogContent className="w-[95vw] sm:w-[92vw] md:max-w-4xl lg:max-w-5xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
          {isLoadingDetail ? (
            <div className="flex flex-col items-center justify-center p-12 gap-3 min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-[#0094F7]" />
              <p className="text-xs font-medium text-muted-foreground">
                Loading complete task specifications...
              </p>
            </div>
          ) : detailError ? (
            <div className="p-8 text-center space-y-3">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
              <h3 className="text-sm font-semibold text-foreground">Unable to Load Task</h3>
              <p className="text-xs text-muted-foreground">{detailError}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => selectedTaskId && handleInspectTask(selectedTaskId)}
                className="text-xs h-8"
              >
                Retry
              </Button>
            </div>
          ) : taskDetail ? (
            <>
              {/* Modal Header */}
              <DialogHeader className="p-4 sm:p-6 border-b bg-muted/10 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                      {taskDetail.title}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5" asChild>
                      <div>
                        <span>Task ID: {taskDetail.id}</span>
                        <span>•</span>
                        <span>Category: {taskDetail.category?.name || "General"}</span>
                        <span>•</span>
                        <span>Posted {new Date(taskDetail.createdAt).toLocaleDateString()}</span>
                      </div>
                    </DialogDescription>
                  </div>
                  <div>{getStatusBadge(taskDetail.status)}</div>
                </div>
              </DialogHeader>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {/* Task Details & Description */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Task Requirements & Scope
                  </h4>
                  <div className="p-4 rounded-xl border bg-muted/20 text-xs leading-relaxed text-foreground whitespace-pre-line">
                    {taskDetail.details || "No written description provided for this task."}
                  </div>
                </div>

                {/* Task Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Budget Card */}
                  <Card className="border-border/60 shadow-xs">
                    <CardHeader className="p-3 pb-1">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Budget</span>
                      </span>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <span className="text-base font-bold text-foreground">
                        LKR {taskDetail.budget?.toLocaleString() || "0"}
                      </span>
                      <span className="text-[11px] text-muted-foreground block mt-0.5">
                        {taskDetail.isBudgetFlexible ? "Budget is Flexible" : "Fixed Total Budget"}
                      </span>
                    </CardContent>
                  </Card>

                  {/* Location Card */}
                  <Card className="border-border/60 shadow-xs">
                    <CardHeader className="p-3 pb-1">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>Location</span>
                      </span>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <span className="text-xs font-semibold text-foreground block truncate">
                        {taskDetail.locationType === "REMOTE"
                          ? "Remote / Online"
                          : taskDetail.address || "In-Person"}
                      </span>
                      <span className="text-[11px] text-muted-foreground block mt-0.5">
                        Type: {taskDetail.locationType}
                      </span>
                    </CardContent>
                  </Card>

                  {/* Marketplace Offers Card */}
                  <Card className="border-border/60 shadow-xs">
                    <CardHeader className="p-3 pb-1">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                        <ClipboardList className="h-3.5 w-3.5" />
                        <span>Offers Received</span>
                      </span>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <span className="text-base font-bold text-foreground">
                        {taskDetail._count?.offers ?? 0} Offers
                      </span>
                      <span className="text-[11px] text-muted-foreground block mt-0.5">
                        {taskDetail.status === "ASSIGNED" ? "Task is Assigned" : "Open for Bidding"}
                      </span>
                    </CardContent>
                  </Card>
                </div>

                {/* Schedule & Timing Info */}
                {(taskDetail.timeType || taskDetail.scheduledDate || taskDetail.scheduledTime) && (
                  <div className="p-4 rounded-xl border bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <span className="font-semibold text-foreground block">
                          Scheduled Execution: {taskDetail.timeType || "Specific Date"}
                        </span>
                        <span className="text-muted-foreground text-[11px]">
                          {taskDetail.scheduledDate
                            ? new Date(taskDetail.scheduledDate).toLocaleDateString(undefined, {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "Date flexible"}{" "}
                          {taskDetail.scheduledTime && `• Window: ${taskDetail.scheduledTime}`}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Attached Images */}
                {taskDetail.images && taskDetail.images.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Attached Photos ({taskDetail.images.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {taskDetail.images.map((img, idx) => (
                        <div
                          key={idx}
                          className="border rounded-xl overflow-hidden bg-muted/30 p-2 flex items-center justify-center min-h-[140px]"
                        >
                          {img.startsWith("http") ? (
                            <a
                              href={img}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative flex items-center justify-center w-full h-full"
                              title="Click to view full image in new tab"
                            >
                              <img
                                src={img}
                                alt={`Task attachment ${idx + 1}`}
                                className="max-h-40 w-auto rounded-lg object-contain transition-transform duration-200 group-hover:scale-105"
                              />
                            </a>
                          ) : (
                            <div className="flex flex-col items-center gap-1.5 text-muted-foreground p-3 text-center">
                              <ImageIcon className="h-6 w-6" />
                              <span className="text-[10px] break-all font-mono">Attachment #{idx + 1}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Poster Profile */}
                <div className="p-4 rounded-xl border bg-muted/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border">
                      <AvatarFallback className="text-xs font-semibold bg-muted">
                        {(taskDetail.user?.fullName || "Client")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-semibold text-foreground block">
                        Posted by {taskDetail.user?.fullName || "Client"}
                      </span>
                      <span className="text-muted-foreground text-[11px] flex items-center gap-2">
                        {taskDetail.user?.phoneNumber && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {taskDetail.user.phoneNumber}
                          </span>
                        )}
                        <span>•</span>
                        <span>User ID: {taskDetail.user?.id?.slice(0, 8)}...</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer with Moderation Actions */}
              <div className="w-full px-6 py-4 border-t bg-muted/20 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 px-4 text-xs font-medium cursor-pointer"
                  onClick={() => {
                    setSelectedTaskId(null);
                    setTaskDetail(null);
                  }}
                  disabled={isModerating}
                >
                  Close
                </Button>

                <div className="flex flex-wrap items-center gap-3">
                  {taskDetail.status !== "CANCELLED" && taskDetail.status !== "COMPLETED" && (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 px-4 text-xs text-amber-600 border-amber-500/30 hover:bg-amber-500/10 gap-1.5 cursor-pointer"
                      disabled={isModerating}
                      onClick={() => handleCancelTask(taskDetail.id)}
                    >
                      <Ban className="h-3.5 w-3.5" />
                      <span>Cancel Task</span>
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="destructive"
                    className="h-9 px-4 text-xs gap-1.5 font-medium cursor-pointer"
                    disabled={isModerating}
                    onClick={() => handleDeleteTask(taskDetail.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Task</span>
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
