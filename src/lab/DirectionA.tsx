import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Heart, Menu, Search, X } from "lucide-react";
import Brandmark from "../components/Brandmark";
import { useAutoHideChrome, useMediaQuery, useReducedMotion } from "./useAutoHideChrome";
import { formatPrice, PRICE_NOTE, planFor, useLabData, LANDSCAPE_SPEC } from "./labData";
import type { Product, TouristRoute } from "../types";
import "./lab.css";

/* ═══════════════════════════════════════════════════════════════════════════
   DIRECTION A — "SẠP" (the stall)
   Reference: partakefoods.com · the project's own --ease-brand spring

   Hypothesis: Tí Coolture reads best as a joyful street stall. Everything is
   present at once and everything answers back when touched. Colour is loud,
   forms are chunky, physics are springy. The visitor never has to work out how
   to browse — the page is already moving in front of them.

   Axes that differ from B and C:
     · navigation model  — floating capsule that lands with a spring
     · content emphasis  — product-first; the catalogue never stops moving
     · interaction       — tap + spring, everything reacts on hover/press
     · density           — high; three surfaces visible per screen
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── chrome ─────────────────────────────────────────────────────────────── */

function StallNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { hidden, atTop } = useAutoHideChrome({ locked: menuOpen });

  const links = [
    { to: "/products", label: "Sản phẩm" },
    { to: "/stores", label: "Shop" },
    { to: "/kham-pha", label: "Khám phá" },
    { to: "/tui-minh", label: "Tụi mình" },
  ];

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6 md:pt-5 transition-transform duration-[420ms]"
      style={{
        transform: hidden ? "translateY(calc(-100% - 1.25rem))" : "translateY(0)",
        transitionTimingFunction: hidden
          ? "cubic-bezier(0.4, 0, 1, 1)"
          : "var(--ease-brand)",
      }}
    >
      <div
        className={`mx-auto flex max-w-6xl items-center gap-2 rounded-full px-2 py-2 transition-all duration-300 md:gap-4 md:px-3 ${
          atTop
            ? "bg-ink/35 backdrop-blur-md ring-1 ring-white/25"
            : "bg-paper shadow-[0_16px_40px_-12px_rgba(18,8,31,0.45)] ring-1 ring-ink/10"
        }`}
      >
        <Link
          to="/lab/a"
          className="shrink-0 rounded-full px-3 py-1.5 transition-transform duration-300 hover:scale-105"
          aria-label="Tí Coolture — trang chủ"
        >
          <Brandmark
            className="h-auto w-[68px] md:w-[76px]"
            body={atTop ? "var(--color-paper)" : "var(--color-brand)"}
          />
        </Link>

        <nav className="mx-auto hidden items-center gap-1 md:flex" aria-label="Điều hướng chính">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                atTop
                  ? "text-paper hover:bg-white/20"
                  : "text-ink/70 hover:bg-brand hover:text-paper"
              }`}
              style={{ transitionTimingFunction: "var(--ease-brand)" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          {[
            { icon: Search, label: "Tìm kiếm" },
            { icon: Heart, label: "Sản phẩm đã lưu" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              aria-label={label}
              className={`btn-pop grid h-11 w-11 place-items-center rounded-full transition-colors ${
                atTop ? "text-paper hover:bg-white/20" : "text-ink hover:bg-ink/5"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
            </button>
          ))}

          <Link
            to="/products"
            className="btn-pop hidden items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-paper sm:inline-flex"
          >
            Ghé sạp
            <ArrowRight className="h-4 w-4" />
          </Link>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            className={`grid h-11 w-11 place-items-center rounded-full md:hidden ${
              atTop ? "text-paper" : "text-ink"
            }`}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lab-pop mx-auto mt-2 max-w-6xl rounded-[1.75rem] bg-paper p-3 shadow-2xl ring-1 ring-ink/10 md:hidden">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="flex min-h-14 items-center justify-between rounded-2xl px-4 text-lg font-bold text-ink transition-colors hover:bg-brand hover:text-paper"
            >
              {link.label}
              <ArrowUpRight className="h-5 w-5" />
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

/* ── hero: a deck of shop-supplied frames ───────────────────────────────── */

function HeroDeck({ frames }: { frames: ReturnType<typeof useLabData>["heroFrames"] }) {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const count = frames.length;

  useEffect(() => {
    if (reduced || paused || count < 2) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % count), 4600);
    return () => clearInterval(timer);
  }, [reduced, paused, count]);

  if (count === 0) return <div className="h-[70vh] bg-brand" />;

  const frame = frames[active];

  return (
    <section
      className="relative bg-brand px-3 pb-6 pt-24 md:px-6 md:pb-10 md:pt-28"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Ảnh của Tí Coolture và các shop"
    >
      <div className="relative mx-auto max-w-[110rem]">
        <div className="relative aspect-[4/5] w-full sm:aspect-[16/10] lg:aspect-[21/9]">
          {frames.map((f, i) => {
            const rel = (i - active + count) % count;
            const front = rel === 0;
            const style =
              rel === 0
                ? { transform: "translate3d(0,0,0) rotate(0deg) scale(1)", opacity: 1, zIndex: 30 }
                : rel === 1
                ? { transform: "translate3d(2.2%,-2.4%,0) rotate(2.2deg) scale(0.955)", opacity: 1, zIndex: 20 }
                : rel === 2
                ? { transform: "translate3d(-2.2%,-4%,0) rotate(-2.4deg) scale(0.915)", opacity: 1, zIndex: 10 }
                : { transform: "translate3d(0,-5%,0) scale(0.9)", opacity: 0, zIndex: 0 };

            return (
              <figure
                key={f.id}
                aria-hidden={!front}
                className="absolute inset-0 m-0 overflow-hidden rounded-[2rem] bg-paper-warm ring-1 ring-ink/10 will-change-transform md:rounded-[3rem]"
                style={{
                  ...style,
                  transition: reduced
                    ? "none"
                    : "transform 760ms var(--ease-brand), opacity 420ms ease",
                }}
              >
                <img
                  src={f.src}
                  alt={
                    f.shopId
                      ? `Ảnh do ${f.shopName} gửi cho trang chủ Tí Coolture`
                      : "Tí Coolture — ảnh mở đầu"
                  }
                  fetchPriority={i === 0 ? "high" : "auto"}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="h-full w-full object-cover"
                />
                {front && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink/70 to-transparent"
                  />
                )}
              </figure>
            );
          })}

          {/* attribution sticker — the shop gets the front page, by name */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex flex-wrap items-end justify-between gap-3 p-4 md:p-8">
            <div key={frame.id} className="lab-pop pointer-events-auto">
              {frame.shopId ? (
                <Link
                  to={`/stores/${frame.shopId}`}
                  className="btn-pop inline-flex items-center gap-3 rounded-full bg-paper py-2 pl-2 pr-5 text-ink shadow-xl"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-wave text-sm font-black text-ink">
                    {String(active + 1).padStart(2, "0")}
                  </span>
                  <span className="text-left">
                    <span className="block text-sm font-black leading-tight">{frame.shopName}</span>
                    <span className="block text-[11px] font-medium text-ink/55">
                      {frame.awaitingUpload ? `Chờ ảnh ${LANDSCAPE_SPEC}` : frame.caption}
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-brand" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-3 rounded-full bg-wave py-2.5 pl-4 pr-5 text-ink shadow-xl">
                  <span className="text-sm font-black">Tí Coolture</span>
                  <span className="text-[11px] font-medium">{frame.caption}</span>
                </span>
              )}
            </div>

            {/* beads */}
            <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-ink/40 p-2 backdrop-blur-md">
              {frames.map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => setActive(i)}
                  aria-label={`Xem ảnh ${i + 1}: ${f.shopName}`}
                  aria-current={i === active}
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    i === active ? "w-8 bg-wave" : "w-2.5 bg-white/45 hover:bg-white/80"
                  }`}
                  style={{ transitionTimingFunction: "var(--ease-brand)" }}
                />
              ))}
            </div>
          </div>
        </div>

        <h1 className="mt-6 max-w-4xl text-[clamp(2.25rem,6.4vw,4.75rem)] font-black uppercase leading-[0.95] tracking-[-0.035em] text-paper md:mt-8">
          Mỗi người một{" "}
          <span className="font-display text-wave normal-case">TÍ</span> chất riêng.
        </h1>
        <p className="mt-4 max-w-md text-base text-white/80">
          Tí chọn — bạn ghé. Không giỏ hàng, không thanh toán. Thích thì nhắn thẳng cho shop.
        </p>
      </div>
    </section>
  );
}

/* ── what's in store: two lanes that never stop ─────────────────────────── */

/* `key` is declared explicitly because the project has no @types/react
   installed, so TS checks it as an ordinary prop rather than a reserved one. */
function StallCard({
  product,
  onOpen,
}: {
  key?: string;
  product: Product;
  onOpen: (p: Product) => void;
}) {
  return (
    <button
      onClick={() => onOpen(product)}
      className="lab-snap-item group mr-4 w-[76vw] shrink-0 text-left sm:w-[19rem] md:mr-6 md:w-[23rem]"
    >
      <div
        className="overflow-hidden rounded-[1.75rem] bg-paper-warm ring-1 ring-ink/10 transition-all duration-500 group-hover:-translate-y-2 group-hover:rotate-[-1.2deg] group-hover:shadow-[0_28px_60px_-18px_rgba(117,32,247,0.5)] group-active:scale-[0.97]"
        style={{ transitionTimingFunction: "var(--ease-brand)" }}
      >
        {/* landscape thumbnail — the ratio every shop must supply */}
        <div className="relative aspect-video overflow-hidden bg-paper">
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-paper backdrop-blur-sm">
            {product.category}
          </span>
        </div>
        <div className="flex items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold uppercase tracking-wider text-brand">
              {product.storeName}
            </p>
            <p className="mt-0.5 truncate text-[15px] font-bold text-ink">{product.name}</p>
          </div>
          <span className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-xs font-black text-paper">
            {formatPrice(product.price)}
          </span>
        </div>
      </div>
    </button>
  );
}

function MarqueeLane({
  products,
  direction,
  duration,
  onOpen,
}: {
  products: Product[];
  direction: "left" | "right";
  duration: string;
  onOpen: (p: Product) => void;
}) {
  const reduced = useReducedMotion();
  if (products.length === 0) return null;

  // Reduced motion turns the lane into an ordinary swipeable scroll-snap row.
  if (reduced) {
    return (
      <div className="lab-snap-x lab-no-scrollbar flex overflow-x-auto px-4">
        {products.map((p) => (
          <StallCard key={p.id} product={p} onOpen={onOpen} />
        ))}
      </div>
    );
  }

  return (
    <div className="lab-marquee-track overflow-hidden">
      <div
        className={`lab-marquee lab-marquee--${direction}`}
        style={{ ["--lab-marquee-duration" as string]: duration }}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex" aria-hidden={copy === 1}>
            {products.map((p) => (
              <StallCard key={`${copy}-${p.id}`} product={p} onOpen={onOpen} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── for him / for her: two halves that push each other ─────────────────── */

function SplitCollections({
  forHim,
  forHer,
  onOpen,
}: {
  forHim: Product[];
  forHer: Product[];
  onOpen: (p: Product) => void;
}) {
  const [lean, setLean] = useState<"him" | "her" | null>(null);
  // The panels only push each other when they sit side by side. Stacked, a
  // flex-basis of 0 would collapse them to nothing.
  const sideBySide = useMediaQuery("(min-width: 1024px)");

  const panels = [
    { key: "him" as const, label: "For him", vi: "Cho anh", items: forHim, tone: "bg-ink text-paper" },
    { key: "her" as const, label: "For her", vi: "Cho cô", items: forHer, tone: "bg-wave text-ink" },
  ];

  return (
    <section className="bg-brand px-3 py-14 md:px-6 md:py-20">
      <div className="mx-auto max-w-[110rem]">
        <h2 className="display max-w-3xl text-[clamp(2rem,5vw,3.75rem)] normal-case leading-[1.05] text-paper">
          Tặng ai cũng có phần
        </h2>

        <div className="mt-8 flex flex-col gap-4 lg:flex-row">
          {panels.map((panel) => {
            const grown = lean === panel.key;
            const shrunk = lean !== null && !grown;

            return (
              <div
                key={panel.key}
                onMouseEnter={() => setLean(panel.key)}
                onMouseLeave={() => setLean(null)}
                className={`relative overflow-hidden rounded-[2rem] p-6 transition-[flex-grow] duration-500 md:rounded-[2.5rem] md:p-8 ${panel.tone}`}
                style={
                  sideBySide
                    ? {
                        flexGrow: grown ? 1.6 : shrunk ? 0.7 : 1,
                        flexBasis: 0,
                        transitionTimingFunction: "var(--ease-brand)",
                      }
                    : undefined
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="label opacity-60">{panel.vi}</p>
                    <p className="display mt-1 text-[clamp(2rem,4.5vw,3.5rem)] normal-case leading-none">
                      {panel.label}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-current/25 px-3 py-1 text-xs font-bold">
                    {panel.items.length} món
                  </span>
                </div>

                <div className="lab-snap-x lab-no-scrollbar -mx-6 mt-6 flex overflow-x-auto px-6 md:-mx-8 md:px-8">
                  {panel.items.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onOpen(p)}
                      className="lab-snap-item group mr-3 w-[58vw] shrink-0 text-left sm:w-56"
                    >
                      <div className="overflow-hidden rounded-2xl bg-paper/12 ring-1 ring-current/15">
                        <div className="aspect-video overflow-hidden">
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                        <div className="p-3">
                          <p className="truncate text-sm font-bold">{p.name}</p>
                          <p className="mt-0.5 text-xs opacity-70">{formatPrice(p.price)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                  {panel.items.length === 0 && (
                    <p className="py-6 text-sm opacity-70">
                      Tí đang chọn những món đầu tiên cho mục này.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── map: a district board you can play on ──────────────────────────────── */

function DistrictBoard({ routes }: { routes: TouristRoute[] }) {
  const [page, setPage] = useState(0);
  const [openStop, setOpenStop] = useState<string | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const route = routes[page];
  const plan = route ? planFor(route.id) : null;

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(routes.length - 1, next));
    setPage(clamped);
    setOpenStop(null);
    railRef.current?.scrollTo({
      left: clamped * (railRef.current.clientWidth || 0),
      behavior: "smooth",
    });
  };

  if (!route || !plan) return null;

  const startIndex = route.stops.findIndex((s) => s.id === openStop);
  const ordered =
    startIndex >= 0
      ? [...route.stops.slice(startIndex), ...route.stops.slice(0, startIndex)]
      : [];

  return (
    <section className="bg-paper px-3 py-14 md:px-6 md:py-20">
      <div className="mx-auto max-w-[110rem]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label text-brand">Bản đồ theo quận</p>
            <h2 className="display mt-2 text-[clamp(2rem,5vw,3.75rem)] normal-case leading-[1.05] text-ink">
              Lướt qua một quận, chạm một điểm
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => go(page - 1)}
              disabled={page === 0}
              aria-label="Quận trước"
              className="btn-pop grid h-12 w-12 place-items-center rounded-full bg-ink text-paper disabled:opacity-25"
            >
              <ArrowRight className="h-5 w-5 rotate-180" />
            </button>
            <span className="min-w-[4.5rem] text-center text-sm font-black text-ink">
              {page + 1} / {routes.length}
            </span>
            <button
              onClick={() => go(page + 1)}
              disabled={page === routes.length - 1}
              aria-label="Quận sau"
              className="btn-pop grid h-12 w-12 place-items-center rounded-full bg-ink text-paper disabled:opacity-25"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* district cards */}
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <div className="relative overflow-hidden rounded-[2rem] bg-brand p-4 md:rounded-[2.5rem] md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-paper px-4 py-1.5 text-sm font-black text-brand">
                {plan.district}
              </span>
              <span className="text-xs font-bold text-white/75">
                {route.stops.length} điểm · {plan.walk}
              </span>
            </div>

            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-paper-warm md:aspect-[16/10]">
              <svg viewBox="0 0 800 600" className="h-full w-full" aria-hidden="true">
                {plan.shapes.map((d, i) => (
                  <path
                    key={i}
                    d={d}
                    fill="var(--color-brand)"
                    fillOpacity={0.07 + i * 0.03}
                    stroke="var(--color-ink)"
                    strokeOpacity="0.14"
                    strokeWidth="3"
                  />
                ))}
                <path
                  d={plan.axis}
                  fill="none"
                  stroke="var(--color-wave)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  opacity="0.55"
                />
                {openStop && ordered.length > 1 && (
                  <polyline
                    points={ordered.map((s) => `${(s.x / 100) * 800},${(s.y / 100) * 600}`).join(" ")}
                    fill="none"
                    stroke="var(--color-ink)"
                    strokeWidth="4"
                    strokeDasharray="12 10"
                    strokeLinecap="round"
                    opacity="0.55"
                  />
                )}
              </svg>

              {route.stops.map((stop, i) => {
                const isStart = stop.id === openStop;
                const dimmed = openStop !== null && !isStart;
                return (
                  <button
                    key={stop.id}
                    onClick={() => setOpenStop(isStart ? null : stop.id)}
                    aria-pressed={isStart}
                    aria-label={`Bắt đầu lộ trình từ ${stop.name}`}
                    style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
                    className={`group absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-sm font-black shadow-lg transition-all duration-300 ${
                      isStart
                        ? "lab-bead-live z-20 h-14 w-14 bg-ink text-wave ring-4 ring-wave"
                        : dimmed
                        ? "h-10 w-10 bg-paper/70 text-ink/40 ring-2 ring-ink/10"
                        : "h-12 w-12 bg-paper text-brand ring-2 ring-brand hover:scale-110"
                    }`}
                  >
                    {i + 1}
                    <span className="pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-3 py-1 text-[11px] font-semibold text-paper opacity-0 transition-opacity group-hover:opacity-100">
                      {stop.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-center text-xs font-medium text-white/75">
              Chạm một điểm để mở lộ trình bắt đầu từ đó.
            </p>
          </div>

          {/* route listing — the start point is the point marked on the map */}
          <div className="rounded-[2rem] bg-paper-warm p-5 ring-1 ring-ink/10 md:rounded-[2.5rem] md:p-7">
            {ordered.length === 0 ? (
              <div className="flex h-full min-h-[16rem] flex-col items-center justify-center text-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-brand/10 text-2xl">
                  ✦
                </span>
                <p className="mt-4 max-w-[18rem] text-base font-bold text-ink">
                  Chọn điểm bắt đầu trên bản đồ
                </p>
                <p className="mt-1 max-w-[18rem] text-sm text-ink/60">
                  Tí sẽ xếp lại lộ trình ăn chơi tính từ chỗ bạn đứng.
                </p>
              </div>
            ) : (
              <>
                <p className="label text-brand">Lộ trình từ {ordered[0].name}</p>
                <ol className="mt-4 space-y-1">
                  {ordered.map((stop, i) => (
                    <li key={stop.id}>
                      <div className="flex items-start gap-3 rounded-2xl p-3 transition-colors hover:bg-paper">
                        <span
                          className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black ${
                            i === 0 ? "bg-ink text-wave" : "bg-brand/10 text-brand"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[15px] font-bold text-ink">{stop.name}</span>
                          {stop.address && stop.address !== stop.name && (
                            <span className="block truncate text-xs text-ink/55">{stop.address}</span>
                          )}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
                <Link
                  to={`/kham-pha/${route.id}?start=${ordered[0].id}`}
                  className="btn-pop mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-black text-paper"
                >
                  Đi lộ trình này
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── page ───────────────────────────────────────────────────────────────── */

export default function DirectionA() {
  const navigate = useNavigate();
  const { loading, error, reload, heroFrames, popular, forHim, forHer, routes } = useLabData();

  const open = (p: Product) => navigate(`/products/${p.id}`, { viewTransition: true });

  const laneA = popular.slice(0, Math.ceil(popular.length / 2));
  const laneB = popular.slice(Math.ceil(popular.length / 2));

  return (
    <div className="min-h-[100dvh] bg-brand font-sans">
      <StallNav />
      <HeroDeck frames={heroFrames} />

      <section className="bg-brand px-3 pb-16 md:px-6 md:pb-24">
        <div className="mx-auto max-w-[110rem]">
          <div className="flex flex-wrap items-end justify-between gap-4 pb-8 pt-6">
            <h2 className="display text-[clamp(2rem,5vw,3.75rem)] normal-case leading-[1.05] text-paper">
              What&rsquo;s in store
            </h2>
            <Link
              to="/products"
              className="btn-pop inline-flex items-center gap-2 rounded-full bg-paper px-6 py-3 text-sm font-black text-brand"
            >
              Xem tất cả
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex gap-4 overflow-hidden px-4" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[23rem] shrink-0 animate-pulse">
                <div className="aspect-video rounded-[1.75rem] bg-white/10" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mx-auto max-w-md rounded-[1.75rem] bg-paper p-6 text-center">
            <p className="font-bold text-ink">Không tải được danh sách sản phẩm.</p>
            <button
              onClick={reload}
              className="btn-pop mt-4 rounded-full bg-brand px-6 py-2.5 text-sm font-black text-paper"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            <MarqueeLane products={laneA} direction="left" duration="52s" onOpen={open} />
            <MarqueeLane products={laneB} direction="right" duration="64s" onOpen={open} />
          </div>
        )}

        <p className="mx-auto mt-8 max-w-[110rem] text-xs text-white/65">{PRICE_NOTE}</p>
      </section>

      <SplitCollections forHim={forHim} forHer={forHer} onOpen={open} />
      <DistrictBoard routes={routes} />

      <footer className="bg-ink px-3 py-14 text-paper md:px-6">
        <div className="mx-auto max-w-[110rem]">
          <p className="display text-[clamp(2.5rem,9vw,7rem)] normal-case leading-none text-wave">
            Tí Coolture
          </p>
          <p className="mt-4 max-w-md text-sm text-white/70">
            Tí Coolture không bán hàng và không xử lý giao dịch. Mọi trao đổi diễn ra trực tiếp
            giữa bạn và thương hiệu.
          </p>
        </div>
      </footer>
    </div>
  );
}
