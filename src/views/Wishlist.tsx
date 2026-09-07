import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Heart, X } from "lucide-react";
import { fetchProductById } from "../lib/dbService";
import { useSavedProducts } from "../lib/useSavedProducts";
import { useAuth } from "../lib/useAuth";
import { ArcTopRight, WaveProducts } from "../components/BrandShapes";
import Breadcrumbs from "../components/Breadcrumbs";
import type { Product } from "../types";

/**
 * Đã lưu — /wishlist
 *
 * Team 07/09: "có lưu, nhưng trên nav bar chưa có chỗ để vào. Chọn 1 icon hợp
 * lý để dẫn đến trang wishlist."
 *
 * There was a saved list, and it was genuinely unreachable. It lived inside
 * /user-profile, which redirects to /auth-gateway the moment it finds no
 * signed-in user — and the whole point of the fix earlier on this branch is
 * that a signed-out visitor can save things. So the site would take a save,
 * keep it, and then send you to a sign-in wall when you went looking for it.
 *
 * This is the page the nav's heart leads to. It reads the same row the heart
 * on /products writes to, guest or signed in, so it works in the state the
 * site is normally met in. The fuller dashboard on /user-profile stays where
 * it is; a signed-in visitor gets a line through to it.
 */

/* Same ground language as /products and /stores: violet from y=0 behind a
   brand mark, a wave into paper, the trail underneath on the paper. */
export default function Wishlist() {
  const { user } = useAuth();
  const saved = useSavedProducts();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!saved.ready) return;
    let cancelled = false;

    (async () => {
      const rows = await Promise.all(saved.ids.map((id) => fetchProductById(id)));
      if (cancelled) return;
      setItems(rows.filter((p): p is Product => p !== null));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [saved.ready, saved.ids]);

  const empty = !loading && items.length === 0;

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
              : items.length > 0
                ? `${items.length} món bạn để dành. Nhắn thẳng cho shop khi nào bạn sẵn sàng.`
                : "Chưa có gì ở đây. Bấm trái tim trên một sản phẩm là nó sẽ nằm lại chỗ này."}
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
              Dạo qua danh mục và bấm trái tim ở góc mỗi sản phẩm. Tí giữ lại đây cho bạn,
              không cần đăng nhập.
            </p>
            <Link
              to="/products"
              className="group mt-7 inline-flex items-center gap-3 rounded-full bg-brand py-2 pl-6 pr-2 text-sm font-semibold text-paper transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105"
            >
              Xem sản phẩm
              <span className="grid h-9 w-9 place-items-center rounded-full bg-paper text-brand transition-transform duration-500 group-hover:translate-x-0.5">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-10 flex items-baseline justify-between gap-4 border-b border-ink/12 pb-3">
              <h2 className="display text-[clamp(1.35rem,3vw,2rem)] normal-case leading-[1.15]">
                Tác phẩm bạn để dành
              </h2>
              <span className="label shrink-0 text-ink/45">
                {String(items.length).padStart(2, "0")} món
              </span>
            </div>

            <ul className="grid grid-cols-2 gap-5 pt-6 md:grid-cols-3 lg:grid-cols-4">
              {items.map((product) => (
                <li
                  key={product.id}
                  className="rounded-[2rem] bg-black/5 p-1.5 ring-1 ring-black/5 transition-shadow hover:ring-brand/40"
                >
                  <div className="relative flex h-full flex-col overflow-hidden rounded-[1.625rem] border border-ink/5 bg-paper">
                    {/* The image is the link; the remove button is its sibling,
                        not its child — a button inside a link is invalid and
                        swallows the tap. Same shape /products settled on. */}
                    <Link
                      to={`/products/${product.id}`}
                      viewTransition
                      className="group block aspect-square overflow-hidden bg-paper-warm"
                    >
                      <img
                        src={product.images?.[0]}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                      />
                    </Link>

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
                          ? `${product.price.toLocaleString("vi-VN")}₫`
                          : "Liên hệ"}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

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
