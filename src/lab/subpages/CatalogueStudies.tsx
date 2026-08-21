/**
 * Trang sản phẩm — three directions.
 *
 * Shared by all three, because all three are answers to the same team notes:
 *
 *   · the category chip strip is gone. Every facet is derived from the data,
 *     so a control can never again offer a filter that matches nothing.
 *   · no view transition fires on a filter or a sort. Results swap in place.
 *   · 77 products, so paging is a real question rather than a hypothetical.
 *   · filters and sort are drawn in the Direction C language — hairlines,
 *     label caps, violet as the only fill — not the rounded pill selects and
 *     double bezels carried over from the Lovable mockup.
 *   · a card hands its image to the product page (see shared.tsx › handoff).
 *
 * What differs: where the filters live, how a page of results ends, and how
 * dense the grid is. Those three choices are the actual decision.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Check, Search, SlidersHorizontal, X } from "lucide-react";
import type { Product } from "../../types";
import {
  CardImage,
  Clamp,
  ContinuityLink,
  EMPTY_FILTERS,
  FilterState,
  LabBar,
  NO_TRANSACTION,
  PRICE_BANDS,
  Pager,
  SORTS,
  countActive,
  formatPrice,
  toggle,
  useCatalogue,
  useFacets,
  useFiltered,
} from "./shared";

/* ── pieces used by more than one direction ─────────────────────────────── */

function useResultPaging(total: number, perPage: number, resetKey: string) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(total / perPage));
  useEffect(() => {
    setPage(1);
  }, [resetKey]);
  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);
  return { page, pages, setPage };
}

function ActiveTags({
  f,
  set,
  tone = "ink",
}: {
  f: FilterState;
  set: (next: FilterState) => void;
  tone?: "ink" | "paper";
}) {
  const tags: Array<{ label: string; clear: () => void }> = [
    ...f.categories.map((v) => ({ label: v, clear: () => set({ ...f, categories: toggle(f.categories, v) }) })),
    ...f.bands.map((id) => ({
      label: PRICE_BANDS.find((b) => b.id === id)?.label ?? id,
      clear: () => set({ ...f, bands: toggle(f.bands, id) }),
    })),
    ...f.materials.map((v) => ({ label: v, clear: () => set({ ...f, materials: toggle(f.materials, v) }) })),
    ...f.shops.map((v) => ({ label: v, clear: () => set({ ...f, shops: toggle(f.shops, v) }) })),
    ...(f.q ? [{ label: `“${f.q}”`, clear: () => set({ ...f, q: "" }) }] : []),
  ];
  if (!tags.length) return null;

  const skin =
    tone === "paper"
      ? "border-white/30 text-paper hover:border-wave hover:text-wave"
      : "border-ink/20 text-ink/80 hover:border-brand hover:text-brand";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((t) => (
        <button
          key={t.label}
          onClick={t.clear}
          className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] transition-colors ${skin}`}
        >
          {t.label}
          <X className="h-3 w-3" />
        </button>
      ))}
      <button
        onClick={() => set({ ...EMPTY_FILTERS, sort: f.sort })}
        className={`px-1.5 text-[11px] underline underline-offset-4 ${
          tone === "paper" ? "text-white/60 hover:text-wave" : "text-ink/50 hover:text-brand"
        }`}
      >
        Xoá hết
      </button>
    </div>
  );
}

function FacetGroup({
  title,
  options,
  selected,
  onToggle,
  tone = "ink",
}: {
  title: string;
  options: Array<{ value: string; count: number; label?: string }>;
  selected: string[];
  onToggle: (value: string) => void;
  tone?: "ink" | "paper";
}) {
  const muted = tone === "paper" ? "text-white/55" : "text-ink/45";
  const row = tone === "paper" ? "text-white/85 hover:text-wave" : "text-ink/80 hover:text-brand";
  const on = tone === "paper" ? "text-wave" : "text-brand";

  return (
    <section className="space-y-2">
      <h3 className={`label ${muted}`}>{title}</h3>
      <ul className="space-y-1">
        {options.map((o) => {
          const checked = selected.includes(o.value);
          return (
            <li key={o.value}>
              <button
                onClick={() => onToggle(o.value)}
                disabled={!checked && o.count === 0}
                className={`flex w-full items-center gap-2 py-1 text-left text-xs transition-colors disabled:opacity-35 ${
                  checked ? on : row
                }`}
              >
                <span
                  aria-hidden
                  className={`grid h-3.5 w-3.5 shrink-0 place-items-center border ${
                    checked
                      ? "border-brand bg-brand text-paper"
                      : tone === "paper"
                        ? "border-white/35"
                        : "border-ink/25"
                  }`}
                >
                  {checked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                </span>
                <span className="flex-1 truncate">{o.label ?? o.value}</span>
                <span className={`tabular-nums text-[11px] ${muted}`}>{o.count}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SortSegments({
  value,
  onChange,
  tone = "ink",
  layout = "row",
}: {
  value: string;
  onChange: (v: string) => void;
  tone?: "ink" | "paper";
  /** Four labels do not survive 390px in one row — the sheet stacks them. */
  layout?: "row" | "grid";
}) {
  return (
    <div
      className={`${layout === "grid" ? "grid grid-cols-2 divide-x divide-y" : "flex items-center"} border ${
        tone === "paper" ? "divide-white/25 border-white/25" : "divide-ink/15 border-ink/15"
      }`}
      role="group"
      aria-label="Sắp xếp"
    >
      {SORTS.map((s) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          aria-pressed={value === s.id}
          className={`whitespace-nowrap px-3 py-2 text-[11px] font-medium transition-colors ${
            value === s.id
              ? "bg-brand text-paper"
              : tone === "paper"
                ? "text-white/70 hover:text-wave"
                : "text-ink/65 hover:text-brand"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

/** One product. The image is the handoff element — it is what travels. */
function ProductCard({
  product,
  to,
  index,
  tone = "ink",
  showDescription = false,
}: {
  product: Product;
  to: string;
  index: number;
  tone?: "ink" | "paper";
  showDescription?: boolean;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const meta = tone === "paper" ? "text-white/60" : "text-ink/55";
  const title = tone === "paper" ? "text-paper" : "text-ink";

  return (
    <ContinuityLink
      product={product}
      to={to}
      imgRef={imgRef}
      className="group block lab-settle"
      style={{ animationDelay: `${Math.min(index, 7) * 26}ms` }}
    >
      <div
        className={`relative aspect-square overflow-hidden ${
          tone === "paper" ? "bg-paper/10" : "bg-paper-warm"
        }`}
      >
        <CardImage
          product={product}
          imgRef={imgRef}
          className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03]"
        />
      </div>
      <div className="space-y-1 pt-2.5">
        <p className={`label ${meta}`}>{product.storeName}</p>
        <h3 className={`text-sm leading-snug ${title} group-hover:text-brand transition-colors`}>
          {product.name}
        </h3>
        {showDescription && (
          <p className={`line-clamp-2 text-xs leading-relaxed ${meta}`}>{product.description}</p>
        )}
        <p className={`pt-0.5 text-sm font-semibold ${tone === "paper" ? "text-wave" : "text-ink"}`}>
          {formatPrice(product.price)}
        </p>
      </div>
    </ContinuityLink>
  );
}

function ZeroResult({ onClear, tone = "ink" }: { onClear: () => void; tone?: "ink" | "paper" }) {
  return (
    <div
      className={`border px-6 py-14 text-center ${
        tone === "paper" ? "border-white/20 text-paper" : "border-ink/15 text-ink"
      }`}
    >
      <p className="display text-xl normal-case">Chưa có sản phẩm nào khớp</p>
      <p className={`mx-auto mt-2 max-w-md text-xs leading-relaxed ${tone === "paper" ? "text-white/70" : "text-ink/60"}`}>
        Bỏ bớt một điều kiện, hoặc để lại yêu cầu để Tí đi tìm xưởng phù hợp.
      </p>
      <button
        onClick={onClear}
        className="mt-5 border border-brand bg-brand px-5 py-2 text-xs font-semibold text-paper transition-colors hover:bg-brand-deep"
      >
        Xoá bộ lọc
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   1 · QUẦY — The Counter
   Facets stand open in a rail beside the goods, the way a counter shows
   everything it stocks. Twenty-four to a page, numbered, crawlable.
   ═══════════════════════════════════════════════════════════════════════════ */

const PER_PAGE_1 = 24;

export function CatalogueOne() {
  const { products, loading } = useCatalogue();
  const [f, setF] = useState<FilterState>(EMPTY_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const facets = useFacets(products, f);
  const rows = useFiltered(products, f);
  const gridTop = useRef<HTMLDivElement>(null);

  const key = JSON.stringify({ ...f, sort: "" });
  const { page, pages, setPage } = useResultPaging(rows.length, PER_PAGE_1, key);
  const slice = rows.slice((page - 1) * PER_PAGE_1, page * PER_PAGE_1);

  const goPage = (p: number) => {
    setPage(p);
    gridTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const rail = (
    <div className="space-y-7">
      <FacetGroup
        title="Danh mục"
        options={facets.categories}
        selected={f.categories}
        onToggle={(v) => setF({ ...f, categories: toggle(f.categories, v) })}
      />
      <FacetGroup
        title="Mức giá"
        options={facets.bands.map((b) => ({
          ...b,
          label: PRICE_BANDS.find((p) => p.id === b.value)?.label,
        }))}
        selected={f.bands}
        onToggle={(v) => setF({ ...f, bands: toggle(f.bands, v) })}
      />
      <FacetGroup
        title="Chất liệu"
        options={facets.materials}
        selected={f.materials}
        onToggle={(v) => setF({ ...f, materials: toggle(f.materials, v) })}
      />
      <FacetGroup
        title="Xưởng"
        options={facets.shops}
        selected={f.shops}
        onToggle={(v) => setF({ ...f, shops: toggle(f.shops, v) })}
      />
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-brand">
      <LabBar study="catalog" index={1} />

      <header className="mx-auto max-w-7xl px-5 pb-8 pt-10 md:px-8 md:pt-14">
        <p className="label text-wave">Danh mục</p>
        <h1 className="display mt-2 text-4xl normal-case text-paper md:text-5xl">Sản phẩm</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80">
          {products.length} sản phẩm từ {facets.shops.length} xưởng. {NO_TRANSACTION}
        </p>
      </header>

      <div className="bg-paper">
        <div className="mx-auto flex max-w-7xl gap-10 px-5 py-8 md:px-8">
          {/* Rail — desktop */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-12 space-y-6">
              <label className="flex items-center gap-2 border-b border-ink/15 pb-2">
                <Search className="h-3.5 w-3.5 text-ink/40" />
                <input
                  value={f.q}
                  onChange={(e) => setF({ ...f, q: e.target.value })}
                  placeholder="Tìm trong danh mục"
                  className="w-full bg-transparent text-xs text-ink outline-none placeholder:text-ink/35"
                />
              </label>
              {rail}
            </div>
          </aside>

          <main className="min-w-0 flex-1" ref={gridTop}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/15 pb-3">
              <p className="text-xs text-ink/60">
                <strong className="text-sm font-semibold text-ink">{rows.length}</strong> sản phẩm
                {pages > 1 && <span className="text-ink/45"> · trang {page}/{pages}</span>}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSheetOpen(true)}
                  className="flex items-center gap-1.5 border border-ink/15 px-3 py-1.5 text-[11px] font-medium text-ink/70 lg:hidden"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Bộ lọc {countActive(f) > 0 && `(${countActive(f)})`}
                </button>
                <div className="hidden sm:block">
                  <SortSegments value={f.sort} onChange={(sort) => setF({ ...f, sort })} />
                </div>
              </div>
            </div>

            {countActive(f) > 0 && (
              <div className="pt-3">
                <ActiveTags f={f} set={setF} />
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 gap-x-5 gap-y-8 pt-6 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse space-y-2">
                    <div className="aspect-square bg-paper-warm" />
                    <div className="h-3 w-1/3 bg-paper-warm" />
                    <div className="h-3 w-3/4 bg-paper-warm" />
                  </div>
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="pt-8">
                <ZeroResult onClear={() => setF(EMPTY_FILTERS)} />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-x-5 gap-y-8 pt-6 md:grid-cols-3 xl:grid-cols-4">
                  {slice.map((p, i) => (
                    <div key={p.id}>
                      <ProductCard product={p} to={`/lab/product/1/${p.id}`} index={i} />
                    </div>
                  ))}
                </div>
                <Pager page={page} pages={pages} onPage={goPage} />
              </>
            )}
          </main>
        </div>
      </div>

      {/* Bottom sheet — mobile */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            aria-label="Đóng bộ lọc"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-ink/60"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-y-auto bg-paper">
            <div className="sticky top-0 flex items-center justify-between border-b border-ink/12 bg-paper px-5 py-3">
              <span className="label text-ink/60">Bộ lọc</span>
              <button onClick={() => setSheetOpen(false)} aria-label="Đóng">
                <X className="h-4 w-4 text-ink/60" />
              </button>
            </div>
            <div className="space-y-7 px-5 py-5">
              <section className="space-y-2">
                <h3 className="label text-ink/45">Sắp xếp</h3>
                <SortSegments value={f.sort} onChange={(sort) => setF({ ...f, sort })} layout="grid" />
              </section>
              {rail}
            </div>
            <div className="sticky bottom-0 border-t border-ink/12 bg-paper p-4">
              <button
                onClick={() => setSheetOpen(false)}
                className="w-full bg-brand py-3 text-xs font-semibold text-paper"
              >
                Xem {rows.length} sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · RÁP — The Rail
   One hairline rail carries everything; the facets live behind a disclosure
   so the goods keep the width. Results extend instead of paging.
   ═══════════════════════════════════════════════════════════════════════════ */

const STEP_2 = 24;

export function CatalogueTwo() {
  const { products, loading } = useCatalogue();
  const [f, setF] = useState<FilterState>(EMPTY_FILTERS);
  const [panelOpen, setPanelOpen] = useState(false);
  const [shown, setShown] = useState(STEP_2);
  const facets = useFacets(products, f);
  const rows = useFiltered(products, f);

  const key = JSON.stringify({ ...f, sort: "" });
  useEffect(() => {
    setShown(STEP_2);
  }, [key]);

  const slice = rows.slice(0, shown);
  const remaining = rows.length - slice.length;

  return (
    <div className="min-h-[100dvh] bg-brand text-paper">
      <LabBar study="catalog" index={2} />

      <header className="mx-auto max-w-[100rem] px-5 pb-6 pt-10 md:px-10 md:pt-16">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label text-wave">Danh mục</p>
            <h1 className="display mt-2 text-5xl normal-case md:text-7xl">Sản phẩm</h1>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-white/75">
            {products.length} sản phẩm từ {facets.shops.length} xưởng, xếp mới nhất trước.{" "}
            {NO_TRANSACTION}
          </p>
        </div>
      </header>

      {/* the rail */}
      <div className="sticky top-9 z-40 border-y border-white/20 bg-brand/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[100rem] flex-wrap items-center gap-3 px-5 py-2.5 md:px-10">
          <button
            onClick={() => setPanelOpen((v) => !v)}
            aria-expanded={panelOpen}
            className={`flex items-center gap-2 border px-3 py-1.5 text-[11px] font-medium transition-colors ${
              panelOpen || countActive(f)
                ? "border-wave text-wave"
                : "border-white/30 text-white/80 hover:border-wave hover:text-wave"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Bộ lọc{countActive(f) > 0 ? ` (${countActive(f)})` : ""}
          </button>

          <label className="flex min-w-40 flex-1 items-center gap-2 border-b border-white/25 py-1">
            <Search className="h-3.5 w-3.5 text-white/50" />
            <input
              value={f.q}
              onChange={(e) => setF({ ...f, q: e.target.value })}
              placeholder="Tìm sản phẩm, xưởng"
              className="w-full bg-transparent text-xs text-paper outline-none placeholder:text-white/40"
            />
          </label>

          <span className="hidden text-[11px] text-white/60 sm:inline">
            <strong className="font-semibold text-paper">{rows.length}</strong> kết quả
          </span>

          <SortSegments value={f.sort} onChange={(sort) => setF({ ...f, sort })} tone="paper" />
        </div>

        {panelOpen && (
          <div className="border-t border-white/15 bg-brand-deep/95">
            <div className="mx-auto grid max-w-[100rem] gap-8 px-5 py-6 md:grid-cols-4 md:px-10">
              <FacetGroup
                title="Danh mục"
                options={facets.categories}
                selected={f.categories}
                onToggle={(v) => setF({ ...f, categories: toggle(f.categories, v) })}
                tone="paper"
              />
              <FacetGroup
                title="Mức giá"
                options={facets.bands.map((b) => ({
                  ...b,
                  label: PRICE_BANDS.find((p) => p.id === b.value)?.label,
                }))}
                selected={f.bands}
                onToggle={(v) => setF({ ...f, bands: toggle(f.bands, v) })}
                tone="paper"
              />
              <FacetGroup
                title="Chất liệu"
                options={facets.materials}
                selected={f.materials}
                onToggle={(v) => setF({ ...f, materials: toggle(f.materials, v) })}
                tone="paper"
              />
              <FacetGroup
                title="Xưởng"
                options={facets.shops}
                selected={f.shops}
                onToggle={(v) => setF({ ...f, shops: toggle(f.shops, v) })}
                tone="paper"
              />
            </div>
          </div>
        )}

        {countActive(f) > 0 && !panelOpen && (
          <div className="mx-auto max-w-[100rem] px-5 pb-2.5 md:px-10">
            <ActiveTags f={f} set={setF} tone="paper" />
          </div>
        )}
      </div>

      <main className="mx-auto max-w-[100rem] px-5 py-10 md:px-10">
        {loading ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="aspect-square bg-white/10" />
                <div className="h-3 w-1/3 bg-white/10" />
                <div className="h-3 w-2/3 bg-white/10" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <ZeroResult onClear={() => setF(EMPTY_FILTERS)} tone="paper" />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {slice.map((p, i) => (
                <div key={p.id}>
                  <ProductCard
                    product={p}
                    to={`/lab/product/2/${p.id}`}
                    index={i % STEP_2}
                    tone="paper"
                    showDescription
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center gap-3 pt-14">
              {remaining > 0 ? (
                <button
                  onClick={() => setShown((s) => s + STEP_2)}
                  className="border border-wave px-8 py-3 text-xs font-semibold text-wave transition-colors hover:bg-wave hover:text-ink"
                >
                  Xem thêm {Math.min(STEP_2, remaining)} sản phẩm
                </button>
              ) : (
                <p className="text-[11px] text-white/50">Hết {rows.length} sản phẩm.</p>
              )}
              <p className="text-[11px] text-white/45">
                Đang xem {slice.length}/{rows.length}
              </p>
              {shown > STEP_2 && (
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="text-[11px] text-white/60 underline underline-offset-4 hover:text-wave"
                >
                  Về đầu danh mục
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · MỤC LỤC — The Index
   The filters read as a sentence rather than a control panel, and the
   catalogue can be read as a contents list instead of a grid.
   ═══════════════════════════════════════════════════════════════════════════ */

const PER_GRID_3 = 24;
const PER_INDEX_3 = 36;

function InlineSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <span className="relative inline-flex items-baseline">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none border-b border-brand bg-transparent pb-0.5 pr-4 font-semibold text-brand outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-0.5 bottom-1 text-[11px] leading-none text-brand">
        ▾
      </span>
    </span>
  );
}

export function CatalogueThree() {
  const { products, loading } = useCatalogue();
  const [f, setF] = useState<FilterState>(EMPTY_FILTERS);
  const [mode, setMode] = useState<"grid" | "index">("index");
  const [hover, setHover] = useState<Product | null>(null);
  const facets = useFacets(products, f);
  const rows = useFiltered(products, f);

  const perPage = mode === "index" ? PER_INDEX_3 : PER_GRID_3;
  const key = JSON.stringify({ ...f, sort: "", mode });
  const { page, pages, setPage } = useResultPaging(rows.length, perPage, key);
  const slice = rows.slice((page - 1) * perPage, page * perPage);
  const top = useRef<HTMLDivElement>(null);

  const one = (list: string[]) => (list.length === 1 ? list[0] : "");
  const catOptions = useMemo(
    () => [
      { value: "", label: "tất cả danh mục" },
      ...facets.categories.map((c) => ({ value: c.value, label: `${c.value} (${c.count})` })),
    ],
    [facets.categories]
  );

  return (
    <div className="min-h-[100dvh] bg-paper text-ink">
      <LabBar study="catalog" index={3} />

      <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-16" ref={top}>
        <header className="border-b border-ink/15 pb-6">
          <p className="label text-wave-ink">Mục lục sản phẩm</p>
          <h1 className="display mt-2 text-4xl normal-case md:text-6xl">Sản phẩm</h1>
        </header>

        {/* the filter sentence */}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-3 border-b border-ink/15 py-5 text-sm leading-loose text-ink/70">
          <span>Đang xem</span>
          <InlineSelect
            value={one(f.categories)}
            onChange={(v) => setF({ ...f, categories: v ? [v] : [] })}
            options={catOptions}
          />
          <span aria-hidden>·</span>
          <span>giá</span>
          <InlineSelect
            value={one(f.bands)}
            onChange={(v) => setF({ ...f, bands: v ? [v] : [] })}
            options={[
              { value: "", label: "mọi mức" },
              ...facets.bands.map((b) => ({
                value: b.value,
                label: `${PRICE_BANDS.find((p) => p.id === b.value)?.label} (${b.count})`,
              })),
            ]}
          />
          <span aria-hidden>·</span>
          <span>làm bằng</span>
          <InlineSelect
            value={one(f.materials)}
            onChange={(v) => setF({ ...f, materials: v ? [v] : [] })}
            options={[
              { value: "", label: "mọi chất liệu" },
              ...facets.materials.map((m) => ({ value: m.value, label: `${m.value} (${m.count})` })),
            ]}
          />
          <span aria-hidden>·</span>
          <span>xếp theo</span>
          <InlineSelect
            value={f.sort}
            onChange={(sort) => setF({ ...f, sort })}
            options={SORTS.map((s) => ({ value: s.id, label: s.label.toLowerCase() }))}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 py-4">
          <p className="text-xs text-ink/55">
            <strong className="font-semibold text-ink">{rows.length}</strong> mục
            {pages > 1 && <span className="text-ink/40"> · trang {page}/{pages}</span>}
          </p>
          <div className="flex items-center border border-ink/15" role="group" aria-label="Kiểu xem">
            {(["index", "grid"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  mode === m ? "bg-ink text-paper" : "text-ink/60 hover:text-brand"
                }`}
              >
                {m === "index" ? "Mục lục" : "Lưới"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="py-16 text-center text-xs text-ink/50">Đang tải mục lục…</p>
        ) : rows.length === 0 ? (
          <ZeroResult onClear={() => setF(EMPTY_FILTERS)} />
        ) : mode === "index" ? (
          <>
            <ol className="border-t border-ink/12" onMouseLeave={() => setHover(null)}>
              {slice.map((p, i) => (
                <li key={p.id} className="border-b border-ink/12">
                  <IndexRow product={p} n={(page - 1) * perPage + i + 1} onHover={setHover} />
                </li>
              ))}
            </ol>

            {/* the plate — desktop only, summoned by the row under the cursor */}
            <div className="pointer-events-none fixed right-8 top-1/2 hidden w-56 -translate-y-1/2 lg:block">
              {hover && (
                <figure className="lab-settle">
                  <img
                    src={hover.images?.[0]}
                    alt=""
                    className="aspect-square w-full object-cover"
                  />
                  <figcaption className="pt-2 text-[11px] leading-relaxed text-ink/55">
                    {hover.name} · {hover.material}
                  </figcaption>
                </figure>
              )}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 pt-2 md:grid-cols-3 lg:grid-cols-4">
            {slice.map((p, i) => (
              <div key={p.id}>
                <ProductCard product={p} to={`/lab/product/3/${p.id}`} index={i} />
              </div>
            ))}
          </div>
        )}

        <Pager
          page={page}
          pages={pages}
          onPage={(p) => {
            setPage(p);
            top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />

        <p className="pt-10 text-center text-[11px] text-ink/45">{NO_TRANSACTION}</p>
      </div>
    </div>
  );
}

function IndexRow({
  product,
  n,
  onHover,
}: {
  product: Product;
  n: number;
  onHover: (p: Product | null) => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="group flex items-baseline gap-3 py-3">
        <span className="w-8 shrink-0 tabular-nums text-[11px] text-ink/35">
          {String(n).padStart(2, "0")}
        </span>
        <span
          className="min-w-0 flex-1"
          onMouseEnter={() => onHover(product)}
          onFocus={() => onHover(product)}
        >
          <ContinuityLink
            product={product}
            to={`/lab/product/3/${product.id}`}
            imgRef={imgRef}
            className="block text-sm text-ink transition-colors group-hover:text-brand"
          >
            {product.name}
            <span className="hidden text-ink/45 sm:inline"> · {product.storeName}</span>
          </ContinuityLink>
        </span>
        <span className="lab-dots" aria-hidden />
        <span className="shrink-0 text-sm font-semibold tabular-nums">
          {formatPrice(product.price)}
        </span>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Thu gọn" : "Xem nhanh"}
          className="shrink-0 text-[11px] text-ink/40 transition-colors hover:text-brand"
        >
          {open ? "−" : "+"}
        </button>
      </div>

      {open && (
        <div className="flex gap-4 pb-5 pl-11">
          <ContinuityLink
            product={product}
            to={`/lab/product/3/${product.id}`}
            imgRef={imgRef}
            className="w-28 shrink-0"
          >
            <img
              ref={imgRef}
              src={product.images?.[0]}
              alt={product.name}
              className="aspect-square w-full object-cover"
            />
          </ContinuityLink>
          <div className="min-w-0 flex-1 space-y-2">
            <Clamp text={product.description} lines={3} className="text-xs leading-relaxed text-ink/70" />
            <p className="text-[11px] text-ink/45">
              {product.material} · {product.size}
            </p>
            <ContinuityLink
              product={product}
              to={`/lab/product/3/${product.id}`}
              imgRef={imgRef}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
            >
              Mở trang sản phẩm <ArrowUpRight className="h-3 w-3" />
            </ContinuityLink>
          </div>
        </div>
      )}
    </>
  );
}
