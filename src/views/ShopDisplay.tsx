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
 * Team direction (26/08): the "MỞ RA" layout explored as product-page
 * direction 2 is right, but not for a product — it belongs here. So this page
 * takes it: the cover opens full-bleed with the shop's name set over it, the
 * story and the details are read underneath, and a rail stays docked at the
 * bottom at every width with the shop's own channel in it.
 *
 * It suits a shop better than a product for a simple reason: a shop cover is
 * shot landscape (21:9 desktop / 3:2 mobile per UX-TASKS 6.1), which is the
 * ratio that layout wants. A product photograph is square, and forcing it to
 * 21:9 cropped the top and bottom off the piece.
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
        <div className="relative aspect-square overflow-hidden rounded-[1.25rem] bg-white/10">
          <img
            ref={ref}
            src={product.images?.[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <h3 className="pt-2.5 text-sm leading-snug text-paper transition-colors group-hover:text-wave">
          {product.name}
        </h3>
        <p className="pt-0.5 text-sm font-semibold text-wave">{formatPrice(product.price)}</p>
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
       clears the floating nav pill with pt-24, and a page whose first element
       is a photograph has to give that back or the pill sits on a strip of the
       shell's own ink — the black bar above the cover in the 07/09 feedback.
       The cover runs to y=0 now and the pill floats on the photograph, which
       is what it is built to do. */
    <div className="min-h-[100dvh] -mt-24 bg-brand pb-24 text-paper md:-mt-28">
      {/* ── the opening frame ─────────────────────────────────────────── */}
      <header className="relative" data-surface="dark">
        {/* 5:4 on phones rather than the 3:2 of UX-TASKS 6.1. That spec was
            written when a black band held the nav and the whole cover was
            free; with the pill and the back link now floating on the
            photograph, 3:2 leaves 260px at 390 wide and the shop name lands
            6px under the back link — it fits today and breaks on the first
            name that wraps. 5:4 buys 52px and costs 17% of the source's
            width, which is the cheapest crop that makes the frame breathe.
            Desktop is untouched: 21:9 is tall enough to carry both. */}
        <div className="relative aspect-[5/4] w-full overflow-hidden bg-brand-deep md:aspect-[21/9]">
          <img
            src={store.coverUrl}
            alt={`Ảnh bìa của ${store.name}`}
            className="h-full w-full object-cover"
          />

          {/* Colour, per the same note. The scrim used to be three stops of
              near-black over the whole frame, which left every cover reading
              as a muddy grey plate with no relation to the violet page under
              it — and the team have already ruled black grounds out once
              (26/08, the district map).

              So the scrim is the palette's own deep violet, and it resolves to
              exactly --color-brand at the bottom edge: the photograph does not
              stop at a hard line, it becomes the page. Above 55% it is gone
              altogether, so the top half of the cover is a photograph again.

              Two layers rather than one because they do different jobs — the
              lower one carries the name, the short upper one gives the nav
              pill something to sit on over a bright cover. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, var(--color-brand) 0%, color-mix(in srgb, var(--color-brand-deep) 78%, transparent) 26%, transparent 55%)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-brand-deep/55 to-transparent"
          />

          <div className="absolute inset-x-0 bottom-0 p-5 pb-7 md:p-10 md:pb-12">
            <div className="mx-auto flex max-w-6xl items-end gap-4">
              {store.logoUrl && (
                <img
                  src={store.logoUrl}
                  alt=""
                  className="hidden h-16 w-16 shrink-0 rounded-2xl border border-white/25 object-cover sm:block"
                />
              )}
              <div className="min-w-0 space-y-2">
                <p className="label text-wave">{store.address || "Việt Nam"}</p>
                <h1 className="display max-w-3xl text-4xl leading-[1.05] normal-case md:text-6xl">
                  {store.name}
                </h1>
                {store.vibe && (
                  <p className="max-w-2xl text-sm text-white/80 md:text-base">{store.vibe}</p>
                )}
              </div>
            </div>
          </div>

          {/* Below the pill, not beside it: the cover starts at y=0 now, so
              top-5 would put this under the nav. */}
          <Link
            to="/stores"
            className="absolute left-5 top-24 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-brand-deep/45 px-3 py-1.5 text-[11px] text-paper backdrop-blur-md transition-colors hover:border-wave hover:bg-brand-deep/70 hover:text-wave md:left-10 md:top-28"
          >
            <ArrowLeft className="h-3 w-3" /> Danh bạ shop
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-14 px-5 py-12 md:px-10">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="space-y-6 md:col-span-7">
            <nav className="flex flex-wrap items-center gap-1.5 text-[11px] text-white/60">
              <Link to="/" className="hover:text-wave">
                Trang chủ
              </Link>
              <span>›</span>
              <Link to="/stores" className="hover:text-wave">
                Shop
              </Link>
              <span>›</span>
              <span className="text-white/80">{store.name}</span>
            </nav>

            {store.story ? (
              <>
                <h2 className="label text-white/55">Câu chuyện của xưởng</h2>
                <Clamp
                  text={store.story}
                  lines={6}
                  tone="paper"
                  className="text-base leading-relaxed text-white/85"
                />
              </>
            ) : (
              <p className="text-sm text-white/55">Shop chưa gửi phần giới thiệu.</p>
            )}
          </div>

          <aside className="space-y-6 md:col-span-5">
            <div className="border border-white/20 p-5">
              <p className="label text-white/55">Đang bán trên Tí</p>
              <p className="display mt-1 text-4xl normal-case text-wave">
                {products.length} sản phẩm
              </p>
              <p className="mt-2 text-[11px] text-white/60">{PRICE_NOTE}</p>
            </div>

            <dl className="border-t border-white/15">
              {[
                ["Khu vực", store.address || "—"],
                ["Email", store.email || "—"],
                ["Hình thức", store.address ? "Có xưởng/cửa hàng" : "Bán online"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-baseline justify-between gap-4 border-b border-white/15 py-2.5"
                >
                  <dt className="label text-white/55">{k}</dt>
                  <dd className="text-right text-xs font-medium">{v}</dd>
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
                  : "border-white/35 text-paper hover:border-wave hover:text-wave"
              }`}
            >
              {following ? "Đang theo dõi shop" : "Theo dõi shop"}
            </button>
          </aside>
        </div>

        {/* ── everything the shop has ─────────────────────────────────── */}
        <section className="space-y-6">
          <div className="flex items-baseline justify-between gap-4 border-b border-white/15 pb-3">
            <h2 className="display text-2xl normal-case md:text-3xl">Sản phẩm của shop</h2>
            <span className="label shrink-0 text-white/50">{products.length} món</span>
          </div>

          {products.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/55">
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

        <p className="text-[11px] text-white/50">{NO_TRANSACTION}</p>
      </main>

      {/* ── docked contact rail — every width ───────────────────────────── */}
      {/* The rail was a second black bar under the first (bg-ink/90). It is
          the palette's deep violet now, so the page has one colour family from
          the cover down to the bottom edge. */}
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
