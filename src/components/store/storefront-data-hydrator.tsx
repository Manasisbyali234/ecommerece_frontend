"use client";

import { useEffect } from "react";
import { hydrateStorefront } from "@/lib/store";

export function StorefrontDataHydrator() {
  useEffect(() => { hydrateStorefront().catch(() => undefined); }, []);
  return null;
}
