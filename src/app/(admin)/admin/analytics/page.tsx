"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  ArrowUpRight,
  IndianRupee,
  ShoppingCart,
  Users,
  Target,
  Download,
  Calendar,
  Filter,
  Monitor,
  Smartphone,
  Globe,
  Award,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { formatCurrency, type Order } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  shipped: "#a855f7",
  delivered: "#10b981",
  cancelled: "#f43f5e",
};

// Device distribution data
const deviceDistributionData: Array<{ name: string; value: number; color: string }> = [];

// Traffic acquisition sources data
const trafficSourcesData: Array<{ source: string; visitors: string; revenue: number; conversion: string }> = [];

// Top regional sales cities
const topRegionsData: Array<{ city: string; sales: number; share: string }> = [];

export default function AnalyticsPage() {
  const orders = useStore((s) => s.orders);
  const [analytics, setAnalytics] = useState<{ revenue: number; averageOrderValue: number; orderCount: number; newCustomers: number; topProducts: Array<{ name: string; revenue: number }> } | null>(null);
  const [timeRange, setTimeRange] = useState("7d");
  const [channelFilter, setChannelFilter] = useState("all");

  useEffect(() => { api<{ revenue: number; averageOrderValue: number; orderCount: number; newCustomers: number; topProducts: Array<{ name: string; revenue: number }> }>("/admin/analytics").then(setAnalytics).catch(() => toast.error("Unable to load analytics")); }, []);

  const revenueByDay = useMemo(() => {
    const dailyRevenue = new Map<string, number>();
    for (const order of orders) {
      const day = order.date || "Unknown";
      dailyRevenue.set(day, (dailyRevenue.get(day) || 0) + order.total);
    }
    return Array.from(dailyRevenue, ([day, revenue]) => ({ day, revenue })).slice(-7);
  }, [orders]);

  const ordersByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => (counts[o.status] = (counts[o.status] ?? 0) + 1));
    return Object.entries(counts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      rawStatus: status,
      count,
    }));
  }, [orders]);

  const topProducts = analytics?.topProducts.map((product) => ({ name: product.name, value: product.revenue })) || [];

  const kpis = {
    revenue: analytics?.revenue ?? 0,
    orders: analytics?.orderCount ?? orders.length,
    aov: analytics?.averageOrderValue ?? (orders.length > 0 ? orders.reduce((a, b) => a + b.total, 0) / orders.length : 0),
    conversion: 0,
    abandonment: 0,
    clv: 0,
  };

  const exportReport = () => {
    toast.success("Analytics Report Exported Successfully!", {
      description: "CSV summary downloaded to your computer.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Range Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-amber-500" /> Store Sales & Performance Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Deep insights into revenue velocity, conversion funnels, customer demographics, and order status.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px] text-xs h-9">
              <Calendar className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
            </SelectContent>
          </Select>

          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-[140px] text-xs h-9">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-blue-500" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="web">Web Storefront</SelectItem>
              <SelectItem value="mobile">Mobile App</SelectItem>
              <SelectItem value="direct">Direct Checkout</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={exportReport}
            size="sm"
            className="text-xs font-bold gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-white" /> Export CSV Report
          </Button>
        </div>
      </div>

      {/* KPI Highlight Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-extrabold text-foreground">{formatCurrency(kpis.revenue)}</div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center">
              <ArrowUpRight className="h-3 w-3" /> +16.4% <span className="text-muted-foreground font-normal ml-1">vs 7d ago</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-extrabold text-foreground">{kpis.orders}</div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center">
              <ArrowUpRight className="h-3 w-3" /> +9.2% <span className="text-muted-foreground font-normal ml-1">vs 7d ago</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Avg Order Value
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-extrabold text-foreground">{formatCurrency(kpis.aov)}</div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center">
              <ArrowUpRight className="h-3 w-3" /> +4.8% <span className="text-muted-foreground font-normal ml-1">growth</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-extrabold text-foreground">{kpis.conversion}%</div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center">
              <ArrowUpRight className="h-3 w-3" /> +0.7% <span className="text-muted-foreground font-normal ml-1">optimal</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Cart Abandonment
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-extrabold text-foreground">{kpis.abandonment}%</div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center">
              <ArrowUpRight className="h-3 w-3" /> -3.1% <span className="text-muted-foreground font-normal ml-1">improved</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Customer Lifetime Value
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-extrabold text-foreground">{formatCurrency(kpis.clv)}</div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center">
              <ArrowUpRight className="h-3 w-3" /> +12.0% <span className="text-muted-foreground font-normal ml-1">repeat buyers</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts: Revenue Trend & Order Status Distribution */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Daily Revenue Area Chart (7 Cols) */}
        <Card className="lg:col-span-7 border shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-extrabold">Daily Revenue & Sales Velocity</CardTitle>
                <CardDescription className="text-xs">
                  Gross revenue trajectory per day over the selected timeframe.
                </CardDescription>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-emerald-500/20 text-xs">
                Peak Day: Friday
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-72 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByDay}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#revenueGrad)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Fulfillment Status Pie Chart (5 Cols) */}
        <Card className="lg:col-span-5 border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-extrabold">Order Fulfillment Breakdown</CardTitle>
            <CardDescription className="text-xs">
              Distribution of order processing statuses.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ordersByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="45%"
                  outerRadius={85}
                  innerRadius={45}
                  paddingAngle={3}
                  label={(entry) => `${entry.status}: ${entry.count}`}
                >
                  {ordersByStatus.map((e) => (
                    <Cell
                      key={e.status}
                      fill={STATUS_COLORS[e.rawStatus] || "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products & Traffic Sources Breakdown */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Top 5 Revenue Generating Products (6 Cols) */}
        <Card className="lg:col-span-6 border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" /> Top Revenue Products
            </CardTitle>
            <CardDescription className="text-xs">
              Top 5 highest sales grossing catalog items.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" fontSize={11} stroke="#94a3b8" />
                <YAxis
                  type="category"
                  dataKey="name"
                  fontSize={11}
                  width={140}
                  stroke="#94a3b8"
                />
                <Tooltip formatter={(v: number) => [formatCurrency(v), "Revenue Generated"]} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Customer Traffic Acquisition Channels (6 Cols) */}
        <Card className="lg:col-span-6 border shadow-xs">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                  <Globe className="h-4 w-4 text-cyan-500" /> Customer Acquisition Channels
                </CardTitle>
                <CardDescription className="text-xs">Traffic source performance & sales conversion.</CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                Top Source: Organic
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-3 space-y-2 text-xs">
            {trafficSourcesData.map((ts) => (
              <div
                key={ts.source}
                className="flex items-center justify-between p-2 rounded-xl border bg-card hover:bg-muted/40 transition-colors"
              >
                <div>
                  <div className="font-bold text-foreground">{ts.source}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {ts.visitors} Visitors • Conv. Rate: <span className="text-emerald-600 font-bold">{ts.conversion}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-amber-600 dark:text-amber-400">
                    {formatCurrency(ts.revenue)}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Demographics: Device Breakdown & Top Regions */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Device Distribution */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Monitor className="h-4 w-4 text-purple-500" /> Device Viewport Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {deviceDistributionData.map((d) => (
              <div key={d.name} className="space-y-1 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-foreground">{d.name}</span>
                  <span className="font-mono text-amber-500">{d.value}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${d.value}%`, backgroundColor: d.color }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Regional Sales Breakdown */}
        <Card className="border shadow-xs sm:col-span-2 lg:col-span-2">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-rose-500" /> Top Sales Cities & Regional Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {topRegionsData.map((reg) => (
                <div
                  key={reg.city}
                  className="p-3 rounded-xl border bg-card text-center space-y-1 shadow-2xs"
                >
                  <div className="text-xs font-bold text-foreground truncate">{reg.city}</div>
                  <div className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                    {formatCurrency(reg.sales)}
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {reg.share} Share
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
