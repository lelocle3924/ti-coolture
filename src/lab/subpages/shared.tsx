/**
 * Shared scaffolding for the subpage studies (catalogue, product, shops,
 * open-a-workshop). Exploration only — nothing here is imported by src/views.
 *
 * What is fixed across every direction, so the comparison is about structure
 * and not about plumbing:
 *
 *   · the same data through src/lib/dbService.ts (77 products, 6 shops)
 *   · facets DERIVED from that data, never a hand-written list. The live
 *     /products chips are a hardcoded set that matches no product in the
 *     database — every one of them returns zero results — which is what the
 *     team saw as "placeholder chips".
 *   · no view transition on a filter or sort change. The jerk the team
 *     reported is withDirectionalTransition() firing on every chip press:
 *     it slides and scales the whole page (1.06 → 1) with a spring that
 *     overshoots, twice per press, on a 520ms group timing.
 *   · the grid → product continuity transition, which needs the product
 *     present in the new page's FIRST paint. See `handoff` below.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { flushSync } from "react-dom";
import { fetchProducts } from "../../lib/dbService";
import type { Product } from "../../types";
import "./subpages.css";

/* ── formatting ─────────────────────────────────────────────────────────── */

export const formatPrice = (value: number) =>
  value > 0 ? `${value.toLocaleString("vi-VN")}₫` : "Liên hệ";

export const PRICE_NOTE = "Giá tham khảo, giá cuối do shop quyết định";
export const NO_TRANSACTION =
  "Tí Coolture không bán hàng và không xử lý giao dịch.";

/* ── data ───────────────────────────────────────────────────────────────── */

export function useCatalogue() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchProducts("Approved").then((rows) => {
      if (!alive) return;
      setProducts(rows);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  return { products, loading };
}

/**
 * Continuity handoff.
 *
 * The production page already names the two images the same thing, but the
 * morph never runs: the product page fetches on mount and paints a spinner
 * first, so at the moment the browser snapshots the new DOM there is no image
 * to morph into — only the root cross-fade is left, which is the "zoom" the
 * team is seeing. Stashing the clicked product here lets the product page
 * render its hero on the first paint.
 */
const handoffCache = new Map<string, Product>();

/** The last image handed off, so the catalogue can re-adopt the name when the
 *  visitor comes back and the morph runs in reverse too. */
let lastHeroId: string | null = null;

export const HERO_NAME = "lab-hero";

/** Only one element may carry the name at a time, or the browser throws the
 *  whole transition away. */
function clearHeroNames() {
  document.querySelectorAll<HTMLElement>("[data-lab-hero]").forEach((node) => {
    node.style.viewTransitionName = "";
    node.removeAttribute("data-lab-hero");
  });
}

export function handoff(product: Product, el?: HTMLElement | null) {
  handoffCache.set(product.id, product);
  lastHeroId = product.id;
  clearHeroNames();
  if (el) {
    el.style.viewTransitionName = HERO_NAME;
    el.setAttribute("data-lab-hero", "");
  }
  document.documentElement.setAttribute("data-vt-kind", "continuity");
  window.setTimeout(() => {
    document.documentElement.removeAttribute("data-vt-kind");
    clearHeroNames();
  }, 900);
}

export function readHandoff(id: string | undefined): Product | null {
  return (id && handoffCache.get(id)) || null;
}

/**
 * The link that actually plays the transition.
 *
 * `<Link viewTransition>` does nothing in this app: the prop is only honoured
 * by a data router, and src/App.tsx mounts <BrowserRouter> + <Routes>. Every
 * `viewTransition` in src/views is therefore inert, which is why no product
 * image has ever travelled — and why the only transition the team can see is
 * the whole-page one that withDirectionalTransition fires on a chip press.
 *
 * So drive it here: snapshot, navigate synchronously inside the callback so
 * the new page is in the DOM before the second snapshot, and let the CSS in
 * subpages.css do the rest.
 */
export function ContinuityLink({
  product,
  to,
  imgRef,
  className,
  style,
  title,
  children,
  onNavigate,
}: {
  product: Product;
  to: string;
  imgRef?: React.RefObject<HTMLImageElement | null>;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Leave modified clicks to the browser — new tab, new window, download.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;
    e.preventDefault();
    onNavigate?.();
    handoff(product, imgRef?.current ?? null);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !(document as any).startViewTransition) {
      navigate(to);
      return;
    }
    (document as any).startViewTransition(() => flushSync(() => navigate(to)));
  };

  return (
    <a href={to} onClick={onClick} className={className} style={style} title={title}>
      {children}
    </a>
  );
}

/** Props for the one card the visitor last opened — it wears the shared name
 *  so returning to the catalogue plays the same morph backwards. */
export function heroProps(productId: string) {
  return productId === lastHeroId
    ? ({ "data-lab-hero": "", style: { viewTransitionName: HERO_NAME } } as const)
    : {};
}

/* ── facets, derived from the data ──────────────────────────────────────── */

export interface Band {
  id: string;
  label: string;
  min: number;
  max: number;
}

export const PRICE_BANDS: Band[] = [
  { id: "under-100", label: "Dưới 100k", min: 1, max: 100000 },
  { id: "100-300", label: "100k – 300k", min: 100000, max: 300000 },
  { id: "300-700", label: "300k – 700k", min: 300000, max: 700000 },
  { id: "over-700", label: "Trên 700k", min: 700000, max: Infinity },
  { id: "lien-he", label: "Liên hệ xưởng", min: 0, max: 0 },
];

export const SORTS = [
  { id: "newest", label: "Mới nhất" },
  { id: "price-asc", label: "Giá thấp → cao" },
  { id: "price-desc", label: "Giá cao → thấp" },
  { id: "name", label: "Tên A → Z" },
] as const;

export interface FilterState {
  categories: string[];
  bands: string[];
  materials: string[];
  shops: string[];
  q: string;
  sort: string;
}

export const EMPTY_FILTERS: FilterState = {
  categories: [],
  bands: [],
  materials: [],
  shops: [],
  q: "",
  sort: "newest",
};

const inBand = (price: number, band: Band) =>
  band.id === "lien-he" ? price === 0 : price >= band.min && price < band.max;

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");

export function matches(p: Product, f: FilterState, skip?: keyof FilterState) {
  if (skip !== "categories" && f.categories.length && !f.categories.includes(p.category))
    return false;
  if (skip !== "materials" && f.materials.length && !f.materials.includes(p.material || ""))
    return false;
  if (skip !== "shops" && f.shops.length && !f.shops.includes(p.storeName)) return false;
  if (skip !== "bands" && f.bands.length) {
    const bands = PRICE_BANDS.filter((b) => f.bands.includes(b.id));
    if (!bands.some((b) => inBand(p.price, b))) return false;
  }
  if (f.q.trim()) {
    const q = norm(f.q);
    const hay = norm(`${p.name} ${p.storeName} ${p.category} ${p.description}`);
    if (!hay.includes(q)) return false;
  }
  return true;
}

export function sortProducts(rows: Product[], sort: string) {
  const out = [...rows];
  if (sort === "price-asc") out.sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
  else if (sort === "price-desc") out.sort((a, b) => b.price - a.price);
  else if (sort === "name") out.sort((a, b) => a.name.localeCompare(b.name, "vi"));
  else out.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return out;
}

export interface FacetOption {
  value: string;
  count: number;
}

/** Counts are computed with this facet's own selection lifted, so a checked
 *  box never reads "(0)" and the numbers say what would happen if you also
 *  ticked the one next to it. */
export function useFacets(products: Product[], f: FilterState) {
  return useMemo(() => {
    const tally = (key: keyof FilterState, pick: (p: Product) => string) => {
      const map = new Map<string, number>();
      for (const p of products) {
        if (!matches(p, f, key)) continue;
        const v = pick(p);
        if (!v) continue;
        map.set(v, (map.get(v) ?? 0) + 1);
      }
      return [...map.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, "vi"));
    };

    const bands = PRICE_BANDS.map((b) => ({
      value: b.id,
      count: products.filter((p) => matches(p, f, "bands") && inBand(p.price, b)).length,
    }));

    return {
      categories: tally("categories", (p) => p.category),
      materials: tally("materials", (p) => p.material || ""),
      shops: tally("shops", (p) => p.storeName),
      bands,
    };
  }, [products, f]);
}

export function useFiltered(products: Product[], f: FilterState) {
  return useMemo(() => sortProducts(products.filter((p) => matches(p, f)), f.sort), [products, f]);
}

export const countActive = (f: FilterState) =>
  f.categories.length + f.bands.length + f.materials.length + f.shops.length + (f.q ? 1 : 0);

export function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/* ── reading ────────────────────────────────────────────────────────────── */

/**
 * Clamped body copy with a text toggle. Measured rather than assumed: the
 * control only appears when the copy actually overflows the clamp, so short
 * descriptions do not get a "Xem thêm" that expands nothing.
 */
export function Clamp({
  text,
  lines = 4,
  className = "",
  moreLabel = "Xem thêm",
  lessLabel = "Thu gọn",
  tone = "brand",
}: {
  text: string;
  lines?: number;
  className?: string;
  moreLabel?: string;
  lessLabel?: string;
  tone?: "brand" | "paper";
}) {
  const ref = React.useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflows(el.scrollHeight - el.clientHeight > 4);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, lines]);

  return (
    <div className={className}>
      <p
        ref={ref}
        className="lab-clamp"
        style={{ WebkitLineClamp: open ? "unset" : lines, ...(open ? { display: "block" } : null) }}
      >
        {text}
      </p>
      {(overflows || open) && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`mt-1.5 text-xs font-semibold underline underline-offset-4 ${
            tone === "paper" ? "text-wave hover:text-paper" : "text-brand hover:text-brand-deep"
          }`}
        >
          {open ? lessLabel : `… ${moreLabel}`}
        </button>
      )}
    </div>
  );
}

/* ── paging ─────────────────────────────────────────────────────────────── */

export function pageWindow(page: number, pages: number): (number | "gap")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: (number | "gap")[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(pages - 1, page + 1);
  if (from > 2) out.push("gap");
  for (let i = from; i <= to; i++) out.push(i);
  if (to < pages - 1) out.push("gap");
  out.push(pages);
  return out;
}

export function Pager({
  page,
  pages,
  onPage,
  tone = "ink",
}: {
  page: number;
  pages: number;
  onPage: (p: number) => void;
  tone?: "ink" | "paper";
}) {
  if (pages <= 1) return null;
  const base =
    tone === "paper"
      ? "border-white/25 text-white/75 hover:border-wave hover:text-wave"
      : "border-ink/15 text-ink/70 hover:border-brand hover:text-brand";
  const active =
    tone === "paper" ? "border-wave bg-wave text-ink" : "border-brand bg-brand text-paper";

  return (
    <nav className="flex items-center justify-center gap-1.5 pt-10" aria-label="Phân trang">
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page === 1}
        className={`h-9 min-w-9 rounded-full border px-3 text-xs font-semibold transition-colors disabled:opacity-30 ${base}`}
        aria-label="Trang trước"
      >
        ‹
      </button>
      {pageWindow(page, pages).map((slot, i) =>
        slot === "gap" ? (
          <span key={`gap-${i}`} className={tone === "paper" ? "px-1 text-white/40" : "px-1 text-ink/35"}>
            …
          </span>
        ) : (
          <button
            key={slot}
            onClick={() => onPage(slot)}
            aria-current={slot === page ? "page" : undefined}
            className={`h-9 min-w-9 rounded-full border px-3 text-xs font-semibold transition-colors ${
              slot === page ? active : base
            }`}
          >
            {slot}
          </button>
        )
      )}
      <button
        onClick={() => onPage(Math.min(pages, page + 1))}
        disabled={page === pages}
        className={`h-9 min-w-9 rounded-full border px-3 text-xs font-semibold transition-colors disabled:opacity-30 ${base}`}
        aria-label="Trang sau"
      >
        ›
      </button>
    </nav>
  );
}

/* ── product image that carries the continuity name ─────────────────────── */

export function CardImage({
  product,
  className = "",
  imgRef,
}: {
  product: Product;
  className?: string;
  imgRef?: React.Ref<HTMLImageElement>;
}) {
  return (
    <img
      ref={imgRef}
      src={product.images?.[0]}
      alt={product.name}
      loading="lazy"
      className={className}
      {...heroProps(product.id)}
    />
  );
}

/* ── study chrome ───────────────────────────────────────────────────────── */

export const STUDIES = {
  catalog: {
    path: "catalog",
    page: "Trang sản phẩm",
    route: "/products",
    names: ["QUẦY", "RÁP", "MỤC LỤC"],
  },
  product: {
    path: "product",
    page: "Trang chi tiết sản phẩm",
    route: "/products/[slug]",
    names: ["TRƯNG BÀY", "MỞ RA", "PHIẾU"],
  },
  shops: {
    path: "shops",
    page: "Trang shop",
    route: "/stores",
    names: ["DANH BẠ", "THEO KHU", "TỦ"],
  },
  open: {
    path: "open",
    page: "Đăng ký mở xưởng",
    route: "/mo-xuong",
    names: ["MỘT TRANG", "BA BƯỚC", "LÁ THƯ"],
  },
} as const;

export type StudyKey = keyof typeof STUDIES;

/** Slim strip identifying the study and linking to its siblings. Sits above
 *  the page so every study is judged with the same chrome overhead. */
export function LabBar({ study, index }: { study: StudyKey; index: 1 | 2 | 3 }) {
  const s = STUDIES[study];
  const { pathname } = useLocation();
  const tail = pathname.split(`/lab/${s.path}/`)[1]?.slice(1) ?? "";

  return (
    <div className="lab-bar">
      <Link to="/lab" className="lab-bar__home">
        ← Bảng so sánh
      </Link>
      <span className="lab-bar__page">
        {s.page} <span className="lab-bar__route">{s.route}</span>
      </span>
      <span className="lab-bar__spacer" />
      {[1, 2, 3].map((n) => (
        <Link
          key={n}
          to={`/lab/${s.path}/${n}${tail ? `/${tail}` : ""}`}
          className={`lab-bar__opt ${n === index ? "is-on" : ""}`}
        >
          <b>{n}</b> {s.names[n - 1]}
        </Link>
      ))}
    </div>
  );
}
