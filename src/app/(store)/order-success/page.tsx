"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading order details...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("orderId") || "#10240";

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-8">
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 animate-bounce">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Order Confirmed!
        </h1>
        <p className="text-sm text-muted-foreground max-w-md">
          Thank you for your purchase. Your order has been placed and synced directly with our Admin Dashboard.
        </p>
      </div>

      <Card className="max-w-md mx-auto border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="pt-6 space-y-3 text-left">
          <div className="flex justify-between items-center border-b pb-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Order Number</span>
            <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{orderId}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Fulfillment Status</span>
            <span className="font-semibold text-foreground">Processing</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Payment Status</span>
            <span className="font-semibold text-emerald-600">Paid</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
        <Button asChild variant="outline" size="lg" className="h-11 px-6 text-sm font-semibold">
          <Link href="/">
            <ShoppingBag className="mr-2 h-4 w-4" /> Continue Shopping
          </Link>
        </Button>
      </div>
    </div>
  );
}
