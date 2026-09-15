"use client";

import { useEffect } from "react";
import { getAccessToken } from "@/lib/api";
import { hydrateCustomerStore } from "@/lib/store";

export function CustomerDataHydrator() {
  useEffect(() => { if (getAccessToken()) hydrateCustomerStore().catch(() => undefined); }, []);
  return null;
}
