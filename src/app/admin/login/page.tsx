"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import { authApi, setAccessToken, setAdminRole } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

function generateCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { question: `${a} + ${b}`, answer: a + b };
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState("");

  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha());
    setCaptchaInput("");
    setCaptchaError("");
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (parseInt(captchaInput, 10) !== captcha.answer) {
      setCaptchaError("Incorrect answer. Please try again.");
      refreshCaptcha();
      return;
    }
    setCaptchaError("");
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

      // Redirect to first authorized module
      const role = result.user.roleRef;
      if (role?.isSuperAdmin || !role) {
        router.replace("/admin");
      } else {
        const first = MODULE_ROUTES.find((m) => role.permissions.includes(m.permission));
        router.replace(first?.path || "/admin");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
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
            <div className="space-y-2">
              <Label htmlFor="captcha">Security check: {captcha.question} = ?</Label>
              <div className="flex gap-2">
                <Input
                  id="captcha"
                  value={captchaInput}
                  type="number"
                  placeholder="Answer"
                  onChange={(e) => { setCaptchaInput(e.target.value); setCaptchaError(""); }}
                  required
                  className="w-28"
                />
                <button type="button" onClick={refreshCaptcha} className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
                  Refresh
                </button>
              </div>
              {captchaError && <p className="text-sm text-destructive">{captchaError}</p>}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
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
    </main>
  );
}
