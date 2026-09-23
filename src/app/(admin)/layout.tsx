"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { AdminSessionGate } from "@/components/admin-session-gate";
import { AdminDataHydrator } from "@/components/admin-data-hydrator";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminSessionGate>
    <AdminDataHydrator />
    <SidebarProvider>
      <div
        className="mobile-safe-x flex min-h-screen w-full bg-background text-foreground"
        suppressHydrationWarning
      >
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between gap-2 border-b bg-background/95 px-3 py-2 backdrop-blur sm:h-14 sm:px-4 sm:py-0">
            <div className="flex min-w-0 items-center gap-2">
              <SidebarTrigger />
              <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
                <span className="truncate">Admin</span>
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  Admin Console
                </span>
              </div>
            </div>


          </header>
          <main className="min-w-0 flex-1 p-3 sm:p-6">{children}</main>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
    </AdminSessionGate>
  );
}
