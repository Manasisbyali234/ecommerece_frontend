"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  Search,
  Save,
  CheckCircle2,
  Code,
  Image as ImageIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function SeoSettingsPage() {
  const [metaTitle, setMetaTitle] = useState(" Store — India's Premier Online Fashion & Lifestyle Destination");
  const [metaDescription, setMetaDescription] = useState("Shop online for high-fidelity audio, designer apparel, Italian leather bags, and electronics at unbeatable prices with fast nationwide shipping.");
  const [ogImageUrl, setOgImageUrl] = useState("https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=1200");
  const [gaId, setGaId] = useState("G-9981230491");
  const [fbPixelId, setFbPixelId] = useState("102938475619283");

  useEffect(() => { api<{ setting: { value: Record<string, unknown> } }>("/admin/settings/seo").then(({ setting }) => { const v = setting.value; if (v.metaTitle) setMetaTitle(String(v.metaTitle)); if (v.metaDescription) setMetaDescription(String(v.metaDescription)); if (v.ogImageUrl) setOgImageUrl(String(v.ogImageUrl)); if (v.gaId) setGaId(String(v.gaId)); if (v.fbPixelId) setFbPixelId(String(v.fbPixelId)); }).catch(() => undefined); }, []);

  const handleSave = async () => {
    try { await api("/admin/settings/seo", { method: "PUT", body: JSON.stringify({ metaTitle, metaDescription, ogImageUrl, gaId, fbPixelId }) }); toast.success("SEO Meta Tags & Tracking Pixels Saved!", {
      description: "Search engines and analytics scripts will consume updated values.",
    }); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save SEO settings"); }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Search className="h-6 w-6 text-amber-500" /> SEO & Analytics Pixel Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure global meta titles, meta descriptions, Open Graph preview images, Google Analytics & Meta Pixel IDs.
          </p>
        </div>

        <Button
          onClick={handleSave}
          size="sm"
          className="text-xs font-bold gap-1.5 h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs"
        >
          <Save className="h-4 w-4" /> Save SEO Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search Engine Meta Tags Card */}
        <Card className="border shadow-xs">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-sm font-extrabold flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" /> Global Search Engine Metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Default Page Meta Title *</Label>
              <Input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Meta Description</Label>
              <Textarea
                rows={3}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Open Graph Preview Banner Image URL</Label>
              <Input
                value={ogImageUrl}
                onChange={(e) => setOgImageUrl(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Analytics & Tracking Pixels Card */}
        <Card className="border shadow-xs">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-sm font-extrabold flex items-center gap-2">
              <Code className="h-4 w-4 text-emerald-500" /> Analytics & Tracking Pixels
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Google Analytics 4 Measurement ID (GA4)</Label>
              <Input
                placeholder="e.g. G-XXXXXXXXXX"
                className="font-mono text-xs"
                value={gaId}
                onChange={(e) => setGaId(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Meta (Facebook) Pixel ID</Label>
              <Input
                placeholder="e.g. 102938475619283"
                className="font-mono text-xs"
                value={fbPixelId}
                onChange={(e) => setFbPixelId(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="p-4 border-t bg-muted/20 flex justify-end">
            <Button onClick={handleSave} size="sm" className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950">
              Save SEO Settings
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
