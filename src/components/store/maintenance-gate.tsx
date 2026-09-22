"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    api<{ value: { maintenanceMode?: boolean; enableMaintenanceMode?: boolean } }>("/configuration/general")
      .then(({ value }) => setEnabled(Boolean(value.maintenanceMode ?? value.enableMaintenanceMode)))
      .catch(() => undefined);
  }, []);

  if (enabled) {
    return <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-center text-white"><div><p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-400">Metromindz Store</p><h1 className="mt-3 text-3xl font-extrabold">We&apos;ll be back shortly</h1><p className="mt-3 max-w-md text-sm text-slate-300">We&apos;re performing scheduled maintenance. Please try again soon.</p></div></main>;
  }
  return <>{children}</>;
}
