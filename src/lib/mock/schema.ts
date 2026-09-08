/**
 * Row types mirroring the Postgres schema in docs/SRS.md §4.
 *
 * These are deliberately snake_case and column-shaped rather than convenient:
 * when the Supabase client lands, `select()` returns exactly these shapes and
 * only src/lib/dbService.ts (the adapter) has to change. Nothing in src/views
 * should ever import from this file directly.
 *
 * Target stack per SRS §3.1: Next.js 15 (App Router) + Supabase (PostgreSQL)
 * + Cloudflare R2 for images. This mock layer stands in until that exists.
 */

export type PublishStatus = "draft" | "pending" | "published" | "archived";

export type SocialPlatform = "instagram" | "tiktok" | "facebook" | "threads" | "website" | "zalo";

export interface CategoryRow {
  id: string;
  slug: string;
  name_vi: string;
  name_en: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface MaterialRow {
  id: string;
  slug: string;
  name_vi: string;
  name_en: string;
}

export interface ShopRow {
  id: string;
  slug: string;
  name: string;
  tagline_vi: string | null;
  tagline_en: string | null;
  story_vi: string | null;
  story_en: string | null;
  /** Object-storage KEY, not a full URL — the CDN domain is joined at render. */
  logo_url: string | null;
  cover_url: string | null;
  contact_email: string | null;
  is_online_only: boolean;
  address: string | null;
  area_tag: string | null;
  status: PublishStatus;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShopSocialRow {
  id: string;
  shop_id: string;
  platform: SocialPlatform;
  url: string;
  handle: string | null;
  is_visible: boolean;
}

export interface ProductRow {
  id: string;
  shop_id: string;
  category_id: string;
  slug: string;
  name_vi: string;
  name_en: string | null;
  short_desc_vi: string | null;
  short_desc_en: string | null;
  story_vi: string | null;
  story_en: string | null;
  /** NULL means "Liên hệ shop" — never render 0. */
  price_vnd: number | null;
  price_note_vi: string;
  price_updated_at: string | null;
  dimensions: string | null;
  status: PublishStatus;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  variants: Array<{ type: string; values: Array<{ vi: string; en: string }> }>;
}

export interface ProductImageRow {
  id: string;
  product_id: string;
  url: string;
  alt_vi: string | null;
  alt_en: string | null;
  is_cover: boolean;
  sort_order: number;
  width: number | null;
  height: number | null;
}

export interface ProductMaterialRow {
  product_id: string;
  material_id: string;
}

export interface RouteRow {
  id: string;
  slug: string;
  title_vi: string;
  title_en: string | null;
  description_vi: string | null;
  description_en: string | null;
  cover_url: string | null;
  duration_min: number | null;
  status: PublishStatus;
  sort_order: number;
}

export interface RouteStopRow {
  id: string;
  route_id: string;
  stop_number: number;
  name_vi: string;
  name_en: string | null;
  description_vi: string | null;
  description_en: string | null;
  address: string | null;
  /** Percentage coordinates on the hand-drawn SVG map — NOT lat/lng. */
  map_x: number;
  map_y: number;
  /**
   * Which kind of place this is, for the pins on /discover.
   *
   * ⚠ PLACEHOLDER COLUMN (08/09). The four values in use — an-uong,
   * tham-quan, chup-anh, mua-sam — are the temporary set the team named, and
   * every stop below is filed by hand against the real place it is. The real
   * schema will want a table of its own with a Vietnamese and an English
   * name per kind; this is the smallest thing that lets the map be built
   * against real content instead of against a guess.
   */
  category: string;
  image_url: string | null;
  external_url: string | null;
  shop_id: string | null;
}

export interface FeaturedItemRow {
  id: string;
  /** SRS §4 merges Hidden Gems and the homepage carousel into one table. */
  placement: "hidden_gem" | "carousel";
  product_id: string;
  note_vi: string | null;
  note_en: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface SiteSettingRow {
  key: string;
  value: string;
}

export interface ClickEventRow {
  id: string;
  product_id: string | null;
  label: string;
  page_path: string;
  created_at: string;
}

export interface BlogTopicRow {
  id: string;
  slug: string;
  name_vi: string;
  name_en: string;
  sort_order: number;
}

export interface BlogPostRow {
  id: string;
  topic_id: string;
  slug: string;
  title_vi: string;
  title_en: string | null;
  excerpt_vi: string | null;
  excerpt_en: string | null;
  cover_url: string | null;
  read_minutes: number;
  status: PublishStatus;
  published_at: string | null;
}

/**
 * Curated collections — the "Collections" strip in the Lovable mockup.
 *
 * NOTE: docs/SRS.md §4 has no `collections` table yet; featured_items only
 * covers Hidden Gems and the carousel. This is a proposed addition, modelled
 * the same way the rest of the schema is, so it can be lifted into the real
 * migration rather than reverse-engineered from component code later.
 */
export interface CollectionRow {
  id: string;
  slug: string;
  title_vi: string;
  title_en: string | null;
  description_vi: string | null;
  description_en: string | null;
  cover_url: string | null;
  sort_order: number;
  status: PublishStatus;
}

export interface CollectionProductRow {
  collection_id: string;
  product_id: string;
  sort_order: number;
}

export interface Database {
  categories: CategoryRow[];
  blog_topics: BlogTopicRow[];
  blog_posts: BlogPostRow[];
  collections: CollectionRow[];
  collection_products: CollectionProductRow[];
  materials: MaterialRow[];
  shops: ShopRow[];
  shop_socials: ShopSocialRow[];
  products: ProductRow[];
  product_images: ProductImageRow[];
  product_materials: ProductMaterialRow[];
  routes: RouteRow[];
  route_stops: RouteStopRow[];
  featured_items: FeaturedItemRow[];
  site_settings: SiteSettingRow[];
  click_events: ClickEventRow[];
}
