"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldAlert, LogOut, User, Mail, ShieldCheck, KeyRound, Eye, EyeOff } from "lucide-react";
import { getAccessToken, getAdminRole, clearAccessToken, api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type StaffUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  roleRef: { id: string; name: string; isSuperAdmin: boolean; permissions: string[] } | null;
};

export default function StaffProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) { router.replace("/admin/staff/login"); return; }
    api<{ user: StaffUser }>("/me")
      .then(({ user }) => setUser(user))
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    clearAccessToken();
    router.replace("/admin/staff/login");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setSaving(true);
    try {
      await api(`/admin/users/${user!.id}`, { method: "PATCH", body: JSON.stringify({ password: newPassword }) });
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  const role = getAdminRole();

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">Loading profile…</div>;
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Profile</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your account details and security settings</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-amber-500" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 border-2 border-amber-500/30 text-amber-600 font-bold text-xl shrink-0">
              {user.fullName?.charAt(0)?.toUpperCase() || "S"}
            </div>
            <div>
              <p className="font-semibold text-lg leading-tight">{user.fullName || "Staff Member"}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[11px] font-semibold capitalize border-amber-500/30 text-amber-600 bg-amber-500/10">
                  <ShieldAlert className="h-3 w-3 mr-1" />
                  {user.role}
                </Badge>
                <Badge variant="outline" className={`text-[11px] font-semibold capitalize ${user.status === "active" ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10" : "border-destructive/30 text-destructive bg-destructive/10"}`}>
                  {user.status}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground w-20 shrink-0">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground w-20 shrink-0">Role</span>
              <span className="font-medium">{user.roleRef?.name || user.role}</span>
            </div>
            {role && (
              <div className="flex items-start gap-3 text-sm">
                <KeyRound className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-muted-foreground w-20 shrink-0">Permissions</span>
                <div className="flex flex-wrap gap-1.5">
                  {role.isSuperAdmin ? (
                    <Badge className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/20">Super Admin</Badge>
                  ) : role.permissions.length > 0 ? (
                    role.permissions.map((p) => (
                      <Badge key={p} variant="secondary" className="text-[10px] font-mono">{p}</Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-xs">No permissions assigned</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-amber-500" />
            Change Password
          </CardTitle>
          <CardDescription className="text-xs">Choose a strong password of at least 8 characters.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-xs font-semibold">New Password</Label>
              <div className="relative">
                <Input id="new-password" type={showNew ? "text" : "password"} placeholder="Min. 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="pr-10 text-sm" />
                <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-xs font-semibold">Confirm Password</Label>
              <div className="relative">
                <Input id="confirm-password" type={showConfirm ? "text" : "password"} placeholder="Repeat new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="pr-10 text-sm" />
                <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
              {saving ? "Updating…" : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
