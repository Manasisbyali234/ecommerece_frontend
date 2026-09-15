"use client";

import { useRouter, usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@/lib/mock-data";

export function FloatingCartBar() {
  const { items, totalItems, subtotal } = useCart();
  const router = useRouter();
  const pathname = usePathname();

  // Only show on store product/category pages, not on checkout itself
  if (items.length === 0 || pathname === "/checkout") return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 sm:bottom-6">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-3 py-2.5 shadow-2xl sm:px-4 sm:py-3">
        {/* Left: Cart icon + item count + amount */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: "color-mix(in oklch, var(--primary) 15%, transparent)" }}
          >
            <ShoppingCart className="h-5 w-5" style={{ color: "var(--primary)" }} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground leading-none mb-0.5">
              {totalItems} {totalItems === 1 ? "item" : "items"} added
            </p>
            <p className="text-base font-extrabold text-foreground leading-none">
              {formatCurrency(subtotal)}
            </p>
          </div>
        </div>

        {/* Right: View Cart button */}
        <button
          onClick={() => router.push("/checkout")}
          className="shrink-0 rounded-xl px-4 py-2 text-sm font-bold shadow-sm transition-all active:scale-95 sm:px-5 sm:py-2.5"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          View Cart
        </button>
      </div>
    </div>
  );
}
