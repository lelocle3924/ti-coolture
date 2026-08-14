import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, X } from "lucide-react";
import {
  fetchProducts,
  fetchTouristRoutes,
  fetchCollections,
  fetchHiddenGems,
  triggerWebhook,
  incrementProductClick,
  type Collection,
} from "../lib/dbService";
import { Product, TouristRoute, RouteStop } from "../types";
import { WaveBottomExtended, RibbonLoop, ArcTopRight } from "../components/BrandShapes";
import FilmStrip from "../components/FilmStrip";

const formatPrice = (value: number) =>
  value > 0 ? `${value.toLocaleString("vi-VN")}₫` : "Liên hệ";

export default function Homepage() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [routes, setRoutes] = useState<TouristRoute[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [gems, setGems] = useState<Array<{ product: Product; note: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);
  const [isGemOpen, setIsGemOpen] = useState(false);

  const activeRoute = routes.find((r) => r.id === selectedRouteId);
  const gem = gems[0];

  const railProducts = useMemo(
    () => [...products].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 10),
    [products]
  );

  const loadData = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [approved, touristRoutes, cols, hiddenGems] = await Promise.all([
        fetchProducts("Approved", { throwOnError: true }),
        fetchTouristRoutes({ throwOnError: true }),
        fetchCollections(),
        fetchHiddenGems(),
      ]);
      setProducts(approved);
      setRoutes(touristRoutes);
      setCollections(cols);
      setGems(hiddenGems);
      if (touristRoutes.length > 0) {
        setSelectedRouteId(touristRoutes[0].id);
        setSelectedStop(touristRoutes[0].stops[0] ?? null);
      }
    } catch (err) {
      console.error("Error loading homepage data:", err);
      setLoadError(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="bg-brand text-paper">
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-brand">
        <div
          style={{ paddingBottom: "calc(18.2vw + 2.5rem)" }}
          className="relative z-10 mx-auto flex min-h-[70vh] max-w-7xl flex-col items-start justify-center px-5 pt-24 md:px-8 md:pt-32">
          <h1 className="m-0 max-w-4xl text-[clamp(1.75rem,5.2vw,3.5rem)] font-medium uppercase leading-tight tracking-[-0.025em] rise rise-1">
            Mỗi người một <span className="font-display text-wave normal-case">Tí</span> chất
            riêng.
          </h1>

          <p className="mt-6 max-w-xl text-base md:text-lg leading-relaxed text-white/88 rise rise-2">
            Nơi tuyển chọn local brand và artist Việt. Không phải nơi bán hàng — nơi tìm ra thứ đáng
            mua.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 rise rise-3">
            <a
              href="#kho"
              className="group inline-flex items-center gap-2 min-h-11 rounded-md bg-paper px-6 text-brand label transition-colors hover:bg-wave hover:text-ink"
            >
              Khám phá ngay
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </a>
            <Link
              to="/stores"
              className="inline-flex items-center min-h-11 rounded-md border border-white/50 px-6 label transition-colors hover:border-paper hover:bg-white/10"
            >
              Xem tất cả shop
            </Link>
          </div>
        </div>

        {/* Horizon group. The ribbon is a sibling *under* the curve, so where
            the two overlap the white always wins and no teal crosses it. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5]">
          <RibbonLoop
            className="absolute bottom-0 right-0 z-0 translate-x-[16%]"
            style={{ width: "clamp(14rem, 26vw, 26rem)" }}
            ribbon="var(--color-wave)"
            dot="var(--color-paper)"
          />
          <WaveBottomExtended className="relative z-10" fill="var(--color-paper)" />
        </div>
      </section>

      {/* ============ WHAT'S IN STORE ============ */}
      <section id="kho" className="bg-paper text-ink pb-16 pt-8 md:pb-24 md:pt-12 scroll-mt-20">
        <h2 className="display m-0 text-center text-[2rem] md:text-[2.5rem] leading-tight normal-case">
          Đang có trong kho
        </h2>

        {/* The strip: an infinitely looping reel of frames, paused on hover */}
        <div className="mt-8 md:mt-10">
          {loading ? (
            <div className="flex gap-4 overflow-hidden px-5 md:px-8" aria-busy="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-[210px] shrink-0 animate-pulse md:w-[240px]">
                  <div className="aspect-square rounded-sm bg-paper-warm" />
                  <div className="mt-3 h-3 w-2/5 bg-paper-warm" />
                  <div className="mt-2 h-4 w-4/5 bg-paper-warm" />
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="px-5 py-6 md:px-8">
              <p className="m-0 text-base font-medium">Không tải được danh sách.</p>
              <p className="mt-1 text-sm text-ink/60">Thử lại sau vài giây.</p>
              <button
                onClick={loadData}
                className="mt-4 inline-flex items-center min-h-11 rounded-md bg-brand px-6 text-paper label transition-colors hover:bg-brand-deep"
              >
                Thử lại
              </button>
            </div>
          ) : railProducts.length === 0 ? (
            <div className="px-5 py-6 md:px-8">
              <p className="m-0 text-base font-medium">Kho đang trống.</p>
              <p className="mt-1 text-sm text-ink/60">
                Chưa có sản phẩm nào được duyệt. Quay lại sau nhé.
              </p>
            </div>
          ) : (
            <FilmStrip products={railProducts} />
          )}
        </div>

        <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-4 px-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <p className="m-0 max-w-[42ch] text-[0.8125rem] leading-normal text-ink/60">
            Giá tham khảo · cập nhật 08/2026. Giá cuối do shop quyết định.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center justify-center min-h-11 rounded-md bg-brand px-6 text-paper label whitespace-nowrap transition-colors hover:bg-brand-deep"
          >
            Xem tất cả sản phẩm
          </Link>
        </div>
      </section>

      {/* ============ DISCOVERY ROUTE ============ */}
      <section id="lotrinh" className="relative overflow-hidden bg-brand-deep py-16 md:py-24 scroll-mt-20">
        <ArcTopRight
          className="pointer-events-none absolute -right-16 -top-16 z-0 opacity-25"
          style={{ width: "clamp(9rem, 22vw, 20rem)" }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-5 md:px-8">
          <p className="m-0 label text-wave">Lộ trình khám phá</p>
          <h2 className="mt-3 m-0 text-[1.75rem] md:text-[2rem] font-medium leading-tight">
            Hành trình khám phá
          </h2>
          <p className="mt-3 max-w-2xl text-sm md:text-base leading-relaxed text-white/88">
            Vài buổi đi bộ quanh thành phố, ghép từ những xưởng và cửa hiệu đáng ghé.
          </p>

          {loadError ? (
            <div className="mt-8">
              <p className="m-0 text-base font-medium">Không tải được lộ trình.</p>
              <button
                onClick={loadData}
                className="mt-4 inline-flex items-center min-h-11 rounded-md bg-paper px-6 text-brand label hover:bg-wave hover:text-ink transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : !loading && routes.length === 0 ? (
            <p className="mt-8 text-sm text-white/80">Tí đang dựng những tuyến đầu tiên.</p>
          ) : (
            <>
              <div className="mt-8 flex flex-wrap items-center gap-2">
                {routes.map((route, idx) => {
                  const isActive = selectedRouteId === route.id;
                  return (
                    <button
                      key={route.id}
                      onClick={() => {
                        setSelectedRouteId(route.id);
                        setSelectedStop(route.stops[0] ?? null);
                        triggerWebhook("TOURIST_ROUTE_SELECTED", {
                          routeId: route.id,
                          routeName: route.name,
                          stopCount: route.stops.length,
                        });
                      }}
                      aria-pressed={isActive}
                      className={`grid h-11 w-11 place-items-center rounded-md border text-sm tabular-nums transition-colors ${
                        isActive
                          ? "border-wave bg-wave text-ink"
                          : "border-white/30 text-paper hover:border-paper"
                      }`}
                      title={route.name}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
                {activeRoute?.description && (
                  <span className="ml-2 label text-white/80">{activeRoute.description}</span>
                )}
              </div>

              <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-12">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-white/22 bg-brand md:aspect-[16/10]">
                  <svg viewBox="0 0 320 240" aria-hidden="true" className="h-full w-full">
                    <path
                      d="M0 60h320M0 120h320M0 180h320M80 0v240M160 0v240M240 0v240"
                      stroke="var(--color-paper)"
                      strokeWidth="1"
                      opacity=".14"
                    />
                  </svg>

                  {activeRoute && activeRoute.stops.length > 1 && (
                    <svg
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 h-full w-full"
                    >
                      <polyline
                        points={activeRoute.stops.map((s) => `${s.x},${s.y}`).join(" ")}
                        fill="none"
                        stroke="var(--color-wave)"
                        strokeWidth="0.7"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  )}

                  {activeRoute?.stops.map((stop, idx) => {
                    const isSelected = selectedStop?.id === stop.id;
                    return (
                      <button
                        key={stop.id}
                        onClick={() => setSelectedStop(stop)}
                        aria-pressed={isSelected}
                        aria-label={`Điểm dừng ${idx + 1}: ${stop.name}`}
                        style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
                        className={`absolute grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-xs font-medium tabular-nums transition-colors ${
                          isSelected
                            ? "border-ink bg-wave text-ink"
                            : "border-wave bg-brand-deep text-wave hover:bg-wave hover:text-ink"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div>
                  <ol className="m-0 list-none p-0">
                    {activeRoute?.stops.map((stop, idx) => {
                      const isSelected = selectedStop?.id === stop.id;
                      return (
                        <li key={stop.id} className="border-b border-white/22">
                          <button
                            onClick={() => setSelectedStop(stop)}
                            className="group flex w-full items-start gap-3 py-4 text-left"
                          >
                            <span
                              className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs tabular-nums transition-colors ${
                                isSelected ? "border-wave bg-wave text-ink" : "border-wave text-wave"
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <span>
                              <span className="block text-base leading-tight transition-colors group-hover:text-wave">
                                {stop.name}
                              </span>
                              {isSelected && stop.address && (
                                <a
                                  href={
                                    stop.address.startsWith("http")
                                      ? stop.address
                                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.address)}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-1 inline-flex min-h-11 items-center gap-1 label text-wave hover:underline"
                                >
                                  Mở bản đồ
                                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                                </a>
                              )}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>

                  <Link
                    to="/stores"
                    className="mt-6 inline-flex items-center gap-2 min-h-11 label text-wave hover:underline"
                  >
                    Xem chi tiết lộ trình
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ============ COLLECTIONS ============ */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <h2 className="display m-0 text-center text-[2rem] md:text-[2.5rem] leading-tight normal-case">
            Bộ sưu tập
          </h2>

          <div className="mt-8 grid gap-4 md:mt-10 md:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection, idx) => (
              <Link
                key={collection.id}
                to="/products"
                className={`group relative overflow-hidden rounded-lg border border-white/20 transition-colors hover:border-wave ${
                  idx === 0 ? "lg:col-span-2 lg:row-span-2" : ""
                }`}
              >
                <div className={`overflow-hidden bg-paper-warm ${idx === 0 ? "aspect-[16/10]" : "aspect-[3/2]"}`}>
                  <img
                    src={collection.coverUrl}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-5">
                  <h3 className="m-0 text-lg font-medium leading-snug transition-colors group-hover:text-wave">
                    {collection.title}
                  </h3>
                  <p className="mt-1.5 m-0 text-sm leading-relaxed text-white/80">
                    {collection.description}
                  </p>
                  <p className="mt-3 m-0 label text-wave">{collection.productCount} sản phẩm</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HIDDEN GEMS ============ */}
      {gem && (
        <>
          <button
            onClick={() => {
              setIsGemOpen(true);
              triggerWebhook("CURATED_GEM_OPENED", { productId: gem.product.id });
            }}
            className={`fixed right-0 top-1/2 z-40 grid h-14 w-11 -translate-y-1/2 place-items-center rounded-l-lg bg-brand-deep/90 backdrop-blur-sm transition-transform hover:-translate-x-1 ${
              isGemOpen ? "hidden" : ""
            }`}
            aria-label="Viên ngọc ẩn — xem sản phẩm Tí chọn"
          >
            {/* four-point sparkle, breathing */}
            <svg viewBox="0 0 24 24" className="gem-star h-6 w-6" aria-hidden="true">
              <path fill="var(--color-paper)" d="M12.0,1.0L14.59,8.44L22.46,8.6L16.18,13.36L18.47,20.9L12.0,16.4L5.53,20.9L7.82,13.36L1.54,8.6L9.41,8.44Z" />
            </svg>
          </button>

          {isGemOpen && (
            <div className="gem-card fixed bottom-4 right-4 z-40 w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-paper text-ink shadow-[0_20px_60px_rgba(18,8,31,0.35)] md:bottom-8 md:right-8">
              <div className="relative aspect-[4/3] bg-paper-warm">
                <img
                  src={gem.product.images[0]}
                  alt={gem.product.name}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => setIsGemOpen(false)}
                  className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full bg-ink/55 text-paper backdrop-blur-sm transition-colors hover:bg-ink"
                  aria-label="Đóng"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={() => {
                  triggerWebhook("CURATED_GEM_CLICKED", { productId: gem.product.id });
                  navigate(`/products/${gem.product.id}`);
                }}
                className="block w-full p-5 text-left transition-colors hover:bg-paper-warm"
              >
                <span className="inline-flex items-center rounded-full bg-wave/25 px-3 py-1 text-xs font-medium text-wave-ink">
                  Cái này hay nè
                </span>
                <span className="mt-3 block text-lg font-medium leading-snug">
                  {gem.product.name}
                </span>
                <span className="mt-0.5 block text-sm text-ink/60">{gem.product.storeName}</span>
                <span className="mt-2 block text-base font-medium tabular-nums text-brand">
                  {formatPrice(gem.product.price)}
                </span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
