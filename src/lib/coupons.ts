import { store, type Coupon } from "./store";

export type CartLine = {
  productId: string;
  name: string;
  category: string;
  subCategory?: string;
  price: number;
  qty: number;
  image?: string;
};

export type CouponEvaluation = {
  ok: boolean;
  reason?: string;
  discount: number;
  shippingDiscount: number;
  freeItem?: { name: string; price: number };
};

export function evaluateCoupon(
  coupon: Coupon,
  cart: CartLine[],
  subtotal: number,
  shippingCost: number,
): CouponEvaluation {
  const zero: CouponEvaluation = { ok: false, discount: 0, shippingDiscount: 0 };
  if (!coupon.active) return { ...zero, reason: "This coupon is not active" };
  if (new Date(coupon.expires) < new Date())
    return { ...zero, reason: "This coupon has expired" };
  if (coupon.used >= coupon.usageLimit)
    return { ...zero, reason: "Coupon usage limit reached" };
  if (subtotal < coupon.minSpend)
    return {
      ...zero,
      reason: `Minimum spend of ₹${coupon.minSpend.toFixed(2)} required`,
    };

  const eligible =
    coupon.category === "All"
      ? cart
      : cart.filter((l) => l.category === coupon.category);
  if (coupon.category !== "All" && eligible.length === 0)
    return { ...zero, reason: `Requires a ${coupon.category} item in cart` };

  const eligibleSubtotal = eligible.reduce((s, l) => s + l.price * l.qty, 0);

  if (coupon.type === "percentage") {
    return { ok: true, discount: (eligibleSubtotal * coupon.value) / 100, shippingDiscount: 0 };
  }
  if (coupon.type === "fixed") {
    return { ok: true, discount: Math.min(coupon.value, eligibleSubtotal), shippingDiscount: 0 };
  }
  if (coupon.type === "free_shipping") {
    return { ok: true, discount: 0, shippingDiscount: shippingCost };
  }
  // BOGO: cheapest eligible item free (per pair)
  const items: { name: string; price: number }[] = [];
  for (const l of eligible) for (let i = 0; i < l.qty; i++) items.push({ name: l.name, price: l.price });
  items.sort((a, b) => a.price - b.price);
  const pairs = Math.floor(items.length / 2);
  if (pairs === 0) return { ...zero, reason: "Add another eligible item to unlock BOGO" };
  const freebies = items.slice(0, pairs);
  const discount = freebies.reduce((s, i) => s + i.price, 0);
  return { ok: true, discount, shippingDiscount: 0, freeItem: freebies[0] };
}

export function listUsableCoupons(): Coupon[] {
  return store.getCoupons().filter((c) => c.active);
}
