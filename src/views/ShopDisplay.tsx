import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, ExternalLink } from "lucide-react";
import { fetchProductsStore, fetchStoreById, toggleFollowShop } from "../lib/dbService";
import type { Product, StoreProfile } from "../types";
import { useAuth } from "../lib/useAuth";
import SaveButton from "../components/SaveButton";
import {
  Clamp,
  ContinuityLink,
  NO_TRANSACTION,
  PRICE_NOTE,
  formatPrice,
} from "../lib/continuity";

/**
 * Trang shop — /stores/:storeId
 *
 * Direction C from /lab/shop-colour — "Chia đôi" — picked by the team on
 * 09/09, with one correction: "tiết chế việc dùng màu teal làm background quá
 * nhiều, chỉ cần chiếm 10% tổng diện tích thôi cũng được. màu violet chiếm
 * 20% ok."
 *
 * So the page is:
 *
 *     ┌──────────────┬──────────────────────┐
 *     │  violet      │  the cover, whole    │   the split
 *     │  name, place │  no crop, no scrim   │
 *     └──────────────┴──────────────────────┘
 *     ═══════════ teal rule ═══════════════════
 *      paper — the story, the details, the products
 *     ═══════════ teal band ═══════════════════   the notes
 *
 * Two things changed from the page this replaces, and both are the point.
 *
 * The cover no longer carries the shop's name. It used to be full-bleed with
 * two gradients laid over it so the name had something to sit on, which is
 * the one thing /lab/shop-colour was set up to stop: a shop's photograph is
 * the shop's, and a scrim is a page taking a photograph and using it as a
 * ground. The name has a violet field of its own now, beside the picture
 * rather than on top of it.
 *
 * And the page ground is paper, not violet. Everything below the split — the
 * story, the details, the grid — reads on white, which is what makes 20%
 * violet a proportion rather than a description of the whole page.
 *
 * Teal comes to two marks: the rule under the split, and the band that
 * carries the price note at the end. C in the lab spent 22% of the frame on
 * it, mostly as a field behind the product grid; that field is gone.
 */

function useShopPage(storeId: string | undefined) {
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!storeId) return;
    setResolved(false);
    fetchStoreById(storeId).then(async (s) => {
      if (!alive) return;
      setStore(s);
      setResolved(true);
      if (!s) return;
      const rows = await fetchProductsStore(s.id);
      if (alive) setProducts(rows);
    });
    return () => {
      alive = false;
    };
  }, [storeId]);

  return { store, products, resolved };
}

function ShopCard({ product }: { product: Product }) {
  const ref = useRef<HTMLImageElement>(null);
  return (
    /* The link wraps the card, and the save control is its sibling rather
       than its child: a button inside an anchor is invalid, and the anchor
       swallows the press. Same shape /products settled on. */
    <div className="group/tile group relative">
      <ContinuityLink
        product={product}
        to={`/products/${product.id}`}
        imgRef={ref}
        className="block"
      >
        {/* square and rounded, matching What's in store on the homepage */}
        <div className="relative aspect-square overflow-hidden rounded-[1.25rem] bg-black/5">
          <img
            ref={ref}
            src={product.images?.[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <h3 className="pt-2.5 text-sm leading-snug text-ink transition-colors group-hover:text-brand">
          {product.name}
        </h3>
        <p className="pt-0.5 text-sm font-semibold text-brand">{formatPrice(product.price)}</p>
      </ContinuityLink>

      {/* everywhere a product photograph is (07/09) */}
      <span className="absolute right-1 top-1 z-10">
        <SaveButton product={product} revealOnHover />
      </span>
    </div>
  );
}

export default function ShopDisplay() {
  const { storeId } = useParams<{ storeId: string }>();
  const { store, products, resolved } = useShopPage(storeId);
  const { user, profile, refreshProfile } = useAuth();
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (store && profile) setFollowing(profile.followedShops?.includes(store.id) || false);
  }, [store, profile]);

  const channels = useMemo(() => {
    const s = store?.socials ?? {};
    return (
      [
        ["Instagram", s.instagram],
        ["TikTok", s.tiktok],
        ["Facebook", s.facebook],
        ["Threads", s.threads],
        ["Website", s.website],
      ] as const
    )
      .filter(([, url]) => !!url)
      .map(([platform, url]) => ({ platform, url: url as string }));
  }, [store]);

  const openChannel = (url: string) => {
    const base = url.startsWith("http") ? url : `https://${url}`;
    window.open(
      `${base}${base.includes("?") ? "&" : "?"}utm_source=ticoolture&utm_medium=shop`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  if (!store) {
    return resolved ? (
      <div className="grid min-h-[70dvh] place-items-center bg-brand px-6 text-center text-paper">
        <div className="space-y-4">
          <h1 className="display text-2xl normal-case">Không tìm thấy shop</h1>
          <Link
            to="/stores"
            className="inline-block rounded-full bg-paper px-5 py-2.5 text-xs font-semibold text-ink"
          >
            Về danh bạ shop
          </Link>
        </div>
      </div>
    ) : (
      <div className="min-h-[70dvh] bg-brand" />
    );
  }

  return (
    /* The same move /products, /stores and /discover already make: the shell
       clears the floating nav pill with pt-24, and the page gives it back so
       the split runs to y=0 and the pill floats on the violet half rather
       than on a strip of the shell's own ink. */
    <div className="min-h-[100dvh] -mt-24 bg-paper pb-28 text-ink md:-mt-28">
      {/* ── the split ──────────────────────────────────────────────────── */}
      <header className="relative">
        <div className="flex flex-col md:h-[clamp(26rem,68vh,38rem)] md:flex-row">
          {/* The violet half. justify-end, so the block of type sits on the
              bottom edge and the empty violet above it is what the nav pill
              floats on — the pill is centred and would otherwise land on the
              shop's name. */}
          <div
            data-surface="dark"
            className="relative order-2 flex flex-col justify-end bg-brand px-5 pb-8 pt-8 text-paper md:order-1 md:w-[46%] md:px-10 md:pb-12 md:pt-32"
          >
            {store.logoUrl && (
              <img
                src={store.logoUrl}
                alt=""
                className="h-14 w-14 rounded-2xl border border-white/25 object-cover md:h-16 md:w-16"
              />
            )}

            <p className="label mt-4 text-wave">{store.address || "Việt Nam"}</p>
            <h1 className="display mt-1.5 text-4xl normal-case leading-[1.08] md:text-5xl">
              {store.name}
            </h1>
            {store.vibe && (
              <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-white/80 md:text-base">
                {store.vibe}
              </p>
            )}

            {/* Below the pill, and on the violet rather than on the shop's
                photograph — which is the whole argument of this direction. */}
            <Link
              to="/stores"
              className="absolute left-5 top-24 inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-1.5 text-[11px] text-paper transition-colors hover:border-wave hover:text-wave md:left-10 md:top-28"
            >
              <ArrowLeft className="h-3 w-3" /> Danh bạ shop
            </Link>
          </div>

          {/* The photograph, whole. No crop beyond the box, no scrim, nothing
              set over it. 5:4 on a phone, and on a desktop it simply fills
              its half of the split. */}
          <div className="order-1 aspect-[5/4] w-full overflow-hidden bg-brand-deep md:order-2 md:aspect-auto md:h-full md:w-[54%]">
            <img
              src={store.coverUrl}
              alt={`Ảnh bìa của ${store.name}`}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Teal, mark one of two. */}
        <div aria-hidden="true" className="h-1.5 w-full bg-wave md:h-2" />
      </header>

      <main data-surface="light" className="mx-auto max-w-6xl space-y-14 px-5 py-12 md:px-10">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="space-y-6 md:col-span-7">
            <nav className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink/50">
              <Link to="/" className="hover:text-brand">
                Trang chủ
              </Link>
              <span>›</span>
              <Link to="/stores" className="hover:text-brand">
                Shop
              </Link>
              <span>›</span>
              <span className="font-semibold text-ink/80">{store.name}</span>
            </nav>

            {store.story ? (
              <>
                <h2 className="label text-ink/45">Câu chuyện của xưởng</h2>
                <Clamp
                  text={store.story}
                  lines={6}
                  className="text-base leading-relaxed text-ink/80"
                />
              </>
            ) : (
              <p className="text-sm text-ink/50">Shop chưa gửi phần giới thiệu.</p>
            )}
          </div>

          <aside className="space-y-6 md:col-span-5">
            <div className="border border-ink/12 p-5">
              <p className="label text-ink/45">Đang bán trên Tí</p>
              <p className="display mt-1 text-4xl normal-case text-brand">
                {products.length} sản phẩm
              </p>
              <p className="mt-2 text-[11px] text-ink/50">{PRICE_NOTE}</p>
            </div>

            <dl className="border-t border-ink/12">
              {[
                ["Khu vực", store.address || "—"],
                ["Email", store.email || "—"],
                ["Hình thức", store.address ? "Có xưởng/cửa hàng" : "Bán online"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-baseline justify-between gap-4 border-b border-ink/12 py-2.5"
                >
                  <dt className="label text-ink/45">{k}</dt>
                  <dd className="text-right text-xs font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>

            <button
              onClick={async () => {
                const uid = user?.uid || "guest_user";
                const next = await toggleFollowShop(uid, store.id);
                await refreshProfile();
                setFollowing(next.includes(store.id));
              }}
              className={`w-full rounded-full border px-5 py-3 text-xs font-semibold transition-colors ${
                following
                  ? "border-wave bg-wave text-ink"
                  : "border-ink/25 text-ink hover:border-brand hover:text-brand"
              }`}
            >
              {following ? "Đang theo dõi shop" : "Theo dõi shop"}
            </button>
          </aside>
        </div>

        {/* ── everything the shop has ─────────────────────────────────── */}
        <section className="space-y-6">
          <div className="flex items-baseline justify-between gap-4 border-b border-ink/12 pb-3">
            <h2 className="display text-2xl normal-case text-ink md:text-3xl">Sản phẩm của shop</h2>
            <span className="label shrink-0 text-ink/45">{products.length} món</span>
          </div>

          {products.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink/50">
              Shop chưa đăng sản phẩm nào lên Tí.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-4">
              {products.map((p) => (
                <div key={p.id}>
                  <ShopCard product={p} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Teal, mark two of two — and the last thing on the page before the
          rail. The two notes have to appear verbatim wherever they apply, so
          they may as well be the thing the second teal field is for. */}
      <div data-surface="light" className="bg-wave">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-10 md:px-10 md:py-14">
          <p className="max-w-[52ch] text-[13px] leading-relaxed text-ink/80">{NO_TRANSACTION}</p>
          <Link
            to="/products"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-ink px-5 py-3 text-xs font-semibold text-paper transition-colors hover:bg-brand"
          >
            Xem sản phẩm khác
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* ── docked contact rail — every width ───────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/20 bg-brand-deep/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3 md:px-10">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-white/70">{store.name}</p>
            <p className="text-sm font-semibold text-wave">
              {channels.length > 0 ? "Nhắn thẳng cho shop" : "Shop chưa khai báo kênh"}
            </p>
          </div>

          {channels.length > 0 ? (
            <div className="flex shrink-0 items-center gap-2">
              {channels.slice(0, 2).map((c) => (
                <button
                  key={c.platform}
                  onClick={() => openChannel(c.url)}
                  className="inline-flex items-center gap-2 border border-wave bg-wave px-4 py-3 text-xs font-semibold text-ink transition-colors hover:bg-paper md:px-6"
                >
                  {c.platform}
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          ) : (
            <Link
              to="/products"
              className="shrink-0 inline-flex items-center gap-2 border border-white/35 px-5 py-3 text-xs font-semibold text-paper"
            >
              Xem sản phẩm khác
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
