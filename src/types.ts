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
  userId: string;
  name: string;
  logoUrl: string;
  coverUrl: string;
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
  category: string;
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
}

export interface TouristRoute {
  id: string;
  name: string;
  description: string;
  mapImageUrl?: string;
  stops: RouteStop[];
}

export interface WebhookLog {
  id: string;
  action: string;
  payload: any;
  timestamp: string;
}
