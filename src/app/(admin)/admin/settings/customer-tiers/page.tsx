"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  ShoppingBag,
  IndianRupee,
  Layers,
  Truck,
  Headphones,
  Wallet,
  Check,
  ArrowLeft,
  Percent,
  Sliders,
  ShieldCheck,
  AlertCircle,
  Tag,
  ChevronRight,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { PageHeader } from "@/components/page-header";
import { formatCurrency } from "@/lib/mock-data";
import {
  useStore,
  store,
  type CustomerTier,
  type CustomerTierCategoryBenefit,
} from "@/lib/store";
import { toast } from "sonner";

// Preset Badge Color Themes
const COLOR_THEMES = [
  { label: "Platinum (Purple)", value: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  { label: "Gold (Amber)", value: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  { label: "Diamond (Blue)", value: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  { label: "Emerald (Green)", value: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  { label: "Standard (Slate)", value: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20" },
];

export default function CustomerTiersSettingsPage() {
  const customerTiers = useStore((s) => s.customerTiers);
  const categories = useStore((s) => s.categories);
  const subCategories = useStore((s) => s.subCategories);
  const orders = useStore((s) => s.orders);

  // Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [badgeColor, setBadgeColor] = useState(COLOR_THEMES[0].value);
  const [description, setDescription] = useState("");
  const [minOrders, setMinOrders] = useState<number>(0);
  const [minTotalSpent, setMinTotalSpent] = useState<number>(0);
  const [freeShipping, setFreeShipping] = useState(false);
  const [prioritySupport, setPrioritySupport] = useState(false);
  const [cashbackPercent, setCashbackPercent] = useState<number>(0);

  // Category Benefits Array
  const [categoryBenefits, setCategoryBenefits] = useState<CustomerTierCategoryBenefit[]>([]);

  // Unique list of product categories
  const categoryOptions = useMemo(() => {
    const set = new Set<string>(["All Categories", "Apparel", "Electronics", "Footwear", "Home", "Bags", "Audio"]);
    categories?.forEach((c) => c.name && set.add(c.name));
    return Array.from(set);
  }, [categories]);

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingTierId(null);
    setName("");
    setBadgeColor(COLOR_THEMES[0].value);
    setDescription("");
    setMinOrders(1);
    setMinTotalSpent(1000);
    setFreeShipping(false);
    setPrioritySupport(false);
    setCashbackPercent(0);
    setCategoryBenefits([
      { id: `b-${Date.now()}`, category: "All Categories", subCategory: "All Subcategories", discountPercent: 5 },
    ]);
    setOpenDialog(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (tier: CustomerTier) => {
    setEditingTierId(tier.id);
    setName(tier.name);
    setBadgeColor(tier.badgeColor || COLOR_THEMES[0].value);
    setDescription(tier.description || "");
    setMinOrders(tier.minOrders || 0);
    setMinTotalSpent(tier.minTotalSpent || 0);
    setFreeShipping(tier.freeShipping || false);
    setPrioritySupport(tier.prioritySupport || false);
    setCashbackPercent(tier.cashbackPercent || 0);
    setCategoryBenefits(tier.categoryBenefits ? [...tier.categoryBenefits] : []);
    setOpenDialog(true);
  };

  // Add a new Category Benefit row inside Form
  const handleAddBenefitRow = () => {
    setCategoryBenefits((prev) => [
      ...prev,
      {
        id: `b-${Date.now()}-${Math.random()}`,
        category: "All Categories",
        subCategory: "All Subcategories",
        discountPercent: 10,
      },
    ]);
  };

  // Remove a Category Benefit row
  const handleRemoveBenefitRow = (id: string) => {
    setCategoryBenefits((prev) => prev.filter((b) => b.id !== id));
  };

  // Save / Update Tier Handler
  const handleSaveTier = () => {
    if (!name.trim()) {
      toast.error("Tier Name is required");
      return;
    }

    if (editingTierId) {
      // Update existing tier
      store.updateCustomerTier(editingTierId, {
        name,
        badgeColor,
        description,
        minOrders: Number(minOrders) || 0,
        minTotalSpent: Number(minTotalSpent) || 0,
        categoryBenefits,
        freeShipping,
        prioritySupport,
        cashbackPercent: Number(cashbackPercent) || 0,
      });
      toast.success(`Customer Tier "${name}" updated successfully!`);
    } else {
      // Create new tier
      const newTier: CustomerTier = {
        id: `tier-${Date.now()}`,
        name,
        badgeColor,
        description,
        minOrders: Number(minOrders) || 0,
        minTotalSpent: Number(minTotalSpent) || 0,
        categoryBenefits,
        freeShipping,
        prioritySupport,
        cashbackPercent: Number(cashbackPercent) || 0,
      };
      store.addCustomerTier(newTier);
      toast.success(`Customer Tier "${name}" created successfully!`);
    }

    setOpenDialog(false);
  };

  // Delete Tier
  const handleDeleteTier = (id: string, tierName: string) => {
    if (confirm(`Are you sure you want to delete the "${tierName}" customer tier?`)) {
      store.removeCustomerTier(id);
      toast.success(`Tier "${tierName}" deleted`);
    }
  };

  // Calculate highest spend threshold
  const highestSpendThreshold = useMemo(() => {
    return Math.max(...customerTiers.map((t) => t.minTotalSpent || 0), 0);
  }, [customerTiers]);

  // Max discount across all benefits
  const maxDiscountPercent = useMemo(() => {
    let max = 0;
    customerTiers.forEach((t) => {
      t.categoryBenefits?.forEach((b) => {
        if (b.discountPercent > max) max = b.discountPercent;
      });
    });
    return max;
  }, [customerTiers]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/admin/customers" className="hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Customers Directory
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Master Settings</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Award className="h-6 w-6 text-purple-500" /> Customer Tiers &amp; Loyalty Rules
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage customer membership levels, category &amp; sub-category discount benefits, and auto-upgrade threshold rules.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/admin/customers">
            <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5 h-9">
              <ShoppingBag className="h-4 w-4" /> View Customers CRM
            </Button>
          </Link>

          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="text-xs font-bold gap-1.5 h-9 bg-purple-600 hover:bg-purple-500 text-white shadow-xs"
          >
            <Plus className="h-4 w-4" /> Create New Tier
          </Button>
        </div>
      </div>

      {/* Metric KPI Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Active Tiers
            </CardTitle>
            <div className="p-2 rounded-xl bg-purple-500/10">
              <Award className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{customerTiers.length} Tiers</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Automated loyalty progression</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              VIP Threshold
            </CardTitle>
            <div className="p-2 rounded-xl bg-amber-500/10">
              <IndianRupee className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">
              {formatCurrency(highestSpendThreshold)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Top-tier auto upgrade rule</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Max Category Discount
            </CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <Percent className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {maxDiscountPercent}% OFF
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Exclusive category perk</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Auto Upgrade Engine
            </CardTitle>
            <div className="p-2 rounded-xl bg-blue-500/10">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">Live Auto-Sync</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Recalculates on every order</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tier Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Sliders className="h-4 w-4 text-purple-500" /> Configured Tiers &amp; Benefit Rules
          </h2>
          <span className="text-xs text-muted-foreground">
            Tiers are evaluated dynamically based on lifetime spend &amp; order count.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {customerTiers.map((t) => (
            <Card key={t.id} className="border shadow-xs hover:border-purple-500/40 transition-all flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="p-5 border-b space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`text-xs font-extrabold uppercase px-2.5 py-0.5 ${t.badgeColor}`}>
                      {t.name}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(t)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        title="Edit Tier Rules"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {customerTiers.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTier(t.id, t.name)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                          title="Delete Tier"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t.description || "No description provided."}
                  </p>
                </div>

                {/* Upgrade Rules Section */}
                <div className="p-4 bg-muted/20 border-b space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-amber-500" /> Auto-Upgrade Rules
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-background border rounded-lg p-2 space-y-0.5">
                      <span className="text-[10px] text-muted-foreground block">Min. Orders</span>
                      <span className="font-extrabold text-foreground font-mono">
                        ≥ {t.minOrders} {t.minOrders === 1 ? "Order" : "Orders"}
                      </span>
                    </div>

                    <div className="bg-background border rounded-lg p-2 space-y-0.5">
                      <span className="text-[10px] text-muted-foreground block">Min. Total Spent</span>
                      <span className="font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                        ≥ {formatCurrency(t.minTotalSpent)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Category & Sub-Category Benefits */}
                <div className="p-4 space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block flex items-center gap-1.5">
                    <Tag className="h-3 w-3 text-purple-500" /> Category &amp; Sub-Category Discounts
                  </span>

                  <div className="space-y-1.5">
                    {t.categoryBenefits && t.categoryBenefits.length > 0 ? (
                      t.categoryBenefits.map((b) => (
                        <div key={b.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/40 border">
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="font-bold text-foreground truncate">{b.category}</span>
                            <span className="text-[10px] text-muted-foreground truncate">
                              Subcategory: <span className="font-medium text-foreground">{b.subCategory || "All"}</span>
                            </span>
                          </div>
                          <Badge variant="secondary" className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs px-2 py-0.5 shrink-0 bg-emerald-500/10 border-emerald-500/20">
                            {b.discountPercent}% OFF
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No category discounts configured.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tier Perks & Privilege Footer */}
              <div className="p-4 border-t bg-muted/10 space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Privileges &amp; Extras
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {t.freeShipping && (
                    <Badge variant="outline" className="text-[10px] font-semibold bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1">
                      <Truck className="h-3 w-3" /> Free Express Shipping
                    </Badge>
                  )}
                  {t.prioritySupport && (
                    <Badge variant="outline" className="text-[10px] font-semibold bg-purple-500/10 text-purple-600 border-purple-500/20 gap-1">
                      <Headphones className="h-3 w-3" /> 24/7 VIP Support
                    </Badge>
                  )}
                  {t.cashbackPercent > 0 && (
                    <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1">
                      <Wallet className="h-3 w-3" /> {t.cashbackPercent}% Wallet Cashback
                    </Badge>
                  )}
                  {!t.freeShipping && !t.prioritySupport && t.cashbackPercent === 0 && (
                    <span className="text-[11px] text-muted-foreground">Standard store perks only</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* CREATE / EDIT TIER MODAL DIALOG */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-xl p-0 overflow-hidden gap-0 rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-br from-purple-500/15 via-purple-500/5 to-background px-6 pt-6 pb-4 border-b border-border/50 pr-14">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground leading-tight">
                  {editingTierId ? "Edit Customer Tier Rules" : "Create New Customer Tier"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Configure upgrade requirements and category/sub-category discount privileges.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Form Body */}
          <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">

            {/* Tier Identity */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Award className="h-3 w-3" /> Tier Identity &amp; Theme
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="tier-name" className="text-xs font-semibold">
                    Tier Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="tier-name"
                    placeholder="e.g. Diamond Elite"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-sm h-9 bg-muted/40 border-border/70"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tier-badge" className="text-xs font-semibold">Badge Theme Style</Label>
                  <Select value={badgeColor} onValueChange={setBadgeColor}>
                    <SelectTrigger id="tier-badge" className="h-9 text-xs bg-muted/40 border-border/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_THEMES.map((theme) => (
                        <SelectItem key={theme.label} value={theme.value} className="text-xs">
                          {theme.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tier-desc" className="text-xs font-semibold">Tier Description</Label>
                <Textarea
                  id="tier-desc"
                  placeholder="Explain who qualifies for this tier and what benefits they enjoy..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="text-xs bg-muted/40 border-border/70 resize-none"
                />
              </div>
            </div>

            {/* Auto Upgrade Rules */}
            <div className="space-y-3 pt-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-amber-500" /> Auto-Upgrade Qualification Thresholds
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="min-orders" className="text-xs font-semibold">Min. Total Completed Orders</Label>
                  <div className="relative">
                    <ShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="min-orders"
                      type="number"
                      placeholder="e.g. 5"
                      value={minOrders}
                      onChange={(e) => setMinOrders(Number(e.target.value))}
                      className="pl-9 text-sm h-9 bg-muted/40 border-border/70 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="min-spent" className="text-xs font-semibold">Min. Lifetime Spend (₹)</Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">₹</span>
                    <Input
                      id="min-spent"
                      type="number"
                      placeholder="e.g. 10000"
                      value={minTotalSpent}
                      onChange={(e) => setMinTotalSpent(Number(e.target.value))}
                      className="pl-8 text-sm h-9 bg-muted/40 border-border/70 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Category & Sub-Category Benefits Rules */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Tag className="h-3 w-3 text-purple-500" /> Category &amp; Sub-Category Discount Benefits
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddBenefitRow}
                  className="h-7 text-[11px] font-bold gap-1 text-purple-600 dark:text-purple-400 border-purple-500/30"
                >
                  <Plus className="h-3 w-3" /> Add Discount Rule
                </Button>
              </div>

              <div className="space-y-3">
                {categoryBenefits.map((row, index) => (
                  <div key={row.id} className="p-3 rounded-xl border bg-muted/30 space-y-2 relative">
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground border-b pb-1.5">
                      <span>Benefit Rule #{index + 1}</span>
                      {categoryBenefits.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBenefitRow(row.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                      {/* Select Category */}
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium">Product Category</Label>
                        <Select
                          value={row.category}
                          onValueChange={(val) => {
                            setCategoryBenefits((prev) =>
                              prev.map((b) => (b.id === row.id ? { ...b, category: val } : b))
                            );
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categoryOptions.map((cat) => (
                              <SelectItem key={cat} value={cat} className="text-xs">
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Select Sub-Category */}
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium">Sub-Category</Label>
                        <Select
                          value={row.subCategory || "All Subcategories"}
                          onValueChange={(val) => {
                            setCategoryBenefits((prev) =>
                              prev.map((b) => (b.id === row.id ? { ...b, subCategory: val } : b))
                            );
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All Subcategories" className="text-xs font-bold">
                              All Subcategories
                            </SelectItem>
                            {subCategories
                              ?.filter((sc) => row.category === "All Categories" || sc.category === row.category)
                              .map((sc) => (
                                <SelectItem key={sc.id} value={sc.title} className="text-xs">
                                  {sc.title}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Discount % */}
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium">Discount (%)</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="e.g. 15"
                            value={row.discountPercent}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setCategoryBenefits((prev) =>
                                prev.map((b) => (b.id === row.id ? { ...b, discountPercent: val } : b))
                              );
                            }}
                            className="h-8 text-xs pr-7 bg-background font-mono"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Privileges & Perks */}
            <div className="space-y-3 pt-1 border-t">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 pt-1">
                <GiftIcon className="h-3 w-3 text-emerald-500" /> Member Privileges &amp; Wallet Rewards
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={freeShipping}
                    onChange={(e) => setFreeShipping(e.target.checked)}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                  />
                  <div className="text-xs">
                    <span className="font-bold block">Free Shipping</span>
                    <span className="text-[10px] text-muted-foreground">Waive delivery fee</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={prioritySupport}
                    onChange={(e) => setPrioritySupport(e.target.checked)}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                  />
                  <div className="text-xs">
                    <span className="font-bold block">VIP 24/7 Support</span>
                    <span className="text-[10px] text-muted-foreground">Priority desk access</span>
                  </div>
                </label>

                <div className="space-y-1">
                  <Label htmlFor="cashback-percent" className="text-[11px] font-semibold">Wallet Cashback %</Label>
                  <div className="relative">
                    <Input
                      id="cashback-percent"
                      type="number"
                      placeholder="e.g. 5"
                      value={cashbackPercent}
                      onChange={(e) => setCashbackPercent(Number(e.target.value))}
                      className="h-8 text-xs pr-7 bg-muted/40 border-border/70 font-mono"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border/40 bg-muted/20">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenDialog(false)}
              className="h-9 px-4 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveTier}
              className="h-9 px-5 text-xs font-bold gap-1.5 bg-purple-600 hover:bg-purple-500 text-white shadow-xs"
            >
              <Check className="h-3.5 w-3.5" />
              {editingTierId ? "Save Tier Changes" : "Create Customer Tier"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}
