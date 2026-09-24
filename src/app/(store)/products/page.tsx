"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useMemo, useEffect, Suspense } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  Star,
  Heart,
  ShoppingBag,
  X,
  Check,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, type Product } from "@/lib/mock-data";
import { useProducts } from "@/hooks/use-products";
import { useBrands } from "@/hooks/use-brands";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Fallback brand name when no brand is set (used before brands load)
function getFallbackBrand(product: Product): string {
  if (product.category === "Audio") return "boAt";
  if (product.category === "Electronics") return "NOISE";
  if (product.category === "Footwear") return "Nike";
  if (product.category === "Apparel") return "GOBOULT";
  if (product.category === "Bags") return "Wildcraft";
  return "";
}

// Helper color palette mapping
const availableColors = [
  { name: "Black", hex: "#0f172a" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "White", hex: "#f8fafc" },
  { name: "Brown", hex: "#78350f" },
  { name: "Red", hex: "#ef4444" },
  { name: "Green", hex: "#22c55e" },
];

type AudienceFilter = "All" | "Men" | "Women" | "Kids" | "Unisex";

const audienceOptions: Array<{ label: string; value: AudienceFilter }> = [
  { label: "All", value: "All" },
  { label: "Men", value: "Men" },
  { label: "Women", value: "Women" },
  { label: "Kids", value: "Kids" },
  { label: "Unisex", value: "Unisex" },
];

const audienceAliases: Record<AudienceFilter, string[]> = {
  All: ["all", "everyone"],
  Men: ["men", "mens", "male", "man"],
  Women: ["women", "womens", "female", "woman", "ladies", "lady"],
  Kids: ["kids", "kid", "children", "child", "boys", "boy", "girls", "girl"],
  Unisex: ["unisex", "universal"],
};

const categoryAliases: Record<string, string[]> = {
  Bags: ["Bags", "Bags & Luggage"],
  "Bags & Luggage": ["Bags", "Bags & Luggage"],
  Home: ["Home", "Home & Lifestyle"],
  "Home & Lifestyle": ["Home", "Home & Lifestyle"],
};

function normalizeAudience(value?: string | null): AudienceFilter {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return "All";
  if (audienceAliases.Men.includes(normalized)) return "Men";
  if (audienceAliases.Women.includes(normalized)) return "Women";
  if (audienceAliases.Kids.includes(normalized)) return "Kids";
  if (audienceAliases.Unisex.includes(normalized)) return "Unisex";
  return "All";
}

function productAudience(product: Product): AudienceFilter {
  return normalizeAudience(product.gender || "Unisex");
}

function matchesAudience(product: Product, audience: AudienceFilter) {
  if (audience === "All") return true;
  const productValue = productAudience(product);
  return productValue === audience || productValue === "Unisex";
}

function matchesCategory(product: Product, selectedCategory: string) {
  if (selectedCategory === "All") return true;
  const aliases = categoryAliases[selectedCategory] || [selectedCategory];
  return aliases.some((category) => product.category.toLowerCase() === category.toLowerCase());
}

function isAudienceSearch(query: string) {
  const normalized = query.trim().toLowerCase();
  return normalized.length > 0 && Object.values(audienceAliases).some((aliases) => aliases.includes(normalized));
}

function searchableProductText(product: Product, resolvedBrand?: string) {
  return [
    product.name,
    product.sku,
    resolvedBrand || product.brand,
    product.category,
    product.subCategory,
    product.description,
    product.gender,
    ...audienceAliases[productAudience(product)],
    ...(product.features || []),
    ...Object.entries(product.specs || {}).flatMap(([key, value]) => [key, value]),
    ...(product.tags || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

type SecondaryFilterConfig = {
  key: string;
  label: string;
  type: "checkbox" | "radio";
  options: string[];
};

// Dynamic Secondary Top Filters per Category
const categorySecondaryFilters: Record<string, SecondaryFilterConfig[]> = {
  Footwear: [
    { key: "Materials", label: "Materials", type: "checkbox", options: ["Canvas", "Leather", "Mesh", "PU", "Suede", "Synthetic", "Textile"] },
    { key: "Fastening", label: "Fastening", type: "checkbox", options: ["Lace-Up", "Slip-On", "Velcro", "Buckle"] },
    { key: "Cushioning", label: "Cushioning", type: "radio", options: ["Soft", "Medium", "High Responsive", "Firm"] },
    { key: "Arch Type", label: "Arch Type", type: "radio", options: ["Flat Arch", "Medium Arch", "High Arch"] },
    { key: "Cleats", label: "Cleats", type: "checkbox", options: ["Rubber Cleats", "Molded TPU", "Detachable"] },
    { key: "Country of Origin", label: "Country of Origin", type: "checkbox", options: ["India", "Vietnam", "Indonesia", "China"] },
    { key: "Bundles", label: "Bundles", type: "radio", options: ["Single Item", "Pack of 2", "Combo Set"] },
  ],
  Audio: [
    { key: "Connectivity", label: "Connectivity", type: "checkbox", options: ["Bluetooth 5.3", "Wired 3.5mm", "2.4GHz Wireless", "Type-C Audio"] },
    { key: "Noise Cancellation", label: "Noise Cancellation", type: "radio", options: ["Active (ANC)", "Environmental (ENC)", "Passive Noise Isolation"] },
    { key: "Battery Backup", label: "Battery Backup", type: "radio", options: ["Up to 20 Hours", "20 - 35 Hours", "35+ Hours"] },
    { key: "Driver Size", label: "Driver Size", type: "checkbox", options: ["40mm Beryllium", "12mm Dynamic", "10mm Neodymium"] },
    { key: "Water Resistance", label: "Water Resistance", type: "radio", options: ["IPX4 Splashproof", "IPX7 Waterproof", "Sweat Resistant"] },
  ],
  Apparel: [
    { key: "Fabric", label: "Fabric / Material", type: "checkbox", options: ["100% Cotton", "Polyester Blend", "Dry-Fit Mesh", "Fleece"] },
    { key: "Fit", label: "Fit Type", type: "radio", options: ["Regular Fit", "Slim Fit", "Oversized", "Athletic Fit"] },
    { key: "Neck Type", label: "Neck Type", type: "checkbox", options: ["Round Neck", "Polo Collar", "V-Neck", "Hooded"] },
    { key: "Sleeve", label: "Sleeve Length", type: "radio", options: ["Half Sleeve", "Full Sleeve", "Sleeveless"] },
    { key: "Pattern", label: "Pattern", type: "checkbox", options: ["Solid Color", "Graphic Print", "Striped", "Typography"] },
  ],
  Electronics: [
    { key: "Display", label: "Display Type", type: "checkbox", options: ["AMOLED", "Retina OLED", "IPS LCD", "HD Curved"] },
    { key: "Battery", label: "Battery Life", type: "radio", options: ["1-2 Days", "3-7 Days", "14+ Days Active"] },
    { key: "Waterproof", label: "Water Resistance", type: "radio", options: ["5 ATM Waterproof", "IP68 Rating", "Splash Proof"] },
    { key: "Compatibility", label: "OS Compatibility", type: "checkbox", options: ["iOS & Android", "Windows Compatible", "Universal"] },
  ],
  Bags: [
    { key: "Material", label: "Material", type: "checkbox", options: ["Nylon Canvas", "Genuine Leather", "Polyester", "Waterproof Canvas"] },
    { key: "Capacity", label: "Capacity (Liters)", type: "radio", options: ["Under 20L", "20L - 35L", "35L+ Travel"] },
    { key: "Laptop Compartment", label: "Laptop Sleeve", type: "radio", options: ["Fits 15.6 inch", "Fits 16 inch", "Fits 14 inch", "None"] },
  ],
  All: [
    { key: "Availability", label: "Availability", type: "checkbox", options: ["In Stock", "Express Dispatch", "On Sale"] },
    { key: "Rating", label: "Customer Rating", type: "radio", options: ["4 Stars & Above", "3.5 Stars & Above"] },
    { key: "Warranty", label: "Warranty", type: "radio", options: ["1 Year Brand Warranty", "2 Year Official Warranty"] },
    { key: "Shipping", label: "Shipping Policy", type: "checkbox", options: ["Free Delivery", "Cash on Delivery Eligible"] },
  ]
};

function ProductsContent() {
  const initialProducts = useProducts();
  const { resolveBrandName } = useBrands();
  const searchParams = useSearchParams();
  const { addItem, items: cartItems, openCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const managedSubCategories = useStore((s) => s.subCategories);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "All");
  const [selectedSubCategory, setSelectedSubCategory] = useState(searchParams.get("subcategory") || "All");
  const [selectedGender, setSelectedGender] = useState<AudienceFilter>(normalizeAudience(searchParams.get("gender") || searchParams.get("audience")));
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSecondaryFilters, setSelectedSecondaryFilters] = useState<Record<string, string[]>>({});
  const [openSecondaryDropdown, setOpenSecondaryDropdown] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState<string>("");
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [priceRange, setPriceRange] = useState<number>(10000);
  const [sortBy, setSortBy] = useState<string>("recommended");
  const [brandSearch, setBrandSearch] = useState<string>("");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync URL searchParams
  useEffect(() => {
    const cat = searchParams.get("category");
    setSelectedCategory(cat || "All");
    setSelectedSubCategory(searchParams.get("subcategory") || "All");
    const q = searchParams.get("search");
    setSearchQuery(q || "");
    const audience = searchParams.get("gender") || searchParams.get("audience");
    if (audience) setSelectedGender(normalizeAudience(audience));
  }, [searchParams]);

  const availableSubCategories = useMemo(() => {
    const names = new Set<string>();
    managedSubCategories.forEach((item) => {
      if (item.active && (selectedCategory === "All" || item.category.toLowerCase() === selectedCategory.toLowerCase())) names.add(item.title);
    });
    initialProducts.forEach((product) => {
      if (product.subCategory && (selectedCategory === "All" || matchesCategory(product, selectedCategory))) names.add(product.subCategory);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [initialProducts, managedSubCategories, selectedCategory]);

  // Dynamic Secondary Filters config based on selectedCategory + custom product specs
  const secondaryFiltersConfig = useMemo(() => {
    const baseConfig = categorySecondaryFilters[selectedCategory] || categorySecondaryFilters["All"];
    const baseKeys = new Set(baseConfig.map((c) => c.key));

    // Discover custom parameter keys from catalog products under current category
    const customSpecsMap: Record<string, Set<string>> = {};
    initialProducts.forEach((p) => {
      if (selectedCategory === "All" || p.category === selectedCategory) {
        if (p.specs) {
          Object.entries(p.specs).forEach(([k, v]) => {
            if (v && v.trim()) {
              if (!customSpecsMap[k]) customSpecsMap[k] = new Set();
              customSpecsMap[k].add(v.trim());
            }
          });
        }
      }
    });

    const dynamicCustomFilters: SecondaryFilterConfig[] = [];
    Object.entries(customSpecsMap).forEach(([specKey, valSet]) => {
      if (!baseKeys.has(specKey) && valSet.size > 0) {
        dynamicCustomFilters.push({
          key: specKey,
          label: specKey,
          type: "checkbox",
          options: Array.from(valSet),
        });
      }
    });

    return [...baseConfig, ...dynamicCustomFilters];
  }, [selectedCategory, initialProducts]);

  // Reset secondary filters when primary category changes
  useEffect(() => {
    setSelectedSecondaryFilters({});
    setOpenSecondaryDropdown(null);
  }, [selectedCategory]);

  function getResolvedBrand(product: Product): string {
    const resolved = resolveBrandName(product.brand);
    return resolved || getFallbackBrand(product);
  }

  // Extract all unique brands & counts
  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    initialProducts.forEach((p) => {
      const b = getResolvedBrand(p);
      if (b) counts[b] = (counts[b] || 0) + 1;
    });
    return counts;
  }, [initialProducts, resolveBrandName]);

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      // 1. Text Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const audienceQuery = normalizeAudience(searchQuery);
        const matchesSearch = isAudienceSearch(searchQuery)
          ? matchesAudience(product, audienceQuery)
          : searchableProductText(product, getResolvedBrand(product)).includes(query);
        if (!matchesSearch) return false;
      }

      // 2. Category Filter
      if (!matchesCategory(product, selectedCategory)) {
        return false;
      }

      if (selectedSubCategory !== "All" && product.subCategory?.toLowerCase() !== selectedSubCategory.toLowerCase()) {
        return false;
      }

      // 3. Gender Filter
      if (!matchesAudience(product, selectedGender)) {
        return false;
      }

      // 4. Brand Filter
      if (selectedBrands.length > 0) {
        const brand = getResolvedBrand(product);
        if (!selectedBrands.includes(brand)) return false;
      }

      // 5. Price Filter
      if (product.price > priceRange) {
        return false;
      }

      // 6. Color Filter
      if (selectedColors.length > 0) {
        if (!product.colors || product.colors.length === 0) return false;
        const hasColor = product.colors.some((c) =>
          selectedColors.some((sc) => c.name.toLowerCase().includes(sc.toLowerCase()))
        );
        if (!hasColor) return false;
      }

      // 7. Discount Filter
      const mrp = product.originalPrice || Math.round(product.price * 1.28);
      const discountPercent = Math.round(((mrp - product.price) / mrp) * 100);
      if (discountPercent < minDiscount) {
        return false;
      }

      // 8. Dynamic Secondary Filters (Checkboxes / Radio values)
      const activeSecondaryKeys = Object.keys(selectedSecondaryFilters).filter(
        (key) => selectedSecondaryFilters[key] && selectedSecondaryFilters[key].length > 0
      );

      if (activeSecondaryKeys.length > 0) {
        for (const key of activeSecondaryKeys) {
          const selectedVals = selectedSecondaryFilters[key];
          const productText = [
            product.name,
            product.description,
            product.category,
            product.subCategory,
            ...(product.features || []),
            ...Object.entries(product.specs || {}).flatMap(([k, v]) => [k, v]),
            ...(product.tags || [])
          ].join(" ").toLowerCase();

          const matchesAnyVal = selectedVals.some((val) =>
            productText.includes(val.toLowerCase())
          );

          if (!matchesAnyVal) return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const mrpA = a.originalPrice || Math.round(a.price * 1.28);
      const discA = Math.round(((mrpA - a.price) / mrpA) * 100);
      const mrpB = b.originalPrice || Math.round(b.price * 1.28);
      const discB = Math.round(((mrpB - b.price) / mrpB) * 100);

      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "discount":
          return discB - discA;
        case "newest":
          return b.id.localeCompare(a.id);
        default:
          return 0; // Recommended
      }
    });
  }, [
    searchQuery,
    selectedCategory,
    selectedSubCategory,
    selectedGender,
    selectedBrands,
    priceRange,
    selectedColors,
    minDiscount,
    selectedSecondaryFilters,
    sortBy,
    initialProducts,
  ]);

  // Extract category counts for the currently visible product set.
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProducts.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [filteredProducts]);

  // Toggle brand checkbox
  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  // Toggle color checkbox
  const toggleColor = (colorName: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorName) ? prev.filter((c) => c !== colorName) : [...prev, colorName]
    );
  };

  // Toggle secondary filter option
  const toggleSecondaryFilter = (key: string, option: string, type: "checkbox" | "radio") => {
    setSelectedSecondaryFilters((prev) => {
      const current = prev[key] || [];
      if (type === "radio") {
        return {
          ...prev,
          [key]: current.includes(option) ? [] : [option],
        };
      } else {
        const next = current.includes(option)
          ? current.filter((o) => o !== option)
          : [...current, option];
        return {
          ...prev,
          [key]: next,
        };
      }
    });
  };

  // Remove individual secondary filter tag
  const removeSecondaryFilterTag = (key: string, option: string) => {
    setSelectedSecondaryFilters((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((o) => o !== option),
    }));
  };

  // Clear all filters
  const resetFilters = () => {
    setSelectedCategory("All");
    setSelectedSubCategory("All");
    setSelectedGender("All");
    setSelectedBrands([]);
    setSelectedColors([]);
    setSelectedSecondaryFilters({});
    setOpenSecondaryDropdown(null);
    setMinDiscount(0);
    setPriceRange(10000);
    setSearchQuery("");
    setSortBy("recommended");
    toast.info("All filters cleared");
  };

  const hasActiveFilters =
    selectedCategory !== "All" ||
    selectedSubCategory !== "All" ||
    selectedGender !== "All" ||
    selectedBrands.length > 0 ||
    selectedColors.length > 0 ||
    Object.values(selectedSecondaryFilters).some((arr) => arr && arr.length > 0) ||
    minDiscount > 0 ||
    priceRange < 10000 ||
    searchQuery !== "";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
      <div className="mx-auto max-w-7xl space-y-4 px-3 pt-3 sm:px-6 sm:pt-4 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-primary transition-colors">
            Products
          </Link>
          {selectedCategory !== "All" && (
            <>
              <span>/</span>
              <span className="text-foreground font-semibold">{selectedCategory}</span>
            </>
          )}
        </nav>

        {/* Page Title & Total Item Count Header */}
        <div className="flex flex-col justify-between gap-3 border-b pb-2 sm:flex-row sm:items-center sm:pb-1">
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-baseline gap-2 text-lg font-extrabold tracking-tight text-foreground sm:text-2xl">
              {selectedCategory === "All" ? "All Products" : selectedCategory}
              <span className="text-sm font-normal text-muted-foreground">
                — {filteredProducts.length} items
              </span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Mobile Filter Toggle Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden flex items-center gap-2 text-xs font-semibold"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
              )}
            </Button>

            {/* Sort Dropdown */}
            <div className="group flex min-w-0 flex-1 items-stretch overflow-hidden rounded-lg border bg-background text-xs shadow-2xs transition-shadow focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15 sm:w-[15.5rem] sm:flex-none">
              <div className="flex items-center gap-1.5 border-r bg-muted/35 px-2.5 text-muted-foreground sm:px-3">
                <SlidersHorizontal className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span className="font-semibold">Sort</span>
              </div>
              <div className="relative min-w-0 flex-1">
                <label htmlFor="product-sort" className="sr-only">Sort products</label>
                <select
                  id="product-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-full w-full cursor-pointer appearance-none bg-transparent py-2 pl-2.5 pr-8 text-xs font-bold text-foreground outline-none sm:pl-3"
                >
                  <option value="recommended">Recommended</option>
                  <option value="newest">What&apos;s New</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                  <option value="discount">Better Discount</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground transition-transform group-focus-within:rotate-180" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        {availableSubCategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1" aria-label="Subcategory filters">
            <button type="button" onClick={() => setSelectedSubCategory("All")} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${selectedSubCategory === "All" ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-primary/50"}`}>All subcategories</button>
            {availableSubCategories.map((subCategory) => <button key={subCategory} type="button" onClick={() => setSelectedSubCategory(subCategory)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${selectedSubCategory === subCategory ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-primary/50"}`}>{subCategory}</button>)}
          </div>
        )}

        {/* Main Workspace Layout: Left Primary Sidebar + Right Content Area */}
        <div className="flex items-start gap-4 lg:gap-6">
          {/* ========================================================================= */}
          {/* LEFT SIDEBAR - PRIMARY FILTERS */}
          {/* ========================================================================= */}
          <aside
            className={`w-64 shrink-0 bg-background border rounded-xl p-4 shadow-xs space-y-6 ${
              mobileFilterOpen
                ? "fixed inset-y-0 left-0 z-50 w-[min(88vw,20rem)] overflow-y-auto rounded-none shadow-2xl"
                : "hidden lg:block sticky top-20"
            }`}
          >
            {/* Sidebar Header & Clear All */}
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="font-extrabold text-xs tracking-wider uppercase text-foreground flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-amber-500" /> FILTERS
              </span>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1 uppercase tracking-wider"
                >
                  <RotateCcw className="h-3 w-3" /> CLEAR ALL
                </button>
              )}
              {mobileFilterOpen && (
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground lg:hidden"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* 1. GENDER DEMOGRAPHIC (Radio Buttons) */}
            <div className="space-y-2.5 pb-4 border-b">
              <h3 className="text-xs font-extrabold uppercase text-slate-900 dark:text-slate-100 tracking-wider">
                Gender / Audience
              </h3>
              <div className="space-y-2 text-xs">
                {audienceOptions.map((option) => (
                  <label
                    key={option.label}
                    className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors text-slate-700 dark:text-slate-300 font-medium"
                  >
                    <input
                      type="radio"
                      name="gender"
                      checked={selectedGender === option.value}
                      onChange={() => setSelectedGender(option.value)}
                      className="accent-amber-500 cursor-pointer h-3.5 w-3.5"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 2. CATEGORIES (Searchable Checkboxes with Counts) */}
            <div className="space-y-2.5 pb-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase text-slate-900 dark:text-slate-100 tracking-wider">
                  CATEGORIES
                </h3>
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
              </div>

              <input
                type="text"
                placeholder="Search Category..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full h-7 px-2 text-xs border rounded-md bg-muted/30 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />

              <div className="space-y-2 text-xs max-h-52 overflow-y-auto pr-1">
                <label className="flex items-center justify-between cursor-pointer hover:text-primary font-medium text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedCategory === "All"}
                      onChange={() => setSelectedCategory("All")}
                      className="accent-amber-500 rounded cursor-pointer h-3.5 w-3.5"
                    />
                    <span>All Categories</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">({filteredProducts.length})</span>
                </label>
                {Object.entries(categoryCounts)
                  .filter(([cat]) => cat.toLowerCase().includes(categorySearch.toLowerCase()))
                  .map(([cat, count]) => (
                    <label
                      key={cat}
                      className="flex items-center justify-between cursor-pointer hover:text-primary font-medium text-slate-700 dark:text-slate-300"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedCategory === cat}
                          onChange={() => setSelectedCategory(selectedCategory === cat ? "All" : cat)}
                          className="accent-amber-500 rounded cursor-pointer h-3.5 w-3.5"
                        />
                        <span>{cat}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">({count})</span>
                    </label>
                  ))}
              </div>
            </div>

            {/* 3. BRAND (Search Input + Checkboxes with Counts) */}
            <div className="space-y-2.5 pb-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase text-slate-900 dark:text-slate-100 tracking-wider">
                  Brand
                </h3>
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="Search Brand..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="w-full h-7 px-2 text-xs border rounded-md bg-muted/30 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <div className="space-y-2 text-xs max-h-48 overflow-y-auto pr-1">
                {Object.entries(brandCounts)
                  .filter(([brand]) => brand.toLowerCase().includes(brandSearch.toLowerCase()))
                  .map(([brand, count]) => (
                    <label
                      key={brand}
                      className="flex items-center justify-between cursor-pointer hover:text-primary font-medium text-slate-700 dark:text-slate-300"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => toggleBrand(brand)}
                          className="accent-amber-500 rounded cursor-pointer h-3.5 w-3.5"
                        />
                        <span>{brand}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">({count})</span>
                    </label>
                  ))}
              </div>
            </div>

            {/* 4. PRICE RANGE SLIDER */}
            <div className="space-y-2.5 pb-4 border-b">
              <h3 className="text-xs font-extrabold uppercase text-slate-900 dark:text-slate-100 tracking-wider">
                Price Range
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span>₹100</span>
                  <span className="text-amber-600 dark:text-amber-400">{formatCurrency(priceRange)}+</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="10000"
                  step="100"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                />
              </div>
            </div>

            {/* 5. COLOR SELECTOR */}
            <div className="space-y-2.5 pb-4 border-b">
              <h3 className="text-xs font-extrabold uppercase text-slate-900 dark:text-slate-100 tracking-wider">
                Color
              </h3>
              <div className="space-y-2 text-xs">
                {availableColors.map((col) => (
                  <label
                    key={col.name}
                    className="flex items-center gap-2 cursor-pointer hover:text-primary font-medium text-slate-700 dark:text-slate-300"
                  >
                    <input
                      type="checkbox"
                      checked={selectedColors.includes(col.name)}
                      onChange={() => toggleColor(col.name)}
                      className="accent-amber-500 rounded cursor-pointer h-3.5 w-3.5"
                    />
                    <span
                      className="h-3 w-3 rounded-full border border-slate-300 dark:border-slate-700 inline-block shrink-0 shadow-xs"
                      style={{ backgroundColor: col.hex }}
                    />
                    <span>{col.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 6. DISCOUNT RANGE */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-extrabold uppercase text-slate-900 dark:text-slate-100 tracking-wider">
                Discount Range
              </h3>
              <div className="space-y-2 text-xs">
                {[0, 10, 20, 30, 50].map((disc) => (
                  <label
                    key={disc}
                    className="flex items-center gap-2 cursor-pointer hover:text-primary font-medium text-slate-700 dark:text-slate-300"
                  >
                    <input
                      type="radio"
                      name="discount"
                      checked={minDiscount === disc}
                      onChange={() => setMinDiscount(disc)}
                      className="accent-amber-500 cursor-pointer h-3.5 w-3.5"
                    />
                    <span>{disc === 0 ? "All Items" : `${disc}% and above`}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* ========================================================================= */}
          {/* RIGHT WORKSPACE: DYNAMIC TOP SECONDARY FILTERS BAR + PRODUCT GRID */}
          {/* ========================================================================= */}
          <main className="min-w-0 flex-1 space-y-4">
            {/* TOP DYNAMIC SECONDARY FILTERS BAR */}
            <div className="space-y-3 rounded-xl border bg-background p-2.5 shadow-xs sm:p-3">
              {/* Secondary Filter Pills Row */}
              <div className="mobile-scrollbar-none flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                {secondaryFiltersConfig.map((filter) => {
                  const selectedCount = (selectedSecondaryFilters[filter.key] || []).length;
                  const isOpen = openSecondaryDropdown === filter.key;

                  return (
                    <div key={filter.key} className="relative shrink-0 sm:shrink">
                      <button
                        type="button"
                        onClick={() => setOpenSecondaryDropdown(isOpen ? null : filter.key)}
                        className={`flex h-8 max-w-[72vw] items-center gap-1.5 rounded-full border px-3 text-xs font-bold shadow-2xs transition-all ${
                          selectedCount > 0
                            ? "bg-amber-500 text-slate-950 border-amber-500 font-extrabold"
                            : "bg-background border-slate-200 dark:border-slate-800 hover:border-slate-400 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span className="truncate">{filter.label}</span>
                        {selectedCount > 0 && (
                          <span className="h-4 w-4 rounded-full bg-slate-950 text-white text-[10px] flex items-center justify-center font-bold">
                            {selectedCount}
                          </span>
                        )}
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                      </button>

                      {/* Dropdown Popover Card */}
                      {isOpen && (
                        <div className="absolute left-0 top-full z-50 mt-2 w-[min(82vw,20rem)] space-y-2 rounded-xl border bg-background p-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 sm:min-w-[220px]">
                          <div className="flex items-center justify-between pb-1.5 border-b text-[11px] font-extrabold uppercase text-slate-500">
                            <span>Filter by {filter.label}</span>
                            <button
                              type="button"
                              onClick={() => setOpenSecondaryDropdown(null)}
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {filter.options.map((opt) => {
                              const isChecked = (selectedSecondaryFilters[filter.key] || []).includes(opt);

                              return (
                                <label
                                  key={opt}
                                  className="flex items-center gap-2 cursor-pointer text-xs font-medium hover:text-primary p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                  <input
                                    type={filter.type === "radio" ? "radio" : "checkbox"}
                                    name={`sec-${filter.key}`}
                                    checked={isChecked}
                                    onChange={() => toggleSecondaryFilter(filter.key, opt, filter.type)}
                                    className="accent-amber-500 rounded cursor-pointer h-3.5 w-3.5"
                                  />
                                  <span>{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ACTIVE FILTER REMOVABLE CHIPS ROW */}
              {hasActiveFilters && (
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t text-xs">
                  <span className="text-[11px] font-extrabold uppercase text-muted-foreground tracking-wider">
                    Applied Filters:
                  </span>

                  {selectedCategory !== "All" && (
                    <Badge variant="secondary" className="gap-1 font-bold py-1 px-2.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20">
                      <span>Category: {selectedCategory}</span>
                      <X className="h-3 w-3 cursor-pointer hover:text-rose-500" onClick={() => setSelectedCategory("All")} />
                    </Badge>
                  )}

                  {selectedGender !== "All" && (
                    <Badge variant="secondary" className="gap-1 font-bold py-1 px-2.5 bg-background border">
                      <span>Audience: {selectedGender}</span>
                      <X className="h-3 w-3 cursor-pointer hover:text-rose-500" onClick={() => setSelectedGender("All")} />
                    </Badge>
                  )}

                  {selectedBrands.map((b) => (
                    <Badge key={b} variant="secondary" className="gap-1 font-bold py-1 px-2.5 bg-background border">
                      <span>Brand: {b}</span>
                      <X className="h-3 w-3 cursor-pointer hover:text-rose-500" onClick={() => toggleBrand(b)} />
                    </Badge>
                  ))}

                  {Object.entries(selectedSecondaryFilters).map(([secKey, opts]) =>
                    opts.map((opt) => (
                      <Badge key={`${secKey}-${opt}`} variant="secondary" className="gap-1 font-bold py-1 px-2.5 bg-background border">
                        <span>{secKey}: {opt}</span>
                        <X className="h-3 w-3 cursor-pointer hover:text-rose-500" onClick={() => removeSecondaryFilterTag(secKey, opt)} />
                      </Badge>
                    ))
                  )}

                  <button
                    onClick={resetFilters}
                    className="text-[11px] font-bold text-rose-500 hover:underline ml-1"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* PRODUCT CARDS GRID */}
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border bg-background p-6 py-14 text-center shadow-xs sm:rounded-2xl sm:p-8 sm:py-20">
                <Search className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                <h3 className="text-lg font-bold text-foreground mb-1">No products match your filters</h3>
                <p className="text-xs text-muted-foreground mb-4 max-w-sm">
                  Try adjusting or clearing some of your filter criteria to discover more items.
                </p>
                <Button onClick={resetFilters} variant="outline" size="sm">
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                {filteredProducts.map((product) => {
                  const mrp = product.originalPrice || Math.round(product.price * 1.28);
                  const discountPercent = Math.round(((mrp - product.price) / mrp) * 100);
                  const brand = getResolvedBrand(product);
                  const isWishlisted = isInWishlist(product.id);
                  const isInCart = cartItems.some((item) => item.product.id === product.id);

                  return (
                    <div
                      key={product.id}
                      className="group relative flex min-w-0 flex-col justify-between overflow-hidden rounded-xl border bg-background transition-all duration-300 hover:shadow-xl"
                    >
                      {/* Product Image & Overlays */}
                      <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-900">
                        <Link href={`/products/${product.id}`}>
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          />
                        </Link>

                        {/* Top Right Wishlist Button */}
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            toggleWishlist(product.id, product.name);
                          }}
                          className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full shadow-xs backdrop-blur-md transition-colors sm:right-2.5 sm:top-2.5 sm:h-8 sm:w-8 ${
                            isWishlisted
                              ? "bg-rose-500 text-white hover:bg-rose-600"
                              : "bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-rose-500"
                          }`}
                          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                        >
                          <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
                        </button>

                        {/* Top Left AD / Category Tag */}
                        <div className="absolute left-2 top-2 flex max-w-[72%] items-center gap-1.5 sm:left-2.5 sm:top-2.5">
                          <span className="truncate rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-xs sm:px-2 sm:text-[10px]">
                            {product.category}
                          </span>
                        </div>

                        {/* Rating Pill Overlaid Bottom Left */}
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-slate-900 shadow-xs backdrop-blur-md dark:bg-slate-900/90 dark:text-slate-100 sm:bottom-2.5 sm:left-2.5 sm:px-2 sm:text-[11px]">
                          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                            {product.rating || 4.5}
                          </span>
                          <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                          <span className="text-slate-400 font-normal">|</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {product.reviewCount || 42}
                          </span>
                        </div>
                      </div>

                      {/* Product Content Details */}
                      <div className="flex flex-1 flex-col justify-between space-y-1.5 p-2.5 sm:p-3.5">
                        <div>
                          {/* Brand Name (Bold Upper) */}
                          <div className="truncate text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 sm:text-xs">
                            {brand}
                          </div>

                          {/* Product Name */}
                          <Link href={`/products/${product.id}`}>
                            <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-slate-600 transition-colors hover:text-primary dark:text-slate-300 sm:line-clamp-1">
                              {product.name}
                            </h3>
                          </Link>
                        </div>

                        {/* Pricing Block */}
                        <div className="pt-1">
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                              {formatCurrency(product.price)}
                            </span>
                            <span className="text-[11px] font-medium text-slate-400 line-through sm:text-xs">
                              {formatCurrency(mrp)}
                            </span>
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 sm:text-[11px]">
                              ({discountPercent}% OFF)
                            </span>
                          </div>
                        </div>

                        {/* Add to Cart Action Button */}
                        <Button
                          onClick={() => {
                            if (isInCart) { openCart(); return; }
                            addItem(product);
                            toast.success("Added to Shopping Cart", { description: `${product.name} added to cart` });
                          }}
                          className="mt-1.5 h-8 w-full gap-1 rounded-lg bg-slate-900 text-[11px] font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200 sm:mt-2 sm:gap-1.5 sm:text-xs"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          <span>{isInCart ? "View Cart" : "Add to Cart"}</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function AllProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-semibold">Loading All Products Catalog...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
