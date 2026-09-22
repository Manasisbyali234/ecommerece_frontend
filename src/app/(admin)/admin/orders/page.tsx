"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  Search,
  FileText,
  Mail,
  ExternalLink,
  Download,
  ChevronDown,
  Eye,
  Copy,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  ArrowRight,
  PackageCheck,
  ShoppingBag,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { formatCurrency, type Order, type OrderItem } from "@/lib/mock-data";
import { store, useStore } from "@/lib/store";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";

const statusColor: Record<Order["status"], string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  processing: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  shipped: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  cancelled: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

const paymentColor: Record<Order["paymentStatus"], string> = {
  paid: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  unpaid: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  refunded: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
};

function getItemCount(items: number | OrderItem[]): number {
  if (typeof items === "number") return items;
  if (Array.isArray(items)) {
    return items.reduce((acc, item) => acc + (typeof item?.qty === "number" ? item.qty : 1), 0);
  }
  return 1;
}

function renderItemsCell(items: number | OrderItem[]): React.ReactNode {
  if (typeof items === "number") return `${items} item${items > 1 ? "s" : ""}`;
  if (Array.isArray(items)) {
    const totalQty = getItemCount(items);
    if (items.length === 0) return "0 items";
    return (
      <div className="flex flex-col">
        <span className="font-bold text-xs text-foreground">{totalQty} item{totalQty > 1 ? "s" : ""}</span>
        <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
          {items.map((i) => i.title || "Item").join(", ")}
        </span>
      </div>
    );
  }
  return "1 item";
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading orders…</div>}>
      <OrdersContent />
    </Suspense>
  );
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams?.get("q") || searchParams?.get("id") || "";
  const items = useStore((s) => s.orders);
  const invoices = useStore((s) => s.invoices);
  const [q, setQ] = useState(initialQ);
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [emailTarget, setEmailTarget] = useState<{ orderId: string; invoiceId: string } | null>(null);

  const selected = items.find((o) => o.id === selectedId) ?? null;
  const selectedInvoice = selected ? invoices.find((i) => i.orderId === selected.id) : undefined;

  const filtered = useMemo(
    () =>
      items.filter((o) => {
        const mQ =
          !q ||
          o.id.toLowerCase().includes(q.toLowerCase()) ||
          (o.orderNumber && o.orderNumber.toLowerCase().includes(q.toLowerCase())) ||
          o.customer.toLowerCase().includes(q.toLowerCase());
        const mS = status === "all" || o.status === status;
        return mQ && mS;
      }),
    [items, q, status],
  );

  const advance = (id: string) => {
    const flow: Order["status"][] = ["pending", "processing", "shipped", "delivered"];
    const o = items.find((x) => x.id === id);
    if (!o) return;
    const i = flow.indexOf(o.status);
    if (i < 0 || i === flow.length - 1) return;
    store.updateOrder(id, { status: flow[i + 1] });
    toast.success(`Order ${id} advanced to ${flow[i + 1].toUpperCase()}`);
  };

  const setOrderStatus = (id: string, newStatus: Order["status"]) => {
    store.updateOrder(id, { status: newStatus });
    toast.success(`Order ${id} status updated to ${newStatus.toUpperCase()}`);
  };

  const handleGenerateInvoice = (order: Order) => {
    const inv = store.createInvoiceForOrder(order);
    downloadInvoicePdf(inv, order, order.email);
    toast.success(`Invoice ${inv.id} created`, {
      description: "PDF downloaded. It's also available in Invoices.",
      action: { label: "View", onClick: () => window.location.assign("/admin/invoices") },
    });
  };

  const handleEmailInvoice = (order: Order) => {
    const inv = store.createInvoiceForOrder(order);
    setEmailTarget({ orderId: order.id, invoiceId: inv.id });
  };

  const exportOrdersCsv = () => {
    const headers = [
      "Order ID",
      "Customer Name",
      "Customer Email",
      "Date",
      "Item Qty",
      "Total Amount (INR)",
      "Payment Status",
      "Fulfillment Status",
    ];
    const rows = filtered.map((o) => [
      o.id,
      `"${o.customer.replace(/"/g, '""')}"`,
      o.email,
      o.date,
      getItemCount(o.items),
      o.total,
      o.paymentStatus,
      o.status,
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Orders Exported to CSV!", {
      description: `Exported ${filtered.length} order records.`,
    });
  };

  // Stat Card Metrics
  const stats = useMemo(() => {
    const totalOrders = items.length;
    const totalRevenue = items.reduce((acc, o) => acc + (o.status !== "cancelled" ? o.total : 0), 0);
    const pendingCount = items.filter((o) => o.status === "pending").length;
    const processingCount = items.filter((o) => o.status === "processing").length;
    const shippedCount = items.filter((o) => o.status === "shipped").length;
    const deliveredCount = items.filter((o) => o.status === "delivered").length;
    const cancelledCount = items.filter((o) => o.status === "cancelled").length;

    return {
      totalOrders,
      totalRevenue,
      pendingCount,
      processingCount,
      shippedCount,
      deliveredCount,
      cancelledCount,
    };
  }, [items]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="View, fulfill, and manage customer orders."
        actions={
          <Button
            onClick={exportOrdersCsv}
            size="sm"
            className="text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
          >
            <Download className="h-4 w-4" /> Export Orders CSV
          </Button>
        }
      />

      {/* Stat Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Orders</span>
            <ShoppingBag className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-extrabold text-foreground pt-1">{stats.totalOrders}</p>
          <span className="text-[11px] text-muted-foreground block truncate">
            {formatCurrency(stats.totalRevenue)} total revenue
          </span>
        </Card>

        <Card className="p-4 border border-amber-500/20 bg-amber-500/5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Pending &amp; Prep</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 pt-1">
            {stats.pendingCount + stats.processingCount}
          </p>
          <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80 block truncate">
            {stats.pendingCount} pending • {stats.processingCount} in prep
          </span>
        </Card>

        <Card className="p-4 border border-purple-500/20 bg-purple-500/5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">Shipped (In Transit)</span>
            <Truck className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 pt-1">
            {stats.shippedCount}
          </p>
          <span className="text-[11px] text-purple-600/80 dark:text-purple-400/80 block truncate">
            Out for delivery
          </span>
        </Card>

        <Card className="p-4 border border-emerald-500/20 bg-emerald-500/5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Delivered Orders</span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 pt-1">
            {stats.deliveredCount}
          </p>
          <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 block truncate">
            {((stats.deliveredCount / (stats.totalOrders || 1)) * 100).toFixed(0)}% completion rate
          </span>
        </Card>
      </div>

      <Card className="border shadow-xs">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by order id or customer name..."
                className="pl-9 text-xs"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full sm:w-44 text-xs h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={exportOrdersCsv}
                size="sm"
                className="text-xs font-bold gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs shrink-0"
              >
                <Download className="h-3.5 w-3.5 text-white" /> Export CSV
              </Button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs w-[10%]">Order ID</TableHead>
                  <TableHead className="text-xs w-[18%]">Customer</TableHead>
                  <TableHead className="text-xs w-[11%]">Date</TableHead>
                  <TableHead className="text-xs w-[20%]">Purchased Items</TableHead>
                  <TableHead className="text-xs text-right pr-6 w-[12%]">Total Amount</TableHead>
                  <TableHead className="text-xs text-center w-[10%]">Payment</TableHead>
                  <TableHead className="text-xs text-center w-[11%]">Status</TableHead>
                  <TableHead className="text-xs text-right w-[8%]">Action Options</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => (
                  <TableRow key={o.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setSelectedId(o.id)}>
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      <div className="flex flex-col">
                        <span>{o.orderNumber || o.id}</span>
                        {o.orderNumber && <span className="text-[10px] text-muted-foreground font-normal">{o.id.slice(0, 8)}…</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-foreground">{o.customer}</span>
                        <span className="text-[10px] text-muted-foreground">{o.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{o.date}</TableCell>
                    <TableCell>{renderItemsCell(o.items)}</TableCell>
                    <TableCell className="text-right pr-6 font-extrabold text-xs text-foreground">{formatCurrency(o.total)}</TableCell>
                    <TableCell className="text-center"><Badge variant="outline" className={`text-[10px] font-bold ${paymentColor[o.paymentStatus]}`}>{o.paymentStatus}</Badge></TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center">
                        <Select
                          value={o.status}
                          onValueChange={(val) => setOrderStatus(o.id, val as Order["status"])}
                        >
                          <SelectTrigger
                            className={`h-7 text-[11px] font-extrabold capitalize border rounded-md px-2 gap-1 w-[120px] shadow-2xs ${statusColor[o.status]}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                        <SelectContent className="w-[140px]">
                          <SelectItem value="pending" className="text-xs font-bold text-amber-600">
                            <span className="flex items-center gap-1">⏳ Pending</span>
                          </SelectItem>
                          <SelectItem value="processing" className="text-xs font-bold text-blue-600">
                            <span className="flex items-center gap-1">⚙️ Processing</span>
                          </SelectItem>
                          <SelectItem value="shipped" className="text-xs font-bold text-purple-600">
                            <span className="flex items-center gap-1">🚚 Shipped</span>
                          </SelectItem>
                          <SelectItem value="delivered" className="text-xs font-bold text-emerald-600">
                            <span className="flex items-center gap-1">✓ Delivered</span>
                          </SelectItem>
                          <SelectItem value="cancelled" className="text-xs font-bold text-rose-600">
                            <span className="flex items-center gap-1">✕ Cancelled</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>

                    {/* Action Icons Column */}
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedId(o.id)}
                                className="h-7 w-7 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View Order Details</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleGenerateInvoice(o)}
                                className="h-7 w-7 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                              >
                                <FileText className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Download PDF Invoice</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEmailInvoice(o)}
                                className="h-7 w-7 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
                              >
                                <Mail className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Email Invoice to Customer</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  navigator.clipboard.writeText(o.id);
                                  toast.success(`Copied Order ID: ${o.id}`);
                                }}
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copy Order ID</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No orders found matching your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* CENTERED DIALOG POPUP MODAL FOR ORDER DETAILS */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          {selected && (
            <>
              <DialogHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-amber-500" /> Order Details: {selected.orderNumber || selected.id}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                      Customer: <span className="font-bold text-foreground">{selected.customer}</span>{selected.email ? ` (${selected.email})` : ""}
                    </DialogDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs font-bold uppercase ${statusColor[selected.status]}`}>
                      {selected.status}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border bg-muted/20 text-xs mt-2">
                <div className="space-y-2">
                  <div className="flex justify-between border-b pb-1.5"><span className="text-muted-foreground">Order Date</span><span className="font-mono font-bold text-foreground">{selected.date}</span></div>
                  <div className="flex justify-between border-b pb-1.5"><span className="text-muted-foreground">Total Item Quantity</span><span className="font-bold text-foreground">{getItemCount(selected.items)} items</span></div>
                  <div className="flex justify-between border-b pb-1.5"><span className="text-muted-foreground">Payment Method</span><span className="font-bold text-foreground capitalize">{selected.paymentMethod || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Order Value</span><span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">{formatCurrency(selected.total)}</span></div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between border-b pb-1.5 items-center">
                    <span className="text-muted-foreground">Payment Status</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] font-bold ${paymentColor[selected.paymentStatus]}`}>{selected.paymentStatus}</Badge>
                      {selected.paymentStatus === "unpaid" && (
                        <button
                          onClick={() => { store.updateOrder(selected.id, { paymentStatus: "paid" }); toast.success("Marked as paid"); }}
                          className="text-[10px] font-bold text-emerald-600 border border-emerald-500/40 rounded px-1.5 py-0.5 hover:bg-emerald-500/10 transition-colors"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between border-b pb-1.5 items-center"><span className="text-muted-foreground">Fulfillment Status</span><Badge variant="outline" className={`text-[10px] font-bold ${statusColor[selected.status]}`}>{selected.status}</Badge></div>
                  {selected.paymentProvider === "razorpay" && (
                    <>
                      {selected.razorpayOrderId && selected.razorpayOrderId !== "" && (
                        <div className="flex justify-between border-b pb-1.5 items-center gap-2">
                          <span className="text-muted-foreground shrink-0">Razorpay Order ID</span>
                          <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 truncate max-w-[160px]" title={selected.razorpayOrderId}>{selected.razorpayOrderId}</span>
                        </div>
                      )}
                      {selected.razorpayPaymentId && selected.razorpayPaymentId !== "" && (
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-muted-foreground shrink-0">Razorpay Payment ID</span>
                          <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 truncate max-w-[160px]" title={selected.razorpayPaymentId}>{selected.razorpayPaymentId}</span>
                        </div>
                      )}
                    </>
                  )}
                  {(!selected.paymentProvider || selected.paymentProvider !== "razorpay") && (
                    <div className="flex justify-between items-center"><span className="text-muted-foreground">Payment Method</span><span className="font-mono font-bold text-blue-600">{selected.paymentMethod || "—"}</span></div>
                  )}
                </div>
              </div>

              {/* Items List inside Popup Dialog */}
              {Array.isArray(selected.items) && selected.items.length > 0 && (
                <div className="mt-4 rounded-xl border p-3 space-y-2 bg-muted/10">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Purchased Items</h3>
                  <div className="space-y-2">
                    {selected.items.map((item, idx) => (
                      <div key={item.id || idx} className="flex items-center justify-between gap-3 text-xs p-2.5 rounded-lg bg-card border shadow-2xs">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.image && (
                            <img src={item.image} alt={item.title} className="h-10 w-10 rounded-md object-cover border shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="font-bold truncate text-foreground">{item.title}</div>
                            <div className="text-[10px] text-muted-foreground">Qty: {item.qty || 1} × {formatCurrency(item.price)}</div>
                          </div>
                        </div>
                        <div className="font-extrabold text-foreground shrink-0">
                          {formatCurrency((item.price || 0) * (item.qty || 1))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoice Section inside Popup Dialog */}
              <div className="mt-4 rounded-xl border p-4 bg-muted/20">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Invoice Document</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {selectedInvoice
                        ? `${selectedInvoice.id} · ${selectedInvoice.status}${selectedInvoice.emailedAt ? ` · emailed ${selectedInvoice.emailedAt}` : ""}`
                        : "No invoice created yet."}
                    </p>
                  </div>
                  {selectedInvoice && (
                    <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
                      <Link href="/admin/invoices"><ExternalLink className="h-3.5 w-3.5" /></Link>
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => handleGenerateInvoice(selected)} className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-2xs">
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                    {selectedInvoice ? "Download PDF" : "Generate Invoice"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEmailInvoice(selected)} className="text-xs font-semibold">
                    <Mail className="mr-1.5 h-3.5 w-3.5" /> Email Invoice
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <EmailInvoiceDialog
        target={emailTarget}
        onClose={() => setEmailTarget(null)}
      />
    </div>
  );
}

function EmailInvoiceDialog({
  target,
  onClose,
}: {
  target: { orderId: string; invoiceId: string } | null;
  onClose: () => void;
}) {
  const orders = useStore((s) => s.orders);
  const invoices = useStore((s) => s.invoices);
  const order = target ? orders.find((o) => o.id === target.orderId) : undefined;
  const invoice = target ? invoices.find((i) => i.id === target.invoiceId) : undefined;

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const open = !!target && !!order && !!invoice;

  const brandName = useStore((s) => s.footerConfig?.brandName || "Our Store");

  useEffect(() => {
    if (open && order && invoice) {
      setTo(order.email);
      setSubject(`Invoice ${invoice.id} from ${brandName}`);
      setMessage(
        `Hi ${order.customer.split(" ")[0]},\n\nPlease find attached the invoice for order ${order.id}. The total is ${formatCurrency(invoice.amount)} and is due by ${invoice.due}.\n\nThank you for your business.\n— ${brandName}`,
      );
    }
  }, [open, order, invoice, brandName]);

  const handleSend = async () => {
    if (!invoice || !order) return;
    if (!to.includes("@")) {
      toast.error("Enter a valid recipient email");
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 500));
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    store.updateInvoice(invoice.id, { emailedAt: now });
    setSending(false);
    onClose();
    toast.success(`Invoice ${invoice.id} emailed to ${to}`, {
      description: "PDF attached · Demo mode (no real email sent)",
    });
  };

  const handleDownload = () => {
    if (invoice && order) downloadInvoicePdf(invoice, order, to);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Email invoice</DialogTitle>
          <DialogDescription>
            {invoice && `Send ${invoice.id} to the customer with the PDF attached.`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>To</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Message</Label>
            <Textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">{invoice?.id}.pdf</span>
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSend} disabled={sending}>
            <Mail className="mr-2 h-4 w-4" />
            {sending ? "Sending…" : "Send email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
