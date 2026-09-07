import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, ArrowRight, Search, X } from "lucide-react";
import { fetchProducts, triggerWebhook } from "../lib/dbService";
import SaveButton from "../components/SaveButton";
import { Product } from "../types";
import { ArcTopRight, WaveProducts } from "../components/BrandShapes";
import Breadcrumbs from "../components/Breadcrumbs";
import { vtProductImage, withDirectionalTransition } from "../lib/viewTransitions";

const CANONICAL_CATEGORIES = [
  "Tất cả",
  "Thời trang",
  "Sản phẩm sáng tạo",
  "Văn phòng phẩm",
  "Quà tặng",
  "Nhà cửa",
  "Body care",
  "Giải trí"
] as const;

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

const formatPrice = (value: number) =>
  value > 0 ? `${value.toLocaleString("vi-VN")}₫` : "Liên hệ";

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

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "Tất cả";
  const activePriceBand = searchParams.get("price") || "all";
  const activeMaterial = searchParams.get("material") || "all";
  const activeSort = searchParams.get("sort") || "newest";
  const searchQuery = searchParams.get("q") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistToast, setWishlistToast] = useState<{ show: boolean; name: string } | null>(null);


  // Flow B: zero-result demand note capture
  const [demandNote, setDemandNote] = useState("");
  const [demandSubmitted, setDemandSubmitted] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const approvedProducts = await fetchProducts("Approved");
      setProducts(approvedProducts);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleCategorySelect = (cat: string) => {
    const currentIdx = CANONICAL_CATEGORIES.indexOf(activeCategory as any);
    const nextIdx = CANONICAL_CATEGORIES.indexOf(cat as any);
    const dir = nextIdx >= currentIdx ? "forward" : "backward";

    withDirectionalTransition(dir, () => {
      const next = new URLSearchParams(searchParams);
      if (cat === "Tất cả") {
        next.delete("category");
      } else {
        next.set("category", cat);
      }
      next.delete("page");
      setSearchParams(next);
    });
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

  const handleDemandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demandNote.trim()) return;

    triggerWebhook("SEARCH_ZERO_RESULTS_DEMAND_CAPTURED", {
      query: searchQuery || activeCategory,
      userDemandDescription: demandNote,
      timestamp: new Date().toISOString()
    });

    setDemandSubmitted(true);
    setDemandNote("");
  };

  // Filter Logic
  const selectedBand = PRICE_BANDS.find(b => b.id === activePriceBand);

  const filteredProducts = products
    .filter(prod => {
      // Category filter
      if (activeCategory !== "Tất cả" && prod.category !== activeCategory) {
        return false;
      }
      // Material filter
      if (activeMaterial !== "all" && prod.material && !prod.material.toLowerCase().includes(activeMaterial.toLowerCase())) {
        return false;
      }
      // Price filter
      if (selectedBand && selectedBand.id !== "all") {
        if (prod.price < selectedBand.min! || prod.price > selectedBand.max!) {
          return false;
        }
      }
      // Text query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = prod.name.toLowerCase().includes(query);
        const matchStore = prod.storeName.toLowerCase().includes(query);
        const matchDesc = (prod.description || "").toLowerCase().includes(query);
        const matchCat = (prod.category || "").toLowerCase().includes(query);
        if (!matchName && !matchStore && !matchDesc && !matchCat) return false;
      }
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

  const gridRef = useRef<HTMLDivElement>(null);

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
    (activeCategory !== "Tất cả" ? 1 : 0) + 
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
        <div className="fixed bottom-6 right-6 z-50 bg-brand text-paper px-4 py-3 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3 animate-fade-in backdrop-blur-md">
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
            ...(activeCategory !== "Tất cả" ? [{ label: activeCategory }] : []),
          ]}
        />

        {/* ============ FILTERS + SORTING, ONE BAR (§4.3 bezel kept) ============
            Was two stacked strips — categories in their own bezel, then the
            three selects floating on a separate row. Integrated per 26/08:
            one control, categories running left, the selects closing it on
            the right behind a hairline. */}
        <div className="p-1.5 rounded-[2rem] bg-black/5 ring-1 ring-black/5">
          <div className="rounded-[1.625rem] bg-paper p-1.5 flex flex-col gap-1.5 lg:flex-row lg:items-center">
            {/* Scrolls where there is no room and wraps where there is: at lg
                the selects take ~490px and the categories need ~810px, so a
                single scrolling row would hide the last two behind an edge
                with nothing to say so. */}
            <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth lg:flex-wrap lg:overflow-x-visible">
              {CANONICAL_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategorySelect(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center gap-1.5 ${
                      isActive
                        ? "bg-brand text-paper shadow-md shadow-brand/20 scale-[1.02]"
                        : "text-ink/75 hover:text-ink hover:bg-black/5"
                    }`}
                  >
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex shrink-0 items-center gap-2 overflow-x-auto no-scrollbar border-t border-ink/8 pt-1.5 lg:overflow-x-visible lg:border-t-0 lg:border-l lg:pt-0 lg:pl-2">
              <select
                value={activePriceBand}
                onChange={(e) => handlePriceSelect(e.target.value)}
                aria-label="Lọc theo mức giá"
                className="bg-paper-warm border border-ink/10 rounded-full px-4 py-2 text-xs text-ink font-medium focus:outline-none focus:border-brand"
              >
                {PRICE_BANDS.map(b => (
                  <option key={b.id} value={b.id}>{b.label}</option>
                ))}
              </select>

              <select
                value={activeMaterial}
                onChange={(e) => handleMaterialSelect(e.target.value)}
                aria-label="Lọc theo chất liệu"
                className="bg-paper-warm border border-ink/10 rounded-full px-4 py-2 text-xs text-ink font-medium focus:outline-none focus:border-brand"
              >
                <option value="all">Tất cả chất liệu</option>
                {MATERIALS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <select
                value={activeSort}
                onChange={(e) => handleSortChange(e.target.value)}
                aria-label="Sắp xếp"
                className="bg-paper-warm border border-ink/10 rounded-full px-4 py-2 text-xs text-ink font-medium focus:outline-none focus:border-brand"
              >
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá: Thấp đến cao</option>
                <option value="price-desc">Giá: Cao đến thấp</option>
              </select>
            </div>
          </div>
        </div>

        {/* Result count and whatever filters are currently on */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">

          {/* Active Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink/60 font-medium">
              <strong className="text-ink font-bold">{filteredProducts.length}</strong> tác phẩm
            </span>

            {activeCategory !== "Tất cả" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 text-brand px-3 py-1 text-xs font-semibold">
                {activeCategory}
                <button onClick={() => handleCategorySelect("Tất cả")}><X className="w-3 h-3 hover:text-brand-deep" /></button>
              </span>
            )}

            {activePriceBand !== "all" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 text-brand px-3 py-1 text-xs font-semibold">
                {selectedBand?.label}
                <button onClick={() => handlePriceSelect("all")}><X className="w-3 h-3 hover:text-brand-deep" /></button>
              </span>
            )}

            {activeMaterial !== "all" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 text-brand px-3 py-1 text-xs font-semibold">
                {activeMaterial}
                <button onClick={() => handleMaterialSelect("all")}><X className="w-3 h-3 hover:text-brand-deep" /></button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 text-brand px-3 py-1 text-xs font-semibold">
                "{searchQuery}"
                <button onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.delete("q");
                  setSearchParams(next);
                }}><X className="w-3 h-3 hover:text-brand-deep" /></button>
              </span>
            )}

            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-brand hover:underline font-semibold ml-2"
              >
                Xoá bộ lọc
              </button>
            )}
          </div>

        </div>

        {/* ============ DOUBLE-BEZEL PRODUCT CARDS GRID ============ */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 pt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="p-2 rounded-[2rem] bg-black/5">
                <div className="rounded-[1.625rem] bg-paper p-3 space-y-3 animate-pulse">
                  <div className="aspect-square rounded-2xl bg-paper-warm" />
                  <div className="h-3 w-1/3 bg-paper-warm rounded" />
                  <div className="h-4 w-3/4 bg-paper-warm rounded" />
                  <div className="h-3 w-1/2 bg-paper-warm rounded" />
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
                  {["Gốm mộc thủ công", "Trang sức bạc 925", "Sổ tay da thủ công", "Trang phục linen", "Nến thơm thảo mộc"].map(chip => (
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
          
          /* DOUBLE-BEZEL PRODUCT GRID WITH VIEW TRANSITIONS */
          <div ref={gridRef} className="scroll-mt-28 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 pt-2">
            {visibleProducts.map((product) => {
              const primaryImg = product.images?.[0] || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500";
              const hoverImg = product.images?.[1] || primaryImg;

              return (
                <div
                  key={product.id}
                  className="rev hover-elastic p-1.5 rounded-[2rem] bg-black/5 ring-1 ring-black/5 hover:ring-brand/40 group cursor-pointer"
                >
                  <div className="rounded-[1.625rem] bg-paper h-full flex flex-col justify-between overflow-hidden border border-ink/5">
                    
                    {/* The image is the link; the wishlist button is its
                        sibling, not its child.

                        It used to sit inside this <Link>. An <a> may not
                        contain interactive content — the same rule the
                        district map cites for not putting a button inside a
                        button — and a 32px control inside the anchor it
                        overlaps is a coin toss on a touch screen: the tap
                        opens the product about as often as it saves it. That
                        is "tim chỗ này ko sử dụng được" (31/08). */}
                    <div className="relative">
                      <Link to={`/products/${product.id}`} viewTransition className="block relative aspect-square overflow-hidden bg-paper-warm">
                        <img
                          src={primaryImg}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          style={{ viewTransitionName: vtProductImage(product.id) }}
                          className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110"
                        />
                        {hoverImg !== primaryImg && (
                          <img
                            src={hoverImg}
                            alt={`${product.name} alternate view`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          />
                        )}

                        {/* Category Pill Tag — a span, so it stays inside the
                            anchor quite legitimately */}
                        <span className="absolute bottom-3 left-3 bg-paper/90 backdrop-blur-md text-ink text-[10px] font-semibold px-2.5 py-1 rounded-full border border-ink/5 shadow-xs">
                          {product.category}
                        </span>
                      </Link>

                      {/* 44x44 of tap target around a 32px mark. The circle is
                          the size it always was; what grew is the part a
                          fingertip has to find. touch-manipulation drops the
                          double-tap-zoom wait so the heart answers at once. */}
                      <SaveButton
                        product={product}
                        className="absolute right-1.5 top-1.5 z-10"
                        onToggled={(now) => {
                          if (!now) return;
                          setWishlistToast({ show: true, name: product.name });
                          setTimeout(() => setWishlistToast(null), 2500);
                        }}
                      />
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div className="space-y-1">
                        <Link 
                          to={`/stores/${product.storeId}`}
                          viewTransition
                          className="text-[11px] font-semibold text-brand hover:underline truncate block"
                        >
                          {product.storeName}
                        </Link>

                        <Link to={`/products/${product.id}`} viewTransition className="block">
                          <h3 className="font-medium text-xs md:text-sm text-ink group-hover:text-brand transition-colors line-clamp-2 leading-snug">
                            {product.name}
                          </h3>
                        </Link>
                      </div>

                      <div className="pt-2 border-t border-ink/5 flex items-center justify-between">
                        <span className="font-bold text-xs md:text-sm text-ink">
                          {formatPrice(product.price)}
                        </span>
                        
                        <Link
                          to={`/products/${product.id}`}
                          viewTransition
                          className="w-7 h-7 rounded-full bg-paper-warm text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-paper transition-all duration-300"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

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
