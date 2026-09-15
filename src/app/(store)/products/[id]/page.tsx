"use client";
/* eslint-disable react-hooks/preserve-manual-memoization */

import Link from "next/link";
import { use, useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  Plus,
  Minus,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  MapPin,
  Zap,
  CheckCircle2,
  Clock,
  Lock,
  Banknote,
  RefreshCw,
  Award,
  PackageCheck,
  Layers,
  ThumbsUp,
  Play,
  Camera,
  Video,
  MessageSquare,
  Upload,
  User,
  Image as ImageIconLucide,
  Filter,
  SlidersHorizontal,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, defaultAboutSections, defaultAdditionalInfo, type Product, type ProductReview, type AboutProductSection, type AdditionalInfoSection } from "@/lib/mock-data";
import { useProducts } from "@/hooks/use-products";
import { useCart } from "@/lib/cart-context";
import { api, getAccessToken } from "@/lib/api";
import { useWishlist } from "@/lib/wishlist-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PageProps {
  params: Promise<{ id: string }>;
}

const loadingProduct: Product = {
  id: "loading",
  name: "Loading product…",
  sku: "",
  category: "",
  price: 0,
  stock: 0,
  status: "draft",
  image: "",
  images: [],
  features: [],
  specs: {},
  colors: [],
  sizes: [],
};

function orderItemProductId(item: Record<string, unknown>) {
  const product = item.product;
  if (typeof product === "string") return product;
  if (product && typeof product === "object") {
    const record = product as Record<string, unknown>;
    return String(record.id || record._id || "");
  }
  return String(item.id || "");
}

export default function ProductDetailPage({ params }: PageProps) {
  const products = useProducts();
  const resolvedParams = use(params);
  const router = useRouter();
  const { addItem, openCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  // Find product by ID
  const product: Product =
    products.find((p) => p.id === resolvedParams.id) || loadingProduct;

  const galleryImages = (product.images && product.images.length > 0
    ? product.images
    : [product.image]
  ).filter((image): image is string => typeof image === "string" && image.trim().length > 0);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const activeImage = galleryImages[activeImageIndex] ?? null;
  const [selectedColor, setSelectedColor] = useState(
    product.colors && product.colors.length > 0 ? product.colors[0].name : ""
  );
  const [selectedSize, setSelectedSize] = useState(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : ""
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"features" | "specs" | "reviews">("features");

  const showReviews = () => {
    setActiveTab("reviews");
    requestAnimationFrame(() => {
      document.getElementById("customer-reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  // Lightbox Zoom Modal & Visual Showcase Slider States
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showcaseSlideIndex, setShowcaseSlideIndex] = useState(0);

  // Shop Similar Products Slider Ref & Data
  const similarSliderRef = useRef<HTMLDivElement>(null);
  const [isSimilarHovered, setIsSimilarHovered] = useState(false);

  const similarProducts = useMemo(() => {
    let matches = products.filter(
      (p) => p.id !== product.id && (p.category === product.category || (product.brand && p.brand === product.brand))
    );
    if (matches.length < 6) {
      const fallback = products.filter((p) => p.id !== product.id && !matches.some((m) => m.id === p.id));
      matches = [...matches, ...fallback];
    }
    return matches;
  }, [product]);

  const handleScrollSimilar = (direction: "left" | "right") => {
    if (similarSliderRef.current) {
      const container = similarSliderRef.current;
      const scrollAmount = 300;
      if (direction === "left") {
        if (container.scrollLeft <= 5) {
          container.scrollTo({ left: container.scrollWidth, behavior: "smooth" });
        } else {
          container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
        }
      } else {
        if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
          container.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          container.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
      }
    }
  };

  // Auto-Slide Interval for Similar Products Slider
  useEffect(() => {
    if (isSimilarHovered) return;
    const interval = setInterval(() => {
      handleScrollSimilar("right");
    }, 3200);

    return () => clearInterval(interval);
  }, [isSimilarHovered]);

  // Enhanced Customer Reviews State
  const [reviewsList, setReviewsList] = useState<ProductReview[]>([]);

  useEffect(() => {
    api<{ reviews: Array<ProductReview & { createdAt?: string }> }>(`/products/${resolvedParams.id}`)
      .then(({ reviews }) => setReviewsList(reviews.map((review) => ({
        ...review,
        date: review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "",
      }))))
      .catch(() => setReviewsList([]));
  }, [resolvedParams.id]);
  const [reviewMediaModal, setReviewMediaModal] = useState<{ type: "image" | "video"; url: string; title?: string } | null>(null);
  const [openAddReviewModal, setOpenAddReviewModal] = useState(false);
  const [canReviewProduct, setCanReviewProduct] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setCanReviewProduct(false);
    if (!getAccessToken() || product.id === "loading") return;

    api<{ items: Array<{ status?: string; items?: Array<Record<string, unknown>> }> }>("/orders")
      .then(({ items }) => {
        if (cancelled) return;
        setCanReviewProduct(
          items.some((order) =>
            order.status === "delivered" &&
            (order.items || []).some((item) => orderItemProductId(item) === product.id)
          )
        );
      })
      .catch(() => {
        if (!cancelled) setCanReviewProduct(false);
      });

    return () => {
      cancelled = true;
    };
  }, [product.id]);

  // Review Filter & Sort States
  const [reviewRatingFilter, setReviewRatingFilter] = useState<number | "all">("all");
  const [reviewSortBy, setReviewSortBy] = useState<"recent" | "highest" | "lowest">("recent");

  const filteredReviews = useMemo(() => {
    let list = [...reviewsList];

    // Filter by Star Rating
    if (reviewRatingFilter !== "all") {
      list = list.filter((r) => r.rating === reviewRatingFilter);
    }

    // Sort By
    if (reviewSortBy === "highest") {
      list.sort((a, b) => b.rating - a.rating);
    } else if (reviewSortBy === "lowest") {
      list.sort((a, b) => a.rating - b.rating);
    }

    return list;
  }, [reviewsList, reviewRatingFilter, reviewSortBy]);
  const [newReview, setNewReview] = useState<{
    author: string;
    rating: number;
    title: string;
    comment: string;
    photos: string[];
    videoUrl: string | null;
  }>({
    author: "",
    rating: 5,
    title: "",
    comment: "",
    photos: [],
    videoUrl: null,
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newUrls: string[] = [];
      Array.from(files).forEach((file) => {
        const url = URL.createObjectURL(file);
        newUrls.push(url);
      });
      setNewReview((prev) => ({
        ...prev,
        photos: [...prev.photos, ...newUrls],
      }));
      toast.success(`${files.length} photo(s) attached to review`);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const videoFile = files[0];
      const videoUrl = URL.createObjectURL(videoFile);
      setNewReview((prev) => ({
        ...prev,
        videoUrl,
      }));
      toast.success("Short video review attached!");
    }
  };

  const handleAddReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canReviewProduct) {
      toast.error("You can review this product after your delivered order is completed.");
      return;
    }
    if (!newReview.author.trim() || !newReview.comment.trim()) {
      toast.error("Please fill in your name and review details");
      return;
    }
    try {
      const { review } = await api<{ review: ProductReview }>(`/products/${product.id}/reviews`, { method: "POST", body: JSON.stringify({ rating: newReview.rating, title: newReview.title || undefined, comment: newReview.comment, images: newReview.photos.filter((url) => /^https?:\/\//.test(url)), videoUrl: newReview.videoUrl && /^https?:\/\//.test(newReview.videoUrl) ? newReview.videoUrl : undefined }) });
      const created: ProductReview = {
        ...review,
        date: "Just now",
        images: review.images?.length ? review.images : undefined,
      };
      setReviewsList((prev) => [created, ...prev]);
      setOpenAddReviewModal(false);
      setNewReview({ author: "", rating: 5, title: "", comment: "", photos: [], videoUrl: null });
      toast.success("Thank you! Your review was submitted for approval.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Please sign in before submitting a review"); }
    /* const created: ProductReview = {
      id: `rev-${Date.now()}`,
      author: newReview.author,
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
      verifiedBuyer: true,
      rating: newReview.rating,
      date: "Just now",
      title: newReview.title || "Great purchase!",
      comment: newReview.comment,
      images: newReview.photos.length > 0 ? newReview.photos : [galleryImages[0] || product.image],
      videoUrl: newReview.videoUrl || undefined,
      videoPoster: newReview.videoUrl ? (galleryImages[0] || product.image) : undefined,
      likes: 0,
    };

    setReviewsList((prev) => [created, ...prev]);
    setOpenAddReviewModal(false);
    setNewReview({ author: "", rating: 5, title: "", comment: "", photos: [], videoUrl: null });
    toast.success("Thank you! Your customer review with media has been published."); */
  };

  // Pincode Delivery Availability & Estimated Delivery State
  const [pincode, setPincode] = useState("560038");
  const [checkedPincode, setCheckedPincode] = useState<string | null>("560038");
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState("");

  const deliveryEstimates = useMemo(() => {
    const today = new Date();
    const expressDate = new Date(today);
    expressDate.setDate(today.getDate() + 1);

    const standardDate = new Date(today);
    standardDate.setDate(today.getDate() + 3);

    const formatDate = (d: Date) =>
      d.toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

    return {
      express: formatDate(expressDate),
      standard: formatDate(standardDate),
    };
  }, []);

  const handleCheckPincode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = pincode.trim().replace(/\D/g, "");
    if (clean.length !== 6) {
      setPincodeError("Please enter a valid 6-digit Pincode (e.g. 560038)");
      setCheckedPincode(null);
      return;
    }

    setPincodeError("");
    setIsCheckingPincode(true);

    try {
      const result = await api<{ available: boolean; estimatedDays?: string; message?: string }>("/shipping/check", { method: "POST", body: JSON.stringify({ pincode: clean }) });
      setIsCheckingPincode(false);
      if (!result.available) { setPincodeError(result.message || "Delivery is unavailable for this pincode"); setCheckedPincode(null); return; }
      setCheckedPincode(clean);
      toast.success(`Delivery available for Pincode ${clean}!`, {
        description: `Estimated delivery: ${result.estimatedDays || deliveryEstimates.standard} days`,
      });
    } catch (error) { setIsCheckingPincode(false); setPincodeError(error instanceof Error ? error.message : "Unable to check delivery availability"); }
  };

  const handleAddToCart = () => {
    if (!getAccessToken()) {
      toast.error("Please login first to add items to your cart.");
      return;
    }
    addItem(product, quantity);
    toast.success(`Added ${quantity} × ${product.name} to cart!`, {
      description: selectedColor || selectedSize ? `Variant: ${selectedColor} ${selectedSize}` : undefined,
    });
    openCart();
  };

  const handleBuyNow = () => {
    if (!getAccessToken()) {
      toast.error("Please login first to add items to your cart.");
      return;
    }
    addItem(product, quantity);
    toast.success(`Proceeding to checkout with ${product.name}`);
    router.push("/checkout");
  };

  // Related products (5 items, prioritizing same category)
  const relatedProducts = [
    ...products.filter((p) => p.id !== product.id && p.category === product.category),
    ...products.filter((p) => p.id !== product.id && p.category !== product.category),
  ].slice(0, 5);

  // Frequently Bought Together Combo Deals calculation
  const comboDealsList = useMemo(() => {
    if (product.comboDeals && product.comboDeals.length > 0) {
      return product.comboDeals.slice(0, 3);
    }
    if (product.comboProductIds && product.comboProductIds.length > 0) {
      return [
        {
          id: "cd-1",
          title: "Frequently Bought Together",
          productIds: product.comboProductIds.slice(0, 2),
        },
      ];
    }
    // Fallback picks 1 complementary product from catalog
    const fallback =
      products.find((p) => p.id !== product.id && p.category === product.category) ||
      products.find((p) => p.id !== product.id);
    return fallback
      ? [
          {
            id: "cd-1",
            title: "Frequently Bought Together",
            productIds: [fallback.id],
          },
        ]
      : [];
  }, [product]);

  const [activeComboDealIdx, setActiveComboDealIdx] = useState<number>(0);

  const activeComboDeal = comboDealsList[activeComboDealIdx] || comboDealsList[0];

  const allComboItems = useMemo(() => {
    if (!activeComboDeal) return [product];
    const bundled = products.filter((p) => (activeComboDeal.productIds || []).includes(p.id));
    return [product, ...bundled];
  }, [product, activeComboDeal]);

  // Selected state for checked combo items
  const [checkedComboIds, setCheckedComboIds] = useState<string[]>([]);

  useEffect(() => {
    setCheckedComboIds(allComboItems.map((i) => i.id));
  }, [allComboItems]);

  const toggleComboChecked = (id: string) => {
    setCheckedComboIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const comboTotalPrice = useMemo(() => {
    return allComboItems
      .filter((item) => checkedComboIds.includes(item.id))
      .reduce((sum, item) => sum + item.price, 0);
  }, [allComboItems, checkedComboIds]);

  const comboOriginalPrice = useMemo(() => {
    return allComboItems
      .filter((item) => checkedComboIds.includes(item.id))
      .reduce((sum, item) => sum + (item.originalPrice || Math.round(item.price * 1.28)), 0);
  }, [allComboItems, checkedComboIds]);

  const handleAddComboToCart = () => {
    if (!getAccessToken()) {
      toast.error("Please login first to add items to your cart.");
      return;
    }
    const itemsToAdd = allComboItems.filter((item) => checkedComboIds.includes(item.id));
    if (itemsToAdd.length === 0) {
      toast.error("Please check at least one item to add to cart");
      return;
    }
    itemsToAdd.forEach((item) => addItem(item, 1));
    toast.success(`Added ${itemsToAdd.length} combo items to your cart!`, {
      description: `Total: ${formatCurrency(comboTotalPrice)}`,
    });
    openCart();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-3 py-5 sm:space-y-12 sm:px-6 sm:py-8 lg:px-8">
      {/* Breadcrumb Navigation */}
      <nav className="mobile-scrollbar-none flex items-center gap-2 overflow-x-auto text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/#products" className="hover:text-foreground transition-colors">
          {product.category}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-foreground line-clamp-1">
          {product.name}
        </span>
      </nav>

      {/* Main Product Section: Gallery & Details */}
      <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-10">
        {/* Left Column: Multi-Image Gallery */}
        <div className="space-y-4">
          <div className="flex flex-col-reverse items-start gap-3 sm:flex-row sm:gap-4">
            {/* Thumbnail Strip (Positioned on the Left Side of Main Image) */}
            {galleryImages.length > 1 && (
              <div className="mobile-scrollbar-none flex w-full shrink-0 items-center gap-2 overflow-x-auto pb-1 sm:w-auto sm:flex-col sm:gap-3 sm:overflow-y-auto sm:pb-0">
                {galleryImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    onMouseEnter={() => setActiveImageIndex(idx)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:h-20 sm:w-20 sm:rounded-xl ${
                      activeImageIndex === idx
                        ? "border-primary ring-2 ring-primary/20 scale-95 shadow-md"
                        : "border-muted opacity-70 hover:opacity-100 hover:scale-105"
                    }`}
                  >
                    <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image Column with Aligned Delivery & Trust Cards */}
            <div className="flex-1 space-y-4 w-full">
              {/* Primary High-Res Preview (Click to Open Lightbox Zoom Modal) */}
              <div
                onClick={() => {
                  if (!activeImage) return;
                  setLightboxIndex(activeImageIndex);
                  setZoomLevel(1);
                  setLightboxOpen(true);
                }}
                className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border bg-slate-950 shadow-sm group sm:rounded-2xl ${
                  activeImage ? "cursor-zoom-in" : "cursor-default"
                }`}
              >
                {activeImage ? (
                  <img
                    src={activeImage}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <ImageIconLucide className="h-10 w-10" />
                    <span className="text-xs font-medium">Image unavailable</span>
                  </div>
                )}

                {/* Click to Zoom Hover Overlay Badge */}
                {activeImage && <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 text-white text-xs font-bold backdrop-blur-md shadow-lg border border-white/20">
                    <ZoomIn className="h-4 w-4 text-amber-400" /> Click to Zoom
                  </span>
                </div>}

                {product.stock > 0 && product.stock <= 15 && (
                  <Badge className="absolute top-4 left-4 bg-amber-500 text-white font-bold text-xs">
                    Low Stock — Only {product.stock} left
                  </Badge>
                )}
              </div>

              {/* Pincode Delivery Availability & Estimated Delivery Checker (Matched Width) */}
              <div className="rounded-xl border bg-muted/30 p-3 space-y-2 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex min-w-0 items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> Delivery & Pincode Availability
                  </label>
                  {checkedPincode && !pincodeError && (
                    <Badge variant="outline" className="text-[9px] py-0 px-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold">
                      ✓ Serviceable Area
                    </Badge>
                  )}
                </div>

                <form onSubmit={handleCheckPincode} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit Pincode..."
                      value={pincode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setPincode(val);
                        if (pincodeError) setPincodeError("");
                      }}
                      className="pl-8 h-8 text-xs font-mono bg-background"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    variant="default"
                    disabled={isCheckingPincode}
                    className="h-8 px-3 text-xs font-bold shrink-0"
                  >
                    {isCheckingPincode ? "Checking..." : "Check"}
                  </Button>
                </form>

                {pincodeError && (
                  <p className="text-[10px] text-destructive font-medium">{pincodeError}</p>
                )}

                {checkedPincode && !pincodeError && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-background border">
                      <div className="flex items-center gap-2 min-w-0">
                        <Truck className="h-3.5 w-3.5 text-primary shrink-0" />
                        <div className="min-w-0">
                          <span className="font-bold text-foreground text-[11px] block leading-tight truncate">Standard Delivery</span>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] shrink-0 ml-1">
                        By {deliveryEstimates.standard}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-2 min-w-0">
                        <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
                        <div className="min-w-0">
                          <span className="font-bold text-foreground text-[11px] block leading-tight truncate">Express Delivery</span>
                        </div>
                      </div>
                      <span className="font-bold text-amber-600 dark:text-amber-400 text-[11px] shrink-0 ml-1">
                        By {deliveryEstimates.express}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Product Info & Purchase Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-primary/10 text-primary border-primary/20">
                {product.category}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                SKU: {product.sku}
              </span>
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 ml-1">
                  {product.tags.map((tag) => (
                    <span key={tag} className="text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {product.name}
            </h1>

            {/* Rating Stars & Review Count */}
            <button
              type="button"
              onClick={showReviews}
              className="flex flex-wrap items-center gap-2 rounded-sm pt-1 text-left hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`View ${reviewsList.length} customer reviews`}
            >
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(product.rating ?? 4.8)
                        ? "fill-current"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-foreground">
                {product.rating ?? 4.8}
              </span>
              <span className="text-xs text-muted-foreground">
                ({reviewsList.length} customer reviews)
              </span>
            </button>
          </div>

          {/* Prominent Price & Discount Display */}
          {(() => {
            const mrp = product.originalPrice || Math.round(product.price * 1.28);
            const savings = mrp - product.price;
            const discountPercent = Math.round((savings / mrp) * 100);

            return (
              <div className="space-y-1 pt-2">
                <div className="flex flex-wrap items-baseline gap-3">
                  {/* Large Prominent Selling Price */}
                  <span className="text-3xl font-black tracking-tight text-foreground sm:text-5xl">
                    {formatCurrency(product.price)}
                  </span>

                  {/* MRP Strikethrough Price */}
                  <span className="text-lg sm:text-xl line-through text-muted-foreground font-semibold">
                    {formatCurrency(mrp)}
                  </span>

                  {/* Discount % Badge */}
                  <Badge className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-extrabold text-xs px-2.5 py-1">
                    {discountPercent}% OFF
                  </Badge>
                </div>

                {/* Savings & Stock Status */}
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Save {formatCurrency(savings)} & {discountPercent}% OFF
                  </span>
                  <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                    In Stock · Ready to Ship
                  </Badge>
                </div>
              </div>
            );
          })()}

          <p className="text-sm text-muted-foreground leading-relaxed">
            {product.description}
          </p>

          <Separator />

          {/* Color Variant Selector */}
          {product.colors && product.colors.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                Color Variant: <span className="text-primary">{selectedColor}</span>
              </label>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((color, idx) => {
                  const isSelected = selectedColor === color.name;
                  const handleSelectColor = () => {
                    setSelectedColor(color.name);
                    if (galleryImages.length > idx) {
                      setActiveImageIndex(idx % galleryImages.length);
                    }
                  };
                  return (
                    <button
                      key={color.name}
                      onClick={handleSelectColor}
                      onMouseEnter={handleSelectColor}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 font-bold text-primary ring-1 ring-primary"
                          : "border-muted hover:border-primary/50 text-muted-foreground"
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-black/20"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span>{color.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size / Option Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                Size / Storage Option: <span className="text-primary">{selectedSize}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-lg border text-xs font-semibold transition-all ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-muted hover:border-primary/50 text-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity & Action Buttons */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center sm:gap-4">
              <div className="flex items-center border rounded-xl p-1 bg-background">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted text-foreground transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-bold font-mono text-sm">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted text-foreground transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="min-w-0 space-y-0.5">
                <div className="flex items-baseline gap-1 text-sm text-muted-foreground">
                  <span>Total:</span>
                  <span className="text-xl font-extrabold text-foreground tracking-tight">
                    {formatCurrency(product.price * quantity)}
                  </span>
                </div>
                {/* Sold By Info (Below Total Price) */}
                <div className="text-xs text-muted-foreground font-medium">
                  Sold by: <strong className="text-foreground font-semibold">Official Store</strong> (Verified Seller)
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                size="lg"
                variant="outline"
                className="h-12 text-base font-semibold border-primary/50 hover:bg-primary/5"
                onClick={handleAddToCart}
              >
                <ShoppingBag className="mr-2 h-5 w-5 text-primary" /> Add to Cart
              </Button>

              <Button
                size="lg"
                className="h-12 text-base font-semibold shadow-lg"
                onClick={handleBuyNow}
              >
                Buy Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Width Product Highlights & Guarantees Section */}
      <div className="rounded-xl border bg-muted/20 p-3 shadow-xs sm:rounded-2xl sm:p-5">
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-3 sm:gap-4 sm:divide-x sm:divide-y-0 lg:grid-cols-6">
          {/* Free Shipping */}
          <div className="flex flex-col items-center gap-1.5 p-2">
            <Truck className="h-6 w-6 text-primary" />
            <span className="text-xs font-bold text-foreground">Free Shipping</span>
            <span className="text-[11px] text-muted-foreground">Orders over ₹500</span>
          </div>

          {/* Cash on Delivery */}
          <div className="flex flex-col items-center gap-1.5 p-2 pt-4 sm:pt-2">
            <Banknote className={`h-6 w-6 ${product.codAvailable !== false ? "text-emerald-500" : "text-muted-foreground"}`} />
            <span className="text-xs font-bold text-foreground">Cash on Delivery</span>
            <span className={`text-[11px] ${product.codAvailable !== false ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground line-through"}`}>
              {product.codAvailable !== false ? "Doorstep COD Available" : "Online Payment Only"}
            </span>
          </div>

          {/* 7 Days Easy Return */}
          <div className="flex flex-col items-center gap-1.5 p-2 pt-4 sm:pt-2">
            <RotateCcw className={`h-6 w-6 ${product.returnAvailable !== false ? "text-primary" : "text-muted-foreground"}`} />
            <span className="text-xs font-bold text-foreground">7 Days Easy Return</span>
            <span className={`text-[11px] ${product.returnAvailable !== false ? "text-muted-foreground" : "text-rose-500 font-semibold"}`}>
              {product.returnAvailable !== false ? "100% Refund Window" : "Non-Returnable Item"}
            </span>
          </div>

          {/* Product Exchange */}
          <div className="flex flex-col items-center gap-1.5 p-2 pt-4 lg:pt-2">
            <RefreshCw className={`h-6 w-6 ${product.exchangeAvailable !== false ? "text-amber-500" : "text-muted-foreground"}`} />
            <span className="text-xs font-bold text-foreground">Product Exchange</span>
            <span className={`text-[11px] ${product.exchangeAvailable !== false ? "text-muted-foreground" : "text-muted-foreground line-through"}`}>
              {product.exchangeAvailable !== false ? "Size / Variant Exchange" : "No Exchange Offered"}
            </span>
          </div>

          {/* Product Replacement */}
          <div className="flex flex-col items-center gap-1.5 p-2 pt-4 lg:pt-2">
            <ShieldCheck className={`h-6 w-6 ${product.replacementAvailable !== false ? "text-indigo-500" : "text-muted-foreground"}`} />
            <span className="text-xs font-bold text-foreground">Defect Replacement</span>
            <span className={`text-[11px] ${product.replacementAvailable !== false ? "text-muted-foreground" : "text-muted-foreground line-through"}`}>
              {product.replacementAvailable !== false ? "Damage / Defect Covered" : "Standard Brand Policy"}
            </span>
          </div>

          {/* Secure Transaction */}
          <div className="flex flex-col items-center gap-1.5 p-2 pt-4 lg:pt-2 col-span-2 sm:col-span-1">
            <Lock className="h-6 w-6 text-slate-700 dark:text-slate-300" />
            <span className="text-xs font-bold text-foreground">Secure Checkout</span>
            <span className="text-[11px] text-muted-foreground">256-Bit SSL Encrypted</span>
          </div>
        </div>
      </div>

      {/* Middle Tabbed Specifications & Customer Reviews */}
      <div id="customer-reviews" className="space-y-6 pt-6 border-t scroll-mt-24">
        <div className="mobile-scrollbar-none flex items-center gap-4 overflow-x-auto border-b pb-3">
          <button
            onClick={() => setActiveTab("features")}
            className={`shrink-0 border-b-2 pb-2 text-sm font-bold transition-all ${
              activeTab === "features"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            About Product
          </button>

          <button
            onClick={() => setActiveTab("specs")}
            className={`shrink-0 border-b-2 pb-2 text-sm font-bold transition-all ${
              activeTab === "specs"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Additional Information
          </button>

          <button
            onClick={() => setActiveTab("reviews")}
            className={`shrink-0 border-b-2 pb-2 text-sm font-bold transition-all ${
              activeTab === "reviews"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Customer Reviews ({reviewsList.length})
          </button>
        </div>

        {/* Tab 1: About Product (Dynamic Configured Sections Layout) */}
        {activeTab === "features" && (
          <div className="space-y-10">
            {((product.aboutSections && product.aboutSections.length > 0)
              ? product.aboutSections
              : defaultAboutSections
            )
              .filter((sec: AboutProductSection) => sec.active !== false)
              .map((section: AboutProductSection) => {
                switch (section.type) {
                  case "about-text":
                    return (
                      <div key={section.id} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-2 space-y-4">
                          <div className="space-y-1">
                            <h3 className="text-2xl font-extrabold text-foreground tracking-tight">
                              {section.content.heading || `Designed for Excellence. Engineered for ${product.name}.`}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {section.content.description1 || `${product.description} Built with meticulous attention to detail, ${product.name} delivers an uncompromised blend of cutting-edge technology, ergonomic comfort, and enduring durability.`}
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {section.content.description2 || `Whether working from home, commuting across the city, or pursuing active goals, ${product.name} offers peak performance with zero friction.`}
                          </p>
                        </div>
                      </div>
                    );

                  case "highlights":
                    return (
                      <div key={section.id} className="space-y-4 pt-4 border-t">
                        <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-amber-500" /> {section.title}
                        </h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {(section.content.items && section.content.items.length > 0
                            ? section.content.items
                            : [
                                { title: "Next-Gen Speed & Ultra-Low Latency", description: "Engineered with ultra-responsive architecture for instant performance, crystal-clear audio, and zero lag." },
                                { title: "Aerospace-Grade Durability & Finish", description: "Crafted with premium scratch-resistant aluminum & beryllium materials tested for long-lasting daily wear." },
                                { title: "All-Day Battery Life & USB-C Quick Charge", description: "Intelligent power management delivers 35+ hours continuous usage with 10-minute quick charge boost." },
                                { title: "Precision Ergonomics & Breathable Ear Cushions", description: "Biomechanically contoured headband and memory foam ear pads for fatigue-free comfort during extended work sessions." },
                              ]
                          ).map((item: { title?: string; description?: string }, idx: number) => (
                            <li key={idx} className="flex items-start gap-3 p-3.5 rounded-xl border bg-muted/20 hover:border-primary/30 transition-all">
                              <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 font-bold">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <span className="font-bold text-foreground block text-xs">{item.title}</span>
                                {item.description && <span className="text-muted-foreground leading-relaxed block pt-0.5">{item.description}</span>}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );

                  case "banner":
                    return (
                      <div key={section.id} className="relative overflow-hidden rounded-3xl border shadow-md group">
                        <img
                          src={section.content.bannerImage || "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1200"}
                          alt="Product Showcase Banner"
                          className="w-full h-64 sm:h-80 object-cover group-hover:scale-102 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-6 sm:p-10 space-y-2 text-white">
                          <Badge className="w-max bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider">
                            {section.content.bannerBadge || "★ Metromindz Flagship Series"}
                          </Badge>
                          <h3 className="text-xl sm:text-3xl font-black tracking-tight">
                            {section.content.bannerTitle || "Experience Unrivaled Craftsmanship & Performance"}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                            {section.content.bannerSubtitle || `Every aspect of ${product.name} is engineered to elevate your daily experience with unmatched precision and style.`}
                          </p>
                        </div>
                      </div>
                    );

                  case "showcase": {
                    const showcaseItems = section.content.items && section.content.items.length > 0 ? section.content.items : [
                      { title: "Laser-Etched Precision & Matte Finish", description: "Refined tactile finishes and premium smudge-resistant coating.", badge: "Craftsmanship", image: galleryImages[0] || product.image },
                      { title: "Seamless Multi-Device Instant Sync", description: "Instant 1-tap connection across laptops, smartphones, and tablet ecosystems.", badge: "Connectivity", image: galleryImages[1] || galleryImages[0] || product.image },
                      { title: "Smart Environmental ANC & Transparency Mode", description: "Adaptive dual-microphone noise suppression isolates external chatter.", badge: "Acoustics", image: galleryImages[2] || galleryImages[0] || product.image },
                    ];
                    const currentSlide = showcaseItems[showcaseSlideIndex % showcaseItems.length];

                    return (
                      <div key={section.id} className="space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                            <Maximize2 className="h-4 w-4 text-primary" /> {section.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-mono text-muted-foreground mr-1">
                              {String((showcaseSlideIndex % showcaseItems.length) + 1).padStart(2, "0")} / {String(showcaseItems.length).padStart(2, "0")}
                            </span>
                            <Button size="icon" variant="outline" onClick={() => setShowcaseSlideIndex((prev) => (prev === 0 ? showcaseItems.length - 1 : prev - 1))} className="h-8 w-8 rounded-full">
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="outline" onClick={() => setShowcaseSlideIndex((prev) => (prev === showcaseItems.length - 1 ? 0 : prev + 1))} className="h-8 w-8 rounded-full">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="relative overflow-hidden rounded-3xl border shadow-md bg-slate-950 text-white min-h-[300px] sm:min-h-[360px] flex flex-col justify-end group">
                          <img src={currentSlide.image || product.image} alt={currentSlide.title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-all duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                          <div className="relative z-10 p-6 sm:p-8 space-y-2 max-w-2xl">
                            <Badge className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                              ★ {currentSlide.badge || "Feature"}
                            </Badge>
                            <h4 className="text-lg sm:text-2xl font-black tracking-tight leading-snug">{currentSlide.title}</h4>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{currentSlide.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  case "specs-summary":
                    return (
                      <div key={section.id} className="p-5 rounded-2xl bg-muted/20 border space-y-4 shadow-2xs">
                        <div className="flex items-center justify-between border-b pb-3">
                          <h4 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {section.title}
                          </h4>
                        </div>
                        <ul className="space-y-3 text-xs">
                          {(section.content.items && section.content.items.length > 0 ? section.content.items : product.features?.map((f: string) => ({ title: f })) || []).map((item: { title?: string }, i: number) => (
                            <li key={i} className="flex items-start gap-2.5 p-2 rounded-xl bg-background border hover:border-primary/30 transition-all">
                              <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="h-3 w-3" />
                              </div>
                              <span className="font-semibold text-foreground leading-snug">{item.title}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );

                  case "whats-in-box":
                    return (
                      <div key={section.id} className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-4 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                          <h4 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                            <PackageCheck className="h-4 w-4 text-amber-500" /> {section.title}
                          </h4>
                          <Badge className="bg-amber-500 text-slate-950 text-[10px] font-bold">
                            Retail Packaging
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          {(section.content.items || [
                            { title: `${product.name} Master Unit`, subtitle: "Main Device", qty: "1×" },
                            { title: "USB-C Fast Cable", subtitle: "High-Speed Sync & Charge", qty: "1×" },
                            { title: "Warranty Registration Card", subtitle: "1-Year Official Seal", qty: "1×" },
                            { title: "Quick Setup Manual", subtitle: "User Safety Guide", qty: "1×" },
                          ]).map((boxItem: { title?: string; subtitle?: string; qty?: string }, i: number) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-background border shadow-2xs">
                              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 font-bold">
                                {boxItem.qty || "1×"}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-foreground block text-xs truncate">{boxItem.title}</span>
                                {boxItem.subtitle && <span className="text-[10px] text-muted-foreground block">{boxItem.subtitle}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );

                  default:
                    return null;
                }
              })}
          </div>
        )}

        {/* Tab 2: Technical Specifications / More Information Accordion */}
        {activeTab === "specs" && (
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Additional Product Information</h3>
            </div>

            <Accordion
              type="multiple"
              defaultValue={
                product.additionalInfoSections && product.additionalInfoSections.length > 0
                  ? product.additionalInfoSections.map((s) => s.id)
                  : ["general-info", "tech-specs", "logistics"]
              }
              className="w-full space-y-3"
            >
              {(product.additionalInfoSections && product.additionalInfoSections.length > 0
                ? product.additionalInfoSections
                : defaultAdditionalInfo(product)
              ).map((section: AdditionalInfoSection) => (
                <AccordionItem key={section.id} value={section.id} className="border rounded-xl px-4 bg-background shadow-2xs">
                  <AccordionTrigger className="hover:no-underline font-bold text-sm">
                    <span>{section.title}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4">
                    <div className="divide-y rounded-lg border overflow-hidden">
                      {section.items.map((item, idx) => {
                        const isSkuRow = idx === 0 && section.id === "general-info";
                        return (
                          <div
                            key={idx}
                            className={`grid grid-cols-3 p-3 text-xs ${
                              isSkuRow
                                ? "bg-amber-500/10 dark:bg-amber-500/5"
                                : idx % 2 === 0
                                ? "bg-muted/20"
                                : "bg-background"
                            }`}
                          >
                            <span className={`font-semibold ${isSkuRow ? "text-foreground" : "text-muted-foreground"}`}>
                              {item.key}
                            </span>
                            <span className={`col-span-2 ${
                              isSkuRow
                                ? "font-mono font-bold text-amber-600 dark:text-amber-400"
                                : "font-semibold text-foreground"
                            }`}>
                              {item.value}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}

        {/* Tab 3: Customer Reviews (Rich UI with Avatars, Photos, Videos & Rating Breakdown) */}
        {activeTab === "reviews" && (
          <div className="max-w-4xl space-y-8">
            {/* Rating Breakdown & Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl border bg-muted/20 items-center">
              <div className="flex flex-col items-center justify-center text-center p-4 border-r-0 md:border-r space-y-2">
                <span className="text-4xl font-extrabold text-foreground tracking-tight">
                  {product.rating ?? 4.9}
                </span>
                <div className="flex items-center text-amber-400 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground font-semibold">
                  Based on {reviewsList.length * 14 + 8} verified ratings
                </span>
              </div>

              {/* 5-Star Breakdown Progress Bars */}
              <div className="space-y-2 text-xs">
                {[
                  { star: 5, pct: 82 },
                  { star: 4, pct: 14 },
                  { star: 3, pct: 3 },
                  { star: 2, pct: 1 },
                  { star: 1, pct: 0 },
                ].map((row) => (
                  <div key={row.star} className="flex items-center gap-2">
                    <span className="w-8 text-right font-bold text-muted-foreground">{row.star} ★</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                    <span className="w-9 text-xs text-muted-foreground font-mono">{row.pct}%</span>
                  </div>
                ))}
              </div>

              {/* Write Review Action Box */}
              <div className="flex flex-col items-center justify-center text-center p-4 border-l-0 md:border-l space-y-3">
                <MessageSquare className="h-8 w-8 text-primary" />
                <div>
                  <h4 className="font-bold text-sm text-foreground">Have you used this product?</h4>
                  <p className="text-xs text-muted-foreground">Share your experience with the community.</p>
                </div>
                <Button
                  onClick={() => {
                    if (!getAccessToken()) {
                      toast.error("Please sign in to review products you have purchased.");
                      return;
                    }
                    if (!canReviewProduct) {
                      toast.error("You can review this product after your delivered order is completed.");
                      return;
                    }
                    setOpenAddReviewModal(true);
                  }}
                  className="w-full text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs"
                >
                  {canReviewProduct ? "Write a Customer Review" : "Review after delivery"}
                </Button>
              </div>
            </div>

            {/* Review Filter & Search Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border bg-muted/20 shadow-2xs">
              {/* Star Rating Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 mr-1">
                  <Filter className="h-3.5 w-3.5 text-primary" /> Filter Rating:
                </span>

                <button
                  onClick={() => setReviewRatingFilter("all")}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
                    reviewRatingFilter === "all"
                      ? "bg-amber-500 text-slate-950 border-amber-500 shadow-xs"
                      : "bg-background hover:bg-muted text-muted-foreground"
                  }`}
                >
                  All ({reviewsList.length})
                </button>

                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviewsList.filter((r) => r.rating === star).length;
                  return (
                    <button
                      key={star}
                      onClick={() => setReviewRatingFilter(star)}
                      className={`px-2 py-1 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1 ${
                        reviewRatingFilter === star
                          ? "bg-amber-500 text-slate-950 border-amber-500 shadow-xs font-bold"
                          : "bg-background hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <span>{star}</span>
                      <Star className="h-3 w-3 fill-current text-amber-400" />
                      <span className="text-[10px] opacity-75">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2">
                <select
                  value={reviewSortBy}
                  onChange={(e) => setReviewSortBy(e.target.value as any)}
                  className="h-8 px-2.5 rounded-lg border bg-background text-xs font-bold text-foreground cursor-pointer"
                >
                  <option value="recent">⚡ Sort: Most Recent</option>
                  <option value="highest">★ Sort: Highest Rating</option>
                  <option value="lowest">★ Sort: Lowest Rating</option>
                </select>
              </div>
            </div>

            {/* Customer Reviews List */}
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> Customer Reviews & Photos ({filteredReviews.length})
                </h3>
                {filteredReviews.length < reviewsList.length && (
                  <button
                    onClick={() => {
                      setReviewRatingFilter("all");
                    }}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Clear Filters (Showing {filteredReviews.length} of {reviewsList.length})
                  </button>
                )}
              </div>

              {filteredReviews.length === 0 ? (
                <div className="p-8 text-center border rounded-2xl bg-muted/20 space-y-2">
                  <p className="text-sm font-bold text-foreground">No customer reviews match your selected filter.</p>
                  <button
                    onClick={() => {
                      setReviewRatingFilter("all");
                    }}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Reset Review Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((rev) => (
                    <Card key={rev.id} className="border shadow-xs hover:border-primary/30 transition-all">
                      <CardContent className="p-5 space-y-3">
                        {/* Author Header with Profile Avatar */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {rev.avatarUrl ? (
                              <img
                                src={rev.avatarUrl}
                                alt={rev.author}
                                className="h-10 w-10 rounded-full object-cover border-2 border-primary/20 shrink-0"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-amber-500/20 text-amber-600 font-bold flex items-center justify-center text-sm border shrink-0">
                                {rev.author.charAt(0)}
                              </div>
                            )}

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-foreground">{rev.author}</span>
                                {rev.verifiedBuyer !== false && (
                                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold py-0 px-1.5 border-emerald-500/20">
                                    ✓ Verified Buyer
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 pt-0.5">
                                <div className="flex items-center text-amber-400">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3 w-3 ${
                                        i < rev.rating ? "fill-current" : "text-muted-foreground/30"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-[11px] text-muted-foreground">• {rev.date}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Title & Comment */}
                        {rev.title && (
                          <h4 className="font-bold text-sm text-foreground leading-snug">
                            {rev.title}
                          </h4>
                        )}
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          "{rev.comment}"
                        </p>

                        {/* Customer Attached Images & Videos Gallery */}
                        {((rev.images && rev.images.length > 0) || rev.videoUrl) && (
                          <div className="flex flex-wrap items-center gap-3 pt-2">
                            {/* Images */}
                            {rev.images?.map((img, imgIdx) => (
                              <button
                                key={imgIdx}
                                onClick={() => setReviewMediaModal({ type: "image", url: img, title: `${rev.author}'s Photo` })}
                                className="relative h-16 w-16 rounded-xl overflow-hidden border bg-muted group cursor-pointer shrink-0 hover:ring-2 ring-primary/50 transition-all"
                              >
                                <img src={img} alt="Customer Photo" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <ZoomIn className="h-4 w-4 text-white" />
                                </div>
                              </button>
                            ))}

                            {/* Video Review Thumbnail */}
                            {rev.videoUrl && (
                              <button
                                onClick={() => setReviewMediaModal({ type: "video", url: rev.videoUrl!, title: `${rev.author}'s Video Review` })}
                                className="relative h-16 w-24 rounded-xl overflow-hidden border bg-slate-950 group cursor-pointer shrink-0 hover:ring-2 ring-primary/50 transition-all flex items-center justify-center"
                              >
                                {rev.videoPoster && (
                                  <img src={rev.videoPoster} alt="Video Poster" className="h-full w-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" />
                                )}
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                  <div className="h-8 w-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <Play className="h-4 w-4 fill-current ml-0.5" />
                                  </div>
                                </div>
                                <Badge className="absolute bottom-1 right-1 text-[8px] py-0 px-1 bg-black/80 text-white font-mono">
                                  Video Review
                                </Badge>
                              </button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                ))}
              </div>
            )}
            </div>
          </div>
        )}
      </div>

      {/* Amazon-Style Frequently Bought Together / Combo Products Section */}
      {(product.comboDealAvailable ?? true) && comboDealsList.length > 0 && (
        <div className="space-y-6 pt-8 border-t">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                Frequently bought together
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bundle related items and save more with special combo deals.
              </p>
            </div>

            {/* Multiple Combo Deal Selection Pills (If > 1 deal) */}
            {comboDealsList.length > 1 && (
              <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border">
                {comboDealsList.map((deal, idx) => (
                  <button
                    key={deal.id || idx}
                    type="button"
                    onClick={() => setActiveComboDealIdx(idx)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      activeComboDealIdx === idx
                        ? "bg-amber-500 text-slate-950 shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {deal.title || `Combo Deal ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-background p-3 shadow-xs sm:rounded-2xl sm:p-6">
            <div className="flex flex-col items-stretch justify-start gap-4 lg:flex-row lg:items-start lg:gap-8">
              {/* Left Items Row with Plus signs */}
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                {allComboItems.map((item, idx) => {
                  const isChecked = checkedComboIds.includes(item.id);
                  const isCurrentProduct = item.id === product.id;
                  const mrp = item.originalPrice || Math.round(item.price * 1.28);

                  return (
                    <div key={item.id} className="flex items-center gap-3 sm:gap-4">
                      {/* Item Card */}
                      <div
                        className={`flex w-36 shrink-0 flex-col gap-2 rounded-xl border bg-slate-50/60 p-2.5 transition-all dark:bg-slate-900/60 sm:w-52 sm:gap-2.5 sm:rounded-2xl sm:p-3.5 ${
                          isChecked
                            ? "border-amber-500/60 ring-1 ring-amber-500/20 shadow-xs"
                            : "opacity-60 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        <div className="relative aspect-square overflow-hidden rounded-xl bg-background border">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute top-2 left-2 z-10 bg-background/90 backdrop-blur-md p-1 rounded-md border shadow-2xs">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleComboChecked(item.id)}
                              className="h-4 w-4 rounded accent-amber-500 cursor-pointer block"
                            />
                          </div>
                          {isCurrentProduct && (
                            <Badge className="absolute top-2 right-2 bg-amber-500 text-slate-950 text-[9px] font-extrabold shadow-2xs">
                              THIS ITEM
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="text-[10px] font-extrabold uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                            {isCurrentProduct ? "Primary Item" : item.category}
                          </div>
                          <Link href={`/products/${item.id}`}>
                            <h4 className="text-xs font-bold text-foreground line-clamp-2 hover:text-amber-600 transition-colors">
                              {item.name}
                            </h4>
                          </Link>
                          <div className="flex items-baseline gap-1.5 flex-wrap pt-0.5">
                            <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                              {formatCurrency(item.price)}
                            </span>
                            <span className="text-[11px] line-through text-muted-foreground font-medium">
                              {formatCurrency(mrp)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Plus separator icon */}
                      {idx < allComboItems.length - 1 && (
                        <div className="h-9 w-9 rounded-full bg-muted border flex items-center justify-center text-muted-foreground font-extrabold shrink-0 shadow-2xs">
                          <Plus className="h-4 w-4 text-amber-500" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Equal sign divider on desktop */}
              <div className="hidden lg:flex items-center justify-center self-center text-muted-foreground font-extrabold text-xl px-1">
                =
              </div>

              {/* Right Summary & Add to Cart Box */}
              <div className="flex w-full shrink-0 flex-col justify-between space-y-4 rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-background p-4 shadow-xs sm:rounded-2xl sm:p-5 lg:w-80">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-foreground">Combo Package Summary</span>
                    <Badge variant="outline" className="text-[9px] font-bold bg-background text-amber-600 border-amber-500/30">
                      {checkedComboIds.length} Item{checkedComboIds.length !== 1 ? "s" : ""} Checked
                    </Badge>
                  </div>

                  <Separator className="bg-amber-500/20" />

                  <div>
                    <div className="text-[11px] text-muted-foreground font-medium">Total Combined Price:</div>
                    <div className="flex items-baseline gap-2 flex-wrap mt-0.5">
                      <span className="text-2xl font-black text-foreground tracking-tight">
                        {formatCurrency(comboTotalPrice)}
                      </span>
                      {comboOriginalPrice > comboTotalPrice && (
                        <span className="text-xs line-through text-muted-foreground font-semibold">
                          {formatCurrency(comboOriginalPrice)}
                        </span>
                      )}
                    </div>
                    {comboOriginalPrice > comboTotalPrice && (
                      <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px]">
                        <Zap className="h-3 w-3 fill-current" />
                        Save {formatCurrency(comboOriginalPrice - comboTotalPrice)} with this Combo
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Button
                    onClick={handleAddComboToCart}
                    disabled={checkedComboIds.length === 0}
                    className="w-full h-11 font-extrabold text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-md shadow-amber-500/20 gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>
                      {checkedComboIds.length === 2
                        ? "Add both to Cart"
                        : `Add all ${checkedComboIds.length} to Cart`}
                    </span>
                  </Button>

                  <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                    <ShieldCheck className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Items dispatched together in single combo shipping.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* "Shop Similar Products" Slider Section */}
      <div className="space-y-4 pt-8 border-t">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Shop Similar Products
            </h2>
          </div>

          {/* Slider Navigation Arrow Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleScrollSimilar("left")}
              className="h-8 w-8 rounded-full border shadow-2xs hover:bg-muted cursor-pointer"
              aria-label="Scroll Similar Products Left"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleScrollSimilar("right")}
              className="h-8 w-8 rounded-full border shadow-2xs hover:bg-muted cursor-pointer"
              aria-label="Scroll Similar Products Right"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable Products Carousel Slider Track */}
        <div
          ref={similarSliderRef}
          onMouseEnter={() => setIsSimilarHovered(true)}
          onMouseLeave={() => setIsSimilarHovered(false)}
          className="flex items-stretch gap-4 overflow-x-auto scrollbar-none scroll-smooth pb-3 pt-1 -mx-2 px-2"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {similarProducts.map((sim) => {
            const mrp = sim.originalPrice || Math.round(sim.price * 1.28);
            const discountPercent = Math.round(((mrp - sim.price) / mrp) * 100);
            const isFav = isInWishlist(sim.id);

            return (
              <Card
                key={sim.id}
                className="group overflow-hidden border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between shrink-0 w-[220px] sm:w-[240px] snap-start"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-900">
                  <Link href={`/products/${sim.id}`}>
                    <img
                      src={sim.image}
                      alt={sim.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>
                  <Badge className="absolute top-2 right-2 bg-background/80 text-foreground backdrop-blur-md text-[10px] font-bold">
                    {sim.category}
                  </Badge>
                  {sim.rating && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-900 dark:text-slate-100 shadow-2xs">
                      <span className="text-emerald-600 dark:text-emerald-400">{sim.rating}</span>
                      <Star className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (!getAccessToken()) {
                        toast.error("Please login first to add items to your cart.");
                        return;
                      }
                      toggleWishlist(sim.id);
                      toast.success(isFav ? "Removed from Wishlist" : "Saved to Wishlist");
                    }}
                    className={`absolute top-2 left-2 h-7 w-7 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                      isFav
                        ? "bg-rose-500 text-white"
                        : "bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:text-rose-500"
                    }`}
                    title={isFav ? "Remove from Wishlist" : "Save to Wishlist"}
                  >
                    <Heart className={`h-3.5 w-3.5 ${isFav ? "fill-white" : ""}`} />
                  </button>
                </div>

                <CardContent className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <Link href={`/products/${sim.id}`}>
                      <h3 className="font-bold text-xs text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {sim.name}
                      </h3>
                    </Link>
                    <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
                      <span className="text-sm font-extrabold text-foreground">
                        {formatCurrency(sim.price)}
                      </span>
                      <span className="text-[10px] line-through text-muted-foreground font-medium">
                        {formatCurrency(mrp)}
                      </span>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        ({discountPercent}% OFF)
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="w-full h-8 text-xs font-semibold gap-1.5 mt-2 cursor-pointer"
                    onClick={() => {
                      if (!getAccessToken()) {
                        toast.error("Please login first to add items to your cart.");
                        return;
                      }
                      addItem(sim);
                      toast.success(`Added ${sim.name} to cart!`);
                    }}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" /> Add to Cart
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Related Products */}
      <div className="space-y-6 pt-8 border-t">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            You Might Also Like
          </h2>
          <Link href="/products" className="text-xs font-semibold text-primary hover:underline">
            View All Products →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {relatedProducts.map((rel) => {
            const mrp = rel.originalPrice || Math.round(rel.price * 1.28);
            const discountPercent = Math.round(((mrp - rel.price) / mrp) * 100);

            return (
              <Card key={rel.id} className="group overflow-hidden border shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <Link href={`/products/${rel.id}`}>
                  <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-900">
                    <img
                      src={rel.image}
                      alt={rel.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <Badge className="absolute top-2 right-2 bg-background/80 text-foreground backdrop-blur-md text-[10px]">
                      {rel.category}
                    </Badge>
                    {rel.rating && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-1.5 py-0.5 rounded-full text-[10px] font-bold text-slate-900 dark:text-slate-100">
                        <span className="text-emerald-600 dark:text-emerald-400">{rel.rating}</span>
                        <Star className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500" />
                      </div>
                    )}
                  </div>
                </Link>

                <CardContent className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <Link href={`/products/${rel.id}`}>
                      <h3 className="font-bold text-xs text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {rel.name}
                      </h3>
                    </Link>
                    <div className="flex items-baseline gap-1 mt-1 flex-wrap">
                      <span className="text-sm font-extrabold text-foreground">
                        {formatCurrency(rel.price)}
                      </span>
                      <span className="text-[10px] line-through text-muted-foreground font-medium">
                        {formatCurrency(mrp)}
                      </span>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        ({discountPercent}% OFF)
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="w-full h-8 text-xs font-semibold gap-1 mt-2"
                    onClick={() => {
                      if (!getAccessToken()) {
                        toast.error("Please login first to add items to your cart.");
                        return;
                      }
                      addItem(rel);
                      toast.success(`Added ${rel.name} to cart!`);
                    }}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" /> Add to Cart
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Lightbox Image Zoom Popup Modal */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-4xl p-0 overflow-hidden bg-slate-950/95 border-slate-800 text-white backdrop-blur-xl sm:w-[90vw]">
          <DialogHeader className="p-4 border-b border-slate-800/80 flex flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Maximize2 className="h-4 w-4 text-amber-500" />
              <span>{product.name}</span>
              <span className="text-xs font-normal text-slate-400">
                ({lightboxIndex + 1} of {galleryImages.length})
              </span>
            </DialogTitle>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2 pr-6">
              <span className="text-xs font-mono font-bold text-amber-400 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded">
                {Math.round(zoomLevel * 100)}%
              </span>

              {/* Zoom Out Button */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200"
                onClick={() => setZoomLevel((prev) => Math.max(1, prev - 0.5))}
                disabled={zoomLevel <= 1}
                title="Zoom Out (-)"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>

              {/* Zoom In Button */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200"
                onClick={() => setZoomLevel((prev) => Math.min(3.5, prev + 0.5))}
                disabled={zoomLevel >= 3.5}
                title="Zoom In (+)"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>

              {/* Reset Zoom Button */}
              {zoomLevel > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-slate-400 hover:text-white"
                  onClick={() => setZoomLevel(1)}
                >
                  Reset
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Main Zoom Display Stage */}
          <div className="relative h-[65vh] w-full flex items-center justify-center overflow-auto bg-black/60 p-4 select-none">
            <img
              src={galleryImages[lightboxIndex]}
              alt={product.name}
              className="max-h-full max-w-full object-contain transition-transform duration-200 ease-out"
              style={{ transform: `scale(${zoomLevel})` }}
            />

            {/* Prev Image Button */}
            {galleryImages.length > 1 && (
              <button
                onClick={() => {
                  setLightboxIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
                  setZoomLevel(1);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 transition-all hover:scale-110"
                title="Previous Image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {/* Next Image Button */}
            {galleryImages.length > 1 && (
              <button
                onClick={() => {
                  setLightboxIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
                  setZoomLevel(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 transition-all hover:scale-110"
                title="Next Image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Lightbox Footer Thumbnail Strip */}
          {galleryImages.length > 1 && (
            <div className="p-3 border-t border-slate-800/80 bg-slate-950 flex items-center justify-center gap-3 overflow-x-auto">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setLightboxIndex(idx);
                    setZoomLevel(1);
                  }}
                  className={`h-14 w-14 rounded-lg overflow-hidden border-2 transition-all ${
                    lightboxIndex === idx
                      ? "border-amber-500 ring-2 ring-amber-500/30 scale-105"
                      : "border-slate-800 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Customer Review Media Lightbox Modal (For Customer Photos & Video Reviews) */}
      <Dialog open={Boolean(reviewMediaModal)} onOpenChange={(open) => !open && setReviewMediaModal(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-slate-950 text-white border-slate-800">
          <DialogHeader className="p-4 border-b border-slate-800 flex flex-row items-center justify-between">
            <DialogTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
              {reviewMediaModal?.type === "video" ? <Video className="h-4 w-4 text-amber-400" /> : <Camera className="h-4 w-4 text-emerald-400" />}
              {reviewMediaModal?.title || "Customer Review Media"}
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 flex items-center justify-center min-h-[350px] max-h-[70vh]">
            {reviewMediaModal?.type === "video" ? (
              <video
                src={reviewMediaModal.url}
                controls
                autoPlay
                className="max-h-[60vh] w-full rounded-xl object-contain bg-black"
              />
            ) : (
              <img
                src={reviewMediaModal?.url}
                alt="Customer Upload"
                className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-2xl"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Write a Customer Review Modal Dialog */}
      <Dialog open={openAddReviewModal} onOpenChange={setOpenAddReviewModal}>
        <DialogContent className="max-w-md space-y-4 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" /> Write a Customer Review
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddReviewSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-foreground block">Your Name *</label>
              <Input
                placeholder="e.g. Rahul Sharma"
                value={newReview.author}
                onChange={(e) => setNewReview({ ...newReview, author: e.target.value })}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground block">Overall Rating *</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                    className="p-1 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= newReview.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-amber-500 ml-2">{newReview.rating} / 5 Stars</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground block">Review Title / Headline</label>
              <Input
                placeholder="e.g. Excellent sound quality & fast shipping!"
                value={newReview.title}
                onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground block">Detailed Review *</label>
              <textarea
                rows={3}
                placeholder="What did you like or dislike about this product?"
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                required
                className="w-full p-2.5 rounded-lg border bg-background text-xs"
              />
            </div>

            {/* Attach Photos Section */}
            <div className="space-y-1.5 pt-1">
              <label className="font-bold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-emerald-500" /> Attach Product Unboxing Photos
                </span>
                <span className="text-[10px] text-muted-foreground">Optional</span>
              </label>
              <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/30 transition-colors bg-muted/10 text-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <Camera className="h-5 w-5 text-muted-foreground mb-1" />
                <span className="text-xs font-bold text-primary">Click to Upload Photos</span>
                <span className="text-[10px] text-muted-foreground">PNG, JPG, WEBP up to 10MB</span>
              </label>

              {/* Photo Previews */}
              {newReview.photos.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {newReview.photos.map((pUrl, idx) => (
                    <div key={idx} className="relative h-12 w-12 rounded-lg overflow-hidden border">
                      <img src={pUrl} alt="Preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setNewReview((prev) => ({
                            ...prev,
                            photos: prev.photos.filter((_, i) => i !== idx),
                          }))
                        }
                        className="absolute top-0 right-0 h-4 w-4 bg-black/70 text-white text-[10px] flex items-center justify-center rounded-bl"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attach Short Video Section */}
            <div className="space-y-1.5">
              <label className="font-bold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Video className="h-4 w-4 text-amber-500" /> Attach Short Video Review
                </span>
                <span className="text-[10px] text-muted-foreground">Optional</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-dashed cursor-pointer hover:bg-muted/30 transition-colors bg-muted/10">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <Video className="h-4 w-4 text-amber-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold block text-primary truncate">
                    {newReview.videoUrl ? "✓ Video Review Attached" : "Click to Upload Short Video"}
                  </span>
                  <span className="text-[10px] text-muted-foreground block truncate">MP4, MOV, WEBM up to 50MB</span>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setOpenAddReviewModal(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950">
                Submit Review
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
