"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowUpRight,
  ArrowDownRight,
  IndianRupee,
  Package,
  ShoppingCart,
  Users,
  Plus,
  Layout,
  Ticket,
  FileText,
  Truck,
  CreditCard,
  Megaphone,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Store,
  Layers,
  Zap,
  Clock,
  Calendar,
  BarChart3,
  Search,
  Headphones,
  Footprints,
  Watch,
  Shirt,
  Briefcase,
  Home,
  PieChart,
  Percent,
  Tag,
  Eye,
  Filter,
  RotateCcw,
  RefreshCw,
  User,
  Mail,
  MapPin,
  Printer,
  ExternalLink,
  ShoppingBag,
  X,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";
import { formatCurrency, type Order, type Product } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { api } from "@/lib/api";

type TimelineFilter = "today" | "week" | "month" | "year" | "custom_date" | "custom_month" | "custom_year";

const statusVariant: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  processing: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  shipped: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  cancelled: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

const monthOptions = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const yearOptions = ["2026", "2025", "2024", "2023", "2022"];

// Timeline-based Revenue Datasets for Recharts
const presetRevenueSeries: Record<"today" | "week" | "month" | "year", { day: string; revenue: number }[]> = {
  today: [
    { day: "00:00", revenue: 1200 },
    { day: "04:00", revenue: 800 },
    { day: "08:00", revenue: 2400 },
    { day: "12:00", revenue: 4100 },
    { day: "16:00", revenue: 3800 },
    { day: "20:00", revenue: 2950 },
    { day: "23:59", revenue: 1400 },
  ],
  week: [
    { day: "Mon", revenue: 14200 },
    { day: "Tue", revenue: 18500 },
    { day: "Wed", revenue: 16800 },
    { day: "Thu", revenue: 22400 },
    { day: "Fri", revenue: 26100 },
    { day: "Sat", revenue: 29500 },
    { day: "Sun", revenue: 24800 },
  ],
  month: [
    { day: "Week 1", revenue: 98000 },
    { day: "Week 2", revenue: 114000 },
    { day: "Week 3", revenue: 132000 },
    { day: "Week 4", revenue: 141400 },
  ],
  year: [
    { day: "Jan", revenue: 380000 },
    { day: "Feb", revenue: 420000 },
    { day: "Mar", revenue: 460000 },
    { day: "Apr", revenue: 490000 },
    { day: "May", revenue: 530000 },
    { day: "Jun", revenue: 580000 },
    { day: "Jul", revenue: 640000 },
    { day: "Aug", revenue: 710000 },
    { day: "Sep", revenue: 690000 },
    { day: "Oct", revenue: 780000 },
    { day: "Nov", revenue: 890000 },
    { day: "Dec", revenue: 940000 },
  ],
};

// Base Raw category stats template
const baseCategoryStatsData = [
  {
    id: "audio",
    name: "Audio & Acoustics",
    categoryKey: "Audio",
    icon: Headphones,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    topProduct: "Aurora Wireless Headphones",
    activeProducts: 14,
    metrics: {
      today: { revenue: 6800, orders: 8, delta: "+18.4%", share: 42 },
      week: { revenue: 58400, orders: 64, delta: "+16.2%", share: 39 },
      month: { revenue: 215000, orders: 240, delta: "+24.1%", share: 44 },
      year: { revenue: 2450000, orders: 2650, delta: "+34.5%", share: 45 },
    },
  },
  {
    id: "footwear",
    name: "Footwear & Athletic",
    categoryKey: "Footwear",
    icon: Footprints,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    topProduct: "Urban Runner Sneakers",
    activeProducts: 18,
    metrics: {
      today: { revenue: 4200, orders: 4, delta: "+12.1%", share: 26 },
      week: { revenue: 38200, orders: 36, delta: "+14.8%", share: 25 },
      month: { revenue: 132000, orders: 142, delta: "+18.3%", share: 27 },
      year: { revenue: 1480000, orders: 1540, delta: "+28.2%", share: 27 },
    },
  },
  {
    id: "electronics",
    name: "Electronics & Wearables",
    categoryKey: "Electronics",
    icon: Watch,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    topProduct: "Pulse Smartwatch Series X",
    activeProducts: 12,
    metrics: {
      today: { revenue: 2800, orders: 3, delta: "+8.5%", share: 17 },
      week: { revenue: 26500, orders: 24, delta: "+11.4%", share: 18 },
      month: { revenue: 88000, orders: 92, delta: "+15.6%", share: 18 },
      year: { revenue: 980000, orders: 990, delta: "+22.4%", share: 18 },
    },
  },
  {
    id: "apparel",
    name: "Apparel & Fashion",
    categoryKey: "Apparel",
    icon: Shirt,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    topProduct: "Oversized Heavyweight Hoodie",
    activeProducts: 22,
    metrics: {
      today: { revenue: 1450, orders: 2, delta: "+5.2%", share: 9 },
      week: { revenue: 14800, orders: 18, delta: "+9.1%", share: 10 },
      month: { revenue: 54000, orders: 74, delta: "+12.8%", share: 11 },
      year: { revenue: 610000, orders: 850, delta: "+19.1%", share: 11 },
    },
  },
  {
    id: "bags",
    name: "Bags & Luggage",
    categoryKey: "Bags & Luggage",
    icon: Briefcase,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    topProduct: "Nomad Leather Backpack",
    activeProducts: 8,
    metrics: {
      today: { revenue: 2190, orders: 1, delta: "+15.0%", share: 13 },
      week: { revenue: 8760, orders: 4, delta: "+7.4%", share: 6 },
      month: { revenue: 32800, orders: 16, delta: "+10.5%", share: 6 },
      year: { revenue: 360000, orders: 175, delta: "+16.8%", share: 6 },
    },
  },
  {
    id: "home",
    name: "Home & Lifestyle",
    categoryKey: "Home & Lifestyle",
    icon: Home,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    topProduct: "Minimalist Ceramic Mug Set",
    activeProducts: 10,
    metrics: {
      today: { revenue: 890, orders: 2, delta: "+3.2%", share: 5 },
      week: { revenue: 5340, orders: 12, delta: "+6.8%", share: 4 },
      month: { revenue: 18500, orders: 42, delta: "+8.9%", share: 4 },
      year: { revenue: 210000, orders: 480, delta: "+14.2%", share: 4 },
    },
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const currentOrders = useStore((s) => s.orders);
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => { api<{ items: Product[] }>("/admin/products").then(({ items }) => setProducts(items)).catch((error) => toast.error(error instanceof Error ? error.message : "Unable to load products")); }, []);

  // Timeline Filter State
  const [timeline, setTimeline] = useState<TimelineFilter>("week");

  // Custom Selection States
  const [startDate, setStartDate] = useState("2026-08-01");
  const [endDate, setEndDate] = useState("2026-08-10");
  const [selectedMonth, setSelectedMonth] = useState("08");
  const [selectedMonthYear, setSelectedMonthYear] = useState("2026");
  const [selectedYear, setSelectedYear] = useState("2026");

  // Category Search & Filter
  const [categoryQuery, setCategoryQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  // Recent Orders Filter & Quick Preview Modal State
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);

  // Low Stock Modal & Search State
  const [openLowStockModal, setOpenLowStockModal] = useState(false);
  const [lowStockSearchQuery, setLowStockSearchQuery] = useState("");

  const lowStockProducts = useMemo(() => products.filter((p) => p.stock < 15), [products]);

  const modalLowStockProducts = useMemo(() => {
    if (!lowStockSearchQuery.trim()) return lowStockProducts;
    const query = lowStockSearchQuery.toLowerCase();
    return lowStockProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(query))
    );
  }, [lowStockProducts, lowStockSearchQuery]);

  // Filtered orders list for Recent Orders section
  const filteredRecentOrders = useMemo(() => {
    if (orderStatusFilter === "all") return currentOrders.slice(0, 5);
    return currentOrders.filter((o) => o.status === orderStatusFilter).slice(0, 5);
  }, [currentOrders, orderStatusFilter]);

  // Formatted Label for Active Timeline Range
  const activeTimelineLabel = useMemo(() => {
    switch (timeline) {
      case "today":
        return "Today (24h Real-time)";
      case "week":
        return "This Week (7 Days)";
      case "month":
        return "This Month (August 2026)";
      case "year":
        return "This Year (2026 YTD)";
      case "custom_date":
        return `Custom Range (${startDate} to ${endDate})`;
      case "custom_month": {
        const mObj = monthOptions.find((m) => m.value === selectedMonth);
        return `Custom Month (${mObj ? mObj.label : selectedMonth} ${selectedMonthYear})`;
      }
      case "custom_year":
        return `Custom Year (${selectedYear} Annual Data)`;
      default:
        return "This Week (7 Days)";
    }
  }, [timeline, startDate, endDate, selectedMonth, selectedMonthYear, selectedYear]);

  // Dynamic Chart Revenue Series based on Timeline or Custom Filters
  const currentRevenueSeries = useMemo(() => {
    const revenueByDay = new Map<string, number>();
    currentOrders.forEach((order) => revenueByDay.set(order.date || "Unknown", (revenueByDay.get(order.date || "Unknown") || 0) + order.total));
    return Array.from(revenueByDay, ([day, revenue]) => ({ day, revenue })).slice(-12);
  }, [currentOrders]);

  // Dynamic Overall KPI Stats computed according to Timeline / Custom Range
  const mockStats = useMemo(() => {
    switch (timeline) {
      case "today":
        return [
          {
            label: "Total Revenue (Today)",
            value: formatCurrency(16650),
            icon: IndianRupee,
            delta: "+18.4%",
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            periodText: "vs yesterday",
          },
          {
            label: "Total Orders (Today)",
            value: "20",
            icon: ShoppingCart,
            delta: "+15.2%",
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            periodText: "vs yesterday",
          },
          {
            label: "Avg Order Value (AOV)",
            value: formatCurrency(832),
            icon: Package,
            delta: "+5.4%",
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            periodText: "vs 24h avg",
          },
          {
            label: "Store Conversion Rate",
            value: "4.12%",
            icon: TrendingUp,
            delta: "+0.8%",
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            periodText: "vs yesterday",
          },
        ];

      case "month":
        return [
          {
            label: "Total Revenue (This Month)",
            value: formatCurrency(540300),
            icon: IndianRupee,
            delta: "+22.6%",
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            periodText: "vs last month",
          },
          {
            label: "Total Orders (This Month)",
            value: "680",
            icon: ShoppingCart,
            delta: "+18.3%",
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            periodText: "vs last month",
          },
          {
            label: "Avg Order Value (AOV)",
            value: formatCurrency(794),
            icon: Package,
            delta: "+6.8%",
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            periodText: "vs last month",
          },
          {
            label: "Store Conversion Rate",
            value: "3.95%",
            icon: TrendingUp,
            delta: "+1.1%",
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            periodText: "vs last month",
          },
        ];

      case "year":
        return [
          {
            label: "Total Revenue (This Year)",
            value: formatCurrency(6090000),
            icon: IndianRupee,
            delta: "+31.8%",
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            periodText: "vs last year",
          },
          {
            label: "Total Orders (This Year)",
            value: "7,680",
            icon: ShoppingCart,
            delta: "+28.4%",
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            periodText: "vs last year",
          },
          {
            label: "Avg Order Value (AOV)",
            value: formatCurrency(792),
            icon: Package,
            delta: "+8.2%",
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            periodText: "vs last year",
          },
          {
            label: "Store Conversion Rate",
            value: "4.08%",
            icon: TrendingUp,
            delta: "+1.4%",
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            periodText: "vs last year",
          },
        ];

      case "custom_date":
        return [
          {
            label: `Revenue (${startDate} - ${endDate})`,
            value: formatCurrency(68500),
            icon: IndianRupee,
            delta: "+16.8%",
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            periodText: "custom range",
          },
          {
            label: "Custom Range Orders",
            value: "86",
            icon: ShoppingCart,
            delta: "+12.4%",
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            periodText: "custom range",
          },
          {
            label: "Avg Order Value",
            value: formatCurrency(796),
            icon: Package,
            delta: "+5.1%",
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            periodText: "custom range",
          },
          {
            label: "Store Conversion Rate",
            value: "4.02%",
            icon: TrendingUp,
            delta: "+0.9%",
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            periodText: "custom range",
          },
        ];

      case "custom_month": {
        const mLabel = monthOptions.find((m) => m.value === selectedMonth)?.label || "Month";
        return [
          {
            label: `Revenue (${mLabel} ${selectedMonthYear})`,
            value: formatCurrency(449000),
            icon: IndianRupee,
            delta: "+21.2%",
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            periodText: `in ${mLabel}`,
          },
          {
            label: `Orders (${mLabel})`,
            value: "560",
            icon: ShoppingCart,
            delta: "+17.6%",
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            periodText: `in ${mLabel}`,
          },
          {
            label: "Avg Order Value",
            value: formatCurrency(801),
            icon: Package,
            delta: "+6.4%",
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            periodText: `in ${mLabel}`,
          },
          {
            label: "Store Conversion Rate",
            value: "3.98%",
            icon: TrendingUp,
            delta: "+1.2%",
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            periodText: `in ${mLabel}`,
          },
        ];
      }

      case "custom_year":
        return [
          {
            label: `Revenue (${selectedYear} Annual)`,
            value: formatCurrency(6370000),
            icon: IndianRupee,
            delta: "+29.5%",
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            periodText: `annual ${selectedYear}`,
          },
          {
            label: `Total Orders (${selectedYear})`,
            value: "7,940",
            icon: ShoppingCart,
            delta: "+26.1%",
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            periodText: `annual ${selectedYear}`,
          },
          {
            label: "Avg Order Value",
            value: formatCurrency(802),
            icon: Package,
            delta: "+7.8%",
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            periodText: `annual ${selectedYear}`,
          },
          {
            label: "Store Conversion Rate",
            value: "4.15%",
            icon: TrendingUp,
            delta: "+1.5%",
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            periodText: `annual ${selectedYear}`,
          },
        ];

      case "week":
      default:
        return [
          {
            label: "Total Revenue (This Week)",
            value: formatCurrency(152000),
            icon: IndianRupee,
            delta: "+14.2%",
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            periodText: "vs last 7 days",
          },
          {
            label: "Total Orders (This Week)",
            value: "158",
            icon: ShoppingCart,
            delta: "+8.4%",
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            periodText: "vs last 7 days",
          },
          {
            label: "Avg Order Value (AOV)",
            value: formatCurrency(962),
            icon: Package,
            delta: "+4.2%",
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            periodText: "vs last 7 days",
          },
          {
            label: "Store Conversion Rate",
            value: "3.84%",
            icon: TrendingUp,
            delta: "+0.6%",
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            periodText: "vs last 7 days",
          },
        ];
    }
  }, [timeline, startDate, endDate, selectedMonth, selectedMonthYear, selectedYear]);

  const stats = useMemo(() => {
    const revenue = currentOrders.reduce((total, order) => total + order.total, 0);
    const completed = currentOrders.filter((order) => order.status === "delivered").length;
    return [
      { label: "Total Revenue", value: formatCurrency(revenue), icon: IndianRupee, delta: "", color: "text-emerald-500", bg: "bg-emerald-500/10", periodText: "from database orders" },
      { label: "Total Orders", value: String(currentOrders.length), icon: ShoppingCart, delta: "", color: "text-blue-500", bg: "bg-blue-500/10", periodText: "from database orders" },
      { label: "Avg Order Value (AOV)", value: formatCurrency(currentOrders.length ? revenue / currentOrders.length : 0), icon: Package, delta: "", color: "text-purple-500", bg: "bg-purple-500/10", periodText: "from database orders" },
      { label: "Delivered Orders", value: String(completed), icon: TrendingUp, delta: "", color: "text-amber-500", bg: "bg-amber-500/10", periodText: "from database orders" },
    ];
  }, [currentOrders]);

  // Filtered Category Stats list
  const filteredCategoryStats = useMemo(() => {
    const categories = Array.from(new Set(products.map((product) => product.category).filter(Boolean))).map((category) => {
      const categoryProducts = products.filter((product) => product.category === category);
      const productIds = new Set(categoryProducts.map((product) => product.id));
      const categoryLines = currentOrders.flatMap((order) => Array.isArray(order.items) ? order.items.filter((item) => productIds.has(item.id)) : []);
      const categoryRevenue = categoryLines.reduce((sum, item) => sum + item.price * item.qty, 0);
      const metrics = { revenue: categoryRevenue, orders: categoryLines.reduce((sum, item) => sum + item.qty, 0), delta: "", share: 0 };
      return { id: category, name: category, categoryKey: category, icon: Layers, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20", topProduct: categoryProducts[0]?.name || "—", activeProducts: categoryProducts.filter((product) => product.status === "active").length, metrics: { today: metrics, week: metrics, month: metrics, year: metrics } };
    });
    return categories.filter((cat) => {
      const matchQ =
        !categoryQuery ||
        cat.name.toLowerCase().includes(categoryQuery.toLowerCase()) ||
        cat.categoryKey.toLowerCase().includes(categoryQuery.toLowerCase()) ||
        cat.topProduct.toLowerCase().includes(categoryQuery.toLowerCase());
      const matchCat =
        selectedCategoryFilter === "all" || cat.categoryKey === selectedCategoryFilter;
      return matchQ && matchCat;
    });
  }, [products, currentOrders, categoryQuery, selectedCategoryFilter]);

  // Helper to extract category metric based on active timeline filter
  const getCategoryMetric = (cat: typeof baseCategoryStatsData[0]) => {
    if (timeline === "today" || timeline === "week" || timeline === "month" || timeline === "year") {
      return cat.metrics[timeline];
    }
    if (timeline === "custom_date") {
      return { revenue: Math.round(cat.metrics.week.revenue * 1.2), orders: Math.round(cat.metrics.week.orders * 1.2), delta: "+15.2%", share: cat.metrics.week.share };
    }
    if (timeline === "custom_month") {
      return { revenue: Math.round(cat.metrics.month.revenue * 0.95), orders: Math.round(cat.metrics.month.orders * 0.95), delta: "+17.8%", share: cat.metrics.month.share };
    }
    if (timeline === "custom_year") {
      return { revenue: Math.round(cat.metrics.year.revenue * 0.92), orders: Math.round(cat.metrics.year.orders * 0.92), delta: "+24.6%", share: cat.metrics.year.share };
    }
    return cat.metrics.week;
  };

  // Helper for Order Status Icon
  const getOrderStatusIcon = (st: string) => {
    switch (st) {
      case "pending":
        return <Clock className="h-3.5 w-3.5 text-amber-500" />;
      case "processing":
        return <RefreshCw className="h-3.5 w-3.5 text-blue-500 animate-spin" />;
      case "shipped":
        return <Truck className="h-3.5 w-3.5 text-purple-500" />;
      case "delivered":
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case "cancelled":
        return <XCircle className="h-3.5 w-3.5 text-rose-500" />;
      default:
        return <Activity className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview + Timeline & Custom Filter Controls */}
      <div className="flex flex-col gap-4 border-b pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Store className="h-6 w-6 text-primary" /> Store Overview Dashboard
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Real-time storefront performance, timeline analytics, custom date range filtering, and category breakdowns.
            </p>
          </div>

          <Button asChild size="sm" className="text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs self-start lg:self-auto">
            <Link href="/admin/builder">
              <Layout className="h-3.5 w-3.5" /> Page Builder
            </Link>
          </Button>
        </div>

        {/* TIMELINE & CUSTOM FILTER CONTROL BAR */}
        <div className="p-3 rounded-xl border bg-muted/40 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Preset Timeline Segmented Buttons */}
            <div className="flex items-center p-1 bg-background rounded-lg border shadow-2xs flex-wrap gap-1">
              <span className="text-[11px] font-bold text-muted-foreground px-2 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" /> Range:
              </span>

              {[
                { id: "today", label: "Today" },
                { id: "week", label: "This Week" },
                { id: "month", label: "This Month" },
                { id: "year", label: "This Year" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimeline(t.id as any)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                    timeline === t.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Custom Mode Switcher Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setTimeline("custom_date")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                  timeline === "custom_date"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-background hover:bg-muted/50 text-foreground"
                }`}
              >
                <Calendar className="h-3.5 w-3.5" /> Custom Date Range
              </button>

              <button
                type="button"
                onClick={() => setTimeline("custom_month")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                  timeline === "custom_month"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-background hover:bg-muted/50 text-foreground"
                }`}
              >
                <Filter className="h-3.5 w-3.5" /> Select Month
              </button>

              <button
                type="button"
                onClick={() => setTimeline("custom_year")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                  timeline === "custom_year"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-background hover:bg-muted/50 text-foreground"
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" /> Select Year
              </button>

              {timeline.startsWith("custom_") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTimeline("week")}
                  className="h-8 text-xs font-bold text-rose-500 hover:text-rose-600 gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </Button>
              )}
            </div>
          </div>

          {/* DYNAMIC CUSTOM INPUT CONTROLS */}
          {timeline === "custom_date" && (
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">Start Date:</span>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 text-xs w-[140px] bg-background"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">End Date:</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 text-xs w-[140px] bg-background"
                />
              </div>

              <Badge variant="outline" className="text-xs font-mono font-semibold bg-background">
                Range: {startDate} to {endDate}
              </Badge>
            </div>
          )}

          {timeline === "custom_month" && (
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">Month:</span>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="h-8 text-xs w-[140px] bg-background">
                    <SelectValue placeholder="Select Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">Year:</span>
                <Select value={selectedMonthYear} onValueChange={setSelectedMonthYear}>
                  <SelectTrigger className="h-8 text-xs w-[110px] bg-background">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Badge variant="outline" className="text-xs font-mono font-semibold bg-background">
                Selected: {monthOptions.find((m) => m.value === selectedMonth)?.label} {selectedMonthYear}
              </Badge>
            </div>
          )}

          {timeline === "custom_year" && (
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">Annual Year:</span>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="h-8 text-xs w-[130px] bg-background">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y} Annual
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Badge variant="outline" className="text-xs font-mono font-semibold bg-background">
                Full Year {selectedYear} YTD
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Active Timeline Context Badge Bar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-primary/10 via-indigo-500/5 to-amber-500/10 border border-primary/20">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-foreground">
            Active Analytics Range: <span className="text-primary">{activeTimelineLabel}</span>
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">
          Dynamic Auto Sync
        </Badge>
      </div>

      {/* KPI Performance Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {s.label}
              </CardTitle>
              <div className={`p-2 rounded-xl ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-foreground">{s.value}</div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                <ArrowUpRight className="h-3.5 w-3.5" /> {s.delta}{" "}
                <span className="text-muted-foreground font-normal">{s.periodText}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* CATEGORY-WISE STATISTICS & PERFORMANCE CARDS SECTION */}
      {/* ========================================================================= */}
      <Card className="border shadow-xs">
        <CardHeader className="pb-4 border-b bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-extrabold flex items-center gap-2">
                <PieChart className="h-5 w-5 text-indigo-500" /> Category Performance & Revenue Breakdown
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Category-wise statistics, revenue breakdown, units sold, and market share for {activeTimelineLabel}.
              </CardDescription>
            </div>

            {/* Category Search & Filter */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search category or top product..."
                  value={categoryQuery}
                  onChange={(e) => setCategoryQuery(e.target.value)}
                  className="pl-8 text-xs h-8 w-[180px] bg-background"
                />
              </div>

              <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                <SelectTrigger className="h-8 text-xs w-[140px] bg-background">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Audio">Audio</SelectItem>
                  <SelectItem value="Footwear">Footwear</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Apparel">Apparel</SelectItem>
                  <SelectItem value="Bags & Luggage">Bags & Luggage</SelectItem>
                  <SelectItem value="Home & Lifestyle">Home & Lifestyle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategoryStats.map((cat) => {
              const m = getCategoryMetric(cat);
              const IconComp = cat.icon;

              return (
                <div
                  key={cat.id}
                  className={`p-4 rounded-xl border ${cat.border} bg-card hover:shadow-md transition-all space-y-3 relative overflow-hidden group`}
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${cat.bg}`}>
                        <IconComp className={`h-4 w-4 ${cat.color}`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          {cat.name}
                        </h3>
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {cat.activeProducts} Active Catalog Items
                        </span>
                      </div>
                    </div>

                    <Badge variant="outline" className={`text-[10px] font-bold ${cat.color} ${cat.bg}`}>
                      {m.share}% Share
                    </Badge>
                  </div>

                  {/* Category Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-b py-2 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground font-medium block uppercase tracking-wider">
                        Revenue
                      </span>
                      <span className="text-base font-extrabold text-foreground">
                        {formatCurrency(m.revenue)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground font-medium block uppercase tracking-wider">
                        Orders / Units
                      </span>
                      <span className="text-base font-extrabold text-foreground">
                        {m.orders} Sales
                      </span>
                    </div>
                  </div>

                  {/* Category Progress Share Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground font-medium">Market Share Ratio</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{m.delta} ↑</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${m.share}%` }}
                      />
                    </div>
                  </div>

                  {/* Top Selling Product Pill */}
                  <div className="pt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Top Item:</span>
                    <span className="text-xs font-semibold text-foreground truncate max-w-[170px]" title={cat.topProduct}>
                      {cat.topProduct}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Revenue Trend Chart (7 Cols) */}
        <Card className="lg:col-span-7 border shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-extrabold">
                  Revenue & Sales Velocity ({activeTimelineLabel})
                </CardTitle>
                <CardDescription className="text-xs">
                  Storefront transaction trajectory for the selected timeframe.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                +14.2% ↑
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-72 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentRevenueSeries}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" fontSize={11} stroke="#94a3b8" />
                <YAxis fontSize={11} stroke="#94a3b8" />
                <Tooltip formatter={(v: number) => [formatCurrency(v), "Revenue"]} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f59e0b"
                  fill="url(#rev)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Sales Distribution (5 Cols) */}
        <Card className="lg:col-span-5 border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-extrabold">Category Revenue Comparison</CardTitle>
            <CardDescription className="text-xs">
              Revenue distribution across store categories for {activeTimelineLabel}.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredCategoryStats.map((c) => ({
                    name: c.categoryKey,
                    sales: c.metrics.week.revenue,
                  }))}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" fontSize={11} stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" fontSize={11} stroke="#94a3b8" width={80} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), "Sales"]} />
                <Bar dataKey="sales" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* HIGHLY ENHANCED RECENT STORE ORDERS & TOP PRODUCTS GRID */}
      {/* ========================================================================= */}
      <div className="grid gap-6 lg:grid-cols-12 items-stretch">
        {/* Recent Orders (7 Cols) */}
        <Card className="lg:col-span-7 border shadow-xs overflow-hidden flex flex-col justify-between">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-extrabold">Recent Store Orders</CardTitle>
                    <Badge className="bg-emerald-500 text-white text-[10px] font-extrabold px-1.5 py-0 animate-pulse">
                      LIVE STREAM
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Real-time customer order transactions & delivery status.
                  </CardDescription>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1">
                <Button asChild variant="ghost" size="sm" className="text-xs font-semibold text-primary">
                  <Link href="/admin/orders">View All Orders →</Link>
                </Button>
              </div>
            </div>

            {/* Filter Tabs Row */}
            <div className="flex items-center gap-1 pt-2 overflow-x-auto">
              {[
                { id: "all", label: "All Orders" },
                { id: "pending", label: "Pending", color: "text-amber-500" },
                { id: "processing", label: "Processing", color: "text-blue-500" },
                { id: "shipped", label: "Shipped", color: "text-purple-500" },
                { id: "delivered", label: "Delivered", color: "text-emerald-500" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setOrderStatusFilter(tab.id)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    orderStatusFilter === tab.id
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-background/70 hover:bg-background text-muted-foreground border"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 flex flex-col justify-between">
            {filteredRecentOrders.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground space-y-1 flex-1 flex flex-col items-center justify-center min-h-[220px]">
                <ShoppingCart className="h-8 w-8 mx-auto text-muted-foreground/60" />
                <p className="text-xs font-medium">No {orderStatusFilter} orders found in recent list.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-xs font-bold py-2.5">Order ID & Date</TableHead>
                      <TableHead className="text-xs font-bold py-2.5">Customer Details</TableHead>
                      <TableHead className="text-xs font-bold py-2.5">Payment</TableHead>
                      <TableHead className="text-xs font-bold py-2.5">Fulfillment Status</TableHead>
                      <TableHead className="text-xs font-bold text-right py-2.5">Amount & Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecentOrders.map((o) => {
                      const initials = o.customer
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2);

                      return (
                        <TableRow
                          key={o.id}
                          className="hover:bg-muted/40 transition-colors group cursor-pointer"
                          onClick={() => setPreviewOrder(o)}
                        >
                          {/* Order ID & Date */}
                          <TableCell className="py-3">
                            <div className="flex flex-col">
                              <span className="font-mono text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                {o.id}
                              </span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {o.date || "Today, 11:42 AM"}
                              </span>
                            </div>
                          </TableCell>

                          {/* Customer Avatar & Email */}
                          <TableCell className="py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-extrabold text-xs flex items-center justify-center border shrink-0">
                                {initials}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-foreground truncate">{o.customer}</span>
                                <span className="text-[10px] text-muted-foreground truncate">{o.email || "customer@store.local"}</span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Payment Status & Mode */}
                          <TableCell className="py-3">
                            <div className="flex flex-col text-xs">
                              <Badge variant="outline" className={`w-fit text-[10px] font-bold ${
                                o.paymentStatus === "paid"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              }`}>
                                {o.paymentStatus === "paid" ? "✓ Paid" : "COD Pending"}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                {o.paymentMethod || "Razorpay UPI"}
                              </span>
                            </div>
                          </TableCell>

                          {/* Fulfillment Status */}
                          <TableCell className="py-3">
                            <Badge className={`text-xs font-bold gap-1 py-1 px-2.5 border ${statusVariant[o.status] || "bg-muted text-foreground"}`} variant="outline">
                              {getOrderStatusIcon(o.status)}
                              <span className="capitalize">{o.status}</span>
                            </Badge>
                          </TableCell>

                          {/* Total Amount & Action Buttons */}
                          <TableCell className="text-right py-3">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-extrabold text-sm text-foreground">
                                {formatCurrency(o.total)}
                              </span>
                              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-primary hover:bg-primary/10"
                                  title="Quick Preview Order"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewOrder(o);
                                  }}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  title="View Order Invoice"
                                  asChild
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Link href="/admin/invoices">
                                    <FileText className="h-3.5 w-3.5" />
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Selling Products (5 Cols) */}
        <Card className="lg:col-span-5 border shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-extrabold">Top Selling Catalog Products</CardTitle>
                <CardDescription className="text-xs">Highest revenue generating items.</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs font-semibold">
                <Link href="/admin/products">Catalog →</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
            {products.slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl border bg-card hover:bg-muted/30 transition-colors flex-1">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-cover border shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-foreground truncate">{p.name}</h4>
                    <span className="text-[10px] text-muted-foreground font-mono">Stock: {p.stock} units</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                    {formatCurrency(p.price)}
                  </div>
                  <Badge variant="outline" className="text-[9px] font-mono">
                    High Demand
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 6-Column Low Stock Inventory Alerts + 6-Column Category Stock Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Low Stock Inventory Alerts List Table View (Col 6) */}
        <Card className="lg:col-span-6 border shadow-xs overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-3.5 sm:p-4 bg-muted/20 border-b flex flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-xs sm:text-sm font-extrabold tracking-tight text-foreground">
                  Low Stock Inventory Alerts
                </CardTitle>
                <CardDescription className="text-[11px] text-muted-foreground">
                  Products requiring immediate restock
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 px-2 py-0.5">
                {lowStockProducts.length} Items Low
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpenLowStockModal(true)}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-500/10 h-7 px-2 cursor-pointer gap-1"
              >
                <span>View All</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 flex flex-col justify-between">
            {lowStockProducts.length === 0 ? (
              <div className="p-6 text-center text-emerald-600 dark:text-emerald-400 space-y-1 my-auto">
                <CheckCircle2 className="h-6 w-6 mx-auto text-emerald-500" />
                <div className="text-xs font-bold">All inventory stock levels are healthy!</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="text-[11px]">
                      <TableHead className="py-2 font-bold">Product</TableHead>
                      <TableHead className="py-2 font-bold">SKU Code</TableHead>
                      <TableHead className="py-2 font-bold">Category</TableHead>
                      <TableHead className="py-2 font-bold text-right">Stock Alert</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockProducts.slice(0, 5).map((item) => (
                      <TableRow
                        key={item.id}
                        onClick={() => router.push(`/admin/products?q=${encodeURIComponent(item.sku)}&edit=${item.id}`)}
                        className="group cursor-pointer hover:bg-amber-500/5 transition-colors text-xs"
                      >
                        {/* Product Image & Name */}
                        <TableCell className="py-2.5 font-medium">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-9 w-9 rounded-md object-cover border shrink-0 group-hover:scale-105 transition-transform"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-foreground truncate group-hover:text-amber-600 transition-colors text-xs max-w-[140px] sm:max-w-[180px]">
                                {item.name}
                              </div>
                              <div className="text-[10px] text-muted-foreground font-semibold">
                                {formatCurrency(item.price)}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* SKU Code */}
                        <TableCell className="py-2.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                          {item.sku}
                        </TableCell>

                        {/* Category & Sub-Category */}
                        <TableCell className="py-2.5 text-[11px]">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {item.category}
                            </span>
                            {item.subCategory && (
                              <span className="text-[10px] text-muted-foreground">
                                {item.subCategory}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Stock Counter Badge */}
                        <TableCell className="py-2.5 text-right whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-extrabold ${
                              item.stock <= 5
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse"
                                : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                            }`}
                          >
                            {item.stock} left
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category & Inventory Health Summary (Col 6) */}
        <Card className="lg:col-span-6 border shadow-xs flex flex-col justify-between">
          <CardHeader className="p-3.5 sm:p-4 bg-muted/20 border-b flex flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-xs sm:text-sm font-extrabold tracking-tight text-foreground">
                  Inventory Health & Categories
                </CardTitle>
                <CardDescription className="text-[11px] text-muted-foreground">
                  Stock distribution across main store categories
                </CardDescription>
              </div>
            </div>

            <Badge variant="outline" className="text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 px-2 py-0.5">
              {products.length} Total SKUs
            </Badge>
          </CardHeader>

          <CardContent className="p-3.5 sm:p-4 space-y-3 flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 space-y-1">
                <div className="text-[11px] text-muted-foreground font-semibold">Total Stock Units</div>
                <div className="text-lg font-black text-foreground">
                  {products.reduce((acc, curr) => acc + curr.stock, 0)} Units
                </div>
              </div>
              <div className="p-3 rounded-xl border bg-amber-500/5 border-amber-500/20 space-y-1">
                <div className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold">Low Stock Items</div>
                <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                  {lowStockProducts.length} Items
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-foreground">Category Stock Share:</div>
              {Array.from(new Set(products.map((p) => p.category))).slice(0, 3).map((cat) => {
                const count = products.filter((p) => p.category === cat).length;
                const percent = Math.round((count / products.length) * 100);

                return (
                  <div key={cat} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-muted-foreground">{cat}</span>
                      <span className="font-mono text-foreground">{count} SKUs ({percent}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* ALL LOW STOCK PRODUCTS POPUP MODAL */}
      {/* ========================================================================= */}
      <Dialog open={openLowStockModal} onOpenChange={setOpenLowStockModal}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-5 border-b bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-background">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-2xs">
                  <AlertTriangle className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <DialogTitle className="text-base font-extrabold tracking-tight flex items-center gap-2">
                    All Low Stock Inventory Items
                    <Badge variant="outline" className="text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">
                      {lowStockProducts.length} Items Below Threshold
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Real-time list of all catalog items requiring stock replenishment (stock &lt; 15 units).
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Quick Search bar inside Modal */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={lowStockSearchQuery}
                onChange={(e) => setLowStockSearchQuery(e.target.value)}
                placeholder="Search low stock items by name, SKU, or category..."
                className="pl-9 text-xs h-9 bg-background/80 rounded-xl"
              />
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-0">
            {modalLowStockProducts.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground space-y-2">
                <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500" />
                <div className="text-xs font-bold">No low stock items match "{lowStockSearchQuery}"</div>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-md">
                  <TableRow className="text-xs">
                    <TableHead className="py-2.5 font-bold">Product</TableHead>
                    <TableHead className="py-2.5 font-bold">SKU Code</TableHead>
                    <TableHead className="py-2.5 font-bold">Category</TableHead>
                    <TableHead className="py-2.5 font-bold text-center">Stock Level</TableHead>
                    <TableHead className="py-2.5 font-bold text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modalLowStockProducts.map((item) => (
                    <TableRow
                      key={item.id}
                      onClick={() => {
                        setOpenLowStockModal(false);
                        router.push(`/admin/products?q=${encodeURIComponent(item.sku)}&edit=${item.id}`);
                      }}
                      className="group cursor-pointer hover:bg-amber-500/5 transition-colors text-xs"
                    >
                      <TableCell className="py-3 font-medium">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-10 w-10 rounded-lg object-cover border shrink-0 group-hover:scale-105 transition-transform"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-foreground truncate group-hover:text-amber-600 transition-colors text-xs">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-semibold">
                              {formatCurrency(item.price)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {item.sku}
                      </TableCell>
                      <TableCell className="py-3 text-xs">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">
                            {item.category}
                          </span>
                          {item.subCategory && (
                            <span className="text-[10px] text-muted-foreground">
                              {item.subCategory}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-center whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-xs font-extrabold px-2.5 py-0.5 ${
                            item.stock <= 5
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                          }`}
                        >
                          {item.stock} Units Left
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          className="h-8 px-3 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-2xs gap-1"
                        >
                          <span>Update Stock</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter className="p-4 border-t bg-muted/20 flex flex-row items-center justify-between">
            <div className="text-xs text-muted-foreground font-medium">
              Showing {modalLowStockProducts.length} of {lowStockProducts.length} low stock items
            </div>
            <Button
              variant="outline"
              onClick={() => setOpenLowStockModal(false)}
              className="text-xs font-bold rounded-xl"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* QUICK ORDER DETAIL PREVIEW DIALOG MODAL */}
      {/* ========================================================================= */}
      <Dialog open={Boolean(previewOrder)} onOpenChange={(open) => !open && setPreviewOrder(null)}>
        {previewOrder && (
          <DialogContent className="max-w-xl p-0 border shadow-2xl rounded-xl">
            <DialogHeader className="p-4 border-b bg-muted/20">
              <div className="flex items-center justify-between pr-6">
                <div>
                  <DialogTitle className="text-base font-extrabold flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-primary" /> Order {previewOrder.id}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Placed on {previewOrder.date || "Today"} • Payment: {previewOrder.paymentMethod || "Razorpay UPI"}
                  </DialogDescription>
                </div>

                <Badge className={`text-xs font-bold gap-1 ${statusVariant[previewOrder.status] || "bg-muted text-foreground"}`} variant="outline">
                  {getOrderStatusIcon(previewOrder.status)}
                  <span className="capitalize">{previewOrder.status}</span>
                </Badge>
              </div>
            </DialogHeader>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {/* Customer & Delivery Address Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border bg-muted/20">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Customer Details</span>
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <User className="h-3.5 w-3.5 text-primary" /> {previewOrder.customer}
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                    <Mail className="h-3.5 w-3.5" /> {previewOrder.email || "customer@store.local"}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Shipping Address</span>
                  <div className="flex items-start gap-1.5 text-foreground font-medium">
                    <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{previewOrder.shippingAddress || "142 MG Road, Indiranagar, Bengaluru, KA 560038"}</span>
                  </div>
                </div>
              </div>

              {/* Purchased Items List */}
              <div className="space-y-2">
                <span className="font-bold text-foreground block text-xs">Purchased Item Breakdown</span>
                <div className="space-y-2 border rounded-xl p-3 bg-card">
                  {Array.isArray(previewOrder.items) ? (
                    previewOrder.items.map((it) => (
                      <div key={it.id} className="flex items-center justify-between gap-3 p-2 rounded-lg border bg-muted/10">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={it.image} alt={it.title} className="h-10 w-10 rounded-lg object-cover border shrink-0" />
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-foreground truncate">{it.title}</h4>
                            <span className="text-[11px] text-muted-foreground">Qty: {it.qty} × {formatCurrency(it.price)}</span>
                          </div>
                        </div>
                        <span className="font-extrabold text-xs text-foreground shrink-0">
                          {formatCurrency(it.price * it.qty)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between p-2 rounded-lg border bg-muted/10">
                      <div className="flex items-center gap-2">
                        <Package className="h-8 w-8 text-primary p-1 bg-primary/10 rounded-md" />
                        <div>
                          <h4 className="font-bold text-xs text-foreground">Standard Storefront Package</h4>
                          <span className="text-[11px] text-muted-foreground">{previewOrder.items} item(s) included</span>
                        </div>
                      </div>
                      <span className="font-extrabold text-xs text-foreground">{formatCurrency(previewOrder.total)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Financial Summary */}
              <div className="p-3 rounded-xl border bg-muted/10 space-y-1.5">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal Amount</span>
                  <span>{formatCurrency(previewOrder.total)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Express Logistics Shipping</span>
                  <span className="text-emerald-600 font-bold">FREE</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Estimated Taxes (GST 18%)</span>
                  <span>Included</span>
                </div>
                <div className="border-t pt-1.5 flex justify-between font-extrabold text-sm text-foreground">
                  <span>Total Order Amount Billed</span>
                  <span className="text-primary">{formatCurrency(previewOrder.total)}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 border-t bg-muted/20 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-semibold gap-1.5"
                onClick={() => {
                  toast.success(`Printing order label for ${previewOrder.id}...`);
                }}
              >
                <Printer className="h-3.5 w-3.5" /> Print Order Details
              </Button>

              <div className="flex items-center gap-2">
                <Button asChild size="sm" className="text-xs font-bold gap-1 bg-primary">
                  <Link href="/admin/invoices">
                    View Invoice <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
