"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Product } from "@/lib/mock-data";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    api<{ items: Product[] }>("/products?limit=100")
      .then(({ items }) => setProducts(items))
      .catch(() => setProducts([]));
  }, []);
  return products;
}
