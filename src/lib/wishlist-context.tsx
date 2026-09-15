"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Product } from "./mock-data";
import { toast } from "sonner";
import { api, getAccessToken } from "./api";

type WishlistContextType = {
  wishlist: string[];
  wishlistProducts: Product[];
  toggleWishlist: (productId: string, productName?: string) => void | Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  wishlistCount: number;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!getAccessToken()) return;
    api<{ items: Product[] }>("/wishlist").then(({ items }) => { setWishlist(items.map((item) => item.id)); setWishlistProducts(items); }).catch(() => { setWishlist([]); setWishlistProducts([]); });
  }, []);

  const toggleWishlist = async (productId: string, productName?: string) => {
    if (!getAccessToken()) { toast.error("Please login first to continue."); return; }
    try {
      const { saved } = await api<{ saved: boolean }>(`/wishlist/${productId}`, { method: "PUT" });
      if (saved) {
        const product = await api<{ product: Product }>(`/products/${productId}`);
        setWishlistProducts((items) => [...items.filter((item) => item.id !== productId), product.product]);
      } else setWishlistProducts((items) => items.filter((item) => item.id !== productId));
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update wishlist"); return; }
    setWishlist((prev) => {
      const isSaved = prev.includes(productId);
      const targetName = productName || "Product";
      if (isSaved) {
        toast.info(`Removed ${targetName} from Wishlist`);
        return prev.filter((id) => id !== productId);
      } else {
        toast.success(`Saved ${targetName} to Wishlist!`);
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const clearWishlist = () => {
    if (getAccessToken()) Promise.all(wishlist.map((id) => api(`/wishlist/${id}`, { method: "PUT" }))).catch(() => undefined);
    setWishlist([]);
    setWishlistProducts([]);
    toast.info("Wishlist cleared");
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistProducts,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
        wishlistCount: wishlist.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
