import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, X, Sparkles, Compass, Store, Heart, Check, StarHalf, StarIcon } from "lucide-react";
import {
  fetchProducts,
  fetchTouristRoutes,
  fetchCollections,
  fetchHiddenGems,
  triggerWebhook,
  type Collection,
} from "../lib/dbService";
import { Product, TouristRoute, RouteStop } from "../types";
import { RibbonLoop, ContinuousWave, PaperBackgroundExtender } from "../components/BrandShapes";
import FilmStrip from "../components/FilmStrip";
import heroBackground from "../assets/background-hero.png";
import { vtProductImage, vtShopLogo, withDirectionalTransition } from "../lib/viewTransitions";

const formatPrice = (value: number) =>
  value > 0 ? `${value.toLocaleString("vi-VN")}₫` : "Liên hệ";

const SHOW_COLLECTIONS = false;

export default function Homepage() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [routes, setRoutes] = useState<TouristRoute[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [gems, setGems] = useState<Array<{ product: Product; note: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [selectedRouteId, setSelectedRouteId] = useState("");
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
    <div className="bg-brand text-paper min-h-[100dvh] select-none overflow-x-hidden w-full relative">

      {/* ============ HERO SECTION ============ */}
      <section className="relative overflow-hidden bg-brand">
        {/* Street photograph background with measured multiply scrim */}
        <img
          src={heroBackground}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-ink/50 mix-blend-multiply grayscale"
        />


        <div
          style={{ paddingBottom: "calc(14vw + 2rem)" }}
          className="relative z-10 mx-auto flex min-h-[70vh] max-w-7xl flex-col items-start justify-center px-5 pt-20 md:px-8 md:pt-28"
        >
          <h1 className="mt-2 m-0 max-w-4xl text-[clamp(2.5rem,7vw,5rem)] font-medium uppercase leading-[1] tracking-[-0.03em] rise rise-1">
            Mỗi người một <span className="font-display text-wave normal-case">TÍ</span> chất
            riêng.
          </h1>

          {/* High-End Nested Button-in-Button CTA Architecture */}
          <div className="mt-9 flex flex-wrap items-center gap-4 rise rise-3">
            <a
              href="#kho"
              className="group inline-flex items-center gap-3 rounded-full bg-paper pl-6 pr-2 py-2 text-brand label font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-wave hover:text-ink hover:scale-105 active:scale-[0.98] shadow-lg shadow-black/20"
            >
              <span>Khám phá ngay</span>
              <div className="w-8 h-8 rounded-full bg-brand/10 group-hover:bg-ink group-hover:text-wave flex items-center justify-center transition-all duration-300 group-hover:translate-x-1">
                <ArrowRight className="w-4 h-4 text-brand group-hover:text-wave" aria-hidden="true" />
              </div>
            </a>

            <Link
              to="/stores"
              viewTransition
              className="group inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/5 backdrop-blur-sm px-6 py-3 text-sm font-semibold label transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-paper hover:bg-white/15 hover:scale-105 active:scale-[0.98]"
            >
              <Store className="w-4 h-4 text-wave group-hover:rotate-12 transition-transform" />
              <span>Ghé thăm các shop</span>
            </Link>
          </div>
        </div>

        {/* Brand Horizon Transition with RibbonLoop & ContinuousWave */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0">
          <RibbonLoop
            className="absolute bottom-0 right-0 z-0 translate-x-[16%]"
            style={{ width: "clamp(14rem, 26vw, 26rem)" }}
            ribbon="var(--color-wave)"
            dot="var(--color-paper)"
          />
        </div>
      </section>

      {/* Background Layer for the rest of the page */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <ContinuousWave pageIndex={0} />
        <PaperBackgroundExtender />
      </div>

      <div className="relative z-10">


        {/* ============ WHAT'S IN STORE (CURATED SHOWCASE) ============ */}
        <section id="kho" className="bg-paper text-ink pb-12 pt-8 md:pb-16 md:pt-12 scroll-mt-20 relative">
          <div className="mx-auto max-w-7xl px-5 md:px-8 text-center space-y-2">


            <h2 className="display text-center text-3xl md:text-5xl leading-tight text-ink normal-case">
              <span className="text-brand">What's in store</span>
            </h2>
          </div>

          {/* DOUBLE-BEZEL CONTAINER FOR 3D CAROUSEL */}
          <div className="rev mt-6 md:mt-8 max-w-7xl mx-auto px-4 md:px-8">
            <div className="p-2 rounded-[2.5rem] bg-black/5 ring-1 ring-black/5 shadow-inner">
              <div className="rounded-[2.125rem] bg-paper-warm/80 border border-ink/5 p-4 md:p-6 overflow-hidden">
                {loading ? (
                  <div className="flex justify-center gap-4 overflow-hidden py-12" aria-busy="true">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="w-[200px] shrink-0 animate-pulse md:w-[240px]">
                        <div className="aspect-square rounded-2xl bg-paper border border-ink/10" />
                        <div className="mt-4 h-3 w-1/3 rounded bg-paper" />
                        <div className="mt-2 h-4 w-3/4 rounded bg-paper" />
                      </div>
                    ))}
                  </div>
                ) : loadError ? (
                  <div className="mx-auto max-w-md py-8 text-center">
                    <p className="text-base font-medium">Không tải được danh sách sản phẩm.</p>
                    <p className="mt-1 text-sm text-ink/60">Thử lại sau vài giây nhé.</p>
                    <button
                      onClick={loadData}
                      className="mt-4 inline-flex items-center rounded-full bg-brand px-6 py-2.5 text-paper label transition-all hover:bg-brand-deep hover:scale-105 active:scale-95 shadow-md shadow-brand/20"
                    >
                      Thử lại
                    </button>
                  </div>
                ) : railProducts.length === 0 ? (
                  <div className="mx-auto max-w-md py-10 text-center">
                    <p className="text-base font-medium">Kho đang trống.</p>
                    <p className="mt-1 text-sm text-ink/60">
                      Chưa có sản phẩm nào được duyệt. Hãy ghé lại sau nhé.
                    </p>
                  </div>
                ) : (
                  <FilmStrip products={railProducts} />
                )}
              </div>
            </div>
          </div>

          {/* Section Action Bar */}
          <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-4 px-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
            <div className="flex items-center gap-2 text-xs text-ink/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Cập nhật lần cuối: 08/2026</span>
            </div>

            <Link
              to="/products"
              viewTransition
              className="group inline-flex items-center gap-3 rounded-full bg-brand pl-6 pr-2 py-2 text-paper label font-semibold whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-deep hover:scale-105 active:scale-[0.98] shadow-md shadow-brand/25"
            >
              <span>Xem tất cả tác phẩm</span>
              <div className="w-8 h-8 rounded-full bg-white/20 group-hover:bg-wave group-hover:text-ink flex items-center justify-center transition-all duration-300 group-hover:translate-x-1">
                <ArrowRight className="w-4 h-4 text-paper group-hover:text-ink" aria-hidden="true" />
              </div>
            </Link>
          </div>
        </section>

        {/* ============ DISCOVERY ROUTE (CULTURAL MAP TERMINAL) ============ */}
        <section id="lotrinh" className="relative overflow-hidden bg-paper py-12 md:py-16 scroll-mt-20">
          <div className="relative z-10 mx-auto max-w-7xl px-5 md:px-8 space-y-8">
            <div className="space-y-2 text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-medium leading-tight text-ink display normal-case">
                Hành trình khám phá
              </h2>
            </div>

            {loadError ? (
              <div className="mt-8 text-center">
                <p className="text-base font-medium text-ink">Không tải được lộ trình.</p>
                <button
                  onClick={loadData}
                  className="mt-4 inline-flex items-center rounded-full bg-brand px-6 py-2.5 text-paper label hover:bg-brand-deep transition-colors"
                >
                  Thử lại
                </button>
              </div>
            ) : !loading && routes.length === 0 ? (
              <p className="text-sm text-ink/70 text-center">Tí đang dựng những tuyến trải nghiệm đầu tiên.</p>
            ) : (
              <div className="space-y-6">

                {/* Route Selector Strip (Carousel navigation) */}
                <div className="flex justify-center flex-wrap items-center gap-3">
                  {routes.map((route, idx) => {
                    const isActive = selectedRouteId === route.id;
                    return (
                      <button
                        key={route.id}
                        onClick={() => {
                          const currentIdx = routes.findIndex(r => r.id === selectedRouteId);
                          const nextDir = idx >= currentIdx ? "forward" : "backward";
                          withDirectionalTransition(nextDir, () => {
                            setSelectedRouteId(route.id);
                          });
                          triggerWebhook("TOURIST_ROUTE_SELECTED", {
                            routeId: route.id,
                            routeName: route.name,
                          });
                        }}
                        aria-pressed={isActive}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all duration-300 ${isActive
                            ? "bg-brand text-paper shadow-lg shadow-brand/20 scale-105"
                            : "bg-paper-warm text-ink/70 hover:bg-ink/5 border border-ink/10"
                          }`}
                      >
                        <span className={`w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold ${isActive ? 'bg-white/20' : 'bg-ink/10'}`}>
                          {idx + 1}
                        </span>
                        <span>{route.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* MAP CAROUSEL SLIDE */}
                <div className="rev p-2 rounded-[2.5rem] bg-paper-warm ring-1 ring-ink/5 shadow-2xl max-w-4xl mx-auto">
                  <div className="rounded-[2.125rem] bg-white p-4 md:p-8">

                    {/* Map Coordinate Canvas */}
                    <div className="relative aspect-[4/3] md:aspect-[16/9] overflow-hidden rounded-2xl border border-ink/10 bg-paper shadow-inner">
                      {/* Mock SVG of HCMC Districts (Simplified) */}
                      <svg viewBox="0 0 800 600" aria-hidden="true" className="h-full w-full opacity-30 pointer-events-none">
                        <g stroke="var(--color-ink)" strokeWidth="2" fill="none" opacity="0.4">
                          {/* Abstract polygons representing districts */}
                          <path d="M300,200 L450,180 L500,300 L400,350 L280,280 Z" fill="var(--color-brand)" opacity="0.1" />
                          <path d="M450,180 L600,150 L650,250 L500,300 Z" />
                          <path d="M280,280 L400,350 L350,480 L200,400 Z" />
                          <path d="M400,350 L500,300 L550,450 L450,500 Z" />
                          <path d="M150,150 L300,200 L280,280 L120,250 Z" />
                        </g>
                        {/* Grid lines */}
                        <path
                          d="M0 150h800M0 300h800M0 450h800M200 0v600M400 0v600M600 0v600"
                          stroke="var(--color-ink)"
                          strokeWidth="1"
                          strokeDasharray="4,4"
                          opacity="0.2"
                        />
                      </svg>

                      {/* Display route pins */}
                      {activeRoute?.stops.map((stop, idx) => {
                        return (
                          <button
                            key={stop.id}
                            onClick={() => {
                              navigate(`/kham-pha/${activeRoute.id}?start=${stop.id}`);
                            }}
                            aria-label={`Bắt đầu từ ${stop.name}`}
                            title={`Khám phá từ: ${stop.name}`}
                            style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
                            className="absolute grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-sm font-bold border-2 border-brand bg-white text-brand transition-all duration-300 hover:scale-110 hover:bg-brand hover:text-paper shadow-lg z-10 group"
                          >
                            <span className="relative z-10">{idx + 1}</span>
                            {/* Ripple effect */}
                            <span className="absolute inset-0 rounded-full border border-brand animate-ping opacity-75"></span>
                            {/* Tooltip on hover */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-ink text-paper text-xs whitespace-nowrap rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              {stop.name}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 text-center">
                      <p className="text-xs text-ink/60 italic">Nhấp vào một điểm để bắt đầu lộ trình khám phá từ đó.</p>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </section>

        {/* ============ HIDDEN GEMS (CURIOUS FLOATING TEASER) ============ */}
        {gem && (
          <>
            <button
              onClick={() => {
                setIsGemOpen(true);
                triggerWebhook("CURATED_GEM_OPENED", { productId: gem.product.id });
              }}
              className={`fixed right-0 top-1/2 z-40 grid h-14 w-12 -translate-y-1/2 place-items-center rounded-l-2xl bg-wave text-ink shadow-2xl transition-all duration-300 hover:w-14 hover:scale-105 active:scale-95 ${isGemOpen ? "hidden" : ""
                }`}
              aria-label="Viên ngọc ẩn — xem sản phẩm Tí chọn"
            >
              <StarIcon className="w-6 h-6 text-ink" />
            </button>

            {isGemOpen && (
              <div className="gem-card fixed bottom-6 right-6 z-50 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-[2rem] bg-paper text-ink shadow-[0_25px_60px_rgba(18,8,31,0.4)] border border-ink/10 p-2 animate-scale-up">
                <div className="rounded-[1.625rem] bg-paper overflow-hidden">
                  <div className="relative aspect-[4/3] bg-paper-warm overflow-hidden">
                    <img
                      src={gem.product.images[0]}
                      alt={gem.product.name}
                      style={{ viewTransitionName: vtProductImage(gem.product.id) }}
                      className="h-full w-full object-cover"
                    />
                    <button
                      onClick={() => setIsGemOpen(false)}
                      className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-paper backdrop-blur-md transition-colors hover:bg-black"
                      aria-label="Đóng"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute top-3 left-3 bg-brand text-paper text-[10px] font-bold uppercase px-2.5 py-1 rounded-full shadow-xs">
                      ✦ Curated Gem
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      triggerWebhook("CURATED_GEM_CLICKED", { productId: gem.product.id });
                      navigate(`/products/${gem.product.id}`, { viewTransition: true });
                    }}
                    className="block w-full p-5 text-left transition-colors hover:bg-paper-warm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-brand uppercase tracking-wider">
                        {gem.product.storeName}
                      </span>
                      <span className="font-bold text-sm text-ink">
                        {formatPrice(gem.product.price)}
                      </span>
                    </div>

                    <h4 className="font-medium text-base text-ink line-clamp-1 leading-snug">
                      {gem.product.name}
                    </h4>

                    <p className="text-xs text-ink/75 italic line-clamp-2">
                      "{gem.note || 'Tác phẩm độc bản được ban biên tập Tí tuyển chọn kỹ lưỡng.'}"
                    </p>

                    <div className="pt-2 flex items-center justify-between text-xs font-semibold text-brand">
                      <span>Xem tác phẩm</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
