"use client";

import Link from "next/link";
import { ShieldCheck, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export default function PrivacyPolicyPage() {
  const brandName = useStore((s) => s.footerConfig?.brandName || "Our Store");
  const supportEmail = useStore((s) => s.companyInvoiceSettings?.supportEmail || "support@store.com");

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
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Privacy Policy</h1>
            <p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </div>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm space-y-6 leading-relaxed bg-card p-6 sm:p-8 rounded-2xl border shadow-2xs">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-500" /> 1. Information We Collect
          </h2>
          <p className="text-muted-foreground">
            At {brandName}, we respect your privacy. When you browse, make a purchase, or create an account, we collect personal information such as your name, email address, shipping address, phone number, and payment details to fulfill your orders efficiently.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">2. How We Use Your Information</h2>
          <p className="text-muted-foreground">
            We use your collected information strictly to process transactions, manage customer accounts, deliver orders, send invoice confirmations, provide customer support, and inform you about order updates or store offers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">3. Payment Security & Data Protection</h2>
          <p className="text-muted-foreground">
            All credit card, debit card, UPI, and net banking transactions are processed through 256-bit SSL encrypted secure payment gateways. We do not store sensitive payment credentials or CVVs on our servers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">4. Cookies & Analytics</h2>
          <p className="text-muted-foreground">
            We use cookies to maintain your shopping cart state, keep you signed in, remember your preferences, and analyze website traffic to enhance your overall shopping experience.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">5. Contact Us</h2>
          <p className="text-muted-foreground">
            If you have questions regarding our Privacy Policy or data security practices, please contact our support team at <span className="font-semibold text-foreground">{supportEmail}</span>.
          </p>
        </section>
      </div>
    </div>
  );
}
