"use client";

import Link from "next/link";
import { Cookie, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export default function CookiePolicyPage() {
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
            <Cookie className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Cookie Policy</h1>
            <p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </div>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm space-y-6 leading-relaxed bg-card p-6 sm:p-8 rounded-2xl border shadow-2xs">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> 1. What Are Cookies?
          </h2>
          <p className="text-muted-foreground">
            Cookies are small text files placed on your device by websites you visit. They are widely used to make websites work efficiently, remember your shopping cart items, and provide analytical insights to website owners.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">2. Essential &amp; Analytical Cookies</h2>
          <p className="text-muted-foreground">
            {brandName} uses essential cookies required for basic store navigation, user account authentication, wishlist saving, and secure checkout processing. We also use aggregated analytical cookies to understand user engagement.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">3. Managing Cookie Preferences</h2>
          <p className="text-muted-foreground">
            You can control or disable cookies through your web browser settings. Please note that disabling essential cookies may impact store features such as adding items to cart or completing purchases.
          </p>
        </section>
      </div>
    </div>
  );
}
