"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Edit3,
  Trash2,
  Star,
  Tag,
  Package,
  IndianRupee,
  Sparkles,
  Layers,
  Check,
  RotateCcw,
  Sliders,
  ImageIcon,
  FolderTree,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  GripVertical,
  X,
  PlusCircle,
  Truck,
  Percent,
  CheckCircle2,
  Info,
  HelpCircle,
  Link as LinkIcon,
  Image as ImageLucide,
  Award,
  Clock,
  ExternalLink,
  UploadCloud,
  Ratio,
  Upload,
  ImagePlus,
  FileImage,
  Crop,
  ChevronDown,
  ChevronUp,
  Bold,
  Italic,
  ListOrdered,
  MoveUp,
  MoveDown,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { formatCurrency, defaultAdditionalInfo, defaultAboutSections, type Product, type AboutProductSection, type AdditionalInfoSection } from "@/lib/mock-data";
import { api, uploadImage } from "@/lib/api";
import { useStore, type NavCategoryGroup } from "@/lib/store";

const statusColor: Record<Product["status"], string> = {
  active: "bg-emerald-600 dark:bg-emerald-500 text-white border-transparent hover:bg-emerald-600/90 shadow-sm",
  draft: "bg-amber-500 text-slate-950 border-transparent hover:bg-amber-500/90 shadow-sm",
  archived: "bg-slate-600 dark:bg-slate-500 text-white border-transparent hover:bg-slate-600/90 shadow-sm",
};

const fallbackCategoryOptions = [
  "Audio",
  "Footwear",
  "Electronics",
  "Apparel",
  "Bags & Luggage",
  "Home & Lifestyle",
];

const fallbackSubCategoryOptions: Record<string, string[]> = {
  "Audio": ["Headphones", "Earbuds", "Speakers", "Microphones", "Accessories"],
  "Footwear": ["Sneakers", "Running Shoes", "Formal Shoes", "Sandals", "Slippers"],
  "Electronics": ["Smartphones", "Smartwatches", "Laptops", "Tablets", "Chargers & Cables"],
  "Apparel": ["T-Shirts", "Hoodies", "Jeans", "Jackets", "Activewear"],
  "Bags & Luggage": ["Backpacks", "Duffle Bags", "Suitcases", "Briefcases", "Messenger Bags"],
  "Home & Lifestyle": ["Smart Lights", "Water Bottles", "Organizers", "Desk Mats", "Diffusers"],
};

const genderOptions = ["Unisex", "Men", "Women", "Kids"];

const presetTags = [
  "Trending",
  "Best Seller",
  "New Arrival",
  "Wireless",
  "ANC",
  "Premium",
  "Limited Edition",
  "Top Rated",
  "Eco Friendly",
  "Featured",
  "Flash Sale",
];

function uniq(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function buildCategoryHierarchy(navCategories: NavCategoryGroup[]) {
  const hierarchy: Record<string, string[]> = {};
  navCategories
    .filter((vertical) => vertical.active !== false)
    .forEach((vertical) => {
      vertical.categories.forEach((category) => {
        if (!category.name?.trim()) return;
        hierarchy[category.name] = uniq([...(hierarchy[category.name] || []), ...(category.subcategories || [])]);
      });
    });
  return Object.keys(hierarchy).length > 0 ? hierarchy : fallbackSubCategoryOptions;
}

function categoryIncludes(category: string | undefined, words: string[]) {
  const normalized = (category || "").toLowerCase();
  return words.some((word) => normalized.includes(word));
}

function getCategoryFieldRules(category: string | undefined) {
  const hidesVariantSpecs = categoryIncludes(category, ["electronics", "gadget", "mobile"]);
  const comboRelevant = categoryIncludes(category, ["audio", "electronics", "gadget", "mobile", "home", "kitchen", "bag", "luggage", "accessor"]);
  return {
    showVariantSpecs: !hidesVariantSpecs,
    showComboProducts: comboRelevant || !category,
  };
}

function calculateSellingPrice(cost: number, discount: number) {
  const safeCost = Number.isFinite(cost) ? Math.max(0, cost) : 0;
  const safeDiscount = Number.isFinite(discount) ? Math.min(100, Math.max(0, discount)) : 0;
  return Math.round(safeCost * (1 - safeDiscount / 100) * 100) / 100;
}

function calculateDiscountPercent(cost: number, price: number) {
  if (!Number.isFinite(cost) || cost <= 0 || !Number.isFinite(price)) return 0;
  return Math.round(Math.min(100, Math.max(0, ((cost - price) / cost) * 100)) * 100) / 100;
}

export default function ProductsPage() {
  const navCategories = useStore((s) => s.navCategories);
  const [items, setItems] = useState<Product[]>([]);
  useEffect(() => {
    api<{ items: Product[] }>("/admin/products")
      .then(({ items: saved }) => setItems(saved))
      .catch((error) => toast.error(error instanceof Error ? error.message : "Unable to load products"));
  }, []);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Add / Edit Modal state
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("basic");

  // Expanded Accordion State for About Sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "sec-about-text": true,
    "sec-highlights": true,
    "sec-banner": true,
    "sec-showcase": false,
    "sec-specs-summary": false,
    "sec-whats-in-box": false,
  });

  // Form State for modal
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    sku: "",
    category: "Audio",
    brand: "",
    gender: "Unisex",
    price: 0,
    originalPrice: 0,
    stock: 10,
    status: "active",
    badge: "New Arrival",
    image: "",
    images: [],
    rating: 4.5,
    reviewCount: 0,
    tags: ["New Arrival"],
    description: "",
    features: [],
    specs: {},
    colors: [],
    sizes: [],
    codAvailable: true,
    codText: "",
    returnAvailable: true,
    returnText: "",
    exchangeAvailable: true,
    exchangeText: "",
    replacementAvailable: true,
    freeShippingAvailable: true,
    secureCheckout: true,
    officialWarranty: true,
    expressDispatch: true,
    warrantyPeriod: "",
    deliveryEstimate: "",
    aboutSections: JSON.parse(JSON.stringify(defaultAboutSections)),
    additionalInfoSections: [],
  });

  // Temp Inputs
  const [tagInput, setTagInput] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");
  const [colorName, setColorName] = useState("");
  const [colorHex, setColorHex] = useState("#0f172a");
  const [sizeInput, setSizeInput] = useState("");
  const [featuresInput, setFeaturesInput] = useState("");
  const [customParamKeys, setCustomParamKeys] = useState<Record<string, boolean>>({});
  const [customParamKeyInput, setCustomParamKeyInput] = useState("");
  const [customParamValInput, setCustomParamValInput] = useState("");

  // Combo selection states for Admin Product modal
  const [selectedComboDealIdx, setSelectedComboDealIdx] = useState<number>(0);
  const [comboCategoryFilter, setComboCategoryFilter] = useState<string>("all");
  const [comboSubCategoryFilter, setComboSubCategoryFilter] = useState<string>("all");
  const [selectedComboProductId, setSelectedComboProductId] = useState<string>("");

  const categoryHierarchy = useMemo(() => buildCategoryHierarchy(navCategories), [navCategories]);
  const categoryOptions = useMemo(() => {
    const options = uniq(Object.keys(categoryHierarchy));
    return options.length > 0 ? options : fallbackCategoryOptions;
  }, [categoryHierarchy]);
  const defaultCategory = categoryOptions[0] || fallbackCategoryOptions[0];
  const selectedCategorySubCategories = categoryHierarchy[formData.category || defaultCategory] || [];
  const fieldRules = useMemo(() => getCategoryFieldRules(formData.category), [formData.category]);

  // Sub-categories for Combo category filter
  const comboSubCategoryOptionsList = useMemo(() => {
    if (comboCategoryFilter === "all") {
      return uniq(Object.values(categoryHierarchy).flat());
    }
    return categoryHierarchy[comboCategoryFilter] || [];
  }, [comboCategoryFilter, categoryHierarchy]);

  // Catalog items filtered by Combo Category & Sub-Category
  const availableComboProducts = useMemo(() => {
    return items.filter((p) => {
      if (p.id === formData.id || p.id === editingId) return false;
      const matchCat = comboCategoryFilter === "all" || p.category === comboCategoryFilter;
      const matchSubCat = comboSubCategoryFilter === "all" || p.subCategory === comboSubCategoryFilter;
      return matchCat && matchSubCat;
    });
  }, [items, formData.id, editingId, comboCategoryFilter, comboSubCategoryFilter]);

  useEffect(() => {
    if ((activeTab === "variants" && !fieldRules.showVariantSpecs) || (activeTab === "combo" && !fieldRules.showComboProducts)) {
      setActiveTab("basic");
    }
  }, [activeTab, fieldRules.showComboProducts, fieldRules.showVariantSpecs]);

  // Aspect ratio preview state for images
  const [aspectRatioPreview, setAspectRatioPreview] = useState<"1:1" | "4:3" | "16:9">("1:1");

  // Open modal for EDITING product
  const handleOpenEditModal = (product: Product) => {
    setEditingId(product.id);
    setActiveTab("basic");
    setCustomParamKeys({});
    setSelectedComboDealIdx(0);
    setFormData({
      ...product,
      costPrice: product.costPrice ?? product.originalPrice ?? product.price,
      discountPercent: product.discountPercent ?? calculateDiscountPercent(product.originalPrice || product.price, product.price),
      comboDealAvailable: product.comboDealAvailable ?? true,
      comboDeals:
        product.comboDeals && product.comboDeals.length > 0
          ? JSON.parse(JSON.stringify(product.comboDeals))
          : product.comboProductIds && product.comboProductIds.length > 0
          ? [{ id: "cd-1", title: "Combo Deal #1", productIds: [...product.comboProductIds].slice(0, 2) }]
          : [{ id: "cd-1", title: "Combo Deal #1", productIds: [] }],
      aboutSections:
        product.aboutSections && product.aboutSections.length > 0
          ? JSON.parse(JSON.stringify(product.aboutSections))
          : JSON.parse(JSON.stringify(defaultAboutSections)),
      additionalInfoSections:
        product.additionalInfoSections && product.additionalInfoSections.length > 0
          ? JSON.parse(JSON.stringify(product.additionalInfoSections))
          : JSON.parse(JSON.stringify(defaultAdditionalInfo(product))),
    });
    setFeaturesInput(product.features?.join("\n") || "");
    setOpenModal(true);
  };

  // Handle URL Query parameters for searching/editing from Dashboard
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const queryParam = params.get("q") || params.get("sku");
    const editIdParam = params.get("edit");

    if (queryParam) {
      setQ(queryParam);
    }
    if (editIdParam) {
      const prodToEdit = items.find((p) => p.id === editIdParam);
      if (prodToEdit) {
        handleOpenEditModal(prodToEdit);
        setActiveTab("pricing");
      }
    }
  }, [items]);

  // Current sub-categories available based on selected category filter
  const currentSubCategories = useMemo(() => {
    if (categoryFilter === "all") {
      return uniq(Object.values(categoryHierarchy).flat());
    }
    return categoryHierarchy[categoryFilter] || [];
  }, [categoryFilter, categoryHierarchy]);

  // Filtered Products list
  const filteredProducts = useMemo(() => {
    return items.filter((p) => {
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.sku.toLowerCase().includes(q.toLowerCase()) ||
        p.brand?.toLowerCase().includes(q.toLowerCase()) ||
        p.tags?.some((t) => t.toLowerCase().includes(q.toLowerCase()));
      const matchStatus = status === "all" || p.status === status;
      const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
      const matchSubCategory = subCategoryFilter === "all" || p.subCategory === subCategoryFilter;
      const matchTag = tagFilter === "all" || p.tags?.includes(tagFilter);
      return matchQ && matchStatus && matchCategory && matchSubCategory && matchTag;
    });
  }, [items, q, status, categoryFilter, subCategoryFilter, tagFilter]);

  // Open modal for CREATING new product
  const handleOpenNewModal = () => {
    setEditingId(null);
    setActiveTab("basic");
    setCustomParamKeys({});
    const newDefaultCategory = defaultCategory;
    const newDefaultSubCategory = categoryHierarchy[newDefaultCategory]?.[0] || "";
    setFormData({
      name: "",
      sku: `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
      category: newDefaultCategory,
      subCategory: newDefaultSubCategory,
      brand: "",
      gender: "Unisex",
      costPrice: 0,
      discountPercent: 0,
      price: 0,
      originalPrice: 0,
      stock: 10,
      status: "active",
      badge: "",
      image: "",
      images: [],
      rating: 4.5,
      reviewCount: 0,
      tags: ["New Arrival"],
      description: "",
      features: [],
      specs: {},
      colors: [],
      sizes: [],
      codAvailable: true,
      codText: "",
      returnAvailable: true,
      returnText: "",
      exchangeAvailable: true,
      exchangeText: "",
      replacementAvailable: true,
      freeShippingAvailable: true,
      secureCheckout: true,
      officialWarranty: true,
      expressDispatch: true,
      warrantyPeriod: "",
      deliveryEstimate: "",
      aboutSections: JSON.parse(JSON.stringify(defaultAboutSections)),
      additionalInfoSections: defaultAdditionalInfo({
        sku: "",
        name: "",
        brand: "",
        category: newDefaultCategory,
        gender: "Unisex",
      }),
      comboDealAvailable: getCategoryFieldRules(newDefaultCategory).showComboProducts,
      comboDeals: [
        { id: "cd-1", title: "Combo Deal #1", productIds: [] },
      ],
    });
    setSelectedComboDealIdx(0);
    setFeaturesInput("Ultra Durable Build\nHigh Fidelity Performance\n1 Year Warranty");
    setOpenModal(true);
  };

  // Save product handler (Create or Update)
  const handleSaveProduct = async () => {
    if (!formData.name || !formData.sku) {
      toast.error("Product Name and SKU are required");
      setActiveTab("basic");
      return;
    }

    const parsedFeatures = featuresInput
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    const slug = (formData.name || "product").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const comboDeals = fieldRules.showComboProducts ? (formData.comboDeals || []) : [];
        if (!formData.image) {
      toast.error("Please add a primary cover image for this product");
      setActiveTab("media");
      return;
    }
    const payload = { name: formData.name, slug, sku: formData.sku, category: formData.category || defaultCategory, subCategory: formData.subCategory || undefined, brand: formData.brand, gender: formData.gender, costPrice: Number(formData.costPrice) || 0, discountPercent: Number(formData.discountPercent) || 0, price: Number(formData.price) || 0, originalPrice: Number(formData.originalPrice) || 0, stock: Number(formData.stock) || 0, status: formData.status || "active", image: formData.image, images: formData.images || [], description: formData.description, features: parsedFeatures, specs: formData.specs || {}, colors: formData.colors || [], sizes: formData.sizes || [], tags: formData.tags || [], codAvailable: formData.codAvailable ?? true, returnAvailable: formData.returnAvailable ?? true, exchangeAvailable: formData.exchangeAvailable ?? true, warrantyPeriod: formData.warrantyPeriod, comboDealAvailable: fieldRules.showComboProducts ? (formData.comboDealAvailable ?? true) : false, comboDeals, comboProductIds: uniq(comboDeals.flatMap((deal) => deal.productIds || [])) };
    try { if (editingId) {
      // Update existing
      await api(`/admin/products/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) });
      setItems((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? ({
                ...p,
                ...formData,
                features: parsedFeatures,
                costPrice: Number(formData.costPrice) || 0,
                discountPercent: Number(formData.discountPercent) || 0,
                price: Number(formData.price) || 0,
                originalPrice: Number(formData.originalPrice) || 0,
                stock: Number(formData.stock) || 0,
              } as Product)
            : p
        )
      );
      toast.success(`Updated ${formData.name}`);
    } else {
      // Create new
      const maxId = items.reduce((max, p) => {
        const num = parseInt(p.id.replace("P-", ""), 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 1000);
      const newProduct: Product = {
        id: `P-${maxId + 1}`,
        name: formData.name || "New Product",
        sku: formData.sku || `SKU-${Date.now()}`,
        category: formData.category || defaultCategory,
        subCategory: formData.subCategory || undefined,
        brand: formData.brand || "",
        gender: formData.gender || "Unisex",
        costPrice: Number(formData.costPrice) || 0,
        discountPercent: Number(formData.discountPercent) || 0,
        price: Number(formData.price) || 0,
        originalPrice: Number(formData.originalPrice) || 0,
        stock: Number(formData.stock) || 0,
        status: formData.status || "active",
        badge: formData.badge || "",
        image: formData.image || "",
        images: formData.images || [formData.image || ""],
        rating: formData.rating || 4.5,
        reviewCount: formData.reviewCount || 10,
        tags: formData.tags || ["New Arrival"],
        description: formData.description || "",
        features: parsedFeatures,
        specs: formData.specs || {},
        colors: formData.colors || [],
        sizes: formData.sizes || [],
        codAvailable: formData.codAvailable ?? true,
        codText: formData.codText || "",
        returnAvailable: formData.returnAvailable ?? true,
        returnText: formData.returnText || "",
        exchangeAvailable: formData.exchangeAvailable ?? true,
        exchangeText: formData.exchangeText || "",
        replacementAvailable: formData.replacementAvailable ?? true,
        freeShippingAvailable: formData.freeShippingAvailable ?? true,
        secureCheckout: formData.secureCheckout ?? true,
        officialWarranty: formData.officialWarranty ?? true,
        expressDispatch: formData.expressDispatch ?? true,
        warrantyPeriod: formData.warrantyPeriod || "",
        deliveryEstimate: formData.deliveryEstimate || "Delivered in 2-4 Days",
        aboutSections: formData.aboutSections || defaultAboutSections,
        additionalInfoSections: formData.additionalInfoSections && formData.additionalInfoSections.length > 0
          ? formData.additionalInfoSections
          : defaultAdditionalInfo(formData),
        comboDealAvailable: payload.comboDealAvailable,
        comboDeals,
        comboProductIds: payload.comboProductIds,
      };
      const { product: saved } = await api<{ product: Product }>("/admin/products", { method: "POST", body: JSON.stringify(payload) });
      newProduct.id = saved.id;
      setItems([newProduct, ...items]);
      toast.success(`Created product ${newProduct.name}`);
    }

    setOpenModal(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unable to save product";
      toast.error(msg);
      if (msg.toLowerCase().includes("image")) setActiveTab("media");
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    try { await api(`/admin/products/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((p) => p.id !== id));
    toast.error("Product deleted from catalog");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to delete product"); }
  };

  // Toggle Status
  const toggleStatus = async (id: string) => {
    const current = items.find((p) => p.id === id); if (!current) return;
    try { await api(`/admin/products/${id}`, { method: "PATCH", body: JSON.stringify({ status: current.status === "active" ? "draft" : "active" }) });
    setItems((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: p.status === "active" ? "draft" : "active" }
          : p
      )
    );
    toast.success("Product status toggled successfully!");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update product"); }
  };

  // Tag Handlers
  const handleAddTag = (tagToAdd?: string) => {
    const val = (tagToAdd || tagInput).trim();
    if (!val) return;
    const currentTags = formData.tags || [];
    if (!currentTags.includes(val)) {
      setFormData((prev) => ({ ...prev, tags: [...currentTags, val] }));
      toast.success(`Added tag "${val}"`);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((t) => t !== tagToRemove),
    }));
  };

  // Gallery Image Handlers
  const handleAddGalleryImage = () => {
    if (!newImageUrl.trim()) return;
    const current = formData.images || [];
    setFormData((prev) => ({
      ...prev,
      images: [...current, newImageUrl.trim()],
    }));
    if (!formData.image) {
      setFormData((prev) => ({ ...prev, image: newImageUrl.trim() }));
    }
    setNewImageUrl("");
    toast.success("Added image to product gallery");
  };

  const handleRemoveGalleryImage = (idx: number) => {
    const imgUrl = (formData.images || [])[idx];
    const updated = (formData.images || []).filter((_, i) => i !== idx);
    setFormData((prev) => ({
      ...prev,
      images: updated,
      image: prev.image === imgUrl ? (updated[0] || "") : prev.image,
    }));
  };

  // Upload product images to Cloudflare R2 instead of saving base64 image data in MongoDB.
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCover = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const urls = await Promise.all(Array.from(files).map((file) => uploadImage("products", file)));
      if (isCover) {
        setFormData((prev) => ({
          ...prev,
          image: urls[0],
          images: prev.images ? [urls[0], ...prev.images.filter((u) => u !== prev.image)] : [urls[0]],
        }));
        toast.success("Primary cover image uploaded to Cloudflare R2!");
      } else {
        const current = formData.images || [];
        const updated = [...current, ...urls];
        setFormData((prev) => ({
          ...prev,
          images: updated,
          image: prev.image || urls[0],
        }));
        toast.success(`Uploaded ${urls.length} product image(s) to Cloudflare R2!`);
      }
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to upload product images"); }
  };

  // Add Spec Key-Value
  const handleAddSpec = () => {
    if (!specKey || !specValue) return;
    setFormData((prev) => ({
      ...prev,
      specs: { ...prev.specs, [specKey]: specValue },
    }));
    setSpecKey("");
    setSpecValue("");
  };

  // Remove Spec
  const handleRemoveSpec = (key: string) => {
    setFormData((prev) => {
      const nextSpecs = { ...prev.specs };
      delete nextSpecs[key];
      return { ...prev, specs: nextSpecs };
    });
  };

  // Add Color
  const handleAddColor = () => {
    if (!colorName) return;
    setFormData((prev) => ({
      ...prev,
      colors: [...(prev.colors || []), { name: colorName, hex: colorHex }],
    }));
    setColorName("");
  };

  // Add Size
  const handleAddSize = () => {
    if (!sizeInput) return;
    if (!formData.sizes?.includes(sizeInput)) {
      setFormData((prev) => ({
        ...prev,
        sizes: [...(prev.sizes || []), sizeInput],
      }));
    }
    setSizeInput("");
  };

  // Calculated Discount Percentage
  const discountPercent =
    formData.price && formData.originalPrice && formData.originalPrice > formData.price
      ? Math.round(((formData.originalPrice - formData.price) / formData.originalPrice) * 100)
      : 0;

  const handleCostPriceChange = (value: number) => {
    setFormData((prev) => ({
      ...prev,
      costPrice: value,
      price: calculateSellingPrice(value, Number(prev.discountPercent) || 0),
    }));
  };

  const handlePricingDiscountChange = (value: number) => {
    const discount = Math.min(100, Math.max(0, Number(value) || 0));
    setFormData((prev) => ({
      ...prev,
      discountPercent: discount,
      price: calculateSellingPrice(Number(prev.costPrice) || 0, discount),
    }));
  };

  const handleSellingPriceChange = (value: number) => {
    setFormData((prev) => ({
      ...prev,
      price: value,
      discountPercent: calculateDiscountPercent(Number(prev.costPrice) || 0, value),
    }));
  };

  // =========================================================================
  // ADDITIONAL INFORMATION SECTIONS HELPERS
  // =========================================================================
  const getAdditionalInfoSections = (): AdditionalInfoSection[] => {
    return formData.additionalInfoSections && formData.additionalInfoSections.length > 0
      ? formData.additionalInfoSections
      : defaultAdditionalInfo(formData);
  };

  const updateAdditionalInfoSections = (newList: AdditionalInfoSection[]) => {
    setFormData((prev) => ({ ...prev, additionalInfoSections: newList }));
  };

  const handleAddInfoSection = () => {
    const list = [...getAdditionalInfoSections()];
    const newId = `info-sec-${Date.now()}`;
    const newSec: AdditionalInfoSection = {
      id: newId,
      title: "New Accordion Section",
      items: [
        { key: "Parameter Label", value: "Parameter Value" }
      ]
    };
    updateAdditionalInfoSections([...list, newSec]);
    toast.success("Added new info accordion section!");
  };

  const handleUpdateInfoSectionTitle = (index: number, newTitle: string) => {
    const list = [...getAdditionalInfoSections()];
    list[index] = { ...list[index], title: newTitle };
    updateAdditionalInfoSections(list);
  };

  const handleDeleteInfoSection = (index: number) => {
    const list = [...getAdditionalInfoSections()];
    const removed = list.splice(index, 1);
    updateAdditionalInfoSections(list);
    toast.error(`Removed accordion section "${removed[0]?.title}"`);
  };

  const handleAddInfoSpecRow = (sectionIndex: number) => {
    const list = [...getAdditionalInfoSections()];
    const current = [...list[sectionIndex].items];
    list[sectionIndex] = {
      ...list[sectionIndex],
      items: [...current, { key: "New Spec Key", value: "New Spec Value" }]
    };
    updateAdditionalInfoSections(list);
  };

  const handleUpdateInfoSpecRow = (sectionIndex: number, rowIndex: number, key: string, value: string) => {
    const list = [...getAdditionalInfoSections()];
    const current = [...list[sectionIndex].items];
    current[rowIndex] = { key, value };
    list[sectionIndex] = { ...list[sectionIndex], items: current };
    updateAdditionalInfoSections(list);
  };

  const handleRemoveInfoSpecRow = (sectionIndex: number, rowIndex: number) => {
    const list = [...getAdditionalInfoSections()];
    const current = [...list[sectionIndex].items];
    current.splice(rowIndex, 1);
    list[sectionIndex] = { ...list[sectionIndex], items: current };
    updateAdditionalInfoSections(list);
  };

  const handleResetInfoSectionsToDefault = () => {
    updateAdditionalInfoSections(defaultAdditionalInfo(formData));
    toast.success("Reset info accordions to default template!");
  };

  // Helper to render parameter select dropdown with Custom option & custom text field
  const renderParamSelector = (
    label: string,
    paramKey: string,
    options: string[],
    placeholder: string
  ) => {
    const currentValue = formData.specs?.[paramKey] || "";
    const isPredefined = options.includes(currentValue);
    const isCustomMode = Boolean(
      customParamKeys[paramKey] || (!isPredefined && currentValue !== "")
    );
    const selectValue = isCustomMode ? "Custom" : currentValue;

    return (
      <div className="space-y-1">
        <Label className="text-[11px] font-bold text-muted-foreground">{label}</Label>
        <Select
          value={selectValue}
          onValueChange={(val) => {
            if (val === "Custom") {
              setCustomParamKeys((prev) => ({ ...prev, [paramKey]: true }));
              setFormData((prev) => ({
                ...prev,
                specs: { ...(prev.specs || {}), [paramKey]: "" },
              }));
            } else {
              setCustomParamKeys((prev) => ({ ...prev, [paramKey]: false }));
              setFormData((prev) => ({
                ...prev,
                specs: { ...(prev.specs || {}), [paramKey]: val },
              }));
            }
          }}
        >
          <SelectTrigger className="h-8 text-xs font-semibold bg-background">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
            <SelectItem value="Custom" className="font-bold text-amber-600 dark:text-amber-400">
              + Custom Value...
            </SelectItem>
          </SelectContent>
        </Select>

        {isCustomMode && (
          <Input
            placeholder={`Type custom ${label.toLowerCase()}...`}
            value={currentValue}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                specs: { ...(prev.specs || {}), [paramKey]: e.target.value },
              }))
            }
            className="h-7 text-xs font-semibold bg-background mt-1 border-amber-500/50"
          />
        )}
      </div>
    );
  };

  // =========================================================================
  // ABOUT SECTIONS HELPERS
  // =========================================================================
  const getAboutSections = (): AboutProductSection[] => {
    return formData.aboutSections || defaultAboutSections;
  };

  const updateAboutSections = (newList: AboutProductSection[]) => {
    setFormData((prev) => ({ ...prev, aboutSections: newList }));
  };

  const toggleSectionActive = (index: number) => {
    const list = [...getAboutSections()];
    list[index] = { ...list[index], active: !list[index].active };
    updateAboutSections(list);
  };

  const toggleSectionExpanded = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const list = [...getAboutSections()];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    updateAboutSections(list);
  };

  const deleteSection = (index: number) => {
    const list = [...getAboutSections()];
    const removed = list.splice(index, 1);
    updateAboutSections(list);
    toast.error(`Removed section "${removed[0]?.title}"`);
  };

  const addCustomAboutSection = (type: AboutProductSection["type"]) => {
    const list = [...getAboutSections()];
    const id = `sec-custom-${Date.now()}`;

    let newSec: AboutProductSection;
    switch (type) {
      case "about-text":
        newSec = {
          id,
          type: "about-text",
          title: "Custom About Text Section",
          active: true,
          content: {
            heading: "Custom Product Story & Technology",
            description1: "Detailed paragraph describing unique craftsmanship and engineering...",
            description2: "Additional information regarding usability, performance, and features.",
          },
        };
        break;
      case "highlights":
        newSec = {
          id,
          type: "highlights",
          title: "Custom Product Highlights",
          active: true,
          content: {
            items: [
              { title: "Highlight Capability #1", description: "Short description of key benefit." },
              { title: "Highlight Capability #2", description: "Short description of key benefit." },
            ],
          },
        };
        break;
      case "banner":
        newSec = {
          id,
          type: "banner",
          title: "Custom Advertisement Banner",
          active: true,
          content: {
            bannerBadge: "PROMO BANNER",
            bannerTitle: "Engineered for Peak Performance",
            bannerSubtitle: "Upgrade your setup with industry leading design.",
            bannerImage: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1200",
          },
        };
        break;
      case "showcase":
        newSec = {
          id,
          type: "showcase",
          title: "Custom Showcase Slider",
          active: true,
          content: {
            items: [
              { title: "Feature Showcase Slide 1", description: "Visual overview of slide...", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600" },
            ],
          },
        };
        break;
      case "specs-summary":
        newSec = {
          id,
          type: "specs-summary",
          title: "Custom Features & Specs Summary",
          active: true,
          content: {
            items: [{ title: "High-grade premium build quality" }, { title: "1-Year Warranty Coverage" }],
          },
        };
        break;
      case "whats-in-box":
        newSec = {
          id,
          type: "whats-in-box",
          title: "Custom What's Included in Box",
          active: true,
          content: {
            items: [
              { title: "Primary Item", subtitle: "Default", qty: "1×" },
              { title: "User Manual", subtitle: "Guide", qty: "1×" },
            ],
          },
        };
        break;
    }

    list.push(newSec);
    updateAboutSections(list);
    setExpandedSections((prev) => ({ ...prev, [id]: true }));
    toast.success(`Added new ${type} section`);
  };

  const resetAboutSectionsToDefault = () => {
    updateAboutSections(JSON.parse(JSON.stringify(defaultAboutSections)));
    toast.info("Reset about sections to default storefront template");
  };

  const applyTextFormat = (
    sectionIdx: number,
    field: "description1" | "description2",
    format: "bold" | "italic" | "bullet" | "heading"
  ) => {
    const list = [...getAboutSections()];
    const currentVal = list[sectionIdx].content[field] || "";
    let addition = "";
    switch (format) {
      case "bold":
        addition = " **[Bold Text]** ";
        break;
      case "italic":
        addition = " *[Italic Text]* ";
        break;
      case "bullet":
        addition = "\n• [Bullet Point Item]";
        break;
      case "heading":
        addition = "\n### [Subheading Title]\n";
        break;
    }
    list[sectionIdx] = {
      ...list[sectionIdx],
      content: { ...list[sectionIdx].content, [field]: currentVal + addition },
    };
    updateAboutSections(list);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-amber-500" /> Products Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your online store products, customizable detail sections, tags, gallery images, variants and policies.
          </p>
        </div>

        <Button
          onClick={handleOpenNewModal}
          size="sm"
          className="text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
        >
          <Plus className="h-4 w-4" /> Add New Product
        </Button>
      </div>

      {/* Control Bar: Search + Category + Tags + Status + View Toggle */}
      <Card className="border shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by product name, SKU, brand, or tag..."
                className="pl-9 text-xs"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={(val) => {
                setCategoryFilter(val);
                setSubCategoryFilter("all");
              }}>
                <SelectTrigger className="h-9 w-[130px] text-xs font-semibold">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sub-Category Filter */}
              <Select value={subCategoryFilter} onValueChange={setSubCategoryFilter}>
                <SelectTrigger className="h-9 w-[150px] text-xs font-semibold">
                  <SelectValue placeholder="Sub-Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sub-Categories</SelectItem>
                  {currentSubCategories.map((sc) => (
                    <SelectItem key={sc} value={sc}>
                      {sc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Tag Filter */}
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="h-9 w-[130px] text-xs font-semibold">
                  <SelectValue placeholder="Filter Tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {presetTags.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 w-[120px] text-xs font-semibold">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>

              {/* Grid / Table View Switcher */}
              <div className="flex items-center rounded-lg border bg-muted/60 p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 transition-all ${
                    viewMode === "grid"
                      ? "bg-background text-foreground shadow-xs hover:bg-background"
                      : "text-muted-foreground/70 hover:text-foreground hover:bg-transparent"
                  }`}
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 transition-all ${
                    viewMode === "table"
                      ? "bg-background text-foreground shadow-xs hover:bg-background"
                      : "text-muted-foreground/70 hover:text-foreground hover:bg-transparent"
                  }`}
                  onClick={() => setViewMode("table")}
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Content Rendering */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((p) => (
            <Card key={`${p.id}-${p.sku}`} className="group overflow-hidden border shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                {/* Image Container with Badges */}
                <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                    {p.badge && (
                      <Badge className="bg-amber-500 text-slate-950 font-bold text-[9px] px-1.5 py-0 shadow-xs">
                        {p.badge}
                      </Badge>
                    )}
                    <Badge variant="outline" className={`text-[9px] font-extrabold capitalize px-1.5 py-0 ${statusColor[p.status]}`}>
                      {p.status}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-3 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                    <span>{p.sku}</span>
                    <span className="truncate max-w-[100px] text-right">{p.category}</span>
                  </div>

                  <h3 className="font-bold text-xs text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {p.name}
                  </h3>

                  {/* Price & Stock */}
                  <div className="flex items-baseline justify-between pt-0.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-extrabold text-foreground">
                        {formatCurrency(p.price)}
                      </span>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-[10px] text-muted-foreground line-through">
                          {formatCurrency(p.originalPrice)}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold ${p.stock < 10 ? "text-rose-500" : "text-muted-foreground"}`}>
                      Stock: {p.stock}
                    </span>
                  </div>
                </CardContent>
              </div>

              {/* Action Buttons */}
              <CardFooter className="p-2.5 border-t bg-muted/20 flex flex-col gap-1.5">
                <div className="flex items-center justify-between w-full pb-1 border-b border-border/40">
                  <span className="text-[9px] font-bold text-muted-foreground select-none uppercase tracking-wider">
                    Status: {p.status === "active" ? "Active" : "Inactive"}
                  </span>
                  <Switch
                    checked={p.status === "active"}
                    onCheckedChange={() => toggleStatus(p.id)}
                    className="scale-75 origin-right"
                    title={p.status === "active" ? "Deactivate Product" : "Activate Product"}
                  />
                </div>

                <div className="flex items-center justify-between w-full gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditModal(p)}
                    className="h-6 text-[10px] font-bold gap-1 flex-1 px-1.5"
                  >
                    <Edit3 className="h-3 w-3 text-primary" /> Edit
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(`/products/${p.id}`, "_blank")}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="View Details"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteProduct(p.id)}
                    className="h-6 w-6 text-rose-500 hover:bg-rose-500/10"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-bold">Product</TableHead>
                <TableHead className="text-xs font-bold">SKU & Category</TableHead>
                <TableHead className="text-xs font-bold">Price & Discount</TableHead>
                <TableHead className="text-xs font-bold">Inventory</TableHead>
                <TableHead className="text-xs font-bold">Status</TableHead>
                <TableHead className="text-xs font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((p) => (
                <TableRow key={`${p.id}-${p.sku}`}>
                  <TableCell>
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-cover border shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-foreground truncate">{p.name}</h4>
                        <span className="text-[10px] text-muted-foreground">{p.brand}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    <div>{p.sku}</div>
                    <span className="text-[10px] text-muted-foreground">{p.category}</span>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-xs">{formatCurrency(p.price)}</div>
                    {p.originalPrice && <div className="text-[10px] text-muted-foreground line-through">{formatCurrency(p.originalPrice)}</div>}
                  </TableCell>
                  <TableCell className="text-xs font-bold">{p.stock} units</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={p.status === "active"}
                        onCheckedChange={() => toggleStatus(p.id)}
                        className="scale-75"
                        title={p.status === "active" ? "Deactivate" : "Activate"}
                      />
                      <Badge variant="outline" className={`text-[10px] capitalize font-extrabold ${statusColor[p.status]}`}>
                        {p.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => window.open(`/products/${p.id}`, "_blank")}
                        title="View Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEditModal(p)}>
                        <Edit3 className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500" onClick={() => handleDeleteProduct(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* FULLY FLEXIBLE ADD / EDIT STOREFRONT PRODUCT MODAL DIALOG */}
      {/* ========================================================================= */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent
          className="max-w-4xl max-h-[92vh] flex flex-col p-0 border shadow-2xl overflow-hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          {/* Modal Header */}
          <DialogHeader className="p-5 border-b bg-muted/20 shrink-0">
            <div className="flex items-center justify-between pr-6">
              <div>
                <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
                  <Package className="h-5 w-5 text-amber-500" />
                  {editingId ? `Edit Storefront Product (${formData.sku})` : "Create New Storefront Product"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Configure all product parameters, customizable landing page about sections, tags, gallery and variant matrices.
                </DialogDescription>
              </div>

              {formData.status && (
                <Badge variant="outline" className={`text-xs font-extrabold capitalize ${statusColor[formData.status]}`}>
                  {formData.status}
                </Badge>
              )}
            </div>
          </DialogHeader>

          {/* Modal Body with Scrollable Tabbed Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
            {/* Sticky Tab Bar */}
            <div className="shrink-0 px-5 pt-4 pb-0 border-b bg-background">
              <TabsList className="flex items-center justify-start gap-1.5 w-full h-auto p-1.5 pb-2 bg-slate-100 dark:bg-slate-900/80 border rounded-2xl overflow-x-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
                <TabsTrigger
                  value="basic"
                  className="text-xs font-bold py-2.5 px-3.5 gap-2 rounded-xl transition-all shrink-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
                >
                  <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span className="whitespace-nowrap">Basic Info</span>
                </TabsTrigger>
                <TabsTrigger
                  value="pricing"
                  className="text-xs font-bold py-2.5 px-3.5 gap-2 rounded-xl transition-all shrink-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
                >
                  <IndianRupee className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className="whitespace-nowrap">Pricing & Stock</span>
                </TabsTrigger>
                <TabsTrigger
                  value="tags"
                  className="text-xs font-bold py-2.5 px-3.5 gap-2 rounded-xl transition-all shrink-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
                >
                  <Tag className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                  <span className="whitespace-nowrap">Tags & Badges</span>
                </TabsTrigger>
                <TabsTrigger
                  value="media"
                  className="text-xs font-bold py-2.5 px-3.5 gap-2 rounded-xl transition-all shrink-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span className="whitespace-nowrap">Media & Gallery</span>
                </TabsTrigger>
                {fieldRules.showVariantSpecs && (
                  <TabsTrigger
                    value="variants"
                    className="text-xs font-bold py-2.5 px-3.5 gap-2 rounded-xl transition-all shrink-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
                  >
                    <Sliders className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    <span className="whitespace-nowrap">Variants & Specs</span>
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="sections"
                  className="text-xs font-bold py-2.5 px-3.5 gap-2 rounded-xl transition-all shrink-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
                >
                  <Layers className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                  <span className="whitespace-nowrap">About Sections</span>
                </TabsTrigger>
                <TabsTrigger
                  value="policies"
                  className="text-xs font-bold py-2.5 px-3.5 gap-2 rounded-xl transition-all shrink-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                  <span className="whitespace-nowrap">Additional Info</span>
                </TabsTrigger>
                {fieldRules.showComboProducts && (
                  <TabsTrigger
                    value="combo"
                    className="text-xs font-bold py-2.5 px-3.5 gap-2 rounded-xl transition-all shrink-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span className="whitespace-nowrap">Combo Products</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* Scrollable Tab Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* TAB 1: BASIC INFORMATION */}
              <TabsContent value="basic" className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Product Title */}
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs font-bold text-foreground">Product Title Name *</Label>
                    <Input
                      placeholder="e.g. Aurora Studio Wireless ANC Headphones"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="text-xs font-bold"
                    />
                  </div>

                  {/* SKU */}
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">SKU / Code *</Label>
                    <Input
                      placeholder="SKU-84291"
                      value={formData.sku || ""}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="text-xs font-mono"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">Category *</Label>
                    <Select
                      value={formData.category || defaultCategory}
                      onValueChange={(val) => setFormData({
                        ...formData,
                        category: val,
                        subCategory: categoryHierarchy[val]?.[0] || "",
                        comboDealAvailable: getCategoryFieldRules(val).showComboProducts,
                      })}
                    >
                      <SelectTrigger className="text-xs font-semibold">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sub-Category */}
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">Sub-Category</Label>
                    <Select
                      value={formData.subCategory || ""}
                      disabled={selectedCategorySubCategories.length === 0}
                      onValueChange={(val) => setFormData({ ...formData, subCategory: val })}
                    >
                      <SelectTrigger className="text-xs font-semibold">
                        <SelectValue placeholder="Select Sub-Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedCategorySubCategories.map((sc) => (
                          <SelectItem key={sc} value={sc}>
                            {sc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Brand Name */}
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">Brand Name</Label>
                    <Input
                      placeholder="e.g. Your Brand / Sony / Nike"
                      value={formData.brand || ""}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  {/* Gender / Audience */}
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">Target Audience / Gender</Label>
                    <Select
                      value={formData.gender || "Unisex"}
                      onValueChange={(val) => setFormData({ ...formData, gender: val as any })}
                    >
                      <SelectTrigger className="text-xs font-semibold">
                        <SelectValue placeholder="Select Target" />
                      </SelectTrigger>
                      <SelectContent>
                        {genderOptions.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category-Specific Filter Parameters Card */}
                  <div className="space-y-3 sm:col-span-2 p-4 rounded-xl border bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-extrabold text-foreground flex items-center gap-2">
                        <Sliders className="h-4 w-4 text-amber-500" />
                        Category Filter Parameters ({formData.category || defaultCategory})
                      </Label>
                      <Badge variant="outline" className="text-[10px] font-bold bg-background">
                        Auto-linked to Storefront Top Filters
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Configure secondary filter parameters for this product. These options will power the storefront top filter bar.
                    </p>

                    {/* FOOTWEAR PARAMETERS */}
                    {formData.category === "Footwear" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                        {renderParamSelector("Material", "Materials", ["Mesh", "Canvas", "Leather", "PU", "Suede", "Synthetic", "Textile"], "Select Material")}
                        {renderParamSelector("Fastening", "Fastening", ["Lace-Up", "Slip-On", "Velcro", "Buckle"], "Select Fastening")}
                        {renderParamSelector("Cushioning", "Cushioning", ["Soft", "Medium", "High Responsive", "Firm"], "Select Cushioning")}
                        {renderParamSelector("Arch Type", "Arch Type", ["Flat Arch", "Medium Arch", "High Arch"], "Select Arch Type")}
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-muted-foreground">Country of Origin</Label>
                          <Input
                            placeholder="e.g. India / Vietnam"
                            value={formData.specs?.["Country of Origin"] || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                specs: { ...(formData.specs || {}), "Country of Origin": e.target.value },
                              })
                            }
                            className="h-8 text-xs font-semibold bg-background"
                          />
                        </div>
                      </div>
                    )}

                    {/* AUDIO PARAMETERS */}
                    {formData.category === "Audio" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                        {renderParamSelector("Connectivity", "Connectivity", ["Bluetooth 5.3", "Wired 3.5mm", "2.4GHz Wireless", "Type-C Audio"], "Select Connectivity")}
                        {renderParamSelector("Noise Cancellation", "Noise Cancellation", ["Active (ANC)", "Environmental (ENC)", "Passive Noise Isolation"], "Select ANC Type")}
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-muted-foreground">Battery Backup</Label>
                          <Input
                            placeholder="e.g. Up to 35 Hours"
                            value={formData.specs?.["Battery Backup"] || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                specs: { ...(formData.specs || {}), "Battery Backup": e.target.value },
                              })
                            }
                            className="h-8 text-xs font-semibold bg-background"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-muted-foreground">Driver Size</Label>
                          <Input
                            placeholder="e.g. 40mm Beryllium Dynamic"
                            value={formData.specs?.["Driver Size"] || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                specs: { ...(formData.specs || {}), "Driver Size": e.target.value },
                              })
                            }
                            className="h-8 text-xs font-semibold bg-background"
                          />
                        </div>
                        {renderParamSelector("Water Resistance", "Water Resistance", ["IPX4 Splashproof", "IPX7 Waterproof", "Sweat Resistant"], "Select Rating")}
                      </div>
                    )}

                    {/* APPAREL PARAMETERS */}
                    {formData.category === "Apparel" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                        {renderParamSelector("Fabric / Material", "Fabric", ["100% Cotton", "Polyester Blend", "Dry-Fit Mesh", "Fleece"], "Select Fabric")}
                        {renderParamSelector("Fit Type", "Fit", ["Regular Fit", "Slim Fit", "Oversized", "Athletic Fit"], "Select Fit")}
                        {renderParamSelector("Neck Type", "Neck Type", ["Round Neck", "Polo Collar", "V-Neck", "Hooded"], "Select Neck")}
                        {renderParamSelector("Sleeve Length", "Sleeve", ["Half Sleeve", "Full Sleeve", "Sleeveless"], "Select Sleeve")}
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-muted-foreground">Pattern</Label>
                          <Input
                            placeholder="e.g. Solid Color / Graphic Print"
                            value={formData.specs?.["Pattern"] || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                specs: { ...(formData.specs || {}), Pattern: e.target.value },
                              })
                            }
                            className="h-8 text-xs font-semibold bg-background"
                          />
                        </div>
                      </div>
                    )}

                    {/* ELECTRONICS PARAMETERS */}
                    {formData.category === "Electronics" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                        {renderParamSelector("Display Type", "Display", ["AMOLED", "Retina OLED", "IPS LCD", "HD Curved"], "Select Display")}
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-muted-foreground">Battery Life</Label>
                          <Input
                            placeholder="e.g. 14+ Days Active"
                            value={formData.specs?.["Battery"] || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                specs: { ...(formData.specs || {}), Battery: e.target.value },
                              })
                            }
                            className="h-8 text-xs font-semibold bg-background"
                          />
                        </div>
                        {renderParamSelector("OS Compatibility", "Compatibility", ["iOS & Android", "Windows Compatible", "Universal"], "Select Compatibility")}
                      </div>
                    )}

                    {/* OTHER / DEFAULT CATEGORIES */}
                    {!["Footwear", "Audio", "Apparel", "Electronics"].includes(formData.category || "") && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-muted-foreground">Material</Label>
                          <Input
                            placeholder="e.g. Canvas / Nylon / Leather"
                            value={formData.specs?.["Material"] || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                specs: { ...(formData.specs || {}), Material: e.target.value },
                              })
                            }
                            className="h-8 text-xs font-semibold bg-background"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-muted-foreground">Capacity / Size</Label>
                          <Input
                            placeholder="e.g. 25 Liters / Standard"
                            value={formData.specs?.["Capacity"] || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                specs: { ...(formData.specs || {}), Capacity: e.target.value },
                              })
                            }
                            className="h-8 text-xs font-semibold bg-background"
                          />
                        </div>
                      </div>
                    )}

                    {/* CUSTOM PARAMETERS & OPTIONS BUILDER */}
                    <div className="pt-3 border-t space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                          <Plus className="h-3.5 w-3.5 text-amber-500" />
                          Add Custom Parameters & Multiple Options
                        </Label>
                        <span className="text-[10px] text-muted-foreground">
                          Support multiple option values separated by commas
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end bg-background/80 p-2.5 rounded-lg border">
                        <div className="sm:col-span-2 space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground">Parameter Name</Label>
                          <Input
                            placeholder="e.g. Sole Material / Waterproofing"
                            value={customParamKeyInput}
                            onChange={(e) => setCustomParamKeyInput(e.target.value)}
                            className="h-8 text-xs font-semibold bg-background"
                          />
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold text-muted-foreground">Parameter Options / Values</Label>
                            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">Use commas for multiple</span>
                          </div>
                          <Input
                            placeholder="e.g. EVA Foam, Rubber Cleats, TPU"
                            value={customParamValInput}
                            onChange={(e) => setCustomParamValInput(e.target.value)}
                            className="h-8 text-xs font-semibold bg-background"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={() => {
                            const k = customParamKeyInput.trim();
                            const v = customParamValInput.trim();
                            if (!k || !v) {
                              toast.error("Please enter both Parameter Name and Options");
                              return;
                            }
                            setFormData((prev) => ({
                              ...prev,
                              specs: { ...(prev.specs || {}), [k]: v },
                            }));
                            setCustomParamKeyInput("");
                            setCustomParamValInput("");
                            toast.success(`Added parameter "${k}" with ${v.split(",").length} option(s)`);
                          }}
                          size="sm"
                          className="h-8 text-xs font-bold gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Options
                        </Button>
                      </div>

                      {/* Display Active Specs & Custom Parameters */}
                      {formData.specs && Object.keys(formData.specs).length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <Label className="text-[11px] font-bold text-muted-foreground">Active Filter Parameters ({Object.keys(formData.specs).length})</Label>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(formData.specs).map(([k, v]) => {
                              const optionsList = v.split(",").map((s) => s.trim()).filter(Boolean);

                              return (
                                <div
                                  key={k}
                                  className="flex items-center gap-1.5 px-2.5 py-1 bg-background border rounded-lg text-xs font-medium shadow-2xs flex-wrap"
                                >
                                  <span className="font-bold text-slate-900 dark:text-slate-100">{k}:</span>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {optionsList.map((opt) => (
                                      <span
                                        key={opt}
                                        className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/20 text-[10px]"
                                      >
                                        {opt}
                                      </span>
                                    ))}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData((prev) => {
                                        const next = { ...(prev.specs || {}) };
                                        delete next[k];
                                        return { ...prev, specs: next };
                                      });
                                      toast.info(`Removed "${k}"`);
                                    }}
                                    className="text-slate-400 hover:text-rose-500 ml-1 transition-colors"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Switcher */}
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs font-bold text-foreground block">Publishing Status</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "active", label: "Publish Product", desc: "Visible on the website" },
                        { id: "draft", label: "Draft Product", desc: "Saved in the dashboard" },
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, status: st.id as any })}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            formData.status === st.id
                              ? "border-primary bg-primary/10 ring-1 ring-primary"
                              : "bg-background hover:bg-muted/40"
                          }`}
                        >
                          <span className="text-xs font-bold block text-foreground">{st.label}</span>
                          <span className="text-[10px] text-muted-foreground block">{st.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Short & Detailed Description */}
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs font-bold text-foreground">Product Description</Label>
                    <Textarea
                      rows={3}
                      placeholder="Write a clear, enticing overview of the product for customers..."
                      value={formData.description || ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: PRICING & INVENTORY */}
              <TabsContent value="pricing" className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Current Cost */}
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">Current Cost</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">INR</span>
                      <Input
                        type="number"
                        placeholder="2500"
                        value={formData.costPrice ?? ""}
                        onChange={(e) => handleCostPriceChange(Number(e.target.value))}
                        className="pl-11 text-xs font-bold"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Base amount used for auto-calculating Selling Price.</p>
                  </div>

                  {/* Discount Percent */}
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">Discount %</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="20"
                        value={formData.discountPercent ?? ""}
                        onChange={(e) => handlePricingDiscountChange(Number(e.target.value))}
                        className="pr-8 text-xs font-bold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">%</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Changing this updates Selling Price automatically.</p>
                  </div>

                  {/* Selling Price */}
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">Selling Price (₹) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        placeholder="1999"
                        value={formData.price ?? ""}
                        onChange={(e) => handleSellingPriceChange(Number(e.target.value))}
                        className="pl-7 text-xs font-bold"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Auto-calculated from Current Cost and Discount %, with manual override.</p>
                  </div>

                  {/* Compare At Price (MRP) */}
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">Original Price / MRP (₹)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        placeholder="2999"
                        value={formData.originalPrice ?? ""}
                        onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                        className="pl-7 text-xs"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Display crossed-out MRP price.</p>
                  </div>

                  {/* Calculated Discount Card */}
                  {discountPercent > 0 && (
                    <div className="sm:col-span-2 p-3 rounded-lg border bg-emerald-500/10 border-emerald-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          Automated Storefront Discount: {discountPercent}% OFF
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        Customer saves {formatCurrency((formData.originalPrice || 0) - (formData.price || 0))}
                      </span>
                    </div>
                  )}

                  {/* Stock Quantity */}
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">Available Inventory Stock *</Label>
                    <Input
                      type="number"
                      placeholder="25"
                      value={formData.stock ?? ""}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="text-xs font-bold"
                    />
                  </div>

                  {/* Stock Status Indicator */}
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">Stock Status Preview</Label>
                    <div className="h-9 px-3 border rounded-md flex items-center gap-2 bg-muted/20">
                      <div className={`h-2.5 w-2.5 rounded-full ${formData.stock && formData.stock > 5 ? "bg-emerald-500" : "bg-rose-500"}`} />
                      <span className="text-xs font-bold">
                        {formData.stock && formData.stock > 5 ? "In Stock (Ready to Ship)" : "Low Stock Alert"}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 3: TAGS & MARKETING BADGES */}
              <TabsContent value="tags" className="space-y-5 pt-1">
                <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
                  <div>
                    <Label className="text-xs font-bold text-foreground block">
                      Product Search & Filtering Tags
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Add keywords, features, or promotional tags to help shoppers filter and find this product across the storefront.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Type custom tag (e.g. NoiseCancelling) and press Enter..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="text-xs"
                    />
                    <Button type="button" size="sm" onClick={() => handleAddTag()} className="text-xs font-bold shrink-0">
                      + Add Tag
                    </Button>
                  </div>

                  {/* Current Active Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {formData.tags?.map((t) => (
                      <Badge key={t} className="bg-primary text-primary-foreground font-bold text-xs py-1 px-2.5 gap-1.5 shadow-2xs">
                        <span>{t}</span>
                        <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-rose-300 font-bold">
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>

                  {/* Quick Preset Tags Picker */}
                  <div className="pt-2 space-y-1 border-t">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Quick Add Popular Tags:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {presetTags.map((pt) => {
                        const isSelected = formData.tags?.includes(pt);
                        return (
                          <button
                            key={pt}
                            type="button"
                            onClick={() => (isSelected ? handleRemoveTag(pt) : handleAddTag(pt))}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all ${
                              isSelected
                                ? "bg-amber-500 text-slate-950 border-amber-500"
                                : "bg-background hover:bg-muted text-muted-foreground"
                            }`}
                          >
                            {isSelected ? `✓ ${pt}` : `+ ${pt}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Promotional Badge Ribbon */}
                <div className="space-y-2 p-4 rounded-xl border">
                  <Label className="text-xs font-bold text-foreground block">Promotional Ribbon Badge</Label>
                  <Input
                    placeholder="e.g. BEST SELLER / 30% OFF / NEW ARRIVAL"
                    value={formData.badge || ""}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="text-xs font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground">Highlight ribbon badge displayed over the product card cover image.</p>
                </div>
              </TabsContent>

              {/* TAB 4: MEDIA & GALLERY IMAGES */}
              <TabsContent value="media" className="space-y-4 pt-1">
                {/* Image URL / Local Upload Bar */}
                <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
                  <Label className="text-xs font-bold text-foreground block">
                    Upload & Add Product Photos
                  </Label>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    {/* Device Upload Button */}
                    <label className="cursor-pointer shrink-0 w-full sm:w-auto">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileUpload(e, false)}
                        className="sr-only"
                      />
                      <span className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:bg-primary/90 w-full transition-colors">
                        <Upload className="h-4 w-4" /> Upload from Computer / Mobile
                      </span>
                    </label>

                    <div className="relative flex-1 w-full">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Or paste direct image URL (e.g. https://images.unsplash.com/...)"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="pl-8 text-xs bg-background"
                      />
                    </div>
                    <Button type="button" size="sm" onClick={handleAddGalleryImage} className="text-xs font-bold shrink-0 w-full sm:w-auto">
                      + Add URL to Gallery
                    </Button>
                  </div>
                </div>

                {/* Primary Cover Image Bar */}
                <div className="p-4 rounded-xl border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold text-foreground block">
                        Primary Cover Image (Default Display)
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        The main image displayed on storefront cards, search results, and cart items.
                      </p>
                    </div>

                    <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-muted/40">
                      <span className="text-[10px] font-bold px-2 text-muted-foreground">Preview Ratio:</span>
                      {(["1:1", "4:3", "16:9"] as const).map((ratio) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => setAspectRatioPreview(ratio)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            aspectRatioPreview === ratio
                              ? "bg-primary text-primary-foreground shadow-2xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.image ? (
                    <div className="flex flex-col sm:flex-row items-start gap-4 p-3 rounded-lg border bg-muted/10">
                      <div className={`relative rounded-lg overflow-hidden border bg-background shrink-0 transition-all ${
                        aspectRatioPreview === "1:1"
                          ? "h-32 w-32"
                          : aspectRatioPreview === "4:3"
                          ? "h-32 w-40"
                          : "h-28 w-48"
                      }`}>
                        <img src={formData.image} alt="Primary cover" className="h-full w-full object-cover" />
                        <Badge className="absolute bottom-1.5 left-1.5 text-[9px] bg-slate-950/80 text-white font-extrabold px-1.5 py-0.5">
                          ★ Primary Cover ({aspectRatioPreview})
                        </Badge>
                      </div>

                      <div className="space-y-2 flex-1 min-w-0">
                        <Input
                          value={formData.image}
                          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                          className="text-xs font-mono bg-background"
                        />

                        <div className="flex items-center gap-2 pt-1">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, true)}
                              className="sr-only"
                            />
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-xs font-bold bg-background hover:bg-muted/50 transition-colors">
                              <Upload className="h-3.5 w-3.5 text-primary" /> Replace Cover from Device
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 border border-dashed rounded-lg text-center space-y-2 bg-muted/10">
                      <ImageLucide className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-xs text-muted-foreground font-medium">No primary cover image set yet.</p>
                    </div>
                  )}
                </div>

                {/* Gallery Photos Grid */}
                <div className="p-4 rounded-xl border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold text-foreground block">
                        Product Gallery Photos ({formData.images?.length || 0})
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Hover any photo to set as Primary Cover Image, copy URL, or remove.
                      </p>
                    </div>

                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileUpload(e, false)}
                        className="sr-only"
                      />
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-xs transition-colors">
                        <Plus className="h-3.5 w-3.5" /> Upload More Photos
                      </span>
                    </label>
                  </div>

                  {(!formData.images || formData.images.length === 0) ? (
                    <div className="p-8 border border-dashed rounded-xl text-center space-y-2 bg-muted/10">
                      <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto" />
                      <h4 className="text-xs font-bold">Gallery is Empty</h4>
                      <p className="text-[11px] text-muted-foreground">
                        Upload photo files or add web URLs above to populate your storefront image gallery.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {formData.images.map((imgUrl, i) => {
                        const isCover = formData.image === imgUrl;
                        return (
                          <div
                            key={i}
                            className={`group relative rounded-xl border overflow-hidden bg-background transition-all hover:shadow-md ${
                              isCover ? "ring-2 ring-amber-500 border-amber-500" : ""
                            } ${
                              aspectRatioPreview === "1:1"
                                ? "aspect-square"
                                : aspectRatioPreview === "4:3"
                                ? "aspect-[4/3]"
                                : "aspect-video"
                            }`}
                          >
                            <img src={imgUrl} alt={`Gallery ${i}`} className="h-full w-full object-cover" />

                            {isCover && (
                              <span className="absolute top-2 left-2 z-10 text-[9px] font-extrabold bg-amber-500 text-slate-950 px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                                ★ Cover Photo
                              </span>
                            )}

                            <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between z-20">
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveGalleryImage(i)}
                                  className="h-6 w-6 rounded-full bg-rose-600 text-white flex items-center justify-center hover:scale-110 transition-transform"
                                  title="Remove Photo"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              <div className="space-y-1">
                                {!isCover && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData((prev) => ({ ...prev, image: imgUrl }));
                                      toast.success("Set as Primary Cover Image!");
                                    }}
                                    className="w-full py-1 px-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold flex items-center justify-center gap-1 shadow-xs"
                                  >
                                    <Star className="h-3 w-3 fill-current" /> Set as Cover
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(imgUrl);
                                    toast.success("Copied image URL to clipboard!");
                                  }}
                                  className="w-full py-1 px-2 rounded bg-background/80 hover:bg-background text-foreground text-[10px] font-semibold flex items-center justify-center gap-1"
                                >
                                  <LinkIcon className="h-3 w-3" /> Copy URL
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* TAB 5: VARIANTS & SPECS */}
              {fieldRules.showVariantSpecs && (
              <TabsContent value="variants" className="space-y-5 pt-1">
                {/* Color Swatches */}
                <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
                  <Label className="text-xs font-bold text-foreground block">Color Swatch Variants</Label>

                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Color Name (e.g. Midnight Black)"
                      className="text-xs"
                      value={colorName}
                      onChange={(e) => setColorName(e.target.value)}
                    />
                    <input
                      type="color"
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded border shrink-0"
                    />
                    <Button type="button" size="sm" onClick={handleAddColor} className="text-xs font-bold shrink-0">
                      + Add Color
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {formData.colors?.map((c, i) => (
                      <Badge key={i} variant="outline" className="text-xs font-bold py-1 px-2.5 gap-2 bg-background border">
                        <span className="h-3 w-3 rounded-full border shadow-2xs inline-block" style={{ backgroundColor: c.hex }} />
                        <span>{c.name}</span>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Size Options */}
                <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
                  <Label className="text-xs font-bold text-foreground block">Size Options</Label>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Size Tag (e.g. S, M, L, XL, 42, 44)"
                      className="text-xs"
                      value={sizeInput}
                      onChange={(e) => setSizeInput(e.target.value)}
                    />
                    <Button type="button" size="sm" onClick={handleAddSize} className="text-xs font-bold shrink-0">
                      + Add Size
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {formData.sizes?.map((sz, i) => (
                      <Badge key={i} className="bg-amber-500 text-slate-950 font-bold text-xs py-1 px-2">
                        {sz}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Technical Specifications Matrix */}
                <div className="space-y-3 p-4 rounded-xl border">
                  <div>
                    <Label className="text-xs font-bold text-foreground block">Technical Specifications Matrix</Label>
                    <p className="text-[11px] text-muted-foreground">Add key hardware specs displayed on the product detail page.</p>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Spec Key (e.g. Battery Life)"
                      className="text-xs"
                      value={specKey}
                      onChange={(e) => setSpecKey(e.target.value)}
                    />
                    <Input
                      placeholder="Spec Value (e.g. 35 Hours)"
                      className="text-xs"
                      value={specValue}
                      onChange={(e) => setSpecValue(e.target.value)}
                    />
                    <Button type="button" size="sm" onClick={handleAddSpec} className="text-xs font-bold shrink-0">
                      + Add Spec
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {Object.entries(formData.specs || {}).map(([k, v]) => (
                      <Badge key={k} variant="secondary" className="text-xs font-mono py-1 px-2.5 gap-1.5 bg-background border">
                        <span className="font-semibold text-foreground">{k}:</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">{v}</span>
                        <button type="button" onClick={() => handleRemoveSpec(k)} className="ml-1 text-slate-400 hover:text-rose-500 font-bold">
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
              )}

              {/* ========================================================================= */}
              {/* TAB 6: FULLY ENHANCED DETAIL PAGE ABOUT SECTIONS EDITOR */}
              {/* ========================================================================= */}
              <TabsContent value="sections" className="space-y-5 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-muted/20">
                  <div>
                    <Label className="text-sm font-extrabold text-foreground flex items-center gap-2">
                      <Layers className="h-4 w-4 text-amber-500" /> Product Detail Page Sections
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Product detail page sections content modification options.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetAboutSectionsToDefault}
                    className="text-xs font-bold gap-1 text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reset Default Template
                  </Button>
                </div>

                {/* List of Collapsible Section Cards */}
                <div className="space-y-4">
                  {getAboutSections().map((sec, idx) => {
                    const isExpanded = expandedSections[sec.id] ?? false;

                    return (
                      <div
                        key={sec.id}
                        className={`rounded-xl border transition-all overflow-hidden bg-card ${
                          sec.active ? "border-border shadow-2xs" : "border-dashed opacity-75 bg-muted/20"
                        }`}
                      >
                        {/* Section Card Header */}
                        <div className="p-3 bg-muted/30 border-b flex items-center justify-between gap-3 select-none">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Move Up/Down Controls */}
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveSection(idx, "up")}
                                className="h-6 w-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center justify-center"
                                title="Move Up"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === getAboutSections().length - 1}
                                onClick={() => moveSection(idx, "down")}
                                className="h-6 w-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center justify-center"
                                title="Move Down"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleSectionExpanded(sec.id)}
                              className="flex items-center gap-2 text-left min-w-0 group"
                            >
                              <span className="text-xs font-extrabold text-foreground truncate group-hover:text-primary transition-colors">
                                {sec.title}
                              </span>
                              <Badge variant="outline" className="text-[9px] font-mono uppercase shrink-0 font-bold">
                                {sec.type}
                              </Badge>
                            </button>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Active Toggle Switch */}
                            <button
                              type="button"
                              onClick={() => toggleSectionActive(idx)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 transition-all ${
                                sec.active
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                  : "bg-muted text-muted-foreground border-border"
                              }`}
                            >
                              {sec.active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                              <span>{sec.active ? "Active" : "Disabled"}</span>
                            </button>

                            {/* Expand / Collapse Icon */}
                            <button
                              type="button"
                              onClick={() => toggleSectionExpanded(sec.id)}
                              className="h-7 w-7 rounded-lg border bg-background hover:bg-muted text-foreground flex items-center justify-center"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>

                            {/* Delete Section */}
                            <button
                              type="button"
                              onClick={() => deleteSection(idx)}
                              className="h-7 w-7 rounded-lg text-rose-500 hover:bg-rose-500/10 flex items-center justify-center"
                              title="Delete Section"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Section Body & Content Editor */}
                        {isExpanded && (
                          <div className="p-4 space-y-4 text-xs border-t bg-background">
                            {/* Section Title Rename */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-[11px] font-bold text-foreground">Internal Section Title</Label>
                                <Input
                                  value={sec.title}
                                  onChange={(e) => {
                                    const list = [...getAboutSections()];
                                    list[idx] = { ...list[idx], title: e.target.value };
                                    updateAboutSections(list);
                                  }}
                                  className="text-xs"
                                />
                              </div>
                            </div>

                            {/* ================= TYPE 1: ABOUT TEXT ================= */}
                            {sec.type === "about-text" && (
                              <div className="space-y-3 pt-2 border-t">
                                <div className="space-y-1">
                                  <Label className="text-[11px] font-bold text-foreground">Section Main Heading</Label>
                                  <Input
                                    placeholder="e.g. Designed for Excellence. Engineered for Performance."
                                    value={sec.content.heading || ""}
                                    onChange={(e) => {
                                      const list = [...getAboutSections()];
                                      list[idx] = {
                                        ...list[idx],
                                        content: { ...list[idx].content, heading: e.target.value },
                                      };
                                      updateAboutSections(list);
                                    }}
                                    className="text-xs font-bold"
                                  />
                                </div>

                                {/* Rich Description 1 with formatting toolbar */}
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-[11px] font-bold text-foreground">Primary Description Paragraph</Label>
                                    <div className="flex items-center gap-1 border rounded p-0.5 bg-muted/40">
                                      <button type="button" onClick={() => applyTextFormat(idx, "description1", "bold")} className="p-1 hover:bg-background rounded" title="Add Bold"><Bold className="h-3 w-3" /></button>
                                      <button type="button" onClick={() => applyTextFormat(idx, "description1", "italic")} className="p-1 hover:bg-background rounded" title="Add Italic"><Italic className="h-3 w-3" /></button>
                                      <button type="button" onClick={() => applyTextFormat(idx, "description1", "bullet")} className="p-1 hover:bg-background rounded" title="Add Bullet Point"><ListOrdered className="h-3 w-3" /></button>
                                      <button type="button" onClick={() => applyTextFormat(idx, "description1", "heading")} className="p-1 hover:bg-background rounded" title="Add Subheading"><Type className="h-3 w-3" /></button>
                                    </div>
                                  </div>
                                  <Textarea
                                    rows={3}
                                    placeholder="Write rich paragraph content detailing technology, comfort, and build..."
                                    value={sec.content.description1 || ""}
                                    onChange={(e) => {
                                      const list = [...getAboutSections()];
                                      list[idx] = {
                                        ...list[idx],
                                        content: { ...list[idx].content, description1: e.target.value },
                                      };
                                      updateAboutSections(list);
                                    }}
                                    className="text-xs"
                                  />
                                </div>

                                {/* Rich Description 2 */}
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-[11px] font-bold text-foreground">Secondary Description Paragraph</Label>
                                    <div className="flex items-center gap-1 border rounded p-0.5 bg-muted/40">
                                      <button type="button" onClick={() => applyTextFormat(idx, "description2", "bold")} className="p-1 hover:bg-background rounded" title="Add Bold"><Bold className="h-3 w-3" /></button>
                                      <button type="button" onClick={() => applyTextFormat(idx, "description2", "italic")} className="p-1 hover:bg-background rounded" title="Add Italic"><Italic className="h-3 w-3" /></button>
                                      <button type="button" onClick={() => applyTextFormat(idx, "description2", "bullet")} className="p-1 hover:bg-background rounded" title="Add Bullet Point"><ListOrdered className="h-3 w-3" /></button>
                                    </div>
                                  </div>
                                  <Textarea
                                    rows={3}
                                    placeholder="Write secondary details..."
                                    value={sec.content.description2 || ""}
                                    onChange={(e) => {
                                      const list = [...getAboutSections()];
                                      list[idx] = {
                                        ...list[idx],
                                        content: { ...list[idx].content, description2: e.target.value },
                                      };
                                      updateAboutSections(list);
                                    }}
                                    className="text-xs"
                                  />
                                </div>
                              </div>
                            )}

                            {/* ================= TYPE 2: HIGHLIGHTS ================= */}
                            {sec.type === "highlights" && (
                              <div className="space-y-3 pt-2 border-t">
                                <div className="flex items-center justify-between">
                                  <Label className="text-[11px] font-bold text-foreground">
                                    Highlight Cards List ({sec.content.items?.length || 0})
                                  </Label>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const list = [...getAboutSections()];
                                      const current = list[idx].content.items || [];
                                      list[idx] = {
                                        ...list[idx],
                                        content: {
                                          ...list[idx].content,
                                          items: [...current, { title: "New Capability Feature", description: "Enter feature description..." }],
                                        },
                                      };
                                      updateAboutSections(list);
                                    }}
                                    className="h-7 text-[11px] font-bold gap-1"
                                  >
                                    <Plus className="h-3 w-3" /> Add Highlight Card
                                  </Button>
                                </div>

                                <div className="space-y-3">
                                  {sec.content.items?.map((item, itemIdx) => (
                                    <div key={itemIdx} className="p-3 rounded-lg border bg-muted/20 space-y-2 relative">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const list = [...getAboutSections()];
                                          const current = [...(list[idx].content.items || [])];
                                          current.splice(itemIdx, 1);
                                          list[idx] = { ...list[idx], content: { ...list[idx].content, items: current } };
                                          updateAboutSections(list);
                                        }}
                                        className="absolute top-2 right-2 text-slate-400 hover:text-rose-500"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <Input
                                          placeholder="Highlight Title"
                                          value={item.title || ""}
                                          onChange={(e) => {
                                            const list = [...getAboutSections()];
                                            const current = [...(list[idx].content.items || [])];
                                            current[itemIdx] = { ...current[itemIdx], title: e.target.value };
                                            list[idx] = { ...list[idx], content: { ...list[idx].content, items: current } };
                                            updateAboutSections(list);
                                          }}
                                          className="text-xs font-bold"
                                        />
                                        <Input
                                          placeholder="Badge (e.g. NEW / ANC / 40dB)"
                                          value={item.badge || ""}
                                          onChange={(e) => {
                                            const list = [...getAboutSections()];
                                            const current = [...(list[idx].content.items || [])];
                                            current[itemIdx] = { ...current[itemIdx], badge: e.target.value };
                                            list[idx] = { ...list[idx], content: { ...list[idx].content, items: current } };
                                            updateAboutSections(list);
                                          }}
                                          className="text-xs"
                                        />
                                      </div>

                                      <Textarea
                                        rows={2}
                                        placeholder="Highlight Description..."
                                        value={item.description || ""}
                                        onChange={(e) => {
                                          const list = [...getAboutSections()];
                                          const current = [...(list[idx].content.items || [])];
                                          current[itemIdx] = { ...current[itemIdx], description: e.target.value };
                                          list[idx] = { ...list[idx], content: { ...list[idx].content, items: current } };
                                          updateAboutSections(list);
                                        }}
                                        className="text-xs"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* ================= TYPE 3: BANNER ================= */}
                            {sec.type === "banner" && (
                              <div className="space-y-3 pt-2 border-t">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-[11px] font-bold text-foreground">Banner Ribbon Badge</Label>
                                    <Input
                                      placeholder="e.g. ★ Metromindz Flagship Series"
                                      value={sec.content.bannerBadge || ""}
                                      onChange={(e) => {
                                        const list = [...getAboutSections()];
                                        list[idx] = {
                                          ...list[idx],
                                          content: { ...list[idx].content, bannerBadge: e.target.value },
                                        };
                                        updateAboutSections(list);
                                      }}
                                      className="text-xs font-bold"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <Label className="text-[11px] font-bold text-foreground">Banner Heading Title</Label>
                                    <Input
                                      placeholder="e.g. Experience Unrivaled Craftsmanship"
                                      value={sec.content.bannerTitle || ""}
                                      onChange={(e) => {
                                        const list = [...getAboutSections()];
                                        list[idx] = {
                                          ...list[idx],
                                          content: { ...list[idx].content, bannerTitle: e.target.value },
                                        };
                                        updateAboutSections(list);
                                      }}
                                      className="text-xs font-bold"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-[11px] font-bold text-foreground">Banner Subtitle / Description</Label>
                                  <Input
                                    placeholder="Banner sub-text description..."
                                    value={sec.content.bannerSubtitle || ""}
                                    onChange={(e) => {
                                      const list = [...getAboutSections()];
                                      list[idx] = {
                                        ...list[idx],
                                        content: { ...list[idx].content, bannerSubtitle: e.target.value },
                                      };
                                      updateAboutSections(list);
                                    }}
                                    className="text-xs"
                                  />
                                </div>

                                {/* Banner Image URL & Upload */}
                                <div className="space-y-2">
                                  <Label className="text-[11px] font-bold text-foreground block">Banner Image Background</Label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      placeholder="Banner image URL (e.g. https://images.unsplash.com/...)"
                                      value={sec.content.bannerImage || ""}
                                      onChange={(e) => {
                                        const list = [...getAboutSections()];
                                        list[idx] = {
                                          ...list[idx],
                                        content: { ...list[idx].content, bannerImage: e.target.value },
                                      };
                                      updateAboutSections(list);
                                    }}
                                    className="text-xs"
                                  />
                                  <label className="cursor-pointer shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                          const blobUrl = URL.createObjectURL(file);
                                          const list = [...getAboutSections()];
                                          const curContent = list[idx]?.content || {};
                                          list[idx] = {
                                            ...list[idx],
                                            content: { ...curContent, bannerImage: blobUrl },
                                          };
                                          updateAboutSections(list);
                                          toast.success("Uploaded custom banner image!");
                                        } catch (err) {
                                          console.error(err);
                                        }
                                      }}
                                      className="sr-only"
                                    />
                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded border text-xs font-bold bg-background hover:bg-muted/50">
                                      <Upload className="h-3.5 w-3.5 text-primary" /> Upload Photo
                                    </span>
                                  </label>
                                  </div>

                                  {/* Banner Live Card Preview */}
                                  {sec.content.bannerImage && (
                                    <div className="relative rounded-xl overflow-hidden border h-36 bg-slate-950 text-white flex flex-col justify-end p-4 shadow-md">
                                      <img src={sec.content.bannerImage} alt="Banner Preview" className="absolute inset-0 h-full w-full object-cover opacity-60" />
                                      <div className="relative z-10 space-y-1">
                                        <Badge className="bg-amber-500 text-slate-950 font-bold text-[9px]">
                                          {sec.content.bannerBadge || "BANNER PREVIEW"}
                                        </Badge>
                                        <h4 className="font-extrabold text-sm line-clamp-1">{sec.content.bannerTitle}</h4>
                                        <p className="text-[10px] text-slate-300 line-clamp-1">{sec.content.bannerSubtitle}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* ================= TYPE 4: SHOWCASE ================= */}
                            {sec.type === "showcase" && (
                              <div className="space-y-3 pt-2 border-t">
                                <div className="flex items-center justify-between">
                                  <Label className="text-[11px] font-bold text-foreground">
                                    Showcase Slides List ({sec.content.items?.length || 0})
                                  </Label>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const list = [...getAboutSections()];
                                      const current = list[idx].content.items || [];
                                      list[idx] = {
                                        ...list[idx],
                                        content: {
                                          ...list[idx].content,
                                          items: [
                                            ...current,
                                            {
                                              title: "New Visual Showcase Feature",
                                              description: "Enter slide description...",
                                              image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
                                              badge: "Feature",
                                            },
                                          ],
                                        },
                                      };
                                      updateAboutSections(list);
                                    }}
                                    className="h-7 text-[11px] font-bold gap-1"
                                  >
                                    <Plus className="h-3 w-3" /> Add Showcase Slide
                                  </Button>
                                </div>

                                <div className="space-y-3">
                                  {sec.content.items?.map((item, itemIdx) => (
                                    <div key={itemIdx} className="p-3.5 rounded-xl border bg-muted/20 space-y-3 relative">
                                      {/* Remove Slide Button */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const list = [...getAboutSections()];
                                          const current = [...(list[idx].content.items || [])];
                                          current.splice(itemIdx, 1);
                                          list[idx] = { ...list[idx], content: { ...list[idx].content, items: current } };
                                          updateAboutSections(list);
                                        }}
                                        className="absolute top-2.5 right-2.5 z-10 h-6 w-6 rounded-full bg-background hover:bg-rose-500 hover:text-white text-muted-foreground border flex items-center justify-center transition-colors"
                                        title="Remove Slide"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>

                                      <div className="flex flex-col sm:flex-row gap-3 items-start">
                                        {/* Visual Live Image Preview Thumbnail */}
                                        <div className="relative w-full sm:w-36 aspect-video sm:aspect-[4/3] rounded-lg overflow-hidden border bg-slate-950 shrink-0 shadow-2xs">
                                          {item.image ? (
                                            <img src={item.image} alt={item.title || "Slide preview"} className="h-full w-full object-cover" />
                                          ) : (
                                            <div className="h-full w-full flex flex-col items-center justify-center p-2 text-center text-slate-500">
                                              <ImageIcon className="h-6 w-6 mb-1" />
                                              <span className="text-[9px] font-bold">No Image Set</span>
                                            </div>
                                          )}
                                          {item.badge && (
                                            <span className="absolute bottom-1 left-1 z-10 text-[8px] font-extrabold bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded shadow-xs truncate max-w-[90%]">
                                              {item.badge}
                                            </span>
                                          )}
                                        </div>

                                        {/* Inputs: Title, Badge, Description, Image URL & Upload */}
                                        <div className="flex-1 min-w-0 space-y-2 w-full pr-6 sm:pr-0">
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <Input
                                              placeholder="Slide Title (e.g. Laser-Etched Finish)"
                                              value={item.title || ""}
                                              onChange={(e) => {
                                                const list = [...getAboutSections()];
                                                const current = [...(list[idx].content.items || [])];
                                                current[itemIdx] = { ...current[itemIdx], title: e.target.value };
                                                list[idx] = { ...list[idx], content: { ...list[idx].content, items: current } };
                                                updateAboutSections(list);
                                              }}
                                              className="text-xs font-bold bg-background"
                                            />
                                            <Input
                                              placeholder="Badge Tag (e.g. Acoustics / NEW)"
                                              value={item.badge || ""}
                                              onChange={(e) => {
                                                const list = [...getAboutSections()];
                                                const current = [...(list[idx].content.items || [])];
                                                current[itemIdx] = { ...current[itemIdx], badge: e.target.value };
                                                list[idx] = { ...list[idx], content: { ...list[idx].content, items: current } };
                                                updateAboutSections(list);
                                              }}
                                              className="text-xs bg-background"
                                            />
                                          </div>

                                          <Textarea
                                            rows={2}
                                            placeholder="Feature description for this showcase slide..."
                                            value={item.description || ""}
                                            onChange={(e) => {
                                              const list = [...getAboutSections()];
                                              const current = [...(list[idx].content.items || [])];
                                              current[itemIdx] = { ...current[itemIdx], description: e.target.value };
                                              list[idx] = { ...list[idx], content: { ...list[idx].content, items: current } };
                                              updateAboutSections(list);
                                            }}
                                            className="text-xs bg-background"
                                          />

                                          <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                              <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                              <Input
                                                placeholder="Slide Image URL..."
                                                value={item.image || ""}
                                                onChange={(e) => {
                                                  const list = [...getAboutSections()];
                                                  const current = [...(list[idx].content.items || [])];
                                                  current[itemIdx] = { ...current[itemIdx], image: e.target.value };
                                                  list[idx] = { ...list[idx], content: { ...list[idx].content, items: current } };
                                                  updateAboutSections(list);
                                                }}
                                                className="pl-7 text-xs bg-background"
                                              />
                                            </div>

                                            <label className="cursor-pointer shrink-0" onClick={(e) => e.stopPropagation()}>
                                              <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                  e.stopPropagation();
                                                  const file = e.target.files?.[0];
                                                  if (!file) return;
                                                  try {
                                                    const blobUrl = URL.createObjectURL(file);
                                                    const list = [...getAboutSections()];
                                                    const curContent = list[idx]?.content || {};
                                                    const current = [...(curContent.items || [])];
                                                    current[itemIdx] = { ...current[itemIdx], image: blobUrl };
                                                    list[idx] = { ...list[idx], content: { ...curContent, items: current } };
                                                    updateAboutSections(list);
                                                    toast.success("Uploaded showcase slide image!");
                                                  } catch (err) {
                                                    console.error(err);
                                                  }
                                                }}
                                                className="sr-only"
                                              />
                                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded border text-xs font-bold bg-background hover:bg-muted/50 transition-colors shadow-2xs">
                                                <Upload className="h-3.5 w-3.5 text-primary" /> Upload Photo
                                              </span>
                                            </label>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* ================= TYPE 5: SPECS SUMMARY ================= */}
                            {sec.type === "specs-summary" && (
                              <div className="space-y-3 pt-2 border-t">
                                <div className="flex items-center justify-between">
                                  <Label className="text-[11px] font-bold text-foreground">
                                    Key Features & Specs Summary Items ({sec.content.items?.length || 0})
                                  </Label>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const list = [...getAboutSections()];
                                      const current = list[idx].content.items || [];
                                      list[idx] = {
                                        ...list[idx],
                                        content: {
                                          ...list[idx].content,
                                          items: [...current, { title: "New key specification summary line..." }],
                                        },
                                      };
                                      updateAboutSections(list);
                                    }}
                                    className="h-7 text-[11px] font-bold gap-1"
                                  >
                                    <Plus className="h-3 w-3" /> Add Feature Spec
                                  </Button>
                                </div>

                                <div className="space-y-2">
                                  {sec.content.items?.map((item, itemIdx) => (
                                    <div key={itemIdx} className="flex items-center gap-2">
                                      <Input
                                        placeholder="Feature summary line..."
                                        value={item.title || ""}
                                        onChange={(e) => {
                                          const list = [...getAboutSections()];
                                          const current = [...(list[idx].content.items || [])];
                                          current[itemIdx] = { ...current[itemIdx], title: e.target.value };
                                          list[idx] = { ...list[idx], content: { ...list[idx].content, items: current } };
                                          updateAboutSections(list);
                                        }}
                                        className="text-xs"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const list = [...getAboutSections()];
                                          const current = [...(list[idx].content.items || [])];
                                          current.splice(itemIdx, 1);
                                          list[idx] = { ...list[idx], content: { ...list[idx].content, items: current } };
                                          updateAboutSections(list);
                                        }}
                                        className="text-slate-400 hover:text-rose-500 p-1"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* ================= TYPE 6: WHATS IN BOX ================= */}
                            {sec.type === "whats-in-box" && (
                              <div className="space-y-3 pt-2 border-t">
                                <div className="flex items-center justify-between">
                                  <Label className="text-[11px] font-bold text-foreground">
                                    Unboxing Box Contents List ({sec.content.items?.length || 0})
                                  </Label>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const list = [...getAboutSections()];
                                      const current = list[idx].content.items || [];
                                      list[idx] = {
                                        ...list[idx],
                                        content: {
                                          ...list[idx].content,
                                          items: [...current, { title: "New Accessory Cable", subtitle: "Included", qty: "1×" }],
                                        },
                                      };
                                      updateAboutSections(list);
                                    }}
                                    className="h-7 text-[11px] font-bold gap-1"
                                  >
                                    <Plus className="h-3 w-3" /> Add Box Item
                                  </Button>
                                </div>

                                <div className="space-y-2">
                                  {sec.content.items?.map((item, itemIdx) => (
                                    <div key={itemIdx} className="p-2.5 rounded-lg border bg-muted/20 flex flex-col sm:flex-row items-center gap-2 relative">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const list = [...getAboutSections()];
                                          const current = [...(list[idx].content.items || [])];
                                          current.splice(itemIdx, 1);
                                          list[idx] = { ...list[idx], content: { ...list[idx].content, items: current } };
                                          updateAboutSections(list);
                                        }}
                                        className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 sm:static"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>

                                      <Input
                                        placeholder="Item Title (e.g. Master Headphones)"
                                        value={item.title || ""}
                                        onChange={(e) => {
                                          const list = [...getAboutSections()];
                                          const current = [...(list[idx].content.items || [])];
                                          current[itemIdx] = { ...current[itemIdx], title: e.target.value };
                                          list[idx] = { ...list[idx], content: { ...list[idx].content, items: current } };
                                          updateAboutSections(list);
                                        }}
                                        className="text-xs font-bold flex-1"
                                      />

                                      <Input
                                        placeholder="Subtitle / Description"
                                        value={item.subtitle || ""}
                                        onChange={(e) => {
                                          const list = [...getAboutSections()];
                                          const current = [...(list[idx].content.items || [])];
                                          current[itemIdx] = { ...current[itemIdx], subtitle: e.target.value };
                                          list[idx] = { ...list[idx], content: { ...list[idx].content, items: current } };
                                          updateAboutSections(list);
                                        }}
                                        className="text-xs flex-1"
                                      />

                                      <Input
                                        placeholder="Qty (1×)"
                                        value={item.qty || "1×"}
                                        onChange={(e) => {
                                          const list = [...getAboutSections()];
                                          const current = [...(list[idx].content.items || [])];
                                          current[itemIdx] = { ...current[itemIdx], qty: e.target.value };
                                          list[idx] = { ...list[idx], content: { ...list[idx].content, items: current } };
                                          updateAboutSections(list);
                                        }}
                                        className="text-xs font-mono w-20 shrink-0"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* TAB 7: ADDITIONAL PRODUCT INFORMATION ACCORDIONS BUILDER */}
              <TabsContent value="policies" className="space-y-5 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-muted/20">
                  <div>
                    <Label className="text-sm font-extrabold text-foreground flex items-center gap-2">
                      <Layers className="h-4 w-4 text-amber-500" /> Additional Storefront Accordions
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configure custom collapsible sections and parameter tables displayed on the product page.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetInfoSectionsToDefault}
                    className="text-xs font-bold gap-1 text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reset Default Accordions
                  </Button>
                </div>

                <div className="space-y-4">
                  {getAdditionalInfoSections().map((sec, secIdx) => (
                    <Card key={sec.id} className="border shadow-xs overflow-hidden">
                      <div className="p-3.5 bg-muted/30 border-b flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded shrink-0">
                            Accordion #{secIdx + 1}
                          </span>
                          <Input
                            value={sec.title}
                            onChange={(e) => handleUpdateInfoSectionTitle(secIdx, e.target.value)}
                            placeholder="e.g. Technical Specifications"
                            className="h-8 text-xs font-extrabold bg-background max-w-[360px]"
                          />
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteInfoSection(secIdx)}
                          className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Accordion Section"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <CardContent className="p-4 space-y-3 bg-background">
                        {/* Table Headers */}
                        <div className="grid grid-cols-12 gap-2 pb-1 border-b text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          <div className="col-span-5">Spec Label / Key</div>
                          <div className="col-span-6">Display Value</div>
                          <div className="col-span-1 text-center">Action</div>
                        </div>

                        {/* List of Spec Rows */}
                        <div className="space-y-2">
                          {sec.items.map((item, itemIdx) => (
                            <div key={itemIdx} className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-5">
                                <Input
                                  value={item.key}
                                  onChange={(e) =>
                                    handleUpdateInfoSpecRow(secIdx, itemIdx, e.target.value, item.value)
                                  }
                                  placeholder="e.g. Capacity"
                                  className="h-8 text-xs font-semibold bg-background"
                                />
                              </div>
                              <div className="col-span-6">
                                <Input
                                  value={item.value}
                                  onChange={(e) =>
                                    handleUpdateInfoSpecRow(secIdx, itemIdx, item.key, e.target.value)
                                  }
                                  placeholder="e.g. 350 ml"
                                  className="h-8 text-xs font-semibold bg-background"
                                />
                              </div>
                              <div className="col-span-1 flex justify-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveInfoSpecRow(secIdx, itemIdx)}
                                  className="h-7 w-7 rounded flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                  title="Remove Row"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add Row Action Button */}
                        <div className="pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddInfoSpecRow(secIdx)}
                            className="h-8 text-[11px] font-bold gap-1 text-indigo-600 border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50"
                          >
                            <Plus className="h-3.5 w-3.5" /> + Add Key/Value Row
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Add Section Button */}
                <div className="pt-2 flex justify-center">
                  <Button
                    type="button"
                    onClick={handleAddInfoSection}
                    className="text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                  >
                    <Plus className="h-4 w-4" /> Add New Accordion Section
                  </Button>
                </div>
              </TabsContent>

              {/* TAB 8: COMBO PRODUCTS (FREQUENTLY BOUGHT TOGETHER) */}
              {fieldRules.showComboProducts && (
              <TabsContent value="combo" className="space-y-4 pt-1">
                <div className="p-4 rounded-xl border bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20 space-y-4">
                  {/* Top Bar: Title + Toggle Switch */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
                    <div>
                      <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        Frequently Bought Together / Combo Deals
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Configure up to 3 Combo Deals (max 2 bundled products per deal).
                      </p>
                    </div>

                    {/* Enable / Disable Combo Deals Toggle Switch */}
                    <div className="flex items-center gap-2 bg-background p-1.5 px-3 rounded-lg border shadow-2xs">
                      <Label className="text-xs font-bold text-foreground cursor-pointer">
                        Combo Deal Available:
                      </Label>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            comboDealAvailable: !(prev.comboDealAvailable ?? true),
                          }))
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          (formData.comboDealAvailable ?? true) ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            (formData.comboDealAvailable ?? true) ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                      <span className={`text-[10px] font-extrabold uppercase ${
                        (formData.comboDealAvailable ?? true) ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                      }`}>
                        {(formData.comboDealAvailable ?? true) ? "Available" : "Disabled"}
                      </span>
                    </div>
                  </div>

                  {/* If Combo Deals are Disabled */}
                  {!(formData.comboDealAvailable ?? true) ? (
                    <div className="p-8 text-center border rounded-xl bg-background/50 text-muted-foreground space-y-2">
                      <div className="text-xs font-bold text-rose-500">Combo Deals are turned OFF for this product</div>
                      <p className="text-[11px] text-muted-foreground">
                        Storefront visitors will not see the Frequently Bought Together section. Toggle switch above to ENABLE.
                      </p>
                    </div>
                  ) : (
                    /* If Combo Deals are Enabled */
                    <div className="space-y-4">
                      {/* Combo Deals Selection Tabs Bar (Max 3) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-background p-2 rounded-xl border">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {(formData.comboDeals || []).map((deal, idx) => (
                            <button
                              key={deal.id || idx}
                              type="button"
                              onClick={() => setSelectedComboDealIdx(idx)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                selectedComboDealIdx === idx
                                  ? "bg-amber-500 text-slate-950 shadow-xs"
                                  : "bg-muted text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <span>{deal.title || `Combo Deal ${idx + 1}`}</span>
                              <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono bg-background/50">
                                {deal.productIds?.length || 0}/2 items
                              </Badge>
                            </button>
                          ))}
                        </div>

                        {/* Add New Combo Deal Button (Max 3) */}
                        <Button
                          type="button"
                          disabled={(formData.comboDeals || []).length >= 3}
                          onClick={() => {
                            const currentDeals = formData.comboDeals || [];
                            if (currentDeals.length >= 3) {
                              toast.error("Maximum 3 combo deals allowed per product");
                              return;
                            }
                            const newDeal = {
                              id: `cd-${Date.now()}`,
                              title: `Combo Deal #${currentDeals.length + 1}`,
                              productIds: [],
                            };
                            setFormData((prev) => ({
                              ...prev,
                              comboDeals: [...(prev.comboDeals || []), newDeal],
                            }));
                            setSelectedComboDealIdx(currentDeals.length);
                            toast.success(`Created Combo Deal #${currentDeals.length + 1}!`);
                          }}
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs font-bold gap-1 border-amber-500/40 text-amber-700 dark:text-amber-300"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add Combo Deal (Max 3)</span>
                        </Button>
                      </div>

                      {/* Active Combo Deal Configuration Box */}
                      {formData.comboDeals && formData.comboDeals[selectedComboDealIdx] && (() => {
                        const currentDeal = formData.comboDeals[selectedComboDealIdx];
                        const isMaxProductsReached = (currentDeal.productIds?.length || 0) >= 2;

                        return (
                          <div className="space-y-4 bg-background p-4 rounded-xl border">
                            {/* Deal Title & Delete Controls */}
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1 max-w-sm space-y-1">
                                <Label className="text-[11px] font-bold text-muted-foreground">Combo Deal Title Name</Label>
                                <Input
                                  value={currentDeal.title}
                                  onChange={(e) => {
                                    const updated = [...(formData.comboDeals || [])];
                                    updated[selectedComboDealIdx] = {
                                      ...updated[selectedComboDealIdx],
                                      title: e.target.value,
                                    };
                                    setFormData((prev) => ({ ...prev, comboDeals: updated }));
                                  }}
                                  placeholder="e.g. Audio & Speaker Combo"
                                  className="h-8 text-xs font-bold"
                                />
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`text-[10px] font-bold ${
                                  isMaxProductsReached
                                    ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                                    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                }`}>
                                  {isMaxProductsReached ? "Max 2 Items Added" : `${currentDeal.productIds?.length || 0}/2 Items`}
                                </Badge>

                                {formData.comboDeals.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const updated = (formData.comboDeals || []).filter((_, i) => i !== selectedComboDealIdx);
                                      setFormData((prev) => ({ ...prev, comboDeals: updated }));
                                      setSelectedComboDealIdx(Math.max(0, selectedComboDealIdx - 1));
                                      toast.info("Deleted combo deal");
                                    }}
                                    className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                    title="Delete Combo Deal"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Category & Sub-Category Filter Form */}
                            <div className="grid grid-cols-1 sm:grid-cols-7 gap-2.5 items-end bg-muted/30 p-3 rounded-lg border">
                              {/* Category Filter Dropdown */}
                              <div className="sm:col-span-2 space-y-1">
                                <Label className="text-[11px] font-bold text-muted-foreground">Filter by Category</Label>
                                <Select
                                  value={comboCategoryFilter}
                                  onValueChange={(val) => {
                                    setComboCategoryFilter(val);
                                    setComboSubCategoryFilter("all");
                                    setSelectedComboProductId("");
                                  }}
                                >
                                  <SelectTrigger className="h-8 text-xs font-semibold bg-background">
                                    <SelectValue placeholder="Select Category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categoryOptions.map((cat) => (
                                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Sub-Category Filter Dropdown */}
                              <div className="sm:col-span-2 space-y-1">
                                <Label className="text-[11px] font-bold text-muted-foreground">Filter by Sub-Category</Label>
                                <Select
                                  value={comboSubCategoryFilter}
                                  onValueChange={(val) => {
                                    setComboSubCategoryFilter(val);
                                    setSelectedComboProductId("");
                                  }}
                                >
                                  <SelectTrigger className="h-8 text-xs font-semibold bg-background">
                                    <SelectValue placeholder="Select Sub-Category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">All Sub-Categories</SelectItem>
                                    {comboSubCategoryOptionsList.map((sc) => (
                                      <SelectItem key={sc} value={sc}>{sc}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Product Selection Dropdown */}
                              <div className="sm:col-span-2 space-y-1">
                                <Label className="text-[11px] font-bold text-muted-foreground">Select Product (Max 2)</Label>
                                <Select
                                  disabled={isMaxProductsReached}
                                  value={selectedComboProductId}
                                  onValueChange={(val) => setSelectedComboProductId(val)}
                                >
                                  <SelectTrigger className="h-8 text-xs font-semibold bg-background disabled:opacity-50">
                                    <SelectValue placeholder={isMaxProductsReached ? "Max 2 Items Reached" : availableComboProducts.length > 0 ? "Select Product..." : "No Products Found"} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableComboProducts.map((cp) => (
                                      <SelectItem key={cp.id} value={cp.id}>
                                        {cp.name} — {cp.sku} ({formatCurrency(cp.price)})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Add Button */}
                              <Button
                                type="button"
                                disabled={isMaxProductsReached}
                                onClick={() => {
                                  if (isMaxProductsReached) {
                                    toast.error("Maximum 2 products allowed per combo deal");
                                    return;
                                  }
                                  if (!selectedComboProductId) {
                                    toast.error("Please select a product from the dropdown");
                                    return;
                                  }
                                  const currentIds = currentDeal.productIds || [];
                                  if (currentIds.includes(selectedComboProductId)) {
                                    toast.warning("This product is already in this combo deal");
                                    return;
                                  }
                                  const updated = [...(formData.comboDeals || [])];
                                  updated[selectedComboDealIdx] = {
                                    ...updated[selectedComboDealIdx],
                                    productIds: [...currentIds, selectedComboProductId],
                                  };
                                  setFormData((prev) => ({ ...prev, comboDeals: updated }));
                                  const picked = items.find((i) => i.id === selectedComboProductId);
                                  toast.success(`Added "${picked?.name || selectedComboProductId}" to ${currentDeal.title}!`);
                                  setSelectedComboProductId("");
                                }}
                                size="sm"
                                className="h-8 text-xs font-bold gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950 disabled:opacity-50"
                              >
                                <Plus className="h-3.5 w-3.5" /> Add (Max 2)
                              </Button>
                            </div>

                            {/* Bundled Products in Active Combo Deal */}
                            <div className="space-y-2">
                              <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                                <span>Products in "{currentDeal.title}" ({currentDeal.productIds?.length || 0} / 2)</span>
                                <span className="text-[10px] text-muted-foreground font-normal">Bundled alongside main product</span>
                              </Label>

                              {(!currentDeal.productIds || currentDeal.productIds.length === 0) ? (
                                <div className="p-6 text-center border rounded-xl bg-background/50 text-muted-foreground text-xs font-medium">
                                  No products added to this deal yet. Select Category & Sub-Category above to add up to 2 items.
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {currentDeal.productIds.map((cId) => {
                                    const cProd = items.find((i) => i.id === cId);
                                    if (!cProd) return null;

                                    return (
                                      <div
                                        key={cId}
                                        className="p-3 bg-background border rounded-xl flex items-center justify-between gap-3 shadow-2xs group"
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <img
                                            src={cProd.image}
                                            alt={cProd.name}
                                            className="h-12 w-12 rounded-lg object-cover border shrink-0 bg-muted"
                                          />
                                          <div className="min-w-0 space-y-0.5">
                                            <h4 className="text-xs font-bold text-foreground truncate">{cProd.name}</h4>
                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                              <span className="font-mono">{cProd.sku}</span>
                                              <span>•</span>
                                              <span>{cProd.category}</span>
                                            </div>
                                            <div className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                                              {formatCurrency(cProd.price)}
                                            </div>
                                          </div>
                                        </div>

                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            const updated = [...(formData.comboDeals || [])];
                                            updated[selectedComboDealIdx] = {
                                              ...updated[selectedComboDealIdx],
                                              productIds: (updated[selectedComboDealIdx].productIds || []).filter((id) => id !== cId),
                                            };
                                            setFormData((prev) => ({ ...prev, comboDeals: updated }));
                                            toast.info(`Removed ${cProd.name} from combo`);
                                          }}
                                          className="h-7 w-7 text-muted-foreground hover:text-rose-500"
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </TabsContent>
              )}
            </div>
          </Tabs>

          {/* Modal Footer */}
          <DialogFooter className="p-4 border-t bg-muted/20 flex items-center justify-between shrink-0">
            <Button variant="outline" size="sm" onClick={() => setOpenModal(false)} className="text-xs font-bold">
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSaveProduct}
              size="sm"
              className="text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
            >
              <Check className="h-4 w-4" />{" "}
              {formData.status === "active"
                ? "Save Product & Publish"
                : "Save Product as Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
