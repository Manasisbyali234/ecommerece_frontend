"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Upload,
  Search,
  Check,
  Tag,
  Filter,
  Layers,
  Globe,
  CheckCircle2,
  Image as ImageIcon,
  Info,
} from "lucide-react";
import { toast } from "sonner";

import { useStore, store, type CategoryItem } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { api, uploadImage } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  colorClass,
  borderClass,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: any;
  colorClass: string;
  borderClass?: string;
}) {
  return (
    <Card className={`border shadow-2xs hover:shadow-sm transition-all ${borderClass || ""}`}>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            {label}
          </span>
          <div className="mt-1 text-2xl font-extrabold text-foreground">{value}</div>
          {subtitle && <span className="text-[11px] text-muted-foreground mt-0.5 block">{subtitle}</span>}
        </div>
        <div className={`p-3 rounded-xl ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emptyDraft: Omit<CategoryItem, "id"> = {
    name: "",
    slug: "",
    description: "",
    image: "",
    active: true,
  };

  const [draft, setDraft] = useState<Omit<CategoryItem, "id">>(emptyDraft);

  // Quick image replacement state
  const [quickReplaceCard, setQuickReplaceCard] = useState<CategoryItem | null>(null);
  const [quickImageUrl, setQuickImageUrl] = useState("");
  const quickFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api<{ items: Array<{ id: string; title: string; active: boolean; data: Omit<CategoryItem, "id"> }> }>("/admin/content/categories")
      .then(({ items }) => setCategories(items.map((item) => ({ ...item.data, id: item.id, name: item.data.name || item.title, active: item.active }))))
      .catch(() => toast.error("Unable to load saved categories"));
  }, []);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: categories.length,
      active: categories.filter((c) => c.active).length,
      withImage: categories.filter((c) => !!c.image).length,
    };
  }, [categories]);

  const toggleActive = async (id: string) => {
    const cat = categories.find((x) => x.id === id);
    if (cat) {
      try { await api(`/admin/content/categories/${id}`, { method: "PATCH", body: JSON.stringify({ active: !cat.active }) }); setCategories((items) => items.map((item) => item.id === id ? { ...item, active: !item.active } : item)); toast.success(`Category "${cat.name}" ${cat.active ? "paused" : "activated"}`); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update category"); }
    }
  };

  const startCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setOpen(true);
  };

  const startEdit = (item: CategoryItem) => {
    setEditingId(item.id);
    const { id, ...rest } = item;
    setDraft(rest);
    setOpen(true);
  };

  const saveCategory = async () => {
    if (!draft.name.trim()) {
      toast.error("Category Name is required");
      return;
    }

    const slug = draft.slug.trim() || draft.name.trim().toLowerCase().replace(/\s+/g, "-");
    const payload = { ...draft, slug };

    try { if (editingId) { const { item } = await api<{ item: { id: string; title: string; active: boolean; data: Omit<CategoryItem, "id"> } }>(`/admin/content/categories/${editingId}`, { method: "PATCH", body: JSON.stringify({ title: payload.name, slug: payload.slug, active: payload.active, data: payload }) }); const saved = { ...item.data, id: item.id, name: item.data.name || item.title, active: item.active }; setCategories((items) => items.map((item) => item.id === editingId ? saved : item)); toast.success(`Category "${draft.name}" updated live!`); } else { const { item } = await api<{ item: { id: string; title: string; active: boolean; data: Omit<CategoryItem, "id"> } }>("/admin/content/categories", { method: "POST", body: JSON.stringify({ title: payload.name, slug: payload.slug, active: payload.active, data: payload }) }); setCategories((items) => [{ ...item.data, id: item.id, name: item.data.name || item.title, active: item.active }, ...items]); toast.success(`New Category "${draft.name}" added live to storefront!`); } setOpen(false); setEditingId(null); setDraft(emptyDraft); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save category"); }
  };

  const removeCategory = async (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (cat?.name === "All") {
      toast.error("Cannot delete default 'All' category");
      return;
    }
    try { await api(`/admin/content/categories/${id}`, { method: "DELETE" }); setCategories((items) => items.filter((item) => item.id !== id)); toast.success("Category removed"); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to remove category"); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imageUrl = await uploadImage("categories", file);
      setDraft((prev) => ({ ...prev, image: imageUrl }));
      toast.success(`Uploaded "${file.name}" to Cloudflare R2`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload image");
    }
  };

  const startQuickReplace = (cat: CategoryItem) => {
    setQuickReplaceCard(cat);
    setQuickImageUrl(cat.image || "");
  };

  const saveQuickReplace = async () => {
    if (quickReplaceCard) {
      try { await api(`/admin/content/categories/${quickReplaceCard.id}`, { method: "PATCH", body: JSON.stringify({ data: { ...quickReplaceCard, image: quickImageUrl } }) }); setCategories((items) => items.map((item) => item.id === quickReplaceCard.id ? { ...item, image: quickImageUrl } : item)); toast.success(`Image replaced for "${quickReplaceCard.name}"!`); setQuickReplaceCard(null); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to replace image"); }
    }
  };

  const handleQuickFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setQuickImageUrl(await uploadImage("categories", file));
      toast.success(`Uploaded "${file.name}" to Cloudflare R2`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload image");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shop by Categories Manager"
        description="Add, edit, upload cover graphics, toggle visibility, and manage main storefront categories."
        actions={
          <Button onClick={startCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        }
      />

      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Categories"
          value={stats.total.toString()}
          subtitle="Core store collections"
          icon={Layers}
          colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
          borderClass="hover:border-purple-500/40"
        />
        <StatCard
          label="Live on Storefront"
          value={stats.active.toString()}
          subtitle="Visible to active shoppers"
          icon={CheckCircle2}
          colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
          borderClass="hover:border-emerald-500/40"
        />
        <StatCard
          label="With Cover Images"
          value={stats.withImage.toString()}
          subtitle="Graphics fully uploaded"
          icon={ImageIcon}
          colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
          borderClass="hover:border-blue-500/40"
        />
      </div>

      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Categories List ({filteredItems.length})
          </h2>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search category name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl space-y-3">
          <Filter className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-semibold">No categories found</h3>
          <p className="text-xs text-muted-foreground">Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredItems.map((cat) => (
            <Card key={cat.id} className="overflow-hidden border shadow-xs flex flex-col justify-between group">
              <div className="p-3 space-y-3">
                {/* Cover Image or Icon Frame */}
                <div className="relative h-32 w-full rounded-lg overflow-hidden bg-slate-900 border shadow-inner flex items-center justify-center">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-400">
                      <Layers className="h-8 w-8 opacity-60" />
                      <span className="text-[10px] font-mono">No Cover Graphic</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md rounded-full p-1 border border-white/20">
                    <Switch
                      checked={cat.active}
                      onCheckedChange={() => toggleActive(cat.id)}
                      className="scale-75"
                    />
                  </div>
                  <Badge className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md text-amber-400 border border-amber-400/30 text-[10px] font-mono">
                    /{cat.slug}
                  </Badge>
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-foreground">{cat.name}</h3>
                    {cat.name === "All" && (
                      <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                        Default
                      </Badge>
                    )}
                  </div>
                  {cat.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{cat.description}</p>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="p-2.5 bg-muted/30 border-t flex items-center justify-between text-xs">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2.5 text-primary"
                  onClick={() => startQuickReplace(cat)}
                >
                  <Upload className="h-3 w-3 mr-1" /> Replace Image
                </Button>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => startEdit(cat)}
                    title="Edit Category"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>

                  {cat.name !== "All" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeCategory(cat.id)}
                      title="Delete Category"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Category Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
          {/* Sticky Header */}
          <div className="bg-gradient-to-br from-purple-500/15 via-purple-500/5 to-background px-6 py-[18px] border-b border-border/50 pr-14 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-foreground leading-tight">
                  {editingId ? "Edit Category" : "New Category"}
                </DialogTitle>
                <DialogDescription className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  Configure title, slug, description, and cover graphic.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1 [scrollbar-width:thin] [scrollbar-color:hsl(var(--border))_transparent]">
            {/* Category Name */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-name" className="text-xs font-bold">Category Name <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="cat-name"
                  placeholder="e.g. Apparel"
                  value={draft.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDraft({
                      ...draft,
                      name: val,
                      slug: draft.slug ? draft.slug : val.toLowerCase().replace(/\s+/g, "-"),
                    });
                  }}
                  className="pl-9 text-xs h-11 bg-muted/40 border-border/70 font-semibold"
                />
              </div>
            </div>

            {/* URL Slug */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-slug" className="text-xs font-bold">URL Slug <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="cat-slug"
                  placeholder="e.g. apparel"
                  value={draft.slug}
                  onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                  className="pl-9 text-xs h-11 bg-muted/40 border-border/70 font-mono font-semibold"
                />
              </div>
            </div>

            {/* Description (Optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-desc" className="text-xs font-bold">Description (Optional)</Label>
              <div className="relative">
                <Info className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Textarea
                  id="cat-desc"
                  placeholder="Short tagline summarizing category products..."
                  value={draft.description || ""}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  className="pl-9 text-xs bg-muted/40 border-border/70 resize-none font-semibold"
                  style={{ height: "84px" }}
                />
              </div>
            </div>

            {/* Image Preview & Upload Controls */}
            <div className="space-y-2 pt-3 border-t">
              <Label className="text-xs font-bold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                <ImageIcon className="h-3.5 w-3.5 text-purple-500" /> Cover Graphic Image
              </Label>

              <div className="flex gap-3 items-center bg-muted/20 p-3 rounded-xl border">
                <div className="relative aspect-video w-24 overflow-hidden rounded-lg border bg-slate-950 shadow-xs flex-shrink-0">
                  {draft.image ? (
                    <img src={draft.image} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground bg-muted">
                      No Image
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-bold gap-1 bg-background shadow-2xs border h-9"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5 text-purple-500" /> Upload Cover File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase pointer-events-none">URL</span>
                    <Input
                      placeholder="Or enter image URL link..."
                      value={draft.image || ""}
                      onChange={(e) => setDraft({ ...draft, image: e.target.value })}
                      className="pl-11 text-xs h-9 bg-background border"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-[18px] border-t border-border/40 bg-muted/20 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-10 px-4 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={saveCategory}
              className="h-10 px-5 text-xs font-bold gap-1.5 bg-purple-600 hover:bg-purple-500 text-white shadow-xs"
            >
              <Check className="h-3.5 w-3.5" />
              {editingId ? "Update Category" : "Publish Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Replace Image Modal */}
      <Dialog open={!!quickReplaceCard} onOpenChange={(o) => !o && setQuickReplaceCard(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" /> Replace Category Image
            </DialogTitle>
            <DialogDescription className="text-xs">
              Upload a cover graphic for category &quot;{quickReplaceCard?.name}&quot;.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {quickImageUrl && (
              <div className="relative h-28 w-full overflow-hidden rounded-lg border bg-slate-900">
                <img src={quickImageUrl} alt="Quick Preview" className="h-full w-full object-cover" />
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => quickFileInputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5 mr-1 text-primary" /> Choose Local Image File
            </Button>
            <input
              ref={quickFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleQuickFileUpload}
            />

            <Input
              placeholder="Or paste Image URL..."
              value={quickImageUrl}
              onChange={(e) => setQuickImageUrl(e.target.value)}
              className="text-xs"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setQuickReplaceCard(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveQuickReplace}>
              <Check className="h-3.5 w-3.5 mr-1" /> Replace Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
