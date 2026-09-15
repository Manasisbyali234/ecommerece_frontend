"use client";

import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export default function TermsAndConditionsPage() {
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
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Terms and Conditions</h1>
            <p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </div>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm space-y-6 leading-relaxed bg-card p-6 sm:p-8 rounded-2xl border shadow-2xs">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">1. Agreement to Terms</h2>
          <p className="text-muted-foreground">
            By accessing or placing an order through {brandName}, you agree to be bound by these Terms and Conditions, as well as our Privacy Policy, Return Policy, and Shipping Policy.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">2. Product Pricing & Specifications</h2>
          <p className="text-muted-foreground">
            All prices displayed on {brandName} are in Indian Rupees (INR) inclusive of applicable GST taxes. We reserve the right to correct pricing errors or modify product specs without prior notice.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">3. User Accounts & Responsibilities</h2>
          <p className="text-muted-foreground">
            Users are responsible for maintaining the confidentiality of their account credentials and password. Any order placed using your verified account details will be deemed authorized by you.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">4. Governing Law & Jurisdiction</h2>
          <p className="text-muted-foreground">
            These terms shall be governed by and construed in accordance with the laws of India. Any legal proceedings arising from transactions on {brandName} shall be subject to exclusive court jurisdiction.
          </p>
        </section>
      </div>
    </div>
  );
}
