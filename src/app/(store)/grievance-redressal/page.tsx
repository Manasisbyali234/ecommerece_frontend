"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft, Mail, Phone, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";

export default function GrievanceRedressalPage() {
  const settings = useStore((s) => s.companyInvoiceSettings);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-3">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Store
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Grievance Redressal Mechanism</h1>
            <p className="text-xs text-muted-foreground">In accordance with Information Technology Act &amp; Consumer Protection Rules</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border shadow-2xs">
          <CardContent className="p-6 sm:p-8 space-y-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Designated Grievance Officer Details
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              If you have any unresolved complaints, grievances, or queries regarding product quality, shipping delays, or payment refunds, you may directly escalate your issue to our appointed Grievance Officer.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t text-xs">
              <div className="p-3.5 rounded-xl bg-muted/20 border space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Company</span>
                <span className="font-bold text-foreground block text-sm">{settings.companyName}</span>
                <span className="text-muted-foreground block text-[11px]">Customer Escalations Department</span>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/20 border space-y-2">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <Mail className="h-4 w-4 text-primary" /> {settings.supportEmail}
                </div>
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <Phone className="h-4 w-4 text-emerald-500" /> {settings.supportPhone}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground pt-2">
              <MapPin className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">Official Escalation Address:</strong> {settings.companyName}, {settings.address}, {settings.cityStatePincode}.
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="bg-card p-6 sm:p-8 rounded-2xl border shadow-2xs space-y-4 text-xs sm:text-sm">
          <h3 className="font-bold text-foreground text-sm">Resolution Process &amp; SLA Timelines:</h3>
          <ul className="space-y-2.5 text-muted-foreground text-xs list-disc pl-5">
            <li><strong className="text-foreground">Acknowledgement SLA:</strong> Every registered grievance email will receive a unique ticket reference ID within 24 hours.</li>
            <li><strong className="text-foreground">Resolution SLA:</strong> Complete investigation and resolution will be provided within a maximum of 15 business days.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
