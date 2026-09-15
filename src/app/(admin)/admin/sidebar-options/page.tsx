"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Search,
  Check,
  Sliders,
  Flame,
  HelpCircle,
  Link as LinkIcon,
  LayoutGrid,
  List,
} from "lucide-react";
import { toast } from "sonner";
import * as LucideIcons from "lucide-react";

import { useStore, store, type SidebarOption } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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

export default function AdminSidebarOptionsPage() {
  const sidebarOptions = useStore((s) => s.sidebarOptions || []);

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Dialog State
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [draftSection, setDraftSection] = useState<"trending" | "help">("trending");
  const [draftLabel, setDraftLabel] = useState("");
  const [draftIcon, setDraftIcon] = useState("Flame");
  const [draftUrl, setDraftUrl] = useState("");
  const [draftActive, setDraftActive] = useState(true);

  // Filter
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return sidebarOptions;
    const q = searchQuery.toLowerCase();
    return sidebarOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.section.toLowerCase().includes(q) ||
        opt.url.toLowerCase().includes(q)
    );
  }, [sidebarOptions, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: sidebarOptions.length,
      active: sidebarOptions.filter((o) => o.active).length,
      trending: sidebarOptions.filter((o) => o.section === "trending").length,
      help: sidebarOptions.filter((o) => o.section === "help").length,
    };
  }, [sidebarOptions]);

  // Actions
  const toggleActive = (id: string) => {
    const opt = sidebarOptions.find((x) => x.id === id);
    if (opt) {
      store.updateSidebarOption(id, { active: !opt.active });
      toast.success(
        `Sidebar Option "${opt.label}" ${opt.active ? "paused" : "activated"}`
      );
    }
  };

  const startCreate = () => {
    setEditingId(null);
    setDraftSection("trending");
    setDraftLabel("");
    setDraftIcon("Flame");
    setDraftUrl("");
    setDraftActive(true);
    setOpen(true);
  };

  const startEdit = (opt: SidebarOption) => {
    setEditingId(opt.id);
    setDraftSection(opt.section);
    setDraftLabel(opt.label);
    setDraftIcon(opt.icon);
    setDraftUrl(opt.url);
    setDraftActive(opt.active);
    setOpen(true);
  };

  const saveOption = () => {
    if (!draftLabel.trim()) {
      toast.error("Label is required");
      return;
    }
    if (!draftUrl.trim()) {
      toast.error("Destination URL is required");
      return;
    }

    const payload = {
      section: draftSection,
      label: draftLabel.trim(),
      icon: draftIcon.trim(),
      url: draftUrl.trim(),
      active: draftActive,
    };

    if (editingId) {
      store.updateSidebarOption(editingId, payload);
      toast.success(`Option "${draftLabel}" updated live!`);
    } else {
      store.addSidebarOption(payload);
      toast.success(`Option "${draftLabel}" published!`);
    }
    setOpen(false);
    setEditingId(null);
  };

  const deleteOption = (id: string) => {
    const opt = sidebarOptions.find((o) => o.id === id);
    store.removeSidebarOption(id);
    toast.success(`Option "${opt?.label}" removed`);
  };

  // Helper to resolve custom Lucide icon component
  const renderOptionIcon = (iconName: string, className = "h-4 w-4") => {
    const IconComp = (LucideIcons as any)[iconName];
    if (IconComp) {
      return <IconComp className={className} />;
    }
    return <LinkIcon className={className} />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Website Category Drawer Link Manager"
        description="Add, edit, remove, and toggle custom shortcuts and promotional links visible in the storefront categories navigation drawer."
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
            <Button onClick={startCreate} className="bg-teal-600 hover:bg-teal-700 text-white shadow-xs">
              <Plus className="mr-2 h-4 w-4" /> Add Option
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Links" 
          value={stats.total.toString()} 
          subtitle="Configured options"
          icon={Sliders} 
          colorClass="indigo" 
        />
        <StatCard 
          title="Active Live Links" 
          value={stats.active.toString()} 
          subtitle="Visible to storefront"
          icon={Check} 
          colorClass="emerald" 
        />
        <StatCard 
          title="Trending Section" 
          value={stats.trending.toString()} 
          subtitle="Top promo sections"
          icon={Flame} 
          colorClass="amber" 
        />
        <StatCard 
          title="Help & Support" 
          value={stats.help.toString()} 
          subtitle="Customer guidelines"
          icon={HelpCircle} 
          colorClass="blue" 
        />
      </div>

      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-2">
          <Sliders className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Drawer Links ({filteredOptions.length})
          </h2>
        </div>

        <div className="relative min-w-[280px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search links..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-background"
          />
        </div>
      </div>

      {/* Content Rendering */}
      {filteredOptions.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl space-y-3 bg-muted/10">
          <Sliders className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-semibold">No drawer options found</h3>
          <p className="text-xs text-muted-foreground">Try clearing or adjusting your search query.</p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          {filteredOptions.map((opt) => (
            <Card key={opt.id} className="overflow-hidden border border-muted/80 shadow-xs flex flex-col bg-card/60">
              <CardHeader className="p-4 bg-muted/40 border-b border-muted/40 flex flex-row items-center justify-between space-y-0 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    {renderOptionIcon(opt.icon, "h-4.5 w-4.5")}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      {opt.label}
                    </CardTitle>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      Section: {opt.section}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Switch
                      checked={opt.active}
                      onCheckedChange={() => toggleActive(opt.id)}
                      className="scale-85"
                    />
                    <span className="text-xs font-semibold text-muted-foreground">
                      {opt.active ? "Active" : "Paused"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 border-l border-muted/40 pl-3 ml-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => startEdit(opt)}
                      title="Edit Option"
                    >
                      <Edit2 className="h-3.5 w-3.5 sm:mr-1.5 text-muted-foreground" />
                      <span className="text-xs hidden sm:inline font-medium">Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-destructive border-destructive/20 hover:bg-destructive/10"
                      onClick={() => deleteOption(opt.id)}
                      title="Delete Option"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:mr-1.5" />
                      <span className="text-xs hidden sm:inline font-medium">Delete</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-lg border border-muted/40">
                  <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{opt.url}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="border border-muted/80 rounded-xl overflow-hidden bg-card/60 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="p-4">Label & Icon</th>
                  <th className="p-4">Drawer Section</th>
                  <th className="p-4">Destination Link URL</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {filteredOptions.map((opt) => (
                  <tr key={opt.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          {renderOptionIcon(opt.icon, "h-3.5 w-3.5")}
                        </div>
                        <span>{opt.label}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground font-semibold uppercase tracking-wider">
                      {opt.section}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      <span className="font-mono">{opt.url}</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={opt.active}
                          onCheckedChange={() => toggleActive(opt.id)}
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
                          onClick={() => startEdit(opt)}
                          title="Edit Option"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => deleteOption(opt.id)}
                          title="Delete Option"
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

      {/* Form Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-muted/60">
          <div className="bg-gradient-to-r from-teal-500/15 via-teal-500/5 to-background p-6 border-b border-muted/40">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sliders className="h-5 w-5 text-teal-600" />
              {editingId ? "Edit Drawer Option" : "New Drawer Option"}
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-xs text-muted-foreground/80">
              Configure a promotional link shortcut or setting visible in the storefront categories navigation drawer.
            </DialogDescription>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Drawer Section</Label>
                <select
                  value={draftSection}
                  onChange={(e) => setDraftSection(e.target.value as any)}
                  className="w-full h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-background text-xs px-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="trending">Trending & Highlights</option>
                  <option value="help">Help & Settings</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Icon component</Label>
                <select
                  value={draftIcon}
                  onChange={(e) => setDraftIcon(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-background text-xs px-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Flame">Flame (Hot Deals)</option>
                  <option value="Award">Award (Bestsellers)</option>
                  <option value="Gift">Gift (Promos)</option>
                  <option value="HelpCircle">HelpCircle (Support)</option>
                  <option value="Sliders">Sliders (Settings)</option>
                  <option value="Link">Link (Generic)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="so-label" className="text-xs font-semibold">Link Label Title</Label>
              <Input
                id="so-label"
                placeholder="e.g. Today's Deals"
                value={draftLabel}
                onChange={(e) => setDraftLabel(e.target.value)}
                className="bg-muted/40 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="so-url" className="text-xs font-semibold">Destination URL / Link Path</Label>
              <Input
                id="so-url"
                placeholder="e.g. /products?category=All"
                value={draftUrl}
                onChange={(e) => setDraftUrl(e.target.value)}
                className="bg-muted/40 text-xs"
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
              <div className="space-y-0.5">
                <Label htmlFor="so-active" className="text-xs font-semibold">Active Status</Label>
                <p className="text-[10px] text-muted-foreground">Toggle options visibility in storefront drawer</p>
              </div>
              <Switch
                id="so-active"
                checked={draftActive}
                onCheckedChange={setDraftActive}
                className="scale-90"
              />
            </div>
          </div>

          <div className="p-4 border-t border-muted/40 bg-muted/10 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveOption} className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm font-semibold text-xs">
              <Check className="h-4 w-4 mr-1.5" /> {editingId ? "Save Changes" : "Publish Option"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
