"use client";

import { useState, useEffect } from "react";
import {
  Truck,
  Save,
  PackageCheck,
  Wrench,
  Store,
  Zap,
  Clock,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function MasterShippingSettingsPage() {
  // ── Standard Shipping ────────────────────────────────────────────────────
  const [flatShippingFee, setFlatShippingFee] = useState("50");
  const [freeShippingMinSpend, setFreeShippingMinSpend] = useState("499");
  const [codEnabled, setCodEnabled] = useState(true);
  const [codFee, setCodFee] = useState("40");
  const [defaultCarrier, setDefaultCarrier] = useState("Delhivery");

  // ── Handling Charges ─────────────────────────────────────────────────────
  const [handlingEnabled, setHandlingEnabled] = useState(true);
  const [handlingType, setHandlingType] = useState<"flat" | "percent">("flat");
  const [handlingAmount, setHandlingAmount] = useState("49");
  const [handlingNote, setHandlingNote] = useState(
    "Applied to cover packing, labelling, and dispatch processing costs."
  );

  // ── Marketplace Fees ─────────────────────────────────────────────────────
  const [marketplaceEnabled, setMarketplaceEnabled] = useState(true);
  const [marketplaceFeeType, setMarketplaceFeeType] = useState<"flat" | "percent">("percent");
  const [marketplaceFeeAmount, setMarketplaceFeeAmount] = useState("2.5");
  const [marketplaceNote, setMarketplaceNote] = useState(
    "Platform commission fee charged on each successful transaction."
  );

  // ── Express Delivery ──────────────────────────────────────────────────────
  const [expressEnabled, setExpressEnabled] = useState(true);
  const [expressAmount, setExpressAmount] = useState("99");
  const [expressCutoff, setExpressCutoff] = useState("14:00");
  const [expressNote, setExpressNote] = useState(
    "Next-day delivery before 12 PM for orders placed before the cutoff time."
  );

  useEffect(() => {
    api<{ setting: { value: Record<string, unknown> } }>("/admin/settings/shipping")
      .then(({ setting }) => {
        const v = setting.value as Record<string, unknown>;
        if (v.flatShippingFee !== undefined) setFlatShippingFee(String(v.flatShippingFee));
        if (v.freeShippingMinSpend !== undefined) setFreeShippingMinSpend(String(v.freeShippingMinSpend));
        if (v.codEnabled !== undefined) setCodEnabled(Boolean(v.codEnabled));
        if (v.codFee !== undefined) setCodFee(String(v.codFee));
        if (v.defaultCarrier) setDefaultCarrier(String(v.defaultCarrier));
        if (v.handlingEnabled !== undefined) setHandlingEnabled(Boolean(v.handlingEnabled));
        if (v.handlingType) setHandlingType(v.handlingType as "flat" | "percent");
        if (v.handlingAmount !== undefined) setHandlingAmount(String(v.handlingAmount));
        if (v.handlingNote) setHandlingNote(String(v.handlingNote));
        if (v.marketplaceEnabled !== undefined) setMarketplaceEnabled(Boolean(v.marketplaceEnabled));
        if (v.marketplaceFeeType) setMarketplaceFeeType(v.marketplaceFeeType as "flat" | "percent");
        if (v.marketplaceFeeAmount !== undefined) setMarketplaceFeeAmount(String(v.marketplaceFeeAmount));
        if (v.marketplaceNote) setMarketplaceNote(String(v.marketplaceNote));
        if (v.expressEnabled !== undefined) setExpressEnabled(Boolean(v.expressEnabled));
        if (v.expressAmount !== undefined) setExpressAmount(String(v.expressAmount));
        if (v.expressCutoff) setExpressCutoff(String(v.expressCutoff));
        if (v.expressNote) setExpressNote(String(v.expressNote));
      })
      .catch(() => undefined);
  }, []);

  const handleSave = async () => {
    try {
      await api("/admin/settings/shipping", {
        method: "PUT",
        body: JSON.stringify({
          flatShippingFee: Number(flatShippingFee),
          freeShippingMinSpend: Number(freeShippingMinSpend),
          codEnabled,
          codFee: Number(codFee),
          defaultCarrier,
          handlingEnabled,
          handlingType,
          handlingAmount: Number(handlingAmount),
          handlingNote,
          marketplaceEnabled,
          marketplaceFeeType,
          marketplaceFeeAmount: Number(marketplaceFeeAmount),
          marketplaceNote,
          expressEnabled,
          expressAmount: Number(expressAmount),
          expressCutoff,
          expressNote,
        }),
      });
      toast.success("Shipping & Fulfillment Settings Saved!", {
        description: "All charge configurations have been updated successfully.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save shipping settings");
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Truck className="h-6 w-6 text-amber-500" /> Shipping & Fulfillment Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure delivery fees, free shipping thresholds, COD, handling, marketplace, and express delivery surcharges.
          </p>
        </div>
        <Button
          onClick={handleSave}
          size="sm"
          className="text-xs font-bold gap-1.5 h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs"
        >
          <Save className="h-4 w-4" /> Save All Settings
        </Button>
      </div>

      {/* ── Section 1: Base Shipping Rates ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Truck className="h-4 w-4 text-blue-500" />
          <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Base Shipping Rates</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Shipping Rates */}
          <Card className="border shadow-xs">
            <CardHeader className="border-b bg-muted/20 px-5 py-3">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-500" /> Shipping Rates & Free Threshold
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Standard Flat Fee (₹)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      value={flatShippingFee}
                      onChange={(e) => setFlatShippingFee(e.target.value)}
                      className="pl-7 text-xs bg-muted/30"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Free Shipping Min Spend (₹)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      value={freeShippingMinSpend}
                      onChange={(e) => setFreeShippingMinSpend(e.target.value)}
                      className="pl-7 text-xs bg-muted/30"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Default Courier Partner</Label>
                <Select value={defaultCarrier} onValueChange={setDefaultCarrier}>
                  <SelectTrigger className="h-9 text-xs bg-muted/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Delhivery">Delhivery Express</SelectItem>
                    <SelectItem value="BlueDart">BlueDart Air</SelectItem>
                    <SelectItem value="FedEx">FedEx Express</SelectItem>
                    <SelectItem value="DHL">DHL Express</SelectItem>
                    <SelectItem value="Ekart Express">Ekart Express</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* COD */}
          <Card className="border shadow-xs">
            <CardHeader className="border-b bg-muted/20 px-5 py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                  <PackageCheck className="h-4 w-4 text-amber-500" /> Cash on Delivery (COD)
                </CardTitle>
                <Switch checked={codEnabled} onCheckedChange={setCodEnabled} />
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {codEnabled && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">COD Handling Charge (₹)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      value={codFee}
                      onChange={(e) => setCodFee(e.target.value)}
                      className="pl-7 text-xs bg-muted/30"
                    />
                  </div>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                COD charge is added to the order total at checkout for Cash on Delivery orders.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Section 2: Additional Charges ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-violet-500" />
            <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Additional Charges</h2>
          </div>
          <p className="text-xs text-muted-foreground">Applied at checkout in addition to the base shipping fee</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Handling Charges */}
          <Card className="border border-muted/70 shadow-xs overflow-hidden">
            <CardHeader className="p-0">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-white/10">
                      <Wrench className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-white">Handling Charges</CardTitle>
                      <p className="text-[10px] text-white/70 mt-0.5">Packing & dispatch costs</p>
                    </div>
                  </div>
                  <Switch
                    checked={handlingEnabled}
                    onCheckedChange={setHandlingEnabled}
                    className="data-[state=checked]:bg-white/30"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Charge Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["flat", "percent"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setHandlingType(type)}
                      className={`h-8 rounded-lg text-xs font-semibold border transition-colors ${
                        handlingType === type
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-muted/30 text-muted-foreground border-muted-foreground/20 hover:border-indigo-400"
                      }`}
                    >
                      {type === "flat" ? "₹ Flat Fee" : "% Percentage"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">
                  {handlingType === "flat" ? "Amount (₹)" : "Percentage (%)"}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    {handlingType === "flat" ? "₹" : "%"}
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={handlingAmount}
                    onChange={(e) => setHandlingAmount(e.target.value)}
                    className="w-full pl-7 pr-3 h-9 rounded-lg border border-muted-foreground/20 bg-muted/30 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Internal Note</Label>
                <textarea
                  rows={2}
                  value={handlingNote}
                  onChange={(e) => setHandlingNote(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-muted-foreground/20 bg-muted/30 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                handlingEnabled
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                  : "bg-muted/30 text-muted-foreground"
              }`}>
                {handlingEnabled ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                {handlingEnabled ? "Applied at checkout" : "Currently disabled"}
              </div>
            </CardContent>
          </Card>

          {/* Marketplace Fees */}
          <Card className="border border-muted/70 shadow-xs overflow-hidden">
            <CardHeader className="p-0">
              <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-white/10">
                      <Store className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-white">Marketplace Fees</CardTitle>
                      <p className="text-[10px] text-white/70 mt-0.5">Platform commission per order</p>
                    </div>
                  </div>
                  <Switch
                    checked={marketplaceEnabled}
                    onCheckedChange={setMarketplaceEnabled}
                    className="data-[state=checked]:bg-white/30"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Fee Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["flat", "percent"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setMarketplaceFeeType(type)}
                      className={`h-8 rounded-lg text-xs font-semibold border transition-colors ${
                        marketplaceFeeType === type
                          ? "bg-violet-600 text-white border-violet-600"
                          : "bg-muted/30 text-muted-foreground border-muted-foreground/20 hover:border-violet-400"
                      }`}
                    >
                      {type === "flat" ? "₹ Flat Fee" : "% Percentage"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">
                  {marketplaceFeeType === "flat" ? "Fee Amount (₹)" : "Commission Rate (%)"}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    {marketplaceFeeType === "flat" ? "₹" : "%"}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={marketplaceFeeAmount}
                    onChange={(e) => setMarketplaceFeeAmount(e.target.value)}
                    className="w-full pl-7 pr-3 h-9 rounded-lg border border-muted-foreground/20 bg-muted/30 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Internal Note</Label>
                <textarea
                  rows={2}
                  value={marketplaceNote}
                  onChange={(e) => setMarketplaceNote(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-muted-foreground/20 bg-muted/30 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                marketplaceEnabled
                  ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400"
                  : "bg-muted/30 text-muted-foreground"
              }`}>
                {marketplaceEnabled ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                {marketplaceEnabled ? "Deducted from revenue" : "Currently disabled"}
              </div>
            </CardContent>
          </Card>

          {/* Express Delivery */}
          <Card className="border border-muted/70 shadow-xs overflow-hidden">
            <CardHeader className="p-0">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-white/10">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-white">Express Delivery</CardTitle>
                      <p className="text-[10px] text-white/70 mt-0.5">Same-day / next-day surcharge</p>
                    </div>
                  </div>
                  <Switch
                    checked={expressEnabled}
                    onCheckedChange={setExpressEnabled}
                    className="data-[state=checked]:bg-white/30"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Express Surcharge (₹)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={expressAmount}
                    onChange={(e) => setExpressAmount(e.target.value)}
                    className="w-full pl-7 pr-3 h-9 rounded-lg border border-muted-foreground/20 bg-muted/30 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Order Cutoff Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="time"
                    value={expressCutoff}
                    onChange={(e) => setExpressCutoff(e.target.value)}
                    className="w-full pl-9 pr-3 h-9 rounded-lg border border-muted-foreground/20 bg-muted/30 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Orders after this time dispatch next business day.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Internal Note</Label>
                <textarea
                  rows={2}
                  value={expressNote}
                  onChange={(e) => setExpressNote(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-muted-foreground/20 bg-muted/30 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                expressEnabled
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                  : "bg-muted/30 text-muted-foreground"
              }`}>
                {expressEnabled ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                {expressEnabled ? `Active — cutoff at ${expressCutoff}` : "Currently disabled"}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ── Footer Save ── */}
      <div className="border-t pt-4 flex justify-end">
        <Button
          onClick={handleSave}
          size="sm"
          className="text-xs font-bold gap-1.5 h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs"
        >
          <Save className="h-4 w-4" /> Save All Settings
        </Button>
      </div>
    </div>
  );
}
