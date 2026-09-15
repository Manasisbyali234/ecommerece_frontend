"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Product } from "./mock-data";
import { api, getAccessToken } from "./api";
import { toast } from "sonner";

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  openCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // A cart is always backed by the authenticated customer's database record.
  useEffect(() => {
    if (getAccessToken()) {
      api<{ cart: { items: Array<{ product: Product; quantity: number }> } }>("/cart")
        .then(({ cart }) => setItems(cart.items.map((item) => ({ product: { ...item.product, id: (item.product as any)._id ?? item.product.id }, quantity: item.quantity }))))
        .catch(() => setItems([]));
      return;
    }
    setItems([]);
  }, []);

  const addItem = (product: Product, quantity = 1) => {
    if (!getAccessToken()) {
      toast.error("Please login first to add items to your cart.");
      return;
    }
    const normalizedProduct = { ...product, id: (product as any)._id ?? product.id };
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.product.id === normalizedProduct.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        api("/cart/items", { method: "PUT", body: JSON.stringify({ productId: normalizedProduct.id, quantity: next[existingIndex].quantity }) }).catch(() => undefined);
        return next;
      }
      api("/cart/items", { method: "PUT", body: JSON.stringify({ productId: normalizedProduct.id, quantity }) }).catch(() => undefined);
      return [...prev, { product: normalizedProduct, quantity }];
    });
  };

  const removeItem = (productId: string) => {
    if (!getAccessToken()) { toast.error("Please login first to add items to your cart."); return; }
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
    api(`/cart/items/${productId}`, { method: "DELETE" }).catch(() => undefined);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (!getAccessToken()) { toast.error("Please login first to add items to your cart."); return; }
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
    api("/cart/items", { method: "PUT", body: JSON.stringify({ productId, quantity }) }).catch(() => undefined);
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        isOpen,
        setIsOpen,
        openCart: () => {
          if (!getAccessToken()) { toast.error("Please login first to view your cart."); return; }
          setIsOpen(true);
        },
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
