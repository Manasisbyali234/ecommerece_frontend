"use client";

import Link from "next/link";
import { HelpCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { useStore } from "@/lib/store";

export default function FAQPage() {
  const freeShippingText = useStore((s) => s.footerConfig?.freeShippingText || "on orders over ₹499");

  const faqs = [
    {
      q: "How do I track my order status?",
      a: "Once your order is dispatched, you can track it live by visiting 'My Account & Orders' or by clicking the tracking AWB link sent to your SMS and email.",
    },
    {
      q: "What payment methods are supported?",
      a: "We support Credit/Debit Cards (Visa, MasterCard, RuPay), UPI (Google Pay, PhonePe, Paytm), Net Banking, and Cash on Delivery (COD).",
    },
    {
      q: "What is your return and refund policy?",
      a: "We offer a 30-day hassle-free return window for unused products in original retail packaging. Refunds are processed back to your source account within 2-4 business days.",
    },
    {
      q: "Is shipping free on eligible orders?",
      a: `Yes! All orders qualify for 100% FREE express courier shipping — ${freeShippingText}.`,
    },
    {
      q: "How can I apply discount coupon codes?",
      a: "During checkout or in your shopping cart drawer, enter your coupon code in the promo box and click Apply.",
    },
    {
      q: "How do I download tax invoice PDFs?",
      a: "Visit 'My Account & Orders', select any completed order, and click 'Download Official Invoice PDF'.",
    },
  ];

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
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Frequently Asked Questions (FAQ)</h1>
            <p className="text-xs text-muted-foreground">Find quick answers to common questions about orders, payments, and shipping</p>
          </div>
        </div>
      </div>

      <div className="bg-card p-6 sm:p-8 rounded-2xl border shadow-2xs space-y-4">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((item, idx) => (
            <AccordionItem key={idx} value={`faq-${idx}`}>
              <AccordionTrigger className="text-xs sm:text-sm font-bold text-foreground text-left hover:text-primary transition-colors">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed pt-1">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
