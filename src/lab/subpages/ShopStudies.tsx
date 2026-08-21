/**
 * Trang shop (/stores) — three directions.
 *
 * Shared by all three:
 *
 *   · the placeholder chip strip is gone. The live page offers nine district
 *     chips written by hand; the six shops in the database sit in six areas,
 *     none of which are those nine, so every chip filters to nothing. Where a
 *     direction still offers an area control it is built from the data and
 *     hides itself when there is nothing to choose between.
 *   · no view transition on a filter — the list changes in place.
 *   · "Đăng ký mở xưởng" goes to the sign-up page, not the auth gateway.
 *   · covers are 21:9 landscape, as every shop image slot must be.
 *
 * What differs: whether area is a filter, the spine, or absent; how much of
 * a shop you see before opening it; and how dense the page is.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, MapPin, Search } from "lucide-react";
import { fetchProducts, fetchStores } from "../../lib/dbService";
import type { Product, StoreProfile } from "../../types";
import { ContinuityLink, LabBar, NO_TRANSACTION, formatPrice } from "./shared";

function useShops() {
  const [shops, setShops] = useState<StoreProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([fetchStores(), fetchProducts("Approved")]).then(([s, p]) => {
      if (!alive) return;
      setShops(s);
      setProducts(p);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const byShop = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of products) map.set(p.storeId, [...(map.get(p.storeId) ?? []), p]);
    return map;
  }, [products]);

  const areas = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of shops) {
      const a = s.address?.trim();
      if (a) map.set(a, (map.get(a) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value, "vi"));
  }, [shops]);

  return { shops, byShop, areas, loading };
}

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function useShopSearch(shops: StoreProfile[], q: string, area: string) {
  return useMemo(
    () =>
      shops.filter((s) => {
        if (area && s.address !== area) return false;
        if (!q.trim()) return true;
        return norm(`${s.name} ${s.vibe} ${s.address}`).includes(norm(q));
      }),
    [shops, q, area]
  );
}

/** A shop's own product, opened with the same continuity morph the catalogue
 *  uses — the thumbnail here is what grows into the product page's frame. */
function ShopThumb({ product }: { product: Product }) {
  const ref = useRef<HTMLImageElement>(null);
  return (
    <ContinuityLink
      product={product}
      to={`/lab/product/3/${product.id}`}
      imgRef={ref}
      className="group/item block"
      title={product.name}
    >
      <img
        ref={ref}
        src={product.images?.[0]}
        alt={product.name}
        loading="lazy"
        className="aspect-square w-full object-cover opacity-80 transition-opacity group-hover/item:opacity-100"
      />
      <p className="truncate pt-1 text-[10px] text-white/50">{formatPrice(product.price)}</p>
    </ContinuityLink>
  );
}

function SignupCta({ index, tone = "ink" }: { index: 1 | 2 | 3; tone?: "ink" | "paper" }) {
  return (
    <Link
      to={`/lab/open/${index}`}
      viewTransition
      className={`group inline-flex items-center gap-3 border px-6 py-3 text-xs font-semibold transition-colors ${
        tone === "paper"
          ? "border-wave text-wave hover:bg-wave hover:text-ink"
          : "border-brand bg-brand text-paper hover:bg-brand-deep"
      }`}
    >
      Đăng ký mở xưởng
      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   1 · DANH BẠ — The Directory
   One shop per row, the cover doing the work at full width. Area is a single
   derived control that disappears when the data has nothing to choose.
   ═══════════════════════════════════════════════════════════════════════════ */

export function ShopsOne() {
  const { shops, byShop, areas, loading } = useShops();
  const [q, setQ] = useState("");
  const [area, setArea] = useState("");
  const rows = useShopSearch(shops, q, area);

  return (
    <div className="min-h-[100dvh] bg-brand text-paper">
      <LabBar study="shops" index={1} />

      <header className="mx-auto max-w-6xl px-5 pb-8 pt-10 md:px-8 md:pt-16">
        <p className="label text-wave">Danh bạ</p>
        <h1 className="display mt-2 text-4xl normal-case md:text-6xl">Xưởng &amp; local brand</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80">
          {shops.length} xưởng đang có mặt trên Tí. {NO_TRANSACTION}
        </p>
      </header>

      <div className="bg-paper text-ink">
        <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
          <div className="flex flex-wrap items-center gap-3 border-b border-ink/15 pb-3">
            <label className="flex min-w-48 flex-1 items-center gap-2">
              <Search className="h-3.5 w-3.5 text-ink/40" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm xưởng theo tên hoặc nghề"
                className="w-full bg-transparent text-xs outline-none placeholder:text-ink/35"
              />
            </label>

            {/* shown only when the data gives something to choose between */}
            {areas.length > 1 && (
              <label className="flex items-center gap-2 text-xs text-ink/60">
                <MapPin className="h-3.5 w-3.5" />
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="border-b border-ink/25 bg-transparent py-1 pr-1 text-xs font-medium text-ink outline-none"
                >
                  <option value="">Tất cả khu vực ({shops.length})</option>
                  {areas.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.value} ({a.count})
                    </option>
                  ))}
                </select>
              </label>
            )}

            <span className="text-[11px] text-ink/55">
              <strong className="font-semibold text-ink">{rows.length}</strong> kết quả
            </span>
          </div>

          {loading ? (
            <p className="py-16 text-center text-xs text-ink/50">Đang tải danh bạ…</p>
          ) : (
            <ul className="divide-y divide-ink/12">
              {rows.map((shop) => {
                const items = byShop.get(shop.id) ?? [];
                return (
                  <li key={shop.id} className="lab-settle py-7">
                    <Link
                      to={`/stores/${shop.id}`}
                      viewTransition
                      className="group grid gap-5 md:grid-cols-12 md:items-center"
                    >
                      <div className="overflow-hidden bg-paper-warm md:col-span-5">
                        <img
                          src={shop.coverUrl}
                          alt=""
                          loading="lazy"
                          className="aspect-[21/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-5">
                        <h2 className="display text-2xl normal-case transition-colors group-hover:text-brand">
                          {shop.name}
                        </h2>
                        <p className="text-xs leading-relaxed text-ink/65">{shop.vibe}</p>
                        <p className="label text-ink/40">
                          {shop.address} · {items.length} sản phẩm
                        </p>
                      </div>
                      <div className="flex gap-2 md:col-span-2 md:justify-end">
                        {items.slice(0, 3).map((p) => (
                          <img
                            key={p.id}
                            src={p.images?.[0]}
                            alt=""
                            loading="lazy"
                            className="h-14 w-14 object-cover"
                          />
                        ))}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex flex-col items-start gap-3 border-t border-ink/15 pt-10">
            <p className="text-sm text-ink/70">Bạn có xưởng và muốn xuất hiện ở đây?</p>
            <SignupCta index={1} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · THEO KHU — By area
   Area is the spine rather than a filter: a standing index on the left, the
   shops of the chosen area on the right, and the map as the way out.
   ═══════════════════════════════════════════════════════════════════════════ */

export function ShopsTwo() {
  const { shops, byShop, areas, loading } = useShops();
  const [area, setArea] = useState("");
  const rows = useShopSearch(shops, "", area);

  return (
    <div className="min-h-[100dvh] bg-paper text-ink">
      <LabBar study="shops" index={2} />

      <header className="mx-auto max-w-6xl px-5 pb-6 pt-10 md:px-8 md:pt-14">
        <p className="label text-wave-ink">Theo khu vực</p>
        <h1 className="display mt-2 text-4xl normal-case md:text-6xl">Xưởng ở đâu</h1>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-20 md:grid-cols-12 md:px-8">
        {/* the standing index */}
        <nav className="md:col-span-3" aria-label="Khu vực">
          <div className="md:sticky md:top-14">
            <ul className="border-t border-ink/12">
              <li>
                <button
                  onClick={() => setArea("")}
                  className={`flex w-full items-baseline justify-between border-b border-ink/12 py-2.5 text-left text-xs transition-colors ${
                    area === "" ? "font-semibold text-brand" : "text-ink/70 hover:text-brand"
                  }`}
                >
                  <span>Tất cả</span>
                  <span className="tabular-nums text-ink/40">{shops.length}</span>
                </button>
              </li>
              {areas.map((a) => (
                <li key={a.value}>
                  <button
                    onClick={() => setArea(a.value)}
                    className={`flex w-full items-baseline justify-between border-b border-ink/12 py-2.5 text-left text-xs transition-colors ${
                      area === a.value ? "font-semibold text-brand" : "text-ink/70 hover:text-brand"
                    }`}
                  >
                    <span>{a.value}</span>
                    <span className="tabular-nums text-ink/40">{a.count}</span>
                  </button>
                </li>
              ))}
            </ul>

            <Link
              to="/kham-pha"
              viewTransition
              className="mt-6 flex items-center gap-2 border border-wave-ink/40 px-4 py-3 text-[11px] font-semibold text-wave-ink transition-colors hover:bg-wave hover:text-ink"
            >
              <MapPin className="h-3.5 w-3.5" />
              Xem trên bản đồ lộ trình
            </Link>
          </div>
        </nav>

        <main className="md:col-span-9">
          <p className="pb-4 text-xs text-ink/55">
            {area ? (
              <>
                <strong className="font-semibold text-ink">{rows.length}</strong> xưởng ở {area}
              </>
            ) : (
              <>
                <strong className="font-semibold text-ink">{shops.length}</strong> xưởng trên{" "}
                {areas.length} khu vực
              </>
            )}
          </p>

          {loading ? (
            <p className="py-16 text-center text-xs text-ink/50">Đang tải…</p>
          ) : (
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2">
              {rows.map((shop) => {
                const items = byShop.get(shop.id) ?? [];
                return (
                  <Link
                    key={shop.id}
                    to={`/stores/${shop.id}`}
                    viewTransition
                    className="group lab-settle block"
                  >
                    <div className="overflow-hidden bg-paper-warm">
                      <img
                        src={shop.coverUrl}
                        alt=""
                        loading="lazy"
                        className="aspect-[21/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    </div>
                    <div className="flex items-baseline justify-between gap-3 pt-3">
                      <h2 className="display text-xl normal-case group-hover:text-brand">
                        {shop.name}
                      </h2>
                      <span className="label shrink-0 text-ink/40">{items.length} sp</span>
                    </div>
                    <p className="pt-1 text-xs leading-relaxed text-ink/65">{shop.vibe}</p>
                    <p className="label pt-1.5 text-wave-ink">{shop.address}</p>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-ink/15 pt-8">
            <p className="text-sm text-ink/70">Xưởng của bạn chưa có trong khu này?</p>
            <SignupCta index={2} />
          </div>
        </main>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · TỦ — The Cabinet
   Two shops to a row, each one already showing what it makes. No area
   control at all: with six shops, search is the only control that earns its
   place, and the goods do the sorting.
   ═══════════════════════════════════════════════════════════════════════════ */

export function ShopsThree() {
  const { shops, byShop, loading } = useShops();
  const [q, setQ] = useState("");
  const rows = useShopSearch(shops, q, "");

  return (
    <div className="min-h-[100dvh] bg-ink text-paper">
      <LabBar study="shops" index={3} />

      <header className="mx-auto max-w-6xl px-5 pb-8 pt-12 md:px-8 md:pt-20">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label text-wave">Tủ xưởng</p>
            <h1 className="display mt-2 text-5xl normal-case md:text-7xl">Ai đang làm gì</h1>
          </div>
          <label className="flex min-w-56 items-center gap-2 border-b border-white/25 pb-2">
            <Search className="h-3.5 w-3.5 text-white/50" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm xưởng"
              className="w-full bg-transparent text-xs text-paper outline-none placeholder:text-white/40"
            />
          </label>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24 md:px-8">
        {loading ? (
          <p className="py-16 text-center text-xs text-white/50">Đang tải…</p>
        ) : (
          <div className="grid gap-x-8 gap-y-14 md:grid-cols-2">
            {rows.map((shop) => {
              const items = byShop.get(shop.id) ?? [];
              return (
                <article key={shop.id} className="lab-settle space-y-4">
                  <Link to={`/stores/${shop.id}`} viewTransition className="group block">
                    <div className="overflow-hidden bg-white/5">
                      <img
                        src={shop.coverUrl}
                        alt=""
                        loading="lazy"
                        className="aspect-[21/9] w-full object-cover opacity-90 transition-all duration-500 group-hover:scale-[1.02] group-hover:opacity-100"
                      />
                    </div>
                    <div className="flex items-baseline justify-between gap-3 pt-3">
                      <h2 className="display text-2xl normal-case group-hover:text-wave">
                        {shop.name}
                      </h2>
                      <span className="label shrink-0 text-white/45">{shop.address}</span>
                    </div>
                    <p className="pt-1 text-xs leading-relaxed text-white/70">{shop.vibe}</p>
                  </Link>

                  <div className="grid grid-cols-4 gap-2">
                    {items.slice(0, 4).map((p) => (
                      <div key={p.id}>
                        <ShopThumb product={p} />
                      </div>
                    ))}
                  </div>

                  <Link
                    to={`/stores/${shop.id}`}
                    viewTransition
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-wave hover:underline"
                  >
                    Xem cả {items.length} sản phẩm <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-20 flex flex-col items-start gap-4 border-t border-white/15 pt-10">
          <p className="display text-2xl normal-case">Mở tủ của xưởng bạn</p>
          <p className="max-w-md text-xs leading-relaxed text-white/65">
            Tí không thu phí và không giữ đơn — xưởng bán trên kênh của mình như bình thường.
          </p>
          <SignupCta index={3} tone="paper" />
        </div>
      </main>
    </div>
  );
}
