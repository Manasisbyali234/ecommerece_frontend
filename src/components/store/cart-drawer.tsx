"use client";

import Link from "next/link";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export function CartDrawer() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    totalItems,
    isOpen,
    setIsOpen,
  } = useCart();

  const handleClearCart = () => {
    clearCart();
    toast.info("Shopping cart cleared");
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="flex w-[min(100vw,32rem)] flex-col sm:max-w-lg">
        <SheetHeader className="px-1 border-b pb-3">
          <div className="flex min-w-0 items-center gap-3 pr-6">
            <SheetTitle className="flex min-w-0 items-center gap-2 text-base font-semibold sm:text-lg">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Shopping Cart ({totalItems})
            </SheetTitle>
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center space-y-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground">
                Discover our latest products and add them to your cart.
              </p>
            </div>
            <Button onClick={() => setIsOpen(false)} variant="outline">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {items.map(({ product, quantity }, index) => (
                <div
                  key={product.id ?? index}
                  className="flex items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-accent/40 sm:gap-4 sm:p-3"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-14 w-14 shrink-0 rounded-md border object-cover sm:h-16 sm:w-16"
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <h4 className="truncate text-sm font-medium">{product.name}</h4>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span>{product.category}</span>
                      {product.colors && product.colors.length > 0 && (
                        <span className="flex items-center gap-1 border-l pl-2 border-muted">
                          <span
                            className="h-2.5 w-2.5 rounded-full border border-slate-300 dark:border-slate-700 inline-block shrink-0"
                            style={{ backgroundColor: product.colors[0].hex }}
                          />
                          <span className="truncate max-w-[80px]">{product.colors[0].name}</span>
                        </span>
                      )}
                      {product.sizes && product.sizes.length > 0 && (
                        <span className="border-l pl-2 border-muted text-[11px] font-semibold text-foreground">
                          {product.sizes[0]}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 font-semibold text-sm">
                      {formatCurrency(product.price)}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 rounded-md border bg-background">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-r-none"
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-xs font-medium">
                        {quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-l-none"
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(product.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-2">
              <Separator />
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Shipping & Taxes</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>
              <SheetFooter className="flex-col gap-2 sm:flex-col">
                <Button
                  className="w-full h-11 text-base shadow-sm"
                  asChild
                  onClick={() => setIsOpen(false)}
                >
                  <Link href="/checkout" className="flex items-center justify-center gap-2">
                    Proceed to Checkout <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <div className="flex items-center justify-between w-full pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40 gap-1.5"
                    onClick={handleClearCart}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear Cart</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => setIsOpen(false)}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </SheetFooter>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
