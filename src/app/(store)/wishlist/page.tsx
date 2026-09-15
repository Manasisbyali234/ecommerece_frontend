"use client";

import Link from "next/link";
import { Heart, ShoppingBag, Trash2, ArrowRight, Star, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useWishlist } from "@/lib/wishlist-context";
import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function WishlistPage() {
  const { wishlistProducts, toggleWishlist, clearWishlist, wishlistCount } = useWishlist();
  const { addItem, openCart } = useCart();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
      <div className="mx-auto max-w-7xl space-y-5 px-3 pt-4 sm:space-y-6 sm:px-6 sm:pt-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground font-semibold">My Wishlist</span>
        </nav>

        {/* Page Header Bar */}
        <div className="flex flex-col justify-between gap-3 border-b pb-4 sm:flex-row sm:items-center sm:gap-4 sm:pb-5">
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-center gap-2 text-xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              <Heart className="h-6 w-6 shrink-0 fill-rose-500 text-rose-500 sm:h-7 sm:w-7" />
              <span>My Saved Wishlist</span>
              <span className="text-sm font-normal text-muted-foreground">
                ({wishlistCount} {wishlistCount === 1 ? "item" : "items"})
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Items saved in your wishlist are reserved for quick checkout and price drop tracking.
            </p>
          </div>

          {wishlistCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearWishlist}
              className="text-xs font-semibold text-muted-foreground hover:text-rose-500 hover:border-rose-500/40 gap-1.5 self-start sm:self-auto"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Clear All Saved
            </Button>
          )}
        </div>

        {/* Wishlist Items Grid / Empty State */}
        {wishlistCount === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-4 rounded-xl border bg-background p-6 py-14 text-center shadow-xs sm:rounded-2xl sm:p-8 sm:py-20">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
              <Heart className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">Your Wishlist is Empty</h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                You haven't saved any products to your wishlist yet. Tap the heart icon on any product card to save it for later.
              </p>
            </div>
            <Button asChild size="lg" className="h-11 px-6 text-sm font-bold gap-2">
              <Link href="/products">
                Explore Products Catalog <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {wishlistProducts.map((product) => {
              const mrp = product.originalPrice || Math.round(product.price * 1.28);
              const discountPercent = Math.round(((mrp - product.price) / mrp) * 100);

              return (
                <Card
                  key={product.id}
                  className="group relative flex min-w-0 flex-col justify-between overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:shadow-xl sm:rounded-2xl"
                >
                  {/* Card Media Header */}
                  <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-900">
                    <Link href={`/products/${product.id}`}>
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>

                    {/* Category Tag */}
                    <Badge
                      variant="secondary"
                      className="absolute left-2 top-2 max-w-[70%] truncate bg-white/80 text-[9px] font-bold uppercase tracking-wider backdrop-blur-md dark:bg-slate-900/80 sm:left-3 sm:top-3 sm:text-[10px]"
                    >
                      {product.category}
                    </Badge>

                    {/* Remove Trash Button */}
                    <button
                      onClick={() => toggleWishlist(product.id, product.name)}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-slate-500 shadow-xs backdrop-blur-md transition-colors hover:text-rose-500 dark:bg-slate-900/80 sm:right-3 sm:top-3 sm:h-8 sm:w-8"
                      title="Remove from Wishlist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-1 flex-col justify-between space-y-2 p-2.5 sm:space-y-3 sm:p-4">
                    <div className="space-y-1">
                      <Link href={`/products/${product.id}`}>
                        <h3 className="line-clamp-2 text-xs font-bold text-foreground transition-colors group-hover:text-primary sm:line-clamp-1 sm:text-sm">
                          {product.name}
                        </h3>
                      </Link>

                      <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                        {product.description || "High-quality premium product with exceptional craftsmanship."}
                      </p>

                      {/* Rating Row */}
                      <div className="flex flex-wrap items-center gap-1 pt-1 sm:gap-1.5">
                        <div className="flex items-center text-amber-400">
                          <Star className="h-3.5 w-3.5 fill-amber-400" />
                          <span className="ml-1 text-xs font-bold text-foreground">
                            {product.rating || 4.8}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground sm:text-xs">
                          ({product.reviewCount || 48} reviews)
                        </span>
                      </div>
                    </div>

                    {/* Price & Move to Cart Button */}
                    <div className="space-y-3 pt-2 border-t mt-2">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                        <div className="flex flex-wrap items-baseline gap-1.5">
                          <span className="text-base font-extrabold text-foreground sm:text-lg">
                            {formatCurrency(product.price)}
                          </span>
                          <span className="text-[11px] font-medium text-muted-foreground line-through sm:text-xs">
                            {formatCurrency(mrp)}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          {discountPercent}% OFF
                        </span>
                      </div>

                      <Button
                        onClick={() => {
                          addItem(product);
                          toast.success(`Moved ${product.name} to Shopping Cart!`);
                          openCart();
                        }}
                        className="w-full h-9 text-xs font-bold gap-2 shadow-xs bg-primary hover:bg-primary/90"
                      >
                        <ShoppingBag className="h-4 w-4" /> Move to Cart
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
