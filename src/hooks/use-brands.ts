"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface BrandOption {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  active: boolean;
}

export function useBrands(adminMode = false) {
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const endpoint = adminMode ? "/admin/content/brands" : "/content/brands";
    api<{ items: Array<{ id: string; title: string; active: boolean; data: Record<string, unknown> }> }>(endpoint)
      .then(({ items }) => {
        setBrands(
          items
            .filter((item) => item.active)
            .map((item) => ({
              id: item.id,
              name: String(item.data?.name || item.title || ""),
              slug: String(item.data?.slug || ""),
              logo: item.data?.logo ? String(item.data.logo) : undefined,
              active: item.active,
            }))
        );
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to load brands");
        setLoading(false);
      });
  }, [adminMode]);

  /** Resolve a brand name from a stored brand ID or plain name string */
  function resolveBrandName(brandValue: string | undefined): string {
    if (!brandValue) return "";
    // Try to find by ID first (24-char hex = MongoDB ObjectId)
    const byId = brands.find((b) => b.id === brandValue);
    if (byId) return byId.name;
    // Fallback: treat as plain name (legacy products)
    return brandValue;
  }

  return { brands, loading, error, resolveBrandName };
}
