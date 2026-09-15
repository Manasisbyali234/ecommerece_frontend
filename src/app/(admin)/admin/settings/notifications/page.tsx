"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Mail,
  Save,
  CheckCircle2,
  Truck,
  Package,
  PackageCheck,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Copy,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────

type EmailTemplate = {
  enabled: boolean;
  subject: string;
  preheader: string;
  body: string;
};

// ─── Defaults ──────────────────────────────────────────────────────────────

const defaultTemplates = {
  orderConfirmation: {
    enabled: true,
    subject: "Order Confirmed! 🎉 Your order {{order_id}} is being processed",
    preheader: "Thank you for shopping with us! Here's your order summary.",
    body: `Hi {{customer_name}},

Thank you for your order! We've received your payment and your order is now being prepared.

━━━━━━━━━━━━━━━━━━━━━━━
📦 ORDER SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━
Order ID:     {{order_id}}
Order Date:   {{order_date}}
Items:        {{items_count}} item(s)
Order Total:  ₹{{order_total}}
Payment:      {{payment_method}}

━━━━━━━━━━━━━━━━━━━━━━━
🚚 DELIVERY ADDRESS
━━━━━━━━━━━━━━━━━━━━━━━
{{delivery_address}}

Your order will be dispatched within 1–2 business days. You'll receive a shipping confirmation with tracking details once your order is on its way.

Need help? Reply to this email or contact us at support@store.local

Warm regards,
The Store Team`,
  } as EmailTemplate,

  outForDelivery: {
    enabled: true,
    subject: "🚚 Your order {{order_id}} is Out for Delivery!",
    preheader: "Your package is on its way — expect delivery today.",
    body: `Hi {{customer_name}},

Great news! Your order is out for delivery and will reach you today.

━━━━━━━━━━━━━━━━━━━━━━━
🚚 DELIVERY UPDATE
━━━━━━━━━━━━━━━━━━━━━━━
Order ID:       {{order_id}}
Carrier:        {{carrier_name}}
Tracking No.:   {{tracking_number}}
Expected By:    {{expected_delivery_time}}

━━━━━━━━━━━━━━━━━━━━━━━
📍 TRACK YOUR ORDER
━━━━━━━━━━━━━━━━━━━━━━━
{{tracking_link}}

Please ensure someone is available to receive the package. If you miss the delivery, our courier will attempt re-delivery the next business day.

For any concerns, contact us at support@store.local

Warm regards,
The Store Team`,
  } as EmailTemplate,

  delivered: {
    enabled: true,
    subject: "✅ Order {{order_id}} Delivered Successfully!",
    preheader: "Your package has been delivered. We hope you love it!",
    body: `Hi {{customer_name}},

We're happy to let you know that your order has been delivered successfully! 🎉

━━━━━━━━━━━━━━━━━━━━━━━
✅ DELIVERY CONFIRMED
━━━━━━━━━━━━━━━━━━━━━━━
Order ID:        {{order_id}}
Delivered On:    {{delivered_at}}
Received By:     {{receiver_name}}

We hope you're thrilled with your purchase! If you have a moment, we'd love to hear your feedback.

⭐ LEAVE A REVIEW
{{review_link}}

━━━━━━━━━━━━━━━━━━━━━━━
📦 NEED HELP?
━━━━━━━━━━━━━━━━━━━━━━━
If there are any issues with your order — damaged item, wrong product, or anything else — please contact us within 7 days of delivery.

Email:   support@store.local
Phone:   +91 98765 43210

Thank you for shopping with us. We look forward to serving you again!

Warm regards,
The Store Team`,
  } as EmailTemplate,
};

// ─── Variable Tag Pills ─────────────────────────────────────────────────────

const templateVariables: Record<string, string[]> = {
  orderConfirmation: [
    "{{customer_name}}",
    "{{order_id}}",
    "{{order_date}}",
    "{{order_total}}",
    "{{items_count}}",
    "{{payment_method}}",
    "{{delivery_address}}",
  ],
  outForDelivery: [
    "{{customer_name}}",
    "{{order_id}}",
    "{{carrier_name}}",
    "{{tracking_number}}",
    "{{expected_delivery_time}}",
    "{{tracking_link}}",
  ],
  delivered: [
    "{{customer_name}}",
    "{{order_id}}",
    "{{delivered_at}}",
    "{{receiver_name}}",
    "{{review_link}}",
  ],
};

// ─── Template Card Component ────────────────────────────────────────────────

function TemplateCard({
  id,
  icon: Icon,
  title,
  description,
  accentColor,
  template,
  variables,
  onChange,
}: {
  id: string;
  icon: any;
  title: string;
  description: string;
  accentColor: string;
  template: EmailTemplate;
  variables: string[];
  onChange: (patch: Partial<EmailTemplate>) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);

  const copyVariable = (v: string) => {
    navigator.clipboard.writeText(v);
    toast.success(`Copied ${v}`);
  };

  return (
    <Card className="border border-muted/70 shadow-xs overflow-hidden">
      {/* Header */}
      <CardHeader className="p-0">
        <div className={`bg-gradient-to-r ${accentColor} p-4 border-b border-muted/40`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-white">{title}</CardTitle>
                <CardDescription className="text-xs text-white/70 mt-0.5">{description}</CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white/80">
                  {template.enabled ? "Active" : "Paused"}
                </span>
                <Switch
                  checked={template.enabled}
                  onCheckedChange={(v) => onChange({ enabled: v })}
                  className="data-[state=checked]:bg-white/30"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white/80 hover:bg-white/10 hover:text-white"
                onClick={() => setExpanded((p) => !p)}
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Body */}
      {expanded && (
        <CardContent className="p-0">
          {/* Variable Tags */}
          <div className="px-5 pt-4 pb-3 border-b bg-muted/10">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> Available Template Variables
            </p>
            <div className="flex flex-wrap gap-1.5">
              {variables.map((v) => (
                <button
                  key={v}
                  onClick={() => copyVariable(v)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted border border-muted-foreground/20 text-[10px] font-mono text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                  title={`Click to copy ${v}`}
                >
                  <Copy className="h-2.5 w-2.5" />
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Subject */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Email Subject Line</Label>
              <Input
                id={`${id}-subject`}
                value={template.subject}
                onChange={(e) => onChange({ subject: e.target.value })}
                className="text-xs bg-muted/30 font-medium"
                placeholder="Enter email subject..."
              />
            </div>

            {/* Preheader */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">
                Preheader Text{" "}
                <span className="font-normal text-muted-foreground">(Shown in inbox preview)</span>
              </Label>
              <Input
                id={`${id}-preheader`}
                value={template.preheader}
                onChange={(e) => onChange({ preheader: e.target.value })}
                className="text-xs bg-muted/30"
                placeholder="Short preview text visible in inbox..."
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Email Body Template</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground gap-1.5"
                  onClick={() => setPreviewMode((p) => !p)}
                >
                  {previewMode ? (
                    <><EyeOff className="h-3.5 w-3.5" /> Edit</>
                  ) : (
                    <><Eye className="h-3.5 w-3.5" /> Preview</>
                  )}
                </Button>
              </div>

              {previewMode ? (
                <div className="bg-muted/20 border rounded-xl p-4 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-foreground min-h-[260px]">
                  {template.body}
                </div>
              ) : (
                <Textarea
                  id={`${id}-body`}
                  value={template.body}
                  onChange={(e) => onChange({ body: e.target.value })}
                  rows={14}
                  className="text-xs bg-muted/30 font-mono leading-relaxed resize-y"
                  placeholder="Write your email body template here..."
                />
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function NotificationSettingsPage() {
  const [globalEmailEnabled, setGlobalEmailEnabled] = useState(true);
  const [senderName, setSenderName] = useState("Store");
  const [senderEmail, setSenderEmail] = useState("noreply@store.local");
  const [replyTo, setReplyTo] = useState("support@store.local");

  const [templates, setTemplates] = useState(defaultTemplates);
  useEffect(() => { api<{ setting: { value: Record<string, unknown> } }>("/admin/settings/notifications").then(({ setting }) => { const v = setting.value; setGlobalEmailEnabled(v.globalEmailEnabled !== false); setSenderName(String(v.senderName || senderName)); setSenderEmail(String(v.senderEmail || senderEmail)); setReplyTo(String(v.replyTo || replyTo)); if (v.templates) setTemplates(v.templates as typeof defaultTemplates); }).catch(() => undefined); }, []);

  const patchTemplate = (key: keyof typeof templates, patch: Partial<EmailTemplate>) => {
    setTemplates((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
  };

  const handleSave = async () => {
    try { await api("/admin/settings/notifications", { method: "PUT", body: JSON.stringify({ globalEmailEnabled, senderName, senderEmail, replyTo, templates }) }); toast.success("Email Notification Templates Saved!", {
      description: "All 3 templates have been updated and will apply to future order emails.",
    }); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save notification templates"); }
  };

  const activeCount = Object.values(templates).filter((t) => t.enabled).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6 text-purple-500" /> Email Notifications
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage and customise transactional email templates sent to customers at each order milestone.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={globalEmailEnabled ? "default" : "secondary"}
            className="text-[11px] gap-1 py-1 px-2.5"
          >
            <CheckCircle2 className="h-3 w-3" />
            {activeCount} / {Object.keys(templates).length} Active
          </Badge>
          <Button
            onClick={handleSave}
            size="sm"
            className="text-xs font-bold gap-1.5 h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs"
          >
            <Save className="h-4 w-4" /> Save All Templates
          </Button>
        </div>
      </div>

      {/* Global Sender Settings */}
      <Card className="border border-muted/70 shadow-xs">
        <CardHeader className="border-b bg-muted/20 px-5 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-extrabold flex items-center gap-2">
              <Mail className="h-4 w-4 text-purple-500" /> Global Sender Settings
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-semibold">
                {globalEmailEnabled ? "Email Dispatch On" : "Email Dispatch Off"}
              </span>
              <Switch checked={globalEmailEnabled} onCheckedChange={setGlobalEmailEnabled} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Sender Name</Label>
              <Input
                id="sender-name"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="text-xs bg-muted/30"
                placeholder="e.g. Your Store Name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">From Email Address</Label>
              <Input
                id="sender-email"
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                className="text-xs bg-muted/30"
                placeholder="noreply@yourstore.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Reply-To Address</Label>
              <Input
                id="reply-to"
                type="email"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                className="text-xs bg-muted/30"
                placeholder="support@yourstore.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Cards */}
      <div className="space-y-5">
        <TemplateCard
          id="order-confirmation"
          icon={Package}
          title="Order Confirmation"
          description="Sent immediately after a customer successfully places an order."
          accentColor="from-violet-600 to-indigo-600"
          template={templates.orderConfirmation}
          variables={templateVariables.orderConfirmation}
          onChange={(patch) => patchTemplate("orderConfirmation", patch)}
        />

        <TemplateCard
          id="out-for-delivery"
          icon={Truck}
          title="Out for Delivery"
          description="Sent when the order is dispatched and on its way to the customer."
          accentColor="from-amber-500 to-orange-500"
          template={templates.outForDelivery}
          variables={templateVariables.outForDelivery}
          onChange={(patch) => patchTemplate("outForDelivery", patch)}
        />

        <TemplateCard
          id="delivered"
          icon={PackageCheck}
          title="Order Delivered"
          description="Sent once the order is confirmed as delivered, with a review request."
          accentColor="from-emerald-600 to-teal-600"
          template={templates.delivered}
          variables={templateVariables.delivered}
          onChange={(patch) => patchTemplate("delivered", patch)}
        />
      </div>

      {/* Save Footer */}
      <div className="border-t pt-4 flex justify-end gap-3">
        <Button
          variant="outline"
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => {
            setTemplates(defaultTemplates);
            toast.info("Templates reset to defaults.");
          }}
        >
          Reset to Defaults
        </Button>
        <Button
          onClick={handleSave}
          size="sm"
          className="text-xs font-bold gap-1.5 h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs"
        >
          <Save className="h-4 w-4" /> Save All Templates
        </Button>
      </div>
    </div>
  );
}
