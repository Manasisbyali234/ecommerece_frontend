"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Mail,
  Search,
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  IndianRupee,
  LayoutGrid,
  List,
  Calendar,
  Send,
  Eye,
  Check,
  Building,
  Printer,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  SlidersHorizontal,
  Save,
  RefreshCw,
  Sliders,
  User,
  Hash,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { formatCurrency, type Invoice, type Order, type OrderItem } from "@/lib/mock-data";
import { store, useStore, type CompanyInvoiceSettings } from "@/lib/store";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";
import { api, downloadApiFile } from "@/lib/api";

const statusColor: Record<Invoice["status"], string> = {
  paid: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  overdue: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
};

export default function InvoicesPage() {
  const items = useStore((s) => s.invoices);
  const orders = useStore((s) => s.orders);
  const companySettings = useStore((s) => s.companyInvoiceSettings);

  const [activeTab, setActiveTab] = useState<"invoices" | "master_settings">("invoices");

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [emailTargetId, setEmailTargetId] = useState<string | null>(null);

  // Selected Invoice for Standard Tax Invoice View Popup Modal
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  // New Invoice Dialog
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newOrderId, setNewOrderId] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDueDate, setNewDueDate] = useState("2026-08-15");
  const [newStatus, setNewStatus] = useState<"pending" | "paid" | "overdue">("pending");

  // Master Settings Local Form State
  const [settingsForm, setSettingsForm] = useState<CompanyInvoiceSettings>({
    ...companySettings,
  });

  useEffect(() => {
    setSettingsForm({ ...companySettings });
  }, [companySettings]);

  const handleSaveMasterSettings = () => {
    store.updateCompanyInvoiceSettings(settingsForm);
    toast.success("Master Invoice Settings & Company Tax Variables Saved!", {
      description: "Updated GSTIN, CIN, Address, and tax rules live on all invoices.",
    });
  };

  const filtered = useMemo(
    () =>
      items.filter((i) => {
        const mQ =
          !q ||
          i.id.toLowerCase().includes(q.toLowerCase()) ||
          i.customer.toLowerCase().includes(q.toLowerCase()) ||
          i.orderId.toLowerCase().includes(q.toLowerCase());
        const mS = status === "all" || i.status === status;
        return mQ && mS;
      }),
    [items, q, status],
  );

  const totals = useMemo(() => {
    const paid = items.filter((i) => i.status === "paid").reduce((a, b) => a + b.amount, 0);
    const pending = items.filter((i) => i.status === "pending").reduce((a, b) => a + b.amount, 0);
    const overdue = items.filter((i) => i.status === "overdue").reduce((a, b) => a + b.amount, 0);
    return { paid, pending, overdue, count: items.length };
  }, [items]);


  const handleDownload = async (inv: Invoice) => {
    try { await downloadApiFile(`/admin/invoices/${inv.id}/pdf`, `${inv.id}.pdf`); toast.success(`Downloading PDF for ${inv.id}`); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to download invoice"); }
  };

  const handleCreateInvoice = () => {
    if (!newCustomer || !newAmount) {
      toast.error("Customer name and Amount are required");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const invId = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInv: Invoice = {
      id: invId,
      orderId: newOrderId ? (newOrderId.startsWith("#") ? newOrderId : `#${newOrderId}`) : "#ORD-MANUAL",
      customer: newCustomer,
      amount: parseFloat(newAmount) || 1000,
      status: newStatus,
      issued: today,
      due: newDueDate,
    };

    store.addInvoice(newInv);
    setOpenNewDialog(false);
    setNewCustomer("");
    setNewEmail("");
    setNewOrderId("");
    setNewAmount("");
    setNewStatus("pending");
    toast.success(`Invoice ${invId} created successfully!`);
  };

  const exportInvoicesCsv = async () => {
    try { await downloadApiFile("/admin/exports/invoices.csv", "invoices.csv"); toast.success("Invoices Exported to CSV!"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to export invoices"); }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-amber-500" /> Financial Invoices & Billing
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Issue PDF invoices, track payment status, send email copies.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === "invoices" && (
            <>
              <Button
                onClick={exportInvoicesCsv}
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
                <Plus className="h-4 w-4" /> Create Invoice
              </Button>
            </>
          )}
        </div>
      </div>

      {/* TAB 1: INVOICES DASHBOARD & LIST */}
      {activeTab === "invoices" && (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Paid Revenue
                </CardTitle>
                <div className="p-2 rounded-xl bg-emerald-500/10">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totals.paid)}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Collected invoice payments</p>
              </CardContent>
            </Card>

            <Card className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Pending Invoices
                </CardTitle>
                <div className="p-2 rounded-xl bg-amber-500/10">
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                  {formatCurrency(totals.pending)}
                </div>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">Awaiting customer payment</p>
              </CardContent>
            </Card>

            <Card className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Overdue Invoices
                </CardTitle>
                <div className="p-2 rounded-xl bg-rose-500/10">
                  <AlertCircle className="h-4 w-4 text-rose-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                  {formatCurrency(totals.overdue)}
                </div>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">Passed due date threshold</p>
              </CardContent>
            </Card>

            <Card className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Total Invoices Issued
                </CardTitle>
                <div className="p-2 rounded-xl bg-blue-500/10">
                  <FileText className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-foreground">{totals.count} Invoices</div>
                <p className="text-[11px] text-muted-foreground mt-1">All invoice records</p>
              </CardContent>
            </Card>
          </div>

          {/* Control Bar: Search + Status Filter + View Switcher */}
          <Card className="border shadow-xs">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by invoice ID, order ID, or customer name..."
                    className="pl-9 text-xs"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>

                {/* Filters & View Switcher */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-[150px] text-xs h-9">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
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
                      title="Grid Cards View"
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

          {/* GRID CARDS VIEW RENDERING */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((i) => (
                <Card
                  key={i.id}
                  onClick={() => setPreviewInvoice(i)}
                  className="group border shadow-xs hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer p-4 space-y-3 flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Invoice ID & Status Dropdown */}
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="font-mono text-xs font-bold text-foreground">{i.id}</span>
                      <Select
                        value={i.status}
                        onValueChange={(val) => {
                          store.updateInvoice(i.id, { status: val as any });
                          toast.success(`Invoice ${i.id} status updated to ${val.toUpperCase()}`);
                        }}
                      >
                        <SelectTrigger
                          className={`h-6 text-[9px] font-extrabold uppercase border rounded px-2 gap-1 w-[105px] shadow-2xs ${statusColor[i.status]}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="w-[140px]">
                          <SelectItem value="paid" className="text-xs font-bold text-emerald-600">
                            <span className="flex items-center gap-1 whitespace-nowrap">✓ PAID</span>
                          </SelectItem>
                          <SelectItem value="pending" className="text-xs font-bold text-amber-600">
                            <span className="flex items-center gap-1 whitespace-nowrap">⏳ PENDING</span>
                          </SelectItem>
                          <SelectItem value="overdue" className="text-xs font-bold text-rose-600">
                            <span className="flex items-center gap-1 whitespace-nowrap">✕ OVERDUE</span>
                          </SelectItem>
                          <SelectItem value="cancelled" className="text-xs font-bold text-slate-600">
                            <span className="flex items-center gap-1 whitespace-nowrap">🛇 CANCELLED</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Main Details */}
                    <div className="p-3 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Customer</span>
                        <span className="font-bold text-foreground truncate max-w-[150px]">{i.customer}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Associated Order</span>
                        <span className="font-mono font-bold text-amber-600">{i.orderId}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Invoice Amount</span>
                        <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                          {formatCurrency(i.amount)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-muted-foreground">
                        <div>Issued: <span className="font-mono text-foreground">{i.issued}</span></div>
                        <div>Due: <span className="font-mono text-foreground">{i.due}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Bar */}
                  <div className="pt-2 border-t flex items-center justify-between gap-1" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewInvoice(i)}
                        className="h-8 text-xs font-bold gap-1"
                        title="View Tax Invoice"
                      >
                        <Eye className="h-3.5 w-3.5 text-blue-500" /> View
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(i)}
                        className="h-8 text-xs font-bold gap-1"
                        title="Download PDF Invoice"
                      >
                        <Download className="h-3.5 w-3.5 text-emerald-500" /> PDF
                      </Button>
                    </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEmailTargetId(i.id)}
                        className="h-8 text-xs font-semibold gap-1"
                      >
                        <Mail className="h-3.5 w-3.5 text-purple-500" /> Email
                      </Button>
                  </div>
                </Card>
              ))}

              {filtered.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground bg-card border rounded-2xl p-6">
                  No invoice records match your search or filter criteria.
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
                      <TableHead className="text-xs w-[14%] font-bold">Invoice Number</TableHead>
                      <TableHead className="text-xs w-[12%] font-bold">Order ID</TableHead>
                      <TableHead className="text-xs w-[20%] font-bold">Customer Name</TableHead>
                      <TableHead className="text-xs w-[11%] font-bold">Issued Date</TableHead>
                      <TableHead className="text-xs w-[11%] font-bold">Due Date</TableHead>
                      <TableHead className="text-xs text-right pr-8 w-[12%] font-bold">Amount</TableHead>
                      <TableHead className="text-xs text-center w-[12%] font-bold">Status</TableHead>
                      <TableHead className="text-xs w-[10%] font-bold">Emailed Date</TableHead>
                      <TableHead className="text-xs text-right w-[8%] font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((i) => (
                      <TableRow key={i.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => setPreviewInvoice(i)}>
                        <TableCell className="font-mono text-xs font-bold text-foreground">{i.id}</TableCell>
                        <TableCell className="text-xs font-mono text-amber-600">{i.orderId}</TableCell>
                        <TableCell className="text-xs font-bold text-foreground">{i.customer}</TableCell>
                        <TableCell className="text-xs font-mono">{i.issued}</TableCell>
                        <TableCell className="text-xs font-mono">{i.due}</TableCell>
                        <TableCell className="text-right pr-8 font-extrabold text-xs text-foreground">
                          {formatCurrency(i.amount)}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-center">
                            <Select
                              value={i.status}
                              onValueChange={(val) => {
                                store.updateInvoice(i.id, { status: val as any });
                                toast.success(`Invoice ${i.id} status updated to ${val.toUpperCase()}`);
                              }}
                            >
                              <SelectTrigger
                                className={`h-7 text-[10px] font-extrabold uppercase border rounded-md px-2.5 gap-1.5 w-[115px] shadow-2xs ${statusColor[i.status]}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="w-[145px]">
                                <SelectItem value="paid" className="text-xs font-bold text-emerald-600">
                                  <span className="flex items-center gap-1.5 whitespace-nowrap">✓ PAID</span>
                                </SelectItem>
                                <SelectItem value="pending" className="text-xs font-bold text-amber-600">
                                  <span className="flex items-center gap-1.5 whitespace-nowrap">⏳ PENDING</span>
                                </SelectItem>
                                <SelectItem value="overdue" className="text-xs font-bold text-rose-600">
                                  <span className="flex items-center gap-1.5 whitespace-nowrap">✕ OVERDUE</span>
                                </SelectItem>
                                <SelectItem value="cancelled" className="text-xs font-bold text-slate-600">
                                  <span className="flex items-center gap-1.5 whitespace-nowrap">🛇 CANCELLED</span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {i.emailedAt ?? "—"}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="View Tax Invoice"
                              onClick={() => setPreviewInvoice(i)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Download PDF"
                              onClick={() => handleDownload(i)}
                              className="h-8 w-8 p-0"
                            >
                              <Download className="h-4 w-4 text-emerald-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Email invoice"
                              onClick={() => setEmailTargetId(i.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Mail className="h-4 w-4 text-purple-500" />
                            </Button>

                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* TAB 2: MASTER INVOICE & TAX SETTINGS */}
      {activeTab === "master_settings" && (
        <Card className="border shadow-xs">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-amber-500" /> Master Invoice & Company Tax Variables
                </CardTitle>
                <CardDescription className="text-xs">
                  Update legal entity name, GSTIN number, CIN code, registered office address, and tax rules applied to every PDF invoice.
                </CardDescription>
              </div>

              <Button
                onClick={handleSaveMasterSettings}
                size="sm"
                className="text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs"
              >
                <Save className="h-4 w-4" /> Save Master Settings
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Form Fields */}
              <div className="space-y-4 text-xs">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b pb-2">
                  <Building className="h-4 w-4 text-amber-500" /> Company Legal Entity
                </h3>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Registered Company Name *</Label>
                  <Input
                    value={settingsForm.companyName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, companyName: e.target.value })}
                    placeholder="e.g. E-Commerce Pvt. Ltd."
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Storefront Brand Tagline</Label>
                  <Input
                    value={settingsForm.tagline}
                    onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                    placeholder="e.g. Your Store Name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">GSTIN Tax Registration *</Label>
                    <Input
                      value={settingsForm.gstin}
                      className="font-mono uppercase font-bold"
                      onChange={(e) => setSettingsForm({ ...settingsForm, gstin: e.target.value })}
                      placeholder="29ABCDE1234F1Z5"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Corporate Identity (CIN) *</Label>
                    <Input
                      value={settingsForm.cin}
                      className="font-mono uppercase font-bold"
                      onChange={(e) => setSettingsForm({ ...settingsForm, cin: e.target.value })}
                      placeholder="U72900KA2026PTC109283"
                    />
                  </div>
                </div>

                <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b pb-2 pt-2">
                  <Building className="h-4 w-4 text-blue-500" /> Address & Contact Details
                </h3>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Street Address</Label>
                  <Input
                    value={settingsForm.address}
                    onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    placeholder="102 Metro Residency, MG Road, Indiranagar"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">City, State & Pincode</Label>
                  <Input
                    value={settingsForm.cityStatePincode}
                    onChange={(e) => setSettingsForm({ ...settingsForm, cityStatePincode: e.target.value })}
                    placeholder="Bengaluru, Karnataka - 560038"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Support Email</Label>
                    <Input
                      value={settingsForm.supportEmail}
                      onChange={(e) => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })}
                      placeholder="billing@store.local"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Support Phone</Label>
                    <Input
                      value={settingsForm.supportPhone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, supportPhone: e.target.value })}
                      placeholder="+91 80 4912 3400"
                    />
                  </div>
                </div>

                <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b pb-2 pt-2">
                  <IndianRupee className="h-4 w-4 text-emerald-500" /> Tax & Legal Rules
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Default GST Tax Rate (%)</Label>
                    <Input
                      type="number"
                      value={settingsForm.gstTaxRatePercent}
                      onChange={(e) => setSettingsForm({ ...settingsForm, gstTaxRatePercent: Number(e.target.value) })}
                      placeholder="18"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Place of Supply Code</Label>
                    <Input
                      value={settingsForm.placeOfSupply}
                      onChange={(e) => setSettingsForm({ ...settingsForm, placeOfSupply: e.target.value })}
                      placeholder="Karnataka (29)"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Invoice Terms & Legal Note</Label>
                  <Textarea
                    rows={3}
                    value={settingsForm.legalTerms}
                    onChange={(e) => setSettingsForm({ ...settingsForm, legalTerms: e.target.value })}
                    placeholder="E. & O.E. Subject to Jurisdiction..."
                  />
                </div>
              </div>

              {/* Right Column: Live Tax Invoice Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-amber-500" /> Real-time Tax Invoice Preview
                  </h3>
                  <Badge variant="outline" className="text-[10px] font-bold bg-amber-500/10 text-amber-600">
                    LIVE RENDERING
                  </Badge>
                </div>

                {/* Simulated Invoice Card */}
                <div className="p-5 rounded-2xl border-2 bg-card space-y-4 text-xs shadow-sm font-sans">
                  <div className="flex justify-between items-start border-b pb-3">
                    <div>
                      <div className="font-extrabold text-sm text-foreground">{settingsForm.companyName || "Company Name"}</div>
                      <div className="text-[11px] text-muted-foreground">{settingsForm.tagline}</div>
                      <div className="text-[11px] text-muted-foreground">{settingsForm.address}, {settingsForm.cityStatePincode}</div>
                      <div className="text-[10px] font-mono text-muted-foreground mt-1">
                        GSTIN: <span className="font-bold text-foreground">{settingsForm.gstin || "N/A"}</span> • CIN: {settingsForm.cin || "N/A"}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-amber-500 text-slate-950 font-extrabold text-[10px]">TAX INVOICE</Badge>
                      <div className="font-mono font-bold mt-1 text-foreground">INV-2026-0001</div>
                      <div className="text-[10px] text-muted-foreground">GST Rate: {settingsForm.gstTaxRatePercent}%</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/30 border text-[11px] space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">Place of Supply</span><span className="font-bold">{settingsForm.placeOfSupply}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Support Contact</span><span className="font-mono">{settingsForm.supportEmail}</span></div>
                  </div>

                  <div className="border rounded-lg p-2.5 bg-muted/10 space-y-1.5">
                    <div className="font-bold text-[11px] text-foreground">Aurora Wireless Headphones (Sample)</div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Qty: 1 × ₹3,126</span>
                      <span className="font-bold font-mono">₹3,689.00</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-muted-foreground italic border-t pt-2">
                    {settingsForm.legalTerms}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-4 border-t bg-muted/20 flex justify-end">
            <Button
              onClick={handleSaveMasterSettings}
              size="sm"
              className="text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs"
            >
              <Save className="h-4 w-4" /> Save Master Settings
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STANDARD E-COMMERCE TAX INVOICE POPUP MODAL */}
      <TaxInvoiceViewDialog
        invoice={previewInvoice}
        onClose={() => setPreviewInvoice(null)}
        onDownload={handleDownload}
        onEmail={(inv) => setEmailTargetId(inv.id)}
      />

      {/* CREATE INVOICE MODAL DIALOG — Enhanced UI */}
      <Dialog open={openNewDialog} onOpenChange={setOpenNewDialog}>
        <DialogContent className="max-w-lg p-0 overflow-hidden gap-0 rounded-2xl shadow-2xl">

          {/* ── Gradient Header ── */}
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background px-6 pt-6 pb-4 border-b border-border/50 pr-14">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0 shadow-sm">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground leading-tight">
                  Issue Manual Invoice
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Generate a custom tax invoice.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* ── Form Body ── */}
          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">

            {/* Customer Details */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <User className="h-3 w-3" /> Customer Details
              </p>
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="inv-cust" className="text-xs font-semibold">
                    Customer Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="inv-cust"
                      placeholder="e.g. Inderpal Singh"
                      value={newCustomer}
                      onChange={(e) => setNewCustomer(e.target.value)}
                      className="pl-9 text-sm h-9 bg-muted/40 border-border/70"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="inv-email" className="text-xs font-semibold">Customer Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="inv-email"
                      placeholder="e.g. inderpal@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="pl-9 text-sm h-9 bg-muted/40 border-border/70"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Billing Details */}
            <div className="space-y-3 pt-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <IndianRupee className="h-3 w-3" /> Billing Details
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="inv-orderid" className="text-xs font-semibold">Order ID</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="inv-orderid"
                      placeholder="e.g. #ORD-1094"
                      value={newOrderId}
                      onChange={(e) => setNewOrderId(e.target.value)}
                      className="pl-9 text-sm h-9 bg-muted/40 border-border/70"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="inv-amount" className="text-xs font-semibold">
                    Amount (₹) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">₹</span>
                    <Input
                      id="inv-amount"
                      type="number"
                      placeholder="e.g. 2490"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="pl-8 text-sm h-9 bg-muted/40 border-border/70 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Date & Payment Status */}
            <div className="space-y-3 pt-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="h-3 w-3" /> Due Date &amp; Status
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="inv-duedate" className="text-xs font-semibold">Payment Due Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="inv-duedate"
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="pl-9 text-sm h-9 bg-muted/40 border-border/70 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="inv-status" className="text-xs font-semibold">Payment Status</Label>
                  <Select
                    value={newStatus}
                    onValueChange={(v: any) => setNewStatus(v)}
                  >
                    <SelectTrigger id="inv-status" className="h-9 text-sm bg-muted/40 border-border/70">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending" className="text-xs font-bold text-amber-600">⏳ PENDING</SelectItem>
                      <SelectItem value="paid" className="text-xs font-bold text-emerald-600">✓ PAID</SelectItem>
                      <SelectItem value="overdue" className="text-xs font-bold text-rose-600">✕ OVERDUE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border/40 bg-muted/20">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenNewDialog(false)}
              className="h-9 px-4 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateInvoice}
              className="h-9 px-5 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
            >
              <Check className="h-3.5 w-3.5" />
              Issue Invoice PDF
            </Button>
          </div>

        </DialogContent>
      </Dialog>

      {/* EMAIL INVOICE DIALOG */}
      <EmailInvoiceDialog
        invoiceId={emailTargetId}
        onClose={() => setEmailTargetId(null)}
      />
    </div>
  );
}

{/* STANDARD E-COMMERCE TAX INVOICE POPUP MODAL DIALOG COMPONENT */}
function TaxInvoiceViewDialog({
  invoice,
  onClose,
  onDownload,
  onEmail,
}: {
  invoice: Invoice | null;
  onClose: () => void;
  onDownload: (inv: Invoice) => void;
  onEmail: (inv: Invoice) => void;
}) {
  const orders = useStore((s) => s.orders);
  const companySettings = useStore((s) => s.companyInvoiceSettings);

  const order = invoice ? orders.find((o) => o.id === invoice.orderId) : undefined;
  const open = !!invoice;

  const itemsList: OrderItem[] = useMemo(() => {
    if (order && Array.isArray(order.items) && order.items.length > 0) {
      return order.items;
    }
    // Fallback line item
    return [
      {
        id: "P-1001",
        title: "Aurora Wireless Headphones",
        price: (invoice?.amount || 3689) * 0.82,
        qty: 1,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
      },
    ];
  }, [order, invoice]);

  const taxMultiplier = (companySettings.gstTaxRatePercent || 18) / 100;
  const subtotal = invoice ? invoice.amount / (1 + taxMultiplier) : 0;
  const cgst = (invoice?.amount || 0) - subtotal > 0 ? ((invoice?.amount || 0) - subtotal) / 2 : 0;
  const sgst = cgst;
  const grandTotal = invoice ? invoice.amount : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 border-2 bg-background">
        {invoice && (
          <div className="p-6 space-y-6 text-xs" id="tax-invoice-printable">
            {/* Header & Logo Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 pb-5 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center font-extrabold text-slate-950 text-sm">
                    {companySettings.companyName[0] || "M"}
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-foreground uppercase">
                    {companySettings.companyName}
                  </h2>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {companySettings.tagline}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {companySettings.address}, {companySettings.cityStatePincode}
                </p>
                <p className="text-[11px] text-muted-foreground font-mono">
                  GSTIN: <span className="font-bold text-foreground">{companySettings.gstin}</span> • CIN: {companySettings.cin}
                </p>
              </div>

              <div className="text-right sm:text-right">
                <div className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-extrabold text-xs uppercase tracking-wider rounded-md mb-2">
                  TAX INVOICE / ORIGINAL
                </div>
                <div className="font-mono text-base font-black text-foreground">{invoice.id}</div>
                <div className="text-[11px] text-muted-foreground">Date: <span className="font-mono font-bold text-foreground">{invoice.issued}</span></div>
                <div className="text-[11px] text-muted-foreground">Due: <span className="font-mono font-bold text-foreground">{invoice.due}</span></div>
              </div>
            </div>

            {/* Billed To & Shipped To Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border bg-muted/20">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                  Billed To (Customer Details)
                </span>
                <div className="font-extrabold text-sm text-foreground">{invoice.customer}</div>
                <div className="text-muted-foreground">{order?.email || `${invoice.customer.toLowerCase().replace(/\s+/g, ".")}@example.com`}</div>
                <div className="text-muted-foreground text-[11px] mt-1">
                  {order?.shippingAddress || "Flat 402, Metro Residency, MG Road, Indiranagar, Bengaluru 560038"}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                  Order & Payment Reference
                </span>
                <div className="flex justify-between"><span className="text-muted-foreground">Order ID</span><span className="font-mono font-bold text-amber-600">{invoice.orderId}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment Status</span><Badge variant="outline" className={`text-[10px] font-bold ${statusColor[invoice.status]}`}>{invoice.status}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment Method</span><span className="font-bold text-foreground">{order?.paymentMethod || "UPI / NetBanking"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Place of Supply</span><span className="font-mono font-bold">{companySettings.placeOfSupply}</span></div>
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
                  {itemsList.map((item, idx) => {
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
                  Amount in Words:
                </div>
                <div className="text-xs font-bold p-2.5 rounded-lg bg-muted/30 border text-foreground italic">
                  Three Thousand Six Hundred Eighty Nine Rupees Only
                </div>
                <div className="text-[10px] text-muted-foreground space-y-0.5 pt-1">
                  <p>• {companySettings.legalTerms}</p>
                </div>
              </div>

              <div className="w-full sm:w-72 space-y-2 p-3 rounded-xl border bg-muted/20 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Taxable Value</span><span className="font-mono font-bold">{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">CGST ({companySettings.gstTaxRatePercent / 2}%)</span><span className="font-mono font-bold">{formatCurrency(cgst)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">SGST ({companySettings.gstTaxRatePercent / 2}%)</span><span className="font-mono font-bold">{formatCurrency(sgst)}</span></div>
                <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Shipping & Delivery</span><span className="font-bold text-emerald-600">FREE</span></div>
                <div className="flex justify-between items-center pt-1">
                  <span className="font-extrabold text-sm text-foreground">Grand Total</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400 text-base font-mono">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="pt-4 border-t flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> GSTIN: {companySettings.gstin}
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
                  variant="outline"
                  size="sm"
                  onClick={() => onEmail(invoice)}
                  className="text-xs font-semibold gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5 text-purple-500" /> Email PDF
                </Button>

                <Button
                  onClick={() => onDownload(invoice)}
                  size="sm"
                  className="text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs"
                >
                  <Download className="h-4 w-4" /> Download PDF
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EmailInvoiceDialog({
  invoiceId,
  onClose,
}: {
  invoiceId: string | null;
  onClose: () => void;
}) {
  const invoices = useStore((s) => s.invoices);
  const orders = useStore((s) => s.orders);
  const companySettings = useStore((s) => s.companyInvoiceSettings);

  const invoice = invoices.find((i) => i.id === invoiceId);
  const order = invoice ? orders.find((o) => o.id === invoice.orderId) : undefined;
  const open = !!invoice;

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open && invoice) {
      setTo(order?.email ?? `${invoice.customer.toLowerCase().replace(/\s+/g, ".")}@example.com`);
      setSubject(`Invoice ${invoice.id} from ${companySettings.tagline || companySettings.companyName}`);
      setMessage(
        `Hi ${invoice.customer.split(" ")[0]},\n\nPlease find attached invoice ${invoice.id} for ${formatCurrency(invoice.amount)}, due ${invoice.due}.\n\nThank you for your business.\n— ${companySettings.companyName}`,
      );
    }
  }, [open, invoice, order, companySettings]);

  const handleSend = async () => {
    if (!invoice) return;
    if (!to.includes("@")) {
      toast.error("Enter a valid recipient email");
      return;
    }
    setSending(true);
    try { await api(`/admin/invoices/${invoice.id}/email`, { method: "POST", body: JSON.stringify({ to }) }); }
    catch (error) { setSending(false); toast.error(error instanceof Error ? error.message : "Unable to send invoice email"); return; }
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    store.updateInvoice(invoice.id, { emailedAt: now });
    setSending(false);
    onClose();
    toast.success(`Invoice ${invoice.id} emailed to ${to}`, {
      description: "PDF attached · Demo mode (no real email sent)",
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg p-6">
        <DialogHeader className="pb-3 border-b">
          <DialogTitle className="text-base font-extrabold flex items-center gap-2">
            <Mail className="h-4 w-4 text-purple-500" /> Dispatch Invoice via Email
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {invoice && `Send PDF invoice copy for ${invoice.id} (${formatCurrency(invoice.amount)})`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 pt-2 text-xs">
          <div className="grid gap-1.5">
            <Label className="text-xs font-bold">To Recipient</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-bold">Email Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-bold">Message</Label>
            <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2 text-xs font-mono">
            <FileText className="h-4 w-4 text-amber-500" />
            <span className="flex-1 font-bold">{invoice?.id}.pdf</span>
            <Badge variant="outline" className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
              Attached
            </Badge>
          </div>
        </div>
        <DialogFooter className="pt-4 border-t gap-2">
          <Button variant="outline" onClick={onClose} className="text-xs font-semibold">
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending} className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs">
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {sending ? "Sending..." : "Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
