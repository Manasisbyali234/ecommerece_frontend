"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Ticket,
  Plus,
  Trash2,
  Copy,
  Percent,
  IndianRupee,
  Gift,
  ShoppingCart,
  Search,
  LayoutGrid,
  List,
  Clock,
  Sparkles,
  Check,
  Tag,
  Download,
  Calendar,
  Layers,
  Zap,
  ArrowRight,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { useStore, store, type Coupon, type CouponType } from "@/lib/store";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = ["All", "Audio", "Bags", "Home", "Footwear", "Apparel", "Electronics"];

const typeMeta: Record<CouponType, { label: string; icon: typeof Percent; color: string; border: string }> = {
  percentage: { label: "Percentage OFF", icon: Percent, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", border: "border-blue-400" },
  fixed: { label: "Fixed Amount OFF", icon: IndianRupee, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", border: "border-emerald-400" },
  bogo: { label: "Buy 1 Get 1 (BOGO)", icon: Gift, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", border: "border-purple-400" },
  free_shipping: { label: "Free Shipping", icon: Ticket, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", border: "border-amber-400" },
};

export default function CouponsPage() {
  const coupons = useStore((s) => s.coupons);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Coupon | null>(null);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const [draft, setDraft] = useState<Omit<Coupon, "id" | "used">>({
    code: "",
    description: "",
    type: "percentage",
    value: 15,
    minSpend: 999,
    category: "All",
    usageLimit: 200,
    expires: "2026-12-31",
    active: true,
  });

  const filtered = useMemo(() => {
    return coupons.filter((c) => {
      const matchQ =
        !q ||
        c.code.toLowerCase().includes(q.toLowerCase()) ||
        c.description.toLowerCase().includes(q.toLowerCase());
      const matchT = typeFilter === "all" || c.type === typeFilter;
      return matchQ && matchT;
    });
  }, [coupons, q, typeFilter]);

  const stats = useMemo(() => {
    const active = coupons.filter((c) => c.active).length;
    const redemptions = coupons.reduce((s, c) => s + c.used, 0);
    const expiring = coupons.filter((c) => new Date(c.expires) < new Date("2026-09-01") && c.active).length;
    return { active, redemptions, expiring, total: coupons.length };
  }, [coupons]);

  const toggle = (id: string) => {
    const c = coupons.find((x) => x.id === id);
    if (c) store.updateCoupon(id, { active: !c.active });
  };

  const remove = (id: string) => {
    store.removeCoupon(id);
    toast.error("Coupon code deleted");
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied "${code}" to clipboard!`);
  };

  const openEdit = (c: Coupon) => {
    setEditTarget({ ...c });
    setEditOpen(true);
  };

  const saveEdit = () => {
    if (!editTarget) return;
    if (!editTarget.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }
    store.updateCoupon(editTarget.id, {
      code: editTarget.code.toUpperCase(),
      description: editTarget.description,
      type: editTarget.type,
      value: editTarget.value,
      minSpend: editTarget.minSpend,
      category: editTarget.category,
      usageLimit: editTarget.usageLimit,
      expires: editTarget.expires,
      active: editTarget.active,
    });
    setEditOpen(false);
    setEditTarget(null);
    toast.success("Coupon updated successfully!");
  };

  const create = () => {
    if (!draft.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }
    const id = `c${Date.now()}`;
    store.addCoupon({ ...draft, id, code: draft.code.toUpperCase(), used: 0 });
    setOpen(false);
    setDraft({ ...draft, code: "", description: "" });
    toast.success("Coupon rule published successfully!");
  };

  const formatValue = (c: Coupon) => {
    if (c.type === "percentage") return `${c.value}% OFF`;
    if (c.type === "fixed") return `₹${c.value} OFF`;
    if (c.type === "bogo") return "BOGO Free";
    return "Free Express Shipping";
  };

  const exportCouponsCsv = () => {
    const headers = ["Coupon Code", "Type", "Reward Value", "Description", "Min Spend", "Category", "Used", "Limit", "Expires", "Active"];
    const rows = filtered.map((c) => [
      c.code,
      c.type,
      formatValue(c),
      `"${c.description.replace(/"/g, '""')}"`,
      c.minSpend,
      c.category,
      c.used,
      c.usageLimit,
      c.expires,
      c.active ? "Yes" : "No",
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `coupons_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Coupons Exported to CSV!", {
      description: `Exported ${filtered.length} coupon rules.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Ticket className="h-6 w-6 text-amber-500" /> Coupons & Discount Rules
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Build promotional codes, cart thresholds, BOGO offers, and category-wide discounts.
          </p>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-lg p-6">
            <DialogHeader className="pb-3 border-b">
              <DialogTitle className="text-base font-extrabold flex items-center gap-2">
                <Pencil className="h-4 w-4 text-amber-500" /> Edit Coupon Rule
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update discount code conditions and checkout rewards.
              </DialogDescription>
            </DialogHeader>
            {editTarget && (
              <div className="grid gap-3 py-2 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Coupon Code *</Label>
                    <Input
                      placeholder="e.g. METRO500"
                      className="uppercase font-mono font-bold"
                      value={editTarget.code}
                      onChange={(e) => setEditTarget({ ...editTarget, code: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Discount Type</Label>
                    <Select
                      value={editTarget.type}
                      onValueChange={(v: CouponType) => setEditTarget({ ...editTarget, type: v })}
                    >
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage OFF (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount OFF (₹)</SelectItem>
                        <SelectItem value="bogo">Buy 1 Get 1 (BOGO)</SelectItem>
                        <SelectItem value="free_shipping">Free Shipping</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Promotion Description</Label>
                  <Input
                    placeholder="e.g. Flat ₹500 OFF on orders above ₹1,999"
                    value={editTarget.description}
                    onChange={(e) => setEditTarget({ ...editTarget, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Value (% or ₹)</Label>
                    <Input
                      type="number"
                      value={editTarget.value}
                      onChange={(e) => setEditTarget({ ...editTarget, value: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Min Cart Spend (₹)</Label>
                    <Input
                      type="number"
                      value={editTarget.minSpend}
                      onChange={(e) => setEditTarget({ ...editTarget, minSpend: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Usage Limit</Label>
                    <Input
                      type="number"
                      value={editTarget.usageLimit}
                      onChange={(e) => setEditTarget({ ...editTarget, usageLimit: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Category Restriction</Label>
                    <Select
                      value={editTarget.category}
                      onValueChange={(v) => setEditTarget({ ...editTarget, category: v })}
                    >
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Expiry Date</Label>
                    <Input
                      type="date"
                      value={editTarget.expires}
                      onChange={(e) => setEditTarget({ ...editTarget, expires: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl border p-3 bg-muted/20">
                  <div>
                    <div className="text-xs font-bold text-foreground">Active</div>
                    <div className="text-[11px] text-muted-foreground">Customers can apply code at checkout</div>
                  </div>
                  <Switch
                    checked={editTarget.active}
                    onCheckedChange={(v) => setEditTarget({ ...editTarget, active: v })}
                  />
                </div>
              </div>
            )}
            <DialogFooter className="pt-3 border-t gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)} className="text-xs font-semibold">
                Cancel
              </Button>
              <Button onClick={saveEdit} className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={exportCouponsCsv}
            size="sm"
            className="text-xs font-bold gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
          >
            <Download className="h-4 w-4 text-white" /> Export CSV
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="text-xs font-bold gap-1.5 h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs">
                <Plus className="h-4 w-4" /> Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg p-6">
              <DialogHeader className="pb-3 border-b">
                <DialogTitle className="text-base font-extrabold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" /> Create Promotional Coupon Rule
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Define discount code conditions and checkout rewards for customers.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-2 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="code" className="text-xs font-bold">Coupon Code *</Label>
                    <Input
                      id="code"
                      placeholder="e.g. METRO500"
                      className="uppercase font-mono font-bold"
                      value={draft.code}
                      onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Discount Type</Label>
                    <Select
                      value={draft.type}
                      onValueChange={(v: CouponType) => setDraft({ ...draft, type: v })}
                    >
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage OFF (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount OFF (₹)</SelectItem>
                        <SelectItem value="bogo">Buy 1 Get 1 (BOGO)</SelectItem>
                        <SelectItem value="free_shipping">Free Shipping</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="desc" className="text-xs font-bold">Promotion Description</Label>
                  <Input
                    id="desc"
                    placeholder="e.g. Flat ₹500 OFF on orders above ₹1,999"
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="value" className="text-xs font-bold">Value (% or ₹)</Label>
                    <Input
                      id="value"
                      type="number"
                      value={draft.value}
                      onChange={(e) => setDraft({ ...draft, value: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="min" className="text-xs font-bold">Min Cart Spend (₹)</Label>
                    <Input
                      id="min"
                      type="number"
                      value={draft.minSpend}
                      onChange={(e) => setDraft({ ...draft, minSpend: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="limit" className="text-xs font-bold">Usage Limit</Label>
                    <Input
                      id="limit"
                      type="number"
                      value={draft.usageLimit}
                      onChange={(e) => setDraft({ ...draft, usageLimit: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Category Restriction</Label>
                    <Select
                      value={draft.category}
                      onValueChange={(v) => setDraft({ ...draft, category: v })}
                    >
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="exp" className="text-xs font-bold">Expiry Date</Label>
                    <Input
                      id="exp"
                      type="date"
                      value={draft.expires}
                      onChange={(e) => setDraft({ ...draft, expires: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border p-3 bg-muted/20">
                  <div>
                    <div className="text-xs font-bold text-foreground">Activate Immediately</div>
                    <div className="text-[11px] text-muted-foreground">Customers can apply code at checkout right away</div>
                  </div>
                  <Switch
                    checked={draft.active}
                    onCheckedChange={(v) => setDraft({ ...draft, active: v })}
                  />
                </div>
              </div>
              <DialogFooter className="pt-3 border-t gap-2">
                <Button variant="outline" onClick={() => setOpen(false)} className="text-xs font-semibold">
                  Cancel
                </Button>
                <Button onClick={create} className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs">
                  Create Coupon
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Coupon Rules
            </CardTitle>
            <div className="p-2 rounded-xl bg-blue-500/10">
              <Ticket className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{stats.total}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Configured promo rules</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Active Promo Codes
            </CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <Zap className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{stats.active}</div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Live at checkout</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Redemptions
            </CardTitle>
            <div className="p-2 rounded-xl bg-purple-500/10">
              <Gift className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{stats.redemptions.toLocaleString()}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Customer redemptions</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Expiring Soon
            </CardTitle>
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{stats.expiring}</div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">Expires within 60d</p>
          </CardContent>
        </Card>
      </div>

      {/* Control Bar: Search + Type Filter + View Switcher */}
      <Card className="border shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by promo code or description..."
                className="pl-9 text-xs"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            {/* Filters & View Switcher */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px] text-xs h-9">
                  <SelectValue placeholder="All Discount Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="percentage">Percentage OFF</SelectItem>
                  <SelectItem value="fixed">Fixed Amount OFF</SelectItem>
                  <SelectItem value="bogo">BOGO Free</SelectItem>
                  <SelectItem value="free_shipping">Free Shipping</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle: Grid vs Table */}
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                    viewMode === "grid"
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Grid Ticket View"
                >
                  <LayoutGrid className="h-4 w-4" /> Grid
                </button>

                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                    viewMode === "table"
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Table View"
                >
                  <List className="h-4 w-4" /> Table
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GRID PROMO TICKET VIEW RENDERING */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const meta = typeMeta[c.type];
            const Icon = meta.icon;
            const usagePct = Math.min(100, (c.used / c.usageLimit) * 100);

            return (
              <Card
                key={c.id}
                className={`relative border-2 border-dashed shadow-xs transition-all overflow-hidden flex flex-col justify-between ${
                  !c.active ? "opacity-50 bg-muted/30 border-slate-300" : "bg-card hover:shadow-md"
                }`}
              >
                <div>
                  {/* Coupon Header Bar */}
                  <div className="p-4 pb-2 flex items-center justify-between border-b border-dashed">
                    <div className="flex items-center gap-2">
                      <code className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-extrabold text-sm border border-amber-500/30">
                        {c.code}
                      </code>
                      <button
                        onClick={() => copyCode(c.code)}
                        className="p-1 rounded text-slate-400 hover:text-foreground"
                        title="Copy Code"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <Badge variant="outline" className={`text-[10px] font-bold ${meta.color}`}>
                      <Icon className="mr-1 h-3 w-3" /> {meta.label}
                    </Badge>
                  </div>

                  {/* Reward & Description */}
                  <div className="p-4 space-y-3">
                    <div className="space-y-1">
                      <div className="text-xl font-extrabold text-foreground">{formatValue(c)}</div>
                      <p className="text-xs text-muted-foreground">{c.description}</p>
                    </div>

                    {/* Requirements / Conditions */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-lg bg-muted/30 border">
                      <div>
                        <span className="text-muted-foreground block">Min Spend</span>
                        <span className="font-mono font-bold text-foreground">₹{c.minSpend}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Category</span>
                        <span className="font-bold text-foreground">{c.category}</span>
                      </div>
                    </div>

                    {/* Usage Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">Redemptions</span>
                        <span className="font-mono font-bold text-foreground">
                          {c.used} / {c.usageLimit}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-300"
                          style={{ width: `${usagePct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ticket Footer Bar */}
                <div className="p-3 bg-muted/20 border-t flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> {c.expires}
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch checked={c.active} onCheckedChange={() => toggle(c.id)} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(c)}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-amber-300"
                      title="Edit Coupon"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(c.id)}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-rose-500"
                      title="Delete Coupon"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-card border rounded-2xl p-6">
              No discount rules match your search or filter.
            </div>
          )}
        </div>
      )}

      {/* TABLE VIEW RENDERING */}
      {viewMode === "table" && (
        <Card className="border shadow-xs">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Promo Code</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Reward</TableHead>
                  <TableHead className="text-xs">Conditions</TableHead>
                  <TableHead className="text-xs">Redemptions</TableHead>
                  <TableHead className="text-xs">Expiry Date</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const meta = typeMeta[c.type];
                  const Icon = meta.icon;
                  const usagePct = Math.min(100, (c.used / c.usageLimit) * 100);

                  return (
                    <TableRow key={c.id} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-0.5 rounded bg-muted font-mono font-bold text-xs text-foreground border">
                            {c.code}
                          </code>
                          <button
                            onClick={() => copyCode(c.code)}
                            className="text-muted-foreground hover:text-foreground"
                            title="Copy code"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{c.description}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] font-bold ${meta.color}`}>
                          <Icon className="mr-1 h-3 w-3" />
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-extrabold text-xs text-foreground">{formatValue(c)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div>Min ₹{c.minSpend}</div>
                        <div>{c.category === "All" ? "Any Category" : c.category}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-mono font-bold">
                          {c.used} / {c.usageLimit}
                        </div>
                        <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-amber-500" style={{ width: `${usagePct}%` }} />
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{c.expires}</TableCell>
                      <TableCell>
                        <Switch checked={c.active} onCheckedChange={() => toggle(c.id)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(c)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-amber-300"
                            title="Edit Coupon"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(c.id)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
