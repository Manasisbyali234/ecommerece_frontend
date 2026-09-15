import { useSyncExternalStore } from "react";
import { api } from "./api";
import {
  orders as seedOrders,
  invoices as seedInvoices,
  type Order,
  type Invoice,
} from "./mock-data";

export type { Order, Invoice };

export type CouponType = "percentage" | "fixed" | "bogo" | "free_shipping";

export type Coupon = {
  id: string;
  code: string;
  description: string;
  type: CouponType;
  value: number;
  minSpend: number;
  category: string;
  usageLimit: number;
  used: number;
  expires: string;
  active: boolean;
};

type CouponPayload = Omit<Coupon, "id" | "used">;

export type BannerKind = "announcement" | "hero";
export type Placement = "top" | "homepage" | "checkout" | "sidebar" | "after_hero" | "after_category" | "after_mega_deals";
export type Orientation = "landscape" | "portrait";
export type ImageFit = "cover" | "contain";
export type ImagePosition = "center" | "top" | "bottom" | "left" | "right";
export type BannerLayout = "layout1" | "layout2" | "layout3" | "imageOnly" | "collage";
export type FontFamilyOption = "sans" | "serif" | "mono" | "display";
export type FontSizeOption = "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl";
export type FontWeightOption = "normal" | "medium" | "semibold" | "bold" | "extrabold";

export type TypographyStyle = {
  color?: string;
  fontFamily?: FontFamilyOption;
  fontSize?: FontSizeOption;
  fontWeight?: FontWeightOption;
};

export type CollageItem = {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  ctaUrl?: string;
  aspectRatio?: "square" | "rectangle" | "landscape" | "portrait";
  gridSpan?: number;
  rowSpan?: number;
};

export type Banner = {
  id: string;
  title: string;
  subtitle?: string;
  body: string;
  kind: BannerKind;
  placement: Placement;
  bgColor: string;
  textColor: string;
  ctaLabel: string;
  ctaUrl: string;
  ctaBgColor?: string;
  ctaTextColor?: string;
  imageUrl?: string;
  price?: number;
  discountPrice?: number;
  orientation?: Orientation;
  imageFit?: ImageFit;
  imagePosition?: ImagePosition;
  zoom?: number;
  cropPositionX?: number;
  cropPositionY?: number;
  layout?: BannerLayout;
  bgOpacity?: number;
  collageItems?: CollageItem[];
  collageCols?: number;
  collageRows?: number;
  collageGapPx?: number;
  titleStyle?: TypographyStyle;
  subtitleStyle?: TypographyStyle;
  bodyStyle?: TypographyStyle;
  active: boolean;
  starts: string;
  ends: string;
};

export type CustomerTierCategoryBenefit = {
  id: string;
  category: string;
  subCategory?: string;
  discountPercent: number;
};

export type CustomerTier = {
  id: string;
  name: string;
  badgeColor: string;
  description: string;
  minOrders: number;
  minTotalSpent: number;
  categoryBenefits: CustomerTierCategoryBenefit[];
  freeShipping: boolean;
  prioritySupport: boolean;
  cashbackPercent: number;
};

export const seedCustomerTiers: CustomerTier[] = [
  {
    id: "tier-platinum",
    name: "VIP Platinum",
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    description: "Highest status tier for top-tier VIP shoppers with max category discounts & premium perks.",
    minOrders: 5,
    minTotalSpent: 10000,
    categoryBenefits: [
      { id: "b1", category: "All Categories", subCategory: "All Subcategories", discountPercent: 15 },
      { id: "b2", category: "Apparel", subCategory: "Ethnic Wear", discountPercent: 20 },
      { id: "b3", category: "Electronics", subCategory: "Watches", discountPercent: 25 },
    ],
    freeShipping: true,
    prioritySupport: true,
    cashbackPercent: 5,
  },
  {
    id: "tier-gold",
    name: "Gold Buyer",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    description: "Intermediate status tier for frequent shoppers earning priority discounts.",
    minOrders: 2,
    minTotalSpent: 4000,
    categoryBenefits: [
      { id: "b4", category: "All Categories", subCategory: "All Subcategories", discountPercent: 8 },
      { id: "b5", category: "Footwear", subCategory: "Footwear & Sneakers", discountPercent: 12 },
    ],
    freeShipping: true,
    prioritySupport: false,
    cashbackPercent: 2,
  },
  {
    id: "tier-regular",
    name: "Regular",
    badgeColor: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    description: "Standard tier for new and casual shoppers.",
    minOrders: 0,
    minTotalSpent: 0,
    categoryBenefits: [
      { id: "b6", category: "All Categories", subCategory: "All Subcategories", discountPercent: 0 },
    ],
    freeShipping: false,
    prioritySupport: false,
    cashbackPercent: 0,
  },
];

const seedCoupons: Coupon[] = [
  { id: "c1", code: "SUMMER25", description: "25% off summer collection", type: "percentage", value: 25, minSpend: 50, category: "Apparel", usageLimit: 500, used: 213, expires: "2026-09-30", active: true },
  { id: "c2", code: "FREESHIP", description: "Free shipping on orders over ₹499", type: "free_shipping", value: 0, minSpend: 75, category: "All", usageLimit: 1000, used: 481, expires: "2026-12-31", active: true },
  { id: "c3", code: "BOGOAUDIO", description: "Buy one get one on headphones", type: "bogo", value: 100, minSpend: 0, category: "Audio", usageLimit: 200, used: 47, expires: "2026-08-15", active: true },
  { id: "c4", code: "WELCOME10", description: "₹10 off first order", type: "fixed", value: 10, minSpend: 30, category: "All", usageLimit: 9999, used: 1204, expires: "2026-12-31", active: true },
  { id: "c5", code: "FLASH50", description: "50% off — expired flash sale", type: "percentage", value: 50, minSpend: 100, category: "Electronics", usageLimit: 100, used: 100, expires: "2026-06-01", active: false },
];

const seedBanners: Banner[] = [
  {
    id: "b0",
    title: "RIGHT TO FASHION SALE",
    subtitle: "50-80% OFF · One Nation, One Style Destination",
    body: "Live Now — India's biggest fashion festival with unmissable discounts across apparel & footwear.",
    kind: "hero",
    placement: "homepage",
    bgColor: "#0f172a",
    textColor: "#ffffff",
    ctaLabel: "Shop Fashion Sale",
    ctaUrl: "/products?category=Apparel",
    imageUrl: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=1600",
    orientation: "landscape",
    imageFit: "cover",
    imagePosition: "center",
    zoom: 1,
    layout: "imageOnly",
    active: true,
    starts: "2026-07-01",
    ends: "2026-12-31",
  },
  {
    id: "b1",
    title: "Aurora Wireless Headphones",
    subtitle: "Immersive Active Noise Cancellation · 40h Battery",
    body: "Experience studio-grade high-fidelity sound with custom 40mm drivers and ultra-plush earcups.",
    kind: "hero",
    placement: "homepage",
    bgColor: "#090d16",
    textColor: "#ffffff",
    ctaLabel: "Shop Headphones",
    ctaUrl: "/#products",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600",
    price: 149.99,
    discountPrice: 99.99,
    orientation: "landscape",
    imageFit: "cover",
    imagePosition: "center",
    zoom: 1,
    layout: "layout1",
    titleStyle: { color: "#ffffff", fontFamily: "sans", fontSize: "5xl", fontWeight: "extrabold" },
    subtitleStyle: { color: "#38bdf8", fontFamily: "sans", fontSize: "lg", fontWeight: "semibold" },
    bodyStyle: { color: "#cbd5e1", fontFamily: "sans", fontSize: "base", fontWeight: "normal" },
    active: true,
    starts: "2026-07-01",
    ends: "2026-12-31",
  },
  {
    id: "b2",
    title: "Nomad Leather Backpack",
    subtitle: "Handcrafted Italian Leather · Weatherproof Finish",
    body: "Designed for modern urban explorers with dedicated 16-inch laptop sleeve and ergonomic shoulder support.",
    kind: "hero",
    placement: "homepage",
    bgColor: "#1c1917",
    textColor: "#ffffff",
    ctaLabel: "Explore Backpack",
    ctaUrl: "/#products",
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1600",
    price: 219.00,
    discountPrice: 149.00,
    orientation: "portrait",
    imageFit: "cover",
    imagePosition: "center",
    zoom: 1,
    layout: "layout2",
    titleStyle: { color: "#ffffff", fontFamily: "serif", fontSize: "5xl", fontWeight: "bold" },
    subtitleStyle: { color: "#f59e0b", fontFamily: "sans", fontSize: "lg", fontWeight: "semibold" },
    bodyStyle: { color: "#e2e8f0", fontFamily: "sans", fontSize: "base", fontWeight: "normal" },
    active: true,
    starts: "2026-06-15",
    ends: "2026-12-31",
  },
  {
    id: "b3",
    title: "Smart Fitness Watch",
    subtitle: "Always-On Retina Display · Multi-Sport GPS Tracking",
    body: "Track your workouts, heart rate, and health metrics with precision sensors and 7-day battery life.",
    kind: "hero",
    placement: "homepage",
    bgColor: "#0f172a",
    textColor: "#ffffff",
    ctaLabel: "Buy Smart Watch",
    ctaUrl: "/#products",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600",
    price: 1990,
    orientation: "landscape",
    imageFit: "cover",
    imagePosition: "center",
    zoom: 1,
    layout: "layout3",
    bgOpacity: 0.99,
    titleStyle: { color: "#ffffff", fontFamily: "display", fontSize: "6xl", fontWeight: "extrabold" },
    subtitleStyle: { color: "#34d399", fontFamily: "sans", fontSize: "xl", fontWeight: "semibold" },
    bodyStyle: { color: "#cbd5e1", fontFamily: "sans", fontSize: "lg", fontWeight: "normal" },
    active: true,
    starts: "2026-07-10",
    ends: "2026-12-31",
  },
  {
    id: "b4",
    title: "Trending Multi-Category Showcase",
    subtitle: "Curated Seasonal Collections · Explore Top Rated Trends",
    body: "Browse through our handpicked collage showcase of audio gear, designer fashion, luxury bags & smart wearables.",
    kind: "hero",
    placement: "homepage",
    bgColor: "#090d16",
    textColor: "#ffffff",
    ctaLabel: "View All Collections",
    ctaUrl: "/#products",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600",
    layout: "collage",
    collageCols: 3,
    collageRows: 0,
    collageGapPx: 14,
    collageItems: [
      {
        id: "col-b4-1",
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
        title: "Audio Headphones",
        subtitle: "Up to 50% Off",
        ctaUrl: "/products?category=Audio",
        aspectRatio: "square",
        gridSpan: 1,
        rowSpan: 1,
      },
      {
        id: "col-b4-2",
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
        title: "Smart Watches",
        subtitle: "Fitness & Sport",
        ctaUrl: "/products?category=Electronics",
        aspectRatio: "square",
        gridSpan: 1,
        rowSpan: 1,
      },
      {
        id: "col-b4-3",
        imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600",
        title: "Designer Fashion",
        subtitle: "New Trends",
        ctaUrl: "/products?category=Apparel",
        aspectRatio: "square",
        gridSpan: 1,
        rowSpan: 1,
      },
      {
        id: "col-b4-4",
        imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600",
        title: "Italian Leather Bags",
        subtitle: "Luxury Edition",
        ctaUrl: "/products?category=Bags",
        aspectRatio: "rectangle",
        gridSpan: 2,
        rowSpan: 1,
      },
      {
        id: "col-b4-5",
        imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
        title: "Athletic Sneakers",
        subtitle: "Performance Footwear",
        ctaUrl: "/#products",
        aspectRatio: "square",
        gridSpan: 1,
        rowSpan: 1,
      },
    ],
    active: true,
    starts: "2026-07-01",
    ends: "2026-12-31",
  },
  {
    id: "b_ah1",
    title: "Studio Wireless Headphones",
    subtitle: "⚡ Flash Sale",
    body: "Experience studio-grade sound with active noise cancellation and 40h battery.",
    kind: "hero",
    placement: "after_hero",
    bgColor: "#090d16",
    textColor: "#ffffff",
    ctaLabel: "Shop Audio",
    ctaUrl: "/products?category=Audio",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
    price: 3499,
    discountPrice: 1499,
    active: true,
    starts: "2026-07-01",
    ends: "2026-12-31",
  },
  {
    id: "b_ah2",
    title: "Designer European Fashion",
    subtitle: "🔥 Up to 70% Off",
    body: "Premium European apparel collection with curved hem and mother-of-pearl buttons.",
    kind: "hero",
    placement: "after_hero",
    bgColor: "#1c1917",
    textColor: "#ffffff",
    ctaLabel: "Shop Apparel",
    ctaUrl: "/products?category=Apparel",
    imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600",
    price: 2499,
    discountPrice: 780,
    active: true,
    starts: "2026-07-01",
    ends: "2026-12-31",
  },
  {
    id: "b_ah3",
    title: "Italian Leather Backpacks",
    subtitle: "✨ Luxury Edition",
    body: "Crafted from 100% full-grain Italian leather with padded 16-inch laptop compartment.",
    kind: "hero",
    placement: "after_hero",
    bgColor: "#042f2e",
    textColor: "#ffffff",
    ctaLabel: "Explore Bags",
    ctaUrl: "/products?category=Bags",
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600",
    price: 4990,
    discountPrice: 2190,
    active: true,
    starts: "2026-07-01",
    ends: "2026-12-31",
  },
  {
    id: "b_ac1",
    title: "Next-Gen Pro Wireless Headphones",
    subtitle: "⚡ Flash Deal · Ends in 05h : 24m : 12s",
    body: "Active noise cancellation, deep bass & 45h battery life with fast charging.",
    kind: "hero",
    placement: "after_category",
    bgColor: "#090d16",
    textColor: "#ffffff",
    ctaLabel: "Shop Flash Deal",
    ctaUrl: "/products/P-1001",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
    price: 7999,
    discountPrice: 3499,
    active: true,
    starts: "2026-07-01",
    ends: "2026-12-31",
  },
  {
    id: "b_amd1",
    title: "Smart Fitness Watch Ultra Edition",
    subtitle: "🔥 New Launch Deal · Special Launch Price",
    body: "1.43\" AMOLED display, 5ATM water resistance, continuous ECG & 7-day battery life.",
    kind: "hero",
    placement: "after_mega_deals",
    bgColor: "#064e3b",
    textColor: "#ffffff",
    ctaLabel: "Explore Smartwatch",
    ctaUrl: "/products/P-1006",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
    price: 4990,
    discountPrice: 1990,
    active: true,
    starts: "2026-07-01",
    ends: "2026-12-31",
  },
];

export type SubCategory = {
  id: string;
  title: string;
  discount: string;
  image: string;
  category: string;
  active: boolean;
};

const seedSubCategories: SubCategory[] = [
  { id: "sc-1", title: "Ethnic Wear", discount: "50-80% OFF", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600", category: "Apparel", active: true },
  { id: "sc-2", title: "Casual Wear", discount: "40-80% OFF", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600", category: "Apparel", active: true },
  { id: "sc-3", title: "Men's Activewear", discount: "30-70% OFF", image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600", category: "Apparel", active: true },
  { id: "sc-4", title: "Women's Activewear", discount: "30-70% OFF", image: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600", category: "Apparel", active: true },
  { id: "sc-5", title: "Western Wear", discount: "40-80% OFF", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600", category: "Apparel", active: true },
  { id: "sc-6", title: "Sportswear", discount: "30-80% OFF", image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600", category: "Apparel", active: true },
  { id: "sc-7", title: "Loungewear", discount: "30-60% OFF", image: "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=600", category: "Apparel", active: true },
  { id: "sc-8", title: "Innerwear", discount: "UP TO 70% OFF", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600", category: "Apparel", active: true },
  { id: "sc-9", title: "Lingerie", discount: "UP TO 70% OFF", image: "https://images.unsplash.com/photo-1563178406-4cdc2923acbc?w=600", category: "Apparel", active: true },
  { id: "sc-10", title: "Watches", discount: "UP TO 80% OFF", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600", category: "Electronics", active: true },
  { id: "sc-11", title: "Grooming", discount: "UP TO 60% OFF", image: "https://images.unsplash.com/photo-1621607512214-68297480165e?w=600", category: "Home", active: true },
  { id: "sc-12", title: "Beauty & Makeup", discount: "UP TO 60% OFF", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600", category: "Home", active: true },
  { id: "sc-13", title: "Footwear & Sneakers", discount: "UP TO 70% OFF", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600", category: "Footwear", active: true },
  { id: "sc-14", title: "Handbags & Totes", discount: "40-75% OFF", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600", category: "Bags", active: true },
  { id: "sc-15", title: "Jewelry & Accessories", discount: "UP TO 65% OFF", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600", category: "Home", active: true },
  { id: "sc-16", title: "Sunglasses & Eyewear", discount: "30-70% OFF", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600", category: "Electronics", active: true },
  { id: "sc-17", title: "Kids Wear & Toys", discount: "50-70% OFF", image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600", category: "Apparel", active: true },
  { id: "sc-18", title: "Home Decor & Bedding", discount: "UP TO 60% OFF", image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600", category: "Home", active: true },
];

export type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  active: boolean;
};

const seedCategories: CategoryItem[] = [
  { id: "cat-1", name: "All", slug: "All", description: "Browse all items across every category", active: true },
  { id: "cat-2", name: "Audio", slug: "Audio", description: "Studio headphones, wireless earbuds & soundbars", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600", active: true },
  { id: "cat-3", name: "Apparel", slug: "Apparel", description: "Designer European fashion & daily wear", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600", active: true },
  { id: "cat-4", name: "Bags", slug: "Bags", description: "Italian leather backpacks, totes & luggage", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600", active: true },
  { id: "cat-5", name: "Footwear", slug: "Footwear", description: "Performance running shoes & casual sneakers", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600", active: true },
  { id: "cat-6", name: "Electronics", slug: "Electronics", description: "Smartwatches, gadgets & tech accessories", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600", active: true },
  { id: "cat-7", name: "Home", slug: "Home", description: "Modern decor, kitchenware & bedding", image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600", active: true },
];

export type NavCategoryGroup = {
  id: string;
  name: string;
  categories: {
    id: string;
    name: string;
    subcategories: string[];
  }[];
  active: boolean;
};

const seedNavCategories: NavCategoryGroup[] = [
  {
    id: "nc-1",
    name: "Apparel & Fashion",
    categories: [
      {
        id: "cat-1-1",
        name: "Clothing",
        subcategories: ["Shirts", "Pants", "Dresses", "Hoodies"]
      },
      {
        id: "cat-1-2",
        name: "Footwear",
        subcategories: ["Running Shoes", "Casual Sneakers", "Boots"]
      },
      {
        id: "cat-1-3",
        name: "Accessories",
        subcategories: ["Watches", "Belts", "Sunglasses"]
      }
    ],
    active: true,
  },
  {
    id: "nc-2",
    name: "Electronics & Gadgets",
    categories: [
      {
        id: "cat-2-1",
        name: "Audio",
        subcategories: ["Wireless Headphones", "Earbuds", "Bluetooth Speakers"]
      },
      {
        id: "cat-2-2",
        name: "Mobile Accessories",
        subcategories: ["Power Banks", "Chargers & Cables", "Cases & Covers"]
      }
    ],
    active: true,
  },
  {
    id: "nc-3",
    name: "Home & Living",
    categories: [
      {
        id: "cat-3-1",
        name: "Furniture",
        subcategories: ["Sofas", "Tables", "Chairs"]
      },
      {
        id: "cat-3-2",
        name: "Kitchenware",
        subcategories: ["Cookware", "Tableware"]
      },
      {
        id: "cat-3-3",
        name: "Decor",
        subcategories: ["Lights", "Rugs"]
      }
    ],
    active: true,
  }
];

export type SidebarOption = {
  id: string;
  section: "trending" | "help";
  label: string;
  icon: string;
  url: string;
  active: boolean;
};

const seedSidebarOptions: SidebarOption[] = [
  {
    id: "so-1",
    section: "trending",
    label: "Today's Deals",
    icon: "Flame",
    url: "/products?category=All",
    active: true,
  },
  {
    id: "so-2",
    section: "trending",
    label: "Bestsellers",
    icon: "Award",
    url: "/products?category=All",
    active: true,
  },
  {
    id: "so-3",
    section: "trending",
    label: "New Releases & Offers",
    icon: "Gift",
    url: "/products?category=All",
    active: true,
  },
  {
    id: "so-4",
    section: "help",
    label: "Customer Service & FAQs",
    icon: "HelpCircle",
    url: "/faq",
    active: true,
  },
];

export type CRUDPermission = {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
};

export type ModulePermissions = Record<string, CRUDPermission>;

export type Role = {
  id: string;
  name: string;
  description: string;
  isSuperAdmin?: boolean;
  permissions: ModulePermissions;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  status: "active" | "inactive";
  lastLogin: string;
};

export const MODULE_DEFINITIONS = [
  { key: "dashboard", label: "Dashboard", group: "General" },
  { key: "website_banners", label: "Banners", group: "Website" },
  { key: "website_subcategories", label: "Shop by sub category", group: "Website" },
  { key: "website_categories", label: "Shop by categories", group: "Website" },
  { key: "website_nav_categories", label: "Category & Subcategory Names", group: "Website" },
  { key: "website_builder", label: "Page Builder 🎨", group: "Website" },
  { key: "website_footer", label: "Footer Manager 🦶", group: "Website" },
  { key: "website_header", label: "Header Manager 🏷️", group: "Website" },
  { key: "website_favicon", label: "Favicon Manager 🌐", group: "Website" },
  { key: "settings_theme", label: "Website Theme & Colors 🎨", group: "General" },
  { key: "analytics", label: "Analytics", group: "Store Operations" },
  { key: "products", label: "Products", group: "Store Operations" },
  { key: "orders", label: "Orders", group: "Store Operations" },
  { key: "customers", label: "Customers", group: "Store Operations" },
  { key: "coupons", label: "Coupons", group: "Store Operations" },
  { key: "payments", label: "Payment Gateways", group: "Store Operations" },
  { key: "invoices", label: "Invoices", group: "Store Operations" },
  { key: "shipping", label: "Shipping", group: "Store Operations" },
  { key: "users", label: "Users & Roles Management", group: "Administration" },
];

export function createFullPermissions(): ModulePermissions {
  const perms: ModulePermissions = {};
  MODULE_DEFINITIONS.forEach((m) => {
    perms[m.key] = { create: true, read: true, update: true, delete: true };
  });
  return perms;
}

export function createCustomPermissions(overrides: Partial<Record<string, Partial<CRUDPermission>>>): ModulePermissions {
  const perms: ModulePermissions = {};
  MODULE_DEFINITIONS.forEach((m) => {
    const override = overrides[m.key];
    perms[m.key] = {
      create: override?.create ?? false,
      read: override?.read ?? true,
      update: override?.update ?? false,
      delete: override?.delete ?? false,
    };
  });
  return perms;
}

const seedRoles: Role[] = [
  {
    id: "role-superadmin",
    name: "Super Admin",
    description: "Unrestricted master access with full CRUD permissions across all modules and system settings.",
    isSuperAdmin: true,
    permissions: createFullPermissions(),
  },
  {
    id: "role-store-manager",
    name: "Store Manager",
    description: "Full management of products, orders, inventory, customers, coupons, and shipping fulfillment.",
    permissions: createCustomPermissions({
      products: { create: true, read: true, update: true, delete: true },
      orders: { create: true, read: true, update: true, delete: true },
      customers: { create: true, read: true, update: true, delete: false },
      coupons: { create: true, read: true, update: true, delete: true },
      invoices: { create: true, read: true, update: true, delete: false },
      shipping: { create: true, read: true, update: true, delete: false },
      analytics: { create: false, read: true, update: false, delete: false },
      website_banners: { create: false, read: true, update: false, delete: false },
    }),
  },
  {
    id: "role-content-editor",
    name: "Content & Storefront Editor",
    description: "Manages homepage banners, category layouts, navbar structures, and visual page builder content.",
    permissions: createCustomPermissions({
      website_banners: { create: true, read: true, update: true, delete: true },
      website_subcategories: { create: true, read: true, update: true, delete: true },
      website_categories: { create: true, read: true, update: true, delete: true },
      website_nav_categories: { create: true, read: true, update: true, delete: true },
      website_builder: { create: true, read: true, update: true, delete: true },
      products: { create: false, read: true, update: false, delete: false },
    }),
  },
  {
    id: "role-support",
    name: "Support Specialist",
    description: "Customer service role with access to view orders, update order status, and inspect invoices.",
    permissions: createCustomPermissions({
      orders: { create: false, read: true, update: true, delete: false },
      customers: { create: false, read: true, update: false, delete: false },
      invoices: { create: false, read: true, update: false, delete: false },
      products: { create: false, read: true, update: false, delete: false },
    }),
  },
];

const seedAdminUsers: AdminUser[] = [
  {
    id: "usr-1",
    name: "Super Admin",
    email: "superadmin@metromindz.com",
    roleId: "role-superadmin",
    status: "active",
    lastLogin: "2026-07-30 16:45",
  },
  {
    id: "usr-2",
    name: "Aakash Sharma",
    email: "aakash@metromindz.com",
    roleId: "role-store-manager",
    status: "active",
    lastLogin: "2026-07-30 15:20",
  },
  {
    id: "usr-3",
    name: "Priya Patel",
    email: "priya@metromindz.com",
    roleId: "role-content-editor",
    status: "active",
    lastLogin: "2026-07-29 11:10",
  },
  {
    id: "usr-4",
    name: "Rahul Verma",
    email: "rahul@metromindz.com",
    roleId: "role-support",
    status: "active",
    lastLogin: "2026-07-28 09:30",
  },
];

export type CustomerAddress = {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  type: "Home" | "Work" | "Other";
  isDefault: boolean;
};

export type CustomerProfile = {
  fullName: string;
  email: string;
  phone: string;
  altPhone?: string;
  gender: string;
  dob: string;
};

const seedCustomerProfile: CustomerProfile = {
  fullName: "Aakash Sharma",
  email: "aakash.sharma@example.com",
  phone: "+91 98765 43210",
  altPhone: "+91 91234 56789",
  gender: "Male",
  dob: "1995-08-15",
};

const seedCustomerAddresses: CustomerAddress[] = [
  {
    id: "addr-1",
    fullName: "Aakash Sharma",
    phone: "+91 98765 43210",
    street: "Flat 402, Metro Residency, MG Road, Indiranagar",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560038",
    type: "Home",
    isDefault: true,
  },
  {
    id: "addr-2",
    fullName: "Aakash Sharma (Office)",
    phone: "+91 98765 43210",
    street: "Metromindz Tech Park, Tower B, 5th Floor, Electronic City",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560100",
    type: "Work",
    isDefault: false,
  },
];

export type CompanyInvoiceSettings = {
  companyName: string;
  tagline: string;
  gstin: string;
  cin: string;
  address: string;
  cityStatePincode: string;
  supportEmail: string;
  supportPhone: string;
  gstTaxRatePercent: number;
  placeOfSupply: string;
  legalTerms: string;
};

const seedCompanyInvoiceSettings: CompanyInvoiceSettings = {
  companyName: "Metromindz E-Commerce Pvt. Ltd.",
  tagline: "Metromindz Store",
  gstin: "29ABCDE1234F1Z5",
  cin: "U72900KA2026PTC109283",
  address: "102 Metro Residency, MG Road, Indiranagar",
  cityStatePincode: "Bengaluru, Karnataka - 560038",
  supportEmail: "billing@metromindz.store",
  supportPhone: "+91 80 4912 3400",
  gstTaxRatePercent: 18,
  placeOfSupply: "Karnataka (29)",
  legalTerms: "E. & O.E. Subject to Bengaluru Jurisdiction. Computer generated Tax Invoice. No signature required.",
};

export type FooterLink = {
  id: string;
  label: string;
  url: string;
  active?: boolean;
};

export type FooterColumn = {
  id: string;
  title: string;
  active: boolean;
  links: FooterLink[];
};

export type SocialLink = {
  id: string;
  platform: string;
  url: string;
  active: boolean;
  icon: string;
};

export type FooterConfig = {
  brandName: string;
  description: string;
  logoUrl?: string;
  freeShippingText?: string;
  socialLinks: SocialLink[];
  columns: FooterColumn[];
};

export const initialFooterConfig: FooterConfig = {
  brandName: "Metromindz Store",
  description: "Curated lifestyle accessories, audio gear, and home essentials delivered with speed and quality guarantee.",
  freeShippingText: "On orders over ₹499",
  socialLinks: [
    { id: "soc-1", platform: "Instagram", url: "https://instagram.com", active: true, icon: "Instagram" },
    { id: "soc-2", platform: "Facebook", url: "https://facebook.com", active: true, icon: "Facebook" },
    { id: "soc-3", platform: "X", url: "https://twitter.com", active: true, icon: "Twitter" },
    { id: "soc-4", platform: "YouTube", url: "https://youtube.com", active: true, icon: "Youtube" },
    { id: "soc-5", platform: "LinkedIn", url: "https://linkedin.com", active: true, icon: "Linkedin" },
  ],
  columns: [
    {
      id: "col-categories",
      title: "Shop Categories",
      active: true,
      links: [
        { id: "l1", label: "Audio & Headphones", url: "/#products", active: true },
        { id: "l2", label: "Bags & Backpacks", url: "/#products", active: true },
        { id: "l3", label: "Home & Living", url: "/#products", active: true },
        { id: "l4", label: "Electronics & Smart", url: "/#products", active: true },
      ],
    },
    {
      id: "col-subcategories",
      title: "Shop Subcategories",
      active: true,
      links: [
        { id: "l5", label: "Wireless Earbuds", url: "/#products", active: true },
        { id: "l6", label: "Smartwatches", url: "/#products", active: true },
        { id: "l7", label: "Laptop Sleeves", url: "/#products", active: true },
        { id: "l8", label: "Desk Lamps", url: "/#products", active: true },
        { id: "l9", label: "Power Banks", url: "/#products", active: true },
      ],
    },
    {
      id: "col-support",
      title: "Customer Support",
      active: true,
      links: [
        { id: "l10", label: "My Account", url: "/account", active: true },
        { id: "l11", label: "My Wishlist", url: "/wishlist", active: true },
        { id: "l12", label: "FAQ", url: "/faq", active: true },
        { id: "l13", label: "Checkout", url: "/checkout", active: true },
      ],
    },
    {
      id: "col-policies",
      title: "Customer Policies",
      active: true,
      links: [
        { id: "l14", label: "Privacy Policy", url: "/privacy-policy", active: true },
        { id: "l15", label: "Terms and Conditions", url: "/terms", active: true },
        { id: "l16", label: "Return and Refund Policy", url: "/refund-policy", active: true },
        { id: "l17", label: "Cancellation Policy", url: "/cancellation-policy", active: true },
        { id: "l18", label: "Shipping and Delivery Policy", url: "/shipping-policy", active: true },
        { id: "l19", label: "Cookie Policy", url: "/cookie-policy", active: true },
        { id: "l20", label: "Grievance Redressal", url: "/grievance-redressal", active: true },
      ],
    },
  ],
};

export type HeaderNavLink = {
  id: string;
  label: string;
  url: string;
  active: boolean;
  badge?: string;
  highlight?: boolean;
};

export type HeaderConfig = {
  topBanner: {
    enabled: boolean;
    text: string;
    linkText?: string;
    linkUrl?: string;
    bgColor: string;
    textColor: string;
    dismissible: boolean;
  };
  logo: {
    imageUrl?: string;
    text: string;
    heightPx: number;
  };
  navLinks: HeaderNavLink[];
  actions: {
    showSearch: boolean;
    showWishlist: boolean;
    showCart: boolean;
    showUserAccount: boolean;
    stickyHeader: boolean;
  };
};

export const initialHeaderConfig: HeaderConfig = {
  topBanner: {
    enabled: true,
    text: "🎉 Festival Sale: Up to 50% OFF on Audio Accessories & Headphones!",
    linkText: "Shop Deals",
    linkUrl: "/#products",
    bgColor: "#0f172a",
    textColor: "#ffffff",
    dismissible: true,
  },
  logo: {
    imageUrl: "",
    text: "Metromindz Store",
    heightPx: 36,
  },
  navLinks: [
    { id: "hnav-1", label: "Shop All", url: "/#products", active: true },
    { id: "hnav-2", label: "Audio & Headphones", url: "/#products", active: true, badge: "HOT" },
    { id: "hnav-3", label: "Bags & Backpacks", url: "/#products", active: true },
    { id: "hnav-4", label: "Electronics & Smart", url: "/#products", active: true, badge: "NEW" },
    { id: "hnav-5", label: "Special Offers", url: "/#products", active: true, badge: "SALE", highlight: true },
  ],
  actions: {
    showSearch: true,
    showWishlist: true,
    showCart: true,
    showUserAccount: true,
    stickyHeader: true,
  },
};

export type FaviconConfig = {
  faviconUrl: string;
  appleTouchIconUrl?: string;
  themeColor?: string;
  siteTitle?: string;
};

export const initialFaviconConfig: FaviconConfig = {
  faviconUrl: "",
  appleTouchIconUrl: "",
  themeColor: "#0f172a",
  siteTitle: "Metromindz Store — Premium E-Commerce",
};

export type ThemeConfig = {
  activePreset: string;
  primaryColor: string;
  primaryForeground: string;
  secondaryColor: string;
  secondaryForeground: string;
  accentColor: string;
  buttonColor: string;
  buttonTextColor: string;
  buttonHoverColor: string;
  buttonRadiusPx: number;
  fontFamily: string;
};

export const initialThemeConfig: ThemeConfig = {
  activePreset: "Midnight Executive",
  primaryColor: "#0f172a",
  primaryForeground: "#ffffff",
  secondaryColor: "#f1f5f9",
  secondaryForeground: "#0f172a",
  accentColor: "#f59e0b",
  buttonColor: "#0f172a",
  buttonTextColor: "#ffffff",
  buttonHoverColor: "#1e293b",
  buttonRadiusPx: 8,
  fontFamily: "Inter",
};

type State = {
  orders: Order[];
  invoices: (Invoice & { emailedAt?: string })[];
  coupons: Coupon[];
  banners: Banner[];
  subCategories: SubCategory[];
  categories: CategoryItem[];
  navCategories: NavCategoryGroup[];
  roles: Role[];
  adminUsers: AdminUser[];
  customerProfile: CustomerProfile;
  customerAddresses: CustomerAddress[];
  companyInvoiceSettings: CompanyInvoiceSettings;
  footerConfig: FooterConfig;
  headerConfig: HeaderConfig;
  faviconConfig: FaviconConfig;
  themeConfig: ThemeConfig;
  customerTiers: CustomerTier[];
  sidebarOptions: SidebarOption[];
};

let state: State = {
  orders: [],
  invoices: [],
  coupons: [],
  banners: [],
  subCategories: [],
  categories: [],
  navCategories: [],
  roles: [],
  adminUsers: [],
  customerProfile: { fullName: "", email: "", phone: "", gender: "", dob: "" },
  customerAddresses: [],
  companyInvoiceSettings: { ...seedCompanyInvoiceSettings },
  footerConfig: { ...initialFooterConfig },
  headerConfig: { ...initialHeaderConfig },
  faviconConfig: { ...initialFaviconConfig },
  themeConfig: { ...initialThemeConfig },
  customerTiers: [],
  sidebarOptions: [],
};

const listeners = new Set<() => void>();

function emit() {
  state = {
    orders: [...state.orders],
    invoices: [...state.invoices],
    coupons: [...state.coupons],
    banners: [...state.banners],
    subCategories: [...state.subCategories],
    categories: [...state.categories],
    navCategories: [...state.navCategories],
    roles: [...state.roles],
    adminUsers: [...state.adminUsers],
    customerProfile: { ...state.customerProfile },
    customerAddresses: [...state.customerAddresses],
    companyInvoiceSettings: { ...state.companyInvoiceSettings },
    footerConfig: { ...state.footerConfig },
    headerConfig: { ...state.headerConfig },
    faviconConfig: { ...state.faviconConfig },
    themeConfig: { ...state.themeConfig },
    customerTiers: [...state.customerTiers],
    sidebarOptions: [...state.sidebarOptions],
  };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot() {
  return state;
}

function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `item-${Date.now()}`; }
function persistContent(type: string, data: Record<string, unknown>, id?: string, remove = false) {
  const path = `/admin/content/${type}${id ? `/${id}` : ""}`;
  if (remove) { api(path, { method: "DELETE" }).catch(() => undefined); return; }
  const title = String(data.title || data.name || data.label || "Untitled");
  api(path, { method: id ? "PATCH" : "POST", body: JSON.stringify({ title, slug: String(data.slug || slugify(title)), active: data.active !== false, data }) }).catch(() => undefined);
}


export function useStore<T>(selector: (s: State) => T): T {
  const currentStore = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return selector(currentStore);
}

type PublicContent<T> = { id: string; title: string; active: boolean; data: T };
const fromContent = <T extends object>(item: PublicContent<T>) => ({ ...item.data, id: item.id, active: item.active, title: item.title });

/** Loads the admin-managed public configuration once for all storefront components. */
export async function hydrateStorefront() {
  const content = async <T extends object>(type: string) => (await api<{ items: PublicContent<T>[] }>(`/content/${type}`)).items;
  const configuration = async <T extends object>(key: string) => (await api<{ value: T }>(`/configuration/${key}`)).value;
  const settled = await Promise.allSettled([
    content<Omit<Banner, "id">>("banners"), content<Omit<CategoryItem, "id">>("categories"), content<Omit<SubCategory, "id">>("sub-categories"), content<Omit<NavCategoryGroup, "id">>("nav-categories"), content<Omit<SidebarOption, "id">>("sidebar-options"), content<Omit<CustomerTier, "id">>("customer-tiers"), api<{ items: Coupon[] }>("/coupons").then((r) => r.items), configuration<HeaderConfig>("header"), configuration<FooterConfig>("footer"), configuration<ThemeConfig>("theme"), configuration<FaviconConfig>("favicon"),
  ]);
  const value = <T,>(index: number, fallback: T): T => settled[index].status === "fulfilled" ? settled[index].value as T : fallback;
  const banners = value(0, [] as PublicContent<Omit<Banner, "id">>[]), categories = value(1, [] as PublicContent<Omit<CategoryItem, "id">>[]), subCategories = value(2, [] as PublicContent<Omit<SubCategory, "id">>[]), navCategories = value(3, [] as PublicContent<Omit<NavCategoryGroup, "id">>[]), sidebarOptions = value(4, [] as PublicContent<Omit<SidebarOption, "id">>[]), customerTiers = value(5, [] as PublicContent<Omit<CustomerTier, "id">>[]), coupons = value(6, [] as Coupon[]), header = value(7, {} as HeaderConfig), footer = value(8, {} as FooterConfig), theme = value(9, {} as ThemeConfig), favicon = value(10, {} as FaviconConfig);
  state = {
    ...state,
    coupons,
    banners: banners.map(fromContent),
    categories: categories.map((item) => ({ ...fromContent(item), name: item.data.name || item.title })),
    subCategories: subCategories.map(fromContent),
    navCategories: navCategories.map((item) => ({ ...fromContent(item), name: item.data.name || item.title, categories: item.data.categories ?? [] })),
    sidebarOptions: sidebarOptions.map((item) => ({ ...fromContent(item), label: item.data.label || item.title })),
    customerTiers: customerTiers.map(fromContent),
    headerConfig: Object.keys(header).length ? header : state.headerConfig,
    footerConfig: Object.keys(footer).length ? footer : state.footerConfig,
    themeConfig: Object.keys(theme).length ? theme : state.themeConfig,
    faviconConfig: Object.keys(favicon).length ? favicon : state.faviconConfig,
  };
  emit();
}

/** Hydrates every shared admin-console collection from its protected API. */
export async function hydrateAdminStore() {
  const content = async <T extends object>(type: string) => (await api<{ items: PublicContent<T>[] }>(`/admin/content/${type}`)).items;
  const [coupons, orders, invoices, categories, subCategories, banners, navCategories, sidebarOptions, customerTiers, header, footer, theme, favicon] = await Promise.all([
    api<{ items: Coupon[] }>("/admin/coupons").then((r) => r.items),
    api<{ items: Array<Record<string, unknown>> }>("/admin/orders").then((r) => r.items),
    api<{ items: Array<Record<string, unknown>> }>("/admin/invoices").then((r) => r.items),
    content<Omit<CategoryItem, "id">>("categories"), content<Omit<SubCategory, "id">>("sub-categories"), content<Omit<Banner, "id">>("banners"), content<Omit<NavCategoryGroup, "id">>("nav-categories"), content<Omit<SidebarOption, "id">>("sidebar-options"), content<Omit<CustomerTier, "id">>("customer-tiers"),
    api<{ setting: { value: HeaderConfig } }>("/admin/settings/header").then((r) => r.setting.value), api<{ setting: { value: FooterConfig } }>("/admin/settings/footer").then((r) => r.setting.value), api<{ setting: { value: ThemeConfig } }>("/admin/settings/theme").then((r) => r.setting.value), api<{ setting: { value: FaviconConfig } }>("/admin/settings/favicon").then((r) => r.setting.value),
  ]);
  state = {
    ...state, coupons,
    orders: orders.map((order) => { const pay = (order.payment || {}) as Record<string, unknown>; return { id: String(order.id), orderNumber: String(order.orderNumber || ""), customer: String((order.customer as Record<string, unknown>)?.fullName || "Customer"), email: String((order.customer as Record<string, unknown>)?.email || ""), total: Number(order.total || 0), items: Array.isArray(order.items) ? order.items.map((item) => { const line = item as Record<string, unknown>; return { id: String(line.product || line.id || ""), title: String(line.name || "Product"), price: Number(line.unitPrice || line.price || 0), qty: Number(line.quantity || line.qty || 1), image: String(line.image || "") }; }) : 0, status: order.status as Order["status"], paymentStatus: order.paymentStatus as Order["paymentStatus"], paymentMethod: String(order.paymentMethod || ""), paymentProvider: String(pay.provider || ""), razorpayOrderId: String(pay.providerOrderId || ""), razorpayPaymentId: String(pay.providerPaymentId || ""), date: String(order.createdAt || "").slice(0, 10) }; }),
    invoices: invoices.map((invoice) => ({ id: String(invoice.id), orderId: String((invoice.order as Record<string, unknown>)?.id || invoice.order || ""), customer: "Customer", amount: Number(invoice.amount || 0), status: invoice.status as Invoice["status"], issued: String(invoice.issuedAt || "").slice(0, 10), due: String(invoice.dueAt || "").slice(0, 10) })),
    categories: categories.map((item) => ({ ...fromContent(item), name: item.data.name || item.title })), subCategories: subCategories.map(fromContent), banners: banners.map(fromContent), navCategories: navCategories.map((item) => ({ ...fromContent(item), name: item.data.name || item.title, categories: item.data.categories ?? [] })), sidebarOptions: sidebarOptions.map((item) => ({ ...fromContent(item), label: item.data.label || item.title })), customerTiers: customerTiers.map(fromContent),
    headerConfig: Object.keys(header || {}).length ? header : state.headerConfig, footerConfig: Object.keys(footer || {}).length ? footer : state.footerConfig, themeConfig: Object.keys(theme || {}).length ? theme : state.themeConfig, faviconConfig: Object.keys(favicon || {}).length ? favicon : state.faviconConfig,
  };
  emit();
}

/** Loads the authenticated customer's profile, saved addresses, and order history. */
export async function hydrateCustomerStore() {
  const [{ user }, { items }] = await Promise.all([api<{ user: Record<string, unknown> }>("/me"), api<{ items: Array<Record<string, unknown>> }>("/orders")]);
  const profile = (user.profile || {}) as Record<string, string>;
  state = {
    ...state,
    customerProfile: { fullName: String(user.fullName || ""), email: String(user.email || ""), phone: String(user.phone || ""), altPhone: profile.altPhone, gender: profile.gender || "", dob: profile.dob || "" },
    customerAddresses: ((user.addresses || []) as CustomerAddress[]),
    orders: items.map((order) => { const pay = (order.payment || {}) as Record<string, unknown>; return { id: String(order.id), orderNumber: String(order.orderNumber || ""), customer: String((order.customer as Record<string, unknown>)?.fullName || "Customer"), email: String((order.customer as Record<string, unknown>)?.email || ""), total: Number(order.total || 0), items: Array.isArray(order.items) ? order.items.map((item) => { const line = item as Record<string, unknown>; return { id: String(line.product || line.id || ""), title: String(line.name || "Product"), price: Number(line.unitPrice || line.price || 0), qty: Number(line.quantity || line.qty || 1), image: String(line.image || "") }; }) : 0, status: order.status as Order["status"], paymentStatus: order.paymentStatus as Order["paymentStatus"], paymentMethod: String(order.paymentMethod || ""), paymentProvider: String(pay.provider || ""), razorpayOrderId: String(pay.providerOrderId || ""), razorpayPaymentId: String(pay.providerPaymentId || ""), date: String(order.createdAt || "").slice(0, 10) }; }),
  };
  emit();
}

export const store = {
  getOrders: () => state.orders,
  getInvoices: () => state.invoices,
  getCoupons: () => state.coupons,
  getBanners: () => state.banners,
  getCompanyInvoiceSettings: () => state.companyInvoiceSettings,

  updateCompanyInvoiceSettings(patch: Partial<CompanyInvoiceSettings>) {
    state.companyInvoiceSettings = { ...state.companyInvoiceSettings, ...patch };
    emit();
    api("/admin/settings/invoices", { method: "PUT", body: JSON.stringify(state.companyInvoiceSettings) }).catch(() => undefined);
  },

  addCustomerTier(t: CustomerTier) {
    state.customerTiers = [t, ...state.customerTiers];
    emit();
    persistContent("customer-tiers", t);
  },
  updateCustomerTier(id: string, patch: Partial<CustomerTier>) {
    state.customerTiers = state.customerTiers.map((t) => (t.id === id ? { ...t, ...patch } : t));
    emit();
    persistContent("customer-tiers", patch, id);
  },
  removeCustomerTier(id: string) {
    state.customerTiers = state.customerTiers.filter((t) => t.id !== id);
    emit();
    persistContent("customer-tiers", {}, id, true);
  },

  addCoupon(c: Coupon) {
    state.coupons = [c, ...state.coupons];
    emit();
    const payload: CouponPayload = {
      code: c.code,
      description: c.description,
      type: c.type,
      value: c.value,
      minSpend: c.minSpend,
      category: c.category,
      usageLimit: c.usageLimit,
      expires: c.expires,
      active: c.active,
    };
    api<{ coupon: Coupon }>("/admin/coupons", { method: "POST", body: JSON.stringify(payload) })
      .then(({ coupon }) => {
        state.coupons = state.coupons.map((item) => (item.id === c.id ? coupon : item));
        emit();
      })
      .catch(() => undefined);
  },
  updateCoupon(id: string, patch: Partial<Coupon>) {
    state.coupons = state.coupons.map((c) => (c.id === id ? { ...c, ...patch } : c));
    emit();
    api(`/admin/coupons/${id}`, { method: "PATCH", body: JSON.stringify(patch) }).catch(() => undefined);
  },
  removeCoupon(id: string) {
    state.coupons = state.coupons.filter((c) => c.id !== id);
    emit();
    api(`/admin/coupons/${id}`, { method: "DELETE" }).catch(() => undefined);
  },
  incrementCouponUsage(id: string) {
    state.coupons = state.coupons.map((c) =>
      c.id === id ? { ...c, used: c.used + 1 } : c
    );
    emit();
  },

  addBanner(b: Banner) {
    state.banners = [b, ...state.banners];
    emit();
  },
  updateBanner(id: string, patch: Partial<Banner>) {
    state.banners = state.banners.map((b) => (b.id === id ? { ...b, ...patch } : b));
    emit();
  },
  removeBanner(id: string) {
    state.banners = state.banners.filter((b) => b.id !== id);
    emit();
  },

  updateOrder(id: string, patch: Partial<Order>) {
    state.orders = state.orders.map((o) => (o.id === id ? { ...o, ...patch } : o));
    emit();
    const backendPatch: Record<string, unknown> = {};
    if (patch.status) backendPatch.status = patch.status;
    if (patch.paymentStatus) backendPatch.paymentStatus = patch.paymentStatus;
    if (Object.keys(backendPatch).length) {
      api(`/admin/orders/${id}`, { method: "PATCH", body: JSON.stringify(backendPatch) }).catch(() => undefined);
    }
  },

  addOrder(o: Order) {
    state.orders = [o, ...state.orders];
    emit();
  },

  updateInvoice(id: string, patch: Partial<State["invoices"][number]>) {
    state.invoices = state.invoices.map((i) => (i.id === id ? { ...i, ...patch } : i));
    emit();
  },

  addInvoice(i: State["invoices"][number]) {
    state.invoices = [i, ...state.invoices];
    emit();
  },

  createInvoiceForOrder(order: Order): State["invoices"][number] {
    const existing = state.invoices.find((i) => i.orderId === order.id);
    if (existing) return existing;
    const seq = 200 + state.invoices.length + 1;
    const today = new Date();
    const due = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    const inv = {
      id: `INV-${today.getFullYear()}-${String(seq).padStart(4, "0")}`,
      orderId: order.id,
      customer: order.customer,
      amount: order.total,
      status:
        order.paymentStatus === "paid"
          ? ("paid" as const)
          : ("pending" as const),
      issued: iso(today),
      due: iso(due),
    };
    state.invoices = [inv, ...state.invoices];
    emit();
    return inv;
  },

  addSubCategory(item: Omit<SubCategory, "id">) {
    const id = `sc-${Date.now()}`;
    state.subCategories = [{ ...item, id }, ...state.subCategories];
    emit();
  },

  updateSubCategory(id: string, patch: Partial<SubCategory>) {
    state.subCategories = state.subCategories.map((sc) =>
      sc.id === id ? { ...sc, ...patch } : sc
    );
    emit();
  },

  removeSubCategory(id: string) {
    state.subCategories = state.subCategories.filter((sc) => sc.id !== id);
    emit();
  },

  addCategory(item: Omit<CategoryItem, "id">) {
    const id = `cat-${Date.now()}`;
    state.categories = [{ ...item, id }, ...state.categories];
    emit();
  },

  updateCategory(id: string, patch: Partial<CategoryItem>) {
    state.categories = state.categories.map((c) =>
      c.id === id ? { ...c, ...patch } : c
    );
    emit();
  },

  removeCategory(id: string) {
    state.categories = state.categories.filter((c) => c.id !== id);
    emit();
  },

  addNavCategory(group: Omit<NavCategoryGroup, "id">) {
    const id = `nc-${Date.now()}`;
    state.navCategories = [{ ...group, id }, ...state.navCategories];
    emit();
    persistContent("nav-categories", { ...group, title: group.name });
  },

  updateNavCategory(id: string, patch: Partial<NavCategoryGroup>) {
    state.navCategories = state.navCategories.map((nc) =>
      nc.id === id ? { ...nc, ...patch } : nc
    );
    emit();
    persistContent("nav-categories", { ...patch, title: patch.name }, id);
  },

  removeNavCategory(id: string) {
    state.navCategories = state.navCategories.filter((nc) => nc.id !== id);
    emit();
    persistContent("nav-categories", {}, id, true);
  },

  addSidebarOption(opt: Omit<SidebarOption, "id">) {
    const id = `so-${Date.now()}`;
    state.sidebarOptions = [{ ...opt, id }, ...state.sidebarOptions];
    emit();
    persistContent("sidebar-options", { ...opt, title: opt.label });
  },

  updateSidebarOption(id: string, patch: Partial<SidebarOption>) {
    state.sidebarOptions = state.sidebarOptions.map((opt) =>
      opt.id === id ? { ...opt, ...patch } : opt
    );
    emit();
    persistContent("sidebar-options", { ...patch, title: patch.label }, id);
  },

  removeSidebarOption(id: string) {
    state.sidebarOptions = state.sidebarOptions.filter((opt) => opt.id !== id);
    emit();
    persistContent("sidebar-options", {}, id, true);
  },

  addAdminUser(u: Omit<AdminUser, "id">) {
    const id = `usr-${Date.now()}`;
    state.adminUsers = [{ ...u, id }, ...state.adminUsers];
    emit();
  },

  updateAdminUser(id: string, patch: Partial<AdminUser>) {
    state.adminUsers = state.adminUsers.map((u) => (u.id === id ? { ...u, ...patch } : u));
    emit();
  },

  removeAdminUser(id: string) {
    state.adminUsers = state.adminUsers.filter((u) => u.id !== id);
    emit();
  },

  replaceAdminUsers(users: AdminUser[]) {
    state.adminUsers = users;
    emit();
  },

  addRole(r: Omit<Role, "id">) {
    const id = `role-${Date.now()}`;
    state.roles = [{ ...r, id }, ...state.roles];
    emit();
  },

  updateRole(id: string, patch: Partial<Role>) {
    state.roles = state.roles.map((r) => (r.id === id ? { ...r, ...patch } : r));
    emit();
  },

  removeRole(id: string) {
    state.roles = state.roles.filter((r) => r.id !== id);
    emit();
  },

  replaceRoles(roles: Role[]) {
    state.roles = roles;
    emit();
  },

  updateCustomerProfile(patch: Partial<CustomerProfile>) {
    state.customerProfile = { ...state.customerProfile, ...patch };
    emit();
    api("/me", { method: "PATCH", body: JSON.stringify({ fullName: state.customerProfile.fullName, email: state.customerProfile.email, altPhone: state.customerProfile.altPhone, gender: state.customerProfile.gender, dob: state.customerProfile.dob }) }).catch(() => undefined);
  },

  addCustomerAddress(addr: Omit<CustomerAddress, "id">) {
    const id = `addr-${Date.now()}`;
    const newAddr = { ...addr, id };
    if (newAddr.isDefault) {
      state.customerAddresses = state.customerAddresses.map((a) => ({ ...a, isDefault: false }));
    }
    state.customerAddresses = [newAddr, ...state.customerAddresses];
    emit();
    api<{ addresses: CustomerAddress[] }>("/me/addresses", { method: "POST", body: JSON.stringify(newAddr) }).then((result) => { state.customerAddresses = result.addresses; emit(); }).catch(() => undefined);
  },

  updateCustomerAddress(id: string, patch: Partial<CustomerAddress>) {
    if (patch.isDefault) {
      state.customerAddresses = state.customerAddresses.map((a) => ({ ...a, isDefault: false }));
    }
    state.customerAddresses = state.customerAddresses.map((a) =>
      a.id === id ? { ...a, ...patch } : a
    );
    emit();
    const address = state.customerAddresses.find((item) => item.id === id);
    if (address) api<{ addresses: CustomerAddress[] }>(`/me/addresses/${id}`, { method: "PATCH", body: JSON.stringify(address) }).then((result) => { state.customerAddresses = result.addresses; emit(); }).catch(() => undefined);
  },

  removeCustomerAddress(id: string) {
    state.customerAddresses = state.customerAddresses.filter((a) => a.id !== id);
    emit();
    api(`/me/addresses/${id}`, { method: "DELETE" }).catch(() => undefined);
  },

  setDefaultCustomerAddress(id: string) {
    state.customerAddresses = state.customerAddresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    emit();
  },

  getFooterConfig() {
    return state.footerConfig;
  },

  updateFooterConfig(patch: Partial<FooterConfig>) {
    state.footerConfig = { ...state.footerConfig, ...patch };
    emit();
    api("/admin/settings/footer", { method: "PUT", body: JSON.stringify(state.footerConfig) }).catch(() => undefined);
  },

  getHeaderConfig() {
    return state.headerConfig;
  },

  updateHeaderConfig(patch: Partial<HeaderConfig>) {
    state.headerConfig = { ...state.headerConfig, ...patch };
    emit();
    api("/admin/settings/header", { method: "PUT", body: JSON.stringify(state.headerConfig) }).catch(() => undefined);
  },

  getFaviconConfig() {
    return state.faviconConfig;
  },

  updateFaviconConfig(patch: Partial<FaviconConfig>) {
    state.faviconConfig = { ...state.faviconConfig, ...patch };
    emit();
    api("/admin/settings/favicon", { method: "PUT", body: JSON.stringify(state.faviconConfig) }).catch(() => undefined);
  },

  getThemeConfig() {
    return state.themeConfig;
  },

  updateThemeConfig(patch: Partial<ThemeConfig>) {
    state.themeConfig = { ...state.themeConfig, ...patch };
    emit();
    api("/admin/settings/theme", { method: "PUT", body: JSON.stringify(state.themeConfig) }).catch(() => undefined);
  },
};
