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
import { api, hasPermission } from "@/lib/api";

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

export default function AdminDashboardPage() {
  const router = useRouter();
  const currentOrders = useStore((s) => s.orders);
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => { api<{ items: Product[] }>("/admin/products").then(({ items }) => setProducts(items)).catch((error) => toast.error(error instanceof Error ? error.message : "Unable to load products")); }, []);

  // Timeline Filter State
  const [timeline, setTimeline] = useState<TimelineFilter>("today");

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
        return "Today (24h Real-time)";
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

  // Today's date string (YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Timeline-aware Revenue Series for Chart
  const currentRevenueSeries = useMemo(() => {
    let filtered: typeof currentOrders = [];

    if (timeline === "today") {
      filtered = currentOrders.filter((o) => o.date === todayStr);
      // Group into hourly buckets — since we only have date-level granularity, put all into 12:00 bucket
      const buckets: Record<string, number> = { "00:00": 0, "04:00": 0, "08:00": 0, "12:00": 0, "16:00": 0, "20:00": 0 };
      filtered.forEach((o) => { buckets["12:00"] += o.total; });
      return Object.entries(buckets).map(([day, revenue]) => ({ day, revenue }));
    }

    if (timeline === "week") {
      const days: string[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const buckets: Record<string, number> = Object.fromEntries(days.map((d) => [d, 0]));
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        const iso = d.toISOString().slice(0, 10);
        const label = days[d.getDay() === 0 ? 6 : d.getDay() - 1];
        currentOrders.filter((o) => o.date === iso).forEach((o) => { buckets[label] = (buckets[label] || 0) + o.total; });
      }
      return days.map((d) => ({ day: d, revenue: buckets[d] }));
    }

    if (timeline === "month") {
      const now = new Date();
      const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      filtered = currentOrders.filter((o) => o.date?.startsWith(ym));
      const buckets: Record<string, number> = { "Week 1": 0, "Week 2": 0, "Week 3": 0, "Week 4": 0 };
      filtered.forEach((o) => {
        const day = parseInt(o.date?.slice(8, 10) || "1", 10);
        const week = day <= 7 ? "Week 1" : day <= 14 ? "Week 2" : day <= 21 ? "Week 3" : "Week 4";
        buckets[week] += o.total;
      });
      return Object.entries(buckets).map(([day, revenue]) => ({ day, revenue }));
    }

    if (timeline === "custom_month") {
      const ym = `${selectedMonthYear}-${selectedMonth}`;
      filtered = currentOrders.filter((o) => o.date?.startsWith(ym));
      const buckets: Record<string, number> = { "Week 1": 0, "Week 2": 0, "Week 3": 0, "Week 4": 0 };
      filtered.forEach((o) => {
        const day = parseInt(o.date?.slice(8, 10) || "1", 10);
        const week = day <= 7 ? "Week 1" : day <= 14 ? "Week 2" : day <= 21 ? "Week 3" : "Week 4";
        buckets[week] += o.total;
      });
      return Object.entries(buckets).map(([day, revenue]) => ({ day, revenue }));
    }

    if (timeline === "year") {
      const year = new Date().getFullYear().toString();
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const buckets: Record<string, number> = Object.fromEntries(months.map((m) => [m, 0]));
      currentOrders.filter((o) => o.date?.startsWith(year)).forEach((o) => {
        const monthIdx = parseInt(o.date?.slice(5, 7) || "1", 10) - 1;
        buckets[months[monthIdx]] = (buckets[months[monthIdx]] || 0) + o.total;
      });
      return months.map((m) => ({ day: m, revenue: buckets[m] }));
    }

    if (timeline === "custom_year") {
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const buckets: Record<string, number> = Object.fromEntries(months.map((m) => [m, 0]));
      currentOrders.filter((o) => o.date?.startsWith(selectedYear)).forEach((o) => {
        const monthIdx = parseInt(o.date?.slice(5, 7) || "1", 10) - 1;
        buckets[months[monthIdx]] = (buckets[months[monthIdx]] || 0) + o.total;
      });
      return months.map((m) => ({ day: m, revenue: buckets[m] }));
    }

    if (timeline === "custom_date") {
      filtered = currentOrders.filter((o) => o.date >= startDate && o.date <= endDate);
      const buckets = new Map<string, number>();
      filtered.forEach((o) => { buckets.set(o.date, (buckets.get(o.date) || 0) + o.total); });
      return Array.from(buckets, ([day, revenue]) => ({ day, revenue })).sort((a, b) => a.day.localeCompare(b.day));
    }

    return [];
  }, [currentOrders, timeline, todayStr, startDate, endDate, selectedMonth, selectedMonthYear, selectedYear]);

  // Real KPI stats computed from filtered orders based on active timeline
  const kpiStats = useMemo(() => {
    let filtered = currentOrders;

    if (timeline === "today") {
      filtered = currentOrders.filter((o) => o.date === todayStr);
    } else if (timeline === "week") {
      const now = new Date();
      const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 6);
      const weekAgoStr = weekAgo.toISOString().slice(0, 10);
      filtered = currentOrders.filter((o) => o.date >= weekAgoStr && o.date <= todayStr);
    } else if (timeline === "month") {
      const now = new Date();
      const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      filtered = currentOrders.filter((o) => o.date?.startsWith(ym));
    } else if (timeline === "year") {
      const year = new Date().getFullYear().toString();
      filtered = currentOrders.filter((o) => o.date?.startsWith(year));
    } else if (timeline === "custom_date") {
      filtered = currentOrders.filter((o) => o.date >= startDate && o.date <= endDate);
    } else if (timeline === "custom_month") {
      const ym = `${selectedMonthYear}-${selectedMonth}`;
      filtered = currentOrders.filter((o) => o.date?.startsWith(ym));
    } else if (timeline === "custom_year") {
      filtered = currentOrders.filter((o) => o.date?.startsWith(selectedYear));
    }

    const revenue = filtered.reduce((sum, o) => sum + o.total, 0);
    const orderCount = filtered.length;
    const aov = orderCount > 0 ? revenue / orderCount : 0;
    const delivered = filtered.filter((o) => o.status === "delivered").length;

    const periodLabels: Record<string, string> = {
      today: "Today",
      week: "This Week",
      month: "This Month",
      year: "This Year",
      custom_date: `${startDate} – ${endDate}`,
      custom_month: `${monthOptions.find((m) => m.value === selectedMonth)?.label} ${selectedMonthYear}`,
      custom_year: `${selectedYear} Annual`,
    };
    const period = periodLabels[timeline] || "Selected Period";

    return [
      {
        label: `Total Revenue (${period})`,
        value: formatCurrency(revenue),
        icon: IndianRupee,
        delta: "",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        periodText: `${orderCount} orders`,
      },
      {
        label: `Total Orders (${period})`,
        value: orderCount.toLocaleString("en-IN"),
        icon: ShoppingCart,
        delta: "",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        periodText: "from backend",
      },
      {
        label: "Avg Order Value (AOV)",
        value: formatCurrency(aov),
        icon: Package,
        delta: "",
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        periodText: "per order",
      },
      {
        label: "Delivered Orders",
        value: delivered.toLocaleString("en-IN"),
        icon: TrendingUp,
        delta: "",
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        periodText: `of ${orderCount} total`,
      },
    ];
  }, [currentOrders, timeline, todayStr, startDate, endDate, selectedMonth, selectedMonthYear, selectedYear]);

  // Filtered Category Stats list with real revenue share calculation
  const filteredCategoryStats = useMemo(() => {
    const allCategories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

    // First pass: compute revenue per category
    const categoryData = allCategories.map((category) => {
      const categoryProducts = products.filter((p) => p.category === category);
      const productIds = new Set(categoryProducts.map((p) => p.id));
      const categoryLines = currentOrders.flatMap((order) =>
        Array.isArray(order.items) ? order.items.filter((item) => productIds.has(item.id)) : []
      );
      const categoryRevenue = categoryLines.reduce((sum, item) => sum + item.price * item.qty, 0);
      const categoryOrders = categoryLines.reduce((sum, item) => sum + item.qty, 0);
      return {
        id: category,
        name: category,
        categoryKey: category,
        icon: Layers,
        color: "text-indigo-500",
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20",
        topProduct: categoryProducts[0]?.name || "—",
        activeProducts: categoryProducts.filter((p) => p.status === "active").length,
        revenue: categoryRevenue,
        orders: categoryOrders,
      };
    });

    // Compute total revenue for share calculation
    const totalRevenue = categoryData.reduce((sum, c) => sum + c.revenue, 0);

    const categories = categoryData.map((c) => {
      const share = totalRevenue > 0 ? Math.round((c.revenue / totalRevenue) * 100) : 0;
      const metrics = { revenue: c.revenue, orders: c.orders, delta: "", share };
      return {
        id: c.id,
        name: c.name,
        categoryKey: c.categoryKey,
        icon: c.icon,
        color: c.color,
        bg: c.bg,
        border: c.border,
        topProduct: c.topProduct,
        activeProducts: c.activeProducts,
        metrics: { today: metrics, week: metrics, month: metrics, year: metrics },
      };
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

  // Helper to extract category metric — all timeline keys share the same real computed value
  const getCategoryMetric = (cat: (typeof filteredCategoryStats)[0]) => {
    return cat.metrics.today;
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

          {hasPermission("website_builder:read") && <Button asChild size="sm" className="text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs self-start lg:self-auto">
            <Link href="/admin/builder">
              <Layout className="h-3.5 w-3.5" /> Page Builder
            </Link>
          </Button>}
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
                  onClick={() => setTimeline("today")}
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
        {kpiStats.map((s) => (
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
                <ArrowUpRight className="h-3.5 w-3.5" />{" "}
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
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{m.share}%</span>
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
                {kpiStats[0]?.value}
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
                  sales: c.metrics.today.revenue,
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
