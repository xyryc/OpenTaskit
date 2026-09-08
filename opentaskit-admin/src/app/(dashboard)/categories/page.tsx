"use client";

import * as React from "react";
import {
  Layers,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Wrench,
  Truck,
  Laptop,
  TreePine,
  Camera,
  Paintbrush,
  RefreshCw,
  AlertCircle,
  Inbox,
  Loader2,
  X,
} from "lucide-react";

import type { CategoryItem } from "@/types/category";
import { adminFetch } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

// Presets for the category icon picker matching backend supported strings
const PRESET_ICONS = [
  { id: "broom", label: "Cleaning", icon: Sparkles },
  { id: "hammer", label: "Handyman", icon: Wrench },
  { id: "truck", label: "Delivery", icon: Truck },
  { id: "leaf", label: "Gardening", icon: TreePine },
  { id: "box", label: "Moving", icon: Truck },
  { id: "paw", label: "Pet Care", icon: Sparkles },
  { id: "laptop", label: "Tech Support", icon: Laptop },
  { id: "camera", label: "Photography", icon: Camera },
  { id: "paintbrush", label: "Painting", icon: Paintbrush },
];

// Helper: Automatically format a category name into a URL-friendly slug
const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

// Icon mapping helper matching backend icon strings (truck, leaf, hammer, box, broom, paw, etc.)
const getCategoryIcon = (iconName?: string | null) => {
  const icon = (iconName || "").toLowerCase();
  switch (icon) {
    case "truck":
    case "delivery":
    case "fast-delivery":
      return <Truck className="h-4 w-4 text-emerald-600" />;
    case "wrench":
    case "hammer":
    case "handyman":
      return <Wrench className="h-4 w-4 text-amber-500" />;
    case "leaf":
    case "garden":
    case "treepine":
      return <TreePine className="h-4 w-4 text-green-600" />;
    case "broom":
    case "cleaning":
    case "sparkles":
      return <Sparkles className="h-4 w-4 text-[#0094F7]" />;
    case "box":
    case "moving":
      return <Truck className="h-4 w-4 text-blue-600" />;
    case "paw":
    case "pet":
    case "dog":
      return <Sparkles className="h-4 w-4 text-rose-500" />;
    case "camera":
    case "photo":
      return <Camera className="h-4 w-4 text-rose-500" />;
    case "laptop":
    case "tech":
      return <Laptop className="h-4 w-4 text-purple-600" />;
    case "paintbrush":
    case "painting":
      return <Paintbrush className="h-4 w-4 text-indigo-500" />;
    default:
      return <Layers className="h-4 w-4 text-muted-foreground" />;
  }
};

export default function CategoriesPage() {
  // Data fetching state
  const [categories, setCategories] = React.useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Feedback notifications
  const [successBanner, setSuccessBanner] = React.useState<string | null>(null);

  // Category Modal & Form State (Supports both Create and Edit modes)
  const [isDialogOpen, setIsDialogOpen] = React.useState<boolean>(false);
  const [editingCategory, setEditingCategory] = React.useState<CategoryItem | null>(null);
  const [formName, setFormName] = React.useState<string>("");
  const [formSlug, setFormSlug] = React.useState<string>("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = React.useState<boolean>(false);
  const [formDescription, setFormDescription] = React.useState<string>("");
  const [formIcon, setFormIcon] = React.useState<string>("broom");
  const [formIsActive, setFormIsActive] = React.useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Inline status toggle loading state
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const fetchCategories = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminFetch("/api/backend/categories?all=true");
      if (!res.ok) {
        throw new Error(`Failed to load categories (HTTP ${res.status})`);
      }
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load categories from backend.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Open modal in CREATE mode
  const openCreateDialog = () => {
    setEditingCategory(null);
    setFormName("");
    setFormSlug("");
    setIsSlugManuallyEdited(false);
    setFormDescription("");
    setFormIcon("broom");
    setFormIsActive(true);
    setSubmitError(null);
    setIsDialogOpen(true);
  };

  // Open modal in EDIT mode (pre-populating existing values)
  const openEditDialog = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setIsSlugManuallyEdited(false); // In edit mode, slug stays preserved unless user edits it
    setFormDescription(cat.description || "");
    setFormIcon(cat.icon || "broom");
    setFormIsActive(cat.isActive);
    setSubmitError(null);
    setIsDialogOpen(true);
  };

  // Name input handler (auto-slug generated ONLY in create mode unless manually edited)
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingCategory && !isSlugManuallyEdited) {
      setFormSlug(generateSlug(val));
    }
  };

  // Explicit slug manual override
  const handleSlugChange = (val: string) => {
    setIsSlugManuallyEdited(true);
    setFormSlug(val);
  };

  // Unified Save Handler (dispatches POST for new or PATCH for edit)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      setSubmitError("Category name is required.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const isEdit = !!editingCategory;
      const url = isEdit
        ? `/api/backend/categories/${editingCategory.id}`
        : "/api/backend/categories";
      const method = isEdit ? "PATCH" : "POST";

      const payload = {
        name: formName.trim(),
        slug: formSlug.trim() ? formSlug.trim() : undefined,
        icon: formIcon,
        description: formDescription.trim() || undefined,
        isActive: formIsActive,
      };

      const res = await adminFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 409) {
          throw new Error(
            data?.message ||
              (isEdit
                ? "Another category with this name or slug already exists."
                : "An active category with this name or slug already exists.")
          );
        }
        if (res.status === 401 || res.status === 403) {
          throw new Error("Admin session expired or insufficient permissions. Please log in again.");
        }
        const errorMsg = Array.isArray(data?.message)
          ? data.message.join(", ")
          : data?.message || `Failed to ${isEdit ? "update" : "create"} category (HTTP ${res.status})`;
        throw new Error(errorMsg);
      }

      // Success: close modal, set banner, and refresh list
      setIsDialogOpen(false);
      setSuccessBanner(
        data?.message ||
          `Category "${data?.category?.name || formName.trim()}" ${isEdit ? "updated" : "created"} successfully.`
      );
      await fetchCategories();
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "An unexpected error occurred while saving category."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick inline status toggle (Active <-> Inactive via PATCH)
  const handleToggleStatus = async (cat: CategoryItem) => {
    setTogglingId(cat.id);
    try {
      const res = await adminFetch(`/api/backend/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || `Failed to change category status (HTTP ${res.status})`);
      }

      setSuccessBanner(
        `Category "${cat.name}" ${!cat.isActive ? "activated" : "deactivated"} successfully.`
      );
      await fetchCategories();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to toggle category status.");
    } finally {
      setTogglingId(null);
    }
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Category & Taxonomy Management
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Service categories configured in the backend and displayed across the mobile marketplace.
          </p>
        </div>
        <Button
          size="default"
          className="h-10 px-5 text-xs bg-[#0094F7] hover:bg-[#007cd6] text-white gap-2 font-semibold self-start sm:self-auto cursor-pointer"
          onClick={openCreateDialog}
        >
          <Plus className="h-4 w-4" />
          <span>Add New Category</span>
        </Button>
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

      {/* Metrics Summary Bar (Kept static until analytics APIs are integrated) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Total Categories</div>
            <div className="text-xl font-bold text-foreground mt-0.5">
              {categories.length || 7}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Active in Marketplace</div>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">
              {categories.filter((c) => c.isActive).length || 7}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs col-span-2 sm:col-span-1">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Total Marketplace Tasks</div>
            <div className="text-xl font-bold text-foreground mt-0.5">
              {categories.reduce((acc, curr) => acc + (curr._count?.tasks ?? 0), 0) || 14}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search category name, slug, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs w-full"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCategories}
              disabled={isLoading}
              className="h-9 px-3 gap-1.5 text-xs self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </CardHeader>

        {/* Categories Table */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Category</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Slug</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Description</TableHead>
                  <TableHead className="text-xs font-semibold text-center whitespace-nowrap">Total Tasks</TableHead>
                  <TableHead className="text-xs font-semibold text-center whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* 1. Loading Skeleton */}
                {isLoading ? (
                  [1, 2, 3, 4, 5].map((idx) => (
                    <TableRow key={idx} className="text-xs">
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className="h-8 w-8 rounded-lg bg-muted/60 animate-pulse shrink-0 border" />
                          <div className="space-y-1.5">
                            <div className="h-3 w-28 bg-muted/60 rounded animate-pulse" />
                            <div className="h-2.5 w-16 bg-muted/40 rounded animate-pulse" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="h-3 w-24 bg-muted/40 rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-3 w-40 bg-muted/40 rounded animate-pulse" />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="h-3 w-12 bg-muted/40 rounded mx-auto animate-pulse" />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="h-5 w-16 bg-muted/50 rounded-full mx-auto animate-pulse" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="h-6 w-6 bg-muted/40 rounded ml-auto animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  /* 2. Error State */
                  <TableRow>
                    <TableCell colSpan={6} className="h-36 text-center text-xs">
                      <div className="flex flex-col items-center justify-center gap-2 py-4">
                        <AlertCircle className="h-6 w-6 text-destructive shrink-0" />
                        <p className="font-semibold text-foreground">{error}</p>
                        <p className="text-muted-foreground text-[11px] max-w-sm">
                          Ensure the NestJS backend is running at http://localhost:3000.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchCategories}
                          className="mt-2 h-8 px-3 text-xs gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Try Again</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCategories.length === 0 ? (
                  /* 3. Empty State */
                  <TableRow>
                    <TableCell colSpan={6} className="h-36 text-center text-xs text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-1.5 py-6">
                        <Inbox className="h-6 w-6 text-muted-foreground/60" />
                        <span className="font-medium">No categories found matching your search.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  /* 4. Live Categories Data */
                  filteredCategories.map((cat) => (
                    <TableRow key={cat.id} className="text-xs hover:bg-muted/40">
                      {/* Name & Icon */}
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 border">
                            {getCategoryIcon(cat.icon)}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground block">
                              {cat.name}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {cat.id}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Slug */}
                      <TableCell className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        /{cat.slug}
                      </TableCell>

                      {/* Description */}
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {cat.description || "—"}
                      </TableCell>

                      {/* Tasks Count */}
                      <TableCell className="text-center font-semibold text-foreground whitespace-nowrap">
                        {cat._count?.tasks ?? 0} tasks
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center whitespace-nowrap">
                        <Badge
                          variant={cat.isActive ? "outline" : "secondary"}
                          className={cat.isActive ? "text-emerald-600 border-emerald-500/30" : "text-muted-foreground"}
                        >
                          {cat.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>

                      {/* Actions Menu */}
                      <TableCell className="text-right whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel className="text-xs">Category Options</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            {/* Edit Action (Active) */}
                            <DropdownMenuItem
                              className="text-xs gap-2 cursor-pointer"
                              onClick={() => openEditDialog(cat)}
                            >
                              <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Edit Category</span>
                            </DropdownMenuItem>

                            {/* Activate / Deactivate Action (Active) */}
                            <DropdownMenuItem
                              className="text-xs gap-2 cursor-pointer"
                              disabled={togglingId === cat.id}
                              onClick={() => handleToggleStatus(cat)}
                            >
                              {togglingId === cat.id ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                  <span>Updating...</span>
                                </>
                              ) : cat.isActive ? (
                                <>
                                  <XCircle className="h-3.5 w-3.5 text-amber-500" />
                                  <span>Deactivate</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>Activate</span>
                                </>
                              )}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* Delete Action (Disabled until delete phase) */}
                            <DropdownMenuItem
                              disabled
                              className="text-xs gap-2 opacity-50 cursor-not-allowed"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              <span>Delete</span>
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

      {/* Unified Create / Edit Category Modal Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 border-b bg-muted/10">
            <DialogTitle className="text-lg font-bold text-foreground">
              {editingCategory ? "Edit Category" : "Create New Category"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {editingCategory
                ? "Update category details, taxonomy slug, icon symbol, and marketplace visibility."
                : "Service categories define how users discover tasks and browse services across OpenTaskit."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCategory}>
            <div className="p-6 space-y-4 text-xs">
              {submitError && (
                <div className="flex items-start gap-2.5 p-3 text-xs bg-destructive/10 border border-destructive/30 text-destructive rounded-lg">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
                  <div className="flex-1 font-medium">{submitError}</div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground" htmlFor="category-name">
                  Category Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="category-name"
                  placeholder="e.g. Car Washing & Auto Detailing"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="h-9 text-xs"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground" htmlFor="category-slug">
                    URL Slug
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    {editingCategory ? "Locked (editable)" : "Auto-generated"}
                  </span>
                </div>
                <Input
                  id="category-slug"
                  placeholder="car-washing-auto-detailing"
                  value={formSlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
                <p className="text-[10px] text-muted-foreground">
                  Slug used in URL routing: /tasks?category={formSlug || "slug"}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground" htmlFor="category-desc">
                  Description
                </label>
                <Textarea
                  id="category-desc"
                  placeholder="Brief summary of tasks and services included in this category..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="text-xs min-h-[75px] resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Category Icon</label>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {PRESET_ICONS.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = formIcon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFormIcon(item.id)}
                        className={`h-9 px-2.5 flex items-center gap-2 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[#0094F7] text-white border-[#0094F7]"
                            : "bg-background hover:bg-muted/60 text-muted-foreground border-border"
                        }`}
                      >
                        <IconComp className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-white" : ""}`} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
                <div className="space-y-0.5">
                  <label className="text-xs font-semibold text-foreground cursor-pointer" htmlFor="category-is-active">
                    Marketplace Visibility
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    When active, this category is visible across mobile apps for posting tasks and browsing services.
                  </p>
                </div>
                <button
                  type="button"
                  id="category-is-active"
                  role="switch"
                  aria-checked={formIsActive}
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    formIsActive ? "bg-[#0094F7]" : "bg-muted-foreground/30"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      formIsActive ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="w-full px-6 py-4 border-t bg-muted/20 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-9 px-4 text-xs cursor-pointer"
                disabled={isSubmitting}
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-5 bg-[#0094F7] hover:bg-[#007cd6] text-white font-semibold text-xs gap-1.5 cursor-pointer"
                disabled={isSubmitting || !formName.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{editingCategory ? "Saving..." : "Creating..."}</span>
                  </>
                ) : (
                  <span>{editingCategory ? "Save Changes" : "Create Category"}</span>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
