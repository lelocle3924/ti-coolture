import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Heart, MapPin, ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { fetchProductsStore, fetchStoreById } from "../lib/dbService";
import type { Product, StoreProfile } from "../types";
import { formatPrice, ContinuityLink } from "../lib/continuity";
import { ArcTopRight } from "../components/BrandShapes";
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
  { key: "instagram", label: "Instagram", primaryPrefix: "Nhắn qua" },
  { key: "tiktok", label: "TikTok", primaryPrefix: "Xem" },
  { key: "facebook", label: "Facebook", primaryPrefix: "Nhắn qua" },
  { key: "threads", label: "Threads", primaryPrefix: "Xem" },
] as const;

interface Channel {
  key: string;
  label: string;
  href: string;
  prefix: string;
}

function channelsOf(store: StoreProfile): Channel[] {
  return PLATFORMS.flatMap((platform) => {
    const url = store.socials?.[platform.key as keyof typeof store.socials];
    if (!url) return [];
    const base = url.startsWith("http") ? url : `https://${url}`;
    const href = `${base}${base.includes("?") ? "&" : "?"}utm_source=ticoolture&utm_medium=shop`;
    return [{ key: platform.key, label: platform.label, href, prefix: platform.primaryPrefix }];
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
function useParallaxCover(factor = 0.35) {
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
        const offset = rect.top * factor;
        img.style.transform = `translate3d(0, ${offset}px, 0) scale(1.12)`;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [factor]);

  return { containerRef, imgRef };
}

/** IntersectionObserver-based reveal: fade-up with stagger */
function useRevealOnScroll() {
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
              target.style.filter = "blur(0)";
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
  }, []);

  return containerRef;
}

/** Profile card entrance — slides up + fades in on mount */
function useCardEntrance() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }
    // Start hidden
    el.style.opacity = "0";
    el.style.transform = "translate3d(0, 28px, 0)";
    el.style.transition = "opacity 800ms cubic-bezier(0.32, 0.72, 0, 1), transform 800ms cubic-bezier(0.32, 0.72, 0, 1)";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.opacity = "1";
        el.style.transform = "translate3d(0, 0, 0)";
      });
    });
  }, []);

  return ref;
}

/** Đoạn văn mô tả xưởng (VỀ XƯỞNG) với nút xem thêm / thu gọn */
function ShopBio({ text }: { text: string }) {
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
function ShopProductCard({ product, index }: { key?: string; product: Product; index: number }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const primaryImg = product.images?.[0] || "";
  const hoverImg = product.images?.[1] || primaryImg;

  return (
    <div
      data-reveal
      data-reveal-delay={String(index * 80)}
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
              to={`/products/${product.id}`}
              imgRef={imageRef}
              className="block h-full w-full"
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
            <SaveButton
              product={product}
              revealOnHover
              className="absolute right-2.5 top-2.5 z-10"
            />
          </div>

          {/* Thông tin sản phẩm */}
          <div className="p-4 md:p-5 flex flex-1 flex-col justify-between space-y-2.5">
            <ContinuityLink
              product={product}
              to={`/products/${product.id}`}
              imgRef={imageRef}
              className="block"
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
                to={`/products/${product.id}`}
                imgRef={imageRef}
                className="hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-[#F1E9FF] text-[#7520F7] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-[#7520F7] group-hover:text-white group-hover:translate-x-[1px] group-hover:-translate-y-[1px] group-hover:scale-105"
                aria-label={`Xem chi tiết ${product.name}`}
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

export default function ShopDisplay() {
  const { storeId } = useParams<{ storeId: string }>();
  const { store, products, resolved } = useShopPage(storeId);
  const savedStores = useSavedStores();

  const [band, setBand] = useState("all");
  const [material, setMaterial] = useState("all");
  const [sort, setSort] = useState("newest");

  // Motion hooks
  const parallax = useParallaxCover(0.3);
  const cardEntranceRef = useCardEntrance();
  const productGridRef = useRevealOnScroll();

  const materials = useMemo(
    () =>
      Array.from(
        new Set<string>(products.map((p) => p.material).filter((m): m is string => !!m))
      ).sort((a, b) => a.localeCompare(b, "vi")),
    [products]
  );

  const bands = useMemo(
    () =>
      PRICE_BANDS.filter(
        (b) =>
          b.id === "all" ||
          products.some((p) => p.price >= (b.min ?? 0) && p.price <= (b.max ?? Infinity))
      ),
    [products]
  );

  const shown = useMemo(() => {
    const chosen = PRICE_BANDS.find((b) => b.id === band);
    return products
      .filter(
        (p) =>
          band === "all" ||
          !chosen ||
          (p.price >= (chosen.min ?? 0) && p.price <= (chosen.max ?? Infinity))
      )
      .filter((p) => material === "all" || p.material === material)
      .sort((a, b) =>
        sort === "price-asc" ? a.price - b.price : sort === "price-desc" ? b.price - a.price : 0
      );
  }, [products, band, material, sort]);

  const clearFilters = () => {
    setBand("all");
    setMaterial("all");
    setSort("newest");
  };

  const hasActiveFilter = band !== "all" || material !== "all" || sort !== "newest";

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

  const channels = channelsOf(store);
  const primaryChannel = channels[0];
  const secondaryChannel = channels[1];
  const otherChannels = channels.slice(2);
  const storyText =
    store.story || store.vibe || store.description || "Không gian sáng tạo và chế tác thủ công độc lập.";
  const mapQuery = store.address || store.area || `${store.name} Việt Nam`;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  return (
    <div className="min-h-[calc(100dvh+6rem)] md:min-h-[calc(100dvh+7rem)] -mt-24 md:-mt-28 bg-white text-ink relative overflow-x-hidden w-full pb-28 md:pb-36">

      {/* =========================================================================
          1. DẢI TÍM ĐẦU TRANG (PURPLE HEADER BAND)
          Parallax cover image — depth illusion.
          ========================================================================= */}
      <section
        data-surface="dark"
        className="relative z-10 bg-[#7520F7] text-paper pt-[104px] md:pt-[128px] pb-[160px] md:pb-[210px] overflow-hidden"
        style={{
          borderRadius: "0 0 50% 50% / 0 0 clamp(48px, 8vw, 100px)",
        }}
      >
        {/* Subtle ambient arc — brand accent without clutter */}
        <ArcTopRight
          className="pointer-events-none absolute -left-12 -top-12 z-0 opacity-[0.08] rotate-180"
          style={{ width: "clamp(12rem, 24vw, 20rem)" }}
          fill="#39D6CF"
        />

        {/* Ambient gradient orbs for depth — no ribbon loops */}
        <div
          className="pointer-events-none absolute z-0"
          style={{
            top: "-10%",
            right: "-5%",
            width: "clamp(20rem, 40vw, 36rem)",
            height: "clamp(20rem, 40vw, 36rem)",
            background: "radial-gradient(circle, rgba(57,214,207,0.12) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
          aria-hidden="true"
        />

        {/* Khung chứa ảnh bìa (Cover Image) — parallax enabled */}
        <div className="relative z-10 max-w-[1360px] mx-auto px-5 md:px-8">
          <div
            ref={parallax.containerRef}
            className="overflow-hidden rounded-[22px] md:rounded-[28px] h-[200px] md:h-[320px] w-full bg-[#5a12c6] shadow-[0_8px_32px_rgba(0,0,0,0.15)] relative"
          >
            {store.coverUrl ? (
              <img
                ref={parallax.imgRef}
                src={store.coverUrl}
                alt={`Ảnh bìa của ${store.name}`}
                className="h-[130%] w-full object-cover will-change-transform"
                style={{ transform: "translate3d(0, 0, 0) scale(1.12)" }}
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[#7520F7] to-[#5a12c6] flex items-center justify-center opacity-90">
                <span className="font-display text-4xl text-white/30 uppercase">{store.name}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. BỐ CỤC CHÍNH (THẺ HỒ SƠ TRÁI + LƯỚI SẢN PHẨM PHẢI)
          Profile card with entrance animation.
          ========================================================================= */}
      <div className="relative z-20 max-w-[1360px] mx-auto px-5 md:px-8 -mt-[96px] md:-mt-[210px]">
        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-12">

          {/* ──────────────────────────────────────────────────────────────────
              CỘT TRÁI: THẺ HỒ SƠ SHOP (PROFILE CARD)
              Entrance animation: slide-up + fade-in.
              Double-bezel card structure for premium depth.
              ────────────────────────────────────────────────────────────────── */}
          <aside className="w-full lg:w-[380px] shrink-0 lg:sticky lg:top-24 z-20">
            {/* Double-bezel outer shell */}
            <div
              ref={cardEntranceRef}
              className="rounded-[26px] md:rounded-[30px] bg-[#F7F4FB]/50 p-[3px] ring-1 ring-[#ECE6F5]"
            >
              {/* Inner core */}
              <div className="rounded-[24px] md:rounded-[28px] bg-white p-6 md:p-8 shadow-[0_20px_56px_-16px_rgba(60,20,120,0.12),inset_0_1px_1px_rgba(255,255,255,0.6)] relative flex flex-col">

                {/* Avatar tròn viền teal nhô lên trên thẻ */}
                <div className="relative self-start -mt-[72px] md:-mt-[88px] mb-3">
                  <div className="w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-full overflow-hidden border-[5px] md:border-[6px] border-[#39D6CF] bg-white shadow-[0_6px_20px_rgba(57,214,207,0.2)]">
                    {store.logoUrl ? (
                      <img
                        src={store.logoUrl}
                        alt={store.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-paper-warm grid place-items-center text-brand font-bold text-2xl">
                        {store.name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tên shop */}
                <h1 className="font-display uppercase text-[42px] md:text-[50px] leading-[0.9] text-[#7520F7] tracking-normal pt-1">
                  {store.name}
                </h1>

                {/* Tagline */}
                {store.vibe && (
                  <p className="font-sans italic text-[15px] md:text-[17px] leading-snug text-[#2C2538] mt-3">
                    &ldquo;{store.vibe}&rdquo;
                  </p>
                )}

                {/* Địa điểm / Khu vực & link Mở bản đồ */}
                <div className="flex items-center justify-between gap-2 mt-4 text-xs text-[#5B4F6E] flex-wrap">
                  <span className="flex items-center gap-1.5 font-semibold text-[#17121F]">
                    <MapPin className="h-3.5 w-3.5 text-[#7520F7]" />
                    {store.address || store.area || "Việt Nam"}
                  </span>
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-[#7520F7] font-semibold hover:underline"
                  >
                    <span>Mở bản đồ</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>

                {/* Divider */}
                <div className="my-5 border-t border-[#ECE6F5]" />

                {/* Nút lưu shop (Wishlist) */}
                <button
                  type="button"
                  onClick={() => savedStores.toggle(store.id)}
                  aria-label={savedStores.has(store.id) ? `Bỏ lưu ${store.name}` : `Lưu ${store.name}`}
                  className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] ${
                    savedStores.has(store.id)
                      ? "bg-[#39D6CF] text-[#17121F] shadow-[0_4px_14px_rgba(57,214,207,0.25)] font-bold"
                      : "bg-[#F7F4FB] text-[#17121F] ring-1 ring-[#ECE6F5] hover:ring-[#7520F7] hover:text-[#7520F7]"
                  }`}
                >
                  <Heart
                    className={`h-3.5 w-3.5 ${
                      savedStores.has(store.id) ? "fill-[#17121F] stroke-[#17121F]" : "stroke-current"
                    }`}
                  />
                  <span>{savedStores.has(store.id) ? "Đã lưu shop vào mục yêu thích" : "Lưu shop"}</span>
                </button>

                {/* Nhóm nút liên hệ (Actions) */}
                <div className="mt-5 space-y-2.5">
                  {primaryChannel ? (
                    <a
                      href={primaryChannel.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-[48px] md:h-[52px] w-full rounded-full bg-[#7520F7] text-white font-bold text-sm md:text-base flex items-center justify-center gap-2.5 shadow-[0_6px_20px_-4px_rgba(117,32,247,0.35)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#5a12c6] hover:shadow-[0_10px_28px_-4px_rgba(117,32,247,0.45)] active:scale-[0.98]"
                    >
                      <PlatformGlyph platform={primaryChannel.key} className="h-5 w-5 text-white" />
                      <span>{primaryChannel.prefix} {primaryChannel.label}</span>
                    </a>
                  ) : (
                    <a
                      href={`mailto:${store.email || "creativespace.ticoolture@gmail.com"}`}
                      className="h-[48px] md:h-[52px] w-full rounded-full bg-[#7520F7] text-white font-bold text-sm md:text-base flex items-center justify-center gap-2 shadow-[0_6px_20px_-4px_rgba(117,32,247,0.35)]"
                    >
                      <span>Liên hệ shop</span>
                    </a>
                  )}

                  {secondaryChannel && (
                    <a
                      href={secondaryChannel.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-[48px] md:h-[52px] w-full rounded-full bg-[#39D6CF] text-[#17121F] font-bold text-sm md:text-base flex items-center justify-center gap-2.5 shadow-[0_6px_20px_-4px_rgba(57,214,207,0.3)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#2fc4bd] hover:shadow-[0_10px_28px_-4px_rgba(57,214,207,0.4)] active:scale-[0.98]"
                    >
                      <PlatformGlyph platform={secondaryChannel.key} className="h-5 w-5 text-[#17121F]" />
                      <span>{secondaryChannel.prefix} {secondaryChannel.label}</span>
                    </a>
                  )}
                </div>

                {/* Các kênh mạng xã hội phụ khác */}
                {otherChannels.length > 0 && (
                  <div className="flex items-center gap-2.5 pt-4 justify-center">
                    {otherChannels.map((c) => (
                      <a
                        key={c.key}
                        href={c.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${c.label} của ${store.name}`}
                        className="h-10 w-10 rounded-full bg-[#F7F4FB] ring-1 ring-[#ECE6F5] text-[#7520F7] grid place-items-center hover:bg-[#7520F7] hover:text-white hover:ring-[#7520F7] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                      >
                        <PlatformGlyph platform={c.key} className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Mục VỀ XƯỞNG */}
                <div className="mt-6 pt-5 border-t border-[#ECE6F5]">
                  <h2 className="font-bold text-[12px] tracking-[0.16em] text-[#6B6478] uppercase">
                    VỀ XƯỞNG
                  </h2>
                  <div className="mt-3">
                    <ShopBio text={storyText} />
                  </div>
                </div>

                {/* Ô ghi chú giá tham khảo */}
                <div className="mt-5 rounded-2xl bg-[#F7F4FB] ring-1 ring-[#ECE6F5] p-4">
                  <p className="text-[12px] leading-relaxed text-[#5B4F6E]">
                    Giá tham khảo, giá cuối do shop quyết định. Tí Coolture không bán hàng và không xử lý giao dịch.
                  </p>
                </div>

              </div>
            </div>
          </aside>

          {/* ──────────────────────────────────────────────────────────────────
              CỘT PHẢI: LƯỚI SẢN PHẨM (PRODUCT GRID & TOOLBAR)
              Staggered reveal animation on product cards.
              ────────────────────────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0 pt-8 lg:pt-[234px] relative">

            {/* Toolbar: Số lượng sản phẩm + Dropdown Bộ lọc */}
            <div className="relative z-10 flex items-center justify-between pb-5 flex-wrap gap-4 border-b border-[#ECE6F5]/70">
              <div className="flex items-baseline gap-3">
                <h2 className="font-bold text-[24px] md:text-[28px] text-[#7520F7] leading-none">
                  {shown.length}
                </h2>
                <span className="text-[15px] md:text-[17px] font-medium text-[#5B4F6E]">
                  sản phẩm
                </span>
              </div>

              {products.length > 0 && (
                <div className="flex flex-wrap items-center justify-end gap-2.5">
                  <Dropdown
                    label="Giá"
                    value={band}
                    options={bands.map((b) => ({ id: b.id, label: b.label }))}
                    onChange={setBand}
                  />
                  {materials.length > 0 && (
                    <Dropdown
                      label="Chất liệu"
                      value={material}
                      options={[
                        { id: "all", label: "Tất cả" },
                        ...materials.map((m) => ({ id: m, label: m })),
                      ]}
                      onChange={setMaterial}
                    />
                  )}
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
              )}
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
                    <ShopProductCard key={product.id} product={product} index={i} />
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
