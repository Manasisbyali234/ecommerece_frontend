"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, clearAccessToken, getAccessToken, setAdminRole, getAdminRole, type AdminRoleInfo } from "@/lib/api";
import { ShieldAlert } from "lucide-react";

// Maps each admin path prefix to the required permission
const ROUTE_PERMISSIONS: { prefix: string; permission: string }[] = [
  { prefix: "/admin/users", permission: "users:read" },
  { prefix: "/admin/products", permission: "products:read" },
  { prefix: "/admin/orders", permission: "orders:read" },
  { prefix: "/admin/customers", permission: "customers:read" },
  { prefix: "/admin/coupons", permission: "coupons:read" },
  { prefix: "/admin/invoices", permission: "invoices:read" },
  { prefix: "/admin/analytics", permission: "analytics:read" },
  { prefix: "/admin/banners", permission: "website_banners:read" },
  { prefix: "/admin/categories", permission: "website_categories:read" },
  { prefix: "/admin/sub-categories", permission: "website_subcategories:read" },
  { prefix: "/admin/shipping", permission: "shipping:read" },
  { prefix: "/admin/payments", permission: "payments:read" },
  { prefix: "/admin/reviews", permission: "products:read" },
  { prefix: "/admin", permission: "dashboard:read" },
];

function getRequiredPermission(pathname: string): string | null {
  // Sort by prefix length descending so more specific routes match first
  const sorted = [...ROUTE_PERMISSIONS].sort((a, b) => b.prefix.length - a.prefix.length);
  for (const { prefix, permission } of sorted) {
    if (pathname === prefix || pathname.startsWith(prefix + "/") || pathname.startsWith(prefix)) {
      return permission;
    }
  }
  return null;
}

function canAccess(role: AdminRoleInfo | null, permission: string | null): boolean {
  if (!permission) return true;
  if (!role) return false;
  if (role.isSuperAdmin) return true;
  return role.permissions.includes(permission);
}

export function AdminSessionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(pathname === "/admin/login" || pathname === "/admin/staff/login" || pathname === "/admin/staff/profile");
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login" || pathname === "/admin/staff/login" || pathname === "/admin/staff/profile") { setReady(true); setDenied(false); return; }
    if (!getAccessToken()) { router.replace("/admin/login"); return; }

    // If role is already in memory (same session) AND has email, just check permissions
    const existingRole = getAdminRole();
    if (existingRole?.email) {
      const required = getRequiredPermission(pathname);
      if (!canAccess(existingRole, required)) { setDenied(true); setReady(true); return; }
      setDenied(false); setReady(true); return;
    }

    // Re-fetch user to restore role after page refresh
    api<{ user: { role: string; email?: string; roleRef?: AdminRoleInfo | null } }>("/me")
      .then(({ user }) => {
        if (user.role !== "admin" && user.role !== "support") throw new Error("Admin access is required");
        const base = user.roleRef ?? { id: "", name: user.role, isSuperAdmin: user.role === "admin", permissions: [] };
        const role = { ...base, email: user.email };
        setAdminRole(role);
        const required = getRequiredPermission(pathname);
        if (!canAccess(role, required)) { setDenied(true); setReady(true); return; }
        setDenied(false); setReady(true);
      })
      .catch(() => { clearAccessToken(); router.replace("/admin/login"); });
  }, [pathname, router]);

  if (!ready) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Checking admin session…</div>;

  if (denied) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-8">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <ShieldAlert className="h-16 w-16 text-rose-500" />
          <h1 className="text-2xl font-extrabold text-foreground">403 – Access Denied</h1>
          <p className="text-sm text-muted-foreground">You do not have permission to access this page. Contact your Super Admin to request access.</p>
          <a href="/admin" className="text-sm font-semibold text-primary underline underline-offset-4">Go to Dashboard</a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
