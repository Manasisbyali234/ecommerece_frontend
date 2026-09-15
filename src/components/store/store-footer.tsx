"use client";

import Link from "next/link";
import {
  Store,
  ShieldCheck,
  Truck,
  RefreshCw,
  CreditCard,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
  Share2,
} from "lucide-react";
import { useStore, store, initialFooterConfig } from "@/lib/store";

export function StoreFooter() {
  const footerConfig = useStore(
    (s) => s.footerConfig || initialFooterConfig
  );

  const activeColumns = footerConfig.columns.filter((c) => c.active);
  const activeSocials = footerConfig.socialLinks.filter((s) => s.active);

  const getSocialIcon = (icon: string) => {
    const key = icon.toLowerCase();
    if (key.includes("instagram")) return <Instagram className="h-4 w-4" />;
    if (key.includes("facebook")) return <Facebook className="h-4 w-4" />;
    if (key.includes("twitter")) return <Twitter className="h-4 w-4" />;
    if (key.includes("youtube")) return <Youtube className="h-4 w-4" />;
    if (key.includes("linkedin")) return <Linkedin className="h-4 w-4" />;
    return <Share2 className="h-4 w-4" />;
  };

  const getSocialHoverClass = (icon: string) => {
    const key = icon.toLowerCase();
    if (key.includes("instagram")) return "hover:text-rose-500 hover:border-rose-500/40 hover:bg-rose-500/10";
    if (key.includes("facebook")) return "hover:text-blue-600 hover:border-blue-600/40 hover:bg-blue-600/10";
    if (key.includes("twitter")) return "hover:text-sky-500 hover:border-sky-500/40 hover:bg-sky-500/10";
    if (key.includes("youtube")) return "hover:text-red-600 hover:border-red-600/40 hover:bg-red-600/10";
    if (key.includes("linkedin")) return "hover:text-blue-700 hover:border-blue-700/40 hover:bg-blue-700/10";
    return "hover:text-primary hover:border-primary/40 hover:bg-primary/10";
  };

  // Determine dynamic grid columns count
  const totalCols = 1 + activeColumns.length; // Brand col + active link cols
  const gridColClass =
    totalCols <= 2
      ? "lg:grid-cols-2"
      : totalCols === 3
      ? "lg:grid-cols-3"
      : totalCols === 4
      ? "lg:grid-cols-4"
      : "lg:grid-cols-5";

  return (
    <footer className="border-t bg-muted/30">
      {/* Value Proposition Bar */}
      <div className="border-b bg-background/50 py-4 sm:py-6">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-3 sm:gap-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Truck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-foreground">Free Shipping</h4>
              <p className="text-[11px] text-muted-foreground">On orders over ₹499</p>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-foreground">Secure Payment</h4>
              <p className="text-[11px] text-muted-foreground">100% encrypted checkout</p>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-foreground">30-Day Returns</h4>
              <p className="text-[11px] text-muted-foreground">Hassle-free guarantee</p>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-foreground">Instant Invoices</h4>
              <p className="text-[11px] text-muted-foreground">PDF download & email</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-3 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 ${gridColClass}`}>
          {/* Brand & Social Media Column */}
          <div className="min-w-0 space-y-3">
            <Link href="/" className="inline-block">
              {footerConfig.logoUrl ? (
                <img
                  src={footerConfig.logoUrl}
                  alt={footerConfig.brandName || "Store Logo"}
                  className="h-9 max-w-full object-contain sm:max-w-[200px]"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground font-bold">
                    <Store className="h-4 w-4" />
                  </div>
                  <span className="text-base font-bold text-foreground">{footerConfig.brandName}</span>
                </div>
              )}
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {footerConfig.description}
            </p>

            {/* Dynamic Social Media Links */}
            {activeSocials.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-foreground block mb-2 uppercase tracking-wider">Follow Us</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {activeSocials.map((soc) => (
                    <a
                      key={soc.id}
                      href={soc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`h-8 w-8 rounded-full bg-background border flex items-center justify-center text-muted-foreground transition-all cursor-pointer ${getSocialHoverClass(
                        soc.platform
                      )}`}
                      title={soc.platform}
                    >
                      {getSocialIcon(soc.platform)}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Link Columns */}
          {activeColumns.map((col) => (
            <div key={col.id}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
                {col.title}
              </h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {col.links.map((link) => (
                  <li key={link.id}>
                    <Link href={link.url} className="hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {footerConfig.brandName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
