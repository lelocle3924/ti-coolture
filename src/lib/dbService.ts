/**
 * Data layer — placeholder implementation.
 *
 * Firebase/Firestore was removed on 2026-08-14. The target stack (docs/SRS.md
 * §3.1) is Next.js 15 + Supabase (PostgreSQL) + Cloudflare R2, which does not
 * exist yet. Until it does, this module serves docs/03-CONTENT-PACK.md data
 * from memory.
 *
 * ── Why the indirection ──────────────────────────────────────────────────
 * The store underneath (src/lib/mock/) is shaped like the real Postgres
 * schema in SRS §4: snake_case columns, bilingual *_vi/*_en fields, price_vnd,
 * publish_status, map_x/map_y. This file is the ONLY adapter between that
 * shape and the camelCase types the views consume. When Supabase lands, the
 * row-reading helpers here become `supabase.from(...).select(...)` calls and
 * the views do not change.
 *
 * ── What is not real ─────────────────────────────────────────────────────
 * Writes mutate memory only and are lost on reload. Every shop, product,
 * price and route is invented placeholder content — see the warnings in
 * src/lib/mock/seed.ts. None of it may ship to a public demo.
 */

import { Product, StoreProfile, TouristRoute, UserProfile, RouteStop } from "../types";
import { seed } from "./mock/seed";
import type { Database, ProductRow, ShopRow } from "./mock/schema";

/** Session-scoped clone so writes never corrupt the seed module. */
const db: Database = JSON.parse(JSON.stringify(seed));

const LATENCY_MS = 120;
const delay = <T>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

/* ── row → view-model adapters ─────────────────────────────────────────── */

const statusFromPublish = (s: ProductRow["status"]): Product["status"] =>
  s === "published" ? "Approved" : s === "pending" ? "Pending" : "Rejected";

function imagesFor(productId: string): string[] {
  return db.product_images
    .filter((i) => i.product_id === productId)
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order)
    .map((i) => i.url);
}

function clicksFor(productId: string): number {
  return db.click_events.filter((e) => e.product_id === productId && e.label === "click").length;
}

function toProduct(row: ProductRow): Product {
  const shop = db.shops.find((s) => s.id === row.shop_id);
  const category = db.categories.find((c) => c.id === row.category_id);
  const materialLink = db.product_materials.find((m) => m.product_id === row.id);
  const material = db.materials.find((m) => m.id === materialLink?.material_id);

  return {
    id: row.id,
    storeId: row.shop_id,
    storeName: shop?.name ?? "",
    storeLogo: shop?.logo_url ?? undefined,
    name: row.name_vi,
    price: row.price_vnd ?? 0,
    currency: "VND",
    description: row.short_desc_vi ?? "",
    images: imagesFor(row.id),
    category: category?.name_vi ?? "",
    variants: row.variants.flatMap((v) => v.values.map((val) => val.vi)),
    material: material?.name_vi,
    size: row.dimensions ?? undefined,
    story: row.story_vi ?? undefined,
    clicks: clicksFor(row.id),
    views: 0,
    status: statusFromPublish(row.status),
    createdAt: row.created_at,
    hidden: row.status === "archived",
  };
}

/**
 * Moderation flags the app uses that the SRS schema has no column for yet
 * (hidden / deleteScheduledAt / accountDeleteRequested). Held beside the rows
 * rather than invented into them, so the real schema stays the source of truth.
 */
const shopFlags = new Map<string, Partial<StoreProfile>>();

function toStore(row: ShopRow): StoreProfile {
  const socials = db.shop_socials.filter((s) => s.shop_id === row.id && s.is_visible);
  const pick = (p: string) => socials.find((s) => s.platform === p)?.url;
  const flags = shopFlags.get(row.id) ?? {};

  return {
    id: row.id,
    userId: "",
    name: row.name,
    logoUrl: row.logo_url ?? "",
    coverUrl: row.cover_url ?? "",
    story: row.story_vi ?? "",
    vibe: row.tagline_vi ?? "",
    description: row.tagline_vi ?? undefined,
    phone: "",
    email: row.contact_email ?? "",
    address: row.address ?? row.area_tag ?? "",
    taxId: "",
    socials: {
      facebook: pick("facebook"),
      instagram: pick("instagram"),
      tiktok: pick("tiktok"),
      threads: pick("threads"),
      website: pick("website"),
      zalo: pick("zalo"),
    },
    socialToggles: {
      facebook: !!pick("facebook"),
      instagram: !!pick("instagram"),
      tiktok: !!pick("tiktok"),
      threads: !!pick("threads"),
      website: !!pick("website"),
      zalo: !!pick("zalo"),
    },
    registered: true,
    createdAt: row.created_at,
    status: row.status === "published" ? "Approved" : "Pending",
    hidden: row.status === "archived",
    ...flags,
  };
}

function toRoute(routeId: string): TouristRoute {
  const row = db.routes.find((r) => r.id === routeId)!;
  const stops: RouteStop[] = db.route_stops
    .filter((s) => s.route_id === routeId)
    .sort((a, b) => a.stop_number - b.stop_number)
    .map((s) => ({
      id: s.id,
      name: s.name_vi,
      address: s.external_url ?? s.address ?? "",
      description: s.description_vi ?? "",
      x: s.map_x,
      y: s.map_y,
    }));

  return {
    id: row.id,
    name: row.title_vi,
    description: row.description_vi ?? "",
    mapImageUrl: row.cover_url ?? undefined,
    stops,
  };
}

/* ── local user profiles (no auth backend yet) ────────────────────────── */

const USERS_KEY = "tcoolture_mock_profiles";

function readUsers(): Record<string, UserProfile> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeUsers(users: Record<string, UserProfile>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/* ── reads ─────────────────────────────────────────────────────────────── */

export async function fetchStores(): Promise<StoreProfile[]> {
  return delay(db.shops.filter((s) => s.status !== "archived").map(toStore));
}

export async function fetchStoreById(storeId: string): Promise<StoreProfile | null> {
  const row = db.shops.find((s) => s.id === storeId);
  return delay(row ? toStore(row) : null);
}

export async function fetchProducts(
  status: "Pending" | "Approved" | "Rejected" = "Approved",
  _opts?: { throwOnError?: boolean }
): Promise<Product[]> {
  const rows = db.products.filter((p) => statusFromPublish(p.status) === status);
  return delay(rows.map(toProduct));
}

export async function fetchAllProducts(): Promise<Product[]> {
  return delay(db.products.map(toProduct));
}

export async function fetchProductsStore(storeId: string): Promise<Product[]> {
  return delay(db.products.filter((p) => p.shop_id === storeId).map(toProduct));
}

export async function fetchProductById(productId: string): Promise<Product | null> {
  const row = db.products.find((p) => p.id === productId);
  return delay(row ? toProduct(row) : null);
}

export async function fetchTouristRoutes(_opts?: { throwOnError?: boolean }): Promise<TouristRoute[]> {
  const routes = db.routes
    .filter((r) => r.status === "published")
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => toRoute(r.id));
  return delay(routes);
}

export async function fetchMessageTemplate(): Promise<string> {
  const row = db.site_settings.find((s) => s.key === "message_template");
  return delay(row?.value ?? "");
}

/** Hidden Gems — SRS §4 stores these in featured_items alongside the carousel. */
export async function fetchHiddenGems(): Promise<Array<{ product: Product; note: string }>> {
  const gems = db.featured_items
    .filter((f) => f.placement === "hidden_gem" && f.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((f) => {
      const row = db.products.find((p) => p.id === f.product_id);
      return row ? { product: toProduct(row), note: f.note_vi ?? "" } : null;
    })
    .filter((g): g is { product: Product; note: string } => g !== null);
  return delay(gems);
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  topic: string;
  coverUrl: string;
  readMinutes: number;
  publishedAt: string;
}

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  const posts = db.blog_posts
    .filter((p) => p.status === "published")
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""))
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title_vi,
      excerpt: p.excerpt_vi ?? "",
      topic: db.blog_topics.find((t) => t.id === p.topic_id)?.name_vi ?? "",
      coverUrl: p.cover_url ?? "",
      readMinutes: p.read_minutes,
      publishedAt: p.published_at ?? "",
    }));
  return delay(posts);
}

export interface Collection {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverUrl: string;
  productCount: number;
}

export async function fetchCollections(): Promise<Collection[]> {
  const collections = db.collections
    .filter((c) => c.status === "published")
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title_vi,
      description: c.description_vi ?? "",
      coverUrl: c.cover_url ?? "",
      productCount: db.collection_products.filter((cp) => cp.collection_id === c.id).length,
    }));
  return delay(collections);
}

/* ── writes (memory only) ─────────────────────────────────────────────── */

export async function triggerWebhook(action: string, payload: any) {
  // The webhook logger lived in the deleted Express server. Kept as a no-op so
  // call sites stay intact until the new backend defines its own events.
  console.debug(`[event] ${action}`, payload);
}

export async function incrementProductClick(productId: string): Promise<void> {
  db.click_events.push({
    id: `clk-${Date.now()}`,
    product_id: productId,
    label: "click",
    page_path: window.location.pathname,
    created_at: new Date().toISOString(),
  });
}

export async function incrementProductView(productId: string): Promise<void> {
  db.click_events.push({
    id: `view-${Date.now()}`,
    product_id: productId,
    label: "view",
    page_path: window.location.pathname,
    created_at: new Date().toISOString(),
  });
}

export async function getOrCreateUserProfile(
  userId: string,
  email: string,
  password?: string
): Promise<UserProfile> {
  const users = readUsers();
  if (!users[userId]) {
    users[userId] = {
      id: userId,
      email,
      role: "User",
      wishlist: [],
      followedShops: [],
      createdAt: new Date().toISOString(),
      password,
    };
    writeUsers(users);
  }
  return delay(clone(users[userId]));
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  const match = Object.values(readUsers()).find((u) => u.email === email);
  return delay(match ? clone(match) : null);
}

export async function resetUserPassword(email: string, newPassword: string): Promise<void> {
  const users = readUsers();
  const match = Object.values(users).find((u) => u.email === email);
  if (match) {
    users[match.id] = { ...match, password: newPassword };
    writeUsers(users);
  }
}

export async function toggleWishlist(userId: string, productId: string): Promise<string[]> {
  const users = readUsers();
  const user = users[userId];
  if (!user) return [];
  const next = user.wishlist.includes(productId)
    ? user.wishlist.filter((id) => id !== productId)
    : [...user.wishlist, productId];
  users[userId] = { ...user, wishlist: next };
  writeUsers(users);
  return delay(next);
}

export async function saveWishlistNote(userId: string, productId: string, note: string): Promise<void> {
  const users = readUsers();
  const user = users[userId];
  if (!user) return;
  users[userId] = { ...user, wishlistNotes: { ...(user.wishlistNotes || {}), [productId]: note } };
  writeUsers(users);
}

export async function toggleFollowShop(userId: string, storeId: string): Promise<string[]> {
  const users = readUsers();
  const user = users[userId];
  if (!user) return [];
  const next = user.followedShops.includes(storeId)
    ? user.followedShops.filter((id) => id !== storeId)
    : [...user.followedShops, storeId];
  users[userId] = { ...user, followedShops: next };
  writeUsers(users);
  return delay(next);
}

export async function upsertStoreProfile(storeId: string, storeData: Partial<StoreProfile>): Promise<void> {
  const row = db.shops.find((s) => s.id === storeId);
  if (!row) return;
  if (storeData.name !== undefined) row.name = storeData.name;
  if (storeData.vibe !== undefined) row.tagline_vi = storeData.vibe;
  if (storeData.story !== undefined) row.story_vi = storeData.story;
  if (storeData.logoUrl !== undefined) row.logo_url = storeData.logoUrl;
  if (storeData.coverUrl !== undefined) row.cover_url = storeData.coverUrl;
  if (storeData.email !== undefined) row.contact_email = storeData.email;
  if (storeData.address !== undefined) row.address = storeData.address;

  const flagKeys = ["hidden", "deleteScheduledAt", "accountDeleteRequested", "status", "rejectionReason"] as const;
  const nextFlags = { ...(shopFlags.get(storeId) ?? {}) };
  for (const key of flagKeys) {
    if (storeData[key] !== undefined) (nextFlags as any)[key] = storeData[key];
  }
  shopFlags.set(storeId, nextFlags);

  row.updated_at = new Date().toISOString();
}

/** Deletes a shop and every product belonging to it. */
export async function deleteStore(storeId: string): Promise<void> {
  const productIds = db.products.filter((p) => p.shop_id === storeId).map((p) => p.id);
  db.products = db.products.filter((p) => p.shop_id !== storeId);
  db.product_images = db.product_images.filter((i) => !productIds.includes(i.product_id));
  db.shops = db.shops.filter((s) => s.id !== storeId);
  db.shop_socials = db.shop_socials.filter((s) => s.shop_id !== storeId);
  shopFlags.delete(storeId);
}

/** How many saved lists hold this product. */
export async function countWishlistHolders(productId: string): Promise<number> {
  const users = Object.values(readUsers());
  return delay(users.filter((u) => u.wishlist.includes(productId)).length);
}

export async function createProduct(
  productData: Omit<Product, "id" | "createdAt" | "clicks">
): Promise<string> {
  const id = `prod-local-${Date.now()}`;
  const now = new Date().toISOString();
  db.products.push({
    id,
    shop_id: productData.storeId,
    category_id: db.categories.find((c) => c.name_vi === productData.category)?.id ?? db.categories[0].id,
    slug: id,
    name_vi: productData.name,
    name_en: null,
    short_desc_vi: productData.description ?? null,
    short_desc_en: null,
    story_vi: productData.story ?? null,
    story_en: null,
    price_vnd: productData.price,
    price_note_vi: "Giá tham khảo, giá cuối do shop quyết định",
    price_updated_at: now.slice(0, 10),
    dimensions: productData.size ?? null,
    status: "pending",
    is_featured: false,
    published_at: null,
    created_at: now,
    updated_at: now,
    variants: [],
  });
  (productData.images || []).forEach((url, i) => {
    db.product_images.push({
      id: `img-${id}-${i}`,
      product_id: id,
      url,
      alt_vi: productData.name,
      alt_en: null,
      is_cover: i === 0,
      sort_order: i,
      width: null,
      height: null,
    });
  });
  return id;
}

export async function updateProduct(productId: string, productData: Partial<Product>): Promise<void> {
  const row = db.products.find((p) => p.id === productId);
  if (!row) return;
  if (productData.name !== undefined) row.name_vi = productData.name;
  if (productData.price !== undefined) row.price_vnd = productData.price;
  if (productData.description !== undefined) row.short_desc_vi = productData.description;
  if (productData.story !== undefined) row.story_vi = productData.story;
  if (productData.hidden !== undefined) row.status = productData.hidden ? "archived" : "published";
  row.updated_at = new Date().toISOString();
}

export async function moderateProduct(
  productId: string,
  status: "Approved" | "Rejected",
  _rejectionReason?: string
): Promise<void> {
  const row = db.products.find((p) => p.id === productId);
  if (!row) return;
  row.status = status === "Approved" ? "published" : "draft";
  row.published_at = status === "Approved" ? new Date().toISOString() : null;
}

export async function moderateStore(
  storeId: string,
  status: "Approved" | "Rejected",
  _rejectionReason?: string
): Promise<void> {
  const row = db.shops.find((s) => s.id === storeId);
  if (!row) return;
  row.status = status === "Approved" ? "published" : "draft";
}

export async function requestDeleteProduct(productId: string): Promise<void> {
  const row = db.products.find((p) => p.id === productId);
  if (row) row.status = "pending";
}

export async function permanentlyDeleteProduct(productId: string): Promise<void> {
  db.products = db.products.filter((p) => p.id !== productId);
  db.product_images = db.product_images.filter((i) => i.product_id !== productId);
}

export async function updateMessageTemplate(template: string): Promise<void> {
  const row = db.site_settings.find((s) => s.key === "message_template");
  if (row) row.value = template;
  else db.site_settings.push({ key: "message_template", value: template });
}

/* ── analytics ─────────────────────────────────────────────────────────── */

export interface ButtonClickStat {
  id: string;
  buttonText: string;
  pagePath: string;
  count: number;
  lastClicked: string;
}

export async function recordButtonClick(buttonText: string, pagePath: string) {
  db.click_events.push({
    id: `btn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    product_id: null,
    label: buttonText,
    page_path: pagePath,
    created_at: new Date().toISOString(),
  });
}

export async function fetchButtonClickStats(): Promise<ButtonClickStat[]> {
  const grouped = new Map<string, ButtonClickStat>();
  for (const e of db.click_events) {
    if (e.product_id) continue;
    const key = `${e.label}::${e.page_path}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.count += 1;
      existing.lastClicked = e.created_at;
    } else {
      grouped.set(key, {
        id: key,
        buttonText: e.label,
        pagePath: e.page_path,
        count: 1,
        lastClicked: e.created_at,
      });
    }
  }
  return delay([...grouped.values()].sort((a, b) => b.count - a.count));
}

export async function logApprovalActivity(_logData: Record<string, any>): Promise<void> {
  // SRS §4 defines audit_logs for this. No backend to write to yet.
}

export async function fetchApprovalLogs(_storeId?: string): Promise<any[]> {
  return delay([]);
}
