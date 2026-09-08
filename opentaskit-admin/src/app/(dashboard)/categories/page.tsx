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
} from "lucide-react";

import type { CategoryItem } from "@/types/category";
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
  const [categories, setCategories] = React.useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const fetchCategories = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/backend/categories?all=true");
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
          className="h-10 px-5 text-xs bg-[#0094F7] hover:bg-[#007cd6] text-white gap-2 font-semibold self-start sm:self-auto opacity-60 cursor-not-allowed"
          disabled
          title="Category creation mutation API will be enabled in the next phase"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Category</span>
        </Button>
      </div>

      {/* Metrics Summary Bar (Kept static until analytics APIs are integrated) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Total Categories</div>
            <div className="text-xl font-bold text-foreground mt-0.5">6</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Active in Marketplace</div>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">6</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs col-span-2 sm:col-span-1">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Total Marketplace Tasks</div>
            <div className="text-xl font-bold text-foreground mt-0.5">14</div>
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
              className="h-9 px-3 gap-1.5 text-xs self-start sm:self-auto"
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
                          className="mt-2 h-8 px-3 text-xs gap-1.5"
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

                      {/* Actions (Disabled until mutation APIs phase) */}
                      <TableCell className="text-right whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel className="text-xs">Category Options</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled
                              className="text-xs gap-2 opacity-50 cursor-not-allowed"
                            >
                              <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Edit Category</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled
                              className="text-xs gap-2 opacity-50 cursor-not-allowed"
                            >
                              {cat.isActive ? (
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
    </div>
  );
}
