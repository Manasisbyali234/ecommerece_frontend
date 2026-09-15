"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Upload,
  Search,
  Grid,
  Check,
  Tag,
  Filter,
  FolderTree,
  CheckCircle2,
  Shirt,
  Layers,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

import { useStore, store, type SubCategory } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { api, uploadImage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const CATEGORIES = ["Apparel", "Electronics", "Home", "Footwear", "Bags", "Audio"];

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

export default function AdminSubCategoriesPage() {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCatFilter, setSelectedCatFilter] = useState("All");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emptyDraft: Omit<SubCategory, "id"> = {
    title: "",
    discount: "50-80% OFF",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600",
    category: "Apparel",
    active: true,
  };

  const [draft, setDraft] = useState<Omit<SubCategory, "id">>(emptyDraft);

  // Quick image replacement state
  const [quickReplaceCard, setQuickReplaceCard] = useState<SubCategory | null>(null);
  const [quickImageUrl, setQuickImageUrl] = useState("");
  const quickFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { api<{ items: Array<{ id: string; title: string; active: boolean; data: Omit<SubCategory, "id"> }> }>("/admin/content/sub-categories").then(({ items }) => setSubCategories(items.map((item) => ({ ...item.data, id: item.id, title: item.data.title || item.title, active: item.active })))).catch(() => toast.error("Unable to load saved subcategories")); }, []);

  const filteredItems = useMemo(() => {
    let result = subCategories;
    if (selectedCatFilter !== "All") {
      result = result.filter((item) => item.category === selectedCatFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) => item.title.toLowerCase().includes(q) || item.discount.toLowerCase().includes(q)
      );
    }
    return result;
  }, [subCategories, selectedCatFilter, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: subCategories.length,
      active: subCategories.filter((sc) => sc.active).length,
      apparel: subCategories.filter((sc) => sc.category === "Apparel").length,
      others: subCategories.filter((sc) => sc.category !== "Apparel").length,
    };
  }, [subCategories]);

  const toggleActive = async (id: string) => {
    const sc = subCategories.find((x) => x.id === id);
    if (sc) {
      try { await api(`/admin/content/sub-categories/${id}`, { method: "PATCH", body: JSON.stringify({ active: !sc.active }) }); setSubCategories((items) => items.map((item) => item.id === id ? { ...item, active: !item.active } : item)); toast.success(`Sub Category "${sc.title}" ${sc.active ? "paused" : "activated"}`); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update subcategory"); }
    }
  };

  const startCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setOpen(true);
  };

  const startEdit = (item: SubCategory) => {
    setEditingId(item.id);
    const { id, ...rest } = item;
    setDraft(rest);
    setOpen(true);
  };

  const saveSubCategory = async () => {
    if (!draft.title.trim()) {
      toast.error("Sub Category Title is required");
      return;
    }

    const slug = draft.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    try { if (editingId) { const { item } = await api<{ item: { id: string; title: string; active: boolean; data: Omit<SubCategory, "id"> } }>(`/admin/content/sub-categories/${editingId}`, { method: "PATCH", body: JSON.stringify({ title: draft.title, slug, active: draft.active, data: draft }) }); const saved = { ...item.data, id: item.id, title: item.data.title || item.title, active: item.active }; setSubCategories((items) => items.map((item) => item.id === editingId ? saved : item)); toast.success("Sub Category updated live!"); } else { const { item } = await api<{ item: { id: string; title: string; active: boolean; data: Omit<SubCategory, "id"> } }>("/admin/content/sub-categories", { method: "POST", body: JSON.stringify({ title: draft.title, slug, active: draft.active, data: draft }) }); setSubCategories((items) => [{ ...item.data, id: item.id, title: item.data.title || item.title, active: item.active }, ...items]); toast.success("New Sub Category added live to storefront!"); } setOpen(false); setEditingId(null); setDraft(emptyDraft); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save subcategory"); }
  };

  const removeSubCategory = async (id: string) => {
    try { await api(`/admin/content/sub-categories/${id}`, { method: "DELETE" }); setSubCategories((items) => items.filter((item) => item.id !== id)); toast.success("Sub category removed"); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to remove subcategory"); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imageUrl = await uploadImage("sub-categories", file);
      setDraft((prev) => ({ ...prev, image: imageUrl }));
      toast.success(`Uploaded "${file.name}" to Cloudflare R2`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload image");
    }
  };

  const startQuickReplace = (sc: SubCategory) => {
    setQuickReplaceCard(sc);
    setQuickImageUrl(sc.image || "");
  };

  const saveQuickReplace = async () => {
    if (quickReplaceCard) {
      try { await api(`/admin/content/sub-categories/${quickReplaceCard.id}`, { method: "PATCH", body: JSON.stringify({ data: { ...quickReplaceCard, image: quickImageUrl } }) }); setSubCategories((items) => items.map((item) => item.id === quickReplaceCard.id ? { ...item, image: quickImageUrl } : item)); toast.success(`Image replaced for "${quickReplaceCard.title}"!`); setQuickReplaceCard(null); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to replace image"); }
    }
  };

  const handleQuickFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setQuickImageUrl(await uploadImage("sub-categories", file));
      toast.success(`Uploaded "${file.name}" to Cloudflare R2`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload image");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shop by Sub Category Manager"
        description="Add, edit, upload images, and manage offer discount cards for the storefront 'Shop by sub category' grid."
        actions={
          <Button onClick={startCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Sub Category
          </Button>
        }
      />

      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Sub Categories"
          value={stats.total.toString()}
          subtitle="Configured subcategory items"
          icon={FolderTree}
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
          label="Apparel Collection"
          value={stats.apparel.toString()}
          subtitle="Fashion & clothing grids"
          icon={Shirt}
          colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
          borderClass="hover:border-amber-500/40"
        />
        <StatCard
          label="Other Categories"
          value={stats.others.toString()}
          subtitle="Electronics, home & bags"
          icon={Layers}
          colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
          borderClass="hover:border-blue-500/40"
        />
      </div>

      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-2">
          <Grid className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Sub Category Cards ({filteredItems.length})
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search sub category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <Select value={selectedCatFilter} onValueChange={setSelectedCatFilter}>
            <SelectTrigger className="h-9 text-xs w-[160px]">
              <SelectValue placeholder="Category filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl space-y-3">
          <Filter className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-semibold">No sub categories found</h3>
          <p className="text-xs text-muted-foreground">Try clearing your search query or category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredItems.map((sc) => (
            <Card key={sc.id} className="overflow-hidden border shadow-xs flex flex-col justify-between group">
              <div className="p-2 space-y-2">
                {/* Image Container with Active Switch */}
                <div className="relative aspect-[4/5] w-full rounded-lg overflow-hidden bg-slate-900 border shadow-inner">
                  <img
                    src={sc.image}
                    alt={sc.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md rounded-full p-1 border border-white/20">
                    <Switch
                      checked={sc.active}
                      onCheckedChange={() => toggleActive(sc.id)}
                      className="scale-75"
                    />
                  </div>
                  <Badge className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md text-amber-400 border border-amber-400/30 text-[9px]">
                    {sc.category}
                  </Badge>
                </div>

                {/* Text Details */}
                <div className="text-center space-y-0.5 pt-1">
                  <h3 className="font-bold text-xs text-foreground line-clamp-1">{sc.title}</h3>
                  <p className="font-black text-xs text-emerald-600 dark:text-emerald-400">{sc.discount}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-2 pt-0 flex items-center justify-between border-t text-xs gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 text-primary"
                  onClick={() => startQuickReplace(sc)}
                  title="Replace Image"
                >
                  <Upload className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => startEdit(sc)}
                  title="Edit Sub Category"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => removeSubCategory(sc.id)}
                  title="Delete Sub Category"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl shadow-2xl">
          {/* Gradient Header */}
          <div className="bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-background px-6 pt-6 pb-4 border-b border-border/50 pr-14">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Grid className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground leading-tight">
                  {editingId ? "Edit Sub Category Card" : "New Sub Category Card"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Configure sub category title, offer discount badge, target store category, and graphic image.
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Sub Category Title */}
            <div className="space-y-1.5">
              <Label htmlFor="sc-title" className="text-xs font-bold">Sub Category Title <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="sc-title"
                  placeholder="e.g. Ethnic Wear"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  className="pl-9 text-xs h-9 bg-muted/40 border-border/70 font-semibold"
                />
              </div>
            </div>

            {/* Discount Badge Text */}
            <div className="space-y-1.5">
              <Label htmlFor="sc-discount" className="text-xs font-bold">Discount Badge Text</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">%</span>
                <Input
                  id="sc-discount"
                  placeholder="e.g. 50-80% OFF"
                  value={draft.discount}
                  onChange={(e) => setDraft({ ...draft, discount: e.target.value })}
                  className="pl-8 text-xs h-9 bg-muted/40 border-border/70 font-semibold"
                />
              </div>
            </div>

            {/* Target Store Category */}
            <div className="space-y-1.5">
              <Label htmlFor="sc-cat" className="text-xs font-bold">Target Store Category</Label>
              <Select
                value={draft.category}
                onValueChange={(v) => setDraft({ ...draft, category: v })}
              >
                <SelectTrigger id="sc-cat" className="h-9 text-xs bg-muted/40 border-border/70 font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs font-semibold">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Image Preview & Upload Controls */}
            <div className="space-y-2.5 pt-3 border-t">
              <Label className="text-xs font-bold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                <ImageIcon className="h-3.5 w-3.5 text-amber-500" /> Image Source &amp; Graphics
              </Label>

              <div className="flex flex-col sm:flex-row gap-3 items-center bg-muted/20 p-3 rounded-xl border">
                <div className="relative aspect-[4/5] w-20 overflow-hidden rounded-lg border bg-slate-950 shadow-xs flex-shrink-0">
                  <img src={draft.image} alt="Preview" className="h-full w-full object-cover" />
                </div>

                <div className="flex-1 w-full space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-bold gap-1 bg-background shadow-2xs border"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5 text-amber-500" /> Upload Local Image
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
                      value={draft.image}
                      onChange={(e) => setDraft({ ...draft, image: e.target.value })}
                      className="pl-11 text-xs h-8 bg-background border"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border/40 bg-muted/20">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-9 px-4 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={saveSubCategory}
              className="h-9 px-5 text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs"
            >
              <Check className="h-3.5 w-3.5" />
              {editingId ? "Update Sub Category" : "Publish Sub Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Replace Image Modal */}
      <Dialog open={!!quickReplaceCard} onOpenChange={(o) => !o && setQuickReplaceCard(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" /> Replace Card Image
            </DialogTitle>
            <DialogDescription className="text-xs">
              Upload a new image file for &quot;{quickReplaceCard?.title}&quot;.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="relative aspect-[4/5] w-28 mx-auto overflow-hidden rounded-lg border bg-slate-900">
              <img src={quickImageUrl} alt="Quick Preview" className="h-full w-full object-cover" />
            </div>

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
