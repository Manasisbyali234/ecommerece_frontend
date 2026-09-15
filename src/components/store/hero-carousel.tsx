"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShoppingBag,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { useStore, type Banner } from "@/lib/store";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/mock-data";
import { useCart } from "@/lib/cart-context";
import { useProducts } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
const getFontFamilyClass = (family?: string) => {
  if (family === "serif") return "font-serif";
  if (family === "mono") return "font-mono";
  if (family === "display") return "font-sans tracking-tight";
  return "font-sans";
};

const getFontWeightClass = (weight?: string) => {
  if (weight === "normal") return "font-normal";
  if (weight === "medium") return "font-medium";
  if (weight === "semibold") return "font-semibold";
  if (weight === "bold") return "font-bold";
  if (weight === "extrabold") return "font-extrabold";
  return "font-bold";
};

const getFontSizeClass = (size?: string, defaultClass = "text-4xl sm:text-5xl lg:text-6xl") => {
  if (size === "sm") return "text-sm";
  if (size === "base") return "text-base";
  if (size === "lg") return "text-lg";
  if (size === "xl") return "text-xl";
  if (size === "2xl") return "text-2xl";
  if (size === "3xl") return "text-3xl sm:text-4xl";
  if (size === "4xl") return "text-3xl sm:text-4xl lg:text-5xl";
  if (size === "5xl") return "text-4xl sm:text-5xl lg:text-6xl";
  if (size === "6xl") return "text-4xl sm:text-6xl lg:text-7xl";
  return defaultClass;
};

export function HeroCarousel() {
  const fallbackBanners = useStore((s) => s.banners);
  const [allBanners, setAllBanners] = useState<Banner[]>(fallbackBanners);
  const coupons = useStore((s) => s.coupons.filter((c) => c.active));
  const { addItem } = useCart();
  const products = useProducts();

  useEffect(() => {
    api<{ items: Array<{ id: string; title: string; active: boolean; data: Omit<Banner, "id"> }> }>("/content/banners")
      .then(({ items }) => setAllBanners(items.map((item) => ({ ...item.data, id: item.id, title: item.title, active: item.active }))))
      .catch(() => undefined);
  }, []);

  // Active hero section placement banners ONLY
  const heroBanners = useMemo(
    () => allBanners.filter((b) => b.active && (b.placement === "homepage" || !b.placement)),
    [allBanners]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-play timer every 3500ms (3.5 seconds)
  useEffect(() => {
    if (heroBanners.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroBanners.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [heroBanners.length, isPaused]);

  if (heroBanners.length === 0) return null;

  const currentBanner = heroBanners[currentIndex % heroBanners.length];
  const layout = currentBanner.layout ?? "layout1";

  const handleAddToCart = () => {
    const matched =
      products.find((p) =>
        p.name.toLowerCase().includes(currentBanner.title.toLowerCase().split(" ")[0])
      ) || products[0];

    if (!matched) { toast.error("This promotion does not have an available product"); return; }
    addItem(matched, 1);
    toast.success(`Added ${matched.name} to cart`, {
      description: `${formatCurrency(matched.price)} · Added to shopping bag`,
    });
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % heroBanners.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + heroBanners.length) % heroBanners.length);
  };

  const getObjectPositionStyle = (b: any) => {
    if (b.cropPositionX !== undefined || b.cropPositionY !== undefined) {
      return `${b.cropPositionX ?? 50}% ${b.cropPositionY ?? 50}%`;
    }
    if (b.imagePosition === "top") return "50% 0%";
    if (b.imagePosition === "bottom") return "50% 100%";
    if (b.imagePosition === "left") return "0% 50%";
    if (b.imagePosition === "right") return "100% 50%";
    return "50% 50%";
  };

  // Full-Width & Full-Height Product Image Renderer (No card wrapper)
  const fullProductImage = (
    <div className="relative h-full min-h-[210px] w-full overflow-hidden rounded-xl group sm:min-h-[340px] sm:rounded-3xl lg:min-h-[480px]">
      <img
        src={
          currentBanner.imageUrl ||
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600"
        }
        alt={currentBanner.title}
        style={{
          objectFit: currentBanner.imageFit ?? "cover",
          objectPosition: getObjectPositionStyle(currentBanner),
          transform: `scale(${currentBanner.zoom ?? 1})`,
        }}
        className="h-full w-full transition-transform duration-700 group-hover:scale-105"
      />
    </div>
  );

  // Content Block JSX Element helper
  const renderBannerContent = (alignCenter = false) => (
    <div className={`space-y-3 sm:space-y-6 ${alignCenter ? "text-center flex flex-col items-center" : ""}`}>

      <h1
        className={`leading-[1.12] ${getFontFamilyClass(currentBanner.titleStyle?.fontFamily)} ${getFontWeightClass(currentBanner.titleStyle?.fontWeight ?? "extrabold")} ${getFontSizeClass(currentBanner.titleStyle?.fontSize, "text-3xl sm:text-5xl lg:text-6xl")}`}
        style={{ color: currentBanner.titleStyle?.color ?? "#ffffff" }}
      >
        {currentBanner.title}
      </h1>

      {currentBanner.subtitle && (
        <p
          className={`${getFontFamilyClass(currentBanner.subtitleStyle?.fontFamily)} ${getFontWeightClass(currentBanner.subtitleStyle?.fontWeight ?? "semibold")} ${getFontSizeClass(currentBanner.subtitleStyle?.fontSize, "text-base sm:text-lg")}`}
          style={{ color: currentBanner.subtitleStyle?.color ?? "#38bdf8" }}
        >
          {currentBanner.subtitle}
        </p>
      )}

      <p
        className={`line-clamp-3 leading-relaxed sm:line-clamp-none ${alignCenter ? "max-w-2xl" : "max-w-xl"} ${getFontFamilyClass(currentBanner.bodyStyle?.fontFamily)} ${getFontWeightClass(currentBanner.bodyStyle?.fontWeight ?? "normal")} ${getFontSizeClass(currentBanner.bodyStyle?.fontSize, "text-sm sm:text-base")}`}
        style={{ color: currentBanner.bodyStyle?.color ?? "#cbd5e1" }}
      >
        {currentBanner.body}
      </p>

      {/* Standalone Product Price Display (with Discount Price Support) */}
      {(currentBanner.price !== undefined || currentBanner.discountPrice !== undefined) && (
        <div className={`flex flex-wrap items-baseline gap-2 pt-1 sm:gap-3 ${alignCenter ? "justify-center" : ""}`}>
          {currentBanner.discountPrice !== undefined ? (
            <>
              <span className="text-2xl font-black text-amber-400 tracking-tight sm:text-4xl">
                {formatCurrency(currentBanner.discountPrice)}
              </span>
              {currentBanner.price !== undefined && (
                <span className="text-base text-slate-300 line-through font-semibold">
                  {formatCurrency(currentBanner.price)}
                </span>
              )}
              {currentBanner.price !== undefined && (
                <Badge className="bg-emerald-500 text-slate-950 font-bold text-xs">
                  {Math.round(((currentBanner.price - currentBanner.discountPrice) / currentBanner.price) * 100)}% OFF
                </Badge>
              )}
            </>
          ) : (
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {formatCurrency(currentBanner.price!)}
            </span>
          )}
        </div>
      )}

      <div className={`grid grid-cols-1 gap-2 pt-1 min-[380px]:grid-cols-2 sm:flex sm:flex-wrap sm:items-center sm:gap-4 sm:pt-2 ${alignCenter ? "sm:justify-center" : ""}`}>
        <Button
          size="lg"
          className="h-10 px-4 text-sm font-semibold shadow-lg transition-transform hover:scale-105 sm:h-12 sm:px-7 sm:text-base"
          style={{
            backgroundColor: currentBanner.ctaBgColor ?? undefined,
            color: currentBanner.ctaTextColor ?? undefined,
          }}
          asChild
        >
          <a href={currentBanner.ctaUrl || "/#products"}>
            {currentBanner.ctaLabel || "Shop Collection"} <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-10 px-4 text-sm font-semibold text-slate-900 border-slate-700 bg-white hover:bg-slate-100 sm:h-12 sm:px-6 sm:text-base"
          onClick={handleAddToCart}
        >
          <ShoppingBag className="mr-2 h-4 w-4 text-primary" /> Add to Cart
        </Button>
      </div>
    </div>
  );

  return (
    <section
      className="relative flex h-[520px] w-full shrink-0 items-center overflow-hidden text-white transition-colors duration-700 sm:h-[600px] lg:h-[640px]"
      style={{ backgroundColor: currentBanner.bgColor || "#090d16" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Dynamic Background Image & Overlay */}
      {layout === "imageOnly" ? (
        <a
          href={currentBanner.ctaUrl || "/products?category=Apparel"}
          className="absolute inset-0 w-full h-full block group"
        >
          <img
            src={currentBanner.imageUrl || "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=1600"}
            alt={currentBanner.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
            style={{
              objectPosition: getObjectPositionStyle(currentBanner),
              transform: `scale(${currentBanner.zoom ?? 1})`,
            }}
          />
        </a>
      ) : layout === "layout3" ? (
        <>
          {/* Full section background image for Layout 3 */}
          {currentBanner.imageUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105"
              style={{
                backgroundImage: `url(${currentBanner.imageUrl})`,
                backgroundPosition: getObjectPositionStyle(currentBanner),
                opacity: currentBanner.bgOpacity ?? 0.6,
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-slate-950/75 z-10" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/95 to-slate-950/80 z-10" />
          {currentBanner.imageUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-25 blur-sm transition-all duration-1000 scale-105"
              style={{ backgroundImage: `url(${currentBanner.imageUrl})` }}
            />
          )}
        </>
      )}

      {/* Main Container Rendering Chosen Layout */}
      {layout !== "imageOnly" && (
        <div className="relative z-20 mx-auto flex h-full w-full max-w-7xl flex-col justify-center px-3 py-4 sm:px-6 sm:py-3 lg:px-8">
          {layout === "collage" ? (
            /* Layout 5: Flexible Multi-Small Banner Collage Grid */
            <div className="w-full">
              <div
                className="grid w-full items-center"
                style={{
                  gridTemplateColumns: `repeat(${currentBanner.collageCols || 3}, minmax(0, 1fr))`,
                  gridTemplateRows: currentBanner.collageRows ? `repeat(${currentBanner.collageRows}, minmax(0, 1fr))` : undefined,
                  gap: `${currentBanner.collageGapPx || 12}px`,
                }}
              >
                {(currentBanner.collageItems || []).map((item, idx) => {
                  let aspectClass = "aspect-[16/10] sm:aspect-[16/9.5]";
                  if (item.aspectRatio === "rectangle") aspectClass = "aspect-[16/8]";
                  if (item.aspectRatio === "landscape") aspectClass = "aspect-video";
                  if (item.aspectRatio === "portrait") aspectClass = "aspect-[4/3]";

                  return (
                    <a
                      key={item.id || idx}
                      href={item.ctaUrl || "/#products"}
                      style={{
                        gridColumn: item.gridSpan && item.gridSpan > 1 ? `span ${item.gridSpan} / span ${item.gridSpan}` : undefined,
                        gridRow: item.rowSpan && item.rowSpan > 1 ? `span ${item.rowSpan} / span ${item.rowSpan}` : undefined,
                      }}
                      className={`relative group overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900 shadow-md ${aspectClass} max-h-[220px] sm:max-h-[245px] lg:max-h-[265px] block`}
                    >
                      <img
                        src={item.imageUrl}
                        alt="Collage Banner Image"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </a>
                  );
                })}
              </div>
            </div>
          ) : layout === "layout3" ? (
            /* Layout 3: Centered Content with Full Section Background */
            <div className="max-w-3xl mx-auto py-6">
              {renderBannerContent(true)}
            </div>
          ) : layout === "layout2" ? (
            /* Layout 2: Full Width/Height Product Image on Left, Content on Right */
            <div className="grid h-full gap-4 sm:gap-8 lg:grid-cols-12 lg:items-center">
              <div className="flex h-full items-center justify-center lg:order-1 lg:col-span-6">
                {fullProductImage}
              </div>
              <div className="lg:col-span-6 lg:order-2">
                {renderBannerContent(false)}
              </div>
            </div>
          ) : (
            /* Layout 1 (Default): Content on Left, Full Width/Height Product Image on Right */
            <div className="grid h-full gap-4 sm:gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-6 lg:order-1">
                {renderBannerContent(false)}
              </div>
              <div className="flex h-full items-center justify-center lg:order-2 lg:col-span-6">
                {fullProductImage}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Carousel Navigation Arrows */}
      {heroBanners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Previous slide"
            className="absolute left-2 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/80 text-white border border-slate-700 backdrop-blur transition-all hover:bg-primary hover:border-primary sm:left-4 sm:h-10 sm:w-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next slide"
            className="absolute right-2 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/80 text-white border border-slate-700 backdrop-blur transition-all hover:bg-primary hover:border-primary sm:right-4 sm:h-10 sm:w-10"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Indicator Dots */}
          <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 shadow-lg">
            {heroBanners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2.5 rounded-full transition-all ${
                  currentIndex === i
                    ? "w-8 bg-amber-400 shadow-sm"
                    : "w-2.5 bg-white/60 hover:bg-white"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
