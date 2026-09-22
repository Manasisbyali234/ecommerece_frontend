"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ShoppingCart,
  Ticket,
  X,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Plus,
  Trash2,
  Minus,
  Check,
  LocateFixed,
  Award,
  Truck,
  Headphones,
  Wallet,
  CreditCard,
  Banknote,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-context";
import { useStore, hydrateCustomerStore, type CustomerAddress, type CustomerTier } from "@/lib/store";
import { evaluateCoupon, type CartLine } from "@/lib/coupons";
import { api, getAccessToken } from "@/lib/api";
import {
  formatCurrency,
} from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// These values should ideally come from admin settings (Settings > Shipping / General)
const SHIPPING_COST = 50; // ₹50 flat shipping fee
const TAX_RATE = 0.08; // 8% GST

function qualifiesForTier(tier: CustomerTier, completedOrders: number, lifetimeSpend: number) {
  return completedOrders >= Number(tier.minOrders || 0) && lifetimeSpend >= Number(tier.minTotalSpent || 0);
}

function isAllCategory(value?: string) {
  return !value || ["all", "all categories"].includes(value.trim().toLowerCase());
}

function isAllSubCategory(value?: string) {
  return !value || ["all", "all subcategories"].includes(value.trim().toLowerCase());
}

function tierBenefitPercent(line: CartLine, tier: CustomerTier | null) {
  if (!tier) return 0;
  return (tier.categoryBenefits || []).reduce((max, benefit) => {
    const categoryMatches = isAllCategory(benefit.category) || benefit.category === line.category;
    const subCategoryMatches = isAllSubCategory(benefit.subCategory) || benefit.subCategory === line.subCategory;
    return categoryMatches && subCategoryMatches ? Math.max(max, Number(benefit.discountPercent || 0)) : max;
  }, 0);
}

export default function StorefrontCheckoutPage() {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const coupons = useStore((s) => s.coupons);
  const orders = useStore((s) => s.orders);
  const customerTiers = useStore((s) => s.customerTiers);
  const savedAddresses = useStore((s) => s.customerAddresses).map((address) => ({ ...address, name: address.fullName, label: address.type }));
  const router = useRouter();

  useEffect(() => {
    if (!getAccessToken()) {
      toast.error("Please login first to continue to checkout.");
    }
  }, []);

  // Wizard Step State (1: Cart Details, 2: Shipping Address, 3: Payment)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("online");

  // Address Selection State
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isAddingCustomAddress, setIsAddingCustomAddress] = useState(false);

  const [customAddress, setCustomAddress] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [couponCode, setCouponCode] = useState("");
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ place_id: string; description: string }>>([]);

  // Selected Address Details
  const activeAddress = useMemo(() => {
    if (isAddingCustomAddress) {
      return {
        fullName: customAddress.name || "Customer",
        street: customAddress.street,
        city: customAddress.city,
        pincode: customAddress.pincode,
        state: customAddress.state,
      };
    }
    const found = savedAddresses.find((a) => a.id === selectedAddressId);
    return found || savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
  }, [selectedAddressId, isAddingCustomAddress, customAddress, savedAddresses]);

  // Convert cart items to CartLine format for coupon evaluation
  const cartLines: CartLine[] = useMemo(
    () =>
      items.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        category: i.product.category,
        subCategory: i.product.subCategory,
        price: i.product.price,
        qty: i.quantity,
        image: i.product.image,
      })),
    [items]
  );

  const appliedCoupon = appliedId ? coupons.find((c) => c.id === appliedId) : null;

  const evaluation = useMemo(() => {
    if (!appliedCoupon) return null;
    return evaluateCoupon(appliedCoupon, cartLines, subtotal, SHIPPING_COST);
  }, [appliedCoupon, cartLines, subtotal]);

  const tierStats = useMemo(() => {
    const completed = orders.filter((order) => order.status === "delivered");
    return {
      completedOrders: completed.length,
      lifetimeSpend: completed.reduce((sum, order) => sum + Number(order.total || 0), 0),
    };
  }, [orders]);

  const activeTier = useMemo(() => {
    return customerTiers
      .filter((tier) => qualifiesForTier(tier, tierStats.completedOrders, tierStats.lifetimeSpend))
      .sort((a, b) => (Number(b.minTotalSpent || 0) - Number(a.minTotalSpent || 0)) || (Number(b.minOrders || 0) - Number(a.minOrders || 0)))[0] || null;
  }, [customerTiers, tierStats]);

  const tierDiscount = useMemo(() => {
    if (!activeTier) return 0;
    return cartLines.reduce((sum, line) => sum + ((line.price * line.qty) * tierBenefitPercent(line, activeTier) / 100), 0);
  }, [activeTier, cartLines]);

  const discount = evaluation?.ok ? evaluation.discount : 0;
  const shippingDiscount = Math.max(evaluation?.ok ? evaluation.shippingDiscount : 0, activeTier?.freeShipping ? SHIPPING_COST : 0);
  const shipping = Math.max(0, SHIPPING_COST - shippingDiscount);
  const taxable = Math.max(0, subtotal - discount - tierDiscount);
  const tax = taxable * TAX_RATE;
  const total = taxable + shipping + tax;

  const applyByCode = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    const match = coupons.find((c) => c.code === code);
    if (!match) {
      toast.error(`No coupon matches "${code}"`);
      return;
    }
    tryApply(match.id);
  };

  const tryApply = (id: string) => {
    const c = coupons.find((x) => x.id === id);
    if (!c) return;
    const evalResult = evaluateCoupon(c, cartLines, subtotal, SHIPPING_COST);
    if (!evalResult.ok) {
      toast.error(evalResult.reason ?? "Coupon can't be applied");
      return;
    }
    setAppliedId(id);
    setCouponCode(c.code);
    toast.success(`Applied coupon ${c.code}`);
  };

  const clearCoupon = () => {
    setAppliedId(null);
    setCouponCode("");
  };

  const fillAddressFromLocation = () => {
    if (!navigator.geolocation) { toast.error("Location access is not supported by this browser"); return; }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const result = await api<{ success: boolean; formatted_address?: string; details?: { street?: string; city?: string; state?: string; pincode?: string } }>(`/location/reverse-geocode?lat=${coords.latitude}&lng=${coords.longitude}`);
        if (!result.success || !result.details) throw new Error("Location details were not found");
        setIsAddingCustomAddress(true);
        setCustomAddress((current) => ({ ...current, street: result.details?.street || result.formatted_address || current.street, city: result.details?.city || current.city, state: result.details?.state || current.state, pincode: result.details?.pincode || current.pincode }));
        toast.success("Address fields filled from your location");
      } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to get address from location"); }
      finally { setIsLocating(false); }
    }, () => { setIsLocating(false); toast.error("Allow location access to fill your address"); }, { enableHighAccuracy: true, timeout: 10000 });
  };

  useEffect(() => {
    if (!isAddingCustomAddress || customAddress.street.trim().length < 3) { setAddressSuggestions([]); return; }
    const timeout = window.setTimeout(async () => {
      try {
        const result = await api<{ predictions?: Array<{ place_id: string; description: string }> }>(`/location/autocomplete?input=${encodeURIComponent(customAddress.street)}`);
        setAddressSuggestions(result.predictions?.slice(0, 5) || []);
      } catch { setAddressSuggestions([]); }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [customAddress.street, isAddingCustomAddress]);

  const resolveAddress = async (): Promise<CustomerAddress | Omit<CustomerAddress, "id"> | null> => {
    if (isAddingCustomAddress) {
      const normalizedPhone = customAddress.phone.replace(/\D/g, "").slice(-10);
      const address = { fullName: customAddress.name, phone: normalizedPhone, street: customAddress.street, city: customAddress.city, state: customAddress.state, pincode: customAddress.pincode, type: "Home" as const, isDefault: savedAddresses.length === 0 };
      const saved = await api<{ addresses: CustomerAddress[] }>("/me/addresses", { method: "POST", body: JSON.stringify(address) });
      return saved.addresses.find((item) => item.isDefault) || saved.addresses[saved.addresses.length - 1] || address;
    }
    return savedAddresses.find((item) => item.id === selectedAddressId) || savedAddresses.find((item) => item.isDefault) || null;
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) { toast.error("Your shopping cart is empty"); return; }
    if (!getAccessToken()) { toast.error("Please sign in before placing an order"); return; }

    try {
      const address = await resolveAddress();
      if (!address) { toast.error("Please choose or add a delivery address"); return; }

      const { order } = await api<{ order: { id: string; orderNumber: string; paymentMethod: string; paymentStatus: string } }>("/orders/checkout", { method: "POST", body: JSON.stringify({ address, couponCode: appliedCoupon?.code, paymentMethod, items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })) }) });

      if (paymentMethod === "online") {
        const { payment } = await api<{ payment: { keyId: string; orderId: string; amount: number; currency: string } }>(`/orders/${order.id}/payment`, { method: "POST" });
        await openRazorpay(payment, order);
      } else {
        clearCart();
        await hydrateCustomerStore();
        toast.success(`Order ${order.orderNumber} placed!`, { description: "Cash on delivery confirmed." });
        router.push(`/order-success?orderId=${encodeURIComponent(order.orderNumber || order.id)}`);
      }
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to place order"); }
  };

  const openRazorpay = (payment: { keyId: string; orderId: string; amount: number; currency: string }, order: { id: string; orderNumber: string }) => {
    return new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rzp = new (window as any).Razorpay({
          key: payment.keyId,
          amount: payment.amount,
          currency: payment.currency,
          order_id: payment.orderId,
          name: "Metromindz",
          description: `Order ${order.orderNumber}`,
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            await api(`/orders/${order.id}/payment/confirm`, { method: "POST", body: JSON.stringify(response) });
            clearCart();
            await hydrateCustomerStore();
            toast.success(`Payment successful! Order ${order.orderNumber} confirmed.`);
            router.push(`/order-success?orderId=${encodeURIComponent(order.orderNumber || order.id)}`);
            resolve();
          },
          modal: { ondismiss: () => { toast.error("Payment cancelled"); reject(new Error("Payment cancelled")); } },
          theme: { color: "#f59e0b" },
        });
        rzp.open();
      };
      script.onerror = () => reject(new Error("Failed to load Razorpay"));
      document.body.appendChild(script);
    });
  };

  const availableCoupons = coupons.filter((c) => evaluateCoupon(c, cartLines, subtotal, SHIPPING_COST).ok);

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-3 py-5 sm:space-y-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Header Title & Wizard Step Progress Bar */}
      <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-center md:pb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Customer Checkout
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review your cart and shipping address, then place the order. Payment is currently skipped.
          </p>
        </div>

        {/* 2-Step Sequential Wizard Progress */}
        <div className="mobile-scrollbar-none flex w-full items-center gap-2 overflow-x-auto rounded-xl border bg-muted/30 p-2 md:w-auto md:gap-3">
          <button
            onClick={() => setStep(1)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:px-4 ${
              step === 1
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/20 text-[11px]">
              1
            </span>
            <span>Shopping Cart</span>
          </button>

          <ArrowRight className="h-4 w-4 text-muted-foreground" />

          <button
            onClick={() => { if (items.length === 0) { toast.error("Add products to shopping cart first"); return; } setStep(2); }}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:px-4 ${ step === 2 ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground" }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/20 text-[11px]">2</span>
            <span>Shipping Address</span>
          </button>

          <ArrowRight className="h-4 w-4 text-muted-foreground" />

          <button
            onClick={() => { if (items.length === 0) { toast.error("Add products to shopping cart first"); return; } setStep(3); }}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:px-4 ${ step === 3 ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground" }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/20 text-[11px]">3</span>
            <span>Payment</span>
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3 lg:gap-8">
        {/* Main Step Content Column */}
        <div className="space-y-6 lg:col-span-2">
          {step === 1 ? (
            /* STEP 1: Shopping Cart & Order Items List */
            <Card className="border shadow-sm">
              <CardHeader className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-bold sm:text-lg">
                  <ShoppingCart className="h-5 w-5 text-primary" /> Step 1: Shopping Cart Items ({items.length})
                </CardTitle>
                <Link href="/#products" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                  + Add More Products
                </Link>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {items.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-foreground">Your Shopping Cart is Empty</h3>
                      <p className="text-xs text-muted-foreground">Add products from the storefront to start checkout.</p>
                    </div>
                    <Button asChild>
                      <Link href="/#products">Explore Products Collection</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Cart Items List */}
                    <div className="divide-y rounded-xl border">
                      {items.map((item, index) => {
                        const mrp = item.product.originalPrice || Math.round(item.product.price * 1.28);
                        const discountPercent = Math.round(((mrp - item.product.price) / mrp) * 100);

                        return (
                          <div
                            key={item.product.id ?? index}
                            className="flex flex-col items-start justify-between gap-3 p-3 transition-colors hover:bg-muted/10 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
                          >
                            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                className="h-16 w-16 shrink-0 rounded-lg border object-cover shadow-sm sm:h-20 sm:w-20 sm:rounded-xl"
                              />
                              <div className="min-w-0 space-y-1">
                                {/* Category & In Stock Tags (ABOVE Product Name) */}
                                <div className="flex flex-wrap items-center gap-2 pb-0.5">
                                  <Badge variant="secondary" className="text-[10px] font-semibold">
                                    {item.product.category}
                                  </Badge>
                                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                    In Stock
                                  </span>
                                </div>

                                {/* Product Name */}
                                <Link href={`/products/${item.product.id}`}>
                                  <h4 className="line-clamp-2 text-sm font-bold text-foreground transition-colors hover:text-primary sm:line-clamp-1">
                                    {item.product.name}
                                  </h4>
                                </Link>

                                {/* Short 1-Line Product Description */}
                                <p className="text-xs text-muted-foreground line-clamp-1 max-w-sm">
                                  {item.product.description || "High-quality premium product with exceptional craftsmanship."}
                                </p>

                                {/* Color & Size Variant Details */}
                                {((item.product.colors && item.product.colors.length > 0) || (item.product.sizes && item.product.sizes.length > 0)) && (
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-0.5 font-medium">
                                    {item.product.colors && item.product.colors.length > 0 && (
                                      <span className="flex items-center gap-1.5">
                                        <span>Color:</span>
                                        <span
                                          className="h-3 w-3 rounded-full border border-slate-300 dark:border-slate-700 shadow-xs inline-block shrink-0"
                                          style={{ backgroundColor: item.product.colors[0].hex }}
                                        />
                                        <strong className="text-foreground font-semibold">{item.product.colors[0].name}</strong>
                                      </span>
                                    )}

                                    {item.product.sizes && item.product.sizes.length > 0 && (
                                      <span className="flex items-center gap-1 border-l pl-3 border-muted">
                                        <span>Size:</span>
                                        <strong className="text-foreground font-semibold px-1.5 py-0.5 rounded bg-muted/70 text-[11px]">
                                          {item.product.sizes[0]}
                                        </strong>
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Sold By Info (Next Line) */}
                                <div className="text-xs text-muted-foreground font-medium pt-0.5">
                                  Sold by: <strong className="text-foreground font-semibold">{item.product.brand || "Official Store"}</strong>
                                </div>
                              </div>
                            </div>

                            <div className="flex w-full flex-wrap items-center justify-between gap-3 border-t pt-2 sm:w-auto sm:flex-nowrap sm:gap-6 sm:border-0 sm:pt-0">
                              {/* Quantity Controls */}
                              <div className="flex items-center gap-1.5 border rounded-lg p-1 bg-background">
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-foreground transition-colors"
                                  title="Decrease quantity"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="w-8 text-center text-xs font-bold font-mono">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-foreground transition-colors"
                                  title="Increase quantity"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              {/* Item Subtotal, Unit Discount Price, MRP & Discount % */}
                              <div className="min-w-[94px] space-y-0.5 text-right sm:min-w-[110px]">
                                <div className="text-base font-extrabold text-foreground">
                                  {formatCurrency(item.product.price * item.quantity)}
                                </div>
                                <div className="flex items-center justify-end gap-1.5 text-xs">
                                  <span className="font-semibold text-foreground">{formatCurrency(item.product.price)}</span>
                                  <span className="line-through text-[11px] text-muted-foreground">{formatCurrency(mrp)}</span>
                                </div>
                                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  {discountPercent}% OFF
                                </div>
                              </div>

                              {/* Delete Item */}
                              <button
                                onClick={() => removeItem(item.product.id)}
                                className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                                title="Remove item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Step 1 Action Button */}
                    <div className="flex items-center justify-end pt-4">
                      <Button
                        size="lg"
                        className="h-11 w-full px-4 font-semibold shadow-md sm:h-12 sm:w-auto sm:px-8"
                        onClick={() => setStep(2)}
                      >
                        Continue to Shipping Address <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : step === 3 ? (
            /* STEP 3: Payment Method */
            <Card className="border shadow-sm">
              <CardHeader className="flex flex-col gap-2 border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-bold sm:text-lg">
                  <CreditCard className="h-5 w-5 text-primary" /> Step 3: Choose Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid gap-3">
                  <div
                    onClick={() => setPaymentMethod("online")}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${ paymentMethod === "online" ? "border-primary bg-primary/5 shadow-sm" : "border-muted hover:border-primary/50" }`}
                  >
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">Pay Online via Razorpay</p>
                      <p className="text-xs text-muted-foreground">UPI, Cards, NetBanking, Wallets — Secure & Instant</p>
                    </div>
                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${ paymentMethod === "online" ? "border-primary bg-primary text-primary-foreground" : "border-muted" }`}>
                      {paymentMethod === "online" && <Check className="h-3 w-3" />}
                    </div>
                  </div>

                  <div
                    onClick={() => setPaymentMethod("cod")}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${ paymentMethod === "cod" ? "border-primary bg-primary/5 shadow-sm" : "border-muted hover:border-primary/50" }`}
                  >
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Banknote className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">Cash on Delivery</p>
                      <p className="text-xs text-muted-foreground">Pay when your order arrives at your door</p>
                    </div>
                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${ paymentMethod === "cod" ? "border-primary bg-primary text-primary-foreground" : "border-muted" }`}>
                      {paymentMethod === "cod" && <Check className="h-3 w-3" />}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <Button variant="outline" onClick={() => setStep(2)} className="w-full sm:w-auto">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button size="lg" className="h-11 w-full px-4 font-semibold shadow-md sm:h-12 sm:w-auto sm:px-8" onClick={handlePlaceOrder}>
                    {paymentMethod === "online" ? `Pay ${formatCurrency(total)} via Razorpay` : `Place Order (COD) — ${formatCurrency(total)}`}
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* STEP 2: Shipping Address Selection Options */
            <Card className="border shadow-sm">
              <CardHeader className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-bold sm:text-lg">
                  <MapPin className="h-5 w-5 text-primary" /> Step 2: Select Shipping Address
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  Available Addresses ({savedAddresses.length})
                </Badge>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {/* Available Saved Address Cards Selection */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Select From Your Saved Address List:
                  </Label>

                  <div className="grid gap-3 sm:grid-cols-1">
                    {savedAddresses.map((addr) => {
                      const isSelected = !isAddingCustomAddress && selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => {
                            setIsAddingCustomAddress(false);
                            setSelectedAddressId(addr.id);
                          }}
                          className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-muted hover:border-primary/50 bg-background"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-foreground">
                                  {addr.type}
                                </span>
                                {addr.isDefault && (
                                  <Badge className="bg-primary/10 text-primary text-[10px]">
                                    Default
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-foreground">{addr.name} · {addr.phone}</p>
                              <p className="text-xs text-muted-foreground">{addr.street}</p>
                              <p className="text-xs text-muted-foreground">
                                {addr.city}, {addr.state} — {addr.pincode}
                              </p>
                            </div>

                            <div
                              className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Add New Address Option Card */}
                    <div
                      onClick={() => setIsAddingCustomAddress(true)}
                      className={`p-4 rounded-xl border-2 border-dashed cursor-pointer text-center transition-all ${
                        isAddingCustomAddress
                          ? "border-primary bg-primary/5 font-semibold"
                          : "border-muted hover:border-primary/50 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2 text-xs font-semibold">
                        <Plus className="h-4 w-4 text-primary" /> Deliver to a New Shipping Address
                      </div>
                    </div>
                  </div>
                </div>

                {/* New Address Form (if selected) */}
                {isAddingCustomAddress && (
                  <div className="rounded-xl border bg-muted/20 p-4 space-y-4 pt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      New Shipping Address Form
                    </h4>
                    <Button type="button" variant="outline" size="sm" onClick={fillAddressFromLocation} disabled={isLocating} className="gap-1.5 text-xs">
                      <LocateFixed className="h-3.5 w-3.5" /> {isLocating ? "Finding address..." : "Use my current location"}
                    </Button>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="cname" className="text-xs">Full Recipient Name</Label>
                        <Input
                          id="cname"
                          placeholder="e.g. Aakash Sharma"
                          value={customAddress.name}
                          onChange={(e) => setCustomAddress({ ...customAddress, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2 relative">
                        <Label htmlFor="cphone" className="text-xs">Phone Number</Label>
                        <Input
                          id="cphone"
                          placeholder="+91 98765 43210"
                          value={customAddress.phone}
                          onChange={(e) => setCustomAddress({ ...customAddress, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="cstreet" className="text-xs">Street Address / House No.</Label>
                        <div className="relative">
                          <Input
                            id="cstreet"
                            placeholder="Flat, House no., Building, Street"
                            value={customAddress.street}
                            onChange={(e) => setCustomAddress({ ...customAddress, street: e.target.value })}
                          />
                          {addressSuggestions.length > 0 && (
                            <div className="absolute z-20 top-full mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-lg">
                              {addressSuggestions.map((suggestion) => (
                                <button key={suggestion.place_id} type="button" className="block w-full px-3 py-2 text-left text-xs hover:bg-muted" onClick={() => { setCustomAddress({ ...customAddress, street: suggestion.description }); setAddressSuggestions([]); }}>
                                  {suggestion.description}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="ccity" className="text-xs">City</Label>
                        <Input
                          id="ccity"
                          placeholder="Mumbai"
                          value={customAddress.city}
                          onChange={(e) => setCustomAddress({ ...customAddress, city: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="cstate" className="text-xs">State</Label>
                        <Input
                          id="cstate"
                          placeholder="Maharashtra"
                          value={customAddress.state}
                          onChange={(e) => setCustomAddress({ ...customAddress, state: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="cpincode" className="text-xs">Pincode</Label>
                        <Input
                          id="cpincode"
                          placeholder="400001"
                          value={customAddress.pincode}
                          onChange={(e) => setCustomAddress({ ...customAddress, pincode: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2 Action Buttons */}
                <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <Button variant="outline" onClick={() => setStep(1)} className="w-full sm:w-auto">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Cart
                  </Button>
                  <Button size="lg" className="h-11 w-full px-4 font-semibold shadow-md sm:h-12 sm:w-auto sm:px-8" onClick={() => {
                    if (isAddingCustomAddress && (!customAddress.name.trim() || !customAddress.phone.trim() || !customAddress.street.trim() || !customAddress.city.trim() || !customAddress.state.trim() || !/^\d{6}$/.test(customAddress.pincode))) {
                      toast.error("Please complete all required address fields"); return;
                    }
                    setStep(3);
                  }}>
                    Continue to Payment <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Order Summary & Coupon Card */}
        <div className="space-y-6">
          <Card className="border shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-bold">Order Summary</CardTitle>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* Items Summary Count */}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
              </div>

              {/* Coupon Discount */}
              {discount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Coupon ({appliedCoupon?.code})</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}

              {activeTier && tierDiscount > 0 && (
                <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400 font-medium">
                  <span>{activeTier.name} benefits</span>
                  <span>-{formatCurrency(tierDiscount)}</span>
                </div>
              )}

              {/* Shipping */}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Standard Delivery</span>
                <span className="font-semibold text-foreground">
                  {shipping === 0 ? "FREE" : formatCurrency(shipping)}
                </span>
              </div>

              {/* Tax */}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">GST / Tax (8%)</span>
                <span className="font-semibold text-foreground">{formatCurrency(tax)}</span>
              </div>

              <Separator />

              {/* Grand Total */}
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-sm font-bold text-foreground">Grand Total</span>
                <span className="text-2xl font-extrabold text-primary">
                  {formatCurrency(total)}
                </span>
              </div>
            </CardContent>
          </Card>

          {activeTier && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" /> Customer Tier
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline" className={`text-xs font-extrabold uppercase ${activeTier.badgeColor}`}>
                    {activeTier.name}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {tierStats.completedOrders} completed orders - {formatCurrency(tierStats.lifetimeSpend)} lifetime
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tierDiscount > 0 && (
                    <Badge variant="outline" className="text-[10px] font-semibold text-emerald-600 border-emerald-500/20 bg-emerald-500/10">
                      {formatCurrency(tierDiscount)} tier discount
                    </Badge>
                  )}
                  {activeTier.freeShipping && (
                    <Badge variant="outline" className="text-[10px] font-semibold text-blue-600 border-blue-500/20 bg-blue-500/10 gap-1">
                      <Truck className="h-3 w-3" /> Free shipping
                    </Badge>
                  )}
                  {activeTier.prioritySupport && (
                    <Badge variant="outline" className="text-[10px] font-semibold text-purple-600 border-purple-500/20 bg-purple-500/10 gap-1">
                      <Headphones className="h-3 w-3" /> Priority support
                    </Badge>
                  )}
                  {activeTier.cashbackPercent > 0 && (
                    <Badge variant="outline" className="text-[10px] font-semibold text-emerald-600 border-emerald-500/20 bg-emerald-500/10 gap-1">
                      <Wallet className="h-3 w-3" /> {activeTier.cashbackPercent}% cashback
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Coupon Code Applying Block */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Ticket className="h-4 w-4 text-primary" /> Apply Coupon Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. SUMMER25"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="uppercase text-xs"
                />
                <Button variant="outline" size="sm" onClick={applyByCode}>
                  Apply
                </Button>
              </div>

              {appliedCoupon && (
                <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 p-2.5 text-xs text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-bold">{appliedCoupon.code}</span>
                  </div>
                  <button onClick={clearCoupon} className="hover:text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Quick Coupon Codes */}
              {availableCoupons.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase">Available Offers</div>
                  <div className="flex flex-wrap gap-1.5">
                    {availableCoupons.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => tryApply(c.id)}
                        className="px-2 py-1 rounded border text-[10px] font-mono hover:border-primary transition-colors"
                      >
                        {c.code}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
