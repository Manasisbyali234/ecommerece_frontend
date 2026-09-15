"use client";

import Link from "next/link";
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CancellationPolicyPage() {
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
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Cancellation Policy</h1>
            <p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </div>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm space-y-6 leading-relaxed bg-card p-6 sm:p-8 rounded-2xl border shadow-2xs">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">1. Order Cancellation Before Shipment</h2>
          <p className="text-muted-foreground">
            You can cancel any placed order free of charge before it leaves our dispatch warehouse. To cancel an order, navigate to <span className="font-semibold text-foreground">My Account &amp; Orders</span> or contact support immediately.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">2. Instant Refund for Prepaid Orders</h2>
          <p className="text-muted-foreground">
            If a prepaid order is cancelled prior to shipment, 100% of the transaction amount will be automatically refunded immediately back to your original source account.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">3. Cancellation After Shipment</h2>
          <p className="text-muted-foreground">
            Orders that have already been shipped and handed over to courier partners cannot be cancelled mid-transit. You can refuse delivery upon arrival, and a refund will be processed once the package returns to our hub.
          </p>
        </section>
      </div>
    </div>
  );
}
