import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, ArrowRight, ChevronDown, Search, X } from "lucide-react";
import { fetchCategoryTree, fetchProducts, triggerWebhook } from "../lib/dbService";
import SaveButton from "../components/SaveButton";
import { CategoryNode, Product } from "../types";
import { ArcTopRight, RibbonLoop, WaveProducts } from "../components/BrandShapes";
import Breadcrumbs from "../components/Breadcrumbs";
import { vtProductImage } from "../lib/viewTransitions";
import { useStaggerReveal } from "../lib/useStaggerReveal";
import { useMediaQuery } from "../lib/useAutoHideChrome";

/**
 * Categories, in two tiers.
 *
 * Team 08/09 supplied a taxonomy — seven groups, each with the kinds of
 * product under it — and asked for the control that carries it to be redrawn
 * with the filters and the sort ("Thêm categories như dưới cho /products.
 * thiết kế lại tab chọn category và filter và sort").
 *
 * Twenty-nine kinds cannot be a row of chips; that shape was already at its
 * limit with six. So the groups are a tab strip and the kinds are the chips
 * under whichever tab is open — one decision at a time, and the strip stays
 * one line at every width.
 *
 * Where the list comes from matters, because this control has been wrong in
 * both directions. It was a hardcoded list whose seven labels matched no
 * product at all, so every chip emptied a 137-product catalogue (fixed on
 * 08/09 by deriving the strip from the data). Deriving it, though, means the
 * page can only ever offer what it happens to hold — and the team's list is a
 * statement of what the site stocks, not a summary of today's inventory.
 *
 * So it is the taxonomy, paired with live counts, and a kind with a count of
 * zero is shown and cannot be pressed. The strip says what the site is open
 * to; the count says what is behind each one; and no control on this page can
 * empty the page again.
 */
const ALL_GROUP = "all";

/** Counts are what pressing a control would actually give you, so they are
    taken after the other filters and before the category ones. */
function countBy(rows: Product[], key: (p: Product) => string): Map<string, number> {
  const m = new Map<string, number>();
  for (const row of rows) m.set(key(row), (m.get(key(row)) ?? 0) + 1);
  return m;
}

const PRICE_BANDS = [
  { id: "all", label: "Tất cả mức giá" },
  { id: "under-100", label: "Dưới 100.000₫", min: 0, max: 100000 },
  { id: "100-200", label: "100k – 200.000₫", min: 100000, max: 200000 },
  { id: "200-300", label: "200k – 300.000₫", min: 200000, max: 300000 },
  { id: "300-500", label: "300k – 500.000₫", min: 300000, max: 500000 },
  { id: "500-1m", label: "500k – 1.000.000₫", min: 500000, max: 1000000 },
  { id: "over-1m", label: "Trên 1.000.000₫", min: 1000000, max: Infinity }
];

const MATERIALS = ["Gốm", "Gỗ", "Vải canvas", "Sơn mài", "Bạc", "Giấy thủ công", "Đá"];

const SORTS = [
  { id: "newest", label: "Mới nhất" },
  { id: "price-asc", label: "Giá thấp đến cao" },
  { id: "price-desc", label: "Giá cao đến thấp" },
];

const formatPrice = (value: number) =>
  value > 0 ? `${value.toLocaleString("vi-VN")}₫` : "Liên hệ";

/**
 * The phone grid's three display ratios.
 *
 * Team 08/09, with Shopee as the reference: "với ý định là giảm thiểu khoảng
 * trống, tạo cảm giác đầy… Làm điều này bằng cách cho mỗi ảnh 1 tỉ lệ hiển
 * thị hơi khác nhau 1 tí, ví dụ 1:1, 1.1:1, 0.9:1. Sau đó cho padding top và
 * bottom cố định bằng 1px hoặc 2px. Tỉ lệ ảnh khác nhau sẽ tự động kéo lưới ở
 * 2 bên lệch nhau."
 *
 * That is the whole mechanism and it is worth stating why it works: two
 * columns of tiles with a fixed gap only look like a grid because every tile
 * in a row is the same height. Vary the height by ±10% and the two columns
 * stop agreeing about where a row ends — the jag is a consequence, not
 * something drawn.
 *
 * By position rather than by product, and three ratios against two columns on
 * purpose: a hash could deal the same ratio down one column and leave the two
 * sides in step, which is the one arrangement this cannot afford.
 */
const JAG_RATIOS = [1, 1.1, 0.9];

/** The fixed 2px the note asks for, top and bottom of every tile. */
const JAG_GAP = "2px";

/* Team 08/09: "trang /products hiện tối đa 36 sản phẩm trên 1 trang. số còn
   lại cho sang trang tiếp theo." 36 divides by 2, 3 and 4, which are the
   column counts the grid actually uses, so no page ever ends on a short row. */
const PAGE_SIZE = 36;

/** The window of page numbers to show around the current one. */
function pageWindow(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: Array<number | "gap"> = [1];
  const from = Math.max(2, current - 1);
  const to = Math.min(total - 1, current + 1);
  if (from > 2) out.push("gap");
  for (let i = from; i <= to; i++) out.push(i);
  if (to < total - 1) out.push("gap");
  out.push(total);
  return out;
}

function Pager({
  page,
  total,
  onGo,
}: {
  page: number;
  total: number;
  onGo: (p: number) => void;
}) {
  if (total <= 1) return null;
  const step = "grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm font-semibold transition-colors";

  return (
    <nav
      aria-label="Phân trang"
      className="flex flex-wrap items-center justify-center gap-2 border-t border-ink/10 pt-8"
    >
      <button
        onClick={() => onGo(page - 1)}
        disabled={page === 1}
        aria-label="Trang trước"
        className={`${step} border border-ink/15 text-ink/70 hover:border-brand hover:text-brand disabled:pointer-events-none disabled:opacity-30`}
      >
        <ArrowRight className="h-4 w-4 rotate-180" />
      </button>

      {pageWindow(page, total).map((slot, i) =>
        slot === "gap" ? (
          <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-sm text-ink/35">
            …
          </span>
        ) : (
          <button
            key={slot}
            onClick={() => onGo(slot)}
            aria-label={`Trang ${slot}`}
            aria-current={slot === page ? "page" : undefined}
            className={`${step} tabular-nums ${
              slot === page
                ? "bg-brand text-paper"
                : "border border-ink/15 text-ink/70 hover:border-brand hover:text-brand"
            }`}
          >
            {slot}
          </button>
        )
      )}

      <button
        onClick={() => onGo(page + 1)}
        disabled={page === total}
        aria-label="Trang sau"
        className={`${step} border border-ink/15 text-ink/70 hover:border-brand hover:text-brand disabled:pointer-events-none disabled:opacity-30`}
      >
        <ArrowRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

/**
 * One control for price, material and sort.
 *
 * These were three native <select>s. A select is drawn by the operating
 * system: on Windows it is a grey 1990s listbox in the middle of a page built
 * out of hairlines and rounded fields, and on a phone it takes over the
 * bottom half of the screen. It also cannot show what it is for and what it
 * is set to at the same time, so "Tất cả mức giá" was doing both jobs and
 * reading as neither.
 *
 * This says the label quietly and the value loudly, opens in place, closes on
 * an outside press or Escape, and is a listbox to a screen reader.
 */
function Dropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ id: string; label: string }>;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.id === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs whitespace-nowrap transition-colors ${
          open ? "border-brand text-brand" : "border-ink/15 text-ink hover:border-ink/35"
        }`}
      >
        <span className="text-ink/45">{label}</span>
        <span className="font-semibold">{current.label}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-3.5 w-3.5 text-ink/40 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          className="absolute right-0 z-30 mt-2 min-w-[14rem] overflow-hidden rounded-2xl border border-ink/10 bg-paper py-1 shadow-[0_18px_40px_-18px_rgba(18,8,31,0.45)]"
        >
          {options.map((o) => {
            const on = o.id === value;
            return (
              <button
                key={o.id}
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-6 px-4 py-2.5 text-left text-sm transition-colors ${
                  on ? "bg-brand/10 font-semibold text-brand" : "text-ink/75 hover:bg-black/5"
                }`}
              >
                {o.label}
                {on && <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * One catalogue tile.
 *
 * Lifted out of the grid on 08/09 so the phone's waterfall and the desktop
 * grid can lay the same card out two different ways rather than keeping two
 * copies of it. `ratio` is the image box; `dense` is the phone.
 */
function ProductCard({
  product,
  ratio,
  dense,
  onSaved,
}: {
  key?: string;
  product: Product;
  ratio: number;
  /** Phone: no outer plate, so the tiles can sit 4px apart and read as full. */
  dense: boolean;
  onSaved: (name: string) => void;
}) {
  const primaryImg =
    product.images?.[0] || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500";
  const hoverImg = product.images?.[1] || primaryImg;

  return (
    <div
      /* The grey plate around each card is a desktop device. On a phone it
         spends 6px of a 190px tile on a border twice over, and the note above
         is about giving that space back to the photographs. */
      className={`rev hover-elastic group/tile group cursor-pointer ${
        dense
          ? ""
          : "rounded-[2rem] bg-black/5 p-1.5 ring-1 ring-black/5 hover:ring-brand/40"
      }`}
      style={dense ? { paddingTop: JAG_GAP, paddingBottom: JAG_GAP } : undefined}
    >
      <div
        className={`flex h-full flex-col justify-between overflow-hidden border border-ink/5 bg-paper ${
          dense ? "rounded-[1.25rem]" : "rounded-[1.625rem]"
        }`}
      >
        {/* The image is the link; the wishlist button is its sibling, not its
            child. An <a> may not contain interactive content — the same rule
            the district map cites for not putting a button inside a button —
            and a 32px control inside the anchor it overlaps is a coin toss on
            a touch screen: the tap opens the product about as often as it
            saves it. That is "tim chỗ này ko sử dụng được" (31/08). */}
        <div className="relative">
          <Link
            to={`/products/${product.id}`}
            viewTransition
            className="relative block overflow-hidden bg-paper-warm"
            style={{ aspectRatio: String(ratio) }}
          >
            <img
              src={primaryImg}
              alt={product.name}
              referrerPolicy="no-referrer"
              style={{ viewTransitionName: vtProductImage(product.id) }}
              className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110"
            />
            {hoverImg !== primaryImg && (
              <img
                src={hoverImg}
                alt={`${product.name} alternate view`}
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            )}

            {/* the kind of thing it is — a span, so it stays inside the
                anchor quite legitimately */}
            <span className="absolute bottom-3 left-3 rounded-full border border-ink/5 bg-paper/90 px-2.5 py-1 text-[10px] font-semibold text-ink shadow-xs backdrop-blur-md">
              {product.category}
            </span>
          </Link>

          {/* 44×44 of tap target around a 32px mark. */}
          <SaveButton
            product={product}
            revealOnHover
            className="absolute right-1.5 top-1.5 z-10"
            onToggled={(now) => now && onSaved(product.name)}
          />
        </div>

        <div className={`flex flex-1 flex-col justify-between ${dense ? "space-y-1.5 p-3" : "space-y-2 p-4"}`}>
          <div className="space-y-1">
            <Link
              to={`/stores/${product.storeId}`}
              viewTransition
              className="block truncate text-[11px] font-semibold text-brand hover:underline"
            >
              {product.storeName}
            </Link>

            <Link to={`/products/${product.id}`} viewTransition className="block">
              <h3 className="line-clamp-2 text-xs font-medium leading-snug text-ink transition-colors group-hover:text-brand md:text-sm">
                {product.name}
              </h3>
            </Link>
          </div>

          <div className={`flex items-center justify-between border-t border-ink/5 ${dense ? "pt-1.5" : "pt-2"}`}>
            <span className="text-xs font-bold text-ink md:text-sm">
              {formatPrice(product.price)}
            </span>

            <Link
              to={`/products/${product.id}`}
              viewTransition
              className="flex h-7 w-7 items-center justify-center rounded-full bg-paper-warm text-brand transition-all duration-300 group-hover:bg-brand group-hover:text-paper"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeGroup = searchParams.get("group") || ALL_GROUP;
  const activeKind = searchParams.get("kind") || "";
  const activePriceBand = searchParams.get("price") || "all";
  const activeMaterial = searchParams.get("material") || "all";
  const activeSort = searchParams.get("sort") || "newest";
  const searchQuery = searchParams.get("q") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  /* Motion 10: `leaving` is what gives the toast an exit. It used to be
     unmounted outright after 2500ms, so it blinked out of existence. */
  const [wishlistToast, setWishlistToast] = useState<
    { name: string; leaving: boolean } | null
  >(null);
  const toastTimers = useRef<number[]>([]);

  useEffect(() => () => toastTimers.current.forEach(clearTimeout), []);


  // Flow B: zero-result demand note capture
  const [demandNote, setDemandNote] = useState("");
  const [demandSubmitted, setDemandSubmitted] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [approvedProducts, categories] = await Promise.all([
        fetchProducts("Approved"),
        fetchCategoryTree(),
      ]);
      setProducts(approvedProducts);
      setTree(categories);
      setLoading(false);
    }
    loadData();
  }, []);

  /* Motion proposal 05 (approved 31/08): "không chạy view transition cho đổi
     bộ lọc — đó là cập nhật danh sách, không phải rời trang."

     Pressing a category chip used to run withDirectionalTransition, which
     slides and fades the entire document. Nothing about the page is being left
     — the heading, the filters and the chrome all stay — so the whole screen
     moving to swap the results below it was the jerky zoom the team reported.

     The results now change in place. What brings them in is the grid reveal
     from proposal 02, which re-arms on the rendered count: the new set arrives
     as a wave in the grid, and nothing else moves. */
  const handleGroupSelect = (slug: string) => {
    const next = new URLSearchParams(searchParams);
    if (slug === ALL_GROUP) next.delete("group");
    else next.set("group", slug);
    // the kinds under the old tab mean nothing under the new one
    next.delete("kind");
    // a new filter is a new result set, so it starts at its first page
    next.delete("page");
    setSearchParams(next);
  };

  const handleKindSelect = (slug: string) => {
    const next = new URLSearchParams(searchParams);
    if (!slug) next.delete("kind");
    else next.set("kind", slug);
    next.delete("page");
    setSearchParams(next);
  };

  const handlePriceSelect = (priceId: string) => {
    const next = new URLSearchParams(searchParams);
    if (priceId === "all") {
      next.delete("price");
    } else {
      next.set("price", priceId);
    }
    next.delete("page");
    setSearchParams(next);
  };

  const handleMaterialSelect = (mat: string) => {
    const next = new URLSearchParams(searchParams);
    if (mat === "all") {
      next.delete("material");
    } else {
      next.set("material", mat);
    }
    next.delete("page");
    setSearchParams(next);
  };

  const handleSortChange = (sort: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("sort", sort);
    next.delete("page");
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  /* Motion proposal 10 (approved 31/08): the toast leaves the way it arrived.

     It used to fade in and then simply be dropped from the DOM after 2500ms,
     so it blinked out. It now travels back to the right edge it sits against.

     The toggle itself is no longer here — SaveButton owns it since 07/09, and
     tells this page what happened — so what is left of the proposal is the
     timing, which is the part that was wrong. A second save while one is
     still up restarts the run rather than stacking two sets of timers on the
     same toast. */
  const showSavedToast = (name: string) => {
    toastTimers.current.forEach(clearTimeout);
    setWishlistToast({ name, leaving: false });
    toastTimers.current = [
      window.setTimeout(() => setWishlistToast((t) => (t ? { ...t, leaving: true } : null)), 2500),
      // 180ms later — the length of the exit — it is gone
      window.setTimeout(() => setWishlistToast(null), 2680),
    ];
  };

  const handleDemandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demandNote.trim()) return;

    triggerWebhook("SEARCH_ZERO_RESULTS_DEMAND_CAPTURED", {
      query: searchQuery || openKind?.name || openGroup?.name || "",
      userDemandDescription: demandNote,
      timestamp: new Date().toISOString()
    });

    setDemandSubmitted(true);
    setDemandNote("");
  };

  // Filter Logic
  const selectedBand = PRICE_BANDS.find(b => b.id === activePriceBand);

  /* Everything except the category controls. The tabs and the chips count
     against this, so a number on a control is what pressing it would give —
     press "Đèn 19" with a price band on and you get those 19, not 19 minus
     however many the band was already hiding. */
  const baseRows = products.filter(prod => {
    if (activeMaterial !== "all" && prod.material && !prod.material.toLowerCase().includes(activeMaterial.toLowerCase())) {
      return false;
    }
    if (selectedBand && selectedBand.id !== "all") {
      if (prod.price < selectedBand.min! || prod.price > selectedBand.max!) {
        return false;
      }
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchName = prod.name.toLowerCase().includes(query);
      const matchStore = prod.storeName.toLowerCase().includes(query);
      const matchDesc = (prod.description || "").toLowerCase().includes(query);
      const matchCat = (prod.category || "").toLowerCase().includes(query);
      const matchGroup = (prod.categoryGroup || "").toLowerCase().includes(query);
      if (!matchName && !matchStore && !matchDesc && !matchCat && !matchGroup) return false;
    }
    return true;
  });

  const groupCounts = countBy(baseRows, p => p.categoryGroupSlug);
  const kindCounts = countBy(baseRows, p => p.categorySlug);

  const openGroup = tree.find(g => g.slug === activeGroup) ?? null;
  const openKind = openGroup?.children.find(k => k.slug === activeKind) ?? null;

  const filteredProducts = baseRows
    .filter(prod => {
      if (activeGroup !== ALL_GROUP && prod.categoryGroupSlug !== activeGroup) return false;
      if (activeKind && prod.categorySlug !== activeKind) return false;
      return true;
    })
    .sort((a, b) => {
      if (activeSort === "price-asc") return a.price - b.price;
      if (activeSort === "price-desc") return b.price - a.price;
      return 0; // default newest
    });

  /* The page lives in the URL, so a page of results can be shared, and the
     back button walks the pages rather than leaving the catalogue.

     Clamped rather than trusted: a filter can shrink the catalogue under the
     page someone is standing on, and ?page=99 is a URL anyone can type. */
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const page = Math.min(pageCount, Math.max(1, Number(searchParams.get("page")) || 1));
  const pageStart = (page - 1) * PAGE_SIZE;
  const visibleProducts = filteredProducts.slice(pageStart, pageStart + PAGE_SIZE);

  /* Motion 02: the reveal re-arms whenever the rendered set changes, so a
     filter, a sort or a page turn brings its results in as a wave rather than
     leaving the new cards sitting at opacity 0.

     Keyed on the page as well as the count, which the proposal could not know
     about: two pages of a full grid hold the same 36 cards, so a count alone
     would not notice the turn. The same ref is the scroll target below — the
     grid is both the thing that reveals and the thing to come back to. */
  /* Which of the two layouts is on. A media query rather than two trees
     behind `hidden md:grid`, because the hidden one still downloads 36
     photographs. */
  const dense = !useMediaQuery("(min-width: 768px)");

  /* Motion 02: the reveal re-arms whenever the rendered set changes, so a
     filter, a sort or a page turn brings its results in as a wave.

     `dense` is in the key because crossing 768px swaps one container for the
     other, and the cards in the new one would otherwise stay at the opacity 0
     the hook's own [data-rev-ready] put them at. */
  const gridRef = useStaggerReveal<HTMLDivElement>(
    `${page}:${filteredProducts.length}:${dense}`
  );

  const goToPage = (next: number) => {
    const clamped = Math.min(pageCount, Math.max(1, next));
    const params = new URLSearchParams(searchParams);
    if (clamped === 1) params.delete("page");
    else params.set("page", String(clamped));
    setSearchParams(params);
    /* Back to the top of the grid, not the top of the document: the filters
       are above it and a reader who has just paged wants the first row, not
       the hero again. */
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const activeFiltersCount =
    (activeGroup !== ALL_GROUP ? 1 : 0) +
    (activeKind ? 1 : 0) +
    (activePriceBand !== "all" ? 1 : 0) +
    (activeMaterial !== "all" ? 1 : 0) +
    (searchQuery ? 1 : 0);

  return (
    /* The negative margin lives on this element, not on the hero inside it:
       this one clips (overflow-x-hidden), so a child pulled above its top edge
       would be cut off and the shell's ink would show through — which is the
       black band the 26/08 note is about. Cancelling the shell's clearance on
       the clipping element itself moves the whole page up instead. */
    <div className="min-h-[100dvh] -mt-24 bg-paper text-ink pb-28 select-none relative overflow-x-hidden w-full md:-mt-28">
      {/* Toast Notification (Flow E) */}
      {wishlistToast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 bg-brand text-paper px-4 py-3 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3 backdrop-blur-md ${
            wishlistToast.leaving ? "ti-toast--out" : "ti-toast"
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-wave text-ink grid place-items-center font-bold">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <div>
            <p className="text-xs font-semibold">Đã lưu vào Wishlist!</p>
            <p className="text-[11px] text-white/80 truncate max-w-[200px]">{wishlistToast.name}</p>
          </div>
        </div>
      )}

      {/* ============ HERO ============
          Team 26/08: the hero is the header's own ground now. The violet
          starts at y=0 — the negative margin cancels the shell's pt-24
          clearance and the section re-adds it as its own padding — so the
          pill floats on violet instead of on the shell's ink, which is the
          black band the note calls out. The band is then only as tall as the
          title needs, and WaveProducts closes it into the paper below. */}
      <section data-surface="dark" className="relative z-10 overflow-hidden bg-brand text-paper">
        {/* The faded identity, as /stores carries it — team 08/09: "Thêm brand
            identity đã làm mờ giống bên /stores." This hero had one arc and
            little else, so the band read as a plain violet slab next to a
            page that composes with two marks.

            Placed as a mirror of /stores rather than a copy of it: the title
            here is centred, so the ribbon takes the left and the arc keeps
            the right, and the pair balances the line instead of pushing it
            off-axis the way /stores deliberately does. */}
        <RibbonLoop
          className="pointer-events-none absolute -left-28 -top-24 z-0 rotate-180 opacity-20"
          style={{ width: "clamp(18rem, 40vw, 34rem)" }}
          ribbon="var(--color-wave)"
          dot="var(--color-paper)"
        />
        <ArcTopRight
          className="pointer-events-none absolute -right-16 -top-20 z-0 opacity-15"
          style={{ width: "clamp(18rem, 40vw, 32rem)" }}
          fill="var(--color-wave)"
        />

        <div className="relative z-10 px-4 pt-24 pb-3 md:px-8 md:pt-28 md:pb-5">
          {/* leading-[1.25], not the .display default of 1.02: uppercase
              Vietnamese spans ~1.18em in DFVN (see the note in index.css), so
              Ả and Ẩ lose their marks at anything tighter. */}
          <h1 className="display text-center text-4xl normal-case font-medium leading-[1.25] text-paper md:text-6xl">
            Sản phẩm
          </h1>
        </div>

        {/* The seam, not a decoration: this is the paper below reaching up.
            The band is height-capped and the SVG hangs off its bottom, so the
            curve keeps its drawn proportions and the wrapper crops the flat
            run off the top — squashing the viewBox would draw a different
            curve (same technique as WaveBottom). Team 26/08: the violet is
            only ever as tall as the title needs. */}
        <div className="relative z-10 -mb-px h-[clamp(2.5rem,5vw,4.5rem)] overflow-hidden">
          <WaveProducts className="absolute inset-x-0 bottom-0" fill="var(--color-paper)" />
        </div>
      </section>

      {/* ============ MAIN CATALOG INTERFACE ============ */}
      <div data-surface="light" className="max-w-7xl mx-auto px-4 md:px-8 mt-2 space-y-4 relative z-10">

        {/* Sits under the wave, on paper, separate from the violet (26/08). */}
        <Breadcrumbs
          trail={[
            { label: "Trang chủ", to: "/" },
            { label: "Sản phẩm" },
            ...(openGroup ? [{ label: openGroup.name }] : []),
            ...(openKind ? [{ label: openKind.name }] : []),
          ]}
        />

        {/* ============ CATEGORY TABS · KINDS · FILTERS · SORT ============
            Redrawn 08/09 with the taxonomy ("thiết kế lại tab chọn category
            và filter và sort"). It was one rounded bezel holding six chips
            and three operating-system selects. Twenty-nine kinds do not fit
            that shape, and the bezel was making a single object out of three
            different questions: which part of the shop, which corner of it,
            and how the results are ordered.

            Three lines now, in the order those are asked: the groups as tabs,
            the kinds under the open tab, then the count and the dropdowns on
            one rule. */}
        <div className="space-y-3 pt-1">
          {/* The groups. Full-bleed on a phone so the strip scrolls past the
              page gutter rather than stopping short of it. */}
          <div className="-mx-4 border-b border-ink/12 md:-mx-8">
            <div
              role="tablist"
              aria-label="Nhóm sản phẩm"
              className="flex gap-5 overflow-x-auto no-scrollbar px-4 md:gap-7 md:px-8"
            >
              {[
                { slug: ALL_GROUP, name: "Tất cả", count: baseRows.length },
                ...tree.map((g) => ({
                  slug: g.slug,
                  name: g.name,
                  count: groupCounts.get(g.slug) ?? 0,
                })),
              ].map((tab) => {
                const on = tab.slug === activeGroup;
                return (
                  <button
                    key={tab.slug}
                    role="tab"
                    aria-selected={on}
                    onClick={() => handleGroupSelect(tab.slug)}
                    className={`relative shrink-0 whitespace-nowrap pb-3 pt-1 text-sm transition-colors ${
                      on ? "font-semibold text-brand" : "text-ink/60 hover:text-ink"
                    }`}
                  >
                    {tab.name}
                    <span
                      className={`ml-1.5 text-[11px] tabular-nums ${
                        on ? "text-brand/60" : "text-ink/35"
                      }`}
                    >
                      {tab.count}
                    </span>
                    {/* the rule under the open tab, drawn on the strip's own
                        hairline so the two read as one edge */}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-0 -bottom-px h-[2px] rounded-full transition-opacity duration-300 ${
                        on ? "bg-brand opacity-100" : "opacity-0"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* The kinds inside the open group. Nothing here while the tab is
              "Tất cả": 29 chips at once is the shape this replaced. */}
          {openGroup && (
            <div className="-mx-4 md:-mx-8">
              <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 md:flex-wrap md:overflow-x-visible md:px-8">
                <button
                  onClick={() => handleKindSelect("")}
                  aria-pressed={!activeKind}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                    !activeKind ? "bg-brand text-paper" : "bg-black/5 text-ink/70 hover:bg-black/10"
                  }`}
                >
                  Tất cả {openGroup.name}
                  <span className={`ml-1.5 ${!activeKind ? "text-paper/60" : "text-ink/35"}`}>
                    {groupCounts.get(openGroup.slug) ?? 0}
                  </span>
                </button>

                {openGroup.children.map((kind) => {
                  const count = kindCounts.get(kind.slug) ?? 0;
                  const on = kind.slug === activeKind;
                  /* A kind the catalogue has nothing under is shown and not
                     pressable. Shown, because the list states what the site is
                     open to stocking; not pressable, because a control that
                     empties the page is exactly the bug this strip had. */
                  const empty = count === 0;
                  return (
                    <button
                      key={kind.slug}
                      onClick={() => !empty && handleKindSelect(kind.slug)}
                      disabled={empty}
                      aria-pressed={on}
                      title={empty ? `Chưa có sản phẩm nào thuộc ${kind.name}` : undefined}
                      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                        on
                          ? "bg-brand text-paper"
                          : empty
                            ? "cursor-not-allowed bg-black/[0.03] text-ink/30"
                            : "bg-black/5 text-ink/70 hover:bg-black/10"
                      }`}
                    >
                      {kind.name}
                      <span className={`ml-1.5 ${on ? "text-paper/60" : "text-ink/35"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* How many there are, and how they are ordered. */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-3">
            <span className="text-xs text-ink/60">
              <strong className="font-bold text-ink">{filteredProducts.length}</strong> tác phẩm
            </span>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <Dropdown
                label="Giá"
                value={activePriceBand}
                options={PRICE_BANDS.map((b) => ({ id: b.id, label: b.label }))}
                onChange={handlePriceSelect}
              />
              <Dropdown
                label="Chất liệu"
                value={activeMaterial}
                options={[
                  { id: "all", label: "Tất cả" },
                  ...MATERIALS.map((m) => ({ id: m, label: m })),
                ]}
                onChange={handleMaterialSelect}
              />
              <Dropdown
                label="Sắp xếp"
                value={activeSort}
                options={SORTS}
                onChange={handleSortChange}
              />
            </div>
          </div>
        </div>

        {/* Whatever is currently on, and the way back off it */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {openGroup && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                {openGroup.name}
                <button
                  onClick={() => handleGroupSelect(ALL_GROUP)}
                  aria-label={`Bỏ lọc ${openGroup.name}`}
                >
                  <X className="h-3 w-3 hover:text-brand-deep" />
                </button>
              </span>
            )}

            {openKind && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                {openKind.name}
                <button onClick={() => handleKindSelect("")} aria-label={`Bỏ lọc ${openKind.name}`}>
                  <X className="h-3 w-3 hover:text-brand-deep" />
                </button>
              </span>
            )}

            {activePriceBand !== "all" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                {selectedBand?.label}
                <button onClick={() => handlePriceSelect("all")} aria-label="Bỏ lọc giá">
                  <X className="h-3 w-3 hover:text-brand-deep" />
                </button>
              </span>
            )}

            {activeMaterial !== "all" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                {activeMaterial}
                <button onClick={() => handleMaterialSelect("all")} aria-label="Bỏ lọc chất liệu">
                  <X className="h-3 w-3 hover:text-brand-deep" />
                </button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                &ldquo;{searchQuery}&rdquo;
                <button
                  aria-label="Bỏ từ khoá"
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.delete("q");
                    setSearchParams(next);
                  }}
                >
                  <X className="h-3 w-3 hover:text-brand-deep" />
                </button>
              </span>
            )}

            <button
              onClick={clearAllFilters}
              className="ml-1 text-xs font-semibold text-brand hover:underline"
            >
              Xoá bộ lọc
            </button>
          </div>
        )}

        {/* ============ THE RESULTS ============ */}
        {loading ? (
          /* The skeleton carries the jag too, so the page does not settle
             from an even grid into an uneven one the moment it loads. */
          <div
            className={
              dense ? "flex gap-1 pt-4" : "grid grid-cols-2 gap-5 pt-4 md:grid-cols-3 lg:grid-cols-4"
            }
            aria-busy="true"
          >
            {dense
              ? [0, 1].map((col) => (
                  <div key={col} className="flex min-w-0 flex-1 flex-col">
                    {[0, 1, 2, 3].map((row) => {
                      const i = row * 2 + col;
                      return (
                        <div key={i} style={{ paddingTop: JAG_GAP, paddingBottom: JAG_GAP }}>
                          <div className="space-y-3 rounded-[1.25rem] bg-paper p-3 animate-pulse">
                            <div
                              className="rounded-2xl bg-paper-warm"
                              style={{ aspectRatio: String(JAG_RATIOS[i % JAG_RATIOS.length]) }}
                            />
                            <div className="h-3 w-1/3 rounded bg-paper-warm" />
                            <div className="h-4 w-3/4 rounded bg-paper-warm" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              : Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-[2rem] bg-black/5 p-2">
                    <div className="space-y-3 rounded-[1.625rem] bg-paper p-3 animate-pulse">
                      <div className="aspect-square rounded-2xl bg-paper-warm" />
                      <div className="h-3 w-1/3 rounded bg-paper-warm" />
                      <div className="h-4 w-3/4 rounded bg-paper-warm" />
                      <div className="h-3 w-1/2 rounded bg-paper-warm" />
                    </div>
                  </div>
                ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          
          /* FLOW B: Curious Zero-Result Portal */
          <div className="max-w-2xl mx-auto my-12 p-2 rounded-[2.5rem] bg-black/5 ring-1 ring-black/5">
            <div className="rounded-[2.125rem] bg-paper p-8 md:p-12 text-center space-y-6 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-wave/20 text-wave-ink grid place-items-center mx-auto">
                <Search className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h3 className="display text-2xl font-medium text-ink normal-case">
                  Chưa có tác phẩm phù hợp
                </h3>
                <p className="text-xs text-ink/70 leading-relaxed max-w-md mx-auto">
                  Tí chưa tìm thấy món đồ khớp chính xác với bộ lọc này. Hãy để lại yêu cầu phong cách bạn đang tìm để Tí kết nối các xưởng phù hợp nhé!
                </p>
              </div>

              {demandSubmitted ? (
                <div className="p-4 rounded-2xl bg-wave/20 border border-wave text-wave-ink text-xs font-semibold flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Cảm ơn bạn! Ban tuyển chọn Tí đã lưu yêu cầu và sẽ tìm kiếm xưởng phù hợp.</span>
                </div>
              ) : (
                <form onSubmit={handleDemandSubmit} className="space-y-3 text-left">
                  <label className="label text-ink/80 text-[11px] block font-semibold">
                    Bạn muốn tìm sản phẩm hoặc chất liệu gì?
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={demandNote}
                      onChange={(e) => setDemandNote(e.target.value)}
                      placeholder="VD: Gốm men tro thủ công Bát Tràng, túi tote nhuộm chàm..."
                      className="flex-1 bg-paper-warm border border-ink/15 rounded-full px-5 py-3 text-xs text-ink focus:outline-none focus:border-brand"
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-full bg-brand text-paper text-xs font-semibold hover:bg-brand-deep transition-all shrink-0 shadow-md shadow-brand/20"
                    >
                      Gửi gợi ý
                    </button>
                  </div>
                </form>
              )}

              <div className="pt-4 border-t border-ink/10 space-y-2">
                <span className="label text-ink/60 text-[10px]">Hoặc dạo xem các nhóm đang hot:</span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {["Đèn", "Nến thơm", "Sổ tay", "Túi tote", "Đồ gốm"].map(chip => (
                    <button
                      key={chip}
                      onClick={() => {
                        const next = new URLSearchParams();
                        next.set("q", chip);
                        setSearchParams(next);
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-paper-warm hover:bg-brand hover:text-paper text-xs text-ink/80 transition-all border border-ink/10"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

        ) : (
          
          /* ── the results ──────────────────────────────────────────────
             Two shapes, one card. On a desktop the four-column grid, which
             is what a wide screen wants and where a row of equal heights
             reads as order rather than as waste.

             On a phone, a two-column waterfall: the tiles are dealt left,
             right, left, each column stacks its own, and because the image
             ratios differ by ±10% the two sides stop agreeing about where a
             row ends. That is the whole of "tỉ lệ ảnh khác nhau sẽ tự động
             kéo lưới ở 2 bên lệch nhau" — nothing measures anything, the
             offset is a consequence of the heights.

             CSS columns would have been fewer lines and the wrong reading
             order: they fill the first column top to bottom before starting
             the second, so a 36-product page would run 1–18 down the left
             and 19–36 down the right. Dealing alternately keeps the catalogue
             in the order it is sorted in. */
          dense ? (
            <div ref={gridRef} className="flex scroll-mt-28 gap-1 pt-2">
              {[0, 1].map((col) => (
                <div key={col} className="flex min-w-0 flex-1 flex-col">
                  {visibleProducts
                    .map((product, i) => ({ product, i }))
                    .filter(({ i }) => i % 2 === col)
                    .map(({ product, i }) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        ratio={JAG_RATIOS[i % JAG_RATIOS.length]}
                        dense
                        onSaved={showSavedToast}
                      />
                    ))}
                </div>
              ))}
            </div>
          ) : (
            <div
              ref={gridRef}
              className="scroll-mt-28 grid grid-cols-2 gap-5 pt-2 md:grid-cols-3 lg:grid-cols-4"
            >
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  ratio={1}
                  dense={false}
                  onSaved={showSavedToast}
                />
              ))}
            </div>
          )

        )}

        {/* 36 a page, the rest on the next one. The count above the grid stays
            the size of the whole result set — it answers "how many are there",
            not "how many can you see". */}
        {!loading && filteredProducts.length > 0 && (
          <div className="pt-6">
            <Pager page={page} total={pageCount} onGo={goToPage} />
            {pageCount > 1 && (
              <p className="pt-4 text-center text-xs text-ink/50">
                Trang {page} / {pageCount} · {pageStart + 1}–
                {Math.min(pageStart + PAGE_SIZE, filteredProducts.length)} trên{" "}
                {filteredProducts.length} tác phẩm
              </p>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
