"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Plus,
  LayoutGrid,
  List,
  ExternalLink,
  Navigation,
  RefreshCw,
  Box,
  Copy,
  ShieldCheck,
  Calendar,
  Hash,
  ShoppingBag,
  User,
  Check,
  Settings,
  Zap,
  Store,
  Wrench,
  ToggleLeft,
  ToggleRight,
  Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { type Shipment } from "@/lib/mock-data";
import { api } from "@/lib/api";

const statusColor: Record<Shipment["status"], string> = {
  label_created: "bg-slate-500/10 text-slate-600 border-slate-300",
  in_transit: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  out_for_delivery: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  returned: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
};

const statusLabel: Record<Shipment["status"], string> = {
  label_created: "Label Created",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  returned: "Returned / RTO",
};

export default function ShippingPage() {
  const [shipmentsList, setShipmentsList] = useState<Shipment[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [carrier, setCarrier] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Track Details Popup Modal
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  // New Shipment Dialog Modal
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [newOrderId, setNewOrderId] = useState("");
  const [newCustomer, setNewCustomer] = useState("");
  const [newCarrier, setNewCarrier] = useState("Delhivery");
  const [newTracking, setNewTracking] = useState("");
  const [newDestination, setNewDestination] = useState("");
  const [allOrders, setAllOrders] = useState<Array<Record<string, unknown>>>([]);

  // ── Additional Charges State ──────────────────────────────────────────────
  const [handlingEnabled, setHandlingEnabled] = useState(true);
  const [handlingType, setHandlingType] = useState<"flat" | "percent">("flat");
  const [handlingAmount, setHandlingAmount] = useState("49");
  const [handlingNote, setHandlingNote] = useState("Applied to cover packing, labelling, and dispatch processing costs.");

  const [marketplaceEnabled, setMarketplaceEnabled] = useState(true);
  const [marketplaceFeeType, setMarketplaceFeeType] = useState<"flat" | "percent">("percent");
  const [marketplaceFeeAmount, setMarketplaceFeeAmount] = useState("2.5");
  const [marketplaceNote, setMarketplaceNote] = useState("Platform commission fee charged on each successful transaction.");

  const [expressEnabled, setExpressEnabled] = useState(true);
  const [expressAmount, setExpressAmount] = useState("99");
  const [expressCutoff, setExpressCutoff] = useState("14:00");
  const [expressNote, setExpressNote] = useState("Next-day delivery before 12 PM for orders placed before the cutoff time.");

  useEffect(() => {
    api<{ items: Array<Record<string, unknown>> }>("/admin/orders").then(({ items }) => { setAllOrders(items); setShipmentsList(items.filter((order) => order.shipment).map((order) => { const shipment = order.shipment as Record<string, unknown>; const customer = order.customer as Record<string, string>; return { id: String(order.id), orderId: String(order.orderNumber || order.id), customer: customer?.fullName || "Customer", carrier: String(shipment.carrier || ""), tracking: String(shipment.tracking || ""), status: shipment.status as Shipment["status"], destination: String((order.shippingAddress as Record<string, string>)?.city || ""), eta: String(shipment.eta || "").slice(0, 10) }; })); }).catch(() => toast.error("Unable to load shipment records"));
    api<{ setting: { value: Record<string, unknown> } }>("/admin/settings/shipping").then(({ setting }) => { const v = setting.value; setHandlingEnabled(v.handlingEnabled !== false); setHandlingType(v.handlingType === "percent" ? "percent" : "flat"); setHandlingAmount(String(v.handlingAmount || handlingAmount)); if (v.handlingNote) setHandlingNote(String(v.handlingNote)); setMarketplaceEnabled(v.marketplaceEnabled !== false); setMarketplaceFeeType(v.marketplaceFeeType === "flat" ? "flat" : "percent"); setMarketplaceFeeAmount(String(v.marketplaceFeeAmount || marketplaceFeeAmount)); if (v.marketplaceNote) setMarketplaceNote(String(v.marketplaceNote)); setExpressEnabled(v.expressEnabled !== false); setExpressAmount(String(v.expressAmount || expressAmount)); setExpressCutoff(String(v.expressCutoff || expressCutoff)); if (v.expressNote) setExpressNote(String(v.expressNote)); }).catch(() => undefined);
  }, []);

  const handleSaveCharges = async () => {
    try { await api("/admin/settings/shipping", { method: "PUT", body: JSON.stringify({ handlingEnabled, handlingType, handlingAmount, handlingNote, marketplaceEnabled, marketplaceFeeType, marketplaceFeeAmount, marketplaceNote, expressEnabled, expressAmount, expressCutoff, expressNote }) }); toast.success("Shipping Charges Saved!", {
      description: "Handling, Marketplace, and Express delivery charges have been updated.",
    }); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save shipping settings"); }
  };

  const filtered = useMemo(
    () =>
      shipmentsList.filter((s) => {
        const mQ =
          !q ||
          s.id.toLowerCase().includes(q.toLowerCase()) ||
          s.orderId.toLowerCase().includes(q.toLowerCase()) ||
          s.tracking.toLowerCase().includes(q.toLowerCase()) ||
          s.customer.toLowerCase().includes(q.toLowerCase()) ||
          (s.destination && s.destination.toLowerCase().includes(q.toLowerCase()));
        const mS = status === "all" || s.status === status;
        const mC = carrier === "all" || s.carrier === carrier;
        return mQ && mS && mC;
      }),
    [shipmentsList, q, status, carrier],
  );

  const counts = useMemo(() => {
    const c = { total: shipmentsList.length, in_transit: 0, out_for_delivery: 0, delivered: 0, label_created: 0 } as Record<string, number>;
    shipmentsList.forEach((s) => (c[s.status] = (c[s.status] ?? 0) + 1));
    return c;
  }, [shipmentsList]);

  const copyTracking = (tracking: string) => {
    navigator.clipboard.writeText(tracking);
    toast.success(`Copied Tracking No: ${tracking}`);
  };

  const handleCreateLabel = async () => {
    if (!newOrderId || !newCustomer) {
      toast.error("Order ID and Customer Name are required");
      return;
    }
    const matching = allOrders.find((order) => String(order.orderNumber || order.id) === newOrderId || String(order.id) === newOrderId);
    if (!matching) { toast.error("Order was not found in MongoDB"); return; }
    try { const result = await api<{ order: Record<string, unknown>; label?: Record<string, unknown> }>(`/admin/orders/${matching.id}/shipment/label`, { method: "POST", body: JSON.stringify({ carrier: newCarrier, tracking: newTracking || undefined, manual: true }) }); const shipment = result.order.shipment as Record<string, unknown>; const newShp: Shipment = { id: String(result.order.id), orderId: String(result.order.orderNumber || newOrderId), customer: String((result.order.customer as Record<string, unknown>)?.fullName || newCustomer), carrier: String(shipment.carrier || newCarrier), tracking: String(shipment.tracking || result.label?.tracking || newTracking), status: "label_created", destination: newDestination || "India", eta: shipment.eta ? String(shipment.eta).slice(0, 10) : "" }; setShipmentsList((prev) => [newShp, ...prev]);
    setOpenNewDialog(false);
    setNewOrderId("");
    setNewCustomer("");
    setNewTracking("");
    setNewDestination("");
    setNewCarrier("Delhivery");
    toast.success("Carrier label generated!"); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to create carrier label"); }
  };

  const handleUpdateStatus = async (id: string, newStatus: Shipment["status"]) => {
    const shipment = shipmentsList.find((item) => item.id === id); if (!shipment) return;
    const carrier = shipment.carrier || "Unknown";
    const tracking = shipment.tracking && shipment.tracking.length >= 2 ? shipment.tracking : "N/A";
    const etaPayload = shipment.eta && shipment.eta.length >= 4 ? { eta: shipment.eta } : {};
    try { await api(`/admin/orders/${id}`, { method: "PATCH", body: JSON.stringify({ shipment: { carrier, tracking, status: newStatus, ...etaPayload } }) });
    setShipmentsList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
    toast.success(`Shipment ${id} status updated to ${statusLabel[newStatus].toUpperCase()}`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update shipment"); }
  };

  const exportShipmentsCsv = () => {
    const headers = ["Shipment ID", "Order ID", "Customer", "Carrier Partner", "Tracking Number", "Destination", "ETA", "Fulfillment Status"];
    const rows = filtered.map((s) => [
      s.id,
      s.orderId,
      `"${s.customer.replace(/"/g, '""')}"`,
      s.carrier,
      s.tracking,
      `"${(s.destination || "").replace(/"/g, '""')}"`,
      s.eta,
      statusLabel[s.status],
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `shipments_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Shipment Records Exported to CSV!", {
      description: `Exported ${filtered.length} logistics records.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Truck className="h-6 w-6 text-amber-500" /> Logistics & Order Shipping Operations
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track courier dispatches, live shipment status, AWB numbers, and delivery performance across India.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={exportShipmentsCsv}
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
            <Plus className="h-4 w-4" /> Create Shipping Label
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Shipments
            </CardTitle>
            <div className="p-2 rounded-xl bg-blue-500/10">
              <Box className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{shipmentsList.length}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Dispatched order packages</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              In Transit
            </CardTitle>
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Truck className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{counts.in_transit || 0}</div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">On the way to destination</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Out for Delivery
            </CardTitle>
            <div className="p-2 rounded-xl bg-purple-500/10">
              <Navigation className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{counts.out_for_delivery || 0}</div>
            <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-1">Arriving today</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Delivered Packages
            </CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{counts.delivered || 0}</div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Successfully fulfilled</p>
          </CardContent>
        </Card>
      </div>

      {/* Control Bar: Search + Carrier + Status + View Mode */}
      <Card className="border shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by shipment ID, tracking AWB, customer, destination..."
                className="pl-9 text-xs"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            {/* Filters & View Switcher */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={carrier} onValueChange={setCarrier}>
                <SelectTrigger className="w-[140px] text-xs h-9">
                  <SelectValue placeholder="All Carriers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Carriers</SelectItem>
                  <SelectItem value="Delhivery">Delhivery</SelectItem>
                  <SelectItem value="BlueDart">BlueDart</SelectItem>
                  <SelectItem value="FedEx">FedEx</SelectItem>
                  <SelectItem value="DHL">DHL</SelectItem>
                  <SelectItem value="Ekart Express">Ekart Express</SelectItem>
                  <SelectItem value="India Post">India Post</SelectItem>
                </SelectContent>
              </Select>

              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[150px] text-xs h-9">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="label_created">Label Created</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="returned">Returned / RTO</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
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
          {filtered.map((s) => (
            <Card
              key={s.id}
              onClick={() => setSelectedShipment(s)}
              className="group border shadow-xs hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer p-4 space-y-3"
            >
              {/* Card Header: Shipment ID & Status */}
                <div onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={s.status}
                    onValueChange={(val) => handleUpdateStatus(s.id, val as Shipment["status"])}
                  >
                    <SelectTrigger
                      className={`h-6 text-[9px] font-extrabold capitalize border rounded px-2 gap-1 w-[125px] shadow-2xs ${statusColor[s.status]}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="w-[145px]">
                      <SelectItem value="label_created" className="text-xs font-bold text-slate-600">
                        <span className="flex items-center gap-1.5 whitespace-nowrap">🏷️ Label Created</span>
                      </SelectItem>
                      <SelectItem value="in_transit" className="text-xs font-bold text-blue-600">
                        <span className="flex items-center gap-1.5 whitespace-nowrap">🚚 In Transit</span>
                      </SelectItem>
                      <SelectItem value="out_for_delivery" className="text-xs font-bold text-amber-600">
                        <span className="flex items-center gap-1.5 whitespace-nowrap">🛵 Out for Delivery</span>
                      </SelectItem>
                      <SelectItem value="delivered" className="text-xs font-bold text-emerald-600">
                        <span className="flex items-center gap-1.5 whitespace-nowrap">✓ Delivered</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              {/* Details Content */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono font-bold text-foreground">{s.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recipient</span>
                  <span className="font-bold text-foreground">{s.customer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Carrier Partner</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{s.carrier}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tracking AWB</span>
                  <div className="flex items-center gap-1 font-mono text-[11px] text-foreground">
                    {s.tracking}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyTracking(s.tracking);
                      }}
                      className="p-1 text-slate-400 hover:text-foreground"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Footer: Destination & ETA */}
              <div className="flex items-center justify-between text-[11px] pt-2 border-t text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-slate-400" /> {s.destination}
                </div>
                <div className="flex items-center gap-1 font-mono font-bold text-foreground">
                  <Clock className="h-3 w-3 text-amber-500" /> ETA: {s.eta}
                </div>
              </div>
            </Card>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-card border rounded-2xl p-6">
              No shipments match your search or filter.
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
                  <TableHead className="text-xs">Shipment ID</TableHead>
                  <TableHead className="text-xs">Order ID</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Carrier</TableHead>
                  <TableHead className="text-xs">Tracking Number</TableHead>
                  <TableHead className="text-xs">Destination</TableHead>
                  <TableHead className="text-xs">Estimated ETA</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => setSelectedShipment(s)}
                  >
                    <TableCell className="font-mono text-xs font-bold text-foreground">{s.id}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{s.orderId}</TableCell>
                    <TableCell className="text-xs font-bold text-foreground">{s.customer}</TableCell>
                    <TableCell className="text-xs font-bold text-blue-600">{s.carrier}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {s.tracking}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyTracking(s.tracking);
                          }}
                          className="text-slate-400 hover:text-foreground"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.destination}</TableCell>
                    <TableCell className="text-xs font-mono">{s.eta}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={s.status}
                        onValueChange={(val) => handleUpdateStatus(s.id, val as Shipment["status"])}
                      >
                        <SelectTrigger
                          className={`h-7 text-[10px] font-extrabold capitalize border rounded-md px-2.5 gap-1.5 w-[140px] shadow-2xs ${statusColor[s.status]}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="w-[160px]">
                          <SelectItem value="label_created" className="text-xs font-bold text-slate-600">
                            <span className="flex items-center gap-1.5 whitespace-nowrap">🏷️ Label Created</span>
                          </SelectItem>
                          <SelectItem value="in_transit" className="text-xs font-bold text-blue-600">
                            <span className="flex items-center gap-1.5 whitespace-nowrap">🚚 In Transit</span>
                          </SelectItem>
                          <SelectItem value="out_for_delivery" className="text-xs font-bold text-amber-600">
                            <span className="flex items-center gap-1.5 whitespace-nowrap">🛵 Out for Delivery</span>
                          </SelectItem>
                          <SelectItem value="delivered" className="text-xs font-bold text-emerald-600">
                            <span className="flex items-center gap-1.5 whitespace-nowrap">✓ Delivered</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedShipment(s);
                        }}
                        className="h-8 text-xs font-bold gap-1.5 bg-background text-foreground hover:bg-muted shadow-2xs border border-border/80"
                      >
                        <Navigation className="h-3.5 w-3.5 text-primary" />
                        Track
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* TRACK PACKAGE POPUP DIALOG MODAL — Enhanced UI */}
      <Dialog open={!!selectedShipment} onOpenChange={(open) => !open && setSelectedShipment(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden gap-0 rounded-2xl shadow-2xl">
          {selectedShipment && (
            <>
              {/* ── Gradient Header ── */}
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background px-6 pt-6 pb-4 border-b border-border/50 pr-14">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <DialogTitle className="text-base font-bold text-foreground leading-tight">
                        Package Tracking
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        ID: <span className="font-mono font-bold text-foreground">{selectedShipment.id}</span>
                      </DialogDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider ${statusColor[selectedShipment.status]}`}>
                    {statusLabel[selectedShipment.status]}
                  </Badge>
                </div>
                <div className="mt-3 text-[11px] text-muted-foreground border-t pt-2 border-border/40">
                  Recipient: <span className="font-bold text-foreground">{selectedShipment.customer}</span> <span className="text-muted-foreground">({selectedShipment.destination})</span>
                </div>
              </div>

              {/* ── Form Body ── */}
              <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* Tracking Progress Card */}
                <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-muted-foreground" /> Carrier Partner
                    </span>
                    <span className="font-bold text-primary">{selectedShipment.carrier}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 text-muted-foreground" /> AWB Tracking Code
                    </span>
                    <span className="font-mono font-bold text-foreground">{selectedShipment.tracking}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                      <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" /> Associated Order
                    </span>
                    <span className="font-mono font-bold text-amber-600">{selectedShipment.orderId}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Estimated Arrival
                    </span>
                    <span className="font-mono font-extrabold text-emerald-600">{selectedShipment.eta}</span>
                  </div>
                </div>

                {/* Simulated Live Journey Timeline (Perfect Alignment) */}
                <div className="relative pl-6 space-y-5 before:absolute before:left-[11px] before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-border/70">
                  <div className="relative">
                    <div className="absolute left-[-19px] top-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-background ring-4 ring-emerald-500/10" />
                    <div>
                      <h4 className="font-bold text-xs text-foreground">Out for Delivery</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Local hub courier dispatched for last mile.</p>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute left-[-19px] top-0.5 h-3.5 w-3.5 rounded-full bg-blue-500 border-2 border-background ring-4 ring-blue-500/10" />
                    <div>
                      <h4 className="font-bold text-xs text-foreground">In Transit (Hub Arrival)</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 font-sans">
                        Arrived at sorting facility in {selectedShipment.destination}.
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute left-[-19px] top-0.5 h-3.5 w-3.5 rounded-full bg-muted-foreground/50 border-2 border-background" />
                    <div>
                      <h4 className="font-bold text-xs text-foreground">Shipment Picked Up</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Package handed over to {selectedShipment.carrier}.</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* CREATE SHIPPING LABEL DIALOG — Enhanced UI */}
      <Dialog open={openNewDialog} onOpenChange={(open) => { if (!open) { setOpenNewDialog(false); setNewOrderId(""); setNewCustomer(""); setNewTracking(""); setNewDestination(""); setNewCarrier("Delhivery"); } else setOpenNewDialog(true); }}>
        <DialogContent className="max-w-lg p-0 overflow-hidden gap-0 rounded-2xl shadow-2xl">

          {/* ── Gradient Header ── */}
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background px-6 pt-6 pb-4 border-b border-border/50 pr-14">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Box className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground leading-tight">
                  Generate Shipping Label
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Register order shipment, select courier partner, and create AWB tracking number.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* ── Form Body ── */}
          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">

            {/* Order & Customer details */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <User className="h-3 w-3" /> Order &amp; Recipient
              </p>
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="ship-orderid" className="text-xs font-semibold">
                    Order ID <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={newOrderId}
                    onValueChange={(val) => {
                      setNewOrderId(val);
                      const order = allOrders.find((o) => String(o.orderNumber || o.id) === val);
                      if (order) {
                        setNewCustomer(String((order.customer as Record<string, string>)?.fullName || ""));
                        setNewDestination(String((order.shippingAddress as Record<string, string>)?.city || ""));
                      }
                    }}
                  >
                    <SelectTrigger id="ship-orderid" className="h-9 text-sm bg-muted/40 border-border/70">
                      <SelectValue placeholder="Select an order..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allOrders.map((o) => {
                        const oid = String(o.orderNumber || o.id);
                        return (
                          <SelectItem key={String(o.id)} value={oid} className="text-xs font-mono">
                            {oid} — {String((o.customer as Record<string, string>)?.fullName || "Customer")}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ship-cust" className="text-xs font-semibold">
                    Customer Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="ship-cust"
                      placeholder="Auto-filled from order"
                      value={newCustomer}
                      onChange={(e) => setNewCustomer(e.target.value)}
                      className="pl-9 text-sm h-9 bg-muted/40 border-border/70"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Courier & Route details */}
            <div className="space-y-3 pt-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Truck className="h-3 w-3" /> Courier &amp; Route
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ship-carrier" className="text-xs font-semibold">Courier Partner</Label>
                  <Select value={newCarrier} onValueChange={setNewCarrier}>
                    <SelectTrigger id="ship-carrier" className="h-9 text-sm bg-muted/40 border-border/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Delhivery">Delhivery</SelectItem>
                      <SelectItem value="BlueDart">BlueDart</SelectItem>
                      <SelectItem value="FedEx">FedEx</SelectItem>
                      <SelectItem value="DHL">DHL</SelectItem>
                      <SelectItem value="Ekart Express">Ekart Express</SelectItem>
                      <SelectItem value="India Post">India Post</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ship-awb" className="text-xs font-semibold">AWB Tracking Number</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        id="ship-awb"
                        placeholder="Auto-generated if left blank"
                        value={newTracking}
                        onChange={(e) => setNewTracking(e.target.value)}
                        className="pl-9 text-sm h-9 bg-muted/40 border-border/70 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ship-dest" className="text-xs font-semibold">Destination City</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        id="ship-dest"
                        placeholder="e.g. Mumbai, MH"
                        value={newDestination}
                        onChange={(e) => setNewDestination(e.target.value)}
                        className="pl-9 text-sm h-9 bg-muted/40 border-border/70"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border/40 bg-muted/20">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setOpenNewDialog(false); setNewOrderId(""); setNewCustomer(""); setNewTracking(""); setNewDestination(""); setNewCarrier("Delhivery"); }}
              className="h-9 px-4 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateLabel}
              className="h-9 px-5 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
            >
              <Check className="h-3.5 w-3.5" />
              Generate Label &amp; AWB
            </Button>
          </div>

        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════ */}
      {/* Additional Charges Configuration Section         */}
      {/* ════════════════════════════════════════════════ */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10">
              <Settings className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-foreground">Additional Charges</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Configure handling fees, marketplace commissions, and express delivery surcharges applied at checkout.</p>
            </div>
          </div>
          <button
            onClick={handleSaveCharges}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs transition-colors"
          >
            <Save className="h-3.5 w-3.5" /> Save Charges
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Handling Charges ── */}
          <Card className="border border-muted/70 shadow-xs overflow-hidden">
            <CardHeader className="p-0">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-white/10">
                      <Wrench className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-white">Handling Charges</CardTitle>
                      <p className="text-[10px] text-white/70 mt-0.5">Packing & dispatch costs</p>
                    </div>
                  </div>
                  <Switch checked={handlingEnabled} onCheckedChange={setHandlingEnabled} className="data-[state=checked]:bg-white/30" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Charge Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setHandlingType("flat")}
                    className={`h-8 rounded-lg text-xs font-semibold border transition-colors ${
                      handlingType === "flat"
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-muted/30 text-muted-foreground border-muted-foreground/20 hover:border-indigo-400"
                    }`}
                  >
                    ₹ Flat Fee
                  </button>
                  <button
                    onClick={() => setHandlingType("percent")}
                    className={`h-8 rounded-lg text-xs font-semibold border transition-colors ${
                      handlingType === "percent"
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-muted/30 text-muted-foreground border-muted-foreground/20 hover:border-indigo-400"
                    }`}
                  >
                    % Percentage
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">
                  {handlingType === "flat" ? "Amount (₹)" : "Percentage (%)"}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    {handlingType === "flat" ? "₹" : "%"}
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={handlingAmount}
                    onChange={(e) => setHandlingAmount(e.target.value)}
                    className="w-full pl-7 pr-3 h-9 rounded-lg border border-muted-foreground/20 bg-muted/30 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Internal Note</Label>
                <textarea
                  rows={2}
                  value={handlingNote}
                  onChange={(e) => setHandlingNote(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-muted-foreground/20 bg-muted/30 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                handlingEnabled ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400" : "bg-muted/30 text-muted-foreground"
              }`}>
                {handlingEnabled ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                {handlingEnabled ? "Applied at checkout" : "Currently disabled"}
              </div>
            </CardContent>
          </Card>

          {/* ── Marketplace Fees ── */}
          <Card className="border border-muted/70 shadow-xs overflow-hidden">
            <CardHeader className="p-0">
              <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-white/10">
                      <Store className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-white">Marketplace Fees</CardTitle>
                      <p className="text-[10px] text-white/70 mt-0.5">Platform commission per order</p>
                    </div>
                  </div>
                  <Switch checked={marketplaceEnabled} onCheckedChange={setMarketplaceEnabled} className="data-[state=checked]:bg-white/30" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Fee Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMarketplaceFeeType("flat")}
                    className={`h-8 rounded-lg text-xs font-semibold border transition-colors ${
                      marketplaceFeeType === "flat"
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-muted/30 text-muted-foreground border-muted-foreground/20 hover:border-violet-400"
                    }`}
                  >
                    ₹ Flat Fee
                  </button>
                  <button
                    onClick={() => setMarketplaceFeeType("percent")}
                    className={`h-8 rounded-lg text-xs font-semibold border transition-colors ${
                      marketplaceFeeType === "percent"
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-muted/30 text-muted-foreground border-muted-foreground/20 hover:border-violet-400"
                    }`}
                  >
                    % Percentage
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">
                  {marketplaceFeeType === "flat" ? "Fee Amount (₹)" : "Commission Rate (%)"}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    {marketplaceFeeType === "flat" ? "₹" : "%"}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={marketplaceFeeAmount}
                    onChange={(e) => setMarketplaceFeeAmount(e.target.value)}
                    className="w-full pl-7 pr-3 h-9 rounded-lg border border-muted-foreground/20 bg-muted/30 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Internal Note</Label>
                <textarea
                  rows={2}
                  value={marketplaceNote}
                  onChange={(e) => setMarketplaceNote(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-muted-foreground/20 bg-muted/30 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                marketplaceEnabled ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400" : "bg-muted/30 text-muted-foreground"
              }`}>
                {marketplaceEnabled ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                {marketplaceEnabled ? "Deducted from revenue" : "Currently disabled"}
              </div>
            </CardContent>
          </Card>

          {/* ── Express Delivery Charges ── */}
          <Card className="border border-muted/70 shadow-xs overflow-hidden">
            <CardHeader className="p-0">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-white/10">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-white">Express Delivery</CardTitle>
                      <p className="text-[10px] text-white/70 mt-0.5">Same-day / next-day surcharge</p>
                    </div>
                  </div>
                  <Switch checked={expressEnabled} onCheckedChange={setExpressEnabled} className="data-[state=checked]:bg-white/30" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Express Surcharge (₹)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={expressAmount}
                    onChange={(e) => setExpressAmount(e.target.value)}
                    className="w-full pl-7 pr-3 h-9 rounded-lg border border-muted-foreground/20 bg-muted/30 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Order Cutoff Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="time"
                    value={expressCutoff}
                    onChange={(e) => setExpressCutoff(e.target.value)}
                    className="w-full pl-9 pr-3 h-9 rounded-lg border border-muted-foreground/20 bg-muted/30 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Orders placed after this time will be dispatched next business day.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Internal Note</Label>
                <textarea
                  rows={2}
                  value={expressNote}
                  onChange={(e) => setExpressNote(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-muted-foreground/20 bg-muted/30 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                expressEnabled ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" : "bg-muted/30 text-muted-foreground"
              }`}>
                {expressEnabled ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                {expressEnabled ? `Cutoff: ${expressCutoff}` : "Currently disabled"}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

    </div>
  );
}
