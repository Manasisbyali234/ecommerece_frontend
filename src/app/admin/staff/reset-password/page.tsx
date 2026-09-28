"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const strong = (value: string) => value.length >= 12 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);

function ResetStaffPasswordForm() {
  const token = useSearchParams().get("token") || "";
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return toast.error("This password link is invalid.");
    if (!strong(password)) return toast.error("Use 12+ characters with uppercase, lowercase, number, and symbol.");
    if (password !== confirm) return toast.error("Passwords do not match.");
    setLoading(true);
    try { await authApi.resetAdminPassword(token, password); toast.success("Password set. You can now sign in."); router.replace("/admin/staff/login"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to set password"); }
    finally { setLoading(false); }
  };
  return <main className="grid min-h-screen place-items-center p-4"><form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-6 shadow-sm"><div><h1 className="text-xl font-bold">Set your password</h1><p className="mt-1 text-sm text-muted-foreground">Choose a strong password for your staff account.</p></div><div className="space-y-1"><Label>New password</Label><Input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" required /></div><div className="space-y-1"><Label>Confirm password</Label><Input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="new-password" required /></div><Button className="w-full" disabled={loading}>{loading ? "Saving…" : "Set password"}</Button></form></main>;
}

export default function ResetStaffPasswordPage() {
  return (
    <Suspense>
      <ResetStaffPasswordForm />
    </Suspense>
  );
}
