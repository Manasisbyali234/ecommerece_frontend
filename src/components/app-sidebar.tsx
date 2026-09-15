"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layout,
  Package,
  ShoppingCart,
  CreditCard,
  FileText,
  Truck,
  Store,
  Users,
  BarChart3,
  Ticket,
  Megaphone,
  ShoppingBag,
  Globe,
  ChevronRight,
  Grid,
  Layers,
  FolderTree,
  ShieldCheck,
  Sliders,
  Bell,
  Star,
  Palette,
  Search,
  X,
  Sparkles,
  ExternalLink,
  CircleDot,
  Tag,
  Award,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarRail,
  SidebarInput,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { hasPermission, getAdminRole, subscribeAdminRole } from "@/lib/api";
import { useStore } from "@/lib/store";

export function AppSidebar() {
  const currentPath = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  const isSectionsActive =
    currentPath?.startsWith("/admin/banners") ||
    currentPath?.startsWith("/admin/categories") ||
    currentPath?.startsWith("/admin/sub-categories") ||
    currentPath?.startsWith("/admin/brands");

  const isWebsiteActive =
    isSectionsActive ||
    currentPath?.startsWith("/admin/builder") ||
    currentPath?.startsWith("/admin/header") ||
    currentPath?.startsWith("/admin/footer") ||
    currentPath?.startsWith("/admin/favicon") ||
    currentPath?.startsWith("/admin/sidebar-options");

  const isMasterSettingsActive =
    currentPath?.startsWith("/admin/nav-categories") ||
    currentPath?.startsWith("/admin/settings") ||
    currentPath?.startsWith("/admin/payments") ||
    currentPath?.startsWith("/admin/theme");

  const query = searchQuery.trim().toLowerCase();

  // Helper function to check if item matches filter query
  const matches = (label: string, subLabels: string[] = []) => {
    if (!query) return true;
    if (label.toLowerCase().includes(query)) return true;
    return subLabels.some((sub) => sub.toLowerCase().includes(query));
  };

  // Group 1: Overview
  const showOverviewGroup = (matches("Dashboard") && hasPermission("dashboard:read")) || (matches("Analytics") && hasPermission("analytics:read"));
  
  // Sections sub-items list for search
  const sectionsSubItems = [
    "Banners",
    "Categories",
    "Sub Categories",
    "Brands",
  ];
  const showSectionsMenu = matches("Sections", sectionsSubItems);

  // Group 2: Commerce Operations
  const showCommerceGroup =
    (matches("Products") && hasPermission("products:read")) ||
    (matches("Product Reviews") && hasPermission("products:read")) ||
    (matches("Orders") && hasPermission("orders:read")) ||
    (matches("Invoices") && hasPermission("invoices:read")) ||
    (matches("Shipping Operations") && hasPermission("shipping:read")) ||
    (matches("Customers") && hasPermission("customers:read")) ||
    (matches("Coupons & Discounts") && hasPermission("coupons:read"));

  // Website sub-items list for search
  const websiteSubItems = [
    "Sections",
    "Page Builder",
    "Header Manager",
    "Footer Manager",
    "Favicon Manager",
    "Sidebar Options",
  ];
  const showWebsiteMenu = matches("Website CMS", websiteSubItems) || showSectionsMenu;

  // Settings sub-items list for search
  const settingsSubItems = [
    "General Settings",
    "Customer Tiers",
    "Catalog Manager",
    "Theme & Colors",
    "Invoice & Tax",
    "Notifications",
    "Logistics Rules",
    "SEO & Analytics",
    "Payment Gateways",
  ];
  const showMasterSettingsMenu = matches("Master Settings", settingsSubItems);

  // System Group
  const showSystemGroup = showWebsiteMenu || showMasterSettingsMenu || (matches("Users & Roles", ["User Analytics"]) && hasPermission("users:read"));

  const [staffRole, setStaffRole] = useState(getAdminRole);
  const brandName = useStore((s) => s.footerConfig?.brandName || s.headerConfig?.logo?.text || "Admin");

  useEffect(() => { const unsub = subscribeAdminRole(() => setStaffRole(getAdminRole())); return () => { unsub(); }; }, []);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar/95 backdrop-blur-md">
      {/* Sidebar Header: Brand & Staff Profile */}
      <SidebarHeader className="border-b border-sidebar-border/60 pb-3 pt-3">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary via-indigo-600 to-violet-600 text-primary-foreground shadow-md shadow-primary/20 shrink-0">
              <Store className="h-4 w-4" />
            </div>
            <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight truncate text-foreground">{brandName}</span>
              </div>
              {staffRole?.email ? (
                <span className="text-[11px] text-muted-foreground truncate font-medium">{staffRole.email}</span>
              ) : (
                <span className="text-[11px] text-muted-foreground truncate font-medium opacity-50">Loading…</span>
              )}
            </div>
          </div>
        </div>

        {/* Staff profile + View Website — shown only for non-super-admin staff */}
        {staffRole && !staffRole.isSuperAdmin && (
          <div className="mt-2.5 px-1 group-data-[collapsible=icon]:hidden space-y-2">
            {/* Profile row */}
            <Link
              href="/admin/staff/profile"
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-amber-500/10 transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 font-bold text-xs shrink-0">
                {staffRole.name?.charAt(0)?.toUpperCase() || "S"}
              </div>
              <div className="flex flex-col leading-tight min-w-0">
                <span className="text-xs font-semibold truncate">{staffRole.name}</span>
                <span className="text-[10px] text-muted-foreground truncate">{staffRole.email || ""}</span>
              </div>
            </Link>
            {/* View Website button */}
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary transition-all"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold">View Website</span>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-primary/70" />
            </Link>
          </div>
        )}

        {/* Quick Search Filter Bar */}
        <div className="mt-2.5 px-1 group-data-[collapsible=icon]:hidden">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <SidebarInput
              type="text"
              placeholder="Quick search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-7 h-8 text-xs bg-sidebar-accent/50 border-sidebar-border/60 rounded-lg placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-primary/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </SidebarHeader>

      {/* Sidebar Content */}
      <SidebarContent className="px-1.5 py-2">
        {/* GROUP 1: OVERVIEW & ANALYTICS */}
        {showOverviewGroup && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] font-bold tracking-wider text-muted-foreground/80 uppercase px-2 mb-1">
              Overview
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Dashboard */}
                {matches("Dashboard") && hasPermission("dashboard:read") && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={currentPath === "/admin"}
                      tooltip="Dashboard"
                      className="group/btn relative font-medium transition-all"
                    >
                      <Link href="/admin" className="flex items-center gap-2.5">
                        <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover/btn:bg-indigo-500/20 transition-colors">
                          <LayoutDashboard className="h-4 w-4" />
                        </div>
                        <span className="text-sm">Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {/* Analytics */}
                {matches("Analytics") && hasPermission("analytics:read") && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={currentPath?.startsWith("/admin/analytics")}
                      tooltip="Analytics"
                      className="group/btn relative font-medium transition-all"
                    >
                      <Link href="/admin/analytics" className="flex items-center gap-2.5">
                        <div className="p-1 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 group-hover/btn:bg-violet-500/20 transition-colors">
                          <BarChart3 className="h-4 w-4" />
                        </div>
                        <span className="text-sm">Analytics</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {showOverviewGroup && showCommerceGroup && <SidebarSeparator className="my-1.5 opacity-60" />}

        {/* GROUP 2: COMMERCE OPERATIONS */}
        {showCommerceGroup && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] font-bold tracking-wider text-muted-foreground/80 uppercase px-2 mb-1">
              Commerce
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Products */}
                {matches("Products") && hasPermission("products:read") && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={currentPath?.startsWith("/admin/products")}
                      tooltip="Products"
                      className="group/btn font-medium"
                    >
                      <Link href="/admin/products" className="flex items-center gap-2.5">
                        <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover/btn:bg-emerald-500/20 transition-colors">
                          <Package className="h-4 w-4" />
                        </div>
                        <span className="text-sm">Products</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {/* Product Reviews */}
                {matches("Product Reviews") && hasPermission("products:read") && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={currentPath?.startsWith("/admin/reviews")}
                      tooltip="Product Reviews"
                      className="group/btn font-medium"
                    >
                      <Link href="/admin/reviews" className="flex items-center gap-2.5">
                        <div className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover/btn:bg-amber-500/20 transition-colors">
                          <Star className="h-4 w-4" />
                        </div>
                        <span className="text-sm">Product Reviews</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {/* Orders */}
                {matches("Orders") && hasPermission("orders:read") && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={currentPath?.startsWith("/admin/orders")}
                      tooltip="Orders"
                      className="group/btn font-medium"
                    >
                      <Link href="/admin/orders" className="flex items-center gap-2.5">
                        <div className="p-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover/btn:bg-blue-500/20 transition-colors">
                          <ShoppingCart className="h-4 w-4" />
                        </div>
                        <span className="text-sm">Orders</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {/* Invoices */}
                {matches("Invoices") && hasPermission("invoices:read") && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={currentPath?.startsWith("/admin/invoices")}
                      tooltip="Invoices"
                      className="group/btn font-medium"
                    >
                      <Link href="/admin/invoices" className="flex items-center gap-2.5">
                        <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover/btn:bg-cyan-500/20 transition-colors">
                          <FileText className="h-4 w-4" />
                        </div>
                        <span className="text-sm">Invoices</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {/* Shipping Operations */}
                {matches("Shipping Operations") && hasPermission("shipping:read") && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={currentPath === "/admin/shipping"}
                      tooltip="Shipping"
                      className="group/btn font-medium"
                    >
                      <Link href="/admin/shipping" className="flex items-center gap-2.5">
                        <div className="p-1 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover/btn:bg-teal-500/20 transition-colors">
                          <Truck className="h-4 w-4" />
                        </div>
                        <span className="text-sm">Shipping</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {/* Customers */}
                {matches("Customers") && hasPermission("customers:read") && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={currentPath?.startsWith("/admin/customers")}
                      tooltip="Customers"
                      className="group/btn font-medium"
                    >
                      <Link href="/admin/customers" className="flex items-center gap-2.5">
                        <div className="p-1 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover/btn:bg-orange-500/20 transition-colors">
                          <Users className="h-4 w-4" />
                        </div>
                        <span className="text-sm">Customers</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {/* Coupons */}
                {matches("Coupons & Discounts") && hasPermission("coupons:read") && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={currentPath?.startsWith("/admin/coupons")}
                      tooltip="Coupons"
                      className="group/btn font-medium"
                    >
                      <Link href="/admin/coupons" className="flex items-center gap-2.5">
                        <div className="p-1 rounded-md bg-pink-500/10 text-pink-600 dark:text-pink-400 group-hover/btn:bg-pink-500/20 transition-colors">
                          <Ticket className="h-4 w-4" />
                        </div>
                        <span className="text-sm">Coupons</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {showCommerceGroup && showSystemGroup && <SidebarSeparator className="my-1.5 opacity-60" />}

        {/* GROUP 3: SYSTEM & STOREFRONT */}
        {showSystemGroup && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] font-bold tracking-wider text-muted-foreground/80 uppercase px-2 mb-1">
              Storefront & System
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Website CMS Sub-Menu */}
                {showWebsiteMenu && (
                  <Collapsible defaultOpen={isWebsiteActive || Boolean(query)} className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          isActive={isWebsiteActive}
                          tooltip="Website CMS"
                          className="w-full justify-between group/btn font-medium"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover/btn:bg-sky-500/20 transition-colors">
                              <Globe className="h-4 w-4" />
                            </div>
                            <span className="text-sm truncate">Website CMS</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden shrink-0" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub className="ml-3.5 border-l border-sidebar-border/60 pl-2 my-1 space-y-0.5">
                          {showSectionsMenu && (
                            <Collapsible defaultOpen={isSectionsActive || Boolean(query)} className="group/sections">
                              <SidebarMenuSubItem>
                                <CollapsibleTrigger asChild>
                                  <SidebarMenuSubButton
                                    isActive={isSectionsActive}
                                    className="w-full justify-between h-8 text-xs font-medium"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Layers className="h-3.5 w-3.5 text-indigo-500" />
                                      <span>Sections</span>
                                    </div>
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]/sections:rotate-90 shrink-0" />
                                  </SidebarMenuSubButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <SidebarMenuSub className="ml-2.5 border-l border-sidebar-border/60 pl-2 my-0.5 space-y-0.5">
                                    {matches("Banners") && (
                                      <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                          asChild
                                          isActive={currentPath?.startsWith("/admin/banners")}
                                          className="h-8 text-xs font-medium"
                                        >
                                          <Link href="/admin/banners" className="flex items-center gap-2">
                                            <Megaphone className="h-3.5 w-3.5 text-sky-500" />
                                            <span>Banners</span>
                                          </Link>
                                        </SidebarMenuSubButton>
                                      </SidebarMenuSubItem>
                                    )}
                                    {matches("Categories") && (
                                      <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                          asChild
                                          isActive={currentPath?.startsWith("/admin/categories")}
                                          className="h-8 text-xs font-medium"
                                        >
                                          <Link href="/admin/categories" className="flex items-center gap-2">
                                            <Layers className="h-3.5 w-3.5 text-purple-500" />
                                            <span>Categories</span>
                                          </Link>
                                        </SidebarMenuSubButton>
                                      </SidebarMenuSubItem>
                                    )}
                                    {matches("Sub Categories") && (
                                      <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                          asChild
                                          isActive={currentPath?.startsWith("/admin/sub-categories")}
                                          className="h-8 text-xs font-medium"
                                        >
                                          <Link href="/admin/sub-categories" className="flex items-center gap-2">
                                            <Grid className="h-3.5 w-3.5 text-indigo-500" />
                                            <span>Sub Categories</span>
                                          </Link>
                                        </SidebarMenuSubButton>
                                      </SidebarMenuSubItem>
                                    )}
                                    {matches("Brands") && (
                                      <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                          asChild
                                          isActive={currentPath?.startsWith("/admin/brands")}
                                          className="h-8 text-xs font-medium"
                                        >
                                          <Link href="/admin/brands" className="flex items-center gap-2">
                                            <Tag className="h-3.5 w-3.5 text-orange-500" />
                                            <span>Brands</span>
                                          </Link>
                                        </SidebarMenuSubButton>
                                      </SidebarMenuSubItem>
                                    )}
                                  </SidebarMenuSub>
                                </CollapsibleContent>
                              </SidebarMenuSubItem>
                            </Collapsible>
                          )}

                          {matches("Page Builder") && (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentPath?.startsWith("/admin/builder")}
                                className="h-8 text-xs font-medium"
                              >
                                <Link href="/admin/builder" className="flex items-center gap-2">
                                  <Layout className="h-3.5 w-3.5 text-amber-500" />
                                  <span>Page Builder</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )}
                          {matches("Header Manager") && (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentPath?.startsWith("/admin/header")}
                                className="h-8 text-xs font-medium"
                              >
                                <Link href="/admin/header" className="flex items-center gap-2">
                                  <Sliders className="h-3.5 w-3.5 text-rose-500" />
                                  <span>Header Manager</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )}
                          {matches("Footer Manager") && (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentPath?.startsWith("/admin/footer")}
                                className="h-8 text-xs font-medium"
                              >
                                <Link href="/admin/footer" className="flex items-center gap-2">
                                  <Sliders className="h-3.5 w-3.5 text-blue-500" />
                                  <span>Footer Manager</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )}
                          {matches("Favicon Manager") && (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentPath?.startsWith("/admin/favicon")}
                                className="h-8 text-xs font-medium"
                              >
                                <Link href="/admin/favicon" className="flex items-center gap-2">
                                  <Globe className="h-3.5 w-3.5 text-emerald-500" />
                                  <span>Favicon Manager</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )}
                          {matches("Sidebar Options") && (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentPath?.startsWith("/admin/sidebar-options")}
                                className="h-8 text-xs font-medium"
                              >
                                <Link href="/admin/sidebar-options" className="flex items-center gap-2">
                                  <Sliders className="h-3.5 w-3.5 text-amber-500" />
                                  <span>Sidebar Options</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )}

                {/* Master Settings Sub-Menu */}
                {showMasterSettingsMenu && (
                  <Collapsible defaultOpen={isMasterSettingsActive || Boolean(query)} className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          isActive={isMasterSettingsActive}
                          tooltip="Master Settings"
                          className="w-full justify-between group/btn font-medium"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover/btn:bg-amber-500/20 transition-colors">
                              <Sliders className="h-4 w-4" />
                            </div>
                            <span className="text-sm truncate">Master Settings</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden shrink-0" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub className="ml-3.5 border-l border-sidebar-border/60 pl-2 my-1 space-y-0.5">
                          {matches("General Settings") && (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentPath?.startsWith("/admin/settings/general")}
                                className="h-8 text-xs font-medium"
                              >
                                <Link href="/admin/settings/general" className="flex items-center gap-2">
                                  <Store className="h-3.5 w-3.5 text-blue-500" />
                                  <span>General Settings</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )}
                          {matches("Customer Tiers") && (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentPath?.startsWith("/admin/settings/customer-tiers")}
                                className="h-8 text-xs font-medium"
                              >
                                <Link href="/admin/settings/customer-tiers" className="flex items-center gap-2">
                                  <Award className="h-3.5 w-3.5 text-purple-500" />
                                  <span>Customer Tiers</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )}
                          {matches("Catalog Manager") && (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentPath?.startsWith("/admin/nav-categories")}
                                className="h-8 text-xs font-medium"
                              >
                                <Link href="/admin/nav-categories" className="flex items-center gap-2">
                                  <FolderTree className="h-3.5 w-3.5 text-teal-500" />
                                  <span>Catalog Manager</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )}
                          {matches("Theme & Colors") && (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentPath?.startsWith("/admin/theme")}
                                className="h-8 text-xs font-medium"
                              >
                                <Link href="/admin/theme" className="flex items-center gap-2">
                                  <Palette className="h-3.5 w-3.5 text-rose-500" />
                                  <span>Theme & Colors</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )}
                          {matches("Invoice & Tax") && (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentPath?.startsWith("/admin/settings/invoices")}
                                className="h-8 text-xs font-medium"
                              >
                                <Link href="/admin/settings/invoices" className="flex items-center gap-2">
                                  <FileText className="h-3.5 w-3.5 text-amber-500" />
                                  <span>Invoice & Tax</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )}
                          {matches("Notifications") && (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentPath?.startsWith("/admin/settings/notifications")}
                                className="h-8 text-xs font-medium"
                              >
                                <Link href="/admin/settings/notifications" className="flex items-center gap-2">
                                  <Bell className="h-3.5 w-3.5 text-purple-500" />
                                  <span>Notifications</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )}
                          {matches("Logistics Rules") && (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentPath?.startsWith("/admin/settings/shipping")}
                                className="h-8 text-xs font-medium"
                              >
                                <Link href="/admin/settings/shipping" className="flex items-center gap-2">
                                  <Truck className="h-3.5 w-3.5 text-emerald-500" />
                                  <span>Logistics Rules</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )}
                          {matches("SEO & Analytics") && (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentPath?.startsWith("/admin/settings/seo")}
                                className="h-8 text-xs font-medium"
                              >
                                <Link href="/admin/settings/seo" className="flex items-center gap-2">
                                  <Globe className="h-3.5 w-3.5 text-sky-500" />
                                  <span>SEO & Analytics</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )}
                          {matches("Payment Gateways") && (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentPath?.startsWith("/admin/payments")}
                                className="h-8 text-xs font-medium"
                              >
                                <Link href="/admin/payments" className="flex items-center gap-2">
                                  <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
                                  <span>Payment Gateways</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )}

                {/* Users & Roles Management */}
                {matches("Users & Roles", ["User Analytics"]) && hasPermission("users:read") && (
                  <Collapsible defaultOpen={currentPath?.startsWith("/admin/users") || Boolean(query)} className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          isActive={currentPath?.startsWith("/admin/users")}
                          tooltip="Users & Roles"
                          className="w-full justify-between group/btn font-medium"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover/btn:bg-rose-500/20 transition-colors">
                              <ShieldCheck className="h-4 w-4" />
                            </div>
                            <span className="text-sm truncate">Users & Roles</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden shrink-0" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub className="ml-3.5 border-l border-sidebar-border/60 pl-2 my-1 space-y-0.5">
                          {matches("Users & Roles") && (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentPath === "/admin/users" || (currentPath?.startsWith("/admin/users") && !currentPath?.includes("analytics"))}
                                className="h-8 text-xs font-medium"
                              >
                                <Link href="/admin/users" className="flex items-center gap-2">
                                  <ShieldCheck className="h-3.5 w-3.5 text-rose-500" />
                                  <span>Users & Roles</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )}
                          {matches("User Analytics") && (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentPath?.includes("/admin/users") && currentPath?.includes("analytics")}
                                className="h-8 text-xs font-medium"
                              >
                                <Link href="/admin/users?tab=analytics" className="flex items-center gap-2">
                                  <BarChart3 className="h-3.5 w-3.5 text-violet-500" />
                                  <span>User Analytics</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Sidebar Footer: Storefront Link & Staff Profile */}
      <SidebarFooter className="p-2 border-t border-sidebar-border/60 bg-sidebar/50">
        <SidebarMenu>
          {!staffRole || staffRole.isSuperAdmin ? (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="View Live Storefront"
                className="bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary transition-all rounded-lg"
              >
                <Link href="/" target="_blank" className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold group-data-[collapsible=icon]:hidden">
                     View Website
                    </span>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-primary/70 group-data-[collapsible=icon]:hidden" />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : null}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
