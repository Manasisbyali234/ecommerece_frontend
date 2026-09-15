"use client";

import { useState } from "react";
import {
  Sliders,
  Megaphone,
  Store,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Check,
  Upload,
  Image as ImageIcon,
  X,
  RotateCcw,
  Sparkles,
  Search,
  Heart,
  ShoppingBag,
  User,
  Pin,
  Palette,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useStore,
  store,
  initialHeaderConfig,
  type HeaderConfig,
  type HeaderNavLink,
} from "@/lib/store";

export default function AdminHeaderPage() {
  const currentConfig = useStore(
    (s) => s.headerConfig || initialHeaderConfig
  );

  const [config, setConfig] = useState<HeaderConfig>(JSON.parse(JSON.stringify(currentConfig)));

  // Save changes to central store
  const handleSaveChanges = () => {
    store.updateHeaderConfig(config);
    toast.success("Header configuration saved successfully!");
  };

  // Reset to initial default header layout
  const handleResetDefault = () => {
    const fresh = JSON.parse(JSON.stringify(initialHeaderConfig));
    setConfig(fresh);
    store.updateHeaderConfig(fresh);
    toast.info("Header layout reset to default!");
  };

  // Nav link operations
  const handleMoveNavLink = (index: number, direction: "up" | "down") => {
    const links = [...config.navLinks];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= links.length) return;
    const temp = links[index];
    links[index] = links[targetIdx];
    links[targetIdx] = temp;
    setConfig({ ...config, navLinks: links });
    toast.success("Navigation link order updated");
  };

  const handleToggleLinkActive = (index: number) => {
    const links = [...config.navLinks];
    links[index] = { ...links[index], active: !links[index].active };
    setConfig({ ...config, navLinks: links });
    toast.info(`Link set to ${links[index].active ? "Active" : "Inactive"}`);
  };

  const handleAddNavLink = () => {
    const newLink: HeaderNavLink = {
      id: `hnav-${Date.now()}`,
      label: "New Category Link",
      url: "/#products",
      active: true,
      badge: "NEW",
    };
    setConfig({ ...config, navLinks: [...config.navLinks, newLink] });
    toast.success("Navigation link created!");
  };

  const handleDeleteNavLink = (index: number) => {
    if (config.navLinks.length <= 1) {
      toast.error("Constraint: At least 1 navigation link required.");
      return;
    }
    const links = [...config.navLinks];
    links.splice(index, 1);
    setConfig({ ...config, navLinks: links });
    toast.success("Navigation link removed");
  };

  const activeLinksCount = config.navLinks.filter((l) => l.active).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Header Manager"
        description="Flexible controls for top announcement banners, store header logo, navigation link badges, action icons, and sticky navigation."
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
              <Check className="h-4 w-4" /> Save Header Changes
            </Button>
          </div>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Top Banner Status</p>
              <h3 className="text-xl font-black text-foreground mt-1">
                {config.topBanner.enabled ? "✓ Banner Enabled" : "✕ Disabled"}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Top notification ticker</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Megaphone className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Active Nav Links</p>
              <h3 className="text-xl font-black text-foreground mt-1">
                {activeLinksCount} / {config.navLinks.length} Active
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">With badges & highlights</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <LinkIcon className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Sticky Header</p>
              <h3 className="text-xl font-black text-foreground mt-1">
                {config.actions.stickyHeader ? "Fixed Glassmorphism" : "Static Scroll"}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Header scroll behavior</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Pin className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Container */}
      <Tabs defaultValue="nav" className="space-y-6">
        <TabsList className="inline-flex h-10 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="nav" className="text-xs font-bold px-3.5 py-1.5 whitespace-nowrap">1. Navigation Links</TabsTrigger>
          <TabsTrigger value="banner" className="text-xs font-bold px-3.5 py-1.5 whitespace-nowrap">2. Top Banner</TabsTrigger>
          <TabsTrigger value="logo" className="text-xs font-bold px-3.5 py-1.5 whitespace-nowrap">3. Header Logo</TabsTrigger>
          <TabsTrigger value="actions" className="text-xs font-bold px-3.5 py-1.5 whitespace-nowrap">4. Actions & Layout</TabsTrigger>
        </TabsList>

        {/* TAB 1: MAIN NAVIGATION LINKS */}
        <TabsContent value="nav" className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" /> Header Navigation Links & Badges
              </h3>
              <p className="text-xs text-muted-foreground">
                Customize main navigation menu items, re-order links, toggle active status, and add eye-catching badges.
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleAddNavLink}
              className="text-xs font-bold gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add Nav Link
            </Button>
          </div>

          <div className="space-y-3">
            {config.navLinks.map((link, idx) => (
              <Card
                key={link.id}
                className={`border transition-all ${
                  link.active ? "bg-card border-border shadow-2xs" : "bg-muted/30 border-dashed opacity-75"
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono font-bold">
                        Link #{idx + 1}
                      </Badge>

                      {link.badge && (
                        <Badge className="bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0">
                          {link.badge}
                        </Badge>
                      )}

                      {link.highlight && (
                        <Badge className="bg-rose-500 text-white font-bold text-[9px] px-2 py-0">
                          Highlighted
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={idx === 0}
                        onClick={() => handleMoveNavLink(idx, "up")}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Move Link Up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={idx === config.navLinks.length - 1}
                        onClick={() => handleMoveNavLink(idx, "down")}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Move Link Down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleToggleLinkActive(idx)}
                        className={`h-7 w-7 ${link.active ? "text-emerald-600" : "text-slate-400"}`}
                        title={link.active ? "Deactivate Link" : "Activate Link"}
                      >
                        {link.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </Button>

                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteNavLink(idx)}
                        className="h-7 w-7 text-slate-400 hover:text-rose-500"
                        title="Delete Link"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div className="space-y-1 sm:col-span-1">
                      <Label className="text-[11px] font-bold">Display Label</Label>
                      <Input
                        value={link.label}
                        onChange={(e) => {
                          const links = [...config.navLinks];
                          links[idx].label = e.target.value;
                          setConfig({ ...config, navLinks: links });
                        }}
                        className="h-8 text-xs font-semibold"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-1">
                      <Label className="text-[11px] font-bold">Target URL</Label>
                      <Input
                        value={link.url}
                        onChange={(e) => {
                          const links = [...config.navLinks];
                          links[idx].url = e.target.value;
                          setConfig({ ...config, navLinks: links });
                        }}
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-1">
                      <Label className="text-[11px] font-bold">Promo Badge (Optional)</Label>
                      <Input
                        value={link.badge || ""}
                        onChange={(e) => {
                          const links = [...config.navLinks];
                          links[idx].badge = e.target.value;
                          setConfig({ ...config, navLinks: links });
                        }}
                        placeholder="e.g. HOT, NEW, SALE"
                        className="h-8 text-xs font-bold uppercase"
                      />
                    </div>

                    <div className="flex items-center gap-2 sm:col-span-1 pt-4">
                      <Switch
                        checked={link.highlight || false}
                        onCheckedChange={(val) => {
                          const links = [...config.navLinks];
                          links[idx].highlight = val;
                          setConfig({ ...config, navLinks: links });
                        }}
                      />
                      <Label className="text-xs font-semibold cursor-pointer">Highlight Color</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 2: TOP ANNOUNCEMENT BANNER */}
        <TabsContent value="banner" className="space-y-4 pt-1">
          <Card className="border shadow-2xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-amber-500" /> Top Announcement Ticker Settings
              </CardTitle>
              <CardDescription className="text-xs">
                Configure announcement bar message, call-to-action link, and custom background colors.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-5 text-xs">
              <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold block">Enable Top Announcement Bar</Label>
                  <span className="text-muted-foreground text-[11px]">Display notification banner at top of header</span>
                </div>
                <Switch
                  checked={config.topBanner.enabled}
                  onCheckedChange={(val) =>
                    setConfig({
                      ...config,
                      topBanner: { ...config.topBanner, enabled: val },
                    })
                  }
                />
              </div>

              {config.topBanner.enabled && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Announcement Text Message</Label>
                    <Input
                      value={config.topBanner.text}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          topBanner: { ...config.topBanner, text: e.target.value },
                        })
                      }
                      placeholder="🎉 Special Offer: Free Express Delivery on All Orders!"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">CTA Link Label</Label>
                      <Input
                        value={config.topBanner.linkText || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            topBanner: { ...config.topBanner, linkText: e.target.value },
                          })
                        }
                        placeholder="Shop Deals"
                        className="h-9 text-xs font-semibold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">CTA Target URL</Label>
                      <Input
                        value={config.topBanner.linkUrl || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            topBanner: { ...config.topBanner, linkUrl: e.target.value },
                          })
                        }
                        placeholder="/#products"
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Colors Customizer */}
                  <div className="space-y-3 pt-2">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <Palette className="h-3.5 w-3.5 text-primary" /> Announcement Bar Colors
                    </Label>

                    <div className="flex flex-wrap items-center gap-3">
                      {["#0f172a", "#1e1b4b", "#881337", "#064e3b", "#78350f"].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() =>
                            setConfig({
                              ...config,
                              topBanner: { ...config.topBanner, bgColor: color },
                            })
                          }
                          className={`h-7 w-7 rounded-full border-2 transition-all ${
                            config.topBanner.bgColor === color ? "scale-110 border-primary shadow-md" : "border-transparent"
                          }`}
                          style={{ backgroundColor: color }}
                          title={`Color ${color}`}
                        />
                      ))}
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-[11px] text-muted-foreground font-semibold">Custom Hex:</span>
                        <Input
                          type="color"
                          value={config.topBanner.bgColor}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              topBanner: { ...config.topBanner, bgColor: e.target.value },
                            })
                          }
                          className="h-8 w-12 p-0.5 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: HEADER LOGO */}
        <TabsContent value="logo" className="space-y-4 pt-1">
          <Card className="border shadow-2xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" /> Header Logo & Store Branding
              </CardTitle>
              <CardDescription className="text-xs">
                Upload image logo for header or use custom brand store name text with adjustable height.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6 text-xs">
              <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
                <Label className="text-xs font-bold text-foreground block">
                  Header Logo Image Upload
                </Label>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="h-16 w-48 rounded-xl border bg-background flex items-center justify-center p-3 shadow-2xs relative">
                    {config.logo.imageUrl ? (
                      <img
                        src={config.logo.imageUrl}
                        alt="Header Logo Preview"
                        style={{ height: `${config.logo.heightPx}px` }}
                        className="max-w-full object-contain"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground">
                          <Store className="h-4 w-4" />
                        </div>
                        <span>{config.logo.text || "Store"}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 flex-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs font-semibold gap-1.5 cursor-pointer relative"
                      >
                        <Upload className="h-3.5 w-3.5" /> Upload Logo File
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setConfig({
                                  ...config,
                                  logo: { ...config.logo, imageUrl: ev.target?.result as string },
                                });
                                toast.success("Header logo uploaded successfully!");
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </Button>

                      {config.logo.imageUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setConfig({
                              ...config,
                              logo: { ...config.logo, imageUrl: "" },
                            });
                            toast.info("Logo removed. Falling back to Store name text.");
                          }}
                          className="text-xs font-semibold text-rose-500 hover:text-rose-600 gap-1"
                        >
                          <X className="h-3.5 w-3.5" /> Remove Custom Logo
                        </Button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground font-medium">Or Direct Image URL</Label>
                      <Input
                        value={config.logo.imageUrl || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            logo: { ...config.logo, imageUrl: e.target.value },
                          })
                        }
                        placeholder="https://example.com/logo.png"
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Store Name Text (Fallback / Alt Text)</Label>
                  <Input
                    value={config.logo.text}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        logo: { ...config.logo, text: e.target.value },
                      })
                    }
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Logo Height: {config.logo.heightPx}px</Label>
                  <Input
                    type="range"
                    min={24}
                    max={64}
                    value={config.logo.heightPx}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        logo: { ...config.logo, heightPx: parseInt(e.target.value) || 36 },
                      })
                    }
                    className="h-9 cursor-pointer"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: HEADER ACTIONS & LAYOUT */}
        <TabsContent value="actions" className="space-y-4 pt-1">
          <Card className="border shadow-2xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" /> Header Action Controls & Sticky Navigation
              </CardTitle>
              <CardDescription className="text-xs">
                Toggle visibility for Search Bar, Wishlist icon, Shopping Cart bag, and User Account controls.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-amber-500" />
                    <div>
                      <Label className="text-xs font-bold block">Search Bar</Label>
                      <span className="text-[11px] text-muted-foreground">Product search dropdown</span>
                    </div>
                  </div>
                  <Switch
                    checked={config.actions.showSearch}
                    onCheckedChange={(val) =>
                      setConfig({
                        ...config,
                        actions: { ...config.actions, showSearch: val },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-rose-500" />
                    <div>
                      <Label className="text-xs font-bold block">Wishlist Icon</Label>
                      <span className="text-[11px] text-muted-foreground">Saved wishlist items counter</span>
                    </div>
                  </div>
                  <Switch
                    checked={config.actions.showWishlist}
                    onCheckedChange={(val) =>
                      setConfig({
                        ...config,
                        actions: { ...config.actions, showWishlist: val },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                    <div>
                      <Label className="text-xs font-bold block">Shopping Cart Icon</Label>
                      <span className="text-[11px] text-muted-foreground">Cart items counter drawer</span>
                    </div>
                  </div>
                  <Switch
                    checked={config.actions.showCart}
                    onCheckedChange={(val) =>
                      setConfig({
                        ...config,
                        actions: { ...config.actions, showCart: val },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-500" />
                    <div>
                      <Label className="text-xs font-bold block">User Account Profile</Label>
                      <span className="text-[11px] text-muted-foreground">Login / My Account button</span>
                    </div>
                  </div>
                  <Switch
                    checked={config.actions.showUserAccount}
                    onCheckedChange={(val) =>
                      setConfig({
                        ...config,
                        actions: { ...config.actions, showUserAccount: val },
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border bg-primary/5 border-primary/20 mt-2">
                <div className="flex items-center gap-2">
                  <Pin className="h-4 w-4 text-primary" />
                  <div>
                    <Label className="text-xs font-bold block">Sticky Glassmorphism Header</Label>
                    <span className="text-[11px] text-muted-foreground">Keep header fixed at top of page while scrolling</span>
                  </div>
                </div>
                <Switch
                  checked={config.actions.stickyHeader}
                  onCheckedChange={(val) =>
                    setConfig({
                      ...config,
                      actions: { ...config.actions, stickyHeader: val },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
