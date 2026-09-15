"use client";

import { useEffect } from "react";
import { hydrateAdminStore } from "@/lib/store";

export function AdminDataHydrator() {
  useEffect(() => { hydrateAdminStore().catch(() => undefined); }, []);
  return null;
}
