"use client";

import { useEffect, useState } from "react";
import {
  Store,
  Save,
  Globe,
  DollarSign,
  Clock,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Bell,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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

export default function GeneralSettingsPage() {
  const [storeName, setStoreName] = useState("Store");
  const [tagline, setTagline] = useState("India's Premier Online Fashion & Lifestyle Hub");
  const [currency, setCurrency] = useState("INR");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [supportEmail, setSupportEmail] = useState("support@store.local");
  const [supportPhone, setSupportPhone] = useState("+91 80 4912 3400");
  
  // Toggles
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoConfirmOrders, setAutoConfirmOrders] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState("5");

  useEffect(() => { api<{ setting: { value: Record<string, unknown> } }>("/admin/settings/general").then(({ setting }) => { const v = setting.value; setStoreName(String(v.storeName || storeName)); setTagline(String(v.tagline || tagline)); setCurrency(String(v.currency || currency)); setTimezone(String(v.timezone || timezone)); setSupportEmail(String(v.supportEmail || supportEmail)); setSupportPhone(String(v.supportPhone || supportPhone)); setMaintenanceMode(Boolean(v.maintenanceMode)); setAutoConfirmOrders(v.autoConfirmOrders !== false); setLowStockAlerts(v.lowStockAlerts !== false); setLowStockThreshold(String(v.lowStockThreshold || lowStockThreshold)); }).catch(() => undefined); }, []);

  const handleSave = async () => {
    try { await api("/admin/settings/general", { method: "PUT", body: JSON.stringify({ storeName, tagline, currency, timezone, supportEmail, supportPhone, maintenanceMode, autoConfirmOrders, lowStockAlerts, lowStockThreshold }) }); toast.success("General Store Settings Updated Successfully!", {
      description: "Changes applied across all website storefront components.",
    }); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save settings"); }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Store className="h-6 w-6 text-amber-500" /> General Website & Store Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage global store branding, localization, inventory alerts, and maintenance mode status.
          </p>
        </div>

        <Button
          onClick={handleSave}
          size="sm"
          className="text-xs font-bold gap-1.5 h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs"
        >
          <Save className="h-4 w-4" /> Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border shadow-xs">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" /> Store Branding & Localization
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Website Store Name *</Label>
                <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Store Tagline / Slogan</Label>
                <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Store Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹) - Indian Rupee</SelectItem>
                      <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                      <SelectItem value="AED">AED (د.إ) - UAE Dirham</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</SelectItem>
                      <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Customer Support Email</Label>
                  <Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Support Helpline Phone</Label>
                  <Input value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Automation & Inventory Settings */}
          <Card className="border shadow-xs">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <Package className="h-4 w-4 text-emerald-500" /> Order & Inventory Automation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
                <div>
                  <div className="font-bold text-foreground">Auto-Confirm Incoming Orders</div>
                  <div className="text-[11px] text-muted-foreground">Automatically mark newly placed prepaid orders as Processing.</div>
                </div>
                <Switch checked={autoConfirmOrders} onCheckedChange={setAutoConfirmOrders} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
                <div>
                  <div className="font-bold text-foreground">Low Stock Inventory Alerts</div>
                  <div className="text-[11px] text-muted-foreground">Notify store admins when stock drops below threshold.</div>
                </div>
                <Switch checked={lowStockAlerts} onCheckedChange={setLowStockAlerts} />
              </div>

              {lowStockAlerts && (
                <div className="space-y-1 pl-2">
                  <Label className="text-xs font-bold">Low Stock Warning Threshold (Units)</Label>
                  <Input
                    type="number"
                    value={lowStockThreshold}
                    className="w-36 text-xs"
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Maintenance Mode Card */}
        <div className="space-y-6">
          <Card className="border shadow-xs border-rose-500/30">
            <CardHeader className="border-b bg-rose-500/10">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="h-4 w-4" /> Store Maintenance Mode
              </CardTitle>
              <CardDescription className="text-xs">
                Temporarily pause customer checkout & display a maintenance page.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl border bg-background">
                <div>
                  <div className="font-bold text-foreground">Enable Maintenance Mode</div>
                  <div className="text-[11px] text-muted-foreground">Admin panel remains accessible.</div>
                </div>
                <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
              </div>

              {maintenanceMode && (
                <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold text-xs">
                  ⚠️ Storefront is currently offline for shoppers!
                </div>
              )}
            </CardContent>
            <CardFooter className="p-4 border-t bg-muted/20 flex justify-end">
              <Button onClick={handleSave} size="sm" className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950">
                Save General Settings
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
