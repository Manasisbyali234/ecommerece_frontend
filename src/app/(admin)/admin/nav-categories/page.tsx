"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Search,
  Check,
  FolderTree,
  X,
  Tag,
  Sparkles,
  Grid,
  Layers,
  LayoutGrid,
  List,
} from "lucide-react";
import { toast } from "sonner";

import { useStore, store, type NavCategoryGroup } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

function StatCard({ title, value, subtitle, icon: Icon, colorClass }: any) {
  return (
    <Card className="shadow-xs border-muted/60 bg-transparent">
      <CardContent className="p-5 flex items-start gap-4">
        <div className={`p-3 rounded-xl bg-${colorClass}-500/10 text-${colorClass}-500`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-2xl font-bold tracking-tight text-foreground">{value}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminNavCategoriesPage() {
  const navCategories = useStore((s) => s.navCategories);

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Vertical Dialog
  const [verticalDialogOpen, setVerticalDialogOpen] = useState(false);
  const [editingVerticalId, setEditingVerticalId] = useState<string | null>(null);
  const [draftVerticalName, setDraftVerticalName] = useState("");
  const [draftVerticalActive, setDraftVerticalActive] = useState(true);
  
  // Nested Draft State for builder inside the vertical modal
  const [draftCategories, setDraftCategories] = useState<{
    id: string;
    name: string;
    subcategories: string[];
  }[]>([]);
  const [draftCategoryInput, setDraftCategoryInput] = useState("");
  const [draftSubcatInputs, setDraftSubcatInputs] = useState<Record<string, string>>({});

  // Category Dialog (for quick standalone rename)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCatVerticalId, setEditingCatVerticalId] = useState<string | null>(null);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [draftCategoryName, setDraftCategoryName] = useState("");

  // Inline Inputs (standalone quick additions)
  const [newCategoryInputs, setNewCategoryInputs] = useState<Record<string, string>>({});
  const [newSubcategoryInputs, setNewSubcategoryInputs] = useState<Record<string, string>>({});

  // Filter
  const filteredVerticals = useMemo(() => {
    if (!searchQuery.trim()) return navCategories;
    const q = searchQuery.toLowerCase();
    return navCategories.filter(
      (nc) =>
        nc.name.toLowerCase().includes(q) ||
        (nc.categories ?? []).some(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.subcategories ?? []).some((s) => s.toLowerCase().includes(q))
        )
    );
  }, [navCategories, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    let totalCategories = 0;
    let totalSubcategories = 0;
    navCategories.forEach((v) => {
      const cats = v.categories ?? [];
      totalCategories += cats.length;
      cats.forEach((c) => {
        totalSubcategories += (c.subcategories ?? []).length;
      });
    });
    return {
      totalVerticals: navCategories.length,
      activeVerticals: navCategories.filter((nc) => nc.active).length,
      totalCategories,
      totalSubcategories,
    };
  }, [navCategories]);

  // Flattened structure for Table view
  const tableRows = useMemo(() => {
    const rows: {
      verticalId: string;
      verticalName: string;
      verticalActive: boolean;
      categoryId: string;
      categoryName: string;
      subcategories: string[];
    }[] = [];

    filteredVerticals.forEach((v) => {
      if (v.categories.length === 0) {
        rows.push({
          verticalId: v.id,
          verticalName: v.name,
          verticalActive: v.active,
          categoryId: "",
          categoryName: "(No Categories)",
          subcategories: [],
        });
      } else {
        v.categories.forEach((c) => {
          rows.push({
            verticalId: v.id,
            verticalName: v.name,
            verticalActive: v.active,
            categoryId: c.id,
            categoryName: c.name,
            subcategories: c.subcategories,
          });
        });
      }
    });

    return rows;
  }, [filteredVerticals]);

  // Actions
  const toggleActive = (id: string) => {
    const vertical = navCategories.find((x) => x.id === id);
    if (vertical) {
      store.updateNavCategory(id, { active: !vertical.active });
      toast.success(
        `Vertical "${vertical.name}" ${vertical.active ? "paused" : "activated"}`
      );
    }
  };

  // Start Create/Edit Vertical Hierarchy Flow
  const startCreateVertical = () => {
    setEditingVerticalId(null);
    setDraftVerticalName("");
    setDraftVerticalActive(true);
    setDraftCategories([]);
    setDraftCategoryInput("");
    setDraftSubcatInputs({});
    setVerticalDialogOpen(true);
  };

  const startEditVertical = (vertical: NavCategoryGroup) => {
    setEditingVerticalId(vertical.id);
    setDraftVerticalName(vertical.name);
    setDraftVerticalActive(vertical.active);
    // Deep clone categories to avoid modifying store during draft editing
    setDraftCategories(JSON.parse(JSON.stringify(vertical.categories)));
    setDraftCategoryInput("");
    setDraftSubcatInputs({});
    setVerticalDialogOpen(true);
  };

  // Draft category builder actions
  const addCategoryToDraft = () => {
    if (!draftCategoryInput.trim()) return;
    if (
      draftCategories.some(
        (c) => c.name.toLowerCase() === draftCategoryInput.trim().toLowerCase()
      )
    ) {
      toast.error("Category already exists in vertical");
      return;
    }
    setDraftCategories([
      ...draftCategories,
      {
        id: `draft-cat-${Date.now()}`,
        name: draftCategoryInput.trim(),
        subcategories: [],
      },
    ]);
    setDraftCategoryInput("");
  };

  const removeCategoryFromDraft = (id: string) => {
    setDraftCategories(draftCategories.filter((c) => c.id !== id));
  };

  const addSubcatToDraftCategory = (catId: string) => {
    const input = draftSubcatInputs[catId]?.trim();
    if (!input) return;
    setDraftCategories(
      draftCategories.map((c) => {
        if (c.id === catId) {
          if (c.subcategories.includes(input)) {
            toast.error("Subcategory already exists in this category");
            return c;
          }
          return {
            ...c,
            subcategories: [...c.subcategories, input],
          };
        }
        return c;
      })
    );
    setDraftSubcatInputs((prev) => ({ ...prev, [catId]: "" }));
  };

  const removeSubcatFromDraftCategory = (catId: string, subcat: string) => {
    setDraftCategories(
      draftCategories.map((c) => {
        if (c.id === catId) {
          return {
            ...c,
            subcategories: c.subcategories.filter((s) => s !== subcat),
          };
        }
        return c;
      })
    );
  };

  const saveVertical = () => {
    if (!draftVerticalName.trim()) {
      toast.error("Vertical name is required");
      return;
    }
    const payload = {
      name: draftVerticalName.trim(),
      categories: draftCategories,
      active: draftVerticalActive,
    };
    if (editingVerticalId) {
      store.updateNavCategory(editingVerticalId, payload);
      toast.success(`Vertical "${draftVerticalName}" updated live!`);
    } else {
      store.addNavCategory(payload);
      toast.success(`Vertical "${draftVerticalName}" published to navigation!`);
    }
    setVerticalDialogOpen(false);
  };

  const deleteVertical = (id: string) => {
    const vertical = navCategories.find((nc) => nc.id === id);
    store.removeNavCategory(id);
    toast.success(`Vertical "${vertical?.name}" removed`);
  };

  // Inline Category Addition (Card View)
  const addCategoryInline = (verticalId: string) => {
    const input = newCategoryInputs[verticalId]?.trim();
    if (!input) return;

    const vertical = navCategories.find((v) => v.id === verticalId);
    if (vertical) {
      if (vertical.categories.some((c) => c.name.toLowerCase() === input.toLowerCase())) {
        toast.error(`Category "${input}" already exists in ${vertical.name}`);
        return;
      }

      const newCategory = {
        id: `cat-${Date.now()}`,
        name: input,
        subcategories: [],
      };

      const updatedCategories = [...vertical.categories, newCategory];
      store.updateNavCategory(verticalId, { categories: updatedCategories });
      toast.success(`Added category "${input}" to ${vertical.name}`);
      setNewCategoryInputs((prev) => ({ ...prev, [verticalId]: "" }));
    }
  };

  // Standalone Edit Category Modal (Rename)
  const startEditCategory = (verticalId: string, categoryId: string, currentName: string) => {
    setEditingCatVerticalId(verticalId);
    setEditingCatId(categoryId);
    setDraftCategoryName(currentName);
    setCategoryDialogOpen(true);
  };

  const saveCategoryName = () => {
    if (!draftCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }
    if (!editingCatVerticalId || !editingCatId) return;

    const vertical = navCategories.find((v) => v.id === editingCatVerticalId);
    if (vertical) {
      const updatedCategories = vertical.categories.map((c) =>
        c.id === editingCatId ? { ...c, name: draftCategoryName.trim() } : c
      );
      store.updateNavCategory(editingCatVerticalId, { categories: updatedCategories });
      toast.success(`Category renamed to "${draftCategoryName}"`);
    }
    setCategoryDialogOpen(false);
  };

  // Delete Category
  const removeCategory = (verticalId: string, categoryId: string) => {
    const vertical = navCategories.find((v) => v.id === verticalId);
    if (vertical) {
      const catToDelete = vertical.categories.find((c) => c.id === categoryId);
      const updatedCategories = vertical.categories.filter((c) => c.id !== categoryId);
      store.updateNavCategory(verticalId, { categories: updatedCategories });
      toast.success(`Category "${catToDelete?.name}" removed`);
    }
  };

  // Inline Subcategory Management (Card/Table view)
  const addSubcategoryInline = (verticalId: string, categoryId: string) => {
    const key = `${verticalId}-${categoryId}`;
    const input = newSubcategoryInputs[key]?.trim();
    if (!input) return;

    const vertical = navCategories.find((v) => v.id === verticalId);
    if (vertical) {
      const category = vertical.categories.find((c) => c.id === categoryId);
      if (category) {
        if (category.subcategories.some((s) => s.toLowerCase() === input.toLowerCase())) {
          toast.error(`Subcategory "${input}" already exists in ${category.name}`);
          return;
        }

        const updatedCategories = vertical.categories.map((c) =>
          c.id === categoryId
            ? { ...c, subcategories: [...c.subcategories, input] }
            : c
        );

        store.updateNavCategory(verticalId, { categories: updatedCategories });
        toast.success(`Added subcategory "${input}" to ${category.name}`);
        setNewSubcategoryInputs((prev) => ({ ...prev, [key]: "" }));
      }
    }
  };

  const removeSubcategory = (verticalId: string, categoryId: string, subcatToRemove: string) => {
    const vertical = navCategories.find((v) => v.id === verticalId);
    if (vertical) {
      const category = vertical.categories.find((c) => c.id === categoryId);
      if (category) {
        const updatedCategories = vertical.categories.map((c) =>
          c.id === categoryId
            ? { ...c, subcategories: c.subcategories.filter((s) => s !== subcatToRemove) }
            : c
        );
        store.updateNavCategory(verticalId, { categories: updatedCategories });
        toast.success(`Removed subcategory "${subcatToRemove}"`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalog Manager"
        description="Configure a 3-level catalog hierarchy of retail business verticals, categories, and nested shoppable subcategories."
        actions={
          <div className="flex items-center gap-2">
            <div className="border border-muted/80 rounded-lg p-0.5 flex bg-muted/20 shrink-0">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("table")}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={startCreateVertical} className="bg-teal-600 hover:bg-teal-700 text-white shadow-xs">
              <Plus className="mr-2 h-4 w-4" /> Add Vertical
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Verticals" 
          value={stats.totalVerticals.toString()} 
          subtitle="Highest business levels"
          icon={Layers} 
          colorClass="indigo" 
        />
        <StatCard 
          title="Active Live Verticals" 
          value={stats.activeVerticals.toString()} 
          subtitle="Visible to storefront"
          icon={Check} 
          colorClass="emerald" 
        />
        <StatCard 
          title="Total Categories" 
          value={stats.totalCategories.toString()} 
          subtitle="Broad product groups"
          icon={FolderTree} 
          colorClass="blue" 
        />
        <StatCard 
          title="Total Subcategories" 
          value={stats.totalSubcategories.toString()} 
          subtitle="Specific shoppable types"
          icon={Tag} 
          colorClass="violet" 
        />
      </div>

      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Catalog Verticals ({filteredVerticals.length})
          </h2>
        </div>

        <div className="relative min-w-[280px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search vertical, category or subcategory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-background"
          />
        </div>
      </div>

      {/* Empty State */}
      {filteredVerticals.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl space-y-3 bg-muted/10">
          <Layers className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-semibold">No catalog verticals found</h3>
          <p className="text-xs text-muted-foreground">Try clearing or adjusting your search query.</p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID CARD VIEW */
        <div className="grid grid-cols-1 gap-6 items-start">
          {filteredVerticals.map((vertical) => (
            <Card key={vertical.id} className="overflow-hidden border border-muted/80 shadow-xs flex flex-col bg-card/60 h-full">
              {/* Card Header (Vertical Level) */}
              <CardHeader className="p-4 bg-muted/40 border-b border-muted/40 flex flex-row items-center justify-between space-y-0 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">
                      {vertical.name}
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {vertical.categories.length} categories configured
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Switch
                      checked={vertical.active}
                      onCheckedChange={() => toggleActive(vertical.id)}
                      className="scale-85"
                    />
                    <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
                      {vertical.active ? "Active" : "Paused"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 border-l border-muted/40 pl-3 ml-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => startEditVertical(vertical)}
                      title="Edit Vertical"
                    >
                      <Edit2 className="h-3.5 w-3.5 sm:mr-1.5 text-muted-foreground" />
                      <span className="text-xs hidden sm:inline font-medium">Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-destructive border-destructive/20 hover:bg-destructive/10"
                      onClick={() => deleteVertical(vertical.id)}
                      title="Delete Vertical"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:mr-1.5" />
                      <span className="text-xs hidden sm:inline font-medium">Delete</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Card Body (Categories & Subcategories Tiers) */}
              <CardContent className="p-4 flex-1 flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  {vertical.categories.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-4 text-center border rounded-lg border-dashed">
                      No categories configured under this vertical yet.
                    </p>
                  ) : (
                    vertical.categories.map((category) => (
                      <div key={category.id} className="p-3 border border-muted/40 rounded-xl bg-muted/10 space-y-3">
                        {/* Category Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Grid className="h-3.5 w-3.5 text-teal-600" />
                            <span className="text-xs font-bold text-foreground">{category.name}</span>
                            <span className="text-[10px] text-muted-foreground">({category.subcategories.length})</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={() => startEditCategory(vertical.id, category.id, category.name)}
                              title="Rename Category"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:bg-destructive/10"
                              onClick={() => removeCategory(vertical.id, category.id)}
                              title="Delete Category"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Subcategories badges list */}
                        <div className="pl-1">
                          {category.subcategories.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground italic">No subcategories.</p>
                          ) : (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              {category.subcategories.map((sub) => (
                                <Badge
                                  key={sub}
                                  variant="secondary"
                                  className="text-[10px] py-0.5 px-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                  <span>{sub}</span>
                                  <button
                                    onClick={() => removeSubcategory(vertical.id, category.id, sub)}
                                    className="text-slate-400 hover:text-destructive transition-colors ml-0.5"
                                    title={`Remove "${sub}"`}
                                  >
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Add Subcategory Inline Input */}
                        <div className="flex items-center gap-1.5 pt-1.5">
                          <Input
                            placeholder={`Add subcategory under ${category.name}...`}
                            value={newSubcategoryInputs[`${vertical.id}-${category.id}`] || ""}
                            onChange={(e) =>
                              setNewSubcategoryInputs((prev) => ({
                                ...prev,
                                [`${vertical.id}-${category.id}`]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addSubcategoryInline(vertical.id, category.id);
                              }
                            }}
                            className="h-7 text-[11px] flex-1 bg-background"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 text-[11px] px-2"
                            onClick={() => addSubcategoryInline(vertical.id, category.id)}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Category Inline */}
                <div className="flex items-center gap-2 pt-3 mt-1 border-t border-muted/40 shrink-0">
                  <Input
                    placeholder="Add category (e.g. Clothing)..."
                    value={newCategoryInputs[vertical.id] || ""}
                    onChange={(e) =>
                      setNewCategoryInputs((prev) => ({
                        ...prev,
                        [vertical.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCategoryInline(vertical.id);
                      }
                    }}
                    className="h-8 text-xs flex-1 bg-muted/30"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs px-3 shadow-xs border-dashed"
                    onClick={() => addCategoryInline(vertical.id)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> Add Category
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* TABLE VIEW (Flattened Taxonomy) */
        <div className="border border-muted/80 rounded-xl overflow-hidden bg-card/60 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="p-4">Vertical</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Subcategories</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {tableRows.map((row, idx) => (
                  <tr key={`${row.verticalId}-${row.categoryId || idx}`} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5 text-indigo-500" />
                        <span>{row.verticalName}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground font-medium">
                      {row.categoryId ? (
                        <div className="flex items-center gap-1.5">
                          <Grid className="h-3.5 w-3.5 text-teal-600" />
                          <span>{row.categoryName}</span>
                        </div>
                      ) : (
                        <span className="italic text-muted-foreground/60">{row.categoryName}</span>
                      )}
                    </td>
                    <td className="p-4">
                      {row.categoryId ? (
                        <div className="space-y-2">
                          {row.subcategories.length === 0 ? (
                            <span className="italic text-muted-foreground/60 block mb-1">No subcategories</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {row.subcategories.map((sub) => (
                                <Badge
                                  key={sub}
                                  variant="secondary"
                                  className="text-[10px] py-0.5 px-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                  {sub}
                                  <button
                                    onClick={() => removeSubcategory(row.verticalId, row.categoryId, sub)}
                                    className="text-slate-400 hover:text-destructive transition-colors ml-0.5"
                                    title={`Remove "${sub}"`}
                                  >
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {/* Inline Subcategory Add in Table */}
                          <div className="flex items-center gap-1 max-w-[280px]">
                            <Input
                              placeholder="Quick add subcategory..."
                              value={newSubcategoryInputs[`${row.verticalId}-${row.categoryId}`] || ""}
                              onChange={(e) =>
                                setNewSubcategoryInputs((prev) => ({
                                  ...prev,
                                  [`${row.verticalId}-${row.categoryId}`]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addSubcategoryInline(row.verticalId, row.categoryId);
                                }
                              }}
                              className="h-6 text-[10px] bg-background"
                            />
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-6 text-[10px] px-1.5"
                              onClick={() => addSubcategoryInline(row.verticalId, row.categoryId)}
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <span className="italic text-muted-foreground/60">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={row.verticalActive}
                          onCheckedChange={() => toggleActive(row.verticalId)}
                          className="scale-85"
                        />
                      </div>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            const vert = navCategories.find((v) => v.id === row.verticalId);
                            if (vert) startEditVertical(vert);
                          }}
                          title="Edit Vertical"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (row.categoryId) {
                              removeCategory(row.verticalId, row.categoryId);
                            } else {
                              deleteVertical(row.verticalId);
                            }
                          }}
                          title={row.categoryId ? "Delete Category" : "Delete Vertical"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Vertical Dialog (Wizard-like builder for all 3 levels) */}
      <Dialog open={verticalDialogOpen} onOpenChange={setVerticalDialogOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden border-muted/60">
          <div className="bg-gradient-to-r from-teal-500/15 via-teal-500/5 to-background p-6 border-b border-muted/40">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Layers className="h-5 w-5 text-teal-600" />
              {editingVerticalId ? "Edit Vertical Hierarchy" : "New Vertical Hierarchy"}
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-xs text-muted-foreground/80">
              Configure a business vertical (e.g., Electronics) along with its categories and shoppable subcategories.
            </DialogDescription>
          </div>

          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* 1. Vertical Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1.5 flex items-center gap-1.5">
                <span>1. Business Vertical Information</span>
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="v-name" className="text-xs font-semibold flex items-center gap-1.5">
                    Vertical Name
                  </Label>
                  <Input
                    id="v-name"
                    placeholder="e.g. Apparel & Fashion"
                    value={draftVerticalName}
                    onChange={(e) => setDraftVerticalName(e.target.value)}
                    className="bg-muted/40 text-xs"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                  <div className="space-y-0.5">
                    <Label htmlFor="v-active" className="text-xs font-semibold">Live Status</Label>
                    <p className="text-[10px] text-muted-foreground">Show in storefront navbar</p>
                  </div>
                  <Switch
                    id="v-active"
                    checked={draftVerticalActive}
                    onCheckedChange={setDraftVerticalActive}
                    className="scale-90"
                  />
                </div>
              </div>
            </div>

            {/* 2. Categories & Subcategories Config */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1.5 flex items-center justify-between">
                <span>2. Categories & Subcategories Hierarchy</span>
                <span className="text-[10px] lowercase font-normal">({draftCategories.length} categories)</span>
              </h3>

              <div className="space-y-4">
                {draftCategories.map((c) => (
                  <div key={c.id} className="p-3 border border-muted/40 rounded-xl bg-muted/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Grid className="h-3.5 w-3.5 text-teal-600" />
                        <Input
                          value={c.name}
                          onChange={(e) => {
                            setDraftCategories(
                              draftCategories.map((dc) =>
                                dc.id === c.id ? { ...dc, name: e.target.value } : dc
                              )
                            );
                          }}
                          className="h-7 text-xs bg-background max-w-[180px]"
                          placeholder="Category name"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => removeCategoryFromDraft(c.id)}
                        title="Delete Category"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Subcategories list */}
                    <div className="pl-1 space-y-2">
                      {c.subcategories.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {c.subcategories.map((sub) => (
                            <Badge
                              key={sub}
                              variant="secondary"
                              className="text-[9px] py-0.5 px-2 bg-background flex items-center gap-1"
                            >
                              {sub}
                              <button
                                onClick={() => removeSubcatFromDraftCategory(c.id, sub)}
                                className="text-slate-400 hover:text-destructive transition-colors ml-0.5"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Add subcategory input */}
                      <div className="flex items-center gap-1.5">
                        <Input
                          placeholder={`Add subcategory under ${c.name || 'category'}...`}
                          value={draftSubcatInputs[c.id] || ""}
                          onChange={(e) =>
                            setDraftSubcatInputs((prev) => ({
                              ...prev,
                              [c.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addSubcatToDraftCategory(c.id);
                            }
                          }}
                          className="h-7 text-[10px] flex-1 bg-background"
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 text-[10px] px-2"
                          onClick={() => addSubcatToDraftCategory(c.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add category field */}
              <div className="flex items-center gap-2 pt-2 border-t border-dashed">
                <Input
                  placeholder="New Category Name (e.g. Clothing)..."
                  value={draftCategoryInput}
                  onChange={(e) => setDraftCategoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCategoryToDraft();
                    }
                  }}
                  className="h-8 text-xs flex-1 bg-muted/40"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs px-3 shadow-xs border-dashed"
                  onClick={addCategoryToDraft}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Category
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-muted/40 bg-muted/10 flex justify-end gap-2 shrink-0">
            <Button variant="outline" onClick={() => setVerticalDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveVertical} className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm font-semibold">
              <Check className="h-4 w-4 mr-1.5" /> {editingVerticalId ? "Save Changes" : "Add"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Category Name Dialog (Standalone edit) */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-muted/60">
          <div className="bg-gradient-to-r from-teal-500/15 via-teal-500/5 to-background p-6 border-b border-muted/40">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Grid className="h-5 w-5 text-teal-600" />
              Edit Category Name
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-xs text-muted-foreground/80">
              Rename the category group within the vertical.
            </DialogDescription>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="c-name" className="text-xs font-semibold flex items-center gap-1.5">
                <Grid className="h-3.5 w-3.5 text-muted-foreground" /> Category Name
              </Label>
              <Input
                id="c-name"
                placeholder="e.g. Clothing"
                value={draftCategoryName}
                onChange={(e) => setDraftCategoryName(e.target.value)}
                className="bg-muted/40 text-sm"
              />
            </div>
          </div>

          <div className="p-4 border-t border-muted/40 bg-muted/10 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveCategoryName} className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm font-semibold">
              <Check className="h-4 w-4 mr-1.5" /> Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
