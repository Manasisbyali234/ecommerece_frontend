"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  ShoppingBag,
  Truck,
  MapPin,
  Heart,
  Edit2,
  Plus,
  Trash2,
  Check,
  PackageCheck,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  FileText,
  RotateCcw,
  Star,
  ArrowRight,
  Home,
  Briefcase,
  Copy,
  Printer,
  Download,
  Search,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  LogOut,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

import { useStore, store, hydrateCustomerStore, type CustomerAddress, type CustomerProfile, type Order } from "@/lib/store";
import { useWishlist } from "@/lib/wishlist-context";
import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@/lib/mock-data";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";
import { api, clearAccessToken, getAccessToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi (NCT)", "Chandigarh", "Jammu & Kashmir", "Ladakh", "Puducherry",
  "Lakshadweep", "Dadra & Nagar Haveli", "Daman & Diu", "Andaman & Nicobar Islands",
];

export default function CustomerAccountDashboardPage() {
  const router = useRouter();
  const profile = useStore((s) => s.customerProfile);
  const addresses = useStore((s) => s.customerAddresses);
  const orders = useStore((s) => s.orders);
  const companySettings = useStore((s) => s.companyInvoiceSettings);
  const { wishlistProducts, toggleWishlist, wishlistCount } = useWishlist();
  const { addItem, openCart } = useCart();
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);

  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "addresses" | "wishlist">("orders");

  // Refresh orders from backend every 30s so status changes by admin are reflected
  useEffect(() => {
    if (!getAccessToken()) { router.replace("/"); return; }
    Promise.all([
      hydrateCustomerStore(),
      api<{ user: { hasPassword: boolean } }>("/me").then(({ user }) => setHasPassword(user.hasPassword)),
    ]).catch(() => undefined);
    const interval = setInterval(() => hydrateCustomerStore().catch(() => undefined), 30_000);
    return () => clearInterval(interval);
  }, [router]);

  // Order filters
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderMonthFilter, setOrderMonthFilter] = useState("all");
  const [orderYearFilter, setOrderYearFilter] = useState("all");

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = orderSearch.toLowerCase();
      const matchesSearch =
        !q ||
        order.id.toLowerCase().includes(q) ||
        (order.customer && order.customer.toLowerCase().includes(q)) ||
        (order.status && order.status.toLowerCase().includes(q));

      const matchesStatus =
        orderStatusFilter === "all" || order.status === orderStatusFilter;

      const orderDate = order.date ? new Date(order.date) : null;
      const matchesMonth =
        orderMonthFilter === "all" ||
        (orderDate && orderDate.getMonth() + 1 === parseInt(orderMonthFilter));
      const matchesYear =
        orderYearFilter === "all" ||
        (orderDate && orderDate.getFullYear() === parseInt(orderYearFilter));

      return matchesSearch && matchesStatus && matchesMonth && matchesYear;
    });
  }, [orders, orderSearch, orderStatusFilter, orderMonthFilter, orderYearFilter]);

  const orderYears = useMemo(() => {
    const years = new Set<number>();
    orders.forEach((o) => {
      if (o.date) years.add(new Date(o.date).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [orders]);

  // Sidebar nav items definition
  const sidebarNav = [
    { id: "orders" as const,    label: "My Orders",        icon: ShoppingBag,  badge: orders.length },
    { id: "wishlist" as const,  label: "Wishlist",          icon: Heart,        badge: wishlistCount },
    { id: "addresses" as const, label: "Saved Addresses",   icon: MapPin,       badge: addresses.length },
    { id: "profile" as const,   label: "Profile & Settings",icon: User,         badge: null },
  ];

  // PROFILE EDIT STATE
  const [profileDraft, setProfileDraft] = useState<CustomerProfile>({ ...profile });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // ADDRESS MODAL STATE
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressDraft, setAddressDraft] = useState<Omit<CustomerAddress, "id">>({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    type: "Home",
    isDefault: false,
  });

  // INVOICE & TRACKING MODAL STATE
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<Order | null>(null);
  const [trackingData, setTrackingData] = useState<Record<string, unknown> | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // DELETE ACCOUNT & LOGOUT STATE
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleLogout = () => {
    clearAccessToken();
    toast.success("Logged out successfully!", {
      description: "You have been logged out of your account.",
    });
    router.push("/");
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const confirmation = deleteConfirmText.trim().toUpperCase();
    if (confirmation !== "DELETE") {
      toast.error("Please type DELETE to confirm.");
      return;
    }
    try {
      setIsDeletingAccount(true);
      await api("/me", { method: "DELETE", body: JSON.stringify({ confirm: confirmation }) });
      clearAccessToken();
      toast.success("Account deletion request submitted!", {
        description: "Your account has been disabled and you have been logged out.",
      });
      setDeleteAccountOpen(false);
      setDeleteConfirmText("");
      router.push("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete account");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // PASSWORD CHANGE STATE
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((hasPassword && !currentPassword) || !newPassword || !confirmPassword) {
      toast.error("All password fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }
    try {
      await api("/me/password", { method: "PUT", body: JSON.stringify({ currentPassword: hasPassword ? currentPassword : undefined, newPassword }) });
      setHasPassword(true);
      toast.success(hasPassword ? "Password updated successfully!" : "Password set successfully!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save password"); }
  };

  // Profile Save
  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileDraft.fullName.trim() || !profileDraft.email.trim() || !profileDraft.phone.trim()) {
      toast.error("Full Name, Email, and Phone number are required.");
      return;
    }
    store.updateCustomerProfile(profileDraft);
    setIsEditingProfile(false);
    toast.success("Profile details updated successfully!");
  };

  // Address Actions
  const startAddAddress = () => {
    setEditingAddressId(null);
    setAddressDraft({
      fullName: profile.fullName || "",
      phone: profile.phone || "",
      street: "",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "",
      type: "Home",
      isDefault: addresses.length === 0,
    });
    setAddressModalOpen(true);
  };

  const startEditAddress = (addr: CustomerAddress) => {
    setEditingAddressId(addr.id);
    setAddressDraft({
      fullName: addr.fullName,
      phone: addr.phone,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      type: addr.type,
      isDefault: addr.isDefault,
    });
    setAddressModalOpen(true);
  };

  const saveAddress = () => {
    if (!addressDraft.fullName.trim() || !addressDraft.street.trim() || !addressDraft.pincode.trim()) {
      toast.error("Full Name, Street address, and Pincode are required.");
      return;
    }

    if (editingAddressId) {
      store.updateCustomerAddress(editingAddressId, addressDraft);
      toast.success("Delivery address updated!");
    } else {
      store.addCustomerAddress(addressDraft);
      toast.success("New delivery address added!");
    }

    setAddressModalOpen(false);
    setEditingAddressId(null);
  };

  const removeAddress = (id: string) => {
    store.removeCustomerAddress(id);
    toast.success("Address removed");
  };

  const handleReorder = (order: Order) => {
    const itemList = Array.isArray(order.items) ? order.items : [];
    if (itemList.length === 0) {
      toast.info("No reorderable items found for this order.");
      return;
    }
    itemList.forEach((item: any) => {
      addItem(
        {
          id: item.id,
          name: item.title,
          price: item.price,
          originalPrice: Math.round(item.price * 1.25),
          category: "General",
          image: item.image,
          rating: 4.8,
          reviewCount: 120,
          description: item.title,
          badge: "Best Seller",
          sku: item.id || `SKU-${Date.now()}`,
          stock: 50,
          status: "active",
        },
        item.qty
      );
    });
    toast.success("Items reordered & added to cart!");
    openCart();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
      {/* Main Dashboard Workspace */}
      <div className="mx-auto max-w-7xl px-3 pb-12 pt-4 sm:px-6 sm:pb-16 sm:pt-8 lg:px-8">
        {/* Dashboard Layout: Sidebar + Main Content */}
        <div className="flex items-start gap-4 lg:gap-6">

          {/* ── LEFT SIDEBAR ── */}
          <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-6 gap-3">

            {/* Navigation Links */}
            <nav className="bg-white dark:bg-slate-900 rounded-2xl border border-muted/60 shadow-xs overflow-hidden">
              <div className="px-4 py-3 border-b bg-muted/20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">My Account</p>
              </div>
              <div className="p-2 space-y-0.5">
                {sidebarNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? "bg-slate-900 text-white shadow-sm dark:bg-indigo-600"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className={`h-4 w-4 ${
                          isActive ? "text-amber-400" : "text-muted-foreground group-hover:text-foreground"
                        }`} />
                        {item.label}
                      </span>
                      {item.badge !== null && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                          isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Quick Links */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-muted/60 shadow-xs overflow-hidden">
              <div className="px-4 py-3 border-b bg-muted/20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quick Links</p>
              </div>
              <div className="p-2 space-y-0.5">
                {[
                  { label: "Shop Products", href: "/products", icon: ShoppingBag },
                  { label: "My Wishlist", href: "/wishlist", icon: Heart },
                  { label: "Help & FAQs", href: "/faq", icon: ShieldCheck },
                  { label: "Back to Home", href: "/", icon: Home },
                ].map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all"
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                      <ChevronRight className="h-3 w-3 ml-auto opacity-50" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-muted/60 shadow-xs overflow-hidden">
              <div className="px-4 py-3 border-b bg-muted/20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Account Actions</p>
              </div>
              <div className="p-2 space-y-0.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left"
                >
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                  Log Out
                </button>
                <button
                  onClick={() => setDeleteAccountOpen(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all text-left"
                >
                  <UserX className="h-4 w-4 text-rose-500" />
                  Delete Account
                </button>
              </div>
            </div>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <div className="flex-1 min-w-0">
            {/* Mobile Tab Bar */}
            <div className="mobile-scrollbar-none mb-4 flex gap-2 overflow-x-auto pb-2 lg:hidden">
              {sidebarNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "bg-white dark:bg-slate-900 text-muted-foreground border border-muted/60"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                    {item.badge !== null && (
                      <span className={`text-[10px] font-bold ${
                        isActive ? "text-amber-400" : "text-muted-foreground"
                      }`}>({item.badge})</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: ORDERS HISTORY */}
            {activeTab === "orders" && (
            <div className="space-y-4">

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-foreground">My Order History</h2>
                  <p className="text-xs text-muted-foreground">View past orders, track delivery progress, and download receipts.</p>
                </div>
                <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                  {filteredOrders.length} of {orders.length} orders
                </span>
              </div>

              {/* Filter Toolbar */}
              <div className="flex flex-col items-center gap-3 rounded-xl border border-muted/60 bg-white p-3 shadow-xs dark:bg-slate-900 sm:rounded-2xl md:flex-row">
                {/* Search */}
                <div className="relative flex-1 min-w-0 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by Order ID or status..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-9 pr-4 h-9 rounded-xl border border-muted-foreground/20 bg-muted/20 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
                  {/* Status Filter */}
                  <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                    <SelectTrigger className="h-8 w-36 rounded-lg border border-muted-foreground/20 bg-muted/20 text-xs px-2.5 focus:ring-1 focus:ring-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        { value: "all",        label: "All Statuses" },
                        { value: "pending",    label: "⏳ Pending" },
                        { value: "processing", label: "⚙️ Processing" },
                        { value: "shipped",    label: "🚚 Shipped" },
                        { value: "delivered",  label: "✅ Delivered" },
                        { value: "cancelled",  label: "❌ Cancelled" },
                        { value: "returned",   label: "↩️ Returned" },
                      ].map(({ value, label }) => (
                        <SelectItem key={value} value={value} className="status-select-item text-xs">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Month Filter */}
                  <select
                    value={orderMonthFilter}
                    onChange={(e) => setOrderMonthFilter(e.target.value)}
                    className="h-8 rounded-lg border border-muted-foreground/20 bg-muted/20 text-xs px-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="all">All Months</option>
                    {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
                      <option key={i+1} value={i+1}>{m}</option>
                    ))}
                  </select>

                  {/* Year Filter */}
                  <select
                    value={orderYearFilter}
                    onChange={(e) => setOrderYearFilter(e.target.value)}
                    className="h-8 rounded-lg border border-muted-foreground/20 bg-muted/20 text-xs px-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="all">All Years</option>
                    {orderYears.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>

                  {/* Clear Filters */}
                  {(orderSearch || orderStatusFilter !== "all" || orderMonthFilter !== "all" || orderYearFilter !== "all") && (
                    <button
                      onClick={() => {
                        setOrderSearch("");
                        setOrderStatusFilter("all");
                        setOrderMonthFilter("all");
                        setOrderYearFilter("all");
                      }}
                      className="h-8 px-3 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 transition-colors"
                    >
                      ✕ Clear Filters
                    </button>
                  )}
                </div>
              </div>

            {filteredOrders.length === 0 ? (
              <Card className="text-center py-16">
                <CardContent className="space-y-3">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-base font-bold">
                    {orders.length === 0 ? "No orders placed yet" : "No orders match your filters"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {orders.length === 0
                      ? "Explore our shop catalog and place your first order today!"
                      : "Try adjusting your search or clearing the filters above."}
                  </p>
                  {orders.length === 0 ? (
                    <Button asChild size="sm"><Link href="/products">Shop Catalog</Link></Button>
                  ) : (
                    <button
                      onClick={() => { setOrderSearch(""); setOrderStatusFilter("all"); setOrderMonthFilter("all"); setOrderYearFilter("all"); }}
                      className="text-xs font-semibold text-primary underline underline-offset-4"
                    >
                      Clear all filters
                    </button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="overflow-hidden border shadow-xs">
                    <CardHeader className="p-4 bg-muted/30 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0">
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Order ID:</span>
                          <span className="font-bold text-foreground font-mono">{order.id}</span>
                        </div>
                        <div className="border-l pl-3">
                          <span className="text-muted-foreground block text-[11px]">Date Placed:</span>
                          <span className="font-semibold">{order.date}</span>
                        </div>
                        <div className="border-l pl-3">
                          <span className="text-muted-foreground block text-[11px]">Payment Mode:</span>
                          <Badge variant="outline" className="text-[10px] font-semibold">{order.paymentMethod || "UPI"}</Badge>
                        </div>
                        <div className="border-l pl-3">
                          <span className="text-muted-foreground block text-[11px]">Total Amount:</span>
                          <span className="font-extrabold text-foreground">{formatCurrency(order.total)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`text-xs px-2.5 py-1 font-semibold ${
                            order.status.toLowerCase() === "delivered"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : order.status.toLowerCase() === "shipped" || order.status.toLowerCase() === "processing"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : "bg-slate-500/10 text-slate-400"
                          }`}
                        >
                          ● {order.status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-4">
                      {/* Items Thumbnails List */}
                      {Array.isArray(order.items) && order.items.length > 0 ? (
                        <div className="divide-y border rounded-xl overflow-hidden bg-background">
                          {order.items.map((item) => (
                            <div key={item.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="h-12 w-12 rounded-lg object-cover border bg-muted"
                                />
                                <div>
                                  <h4 className="font-semibold text-foreground">{item.title}</h4>
                                  <p className="text-[11px] text-muted-foreground">Qty: {item.qty} × {formatCurrency(item.price)}</p>
                                </div>
                              </div>
                              <span className="font-bold text-foreground">{formatCurrency(item.price * item.qty)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 text-xs text-muted-foreground bg-muted/20 rounded-xl border">
                          Order contains {typeof order.items === "number" ? order.items : 1} item(s).
                        </div>
                      )}

                      {/* Order Footer Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <span className="truncate max-w-md">{order.shippingAddress || "Indiranagar, Bengaluru, Karnataka 560038"}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {(order.status.toLowerCase() === "shipped" || order.status.toLowerCase() === "processing") && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs gap-1.5 border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 font-bold"
                              onClick={() => { setSelectedTrackingOrder(order); setTrackingData(null); api<Record<string, unknown>>(`/orders/${order.id}/tracking`).then((data) => setTrackingData(data)).catch(() => setTrackingData({})); }}
                            >
                              <Truck className="h-3.5 w-3.5 text-amber-500" /> Track Shipment
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5"
                            onClick={() => setSelectedInvoiceOrder(order)}
                          >
                            <FileText className="h-3.5 w-3.5 text-indigo-500" /> Receipt PDF
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 text-xs gap-1.5"
                            onClick={() => handleReorder(order)}
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Buy Again
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            </div>
            )}

          {/* TAB 2: SAVED ADDRESSES */}
            {/* TAB 2: ADDRESSES */}
            {activeTab === "addresses" && (
            <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Saved Delivery Addresses</h2>
                <p className="text-xs text-muted-foreground">Manage your home, office, and default shipping locations for quick 1-click checkout.</p>
              </div>

              <Button size="sm" onClick={startAddAddress} className="gap-1.5 text-xs font-bold">
                <Plus className="h-4 w-4" /> Add New Address
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
              {addresses.map((addr) => (
                <Card
                  key={addr.id}
                  className={`overflow-hidden border transition-all ${
                    addr.isDefault ? "border-primary ring-2 ring-primary/20 shadow-md" : "shadow-xs"
                  }`}
                >
                  <CardHeader className="p-4 bg-muted/30 border-b flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2">
                      {addr.type === "Home" ? (
                        <Home className="h-4 w-4 text-primary" />
                      ) : addr.type === "Work" ? (
                        <Briefcase className="h-4 w-4 text-indigo-500" />
                      ) : (
                        <MapPin className="h-4 w-4 text-emerald-500" />
                      )}
                      <CardTitle className="text-sm font-bold text-foreground">
                        {addr.type} Address
                      </CardTitle>
                    </div>

                    {addr.isDefault ? (
                      <Badge className="bg-primary text-primary-foreground font-bold text-[10px]">
                        ★ Default Shipping
                      </Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] text-muted-foreground hover:text-primary"
                        onClick={() => store.setDefaultCustomerAddress(addr.id)}
                      >
                        Make Default
                      </Button>
                    )}
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-1 text-xs">
                      <h4 className="font-bold text-foreground">{addr.fullName}</h4>
                      <p className="text-muted-foreground leading-relaxed">{addr.street}</p>
                      <p className="text-muted-foreground font-medium">
                        {addr.city}, {addr.state} — <span className="font-bold font-mono text-foreground">{addr.pincode}</span>
                      </p>
                      <p className="text-muted-foreground pt-1 flex items-center gap-1 font-mono text-[11px]">
                        <Phone className="h-3 w-3 text-primary" /> {addr.phone}
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => startEditAddress(addr)}
                      >
                        <Edit2 className="h-3 w-3" /> Edit
                      </Button>
                      {!addr.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive gap-1"
                          onClick={() => removeAddress(addr.id)}
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            </div>
            )}

          {/* TAB 4: PROFILE MANAGEMENT */}
            {/* TAB 3: PROFILE */}
            {activeTab === "profile" && (
              <div className="space-y-6 max-w-3xl">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Customer Profile Settings</h2>
                    <p className="text-xs text-muted-foreground">Manage your personal details, contact information, and security preferences.</p>
                  </div>
                  {!isEditingProfile && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditingProfile(true)}
                      className="gap-1.5 text-xs font-bold bg-muted/40 hover:bg-muted"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit Profile Details
                    </Button>
                  )}
                </div>

                {/* Personal Information Card */}
                <Card className="overflow-hidden border border-muted/70 shadow-xs">
                  <CardHeader className="p-0">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-white/10">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-bold text-white">Personal Information</CardTitle>
                          <p className="text-[10px] text-white/70 mt-0.5">Manage details like your contact numbers and date of birth</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={saveProfile} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="prof-name" className="text-xs font-semibold">Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              id="prof-name"
                              value={profileDraft.fullName}
                              onChange={(e) => setProfileDraft({ ...profileDraft, fullName: e.target.value })}
                              disabled={!isEditingProfile}
                              className="pl-9 text-xs bg-muted/20 disabled:opacity-80"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="prof-email" className="text-xs font-semibold">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              id="prof-email"
                              type="email"
                              value={profileDraft.email}
                              onChange={(e) => setProfileDraft({ ...profileDraft, email: e.target.value })}
                              disabled={!isEditingProfile}
                              className="pl-9 text-xs bg-muted/20 disabled:opacity-80"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="prof-phone" className="text-xs font-semibold">Primary Mobile Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              id="prof-phone"
                              value={profileDraft.phone}
                              onChange={(e) => setProfileDraft({ ...profileDraft, phone: e.target.value })}
                              disabled={!isEditingProfile}
                              className="pl-9 text-xs font-mono bg-muted/20 disabled:opacity-80"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="prof-alt-phone" className="text-xs font-semibold">Alternate Phone (Optional)</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              id="prof-alt-phone"
                              value={profileDraft.altPhone || ""}
                              onChange={(e) => setProfileDraft({ ...profileDraft, altPhone: e.target.value })}
                              disabled={!isEditingProfile}
                              className="pl-9 text-xs font-mono bg-muted/20 disabled:opacity-80"
                              placeholder="+91 Mobile number..."
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="prof-gender" className="text-xs font-semibold">Gender</Label>
                          <Select
                            value={profileDraft.gender}
                            onValueChange={(v) => setProfileDraft({ ...profileDraft, gender: v })}
                            disabled={!isEditingProfile}
                          >
                            <SelectTrigger className="h-9 text-xs bg-muted/20 disabled:opacity-80"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other / Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="prof-dob" className="text-xs font-semibold">Date of Birth</Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10" />
                            <Input
                              id="prof-dob"
                              type="date"
                              value={profileDraft.dob}
                              onChange={(e) => setProfileDraft({ ...profileDraft, dob: e.target.value })}
                              disabled={!isEditingProfile}
                              className="pl-9 text-xs bg-muted/20 disabled:opacity-80"
                            />
                          </div>
                        </div>
                      </div>

                      {isEditingProfile && (
                        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-muted/70">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setProfileDraft({ ...profile });
                              setIsEditingProfile(false);
                            }}
                            className="h-8 text-xs"
                          >
                            Cancel
                          </Button>
                          <Button type="submit" size="sm" className="h-8 text-xs font-bold gap-1.5">
                            <Check className="h-3.5 w-3.5" /> Save Changes
                          </Button>
                        </div>
                      )}
                    </form>
                  </CardContent>
                </Card>

                {/* Change Password Card */}
                <Card className="overflow-hidden border border-muted/70 shadow-xs">
                  <CardHeader className="p-0">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-white/10">
                          <KeyRound className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-bold text-white">{hasPassword ? "Change Password" : "Set a Password"}</CardTitle>
                          <p className="text-[10px] text-white/70 mt-0.5">{hasPassword ? "Keep your account secure by regularly updating your password" : "You signed in with OTP. Set a password to also log in with email & password."}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {hasPassword === null ? (
                      <p className="text-xs text-muted-foreground">Loading...</p>
                    ) : (
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                      <div className="space-y-4 max-w-xl">
                        {/* OTP-only accounts set their first password without a fictional current password. */}
                        {hasPassword && <div className="space-y-1.5">
                          <Label htmlFor="curr-pass" className="text-xs font-semibold">Current Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              id="curr-pass"
                              type={showCurrentPassword ? "text" : "password"}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className="pl-9 pr-10 text-xs bg-muted/20"
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword((prev) => !prev)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showCurrentPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>}

                        {/* New Password */}
                        <div className="space-y-1.5">
                          <Label htmlFor="new-pass" className="text-xs font-semibold">New Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              id="new-pass"
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="pl-9 pr-10 text-xs bg-muted/20"
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword((prev) => !prev)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                          <Label htmlFor="conf-pass" className="text-xs font-semibold">Confirm New Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              id="conf-pass"
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="pl-9 pr-10 text-xs bg-muted/20"
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword((prev) => !prev)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Password Requirements Checklist */}
                        <div className="bg-muted/10 border border-muted/50 p-3 rounded-xl space-y-2 text-xs">
                          <p className="font-bold text-[10px] uppercase text-muted-foreground tracking-wider">Password Requirements</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                            <div className="flex items-center gap-2">
                              <div className={`h-4 w-4 rounded-full flex items-center justify-center border ${
                                newPassword.length >= 8
                                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                  : "border-muted-foreground/30 text-muted-foreground"
                              }`}>
                                <Check className="h-2.5 w-2.5" />
                              </div>
                              <span className={newPassword.length >= 8 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}>
                                At least 8 characters
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`h-4 w-4 rounded-full flex items-center justify-center border ${
                                newPassword && confirmPassword && newPassword === confirmPassword
                                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                  : "border-muted-foreground/30 text-muted-foreground"
                              }`}>
                                <Check className="h-2.5 w-2.5" />
                              </div>
                              <span className={newPassword && confirmPassword && newPassword === confirmPassword ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}>
                                Passwords match
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                          <Button
                            type="submit"
                            size="sm"
                            className="h-8 text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs"
                          >
                            <KeyRound className="h-3.5 w-3.5" /> {hasPassword ? "Update Password" : "Set Password"}
                          </Button>
                        </div>
                      </div>
                    </form>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

          {/* TAB 5: MY WISHLIST */}
            {/* TAB 4: WISHLIST */}
            {activeTab === "wishlist" && (
            <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Saved Wishlist Products</h2>
                <p className="text-xs text-muted-foreground">Products saved in your wishlist for quick 1-click cart addition.</p>
              </div>

              <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs font-bold">
                <Link href="/products">Browse All Products</Link>
              </Button>
            </div>

            {wishlistCount === 0 ? (
              <Card className="text-center py-16">
                <CardContent className="space-y-3">
                  <Heart className="h-12 w-12 text-rose-500/40 mx-auto" />
                  <h3 className="text-base font-bold">Wishlist is empty</h3>
                  <p className="text-xs text-muted-foreground">Click the heart icon on any product to save it here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {wishlistProducts.map((p) => (
                  <Card key={p.id} className="overflow-hidden border shadow-xs flex flex-col justify-between group">
                    <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-900">
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <button
                        onClick={() => toggleWishlist(p.id)}
                        className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur flex items-center justify-center text-rose-500 hover:scale-110 transition-transform"
                      >
                        <Heart className="h-4 w-4 fill-rose-500" />
                      </button>
                    </div>

                    <CardContent className="p-4 space-y-3">
                      <div>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold mb-1">{p.category}</Badge>
                        <h4 className="font-bold text-xs text-foreground line-clamp-1">{p.name}</h4>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-foreground text-sm">{formatCurrency(p.price)}</span>
                        <Button
                          size="sm"
                          className="h-8 text-xs px-3 font-bold gap-1"
                          onClick={() => {
                            addItem(p, 1);
                            toast.success(`Added ${p.name} to cart!`);
                            openCart();
                          }}
                        >
                          <ShoppingBag className="h-3.5 w-3.5" /> Add to Cart
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            </div>
            )}

          </div>{/* end main content */}
        </div>{/* end sidebar layout */}
      </div>{/* end max-w-7xl container */}

      {/* ADD / EDIT ADDRESS DIALOG — Enhanced UI */}
      <Dialog open={addressModalOpen} onOpenChange={setAddressModalOpen}>
          <DialogContent className="max-w-xl gap-0 overflow-hidden rounded-xl p-0 shadow-2xl sm:rounded-2xl">

            {/* ── Gradient Header ── */}
            <div className="border-b border-border/50 bg-gradient-to-br from-primary/10 via-primary/5 to-background px-4 pb-4 pt-5 pr-12 sm:px-6 sm:pt-6 sm:pr-14">
              <div className="flex min-w-0 items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground leading-tight">
                    {editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {editingAddressId
                      ? "Update your saved delivery location details."
                      : "Save a new address for faster checkout."}
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* ── Scrollable Form Body ── */}
            <div className="max-h-[60vh] space-y-5 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">

              {/* Recipient Details */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <User className="h-3 w-3" /> Recipient Details
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="addr-fullname" className="text-xs font-semibold">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        id="addr-fullname"
                        placeholder="e.g. Aakash Sharma"
                        value={addressDraft.fullName}
                        onChange={(e) => setAddressDraft({ ...addressDraft, fullName: e.target.value })}
                        className="pl-9 text-sm h-9 bg-muted/40 border-border/70"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="addr-phone" className="text-xs font-semibold">
                      Mobile <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        id="addr-phone"
                        placeholder="+91 98765 43210"
                        value={addressDraft.phone}
                        onChange={(e) => setAddressDraft({ ...addressDraft, phone: e.target.value })}
                        className="pl-9 text-sm h-9 font-mono bg-muted/40 border-border/70"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Details */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" /> Address Details
                </p>
                <div className="space-y-2.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="addr-street" className="text-xs font-semibold">
                      Flat / House No. / Area &amp; Street <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="addr-street"
                      placeholder="e.g. Flat 402, Metro Residency, MG Road"
                      value={addressDraft.street}
                      onChange={(e) => setAddressDraft({ ...addressDraft, street: e.target.value })}
                      className="text-sm h-9 bg-muted/40 border-border/70"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="addr-city" className="text-xs font-semibold">City</Label>
                      <Input
                        id="addr-city"
                        placeholder="e.g. Bengaluru"
                        value={addressDraft.city}
                        onChange={(e) => setAddressDraft({ ...addressDraft, city: e.target.value })}
                        className="text-sm h-9 bg-muted/40 border-border/70"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="addr-pincode" className="text-xs font-semibold">
                        Pincode <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="addr-pincode"
                        placeholder="560038"
                        value={addressDraft.pincode}
                        onChange={(e) =>
                          setAddressDraft({ ...addressDraft, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })
                        }
                        className="text-sm h-9 font-mono bg-muted/40 border-border/70"
                        maxLength={6}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="addr-state" className="text-xs font-semibold">State / Union Territory</Label>
                    <Select
                      value={addressDraft.state}
                      onValueChange={(v) => setAddressDraft({ ...addressDraft, state: v })}
                    >
                      <SelectTrigger id="addr-state" className="h-9 text-sm bg-muted/40 border-border/70">
                        <SelectValue placeholder="Select State / UT" />
                      </SelectTrigger>
                      <SelectContent className="max-h-52">
                        {INDIAN_STATES.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Address Type — Card Button Selector */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Briefcase className="h-3 w-3" /> Address Type
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(["Home", "Work", "Other"] as Array<"Home" | "Work" | "Other">).map((type) => {
                    const icons = { Home, Work: Briefcase, Other: MapPin };
                    const subs = { Home: "All day", Work: "9AM – 6PM", Other: "Flexible" };
                    const Icon = icons[type];
                    const sub = subs[type];
                    const isSelected = addressDraft.type === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAddressDraft({ ...addressDraft, type })}
                        className={`relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-center transition-all duration-150 cursor-pointer select-none ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border/50 bg-muted/30 hover:border-border hover:bg-muted/50"
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-primary-foreground" />
                          </span>
                        )}
                        <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        <div>
                          <p className={`text-xs font-bold leading-none ${isSelected ? "text-primary" : "text-foreground"}`}>{type}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Set as Default — Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/50">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Set as Default Address</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">Auto-selected at checkout for all orders</p>
                  </div>
                </div>
                <Switch
                  checked={addressDraft.isDefault}
                  onCheckedChange={(checked) => setAddressDraft({ ...addressDraft, isDefault: checked })}
                />
              </div>

            </div>

            {/* ── Footer ── */}
            <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border/40 bg-muted/20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddressModalOpen(false)}
                className="h-9 px-4 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={saveAddress}
                className="h-9 px-5 text-xs font-bold gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                {editingAddressId ? "Update Address" : "Save Address"}
              </Button>
            </div>

          </DialogContent>
        </Dialog>

        {/* INVOICE / RECEIPT MODAL (IDENTICAL TO ADMIN DASHBOARD TAX INVOICE FORMAT) */}
        {selectedInvoiceOrder && (
          <Dialog open={!!selectedInvoiceOrder} onOpenChange={() => setSelectedInvoiceOrder(null)}>
            <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 border-2 bg-background">
              {(() => {
                const order = selectedInvoiceOrder;
                const invId = `INV-2026-${order.id.replace(/\D/g, "") || "9482"}`;
                const taxMultiplier = (companySettings.gstTaxRatePercent || 18) / 100;
                const grandTotal = order.total || 3689;
                const subtotal = grandTotal / (1 + taxMultiplier);
                const cgst = (grandTotal - subtotal) / 2;
                const sgst = cgst;

                const itemsList = Array.isArray(order.items) && order.items.length > 0
                  ? order.items
                  : [
                      {
                        id: "P-1001",
                        title: "Aurora Wireless Headphones",
                        price: Math.round((grandTotal * 0.82) || 3000),
                        qty: 1,
                      },
                    ];

                const statusColor: Record<string, string> = {
                  delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
                  shipped: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
                  processing: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
                  cancelled: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
                };

                return (
                  <div className="p-6 space-y-6 text-xs" id="tax-invoice-customer-printable">
                    {/* Header & Logo Banner */}
                    <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 pb-5 gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center font-extrabold text-slate-950 text-sm">
                            {(companySettings.companyName || "M")[0]}
                          </div>
                          <h2 className="text-xl font-black tracking-tight text-foreground uppercase">
                            {companySettings.companyName || "Retail Ltd."}
                          </h2>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {companySettings.tagline || "Premium Electronics & Lifestyle E-Commerce"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {companySettings.address || "Plot 42, Tech Park Avenue, Electronic City Phase 1"}, {companySettings.cityStatePincode || "Bengaluru, Karnataka - 560100"}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          GSTIN: <span className="font-bold text-foreground">{companySettings.gstin || "29AABCU9603R1ZM"}</span> • CIN: {companySettings.cin || "U72900KA2024PTC184920"}
                        </p>
                      </div>

                      <div className="text-right sm:text-right">
                        <div className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-extrabold text-xs uppercase tracking-wider rounded-md mb-2">
                          TAX INVOICE / ORIGINAL
                        </div>
                        <div className="font-mono text-base font-black text-foreground">{invId}</div>
                        <div className="text-[11px] text-muted-foreground">Date: <span className="font-mono font-bold text-foreground">{order.date}</span></div>
                        <div className="text-[11px] text-muted-foreground">Place of Supply: <span className="font-mono font-bold text-foreground">{companySettings.placeOfSupply || "29-Karnataka"}</span></div>
                      </div>
                    </div>

                    {/* Billed To & Shipped To Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border bg-muted/20">
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                          Billed To (Customer Details)
                        </span>
                        <div className="font-extrabold text-sm text-foreground">{profile.fullName}</div>
                        <div className="text-muted-foreground">{profile.email} • {profile.phone}</div>
                        <div className="text-muted-foreground text-[11px] mt-1">
                          {order.shippingAddress || "Flat 402, Metro Residency, MG Road, Indiranagar, Bengaluru 560038"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                          Order & Payment Reference
                        </span>
                        <div className="flex justify-between"><span className="text-muted-foreground">Order ID</span><span className="font-mono font-bold text-amber-600">{order.id}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Order Status</span><Badge variant="outline" className={`text-[10px] font-bold ${statusColor[order.status.toLowerCase()] || "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"}`}>{order.status}</Badge></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Payment Method</span><span className="font-bold text-foreground">{order.paymentMethod || "UPI / NetBanking"}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Payment Status</span><span className="font-extrabold text-emerald-600 dark:text-emerald-400">PAID & VERIFIED</span></div>
                      </div>
                    </div>

                    {/* Line Items Standard Invoice Table */}
                    <div className="rounded-xl border overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="text-xs font-bold w-12">S.No</TableHead>
                            <TableHead className="text-xs font-bold">Item Description</TableHead>
                            <TableHead className="text-xs font-bold text-center">HSN / SAC</TableHead>
                            <TableHead className="text-xs font-bold text-center">Qty</TableHead>
                            <TableHead className="text-xs font-bold text-right">Unit Price</TableHead>
                            <TableHead className="text-xs font-bold text-right">Taxable Val</TableHead>
                            <TableHead className="text-xs font-bold text-right">Total Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {itemsList.map((item: any, idx: number) => {
                            const price = item.price || 1000;
                            const qty = item.qty || 1;
                            const lineSubtotal = price * qty;
                            return (
                              <TableRow key={item.id || idx}>
                                <TableCell className="font-mono text-center">{idx + 1}</TableCell>
                                <TableCell>
                                  <div className="font-bold text-foreground">{item.title}</div>
                                  <div className="text-[10px] text-muted-foreground font-mono">SKU: {item.id}</div>
                                </TableCell>
                                <TableCell className="text-center font-mono text-muted-foreground">85183000</TableCell>
                                <TableCell className="text-center font-bold font-mono">{qty}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(price)}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(lineSubtotal / (1 + taxMultiplier))}</TableCell>
                                <TableCell className="text-right font-extrabold font-mono text-foreground">
                                  {formatCurrency(lineSubtotal)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Invoice Total Calculation Grid */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
                      <div className="space-y-2 max-w-sm">
                        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          Legal Terms & Declaration:
                        </div>
                        <div className="text-[10px] text-muted-foreground space-y-0.5 p-2.5 rounded-lg bg-muted/30 border">
                          <p>• {companySettings.legalTerms || "All prices are inclusive of GST. Goods once sold are covered under warranty."}</p>
                          <p>• Computer generated Tax Invoice — No physical signature required.</p>
                        </div>
                      </div>

                      <div className="w-full sm:w-72 space-y-2 p-3 rounded-xl border bg-muted/20 text-xs">
                        <div className="flex justify-between"><span className="text-muted-foreground">Taxable Value</span><span className="font-mono font-bold">{formatCurrency(subtotal)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">CGST ({(companySettings.gstTaxRatePercent || 18) / 2}%)</span><span className="font-mono font-bold">{formatCurrency(cgst)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">SGST ({(companySettings.gstTaxRatePercent || 18) / 2}%)</span><span className="font-mono font-bold">{formatCurrency(sgst)}</span></div>
                        <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Shipping & Delivery</span><span className="font-bold text-emerald-600">FREE</span></div>
                        <div className="flex justify-between items-center pt-1">
                          <span className="font-extrabold text-sm text-foreground">Grand Total Paid</span>
                          <span className="font-extrabold text-amber-600 dark:text-amber-400 text-base font-mono">
                            {formatCurrency(grandTotal)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Modal Actions Footer */}
                    <div className="pt-4 border-t flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" /> GSTIN: {companySettings.gstin || "29AABCU9603R1ZM"}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.print()}
                          className="text-xs font-bold gap-1.5"
                        >
                          <Printer className="h-3.5 w-3.5" /> Print Bill
                        </Button>

                        <Button
                          onClick={() => {
                            downloadInvoicePdf(
                              {
                                id: invId,
                                orderId: order.id,
                                customer: profile.fullName,
                                amount: order.total,
                                status: "paid",
                                issued: order.date,
                                due: order.date,
                              },
                              order,
                              profile.email,
                            );
                            toast.success(`Downloading Tax Invoice PDF for ${order.id}`);
                          }}
                          size="sm"
                          className="text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs"
                        >
                          <Download className="h-4 w-4" /> Download Tax Invoice PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </DialogContent>
          </Dialog>
        )}

        {/* LIVE SHIPMENT TRACKING MODAL */}
        {selectedTrackingOrder && (
          <Dialog open={!!selectedTrackingOrder} onOpenChange={() => { setSelectedTrackingOrder(null); setTrackingData(null); }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-bold">
                    <Truck className="h-5 w-5 text-amber-500" /> Live Order Tracking
                  </span>
                  <Badge className="bg-amber-500 text-slate-950 font-black text-xs uppercase">
                    {selectedTrackingOrder.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Real-time shipment tracking for Order ID: <span className="font-mono font-bold text-foreground">{selectedTrackingOrder.id}</span> (Placed on {selectedTrackingOrder.date})
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-2">
                {/* Visual Timeline Stepper */}
                <div className="border rounded-2xl p-5 bg-slate-900 text-slate-100 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-semibold text-slate-300">Shipment Progress Timeline</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={trackingLoading}
                      className="h-7 text-[11px] text-slate-300 hover:text-white"
                      onClick={async () => {
                        setTrackingLoading(true);
                        try {
                          const data = await api<Record<string, unknown>>(`/orders/${selectedTrackingOrder.id}/tracking`);
                          setTrackingData(data);
                          toast.success("Tracking checkpoints refreshed");
                        } catch {
                          toast.error("Unable to refresh tracking. Please try again.");
                        } finally {
                          setTrackingLoading(false);
                        }
                      }}
                    >
                      <RotateCcw className={`h-3 w-3 mr-1 ${trackingLoading ? "animate-spin" : ""}`} /> Refresh Checkpoints
                    </Button>
                  </div>

                  {(() => {
                    const status = selectedTrackingOrder.status;
                    const shipment = trackingData as { carrier?: string; tracking?: string; status?: string; eta?: string; events?: Array<{ status: string; description: string; timestamp: string; location?: string }> } | null;
                    const steps: Array<{ label: string; desc: string; icon: React.ReactNode; done: boolean; active: boolean }> = [
                      { label: "Order Confirmed & Payment Verified", desc: `Payment received via ${selectedTrackingOrder.paymentMethod || "Online Gateway"}.`, icon: <Check className="h-4 w-4" />, done: true, active: false },
                      { label: "Quality Inspection & Sealed", desc: "Items packed and dispatched from fulfillment center.", icon: <PackageCheck className="h-3.5 w-3.5" />, done: ["processing","shipped","delivered"].includes(status), active: status === "processing" && !shipment?.tracking },
                      { label: "Shipment Created / In Transit", desc: shipment?.carrier ? `Carrier: ${shipment.carrier}` : "Awaiting carrier pickup.", icon: <Truck className="h-3.5 w-3.5" />, done: ["shipped","delivered"].includes(status) || ["in_transit","out_for_delivery","delivered"].includes(shipment?.status || ""), active: status === "shipped" && shipment?.status === "in_transit" },
                      { label: "Out for Delivery", desc: "Courier executive will deliver to recipient address.", icon: <Clock className="h-3.5 w-3.5" />, done: shipment?.status === "out_for_delivery" || shipment?.status === "delivered" || status === "delivered", active: shipment?.status === "out_for_delivery" },
                      { label: "Package Delivered", desc: "Delivery confirmed.", icon: <CheckCircle2 className="h-3.5 w-3.5" />, done: status === "delivered" || shipment?.status === "delivered", active: false },
                    ];
                    const activeIdx = steps.findIndex((s) => s.active);
                    return (
                      <div className="relative border-l-2 border-emerald-500/40 pl-6 space-y-6 ml-2 text-xs">
                        {steps.map((step, i) => (
                          <div key={i} className={`relative ${!step.done && !step.active && i > (activeIdx >= 0 ? activeIdx : steps.filter(s=>s.done).length - 1) ? "opacity-40" : ""}`}>
                            <div className={`absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full font-bold shadow-md ${
                              step.done ? "bg-emerald-500 text-slate-950" :
                              step.active ? "bg-amber-500 text-slate-950 animate-pulse" :
                              "bg-slate-700 text-slate-300"
                            }`}>{step.icon}</div>
                            <div className="space-y-0.5">
                              <h4 className={`font-bold flex items-center gap-1.5 ${
                                step.done ? "text-white" : step.active ? "text-amber-400" : "text-slate-300"
                              }`}>
                                {step.label}
                                {step.active && <Badge variant="outline" className="text-[9px] bg-amber-500/20 text-amber-300 border-amber-500/40">Active</Badge>}
                              </h4>
                              <p className="text-[11px] text-slate-400">{step.desc}</p>
                              {step.done && <span className="text-[10px] text-emerald-400 font-mono">Completed</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Courier Info Card */}
                {(() => {
                  const shipment = trackingData as { carrier?: string; tracking?: string; status?: string; eta?: string } | null;
                  const awb = shipment?.tracking;
                  const carrier = shipment?.carrier;
                  const eta = shipment?.eta;
                  if (!awb && !carrier) {
                    return (
                      <div className="border rounded-xl p-4 bg-muted/30 text-xs text-muted-foreground text-center">
                        {trackingLoading ? "Loading tracking information..." : "Tracking information is not available yet."}
                      </div>
                    );
                  }
                  return (
                    <div className="border rounded-xl p-4 bg-muted/30 space-y-2.5 text-xs">
                      {carrier && (
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-muted-foreground font-medium">Courier Partner:</span>
                          <span className="font-bold text-foreground">{carrier}</span>
                        </div>
                      )}
                      {awb && (
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-muted-foreground font-medium">Waybill / AWB:</span>
                          <span className="font-mono font-bold text-primary flex items-center gap-1">
                            {awb}
                            <button onClick={() => { navigator.clipboard.writeText(awb); toast.success("AWB copied!"); }} className="text-muted-foreground hover:text-foreground">
                              <Copy className="h-3 w-3" />
                            </button>
                          </span>
                        </div>
                      )}
                      {eta && (
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-muted-foreground font-medium">Estimated Arrival:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{new Date(eta).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                      )}
                      <div className="space-y-1 pt-1">
                        <span className="text-muted-foreground font-medium block">Delivery Address:</span>
                        <p className="text-foreground font-medium">{selectedTrackingOrder.shippingAddress || "—"}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setSelectedTrackingOrder(null); setTrackingData(null); }}>
                  Close Tracking
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* DELETE ACCOUNT DIALOG — Premium UI */}
        <Dialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
          <DialogContent className="max-w-md gap-0 overflow-hidden rounded-xl p-0 shadow-2xl sm:rounded-2xl">
            <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-background px-6 pt-6 pb-4 border-b border-border/50 pr-14">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0 shadow-xs">
                  <UserX className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground leading-tight">
                    Delete Customer Account
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    This action disables your login immediately and submits your account for deletion.
                  </DialogDescription>
                </div>
              </div>
            </div>

            <form onSubmit={handleDeleteAccount}>
              <div className="p-6 space-y-4">
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 space-y-2 text-xs">
                  <p className="font-extrabold text-rose-700 dark:text-rose-400">WARNING:</p>
                  <ul className="list-disc pl-4 space-y-1 text-rose-600/90 dark:text-rose-300/90 text-[11px] leading-relaxed">
                    <li>You will be logged out and blocked from signing back in.</li>
                    <li>Saved delivery addresses will be removed.</li>
                    <li>Your wishlist and cart items will be cleared.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="del-confirm" className="text-xs font-bold text-foreground">
                    Type <span className="font-mono bg-muted px-1.5 py-0.5 rounded border text-rose-600 font-extrabold">DELETE</span> to confirm:
                  </Label>
                  <Input
                    id="del-confirm"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                    className="text-xs font-mono tracking-wider bg-muted/20 uppercase"
                    placeholder="Type DELETE..."
                    required
                  />
                </div>
              </div>

              <DialogFooter className="px-6 py-4 bg-muted/20 border-t border-border/50 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDeleteAccountOpen(false);
                    setDeleteConfirmText("");
                  }}
                  className="h-9 px-4 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={deleteConfirmText.trim().toUpperCase() !== "DELETE" || isDeletingAccount}
                  className="h-9 px-5 text-xs font-bold gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <UserX className="h-4 w-4" /> {isDeletingAccount ? "Deleting..." : "Delete Permanently"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
  );
}
