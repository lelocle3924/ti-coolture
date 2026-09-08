import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchHiddenGems, fetchProducts, fetchStores, fetchTouristRoutes } from "../lib/dbService";
import type { Product, StoreProfile, TouristRoute } from "../types";

/**
 * Data shaping for the homepage.
 *
 * Everything here reads through src/lib/dbService.ts — the same adapter the
 * production views use — so the directions are compared on design, not on
 * different content. Nothing new is invented: where a shape the team asked for
 * does not exist in the dataset yet (landscape hero plates, For him / For her),
 * the gap is filled with a *labelled* placeholder that states the missing spec
 * rather than with stock photography. docs/01-ART-DIRECTION-BRIEF.md §8.
 */

/* ── landscape plate ───────────────────────────────────────────────────────
   Team feedback: "Các shop phải chuẩn bị at least 1 ảnh size ngang để up lên
   thumbnail." Until a shop supplies one, the slot renders as a block that
   carries the spec it is waiting for. */

export const LANDSCAPE_SPEC = "16:9 · ngang · ≥1600px";

export function landscapePlate(
  label: string,
  sub: string = LANDSCAPE_SPEC,
  tone: "paper" | "violet" | "ink" = "paper"
): string {
  const w = 1600;
  const h = 900;
  const ground = tone === "violet" ? "#7520F7" : tone === "ink" ? "#12081F" : "#FAF8FF";
  const type = tone === "paper" ? "#12081F" : "#FFFFFF";

  const svg = [
    /* width and height, not just a viewBox. An SVG with only a viewBox has no
       intrinsic size, so naturalWidth reads 0 — which is fine for layout, and
       not fine for anything that needs to measure the image (useImageTone
       samples the plate to colour the hero's chevrons against it, and a plate
       it cannot read is a near-white ground it would put a white arrow on). */
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
    `<rect width="${w}" height="${h}" fill="${ground}"/>`,
    `<rect x="14" y="14" width="${w - 28}" height="${h - 28}" fill="none" stroke="${type}" stroke-opacity=".18" stroke-width="2"/>`,
    `<path d="M0 612c320 -90 480 72 768 18s448 -90 832 -18" fill="none" stroke="#39D6CF" stroke-width="14" stroke-opacity=".85"/>`,
    `<text x="50%" y="45%" text-anchor="middle" fill="${type}" fill-opacity=".62" font-family="Alexandria, sans-serif" font-size="62" letter-spacing="4">${label}</text>`,
    `<text x="50%" y="54%" text-anchor="middle" fill="${type}" fill-opacity=".38" font-family="Alexandria, sans-serif" font-size="32" letter-spacing="6">${sub}</text>`,
    `</svg>`,
  ].join("");

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/* ── hero loop ─────────────────────────────────────────────────────────────
   Team feedback: the loop opens on the Tí Coolture image, then runs partner
   frames the shops submit to promote themselves on the front page. Every frame
   obeys one ratio and one quality bar, because this strip is the face of the
   site and the reason a visitor stays. */

export interface HeroFrame {
  id: string;
  src: string;
  /** Attribution target. Null on the house frame. */
  shopId: string | null;
  shopName: string;
  caption: string;
  /** True while the shop has not supplied a real landscape image yet. */
  awaitingUpload: boolean;
}

/* ── district plans ────────────────────────────────────────────────────────
   Team feedback: one map per district, swiped as a carousel; tapping a marked
   point opens the route that starts there. Each route in the dataset already
   belongs to a district, so the district carousel is the route carousel with a
   distinct plan drawing per page. */

export interface DistrictPlan {
  district: string;
  /**
   * What the map is labelled with.
   *
   * Team 08/09: 'Thay "Quận 5 · Chợ Lớn · 4 điểm · ~1,8 km" thành "Chợ Lớn",
   * "Thủ Đức" và "Trung tâm" cho 3 bản đồ hiện tại.' So the label is the part
   * of the city a visitor would say out loud, not the administrative unit —
   * `district` is still the full name and is what the route pages and the
   * lab studies read.
   */
  region: string;
  /** Rough walking distance across the route — route metadata per UX-TASKS 5.2. */
  walk: string;
  /** Block outlines for the district plan drawing (800×600 viewBox). */
  shapes: string[];
  /** Waterway or main axis running through the district. */
  axis: string;
}

export const DISTRICT_PLANS: Record<string, DistrictPlan> = {
  "route-cho-lon": {
    district: "Quận 5 · Chợ Lớn",
    region: "Chợ Lớn",
    walk: "~1,8 km",
    shapes: [
      "M60,300 L210,236 L330,268 L392,392 L296,486 L142,452 Z",
      "M330,268 L470,214 L560,320 L470,404 L392,392 Z",
      "M142,452 L296,486 L332,592 L176,608 Z",
      "M470,404 L560,320 L676,368 L644,494 L508,506 Z",
    ],
    axis: "M20,520 C140,470 250,560 380,510 S620,430 790,470",
  },
  "route-thu-duc": {
    district: "TP Thủ Đức",
    region: "Thủ Đức",
    walk: "~4,2 km",
    shapes: [
      "M96,190 L286,150 L370,262 L268,352 L120,318 Z",
      "M370,262 L520,196 L640,290 L556,398 L410,376 Z",
      "M268,352 L410,376 L448,506 L286,540 L214,436 Z",
      "M556,398 L700,352 L744,486 L604,536 Z",
    ],
    axis: "M40,240 C200,300 300,180 440,250 S660,340 790,280",
  },
  "route-quan-1": {
    district: "Quận 1",
    region: "Trung tâm",
    walk: "~1,1 km",
    shapes: [
      "M140,240 L330,200 L392,320 L276,398 L152,352 Z",
      "M392,320 L536,246 L618,368 L500,442 Z",
      "M276,398 L500,442 L470,556 L296,540 Z",
      "M618,368 L722,318 L760,452 L640,494 Z",
    ],
    axis: "M0,440 C160,392 280,478 420,436 S660,352 800,404",
  },
};

export function planFor(routeId: string): DistrictPlan {
  return DISTRICT_PLANS[routeId] ?? DISTRICT_PLANS["route-quan-1"];
}

/* ── island ────────────────────────────────────────────────────────────────
   The map strip after bangkokartcity.org draws the district as one flat
   organic landmass with every pin standing on it. Stop coordinates come from
   the dataset, so the landmass is derived from them rather than hand-drawn.

   A convex hull is the obvious tool and the wrong one: these routes run in a
   rough line across the district, so the hull collapses to a sliver. Instead
   the island is a union of overlapping blobs — one centred on every stop, more
   strung along the legs between them. Same fill, so they read as one mass, and
   a pin can never fall off the edge because it sits at a blob's centre. */

export interface IslandBlob {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/** Blobs in the 800×600 map viewBox. `stops` carry x/y as percentages. */
export function islandBlobs(stops: Array<{ x: number; y: number }>): IslandBlob[] {
  if (stops.length === 0) return [];

  const pts = stops.map((s) => ({ x: (s.x / 100) * 800, y: (s.y / 100) * 600 }));
  const blobs: IslandBlob[] = [];

  /* Deterministic wobble so the mass looks drawn rather than generated. */
  const wobble = (i: number) => 1 + 0.14 * Math.sin(i * 2.3);

  const push = (x: number, y: number, r: number, i: number) =>
    blobs.push({ cx: x, cy: y, rx: r * 1.18 * wobble(i), ry: r * 0.86 * wobble(i + 1) });

  pts.forEach((pt, i) => push(pt.x, pt.y, 132, i));

  /* Fill the legs so consecutive stops share one landmass. */
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    for (const t of [0.34, 0.67]) {
      push(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 112, i * 3 + t * 10);
    }
  }

  return blobs;
}

/**
 * `n` points spread evenly along the walk through a district's stops.
 *
 * The map stopped pinning stops on 08/09 — the homepage carries one pin for
 * the whole district and /discover carries one per kind of place — so both
 * need somewhere on the island to put a pin that is not a stop's own
 * coordinate.
 *
 * Walking the polyline through the stops is the answer that cannot go wrong:
 * islandBlobs lays a blob on every stop and two more along every leg between
 * them, so every point on that line is inside the landmass by construction. A
 * pin placed here can no more fall into the water than one placed on a stop.
 *
 * Points sit at (k + 0.5) / n of the total length, so they are inset from
 * both ends rather than sitting on the first and last stop.
 */
export function pointsAlongRoute(
  stops: Array<{ x: number; y: number }>,
  n: number
): Array<{ x: number; y: number }> {
  if (n < 1) return [];
  if (stops.length === 0) return Array.from({ length: n }, () => ({ x: 50, y: 50 }));
  if (stops.length === 1) return Array.from({ length: n }, () => ({ ...stops[0] }));

  const legs = stops.slice(1).map((b, i) => {
    const a = stops[i];
    return { a, b, len: Math.hypot(b.x - a.x, b.y - a.y) };
  });
  const total = legs.reduce((sum, l) => sum + l.len, 0);
  if (total === 0) return Array.from({ length: n }, () => ({ ...stops[0] }));

  return Array.from({ length: n }, (_, k) => {
    let want = ((k + 0.5) / n) * total;
    for (const leg of legs) {
      if (want > leg.len && leg !== legs[legs.length - 1]) {
        want -= leg.len;
        continue;
      }
      const t = leg.len === 0 ? 0 : Math.min(1, want / leg.len);
      return {
        x: leg.a.x + (leg.b.x - leg.a.x) * t,
        y: leg.a.y + (leg.b.y - leg.a.y) * t,
      };
    }
    return { ...stops[0] };
  });
}

/* ── the walking trail, removed ───────────────────────────────────
   `routeTrail` lived here: a Catmull-Rom spline threaded through the stops,
   built on 31/08 to replace the decorative waterway that was being drawn as
   if it were the route. Team 07/09: "Xoá đường nối các điểm ở map." So the
   answer to that note turns out to be that the map should not draw the route
   at all — the numbered pins carry the order on their own — and the function
   goes with it rather than being left behind unused. Its history is on
   fix/district-map-route if the decision is ever revisited. */

/* ── collections ───────────────────────────────────────────────────────────
   Team feedback (19/08): the two gift collections become four numbered
   placeholders — "Collection 1" … "Collection 4" — until the editors name and
   fill the real ones.

   ⚠ PLACEHOLDER CURATION. Real collections are chosen by hand; that is the
   whole product premise. The grouping below only exists so the pinned track can
   be judged with realistic tiles in it, and must be replaced by editor-curated
   `collections` rows before any public demo. */

export interface HomeCollection {
  id: string;
  /** Placeholder name; the editors replace this. */
  name: string;
  /** Slot number shown as the running index on the panel rail. */
  index: string;
  items: Product[];
}

const COLLECTION_COUNT = 4;

/* Kept for the two directions that still show gift collections (A and B). */
const FOR_HIM_CATEGORIES = ["Art Toy & Sưu tầm", "Nghệ thuật & Ấn phẩm", "Ẩm thực & Đặc sản"];
const FOR_HER_CATEGORIES = ["Chăm sóc cá nhân", "Thời trang & Phụ kiện", "Thủ công & Trang trí"];

export interface HomeData {
  loading: boolean;
  error: boolean;
  reload: () => void;
  products: Product[];
  stores: StoreProfile[];
  routes: TouristRoute[];
  heroFrames: HeroFrame[];
  popular: Product[];
  forHim: Product[];
  forHer: Product[];
  collections: HomeCollection[];
  /** Editor's picks behind the persistent right-edge tab (UX-TASKS 2.3). */
  gems: Array<{ product: Product; note: string }>;
}

export function useHomeData(): HomeData {
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [routes, setRoutes] = useState<TouristRoute[]>([]);
  const [gems, setGems] = useState<Array<{ product: Product; note: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [approved, shopList, routeList, hiddenGems] = await Promise.all([
        fetchProducts("Approved", { throwOnError: true }),
        fetchStores(),
        fetchTouristRoutes({ throwOnError: true }),
        fetchHiddenGems(),
      ]);
      setProducts(approved);
      setStores(shopList);
      setRoutes(routeList);
      setGems(hiddenGems);
    } catch (err) {
      console.error("[lab] data load failed:", err);
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const heroFrames = useMemo<HeroFrame[]>(() => {
    const house: HeroFrame = {
      id: "frame-ti",
      src: new URL("../assets/background-hero.png", import.meta.url).href,
      shopId: null,
      shopName: "Tí Coolture",
      caption: "Mỗi người một TÍ chất riêng",
      awaitingUpload: false,
    };

    /* A shop that has actually sent photographs shows them. The plate is for
       the ones that have not — it is a request for a 16:9 landscape frame, and
       printing it over a shop whose pictures are already on the page reads as
       a bug rather than as a prompt (28/08).

       The supplied photographs are portrait, so the deck crops them: the frame
       is object-cover, which is the same thing it would do to a 16:9 shot on a
       4:5 phone layout. A real crop of a real photograph tells you more about
       the finished page than a grey rectangle asking for one. */
    const partners = stores.slice(0, 5).map<HeroFrame>((shop) => {
      const sent = !!shop.coverUrl && !shop.coverUrl.startsWith("data:");
      return {
        id: `frame-${shop.id}`,
        src: sent
          ? shop.coverUrl!
          : landscapePlate(shop.name.toUpperCase(), `ẢNH SHOP GỬI · ${LANDSCAPE_SPEC}`, "paper"),
        shopId: shop.id,
        shopName: shop.name,
        caption: shop.vibe || shop.description || "",
        awaitingUpload: !sent,
      };
    });

    return [house, ...partners];
  }, [stores]);

  const popular = useMemo(
    () => [...products].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 10),
    [products]
  );

  const forHim = useMemo(
    () => products.filter((p) => FOR_HIM_CATEGORIES.includes(p.category)).slice(0, 8),
    [products]
  );

  const forHer = useMemo(
    () => products.filter((p) => FOR_HER_CATEGORIES.includes(p.category)).slice(0, 8),
    [products]
  );

  /* Round-robin so every collection gets a spread of categories rather than
     four buckets of the same thing. */
  const collections = useMemo<HomeCollection[]>(
    () =>
      Array.from({ length: COLLECTION_COUNT }, (_, i) => ({
        id: `coll-placeholder-${i + 1}`,
        name: `Collection ${i + 1}`,
        index: String(i + 1).padStart(2, "0"),
        items: products.filter((_p, idx) => idx % COLLECTION_COUNT === i).slice(0, 6),
      })),
    [products]
  );

  return {
    loading,
    error,
    reload: load,
    products,
    stores,
    routes,
    heroFrames,
    popular,
    forHim,
    forHer,
    collections,
    gems,
  };
}

export const formatPrice = (value: number) =>
  value > 0 ? `${value.toLocaleString("vi-VN")}₫` : "Liên hệ";

export const PRICE_NOTE = "Giá tham khảo · cập nhật 08/2026 · giá cuối do shop quyết định";
