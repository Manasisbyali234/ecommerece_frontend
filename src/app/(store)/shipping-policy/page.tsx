"use client";

import Link from "next/link";
import { Truck, ArrowLeft, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export default function ShippingPolicyPage() {
  const freeShippingText = useStore((s) => s.footerConfig?.freeShippingText || "On orders over ₹499");

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
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Shipping and Delivery Policy</h1>
            <p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </div>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm space-y-6 leading-relaxed bg-card p-6 sm:p-8 rounded-2xl border shadow-2xs">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> 1. Dispatch &amp; Delivery Timelines
          </h2>
          <p className="text-muted-foreground">
            All orders are processed and dispatched within 24 hours from our nearest fulfillment center. Standard delivery typically takes 2-5 business days depending on your pincode location.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">2. Free Shipping Threshold</h2>
          <p className="text-muted-foreground">
            We offer FREE express shipping across India — {freeShippingText}. A nominal shipping fee applies to orders below this threshold.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4 text-amber-500" /> 3. Real-Time Order Tracking
          </h2>
          <p className="text-muted-foreground">
            As soon as your order is dispatched, an SMS and email notification with an active AWB tracking link will be sent to your registered contact details.
          </p>
        </section>
      </div>
    </div>
  );
}
