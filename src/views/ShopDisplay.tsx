import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Heart, MapPin, ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { fetchProductsStore, fetchStoreById } from "../lib/dbService";
import type { Product, StoreProfile } from "../types";
import { formatPrice, ContinuityLink } from "../lib/continuity";
import { useSavedStores } from "../lib/useSavedStores";
import PlatformGlyph from "../components/PlatformGlyph";
import SaveButton from "../components/SaveButton";
import { Dropdown, PRICE_BANDS, SORTS } from "./Products";
import "./shop.css";

/* ---------------------------------------------------------------------------
   Trang Shop — /stores/:storeId (Redesign v3 — Motion)
   High-end parallax cover, staggered product reveal, no ribbon loops.
   --------------------------------------------------------------------------- */

const PLATFORMS = [
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "facebook", label: "Facebook" },
  { key: "threads", label: "Threads" },
] as const;

interface Channel {
  key: string;
  label: string;
  href: string;
}

function channelsOf(store: StoreProfile): Channel[] {
  return PLATFORMS.flatMap((platform) => {
    const url = store.socials?.[platform.key as keyof typeof store.socials];
    if (!url) return [];
    const base = url.startsWith("http") ? url : `https://${url}`;
    const href = `${base}${base.includes("?") ? "&" : "?"}utm_source=ticoolture&utm_medium=shop`;
    return [{ key: platform.key, label: platform.label, href }];
  });
}

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

/* ---------------------------------------------------------------------------
   Motion hooks — GPU-safe, transform + opacity only
   --------------------------------------------------------------------------- */

/** Parallax: cover image shifts slower than scroll for depth */
function useParallaxCover(factor = 0.22) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const ticking = useRef(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        ticking.current = false;
        const el = containerRef.current;
        const img = imgRef.current;
        if (!el || !img) return;
        const rect = el.getBoundingClientRect();
        // Only apply when visible
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        // Bound travel so oversized image never detaches from container edges
        const maxTravel = el.clientHeight * 0.16;
        const offset = Math.max(-maxTravel, Math.min(maxTravel, rect.top * factor));
        img.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(1.04)`;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [factor]);

  return { containerRef, imgRef };
}

/** IntersectionObserver-based reveal: fade-up with stagger */
function useRevealOnScroll(items: Product[]) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = containerRef.current;
    if (!el || prefersReduced) {
      // Instantly show everything
      if (el) {
        const children = el.querySelectorAll("[data-reveal]");
        children.forEach((child) => {
          (child as HTMLElement).style.opacity = "1";
          (child as HTMLElement).style.transform = "none";
        });
      }
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            const stagger = parseInt(target.dataset.revealDelay || "0", 10);
            setTimeout(() => {
              target.style.opacity = "1";
              target.style.transform = "translate3d(0, 0, 0)";
            }, stagger);
            observer.unobserve(target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    const children = el.querySelectorAll("[data-reveal]");
    children.forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, [items]);

  return containerRef;
}

/** Đoạn văn mô tả shop (VỀ SHOP) với nút xem thêm / thu gọn */
export function ShopBio({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const pRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const el = pRef.current;
    if (!el || open) return;
    setIsClamped(el.scrollHeight > el.clientHeight + 4);
  }, [text, open]);

  return (
    <div className="space-y-1.5">
      <p
        ref={pRef}
        className={`text-[14px] leading-[1.75] text-[#2C2538] text-justify transition-all duration-300 ${
          open ? "" : "line-clamp-4"
        }`}
      >
        {text}
      </p>
      {isClamped && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-xs font-semibold text-[#7520F7] hover:underline cursor-pointer"
        >
          {open ? "Thu gọn ⌃" : "Xem thêm ⌄"}
        </button>
      )}
    </div>
  );
}

/** Thẻ sản phẩm — v3 with reveal-ready data attributes */
export function ShopProductCard({
  product,
  index,
  isPreview = false,
}: {
  key?: string;
  product: Product;
  index: number;
  isPreview?: boolean;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const primaryImg = product.images?.[0] || "";
  const hoverImg = product.images?.[1] || primaryImg;

  const handleLinkClick = (e: React.MouseEvent) => {
    if (isPreview) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div
      data-reveal
      data-reveal-delay={String(index * 50)}
      className="shop-card-reveal group flex flex-col"
    >
      {/* Double-bezel outer shell */}
      <div className="rounded-[22px] md:rounded-[26px] bg-[#F7F4FB]/60 p-[3px] ring-1 ring-[#ECE6F5] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:ring-[#7520F7]/30 group-hover:shadow-[0_20px_44px_-12px_rgba(60,20,120,0.12)]">
        {/* Inner core */}
        <div className="rounded-[20px] md:rounded-[24px] bg-white overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] flex flex-col">
          {/* Khung ảnh — 4:5 ratio */}
          <div className="relative overflow-hidden bg-paper-warm" style={{ aspectRatio: "4/5" }}>
            <ContinuityLink
              product={product}
              to={isPreview ? "#" : `/products/${product.id}`}
              imgRef={imageRef}
              className="block h-full w-full"
              onClick={handleLinkClick}
            >
              <img
                ref={imageRef}
                src={primaryImg}
                alt={product.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.06]"
              />
              {hoverImg !== primaryImg && (
                <img
                  src={hoverImg}
                  alt={`${product.name} góc khác`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-600 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:opacity-100"
                />
              )}

              {/* Nhãn category */}
              <span className="hidden md:inline-flex absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-0.5 text-[11px] font-semibold text-[#17121F] shadow-[0_2px_8px_rgba(0,0,0,0.06)] backdrop-blur-xs">
                {product.category || "Thủ công"}
              </span>
            </ContinuityLink>

            {/* Nút tim */}
            {!isPreview && (
              <SaveButton
                product={product}
                revealOnHover
                className="absolute right-2.5 top-2.5 z-10"
              />
            )}
          </div>

          {/* Thông tin sản phẩm */}
          <div className="p-4 md:p-5 flex flex-1 flex-col justify-between space-y-2.5">
            <ContinuityLink
              product={product}
              to={isPreview ? "#" : `/products/${product.id}`}
              imgRef={imageRef}
              className="block"
              onClick={handleLinkClick}
            >
              <h3 className="line-clamp-2 text-[14px] md:text-[15px] font-semibold leading-[1.4] text-[#17121F] group-hover:text-[#7520F7] transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                {product.name}
              </h3>
            </ContinuityLink>

            <div className="flex items-center justify-between pt-1.5 border-t border-ink/5">
              <span className="text-[15px] md:text-[17px] font-extrabold text-[#17121F]">
                {formatPrice(product.price)}
              </span>

              <ContinuityLink
                product={product}
                to={isPreview ? "#" : `/products/${product.id}`}
                imgRef={imageRef}
                className="hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-[#F1E9FF] text-[#7520F7] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-[#7520F7] group-hover:text-white group-hover:translate-x-[1px] group-hover:-translate-y-[1px] group-hover:scale-105"
                aria-label={`Xem chi tiết ${product.name}`}
                onClick={handleLinkClick}
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </ContinuityLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface ShopViewProps {
  store: StoreProfile;
  products: Product[];
  isPreview?: boolean;
}

export function ShopView({ store, products, isPreview = false }: ShopViewProps) {
  const savedStores = useSavedStores();

  const [band, setBand] = useState("all");
  const [sort, setSort] = useState("newest");

  // Motion hooks
  const parallax = useParallaxCover(0.22);

  const shown = useMemo(() => {
    const chosen = PRICE_BANDS.find((b) => b.id === band);
    return products
      .filter(
        (p) =>
          band === "all" ||
          !chosen ||
          (p.price >= (chosen.min ?? 0) && p.price <= (chosen.max ?? Infinity))
      )
      .sort((a, b) =>
        sort === "price-asc" ? a.price - b.price : sort === "price-desc" ? b.price - a.price : 0
      );
  }, [products, band, sort]);

  const productGridRef = useRevealOnScroll(shown);

  const clearFilters = () => {
    setBand("all");
    setSort("newest");
  };

  const hasActiveFilter = band !== "all" || sort !== "newest";

  const channels = channelsOf(store);
  const storyText =
    store.story || store.vibe || store.description || "Không gian sáng tạo và chế tác thủ công độc lập.";
  const mapQuery = store.address || store.area || `${store.name} Việt Nam`;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  return (
    <div
      className={`min-h-[calc(100dvh+6rem)] md:min-h-[calc(100dvh+7rem)] bg-white text-ink relative overflow-x-clip w-full pb-28 md:pb-36 ${
        isPreview ? "pt-0 -mt-0" : "-mt-24 md:-mt-28"
      }`}
    >
      <section data-surface="dark" className={`shop-hero ${isPreview ? "pt-4 md:pt-6" : ""}`}>
        <div className="shop-hero__container">
          <div ref={parallax.containerRef} className="shop-hero__media" aria-hidden="true">
            {store.coverUrl ? (
              <img
                ref={parallax.imgRef}
                src={store.coverUrl}
                alt=""
                className="shop-hero__image"
                style={{ transform: "translate3d(0, 0, 0) scale(1.04)" }}
              />
            ) : (
              <div className="shop-hero__fallback">
                <span className="font-sans">{store.name}</span>
              </div>
            )}
            <div className="shop-hero__veil" aria-hidden="true" />
          </div>
        </div>
      </section>

      <div className="shop-content">
        <div className="shop-content__layout">
          <aside className="shop-profile-sticky">
            <div className="shop-profile-card">
              <div className="shop-profile-avatar">
                {store.logoUrl ? (
                  <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover" />
                ) : (
                  <span aria-hidden="true">{store.name.charAt(0)}</span>
                )}
              </div>

              <h1 className="mt-5 font-sans uppercase text-[42px] md:text-[50px] leading-[0.95] text-brand tracking-normal">
                {store.name}
              </h1>

              {store.vibe && (
                <p className="mt-3 font-sans text-[15px] md:text-[17px] italic leading-snug text-ink">
                  &ldquo;{store.vibe}&rdquo;
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#5B4F6E]">
                <span className="flex items-center gap-1.5 font-semibold text-ink">
                  <MapPin className="h-3.5 w-3.5 text-brand" />
                  {store.address || store.area || "Việt Nam"}
                </span>
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 font-semibold text-brand hover:underline"
                  onClick={(e) => {
                    if (isPreview) e.preventDefault();
                  }}
                >
                  <span>Mở bản đồ</span>
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>

              <div className="my-5 border-t border-[#ECE6F5]" />

              <button
                type="button"
                onClick={() => {
                  if (!isPreview) savedStores.toggle(store.id);
                }}
                aria-label={savedStores.has(store.id) ? `Bỏ lưu ${store.name}` : `Lưu ${store.name}`}
                className={`mt-5 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold cursor-pointer transition-[background-color,color,border-color,box-shadow] duration-200 ease-out active:scale-[0.97] ${
                  savedStores.has(store.id)
                    ? "bg-wave text-ink shadow-[0_4px_14px_rgba(57,214,207,0.25)] font-bold"
                    : "bg-paper-warm text-ink ring-1 ring-[#ECE6F5] hover:ring-brand hover:text-brand"
                }`}
              >
                <Heart
                  className={`h-3.5 w-3.5 ${
                    savedStores.has(store.id) ? "fill-ink stroke-ink" : "stroke-current"
                  }`}
                />
                <span>{savedStores.has(store.id) ? "Đã lưu shop vào mục yêu thích" : "Lưu shop"}</span>
              </button>

              {channels.length > 0 ? (
                <div className="mt-6">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#6B6478]">
                    Kết nối với shop
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {channels.map((channel) => (
                      <a
                        key={channel.key}
                        href={channel.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${channel.label} của ${store.name}`}
                        className="shop-social-link"
                        onClick={(e) => {
                          if (isPreview) e.preventDefault();
                        }}
                      >
                        <PlatformGlyph platform={channel.key} className="h-[18px] w-[18px]" />
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <a
                  href={`mailto:${store.email || "creativespace.ticoolture@gmail.com"}`}
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wave"
                  onClick={(e) => {
                    if (isPreview) e.preventDefault();
                  }}
                >
                  <span>Liên hệ shop</span>
                </a>
              )}

              <div className="shop-profile-story mt-6 border-t border-[#ECE6F5] pt-5">
                <h2 className="font-bold text-[12px] tracking-[0.16em] text-[#6B6478] uppercase">
                  VỀ SHOP
                </h2>
                <div className="mt-3">
                  <ShopBio text={storyText} />
                </div>
              </div>

              <div className="shop-profile-note border-t border-[#ECE6F5]">
                <p className="text-[12px] leading-relaxed text-[#5B4F6E]">
                  Giá tham khảo, giá cuối do shop quyết định. Tí Coolture không bán hàng và không xử lý giao dịch.
                </p>
              </div>
            </div>
          </aside>

          <main className="shop-product-column relative">

            {/* Toolbar: Số lượng sản phẩm + Dropdown Bộ lọc */}
            <div className="relative z-20 flex items-center justify-between pb-5 flex-wrap gap-4 border-b border-[#ECE6F5]/70">
              <div className="flex items-baseline gap-3">
                <h2 className="font-bold text-[24px] md:text-[28px] text-[#7520F7] leading-none">
                  {shown.length}
                </h2>
                <span className="text-[15px] md:text-[17px] font-medium text-[#5B4F6E]">
                  sản phẩm
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2.5">
                <Dropdown
                  label="Giá"
                  value={band}
                  options={PRICE_BANDS.map((b) => ({ id: b.id, label: b.label }))}
                  onChange={setBand}
                />
                <Dropdown label="Sắp xếp" value={sort} options={SORTS} onChange={setSort} />

                {hasActiveFilter && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs font-semibold text-[#7520F7] hover:underline underline-offset-2 cursor-pointer flex items-center gap-1 ml-1 transition-colors duration-300"
                  >
                    <SlidersHorizontal className="h-3 w-3" />
                    Xoá lọc
                  </button>
                )}
              </div>
            </div>

            {/* Danh sách sản phẩm — staggered reveal */}
            <div ref={productGridRef} className="relative mt-7">
              {products.length === 0 ? (
                <div className="relative z-10 py-20 text-center rounded-[24px] border border-dashed border-[#ECE6F5] bg-[#F7F4FB]/50 p-10">
                  <p className="text-sm font-medium text-[#5B4F6E]">
                    Shop chưa đăng sản phẩm nào lên Tí.
                  </p>
                </div>
              ) : shown.length === 0 ? (
                <div className="relative z-10 py-16 text-center rounded-[24px] ring-1 ring-[#ECE6F5] bg-white p-10 space-y-3">
                  <p className="text-sm text-[#5B4F6E]">Không có món nào khớp với bộ lọc này.</p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-5 py-2 rounded-full bg-[#7520F7] text-white text-xs font-semibold hover:bg-brand-deep transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer active:scale-[0.97]"
                  >
                    Xoá bộ lọc
                  </button>
                </div>
              ) : (
                <div className="relative z-10 grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-7">
                  {shown.map((product, i) => (
                    <ShopProductCard key={product.id} product={product} index={i} isPreview={isPreview} />
                  ))}
                </div>
              )}
            </div>

          </main>

        </div>
      </div>
    </div>
  );
}

export default function ShopDisplay() {
  const { storeId } = useParams<{ storeId: string }>();
  const { store, products, resolved } = useShopPage(storeId);

  if (!store) {
    return resolved ? (
      <div
        data-surface="dark"
        className="-mt-24 grid min-h-[calc(100dvh+6rem)] place-items-center bg-[#7520F7] px-6 pt-24 text-center text-paper md:-mt-28 md:min-h-[calc(100dvh+7rem)] md:pt-28"
      >
        <div className="space-y-4">
          <h1 className="display text-3xl normal-case font-medium">Không tìm thấy shop</h1>
          <Link
            to="/stores"
            className="inline-block rounded-full bg-paper px-6 py-2.5 text-xs font-semibold text-ink shadow-sm hover:scale-105 transition-transform"
          >
            Về danh bạ shop
          </Link>
        </div>
      </div>
    ) : (
      <div data-surface="dark" className="-mt-24 min-h-[calc(100dvh+6rem)] bg-[#7520F7] md:-mt-28 md:min-h-[calc(100dvh+7rem)]" />
    );
  }

  return <ShopView store={store} products={products} />;
}
