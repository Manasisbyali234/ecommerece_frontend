"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useMemo, useEffect, useRef, useCallback, Suspense } from "react";
import {
  Search,
  ShoppingBag,
  Eye,
  Check,
  Tag,
  ArrowRight,
  Filter,
  Sparkles,
  Heart,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, type Product } from "@/lib/mock-data";
import { useProducts } from "@/hooks/use-products";
import { useStore, store } from "@/lib/store";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { HeroCarousel } from "@/components/store/hero-carousel";
import { api, getAccessToken } from "@/lib/api";
import type { CategoryItem, SubCategory } from "@/lib/store";

// Category aliases mapping for display names to actual database category names
const categoryAliases: Record<string, string[]> = {
  "Audio & Headphones": ["Audio"],
  "Bags & Backpacks": ["Bags"],
  "Electronics & Smart": ["Electronics"],
  "Bags & Luggage": ["Bags"],
  "Home & Lifestyle": ["Home"],
  "Footwear & Sneakers": ["Footwear"],
  "Shop All": ["Audio", "Apparel", "Bags", "Footwear", "Electronics", "Home"],
  "All": ["Audio", "Apparel", "Bags", "Footwear", "Electronics", "Home"],
};

function StoreHomeContent() {
  const initialProducts = useProducts();
  const searchParams = useSearchParams();
  const { addItem } = useCart();
  const { wishlist, toggleWishlist, isInWishlist } = useWishlist();

  const banners = useStore((s) => s.banners);

  const afterHeroBanners = useMemo(() => {
    return banners.filter((b) => b.placement === "after_hero" && b.active);
  }, [banners]);

  const afterCategoryBanner = useMemo(() => {
    return banners.find((b) => b.placement === "after_category" && b.active);
  }, [banners]);

  const afterMegaDealsBanner = useMemo(() => {
    return banners.find((b) => b.placement === "after_mega_deals" && b.active);
  }, [banners]);

  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);
  const [contentLoadError, setContentLoadError] = useState(false);
  const categoryDeals = useMemo(
    () => categoriesList.filter((category) => category.name !== "All" && Boolean(category.image)),
    [categoriesList]
  );

  // Fetch visual CMS records directly so hard refreshes always rehydrate from MongoDB.
  useEffect(() => {
    api<{ items: Array<{ id: string; title: string; active: boolean; data: Omit<CategoryItem, "id"> }> }>("/content/categories")
      .then(({ items }) => { setCategoriesList(items.map((item) => ({ ...item.data, id: item.id, name: item.data.name || item.title, active: item.active }))); setContentLoadError(false); })
      .catch(() => { setCategoriesList([]); setContentLoadError(true); });
    api<{ items: Array<{ id: string; title: string; active: boolean; data: Omit<SubCategory, "id"> }> }>("/content/sub-categories")
      .then(({ items }) => setSubCategories(items.map((item) => ({ ...item.data, id: item.id, title: item.data.title || item.title, active: item.active }))))
      .catch(() => setSubCategories([]));
  }, []);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "price-low" | "price-high">("featured");
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewQty, setQuickViewQty] = useState(1);

  const dealsSliderRef = useRef<HTMLDivElement>(null);

  const scrollDeals = (direction: "left" | "right") => {
    if (dealsSliderRef.current) {
      const scrollAmount = direction === "left" ? -350 : 350;
      dealsSliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Auto slide loop for Crazy Mega Deals Carousel (300ms interval)
  useEffect(() => {
    const interval = setInterval(() => {
      if (dealsSliderRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = dealsSliderRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 20) {
          dealsSliderRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          dealsSliderRef.current.scrollBy({ left: 240, behavior: "smooth" });
        }
      }
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const matchesCategory = useCallback((product: Product, selectedCategory: string) => {
    if (selectedCategory === "All") return true;
    const aliases = categoryAliases[selectedCategory] || [selectedCategory];
    return aliases.some((category) => product.category.toLowerCase() === category.toLowerCase());
  }, []);

  // Sync category and search query from URL params (from Amazon navbar search)
  useEffect(() => {
    const cat = searchParams.get("category");
    const q = searchParams.get("search");
    if (cat) setSelectedCategory(cat);
    if (q !== null) setSearchQuery(q);
  }, [searchParams]);

  // Filter products by category, status ("active"), and search query
  const filteredProducts = useMemo(() => {
    let result = initialProducts.filter((p) => p.status === "active");

    if (selectedCategory !== "All") {
      result = result.filter((p) => matchesCategory(p, selectedCategory));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }

    if (sortBy === "price-low") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [selectedCategory, searchQuery, sortBy, initialProducts, matchesCategory]);

  const bestsellerProducts = useMemo(() => {
    return initialProducts
      .filter((p) => p.status === "active")
      .slice(0, 10);
  }, [initialProducts]);

  const handleAddToCart = (product: Product, qty = 1) => {
    if (!getAccessToken()) {
      toast.error("Please login first to add items to your cart.");
      return;
    }
    addItem(product, qty);
    toast.success(`Added ${product.name} to cart!`, {
      description: `${qty} × ${formatCurrency(product.price)}`,
    });
  };

  return (
    <div className="space-y-8 pb-12 sm:space-y-12 sm:pb-16">
      {/* Full-Width Edge-to-Edge Hero Slider Carousel */}
      <HeroCarousel />

      {/* Triple Product / Sale Advertisement Banners Row (Right After Hero Section) */}
      {afterHeroBanners.length > 0 && (
        <section className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-3">
            {afterHeroBanners.map((banner) => (
              <div
                key={banner.id}
                className="group relative flex h-40 flex-col justify-between overflow-hidden rounded-xl border p-4 text-white shadow-lg transition-all duration-300 hover:shadow-2xl sm:h-52 sm:rounded-2xl sm:p-5"
                style={{ backgroundColor: banner.bgColor || "#090d16" }}
              >
                {/* Image & Smooth Gradient Mask to prevent text overlap */}
                {banner.imageUrl && (
                  <>
                    <div className="absolute top-0 right-0 h-full w-[55%] overflow-hidden opacity-50 group-hover:opacity-75 transition-opacity duration-500">
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                        style={{ objectPosition: banner.imagePosition ?? "center" }}
                      />
                    </div>
                    <div
                      className="absolute inset-0 z-0 pointer-events-none"
                      style={{
                        background: `linear-gradient(to right, ${banner.bgColor || "#090d16"} 45%, transparent 100%)`,
                      }}
                    />
                  </>
                )}

                <div className="relative z-10 max-w-[68%] space-y-1.5 sm:max-w-[62%]">
                  {banner.subtitle && (
                    <Badge className="bg-primary/90 text-primary-foreground font-bold text-[10px] px-2 py-0.5 uppercase tracking-wider shadow-xs max-w-fit">
                      {banner.subtitle}
                    </Badge>
                  )}
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-white leading-snug line-clamp-2">
                    {banner.title}
                  </h3>
                  {(banner.discountPrice !== undefined || banner.price !== undefined) && (
                    <div className="flex items-baseline gap-1.5 text-xs font-semibold text-amber-400">
                      <span>{formatCurrency(banner.discountPrice ?? banner.price!)}</span>
                      {banner.price && banner.discountPrice && (
                        <span className="line-through text-slate-400 font-normal text-[11px]">
                          {formatCurrency(banner.price)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="relative z-10 pt-2">
                  <Button asChild size="sm" className="h-8 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-lg shadow-md transition-transform hover:scale-105">
                    <Link href={banner.ctaUrl || "/#products"}>
                      {banner.ctaLabel || "Shop Now"} <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SHOP BY CATEGORY Grid Section (Matching Reference Design) */}
      <section className="mx-auto max-w-7xl space-y-4 px-3 sm:space-y-6 sm:px-6 lg:px-8">
        <div className="text-center space-y-1.5">
          <h2 className="text-xl font-bold tracking-wider text-foreground sm:text-3xl">
            Shop by sub category
          </h2>
          <div className="h-1 w-16 bg-amber-500 rounded-full mx-auto" />
        </div>

        <div className="grid grid-cols-2 gap-2.5 pb-1 pt-2 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
          {subCategories.map((item) => (
            <Link
              key={item.id}
              href={`/products?category=${encodeURIComponent(item.category)}&subcategory=${encodeURIComponent(item.title)}`}
              className="group flex min-w-0 flex-col justify-between rounded-lg border border-[#85b978] bg-[#9ecb92] p-2 text-center shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-emerald-800 dark:bg-emerald-950/80 sm:rounded-xl sm:p-2.5"
            >
              {/* Aspect 4:5 Inner White Container Image */}
              <div className="relative aspect-[4/5] w-full rounded-lg overflow-hidden bg-white shadow-inner">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Card Text Content */}
              <div className="pt-2.5 pb-1 flex flex-col items-center justify-center">
                <h3 className="line-clamp-2 text-xs font-bold leading-snug text-slate-900 dark:text-slate-100 sm:text-sm">
                  {item.title}
                </h3>
                <span className="font-extrabold text-sm sm:text-base text-slate-950 dark:text-emerald-300 tracking-tight my-0.5">
                  {item.discount}
                </span>
                <span className="text-[11px] font-bold text-slate-800 dark:text-emerald-200 underline underline-offset-2 group-hover:text-slate-950 transition-colors">
                  Shop Now
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ADMIN-MANAGED CATEGORY IMAGE GRID */}
      {categoriesList.some((category) => category.image) && (
        <section className="mx-auto max-w-7xl space-y-4 px-3 sm:space-y-6 sm:px-6 lg:px-8">
          <div className="text-center space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-wider text-foreground">Shop by category</h2>
            <div className="h-1 w-16 bg-primary rounded-full mx-auto" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categoriesList.filter((category) => category.name !== "All" && category.image).map((category) => (
              <Link key={category.id} href={`/products?category=${encodeURIComponent(category.name)}`} className="group overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="aspect-square overflow-hidden bg-muted">
                  <img src={category.image} alt={category.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ objectPosition: `${category.cropPositionX ?? 50}% ${category.cropPositionY ?? 50}%`, transform: `scale(${category.imageZoom ?? 1})` }} />
                </div>
                <div className="p-3 text-center">
                  <h3 className="font-bold text-sm text-foreground">{category.name}</h3>
                  {category.description && <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{category.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
      {contentLoadError && <p className="mx-auto max-w-7xl px-4 text-center text-sm text-destructive">Store categories could not be loaded. Please verify the backend API is running and reachable.</p>}

      {/* Main Store Catalog Section */}
      <section id="products" className="mx-auto max-w-7xl space-y-5 px-3 sm:space-y-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Shop by categories
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Select items below to add to your cart or inspect product details.
            </p>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="featured">Sort by: Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categoriesList.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.name ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.name)}
              className="rounded-full text-xs shrink-0 font-medium"
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="space-y-3 rounded-xl border border-dashed p-6 py-12 text-center sm:rounded-2xl sm:p-8 sm:py-16">
            <Filter className="h-10 w-10 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">No products found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your category filter or search terms.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => {
              const mrp = product.originalPrice || Math.round(product.price * 1.28);
              const discountPercent = Math.round(((mrp - product.price) / mrp) * 100);
              const isWishlisted = wishlist.includes(product.id);

              return (
                <Card
                  key={product.id}
                  className="group overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    {/* Image Container with Category Tag & Add to Wishlist Button */}
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <Link href={`/products/${product.id}`} className="block h-full w-full">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </Link>

                      {/* Category Tag Badge (Top Left) */}
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <Badge variant="secondary" className="bg-background/90 backdrop-blur text-[11px] font-semibold text-foreground shadow-sm">
                          {product.category}
                        </Badge>
                      </div>

                      {/* Add to Wishlist Icon Button (Top Right) */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleWishlist(product.id, product.name);
                        }}
                        className="absolute top-2.5 right-2.5 z-10 h-8 w-8 rounded-full bg-background/90 backdrop-blur shadow-sm flex items-center justify-center transition-transform hover:scale-110"
                        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                      >
                        <Heart
                          className={`h-4 w-4 transition-colors ${
                            isWishlisted
                              ? "fill-red-500 text-red-500"
                              : "text-slate-600 dark:text-slate-400 hover:text-red-500"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Card Content Details */}
                    <CardContent className="p-4 space-y-2">
                      {/* Product Name */}
                      <Link href={`/products/${product.id}`}>
                        <h3 className="font-bold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                      </Link>

                      {/* Product Short One Line Description (Truncated with ...) */}
                      <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                        {product.description || "High-quality premium product with exceptional craftsmanship and design."}
                      </p>

                      {/* Rating & Review Counts */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <div className="flex items-center text-amber-400">
                          <Star className="h-3.5 w-3.5 fill-amber-400" />
                          <span className="text-xs font-bold text-foreground ml-1">
                            {product.rating || 4.8}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">
                          ({product.reviewCount || 48} reviews)
                        </span>
                      </div>
                    </CardContent>
                  </div>

                  {/* Card Footer: MRP, Discounted Price, Discount %, Add to Cart Icon */}
                  <div className="p-4 pt-3 border-t bg-muted/20 flex items-center justify-between gap-2">
                    {/* Price Block: Discounted Price, MRP, Discount % */}
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-extrabold text-base sm:text-lg text-foreground">
                          {formatCurrency(product.price)}
                        </span>
                        <span className="line-through text-xs text-muted-foreground font-medium">
                          {formatCurrency(mrp)}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        {discountPercent}% OFF
                      </span>
                    </div>

                    {/* Add to Cart Icon Button */}
                    <Button
                      size="icon"
                      disabled={product.stock === 0}
                      onClick={() => handleAddToCart(product)}
                      className="h-9 w-9 rounded-lg shadow-sm shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                      title="Add to Cart"
                    >
                      <ShoppingBag className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Product Advertisement Rectangular Banner (Right After Shop by Categories) */}
      {afterCategoryBanner && (
        <section className="mx-auto max-w-7xl px-3 py-2 sm:px-6 lg:px-8">
          <div
            className="group relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-4 text-white shadow-xl sm:rounded-2xl sm:p-6"
            style={{ backgroundColor: afterCategoryBanner.bgColor || undefined }}
          >
            {/* Ambient Glow Effects */}
            <div className="absolute -top-24 -right-24 h-60 w-60 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-60 w-60 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 items-center gap-4 sm:gap-6 md:grid-cols-12">
              {/* Left Column: Offer Details & CTA (8 Cols) */}
              <div className="md:col-span-8 space-y-2.5">
                {afterCategoryBanner.subtitle && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] px-2.5 py-0.5 uppercase tracking-wider shadow-xs">
                      {afterCategoryBanner.subtitle}
                    </Badge>
                  </div>
                )}

                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug">
                    {afterCategoryBanner.title}
                  </h2>
                  {afterCategoryBanner.body && (
                    <p className="text-xs text-slate-300 line-clamp-1 max-w-lg">
                      {afterCategoryBanner.body}
                    </p>
                  )}
                </div>

                {/* Price & Action Row */}
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  {(afterCategoryBanner.price !== undefined || afterCategoryBanner.discountPrice !== undefined) && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-amber-400">
                        {formatCurrency(afterCategoryBanner.discountPrice ?? afterCategoryBanner.price!)}
                      </span>
                      {afterCategoryBanner.discountPrice && afterCategoryBanner.price && (
                        <span className="text-sm text-slate-400 line-through font-semibold">
                          {formatCurrency(afterCategoryBanner.price)}
                        </span>
                      )}
                    </div>
                  )}

                  <Button asChild size="sm" className="h-9 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg shadow-md transition-transform hover:scale-105">
                    <Link href={afterCategoryBanner.ctaUrl || "/#products"}>
                      {afterCategoryBanner.ctaLabel || "Shop Flash Deal"} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Right Column: Sleek Compact Preview Image (4 Cols) */}
              {afterCategoryBanner.imageUrl && (
                <div className="md:col-span-4 relative flex items-center justify-center">
                  <div className="relative h-36 sm:h-40 w-full rounded-xl overflow-hidden border border-white/10 shadow-lg bg-slate-900 group-hover:scale-102 transition-transform duration-500">
                    <img
                      src={afterCategoryBanner.imageUrl}
                      alt={afterCategoryBanner.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      style={{ objectPosition: afterCategoryBanner.imagePosition ?? "center" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Bestseller Products Section */}
      <section className="mx-auto max-w-7xl space-y-5 px-3 pt-4 sm:space-y-8 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Bestseller products
              </h2>
              <Badge className="bg-amber-500 text-slate-950 font-bold text-xs">
                🔥 Top Rated
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Handpicked customer favorites with exceptional ratings & reviews.
            </p>
          </div>

          <Button asChild variant="outline" size="sm" className="font-semibold text-xs shrink-0">
            <Link href="/products?sortBy=rating">
              View All Bestsellers →
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {bestsellerProducts.map((product) => {
            const mrp = product.originalPrice || Math.round(product.price * 1.28);
            const discountPercent = Math.round(((mrp - product.price) / mrp) * 100);
            const isWishlisted = wishlist.includes(product.id);

            return (
              <Card
                key={`bestseller-${product.id}`}
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

                  {/* Category Tag (Top-Left) */}
                  <Badge
                    variant="secondary"
                    className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-white/80 dark:bg-slate-900/80"
                  >
                    {product.category}
                  </Badge>

                  {/* Wishlist Heart Button (Top-Right) */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleWishlist(product.id, product.name)}
                    className={`absolute top-3 right-3 h-8 w-8 rounded-full backdrop-blur-md transition-colors shadow-xs ${
                      isWishlisted
                        ? "bg-rose-500 text-white hover:bg-rose-600"
                        : "bg-white/80 dark:bg-slate-900/80 text-muted-foreground hover:text-rose-500"
                    }`}
                    title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                  >
                    <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
                  </Button>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <Link href={`/products/${product.id}`}>
                      <h3 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </Link>

                    <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                      {product.description || "High-quality premium product with exceptional craftsmanship and design."}
                    </p>

                    <div className="flex items-center gap-1.5 pt-1">
                      <div className="flex items-center text-amber-400">
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        <span className="text-xs font-bold text-foreground ml-1">
                          {product.rating || 4.8}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        ({product.reviewCount || 48} reviews)
                      </span>
                    </div>
                  </div>

                  {/* Price & Add to Cart */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t mt-2">
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-extrabold text-base text-foreground">
                          {formatCurrency(product.price)}
                        </span>
                        <span className="line-through text-xs text-muted-foreground font-medium">
                          {formatCurrency(mrp)}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        {discountPercent}% OFF
                      </span>
                    </div>

                    <Button
                      size="icon"
                      disabled={product.stock === 0}
                      onClick={() => handleAddToCart(product)}
                      className="h-9 w-9 rounded-lg shadow-sm shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                      title="Add to Cart"
                    >
                      <ShoppingBag className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Shop by Brands Section (2 Product Card Rows - 10 Products Total) */}
      <section className="mx-auto max-w-7xl space-y-5 px-3 pt-5 sm:space-y-8 sm:px-6 sm:pt-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Shop by Brands
              </h2>
              <Badge className="bg-primary/10 text-primary font-bold border-primary/20 text-xs">
                ✨ Official Stores
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Discover top global brands with authentic product warranty & exclusive store discounts.
            </p>
          </div>

          <Button asChild variant="outline" size="sm" className="font-semibold text-xs shrink-0">
            <Link href="/products">
              View All Brands →
            </Link>
          </Button>
        </div>

        {/* 2 Product Card Rows (5 per row = 10 products total) */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {initialProducts
            .filter((p) => p.status === "active")
            .slice(0, 10)
            .map((product, idx) => {
              const displayBrand = product.brand || "Official Store";
              const mrp = product.originalPrice || Math.round(product.price * 1.28);
              const discountPercent = Math.round(((mrp - product.price) / mrp) * 100);
              const isWishlisted = wishlist.includes(product.id);

              return (
                <Card
                  key={`brand-card-${product.id}-${idx}`}
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

                    {/* Brand Tag (Top-Left) */}
                    <Badge
                      className="absolute top-3 left-3 text-[10px] font-extrabold uppercase tracking-wider bg-slate-950 text-amber-400 border border-amber-400/30 shadow-md"
                    >
                      {displayBrand}
                    </Badge>

                    {/* Wishlist Heart Button (Top-Right) */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleWishlist(product.id, product.name)}
                      className={`absolute top-3 right-3 h-8 w-8 rounded-full backdrop-blur-md transition-colors shadow-xs ${
                        isWishlisted
                          ? "bg-rose-500 text-white hover:bg-rose-600"
                          : "bg-white/80 dark:bg-slate-900/80 text-muted-foreground hover:text-rose-500"
                      }`}
                      title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                    >
                      <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
                    </Button>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <Link href={`/products/${product.id}`}>
                        <h3 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                      </Link>

                      <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                        {product.description || "Official brand certified product with replacement warranty."}
                      </p>

                      <div className="flex items-center gap-1.5 pt-1">
                        <div className="flex items-center text-amber-400">
                          <Star className="h-3.5 w-3.5 fill-amber-400" />
                          <span className="text-xs font-bold text-foreground ml-1">
                            {product.rating || 4.8}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">
                          ({product.reviewCount || 48} reviews)
                        </span>
                      </div>
                    </div>

                    {/* Price & Add to Cart */}
                    <div className="pt-2 flex items-center justify-between gap-2 border-t mt-2">
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-extrabold text-base text-foreground">
                            {formatCurrency(product.price)}
                          </span>
                          <span className="line-through text-xs text-muted-foreground font-medium">
                            {formatCurrency(mrp)}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          {discountPercent}% OFF
                        </span>
                      </div>

                      <Button
                        size="icon"
                        disabled={product.stock === 0}
                        onClick={() => handleAddToCart(product)}
                        className="h-9 w-9 rounded-lg shadow-sm shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                        title="Add to Cart"
                      >
                        <ShoppingBag className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>
      </section>

      {/* Mixed Content Deals Slider Carousel Section (Matching Reference Image Design) */}
      <section className="mx-auto max-w-7xl space-y-4 px-3 pt-5 sm:space-y-6 sm:px-6 sm:pt-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Crazy Mega Deals & Offers
              </h2>
              <Badge className="bg-purple-600 text-white font-extrabold text-xs">
                🎉 Max Savings
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Top category offers, budget finds under ₹999, flat 50% off & minimum 10-20% discounts.
            </p>
          </div>

          {/* Slider Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scrollDeals("left")}
              className="h-9 w-9 rounded-full border-muted-foreground/30 hover:bg-muted text-foreground"
              title="Scroll Left"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scrollDeals("right")}
              className="h-9 w-9 rounded-full border-muted-foreground/30 hover:bg-muted text-foreground"
              title="Scroll Right"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Horizontal Scrollable Slider */}
        <div
          ref={dealsSliderRef}
          className="flex items-center gap-5 overflow-x-auto pt-3 pb-4 px-1 scrollbar-none snap-x snap-mandatory"
        >
          {[
            {
              title: "Dresses & Gowns",
              offer: "Under ₹399",
              image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600",
              link: "/products?category=Apparel",
            },
            {
              title: "PUMA, Reebok & Nike",
              offer: "Min. 60% Off",
              image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600",
              link: "/products?category=Footwear",
            },
            {
              title: "Titan, Tommy Watches",
              offer: "30-50% Off",
              image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600",
              link: "/products?category=Electronics",
            },
            {
              title: "Kids' T-Shirts & Apparel",
              offer: "Under ₹299",
              image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600",
              link: "/products?category=Apparel",
            },
            {
              title: "Wireless Earbuds & Audio",
              offer: "Under ₹999",
              image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600",
              link: "/products?category=Audio",
            },
            {
              title: "Leather Jackets & Denim",
              offer: "Flat 50% Off",
              image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600",
              link: "/products?category=Apparel",
            },
            {
              title: "Luxury Perfumes & Makeup",
              offer: "Flat 30% Off",
              image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600",
              link: "/products?category=Home",
            },
            {
              title: "Backpacks & Luggage",
              offer: "Min. 40% Off",
              image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600",
              link: "/products?category=Bags",
            },
          ].map((deal, idx) => {
            const databaseCategory = categoriesList.filter((category) => category.name !== "All" && category.image)[idx];
            if (!databaseCategory) return null;
            const renderedDeal = { title: databaseCategory.name, offer: databaseCategory.description || "Explore collection", image: databaseCategory.image!, link: `/products?category=${encodeURIComponent(databaseCategory.name)}` };
            return (
            <Link
              key={`deal-card-${idx}`}
              href={renderedDeal.link}
              className="group flex w-40 shrink-0 snap-start flex-col justify-between overflow-hidden rounded-xl border border-muted-foreground/20 bg-card shadow-sm transition-all duration-300 hover:border-amber-500/50 hover:shadow-md min-[380px]:w-44 sm:w-64 sm:rounded-2xl"
            >
              {/* Portrait 3:4 Image Container */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                <img
                  src={renderedDeal.image}
                  alt={renderedDeal.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Corner Smiley Icon Badge */}
                <div className="absolute bottom-2 left-2 h-7 w-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md">
                  🙂
                </div>

                {/* Corner Star Badge */}
                <div className="absolute bottom-2 right-2 h-7 w-7 rounded-full bg-slate-900/80 backdrop-blur-md text-amber-400 flex items-center justify-center text-xs shadow-md border border-white/20">
                  ⭐
                </div>
              </div>

              {/* Card Banner Details */}
              <div className="p-3 text-center bg-card border-t space-y-0.5">
                <h3 className="text-xs font-semibold text-muted-foreground line-clamp-1">
                  {renderedDeal.title}
                </h3>
                <div className="text-base sm:text-lg font-black tracking-tight text-foreground">
                  {renderedDeal.offer}
                </div>
              </div>
            </Link>
            );
          })}
        </div>
      </section>

      {/* Rectangular Product Advertisement Banner (Right After Crazy Mega Deals & Offers) */}
      {afterMegaDealsBanner && (
        <section className="mx-auto max-w-7xl px-3 py-2 sm:px-6 lg:px-8">
          <div
            className="group relative overflow-hidden rounded-xl border border-emerald-800/60 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-4 text-white shadow-xl sm:rounded-2xl sm:p-6"
            style={{ backgroundColor: afterMegaDealsBanner.bgColor || undefined }}
          >
            {/* Ambient Glow Effects */}
            <div className="absolute -top-24 -right-24 h-60 w-60 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-60 w-60 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 items-center gap-4 sm:gap-6 md:grid-cols-12">
              {/* Left Column: Offer Details & CTA (8 Cols) */}
              <div className="md:col-span-8 space-y-2.5">
                {afterMegaDealsBanner.subtitle && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px] px-2.5 py-0.5 uppercase tracking-wider shadow-xs">
                      {afterMegaDealsBanner.subtitle}
                    </Badge>
                  </div>
                )}

                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug">
                    {afterMegaDealsBanner.title}
                  </h2>
                  {afterMegaDealsBanner.body && (
                    <p className="text-xs text-slate-300 line-clamp-1 max-w-lg">
                      {afterMegaDealsBanner.body}
                    </p>
                  )}
                </div>

                {/* Price & Action Row */}
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  {(afterMegaDealsBanner.price !== undefined || afterMegaDealsBanner.discountPrice !== undefined) && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                        {formatCurrency(afterMegaDealsBanner.discountPrice ?? afterMegaDealsBanner.price!)}
                      </span>
                      {afterMegaDealsBanner.discountPrice && afterMegaDealsBanner.price && (
                        <span className="text-sm text-slate-400 line-through font-semibold">
                          {formatCurrency(afterMegaDealsBanner.price)}
                        </span>
                      )}
                    </div>
                  )}

                  <Button asChild size="sm" className="h-9 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-lg shadow-md transition-transform hover:scale-105">
                    <Link href={afterMegaDealsBanner.ctaUrl || "/#products"}>
                      {afterMegaDealsBanner.ctaLabel || "Explore Now"} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Right Column: Sleek Compact Preview Image (4 Cols) */}
              {afterMegaDealsBanner.imageUrl && (
                <div className="md:col-span-4 relative flex items-center justify-center">
                  <div className="relative h-36 sm:h-40 w-full rounded-xl overflow-hidden border border-white/10 shadow-lg bg-slate-900 group-hover:scale-102 transition-transform duration-500">
                    <img
                      src={afterMegaDealsBanner.imageUrl}
                      alt={afterMegaDealsBanner.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      style={{ objectPosition: afterMegaDealsBanner.imagePosition ?? "center" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Product Quick View Dialog */}
      <Dialog open={!!quickViewProduct} onOpenChange={(o) => !o && setQuickViewProduct(null)}>
        <DialogContent className="sm:max-w-2xl">
          {quickViewProduct && (
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                <img
                  src={quickViewProduct.image}
                  alt={quickViewProduct.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <Badge variant="secondary">{quickViewProduct.category}</Badge>
                  <h3 className="text-xl font-bold text-foreground">
                    {quickViewProduct.name}
                  </h3>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(quickViewProduct.price)}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {quickViewProduct.description || "Premium quality product with durable materials and state-of-the-art craftsmanship."}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Quantity:</span>
                    <div className="flex items-center rounded-md border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuickViewQty(Math.max(1, quickViewQty - 1))}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center text-sm font-bold">
                        {quickViewQty}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuickViewQty(quickViewQty + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => {
                      handleAddToCart(quickViewProduct, quickViewQty);
                      setQuickViewProduct(null);
                    }}
                  >
                    Add {quickViewQty} to Cart · {formatCurrency(quickViewProduct.price * quickViewQty)}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function StoreHomePage() {
  return (
    <Suspense fallback={null}>
      <StoreHomeContent />
    </Suspense>
  );
}
