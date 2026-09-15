"use client";

import { useState } from "react";
import {
  Sliders,
  Store,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Check,
  Globe,
  Share2,
  Layers,
  Copy,
  Sparkles,
  Link as LinkIcon,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useStore,
  store,
  initialFooterConfig,
  type FooterConfig,
  type FooterColumn,
  type FooterLink,
  type SocialLink,
} from "@/lib/store";

export default function AdminFooterPage() {
  const currentConfig = useStore(
    (s) => s.footerConfig || initialFooterConfig
  );

  const [config, setConfig] = useState<FooterConfig>(JSON.parse(JSON.stringify(currentConfig)));

  // Save changes to central store
  const handleSaveChanges = () => {
    store.updateFooterConfig(config);
    toast.success("Footer configuration saved successfully!");
  };

  // Reset to initial default footer layout
  const handleResetDefault = () => {
    const fresh = JSON.parse(JSON.stringify(initialFooterConfig));
    setConfig(fresh);
    store.updateFooterConfig(fresh);
    toast.info("Footer layout reset to default!");
  };

  // Column operations
  const handleMoveColumn = (index: number, direction: "up" | "down") => {
    const cols = [...config.columns];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= cols.length) return;
    const temp = cols[index];
    cols[index] = cols[targetIdx];
    cols[targetIdx] = temp;
    setConfig({ ...config, columns: cols });
    toast.success("Column order updated");
  };

  const handleToggleColumnActive = (index: number) => {
    const cols = [...config.columns];
    cols[index] = { ...cols[index], active: !cols[index].active };
    setConfig({ ...config, columns: cols });
    toast.info(`Column set to ${cols[index].active ? "Active" : "Inactive"}`);
  };

  const handleAddColumn = () => {
    const newCol: FooterColumn = {
      id: `col-${Date.now()}`,
      title: "New Custom Column",
      active: true,
      links: [
        { id: `link-${Date.now()}-1`, label: "Sample Page 1", url: "/#", active: true },
        { id: `link-${Date.now()}-2`, label: "Sample Page 2", url: "/#", active: true },
      ],
    };
    setConfig({ ...config, columns: [...config.columns, newCol] });
    toast.success("New column created!");
  };

  const handleDeleteColumn = (index: number) => {
    if (config.columns.length <= 1) {
      toast.error("Constraint: At least 1 column required in footer.");
      return;
    }
    const cols = [...config.columns];
    cols.splice(index, 1);
    setConfig({ ...config, columns: cols });
    toast.success("Column removed");
  };

  // Link operations inside column
  const handleAddLinkToColumn = (colIdx: number) => {
    const cols = [...config.columns];
    const newLink: FooterLink = {
      id: `l-${Date.now()}`,
      label: "New Link Label",
      url: "/#",
      active: true,
    };
    cols[colIdx].links.push(newLink);
    setConfig({ ...config, columns: cols });
    toast.success("Link added to column");
  };

  const handleDeleteLinkFromColumn = (colIdx: number, linkIdx: number) => {
    const cols = [...config.columns];
    cols[colIdx].links.splice(linkIdx, 1);
    setConfig({ ...config, columns: cols });
    toast.success("Link deleted");
  };

  // Social Link operations
  const handleToggleSocialActive = (index: number) => {
    const socs = [...config.socialLinks];
    socs[index] = { ...socs[index], active: !socs[index].active };
    setConfig({ ...config, socialLinks: socs });
    toast.info(`Social media set to ${socs[index].active ? "Active" : "Inactive"}`);
  };

  const handleAddSocialLink = () => {
    const newSoc: SocialLink = {
      id: `soc-${Date.now()}`,
      platform: "Custom Social Platform",
      url: "https://",
      active: true,
      icon: "Custom",
    };
    setConfig({ ...config, socialLinks: [...config.socialLinks, newSoc] });
    toast.success("Social media platform added!");
  };

  const handleDeleteSocialLink = (index: number) => {
    const socs = [...config.socialLinks];
    socs.splice(index, 1);
    setConfig({ ...config, socialLinks: socs });
    toast.success("Social link deleted");
  };

  const activeColumnsCount = config.columns.filter((c) => c.active).length;
  const totalLinksCount = config.columns.reduce((acc, c) => acc + c.links.length, 0);
  const activeSocialCount = config.socialLinks.filter((s) => s.active).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Footer Manager"
        description="Customize brand bio, active/inactive footer columns, column labels, link URLs, and social media links live on your storefront."
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
              <Check className="h-4 w-4" /> Save Footer Changes
            </Button>
          </div>
        }
      />

      {/* Top Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Active Columns</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{activeColumnsCount} / {config.columns.length}</h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Live on storefront</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Footer Links</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{totalLinksCount} Links</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Customized across columns</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <LinkIcon className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Social Platforms</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{activeSocialCount} Active</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Instagram, FB, Twitter & more</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Share2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Container */}
      <Tabs defaultValue="columns" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="columns" className="text-xs font-bold">1. Footer Columns</TabsTrigger>
          <TabsTrigger value="social" className="text-xs font-bold">2. Social Media</TabsTrigger>
          <TabsTrigger value="brand" className="text-xs font-bold">3. Brand & Bio</TabsTrigger>
        </TabsList>

        {/* TAB 1: FOOTER COLUMNS & LINKS MANAGER */}
        <TabsContent value="columns" className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" /> Footer Column Layout & Links
              </h3>
              <p className="text-xs text-muted-foreground">
                Re-order columns, toggle active/inactive columns, edit title labels, or add custom links.
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleAddColumn}
              className="text-xs font-bold gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add Custom Column
            </Button>
          </div>

          <div className="space-y-4">
            {config.columns.map((col, cIdx) => (
              <Card
                key={col.id}
                className={`border transition-all ${
                  col.active ? "bg-card border-border shadow-2xs" : "bg-muted/30 border-dashed opacity-75"
                }`}
              >
                <CardHeader className="p-4 border-b bg-muted/20 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="outline" className="text-[10px] font-mono font-bold">
                      Col #{cIdx + 1}
                    </Badge>

                    <div className="space-y-0.5 min-w-0">
                      <Input
                        value={col.title}
                        onChange={(e) => {
                          const cols = [...config.columns];
                          cols[cIdx].title = e.target.value;
                          setConfig({ ...config, columns: cols });
                        }}
                        className="h-8 text-xs font-bold bg-background max-w-xs"
                        placeholder="Column Title"
                      />
                    </div>

                    <Badge
                      className={`text-[9px] font-bold py-0 px-2 ${
                        col.active
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-muted text-muted-foreground border-muted-foreground/20"
                      }`}
                    >
                      {col.active ? "✓ Active Column" : "✕ Inactive"}
                    </Badge>
                  </div>

                  {/* Column Controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={cIdx === 0}
                      onClick={() => handleMoveColumn(cIdx, "up")}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Move Column Left/Up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={cIdx === config.columns.length - 1}
                      onClick={() => handleMoveColumn(cIdx, "down")}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Move Column Right/Down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleToggleColumnActive(cIdx)}
                      className={`h-7 w-7 ${col.active ? "text-emerald-600" : "text-slate-400"}`}
                      title={col.active ? "Deactivate Column" : "Activate Column"}
                    >
                      {col.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </Button>

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteColumn(cIdx)}
                      className="h-7 w-7 text-slate-400 hover:text-rose-500"
                      title="Delete Column"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Column Links ({col.links.length})
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddLinkToColumn(cIdx)}
                      className="h-7 text-xs font-semibold gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add Link
                    </Button>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {col.links.map((link, lIdx) => (
                      <div
                        key={link.id}
                        className="flex items-center gap-2"
                      >
                        <Input
                          value={link.label}
                          onChange={(e) => {
                            const cols = [...config.columns];
                            cols[cIdx].links[lIdx].label = e.target.value;
                            setConfig({ ...config, columns: cols });
                          }}
                          placeholder="Link Display Text"
                          className="h-8 text-xs flex-1"
                        />
                        <Input
                          value={link.url}
                          onChange={(e) => {
                            const cols = [...config.columns];
                            cols[cIdx].links[lIdx].url = e.target.value;
                            setConfig({ ...config, columns: cols });
                          }}
                          placeholder="URL Path e.g. /privacy-policy"
                          className="h-8 text-xs font-mono flex-1"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteLinkFromColumn(cIdx, lIdx)}
                          className="h-8 w-8 text-slate-400 hover:text-rose-500 shrink-0 hover:bg-rose-500/10"
                          title="Delete Link"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 2: SOCIAL MEDIA LINKS */}
        <TabsContent value="social" className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Share2 className="h-4 w-4 text-blue-500" /> Social Media Platforms
              </h3>
              <p className="text-xs text-muted-foreground">
                Manage social media handles displayed under the brand bio in the storefront footer.
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleAddSocialLink}
              className="text-xs font-bold gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add Social Platform
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {config.socialLinks.map((soc, sIdx) => (
              <Card key={soc.id} className="border shadow-2xs">
                <CardContent className="p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {soc.platform}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleToggleSocialActive(sIdx)}
                        className={`h-7 w-7 ${soc.active ? "text-emerald-600" : "text-slate-400"}`}
                        title={soc.active ? "Deactivate Social Link" : "Activate Social Link"}
                      >
                        {soc.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </Button>

                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteSocialLink(sIdx)}
                        className="h-7 w-7 text-slate-400 hover:text-rose-500"
                        title="Delete Social Link"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold">Platform Name</Label>
                      <Input
                        value={soc.platform}
                        onChange={(e) => {
                          const socs = [...config.socialLinks];
                          socs[sIdx].platform = e.target.value;
                          setConfig({ ...config, socialLinks: socs });
                        }}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold">Target URL</Label>
                      <Input
                        value={soc.url}
                        onChange={(e) => {
                          const socs = [...config.socialLinks];
                          socs[sIdx].url = e.target.value;
                          setConfig({ ...config, socialLinks: socs });
                        }}
                        placeholder="https://instagram.com/yourhandle"
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: BRAND & LOGO */}
        <TabsContent value="brand" className="space-y-4 pt-1">
          <Card className="border shadow-2xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" /> Footer Logo & Brand Settings
              </CardTitle>
              <CardDescription className="text-xs">
                Upload your official brand logo image, set store description, and customize announcement tagline.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6 text-xs">
              {/* Brand Logo Upload Section */}
              <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
                <Label className="text-xs font-bold text-foreground block">
                  Store Footer Logo Image
                </Label>

                {/* Logo Live Preview */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="h-16 w-48 rounded-xl border bg-background flex items-center justify-center p-3 shadow-2xs relative group">
                    {config.logoUrl ? (
                      <img
                        src={config.logoUrl}
                        alt="Footer Logo Preview"
                        className="max-h-12 max-w-full object-contain"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground">
                          <Store className="h-4 w-4" />
                        </div>
                        <span>{config.brandName || "Store"}</span>
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
                                setConfig({ ...config, logoUrl: ev.target?.result as string });
                                toast.success("Footer logo uploaded successfully!");
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </Button>

                      {config.logoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setConfig({ ...config, logoUrl: "" });
                            toast.info("Logo removed. Falling back to Store name text.");
                          }}
                          className="text-xs font-semibold text-rose-500 hover:text-rose-600 gap-1"
                        >
                          <X className="h-3.5 w-3.5" /> Remove Custom Logo
                        </Button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground font-medium">Or Paste Direct Image URL</Label>
                      <Input
                        value={config.logoUrl || ""}
                        onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                        placeholder="https://example.com/logo.png"
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Brand Fallback Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Brand Store Name (Fallback / Alt Text)</Label>
                <Input
                  value={config.brandName}
                  onChange={(e) => setConfig({ ...config, brandName: e.target.value })}
                  placeholder="Store"
                  className="h-9 text-xs max-w-md"
                />
              </div>

              {/* Brand Description Bio */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Brand Description Bio</Label>
                <Textarea
                  rows={3}
                  value={config.description}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  placeholder="Enter store description..."
                  className="text-xs max-w-lg"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
