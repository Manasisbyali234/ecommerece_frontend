"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Building,
  IndianRupee,
  Save,
  Sparkles,
  ShieldCheck,
  Printer,
  Mail,
  Download,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { store, useStore, type CompanyInvoiceSettings } from "@/lib/store";

export default function MasterInvoiceSettingsPage() {
  const companySettings = useStore((s) => s.companyInvoiceSettings);

  const [settingsForm, setSettingsForm] = useState<CompanyInvoiceSettings>({
    ...companySettings,
  });

  useEffect(() => {
    setSettingsForm({ ...companySettings });
  }, [companySettings]);

  const handleSaveMasterSettings = () => {
    store.updateCompanyInvoiceSettings(settingsForm);
    toast.success("Master Invoice Settings & Company Tax Variables Saved!", {
      description: "Updated GSTIN, CIN, Address, and tax rules live on all invoices.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Sliders className="h-6 w-6 text-amber-500" /> Master Invoice Settings & Tax Variables
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure company legal entity name, GSTIN number, CIN code, registered office address, and tax rules applied to every PDF invoice.
          </p>
        </div>

        <Button
          onClick={handleSaveMasterSettings}
          size="sm"
          className="text-xs font-bold gap-1.5 h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs"
        >
          <Save className="h-4 w-4" /> Save Master Settings
        </Button>
      </div>

      {/* Main Settings Card */}
      <Card className="border shadow-xs">
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Form Controls */}
            <div className="space-y-4 text-xs">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b pb-2">
                <Building className="h-4 w-4 text-amber-500" /> Company Legal Entity
              </h3>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Registered Company Name *</Label>
                <Input
                  value={settingsForm.companyName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, companyName: e.target.value })}
                  placeholder="e.g. E-Commerce Pvt. Ltd."
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Storefront Brand Tagline</Label>
                <Input
                  value={settingsForm.tagline}
                  onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                  placeholder="e.g. Your Store Name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">GSTIN Tax Registration *</Label>
                  <Input
                    value={settingsForm.gstin}
                    className="font-mono uppercase font-bold"
                    onChange={(e) => setSettingsForm({ ...settingsForm, gstin: e.target.value })}
                    placeholder="29ABCDE1234F1Z5"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Corporate Identity (CIN) *</Label>
                  <Input
                    value={settingsForm.cin}
                    className="font-mono uppercase font-bold"
                    onChange={(e) => setSettingsForm({ ...settingsForm, cin: e.target.value })}
                    placeholder="U72900KA2026PTC109283"
                  />
                </div>
              </div>

              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b pb-2 pt-2">
                <Building className="h-4 w-4 text-blue-500" /> Registered Office Address & Support Contact
              </h3>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Street Address</Label>
                <Input
                  value={settingsForm.address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  placeholder="102 Metro Residency, MG Road, Indiranagar"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">City, State & Pincode</Label>
                <Input
                  value={settingsForm.cityStatePincode}
                  onChange={(e) => setSettingsForm({ ...settingsForm, cityStatePincode: e.target.value })}
                  placeholder="Bengaluru, Karnataka - 560038"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Support Email</Label>
                  <Input
                    value={settingsForm.supportEmail}
                    onChange={(e) => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })}
                    placeholder="billing@store.local"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Support Phone</Label>
                  <Input
                    value={settingsForm.supportPhone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, supportPhone: e.target.value })}
                    placeholder="+91 80 4912 3400"
                  />
                </div>
              </div>

              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b pb-2 pt-2">
                <IndianRupee className="h-4 w-4 text-emerald-500" /> Tax Rules & Legal Disclaimers
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Default GST Tax Rate (%)</Label>
                  <Input
                    type="number"
                    value={settingsForm.gstTaxRatePercent}
                    onChange={(e) => setSettingsForm({ ...settingsForm, gstTaxRatePercent: Number(e.target.value) })}
                    placeholder="18"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Place of Supply Code</Label>
                  <Input
                    value={settingsForm.placeOfSupply}
                    onChange={(e) => setSettingsForm({ ...settingsForm, placeOfSupply: e.target.value })}
                    placeholder="Karnataka (29)"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Invoice Terms & Legal Note</Label>
                <Textarea
                  rows={3}
                  value={settingsForm.legalTerms}
                  onChange={(e) => setSettingsForm({ ...settingsForm, legalTerms: e.target.value })}
                  placeholder="E. & O.E. Subject to Jurisdiction..."
                />
              </div>
            </div>

            {/* Right Column: Live Tax Invoice Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-amber-500" /> Real-time Tax Invoice Preview
                </h3>
                <Badge variant="outline" className="text-[10px] font-bold bg-amber-500/10 text-amber-600">
                  LIVE RENDERING
                </Badge>
              </div>

              {/* Simulated Invoice Card */}
              <div className="p-5 rounded-2xl border-2 bg-card space-y-4 text-xs shadow-sm font-sans">
                <div className="flex justify-between items-start border-b pb-3">
                  <div>
                    <div className="font-extrabold text-sm text-foreground">{settingsForm.companyName || "Company Name"}</div>
                    <div className="text-[11px] text-muted-foreground">{settingsForm.tagline}</div>
                    <div className="text-[11px] text-muted-foreground">{settingsForm.address}, {settingsForm.cityStatePincode}</div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-1">
                      GSTIN: <span className="font-bold text-foreground">{settingsForm.gstin || "N/A"}</span> • CIN: {settingsForm.cin || "N/A"}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-amber-500 text-slate-950 font-extrabold text-[10px]">TAX INVOICE</Badge>
                    <div className="font-mono font-bold mt-1 text-foreground">INV-2026-0001</div>
                    <div className="text-[10px] text-muted-foreground">GST Rate: {settingsForm.gstTaxRatePercent}%</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-muted/30 border text-[11px] space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Place of Supply</span><span className="font-bold">{settingsForm.placeOfSupply}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Support Contact</span><span className="font-mono">{settingsForm.supportEmail}</span></div>
                </div>

                <div className="border rounded-lg p-2.5 bg-muted/10 space-y-1.5">
                  <div className="font-bold text-[11px] text-foreground">Aurora Wireless Headphones (Sample Item)</div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Qty: 1 × ₹3,126</span>
                    <span className="font-bold font-mono">₹3,689.00</span>
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground italic border-t pt-2">
                  {settingsForm.legalTerms}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 border-t bg-muted/20 flex justify-end">
          <Button
            onClick={handleSaveMasterSettings}
            size="sm"
            className="text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs"
          >
            <Save className="h-4 w-4" /> Save Master Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
