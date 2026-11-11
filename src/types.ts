export type UserRole = "User" | "Shop" | "Admin";

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  wishlist: string[]; // Product IDs
  wishlistNotes?: Record<string, string>; // Product ID -> User custom note
  wishlistPriceAlerts?: Record<string, number>; // Product ID -> Target price alert
  followedShops: string[]; // Store/Shop IDs
  createdAt: string;
  password?: string; // Stored password for verification & reset flow
}

export interface StoreSocials {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  threads?: string;
  website?: string;
  zalo?: string;
}

export interface StoreSocialToggles {
  facebook: boolean;
  instagram: boolean;
  tiktok: boolean;
  threads: boolean;
  website: boolean;
  zalo: boolean;
}

export interface StoreProfile {
  id: string;
  slug?: string;
  userId: string;
  name: string;
  logoUrl: string;
  coverUrl: string;
  heroImageUrl?: string;
  story: string;
  vibe: string;
  description?: string;
  phone: string;
  email: string;
  address: string;
  taxId: string; // Mã số thuế
  socials: StoreSocials;
  socialToggles: StoreSocialToggles;
  registered: boolean;
  createdAt: string;
  status?: "Pending" | "Approved" | "Rejected";
  rejectionReason?: string;
  hidden?: boolean;
  deleteScheduledAt?: string | null;
  accountDeleteRequested?: boolean;
}

export interface Product {
  id: string;
  storeId: string;
  storeName: string;
  storeLogo?: string;
  name: string;
  price: number;
  currency: string; // e.g. "VND"
  description: string;
  images: string[]; // 1 main square + thumbnails
  /** The kind of product — a leaf of the taxonomy, e.g. "Đèn". */
  category: string;
  categorySlug: string;
  /** The group that kind sits in, e.g. "Nội thất". Both, because /products
      tabs by group and chips by kind, and the card names the kind. */
  categoryGroup: string;
  categoryGroupSlug: string;
  variants: string[];
  material?: string;
  size?: string;
  brand?: string;
  story?: string;
  clicks: number; // For "Popular Now"
  views?: number; // View counter
  deleteRequested?: boolean; // Deletion request state
  status: "Pending" | "Approved" | "Rejected";
  rejectionReason?: string;
  createdAt: string;
  hidden?: boolean;
}

export interface RouteStop {
  id: string;
  name: string;
  address: string;
  description: string;
  x: number; // percentage horizontal position for custom map mockup
  y: number; // percentage vertical position for custom map mockup
  /** Kinds of place, at least one — see DISCOVER_CATEGORIES; placeholder taxonomy for now. */
  categories: string[];
  /** The place's own pin on Google Maps, when one is on file. */
  mapUrl?: string;
}

export interface TouristRoute {
  id: string;
  name: string;
  description: string;
  mapImageUrl?: string;
  stops: RouteStop[];
}

/** One node of the two-level product taxonomy. Leaves have no children. */
export interface CategoryNode {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  children: CategoryNode[];
}

export interface WebhookLog {
  id: string;
  action: string;
  payload: any;
  timestamp: string;
}

// ============ ANALYTICS & DASHBOARD TYPES ============

export type TrackingEventType =
  | "page_view"
  | "product_view"
  | "shop_view"
  | "wishlist_toggle"
  | "outbound_click"
  | "search_query";

export type OutboundPlatform =
  | "shopee"
  | "instagram"
  | "zalo"
  | "tiktok"
  | "facebook"
  | "threads"
  | "website";

export interface TrackingPayload {
  type: TrackingEventType;
  productId?: string;
  shopId?: string;
  targetUrl?: string;
  platform?: OutboundPlatform;
  isNewVisitor?: boolean;
  deviceType?: "mobile" | "desktop" | "tablet";
  referrerSource?: "organic" | "social" | "direct" | "referral" | "other";
  searchQuery?: string;
  favoriteDelta?: 1 | -1;
}

export interface DashboardKpis {
  totalVisitors: number;
  totalVisitorsChange: number;
  totalPageViews: number;
  totalPageViewsChange: number;
  activeShops: number;
  activeShopsChange: number;
  pendingShops: number;
  totalListedProducts: number;
  totalListedProductsChange: number;
  newProductsAdded: number;
}

export interface VisitorsTimePoint {
  date: string;
  newVisitors: number;
  returningVisitors: number;
}

export interface NewVsReturningMetric {
  newCount: number;
  newPercent: number;
  returningCount: number;
  returningPercent: number;
}

export interface DevicesMetric {
  mobilePercent: number;
  desktopPercent: number;
  tabletPercent: number;
}

export interface TrafficSourceMetric {
  source: string;
  sharePercent: number;
}

export interface CategoryMetric {
  category: string;
  percentage: number;
}

export interface ProductLeaderboardItem {
  id: string;
  rank: number;
  name: string;
  shopName: string;
  count: number;
}

export interface ShopLeaderboardItem {
  id: string;
  rank: number;
  name: string;
  count: number;
}

export interface SearchKeywordMetric {
  keyword: string;
  count: number;
}

export interface FunnelStage {
  stageKey: string;
  label: string;
  count: number;
  dropOffCount: number;
  dropOffRate: number;
  conversionRateFromPrevious: number;
}

export interface ConversionFunnelMetric {
  stages: FunnelStage[];
  overallConversionRate: number;
  outboundByPlatform: Record<string, number>;
}

export interface DashboardOverviewResponse {
  kpis: DashboardKpis;
  visitorsOverTime: VisitorsTimePoint[];
  newVsReturning: NewVsReturningMetric;
  devices: DevicesMetric;
  trafficSources: TrafficSourceMetric[];
  topCategories: CategoryMetric[];
  topProductsViewed: ProductLeaderboardItem[];
  topProductsFavorited: ProductLeaderboardItem[];
  topShops: ShopLeaderboardItem[];
  topSearchKeywords: SearchKeywordMetric[];
  conversionFunnel: ConversionFunnelMetric;
}

