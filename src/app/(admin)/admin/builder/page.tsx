"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  GripVertical,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
  Tablet,
  Save,
  RotateCcw,
  Sparkles,
  Columns,
  Grid,
  Maximize2,
  Layers,
  Sliders,
  Box,
  LayoutGrid,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

// Section Definition Type focusing on Position, Layout & Grid Space Arrangement
export type PageSection = {
  id: string;
  type:
    | "hero"
    | "category_grid"
    | "featured_products"
    | "promo_banner"
    | "trust_badges"
    | "feature_grid"
    | "custom_text";
  title: string;
  visible: boolean;
  columns: 1 | 2 | 3 | 4 | 6;
  gap: "compact" | "normal" | "spacious";
  padding: "compact" | "normal" | "spacious";
  containerWidth: "full" | "standard" | "narrow";
  alignment: "left" | "center" | "between";
};

const columnOptions = [1, 2, 3, 4, 6] as const;
const gapOptions: Array<{ id: PageSection["gap"]; label: string }> = [
  { id: "compact", label: "Compact (8px)" },
  { id: "normal", label: "Standard (16px)" },
  { id: "spacious", label: "Spacious (32px)" },
];
const paddingOptions: Array<{ id: PageSection["padding"]; label: string }> = [
  { id: "compact", label: "Tight (16px)" },
  { id: "normal", label: "Normal (32px)" },
  { id: "spacious", label: "Tall (64px)" },
];
const widthOptions: Array<{ id: PageSection["containerWidth"]; label: string }> = [
  { id: "full", label: "Full Bleed Width" },
  { id: "standard", label: "Standard (1200px)" },
  { id: "narrow", label: "Narrow (960px)" },
];
const alignmentOptions: Array<{ id: PageSection["alignment"]; label: string }> = [
  { id: "left", label: "Left" },
  { id: "center", label: "Center" },
  { id: "between", label: "Spread" },
];

const getSectionPaddingClass = (padding: PageSection["padding"]) => {
  if (padding === "spacious") return "px-6 py-16";
  if (padding === "compact") return "px-3 py-4";
  return "px-4 py-8";
};

const getSectionWidthClass = (width: PageSection["containerWidth"]) => {
  if (width === "narrow") return "mx-auto w-[78%] max-w-[760px]";
  if (width === "standard") return "mx-auto w-[92%] max-w-[1040px]";
  return "w-full";
};

const getGridColumnsClass = (columns: PageSection["columns"]) => {
  if (columns === 1) return "grid-cols-1";
  if (columns === 2) return "grid-cols-1 sm:grid-cols-2";
  if (columns === 3) return "grid-cols-1 sm:grid-cols-3";
  if (columns === 4) return "grid-cols-2 sm:grid-cols-4";
  return "grid-cols-3 sm:grid-cols-6";
};

const getGridGapClass = (gap: PageSection["gap"]) => {
  if (gap === "compact") return "gap-2";
  if (gap === "spacious") return "gap-8";
  return "gap-4";
};

const getGridAlignmentClass = (alignment: PageSection["alignment"]) => {
  if (alignment === "left") return "justify-items-start text-left";
  if (alignment === "center") return "justify-items-center text-center";
  return "justify-items-stretch text-left";
};

// Preset Initial Wireframe Sections
const initialHomeSections: PageSection[] = [
  {
    id: "sec-1",
    type: "hero",
    title: "Hero Campaign Banner",
    visible: true,
    columns: 2,
    gap: "normal",
    padding: "spacious",
    containerWidth: "standard",
    alignment: "left",
  },
  {
    id: "sec-2",
    type: "category_grid",
    title: "Store Categories Grid",
    visible: true,
    columns: 6,
    gap: "compact",
    padding: "normal",
    containerWidth: "standard",
    alignment: "center",
  },
  {
    id: "sec-3",
    type: "featured_products",
    title: "Bestseller Product Catalog Grid",
    visible: true,
    columns: 4,
    gap: "normal",
    padding: "normal",
    containerWidth: "standard",
    alignment: "between",
  },
  {
    id: "sec-4",
    type: "promo_banner",
    title: "Promotional Coupon Banner",
    visible: true,
    columns: 1,
    gap: "compact",
    padding: "compact",
    containerWidth: "full",
    alignment: "center",
  },
  {
    id: "sec-5",
    type: "feature_grid",
    title: "Key Features & Benefits Grid",
    visible: true,
    columns: 3,
    gap: "normal",
    padding: "normal",
    containerWidth: "standard",
    alignment: "center",
  },
  {
    id: "sec-6",
    type: "trust_badges",
    title: "Store Guarantee & Trust Badges",
    visible: true,
    columns: 4,
    gap: "compact",
    padding: "compact",
    containerWidth: "standard",
    alignment: "center",
  },
];

export default function WireframeLayoutBuilder() {
  const [deviceView, setDeviceView] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [sections, setSections] = useState<PageSection[]>(initialHomeSections);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(initialHomeSections[0]?.id ?? null);

  useEffect(() => {
    let isMounted = true;

    api<{ setting: { value: { sections?: PageSection[] } } }>("/admin/settings/page-builder")
      .then(({ setting }) => {
        const savedSections = setting.value.sections;

        if (!isMounted || !Array.isArray(savedSections) || savedSections.length === 0) return;

        setSections(savedSections);
        setSelectedSectionId((currentId) =>
          currentId && savedSections.some((section) => section.id === currentId)
            ? currentId
            : savedSections[0].id
        );
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  // Drag and Drop States
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Selected Section Object for layout tuning
  const selectedSection = sections.find((s) => s.id === selectedSectionId);

  // Move section UP
  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...sections];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setSections(next);
    toast.success(`Section moved up to position #${index}`);
  };

  // Move section DOWN
  const moveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const next = [...sections];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setSections(next);
    toast.success(`Section moved down to position #${index + 2}`);
  };

  // Toggle Visibility
  const toggleVisibility = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
    toast.info("Section visibility toggled");
  };

  // Delete Section
  const deleteSection = (id: string) => {
    const nextSections = sections.filter((s) => s.id !== id);

    setSections(nextSections);
    if (selectedSectionId === id) {
      setSelectedSectionId(nextSections[0]?.id ?? null);
    }
    toast.error("Section removed from layout");
  };

  // Add New Wireframe Section
  const addNewSection = (type: PageSection["type"]) => {
    const newId = `sec-${Date.now()}`;
    const titles: Record<PageSection["type"], string> = {
      hero: "Hero Campaign Banner Section",
      category_grid: "Category Showcase Grid",
      featured_products: "Featured Products Grid",
      promo_banner: "Full-Width Promo Banner",
      feature_grid: "Value Proposition Grid",
      trust_badges: "Trust & Service Badges",
      custom_text: "Custom Text Block Section",
    };

    const defaultCols: Record<PageSection["type"], PageSection["columns"]> = {
      hero: 2,
      category_grid: 6,
      featured_products: 4,
      promo_banner: 1,
      feature_grid: 3,
      trust_badges: 4,
      custom_text: 1,
    };

    const newSec: PageSection = {
      id: newId,
      type,
      title: titles[type],
      visible: true,
      columns: defaultCols[type],
      gap: "normal",
      padding: "normal",
      containerWidth: type === "promo_banner" ? "full" : "standard",
      alignment: "center",
    };

    setSections((prev) => [...prev, newSec]);
    setSelectedSectionId(newId);
    toast.success(`Added ${newSec.title} to wireframe layout`);
  };

  // Update Section Arrangement Props
  const updateSectionProp = <K extends keyof PageSection>(key: K, value: PageSection[K]) => {
    if (!selectedSectionId) return;
    setSections((prev) =>
      prev.map((s) => (s.id === selectedSectionId ? { ...s, [key]: value } : s))
    );
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const next = [...sections];
    const [draggedItem] = next.splice(draggedIndex, 1);
    next.splice(dropIndex, 0, draggedItem);
    setSections(next);

    setDraggedIndex(null);
    setDragOverIndex(null);
    toast.success(`Section reordered to position #${dropIndex + 1}`);
  };

  // Preset Layout Templates
  const applyLayoutPreset = (preset: "default" | "high_density" | "minimal") => {
    let nextSections: PageSection[] = initialHomeSections;

    if (preset === "default") {
      toast.success("Applied Standard E-Commerce Wireframe Layout");
    } else if (preset === "high_density") {
      nextSections = [
        { id: "sec-p1", type: "promo_banner", title: "Top Announcement Strip", visible: true, columns: 1, gap: "compact", padding: "compact", containerWidth: "full", alignment: "center" },
        { id: "sec-p2", type: "category_grid", title: "Quick Category Strip", visible: true, columns: 6, gap: "compact", padding: "compact", containerWidth: "standard", alignment: "center" },
        { id: "sec-p3", type: "hero", title: "Main Carousel Hero", visible: true, columns: 2, gap: "normal", padding: "normal", containerWidth: "standard", alignment: "left" },
        { id: "sec-p4", type: "featured_products", title: "Flash Sale 4-Col Grid", visible: true, columns: 4, gap: "compact", padding: "normal", containerWidth: "standard", alignment: "between" },
        { id: "sec-p5", type: "featured_products", title: "Trending Items 4-Col Grid", visible: true, columns: 4, gap: "compact", padding: "normal", containerWidth: "standard", alignment: "between" },
        { id: "sec-p6", type: "trust_badges", title: "Guarantees Footer Strip", visible: true, columns: 4, gap: "compact", padding: "compact", containerWidth: "standard", alignment: "center" },
      ];
      toast.success("Applied High-Density Catalog Layout");
    } else if (preset === "minimal") {
      nextSections = [
        { id: "sec-m1", type: "hero", title: "Minimal Hero Showcase", visible: true, columns: 1, gap: "spacious", padding: "spacious", containerWidth: "narrow", alignment: "center" },
        { id: "sec-m2", type: "feature_grid", title: "Core Features (3-Col)", visible: true, columns: 3, gap: "normal", padding: "normal", containerWidth: "standard", alignment: "center" },
        { id: "sec-m3", type: "featured_products", title: "Curated Grid (3-Col)", visible: true, columns: 3, gap: "normal", padding: "normal", containerWidth: "standard", alignment: "center" },
      ];
      toast.success("Applied Minimalist Brand Showcase Layout");
    }

    setSections(nextSections);
    setSelectedSectionId(nextSections[0]?.id ?? null);
  };

  // Save Layout Config
  const saveLayout = async () => {
    try { await api("/admin/settings/page-builder", { method: "PUT", body: JSON.stringify({ sections }) }); toast.success("Wireframe Layout Structure Saved Successfully!", {
      description: "Section positions and grid space arrangements are stored.",
    }); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save layout"); }
  };

  // Get responsive width container class for viewport simulation
  const getViewportWidth = () => {
    if (deviceView === "mobile") return "max-w-[375px]";
    if (deviceView === "tablet") return "max-w-[768px]";
    return "w-full max-w-[1200px]";
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-background border rounded-2xl p-4 sm:p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <LayoutGrid className="h-6 w-6 text-amber-500" /> Storefront Layout & Wireframe Builder
            </h1>
            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border-amber-500/20 text-xs">
              Wireframe Light Theme
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Arrange section positions via Drag & Drop or buttons. Configure grid columns, padding, and layout space arrangement.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSections(initialHomeSections);
              setSelectedSectionId(initialHomeSections[0]?.id ?? null);
              toast.info("Layout reset to default");
            }}
            className="text-xs font-semibold gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset Blueprint
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs font-semibold gap-1.5"
          >
            <Link href="/" target="_blank">
              <ExternalLink className="h-3.5 w-3.5" /> Preview Live Site
            </Link>
          </Button>

          <Button
            onClick={saveLayout}
            size="sm"
            className="text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs"
          >
            <Save className="h-4 w-4" /> Save Layout Arrangement
          </Button>
        </div>
      </div>

      {/* Preset Layout Quick Buttons */}
      <div className="flex items-center justify-between bg-muted/30 border rounded-xl p-3 flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <Sparkles className="h-4 w-4 text-amber-500" /> Layout Presets:
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyLayoutPreset("default")}
            className="h-7 text-xs font-semibold"
          >
            Standard Store
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyLayoutPreset("high_density")}
            className="h-7 text-xs font-semibold"
          >
            High-Density Catalog
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyLayoutPreset("minimal")}
            className="h-7 text-xs font-semibold"
          >
            Minimalist Brand
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Control Dashboard (5 Cols) + Right Wireframe Preview (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Section Position & Grid Arrangement Controls */}
        <div className="lg:col-span-5 space-y-5">
          {/* SECTION POSITION & ORDER MANAGER */}
          <Card className="border shadow-xs">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-amber-500" /> Section Order & Positions
                </CardTitle>

                <Badge variant="outline" className="text-[11px] font-mono">
                  {sections.length} Sections
                </Badge>
              </div>
              <CardDescription className="text-[11px] text-muted-foreground">
                Drag handle ⠿ or use ↑ ↓ buttons to change section position in layout.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-3 space-y-2">
              {sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, idx)}
                  onClick={() => setSelectedSectionId(sec.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    selectedSectionId === sec.id
                      ? "border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/30"
                      : "border-muted hover:border-slate-300 dark:hover:border-slate-700 bg-card"
                  } ${draggedIndex === idx ? "opacity-40 border-amber-500 border-dashed" : ""} ${
                    dragOverIndex === idx && draggedIndex !== idx ? "border-amber-500 border-2 bg-amber-500/10" : ""
                  } ${!sec.visible ? "opacity-50 bg-muted/40" : ""}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Drag Handle */}
                    <span
                      className="p-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title="Drag to reorder"
                    >
                      <GripVertical className="h-4 w-4" />
                    </span>

                    {/* Order Number Badge */}
                    <span className="h-6 w-6 rounded-md bg-muted flex items-center justify-center text-xs font-bold font-mono text-muted-foreground shrink-0">
                      #{idx + 1}
                    </span>

                    {/* Section Title & Details */}
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-foreground truncate">{sec.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                        <span className="capitalize">{sec.type.replace("_", " ")}</span>
                        <span>•</span>
                        <span>{sec.columns} Col</span>
                      </div>
                    </div>
                  </div>

                  {/* Re-order & Quick Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveUp(idx);
                      }}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg hover:bg-muted text-slate-500 disabled:opacity-20 transition-colors"
                      title="Move Up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveDown(idx);
                      }}
                      disabled={idx === sections.length - 1}
                      className="p-1.5 rounded-lg hover:bg-muted text-slate-500 disabled:opacity-20 transition-colors"
                      title="Move Down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVisibility(sec.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-muted text-slate-500 transition-colors"
                      title={sec.visible ? "Hide Section" : "Show Section"}
                    >
                      {sec.visible ? <Eye className="h-3.5 w-3.5 text-emerald-500" /> : <EyeOff className="h-3.5 w-3.5 text-rose-500" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSection(sec.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Delete Section"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* GRID & SPACE ARRANGEMENT CONTROLS FOR SELECTED SECTION */}
          {selectedSection ? (
            <Card className="border shadow-xs">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-blue-500" /> Layout & Grid Space Settings
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-600 border-amber-500/30">
                    Editing #{sections.findIndex((s) => s.id === selectedSection.id) + 1}
                  </Badge>
                </div>
                <CardDescription className="text-[11px]">
                  {selectedSection.title}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 space-y-4 text-xs">
                {/* Columns Selection */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                    <Columns className="h-3.5 w-3.5 text-amber-500" /> Grid Columns Count
                  </Label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {columnOptions.map((col) => (
                      <button
                        key={col}
                        onClick={() => updateSectionProp("columns", col)}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          selectedSection.columns === col
                            ? "bg-amber-500 text-slate-950 border-amber-500 shadow-xs"
                            : "bg-muted/40 hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {col} Col
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid Gap / Item Spacing */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                    <Grid className="h-3.5 w-3.5 text-blue-500" /> Grid Item Gap / Spacing
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {gapOptions.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => updateSectionProp("gap", g.id)}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          selectedSection.gap === g.id
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-muted/40 hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vertical Section Padding */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                    <Maximize2 className="h-3.5 w-3.5 text-emerald-500" /> Vertical Section Padding
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {paddingOptions.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => updateSectionProp("padding", p.id)}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          selectedSection.padding === p.id
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-muted/40 hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Container Width */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                    <Box className="h-3.5 w-3.5 text-purple-500" /> Container Width Boundary
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {widthOptions.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => updateSectionProp("containerWidth", w.id)}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          selectedSection.containerWidth === w.id
                            ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                            : "bg-muted/40 hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Alignment */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                    <Sliders className="h-3.5 w-3.5 text-slate-500" /> Content Alignment / Distribution
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {alignmentOptions.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => updateSectionProp("alignment", a.id)}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          selectedSection.alignment === a.id
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : "bg-muted/40 hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* ADD NEW WIREFRAME SECTION BLOCK */}
          <Card className="border shadow-xs">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <Plus className="h-4 w-4 text-emerald-500" /> Add Section to Wireframe
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addNewSection("hero")}
                  className="text-xs justify-start h-9 font-semibold"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5 text-amber-500" /> Hero Banner
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addNewSection("category_grid")}
                  className="text-xs justify-start h-9 font-semibold"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5 text-blue-500" /> Category Grid
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addNewSection("featured_products")}
                  className="text-xs justify-start h-9 font-semibold"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> Product Catalog
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addNewSection("promo_banner")}
                  className="text-xs justify-start h-9 font-semibold"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5 text-purple-500" /> Promo Banner
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addNewSection("feature_grid")}
                  className="text-xs justify-start h-9 font-semibold"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5 text-cyan-500" /> Value Props
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addNewSection("trust_badges")}
                  className="text-xs justify-start h-9 font-semibold"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5 text-rose-500" /> Trust Badges
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANEL: Pure Wireframe Preview Stage (LIGHT THEME) (7 Cols) */}
        <div className="lg:col-span-7 space-y-4 sticky top-20">
          <Card className="border border-slate-200 shadow-md overflow-hidden bg-white text-slate-900">
            {/* Viewport Control Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-100 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="text-xs font-mono font-bold text-slate-700">
                  LAYOUT WIREFRAME BLUEPRINT PREVIEW
                </span>
              </div>

              {/* Viewport Mode Switcher */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-lg shadow-2xs">
                <button
                  onClick={() => setDeviceView("desktop")}
                  className={`p-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-colors ${
                    deviceView === "desktop" ? "bg-amber-500 text-slate-950 shadow-2xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                  title="Desktop Wireframe View"
                >
                  <Monitor className="h-3.5 w-3.5" /> Desktop
                </button>
                <button
                  onClick={() => setDeviceView("tablet")}
                  className={`p-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-colors ${
                    deviceView === "tablet" ? "bg-amber-500 text-slate-950 shadow-2xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                  title="Tablet Wireframe View"
                >
                  <Tablet className="h-3.5 w-3.5" /> Tablet
                </button>
                <button
                  onClick={() => setDeviceView("mobile")}
                  className={`p-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-colors ${
                    deviceView === "mobile" ? "bg-amber-500 text-slate-950 shadow-2xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                  title="Mobile Wireframe View"
                >
                  <Smartphone className="h-3.5 w-3.5" /> Mobile
                </button>
              </div>
            </div>

            {/* Wireframe Canvas Area (Light Theme Blueprint) */}
            <div className="p-4 bg-slate-50 min-h-[650px] max-h-[800px] overflow-y-auto flex justify-center bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]">
              <div className={`w-full transition-all duration-300 space-y-4 ${getViewportWidth()}`}>
                {/* Header Wireframe Skeleton */}
                <div className="p-3 border-2 border-dashed border-slate-300 bg-white rounded-xl flex items-center justify-between text-slate-600 text-xs font-mono shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-slate-800">W</div>
                    <span className="font-bold text-slate-700">[HEADER NAVBAR WIREFRAME]</span>
                  </div>
                  <div className="h-4 w-32 bg-slate-100 rounded border border-slate-200 hidden sm:block" />
                  <div className="h-6 w-16 bg-slate-100 rounded border border-slate-300" />
                </div>

                {/* Wireframe Sections List */}
                <div className="space-y-4">
                  {sections.map((sec, idx) => {
                    const isSelected = selectedSectionId === sec.id;
                    const isDragging = draggedIndex === idx;
                    const isDragOver = dragOverIndex === idx && draggedIndex !== idx;

                    return (
                      <div
                        key={sec.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, idx)}
                        onClick={() => setSelectedSectionId(sec.id)}
                        className={`group relative rounded-xl border-2 transition-all cursor-pointer ${getSectionWidthClass(sec.containerWidth)} ${
                          !sec.visible ? "opacity-40 border-slate-200 bg-slate-100" : "bg-white shadow-xs"
                        } ${
                          isSelected
                            ? "border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] ring-2 ring-amber-500/20"
                            : "border-slate-200 hover:border-slate-400"
                        } ${isDragging ? "opacity-30 border-dashed border-amber-400" : ""} ${
                          isDragOver ? "border-amber-500 border-2 bg-amber-50 scale-[1.01]" : ""
                        } ${getSectionPaddingClass(sec.padding)}`}
                      >
                        {/* Section Wireframe Header Bar */}
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            {/* Drag Handle Icon */}
                            <span className="p-1 cursor-grab active:cursor-grabbing text-slate-400 group-hover:text-amber-600 transition-colors">
                              <GripVertical className="h-4 w-4" />
                            </span>

                            {/* Position Number */}
                            <Badge className="bg-amber-500 text-slate-950 font-bold font-mono text-xs shadow-2xs">
                              #{idx + 1}
                            </Badge>

                            {/* Section Name */}
                            <span className="font-extrabold text-xs text-slate-900 tracking-wide">
                              {sec.title}
                            </span>

                            <Badge variant="outline" className="text-[10px] font-mono text-slate-600 border-slate-300 bg-slate-50">
                              {sec.containerWidth.toUpperCase()} • {sec.columns} COL GRID
                            </Badge>
                          </div>

                          {/* Quick Controls Toolbar directly on wireframe block */}
                          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveUp(idx);
                              }}
                              disabled={idx === 0}
                              className="p-1 rounded text-slate-600 hover:text-amber-600 hover:bg-slate-200 disabled:opacity-20"
                              title="Move Up"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveDown(idx);
                              }}
                              disabled={idx === sections.length - 1}
                              className="p-1 rounded text-slate-600 hover:text-amber-600 hover:bg-slate-200 disabled:opacity-20"
                              title="Move Down"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleVisibility(sec.id);
                              }}
                              className="p-1 rounded text-slate-600 hover:text-amber-600 hover:bg-slate-200"
                              title={sec.visible ? "Hide Section" : "Show Section"}
                            >
                              {sec.visible ? <Eye className="h-3.5 w-3.5 text-emerald-600" /> : <EyeOff className="h-3.5 w-3.5 text-rose-600" />}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSection(sec.id);
                              }}
                              className="p-1 rounded text-slate-600 hover:text-rose-600 hover:bg-slate-200"
                              title="Delete Section"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* SECTION WIREFRAME LAYOUT CONTENT BLUEPRINT (LIGHT THEME) */}
                        <div
                          className={`grid ${getGridColumnsClass(sec.columns)} ${getGridGapClass(sec.gap)} ${getGridAlignmentClass(sec.alignment)}`}
                        >
                          {/* HERO WIREFRAME BLUEPRINT */}
                          {sec.type === "hero" && (
                            <>
                              <div className="border-2 border-dashed border-amber-400/80 rounded-xl p-4 bg-amber-50 space-y-2 flex flex-col justify-center">
                                <div className="h-4 w-3/4 bg-amber-400/40 rounded" />
                                <div className="h-3 w-1/2 bg-amber-300/40 rounded" />
                                <div className="h-7 w-28 bg-amber-500 rounded mt-2 text-slate-950 font-bold text-[10px] flex items-center justify-center shadow-2xs">
                                  BUTTON SLOT
                                </div>
                              </div>
                              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 bg-slate-100 flex flex-col items-center justify-center min-h-[110px] text-slate-500 text-xs font-mono font-bold">
                                🖼️ HERO IMAGE WIREFRAME SLOT
                              </div>
                            </>
                          )}

                          {/* CATEGORY GRID WIREFRAME BLUEPRINT */}
                          {sec.type === "category_grid" &&
                            Array.from({ length: sec.columns }).map((_, i) => (
                              <div
                                key={i}
                                className="border-2 border-dashed border-blue-400/80 rounded-xl p-3 bg-blue-50/80 flex flex-col items-center justify-center space-y-1 text-center min-h-[60px]"
                              >
                                <div className="h-6 w-6 rounded-full bg-blue-200 border border-blue-400/60" />
                                <span className="text-[10px] font-mono text-blue-800 font-bold">
                                  Category #{i + 1}
                                </span>
                              </div>
                            ))}

                          {/* FEATURED PRODUCTS WIREFRAME BLUEPRINT */}
                          {sec.type === "featured_products" &&
                            Array.from({ length: sec.columns }).map((_, i) => (
                              <div
                                key={i}
                                className="border-2 border-dashed border-emerald-400/80 rounded-xl p-3 bg-emerald-50/80 space-y-2"
                              >
                                <div className="h-16 bg-white rounded border border-emerald-200 flex items-center justify-center text-[10px] font-mono text-emerald-800 font-bold shadow-2xs">
                                  Product #{i + 1}
                                </div>
                                <div className="h-2.5 w-3/4 bg-emerald-300/50 rounded" />
                                <div className="h-2.5 w-1/3 bg-emerald-400/50 rounded" />
                              </div>
                            ))}

                          {/* PROMO BANNER WIREFRAME BLUEPRINT */}
                          {sec.type === "promo_banner" && (
                            <div className="col-span-full border-2 border-dashed border-purple-400/80 rounded-xl p-4 bg-purple-50 flex items-center justify-between gap-2">
                              <div className="space-y-1">
                                <div className="h-4 w-48 bg-purple-300/60 rounded" />
                                <div className="h-3 w-32 bg-purple-200/60 rounded" />
                              </div>
                              <div className="h-7 px-3 bg-purple-600 rounded text-white text-[10px] font-bold flex items-center font-mono shrink-0 shadow-2xs">
                                PROMO BUTTON
                              </div>
                            </div>
                          )}

                          {/* FEATURE GRID WIREFRAME BLUEPRINT */}
                          {sec.type === "feature_grid" &&
                            Array.from({ length: sec.columns }).map((_, i) => (
                              <div
                                key={i}
                                className="border-2 border-dashed border-cyan-400/80 rounded-xl p-3 bg-cyan-50/80 space-y-2 text-center"
                              >
                                <div className="h-8 w-8 mx-auto rounded-lg bg-cyan-200 border border-cyan-400/60 flex items-center justify-center text-xs">
                                  ⚡
                                </div>
                                <div className="h-3 w-3/4 mx-auto bg-cyan-300/60 rounded" />
                                <div className="h-2 w-1/2 mx-auto bg-cyan-200/60 rounded" />
                              </div>
                            ))}

                          {/* TRUST BADGES WIREFRAME BLUEPRINT */}
                          {sec.type === "trust_badges" &&
                            Array.from({ length: sec.columns }).map((_, i) => (
                              <div
                                key={i}
                                className="border-2 border-dashed border-rose-400/80 rounded-xl p-2.5 bg-rose-50/80 flex items-center justify-center gap-2 text-[10px] font-mono text-rose-800 font-bold"
                              >
                                <span>🛡️</span> Badge #{i + 1}
                              </div>
                            ))}

                          {/* CUSTOM TEXT WIREFRAME BLUEPRINT */}
                          {sec.type === "custom_text" && (
                            <div className="col-span-full border-2 border-dashed border-slate-300 rounded-xl p-4 bg-slate-100 text-center space-y-2">
                              <div className="h-4 w-40 mx-auto bg-slate-300 rounded" />
                              <div className="h-3 w-64 mx-auto bg-slate-200 rounded" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Wireframe Skeleton */}
                <div className="p-3 border-2 border-dashed border-slate-300 bg-white rounded-xl text-center text-slate-500 text-xs font-mono shadow-2xs">
                  [FOOTER BLUEPRINT WIREFRAME]
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
