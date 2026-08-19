import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Menu, Search, StarIcon, X } from "lucide-react";
import Brandmark from "../components/Brandmark";
import { useAutoHideChrome, useMediaQuery, useReducedMotion } from "./useAutoHideChrome";
import {
  formatPrice,
  islandBlobs,
  PRICE_NOTE,
  planFor,
  useLabData,
  LANDSCAPE_SPEC,
  type LabCollection,
} from "./labData";
import { triggerWebhook } from "../lib/dbService";
import type { Product, TouristRoute } from "../types";
import "./lab.css";

/* ═══════════════════════════════════════════════════════════════════════════
   DIRECTION C — "DÒNG" (the current)
   Reference: readymag.com · the brief's third adjective, "đang chuyển động"

   Hypothesis: the site behaves like one continuous motion rather than a stack
   of sections. Nothing sits in a card; hairlines and full-bleed colour fields
   carry the structure instead.

   Revised 19/08 on team feedback:
     · What's in store took A's two counter-running marquee lanes (the pinned
       rail moved to Collections, where wireframes.html MO-7 always wanted it —
       "used once per site").
     · New "How it works" between store and collections, after dontboardme.com:
       title and index set at the same size, caption tiny beneath.
     · Collections are four numbered placeholders on a pinned track whose
       60 / 30 / 10 window slides forward as you scroll.
     · Map is a single strip after collections, after bangkokartcity.org's
       "Discover Bangkok Art City" — island, pins, arrows, nothing else. The
       whole map is the link to /kham-pha.
     · Footer follows MO-4: stationary full-viewport underlay, content sheet
       scrolling over it, wordmark scrubbing 0.25 → 1 opacity and 26 → 0 px.
   ═══════════════════════════════════════════════════════════════════════════ */

const NAV = [
  { to: "/products", label: "Sản phẩm" },
  { to: "/stores", label: "Shop" },
  { to: "/kham-pha", label: "Khám phá" },
  { to: "/tui-minh", label: "Tụi mình" },
];

const SPINE = [
  { id: "dong-hero", label: "Mở đầu" },
  { id: "dong-store", label: "Trong kho" },
  { id: "dong-how", label: "Cách đặt" },
  { id: "dong-collections", label: "Bộ sưu tập" },
  { id: "dong-map", label: "Bản đồ" },
];

/* Copy per copy-how-it-works.md. EN is carried but not rendered — the language
   switch is not wired in the lab, and VI is primary. */
const HOW_STEPS = [
  {
    n: "01",
    vi: { title: "Chọn món bạn ưng", body: "Lướt qua sản phẩm từ các local brand Tí tuyển chọn. Thấy món hợp gu thì mở ra xem kỹ hơn." },
    en: { title: "Find something you like", body: "Browse pieces from the local brands Tí has picked. Something catches your eye, open it up." },
  },
  {
    n: "02",
    vi: { title: "Bấm ORDER NOW, chọn kênh", body: "Mỗi shop bán trên kênh riêng — Instagram, TikTok hay Facebook. Chọn kênh bạn hay dùng." },
    en: { title: "Tap ORDER NOW, pick a channel", body: "Every shop sells on its own channel. Pick the one you already use." },
  },
  {
    n: "03",
    vi: { title: "Dán tin nhắn có sẵn", body: "Tí soạn sẵn tên món kèm link và copy vào máy bạn. Qua shop chỉ việc dán rồi gửi." },
    en: { title: "Paste the message we wrote", body: "Tí writes it out with the product name and link, and copies it for you. Paste, send." },
  },
  {
    n: "04",
    vi: { title: "Shop nhắn lại cho bạn", body: "Giá, còn hàng hay không, ship thế nào — bạn chốt trực tiếp với shop. Tí không giữ tiền, không qua trung gian." },
    en: { title: "The shop gets back to you", body: "Price, stock, delivery — you settle it straight with the shop. Tí never handles your money." },
  },
];

const HOW_TURN = {
  vi: { title: "Chưa biết mua gì?", body: "Ngó thử mấy bộ sưu tập này xem, biết đâu lại đúng gu bạn." },
  en: { title: "Nothing in mind yet?", body: "Have a look through these collections — something might land." },
};

/* ── chrome: glass bar + the spine ──────────────────────────────────────── */

function CurrentNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { hidden, atTop, progress } = useAutoHideChrome({ locked: menuOpen });

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{ transform: hidden ? "translateY(-102%)" : "translateY(0)" }}
    >
      <div
        className={`transition-colors duration-500 ${
          atTop ? "bg-transparent" : "bg-brand-deep/70 backdrop-blur-xl"
        }`}
      >
        <div className="mx-auto flex max-w-[110rem] items-center gap-6 px-5 py-4 md:px-10">
          <Link to="/lab/c" aria-label="Tí Coolture — trang chủ" className="shrink-0">
            <Brandmark className="h-auto w-[74px]" body="var(--color-paper)" />
          </Link>

          <nav className="mx-auto hidden items-center gap-8 md:flex" aria-label="Điều hướng chính">
            {NAV.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="group relative overflow-hidden py-1 text-sm text-white/70 transition-colors hover:text-paper"
              >
                {link.label}
                <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-wave transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <button aria-label="Tìm kiếm" className="grid h-11 w-11 place-items-center text-paper/80 hover:text-wave">
              <Search className="h-[18px] w-[18px]" />
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
              className="grid h-11 w-11 place-items-center text-paper md:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="relative h-px w-full bg-white/15">
          <div
            className="absolute inset-y-0 left-0 bg-wave transition-[width] duration-150"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {menuOpen && (
        <div className="bg-brand-deep/95 px-5 pb-6 backdrop-blur-xl md:hidden">
          {NAV.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="flex min-h-16 items-center justify-between border-b border-white/12 text-paper"
            >
              <span className="display text-3xl normal-case">{link.label}</span>
              <ArrowUpRight className="h-5 w-5 text-wave" />
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

/**
 * `ready` re-runs the observer once the data-dependent sections exist. Store,
 * collections and map all render null until their data lands, so an observer
 * set up on mount alone would only ever see the hero.
 */
function Spine({ ready, muted }: { ready: boolean; muted: boolean }) {
  const [active, setActive] = useState(SPINE[0].id);
  /* The one section on a paper ground — the rail has to flip to ink there. */
  const light = active === "dong-how";

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    SPINE.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ready]);

  return (
    <nav
      aria-label="Vị trí trong trang"
      className="pointer-events-none fixed left-5 top-1/2 z-40 hidden -translate-y-1/2 transition-opacity duration-300 xl:block"
      style={{
        // The collections track is full-bleed and can be light, and the
        // revealed footer sits under the whole viewport; both carry their own
        // sense of place, so the spine steps aside rather than drawing over them.
        opacity: muted || active === "dong-collections" ? 0 : 1,
        visibility: muted || active === "dong-collections" ? "hidden" : "visible",
      }}
    >
      <ul className="space-y-4">
        {SPINE.map((s) => {
          const on = active === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="pointer-events-auto flex items-center gap-3 py-1"
                aria-current={on ? "true" : undefined}
              >
                <span
                  className={`block h-px transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    on
                      ? light
                        ? "w-10 bg-wave-ink"
                        : "w-10 bg-wave"
                      : light
                      ? "w-4 bg-ink/30"
                      : "w-4 bg-white/35"
                  }`}
                />
                <span
                  className={`text-[11px] tracking-[0.16em] transition-all duration-500 ${
                    on
                      ? light
                        ? "text-wave-ink opacity-100"
                        : "text-wave opacity-100"
                      : "opacity-0"
                  }`}
                >
                  {s.label.toUpperCase()}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ── hero: a full-viewport current of shop frames ──────────────────────── */

function CurrentHero({ frames }: { frames: ReturnType<typeof useLabData>["heroFrames"] }) {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const count = frames.length;

  useEffect(() => {
    if (reduced || count < 2) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % count), 5000);
    return () => clearInterval(timer);
  }, [reduced, count]);

  if (count === 0) return <div className="h-[100dvh] bg-brand" />;
  const frame = frames[active];

  return (
    <section
      id="dong-hero"
      className="relative h-[100dvh] overflow-hidden bg-brand"
      aria-roledescription="carousel"
      aria-label="Ảnh của Tí Coolture và các shop"
    >
      {frames.map((f, i) => (
        <div
          key={f.id}
          aria-hidden={i !== active}
          className="absolute inset-0"
          style={{
            opacity: i === active ? 1 : 0,
            transition: reduced ? "none" : "opacity 1200ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <img
            src={f.src}
            alt={
              f.shopId
                ? `Ảnh do ${f.shopName} gửi cho trang chủ Tí Coolture`
                : "Tí Coolture — hình mở đầu"
            }
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "auto"}
            className={`h-full w-full object-cover ${i === active && !reduced ? "lab-drift" : ""}`}
          />
        </div>
      ))}

      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-brand via-brand/35 to-brand/0 mix-blend-multiply" />

      {/* the wave signature, used once, as the mask edge between frame and page */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[12vh] w-full"
      >
        <path d="M0,64 C240,10 420,110 720,66 C1020,22 1220,104 1440,54 L1440,120 L0,120 Z" fill="var(--color-brand)" />
      </svg>

      <div className="relative z-10 flex h-full flex-col justify-end px-5 pb-[16vh] md:px-10 xl:px-24">
        <div className="max-w-5xl">
          <p key={`c-${frame.id}`} className="lab-wipe overflow-hidden">
            <span className="text-[11px] tracking-[0.22em] text-wave">
              {frame.shopId ? `SHOP GỬI · ${frame.shopName.toUpperCase()}` : "TÍ COOLTURE"}
            </span>
          </p>

          <h1 className="display mt-4 text-[clamp(2.75rem,8.4vw,7.5rem)] normal-case leading-[0.92] text-paper">
            Mỗi người một <span className="text-wave">TÍ</span> chất riêng
          </h1>

          <p key={`s-${frame.id}`} className="lab-wipe mt-5 max-w-xl overflow-hidden">
            <span className="text-base leading-relaxed text-white/75 md:text-lg">
              {frame.awaitingUpload ? `Chờ ảnh ${LANDSCAPE_SPEC} từ ${frame.shopName}` : frame.caption}
            </span>
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#dong-store"
              className="group inline-flex items-center gap-3 rounded-full bg-paper py-2 pl-6 pr-2 text-sm font-semibold text-ink transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105"
            >
              Cuộn để xem
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-wave transition-transform duration-500 group-hover:translate-y-0.5">
                <ArrowRight className="h-4 w-4 rotate-90" />
              </span>
            </a>
            {frame.shopId && (
              <Link
                to={`/stores/${frame.shopId}`}
                className="inline-flex items-center gap-2 border-b border-white/40 pb-1 text-sm text-paper transition-colors hover:border-wave hover:text-wave"
              >
                Ghé {frame.shopName}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        <div className="mt-10 flex items-center gap-3">
          {frames.map((f, i) => (
            <button
              key={f.id}
              onClick={() => setActive(i)}
              aria-label={`Xem ảnh ${i + 1}: ${f.shopName}`}
              aria-current={i === active}
              className="group relative h-8 flex-1 max-w-[7rem]"
            >
              <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/25" />
              <span
                className="absolute inset-y-0 left-0 top-1/2 h-0.5 -translate-y-1/2 bg-wave transition-[width] duration-500"
                style={{ width: i <= active ? "100%" : "0%" }}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── what's in store: two lanes running against each other ─────────────── */

function StoreTile({ product, onOpen }: { key?: string; product: Product; onOpen: (p: Product) => void }) {
  return (
    <button
      onClick={() => onOpen(product)}
      className="lab-snap-item group mr-6 w-[78vw] shrink-0 text-left sm:w-[26rem] lg:mr-10 lg:w-[30rem]"
    >
      {/* landscape thumbnail — the ratio every shop must supply */}
      <div className="relative aspect-video overflow-hidden bg-white/5">
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
        />
      </div>
      <div className="mt-4 flex items-baseline gap-4 border-t border-white/15 pt-3">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[11px] tracking-[0.16em] text-wave">
            {product.storeName.toUpperCase()}
          </span>
          <span className="mt-1 block truncate text-lg font-medium text-paper">{product.name}</span>
        </span>
        <span className="shrink-0 text-sm tabular-nums text-white/70">
          {formatPrice(product.price)}
        </span>
      </div>
    </button>
  );
}

function StoreLane({
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
      <div className="lab-snap-x lab-no-scrollbar flex overflow-x-auto px-5 md:px-10">
        {products.map((p) => (
          <StoreTile key={p.id} product={p} onOpen={onOpen} />
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
              <StoreTile key={`${copy}-${p.id}`} product={p} onOpen={onOpen} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function StoreMarquee({ products, onOpen }: { products: Product[]; onOpen: (p: Product) => void }) {
  const half = Math.ceil(products.length / 2);

  return (
    <section id="dong-store" className="bg-brand py-20 text-paper md:py-28">
      <div className="px-5 md:px-10 xl:px-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="display text-[clamp(2rem,5.6vw,4.5rem)] normal-case leading-none">
            What&rsquo;s in store
          </h2>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 border-b border-white/40 pb-1 text-sm transition-colors hover:border-wave hover:text-wave"
          >
            Xem tất cả
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-12 space-y-8">
        <StoreLane products={products.slice(0, half)} direction="left" duration="58s" onOpen={onOpen} />
        <StoreLane products={products.slice(half)} direction="right" duration="70s" onOpen={onOpen} />
      </div>

      <p className="mt-10 px-5 text-xs text-white/50 md:px-10 xl:px-24">{PRICE_NOTE}</p>
    </section>
  );
}

/* ── how it works ───────────────────────────────────────────────────────
   After dontboardme.com, measured off the live page: four cards ~450×520 in a
   row, each overlapping the previous by roughly 30%, revealing one after
   another as the section enters. The step title and its index are set at the
   same size with the caption tiny beneath.

   This is the page's one white section — the 30% of the 60/30/10 ratio — with
   violet cards on it and the index in teal. */

function HowItWorks() {
  const [revealed, setRevealed] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setRevealed(true);
      return;
    }
    const el = sectionRef.current;
    if (!el) return;

    // The copy must never be gated on an animation firing, so anything that
    // stops the observer reaching us still ends with the cards on screen.
    if (typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      // Fire as soon as the fan starts to appear, or the first card is on
      // screen and still blank while the visitor waits for it.
      { rootMargin: "0px 0px -8% 0px", threshold: 0.04 }
    );
    observer.observe(el);

    // Safety net: long enough that a normal scroll always wins the race.
    const failsafe = window.setTimeout(() => setRevealed(true), 6000);

    return () => {
      observer.disconnect();
      window.clearTimeout(failsafe);
    };
  }, [reduced]);

  return (
    <section ref={sectionRef} id="dong-how" className="bg-paper py-20 text-ink md:py-28">
      <div className="px-5 md:px-10 xl:px-24">
        <p className="text-[11px] tracking-[0.22em] text-wave-ink">CÁCH ĐẶT HÀNG</p>
      </div>

      {/* the fan: cards overlap, later ones on top */}
      <ol className="mt-12 flex flex-col items-stretch px-5 md:mt-16 md:flex-row md:justify-center md:px-6">
        {HOW_STEPS.map((step, i) => (
          <li
            key={step.n}
            className={`relative ${i > 0 ? "-mt-5 md:mt-0 md:-ml-[7vw]" : ""} md:w-[26vw] md:max-w-[27rem]`}
            style={{
              zIndex: i + 1,
              opacity: revealed ? 1 : 0,
              transform: revealed ? "translateY(0)" : "translateY(42px)",
              transition: reduced
                ? "none"
                : `opacity 620ms cubic-bezier(0.16,1,0.3,1) ${i * 130}ms, transform 620ms cubic-bezier(0.16,1,0.3,1) ${i * 130}ms`,
            }}
          >
            {/* the paper ring is what makes the overlap legible */}
            <div
              className={`flex h-full flex-col rounded-[1.75rem] p-6 ring-4 ring-paper md:min-h-[22rem] md:p-8 ${
                i < HOW_STEPS.length - 1 ? "md:pr-[calc(7vw+1.5rem)]" : ""
              } ${i % 2 === 0 ? "bg-brand" : "bg-brand-deep"} text-paper`}
            >
              <h3 className="display text-[clamp(1.4rem,2.3vw,2rem)] normal-case leading-[1.05]">
                {step.vi.title}
              </h3>
              <p
                className="display mt-4 text-[clamp(2.5rem,4.2vw,3.5rem)] normal-case leading-none text-wave"
                aria-hidden="true"
              >
                {step.n}.
              </p>
              <p className="mt-6 max-w-[32ch] text-[13px] leading-relaxed text-white/75">
                {step.vi.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {/* the turn into collections */}
      <div className="mt-16 px-5 md:px-10 xl:px-24">
        <div className="flex flex-wrap items-end justify-between gap-6 border-t border-ink/15 pt-8">
          <div>
            <h3 className="display text-[clamp(1.75rem,4vw,3rem)] normal-case leading-[1.05]">
              {HOW_TURN.vi.title}
            </h3>
            <p className="mt-3 max-w-[46ch] text-base leading-relaxed text-ink/65">
              {HOW_TURN.vi.body}
            </p>
          </div>
          <a
            href="#dong-collections"
            className="group inline-flex items-center gap-3 rounded-full bg-brand py-2 pl-6 pr-2 text-sm font-semibold text-paper transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105"
          >
            Xem bộ sưu tập
            <span className="grid h-9 w-9 place-items-center rounded-full bg-paper text-brand transition-transform duration-500 group-hover:translate-y-0.5">
              <ArrowRight className="h-4 w-4 rotate-90" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

/* ── hidden gems ────────────────────────────────────────────────────────
   Ported from the live homepage (src/views/Homepage.tsx): a persistent tab on
   the right edge opening the editor's pick. UX-TASKS 2.3 also asks the tab to
   hide on scroll-down, so it rides the same chrome hook as the nav. */

function HiddenGems({ gems }: { gems: Array<{ product: Product; note: string }> }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { hidden } = useAutoHideChrome({ locked: true });
  const gem = gems[0];

  if (!gem) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => {
            setOpen(true);
            triggerWebhook("CURATED_GEM_OPENED", { productId: gem.product.id });
          }}
          aria-label="Viên ngọc ẩn — xem sản phẩm Tí chọn"
          className="fixed right-0 top-1/2 z-40 grid h-14 w-12 place-items-center rounded-l-2xl bg-wave text-ink shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-95"
          style={{ transform: hidden ? "translate(100%, -50%)" : "translate(0, -50%)" }}
        >
          <StarIcon className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Viên ngọc ẩn"
          className="lab-plate-in fixed bottom-6 right-6 z-50 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-[2rem] border border-ink/10 bg-paper p-2 text-ink shadow-[0_25px_60px_rgba(18,8,31,0.4)]"
        >
          <div className="overflow-hidden rounded-[1.625rem] bg-paper">
            <div className="relative aspect-video overflow-hidden bg-paper-warm">
              <img src={gem.product.images[0]} alt={gem.product.name} className="h-full w-full object-cover" />
              <button
                onClick={() => setOpen(false)}
                aria-label="Đóng"
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-paper backdrop-blur-md transition-colors hover:bg-black"
              >
                <X className="h-4 w-4" />
              </button>
              <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold uppercase text-paper">
                ✦ Tí chọn
              </span>
            </div>

            <button
              onClick={() => {
                triggerWebhook("CURATED_GEM_CLICKED", { productId: gem.product.id });
                navigate(`/products/${gem.product.id}`, { viewTransition: true });
              }}
              className="block w-full space-y-2 p-5 text-left transition-colors hover:bg-paper-warm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-brand">
                  {gem.product.storeName}
                </span>
                <span className="text-sm font-bold">{formatPrice(gem.product.price)}</span>
              </div>
              <h4 className="line-clamp-1 text-base font-medium leading-snug">{gem.product.name}</h4>
              <p className="line-clamp-2 text-xs italic text-ink/75">
                &ldquo;{gem.note || "Tác phẩm được ban biên tập Tí tuyển chọn."}&rdquo;
              </p>
              <span className="flex items-center justify-between pt-2 text-xs font-semibold text-brand">
                Xem tác phẩm
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ── collections: a pinned track whose 60/30/10 window slides forward ────
   wireframes.html MO-7 — used once per site, wrapper roughly three screens,
   track completes before the pin releases, segmented indicator.

   The window is a falloff over the panel list: the panel under the cursor
   takes 60%, the next 30%, the one after 10%, everything else nothing. Moving
   the cursor forward by one slot per step slides the whole window, so the last
   collection hands over to the "Xem thêm" panel exactly as the pin ends. */

/* Panel rotation carries the 60/30/10 ratio through the biggest band on the
   page: violet leads, teal gets one real 60% moment rather than only the
   closing sliver, white and ink split the rest. */
const PANEL_TONES = [
  { fill: "bg-brand", text: "text-paper", rule: "border-white/25", muted: "text-white/65" },
  { fill: "bg-wave", text: "text-ink", rule: "border-ink/25", muted: "text-ink/65" },
  { fill: "bg-paper", text: "text-ink", rule: "border-ink/15", muted: "text-ink/60" },
  { fill: "bg-brand-deep", text: "text-paper", rule: "border-white/25", muted: "text-white/65" },
  { fill: "bg-ink", text: "text-paper", rule: "border-white/20", muted: "text-white/60" },
];

/** 60 / 30 / 10 falloff, continuous in `d` so intermediate scroll positions interpolate. */
function slotWeight(d: number): number {
  if (d <= -1 || d > 3) return 0;
  if (d < 0) return 60 * (1 + d);
  if (d <= 1) return 60 - 30 * d;
  if (d <= 2) return 30 - 20 * (d - 1);
  return 10 - 10 * (d - 2);
}

function PinnedCollections({
  collections,
  onOpen,
}: {
  collections: LabCollection[];
  onOpen: (p: Product) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const wide = useMediaQuery("(min-width: 1024px)");
  const reduced = useReducedMotion();
  const pinned = wide && !reduced && collections.length > 0;

  /* panels = every collection plus the closing "Xem thêm" card */
  const panelCount = collections.length + 1;
  const cursorMax = Math.max(0, panelCount - 3);

  useEffect(() => {
    if (!pinned) {
      setProgress(0);
      return;
    }
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const wrap = wrapRef.current;
        if (!wrap) return;
        const rect = wrap.getBoundingClientRect();
        const distance = rect.height - window.innerHeight;
        setProgress(distance > 0 ? Math.min(1, Math.max(0, -rect.top / distance)) : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pinned]);

  const cursor = progress * cursorMax;

  const weights = useMemo(() => {
    const raw = Array.from({ length: panelCount }, (_, i) => slotWeight(i - cursor));
    const total = raw.reduce((a, b) => a + b, 0) || 1;
    return raw.map((w) => (w / total) * 100);
  }, [panelCount, cursor]);

  if (collections.length === 0) return null;

  const seeMoreIndex = panelCount - 1;

  const renderPanel = (i: number, frac: number, stacked: boolean) => {
    const tone = PANEL_TONES[i % PANEL_TONES.length];
    const isSeeMore = i === seeMoreIndex;
    const collection = isSeeMore ? null : collections[i];

    /* Below ~14% only the vertical rail is legible, so the body fades out
       rather than squeezing into an unreadable column. */
    const bodyOpacity = stacked ? 1 : Math.min(1, Math.max(0, (frac - 0.14) / 0.12));

    return (
      <div
        key={isSeeMore ? "panel-see-more" : collection!.id}
        className={`relative flex overflow-hidden ${tone.fill} ${tone.text} ${
          stacked ? "min-h-[22rem] w-full" : "h-full shrink-0"
        }`}
        style={stacked ? undefined : { width: `${frac * 100}%`, transition: "none" }}
      >
        {/* always-legible rail, so a 10% panel still says what it is */}
        <div className={`flex shrink-0 flex-col items-center justify-between border-r ${tone.rule} px-3 py-6`}>
          <span className="text-[11px] tabular-nums tracking-[0.16em] opacity-60">
            {isSeeMore ? "→" : collection!.index}
          </span>
          <span
            className="text-[11px] tracking-[0.24em] opacity-80"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {isSeeMore ? "XEM THÊM" : collection!.name.toUpperCase()}
          </span>
          <span aria-hidden="true" className="h-6 w-px bg-current opacity-25" />
        </div>

        <div
          className="min-w-0 flex-1 overflow-hidden p-6 lg:p-10"
          style={{ opacity: bodyOpacity, transition: "opacity 220ms linear" }}
          aria-hidden={bodyOpacity === 0}
        >
          {isSeeMore ? (
            <div className="flex h-full flex-col justify-between">
              <h3 className="display text-[clamp(2rem,3.6vw,3.25rem)] normal-case leading-[1.02]">
                Còn nhiều bộ sưu tập khác
              </h3>
              <Link
                to="/products"
                className="mt-6 inline-flex w-fit items-center gap-3 border-b border-current pb-1 text-sm font-semibold"
              >
                Xem thêm
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="display text-[clamp(2rem,3.6vw,3.25rem)] normal-case leading-[1.02]">
                  {collection!.name}
                </h3>
                <span className={`shrink-0 text-[11px] tabular-nums tracking-[0.16em] ${tone.muted}`}>
                  {String(collection!.items.length).padStart(2, "0")} MÓN
                </span>
              </div>

              {/* Strip centres in the room the title leaves, so a 68vh panel
                  does not sit with two thirds of itself empty. */}
              <div className="lab-snap-x lab-no-scrollbar mt-6 flex flex-1 items-center gap-4 overflow-x-auto">
                {collection!.items.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onOpen(p)}
                    className="lab-snap-item group w-[60vw] shrink-0 text-left sm:w-[17rem] lg:w-[19rem]"
                  >
                    <div className="aspect-video overflow-hidden bg-current/10">
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                      />
                    </div>
                    <p className="mt-2 truncate text-sm font-medium">{p.name}</p>
                    <p className={`mt-0.5 truncate text-xs ${tone.muted}`}>{formatPrice(p.price)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* Wrapper is ~one viewport per cursor step plus one to hold the pin. */
  const runHeight = pinned ? `${100 + cursorMax * 90}vh` : undefined;

  return (
    <section id="dong-collections" className="border-t border-white/20 bg-brand text-paper">
      <div className="px-5 pt-20 md:px-10 md:pt-28 xl:px-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="display text-[clamp(2rem,5.6vw,4.5rem)] normal-case leading-none">
            Bộ sưu tập
          </h2>
          <p className="text-xs text-white/50">
            Tên bộ sưu tập là placeholder — chờ ban biên tập đặt tên thật.
          </p>
        </div>
      </div>

      {pinned ? (
        <div ref={wrapRef} style={{ height: runHeight }} className="mt-10">
          <div className="sticky top-0 flex h-[100dvh] flex-col justify-center">
            <div className="flex h-[68vh] w-full overflow-hidden">
              {weights.map((w, i) => renderPanel(i, w / 100, false))}
            </div>

            {/* segmented indicator, one segment per collection (MO-7) */}
            <div className="mt-6 flex gap-2 px-5 md:px-10 xl:px-24" aria-hidden="true">
              {collections.map((c, i) => {
                const fill = Math.min(1, Math.max(0, progress * collections.length - i));
                return (
                  <span key={c.id} className="relative h-px flex-1 bg-white/20">
                    <span
                      className="absolute inset-y-0 left-0 bg-wave"
                      style={{ width: `${fill * 100}%` }}
                    />
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-10 space-y-4 px-5 pb-4 md:px-10 xl:px-24">
          {Array.from({ length: panelCount }, (_, i) => renderPanel(i, 1, true))}
        </div>
      )}
    </section>
  );
}

/* ── map strip ──────────────────────────────────────────────────────────
   After bangkokartcity.org's "Discover Bangkok Art City": flat illustrated
   island on a dark ground, teardrop pins, nothing else. Arrows page between
   districts; the map itself is the link into /kham-pha, where the route and
   the full stop list live. */

function MapStrip({ routes }: { routes: TouristRoute[] }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const reduced = useReducedMotion();

  const route = routes[page];
  const plan = route ? planFor(route.id) : null;
  if (!route || !plan) return null;

  const island = islandBlobs(route.stops);
  const turn = (delta: number) => setPage((p) => (p + delta + routes.length) % routes.length);
  const openDistrict = () => navigate(`/kham-pha/${route.id}`, { viewTransition: true });

  return (
    <section id="dong-map" className="border-t border-white/20 bg-ink py-20 text-paper md:py-28">
      <div className="px-5 text-center md:px-10">
        <h2 className="display text-[clamp(2.25rem,6.4vw,5rem)] normal-case leading-none text-wave">
          Khám phá Sài Gòn
        </h2>
        <p className="mt-4 text-[13px] tracking-[0.16em] text-white/60">
          {plan.district.toUpperCase()} · {route.stops.length} ĐIỂM · {plan.walk}
        </p>
      </div>

      <div className="relative mt-10 flex items-center gap-2 px-2 md:gap-6 md:px-10">
        <button
          onClick={() => turn(-1)}
          aria-label="Quận trước"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/25 transition-colors hover:border-wave hover:text-wave md:h-14 md:w-14"
        >
          <ArrowRight className="h-5 w-5 rotate-180" />
        </button>

        {/* the whole island is the link into /kham-pha */}
        <button
          onClick={openDistrict}
          aria-label={`Mở bản đồ ${plan.district} và danh sách điểm dừng`}
          className="group relative min-w-0 flex-1 cursor-pointer"
        >
          <div className="relative mx-auto aspect-[4/3] w-full max-w-4xl md:aspect-[16/9]">
            <svg
              viewBox="0 0 800 600"
              className="h-full w-full overflow-visible transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02]"
              aria-hidden="true"
            >
              <defs>
                <clipPath id="lab-island-clip">
                  {island.map((b, i) => (
                    <ellipse key={i} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} />
                  ))}
                </clipPath>
              </defs>
              {/* One landmass derived from the stops, so every pin stands on
                  land. The blobs share a fill and a group opacity, so they
                  merge into a single silhouette instead of stacking edges. */}
              <g fill="var(--color-wave)">
                {island.map((b, i) => (
                  <ellipse key={i} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} />
                ))}
              </g>
              {/* hand-drawn blocks as internal texture, clipped to the island */}
              <g clipPath="url(#lab-island-clip)">
                {plan.shapes.map((d, i) => (
                  <path key={i} d={d} fill="var(--color-wave-ink)" fillOpacity={0.16 + i * 0.05} />
                ))}
              </g>
              {/* the waterway */}
              <path
                d={plan.axis}
                fill="none"
                stroke="var(--color-brand)"
                strokeWidth="20"
                strokeLinecap="round"
                opacity="0.85"
              />
            </svg>

            {/* teardrop pins, tip on the coordinate */}
            {route.stops.map((stop, i) => (
              <span
                key={stop.id}
                style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
                className="pointer-events-none absolute block -translate-x-1/2 -translate-y-full"
              >
                <span
                  className="relative block h-11 w-8 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:h-14 md:w-10"
                  style={{
                    transform: reduced ? undefined : undefined,
                  }}
                >
                  <svg viewBox="0 0 40 52" className="h-full w-full drop-shadow-[0_6px_10px_rgba(18,8,31,0.45)]">
                    <path
                      d="M20 0C31 0 40 9 40 20c0 12-13 24-18 31a2.5 2.5 0 0 1-4 0C13 44 0 32 0 20 0 9 9 0 20 0Z"
                      fill="var(--color-paper)"
                    />
                  </svg>
                  <span className="absolute inset-x-0 top-[14%] text-center text-sm font-bold text-ink md:text-base">
                    {i + 1}
                  </span>
                </span>
              </span>
            ))}
          </div>

          <span className="mt-6 inline-flex items-center gap-2 border-b border-transparent pb-1 text-sm text-white/70 transition-colors group-hover:border-wave group-hover:text-wave">
            Mở lộ trình
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </button>

        <button
          onClick={() => turn(1)}
          aria-label="Quận sau"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/25 transition-colors hover:border-wave hover:text-wave md:h-14 md:w-14"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}

/* ── reveal footer ──────────────────────────────────────────────────────
   wireframes.html MO-4. Stationary full-viewport underlay; the content sheet
   above carries an opaque background and a bottom margin equal to the footer
   height. The wordmark is the brand lockup as SVG — vector, so the diacritic
   cannot clip — scrubbing opacity 0.25 → 1 and translateY 26 → 0. */

const SITEMAP = [
  { to: "/products", label: "Sản phẩm" },
  { to: "/stores", label: "Shop" },
  { to: "/kham-pha", label: "Khám phá" },
  { to: "/tui-minh", label: "Tạp chí" },
  { to: "/gioi-thieu", label: "Về Tí" },
  { to: "/hop-tac", label: "Hợp tác" },
  { to: "/faq", label: "FAQ" },
  { to: "/dieu-khoan", label: "Điều khoản" },
  { to: "/bao-mat", label: "Bảo mật" },
];

/* Structural ref type — the project has no @types/react, so `React.RefObject`
   has no namespace to resolve against. */
/** How much of the stationary footer the content sheet has uncovered, 0 → 1. */
function useRevealProgress(sheetRef: { current: HTMLDivElement | null }): number {
  const [reveal, setReveal] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setReveal(1);
      return;
    }
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const sheet = sheetRef.current;
        if (!sheet) return;
        const bottom = sheet.getBoundingClientRect().bottom;
        const vh = window.innerHeight || 1;
        setReveal(Math.min(1, Math.max(0, 1 - bottom / vh)));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced, sheetRef]);

  return reveal;
}

function RevealFooter({ reveal }: { reveal: number }) {
  return (
    <footer
      className="fixed inset-x-0 bottom-0 z-0 flex h-[100dvh] flex-col justify-between overflow-hidden bg-brand px-5 pb-[8vh] pt-24 text-paper md:px-10 xl:px-24"
      aria-label="Chân trang"
    >
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1fr_auto]">
        <div className="max-w-sm">
          <p className="text-sm leading-relaxed text-white/80">
            Nơi tuyển chọn local brand và artist Việt.
          </p>
          <a
            href="mailto:hello@ticoolture.vn"
            className="mt-4 inline-flex min-h-11 items-center text-sm text-wave hover:underline"
          >
            hello@ticoolture.vn
          </a>
        </div>

        <nav aria-label="Sơ đồ trang">
          <ul className="grid grid-cols-2 gap-x-10 sm:grid-cols-3">
            {SITEMAP.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="inline-flex min-h-11 items-center text-sm text-white/85 transition-colors hover:text-wave"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* The lockup, scrubbed — vector, so Í can never clip.
          Sized off the room left in the panel rather than off viewport width:
          at 1440px a full-width lockup is 878px tall and pushes the legal row
          out of a 900px footer. flex-1 + min-h-0 lets it take what is left and
          no more, which also keeps the bottom clearance the spec asks for. */}
      <div
        className="flex min-h-0 flex-1 items-center justify-center py-8"
        style={{
          opacity: 0.25 + reveal * 0.75,
          transform: `translateY(${(1 - reveal) * 26}px)`,
          willChange: "opacity, transform",
        }}
      >
        <Brandmark
          className="h-full max-h-full w-auto max-w-full"
          body="var(--color-paper)"
          wave="var(--color-wave)"
          title="Tí Coolture"
        />
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-white/20 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 text-xs text-white/60">© 2026 Tí Coolture</p>
        <p className="m-0 text-xs text-white/60">
          Tí Coolture không bán hàng và không xử lý giao dịch.
        </p>
        <p className="m-0 text-xs text-white/60">
          <span className="text-paper">VI</span> / EN
        </p>
      </div>
    </footer>
  );
}

/* ── page ───────────────────────────────────────────────────────────────── */

export default function DirectionC() {
  const navigate = useNavigate();
  const { loading, error, reload, heroFrames, popular, collections, routes, gems } = useLabData();
  const sheetRef = useRef<HTMLDivElement>(null);
  const reveal = useRevealProgress(sheetRef);

  const open = useCallback(
    (p: Product) => navigate(`/products/${p.id}`, { viewTransition: true }),
    [navigate]
  );

  /* The sheet's bottom margin must equal the footer height, or the last row of
     the footer is unreachable (UX-FOUNDATIONS §4.2, open note 2). */
  useLayoutEffect(() => {
    document.documentElement.style.scrollBehavior = "auto";
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  return (
    <div className="bg-brand font-sans text-paper">
      <CurrentNav />
      <Spine ready={!loading && !error} muted={reveal > 0.02} />
      <HiddenGems gems={gems} />
      <RevealFooter reveal={reveal} />

      {/* content sheet — opaque, scrolls over the stationary footer */}
      <div ref={sheetRef} className="relative z-10 bg-brand" style={{ marginBottom: "100dvh" }}>
        <CurrentHero frames={heroFrames} />

        {loading ? (
          <div className="flex gap-6 overflow-hidden px-5 py-24 md:px-10" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-video w-[30rem] shrink-0 animate-pulse bg-white/8" />
            ))}
          </div>
        ) : error ? (
          <div className="mx-auto max-w-md px-5 py-24 text-center">
            <p className="text-base font-medium">Không tải được danh sách sản phẩm.</p>
            <button onClick={reload} className="mt-4 min-h-11 text-sm text-wave underline underline-offset-4">
              Thử lại
            </button>
          </div>
        ) : (
          <StoreMarquee products={popular} onOpen={open} />
        )}

        <HowItWorks />
        <PinnedCollections collections={collections} onOpen={open} />
        <MapStrip routes={routes} />
      </div>
    </div>
  );
}
