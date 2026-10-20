import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ContinuityLink } from "../lib/continuity";
import { ArrowUpRight, Heart, Store, X } from "lucide-react";
import { fetchProductById, fetchStoreById } from "../lib/dbService";
import { useSavedProducts } from "../lib/useSavedProducts";
import { useSavedStores } from "../lib/useSavedStores";
import { useAuth } from "../lib/useAuth";
import { ArcTopRight, WaveProducts } from "../components/BrandShapes";
import Breadcrumbs from "../components/Breadcrumbs";
import type { Product, StoreProfile } from "../types";

/**
 * Đã lưu — /wishlist
 * Displays both saved products and saved shops.
 */
export default function Wishlist() {
  const { user } = useAuth();
  const saved = useSavedProducts();
  const savedStores = useSavedStores();
  const [items, setItems] = useState<Product[]>([]);
  const [shops, setShops] = useState<StoreProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"products" | "shops">("products");

  useEffect(() => {
    if (!saved.ready || !savedStores.ready) return;
    let cancelled = false;

    (async () => {
      const [productRows, shopRows] = await Promise.all([
        Promise.all(saved.ids.map((id) => fetchProductById(id))),
        Promise.all(savedStores.ids.map((id) => fetchStoreById(id))),
      ]);
      if (cancelled) return;
      setItems(productRows.filter((p): p is Product => p !== null));
      setShops(shopRows.filter((s): s is StoreProfile => s !== null));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [saved.ready, saved.ids, savedStores.ready, savedStores.ids]);

  const totalSaved = items.length + shops.length;
  const empty = !loading && totalSaved === 0;

  return (
    <div className="relative w-full overflow-x-hidden bg-paper pb-20 text-ink md:-mt-28 -mt-24">
      <section data-surface="dark" className="relative z-10 overflow-hidden bg-brand text-paper">
        <ArcTopRight
          className="pointer-events-none absolute -right-20 -top-24 z-0 opacity-15"
          style={{ width: "clamp(16rem, 34vw, 28rem)" }}
          fill="var(--color-wave)"
        />

        <div className="relative z-10 mx-auto max-w-6xl px-5 pb-2 pt-24 md:px-8 md:pt-28">
          <h1 className="display text-4xl font-medium normal-case leading-[1.25] text-paper md:text-6xl">
            Đã lưu
          </h1>
          <p className="mt-3 max-w-[54ch] text-base leading-relaxed text-white/80">
            {loading
              ? "Đang mở danh sách của bạn…"
              : totalSaved > 0
                ? `${items.length} sản phẩm và ${shops.length} shop bạn để dành. Nhắn thẳng cho shop khi nào bạn sẵn sàng.`
                : "Chưa có gì ở đây. Bấm trái tim trên một sản phẩm hoặc trang shop để lưu lại chỗ này."}
          </p>
        </div>

        <div className="relative z-10 -mb-px h-[clamp(2.5rem,5vw,4.5rem)] overflow-hidden">
          <WaveProducts className="absolute inset-x-0 bottom-0" fill="var(--color-paper)" />
        </div>
      </section>

      <div data-surface="light" className="relative z-10 mx-auto max-w-6xl px-5 md:px-8">
        <Breadcrumbs
          className="mt-2"
          trail={[{ label: "Trang chủ", to: "/" }, { label: "Đã lưu" }]}
        />

        {loading ? (
          <div className="grid grid-cols-2 gap-5 pt-10 md:grid-cols-3 lg:grid-cols-4" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-[1.625rem] bg-ink/5" />
            ))}
          </div>
        ) : empty ? (
          <div className="mt-12 border-t border-ink/12 py-16 text-center">
            <Heart aria-hidden="true" className="mx-auto h-8 w-8 text-brand/40" />
            <p className="mt-4 text-base font-semibold text-ink">Danh sách lưu đang trống</p>
            <p className="mx-auto mt-2 max-w-[44ch] text-sm leading-relaxed text-ink/60">
              Dạo qua danh mục hoặc trang shop và bấm trái tim. Tí giữ lại đây cho bạn,
              không cần đăng nhập.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                to="/products"
                className="group inline-flex items-center gap-3 rounded-full bg-brand py-2 pl-6 pr-2 text-sm font-semibold text-paper transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105"
              >
                Xem sản phẩm
                <span className="grid h-9 w-9 place-items-center rounded-full bg-paper text-brand transition-transform duration-500 group-hover:translate-x-0.5">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
              <Link
                to="/stores"
                className="group inline-flex items-center gap-3 rounded-full border border-ink/15 bg-paper py-2 pl-6 pr-2 text-sm font-semibold text-ink transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105"
              >
                Xem các shop
                <span className="grid h-9 w-9 place-items-center rounded-full bg-paper-warm text-brand transition-transform duration-500 group-hover:translate-x-0.5">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-8 flex items-center gap-3 border-b border-ink/12 pb-4">
              <button
                type="button"
                onClick={() => setTab("products")}
                className={`rounded-full px-5 py-2 text-xs font-semibold transition-all ${
                  tab === "products"
                    ? "bg-brand text-paper shadow-xs"
                    : "bg-paper-warm text-ink/70 hover:bg-ink/10"
                }`}
              >
                Sản phẩm ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setTab("shops")}
                className={`rounded-full px-5 py-2 text-xs font-semibold transition-all ${
                  tab === "shops"
                    ? "bg-brand text-paper shadow-xs"
                    : "bg-paper-warm text-ink/70 hover:bg-ink/10"
                }`}
              >
                Shop ({shops.length})
              </button>
            </div>

            {tab === "products" ? (
              items.length === 0 ? (
                <div className="py-16 text-center text-sm text-ink/60">
                  <p>Chưa có sản phẩm nào được lưu.</p>
                  <Link to="/products" className="mt-3 inline-block font-semibold text-brand underline underline-offset-4">
                    Khám phá sản phẩm
                  </Link>
                </div>
              ) : (
                <ul className="grid grid-cols-2 gap-5 pt-6 md:grid-cols-3 lg:grid-cols-4">
                  {items.map((product) => (
                    <li
                      key={product.id}
                      className="rounded-[2rem] bg-black/5 p-1.5 ring-1 ring-black/5 transition-shadow hover:ring-brand/40"
                    >
                      <div className="relative flex h-full flex-col overflow-hidden rounded-[1.625rem] border border-ink/5 bg-paper">
                        <ContinuityLink
                          product={product}
                          to={`/products/${product.id}`}
                          className="group block aspect-square overflow-hidden bg-paper-warm"
                        >
                          <img
                            src={product.images?.[0]}
                            alt={product.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                          />
                        </ContinuityLink>

                        <button
                          onClick={() => saved.toggle(product.id)}
                          aria-label={`Bỏ ${product.name} khỏi danh sách đã lưu`}
                          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-paper/90 text-ink/55 shadow-sm backdrop-blur-sm transition-colors hover:bg-paper hover:text-brand"
                        >
                          <X className="h-4 w-4" />
                        </button>

                        <div className="flex flex-1 flex-col justify-between gap-2 p-4">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">
                              {product.storeName}
                            </p>
                            <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-ink">
                              {product.name}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-ink">
                            {product.price > 0
                              ? `${product.price.toLocaleString("vi-VN")}đ`
                              : "Liên hệ"}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            ) : (
              shops.length === 0 ? (
                <div className="py-16 text-center text-sm text-ink/60">
                  <Store className="mx-auto h-8 w-8 text-brand/40" />
                  <p className="mt-3">Chưa có shop nào được lưu.</p>
                  <Link to="/stores" className="mt-2 inline-block font-semibold text-brand underline underline-offset-4">
                    Xem danh bạ shop
                  </Link>
                </div>
              ) : (
                <ul className="grid grid-cols-1 gap-6 pt-6 md:grid-cols-2 lg:grid-cols-3">
                  {shops.map((shop) => (
                    <li
                      key={shop.id}
                      className="group relative flex flex-col overflow-hidden rounded-[1.875rem] border border-ink/10 bg-paper p-5 transition-shadow hover:border-brand/40"
                    >
                      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-paper-warm">
                        <img
                          src={shop.coverUrl || shop.logoUrl || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600"}
                          alt={shop.name}
                          className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-105"
                        />
                        <button
                          type="button"
                          onClick={() => savedStores.toggle(shop.id)}
                          aria-label={`Bỏ ${shop.name} khỏi danh sách đã lưu`}
                          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-paper/90 text-ink/60 shadow-sm backdrop-blur-sm transition-colors hover:bg-paper hover:text-brand"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="display truncate text-lg normal-case font-medium text-ink">
                            {shop.name}
                          </h3>
                          {shop.address && (
                            <p className="truncate text-xs text-ink/60">{shop.address}</p>
                          )}
                        </div>

                        <Link
                          to={`/stores/${shop.id}`}
                          className="shrink-0 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-paper hover:bg-brand-deep transition-colors"
                        >
                          Ghé shop
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            )}

            {user && (
              <p className="mt-10 border-t border-ink/12 pt-6 text-sm text-ink/60">
                Ghi chú, nhắc giá và các shop bạn theo dõi nằm ở{" "}
                <Link
                  to="/user-profile"
                  className="font-semibold text-brand underline underline-offset-4"
                >
                  trang cá nhân
                </Link>
                .
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
