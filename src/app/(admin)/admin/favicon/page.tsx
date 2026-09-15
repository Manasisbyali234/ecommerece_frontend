"use client";

import { useState } from "react";
import {
  Globe,
  Upload,
  Image as ImageIcon,
  X,
  Check,
  RotateCcw,
  Sparkles,
  Store,
  ShoppingBag,
  Flame,
  Smartphone,
  Type,
  Palette,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  useStore,
  store,
  initialFaviconConfig,
  type FaviconConfig,
} from "@/lib/store";
import { uploadImage, api } from "@/lib/api";

/** Extract the R2 object key from a public R2 URL (everything after the bucket base). */
function r2KeyFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // key is the pathname without leading slash, strip any ?v= cache-bust param
    return u.pathname.replace(/^\//, "").split("?")[0] || null;
  } catch {
    return null;
  }
}

/** Append/replace a ?v= cache-busting query param on a URL. */
function cacheBust(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("v", Date.now().toString());
    return u.toString();
  } catch {
    return url;
  }
}

/** Delete an old R2 favicon file by its object key. */
async function deleteOldFavicon(oldUrl: string) {
  const key = r2KeyFromUrl(oldUrl);
  if (!key || !key.startsWith("favicon/")) return;
  await api("/admin/uploads/favicon", {
    method: "DELETE",
    body: JSON.stringify({ key }),
  }).catch(() => undefined);
}

export default function AdminFaviconPage() {
  const currentConfig = useStore(
    (s) => s.faviconConfig || initialFaviconConfig
  );

  const [config, setConfig] = useState<FaviconConfig>(
    JSON.parse(JSON.stringify(currentConfig))
  );
  const [uploading, setUploading] = useState(false);
  const [uploadingApple, setUploadingApple] = useState(false);

  // Save changes to central store & browser head
  const handleSaveChanges = () => {
    store.updateFaviconConfig(config);
    toast.success("Favicon & Browser metadata saved successfully!");
  };

  // Reset to initial default favicon settings
  const handleResetDefault = async () => {
    const fresh = JSON.parse(JSON.stringify(initialFaviconConfig));
    // Delete old R2 files if they were R2-hosted
    if (config.faviconUrl) await deleteOldFavicon(config.faviconUrl);
    if (config.appleTouchIconUrl) await deleteOldFavicon(config.appleTouchIconUrl);
    setConfig(fresh);
    store.updateFaviconConfig(fresh);
    toast.info("Favicon reset to default!");
  };

  // Preset favicon SVGs encoded as DataURLs
  const presetFavicons = [
    {
      name: "Default Store Badge",
      icon: Store,
      url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230f172a'><rect width='24' height='24' rx='6' fill='%230f172a'/><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' stroke='%23ffffff' stroke-width='2'/></svg>",
    },
    {
      name: "Shopping Bag",
      icon: ShoppingBag,
      url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%232563eb'><rect width='24' height='24' rx='6' fill='%232563eb'/><path d='M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z' stroke='%23ffffff' stroke-width='2'/></svg>",
    },
    {
      name: "Flame Deals",
      icon: Flame,
      url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f59e0b'><rect width='24' height='24' rx='6' fill='%23f59e0b'/><path d='M12 2c0 4-4 6-4 10 0 3.3 2.7 6 6 6s6-2.7 6-6c0-4-4-6-4-10z' fill='%23ffffff'/></svg>",
    },
    {
      name: "Sparkles Star",
      icon: Sparkles,
      url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23e11d48'><rect width='24' height='24' rx='6' fill='%23e11d48'/><path d='M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z' fill='%23ffffff'/></svg>",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Favicon Manager"
        description="Upload custom favicon icons, preview live browser tab simulation, set Apple touch iOS icons, and customize site title metadata."
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
              <Check className="h-4 w-4" /> Save Favicon Changes
            </Button>
          </div>
        }
      />

      {/* Real-Time Browser Tab Preview Simulation */}
      <Card className="border shadow-2xs overflow-hidden">
        <CardHeader className="p-4 bg-muted/30 border-b">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-500" /> Real-Time Browser Tab Live Simulation
          </CardTitle>
          <CardDescription className="text-xs">
            Preview how your favicon icon and page title look inside actual web browsers (Chrome, Safari, Firefox).
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 bg-slate-900 text-slate-100 space-y-4">
          {/* Simulated Browser Chrome Address Bar & Tabs */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-2xl space-y-2">
            {/* Window Dots & Tab */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2">
                <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>

              {/* Active Tab Preview */}
              <div className="flex items-center gap-2 bg-slate-800 text-slate-100 text-xs px-3 py-1.5 rounded-t-lg border-t border-x border-slate-700 max-w-sm truncate font-medium">
                <div className="h-4 w-4 shrink-0 flex items-center justify-center rounded overflow-hidden">
                  {config.faviconUrl ? (
                    <img
                      src={config.faviconUrl}
                      alt="Favicon Preview"
                      className="h-4 w-4 object-contain"
                    />
                  ) : (
                    <Store className="h-3.5 w-3.5 text-amber-400" />
                  )}
                </div>
                <span className="truncate flex-1 font-sans text-[11px]">
                  {config.siteTitle || "Metromindz Store — Premium E-Commerce"}
                </span>
                <X className="h-3 w-3 text-slate-400 hover:text-slate-200 shrink-0 cursor-pointer" />
              </div>
            </div>

            {/* Address URL Bar */}
            <div className="bg-slate-900 rounded-md px-3 py-1 text-[11px] text-slate-400 flex items-center gap-2 border border-slate-800 font-mono">
              <span className="text-emerald-400">🔒 https://</span>
              <span>store.local</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Upload Favicon File & URL */}
        <Card className="border shadow-2xs">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" /> Primary Favicon Icon
            </CardTitle>
            <CardDescription className="text-xs">
              Upload your favicon file (.ico, .png, .svg, .jpg) or paste a direct image URL.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-6 text-xs">
            {/* Upload Area */}
            <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
              <Label className="text-xs font-bold text-foreground block">
                Favicon Image File Upload
              </Label>

              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl border bg-background flex items-center justify-center p-2 shadow-2xs shrink-0">
                  {config.faviconUrl ? (
                    <img
                      src={config.faviconUrl}
                      alt="Favicon Icon"
                      className="h-8 w-8 object-contain"
                    />
                  ) : (
                    <Store className="h-7 w-7 text-primary" />
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploading}
                      className="text-xs font-semibold gap-1.5 cursor-pointer relative"
                    >
                      <Upload className="h-3.5 w-3.5" /> {uploading ? "Uploading…" : "Select Favicon File"}
                      <input
                        type="file"
                        accept="image/*,.ico,.svg"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploading(true);
                          try {
                            const oldUrl = config.faviconUrl;
                            const url = await uploadImage("favicon", file);
                            const bustedUrl = cacheBust(url);
                            if (oldUrl && oldUrl !== bustedUrl) await deleteOldFavicon(oldUrl);
                            setConfig((c) => ({ ...c, faviconUrl: bustedUrl }));
                            toast.success("Favicon uploaded to Cloudflare R2!");
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : "Upload failed");
                          } finally {
                            setUploading(false);
                            e.target.value = "";
                          }
                        }}
                      />
                    </Button>

                    {config.faviconUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          await deleteOldFavicon(config.faviconUrl);
                          setConfig({ ...config, faviconUrl: "" });
                          toast.info("Favicon removed");
                        }}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-600 gap-1"
                      >
                        <X className="h-3.5 w-3.5" /> Remove
                      </Button>
                    )}
                  </div>

                  <span className="text-[10px] text-muted-foreground block">
                    Recommended dimensions: 32x32 px or 64x64 px (PNG, SVG, or ICO)
                  </span>
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <Label className="text-[11px] text-muted-foreground font-medium">Or Paste Direct Image URL</Label>
                <Input
                  value={config.faviconUrl || ""}
                  onChange={(e) => setConfig({ ...config, faviconUrl: e.target.value })}
                  placeholder="https://example.com/favicon.png"
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            {/* Quick Presets Picker */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">Quick Preset Favicon Icons</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {presetFavicons.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setConfig({ ...config, faviconUrl: preset.url });
                      toast.success(`Selected ${preset.name} preset!`);
                    }}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all ${
                      config.faviconUrl === preset.url
                        ? "border-primary bg-primary/10 text-primary shadow-xs"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    <preset.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate text-[11px]">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Apple Touch Icon & Metadata Settings */}
        <Card className="border shadow-2xs">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-emerald-500" /> Apple Touch Icon & Metadata
            </CardTitle>
            <CardDescription className="text-xs">
              Configure iOS home screen app icon, browser tab title, and browser header theme color.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-5 text-xs">
            {/* Apple Touch Icon */}
            <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
              <Label className="text-xs font-bold text-foreground block">
                Apple Touch Icon (iOS Homescreen)
              </Label>

              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl border bg-background flex items-center justify-center p-1.5 shadow-2xs shrink-0 overflow-hidden">
                  {config.appleTouchIconUrl ? (
                    <img
                      src={config.appleTouchIconUrl}
                      alt="Apple Touch Icon"
                      className="h-10 w-10 object-contain rounded-xl"
                    />
                  ) : (
                    <Smartphone className="h-6 w-6 text-emerald-500" />
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingApple}
                    className="text-xs font-semibold gap-1.5 cursor-pointer relative"
                  >
                    <Upload className="h-3.5 w-3.5" /> {uploadingApple ? "Uploading…" : "Upload iOS Icon"}
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingApple(true);
                        try {
                          const oldUrl = config.appleTouchIconUrl;
                          const url = await uploadImage("favicon", file);
                          const bustedUrl = cacheBust(url);
                          if (oldUrl && oldUrl !== bustedUrl) await deleteOldFavicon(oldUrl);
                          setConfig((c) => ({ ...c, appleTouchIconUrl: bustedUrl }));
                          toast.success("Apple Touch Icon uploaded to Cloudflare R2!");
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Upload failed");
                        } finally {
                          setUploadingApple(false);
                          e.target.value = "";
                        }
                      }}
                    />
                  </Button>
                  <span className="text-[10px] text-muted-foreground block">
                    Recommended dimensions: 180x180 px (PNG format)
                  </span>
                </div>
              </div>
            </div>

            {/* Browser Tab Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5 text-primary" /> Browser Page Title Metadata
              </Label>
              <Input
                value={config.siteTitle || ""}
                onChange={(e) => setConfig({ ...config, siteTitle: e.target.value })}
                placeholder="Metromindz Store — Premium E-Commerce"
                className="h-9 text-xs font-semibold"
              />
            </div>

            {/* Browser Theme Bar Color */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-amber-500" /> Mobile Browser Bar Theme Color
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={config.themeColor || "#0f172a"}
                  onChange={(e) => setConfig({ ...config, themeColor: e.target.value })}
                  className="h-9 w-16 p-1 cursor-pointer"
                />
                <Input
                  value={config.themeColor || "#0f172a"}
                  onChange={(e) => setConfig({ ...config, themeColor: e.target.value })}
                  placeholder="#0f172a"
                  className="h-9 text-xs font-mono max-w-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
