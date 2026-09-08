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
  BookOpen,
} from "lucide-react";

import { MOCK_CATEGORIES, CategoryRecord } from "@/data/mock-data";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

// Icon mapping helper
const getCategoryIcon = (iconName?: string) => {
  switch (iconName) {
    case "Sparkles":
      return <Sparkles className="h-4 w-4 text-[#0094F7]" />;
    case "Wrench":
      return <Wrench className="h-4 w-4 text-amber-500" />;
    case "Truck":
      return <Truck className="h-4 w-4 text-emerald-600" />;
    case "Laptop":
      return <Laptop className="h-4 w-4 text-purple-600" />;
    case "TreePine":
      return <TreePine className="h-4 w-4 text-green-600" />;
    case "Camera":
      return <Camera className="h-4 w-4 text-rose-500" />;
    case "Paintbrush":
      return <Paintbrush className="h-4 w-4 text-indigo-500" />;
    default:
      return <Layers className="h-4 w-4 text-muted-foreground" />;
  }
};

export default function CategoriesPage() {
  const [categories, setCategories] = React.useState<CategoryRecord[]>(MOCK_CATEGORIES);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = React.useState<boolean>(false);
  const [editingCategory, setEditingCategory] = React.useState<CategoryRecord | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // Form states
  const [formName, setFormName] = React.useState<string>("");
  const [formSlug, setFormSlug] = React.useState<string>("");
  const [formDescription, setFormDescription] = React.useState<string>("");
  const [formIcon, setFormIcon] = React.useState<string>("Sparkles");
  const [formIsActive, setFormIsActive] = React.useState<boolean>(true);

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormName(name);
    if (!editingCategory) {
      setFormSlug(slugify(name));
    }
  };

  const openCreateDialog = () => {
    setEditingCategory(null);
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormIcon("Sparkles");
    setFormIsActive(true);
    setIsCreateOpen(true);
  };

  const openEditDialog = (category: CategoryRecord) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormSlug(category.slug);
    setFormDescription(category.description || "");
    setFormIcon(category.icon || "Sparkles");
    setFormIsActive(category.isActive);
    setIsCreateOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formSlug.trim()) return;

    if (editingCategory) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCategory.id
            ? {
                ...c,
                name: formName,
                slug: formSlug,
                description: formDescription,
                icon: formIcon,
                isActive: formIsActive,
              }
            : c
        )
      );
    } else {
      const newCategory: CategoryRecord = {
        id: `CAT-${String(categories.length + 1).padStart(3, "0")}`,
        name: formName,
        slug: formSlug,
        description: formDescription,
        icon: formIcon,
        isActive: formIsActive,
        tasksCount: 0,
        createdAt: new Date().toISOString(),
      };
      setCategories((prev) => [...prev, newCategory]);
    }

    setIsCreateOpen(false);
  };

  const toggleActiveStatus = (id: string, current: boolean) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !current } : c))
    );
  };

  const handleDelete = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setDeletingId(null);
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
            Create, edit, and organize service categories displayed across the mobile marketplace.
          </p>
        </div>
        <Button
          size="default"
          className="h-10 px-5 text-xs bg-[#0094F7] hover:bg-[#007cd6] text-white gap-2 font-semibold self-start sm:self-auto"
          onClick={openCreateDialog}
        >
          <Plus className="h-4 w-4" />
          <span>Add New Category</span>
        </Button>
      </div>

      {/* Metrics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Total Categories</div>
            <div className="text-xl font-bold text-foreground mt-0.5">{categories.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Active in Marketplace</div>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">
              {categories.filter((c) => c.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-xs col-span-2 sm:col-span-1">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-medium text-muted-foreground">Total Marketplace Tasks</div>
            <div className="text-xl font-bold text-foreground mt-0.5">
              {categories.reduce((acc, c) => acc + c.tasksCount, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-3 border-b">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search category name, slug, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs w-full"
            />
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
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                      No categories found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
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
                            <span className="text-[11px] font-mono text-muted-foreground">
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
                        {cat.tasksCount} tasks
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2.5 text-xs font-medium cursor-pointer"
                          onClick={() => toggleActiveStatus(cat.id, cat.isActive)}
                        >
                          <Badge
                            variant={cat.isActive ? "outline" : "secondary"}
                            className={cat.isActive ? "text-emerald-600 border-emerald-500/30" : "text-muted-foreground"}
                          >
                            {cat.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </Button>
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
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuLabel className="text-xs">Category Options</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-xs gap-2 cursor-pointer"
                              onClick={() => openEditDialog(cat)}
                            >
                              <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Edit Category</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-xs gap-2 cursor-pointer"
                              onClick={() => toggleActiveStatus(cat.id, cat.isActive)}
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
                              className="text-xs gap-2 text-destructive focus:text-destructive cursor-pointer"
                              onClick={() => setDeletingId(cat.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

      {/* Create / Edit Category Modal Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 border-b bg-muted/10">
            <DialogTitle className="text-lg font-bold text-foreground">
              {editingCategory ? "Edit Category" : "Create New Category"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Service categories define how users discover tasks and browse services.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Category Name</label>
              <Input
                placeholder="e.g. Plumbing & Sanitary Repairs"
                value={formName}
                onChange={(e) => handleNameChange(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">URL Slug</label>
              <Input
                placeholder="plumbing-sanitary-repairs"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Description</label>
              <Textarea
                placeholder="Brief summary of tasks included in this category..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="text-xs min-h-[80px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Icon Symbol</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { name: "Sparkles", label: "Cleaning" },
                  { name: "Wrench", label: "Handyman" },
                  { name: "Truck", label: "Delivery" },
                  { name: "Laptop", label: "Tech" },
                  { name: "TreePine", label: "Garden" },
                  { name: "Camera", label: "Photo" },
                  { name: "Paintbrush", label: "Painting" },
                ].map((item) => (
                  <Button
                    key={item.name}
                    type="button"
                    variant={formIcon === item.name ? "default" : "outline"}
                    size="sm"
                    className={`h-8 px-3 text-xs gap-1.5 ${
                      formIcon === item.name ? "bg-[#0094F7] text-white" : ""
                    }`}
                    onClick={() => setFormIcon(item.name)}
                  >
                    {getCategoryIcon(item.name)}
                    <span>{item.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full px-6 py-4 border-t bg-muted/20 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-9 px-4 text-xs"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-9 px-5 bg-[#0094F7] hover:bg-[#007cd6] text-white font-semibold text-xs"
              disabled={!formName.trim() || !formSlug.trim()}
              onClick={handleSave}
            >
              {editingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Delete Category?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Are you sure you want to delete this category? This action cannot be undone. Existing tasks in this category will become unassigned.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-9 px-4"
              onClick={() => setDeletingId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="text-xs h-9 px-4"
              onClick={() => deletingId && handleDelete(deletingId)}
            >
              Delete Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
