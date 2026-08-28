import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDown, ArrowRight, ArrowUpRight, StarIcon, X } from "lucide-react";
import { useAutoHideChrome, useMediaQuery, useReducedMotion } from "../lib/useAutoHideChrome";
import {
  formatPrice,
  PRICE_NOTE,
  useHomeData,
  LANDSCAPE_SPEC,
  type HomeCollection,
} from "../home/homeData";
import Brandmark from "../components/Brandmark";
import { triggerWebhook } from "../lib/dbService";
import type { Product, TouristRoute } from "../types";
import BrandSurround from "../components/BrandSurround";
import DistrictMap from "../home/DistrictMap";
import "../home/home.css";

/* ═══════════════════════════════════════════════════════════════════════════
   THE HOMEPAGE — "DÒNG" (the current)

   Chosen 26/08 out of the four exploration directions and folded in here from
   src/lab/DirectionC.tsx, which is now deleted along with A, B, C4 and the
   three brand-device studies.

   The idea it was chosen for: the site behaves like one continuous motion
   rather than a stack of sections. Nothing sits in a card; hairlines and
   full-bleed colour fields carry the structure instead.

   Sections, in order:
     · Hero — Direction A's card deck of shop frames on the violet field, with
       the identity marks in the violet around it (BrandSurround).
     · What's in store — two counter-running marquee lanes, square tiles.
     · How it works — four cards overlapping, revealing in sequence on scroll.
     · Collections — a pinned track whose 60/30/10 window slides forward.
     · Map — one strip; the island opens /discover, each pin opens its own stop.
     · Footer — MO-4 reveal: stationary underlay, sheet scrolling over it.

   What changed on 26/08 when it was folded in:
     · The nav left this file. It is src/components/Header.tsx now, a pill
       shared by every page, so the homepage no longer ships its own chrome.
     · The hero is a deck rather than a full-bleed frame, and its headline is
       gone — that line is being set into the background artwork instead.
     · The Hidden Gems tab inverted: it appears when the nav hides.
     · Nothing on this page locks itself to 100dvh any more. See the note on
       HeroDeck — full-viewport sections were what overflowed on short Windows
       laptops while looking correct on a MacBook.
   ═══════════════════════════════════════════════════════════════════════════ */


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

/* ── chrome ─────────────────────────────────────────────────────────────
   The progress rail is deliberately *not* part of the header: the header
   hides on scroll-down, and a progress bar that disappears exactly while you
   are making progress is worse than none. It lives on its own fixed layer
   above everything. */

function ScrollProgress() {
  const { progress } = useAutoHideChrome();
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] bg-white/15"
      role="presentation"
    >
      <div
        className="h-full bg-wave transition-[width] duration-150"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}

/* Persistent scroll hint. An arrow rather than a pill, bobbing to point the
   way, and it stays until the visitor is past the collections — the point at
   which the page has clearly been understood as scrollable. */
function ScrollHint() {
  const [visible, setVisible] = useState(true);
  const reduced = useReducedMotion();

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const collections = document.getElementById("dong-collections");
        if (!collections) return;
        const passed = collections.getBoundingClientRect().bottom <= window.innerHeight;
        setVisible(!passed);
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
  }, []);

  return (
    <a
      href="#dong-store"
      aria-label="Cuộn xuống để xem tiếp"
      className="fixed bottom-7 left-1/2 z-40 grid h-12 w-12 -translate-x-1/2 place-items-center rounded-full bg-ink/70 text-paper backdrop-blur-sm transition-[opacity,background-color] duration-500 hover:bg-ink"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <ArrowDown className={`h-7 w-7 ${reduced ? "" : "lab-bob"}`} />
    </a>
  );
}


/* ── collaborate ────────────────────────────────────────────────────────
   The shops are the other half of the audience, and the map is where a shop
   owner is most likely to have just seen their own neighbourhood. */

function Collaborate() {
  return (
    <section className="bg-brand-deep px-5 pb-16 pt-6 text-center text-paper md:px-10 md:pb-20">
      <p className="text-[11px] tracking-[0.22em] text-white/75">DÀNH CHO CÁC SHOP</p>
      <h2 className="display mx-auto mt-4 max-w-[18ch] text-[clamp(1.9rem,4.6vw,3.5rem)] normal-case leading-[1.05]">
        Bạn làm đồ đẹp? Kể Tí nghe
      </h2>
      <p className="mx-auto mt-4 max-w-[48ch] text-sm leading-relaxed text-white/70">
        Tí không bán hàng và không lấy hoa hồng. Tụi mình chọn, viết, và đưa shop lên trang chủ.
      </p>
      <Link
        to="/about"
        className="group mt-8 inline-flex items-center gap-3 rounded-full bg-paper py-2 pl-6 pr-2 text-sm font-semibold text-ink transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105"
      >
        Hợp tác với tụi mình
        <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-paper transition-transform duration-500 group-hover:translate-x-0.5">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </Link>
    </section>
  );
}

/* ── hero: a deck of shop frames on the violet field ────────────────────
   Team direction (26/08): take Direction A's card display. The frames are
   cards stacked at a slight rotation rather than a full-bleed photograph, so
   the violet field stays visible around them — which is where the identity
   marks now live (see BrandSurround).

   The headline is gone on purpose. "Mỗi người một Tí chất riêng" is being set
   into the background artwork itself, so setting it in type here would print
   it twice.

   Height is content-driven, not 100dvh. The old hero locked itself to the
   viewport, which is what pushed the caption and the beads off the bottom of
   shorter Windows laptops; the deck now sizes from its own aspect ratio and
   the section takes whatever height that needs. */

function HeroDeck({ frames }: { frames: ReturnType<typeof useHomeData>["heroFrames"] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const count = frames.length;

  useEffect(() => {
    if (reduced || paused || count < 2) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % count), 5000);
    return () => clearInterval(timer);
  }, [reduced, paused, count]);

  if (count === 0) return <div className="min-h-[60vh] bg-brand" />;
  const frame = frames[active];

  return (
    <section
      id="dong-hero"
      className="relative overflow-hidden bg-brand px-5 pb-16 pt-[6.5rem] md:px-16 md:pb-24 md:pt-32 lg:px-24"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Ảnh của Tí Coolture và các shop"
    >
      {/* identity marks in the violet around the deck */}
      <BrandSurround />

      <div className="relative z-10 mx-auto max-w-[82rem]">
        {/* The deck. 4:5 on phones, 16:10 on tablets, 21:9 on desktop — and
            capped in vh so a short laptop viewport never has to scroll to see
            the whole card. */}
        <div className="relative aspect-[4/5] max-h-[calc(100dvh-10rem)] w-full sm:aspect-[16/10] lg:aspect-[16/9]">
          {frames.map((f, i) => {
            const rel = (i - active + count) % count;
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
                aria-hidden={rel !== 0}
                className="absolute inset-0 m-0 overflow-hidden rounded-[1.5rem] bg-paper-warm ring-1 ring-white/15 will-change-transform md:rounded-[2.5rem]"
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
                {rel === 0 && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink/70 to-transparent"
                  />
                )}
              </figure>
            );
          })}

          {/* attribution — the shop gets the front page, by name */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex flex-wrap items-end justify-between gap-3 p-3 md:p-6">
            <div key={frame.id} className="lab-pop pointer-events-auto">
              {frame.shopId ? (
                <Link
                  to={`/stores/${frame.shopId}`}
                  className="inline-flex items-center gap-3 rounded-full bg-paper py-2 pl-2 pr-5 text-ink transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105"
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
                <span className="inline-flex items-center gap-3 rounded-full bg-wave py-2.5 pl-4 pr-5 text-ink">
                  <span className="text-sm font-black">Tí Coolture</span>
                  <span className="text-[11px] font-medium">{frame.caption}</span>
                </span>
              )}
            </div>

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
      </div>
    </section>
  );
}

/* ── what's in store: two lanes running against each other ─────────────── */

function StoreTile({
  product,
  onOpen,
  index = 0,
}: {
  key?: string;
  product: Product;
  onOpen: (p: Product) => void;
  index?: number;
}) {
  return (
    <button
      onClick={() => onOpen(product)}
      className="lab-snap-item group mr-6 w-[62vw] shrink-0 text-left sm:w-[20rem] lg:mr-10 lg:w-[22rem]"
    >
      {/* Team direction (26/08): square and rounded. Square is also the ratio
          the product photographs are actually shot at — the landscape crop
          this used to force was cutting the top and bottom off every piece. */}
      <div className="relative aspect-square overflow-hidden rounded-[1.25rem] bg-white/5 md:rounded-[1.75rem]">
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
        />
      </div>
      <div className="mt-4 flex items-baseline gap-4 border-t border-white/15 pt-3">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[11px] tracking-[0.16em] text-white/70">
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
        {products.map((p, i) => (
          <StoreTile key={p.id} product={p} onOpen={onOpen} index={i} />
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
            {products.map((p, i) => (
              <StoreTile key={`${copy}-${p.id}`} product={p} onOpen={onOpen} index={i} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function StoreMarquee({ products, onOpen }: { products: Product[]; onOpen: (p: Product) => void }) {
  const half = Math.ceil(products.length / 2);
  /* Team 20/08: one lane is enough on a phone — two stacked marquees eat the
     screen and neither can be read while both are moving. */
  const twoLanes = useMediaQuery("(min-width: 768px)");

  return (
    <section id="dong-store" className="bg-brand pb-16 pt-10 text-paper md:pb-24 md:pt-12">
      {/* the title *is* the link through to the catalogue */}
      <div className="px-5 text-center md:px-10">
        <Link
          to="/products"
          className="group inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
        >
          <h2 className="display text-[clamp(2rem,5.6vw,4.5rem)] normal-case leading-none transition-colors group-hover:text-wave">
            What&rsquo;s in store
          </h2>
          {/* <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/35 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:border-wave group-hover:bg-wave group-hover:text-ink">
            <ArrowUpRight className="h-5 w-5" />
          </span> */}
        </Link>
      </div>

      <div className="mt-10 space-y-6">
        <StoreLane
          products={twoLanes ? products.slice(0, half) : products}
          direction="left"
          duration={twoLanes ? "58s" : "72s"}
          onOpen={onOpen}
        />
        {twoLanes && (
          <StoreLane products={products.slice(half)} direction="right" duration="70s" onOpen={onOpen} />
        )}
      </div>

      <p className="mt-8 px-5 text-center text-xs text-white/50 md:px-10">{PRICE_NOTE}</p>
    </section>
  );
}

/* ── how it works ───────────────────────────────────────────────────────
   Motion taken frame by frame off the reference clip (dontboardme.com):
   the section pins, and each scroll step lifts one more card up from below
   into the fan, left to right. Scrolling back lowers them again in reverse.
   Because the whole thing is driven by scroll *position* rather than a
   one-shot trigger, it is symmetric for free — there is no "played already"
   state to get stuck in.

   Card i is revealed by t = clamp(cursor − i, 0, 1): it rises from 55% below
   its slot, untilts, and fades in. */

function HowItWorks() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState(0);
  const wide = useMediaQuery("(min-width: 768px)");
  const reduced = useReducedMotion();
  const pinned = wide && !reduced;
  const steps = HOW_STEPS.length;

  useEffect(() => {
    if (!pinned) {
      setCursor(steps); // every card down, no pin, nothing hidden
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
        const p = distance > 0 ? Math.min(1, Math.max(0, -rect.top / distance)) : 0;
        // A little lead-in and a hold at the end, so the last card gets a beat
        // on screen before the pin releases.
        setCursor(Math.min(steps, p * (steps + 0.35)));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pinned, steps]);

  /* Roughly one comfortable scroll gesture per card. */
  const runHeight = pinned ? `${100 + steps * 55}vh` : undefined;

  const fan = (
    <ol className="flex flex-col items-stretch px-5 md:flex-row md:justify-center md:px-6">
      {HOW_STEPS.map((step, i) => {
        const t = Math.min(1, Math.max(0, cursor - i));
        const tilt = i % 2 === 0 ? -5 : 5;
        return (
          <li
            key={step.n}
            className={`relative ${i > 0 ? "-mt-5 md:mt-0 md:-ml-[7vw]" : ""} md:w-[26vw] md:max-w-[27rem]`}
            style={{
              zIndex: i + 1,
              opacity: pinned ? t : 1,
              transform: pinned
                ? `translateY(${(1 - t) * 55}%) rotate(${(1 - t) * tilt}deg)`
                : undefined,
              transformOrigin: "50% 100%",
              willChange: pinned ? "transform, opacity" : undefined,
            }}
            aria-hidden={pinned && t < 0.05}
          >
            <div
              className={`flex h-full flex-col rounded-[1.75rem] p-6 ring-4 ring-paper md:min-h-[clamp(13rem,33dvh,22rem)] md:p-[clamp(1.15rem,2.4dvh,2rem)] ${
                i < HOW_STEPS.length - 1 ? "md:pr-[calc(7vw+1.5rem)]" : ""
              } ${i % 2 === 0 ? "bg-brand" : "bg-brand-deep"} text-paper`}
            >
              <h3 className="display text-[clamp(1.25rem,min(2.3vw,3.2dvh),2rem)] normal-case leading-[1.05]">
                {step.vi.title}
              </h3>
              <p
                className="display mt-[clamp(0.5rem,1.6dvh,1rem)] text-[clamp(2rem,min(4.2vw,5.5dvh),3.5rem)] normal-case leading-none text-wave"
                aria-hidden="true"
              >
                {step.n}.
              </p>
              <p className="mt-[clamp(0.75rem,2.2dvh,1.5rem)] max-w-[32ch] text-[13px] leading-relaxed text-white/75">
                {step.vi.body}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );

  const header = (
    <div className="px-5 text-center md:px-0">
      <h2 className="display text-[clamp(1.75rem,min(5.6vw,7.5dvh),4.5rem)] normal-case leading-none text-ink">
        Cách đặt hàng
      </h2>
    </div>
  );

  if (!pinned) {
    return (
      <section id="dong-how" className="bg-paper py-16 text-ink md:py-24">
        {header}
        <div className="mt-10">{fan}</div>
      </section>
    );
  }

  return (
    <section id="dong-how" className="bg-paper text-ink">
      <div ref={wrapRef} style={{ height: runHeight }}>
        {/* Everything in this pane is sized from dvh, not rem. Pinned to the
            viewport height with rem-sized content, it fitted a 900px MacBook
            and clipped its last row on every shorter Windows laptop — which is
            the vertical overflow the team reported. */}
        <div className="sticky top-0 flex h-[100dvh] flex-col justify-center overflow-hidden pt-[clamp(3.25rem,7dvh,4.5rem)]">
          {header}
          {/* the fan tucks under the heading as it fills, the way the
              reference layers its cards over the title */}
          <div className="-mt-2">{fan}</div>

          {/* step counter, so the pin always says where you are */}
          <div className="mt-[clamp(0.75rem,2.5dvh,2rem)] flex justify-center gap-2" aria-hidden="true">
            {HOW_STEPS.map((step, i) => (
              <span
                key={step.n}
                className="h-px w-10 bg-ink/15"
              >
                <span
                  className="block h-full bg-wave-ink transition-[width] duration-200"
                  style={{ width: `${Math.min(1, Math.max(0, cursor - i)) * 100}%` }}
                />
              </span>
            ))}
          </div>
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
  // Team direction (26/08): the tab now does the OPPOSITE of the nav. Scrolling
  // down hides the nav and pushes this out; scrolling up brings the nav back
  // and takes this away — the two never occupy the screen at the same time.
  // This deliberately reverses UX-TASKS 2.3, which had the tab hiding with the
  // rest of the chrome.
  const { hidden } = useAutoHideChrome({ locked: open });
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
          aria-hidden={!hidden}
          tabIndex={hidden ? 0 : -1}
          className="fixed right-0 top-1/2 z-40 grid h-14 w-12 place-items-center rounded-l-2xl bg-wave text-ink shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-95"
          style={{ transform: hidden ? "translate(0, -50%)" : "translate(100%, -50%)" }}
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
  collections: HomeCollection[];
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
    const lead = collection?.items[0] ?? null;

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
            /* Team 20/08: one lead piece per collection, and the name never
               wraps. A strip of six thumbnails made the panel read as another
               product row; a single object reads as a choice someone made. */
            <div className="flex h-full flex-col">
              <div className="flex items-baseline justify-between gap-4">
                <h3
                  className="display truncate text-[clamp(1.5rem,2.6vw,2.5rem)] normal-case leading-[1.02]"
                  title={collection!.name}
                >
                  {collection!.name}
                </h3>
                <span
                  className={`shrink-0 whitespace-nowrap text-[11px] tabular-nums tracking-[0.16em] ${tone.muted}`}
                >
                  {String(collection!.items.length).padStart(2, "0")} MÓN
                </span>
              </div>

              {lead && (
                <button
                  onClick={() => onOpen(lead)}
                  className="group mt-6 flex min-h-0 flex-1 flex-col text-left"
                >
                  <span className="relative block min-h-0 flex-1 overflow-hidden bg-current/10">
                    <img
                      src={lead.images[0]}
                      alt={lead.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                    />
                  </span>
                  <span className="mt-3 flex items-baseline justify-between gap-4">
                    <span className="truncate text-base font-medium">{lead.name}</span>
                    <span className={`shrink-0 whitespace-nowrap text-sm ${tone.muted}`}>
                      {formatPrice(lead.price)}
                    </span>
                  </span>
                </button>
              )}
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
      <div className="px-5 pt-16 text-center md:px-10 md:pt-24">
        <h2 className="display mx-auto text-[clamp(2rem,5.6vw,4.5rem)] normal-case leading-none">
          Chưa biết mua gì?
        </h2>
        <p className="mx-auto mt-4 max-w-[46ch] text-base leading-relaxed text-white/70">
          Ngó thử mấy bộ sưu tập này xem, biết đâu lại đúng gu bạn.
        </p>
        <p className="mt-3 text-xs text-white/45">
          Tên bộ sưu tập là placeholder — chờ ban biên tập đặt tên thật.
        </p>
      </div>

      {pinned ? (
        <div ref={wrapRef} style={{ height: runHeight }} className="mt-6">
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
        <div className="mt-8 space-y-4 px-5 pb-4 md:px-10 xl:px-24">
          {Array.from({ length: panelCount }, (_, i) => renderPanel(i, 1, true))}
        </div>
      )}
    </section>
  );
}

/* ── ground blend ───────────────────────────────────────────────────────
   Team 20/08: "NEVER allow abrupt transitions, always aim for CONTINUITY."

   Every place two section grounds meet used to be a hard 1px edge. This is a
   band of the two colours ramping into each other, so the page changes ground
   the way the hero already does — by arriving somewhere, not by cutting. The
   brand variants layer their wave on top of the same seams. */

const GROUND: Record<string, string> = {
  brand: "var(--color-brand)",
  "brand-deep": "var(--color-brand-deep)",
  paper: "var(--color-paper)",
  ink: "var(--color-ink)",
};

function GroundBlend({
  from,
  to,
  height = "10vh",
}: {
  from: keyof typeof GROUND;
  to: keyof typeof GROUND;
  height?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none w-full"
      style={{
        height,
        marginBottom: -1,
        background: `linear-gradient(to bottom, ${GROUND[from]} 0%, ${GROUND[to]} 100%)`,
      }}
    />
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
  { to: "/about", label: "Tạp chí" },
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
      /* pt and pb are dvh-derived for the same reason the pinned How-it-works
         pane is: at 560px of viewport the rem-sized version put the legal row
         below the fold with no way to reach it. */
      className="fixed inset-x-0 bottom-0 z-0 flex h-[100dvh] flex-col justify-between overflow-hidden bg-brand px-5 pb-[clamp(0.85rem,6dvh,4rem)] pt-[clamp(3.75rem,11dvh,6.5rem)] text-paper md:px-10 xl:px-24"
      aria-label="Chân trang"
    >
      <div className="grid gap-[clamp(0.75rem,3.5dvh,2.5rem)] sm:grid-cols-2 lg:grid-cols-[1fr_auto]">
        <div className="max-w-sm">
          <p className="text-sm leading-relaxed text-white/80">
            Nơi tuyển chọn local brand và artist Việt.
          </p>
          <a
            href="mailto:hello@ticoolture.vn"
            className="mt-4 inline-flex min-h-11 items-center text-sm text-paper underline underline-offset-4 decoration-white/40 hover:decoration-paper"
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
        className="flex min-h-0 flex-1 items-center justify-center py-[clamp(0.25rem,2.5dvh,2rem)]"
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

      <div className="mt-[clamp(0.75rem,3dvh,2rem)] flex flex-col gap-[clamp(0.4rem,1.4dvh,0.75rem)] border-t border-white/20 pt-5 sm:flex-row sm:items-center sm:justify-between">
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

export default function Homepage() {
  const navigate = useNavigate();
  const { loading, error, reload, heroFrames, popular, collections, routes, gems } = useHomeData();
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
      <ScrollProgress />
      <ScrollHint />
      <HiddenGems gems={gems} />
      <RevealFooter reveal={reveal} />

      {/* content sheet — opaque, scrolls over the stationary footer */}
      <div ref={sheetRef} className="relative z-10 bg-brand" style={{ marginBottom: "100dvh" }}>
        <HeroDeck frames={heroFrames} />

        {loading ? (
          <div className="flex gap-6 overflow-hidden px-5 py-24 md:px-10" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-video w-[30rem] shrink-0 animate-pulse bg-white/8" />
            ))}
          </div>
        ) : error ? (
          <div className="mx-auto max-w-md px-5 py-24 text-center">
            <p className="text-base font-medium">Không tải được danh sách sản phẩm.</p>
            <button onClick={reload} className="mt-4 min-h-11 text-sm text-paper underline underline-offset-4">
              Thử lại
            </button>
          </div>
        ) : (
          <StoreMarquee products={popular} onOpen={open} />
        )}

        {/* violet → white */}
        <GroundBlend from="brand" to="paper" />
        <HowItWorks />

        {/* white → violet. The guidelines also offer a chapter-front device
            (flat field + ribbon, see BrandChapterDivider) but using it here
            would put a "Bộ sưu tập" title back above a section whose whole
            point is that it opens on "Chưa biết mua gì?" — so the wave, which
            is the book's transition device, carries the change of ground. */}
        {/* white → violet */}
        <GroundBlend from="paper" to="brand" />
        <PinnedCollections collections={collections} onOpen={open} />

        {/* violet → ink */}
        <GroundBlend from="brand" to="ink" />
        <DistrictMap
          routes={routes}
          onOpenRoute={(routeId) => navigate(`/discover/${routeId}`)}
          onPin={(routeId, stopId) => navigate(`/discover/${routeId}?start=${stopId}`)}
        />

        {/* ink → the deeper violet the collaborate band sits on */}
        <GroundBlend from="ink" to="brand-deep" />
        <Collaborate />
      </div>
    </div>
  );
}
