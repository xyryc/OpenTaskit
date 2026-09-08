"use client";

import * as React from "react";
import Link from "next/link";
import {
  ClipboardList,
  Search,
  Filter,
  Eye,
  MoreHorizontal,
  MapPin,
  Globe,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  ExternalLink,
  Layers,
  Image as ImageIcon,
  Ban,
  Trash2,
} from "lucide-react";

import { MOCK_TASKS, MOCK_CATEGORIES, TaskRecord } from "@/data/mock-data";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function TasksPage() {
  const [tasks, setTasks] = React.useState<TaskRecord[]>(MOCK_TASKS);
  const [searchQuery, setSearchQuery] = React.useState<string>("" );
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("ALL");
  const [selectedTask, setSelectedTask] = React.useState<TaskRecord | null>(null);

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.posterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.address && t.address.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" || t.status === statusFilter;

    const matchesCategory =
      categoryFilter === "ALL" || t.categoryId === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleCancelTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "CANCELLED" } : t))
    );
    if (selectedTask?.id === taskId) {
      setSelectedTask((prev) => (prev ? { ...prev, status: "CANCELLED" } : null));
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTask(null);
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

      {/* Metrics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Total Tasks</div>
            <div className="text-xl font-bold text-foreground mt-0.5">{tasks.length}</div>
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
                placeholder="Search tasks, posters, locations, IDs..."
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
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 w-44 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {MOCK_CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                {filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                      No marketplace tasks found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTasks.map((task) => (
                    <TableRow key={task.id} className="text-xs hover:bg-muted/40">
                      {/* Task Info */}
                      <TableCell>
                        <div className="flex flex-col gap-0.5 max-w-sm">
                          <span className="font-semibold text-foreground truncate block">
                            {task.title}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="font-mono">{task.id}</span>
                            <span>•</span>
                            <span>{task.offersCount} offers</span>
                            {task.images.length > 0 && (
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
                          {task.categoryName}
                        </Badge>
                      </TableCell>

                      {/* Poster */}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{task.posterName}</span>
                          <span className="text-[11px] text-muted-foreground">{task.posterPhone}</span>
                        </div>
                      </TableCell>

                      {/* Location */}
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        <div className="flex items-center gap-1.5 max-w-[160px] truncate">
                          {task.locationType === "ONLINE" ? (
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
                          <span>LKR {task.budgetAmount.toLocaleString()}</span>
                          {task.budgetType === "HOURLY" && (
                            <span className="text-[10px] text-muted-foreground block font-normal">
                              ({task.hourlyHours} hrs @ LKR {task.hourlyRate}/hr)
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center whitespace-nowrap">
                        <Badge
                          variant={
                            task.status === "OPEN"
                              ? "outline"
                              : task.status === "ASSIGNED"
                              ? "secondary"
                              : task.status === "COMPLETED"
                              ? "outline"
                              : "destructive"
                          }
                          className={`text-[10px] font-semibold ${
                            task.status === "OPEN"
                              ? "text-emerald-600 border-emerald-500/30"
                              : task.status === "ASSIGNED"
                              ? "bg-blue-500/10 text-blue-600"
                              : task.status === "COMPLETED"
                              ? "text-muted-foreground border-border"
                              : "bg-destructive/15 text-destructive"
                          }`}
                        >
                          {task.status}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1.5"
                          onClick={() => setSelectedTask(task)}
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

      {/* Task Inspection & Moderation Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        {selectedTask && (
          <DialogContent className="w-[95vw] sm:w-[92vw] md:max-w-4xl lg:max-w-5xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
            {/* Header */}
            <DialogHeader className="p-4 sm:p-6 border-b bg-muted/10 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                    {selectedTask.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                    <span>Task ID: {selectedTask.id}</span>
                    <span>•</span>
                    <span>Category: {selectedTask.categoryName}</span>
                    <span>•</span>
                    <span>Posted {new Date(selectedTask.createdAt).toLocaleDateString()}</span>
                  </DialogDescription>
                </div>
                <Badge
                  variant={selectedTask.status === "OPEN" ? "outline" : "secondary"}
                  className="text-xs font-semibold self-start sm:self-auto px-3 py-1"
                >
                  {selectedTask.status}
                </Badge>
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
                  {selectedTask.details}
                </div>
              </div>

              {/* Task Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-border/60 shadow-xs">
                  <CardHeader className="p-3 pb-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">Budget</span>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <span className="text-base font-bold text-foreground">
                      LKR {selectedTask.budgetAmount.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      {selectedTask.budgetType === "TOTAL" ? "Fixed Total Budget" : "Hourly Rate"}
                    </span>
                  </CardContent>
                </Card>

                <Card className="border-border/60 shadow-xs">
                  <CardHeader className="p-3 pb-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">Location</span>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <span className="text-xs font-semibold text-foreground block truncate">
                      {selectedTask.locationType === "ONLINE" ? "Remote / Online" : selectedTask.address || "In-Person"}
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      {selectedTask.locationType}
                    </span>
                  </CardContent>
                </Card>

                <Card className="border-border/60 shadow-xs">
                  <CardHeader className="p-3 pb-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">Marketplace Offers</span>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <span className="text-base font-bold text-foreground">
                      {selectedTask.offersCount} Offers
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      {selectedTask.providerName ? `Assigned to ${selectedTask.providerName}` : "Awaiting assignment"}
                    </span>
                  </CardContent>
                </Card>
              </div>

              {/* Task Image Attachments */}
              {selectedTask.images.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Task Photos ({selectedTask.images.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedTask.images.map((img, idx) => (
                      <div key={idx} className="border rounded-xl overflow-hidden bg-muted/30 p-2 flex items-center justify-center min-h-[160px]">
                        <img
                          src={img}
                          alt={`Attachment ${idx + 1}`}
                          className="max-h-40 w-auto rounded-lg object-contain"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Poster Contact Details Card */}
              <div className="p-4 rounded-xl border bg-muted/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border">
                    <AvatarFallback className="text-xs font-semibold bg-muted">
                      {selectedTask.posterName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="font-semibold text-foreground block">
                      Posted by {selectedTask.posterName}
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      {selectedTask.posterEmail} · {selectedTask.posterPhone}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                  <Link href={`/users/${selectedTask.posterId}`}>
                    <span>View Poster Account</span>
                  </Link>
                </Button>
              </div>
            </div>

            {/* Footer with Moderation Controls */}
            <div className="w-full px-6 py-4 sm:px-8 sm:py-5 border-t bg-muted/20 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                className="h-10 px-5 text-xs font-medium"
                onClick={() => setSelectedTask(null)}
              >
                Close
              </Button>

              <div className="flex flex-wrap items-center gap-3">
                {selectedTask.status !== "CANCELLED" && selectedTask.status !== "COMPLETED" && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 px-5 text-xs text-amber-600 border-amber-500/30 hover:bg-amber-500/10 gap-1.5"
                    onClick={() => handleCancelTask(selectedTask.id)}
                  >
                    <Ban className="h-4 w-4" />
                    <span>Cancel Task</span>
                  </Button>
                )}

                <Button
                  type="button"
                  variant="destructive"
                  className="h-10 px-5 text-xs gap-1.5 font-medium"
                  onClick={() => handleDeleteTask(selectedTask.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Spam Task</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
