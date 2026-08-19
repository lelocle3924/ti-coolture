import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, Menu, Search, X } from "lucide-react";
import Brandmark from "../components/Brandmark";
import { useAutoHideChrome, useReducedMotion } from "./useAutoHideChrome";
import { formatPrice, PRICE_NOTE, planFor, useLabData, LANDSCAPE_SPEC } from "./labData";
import type { Product, TouristRoute } from "../types";
import "./lab.css";

/* ═══════════════════════════════════════════════════════════════════════════
   DIRECTION B — "HỒ SƠ" (the archive)
   Reference: objectandarchive.com · the brief's "sắc sảo / thủ công"

   Hypothesis: curation is the product, so the interface should read like a
   curator's archive — paper ground, hairline rules, running index numbers,
   museum captions. The catalogue is a *table of contents*, not a grid: text
   first, image summoned as evidence. Restraint is the luxury signal.

   Axes that differ from A and C:
     · navigation model  — chrome thins to a hairline index rather than a pill
     · content emphasis  — editorial/typographic; images are earned, not poured
     · interaction       — hover/focus summons, nothing autoplays loudly
     · density           — highest text density of the three; lowest chroma
   ═══════════════════════════════════════════════════════════════════════════ */

const NAV = [
  { to: "/products", label: "Sản phẩm", index: "01" },
  { to: "/stores", label: "Shop", index: "02" },
  { to: "/kham-pha", label: "Khám phá", index: "03" },
  { to: "/tui-minh", label: "Tụi mình", index: "04" },
];

/* ── chrome: a rule that thins, not a bar that floats ───────────────────── */

function ArchiveNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { hidden, atTop, progress } = useAutoHideChrome({ locked: menuOpen });

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 bg-paper/95 backdrop-blur-sm transition-transform duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{ transform: hidden ? "translateY(-101%)" : "translateY(0)" }}
    >
      <div
        className={`mx-auto flex max-w-[100rem] items-center gap-6 px-5 transition-[padding] duration-500 md:px-10 ${
          atTop ? "py-5" : "py-3"
        }`}
      >
        <Link to="/lab/b" aria-label="Tí Coolture — trang chủ" className="shrink-0">
          <Brandmark
            className={`h-auto transition-all duration-500 ${atTop ? "w-[86px]" : "w-[64px]"}`}
            body="var(--color-ink)"
            wave="var(--color-wave-ink)"
          />
        </Link>

        <nav className="mx-auto hidden items-baseline gap-9 md:flex" aria-label="Điều hướng chính">
          {NAV.map((link) => (
            <Link key={link.to} to={link.to} className="group flex items-baseline gap-1.5">
              <span className="text-[10px] font-medium tabular-nums text-ink/35 transition-colors group-hover:text-wave-ink">
                {link.index}
              </span>
              <span className="text-sm text-ink/75 transition-colors group-hover:text-ink">
                {link.label}
              </span>
              <span className="block h-px w-0 self-end bg-ink transition-[width] duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4 md:ml-0">
          <button aria-label="Tìm kiếm" className="grid h-11 w-11 place-items-center text-ink/70 hover:text-ink">
            <Search className="h-[17px] w-[17px]" />
          </button>
          <span className="hidden text-[11px] tracking-[0.14em] text-ink/45 sm:inline">
            <span className="text-ink">VI</span> / EN
          </span>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            className="grid h-11 w-11 place-items-center text-ink md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* the rule *is* the chrome — it doubles as the reading progress line */}
      <div className="relative h-px w-full bg-ink/12">
        <div
          className="absolute inset-y-0 left-0 bg-ink transition-[width] duration-150"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {menuOpen && (
        <div className="border-b border-ink/12 bg-paper px-5 pb-6 md:hidden">
          {NAV.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="flex min-h-14 items-baseline gap-3 border-b border-ink/10 text-ink"
            >
              <span className="text-[10px] tabular-nums text-ink/35">{link.index}</span>
              <span className="display text-2xl normal-case">{link.label}</span>
              <ArrowUpRight className="ml-auto h-4 w-4 self-center text-ink/40" />
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

/* ── hero: one plate at a time, captioned like a museum label ───────────── */

function PlateHero({ frames }: { frames: ReturnType<typeof useLabData>["heroFrames"] }) {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const count = frames.length;

  useEffect(() => {
    if (reduced || count < 2) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % count), 5200);
    return () => clearInterval(timer);
  }, [reduced, count]);

  if (count === 0) return <div className="h-[60vh] bg-paper" />;
  const frame = frames[active];

  return (
    <section className="lab-grain relative bg-paper px-5 pb-16 pt-28 md:px-10 md:pb-24 md:pt-36">
      <div className="mx-auto max-w-[100rem]">
        <div className="flex items-baseline justify-between border-b border-ink/12 pb-4">
          <p className="text-[11px] tracking-[0.18em] text-ink/45">
            TUYỂN CHỌN · THÀNH PHỐ HỒ CHÍ MINH
          </p>
          <p className="text-[11px] tabular-nums tracking-[0.18em] text-ink/45">
            {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </p>
        </div>

        <h1 className="display mt-8 max-w-[22ch] text-[clamp(2.5rem,7.2vw,6.5rem)] normal-case leading-[0.98] text-ink">
          Mỗi người một{" "}
          <span className="text-brand">TÍ</span> chất riêng
        </h1>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_20rem] lg:gap-14">
          {/* the plate */}
          <figure className="m-0">
            <div className="relative aspect-[4/5] overflow-hidden bg-paper-warm ring-1 ring-ink/12 sm:aspect-[16/9]">
              {frames.map((f, i) => (
                <img
                  key={f.id}
                  src={f.src}
                  alt={
                    f.shopId
                      ? `Ảnh do ${f.shopName} gửi cho trang chủ Tí Coolture`
                      : "Tí Coolture — bản in mở đầu"
                  }
                  aria-hidden={i !== active}
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : "auto"}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{
                    opacity: i === active ? 1 : 0,
                    transition: reduced ? "none" : "opacity 900ms ease",
                  }}
                />
              ))}
            </div>

            {/* museum label */}
            <figcaption className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-ink/12 pt-3">
              <span className="text-[11px] tabular-nums text-ink/40">
                BẢN {String(active + 1).padStart(2, "0")}
              </span>
              {frame.shopId ? (
                <Link
                  to={`/stores/${frame.shopId}`}
                  className="group inline-flex items-baseline gap-1.5 text-sm font-medium text-ink"
                >
                  {frame.shopName}
                  <ArrowUpRight className="h-3.5 w-3.5 translate-y-0.5 text-ink/40 transition-transform group-hover:-translate-y-0" />
                </Link>
              ) : (
                <span className="text-sm font-medium text-ink">{frame.shopName}</span>
              )}
              <span className="text-sm text-ink/55">
                {frame.awaitingUpload ? `Ảnh shop gửi · ${LANDSCAPE_SPEC}` : frame.caption}
              </span>
            </figcaption>
          </figure>

          {/* index of plates — doubles as the carousel control */}
          <aside className="lg:pt-1">
            <p className="text-[11px] tracking-[0.18em] text-ink/45">MỤC LỤC ẢNH</p>
            <ol className="mt-3">
              {frames.map((f, i) => (
                <li key={f.id}>
                  <button
                    onClick={() => setActive(i)}
                    aria-current={i === active}
                    className={`flex min-h-11 w-full items-baseline gap-3 border-b border-ink/10 text-left transition-colors ${
                      i === active ? "text-ink" : "text-ink/45 hover:text-ink/80"
                    }`}
                  >
                    <span className="text-[10px] tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <span className="truncate text-sm">{f.shopName}</span>
                    <span
                      className={`ml-auto h-px w-6 shrink-0 self-center transition-colors ${
                        i === active ? "bg-ink" : "bg-transparent"
                      }`}
                    />
                  </button>
                </li>
              ))}
            </ol>
            <p className="mt-5 max-w-[28ch] text-sm leading-relaxed text-ink/60">
              Ảnh mở đầu là của Tí. Những bản tiếp theo do chính các shop gửi tới — cùng một tỷ lệ,
              cùng một mức chất lượng.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}

/* ── what's in store: the catalogue as a table of contents ──────────────── */

function IndexTable({ products, onOpen }: { products: Product[]; onOpen: (p: Product) => void }) {
  const [focus, setFocus] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const current = products[focus];

  return (
    <section className="border-t border-ink/12 bg-paper px-5 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-[100rem]">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-ink/12 pb-4">
          <h2 className="display text-[clamp(1.75rem,4.4vw,3.25rem)] normal-case leading-none text-ink">
            What&rsquo;s in store
          </h2>
          <p className="text-[11px] tabular-nums tracking-[0.18em] text-ink/45">
            {String(products.length).padStart(2, "0")} MỤC · CẬP NHẬT 08/2026
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_26rem] lg:gap-16">
          {/* the index */}
          <ol className="mt-2">
            {products.map((p, i) => {
              const open = expanded === p.id;
              return (
                <li key={p.id} className="border-b border-ink/10">
                  <button
                    onMouseEnter={() => setFocus(i)}
                    onFocus={() => setFocus(i)}
                    onClick={() => {
                      // Desktop has the summoned plate beside the list; on small
                      // screens the row carries its own plate, so tap expands.
                      if (window.matchMedia("(min-width: 1024px)").matches) onOpen(p);
                      else setExpanded(open ? null : p.id);
                    }}
                    aria-expanded={open}
                    className={`group flex w-full items-baseline gap-3 py-4 text-left transition-colors md:gap-5 ${
                      focus === i ? "text-ink" : "text-ink/70 hover:text-ink"
                    }`}
                  >
                    <span className="w-6 shrink-0 text-[11px] tabular-nums text-ink/35">
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-[clamp(1rem,2vw,1.5rem)] font-medium leading-snug">
                        {p.name}
                      </span>
                      <span className="mt-0.5 block text-xs tracking-[0.1em] text-ink/45">
                        {p.storeName.toUpperCase()} · {p.category.toUpperCase()}
                      </span>
                    </span>

                    <span className="lab-leader hidden sm:block" aria-hidden="true" />

                    <span className="shrink-0 text-sm tabular-nums text-ink/75">
                      {formatPrice(p.price)}
                    </span>
                    <ArrowUpRight
                      className="hidden h-4 w-4 shrink-0 self-center text-ink/25 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:text-ink lg:block"
                      aria-hidden="true"
                    />
                  </button>

                  {/* mobile: the row opens its own landscape plate */}
                  {open && (
                    <div className="lab-plate-in pb-5 lg:hidden">
                      <div className="aspect-video overflow-hidden bg-paper-warm ring-1 ring-ink/12">
                        <img src={p.images[0]} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                      </div>
                      <button
                        onClick={() => onOpen(p)}
                        className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink underline underline-offset-4"
                      >
                        Xem tác phẩm
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          {/* desktop: the plate the index summons */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <div className="relative aspect-video overflow-hidden bg-paper-warm ring-1 ring-ink/12">
                {current && (
                  <img
                    key={current.id}
                    src={current.images[0]}
                    alt={current.name}
                    className="lab-plate-in h-full w-full object-cover"
                  />
                )}
              </div>
              {current && (
                <div className="mt-3 border-t border-ink/12 pt-3">
                  <p className="text-[11px] tabular-nums text-ink/40">
                    MỤC {String(focus + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-1 text-base font-medium text-ink">{current.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink/60">
                    {current.description || current.story || "Chưa có mô tả."}
                  </p>
                  <button
                    onClick={() => onOpen(current)}
                    className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink underline underline-offset-4 hover:text-brand"
                  >
                    Xem tác phẩm
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>

        <p className="mt-8 border-t border-ink/12 pt-4 text-xs text-ink/50">{PRICE_NOTE}</p>
      </div>
    </section>
  );
}

/* ── for him / for her: two drawers of the same cabinet ─────────────────── */

function Drawers({
  forHim,
  forHer,
  onOpen,
}: {
  forHim: Product[];
  forHer: Product[];
  onOpen: (p: Product) => void;
}) {
  const drawers = [
    { key: "him", label: "For him", vi: "Cho anh", index: "A", items: forHim },
    { key: "her", label: "For her", vi: "Cho cô", index: "B", items: forHer },
  ];

  return (
    <section className="border-t border-ink/12 bg-paper-warm px-5 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-[100rem] space-y-14">
        {drawers.map((drawer) => (
          <div key={drawer.key}>
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 border-b border-ink/15 pb-3">
              <span className="text-[11px] tracking-[0.2em] text-ink/40">NGĂN {drawer.index}</span>
              <h3 className="display text-[clamp(1.6rem,3.6vw,2.75rem)] normal-case leading-none text-ink">
                {drawer.label}
              </h3>
              <span className="text-sm text-ink/50">{drawer.vi}</span>
              <span className="ml-auto text-[11px] tabular-nums text-ink/40">
                {String(drawer.items.length).padStart(2, "0")} MỤC
              </span>
            </div>

            {drawer.items.length === 0 ? (
              <p className="py-8 text-sm text-ink/55">Tí đang chọn những món đầu tiên cho ngăn này.</p>
            ) : (
              <div className="lab-snap-x lab-no-scrollbar -mx-5 mt-6 flex gap-6 overflow-x-auto px-5 md:-mx-10 md:px-10">
                {drawer.items.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => onOpen(p)}
                    className="lab-snap-item group w-[74vw] shrink-0 text-left sm:w-[22rem]"
                  >
                    <div className="aspect-video overflow-hidden bg-paper ring-1 ring-ink/12">
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="mt-3 flex items-baseline gap-3 border-t border-ink/12 pt-2">
                      <span className="text-[10px] tabular-nums text-ink/35">
                        {drawer.index}
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink">{p.name}</span>
                        <span className="block truncate text-xs text-ink/50">{p.storeName}</span>
                      </span>
                      <span className="ml-auto shrink-0 text-xs tabular-nums text-ink/65">
                        {formatPrice(p.price)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── map: a survey plan, paged by district ─────────────────────────────── */

function PlanMap({ routes }: { routes: TouristRoute[] }) {
  const [page, setPage] = useState(0);
  const [start, setStart] = useState<string | null>(null);

  const route = routes[page];
  const plan = route ? planFor(route.id) : null;
  if (!route || !plan) return null;

  const startIndex = route.stops.findIndex((s) => s.id === start);
  const ordered =
    startIndex >= 0 ? [...route.stops.slice(startIndex), ...route.stops.slice(0, startIndex)] : [];

  const turn = (delta: number) => {
    setPage((p) => Math.max(0, Math.min(routes.length - 1, p + delta)));
    setStart(null);
  };

  return (
    <section className="border-t border-ink/12 bg-paper px-5 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-[100rem]">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-ink/12 pb-4">
          <h2 className="display text-[clamp(1.75rem,4.4vw,3.25rem)] normal-case leading-none text-ink">
            Bản đồ các quận
          </h2>
          <div className="flex items-baseline gap-5">
            <button
              onClick={() => turn(-1)}
              disabled={page === 0}
              className="min-h-11 text-sm text-ink/60 underline underline-offset-4 hover:text-ink disabled:opacity-25 disabled:no-underline"
            >
              ‹ Quận trước
            </button>
            <span className="text-[11px] tabular-nums tracking-[0.18em] text-ink/45">
              TRANG {String(page + 1).padStart(2, "0")} / {String(routes.length).padStart(2, "0")}
            </span>
            <button
              onClick={() => turn(1)}
              disabled={page === routes.length - 1}
              className="min-h-11 text-sm text-ink/60 underline underline-offset-4 hover:text-ink disabled:opacity-25 disabled:no-underline"
            >
              Quận sau ›
            </button>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
          <figure className="m-0 mt-8">
            <div className="relative aspect-[4/3] bg-paper-warm ring-1 ring-ink/12 md:aspect-[16/10]">
              <svg viewBox="0 0 800 600" className="h-full w-full" aria-hidden="true">
                <defs>
                  <pattern id="lab-plan-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M40 0H0V40" fill="none" stroke="var(--color-ink)" strokeOpacity="0.07" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="800" height="600" fill="url(#lab-plan-grid)" />
                {plan.shapes.map((d, i) => (
                  <path key={i} d={d} fill="none" stroke="var(--color-ink)" strokeOpacity="0.35" strokeWidth="1.25" />
                ))}
                <path d={plan.axis} fill="none" stroke="var(--color-wave-ink)" strokeWidth="2" strokeOpacity="0.6" />
                {ordered.length > 1 && (
                  <polyline
                    points={ordered.map((s) => `${(s.x / 100) * 800},${(s.y / 100) * 600}`).join(" ")}
                    fill="none"
                    stroke="var(--color-ink)"
                    strokeWidth="1.5"
                    strokeDasharray="7 6"
                  />
                )}
              </svg>

              {route.stops.map((stop, i) => {
                const isStart = stop.id === start;
                const dim = start !== null && !isStart;
                return (
                  <button
                    key={stop.id}
                    onClick={() => setStart(isStart ? null : stop.id)}
                    aria-pressed={isStart}
                    aria-label={`Bắt đầu lộ trình từ ${stop.name}`}
                    style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
                    className={`group absolute grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-[11px] tabular-nums transition-all duration-500 ${
                      isStart
                        ? "border border-ink bg-ink text-paper"
                        : dim
                        ? "border border-ink/20 bg-paper text-ink/30"
                        : "border border-ink/50 bg-paper text-ink hover:border-ink hover:bg-ink hover:text-paper"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                    <span className="pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap bg-paper px-1.5 text-[10px] tracking-wider text-ink opacity-0 transition-opacity group-hover:opacity-100">
                      {stop.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <figcaption className="mt-3 flex flex-wrap items-baseline gap-x-4 border-t border-ink/12 pt-3 text-[11px] tracking-[0.14em] text-ink/50">
              <span className="text-ink">{plan.district.toUpperCase()}</span>
              <span>{route.stops.length} ĐIỂM</span>
              <span>{plan.walk}</span>
            </figcaption>
          </figure>

          {/* itinerary, printed as a contents list */}
          <div className="mt-8">
            {ordered.length === 0 ? (
              <div className="border-t border-ink/15 pt-5">
                <p className="text-[11px] tracking-[0.2em] text-ink/40">CHƯA CHỌN ĐIỂM BẮT ĐẦU</p>
                <p className="mt-3 max-w-[34ch] text-[clamp(1.1rem,2.2vw,1.5rem)] leading-snug text-ink/75">
                  Chạm một điểm được đánh dấu trên bản đồ. Tí xếp lại lộ trình tính từ chỗ đó.
                </p>
                <ol className="mt-6">
                  {route.stops.map((stop, i) => (
                    <li key={stop.id}>
                      <button
                        onClick={() => setStart(stop.id)}
                        className="flex w-full items-baseline gap-3 border-b border-ink/10 py-3 text-left text-ink/55 transition-colors hover:text-ink"
                      >
                        <span className="text-[10px] tabular-nums text-ink/35">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm">{stop.name}</span>
                        <span className="lab-leader" aria-hidden="true" />
                        <span className="text-[11px] tracking-wider">BẮT ĐẦU TỪ ĐÂY</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <div className="border-t border-ink/15 pt-5">
                <p className="text-[11px] tracking-[0.2em] text-ink/40">
                  LỘ TRÌNH · BẮT ĐẦU TỪ {ordered[0].name.toUpperCase()}
                </p>
                <ol className="mt-4">
                  {ordered.map((stop, i) => (
                    <li key={stop.id} className="border-b border-ink/10 py-4">
                      <div className="flex items-baseline gap-3">
                        <span
                          className={`text-[10px] tabular-nums ${i === 0 ? "text-ink" : "text-ink/35"}`}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[clamp(1rem,2vw,1.35rem)] font-medium leading-snug text-ink">
                            {stop.name}
                          </span>
                          {stop.address && stop.address !== stop.name && (
                            <span className="mt-0.5 block text-xs text-ink/50">{stop.address}</span>
                          )}
                        </span>
                        {i === 0 && (
                          <span className="shrink-0 border border-ink px-2 py-0.5 text-[10px] tracking-[0.14em] text-ink">
                            ĐIỂM XUẤT PHÁT
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
                <Link
                  to={`/kham-pha/${route.id}?start=${ordered[0].id}`}
                  className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink underline underline-offset-4 hover:text-brand"
                >
                  Mở lộ trình đầy đủ
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── page ───────────────────────────────────────────────────────────────── */

export default function DirectionB() {
  const navigate = useNavigate();
  const { loading, error, reload, heroFrames, popular, forHim, forHer, routes } = useLabData();
  const open = (p: Product) => navigate(`/products/${p.id}`, { viewTransition: true });

  return (
    <div className="min-h-[100dvh] bg-paper font-sans text-ink">
      <ArchiveNav />
      <PlateHero frames={heroFrames} />

      {loading ? (
        <div className="mx-auto max-w-[100rem] space-y-4 px-5 py-16 md:px-10" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse border-b border-ink/10 bg-paper-warm" />
          ))}
        </div>
      ) : error ? (
        <div className="mx-auto max-w-md px-5 py-20 text-center">
          <p className="text-base font-medium">Không tải được danh sách sản phẩm.</p>
          <button onClick={reload} className="mt-4 min-h-11 text-sm underline underline-offset-4">
            Thử lại
          </button>
        </div>
      ) : (
        <IndexTable products={popular} onOpen={open} />
      )}

      <Drawers forHim={forHim} forHer={forHer} onOpen={open} />
      <PlanMap routes={routes} />

      {/* the one violet band — punctuation, not ground */}
      <footer className="bg-brand px-5 py-16 text-paper md:px-10 md:py-20">
        <div className="mx-auto max-w-[100rem]">
          <p className="display text-[clamp(2.5rem,9vw,7rem)] normal-case leading-none">
            Tí Coolture
          </p>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/75">
            Tí Coolture không bán hàng và không xử lý giao dịch. Mọi trao đổi diễn ra trực tiếp
            giữa bạn và thương hiệu.
          </p>
        </div>
      </footer>
    </div>
  );
}
