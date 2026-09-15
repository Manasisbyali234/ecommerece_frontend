"use client";

import { useState } from "react";
import {
  Palette,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  Type,
  Square,
  Circle,
  Sliders,
  Eye,
  ShoppingBag,
  ArrowRight,
  Sun,
  Moon,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useStore,
  store,
  initialThemeConfig,
  type ThemeConfig,
} from "@/lib/store";

export default function AdminThemePage() {
  const currentConfig = useStore(
    (s) => s.themeConfig || initialThemeConfig
  );

  const [config, setConfig] = useState<ThemeConfig>(
    JSON.parse(JSON.stringify(currentConfig))
  );

  // Save changes to central store & dynamic theme CSS injector
  const handleSaveChanges = () => {
    store.updateThemeConfig(config);
    toast.success("Website Theme & Palette updated successfully!");
  };

  // Reset to default theme layout
  const handleResetDefault = () => {
    const fresh = JSON.parse(JSON.stringify(initialThemeConfig));
    setConfig(fresh);
    store.updateThemeConfig(fresh);
    toast.info("Theme reset to default Midnight Executive palette!");
  };

  // Curated Theme Presets
  const themePresets = [
    {
      name: "Midnight Executive",
      primaryColor: "#0f172a",
      primaryForeground: "#ffffff",
      secondaryColor: "#f1f5f9",
      secondaryForeground: "#0f172a",
      accentColor: "#f59e0b",
      buttonColor: "#0f172a",
      buttonTextColor: "#ffffff",
      buttonHoverColor: "#1e293b",
      buttonRadiusPx: 8,
      gradient: "from-slate-900 via-slate-800 to-amber-500",
    },
    {
      name: "Royal Indigo",
      primaryColor: "#3730a3",
      primaryForeground: "#ffffff",
      secondaryColor: "#e0e7ff",
      secondaryForeground: "#1e1b4b",
      accentColor: "#38bdf8",
      buttonColor: "#3730a3",
      buttonTextColor: "#ffffff",
      buttonHoverColor: "#312e81",
      buttonRadiusPx: 8,
      gradient: "from-indigo-900 via-indigo-700 to-sky-400",
    },
    {
      name: "Emerald Luxe",
      primaryColor: "#065f46",
      primaryForeground: "#ffffff",
      secondaryColor: "#d1fae5",
      secondaryForeground: "#064e3b",
      accentColor: "#10b981",
      buttonColor: "#065f46",
      buttonTextColor: "#ffffff",
      buttonHoverColor: "#047857",
      buttonRadiusPx: 10,
      gradient: "from-emerald-900 via-emerald-700 to-emerald-400",
    },
    {
      name: "Sunset Amber",
      primaryColor: "#9a3412",
      primaryForeground: "#ffffff",
      secondaryColor: "#ffedd5",
      secondaryForeground: "#7c2d12",
      accentColor: "#f59e0b",
      buttonColor: "#9a3412",
      buttonTextColor: "#ffffff",
      buttonHoverColor: "#c2410c",
      buttonRadiusPx: 12,
      gradient: "from-orange-900 via-amber-700 to-amber-400",
    },
    {
      name: "Rose Gold & Velvet",
      primaryColor: "#9f1239",
      primaryForeground: "#ffffff",
      secondaryColor: "#ffe4e6",
      secondaryForeground: "#881337",
      accentColor: "#fbbf24",
      buttonColor: "#9f1239",
      buttonTextColor: "#ffffff",
      buttonHoverColor: "#be123c",
      buttonRadiusPx: 12,
      gradient: "from-rose-900 via-rose-700 to-amber-400",
    },
    {
      name: "Cyber Violet",
      primaryColor: "#581c87",
      primaryForeground: "#ffffff",
      secondaryColor: "#f3e8ff",
      secondaryForeground: "#3b0764",
      accentColor: "#06b6d4",
      buttonColor: "#581c87",
      buttonTextColor: "#ffffff",
      buttonHoverColor: "#6b21a8",
      buttonRadiusPx: 16,
      gradient: "from-purple-950 via-violet-800 to-cyan-400",
    },
  ];

  const applyPreset = (preset: (typeof themePresets)[0]) => {
    const updated: ThemeConfig = {
      ...config,
      activePreset: preset.name,
      primaryColor: preset.primaryColor,
      primaryForeground: preset.primaryForeground,
      secondaryColor: preset.secondaryColor,
      secondaryForeground: preset.secondaryForeground,
      accentColor: preset.accentColor,
      buttonColor: preset.buttonColor,
      buttonTextColor: preset.buttonTextColor,
      buttonHoverColor: preset.buttonHoverColor,
      buttonRadiusPx: preset.buttonRadiusPx,
    };
    setConfig(updated);
    store.updateThemeConfig(updated);
    toast.success(`Applied ${preset.name} Theme Palette!`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Website Theme & Color Manager"
        description="Customize primary and secondary color palettes, button colors, corner radiuses, font family, and select from pre-built curated theme presets."
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetDefault}
              className="text-xs font-semibold gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Default
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveChanges}
              className="text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Check className="h-4 w-4" /> Save Theme Changes
            </Button>
          </div>
        }
      />

      {/* Interactive Live Component Preview Card */}
      <Card className="border shadow-2xs overflow-hidden">
        <CardHeader className="p-4 bg-muted/30 border-b">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" /> Live Storefront Theme Interactive Preview
          </CardTitle>
          <CardDescription className="text-xs">
            See how your primary/secondary colors, buttons, and accents render live on storefront components.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          <div className="p-6 rounded-2xl border bg-background space-y-4 shadow-sm">
            {/* Live Product Card Mockup */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border" style={{ backgroundColor: config.secondaryColor, color: config.secondaryForeground }}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: config.primaryColor, color: config.primaryForeground }}
                  >
                    FEATURED ITEM
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: config.accentColor, color: "#0f172a" }}
                  >
                    HOT DEAL
                  </span>
                </div>
                <h3 className="text-lg font-black" style={{ color: config.primaryColor }}>
                  Premium Noise-Cancelling Headphones
                </h3>
                <p className="text-xs opacity-80">
                  High-fidelity audio with 40-hour battery life and spatial audio.
                </p>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <span className="text-lg font-black" style={{ color: config.primaryColor }}>
                  ₹14,999
                </span>
                <button
                  type="button"
                  style={{
                    backgroundColor: config.buttonColor,
                    color: config.buttonTextColor,
                    borderRadius: `${config.buttonRadiusPx}px`,
                  }}
                  className="px-4 py-2 text-xs font-bold shadow-md hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="h-4 w-4" /> Add to Cart
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preset Color Palettes Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            Color Palette Presets
          </h3>
          <Badge variant="outline" className="text-[11px] font-semibold">
            Active: {config.activePreset}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {themePresets.map((preset) => (
            <Card
              key={preset.name}
              className={`border transition-all cursor-pointer overflow-hidden ${
                config.activePreset === preset.name
                  ? "border-primary ring-2 ring-primary/20 shadow-md"
                  : "hover:border-primary/50"
              }`}
              onClick={() => applyPreset(preset)}
            >
              <div className={`h-3 bg-gradient-to-r ${preset.gradient}`} />
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground">{preset.name}</h4>
                  {config.activePreset === preset.name && (
                    <Badge className="bg-primary text-primary-foreground text-[9px] font-bold">
                      Selected
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <div
                    className="h-6 w-6 rounded-full border shadow-2xs"
                    style={{ backgroundColor: preset.primaryColor }}
                    title={`Primary: ${preset.primaryColor}`}
                  />
                  <div
                    className="h-6 w-6 rounded-full border shadow-2xs"
                    style={{ backgroundColor: preset.secondaryColor }}
                    title={`Secondary: ${preset.secondaryColor}`}
                  />
                  <div
                    className="h-6 w-6 rounded-full border shadow-2xs"
                    style={{ backgroundColor: preset.accentColor }}
                    title={`Accent: ${preset.accentColor}`}
                  />
                  <div
                    className="h-6 w-6 rounded-full border shadow-2xs"
                    style={{ backgroundColor: preset.buttonColor }}
                    title={`Button: ${preset.buttonColor}`}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Controls Tabs */}
      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList className="inline-flex h-10 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="colors" className="text-xs font-bold px-4 py-1.5 whitespace-nowrap">
            1. Color Palette
          </TabsTrigger>
          <TabsTrigger value="buttons" className="text-xs font-bold px-4 py-1.5 whitespace-nowrap">
            2. Button Styling
          </TabsTrigger>
          <TabsTrigger value="typography" className="text-xs font-bold px-4 py-1.5 whitespace-nowrap">
            3. Typography
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PRIMARY & SECONDARY COLORS */}
        <TabsContent value="colors" className="space-y-4 pt-1">
          <Card className="border shadow-2xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" /> Primary, Secondary & Accent Palette
              </CardTitle>
              <CardDescription className="text-xs">
                Fine-tune exact Hex color codes for primary brand colors, secondary background cards, and accents.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              {/* Primary Color */}
              <div className="space-y-2 p-4 rounded-xl border bg-muted/20">
                <Label className="text-xs font-bold">Primary Brand Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) =>
                      setConfig({ ...config, primaryColor: e.target.value, activePreset: "Custom" })
                    }
                    className="h-9 w-14 p-1 cursor-pointer"
                  />
                  <Input
                    value={config.primaryColor}
                    onChange={(e) =>
                      setConfig({ ...config, primaryColor: e.target.value, activePreset: "Custom" })
                    }
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">Used for key headers, primary badges, and brand elements</span>
              </div>

              {/* Primary Foreground */}
              <div className="space-y-2 p-4 rounded-xl border bg-muted/20">
                <Label className="text-xs font-bold">Primary Text Foreground</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={config.primaryForeground}
                    onChange={(e) =>
                      setConfig({ ...config, primaryForeground: e.target.value, activePreset: "Custom" })
                    }
                    className="h-9 w-14 p-1 cursor-pointer"
                  />
                  <Input
                    value={config.primaryForeground}
                    onChange={(e) =>
                      setConfig({ ...config, primaryForeground: e.target.value, activePreset: "Custom" })
                    }
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">Text color on top of primary background elements</span>
              </div>

              {/* Secondary Color */}
              <div className="space-y-2 p-4 rounded-xl border bg-muted/20">
                <Label className="text-xs font-bold">Secondary Card Background</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={config.secondaryColor}
                    onChange={(e) =>
                      setConfig({ ...config, secondaryColor: e.target.value, activePreset: "Custom" })
                    }
                    className="h-9 w-14 p-1 cursor-pointer"
                  />
                  <Input
                    value={config.secondaryColor}
                    onChange={(e) =>
                      setConfig({ ...config, secondaryColor: e.target.value, activePreset: "Custom" })
                    }
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">Used for subtle cards, containers, and table headers</span>
              </div>

              {/* Accent Color */}
              <div className="space-y-2 p-4 rounded-xl border bg-muted/20">
                <Label className="text-xs font-bold">Highlight Accent Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={config.accentColor}
                    onChange={(e) =>
                      setConfig({ ...config, accentColor: e.target.value, activePreset: "Custom" })
                    }
                    className="h-9 w-14 p-1 cursor-pointer"
                  />
                  <Input
                    value={config.accentColor}
                    onChange={(e) =>
                      setConfig({ ...config, accentColor: e.target.value, activePreset: "Custom" })
                    }
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">Used for sale badges, star ratings, and promo highlights</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: BUTTON STYLING */}
        <TabsContent value="buttons" className="space-y-4 pt-1">
          <Card className="border shadow-2xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" /> Button Color & Corner Radius Controls
              </CardTitle>
              <CardDescription className="text-xs">
                Manage CTA button background color, text color, hover effects, and corner roundedness.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Button Background</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={config.buttonColor}
                      onChange={(e) =>
                        setConfig({ ...config, buttonColor: e.target.value, activePreset: "Custom" })
                      }
                      className="h-9 w-12 p-1 cursor-pointer"
                    />
                    <Input
                      value={config.buttonColor}
                      onChange={(e) =>
                        setConfig({ ...config, buttonColor: e.target.value, activePreset: "Custom" })
                      }
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Button Text Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={config.buttonTextColor}
                      onChange={(e) =>
                        setConfig({ ...config, buttonTextColor: e.target.value, activePreset: "Custom" })
                      }
                      className="h-9 w-12 p-1 cursor-pointer"
                    />
                    <Input
                      value={config.buttonTextColor}
                      onChange={(e) =>
                        setConfig({ ...config, buttonTextColor: e.target.value, activePreset: "Custom" })
                      }
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Button Hover Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={config.buttonHoverColor}
                      onChange={(e) =>
                        setConfig({ ...config, buttonHoverColor: e.target.value, activePreset: "Custom" })
                      }
                      className="h-9 w-12 p-1 cursor-pointer"
                    />
                    <Input
                      value={config.buttonHoverColor}
                      onChange={(e) =>
                        setConfig({ ...config, buttonHoverColor: e.target.value, activePreset: "Custom" })
                      }
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Corner Radius Slider */}
              <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold">Button Corner Radius: {config.buttonRadiusPx}px</Label>
                  <Badge variant="outline" className="text-[10px] font-mono font-bold">
                    {config.buttonRadiusPx === 0
                      ? "Sharp Corners"
                      : config.buttonRadiusPx >= 20
                      ? "Full Pill"
                      : "Rounded"}
                  </Badge>
                </div>

                <Input
                  type="range"
                  min={0}
                  max={24}
                  value={config.buttonRadiusPx}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      buttonRadiusPx: parseInt(e.target.value) || 8,
                      activePreset: "Custom",
                    })
                  }
                  className="h-9 cursor-pointer"
                />

                <div className="flex items-center justify-between gap-2 pt-2">
                  {[0, 6, 12, 18, 24].map((rad) => (
                    <Button
                      key={rad}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setConfig({ ...config, buttonRadiusPx: rad, activePreset: "Custom" })
                      }
                      className={`text-[11px] font-semibold h-7 px-3.5 ${
                        config.buttonRadiusPx === rad ? "border-primary bg-primary/10 text-primary" : ""
                      }`}
                    >
                      {rad}px
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: TYPOGRAPHY */}
        <TabsContent value="typography" className="space-y-4 pt-1">
          <Card className="border shadow-2xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Type className="h-4 w-4 text-primary" /> Storefront Typography & Font Family
              </CardTitle>
              <CardDescription className="text-xs">
                Select default typography font family for headers, products, and dashboard UI.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-4 text-xs">
              <div className="space-y-2">
                <Label className="text-xs font-bold">Font Family Selection</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {["Inter", "Outfit", "Poppins", "Roboto", "Plus Jakarta Sans"].map((font) => (
                    <button
                      key={font}
                      type="button"
                      onClick={() => {
                        setConfig({ ...config, fontFamily: font });
                        toast.success(`Font set to ${font}!`);
                      }}
                      className={`p-4 rounded-xl border text-left space-y-1 transition-all ${
                        config.fontFamily === font
                          ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                          : "bg-background hover:bg-muted"
                      }`}
                    >
                      <span className="text-sm font-bold block">{font}</span>
                      <span className="text-[11px] opacity-70 font-normal">
                        The quick brown fox jumps over the lazy dog.
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
