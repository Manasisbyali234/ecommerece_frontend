"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  ShoppingBag,
  Heart,
  Search,
  Store,
  User,
  UserCheck,
  Phone,
  ShieldCheck,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Sparkles,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useStore, initialHeaderConfig } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { authApi, clearAccessToken, getAccessToken, setAccessToken } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function StoreNavbar() {
  const { totalItems, setIsOpen } = useCart();
  const { wishlistCount } = useWishlist();
  const router = useRouter();

  const navCategories = useStore((s) => s.navCategories.filter((nc) => nc.active));
  const sidebarOptions = useStore((s) => (s.sidebarOptions || []).filter((o) => o.active));
  const storeCategories = useStore((s) => s.categories.filter((c) => c.name !== "All" && c.active));
  const trendingOptions = sidebarOptions.filter((o) => o.section === "trending");
  const helpOptions = sidebarOptions.filter((o) => o.section === "help");

  // Dynamic icon resolver
  const renderIcon = (iconName: string, className = "h-4 w-4") => {
    const IconComp = (LucideIcons as any)[iconName];
    if (IconComp) return <IconComp className={className} />;
    return <LucideIcons.Link className={className} />;
  };

  // Search & Category Drawer states
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [allCategoriesDrawerOpen, setAllCategoriesDrawerOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);

  // Login Modal & Auth State
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [otpStep, setOtpStep] = useState<"mobile" | "otp">("mobile");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpValues, setOtpValues] = useState(["", "", "", ""]);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loggedInPhone, setLoggedInPhone] = useState("");

  useEffect(() => {
    if (getAccessToken()) {
      setUserLoggedIn(true);
    }
  }, []);

  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Active top announcement banner
  const activeAnnouncement = useStore((s) =>
    s.coupons.find((c) => c.active)
  );

  const headerConfig = useStore(
    (s) => s.headerConfig || initialHeaderConfig
  );
  const [topBannerDismissed, setTopBannerDismissed] = useState(false);

  const activeNavLinks = headerConfig.navLinks?.filter((l) => l.active) || [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== "All") {
      params.set("category", selectedCategory);
    }
    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    }
    router.push(`/products?${params.toString()}`);
  };

  const handleCategoryFilter = (cat: string, query = "") => {
    const params = new URLSearchParams();
    if (cat && cat !== "All") params.set("category", cat);
    if (query) params.set("search", query);
    router.push(`/products?${params.toString()}`);
    setAllCategoriesDrawerOpen(false);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMobile = mobileNumber.replace(/\D/g, "");
    if (cleanMobile.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    try {
      const result = await authApi.requestOtp(cleanMobile);
      toast.success(`OTP Sent to +91 ${cleanMobile}`, { description: result.debugOtp ? `Demo OTP: ${result.debugOtp}` : "Check your SMS for the verification code." });
      setOtpStep("otp");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to send OTP"); }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpValues];
    newOtp[index] = value.slice(-1);
    setOtpValues(newOtp);

    // Auto-focus next OTP box
    if (value && index < 3) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otpValues.join("");
    if (enteredOtp.length < 4) {
      toast.error("Please enter complete 4-digit OTP code");
      return;
    }

    const cleanMobile = mobileNumber.replace(/\D/g, "");
    try {
      const result = await authApi.verifyOtp(cleanMobile, enteredOtp);
      setAccessToken(result.token);
      setUserLoggedIn(true);
      setLoggedInPhone(`+91 ${cleanMobile.slice(0, 5)} ${cleanMobile.slice(5)}`);
      setLoginModalOpen(false);
      toast.success("Successfully Logged In!", { description: `Welcome back! (+91 ${cleanMobile})` });
    } catch (error) { toast.error(error instanceof Error ? error.message : "OTP verification failed"); }
  };

  const handleLogout = () => {
    clearAccessToken();
    setUserLoggedIn(false);
    setLoggedInPhone("");
    setOtpStep("mobile");
    setMobileNumber("");
    toast.info("Logged Out Successfully");
  };

  const isSticky = headerConfig.actions?.stickyHeader !== false;

  return (
    <header className={`${isSticky ? "sticky top-0 z-40" : "relative z-40"} w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80`}>
      {/* Top Announcement Banner Ticker */}
      {headerConfig.topBanner?.enabled && !topBannerDismissed && (
        <div
          className="text-xs font-semibold py-2 px-4 flex items-center justify-between text-center gap-2 transition-all shadow-xs"
          style={{
            backgroundColor: headerConfig.topBanner.bgColor || "#0f172a",
            color: headerConfig.topBanner.textColor || "#ffffff",
          }}
        >
          <div className="flex-1 flex items-center justify-center gap-2 flex-wrap text-center">
            <span>{headerConfig.topBanner.text}</span>
            {headerConfig.topBanner.linkText && (
              <Link
                href={headerConfig.topBanner.linkUrl || "/#products"}
                className="underline hover:opacity-90 font-bold ml-1"
              >
                {headerConfig.topBanner.linkText} →
              </Link>
            )}
          </div>
          {headerConfig.topBanner.dismissible && (
            <button
              onClick={() => setTopBannerDismissed(true)}
              className="p-1 hover:opacity-75 shrink-0 cursor-pointer text-white"
              title="Dismiss announcement"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="mx-auto flex min-h-14 max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:h-16 sm:flex-nowrap sm:px-6 sm:py-0 lg:px-8 lg:gap-4">
        {/* Brand Logo */}
        <Link href="/" className="group flex min-w-0 flex-1 items-center gap-2.5 sm:flex-none sm:shrink-0">
          {headerConfig.logo?.imageUrl ? (
            <img
              src={headerConfig.logo.imageUrl}
              alt={headerConfig.logo.text || "Store Logo"}
              style={{ height: `${headerConfig.logo.heightPx || 36}px` }}
              className="max-h-9 max-w-[150px] object-contain sm:max-h-none sm:max-w-[200px]"
            />
          ) : (
            <>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-md transition-transform group-hover:scale-105 sm:h-9 sm:w-9">
                <Store className="h-5 w-5" />
              </div>
              <div className="flex flex-col hidden sm:flex">
                <span className="text-lg font-bold tracking-tight text-foreground">
                  {headerConfig.logo?.text || "Store"}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium -mt-1">
                  Premium E-Commerce
                </span>
              </div>
            </>
          )}
        </Link>

        {/* Amazon-Style Search Bar with Category Dropdown */}
        {headerConfig.actions?.showSearch !== false && (
          <form
            onSubmit={handleSearchSubmit}
            className="order-3 flex h-10 w-full flex-[1_0_100%] items-center overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm focus-within:ring-2 focus-within:ring-amber-500 dark:border-slate-700 dark:bg-slate-900 sm:order-none sm:mx-4 sm:max-w-2xl sm:flex-1"
          >
            {/* Category Dropdown (Left) */}
            <div className="relative shrink-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-10 max-w-[60px] cursor-pointer appearance-none truncate border-r border-slate-300 bg-slate-100 pl-2 pr-5 text-xs font-semibold text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 min-[375px]:max-w-[68px] sm:max-w-[80px] sm:pl-2.5"
              >
                <option value="All">All</option>
                {storeCategories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-1.5 top-3.5 h-3 w-3 text-slate-600 dark:text-slate-400 pointer-events-none" />
            </div>

            {/* Search Text Input (Middle) */}
            <input
              type="text"
              placeholder="Search Products, Brands and More ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 min-w-0 flex-1 bg-transparent px-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 sm:px-3 sm:text-sm"
            />

            {/* Orange Search Icon Button (Right) */}
            <button
              type="submit"
              className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#febd69] font-bold text-slate-950 transition-colors hover:bg-[#f3a847] sm:w-11"
              title="Search"
            >
              <Search className="h-4 w-4 stroke-[2.5]" />
            </button>
          </form>
        )}

        {/* Right Action Items */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {/* Wishlist Button */}
          {headerConfig.actions?.showWishlist !== false && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="relative flex h-8 w-8 items-center justify-center border-muted-foreground/20 p-0 transition-colors hover:border-rose-500 hover:text-rose-500 sm:h-9 sm:w-9"
              title="My Saved Wishlist"
            >
              <Link href="/wishlist">
                <Heart className="h-4 w-4" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white shadow-xs ring-2 ring-background">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            </Button>
          )}

          {/* Cart Button */}
          {headerConfig.actions?.showCart !== false && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!getAccessToken()) {
                  toast.error("Please login first to view your cart.");
                  return;
                }
                setIsOpen(true);
              }}
              className="relative flex h-8 items-center justify-center border-muted-foreground/20 px-2 hover:border-primary sm:h-9 sm:px-3"
            >
              <div className="relative flex items-center">
                <ShoppingBag className="h-4 w-4 text-foreground" />
                {totalItems > 0 && (
                  <span className="absolute -top-2.5 -right-3.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-extrabold text-primary-foreground shadow-sm ring-2 ring-background">
                    {totalItems}
                  </span>
                )}
              </div>
            </Button>
          )}

          {/* Customer Login / Account Button */}
          {headerConfig.actions?.showUserAccount !== false && (
            <>
              {userLoggedIn ? (
                <div className="flex items-center gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1.5 hover:bg-emerald-500/20"
                  >
                    <Link href="/account">
                      <UserCheck className="h-4 w-4" />
                      <span className="hidden sm:inline">My Account</span>
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    onClick={handleLogout}
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setOtpStep("mobile");
                      setLoginModalOpen(true);
                    }}
                    className="h-8 gap-1.5 px-2 text-xs font-semibold shadow-sm sm:h-9 sm:px-4"
                  >
                    <User className="h-4 w-4 sm:hidden" />
                    <span>Login</span>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* SUB-HEADER CATEGORY BAR (Amazon-Style Dark Navy Navigation) */}
      <div className="bg-[#232f3e] text-slate-100 text-xs font-medium border-t border-slate-700/60 shadow-inner">
        <div className="mobile-scrollbar-none mx-auto flex h-10 max-w-7xl items-center gap-1 overflow-x-auto px-3 sm:gap-3 sm:px-6 lg:px-8">
          {/* ALL CATEGORIES HAMBURGER BUTTON */}
          <button
            onClick={() => setAllCategoriesDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-slate-700/70 text-white font-bold transition-colors shrink-0 border border-slate-600/50 bg-slate-800/80"
          >
            <Menu className="h-4 w-4" />
            <span>All</span>
          </button>

          {/* Dynamic Header Navigation Links */}
          {activeNavLinks.map((link) => (
            <Link
              key={link.id}
              href={link.url}
              className={`px-2.5 py-1 rounded transition-colors shrink-0 flex items-center gap-1.5 ${
                link.highlight
                  ? "text-amber-400 font-bold hover:bg-slate-700/80"
                  : "text-slate-200 hover:bg-slate-700/60 hover:text-white font-semibold"
              }`}
            >
              <span>{link.label}</span>
              {link.badge && (
                <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* ALL CATEGORIES & SUBCATEGORIES HAMBURGER SIDE DRAWER */}
      <Sheet open={allCategoriesDrawerOpen} onOpenChange={setAllCategoriesDrawerOpen}>
        <SheetContent side="left" className="w-[min(90vw,22rem)] p-0 overflow-y-auto bg-background sm:w-96 [&>button]:top-3 [&>button]:right-3 [&>button]:z-10 [&>button]:rounded-md [&>button]:bg-white/15 [&>button]:p-1 [&>button]:opacity-100 [&>button]:text-white [&>button:hover]:bg-white/25">
          {/* Drawer Top Header Banner */}
          <div className="bg-[#232f3e] text-white pt-10 pb-4 px-4 flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-700/80 flex items-center justify-center text-white font-bold">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold">Hello, {userLoggedIn ? loggedInPhone : "Customer"}</h3>
                <p className="text-[11px] text-slate-300">Welcome to {headerConfig.logo?.text || "our Store"}</p>
              </div>
            </div>
            {userLoggedIn ? (
              <Link href="/account" onClick={() => setAllCategoriesDrawerOpen(false)} className="shrink-0 rounded-lg bg-amber-500 px-2.5 py-1.5 text-xs font-bold text-slate-950 transition-colors hover:bg-amber-400">My Account</Link>
            ) : (
              <button onClick={() => { setAllCategoriesDrawerOpen(false); setOtpStep("mobile"); setLoginModalOpen(true); }} className="shrink-0 rounded-lg bg-amber-500 px-2.5 py-1.5 text-xs font-bold text-slate-950 transition-colors hover:bg-amber-400">Login</button>
            )}
          </div>

          <div className="p-4 space-y-6">
            {/* Trending & Highlights - Dynamic */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                Trending & Highlights
              </h4>
              <div className="space-y-1">
                {trendingOptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic px-2 py-1">No trending links configured.</p>
                ) : (
                  trendingOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        router.push(opt.url);
                        setAllCategoriesDrawerOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-accent text-xs font-medium text-foreground transition-colors"
                    >
                        <span className="flex min-w-0 items-center gap-2.5">
                          {renderIcon(opt.icon, "h-4 w-4 text-amber-500")}
                          <span className="truncate">{opt.label}</span>
                        </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                Shop By Category & Subcategories
              </h4>

              <div className="space-y-1">
                {navCategories.map((group) => {
                  const isExpanded = activeSubMenu === group.name;

                  return (
                    <div key={group.id} className="rounded-lg border bg-card overflow-hidden transition-all">
                      <button
                        onClick={() => {
                          setActiveSubMenu(isExpanded ? null : group.name);
                        }}
                        className="w-full flex items-center justify-between p-3 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <span className="truncate">{group.name}</span>
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* 3-Level Categories & Subcategories Expansion */}
                      {isExpanded && (
                        <div className="bg-muted/30 px-3 pb-3 pt-1 space-y-3 border-t">
                          <button
                            onClick={() => handleCategoryFilter(group.name)}
                            className="w-full text-left text-xs font-bold text-primary py-1.5 hover:underline flex items-center justify-between border-b pb-2"
                          >
                            <span>Shop All {group.name}</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>

                          {group.categories.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground italic pl-2">No categories configured.</p>
                          ) : (
                            <div className="space-y-3 pl-2">
                              {group.categories.map((category) => (
                                <div key={category.id} className="space-y-1">
                                  {/* Category Header Label */}
                                  <h5 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                                    {category.name}
                                  </h5>
                                  
                                  {/* Subcategories list */}
                                  <div className="space-y-0.5 border-l-2 border-primary/10 pl-2">
                                    {category.subcategories.map((sub) => (
                                      <button
                                        key={sub}
                                        onClick={() => handleCategoryFilter(group.name, sub)}
                                        className="w-full text-left text-[11px] text-muted-foreground hover:text-foreground py-1 transition-colors block hover:font-semibold"
                                      >
                                        {sub}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Help & Settings - Dynamic */}
            <div className="border-t pt-4 space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                Help & Settings
              </h4>
              {helpOptions.length === 0 ? (
                <p className="text-xs text-muted-foreground italic px-2 py-1">No help links configured.</p>
              ) : (
                helpOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      router.push(opt.url);
                      setAllCategoriesDrawerOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-accent text-xs font-medium text-foreground transition-colors"
                  >
                    {renderIcon(opt.icon, "h-4 w-4 text-muted-foreground")}
                    <span>{opt.label}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* OTP Mobile Authentication Dialog Popup */}
      <Dialog open={loginModalOpen} onOpenChange={setLoginModalOpen}>
        <DialogContent className="p-4 sm:max-w-md sm:p-6">
          {otpStep === "mobile" ? (
            /* STEP 1: Enter Mobile Number */
            <div className="space-y-5">
              <DialogHeader className="space-y-2 text-left">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Phone className="h-5 w-5" />
                  </div>
                  <DialogTitle className="text-lg font-bold tracking-tight sm:text-xl">
                    Login / Sign Up
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  Enter your 10-digit mobile number to receive a verification code.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="mobile" className="text-xs font-semibold">
                    Mobile Number
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 h-10 rounded-lg border bg-muted/30 text-xs font-bold text-foreground shrink-0">
                      <span>🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <Input
                      id="mobile"
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="h-10 text-sm font-mono tracking-wider"
                      autoFocus
                    />
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full h-11 font-semibold shadow-md">
                  Get OTP <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <p className="text-[11px] text-center text-muted-foreground">
                  By continuing, you agree to our Terms of Service & Privacy Policy.
                </p>
              </form>
            </div>
          ) : (
            /* STEP 2: Enter 4-Digit OTP */
            <div className="space-y-5">
              <DialogHeader className="space-y-2 text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <DialogTitle className="text-xl font-bold tracking-tight">
                    Verify OTP Code
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  Sent 4-digit code to <strong className="text-foreground">+91 {mobileNumber || "9876543210"}</strong>.{" "}
                  <button
                    type="button"
                    onClick={() => setOtpStep("mobile")}
                    className="text-primary underline font-medium"
                  >
                    Edit Number
                  </button>
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {/* 4 Single-Digit OTP Inputs */}
                <div className="grid grid-cols-4 gap-2 py-2 min-[375px]:gap-3">
                  {otpValues.map((val, idx) => (
                    <input
                      key={idx}
                      ref={otpRefs[idx]}
                      type="text"
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      className="h-11 w-full text-center font-mono text-lg font-bold rounded-xl border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none min-[375px]:h-12 min-[375px]:text-xl"
                    />
                  ))}
                </div>

                <Button type="submit" size="lg" className="w-full h-11 font-semibold shadow-md">
                  Verify & Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      toast.success("New OTP Code resent successfully!");
                    }}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Didn't receive code? <span className="font-bold underline">Resend OTP</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </header>
  );
}
