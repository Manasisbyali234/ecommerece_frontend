"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import { authApi, setAccessToken, setAdminRole } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";

// Ordered list of admin modules — used to redirect to first authorized page after login
const MODULE_ROUTES: { permission: string; path: string }[] = [
  { permission: "dashboard:read", path: "/admin" },
  { permission: "analytics:read", path: "/admin/analytics" },
  { permission: "products:read", path: "/admin/products" },
  { permission: "orders:read", path: "/admin/orders" },
  { permission: "customers:read", path: "/admin/customers" },
  { permission: "coupons:read", path: "/admin/coupons" },
  { permission: "invoices:read", path: "/admin/invoices" },
  { permission: "users:read", path: "/admin/users" },
];

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await authApi.adminLogin(email, password);
      if (result.user.role !== "admin" && result.user.role !== "support") {
        throw new Error("This account does not have admin access");
      }
      setAccessToken(result.token);

      // Store role/permissions in memory only — never in localStorage
      if (result.user.roleRef) {
        setAdminRole({ ...result.user.roleRef, email: result.user.email });
      } else {
        // Fallback: treat as super admin if role is "admin" with no roleRef
        setAdminRole({ id: "", name: result.user.role, isSuperAdmin: result.user.role === "admin", permissions: [], email: result.user.email });
      }

      toast.success("Signed in to Admin Console");

      // Redirect to first authorized module
      const role = result.user.roleRef;
      if (role?.isSuperAdmin || !role) {
        router.replace("/admin");
      } else {
        const first = MODULE_ROUTES.find((m) => role.permissions.includes(m.permission));
        router.replace(first?.path || "/admin");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <ShieldCheck className="mb-2 h-8 w-8 text-primary" />
          <CardTitle>Admin sign in</CardTitle>
          <CardDescription>Use an administrator or support account to manage the store.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} type="email" autoComplete="email" onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  value={password}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button className="w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button>
          </form>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Staff / Sub-Admin?{" "}
            <a href="/admin/staff/login" className="font-semibold text-primary underline underline-offset-4">
              Use the staff portal
            </a>
          </p>
        </CardContent>
      </Card>
      <Toaster />
    </main>
  );
}
