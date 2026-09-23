"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Users,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Search,
  Check,
  UserPlus,
  ShieldAlert,
  Sliders,
  CheckSquare,
  Square,
  Lock,
  UserCheck,
  Building,
  KeyRound,
  LayoutGrid,
  List,
  Sparkles,
  Zap,
  Crown,
  Package,
  Globe,
  Headphones,
  RotateCcw,
  Mail,
  User,
  Shield,
  Send,
  Key,
  Eye,
  EyeOff,
  BarChart3,
  TrendingUp,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

import {
  useStore,
  store,
  MODULE_DEFINITIONS,
  createFullPermissions,
  type AdminUser,
  type Role,
  type CRUDPermission,
  type ModulePermissions,
} from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminUsersPage() {
  const users = useStore((s) => s.adminUsers);
  const roles = useStore((s) => s.roles);

  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") === "analytics" ? "analytics" : searchParams.get("tab") === "roles" ? "roles" : "users";
  const [activeTab, setActiveTab] = useState<"users" | "roles" | "analytics">(initialTab as "users" | "roles" | "analytics");
  const [searchQuery, setSearchQuery] = useState("");

  // User Edit/Create Modal State
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [sendInviteEmail, setSendInviteEmail] = useState(true);
  const [enforce2FA, setEnforce2FA] = useState(false);

  const [userDraft, setUserDraft] = useState<Omit<AdminUser, "id">>({
    name: "",
    email: "",
    roleId: "role-store-manager",
    status: "active",
    lastLogin: "Just now",
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Role Edit/Create Modal State
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [rolePerms, setRolePerms] = useState<ModulePermissions>(createFullPermissions());

  const parsePermissions = (rawPerms: unknown): ModulePermissions => {
    const perms: ModulePermissions = {};
    MODULE_DEFINITIONS.forEach((m) => {
      perms[m.key] = { create: false, read: false, update: false, delete: false };
    });
    if (Array.isArray(rawPerms)) {
      (rawPerms as string[]).forEach((p) => {
        const [mod, action] = p.split(":");
        if (mod && action && perms[mod] && action in perms[mod]) {
          (perms[mod] as Record<string, boolean>)[action] = true;
        }
      });
    }
    return perms;
  };

  const loadUsersAndRoles = () =>
    Promise.all([api<{ items: Array<Record<string, unknown>> }>("/admin/users"), api<{ items: Array<Record<string, unknown>> }>("/admin/roles")]).then(([userResult, roleResult]) => {
      const loadedRoles: Role[] = roleResult.items.map((role) => ({ id: String(role.id), name: String(role.name), description: String(role.description || ""), isSuperAdmin: Boolean(role.isSuperAdmin), permissions: role.isSuperAdmin ? createFullPermissions() : parsePermissions(role.permissions) }));
      const fallbackRole = loadedRoles.find((role) => role.name.toLowerCase().includes("admin"))?.id || "admin";
      store.replaceRoles(loadedRoles);
      store.replaceAdminUsers(userResult.items.map((user) => {
        const roleRef = user.roleRef as Record<string, unknown> | null;
        return { id: String(user.id), name: String(user.fullName || ""), email: String(user.email || ""), roleId: String(roleRef?.id || user.role || fallbackRole), status: user.status === "disabled" ? "inactive" : "active", lastLogin: String(user.updatedAt || "Never") };
      }));
    });

  useEffect(() => {
    loadUsersAndRoles().catch((error) => toast.error(error instanceof Error ? error.message : "Unable to load administrator data"));
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const stats = useMemo(() => {
    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === "active").length,
      totalRoles: roles.length,
      superAdmins: users.filter((u) => {
        const r = roles.find((role) => role.id === u.roleId);
        return r?.isSuperAdmin;
      }).length,
    };
  }, [users, roles]);

  // USER ACTIONS
  const isValidObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);

  const startCreateUser = () => {
    setEditingUserId(null);
    const validRoles = roles.filter((r) => isValidObjectId(r.id) && !r.isSuperAdmin);
    setUserDraft({
      name: "",
      email: "",
      roleId: validRoles[0]?.id || "",
      status: "active",
      lastLogin: "Never",
    });
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setSendInviteEmail(true);
    setEnforce2FA(false);
    setFieldErrors({});
    setUserModalOpen(true);
  };

  const startEditUser = (user: AdminUser) => {
    setEditingUserId(user.id);
    setUserDraft({
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      status: user.status,
      lastLogin: user.lastLogin,
    });
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setSendInviteEmail(false);
    setEnforce2FA(false);
    setFieldErrors({});
    setUserModalOpen(true);
  };

  const saveUser = async () => {
    const errors: Record<string, string> = {};
    if (!userDraft.name.trim()) errors.name = "Full name is required";
    if (!userDraft.email.trim()) errors.email = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userDraft.email)) errors.email = "Enter a valid email address";
    if (!editingUserId) {
      if (!password) errors.password = "Password is required";
      else if (password.length < 8) errors.password = "Minimum 8 characters required";
      else if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) errors.password = "Must contain at least one uppercase letter and one number";
      if (!confirmPassword) errors.confirmPassword = "Please confirm your password";
      else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match";
    } else if (password) {
      if (password.length < 8) errors.password = "Minimum 8 characters required";
      else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match";
    }
    if (!userDraft.roleId) errors.roleId = "Permission role is required";
    else if (!/^[a-f\d]{24}$/i.test(userDraft.roleId)) errors.roleId = "Selected role is not yet synced from server — please wait a moment and try again";
    else if (roles.find((r) => r.id === userDraft.roleId)?.isSuperAdmin) errors.roleId = "Cannot assign Super Admin role to additional users";
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});

    try {
    if (editingUserId) {
      const patch: Record<string, unknown> = { fullName: userDraft.name, status: userDraft.status === "active" ? "active" : "disabled", roleId: userDraft.roleId };
      if (password) {
        if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
        if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }
        patch.password = password;
      }
      const result = await api<{ user: Record<string, unknown> }>(`/admin/users/${editingUserId}`, { method: "PATCH", body: JSON.stringify(patch) });
      const updatedRole = roles.find((r) => r.id === userDraft.roleId);
      store.updateAdminUser(editingUserId, { ...userDraft, roleId: String(result.user.roleRef ? (result.user.roleRef as Record<string,unknown>).id || userDraft.roleId : userDraft.roleId) });
      toast.success(`User "${userDraft.name}" updated successfully!`);
    } else {
      const result = await api<{ user: Record<string, unknown> }>("/admin/users", { method: "POST", body: JSON.stringify({ fullName: userDraft.name, email: userDraft.email, password, roleId: userDraft.roleId, role: "admin" }) });
      const newUser: Omit<AdminUser, "id"> = { ...userDraft, id: String(result.user.id), roleId: String((result.user.roleRef as Record<string,unknown>)?.id || userDraft.roleId) } as unknown as Omit<AdminUser, "id">;
      store.addAdminUser({ ...userDraft, lastLogin: "Never" });
      toast.success(`User "${userDraft.name}" created successfully!`, {
        description: sendInviteEmail ? `Welcome email sent to ${userDraft.email}` : "Account ready.",
      });
    }

    setUserModalOpen(false);
    setEditingUserId(null);
    setPassword("");
    setConfirmPassword("");
    // Refresh users list from backend
    loadUsersAndRoles().catch(() => undefined);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save administrator"); }
  };

  const removeUser = async (id: string) => {
    const u = users.find((x) => x.id === id);
    if (u?.email === "superadmin@store.local") {
      toast.error("Cannot delete master Super Admin account!");
      return;
    }
    try { await api(`/admin/users/${id}`, { method: "DELETE" }); store.removeAdminUser(id); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to delete administrator"); return; }
    toast.success(`User "${u?.name}" removed`);
  };

  // ROLE ACTIONS
  const startCreateRole = () => {
    setEditingRoleId(null);
    setRoleName("");
    setRoleDesc("");
    setRolePerms(createFullPermissions());
    setRoleModalOpen(true);
  };

  const startEditRole = (role: Role) => {
    setEditingRoleId(role.id);
    setRoleName(role.name);
    setRoleDesc(role.description);
    // Fetch fresh permissions from backend before opening modal
    api<{ items: Array<Record<string, unknown>> }>("/admin/roles")
      .then((result) => {
        const fresh = result.items.find((r) => String(r.id) === role.id);
        if (fresh) {
          const perms: ModulePermissions = {};
          MODULE_DEFINITIONS.forEach((m) => {
            perms[m.key] = { create: false, read: false, update: false, delete: false };
          });
          if (Array.isArray(fresh.permissions)) {
            (fresh.permissions as string[]).forEach((p) => {
              const [mod, action] = p.split(":");
              if (mod && action && perms[mod] && action in perms[mod]) {
                (perms[mod] as Record<string, boolean>)[action] = true;
              }
            });
          }
          setRolePerms(perms);
        } else {
          setRolePerms(JSON.parse(JSON.stringify(role.permissions)));
        }
      })
      .catch(() => setRolePerms(JSON.parse(JSON.stringify(role.permissions))));
    setRoleModalOpen(true);
  };

  const toggleCrudPermission = (moduleKey: string, crudField: keyof CRUDPermission) => {
    setRolePerms((prev) => {
      const currentModulePerm = prev[moduleKey] || {
        create: false,
        read: false,
        update: false,
        delete: false,
      };
      return {
        ...prev,
        [moduleKey]: {
          ...currentModulePerm,
          [crudField]: !currentModulePerm[crudField],
        },
      };
    });
  };

  const toggleModuleRowAll = (moduleKey: string) => {
    setRolePerms((prev) => {
      const current = prev[moduleKey];
      const isAllChecked =
        current && current.create && current.read && current.update && current.delete;
      const targetState = !isAllChecked;

      return {
        ...prev,
        [moduleKey]: {
          create: targetState,
          read: targetState,
          update: targetState,
          delete: targetState,
        },
      };
    });
  };

  const setAllPermissionsState = (targetState: boolean) => {
    const updated: ModulePermissions = {};
    MODULE_DEFINITIONS.forEach((m) => {
      updated[m.key] = {
        create: targetState,
        read: targetState,
        update: targetState,
        delete: targetState,
      };
    });
    setRolePerms(updated);
  };

  // Quick Preset Role Application
  const applyPresetRole = (presetType: "superadmin" | "store_manager" | "content_editor" | "support" | "clear") => {
    if (presetType === "clear") {
      setAllPermissionsState(false);
      toast.info("Cleared all CRUD permissions");
      return;
    }

    if (presetType === "superadmin") {
      setAllPermissionsState(true);
      setRoleName("Super Admin");
      setRoleDesc("Full unrestricted administrative access across all system modules.");
      toast.success("Applied Super Admin Preset (Full Access)");
      return;
    }

    const updated: ModulePermissions = {};
    MODULE_DEFINITIONS.forEach((m) => {
      let create = false;
      let read = false;
      let update = false;
      let del = false;

      if (presetType === "store_manager") {
        if (["products", "orders", "customers", "coupons", "invoices", "shipping"].includes(m.key)) {
          create = true; read = true; update = true; del = true;
        } else if (["analytics", "dashboard"].includes(m.key)) {
          read = true;
        }
      } else if (presetType === "content_editor") {
        if (["website_banners", "website_subcategories", "website_categories", "website_nav_categories", "website_builder"].includes(m.key)) {
          create = true; read = true; update = true; del = true;
        } else if (["products", "dashboard"].includes(m.key)) {
          read = true;
        }
      } else if (presetType === "support") {
        if (["orders", "customers", "invoices", "products"].includes(m.key)) {
          read = true;
          if (m.key === "orders") update = true;
        }
      }

      updated[m.key] = { create, read, update, delete: del };
    });

    setRolePerms(updated);
    if (presetType === "store_manager") {
      if (!roleName) setRoleName("Store Operations Manager");
      if (!roleDesc) setRoleDesc("Full access to products, orders, inventory, coupons, and shipping.");
      toast.success("Applied Store Manager Preset");
    } else if (presetType === "content_editor") {
      if (!roleName) setRoleName("Storefront & Content Editor");
      if (!roleDesc) setRoleDesc("Manages banners, category navigation, and visual page builder.");
      toast.success("Applied Content Editor Preset");
    } else if (presetType === "support") {
      if (!roleName) setRoleName("Customer Support Specialist");
      if (!roleDesc) setRoleDesc("Read-only access to customer orders, invoices, and support status.");
      toast.success("Applied Customer Support Preset");
    }
  };

  const saveRole = async () => {
    if (!roleName.trim()) {
      toast.error("Role Name is required");
      return;
    }

    const payload = {
      name: roleName.trim(),
      description: roleDesc.trim() || "Custom administrative permissions role.",
      permissions: rolePerms,
    };

    try { const permissions = Object.entries(rolePerms).flatMap(([module, grants]) => Object.entries(grants).filter(([, allowed]) => allowed).map(([action]) => `${module}:${action}`));
    if (editingRoleId) {
      await api(`/admin/roles/${editingRoleId}`, { method: "PATCH", body: JSON.stringify({ name: payload.name, description: payload.description, permissions }) });
      store.updateRole(editingRoleId, payload);
      toast.success(`Role "${roleName}" updated live!`);
    } else {
      const { role } = await api<{ role: { id: string; name: string; description: string; isSuperAdmin: boolean } }>("/admin/roles", { method: "POST", body: JSON.stringify({ name: payload.name, description: payload.description, permissions }) });
      // Keep the server-issued ObjectId; a temporary client id cannot be assigned
      // to a subsequently-created admin account.
      store.addRole({ ...payload, id: role.id, isSuperAdmin: role.isSuperAdmin } as Role);
      toast.success(`New Role "${roleName}" created!`);
    }

    setRoleModalOpen(false);
    setEditingRoleId(null);
    // Reload roles from backend to sync parsed permissions
    loadUsersAndRoles().catch(() => undefined);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save role"); }
  };

  const removeRole = async (id: string) => {
    const role = roles.find((r) => r.id === id);
    if (role?.isSuperAdmin) {
      toast.error("Cannot delete master Super Admin role");
      return;
    }
    const assignedCount = users.filter((u) => u.roleId === id).length;
    if (assignedCount > 0) {
      toast.error(`Cannot delete role: ${assignedCount} user(s) currently assigned`);
      return;
    }
    try { await api(`/admin/roles/${id}`, { method: "DELETE" }); store.removeRole(id); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to delete role"); return; }
    toast.success(`Role "${role?.name}" removed`);
  };

  // Group module definitions by category group
  const groupedModules = useMemo(() => {
    const groups: Record<string, typeof MODULE_DEFINITIONS> = {};
    MODULE_DEFINITIONS.forEach((m) => {
      if (!groups[m.group]) groups[m.group] = [];
      groups[m.group].push(m);
    });
    return groups;
  }, []);

  // Summary counts for current role draft
  const activeMatrixSummary = useMemo(() => {
    let activeModules = 0;
    let activeActions = 0;
    MODULE_DEFINITIONS.forEach((m) => {
      const p = rolePerms[m.key];
      if (p) {
        if (p.create || p.read || p.update || p.delete) activeModules++;
        if (p.create) activeActions++;
        if (p.read) activeActions++;
        if (p.update) activeActions++;
        if (p.delete) activeActions++;
      }
    });
    return { activeModules, activeActions, totalModules: MODULE_DEFINITIONS.length, totalActions: MODULE_DEFINITIONS.length * 4 };
  }, [rolePerms]);

  const selectedRoleDetails = useMemo(() => {
    return roles.find((r) => r.id === userDraft.roleId);
  }, [roles, userDraft.roleId]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-amber-500" /> Users & Role Permissions Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage admin users, configure granular CRUD permissions for all modules, and delegate roles under Super Admin authority.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={startCreateRole}
            size="sm"
            className="text-xs font-bold gap-1.5 h-9"
          >
            <Sliders className="h-4 w-4 text-amber-500" /> Create Role
          </Button>
          <Button
            onClick={startCreateUser}
            size="sm"
            className="text-xs font-bold gap-1.5 h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs"
          >
            <UserPlus className="h-4 w-4" /> Add Admin User
          </Button>
        </div>
      </div>

      {/* Stat KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Admin Users
            </CardTitle>
            <div className="p-2 rounded-xl bg-blue-500/10">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{stats.totalUsers}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Team members with portal access</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Active Status Users
            </CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <UserCheck className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.activeUsers}</div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Currently enabled accounts</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Configured Roles
            </CardTitle>
            <div className="p-2 rounded-xl bg-purple-500/10">
              <KeyRound className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{stats.totalRoles} Roles</div>
            <p className="text-[11px] text-muted-foreground mt-1">Granular permission sets</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Super Admin Masters
            </CardTitle>
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Lock className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{stats.superAdmins}</div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">Unrestricted master accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs (Users & Roles) */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-3">
          <TabsList className="grid w-full sm:w-[480px] grid-cols-3">
            <TabsTrigger value="users" className="gap-2 text-xs font-bold">
              <Users className="h-4 w-4" /> Users Directory
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2 text-xs font-bold">
              <ShieldCheck className="h-4 w-4 text-amber-500" /> Roles & Permissions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 text-xs font-bold">
              <BarChart3 className="h-4 w-4 text-violet-500" /> User Analytics
            </TabsTrigger>
          </TabsList>

          {activeTab === "users" && (
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search user name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          )}
        </div>

        {/* TAB 1: USERS DIRECTORY */}
        <TabsContent value="users" className="space-y-4 m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => {
              const assignedRole = roles.find((r) => r.id === user.roleId);
              const isSuper = assignedRole?.isSuperAdmin;

              return (
                <Card key={user.id} className="overflow-hidden border shadow-xs flex flex-col justify-between hover:border-amber-500/40 transition-all">
                  <CardHeader className="p-4 bg-muted/30 border-b flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-sm border border-amber-500/30">
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-sm font-extrabold text-foreground">
                          {user.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>

                    {!isSuper ? (
                      <Switch
                        checked={user.status === "active"}
                        onCheckedChange={async () => {
                          const newStatus = user.status === "active" ? "inactive" : "active";
                          store.updateAdminUser(user.id, { status: newStatus });
                          try {
                            await api(`/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify({ status: newStatus === "active" ? "active" : "disabled" }) });
                          } catch (error) {
                            store.updateAdminUser(user.id, { status: user.status });
                            toast.error(error instanceof Error ? error.message : "Unable to update user status");
                          }
                        }}
                        className="scale-75"
                      />
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30 bg-amber-500/10 font-bold">
                        Master Super Admin
                      </Badge>
                    )}
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Assigned Role:</span>
                      <Badge
                        variant={isSuper ? "default" : "secondary"}
                        className={`text-[11px] font-semibold ${
                          isSuper ? "bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold" : ""
                        }`}
                      >
                        {assignedRole?.name || "No Role"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                      <span>Last Login:</span>
                      <span className="font-mono text-[11px] font-bold text-foreground">{user.lastLogin}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          user.status === "active"
                            ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
                            : "text-slate-400 border-slate-700 bg-slate-800"
                        }`}
                      >
                        ● {user.status.toUpperCase()}
                      </Badge>

                      <div className="flex items-center gap-1">
                        {!isSuper ? (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => startEditUser(user)}
                              title="Edit User Role"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rose-500 hover:text-rose-600"
                              onClick={() => removeUser(user.id)}
                              title="Delete User"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic font-medium px-1">
                            Protected Master Account
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 3: USER ANALYTICS */}
        <TabsContent value="analytics" className="space-y-6 m-0">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Admins</CardTitle>
                <div className="p-2 rounded-xl bg-blue-500/10"><Users className="h-4 w-4 text-blue-500" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold">{stats.totalUsers}</div>
                <p className="text-[11px] text-muted-foreground mt-1">Registered admin accounts</p>
              </CardContent>
            </Card>
            <Card className="border shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Accounts</CardTitle>
                <div className="p-2 rounded-xl bg-emerald-500/10"><UserCheck className="h-4 w-4 text-emerald-500" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.activeUsers}</div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% activation rate
                </p>
              </CardContent>
            </Card>
            <Card className="border shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Inactive Accounts</CardTitle>
                <div className="p-2 rounded-xl bg-rose-500/10"><Activity className="h-4 w-4 text-rose-500" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-rose-500">{stats.totalUsers - stats.activeUsers}</div>
                <p className="text-[11px] text-muted-foreground mt-1">Disabled or suspended</p>
              </CardContent>
            </Card>
            <Card className="border shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Permission Roles</CardTitle>
                <div className="p-2 rounded-xl bg-purple-500/10"><KeyRound className="h-4 w-4 text-purple-500" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold">{stats.totalRoles}</div>
                <p className="text-[11px] text-muted-foreground mt-1">Configured role sets</p>
              </CardContent>
            </Card>
          </div>

          {/* Role distribution breakdown */}
          <Card className="border shadow-xs">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-violet-500" /> Users by Role Distribution
              </CardTitle>
              <CardDescription className="text-xs">Breakdown of admin users assigned to each permission role.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {roles.map((role) => {
                const count = users.filter((u) => u.roleId === role.id).length;
                const pct = stats.totalUsers > 0 ? Math.round((count / stats.totalUsers) * 100) : 0;
                return (
                  <div key={role.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{role.name}</span>
                        {role.isSuperAdmin && <Badge className="text-[10px] bg-amber-500 text-slate-950 font-bold">Super Admin</Badge>}
                      </div>
                      <span className="font-mono font-bold text-muted-foreground">{count} user{count !== 1 ? "s" : ""} · {pct}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-violet-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {roles.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No roles configured yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Status breakdown */}
          <Card className="border shadow-xs">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" /> Account Status Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(["active", "inactive"] as const).map((status) => {
                  const count = users.filter((u) => u.status === status).length;
                  const pct = stats.totalUsers > 0 ? Math.round((count / stats.totalUsers) * 100) : 0;
                  return (
                    <div key={status} className="p-4 rounded-xl border bg-card space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={`text-xs font-bold ${
                            status === "active"
                              ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
                              : "text-rose-500 border-rose-500/30 bg-rose-500/10"
                          }`}
                        >
                          ● {status.toUpperCase()}
                        </Badge>
                        <span className="text-2xl font-extrabold">{count}</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            status === "active" ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">{pct}% of total admin accounts</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: ROLES & CRUD PERMISSIONS MATRIX */}
        <TabsContent value="roles" className="space-y-4 m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {roles.map((role) => {
              const assignedUserCount = users.filter((u) => u.roleId === role.id).length;
              const moduleCount = Object.keys(role.permissions).length;

              return (
                <Card key={role.id} className="overflow-hidden border shadow-xs flex flex-col justify-between hover:border-amber-500/40 transition-all">
                  <CardHeader className="p-4 bg-muted/40 border-b">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-extrabold text-foreground">
                            {role.name}
                          </CardTitle>
                          {role.isSuperAdmin && (
                            <Badge className="bg-amber-500 text-slate-950 font-extrabold text-[10px] uppercase">
                              <Lock className="h-3 w-3 mr-1" /> Super Admin Master
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-xs line-clamp-2">
                          {role.description}
                        </CardDescription>
                      </div>

                      <div className="flex items-center gap-1 pl-2">
                        {role.isSuperAdmin ? (
                          <Badge variant="outline" className="text-[11px] text-amber-500 border-amber-500/30 bg-amber-500/10 font-bold px-2.5 py-1 flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Master (Unmodifiable)
                          </Badge>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs font-bold gap-1.5"
                              onClick={() => startEditRole(role)}
                            >
                              <Sliders className="h-3.5 w-3.5 text-primary" /> Edit Permissions
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rose-500 hover:text-rose-600"
                              onClick={() => removeRole(role.id)}
                              title="Delete Role"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Assigned Admin Users:</span>
                      <Badge variant="outline" className="font-bold">
                        {assignedUserCount} User{assignedUserCount === 1 ? "" : "s"}
                      </Badge>
                    </div>

                    <div className="space-y-1 pt-1 border-t">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        CRUD Permission Highlights:
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {MODULE_DEFINITIONS.slice(0, 6).map((m) => {
                          const perm = role.permissions[m.key];
                          const isFull = perm?.create && perm?.read && perm?.update && perm?.delete;
                          const isRead = perm?.read;

                          return (
                            <Badge
                              key={m.key}
                              variant="secondary"
                              className={`text-[10px] py-0.5 px-2 font-mono ${
                                isFull
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold"
                                  : isRead
                                  ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                                  : "opacity-40 line-through"
                              }`}
                            >
                              {m.label}: {isFull ? "CRUD" : isRead ? "READ" : "NONE"}
                            </Badge>
                          );
                        })}
                        {moduleCount > 6 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{moduleCount - 6} more modules
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* ENHANCED CREATE / EDIT ADMIN USER ACCOUNT MODAL */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className="max-w-lg p-6 border-2 bg-background">
          <DialogHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-extrabold flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-amber-500" />
                {editingUserId ? "Edit Admin User Account" : "Add New Admin User Account"}
              </DialogTitle>
              <Badge variant="outline" className="text-[10px] font-bold bg-amber-500/10 text-amber-600 border-amber-500/30">
                ADMIN PRIVILEGES
              </Badge>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Configure team credentials, access level tier, and security status under Super Admin authority.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Live Profile Header Preview */}
            <div className="p-3.5 rounded-xl border bg-muted/20 flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-amber-500 text-slate-950 font-black text-base flex items-center justify-center border-2 border-amber-400 shadow-2xs">
                {userDraft.name ? userDraft.name.slice(0, 2).toUpperCase() : "AU"}
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="font-extrabold text-sm text-foreground truncate">
                  {userDraft.name || "New Admin Account"}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {userDraft.email || "email@company.com"}
                </div>
                {selectedRoleDetails && (
                  <Badge variant="outline" className="text-[10px] font-bold mt-1 bg-background">
                    Role: {selectedRoleDetails.name}
                  </Badge>
                )}
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-amber-500" /> Full Name *
                </Label>
                <Input
                  placeholder="e.g. Aakash Sharma"
                  value={userDraft.name}
                  onChange={(e) => { setUserDraft({ ...userDraft, name: e.target.value }); setFieldErrors((p) => ({ ...p, name: "" })); }}
                  className={`text-xs ${fieldErrors.name ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                />
                {fieldErrors.name && <p className="text-[11px] text-rose-500 font-semibold">{fieldErrors.name}</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-blue-500" /> Work Email Address *
                </Label>
                <Input
                  type="email"
                  placeholder="e.g. admin@store.local"
                  value={userDraft.email}
                  onChange={(e) => { setUserDraft({ ...userDraft, email: e.target.value }); setFieldErrors((p) => ({ ...p, email: "" })); }}
                  disabled={!!editingUserId}
                  className={`text-xs font-mono ${fieldErrors.email ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                />
                {fieldErrors.email && <p className="text-[11px] text-rose-500 font-semibold">{fieldErrors.email}</p>}
              </div>

              {/* Password fields */}
              <div className="space-y-1">
                <Label className="text-xs font-bold flex items-center gap-1">
                  <Key className="h-3.5 w-3.5 text-emerald-500" /> {editingUserId ? "New Password (leave blank to keep current)" : "Password *"}
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={editingUserId ? "Leave blank to keep current password" : "Min 8 chars, 1 uppercase, 1 number"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: "" })); }}
                    className={`text-xs pr-9 ${fieldErrors.password ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-[11px] text-rose-500 font-semibold">{fieldErrors.password}</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold flex items-center gap-1">
                  <Key className="h-3.5 w-3.5 text-emerald-500" /> Confirm Password {!editingUserId && "*"}
                </Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirmPassword: "" })); }}
                    className={`text-xs pr-9 ${fieldErrors.confirmPassword || (confirmPassword && password !== confirmPassword) ? "border-rose-500 focus-visible:ring-rose-500" : confirmPassword && password === confirmPassword ? "border-emerald-500" : ""}`}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                    {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                {(fieldErrors.confirmPassword || (confirmPassword && password !== confirmPassword)) && (
                  <p className="text-[11px] text-rose-500 font-semibold">{fieldErrors.confirmPassword || "Passwords do not match"}</p>
                )}
                {!fieldErrors.confirmPassword && confirmPassword && password === confirmPassword && (
                  <p className="text-[11px] text-emerald-500 font-semibold">Passwords match ✓</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5 text-purple-500" /> Assigned Permission Role *
                </Label>
                <Select
                  value={userDraft.roleId}
                  onValueChange={(v) => setUserDraft({ ...userDraft, roleId: v })}
                >
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.filter((r) => isValidObjectId(r.id) && !r.isSuperAdmin).length === 0 && (
                      <SelectItem value="" disabled>Loading roles from server...</SelectItem>
                    )}
                    {roles.filter((r) => isValidObjectId(r.id) && !r.isSuperAdmin).map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.roleId && <p className="text-[11px] text-rose-500 font-semibold">{fieldErrors.roleId}</p>}
                {selectedRoleDetails && (
                  <p className="text-[11px] text-muted-foreground italic pt-0.5">
                    {selectedRoleDetails.description}
                  </p>
                )}
              </div>
            </div>

            {/* Security & Access Toggles Card */}
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-3">
              <div className="font-extrabold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Key className="h-4 w-4 text-emerald-500" /> Account Access & Security
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="font-bold text-foreground">Active Account Access</div>
                  <div className="text-[11px] text-muted-foreground">Allow user to log in to admin dashboard</div>
                </div>
                <Switch
                  checked={userDraft.status === "active"}
                  onCheckedChange={(checked) =>
                    setUserDraft({ ...userDraft, status: checked ? "active" : "inactive" })
                  }
                />
              </div>

              {!editingUserId && (
                <div className="flex items-center justify-between border-t pt-2">
                  <div>
                    <div className="font-bold text-foreground">Send Welcome Email Invite</div>
                    <div className="text-[11px] text-muted-foreground">Dispatch password setup email link</div>
                  </div>
                  <Switch
                    checked={sendInviteEmail}
                    onCheckedChange={setSendInviteEmail}
                  />
                </div>
              )}

              <div className="flex items-center justify-between border-t pt-2">
                <div>
                  <div className="font-bold text-foreground">Enforce Two-Factor Auth (2FA)</div>
                  <div className="text-[11px] text-muted-foreground">Require OTP authenticator verification</div>
                </div>
                <Switch
                  checked={enforce2FA}
                  onCheckedChange={setEnforce2FA}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={() => setUserModalOpen(false)} className="text-xs font-semibold">
              Cancel
            </Button>
            <Button onClick={saveUser} className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs">
              <Check className="h-4 w-4 mr-1.5" /> {editingUserId ? "Update User" : "Create Admin User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ROLE & GRANULAR CRUD CHECKBOX PERMISSIONS MATRIX MODAL */}
      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-6">
          <DialogHeader className="pb-3 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-base font-extrabold flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-500" />
                  {editingRoleId ? `Edit Role Permissions: ${roleName}` : "Create New Role & CRUD Permissions Matrix"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Configure exact Create, Read, Update, and Delete checkbox permissions for every module and submodule in the dashboard.
                </DialogDescription>
              </div>

              {/* Matrix Live Counter Stats */}
              <div className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-xl border text-xs font-mono">
                <span className="text-muted-foreground font-bold">Granted:</span>
                <Badge className="bg-amber-500 text-slate-950 font-extrabold text-[11px]">
                  {activeMatrixSummary.activeActions} / {activeMatrixSummary.totalActions} Checkboxes
                </Badge>
                <Badge variant="outline" className="text-[10px] font-bold">
                  {activeMatrixSummary.activeModules} / {activeMatrixSummary.totalModules} Modules
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Role Header Info Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Role Name *</Label>
                <Input
                  placeholder="e.g. Store Operations Manager, Content Editor"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="text-xs bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Role Description</Label>
                <Input
                  placeholder="Summary of responsibilities and permissions level..."
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  className="text-xs bg-background"
                />
              </div>
            </div>

            {/* Quick Presets Toolbar */}
            <div className="space-y-2 p-3 bg-muted/40 rounded-xl border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500" /> Quick Apply Role Presets:
                </span>
                <span className="text-[10px] text-muted-foreground">Click a preset to populate CRUD matrix</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPresetRole("superadmin")}
                  className="text-xs font-bold h-8 gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                >
                  <Crown className="h-3.5 w-3.5 text-amber-500" /> Super Admin (Full)
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPresetRole("store_manager")}
                  className="text-xs font-bold h-8 gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
                >
                  <Package className="h-3.5 w-3.5 text-blue-500" /> Store Manager
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPresetRole("content_editor")}
                  className="text-xs font-bold h-8 gap-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/20"
                >
                  <Globe className="h-3.5 w-3.5 text-purple-500" /> Website Content Editor
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPresetRole("support")}
                  className="text-xs font-bold h-8 gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                >
                  <Headphones className="h-3.5 w-3.5 text-emerald-500" /> Customer Support
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => applyPresetRole("clear")}
                  className="text-xs font-semibold h-8 gap-1 text-rose-500 hover:text-rose-600 ml-auto"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Clear All Checkboxes
                </Button>
              </div>
            </div>

            {/* Granular CRUD Checkbox Matrix Table Grouped By Section */}
            <div className="space-y-6">
              {Object.entries(groupedModules).map(([groupName, modules]) => (
                <div key={groupName} className="space-y-2 border-2 rounded-xl overflow-hidden shadow-2xs">
                  {/* Category Section Header Banner */}
                  <div className="bg-slate-900 text-slate-100 dark:bg-slate-800 p-3 px-4 flex items-center justify-between text-xs font-black uppercase tracking-wider">
                    <span className="flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-amber-400" /> {groupName} Modules ({modules.length})
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        modules.forEach((m) => toggleModuleRowAll(m.key));
                      }}
                      className="h-6 text-[10px] font-bold text-amber-400 hover:text-amber-300 hover:bg-slate-800"
                    >
                      Toggle All in {groupName}
                    </Button>
                  </div>

                  <div className="divide-y text-xs bg-card">
                    {modules.map((m) => {
                      const perm = rolePerms[m.key] || {
                        create: false,
                        read: false,
                        update: false,
                        delete: false,
                      };
                      const isAllRowChecked =
                        perm.create && perm.read && perm.update && perm.delete;

                      return (
                        <div
                          key={m.key}
                          className="p-3 px-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/40 transition-colors"
                        >
                          {/* Module Name & Slug */}
                          <div className="flex items-center gap-2 min-w-[220px]">
                            <div className="font-extrabold text-xs text-foreground">{m.label}</div>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              ({m.key})
                            </span>
                          </div>

                          {/* 4 CRUD Checkboxes + Select All Pill */}
                          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                            {/* CREATE CHECKBOX */}
                            <label className="flex items-center gap-1.5 cursor-pointer font-bold px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
                              <Checkbox
                                checked={perm.create}
                                onCheckedChange={() => toggleCrudPermission(m.key, "create")}
                              />
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                                Create
                              </span>
                            </label>

                            {/* READ CHECKBOX */}
                            <label className="flex items-center gap-1.5 cursor-pointer font-bold px-2 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all">
                              <Checkbox
                                checked={perm.read}
                                onCheckedChange={() => toggleCrudPermission(m.key, "read")}
                              />
                              <span className="text-[11px] text-indigo-600 dark:text-indigo-400">
                                Read
                              </span>
                            </label>

                            {/* UPDATE CHECKBOX */}
                            <label className="flex items-center gap-1.5 cursor-pointer font-bold px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all">
                              <Checkbox
                                checked={perm.update}
                                onCheckedChange={() => toggleCrudPermission(m.key, "update")}
                              />
                              <span className="text-[11px] text-amber-600 dark:text-amber-400">
                                Update
                              </span>
                            </label>

                            {/* DELETE CHECKBOX */}
                            <label className="flex items-center gap-1.5 cursor-pointer font-bold px-2 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all">
                              <Checkbox
                                checked={perm.delete}
                                onCheckedChange={() => toggleCrudPermission(m.key, "delete")}
                              />
                              <span className="text-[11px] text-rose-600 dark:text-rose-400">
                                Delete
                              </span>
                            </label>

                            {/* SELECT ALL ROW PILL */}
                            <Button
                              type="button"
                              variant={isAllRowChecked ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleModuleRowAll(m.key)}
                              className={`h-7 text-[10px] font-extrabold gap-1 ml-2 ${
                                isAllRowChecked
                                  ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                                  : "text-muted-foreground"
                              }`}
                            >
                              <CheckSquare className="h-3 w-3" /> {isAllRowChecked ? "Full CRUD" : "Select All"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-3 border-t flex flex-row items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground font-mono font-bold">
              {activeMatrixSummary.activeActions} active CRUD permissions across {activeMatrixSummary.activeModules} modules
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setRoleModalOpen(false)} className="text-xs font-semibold">
                Cancel
              </Button>
              <Button onClick={saveRole} className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs">
                <Check className="h-4 w-4 mr-1.5" /> {editingRoleId ? "Save Permissions" : "Create Role"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
