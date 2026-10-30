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
 * Writes mutate memory only and are lost on reload. Every shop, product and
 * price is invented placeholder content — see the warnings in
 * src/lib/mock/seed.ts. None of it may ship to a public demo. The places on
 * the map are the exception since 14/09: they are the team's own list.
 */

import { CategoryNode, Product, StoreProfile, TouristRoute, UserProfile, UserRole, RouteStop } from "../types";
import { seed } from "./mock/seed";
import type { Database, ProductRow, ShopRow } from "./mock/schema";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { resolveProductCategory, getCanonicalCategoryTree } from "./taxonomy";

export type DataSourceMode = "mock" | "real";

export function getDataSourceMode(): DataSourceMode {
  if (typeof window === "undefined") return "real";
  const stored = localStorage.getItem("ti_data_source_mode") as DataSourceMode | null;
  if (stored === "mock" || stored === "real") return stored;
  return isSupabaseConfigured ? "real" : "mock";
}

export function setDataSourceMode(mode: DataSourceMode) {
  if (typeof window !== "undefined") {
    localStorage.setItem("ti_data_source_mode", mode);
    window.dispatchEvent(new CustomEvent("ti_data_source_changed", { detail: mode }));
  }
}

export function isSandboxEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("ti_admin_sandbox_mode") === "true";
}

export function setSandboxEnabled(enabled: boolean) {
  if (typeof window !== "undefined") {
    localStorage.setItem("ti_admin_sandbox_mode", enabled ? "true" : "false");
    window.dispatchEvent(new CustomEvent("ti_sandbox_changed", { detail: enabled }));
  }
}

export function getSandboxOverrides(): {
  products: Record<string, "published" | "hidden" | "rejected" | "pending_review">;
  shops: Record<string, "published" | "hidden">;
} {
  if (typeof window === "undefined") return { products: {}, shops: {} };
  try {
    return JSON.parse(localStorage.getItem("ti_admin_sandbox_overrides") || '{"products":{},"shops":{}}');
  } catch {
    return { products: {}, shops: {} };
  }
}

export function setSandboxOverrides(overrides: {
  products?: Record<string, "published" | "hidden" | "rejected" | "pending_review">;
  shops?: Record<string, "published" | "hidden">;
}) {
  if (typeof window === "undefined") return;
  const current = getSandboxOverrides();
  const updated = {
    products: { ...current.products, ...(overrides.products || {}) },
    shops: { ...current.shops, ...(overrides.shops || {}) },
  };
  localStorage.setItem("ti_admin_sandbox_overrides", JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("ti_sandbox_changed", { detail: updated }));
}

export function clearSandboxOverrides() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("ti_admin_sandbox_overrides");
    window.dispatchEvent(new CustomEvent("ti_sandbox_changed"));
  }
}


const R2_PUBLIC_DOMAIN =
  import.meta.env.VITE_R2_PUBLIC_DOMAIN ||
  import.meta.env.R2_PUBLIC_DOMAIN ||
  "https://pub-eb634fe5fce842bfb049a6bc69cf067d.r2.dev";

export function resolveImageUrl(url?: string | null): string {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }
  // Chặn đường dẫn rác chứa tiền tố blob:
  if (url.includes("blob:")) {
    return "";
  }
  return `${R2_PUBLIC_DOMAIN.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;
}

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
  /* A product is filed against a leaf; the group is read off the leaf rather
     than stored on the product, so the two can never disagree. */
  const category = db.categories.find((c) => c.id === row.category_id);
  const resolved = resolveProductCategory(category?.name_vi || category?.slug || row.category_id);
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
    category: resolved.category,
    categorySlug: resolved.categorySlug,
    categoryGroup: resolved.categoryGroup,
    categoryGroupSlug: resolved.categoryGroupSlug,
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
      address: s.address ?? "",
      mapUrl: s.external_url ?? undefined,
      description: s.description_vi ?? "",
      x: s.map_x,
      y: s.map_y,
      categories: s.categories,
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
  if (getDataSourceMode() === "real" && supabase) {
    try {
      const { data, error } = await supabase
        .from("shops")
        .select("*, shop_socials(*)")
        .eq("status", "published");

      if (!error && data) {
        const sandbox = isSandboxEnabled() ? getSandboxOverrides() : { shops: {}, products: {} };
        const filtered = data.filter((row: any) => {
          if (sandbox.shops[row.id] === "hidden") return false;
          return true;
        });
        return filtered.map((row: any) => {
          const socials = row.shop_socials || [];
          const pick = (p: string) => socials.find((s: any) => s.platform === p)?.url;
          return {
            id: row.id,
            userId: "",
            name: row.name,
            logoUrl: resolveImageUrl(row.logo_url),
            coverUrl: resolveImageUrl(row.cover_url),
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
            status: "Approved",
            hidden: false,
          };
        });
      }
    } catch (e) {
      console.warn("Error fetching real stores from Supabase:", e);
    }
  }
  const sandbox = isSandboxEnabled() ? getSandboxOverrides() : { shops: {}, products: {} };
  return delay(
    db.shops
      .filter((s) => s.status !== "archived" && sandbox.shops[s.id] !== "hidden")
      .map(toStore)
  );
}

export async function fetchStoreById(storeId: string): Promise<StoreProfile | null> {
  if (getDataSourceMode() === "real" && supabase) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId);
      const query = supabase
        .from("shops")
        .select("*, shop_socials(*)")
        .eq("status", "published");
      const { data, error } = await (isUuid ? query.eq("id", storeId) : query.eq("slug", storeId)).maybeSingle();

      if (!error && data) {
        const socials = data.shop_socials || [];
        const pick = (p: string) => socials.find((s: any) => s.platform === p)?.url;
        return {
          id: data.id,
          userId: "",
          name: data.name,
          logoUrl: resolveImageUrl(data.logo_url),
          coverUrl: resolveImageUrl(data.cover_url),
          story: data.story_vi ?? "",
          vibe: data.tagline_vi ?? "",
          description: data.tagline_vi ?? undefined,
          phone: "",
          email: data.contact_email ?? "",
          address: data.address ?? data.area_tag ?? "",
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
          createdAt: data.created_at,
          status: "Approved",
          hidden: false,
        };
      }
    } catch (e) {
      console.warn("Error fetching real store by id:", e);
    }
  }
  const row = db.shops.find((s) => s.id === storeId || s.slug === storeId);
  return delay(row ? toStore(row) : null);
}

export async function fetchProducts(
  status: "Pending" | "Approved" | "Rejected" = "Approved",
  _opts?: { throwOnError?: boolean }
): Promise<Product[]> {
  if (getDataSourceMode() === "real" && supabase) {
    try {
      const dbStatus = status === "Approved" ? "published" : status === "Pending" ? "pending_review" : "rejected";
      let productQuery = supabase
        .from("products")
        .select("*, shops!inner(*), categories(*), product_images(*)")
        .eq("status", dbStatus)
        .eq("shops.status", "published");
      if (status === "Approved") {
        productQuery = productQuery
          .eq("product_hidden", false)
          .eq("shop_hidden", false);
      }
      const { data, error } = await productQuery;

      if (!error && data) {
        const sandbox = isSandboxEnabled() ? getSandboxOverrides() : { shops: {}, products: {} };
        const filtered = data.filter((row: any) => {
          if (sandbox.products[row.id] === "hidden" || sandbox.products[row.id] === "rejected") return false;
          if (sandbox.shops[row.shop_id] === "hidden") return false;
          return true;
        });
        return filtered.map((row: any) => {
          const shop = row.shops;
          const category = row.categories;
          const images = (row.product_images || [])
            .sort((a: any, b: any) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order)
            .map((img: any) => resolveImageUrl(img.url));

          const resolved = resolveProductCategory(
            category?.slug || category?.id || category?.name_vi || row.category_id
          );
          const matVal = Array.isArray(row.variants)
            ? (row.variants.find((v: any) => v.type === "material")?.value || "")
            : "";
          const variantList = Array.isArray(row.variants)
            ? row.variants.map((v: any) => v.value || v.name || String(v))
            : [];

          return {
            id: row.id,
            storeId: row.shop_id,
            storeName: shop?.name ?? "",
            storeLogo: shop?.logo_url ? resolveImageUrl(shop.logo_url) : undefined,
            name: row.name_vi,
            price: row.price_vnd ?? 0,
            currency: "VND",
            description: row.short_desc_vi ?? "",
            images: images.length > 0 ? images : ["https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500"],
            category: resolved.category,
            categorySlug: resolved.categorySlug,
            categoryGroup: resolved.categoryGroup,
            categoryGroupSlug: resolved.categoryGroupSlug,
            variants: variantList,
            material: matVal,
            size: row.dimensions ?? undefined,
            story: row.story_vi ?? undefined,
            clicks: 0,
            views: 0,
            status,
            createdAt: row.created_at,
            hidden: false,
          };
        });
      }
      throw error ?? new Error("Không tải được sản phẩm từ database.");
    } catch (e) {
      console.warn("Error fetching real products:", e);
      if (_opts?.throwOnError) throw e;
      return [];
    }
  }
  if (getDataSourceMode() === "real") {
    if (_opts?.throwOnError) throw new Error("Chưa cấu hình kết nối database.");
    return [];
  }
  const sandbox = isSandboxEnabled() ? getSandboxOverrides() : { shops: {}, products: {} };
  const rows = db.products.filter((p) => {
    if (sandbox.products[p.id] === "hidden" || sandbox.products[p.id] === "rejected") return false;
    if (sandbox.shops[p.shop_id] === "hidden") return false;
    return statusFromPublish(p.status) === status;
  });
  return delay(rows.map(toProduct));
}

export async function fetchAllProducts(): Promise<Product[]> {
  return fetchProducts("Approved");
}

export async function fetchProductsStore(storeId: string): Promise<Product[]> {
  if (getDataSourceMode() === "real" && supabase) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId);
      let targetShopId = storeId;
      if (!isUuid) {
        const { data: s } = await supabase
          .from("shops")
          .select("id")
          .eq("slug", storeId)
          .eq("status", "published")
          .maybeSingle();
        if (s?.id) targetShopId = s.id;
        else return [];
      }
      const sandbox = isSandboxEnabled() ? getSandboxOverrides() : { shops: {}, products: {} };
      if (sandbox.shops[targetShopId] === "hidden") {
        return [];
      }

      const { data, error } = await supabase
        .from("products")
        .select("*, shops!inner(*), categories(*), product_images(*)")
        .eq("shop_id", targetShopId)
        .eq("status", "published")
        .eq("shops.status", "published")
        .eq("product_hidden", false)
        .eq("shop_hidden", false);

      if (!error && data) {
        const filtered = data.filter((row: any) => {
          if (sandbox.products[row.id] === "hidden" || sandbox.products[row.id] === "rejected") return false;
          return true;
        });
        return filtered.map((row: any) => {
          const shop = row.shops;
          const category = row.categories;
          const images = (row.product_images || [])
            .sort((a: any, b: any) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order)
            .map((img: any) => resolveImageUrl(img.url));

          const resolved = resolveProductCategory(
            category?.slug || category?.id || category?.name_vi || row.category_id
          );
          const matVal = Array.isArray(row.variants)
            ? (row.variants.find((v: any) => v.type === "material")?.value || "")
            : "";
          const variantList = Array.isArray(row.variants)
            ? row.variants.map((v: any) => v.value || v.name || String(v))
            : [];

          return {
            id: row.id,
            storeId: row.shop_id,
            storeName: shop?.name ?? "",
            storeLogo: shop?.logo_url ? resolveImageUrl(shop.logo_url) : undefined,
            name: row.name_vi,
            price: row.price_vnd ?? 0,
            currency: "VND",
            description: row.short_desc_vi ?? "",
            images: images.length > 0 ? images : ["https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500"],
            category: resolved.category,
            categorySlug: resolved.categorySlug,
            categoryGroup: resolved.categoryGroup,
            categoryGroupSlug: resolved.categoryGroupSlug,
            variants: variantList,
            material: matVal,
            size: row.dimensions ?? undefined,
            story: row.story_vi ?? undefined,
            clicks: 0,
            views: 0,
            status: "Approved",
            createdAt: row.created_at,
            hidden: false,
          };
        });
      }
    } catch (e) {
      console.warn("Error fetching real products for store:", e);
    }
  }
  const sandbox = isSandboxEnabled() ? getSandboxOverrides() : { shops: {}, products: {} };
  const shop = db.shops.find((row) => row.id === storeId || row.slug === storeId);
  if (
    !shop ||
    statusFromPublish(shop.status) !== "Approved" ||
    sandbox.shops[shop.id] === "hidden"
  ) {
    return delay([]);
  }
  return delay(
    db.products
      .filter((p) => {
        if (p.shop_id !== shop.id || statusFromPublish(p.status) !== "Approved") return false;
        if (sandbox.products[p.id] === "hidden" || sandbox.products[p.id] === "rejected") return false;
        return true;
      })
      .map(toProduct)
  );
}

export async function fetchProductById(productId: string): Promise<Product | null> {
  if (getDataSourceMode() === "real" && supabase) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
      const query = supabase
        .from("products")
        .select("*, shops!inner(*), categories(*), product_images(*)")
        .eq("status", "published")
        .eq("shops.status", "published")
        .eq("product_hidden", false)
        .eq("shop_hidden", false);
      const { data, error } = await (isUuid ? query.eq("id", productId) : query.eq("slug", productId)).maybeSingle();

      if (!error && data) {
        const shop = data.shops;
        const category = data.categories;
        const images = (data.product_images || [])
          .sort((a: any, b: any) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order)
          .map((img: any) => resolveImageUrl(img.url));

        const resolved = resolveProductCategory(
          category?.slug || category?.id || category?.name_vi || data.category_id
        );
        const matVal = Array.isArray(data.variants)
          ? (data.variants.find((v: any) => v.type === "material")?.value || "")
          : "";
        const variantList = Array.isArray(data.variants)
          ? data.variants.map((v: any) => v.value || v.name || String(v))
          : [];

        return {
          id: data.id,
          storeId: data.shop_id,
          storeName: shop?.name ?? "",
          storeLogo: shop?.logo_url ? resolveImageUrl(shop.logo_url) : undefined,
          name: data.name_vi,
          price: data.price_vnd ?? 0,
          currency: "VND",
          description: data.short_desc_vi ?? "",
          images: images.length > 0 ? images : ["https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500"],
          category: resolved.category,
          categorySlug: resolved.categorySlug,
          categoryGroup: resolved.categoryGroup,
          categoryGroupSlug: resolved.categoryGroupSlug,
          variants: variantList,
          material: matVal,
          size: data.dimensions ?? undefined,
          story: data.story_vi ?? undefined,
          clicks: 0,
          views: 0,
          status: "Approved",
          createdAt: data.created_at,
          hidden: false,
        };
      }
    } catch (e) {
      console.warn("Error fetching real product by id:", e);
    }
  }
  const sandbox = isSandboxEnabled() ? getSandboxOverrides() : { shops: {}, products: {} };
  const row = db.products.find((p) => {
    if (p.id !== productId && p.slug !== productId) return false;
    const shop = db.shops.find((candidate) => candidate.id === p.shop_id);
    if (!shop || statusFromPublish(shop.status) !== "Approved") return false;
    if (statusFromPublish(p.status) !== "Approved") return false;
    if (sandbox.shops[p.shop_id] === "hidden") return false;
    if (sandbox.products[p.id] === "hidden" || sandbox.products[p.id] === "rejected") return false;
    return true;
  });
  return delay(row ? toProduct(row) : null);
}

/**
 * The product taxonomy as a tree — seven groups, each with its kinds.
 *
 * Returned whole rather than derived from the products on the page, because
 * the team's list is a statement of what the site stocks, not a summary of
 * what it happens to hold today: a kind with nothing in it still belongs on
 * the strip. /products pairs it with live counts and refuses to let an empty
 * one be pressed, which is the half of the 08/09 chip bug that mattered.
 */
export async function fetchCategoryTree(): Promise<CategoryNode[]> {
  return delay(getCanonicalCategoryTree());
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

/** Hidden Gems uses the published product pool, shared with the homepage. */
export async function fetchHiddenGems(products?: Product[]): Promise<Array<{ product: Product; note: string }>> {
  const pool = products ?? await fetchProducts("Approved", { throwOnError: true });
  return pool.map((product) => ({ product, note: product.description ?? "" }));
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
  password?: string,
  role?: UserRole
): Promise<UserProfile> {
  const users = readUsers();
  if (!users[userId]) {
    users[userId] = {
      id: userId,
      email,
      role: role || "User",
      wishlist: [],
      followedShops: [],
      createdAt: new Date().toISOString(),
      password,
    };
    writeUsers(users);
  }
  return delay(clone(users[userId]));
}

export async function checkSingleRoleConflict(
  email: string,
  targetRole: UserRole
): Promise<{ conflict: boolean; message?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return { conflict: false };

  // 1. Check local users
  const localUser = Object.values(readUsers()).find((u) => u.email.toLowerCase() === cleanEmail);
  if (localUser && localUser.role !== targetRole) {
    const roleMap: Record<string, string> = {
      Admin: "Ban Quản Trị (Admin)",
      Shop: "Chủ Shop",
      User: "Khách hàng (User)",
    };
    return {
      conflict: true,
      message: `Email này đã được đăng ký vai trò ${roleMap[localUser.role] || localUser.role}. Mỗi Gmail chỉ được đăng ký duy nhất 1 vai trò!`,
    };
  }

  // 2. Check Supabase staff_members (Admin/Staff)
  if (supabase) {
    try {
      const { data: staff } = await supabase
        .from("staff_members")
        .select("user_id, role, is_active")
        .eq("email", cleanEmail)
        .eq("is_active", true)
        .maybeSingle();

      if (staff && targetRole !== "Admin") {
        return {
          conflict: true,
          message: "Email này đã thuộc Ban Quản Trị (Admin). Mỗi Gmail chỉ được đăng ký duy nhất 1 vai trò!",
        };
      }

      // Check shop_invitations
      const { data: shopInv } = await supabase
        .from("shop_invitations")
        .select("id")
        .eq("invited_email", cleanEmail)
        .maybeSingle();

      if (shopInv && targetRole !== "Shop") {
        return {
          conflict: true,
          message: "Email này đã được cấp quyền Shop trên hệ thống. Mỗi Gmail chỉ được đăng ký duy nhất 1 vai trò!",
        };
      }
    } catch (e) {
      console.warn("checkSingleRoleConflict DB query skipped:", e);
    }
  }

  return { conflict: false };
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
  /* The three category fields beyond `category` are read off the taxonomy
     when a product is loaded, not written by whoever creates one — asking a
     submission form for them would be asking it to restate the tree. */
  productData: Omit<
    Product,
    "id" | "createdAt" | "clicks" | "categorySlug" | "categoryGroup" | "categoryGroupSlug"
  >
): Promise<string> {
  const id = `prod-local-${Date.now()}`;
  const now = new Date().toISOString();
  db.products.push({
    id,
    shop_id: productData.storeId,
    /* A leaf, never a group: db.categories[0] is "Thời trang", which holds
       no products directly, so falling back to it would file the product
       somewhere no filter reaches. */
    /* A leaf, never a group: resolve accurately with taxonomy */
    category_id: (() => {
      const resolvedCat = resolveProductCategory(productData.category);
      const matched = db.categories.find(
        (c) => c.slug === resolvedCat.categorySlug || c.name_vi === resolvedCat.category
      );
      return matched?.id ?? db.categories.find((c) => c.parent_id !== null)!.id;
    })(),
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
    variants: productData.variants?.map((v) => ({ name: { vi: v, en: v }, values: [{ vi: v, en: v }] })) ?? [],
  });

  if (productData.material) {
    let mat = db.materials.find((m) => m.name_vi.toLowerCase() === productData.material!.toLowerCase());
    if (!mat) {
      mat = {
        id: `mat-${Date.now()}`,
        slug: `mat-${Date.now()}`,
        name_vi: productData.material,
        name_en: productData.material,
      };
      db.materials.push(mat);
    }
    db.product_materials.push({ product_id: id, material_id: mat.id });
  }

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
  if (productData.category !== undefined) {
    const resolvedCat = resolveProductCategory(productData.category);
    const matched = db.categories.find(
      (c) => c.slug === resolvedCat.categorySlug || c.name_vi === resolvedCat.category
    );
    if (matched) row.category_id = matched.id;
  }
  if (productData.material !== undefined) {
    db.product_materials = db.product_materials.filter((pm) => pm.product_id !== productId);
    if (productData.material) {
      let mat = db.materials.find((m) => m.name_vi.toLowerCase() === productData.material!.toLowerCase());
      if (!mat) {
        mat = {
          id: `mat-${Date.now()}`,
          slug: `mat-${Date.now()}`,
          name_vi: productData.material,
          name_en: productData.material,
        };
        db.materials.push(mat);
      }
      db.product_materials.push({ product_id: productId, material_id: mat.id });
    }
  }
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

/* ── search products (fuzzy & full-text hybrid) ────────────────────────── */

export interface SearchProductsOptions {
  searchTerm?: string;
  categorySlug?: string;
  shopId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "relevance" | "price_asc" | "price_desc" | "newest";
  limit?: number;
  offset?: number;
}

export interface SearchProductsResult {
  products: Product[];
  totalCount: number;
}

function normalizeSearchVi(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

export async function searchProducts(
  opts: SearchProductsOptions = {}
): Promise<SearchProductsResult> {
  const {
    searchTerm = "",
    categorySlug,
    shopId,
    minPrice,
    maxPrice,
    sortBy = "relevance",
    limit = 24,
    offset = 0,
  } = opts;

  if (getDataSourceMode() === "real" && supabase) {
    try {
      const { data, error } = await supabase.rpc("search_products", {
        search_term: searchTerm.trim() || null,
        filter_category_slug: categorySlug || null,
        filter_shop_id: shopId || null,
        filter_min_price: minPrice ?? null,
        filter_max_price: maxPrice ?? null,
        sort_by: sortBy,
        page_limit: limit,
        page_offset: offset,
      });

      if (!error && data) {
        const totalCount = data.length > 0 ? Number(data[0].total_count) : 0;
        const products: Product[] = data.map((row: any) => {
          const images =
            Array.isArray(row.images) && row.images.length > 0
              ? row.images.map((img: any) => resolveImageUrl(img.url))
              : row.cover_image_url
              ? [resolveImageUrl(row.cover_image_url)]
              : ["https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500"];

          return {
            id: row.id,
            storeId: row.shop_id,
            storeName: row.shop_name ?? "",
            storeLogo: row.shop_logo_url ? resolveImageUrl(row.shop_logo_url) : undefined,
            name: row.name_vi,
            price: row.price_vnd ?? 0,
            currency: "VND",
            description: row.short_desc_vi ?? "",
            images,
            category: row.category_name_vi ?? "",
            categorySlug: row.category_slug ?? "",
            categoryGroup: row.category_group_name_vi ?? row.category_name_vi ?? "",
            categoryGroupSlug: row.category_group_slug ?? row.category_slug ?? "",
            variants: [],
            material: "",
            size: row.dimensions ?? undefined,
            story: row.story_vi ?? undefined,
            clicks: 0,
            views: 0,
            status: "Approved",
            createdAt: row.published_at || new Date().toISOString(),
            hidden: false,
          };
        });

        return { products, totalCount };
      }
    } catch (e) {
      console.warn("Error calling search_products RPC:", e);
    }
  }

  // Mock mode fallback with diacritic-insensitive fuzzy search
  const allApproved = db.products
    .filter((p) => p.status === "published")
    .map(toProduct);

  const cleanQuery = normalizeSearchVi(searchTerm);

  let filtered = allApproved.filter((p) => {
    if (shopId && p.storeId !== shopId) return false;
    if (minPrice !== undefined && p.price < minPrice) return false;
    if (maxPrice !== undefined && p.price > maxPrice) return false;
    if (categorySlug && p.categorySlug !== categorySlug && p.categoryGroupSlug !== categorySlug) {
      return false;
    }
    if (cleanQuery) {
      const matchName = normalizeSearchVi(p.name).includes(cleanQuery);
      const matchStore = normalizeSearchVi(p.storeName).includes(cleanQuery);
      const matchDesc = normalizeSearchVi(p.description).includes(cleanQuery);
      const matchCategory = normalizeSearchVi(p.category).includes(cleanQuery);
      if (!matchName && !matchStore && !matchDesc && !matchCategory) return false;
    }
    return true;
  });

  if (sortBy === "price_asc") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price_desc") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortBy === "newest") {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const totalCount = filtered.length;
  const products = filtered.slice(offset, offset + limit);

  return delay({ products, totalCount });
}
