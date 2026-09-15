"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  Megaphone,
  Image as ImageIcon,
  Eye,
  Edit2,
  Upload,
  Crop,
  Sliders,
  Sparkles,
  Info,
  Maximize2,
  Move,
  Check,
  Layout,
  LayoutGrid,
  AlignLeft,
  AlignRight,
  AlignCenter,
  Type,
  Palette,
  Tag,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
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
  useStore,
  store,
  type Banner,
  type BannerKind,
  type Placement,
  type Orientation,
  type ImageFit,
  type ImagePosition,
  type BannerLayout,
  type CollageItem,
  type TypographyStyle,
  type FontFamilyOption,
  type FontSizeOption,
  type FontWeightOption,
} from "@/lib/store";
import { formatCurrency } from "@/lib/mock-data";
import { api, uploadImage } from "@/lib/api";

const placementLabel: Record<Placement, string> = {
  top: "Top Announcement Bar",
  homepage: "Hero Main Banners",
  checkout: "Checkout Page Banners",
  sidebar: "Sidebar Banners",
  after_hero: "Secondary Row Banners",
  after_category: "Category Promo Banners",
  after_mega_deals: "Special Deals Banners",
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "hero" | "after_hero" | "after_category" | "after_mega_deals">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emptyDraft: Omit<Banner, "id"> = {
    title: "",
    subtitle: "",
    body: "",
    kind: "hero",
    placement: "homepage",
    bgColor: "#0f172a",
    textColor: "#ffffff",
    ctaLabel: "Shop Now",
    ctaUrl: "/#products",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600",
    price: 1499,
    orientation: "landscape",
    imageFit: "cover",
    imagePosition: "center",
    zoom: 1,
    layout: "layout1",
    collageCols: 3,
    collageRows: 0,
    collageGapPx: 12,
    collageItems: [
      {
        id: "col-1",
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
        title: "Audio Headphones",
        subtitle: "Up to 50% Off",
        ctaUrl: "/products?category=Audio",
        aspectRatio: "square",
        gridSpan: 1,
      },
      {
        id: "col-2",
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
        title: "Smart Watches",
        subtitle: "Fitness & Sport",
        ctaUrl: "/products?category=Electronics",
        aspectRatio: "square",
        gridSpan: 1,
      },
      {
        id: "col-3",
        imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600",
        title: "Designer Fashion",
        subtitle: "New Trends",
        ctaUrl: "/products?category=Apparel",
        aspectRatio: "square",
        gridSpan: 1,
      },
    ],
    titleStyle: { color: "#ffffff", fontFamily: "sans", fontSize: "5xl", fontWeight: "extrabold" },
    subtitleStyle: { color: "#38bdf8", fontFamily: "sans", fontSize: "lg", fontWeight: "semibold" },
    bodyStyle: { color: "#cbd5e1", fontFamily: "sans", fontSize: "base", fontWeight: "normal" },
    active: true,
    starts: new Date().toISOString().slice(0, 10),
    ends: "2026-12-31",
  };

  const [draft, setDraft] = useState<Omit<Banner, "id">>(emptyDraft);

  const toBanner = (item: { id: string; title: string; active: boolean; data: Omit<Banner, "id"> }): Banner => ({ ...item.data, id: item.id, title: item.title, active: item.active });

  useEffect(() => {
    api<{ items: Array<{ id: string; title: string; active: boolean; data: Omit<Banner, "id"> }> }>("/admin/content/banners")
      .then(({ items }) => setBanners(items.map(toBanner)))
      .catch(() => toast.error("Unable to load saved banners. Sign in as an admin first."));
  }, []);

  const heroBanners = useMemo(() => banners.filter((b) => b.placement === "homepage" || !b.placement), [banners]);
  const afterHeroBanners = useMemo(() => banners.filter((b) => b.placement === "after_hero"), [banners]);
  const afterCategoryBanners = useMemo(() => banners.filter((b) => b.placement === "after_category"), [banners]);
  const afterMegaDealsBanners = useMemo(() => banners.filter((b) => b.placement === "after_mega_deals"), [banners]);

  const filteredBanners = useMemo(() => {
    if (activeTab === "hero") return heroBanners;
    if (activeTab === "after_hero") return afterHeroBanners;
    if (activeTab === "after_category") return afterCategoryBanners;
    if (activeTab === "after_mega_deals") return afterMegaDealsBanners;
    return banners;
  }, [activeTab, heroBanners, afterHeroBanners, afterCategoryBanners, afterMegaDealsBanners, banners]);

  const adBannersCount = useMemo(() => {
    return banners.filter((b) => b.placement && b.placement !== "homepage").length;
  }, [banners]);

  const stats = useMemo(() => {
    return {
      total: banners.length,
      active: banners.filter((b) => b.active).length,
      hero: heroBanners.length,
      adBanners: adBannersCount,
    };
  }, [banners, heroBanners, adBannersCount]);

  const toggle = async (id: string) => {
    const b = banners.find((x) => x.id === id);
    if (b) {
      try {
        await api(`/admin/content/banners/${id}`, { method: "PATCH", body: JSON.stringify({ active: !b.active }) });
        setBanners((items) => items.map((item) => item.id === id ? { ...item, active: !item.active } : item));
        toast.success(`Banner ${b.active ? "paused" : "activated"}`);
      } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update banner"); }
    }
  };

  const remove = async (id: string) => {
    try {
      await api(`/admin/content/banners/${id}`, { method: "DELETE" });
      setBanners((items) => items.filter((item) => item.id !== id));
      toast.success("Banner deleted");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to delete banner"); }
  };

  const startEdit = (b: Banner) => {
    setEditingId(b.id);
    const { id, ...rest } = b;
    setDraft({
      orientation: "landscape",
      imageFit: "cover",
      imagePosition: "center",
      zoom: 1,
      layout: "layout1",
      titleStyle: { color: "#ffffff", fontFamily: "sans", fontSize: "5xl", fontWeight: "extrabold" },
      subtitleStyle: { color: "#38bdf8", fontFamily: "sans", fontSize: "lg", fontWeight: "semibold" },
      bodyStyle: { color: "#cbd5e1", fontFamily: "sans", fontSize: "base", fontWeight: "normal" },
      ...rest,
    });
    setOpen(true);
  };

  const startCreate = () => {
    let placement: Placement = "homepage";
    if (activeTab === "after_hero") placement = "after_hero";
    if (activeTab === "after_category") placement = "after_category";
    if (activeTab === "after_mega_deals") placement = "after_mega_deals";

    setEditingId(null);
    setDraft({ ...emptyDraft, placement });
    setOpen(true);
  };

  // Banner assets are stored under banners/ in Cloudflare R2.
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imageUrl = await uploadImage("banners", file);
      setDraft((prev) => ({ ...prev, imageUrl }));
      toast.success(`Uploaded "${file.name}" to Cloudflare R2`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to upload banner image"); }
  };

  const saveBanner = async () => {
    const finalDraft = {
      ...draft,
      title:
        (draft.layout === "imageOnly" || draft.layout === "collage") && !draft.title.trim()
          ? "Collage Grid Banner"
          : draft.title,
    };

    if (!finalDraft.title.trim()) {
      toast.error("Banner headline is required");
      return;
    }

    try {
      const baseSlug = finalDraft.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "banner";
      const payload = { title: finalDraft.title, slug: editingId ? baseSlug : `${baseSlug}-${Date.now()}`, active: finalDraft.active, data: finalDraft };
      if (editingId) {
        const { item: saved } = await api<{ item: { id: string; title: string; active: boolean; data: Omit<Banner, "id"> } }>(`/admin/content/banners/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) });
        const savedBanner = toBanner(saved);
        setBanners((items) => items.map((item) => item.id === editingId ? savedBanner : item));
        toast.success("Banner updated live");
      } else {
        const { item } = await api<{ item: { id: string; title: string; active: boolean; data: Omit<Banner, "id"> } }>("/admin/content/banners", { method: "POST", body: JSON.stringify(payload) });
        setBanners((items) => [toBanner(item), ...items]);
        toast.success("Hero advertisement banner published live to storefront!");
      }
      setOpen(false); setDraft(emptyDraft); setEditingId(null);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save banner"); }
  };

  const [quickReplaceBanner, setQuickReplaceBanner] = useState<Banner | null>(null);
  const [quickImageUrl, setQuickImageUrl] = useState("");
  const quickFileInputRef = useRef<HTMLInputElement>(null);

  const startQuickReplace = (b: Banner) => {
    setQuickReplaceBanner(b);
    setQuickImageUrl(b.imageUrl || "");
  };

  const saveQuickReplace = async () => {
    if (quickReplaceBanner) {
      try {
        await api(`/admin/content/banners/${quickReplaceBanner.id}`, { method: "PATCH", body: JSON.stringify({ data: { ...quickReplaceBanner, imageUrl: quickImageUrl } }) });
        setBanners((items) => items.map((item) => item.id === quickReplaceBanner.id ? { ...item, imageUrl: quickImageUrl } : item));
        toast.success(`Banner image replaced for "${quickReplaceBanner.title}"!`); setQuickReplaceBanner(null);
      } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to replace image"); }
    }
  };

  const handleQuickFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setQuickImageUrl(await uploadImage("banners", file));
      toast.success(`Uploaded "${file.name}" to Cloudflare R2`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to upload banner image"); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Advertisement Banners Editor"
        description="Upload product images, set typography styling (color, font-family, font-size, font-weight), layout & orientation, and frame/crop hero ads for the storefront."
        actions={
          <Button onClick={startCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Banner
          </Button>
        }
      />

      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Banners"
          value={stats.total.toString()}
          subtitle="All storefront graphics"
          icon={Megaphone}
          colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
          borderClass="hover:border-amber-500/40"
        />
        <StatCard
          label="Live Now"
          value={stats.active.toString()}
          subtitle="Published & live on website"
          icon={CheckCircle2}
          colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
          borderClass="hover:border-emerald-500/40"
        />
        <StatCard
          label="Hero Ad Carousel"
          value={stats.hero.toString()}
          subtitle="Top homepage slider ads"
          icon={Layout}
          colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
          borderClass="hover:border-blue-500/40"
        />
        <StatCard
          label="Advertisement Banners"
          value={stats.adBanners.toString()}
          subtitle="Category & promo sections"
          icon={Sparkles}
          colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
          borderClass="hover:border-purple-500/40"
        />
      </div>

      {/* Storefront Banners Section with Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Storefront Banners List
          </h2>
          <span className="text-xs text-muted-foreground">
            Managing {filteredBanners.length} banners in current section
          </span>
        </div>

        {/* Section Management Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "all"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md ring-1 ring-slate-800"
                : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Megaphone className="h-3.5 w-3.5 text-amber-400" />
            <span>All Storefront Banners</span>
            <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px] bg-white/20 dark:bg-black/20 text-current border-0 font-extrabold">
              {banners.length}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("hero")}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "hero"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md ring-1 ring-slate-800"
                : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5 text-blue-400" />
            <span>Hero Main Banners</span>
            <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px] bg-white/20 dark:bg-black/20 text-current border-0 font-extrabold">
              {heroBanners.length}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("after_hero")}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "after_hero"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md ring-1 ring-slate-800"
                : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layout className="h-3.5 w-3.5 text-emerald-400" />
            <span>Secondary Row Banners</span>
            <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px] bg-white/20 dark:bg-black/20 text-current border-0 font-extrabold">
              {afterHeroBanners.length}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("after_category")}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "after_category"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md ring-1 ring-slate-800"
                : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Tag className="h-3.5 w-3.5 text-purple-400" />
            <span>Category Promo Banners</span>
            <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px] bg-white/20 dark:bg-black/20 text-current border-0 font-extrabold">
              {afterCategoryBanners.length}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("after_mega_deals")}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "after_mega_deals"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md ring-1 ring-slate-800"
                : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Special Deals Banners</span>
            <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px] bg-white/20 dark:bg-black/20 text-current border-0 font-extrabold">
              {afterMegaDealsBanners.length}
            </Badge>
          </button>
        </div>

        {filteredBanners.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-xl space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">No banners found for this section</p>
            <Button size="sm" variant="outline" onClick={startCreate}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Banner in this Section
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredBanners.map((b) => (
              <Card key={b.id} className="overflow-hidden border shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold">{b.title}</CardTitle>
                      {b.active ? (
                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Live</Badge>
                      ) : (
                        <Badge variant="secondary">Paused</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {b.kind === "hero" ? (
                        <ImageIcon className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Megaphone className="h-3.5 w-3.5" />
                      )}
                      <span>{placementLabel[b.placement] ?? b.placement}</span>
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {b.layout ?? "layout1"}
                      </Badge>
                      {b.price !== undefined && (
                        <span className="font-semibold text-primary">{formatCurrency(b.price)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={b.active} onCheckedChange={() => toggle(b.id)} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <BannerPreview banner={b} />

                  <div className="flex flex-wrap items-center justify-between pt-2 border-t text-xs gap-2">
                    <div className="text-muted-foreground">
                      {b.starts} → {b.ends}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => startQuickReplace(b)}>
                        <Upload className="h-3.5 w-3.5 mr-1 text-primary" /> Replace Image
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => startEdit(b)}>
                        <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(b.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog with Upload, Layout, Typography & Crop Controls */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Advertisement Banner" : "Advertisement Banner"}
            </DialogTitle>
            <DialogDescription>
              Select placement section, customize headline, tagline, typography styling, colors and upload banner.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-2">
            {/* Banner Placement Selection */}
            <div className="space-y-1.5">
              <Label htmlFor="placement" className="font-semibold text-xs flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-primary" /> Banner Section Placement
              </Label>
              <Select
                value={draft.placement ?? "homepage"}
                onValueChange={(v: Placement) => setDraft({ ...draft, placement: v })}
              >
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="homepage">Hero Main Banners</SelectItem>
                  <SelectItem value="after_hero">Secondary Row Banners (Multi-Banner Grid)</SelectItem>
                  <SelectItem value="after_category">Category Promo Banners</SelectItem>
                  <SelectItem value="after_mega_deals">Special Deals Banners</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 1. Hero Banner Layout Selection Options */}
            <div className="space-y-2">
              <Label className="font-semibold text-sm flex items-center gap-1.5">
                <Layout className="h-4 w-4 text-primary" /> Hero Banner Layout Selection
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, layout: "imageOnly" })}
                  className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                    draft.layout === "imageOnly"
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "border-muted hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
                    <Maximize2 className="h-4 w-4 text-amber-500" /> Full Image Only
                  </div>
                  <span className="text-[11px] font-medium text-foreground">100% Banner Image</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, layout: "layout1" })}
                  className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                    draft.layout === "layout1" || !draft.layout
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "border-muted hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
                    <AlignLeft className="h-4 w-4" /> Layout 1
                  </div>
                  <span className="text-[11px] font-medium text-foreground">Content Left, Image Right</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, layout: "layout2" })}
                  className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                    draft.layout === "layout2"
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "border-muted hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
                    <AlignRight className="h-4 w-4" /> Layout 2
                  </div>
                  <span className="text-[11px] font-medium text-foreground">Image Left, Content Right</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, layout: "layout3" })}
                  className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                    draft.layout === "layout3"
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "border-muted hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
                    <AlignCenter className="h-4 w-4" /> Layout 3
                  </div>
                  <span className="text-[11px] font-medium text-foreground">Centered, Full BG Image</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, layout: "collage" })}
                  className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                    draft.layout === "collage"
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "border-muted hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
                    <LayoutGrid className="h-4 w-4 text-emerald-500" /> Collage Grid
                  </div>
                  <span className="text-[11px] font-medium text-foreground">Multi-Small Banners Collage</span>
                </button>
              </div>
            </div>            {/* Collage Grid Settings (WHEN layout === "collage") */}
            {draft.layout === "collage" && (
              <div className="space-y-4 pt-4 border-t">
                {/* Live Interactive Preview Card for Banner Collage Grid */}
                <div
                  className="space-y-2 p-4 rounded-xl border text-white shadow-md transition-colors"
                  style={{ backgroundColor: draft.bgColor || "#090d16" }}
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs font-bold">Live Collage Grid Interactive Preview</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-white/20 text-white/80">
                      {draft.collageCols || 3} Cols · {draft.collageRows ? `${draft.collageRows} Rows` : "Auto Rows"} · {draft.collageGapPx || 12}px Gap
                    </Badge>
                  </div>

                  <div
                    className="grid w-full py-2 items-center"
                    style={{
                      gridTemplateColumns: `repeat(${draft.collageCols || 3}, minmax(0, 1fr))`,
                      gridTemplateRows: draft.collageRows ? `repeat(${draft.collageRows}, minmax(0, 1fr))` : undefined,
                      gap: `${draft.collageGapPx || 12}px`,
                    }}
                  >
                    {(draft.collageItems || []).map((item, idx) => {
                      let aspectClass = "aspect-square";
                      if (item.aspectRatio === "rectangle") aspectClass = "aspect-[4/3]";
                      if (item.aspectRatio === "landscape") aspectClass = "aspect-video";
                      if (item.aspectRatio === "portrait") aspectClass = "aspect-[3/4]";

                      return (
                        <div
                          key={item.id || idx}
                          style={{
                            gridColumn: item.gridSpan && item.gridSpan > 1 ? `span ${item.gridSpan} / span ${item.gridSpan}` : undefined,
                            gridRow: item.rowSpan && item.rowSpan > 1 ? `span ${item.rowSpan} / span ${item.rowSpan}` : undefined,
                          }}
                          className={`relative group overflow-hidden rounded-lg border border-slate-800 bg-slate-900 ${aspectClass} block`}
                        >
                          <img
                            src={item.imageUrl}
                            alt="Collage Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1 left-1 bg-black/70 backdrop-blur text-[9px] font-mono px-1.5 py-0.5 rounded text-white font-bold">
                            #{idx + 1}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Collage Section Background Color Control */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-3.5 rounded-xl border bg-muted/20">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <Palette className="h-3.5 w-3.5 text-primary" /> Section Background Color
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Set custom container background color behind the collage grid (e.g. Dark, White, Primary Accent).
                    </p>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2 flex items-center gap-2">
                    <input
                      type="color"
                      value={draft.bgColor ?? "#090d16"}
                      onChange={(e) => setDraft({ ...draft, bgColor: e.target.value })}
                      className="h-9 w-10 shrink-0 rounded-md border p-0.5 cursor-pointer bg-background"
                    />
                    <Input
                      value={draft.bgColor ?? "#090d16"}
                      onChange={(e) => setDraft({ ...draft, bgColor: e.target.value })}
                      placeholder="#090d16"
                      className="h-9 text-xs font-mono flex-1"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setDraft({ ...draft, bgColor: "#090d16" })}
                        className="h-6 w-6 rounded-full bg-[#090d16] border border-slate-600 shadow-xs"
                        title="Dark Slate"
                      />
                      <button
                        type="button"
                        onClick={() => setDraft({ ...draft, bgColor: "#ffffff" })}
                        className="h-6 w-6 rounded-full bg-white border border-slate-300 shadow-xs"
                        title="Pure White"
                      />
                      <button
                        type="button"
                        onClick={() => setDraft({ ...draft, bgColor: "#4f46e5" })}
                        className="h-6 w-6 rounded-full bg-[#4f46e5] border border-indigo-400 shadow-xs"
                        title="Indigo Accent"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <Label className="font-semibold text-sm flex items-center gap-1.5">
                      <LayoutGrid className="h-4 w-4 text-emerald-500" /> Banner Collage Grid & Spacing Controls
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Upload images, re-arrange order (⬆/⬇), configure grid columns, rows, gap spacing, and item spans (column span & row span).
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const newCollageItem: CollageItem = {
                        id: `col-${Date.now()}`,
                        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
                        ctaUrl: "/#products",
                        aspectRatio: "square",
                        gridSpan: 1,
                        rowSpan: 1,
                      };
                      const items = [...(draft.collageItems || []), newCollageItem];
                      setDraft({ ...draft, collageItems: items });
                      toast.success("Added new small banner to collage!");
                    }}
                    className="text-xs font-bold gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> Add Small Banner
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Grid Columns Select */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Grid Columns</Label>
                    <Select
                      value={String(draft.collageCols || 3)}
                      onValueChange={(val) =>
                        setDraft({ ...draft, collageCols: parseInt(val) || 3 })
                      }
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 Columns Grid</SelectItem>
                        <SelectItem value="3">3 Columns Grid</SelectItem>
                        <SelectItem value="4">4 Columns Grid</SelectItem>
                        <SelectItem value="6">6 Columns Grid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Grid Rows Select */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Grid Rows Option</Label>
                    <Select
                      value={String(draft.collageRows || 0)}
                      onValueChange={(val) =>
                        setDraft({ ...draft, collageRows: parseInt(val) || 0 })
                      }
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Auto Rows (Flexible Height)</SelectItem>
                        <SelectItem value="1">1 Row Grid</SelectItem>
                        <SelectItem value="2">2 Rows Grid</SelectItem>
                        <SelectItem value="3">3 Rows Grid</SelectItem>
                        <SelectItem value="4">4 Rows Grid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Grid Spacing / Gap Select */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Grid Spacing / Gap</Label>
                    <Select
                      value={String(draft.collageGapPx || 12)}
                      onValueChange={(val) =>
                        setDraft({ ...draft, collageGapPx: parseInt(val) || 12 })
                      }
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4">4px (Tight)</SelectItem>
                        <SelectItem value="8">8px (Compact)</SelectItem>
                        <SelectItem value="12">12px (Standard)</SelectItem>
                        <SelectItem value="16">16px (Spacious)</SelectItem>
                        <SelectItem value="24">24px (Wide)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Collage Items List */}
                <div className="space-y-3 pt-2">
                  <Label className="text-xs font-bold text-foreground">
                    Small Banners in Collage ({(draft.collageItems || []).length})
                  </Label>

                  {(draft.collageItems || []).map((item, cIdx) => (
                    <Card key={item.id} className="border shadow-2xs">
                      <CardContent className="p-4 space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[10px] font-bold">
                            Small Banner #{cIdx + 1}
                          </Badge>

                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              disabled={cIdx === 0}
                              onClick={() => {
                                const items = [...(draft.collageItems || [])];
                                const temp = items[cIdx];
                                items[cIdx] = items[cIdx - 1];
                                items[cIdx - 1] = temp;
                                setDraft({ ...draft, collageItems: items });
                                toast.success("Banner re-arranged!");
                              }}
                              className="h-7 w-7 text-slate-400 hover:text-foreground"
                              title="Move Up"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              disabled={cIdx === (draft.collageItems || []).length - 1}
                              onClick={() => {
                                const items = [...(draft.collageItems || [])];
                                const temp = items[cIdx];
                                items[cIdx] = items[cIdx + 1];
                                items[cIdx + 1] = temp;
                                setDraft({ ...draft, collageItems: items });
                                toast.success("Banner re-arranged!");
                              }}
                              className="h-7 w-7 text-slate-400 hover:text-foreground"
                              title="Move Down"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                const items = [...(draft.collageItems || [])];
                                items.splice(cIdx, 1);
                                setDraft({ ...draft, collageItems: items });
                                toast.info("Small banner removed");
                              }}
                              className="h-7 w-7 text-slate-400 hover:text-rose-500"
                              title="Delete Item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Image Upload + URL */}
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-14 rounded-lg border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt="Collage Banner" className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-slate-400" />
                            )}
                          </div>

                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-xs font-semibold gap-1.5 cursor-pointer relative h-8"
                              >
                                <Upload className="h-3.5 w-3.5" /> Upload Image
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      try {
                                        const imageUrl = await uploadImage("banners", file);
                                        const items = [...(draft.collageItems || [])];
                                        items[cIdx].imageUrl = imageUrl;
                                        setDraft({ ...draft, collageItems: items });
                                        toast.success("Image uploaded to Cloudflare R2!");
                                      } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to upload banner image"); }
                                    }
                                  }}
                                />
                              </Button>
                              <Input
                                value={item.imageUrl}
                                onChange={(e) => {
                                  const items = [...(draft.collageItems || [])];
                                  items[cIdx].imageUrl = e.target.value;
                                  setDraft({ ...draft, collageItems: items });
                                }}
                                placeholder="Image URL"
                                className="h-8 text-xs font-mono flex-1"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Shape, Column Span, Row Span & Target Link */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[11px] font-bold">Banner Shape</Label>
                            <Select
                              value={item.aspectRatio || "square"}
                              onValueChange={(val: any) => {
                                const items = [...(draft.collageItems || [])];
                                items[cIdx].aspectRatio = val;
                                setDraft({ ...draft, collageItems: items });
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="square">Square (1:1)</SelectItem>
                                <SelectItem value="rectangle">Rectangle (4:3)</SelectItem>
                                <SelectItem value="landscape">Landscape (16:9)</SelectItem>
                                <SelectItem value="portrait">Portrait (3:4)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px] font-bold">Column Span</Label>
                            <Select
                              value={String(item.gridSpan || 1)}
                              onValueChange={(val) => {
                                const items = [...(draft.collageItems || [])];
                                items[cIdx].gridSpan = parseInt(val) || 1;
                                setDraft({ ...draft, collageItems: items });
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 Col Span</SelectItem>
                                <SelectItem value="2">2 Cols Span</SelectItem>
                                <SelectItem value="3">3 Cols Span</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px] font-bold">Row Span</Label>
                            <Select
                              value={String(item.rowSpan || 1)}
                              onValueChange={(val) => {
                                const items = [...(draft.collageItems || [])];
                                items[cIdx].rowSpan = parseInt(val) || 1;
                                setDraft({ ...draft, collageItems: items });
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 Row Span</SelectItem>
                                <SelectItem value="2">2 Rows Span</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px] font-bold">Target Link URL</Label>
                            <Input
                              value={item.ctaUrl || ""}
                              onChange={(e) => {
                                const items = [...(draft.collageItems || [])];
                                items[cIdx].ctaUrl = e.target.value;
                                setDraft({ ...draft, collageItems: items });
                              }}
                              placeholder="/#products"
                              className="h-8 text-xs font-mono"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Text Content & Styling Inputs (HIDDEN when layout === "imageOnly" or "collage") */}
            {draft.layout !== "imageOnly" && draft.layout !== "collage" && (
              <div className="space-y-3 pt-2 border-t">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="title">Headline Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g. Aurora Wireless Headphones"
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="subtitle">Subtitle / Tagline</Label>
                    <Input
                      id="subtitle"
                      placeholder="e.g. Active Noise Cancellation"
                      value={draft.subtitle ?? ""}
                      onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="body">Body Description</Label>
                  <Textarea
                    id="body"
                    rows={2}
                    placeholder="Experience studio sound..."
                    value={draft.body}
                    onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  />
                </div>

                {/* Price Inputs Row */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="price">Original Regular Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="e.g. 1999"
                      value={draft.price ?? ""}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          price: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="discPrice">Discount Offer Price (₹)</Label>
                    <Input
                      id="discPrice"
                      type="number"
                      placeholder="e.g. 1499"
                      value={draft.discountPrice ?? ""}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          discountPrice: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Call-To-Action Button Customization */}
                <div className="rounded-xl border bg-muted/20 p-3.5 space-y-3">
                  <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>CTA Button Label & Action Link</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="cta" className="text-xs">CTA Button Label</Label>
                      <Input
                        id="cta"
                        placeholder="Shop Now"
                        value={draft.ctaLabel}
                        onChange={(e) => setDraft({ ...draft, ctaLabel: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ctaUrl" className="text-xs">Target Link URL</Label>
                      <Input
                        id="ctaUrl"
                        placeholder="/#products"
                        value={draft.ctaUrl}
                        onChange={(e) => setDraft({ ...draft, ctaUrl: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Color Pickers Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
                  <div className="space-y-1.5">
                    <Label htmlFor="herobg">Hero Section BG Color</Label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        id="herobg"
                        value={draft.bgColor ?? "#090d16"}
                        onChange={(e) => setDraft({ ...draft, bgColor: e.target.value })}
                        className="h-9 w-9 shrink-0 rounded border p-0.5 cursor-pointer"
                      />
                      <Input
                        value={draft.bgColor ?? "#090d16"}
                        onChange={(e) => setDraft({ ...draft, bgColor: e.target.value })}
                        className="h-9 text-xs font-mono px-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ctabg">CTA Button BG Color</Label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        id="ctabg"
                        value={draft.ctaBgColor ?? "#3b82f6"}
                        onChange={(e) => setDraft({ ...draft, ctaBgColor: e.target.value })}
                        className="h-9 w-9 shrink-0 rounded border p-0.5 cursor-pointer"
                      />
                      <Input
                        value={draft.ctaBgColor ?? "#3b82f6"}
                        onChange={(e) => setDraft({ ...draft, ctaBgColor: e.target.value })}
                        className="h-9 text-xs font-mono px-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ctatext">CTA Button Text Color</Label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        id="ctatext"
                        value={draft.ctaTextColor ?? "#ffffff"}
                        onChange={(e) => setDraft({ ...draft, ctaTextColor: e.target.value })}
                        className="h-9 w-9 shrink-0 rounded border p-0.5 cursor-pointer"
                      />
                      <Input
                        value={draft.ctaTextColor ?? "#ffffff"}
                        onChange={(e) => setDraft({ ...draft, ctaTextColor: e.target.value })}
                        className="h-9 text-xs font-mono px-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Granular Typography Styling Options (HIDDEN when layout === "imageOnly" or "collage") */}
            {draft.layout !== "imageOnly" && draft.layout !== "collage" && (
              <div className="rounded-xl border bg-muted/20 p-4 space-y-4 pt-3 border-t">
                <Label className="font-semibold text-sm flex items-center gap-1.5">
                  <Type className="h-4 w-4 text-primary" /> Typography Styling Options
                </Label>

                {/* Headline Title Typography */}
                <TypographyControlBlock
                  label="Headline Title Typography"
                  style={draft.titleStyle ?? { color: "#ffffff", fontFamily: "sans", fontSize: "5xl", fontWeight: "extrabold" }}
                  onChange={(updated) => setDraft({ ...draft, titleStyle: updated })}
                />

                {/* Subtitle / Tagline Typography */}
                <TypographyControlBlock
                  label="Subtitle / Tagline Typography"
                  style={draft.subtitleStyle ?? { color: "#38bdf8", fontFamily: "sans", fontSize: "lg", fontWeight: "semibold" }}
                  onChange={(updated) => setDraft({ ...draft, subtitleStyle: updated })}
                />

                {/* Body Description Typography */}
                <TypographyControlBlock
                  label="Body Description Typography"
                  style={draft.bodyStyle ?? { color: "#cbd5e1", fontFamily: "sans", fontSize: "base", fontWeight: "normal" }}
                  onChange={(updated) => setDraft({ ...draft, bodyStyle: updated })}
                />
              </div>
            )}

            {/* 4. Product Image Upload & Controls (HIDDEN when layout === "collage") */}
            {draft.layout !== "collage" && (
              <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold text-sm flex items-center gap-1.5">
                    <Upload className="h-4 w-4 text-primary" /> Product Image Source & Upload
                  </Label>
                  <span className="text-xs text-muted-foreground">Recommended: WEBP</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg border-muted-foreground/30 hover:border-primary bg-background cursor-pointer text-center transition-colors"
                  >
                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs font-semibold text-foreground">Click to Upload Image</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>

                  <div className="space-y-1.5 flex flex-col justify-center">
                    <Label htmlFor="img" className="text-xs">Or Enter Image URL</Label>
                    <Input
                      id="img"
                      placeholder="https://..."
                      value={draft.imageUrl ?? ""}
                      onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Layout 3 Full Background Opacity Slider */}
            {draft.layout === "layout3" && (
              <div className="space-y-2 rounded-xl border bg-primary/5 p-3.5 border-primary/20">
                <div className="flex justify-between items-center text-xs">
                  <Label className="font-semibold flex items-center gap-1.5 text-primary">
                    <Sliders className="h-4 w-4" /> Layout 3 Background Image Opacity
                  </Label>
                  <span className="font-mono text-primary font-bold">
                    {Math.round((draft.bgOpacity ?? 0.6) * 100)}% Opacity
                  </span>
                </div>
                <div className="pt-1">
                  <Slider
                    value={[draft.bgOpacity ?? 0.6]}
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    onValueChange={([val]) => setDraft({ ...draft, bgOpacity: val })}
                  />
                </div>
              </div>
            )}

            {/* Interactive Image Crop Drag Manager (HIDDEN when layout === "collage") */}
            {draft.layout !== "collage" && (
              <ImageCropDragManager
                imageUrl={draft.imageUrl}
                cropX={draft.cropPositionX ?? (draft.imagePosition === "left" ? 0 : draft.imagePosition === "right" ? 100 : 50)}
                cropY={draft.cropPositionY ?? (draft.imagePosition === "top" ? 0 : draft.imagePosition === "bottom" ? 100 : 50)}
                zoom={draft.zoom ?? 1}
                onChange={(updates) => setDraft({ ...draft, ...updates })}
              />
            )}

            {/* Live Interactive Banner Preview (HIDDEN when layout === "collage") */}
            {draft.layout !== "collage" && (
              <div className="space-y-1.5 pt-2 border-t">
                <Label className="font-semibold text-xs flex items-center justify-between">
                  <span>Live Interactive Banner Preview</span>
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {draft.layout ?? "layout1"} · {draft.orientation ?? "landscape"}
                  </span>
                </Label>
                <BannerPreview banner={{ ...draft, id: "preview" }} />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={saveBanner}>
              {editingId ? "Update Banner" : "Publish Banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Image Replacement Modal */}
      <Dialog open={!!quickReplaceBanner} onOpenChange={(open) => !open && setQuickReplaceBanner(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" /> Replace Banner Image
            </DialogTitle>
            <DialogDescription>
              Upload a new local image file or paste an image URL to replace the banner graphic for &quot;{quickReplaceBanner?.title}&quot;.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Live Image Preview */}
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-slate-900 flex items-center justify-center">
              {quickImageUrl ? (
                <img
                  src={quickImageUrl}
                  alt="Banner Image Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-center text-muted-foreground text-xs p-4">
                  No image selected
                </div>
              )}
            </div>

            {/* Local File Upload Button */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Option 1: Upload Local Image File</Label>
              <div
                onClick={() => quickFileInputRef.current?.click()}
                className="border-2 border-dashed border-primary/40 hover:border-primary rounded-xl p-3 text-center cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-primary">Choose Image File (WEBP, JPG, PNG)</span>
              </div>
              <input
                ref={quickFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleQuickFileUpload}
              />
            </div>

            {/* Image URL Input */}
            <div className="space-y-1.5">
              <Label htmlFor="quick-url" className="text-xs font-semibold">Option 2: Image Web URL</Label>
              <Input
                id="quick-url"
                placeholder="https://images.unsplash.com/..."
                value={quickImageUrl}
                onChange={(e) => setQuickImageUrl(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickReplaceBanner(null)}>
              Cancel
            </Button>
            <Button onClick={saveQuickReplace}>
              <Check className="h-4 w-4 mr-1.5" /> Save & Replace Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Interactive Image Crop & Drag Alignment Manager Component
function ImageCropDragManager({
  imageUrl,
  cropX = 50,
  cropY = 50,
  zoom = 1,
  onChange,
}: {
  imageUrl?: string;
  cropX?: number;
  cropY?: number;
  zoom?: number;
  onChange: (updates: { cropPositionX?: number; cropPositionY?: number; zoom?: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; startCropX: number; startCropY: number }>({
    x: 0,
    y: 0,
    startCropX: 50,
    startCropY: 50,
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startCropX: cropX,
      startCropY: cropY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    const percentChangeX = (deltaX / rect.width) * 100;
    const percentChangeY = (deltaY / rect.height) * 100;

    const newX = Math.round(Math.max(0, Math.min(100, dragStartRef.current.startCropX - percentChangeX)));
    const newY = Math.round(Math.max(0, Math.min(100, dragStartRef.current.startCropY - percentChangeY)));

    onChange({ cropPositionX: newX, cropPositionY: newY, zoom });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-3 rounded-xl border bg-muted/20 p-4 border-muted">
      <div className="flex items-center justify-between">
        <Label className="font-semibold text-xs flex items-center gap-1.5">
          <Crop className="h-4 w-4 text-primary" /> Interactive Image Crop & Drag Alignment
        </Label>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-mono font-bold bg-background">
            X: {cropX}% · Y: {cropY}% · {zoom.toFixed(1)}x Zoom
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ cropPositionX: 50, cropPositionY: 50, zoom: 1 })}
            className="h-7 text-[11px] px-2"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Drag Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative h-56 w-full overflow-hidden rounded-xl border-2 border-dashed bg-slate-950 cursor-grab select-none transition-colors ${
          isDragging ? "cursor-grabbing border-primary shadow-lg" : "border-slate-700 hover:border-slate-500"
        }`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Drag Crop Target"
            style={{
              objectPosition: `${cropX}% ${cropY}%`,
              transform: `scale(${zoom})`,
            }}
            className="h-full w-full object-cover transition-transform duration-75 pointer-events-none"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 text-xs">
            <Crop className="h-6 w-6 mb-1" />
            <span>Upload or enter an image URL to crop & align</span>
          </div>
        )}

        {/* Drag Helper Overlay */}
        <div className="absolute inset-0 pointer-events-none border border-white/20 flex items-center justify-center">
          <div className="bg-black/70 backdrop-blur text-white text-[11px] font-medium px-3 py-1 rounded-full border border-white/30 flex items-center gap-1.5 shadow-xl">
            <Move className="h-3.5 w-3.5 text-amber-400" />
            <span>Click & Drag Image to Crop & Adjust Position</span>
          </div>
        </div>
      </div>

      {/* Sliders for Precision Fine-Tuning */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-medium">
            <span>Horizontal Crop (X)</span>
            <span className="font-mono">{cropX}%</span>
          </div>
          <Slider
            value={[cropX]}
            min={0}
            max={100}
            step={1}
            onValueChange={([val]) => onChange({ cropPositionX: val, cropPositionY: cropY, zoom })}
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-medium">
            <span>Vertical Crop (Y)</span>
            <span className="font-mono">{cropY}%</span>
          </div>
          <Slider
            value={[cropY]}
            min={0}
            max={100}
            step={1}
            onValueChange={([val]) => onChange({ cropPositionX: cropX, cropPositionY: val, zoom })}
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-medium">
            <span>Zoom Magnification</span>
            <span className="font-mono">{zoom.toFixed(1)}x</span>
          </div>
          <Slider
            value={[zoom]}
            min={1.0}
            max={2.5}
            step={0.1}
            onValueChange={([val]) => onChange({ cropPositionX: cropX, cropPositionY: cropY, zoom: val })}
          />
        </div>
      </div>
    </div>
  );
}

// Reusable Typography Control Block Component
function TypographyControlBlock({
  label,
  style,
  onChange,
}: {
  label: string;
  style: TypographyStyle;
  onChange: (updated: TypographyStyle) => void;
}) {
  return (
    <div className="space-y-2 rounded-lg border bg-background p-3">
      <div className="text-xs font-semibold text-foreground">{label}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Color Picker */}
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground font-medium">Color</label>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={style.color ?? "#ffffff"}
              onChange={(e) => onChange({ ...style, color: e.target.value })}
              className="h-8 w-8 rounded border p-0.5 cursor-pointer"
            />
            <Input
              value={style.color ?? "#ffffff"}
              onChange={(e) => onChange({ ...style, color: e.target.value })}
              className="h-8 text-xs font-mono px-2"
            />
          </div>
        </div>

        {/* Font Family Selection */}
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground font-medium">Font Family</label>
          <Select
            value={style.fontFamily ?? "sans"}
            onValueChange={(v: FontFamilyOption) => onChange({ ...style, fontFamily: v })}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sans">Sans-Serif</SelectItem>
              <SelectItem value="serif">Serif</SelectItem>
              <SelectItem value="mono">Monospace</SelectItem>
              <SelectItem value="display">Display</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Font Size Selection */}
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground font-medium">Font Size</label>
          <Select
            value={style.fontSize ?? "5xl"}
            onValueChange={(v: FontSizeOption) => onChange({ ...style, fontSize: v })}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Small</SelectItem>
              <SelectItem value="base">Base</SelectItem>
              <SelectItem value="lg">Large</SelectItem>
              <SelectItem value="xl">XL</SelectItem>
              <SelectItem value="2xl">2XL</SelectItem>
              <SelectItem value="3xl">3XL</SelectItem>
              <SelectItem value="4xl">4XL</SelectItem>
              <SelectItem value="5xl">5XL</SelectItem>
              <SelectItem value="6xl">6XL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Font Weight Selection */}
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground font-medium">Font Weight</label>
          <Select
            value={style.fontWeight ?? "extrabold"}
            onValueChange={(v: FontWeightOption) => onChange({ ...style, fontWeight: v })}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal (400)</SelectItem>
              <SelectItem value="medium">Medium (500)</SelectItem>
              <SelectItem value="semibold">Semi-Bold (600)</SelectItem>
              <SelectItem value="bold">Bold (700)</SelectItem>
              <SelectItem value="extrabold">Extra-Bold (800)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function getBannerObjectPosition(banner: any) {
  if (banner.cropPositionX !== undefined || banner.cropPositionY !== undefined) {
    return `${banner.cropPositionX ?? 50}% ${banner.cropPositionY ?? 50}%`;
  }
  if (banner.imagePosition === "top") return "50% 0%";
  if (banner.imagePosition === "bottom") return "50% 100%";
  if (banner.imagePosition === "left") return "0% 50%";
  if (banner.imagePosition === "right") return "100% 50%";
  return "50% 50%";
}

function BannerPreview({ banner }: { banner: Omit<Banner, "id"> & { id?: string } }) {
  if (banner.kind === "hero") {
    const layout = banner.layout ?? "layout1";

    const titleColor = banner.titleStyle?.color ?? "#ffffff";
    const subtitleColor = banner.subtitleStyle?.color ?? "#38bdf8";
    const bodyColor = banner.bodyStyle?.color ?? "#cbd5e1";
    const objPos = getBannerObjectPosition(banner);

    if (layout === "imageOnly") {
      return (
        <div className="relative overflow-hidden rounded-xl border text-white h-[180px] flex items-center justify-center bg-slate-900 group">
          <img
            src={banner.imageUrl || "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=1600"}
            alt={banner.title}
            className="w-full h-full object-cover"
            style={{ objectPosition: objPos, transform: `scale(${banner.zoom ?? 1})` }}
          />
          <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-amber-400 border border-amber-400/30">
            🖼️ 100% Full Image Banner
          </div>
        </div>
      );
    }

    if (layout === "layout3") {
      return (
        <div
          className="relative overflow-hidden rounded-xl border text-white p-6 min-h-[180px] text-center flex flex-col items-center justify-center transition-colors"
          style={{ backgroundColor: banner.bgColor || "#090d16" }}
        >
          {banner.imageUrl && (
            <div
              className="absolute inset-0 bg-cover transition-opacity duration-300"
              style={{
                backgroundImage: `url(${banner.imageUrl})`,
                backgroundPosition: objPos,
                opacity: banner.bgOpacity ?? 0.6,
              }}
            />
          )}
          <div className="relative z-10 space-y-1.5 max-w-sm">
            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
              LAYOUT 3: CENTERED FULL BG
            </Badge>
            <h4 className="font-bold text-lg line-clamp-1" style={{ color: titleColor }}>
              {banner.title || "Headline Title"}
            </h4>
            {banner.subtitle && (
              <p className="text-xs font-medium line-clamp-1" style={{ color: subtitleColor }}>
                {banner.subtitle}
              </p>
            )}
            <p className="text-xs line-clamp-2" style={{ color: bodyColor }}>
              {banner.body}
            </p>
            {(banner.price !== undefined || banner.discountPrice !== undefined) && (
              <div className="font-bold text-xs pt-1 flex items-baseline gap-1.5 justify-center">
                {banner.discountPrice !== undefined ? (
                  <>
                    <span className="text-amber-400 font-extrabold text-sm">{formatCurrency(banner.discountPrice)}</span>
                    {banner.price !== undefined && (
                      <span className="line-through text-slate-400 text-xs font-normal">{formatCurrency(banner.price)}</span>
                    )}
                  </>
                ) : (
                  <span className="text-primary font-bold">{formatCurrency(banner.price!)}</span>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        className="relative overflow-hidden rounded-xl border text-white p-4 min-h-[170px] transition-colors"
        style={{ backgroundColor: banner.bgColor || "#090d16" }}
      >
        <div className="grid grid-cols-2 items-center gap-4 h-full">
          <div className={`space-y-1.5 ${layout === "layout2" ? "order-2" : "order-1"}`}>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
              {layout === "layout2" ? "LAYOUT 2: RIGHT CONTENT" : "LAYOUT 1: LEFT CONTENT"}
            </Badge>
            <h4 className="font-bold text-base line-clamp-1" style={{ color: titleColor }}>
              {banner.title || "Headline Title"}
            </h4>
            {banner.subtitle && (
              <p className="text-xs font-medium line-clamp-1" style={{ color: subtitleColor }}>
                {banner.subtitle}
              </p>
            )}
            <p className="text-xs line-clamp-2" style={{ color: bodyColor }}>
              {banner.body}
            </p>
            <div className="pt-2 flex items-center gap-2">
              <span
                className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold shadow-sm"
                style={{
                  backgroundColor: banner.ctaBgColor ?? "#3b82f6",
                  color: banner.ctaTextColor ?? "#ffffff",
                }}
              >
                {banner.ctaLabel || "Shop Collection"}
              </span>
              {(banner.price !== undefined || banner.discountPrice !== undefined) && (
                <div className="flex items-baseline gap-1.5 text-xs font-bold">
                  {banner.discountPrice !== undefined ? (
                    <>
                      <span className="text-amber-400 font-extrabold">{formatCurrency(banner.discountPrice)}</span>
                      {banner.price !== undefined && (
                        <span className="line-through text-slate-400 text-[11px] font-normal">{formatCurrency(banner.price)}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-primary font-bold">{formatCurrency(banner.price!)}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {banner.imageUrl && (
            <div
              className={`relative overflow-hidden rounded-2xl shrink-0 h-36 w-full ${
                layout === "layout2" ? "order-1" : "order-2"
              }`}
            >
              <img
                src={banner.imageUrl}
                alt=""
                style={{
                  objectFit: banner.imageFit ?? "cover",
                  objectPosition: objPos,
                  transform: `scale(${banner.zoom ?? 1})`,
                }}
                className="h-full w-full transition-transform duration-300"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 rounded-md bg-slate-900 text-white p-3 text-xs font-medium border border-slate-800">
      <Megaphone className="h-4 w-4 text-primary" />
      <span>{banner.title || "Announcement Text"}</span>
      {banner.body && <span className="opacity-80">— {banner.body}</span>}
    </div>
  );
}

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
