"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Mail,
  ExternalLink,
  Users,
  IndianRupee,
  ShoppingCart,
  Award,
  Download,
  Plus,
  LayoutGrid,
  List,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  ChevronRight,
  UserCheck,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { formatCurrency, type Order, type OrderItem } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";

const statusColor: Record<Order["status"], string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  processing: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  shipped: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  cancelled: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

type Customer = {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  orderCount: number;
  totalSpent: number;
  lastOrder: string;
  orders: Order[];
  tier: string;
};

function evaluateCustomerTier(totalSpent: number, orderCount: number, tiers: any[]): string {
  if (!tiers || tiers.length === 0) return "Regular";
  const sorted = [...tiers].sort((a, b) => b.minTotalSpent - a.minTotalSpent || b.minOrders - a.minOrders);
  for (const t of sorted) {
    if (totalSpent >= t.minTotalSpent && orderCount >= t.minOrders) {
      return t.name;
    }
  }
  return sorted[sorted.length - 1]?.name || "Regular";
}

type CustomerRecord = { fullName?: string; email?: string; phone?: string; addresses?: Array<{ city?: string; state?: string }> };

function buildCustomers(orders: Order[], tiers: any[], customerRecords: CustomerRecord[]): Customer[] {
  const map = new Map<string, Customer>();
  const customersByEmail = new Map(customerRecords.filter((customer) => customer.email).map((customer) => [customer.email!.toLowerCase(), customer]));

  for (const o of orders) {
    const key = o.email;
    const existing = map.get(key);

    if (existing) {
      existing.orderCount += 1;
      existing.totalSpent += o.total;
      existing.lastOrder = o.date > existing.lastOrder ? o.date : existing.lastOrder;
      existing.orders.push(o);
      existing.tier = evaluateCustomerTier(existing.totalSpent, existing.orderCount, tiers);
    } else {
      const totalSpent = o.total;
      const tier = evaluateCustomerTier(totalSpent, 1, tiers);
      const record = customersByEmail.get(key.toLowerCase());
      const address = record?.addresses?.[0];
      map.set(key, {
        name: o.customer,
        email: o.email,
        phone: record?.phone,
        location: [address?.city, address?.state].filter(Boolean).join(", ") || undefined,
        orderCount: 1,
        totalSpent: totalSpent,
        lastOrder: o.date,
        orders: [o],
        tier,
      });
    }
  }

  for (const record of customerRecords) {
    if (!record.email || map.has(record.email)) continue;
    const address = record.addresses?.[0];
    map.set(record.email, { name: record.fullName || "Customer", email: record.email, phone: record.phone, location: [address?.city, address?.state].filter(Boolean).join(", ") || undefined, orderCount: 0, totalSpent: 0, lastOrder: "", orders: [], tier: evaluateCustomerTier(0, 0, tiers) });
  }

  return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function CustomersPage() {
  const orders = useStore((s) => s.orders);
  const customerTiers = useStore((s) => s.customerTiers);
  const [customerRecords, setCustomerRecords] = useState<CustomerRecord[]>([]);
  useEffect(() => { api<{ items: CustomerRecord[] }>("/admin/customers").then(({ items }) => setCustomerRecords(items)).catch((error) => toast.error(error instanceof Error ? error.message : "Unable to load customers")); }, []);
  const customers = useMemo(() => buildCustomers(orders, customerTiers, customerRecords), [orders, customerTiers, customerRecords]);
  const [q, setQ] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selected, setSelected] = useState<Customer | null>(null);

  // New Customer Dialog
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchQ =
        !q ||
        c.name.toLowerCase().includes(q.toLowerCase()) ||
        c.email.toLowerCase().includes(q.toLowerCase()) ||
        (c.location && c.location.toLowerCase().includes(q.toLowerCase()));
      const matchT = tierFilter === "all" || c.tier === tierFilter;
      return matchQ && matchT;
    });
  }, [customers, q, tierFilter]);

  const totals = {
    count: customers.length,
    revenue: customers.reduce((a, c) => a + c.totalSpent, 0),
    avg: customers.length > 0 ? customers.reduce((a, c) => a + c.totalSpent, 0) / customers.length : 0,
    vipCount: customers.filter((c) => c.tier === "VIP Platinum").length,
  };

  const handleAddCustomer = async () => {
    if (!newCustName || !newCustEmail) {
      toast.error("Name and Email are required");
      return;
    }
    try {
      await api("/admin/customers", { method: "POST", body: JSON.stringify({ fullName: newCustName, email: newCustEmail, phone: newCustPhone.replace(/\D/g, "") || undefined }) });
      const { items } = await api<{ items: CustomerRecord[] }>("/admin/customers");
      setCustomerRecords(items);
      toast.success(`Customer ${newCustName} created successfully!`);
      setOpenNewDialog(false);
      setNewCustName("");
      setNewCustEmail("");
      setNewCustPhone("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create customer");
    }
  };

  const exportCustomersCsv = () => {
    const headers = ["Customer Name", "Email Address", "Phone", "Location", "Tier", "Total Orders", "Total Spent (INR)", "Last Order Date"];
    const rows = filtered.map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      c.email,
      c.phone || "",
      `"${(c.location || "").replace(/"/g, '""')}"`,
      c.tier,
      c.orderCount,
      c.totalSpent,
      c.lastOrder,
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `customers_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Customer Records Exported to CSV!", {
      description: `Exported ${filtered.length} customer records.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-amber-500" /> Customer Accounts & CRM
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track customer accounts, purchase history, lifetime value, and VIP tiers.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/admin/settings/customer-tiers">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold gap-1.5 h-9 shadow-xs"
            >
              <Award className="h-4 w-4 text-purple-500" /> Tier Rules
            </Button>
          </Link>

          <Button
            onClick={exportCustomersCsv}
            size="sm"
            className="text-xs font-bold gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
          >
            <Download className="h-4 w-4 text-white" /> Export CSV
          </Button>

          <Button
            onClick={() => setOpenNewDialog(true)}
            size="sm"
            className="text-xs font-bold gap-1.5 h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs"
          >
            <Plus className="h-4 w-4" /> Add New Customer
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Customer Accounts
            </CardTitle>
            <div className="p-2 rounded-xl bg-blue-500/10">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{totals.count}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Registered store buyers</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Customer Spent
            </CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <IndianRupee className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{formatCurrency(totals.revenue)}</div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Lifetime customer value</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Average Lifetime Spend
            </CardTitle>
            <div className="p-2 rounded-xl bg-amber-500/10">
              <ShoppingCart className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{formatCurrency(totals.avg)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Per active customer</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              VIP Platinum Buyers
            </CardTitle>
            <div className="p-2 rounded-xl bg-purple-500/10">
              <Award className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{totals.vipCount}</div>
            <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-1">High-value repeat buyers</p>
          </CardContent>
        </Card>
      </div>

      {/* Control Bar: Search + Tier Filter + View Toggle (Grid / Table) */}
      <Card className="border shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by customer name, email, or city..."
                className="pl-9 text-xs"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            {/* Filters & View Switcher */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Tier Filter */}
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-[150px] text-xs h-9">
                  <SelectValue placeholder="All Tiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="VIP Platinum">VIP Platinum</SelectItem>
                  <SelectItem value="Gold Buyer">Gold Buyer</SelectItem>
                  <SelectItem value="Regular">Regular</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle: Grid vs Table */}
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                    viewMode === "grid"
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="h-4 w-4" /> Cards
                </button>

                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                    viewMode === "table"
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Table View"
                >
                  <List className="h-4 w-4" /> Table
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GRID VIEW RENDERING */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Card
              key={c.email}
              onClick={() => setSelected(c)}
              className="group border shadow-xs hover:border-amber-500/50 hover:shadow-md hover:bg-[rgba(249,115,22,0.08)] transition-all duration-200 ease-in-out cursor-pointer p-4 space-y-3"
            >
              {/* Header Avatar & Tier */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-slate-200 shadow-2xs">
                    <AvatarFallback className="bg-amber-500/10 text-amber-600 font-bold">
                      {initials(c.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-amber-500 transition-colors">
                      {c.name}
                    </h3>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {c.email}
                    </div>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={`text-[10px] font-bold ${
                    c.tier === "VIP Platinum"
                      ? "bg-purple-500/10 text-purple-600 border-purple-500/30"
                      : c.tier === "Gold Buyer"
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                      : "bg-slate-500/10 text-slate-600 border-slate-300"
                  }`}
                >
                  {c.tier}
                </Badge>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/30 border text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Total Spent</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">
                    {formatCurrency(c.totalSpent)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Orders Count</span>
                  <span className="font-bold text-foreground">{c.orderCount} Orders</span>
                </div>
              </div>

              {/* Contact Footer */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-slate-400" /> {c.location}
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold text-muted-foreground group-hover:bg-amber-500 group-hover:text-white transition-all duration-200 ease-in-out">
                  View Profile →
                </Button>
              </div>
            </Card>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-card border rounded-2xl p-6">
              No customer accounts match your filter criteria.
            </div>
          )}
        </div>
      )}

      {/* TABLE VIEW RENDERING */}
      {viewMode === "table" && (
        <Card className="border shadow-xs">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs w-[22%]">Customer Name</TableHead>
                  <TableHead className="text-xs w-[22%]">Email Address</TableHead>
                  <TableHead className="text-xs w-[14%]">Location</TableHead>
                  <TableHead className="text-xs text-center w-[10%]">Orders</TableHead>
                  <TableHead className="text-xs text-right pr-6 w-[12%]">Total Spent</TableHead>
                  <TableHead className="text-xs text-center w-[10%]">Tier</TableHead>
                  <TableHead className="text-xs text-right w-[10%]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow
                    key={c.email}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => setSelected(c)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-amber-500/10 text-amber-600 font-bold">
                            {initials(c.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-xs text-foreground">{c.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{c.email}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.location || "India"}</TableCell>
                    <TableCell className="text-center text-xs font-bold font-mono">{c.orderCount}</TableCell>
                    <TableCell className="text-right pr-6 font-extrabold text-xs text-foreground">
                      {formatCurrency(c.totalSpent)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          c.tier === "VIP Platinum"
                            ? "bg-purple-500/10 text-purple-600 border-purple-500/30"
                            : c.tier === "Gold Buyer"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                            : "bg-slate-500/10 text-slate-600 border-slate-300"
                        }`}
                      >
                        {c.tier}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(c);
                        }}
                        className="h-8 text-xs font-bold gap-1.5 bg-background text-foreground hover:bg-muted shadow-2xs border border-border/80"
                      >
                        <Eye className="h-3.5 w-3.5 text-blue-500" />
                        View Account
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* CENTERED POPUP MODAL FOR CUSTOMER DETAILS */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          {selected && (
            <>
              <DialogHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border shadow-2xs">
                      <AvatarFallback className="bg-amber-500/10 text-amber-600 font-extrabold text-base">
                        {initials(selected.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
                        {selected.name}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <Mail className="h-3.5 w-3.5" /> {selected.email}
                      </DialogDescription>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-xs font-bold uppercase ${
                      selected.tier === "VIP Platinum"
                        ? "bg-purple-500/10 text-purple-600 border-purple-500/30"
                        : selected.tier === "Gold Buyer"
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                        : "bg-slate-500/10 text-slate-600 border-slate-300"
                    }`}
                  >
                    {selected.tier}
                  </Badge>
                </div>
              </DialogHeader>

              {/* Customer Stats Summary Grid */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl border bg-muted/20 text-center mt-2">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Total Orders</span>
                  <span className="text-base font-extrabold text-foreground">{selected.orderCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Lifetime Spent</span>
                  <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                    {formatCurrency(selected.totalSpent)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Last Order Date</span>
                  <span className="text-xs font-mono font-bold text-foreground">{selected.lastOrder}</span>
                </div>
              </div>

              {/* Order History Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                    Purchased Order History ({selected.orders.length})
                  </h3>
                  <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
                    <Link href={`/admin/orders?q=${encodeURIComponent(selected.name)}`}>
                      View all in Orders module →
                    </Link>
                  </Button>
                </div>

                <div className="space-y-2">
                  {selected.orders.map((o) => (
                    <Link
                      key={o.id}
                      href={`/admin/orders?q=${encodeURIComponent(o.id)}`}
                      className="flex items-center justify-between rounded-xl border p-3 bg-card hover:bg-muted/40 transition-colors"
                    >
                      <div>
                        <div className="font-bold text-xs text-foreground">{o.id}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {o.date} • {typeof o.items === "number" ? o.items : Array.isArray(o.items) ? o.items.length : 1} item(s)
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`text-[10px] font-bold ${statusColor[o.status]}`}>
                          {o.status}
                        </Badge>
                        <span className="font-extrabold text-xs text-foreground">{formatCurrency(o.total)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* NEW CUSTOMER DIALOG MODAL */}
      <Dialog open={openNewDialog} onOpenChange={setOpenNewDialog}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle className="text-base font-extrabold flex items-center gap-2">
              <Plus className="h-4 w-4 text-amber-500" /> Create Customer Account
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Full Name *</Label>
              <Input
                placeholder="e.g. Ramesh Kumar"
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Email Address *</Label>
              <Input
                placeholder="e.g. ramesh@example.com"
                value={newCustEmail}
                onChange={(e) => setNewCustEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Phone Number</Label>
              <Input
                placeholder="e.g. +91 98765 43210"
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenNewDialog(false)} className="text-xs font-semibold">
              Cancel
            </Button>
            <Button onClick={handleAddCustomer} className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs">
              Create Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
