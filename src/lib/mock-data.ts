export type ProductReview = {
  id: string;
  author: string;
  avatarUrl?: string;
  verifiedBuyer?: boolean;
  rating: number;
  date: string;
  title?: string;
  comment: string;
  images?: string[];
  videoUrl?: string;
  videoPoster?: string;
  likes?: number;
  status?: "approved" | "pending" | "rejected";
  productName?: string;
  productId?: string;
};

export type AboutProductSection = {
  id: string;
  type: "about-text" | "highlights" | "banner" | "showcase" | "specs-summary" | "whats-in-box";
  title: string;
  active: boolean;
  content: {
    heading?: string;
    subheading?: string;
    description1?: string;
    description2?: string;
    bannerImage?: string;
    bannerBadge?: string;
    bannerTitle?: string;
    bannerSubtitle?: string;
    items?: Array<{
      title?: string;
      subtitle?: string;
      description?: string;
      badge?: string;
      image?: string;
      qty?: string;
    }>;
  };
};

export const defaultAboutSections: AboutProductSection[] = [
  {
    id: "sec-about-text",
    type: "about-text",
    title: "About Product Title & Description",
    active: true,
    content: {
      heading: "Designed for Excellence. Engineered for Performance.",
      description1: "Built with meticulous attention to detail, this product delivers an uncompromised blend of cutting-edge technology, ergonomic comfort, and enduring durability.",
      description2: "Whether working from home, commuting across the city, or pursuing active goals, experience crystal-clear fidelity and intuitive controls.",
    },
  },
  {
    id: "sec-highlights",
    type: "highlights",
    title: "Product Highlights",
    active: true,
    content: {
      items: [
        { title: "Next-Gen Speed & Low Latency", description: "Engineered with ultra-responsive architecture for instant performance and zero lag." },
        { title: "Aerospace-Grade Durability & Finish", description: "Crafted with premium scratch-resistant materials tested for long-lasting daily wear." },
        { title: "All-Day Battery & Quick Charge", description: "Intelligent power management delivers 35+ hours usage with quick charge boost." },
        { title: "Precision Ergonomics", description: "Contoured headband and memory foam cushioning for fatigue-free comfort during extended wear." },
      ],
    },
  },
  {
    id: "sec-banner",
    type: "banner",
    title: "Advertisement Banner",
    active: true,
    content: {
      bannerImage: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1200",
      bannerBadge: "★ Metromindz Flagship Series",
      bannerTitle: "Experience Unrivaled Craftsmanship & Performance",
      bannerSubtitle: "Every aspect is engineered to elevate your daily experience with unmatched precision and style.",
    },
  },
  {
    id: "sec-showcase",
    type: "showcase",
    title: "Visual Feature Showcase Slider",
    active: true,
    content: {
      items: [
        { title: "Laser-Etched Precision & Matte Finish", description: "Refined tactile finishes and premium smudge-resistant coating.", badge: "Craftsmanship", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600" },
        { title: "Seamless Multi-Device Instant Sync", description: "Instant 1-tap connection across laptops, smartphones, and tablet ecosystems.", badge: "Connectivity", image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600" },
        { title: "Smart Environmental ANC & Transparency Mode", description: "Adaptive dual-microphone noise suppression isolates external chatter.", badge: "Acoustics", image: "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=600" },
      ],
    },
  },
  {
    id: "sec-specs-summary",
    type: "specs-summary",
    title: "Key Features & Specs Summary",
    active: true,
    content: {
      items: [
        { title: "High resolution acoustic performance drivers" },
        { title: "Fast USB-C charging with low standby consumption" },
        { title: "Comprehensive 1-Year Manufacturer Warranty" },
      ],
    },
  },
  {
    id: "sec-whats-in-box",
    type: "whats-in-box",
    title: "What's Included in Box?",
    active: true,
    content: {
      items: [
        { title: "Master Product Unit", subtitle: "Main Device", qty: "1×" },
        { title: "USB-C Fast Cable", subtitle: "High-Speed Sync & Charge", qty: "1×" },
        { title: "Warranty Registration Card", subtitle: "1-Year Official Seal", qty: "1×" },
        { title: "Quick Setup Manual", subtitle: "User Safety Guide", qty: "1×" },
      ],
    },
  },
];

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  subCategory?: string;
  brand?: string;
  gender?: "Men" | "Women" | "Unisex" | "Kids";
  price: number;
  costPrice?: number;
  discountPercent?: number;
  originalPrice?: number;
  stock: number;
  status: "active" | "draft" | "archived";
  image: string;
  images?: string[];
  rating?: number;
  reviewCount?: number;
  badge?: string;
  description?: string;
  features?: string[];
  specs?: Record<string, string>;
  colors?: { name: string; hex: string }[];
  sizes?: string[];
  reviews?: ProductReview[];
  codAvailable?: boolean;
  codText?: string;
  returnAvailable?: boolean;
  returnText?: string;
  exchangeAvailable?: boolean;
  exchangeText?: string;
  replacementAvailable?: boolean;
  freeShippingAvailable?: boolean;
  secureCheckout?: boolean;
  officialWarranty?: boolean;
  expressDispatch?: boolean;
  tags?: string[];
  warrantyPeriod?: string;
  deliveryEstimate?: string;
  aboutSections?: AboutProductSection[];
  additionalInfoSections?: AdditionalInfoSection[];
  comboDealAvailable?: boolean;
  comboDeals?: ComboDeal[];
  comboProductIds?: string[];
};

export type ComboDeal = {
  id: string;
  title: string;
  productIds: string[];
  discountPercent?: number;
};

export type AdditionalInfoSection = {
  id: string;
  title: string;
  items: Array<{ key: string; value: string }>;
};

export const defaultAdditionalInfo = (product: Partial<Product>): AdditionalInfoSection[] => [
  {
    id: "general-info",
    title: "General Product Information & Identification",
    items: [
      { key: "Product SKU Code", value: product.sku || "" },
      { key: "Product Name", value: product.name || "" },
      { key: "Brand Manufacturer", value: product.brand || "Metromindz" },
      { key: "Category", value: product.category || "" },
      { key: "Target Audience", value: product.gender || "Unisex" },
    ],
  },
  {
    id: "tech-specs",
    title: "Technical & Hardware Specifications",
    items: product.specs && Object.keys(product.specs).length > 0
      ? Object.entries(product.specs).map(([k, v]) => ({ key: k, value: v }))
      : [
          { key: "Driver Unit", value: "40mm Beryllium Dynamic" },
          { key: "Frequency Response", value: "20Hz - 40,000Hz" },
          { key: "Connectivity", value: "Bluetooth 5.3 (AAC, aptX HD)" },
        ],
  },
  {
    id: "logistics",
    title: "Service Policies, Warranty & Return Terms",
    items: [
      {
        key: "Cash on Delivery",
        value: product.codAvailable !== false
          ? product.codText || "✓ Available across 19,000+ pincodes"
          : "✕ Online Payment Only",
      },
      {
        key: "Return Window",
        value: product.returnAvailable !== false
          ? product.returnText || "7 Days Easy Money-Back Return Policy"
          : "Non-Returnable Item",
      },
      {
        key: "Exchange / Replacement",
        value: product.exchangeAvailable !== false
          ? product.exchangeText || "Free Size / Color Variant Exchange"
          : "Standard Manufacturer Terms",
      },
      {
        key: "Manufacturer Warranty",
        value: product.warrantyPeriod || "1 Year Official Brand Warranty",
      },
    ],
  },
];

export type OrderItem = {
  id: string;
  title: string;
  price: number;
  qty: number;
  image: string;
};

export type Order = {
  id: string;
  orderNumber?: string;
  customer: string;
  email: string;
  total: number;
  items: number | OrderItem[];
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "paid" | "unpaid" | "refunded";
  paymentMethod?: string;
  paymentProvider?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  shippingAddress?: string;
  date: string;
};

export type Invoice = {
  id: string;
  orderId: string;
  customer: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  issued: string;
  due: string;
};

export type Shipment = {
  id: string;
  orderId: string;
  customer: string;
  carrier: string;
  tracking: string;
  status: "label_created" | "in_transit" | "out_for_delivery" | "delivered" | "returned";
  destination?: string;
  eta: string;
};

export type SavedAddress = {
  id: string;
  label: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
};

export type PaymentGateway = {
  id: string;
  name: string;
  provider: string;
  enabled: boolean;
  mode: "live" | "test";
  fees: string;
  transactions30d: number;
  volume30d: number;
};

// Runtime data is supplied by the API.
// Legacy seed arrays below are intentionally kept for reference only and not exported.
const legacyProducts: Product[] = [
  {
    id: "P-1001",
    name: "Aurora Wireless Headphones",
    sku: "AUR-WH-001",
    category: "Audio",
    price: 1499,
    stock: 42,
    status: "active",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800",
    ],
    rating: 4.8,
    reviewCount: 124,
    description:
      "Experience studio-quality sound with active noise cancellation, custom-tuned 40mm beryllium drivers, ultra-soft memory foam earcups, and up to 35 hours of continuous wireless playback on a single charge.",
    features: [
      "Active Noise Cancellation (ANC) with Transparency Mode",
      "Custom 40mm Beryllium Drivers for crystal clear highs and deep bass",
      "35 Hours Battery Life with Fast USB-C Quick Charge (10 min charge = 4 hrs)",
      "Multi-Point Bluetooth 5.3 Instant Pairing with Dual Device Connect",
      "Built-in Quad Beamforming Microphones for ultra-clear voice calls",
    ],
    specs: {
      "Driver Unit": "40mm Beryllium Dynamic",
      "Frequency Response": "20Hz – 40,000Hz",
      "Bluetooth Version": "Bluetooth 5.3 (AAC, aptX HD, LDAC)",
      "Battery Life": "35 Hours (ANC On) / 45 Hours (ANC Off)",
      "Charging Time": "1.5 Hours via USB Type-C",
      Weight: "260g",
      Warranty: "2 Years International Replacement Warranty",
    },
    colors: [
      { name: "Midnight Black", hex: "#0f172a" },
      { name: "Space Gray", hex: "#475569" },
      { name: "Arctic White", hex: "#f8fafc" },
    ],
    sizes: ["Standard Fit", "Pro Memory Foam Pads"],
    tags: ["Trending", "Wireless", "ANC", "Best Seller"],
    comboDealAvailable: true,
    comboDeals: [
      { id: "cd-1", title: "Audio & Speaker Combo", productIds: ["P-1002"] },
      { id: "cd-2", title: "Fitness & Music Bundle", productIds: ["P-1003"] },
    ],
    comboProductIds: ["P-1002"],
    reviews: [
      {
        id: "rev-1",
        author: "Vikram Malhotra",
        rating: 5,
        date: "2026-07-20",
        comment: "Absolutely stunning sound quality! The Active Noise Cancellation completely blocks out plane engine noise. Battery life lasts for days.",
      },
      {
        id: "rev-2",
        author: "Ananya Iyer",
        rating: 5,
        date: "2026-07-18",
        comment: "Extremely comfortable memory foam earcups. I wear these for 8 hours of work without any clamping pressure or ear fatigue.",
      },
      {
        id: "rev-3",
        author: "Rohan Gupta",
        rating: 4,
        date: "2026-07-10",
        comment: "Great soundstage and deep bass response. Premium build quality. Mic quality on Zoom calls is super clear.",
      },
    ],
  },
  {
    id: "P-1002",
    name: "Nomad Leather Backpack",
    sku: "NMD-BP-014",
    category: "Bags",
    price: 2190,
    stock: 12,
    status: "active",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
      "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800",
    ],
    rating: 4.9,
    reviewCount: 88,
    description:
      "Crafted from 100% full-grain Italian leather, the Nomad Backpack combines timeless heritage aesthetics with modern functionality, featuring a padded 16-inch laptop sleeve, waterproof lining, and YKK weather-sealed zippers.",
    features: [
      "100% Full-Grain Vegetable-Tanned Italian Leather",
      "Padded Microfiber Compartment fits up to 16-inch MacBook Pro",
      "Weatherproof YKK AquaGuard Zippers & Water-Resistant Cotton Canvas Lining",
      "Hidden Anti-Theft Passport Pocket on back panel",
      "Luggage Pass-Through Strap for easy airport travel",
    ],
    specs: {
      Material: "Full-Grain Italian Leather",
      Capacity: "24 Liters",
      "Laptop Compatibility": "Fits up to 16-inch Laptop",
      Dimensions: "44cm x 30cm x 15cm",
      Weight: "1.2 kg",
      Warranty: "Lifetime Craftsmanship Guarantee",
    },
    colors: [
      { name: "Cognac Brown", hex: "#7c2d12" },
      { name: "Obsidian Black", hex: "#18181b" },
    ],
    sizes: ["24L Standard", "28L Travel Expandable"],
    reviews: [
      {
        id: "rev-4",
        author: "Deepak Mehta",
        rating: 5,
        date: "2026-07-22",
        comment: "The leather quality is top tier. Smells rich and ages beautifully. Fits my 16-inch laptop and camera gear easily.",
      },
    ],
  },
  {
    id: "P-1003",
    name: "Everyday Ceramic Mug",
    sku: "EDC-MG-003",
    category: "Home",
    price: 185,
    stock: 320,
    status: "active",
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800",
    images: [
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800",
      "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=800",
    ],
    rating: 4.7,
    reviewCount: 210,
    description:
      "Handcrafted stoneware coffee mug with a matte speckled glaze finish. Designed with an ergonomic wide handle and thick thermal walls to keep your morning brew hot longer.",
    features: [
      "Handcrafted Durable Stoneware Ceramic",
      "Microwave & Dishwasher Safe Glaze",
      "12 oz (350 ml) Capacity for Coffee & Tea",
      "Ergonomic Comfort Grip Handle",
    ],
    specs: {
      Capacity: "350 ml (12 oz)",
      Material: "Stoneware Ceramic",
      Dishwasher: "Safe",
      Microwave: "Safe",
    },
    colors: [
      { name: "Speckled Oat", hex: "#e2e8f0" },
      { name: "Terracotta", hex: "#9a3412" },
    ],
    sizes: ["350 ml Standard"],
    reviews: [
      {
        id: "rev-5",
        author: "Meera Patel",
        rating: 5,
        date: "2026-07-15",
        comment: "My favorite morning coffee mug! Great weight, beautiful minimalist glaze finish.",
      },
    ],
  },
  {
    id: "P-1004",
    name: "Trailrunner Sneakers",
    sku: "TRL-SN-022",
    category: "Footwear",
    price: 1290,
    stock: 15,
    status: "active",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800",
    ],
    rating: 4.8,
    reviewCount: 64,
    description:
      "Engineered performance trail running shoes featuring responsive nitrogen-infused foam cushioning, breathable Ripstop mesh upper, and Vibram Megagrip traction lugs for rugged terrain.",
    features: [
      "Vibram Megagrip Rubber Outsole with 5mm Lugs",
      "Nitrogen-Infused High Response Midsole Cushioning",
      "Water-Repellent Ripstop Mesh Upper",
      "Reinforced TPU Toe Cap for Impact Protection",
    ],
    specs: {
      "Drop Height": "6mm",
      Cushioning: "Max Responsiveness",
      Outsole: "Vibram Megagrip Rubber",
      Weight: "290g per shoe",
    },
    colors: [
      { name: "Crimson Red", hex: "#dc2626" },
      { name: "Stealth Black", hex: "#090d16" },
    ],
    sizes: ["UK 7", "UK 8", "UK 9", "UK 10", "UK 11"],
    reviews: [],
  },
  {
    id: "P-1005",
    name: "Linen Oversized Shirt",
    sku: "LIN-SH-041",
    category: "Apparel",
    price: 780,
    stock: 55,
    status: "active",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800",
    images: [
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800",
    ],
    rating: 4.6,
    reviewCount: 39,
    description:
      "100% Organic European Flax Linen shirt designed with a relaxed oversized silhouette, mother-of-pearl buttons, and breathable airy drape ideal for warm climates.",
    features: [
      "100% Organic French & Belgian Linen",
      "Relaxed Oversized Cut with Curved Hem",
      "Natural Shell Buttons & Chest Pocket",
    ],
    specs: {
      Fabric: "100% Linen",
      Care: "Machine Wash Cold, Hang Dry",
    },
    colors: [
      { name: "Natural Flax", hex: "#d6d3d1" },
      { name: "Sky Blue", hex: "#38bdf8" },
    ],
    sizes: ["S", "M", "L", "XL"],
    reviews: [],
  },
  {
    id: "P-1006",
    name: "Smart Fitness Watch",
    sku: "SFW-W-009",
    category: "Electronics",
    price: 1990,
    stock: 24,
    status: "active",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800",
    ],
    rating: 4.9,
    reviewCount: 156,
    description:
      "Advanced health and fitness smartwatch featuring an Always-On AMOLED Display, continuous ECG heart rate monitoring, SpO2 blood oxygen tracking, dual-frequency GPS, and 7-day battery life.",
    features: [
      "1.43-inch Always-On Ultra HD AMOLED Display (1000 nits brightness)",
      "Continuous ECG, PPG Heart Rate, SpO2 & Sleep Stage Analysis",
      "Dual-Band Multi-Constellation GPS for exact route tracking",
      "5 ATM Water Resistance (Swim Proof up to 50m)",
      "7 Days Heavy Usage Battery Life (14 Days Standby)",
    ],
    specs: {
      Display: "1.43\" AMOLED 466x466 (1000 nits)",
      "Water Resistance": "5 ATM (50 meters)",
      Sensors: "ECG, SpO2, Accelerometer, Gyroscope, Barometer",
      Battery: "7 Days Battery Life",
      Connectivity: "Bluetooth 5.2, Wi-Fi, NFC",
      Warranty: "1 Year Official Warranty",
    },
    colors: [
      { name: "Space Gray Aluminium", hex: "#334155" },
      { name: "Rose Gold", hex: "#f43f5e" },
    ],
    sizes: ["42mm Standard", "46mm Large"],
    reviews: [
      {
        id: "rev-6",
        author: "Karan Singh",
        rating: 5,
        date: "2026-07-24",
        comment: "Best fitness tracker for the price! GPS tracking is instant and battery lasts a full week without charging.",
      },
    ],
  },
  {
    id: "P-1008",
    name: "Vintage Denim Jacket",
    sku: "VDJ-JK-017",
    category: "Apparel",
    price: 1450,
    stock: 8,
    status: "active",
    image: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800",
    images: [
      "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800",
    ],
    rating: 4.8,
    reviewCount: 52,
    description:
      "Classic trucker denim jacket made from heavy 14oz rigid cotton denim. Features antique brass hardware, double chest flap pockets, and adjustable waist tabs.",
    features: [
      "14oz Heavyweight 100% Cotton Denim",
      "Vintage Washed Finish & Brass Shank Buttons",
      "Twin Chest Pockets & Side Hand Pockets",
    ],
    specs: {
      Material: "100% Cotton Denim (14oz)",
      Fit: "Classic Regular Fit",
    },
    colors: [
      { name: "Indigo Blue", hex: "#1e3a8a" },
    ],
    sizes: ["M", "L", "XL"],
    reviews: [],
  },
  {
    id: "P-1009",
    name: "Nike Air Max Pulse Sneakers",
    sku: "NKE-AM-009",
    category: "Footwear",
    brand: "Nike",
    price: 3490,
    stock: 25,
    status: "active",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    rating: 4.9,
    reviewCount: 112,
    description: "Iconic Nike cushioning with point-loaded Air units for maximum bounce, style, and everyday comfort.",
  },
  {
    id: "P-1010",
    name: "Sony Bravia 4K OLED TV",
    sku: "SNY-TV-404",
    category: "Electronics",
    brand: "Sony",
    price: 84900,
    stock: 10,
    status: "active",
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800",
    rating: 4.8,
    reviewCount: 78,
    description: "Pure OLED blacks and vibrant color powered by Sony Cognitive Processor XR for cinematic home entertainment.",
  },
  {
    id: "P-1011",
    name: "Adidas Ultraboost Light Running Shoes",
    sku: "ADI-UB-011",
    category: "Footwear",
    brand: "Adidas",
    price: 2990,
    stock: 18,
    status: "active",
    image: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800",
    rating: 4.7,
    reviewCount: 94,
    description: "Lightest Ultraboost ever made with Light BOOST cushioning and Continental Rubber outsole grip.",
  },
  {
    id: "P-1012",
    name: "Samsung Galaxy Tab S9 Ultra",
    sku: "SAM-TB-900",
    category: "Electronics",
    brand: "Samsung",
    price: 49990,
    stock: 14,
    status: "active",
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800",
    rating: 4.9,
    reviewCount: 63,
    description: "14.6-inch Dynamic AMOLED 2X display with S Pen included, IP68 water resistance, and Snapdragon 8 Gen 2 processor.",
  },
];

const _legacyOrders: Order[] = [
  {
    id: "#ORD-1092",
    customer: "Aakash Sharma",
    email: "aakash.sharma@example.com",
    total: 3689,
    status: "processing",
    paymentStatus: "paid",
    paymentMethod: "UPI (Google Pay)",
    shippingAddress: "Flat 402, Metro Residency, MG Road, Indiranagar, Bengaluru 560038",
    date: "2026-07-25",
    items: [
      { id: "P-1001", title: "Aurora Wireless Headphones", price: 1499, qty: 1, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800" },
      { id: "P-1009", title: "Nike Air Max Pulse Sneakers", price: 2190, qty: 1, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800" },
    ],
  },
  {
    id: "#ORD-1091",
    customer: "Priya Shah",
    email: "priya.shah@example.com",
    total: 12450,
    status: "delivered",
    paymentStatus: "paid",
    paymentMethod: "Credit Card (HDFC)",
    shippingAddress: "B-204, Sea Breeze Towers, Worli, Mumbai 400018",
    date: "2026-07-24",
    items: [
      { id: "P-1011", title: "Adidas Ultraboost Light Running Shoes", price: 2990, qty: 2, image: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800" },
      { id: "P-1001", title: "Aurora Wireless Headphones", price: 6470, qty: 1, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800" },
    ],
  },
  {
    id: "#ORD-1090",
    customer: "Vikramaditya Singh",
    email: "vikram.singh@example.com",
    total: 24500,
    status: "shipped",
    paymentStatus: "paid",
    paymentMethod: "Net Banking (ICICI)",
    shippingAddress: "House 12, Golf Links Colony, New Delhi 110003",
    date: "2026-07-24",
    items: [
      { id: "P-1015", title: "Samsung Galaxy Tab S9 Ultra", price: 24500, qty: 1, image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800" },
    ],
  },
  {
    id: "#ORD-1089",
    customer: "Rohan Verma",
    email: "rohan.verma@example.com",
    total: 15400,
    status: "delivered",
    paymentStatus: "paid",
    paymentMethod: "UPI (PhonePe)",
    shippingAddress: "Flat 501, Jubilee Hills, Hyderabad 500033",
    date: "2026-07-23",
    items: [
      { id: "P-1001", title: "Aurora Wireless Headphones", price: 1499, qty: 2, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800" },
      { id: "P-1009", title: "Nike Air Max Pulse Sneakers", price: 12402, qty: 1, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800" },
    ],
  },
  {
    id: "#ORD-1088",
    customer: "Aakash Sharma",
    email: "aakash.sharma@example.com",
    total: 1499,
    status: "shipped",
    paymentStatus: "paid",
    paymentMethod: "Credit Card (HDFC)",
    shippingAddress: "Flat 402, Metro Residency, MG Road, Indiranagar, Bengaluru 560038",
    date: "2026-07-22",
    items: [
      { id: "P-1001", title: "Aurora Wireless Headphones", price: 1499, qty: 1, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800" },
    ],
  },
  {
    id: "#ORD-1087",
    customer: "Ananya Iyer",
    email: "ananya.iyer@example.com",
    total: 6750,
    status: "processing",
    paymentStatus: "paid",
    paymentMethod: "UPI (Paytm)",
    shippingAddress: "Plot 88, Anna Nagar West, Chennai 600040",
    date: "2026-07-21",
    items: [
      { id: "P-1003", title: "Leather Crossbody Bag", price: 6750, qty: 1, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800" },
    ],
  },
  {
    id: "#ORD-1086",
    customer: "Marcus Chen",
    email: "marcus.chen@example.com",
    total: 8990,
    status: "delivered",
    paymentStatus: "paid",
    paymentMethod: "Credit Card (Axis)",
    shippingAddress: "77 Park Street, Sector 5, Salt Lake, Kolkata 700091",
    date: "2026-07-21",
    items: [
      { id: "P-1009", title: "Nike Air Max Pulse Sneakers", price: 8990, qty: 1, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800" },
    ],
  },
  {
    id: "#ORD-1085",
    customer: "Arjun Mehta",
    email: "arjun.mehta@example.com",
    total: 18600,
    status: "delivered",
    paymentStatus: "paid",
    paymentMethod: "Net Banking (Kotak)",
    shippingAddress: "12 Viman Nagar Road, Pune 411014",
    date: "2026-07-20",
    items: [
      { id: "P-1015", title: "Samsung Galaxy Tab S9 Ultra", price: 18600, qty: 1, image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800" },
    ],
  },
  {
    id: "#ORD-1084",
    customer: "Sneha Kapoor",
    email: "sneha.kapoor@example.com",
    total: 4320,
    status: "pending",
    paymentStatus: "unpaid",
    paymentMethod: "Cash on Delivery",
    shippingAddress: "Flat 101, Green Glen Layout, Bellandur, Bengaluru 560103",
    date: "2026-07-19",
    items: [
      { id: "P-1001", title: "Aurora Wireless Headphones", price: 4320, qty: 2, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800" },
    ],
  },
  {
    id: "#ORD-1083",
    customer: "Kavita Patel",
    email: "kavita.patel@example.com",
    total: 11200,
    status: "delivered",
    paymentStatus: "paid",
    paymentMethod: "UPI (Google Pay)",
    shippingAddress: "55 CG Road, Navrangpura, Ahmedabad 380009",
    date: "2026-07-18",
    items: [
      { id: "P-1011", title: "Adidas Ultraboost Light Running Shoes", price: 11200, qty: 2, image: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800" },
    ],
  },
  {
    id: "#ORD-1074",
    customer: "Aakash Sharma",
    email: "aakash.sharma@example.com",
    total: 780,
    status: "pending",
    paymentStatus: "unpaid",
    paymentMethod: "Cash on Delivery",
    shippingAddress: "Metromindz Tech Park, Tower B, 5th Floor, Electronic City, Bengaluru 560100",
    date: "2026-07-20",
    items: [
      { id: "P-1003", title: "Leather Crossbody Bag", price: 780, qty: 1, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800" },
    ],
  },
  {
    id: "#ORD-1050",
    customer: "Aakash Sharma",
    email: "aakash.sharma@example.com",
    total: 5125,
    status: "delivered",
    paymentStatus: "paid",
    paymentMethod: "Net Banking (SBI)",
    shippingAddress: "Flat 402, Metro Residency, MG Road, Indiranagar, Bengaluru 560038",
    date: "2026-07-15",
    items: [
      { id: "P-1011", title: "Adidas Ultraboost Light Running Shoes", price: 2990, qty: 1, image: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800" },
      { id: "P-1001", title: "Aurora Wireless Headphones", price: 2135, qty: 1, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800" },
    ],
  },
];

const _legacyInvoices: Invoice[] = [
  { id: "INV-2026-0142", orderId: "#10234", customer: "Priya Shah", amount: 368.99, status: "paid", issued: "2026-07-25", due: "2026-08-08" },
  { id: "INV-2026-0141", orderId: "#10233", customer: "Marcus Chen", amount: 149.99, status: "paid", issued: "2026-07-25", due: "2026-08-08" },
  { id: "INV-2026-0140", orderId: "#10232", customer: "Lena Ortiz", amount: 78.0, status: "pending", issued: "2026-07-24", due: "2026-08-07" },
  { id: "INV-2026-0139", orderId: "#10231", customer: "Jonas Weber", amount: 512.5, status: "paid", issued: "2026-07-23", due: "2026-08-06" },
  { id: "INV-2026-0138", orderId: "#10225", customer: "Alex Rivera", amount: 245.0, status: "overdue", issued: "2026-07-01", due: "2026-07-15" },
  { id: "INV-2026-0137", orderId: "#10228", customer: "Yuki Tanaka", amount: 199.0, status: "paid", issued: "2026-07-20", due: "2026-08-03" },
];

const _legacyShipments: Shipment[] = [
  { id: "SHP-88112", orderId: "#10233", customer: "Marcus Chen", carrier: "UPS", tracking: "1Z999AA10123456784", status: "in_transit", destination: "Austin, TX", eta: "2026-07-28" },
  { id: "SHP-88111", orderId: "#10231", customer: "Jonas Weber", carrier: "DHL", tracking: "JD0002123456789", status: "delivered", destination: "Berlin, DE", eta: "2026-07-23" },
  { id: "SHP-88110", orderId: "#10228", customer: "Yuki Tanaka", carrier: "FedEx", tracking: "774893456712", status: "out_for_delivery", destination: "Tokyo, JP", eta: "2026-07-27" },
  { id: "SHP-88109", orderId: "#10230", customer: "Aisha Bello", carrier: "USPS", tracking: "9400111899223456123456", status: "delivered", destination: "Lagos, NG", eta: "2026-07-22" },
  { id: "SHP-88108", orderId: "#10234", customer: "Priya Shah", carrier: "UPS", tracking: "1Z999AA10123456799", status: "label_created", destination: "Mumbai, IN", eta: "2026-07-30" },
  { id: "SHP-88107", orderId: "#10220", customer: "Chris Wu", carrier: "FedEx", tracking: "774893456800", status: "returned", destination: "Toronto, CA", eta: "2026-07-19" },
];

const _legacyGateways: PaymentGateway[] = [
  { id: "gw-stripe", name: "Stripe", provider: "stripe", enabled: true, mode: "live", fees: "2.9% + ₹3", transactions30d: 1247, volume30d: 84210.5 },
  { id: "gw-paypal", name: "PayPal", provider: "paypal", enabled: true, mode: "live", fees: "3.49% + ₹5", transactions30d: 412, volume30d: 21540.0 },
  { id: "gw-paddle", name: "Paddle", provider: "paddle", enabled: false, mode: "test", fees: "5% + ₹5", transactions30d: 0, volume30d: 0 },
  { id: "gw-klarna", name: "Klarna", provider: "klarna", enabled: true, mode: "live", fees: "3.29% + ₹3", transactions30d: 118, volume30d: 9820.75 },
  { id: "gw-applepay", name: "Apple Pay", provider: "applepay", enabled: true, mode: "live", fees: "via Stripe", transactions30d: 302, volume30d: 18740.2 },
  { id: "gw-cod", name: "Cash on Delivery", provider: "cod", enabled: false, mode: "test", fees: "0%", transactions30d: 0, volume30d: 0 },
];

const _legacyRevenueSeries = [
  { day: "Mon", revenue: 4200 },
  { day: "Tue", revenue: 5100 },
  { day: "Wed", revenue: 4800 },
  { day: "Thu", revenue: 6300 },
  { day: "Fri", revenue: 7200 },
  { day: "Sat", revenue: 8100 },
  { day: "Sun", revenue: 6900 },
];

const _legacySavedAddresses: SavedAddress[] = [
  {
    id: "addr-1",
    label: "Home Address",
    name: "Aakash Sharma",
    phone: "+91 98765 43210",
    street: "102 Park Avenue, Flat 4B, Off Link Road",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    isDefault: true,
  },
  {
    id: "addr-2",
    label: "Office / Work",
    name: "Aakash Sharma (Metromindz)",
    phone: "+91 98765 12345",
    street: "Tech Hub Tower B, 5th Floor, BKC Complex",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400051",
  },
  {
    id: "addr-3",
    label: "Secondary / Family",
    name: "Aakash Sharma",
    phone: "+91 98111 22334",
    street: "45 Lotus Gardens, Koregaon Park Road",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
  },
];

// Runtime data is supplied by the API. These exports intentionally start empty.
export const products: Product[] = [];
export const orders: Order[] = [];
export const invoices: Invoice[] = [];
export const shipments: Shipment[] = [];
export const gateways: PaymentGateway[] = [];
export const revenueSeries: Array<{ day: string; revenue: number }> = [];
export const savedAddresses: SavedAddress[] = [];

export const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
