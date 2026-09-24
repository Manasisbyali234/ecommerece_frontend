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
  Layers,
  Globe,
  Star,
  Eye,
  EyeOff,
  PlusCircle,
  FileImage,
  ImageIcon,
  LayoutGrid,
  List,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { api, uploadImage } from "@/lib/api";
import { useProducts } from "@/hooks/use-products";

export interface BrandItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  active: boolean;
  featured: boolean;
}

const initialBrands: BrandItem[] = [
  {
    id: "B-1",
    name: "",
    slug: "",
    description: "Flagship audio gear and premium electronics crafted for ultimate durability and clarity.",
    logo: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=200",
    active: true,
    featured: true,
  },
  {
    id: "B-2",
    name: "Sony",
    slug: "sony",
    description: "World-class consumer electronics, TV screens, headphones, and home entertainment technologies.",
    logo: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200",
    active: true,
    featured: true,
  },
  {
    id: "B-3",
    name: "Nike",
    slug: "nike",
    description: "Athletic sportswear, footwear, run wear, and lifestyle apparel designed for athletes worldwide.",
    logo: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200",
    active: true,
    featured: true,
  },
  {
    id: "B-4",
    name: "Adidas",
    slug: "adidas",
    description: "Original sports shoes, classic street apparel, active lifestyle tracksuits, and football wear.",
    logo: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=200",
    active: true,
    featured: false,
  },
  {
    id: "B-5",
    name: "Samsung",
    slug: "samsung",
    description: "Innovative mobile phones, premium galaxy tablets, smartwatches, and visual screens.",
    logo: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200",
    active: true,
    featured: true,
  },
  {
    id: "B-6",
    name: "Fitbit",
    slug: "fitbit",
    description: "Smart fitness trackers, calorie logs, heart rate trackers, and active lifestyle accessories.",
    logo: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200",
    active: true,
    featured: false,
  },
];

export default function AdminBrandsPage() {
  const products = useProducts();
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [detailsBrand, setDetailsBrand] = useState<BrandItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emptyDraft: Omit<BrandItem, "id"> = {
    name: "",
    slug: "",
    description: "",
    logo: "",
    active: true,
    featured: false,
  };

  const [draft, setDraft] = useState<Omit<BrandItem, "id">>(emptyDraft);

  useEffect(() => {
    api<{ items: Array<{ id: string; title: string; active: boolean; data: Omit<BrandItem, "id"> }> }>("/admin/content/brands")
      .then(({ items }) =>
        setBrands(
          items.map((item) => ({
            id: item.id,
            name: item.data?.name || item.title,
            slug: item.data?.slug || "",
            description: item.data?.description || "",
            logo: item.data?.logo || "",
            featured: item.data?.featured || false,
            active: item.active,
          }))
        )
      )
      .catch((err) => toast.error(err instanceof Error ? err.message : "Unable to load saved brands"));
  }, []);

  // Filtered brands list
  const filteredBrands = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q)
    );
  }, [brands, searchQuery]);

  // Statistics counters
  const stats = useMemo(() => {
    return {
      total: brands.length,
      active: brands.filter((b) => b.active).length,
      featured: brands.filter((b) => b.featured).length,
    };
  }, [brands]);

  // Helper to count associated products dynamically — matches by brand ID or legacy brand name
  const getProductCount = (brandId: string, brandName: string) => {
    return products.filter((p) => p.brand === brandId || p.brand?.toLowerCase() === brandName.toLowerCase()).length;
  };

  // Toggle active status
  const toggleActive = async (id: string) => {
    const brand = brands.find((item) => item.id === id); if (!brand) return;
    try { await api(`/admin/content/brands/${id}`, { method: "PATCH", body: JSON.stringify({ active: !brand.active }) });
    setBrands((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const nextActive = !b.active;
          toast.success(`Brand "${b.name}" ${nextActive ? "activated" : "paused"}`);
          return { ...b, active: nextActive };
        }
        return b;
      })
    );
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update brand"); }
  };

  // Toggle featured status
  const toggleFeatured = async (id: string) => {
    const brand = brands.find((item) => item.id === id); if (!brand) return;
    try { await api(`/admin/content/brands/${id}`, { method: "PATCH", body: JSON.stringify({ data: { ...brand, featured: !brand.featured } }) });
    setBrands((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const nextFeatured = !b.featured;
          toast.info(`Brand "${b.name}" ${nextFeatured ? "marked as Featured" : "removed from Featured"}`);
          return { ...b, featured: nextFeatured };
        }
        return b;
      })
    );
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update brand"); }
  };

  // Start creation form
  const startCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setOpen(true);
  };

  // Start editing form
  const startEdit = (brand: BrandItem) => {
    setEditingId(brand.id);
    setDraft({
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      logo: brand.logo,
      active: brand.active,
      featured: brand.featured,
    });
    setOpen(true);
  };

  // Delete brand
  const handleDeleteBrand = async (id: string, name: string) => {
    try { await api(`/admin/content/brands/${id}`, { method: "DELETE" });
    setBrands((prev) => prev.filter((b) => b.id !== id));
    toast.error(`Removed Brand "${name}" from CMS`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to remove brand"); }
  };

  // Upload logo to Cloudflare R2 brands/ folder
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage("brands", file);
      setDraft((prev) => ({ ...prev, logo: url }));
      toast.success(`Uploaded "${file.name}" to Cloudflare R2`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload logo");
    }
  };

  // Save changes (Create / Edit)
  const handleSave = async () => {
    if (!draft.name.trim()) {
      toast.error("Brand name is required");
      return;
    }
    const slug = draft.slug.trim() || draft.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const brandData = { name: draft.name, slug, description: draft.description, logo: draft.logo, active: draft.active, featured: draft.featured };
    try { if (editingId) {
      // Update — if logo changed, old R2 image is cleaned up server-side on delete only;
      // new logo is already uploaded to R2 before save.
      await api(`/admin/content/brands/${editingId}`, { method: "PATCH", body: JSON.stringify({ title: brandData.name, slug, active: brandData.active, data: brandData }) });
      setBrands((prev) =>
        prev.map((b) => (b.id === editingId ? { ...b, ...brandData, id: editingId } : b))
      );
      toast.success(`Updated brand "${draft.name}"`);
    } else {
      const { item } = await api<{ item: { id: string; data: Omit<BrandItem, "id">; active: boolean } }>("/admin/content/brands", { method: "POST", body: JSON.stringify({ title: brandData.name, slug, active: brandData.active, data: brandData }) });
      setBrands((prev) => [...prev, { ...brandData, id: item.id }]);
      toast.success(`Created brand "${draft.name}"`);
    }
    setOpen(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save brand"); }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Tag className="h-6 w-6 text-amber-500" /> Brands Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure partner brands, logos, descriptions, featured tags, and landing page visibility options.
          </p>
        </div>

        <Button
          onClick={startCreate}
          size="sm"
          className="text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
        >
          <Plus className="h-4 w-4" /> Add New Brand
        </Button>
      </div>

      {/* Stats Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total Brand Partners</span>
              <h3 className="text-2xl font-extrabold text-foreground">{stats.total}</h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Tag className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Active Storefront</span>
              <h3 className="text-2xl font-extrabold text-foreground">{stats.active}</h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Eye className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Featured Brands</span>
              <h3 className="text-2xl font-extrabold text-foreground">{stats.featured}</h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Star className="h-5 w-5 fill-current" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="border shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search brand partners by name, slug, description..."
                className="pl-9 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Grid / List View Switcher */}
            <div className="flex items-center rounded-lg border bg-muted/60 p-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 transition-all ${
                  viewMode === "grid"
                    ? "bg-background text-foreground shadow-xs hover:bg-background"
                    : "text-muted-foreground/70 hover:text-foreground hover:bg-transparent"
                }`}
                onClick={() => setViewMode("grid")}
                title="Grid view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 transition-all ${
                  viewMode === "table"
                    ? "bg-background text-foreground shadow-xs hover:bg-background"
                    : "text-muted-foreground/70 hover:text-foreground hover:bg-transparent"
                }`}
                onClick={() => setViewMode("table")}
                title="List view"
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brands Content List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBrands.map((brand) => {
            const productCount = getProductCount(brand.id, brand.name);
                brand.active ? "" : "opacity-75 border-dashed"
              }`}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Brand Logo Thumbnail */}
                      <div className="h-12 w-12 rounded-xl overflow-hidden border bg-background shrink-0 flex items-center justify-center shadow-2xs">
                        {brand.logo ? (
                          <img src={brand.logo} alt={brand.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-muted-foreground uppercase">{brand.name.slice(0, 2)}</span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                          {brand.name}
                          {brand.featured && (
                            <Star className="h-3 w-3 fill-indigo-600 text-indigo-600" />
                          )}
                        </h4>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <button
                        onClick={() => toggleActive(brand.id)}
                        className="focus:outline-none"
                        title={`Click to mark as ${brand.active ? "Inactive" : "Active"}`}
                      >
                        <Badge variant="outline" className={`text-[9px] font-bold cursor-pointer transition-all hover:scale-105 active:scale-95 select-none ${
                          brand.active ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/25" : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                        }`}>
                          {brand.active ? "Active" : "Inactive"}
                        </Badge>
                      </button>
                    </div>
                  </div>


                  {/* Associated Products Badge */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      <Layers className="h-3.5 w-3.5 text-primary" />
                      <span>{productCount} Associated Product{productCount !== 1 ? "s" : ""}</span>
                    </div>
                    {productCount > 0 && (
                      <button
                        onClick={() => setDetailsBrand(brand)}
                        className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-500 hover:underline cursor-pointer"
                      >
                        View details
                      </button>
                    )}
                  </div>
                </CardContent>

                {/* Action Buttons */}
                <div className="p-3 bg-muted/20 border-t flex items-center justify-between gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(brand)}
                    className="h-8 text-xs font-bold gap-1 flex-1"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-primary" /> Edit Brand
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleFeatured(brand.id)}
                    className={`h-8 w-8 ${brand.featured ? "text-indigo-600 hover:bg-indigo-50" : "text-slate-400 hover:text-indigo-600"}`}
                    title="Toggle Featured status"
                  >
                    <Star className={`h-3.5 w-3.5 ${brand.featured ? "fill-current" : ""}`} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleActive(brand.id)}
                    className={`h-8 w-8 ${brand.active ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:text-emerald-600"}`}
                    title={brand.active ? "Pause visibility" : "Activate visibility"}
                  >
                    {brand.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteBrand(brand.id, brand.name)}
                    className="h-8 w-8 text-rose-500 hover:bg-rose-50"
                    title="Remove Brand"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-bold w-[250px]">Brand Name</TableHead>
                <TableHead className="text-xs font-bold">Products</TableHead>
                <TableHead className="text-xs font-bold">Featured</TableHead>
                <TableHead className="text-xs font-bold">Visibility</TableHead>
                <TableHead className="text-xs font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBrands.map((brand) => {
                const productCount = getProductCount(brand.id, brand.name);
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg overflow-hidden border bg-background flex items-center justify-center shrink-0 shadow-3xs">
                          {brand.logo ? (
                            <img src={brand.logo} alt={brand.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xs font-extrabold text-muted-foreground uppercase">{brand.name.slice(0, 2)}</span>
                          )}
                        </div>
                        <span className="font-bold text-xs text-foreground">{brand.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      {productCount} item{productCount !== 1 ? "s" : ""}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => toggleFeatured(brand.id)}
                        className={`p-1 rounded hover:bg-muted ${brand.featured ? "text-indigo-600" : "text-muted-foreground/40"}`}
                        title="Toggle Featured"
                      >
                        <Star className={`h-4 w-4 ${brand.featured ? "fill-current" : ""}`} />
                      </button>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => toggleActive(brand.id)}
                        className="focus:outline-none block"
                        title={`Click to mark as ${brand.active ? "Inactive" : "Active"}`}
                      >
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold cursor-pointer transition-all hover:scale-105 active:scale-95 select-none ${
                            brand.active
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/20"
                          }`}
                        >
                          {brand.active ? "Active" : "Inactive"}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-indigo-600 hover:bg-indigo-50"
                          onClick={() => setDetailsBrand(brand)}
                          title="View associated products"
                        >
                          <Layers className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(brand)}>
                          <Edit2 className="h-3.5 w-3.5 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-rose-500"
                          onClick={() => handleDeleteBrand(brand.id, brand.name)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* BRAND ENTRY DIALOG MODAL */}
      {/* ========================================================================= */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl border shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-5 border-b bg-muted/20">
            <DialogTitle className="text-base font-extrabold flex items-center gap-1.5">
              <Tag className="h-5 w-5 text-amber-500" />
              {editingId ? "Edit Brand Details" : "Add New Brand"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Configure parameters, logo and landing page promotional visibility.
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-4">
            {/* Logo image upload & preview row */}
            <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/10">
              <div className="relative h-16 w-16 rounded-xl overflow-hidden border bg-background shrink-0 flex items-center justify-center">
                {draft.logo ? (
                  <img src={draft.logo} alt="Logo preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center p-1 text-center text-slate-500">
                    <ImageIcon className="h-5 w-5 mb-0.5" />
                    <span className="text-[8px] font-bold">No Logo</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <Label className="text-[11px] font-bold text-foreground block">Brand Logo / Seal</Label>
                <div className="flex items-center gap-1.5">
                  <Input
                    placeholder="Paste logo image URL..."
                    value={draft.logo}
                    onChange={(e) => setDraft({ ...draft, logo: e.target.value })}
                    className="text-xs h-8"
                  />
                  <label className="cursor-pointer shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="sr-only"
                    />
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded border bg-background hover:bg-muted text-foreground transition-colors shadow-2xs">
                      <Upload className="h-4 w-4" />
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Brand Name */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground">Brand Name *</Label>
              <Input
                placeholder="e.g. Sony / Nike / Apple"
                value={draft.name}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    name: e.target.value,
                    slug: e.target.value
                      .toLowerCase()
                      .replace(/\s+/g, "-")
                      .replace(/[^a-z0-9-]/g, ""),
                  })
                }
                className="text-xs font-bold"
              />
            </div>



            {/* Switches */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-[11px] font-bold text-foreground">Featured</Label>
                  <span className="text-[9px] text-muted-foreground block">Highlight tag</span>
                </div>
                <Switch
                  checked={draft.featured}
                  onCheckedChange={(checked) => setDraft({ ...draft, featured: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-[11px] font-bold text-foreground">Active</Label>
                  <span className="text-[9px] text-muted-foreground block">Store visibility</span>
                </div>
                <Switch
                  checked={draft.active}
                  onCheckedChange={(checked) => setDraft({ ...draft, active: checked })}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t bg-muted/20 flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="text-xs font-bold">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              className="text-xs font-bold gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
            >
              <Check className="h-4 w-4" /> Add Brand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* ASSOCIATED PRODUCTS DETAILS DIALOG MODAL */}
      {/* ========================================================================= */}
      <Dialog open={detailsBrand !== null} onOpenChange={(open) => !open && setDetailsBrand(null)}>
        <DialogContent className="max-w-2xl border shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-5 border-b bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg overflow-hidden border bg-background shrink-0 flex items-center justify-center shadow-3xs">
                {detailsBrand?.logo ? (
                  <img src={detailsBrand.logo} alt={detailsBrand.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground uppercase">{detailsBrand?.name.slice(0, 2)}</span>
                )}
              </div>
              <div>
                <DialogTitle className="text-base font-extrabold text-foreground">
                  {detailsBrand?.name} - Associated Products
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Browse all active and draft products matching this brand partner in the catalog.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-5 overflow-y-auto max-h-[400px]">
            {detailsBrand && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold">Product</TableHead>
                    <TableHead className="text-xs font-bold">SKU</TableHead>
                    <TableHead className="text-xs font-bold">Category</TableHead>
                    <TableHead className="text-xs font-bold">Price</TableHead>
                    <TableHead className="text-xs font-bold">Stock</TableHead>
                    <TableHead className="text-xs font-bold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products
                    .filter((p) => p.brand === detailsBrand.id || p.brand?.toLowerCase() === detailsBrand.name.toLowerCase())
                    .map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-0">
                            <img src={p.image} alt={p.name} className="h-8 w-8 rounded-md object-cover border shrink-0" />
                            <span className="font-bold text-xs text-foreground truncate max-w-[150px]">{p.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{p.sku}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.category}</TableCell>
                        <TableCell className="text-xs font-semibold text-foreground">
                          {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(p.price)}
                        </TableCell>
                        <TableCell className="text-xs font-bold">{p.stock} units</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[9px] font-bold capitalize ${
                            p.status === "active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground"
                          }`}>
                            {p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter className="p-4 border-t bg-muted/20">
            <Button variant="outline" size="sm" onClick={() => setDetailsBrand(null)} className="text-xs font-bold">
              Close Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
