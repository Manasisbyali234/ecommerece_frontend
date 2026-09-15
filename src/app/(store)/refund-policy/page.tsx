"use client";

import Link from "next/link";
import { RefreshCw, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export default function RefundPolicyPage() {
  const brandName = useStore((s) => s.footerConfig?.brandName || "Our Store");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-3">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Store
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Return and Refund Policy</h1>
            <p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </div>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm space-y-6 leading-relaxed bg-card p-6 sm:p-8 rounded-2xl border shadow-2xs">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 1. 30-Day Hassle-Free Return Window
          </h2>
          <p className="text-muted-foreground">
            We want you to love your purchase! Products purchased from {brandName} are eligible for return or replacement within 30 calendar days from the date of delivery.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">2. Return Eligibility Criteria</h2>
          <p className="text-muted-foreground">
            Items must be unused, in their original retail packaging with all original seals, accessories, manual books, and purchase invoice intact.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">3. Refund Processing Timeline</h2>
          <p className="text-muted-foreground">
            Once your returned item is received and quality-checked at our warehouse, refunds will be initiated within 2-4 business days back to your original payment method (UPI, Bank Account, or Credit/Debit Card).
          </p>
        </section>
      </div>
    </div>
  );
}
