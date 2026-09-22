"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CreditCard,
  ShieldCheck,
  Key,
  Eye,
  EyeOff,
  Zap,
  IndianRupee,
  RefreshCw,
  Smartphone,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, type PaymentGateway } from "@/lib/mock-data";
import { api } from "@/lib/api";

export type ExtendedGateway = PaymentGateway & {
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  merchantId?: string;
};

const providerIcons: Record<string, typeof CreditCard> = {
  razorpay: Zap,
  stripe: CreditCard,
  phonepe: Smartphone,
  paypal: Globe,
  cod: IndianRupee,
};

export default function PaymentsPage() {
  const [gateways, setGateways] = useState<ExtendedGateway[]>([]);

  useEffect(() => {
    api<{ items: Array<Record<string, unknown>> }>("/admin/payment-gateways")
      .then(({ items }) => setGateways(items.map(mapGateway)))
      .catch(() => toast.error("Unable to load payment gateways"));
  }, []);

  function mapGateway(gateway: Record<string, unknown>): ExtendedGateway {
    const cfg = (gateway.config as Record<string, string>) || {};
    return { id: String(gateway.id), name: String(gateway.name), provider: String(gateway.provider), enabled: Boolean(gateway.enabled), mode: gateway.mode === "live" ? "live" : "test", fees: String(gateway.fees || ""), transactions30d: 0, volume30d: 0, publishableKey: cfg.publishableKey || cfg.keyId || "", secretKey: cfg.secretKey ? "configured" : "", webhookSecret: cfg.webhookSecret ? "configured" : "", merchantId: cfg.merchantId || "" };
  }

  const [selectedGateway, setSelectedGateway] = useState<ExtendedGateway | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [keysForm, setKeysForm] = useState({
    publishableKey: "",
    secretKey: "",
    webhookSecret: "",
    merchantId: "",
    mode: "live" as "live" | "test",
  });
  const [showSecret, setShowSecret] = useState(false);
  const [testingPing, setTestingPing] = useState(false);

  const toggleEnable = async (id: string) => {
    const gateway = gateways.find((item) => item.id === id);
    if (!gateway) return;
    try {
      await api(`/admin/payment-gateways/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !gateway.enabled }),
      });
      setGateways((prev) =>
        prev.map((g) => {
          if (g.id === id) {
            const next = !g.enabled;
            toast.info(`${g.name} ${next ? "Enabled" : "Disabled"}`);
            return { ...g, enabled: next };
          }
          return g;
        })
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update gateway");
    }
  };

  const setMode = async (id: string, mode: "live" | "test") => {
    try {
      await api(`/admin/payment-gateways/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ mode }),
      });
      setGateways((prev) => prev.map((g) => (g.id === id ? { ...g, mode } : g)));
      toast.success(`Switched gateway to ${mode.toUpperCase()} mode`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update gateway");
    }
  };

  const handleOpenConfigure = (gw: ExtendedGateway) => {
    setSelectedGateway(gw);
    setKeysForm({
      publishableKey: gw.publishableKey || "",
      secretKey: "",
      webhookSecret: "",
      merchantId: gw.merchantId || "",
      mode: gw.mode,
    });
    setShowSecret(false);
    setOpenModal(true);
  };

  const handleSaveKeys = async () => {
    if (!selectedGateway) return;
    try {
      await api(`/admin/payment-gateways/${selectedGateway.id}`, {
        method: "PATCH",
        body: JSON.stringify({ mode: keysForm.mode, config: keysForm }),
      });
      setGateways((prev) =>
        prev.map((g) =>
          g.id === selectedGateway.id
            ? {
                ...g,
                publishableKey: keysForm.publishableKey,
                secretKey: keysForm.secretKey ? "configured" : "",
                webhookSecret: keysForm.webhookSecret ? "configured" : "",
                merchantId: keysForm.merchantId,
                mode: keysForm.mode,
              }
            : g
        )
      );
      setOpenModal(false);
      toast.success(`API Credentials Saved for ${selectedGateway.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save gateway credentials");
    }
  };

  const handleTestConnection = async () => {
    if (!selectedGateway) return;
    setTestingPing(true);
    try {
      await api(`/admin/payment-gateways/${selectedGateway.id}/verify`, {
        method: "POST",
        body: JSON.stringify({ publishableKey: keysForm.publishableKey, secretKey: keysForm.secretKey }),
      });
      toast.success("Provider credentials verified.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Provider verification failed");
    } finally {
      setTestingPing(false);
    }
  };

  const totalVolume = gateways.reduce((s, g) => s + g.volume30d, 0);
  const totalTxns = gateways.reduce((s, g) => s + g.transactions30d, 0);
  const activeCount = gateways.filter((g) => g.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-amber-500" /> Payment Gateways & API Configuration
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure payment providers, manage production API keys, switch sandbox modes, and view 30-day volume.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-emerald-500/20 text-xs px-3 py-1 gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> 256-Bit SSL Encrypted
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border shadow-xs">
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">30-Day Processed Volume</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-extrabold text-foreground">{formatCurrency(totalVolume)}</div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Across all gateways</p>
          </CardContent>
        </Card>
        <Card className="border shadow-xs">
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">30-Day Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-extrabold text-foreground">{totalTxns.toLocaleString()} Txns</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Successful checkouts</p>
          </CardContent>
        </Card>
        <Card className="border shadow-xs">
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Active Enabled Gateways</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-extrabold text-foreground">{activeCount} / {gateways.length}</div>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">Live on checkout page</p>
          </CardContent>
        </Card>
        <Card className="border shadow-xs">
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Overall Success Rate</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-extrabold text-foreground">99.4%</div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Optimal uptime</p>
          </CardContent>
        </Card>
      </div>

      {gateways.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading payment gateways...</div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {gateways.map((g) => {
          const IconComponent = providerIcons[g.provider] || CreditCard;
          return (
            <Card
              key={g.id}
              className={`border shadow-xs transition-all overflow-hidden flex flex-col justify-between ${
                !g.enabled ? "opacity-60 bg-muted/30" : "bg-card hover:border-amber-500/50 hover:shadow-md"
              }`}
            >
              <div>
                <CardHeader className="pb-3 border-b bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-extrabold text-foreground">{g.name}</CardTitle>
                        <CardDescription className="text-[11px]">Fees: {g.fees}</CardDescription>
                      </div>
                    </div>
                    <Switch checked={g.enabled} onCheckedChange={() => toggleEnable(g.id)} />
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={`text-[10px] font-bold ${g.enabled ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-slate-500/10 text-slate-600 border-slate-300"}`}>
                        {g.enabled ? "ENABLED" : "DISABLED"}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] font-mono font-bold uppercase ${g.mode === "live" ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : "bg-blue-500/10 text-blue-600 border-blue-500/30"}`}>
                        {g.mode} MODE
                      </Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">ID: {g.merchantId || "N/A"}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-2.5 rounded-xl bg-muted/40 border">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">30d Transactions</span>
                      <span className="font-extrabold text-foreground">{g.transactions30d.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">30d Total Volume</span>
                      <span className="font-extrabold text-amber-600 dark:text-amber-400">{formatCurrency(g.volume30d)}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border bg-slate-950 text-white space-y-1 font-mono text-[10px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Public Key:</span>
                      <span className="text-amber-400 truncate max-w-[150px]">
                        {g.publishableKey ? g.publishableKey : "Not Configured"}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Secret Key:</span>
                      <span className="text-slate-300">{g.secretKey ? "configured" : "Not Configured"}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant={g.mode === "test" ? "default" : "outline"} onClick={() => setMode(g.id, "test")} className="flex-1 text-xs font-bold h-8">
                      Sandbox Test
                    </Button>
                    <Button size="sm" variant={g.mode === "live" ? "default" : "outline"} onClick={() => setMode(g.id, "live")} className={`flex-1 text-xs font-bold h-8 ${g.mode === "live" ? "bg-amber-500 hover:bg-amber-400 text-slate-950" : ""}`}>
                      Production Live
                    </Button>
                  </div>
                </CardContent>
              </div>

              <CardFooter className="p-3 bg-muted/20 border-t">
                <Button onClick={() => handleOpenConfigure(g)} variant="outline" size="sm" className="w-full text-xs font-bold gap-1.5 h-9">
                  <Key className="h-3.5 w-3.5 text-amber-500" /> Update API Keys & Webhook
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle className="text-base font-extrabold flex items-center gap-2">
              <Key className="h-4 w-4 text-amber-500" /> API Keys & Credentials: {selectedGateway?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Enter your production or sandbox API keys. Secret keys are stored securely server-side and never returned to the browser.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Environment Mode</Label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setKeysForm({ ...keysForm, mode: "test" })} className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${keysForm.mode === "test" ? "bg-blue-600 text-white border-blue-600 shadow-xs" : "bg-muted/40 hover:bg-muted text-muted-foreground"}`}>
                  Sandbox / Test
                </button>
                <button type="button" onClick={() => setKeysForm({ ...keysForm, mode: "live" })} className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${keysForm.mode === "live" ? "bg-amber-500 text-slate-950 border-amber-500 shadow-xs" : "bg-muted/40 hover:bg-muted text-muted-foreground"}`}>
                  Production Live
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Merchant ID / Account ID</Label>
              <Input placeholder="e.g. rzp_mcht_88912" className="font-mono text-xs" value={keysForm.merchantId} onChange={(e) => setKeysForm({ ...keysForm, merchantId: e.target.value })} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">API Public / Publishable Key</Label>
              <Input placeholder="e.g. rzp_live_..." className="font-mono text-xs" value={keysForm.publishableKey} onChange={(e) => setKeysForm({ ...keysForm, publishableKey: e.target.value })} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">API Secret Key</Label>
              <div className="relative">
                <Input type={showSecret ? "text" : "password"} placeholder="Enter new secret key to update..." className="font-mono text-xs pr-10" value={keysForm.secretKey} onChange={(e) => setKeysForm({ ...keysForm, secretKey: e.target.value })} />
                <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Webhook Signing Secret</Label>
              <Input placeholder="Enter new webhook secret to update..." className="font-mono text-xs" value={keysForm.webhookSecret} onChange={(e) => setKeysForm({ ...keysForm, webhookSecret: e.target.value })} />
            </div>

            <div className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={handleTestConnection} disabled={testingPing} className="w-full text-xs font-bold gap-1.5 h-8">
                <RefreshCw className={`h-3.5 w-3.5 text-blue-500 ${testingPing ? "animate-spin" : ""}`} />
                {testingPing ? "Verifying Credentials..." : "Test Connection / Ping API"}
              </Button>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t gap-2">
            <Button variant="outline" onClick={() => setOpenModal(false)} className="text-xs font-semibold">Cancel</Button>
            <Button onClick={handleSaveKeys} className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs">Save API Keys</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
