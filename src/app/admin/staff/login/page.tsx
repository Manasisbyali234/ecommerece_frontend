"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, ShieldAlert } from "lucide-react";
import { authApi, setAccessToken, setAdminRole } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";

const MODULE_ROUTES: { permission: string; path: string }[] = [
  { permission: "dashboard:read", path: "/admin" },
  { permission: "analytics:read", path: "/admin/analytics" },
  { permission: "products:read", path: "/admin/products" },
  { permission: "orders:read", path: "/admin/orders" },
  { permission: "customers:read", path: "/admin/customers" },
  { permission: "coupons:read", path: "/admin/coupons" },
  { permission: "invoices:read", path: "/admin/invoices" },
  { permission: "website_banners:read", path: "/admin/banners" },
  { permission: "website_categories:read", path: "/admin/categories" },
  { permission: "website_subcategories:read", path: "/admin/sub-categories" },
  { permission: "shipping:read", path: "/admin/shipping" },
  { permission: "users:read", path: "/admin/users" },
];

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await authApi.adminLogin(email, password);

      if (result.user.role !== "admin" && result.user.role !== "support") {
        throw new Error("This account does not have staff access");
      }

      // Block Super Admins from using the staff portal
      if (result.user.roleRef?.isSuperAdmin) {
        throw new Error("Super Admin accounts must use the main admin login");
      }

      setAccessToken(result.token);
      setAdminRole(result.user.roleRef
        ? { ...result.user.roleRef, email: result.user.email }
        : { id: "", name: result.user.role, isSuperAdmin: false, permissions: [], email: result.user.email });

      toast.success("Signed in to Staff Portal");

      const role = result.user.roleRef;
      const first = MODULE_ROUTES.find((m) => role?.permissions.includes(m.permission));
      router.replace(first?.path || "/admin");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-muted/20 p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Staff portal badge */}
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          <ShieldAlert className="h-4 w-4 text-amber-500" />
          Staff Portal
        </div>

        <Card className="border-2">
          <CardHeader className="pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 mb-2">
              <ShieldAlert className="h-6 w-6 text-amber-500" />
            </div>
            <CardTitle className="text-xl font-extrabold">Staff Sign In</CardTitle>
            <CardDescription className="text-xs">
              Sign in with your assigned staff credentials. Super Admin accounts are not permitted here.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">Work Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="text-sm pr-10"
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

              <Button
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign In to Staff Portal"}
              </Button>
            </form>

            <p className="mt-4 text-center text-[11px] text-muted-foreground">
              Super Admin?{" "}
              <a href="/admin/login" className="font-semibold text-primary underline underline-offset-4">
                Use the main admin login
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </main>
  );
}
