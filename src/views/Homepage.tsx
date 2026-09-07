import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDown, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, StarIcon, X } from "lucide-react";
import { useAutoHideChrome, useMediaQuery, useReducedMotion } from "../lib/useAutoHideChrome";
import { useDragTrack } from "../lib/useDragTrack";
import { useImageTone, type ImageTone } from "../lib/useImageTone";
import { useMarqueeTrack } from "../lib/useMarqueeTrack";
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
     · Collections — a draggable track of whole cards, paged, with the
       segment bar under it. Was a pinned scroll run until 26/08.
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
   shorter Windows laptops; the deck sizes from its own aspect ratio and the
   section takes whatever height that needs.

   Two changes on 07/09, both from the same note:

     · The ratio is option C from /lab/hero — a continuous function of the
       viewport width rather than three breakpoint steps. See the note on the
       card itself.
     · The deck is something you operate, not something you watch. Click and
       drag or press a chevron on a desktop; swipe on a phone. Autoplay stops
       for good at the first of those, because a deck that keeps advancing
       under someone who has taken hold of it is fighting them. */

/** The gesture has to clear this before it counts as a drag rather than a tap. */
const HERO_DRAG_THRESHOLD = 8;
/** Past this much travel — real or projected — the deck changes frame. */
const HERO_COMMIT_PX = 64;

/**
 * A bare chevron, coloured against whatever is under it.
 *
 * Team 07/09: "chỉ hiện viền mũi tên giống như dấu <,>, không hiện nút. 2 dấu
 * mũi tên màu trắng nếu background sáng, màu đen nếu background tối, có thể
 * khác màu nhau miễn là dễ thấy."
 *
 * The two halves of that note disagree, and the second one wins. Taken
 * literally the first half puts a white arrow on a bright photograph and a
 * black one on a dark photograph, which is the pairing that cannot be seen;
 * "miễn là dễ thấy" is the requirement the whole sentence is for. So each
 * chevron is measured against its own edge of the current frame and takes the
 * colour that stands out from it — which also delivers the "khác màu nhau"
 * literally, because a photograph that is bright on one side and dark on the
 * other gets two different arrows.
 *
 * No button: no fill, no ring, no plate. The stroke carries a drop-shadow in
 * the opposite tone, which is what keeps it readable across a busy edge where
 * a flat colour alone would break up.
 */
function DeckArrow({
  side,
  tone,
  onPress,
  label,
}: {
  side: "left" | "right";
  tone: ImageTone;
  onPress: () => void;
  label: string;
}) {
  const Glyph = side === "left" ? ChevronLeft : ChevronRight;
  const dark = tone === "dark";

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={label}
      className={`absolute top-1/2 z-40 hidden -translate-y-1/2 cursor-pointer p-2 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-110 active:scale-95 md:block ${
        side === "left" ? "left-1 md:left-2" : "right-1 md:right-2"
      }`}
      style={{ color: dark ? "var(--color-paper)" : "var(--color-ink)" }}
    >
      <Glyph
        className="h-9 w-9 lg:h-11 lg:w-11"
        strokeWidth={2.25}
        style={{
          filter: dark
            ? "drop-shadow(0 1px 6px rgba(18,8,31,0.75))"
            : "drop-shadow(0 1px 6px rgba(255,255,255,0.8))",
        }}
      />
    </button>
  );
}

function HeroDeck({ frames }: { frames: ReturnType<typeof useHomeData>["heroFrames"] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  /** Set on the first drag, swipe or chevron press, and never unset. */
  const [taken, setTaken] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const reduced = useReducedMotion();
  const wide = useMediaQuery("(min-width: 768px)");
  const count = frames.length;

  const cardRef = useRef<HTMLDivElement>(null);
  /* State, not a ref. Refs are attached after render and mutating one does not
     re-render, so reading it during render handed the tone probe the frame
     that was on its way out and the chevrons lagged a frame behind the
     photograph they were supposed to be measured against. */
  const [topImg, setTopImg] = useState<HTMLImageElement | null>(null);
  /** The card's live ratio, so the tone probe knows what object-cover kept. */
  const [boxRatio, setBoxRatio] = useState(16 / 9);

  const go = useCallback(
    (delta: number) => {
      setTaken(true);
      setActive((i) => (i + delta + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (reduced || paused || taken || count < 2) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % count), 5000);
    return () => clearInterval(timer);
  }, [reduced, paused, taken, count]);

  /* The ratio is a continuous function of the viewport now, so it has to be
     measured rather than read off a breakpoint. */
  useEffect(() => {
    const measure = () => {
      const el = cardRef.current;
      if (!el || !el.clientHeight) return;
      setBoxRatio(el.clientWidth / el.clientHeight);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [count]);

  const frame = count > 0 ? frames[active] : null;
  const toneLeft = useImageTone(topImg, boxRatio, "left", frame?.id ?? "");
  const toneRight = useImageTone(topImg, boxRatio, "right", frame?.id ?? "");

  /* The gesture. Same rules as the rest of the site's tracks — 1:1 while
     held, capture taken only once it is really a drag so a tap still opens
     the shop, and the landing decided from where the flick is going rather
     than where the finger stopped. The deck wraps, so there is no end to
     rubber-band against. */
  const onPointerDown = useCallback(
    (e: { pointerId: number; clientX: number; currentTarget: Element }) => {
      if (count < 2) return;
      const el = e.currentTarget as HTMLElement;
      const startX = e.clientX;
      let moved = false;
      let history: Array<{ t: number; x: number }> = [{ t: performance.now(), x: startX }];

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        if (!moved && Math.abs(dx) < HERO_DRAG_THRESHOLD) return;
        if (!moved) {
          try {
            el.setPointerCapture(ev.pointerId);
          } catch {
            /* capture is a nicety; moves still bubble here without it */
          }
          setDragging(true);
          setTaken(true);
        }
        moved = true;
        setDragX(dx);

        const now = performance.now();
        history.push({ t: now, x: ev.clientX });
        history = history.filter((h) => now - h.t < 90);
      };

      const onUp = (ev: PointerEvent) => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onUp);
        el.removeEventListener("pointercancel", onUp);
        try {
          el.releasePointerCapture(ev.pointerId);
        } catch {
          /* already released */
        }
        setDragging(false);
        setDragX(0);
        if (!moved) return;

        const dx = ev.clientX - startX;
        const first = history[0];
        const dt = Math.max(1, performance.now() - first.t);
        const velocity = ((ev.clientX - first.x) / dt) * 1000; // px/s
        // where the flick is heading, not where it let go
        const projected = dx + velocity * 0.12;

        if (Math.abs(projected) > HERO_COMMIT_PX) {
          setActive((i) => (i + (projected < 0 ? 1 : -1) + count) % count);
        }
      };

      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointercancel", onUp);
    },
    [count]
  );

  if (count === 0) return <div className="min-h-[60vh] bg-brand" />;

  const chrome = (
    <div className="pointer-events-none flex flex-wrap items-end justify-between gap-3 p-3 md:p-6">
            <div key={frame!.id} className="lab-pop pointer-events-auto">
              {frame!.shopId ? (
                <Link
                  to={`/stores/${frame!.shopId}`}
                  draggable={false}
                  className="inline-flex items-center gap-3 rounded-full bg-paper py-2 pl-2 pr-5 text-ink transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-wave text-sm font-black text-ink">
                    {String(active + 1).padStart(2, "0")}
                  </span>
                  <span className="text-left">
                    <span className="block text-sm font-black leading-tight">{frame!.shopName}</span>
                    <span className="block text-[11px] font-medium text-ink/55">
                      {frame!.awaitingUpload ? `Chờ ảnh ${LANDSCAPE_SPEC}` : frame!.caption}
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-brand" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-3 rounded-full bg-wave py-2.5 pl-4 pr-5 text-ink">
                  <span className="text-sm font-black">Tí Coolture</span>
                  <span className="text-[11px] font-medium">{frame!.caption}</span>
                </span>
              )}
            </div>

            <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-ink/40 p-2 backdrop-blur-md">
              {frames.map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setTaken(true);
                    setActive(i);
                  }}
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
  );



  return (
    <section
      id="dong-hero"
      className="relative overflow-hidden bg-brand px-5 pb-7 pt-[6.5rem] md:px-10 md:pt-32 lg:px-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Ảnh của Tí Coolture và các shop"
    >
      {/* identity marks in the violet around the deck */}
      <BrandSurround />

      <div className="relative z-10 w-full">
        {/* The deck.

            Ratio is option C from /lab/hero, chosen 07/09: one continuous
            function of the viewport width instead of the three breakpoint
            steps that were here (4:5 phone, 16:10 sm, 16:9 lg). It runs from
            5:4 at 375px to 16:9 at 1200 and holds there, so there is nowhere
            the shape jumps because the window moved a pixel, and the crop of
            the shop's 16:9 frame goes from 55% of its width to 30%.

            The two bounds that remain are the real ones: the column's width,
            and the height the card is allowed (--hero-reserve). Height wins
            at ordinary desktop shapes, which is what puts the card's bottom
            edge on the scroll arrow.

            Constraining the *width* rather than the height is deliberate and
            load-bearing: `aspect-ratio` with a max-height cannot both hold,
            and when the cap bit the card silently rendered at the wrong ratio
            with nothing to say so. Width is the smaller of the column and
            (available height × ratio), and the height follows from it. */}
        <div
          ref={cardRef}
          className="relative mx-auto w-full touch-pan-y [--hero-reserve:8.25rem] md:[--hero-reserve:9.75rem]"
          style={{
            ["--hero-ar" as string]:
              "clamp(1.25, calc(1.25 + (100vw - 375px) / 1562.5px), 1.7778)",
            aspectRatio: "var(--hero-ar)",
            maxWidth: "calc((100dvh - var(--hero-reserve)) * var(--hero-ar))",
            cursor: count > 1 ? (dragging ? "grabbing" : "grab") : undefined,
          }}
          onPointerDown={onPointerDown}
        >
          {frames.map((f, i) => {
            const rel = (i - active + count) % count;
            const isTop = rel === 0;

            /* The top card follows the pointer; the one behind it leans in as
               it goes, so the stack reads as one object being turned rather
               than a picture sliding off another picture. */
            const lead = dragging ? dragX : 0;
            const progress = Math.min(1, Math.abs(lead) / 160);

            const style =
              rel === 0
                ? {
                    transform: `translate3d(${lead}px,0,0) rotate(${lead * 0.012}deg) scale(1)`,
                    opacity: 1,
                    zIndex: 30,
                  }
                : rel === 1
                  ? {
                      transform: `translate3d(${2.2 - progress * 2.2}%,${-2.4 + progress * 2.4}%,0) rotate(${(1 - progress) * 2.2}deg) scale(${0.955 + progress * 0.045})`,
                      opacity: 1,
                      zIndex: 20,
                    }
                  : rel === 2
                    ? {
                        transform: "translate3d(-2.2%,-4%,0) rotate(-2.4deg) scale(0.915)",
                        opacity: 1,
                        zIndex: 10,
                      }
                    : { transform: "translate3d(0,-5%,0) scale(0.9)", opacity: 0, zIndex: 0 };

            return (
              <figure
                key={f.id}
                aria-hidden={!isTop}
                className="absolute inset-0 m-0 overflow-hidden rounded-[1.5rem] bg-paper-warm ring-1 ring-white/15 will-change-transform md:rounded-[2.5rem]"
                style={{
                  ...style,
                  transition:
                    reduced || dragging
                      ? "none"
                      : "transform 760ms var(--ease-brand), opacity 420ms ease",
                }}
              >
                <img
                  ref={isTop ? setTopImg : undefined}
                  src={f.src}
                  alt={
                    f.shopId
                      ? `Ảnh do ${f.shopName} gửi cho trang chủ Tí Coolture`
                      : "Tí Coolture — ảnh mở đầu"
                  }
                  fetchPriority={i === 0 ? "high" : "auto"}
                  loading={i === 0 ? "eager" : "lazy"}
                  draggable={false}
                  className="h-full w-full object-cover"
                />
                {isTop && wide && (
                  /* The scrim exists to carry the chrome. On a phone the
                     chrome is under the card now, so this would be darkening
                     two fifths of the photograph for nothing. */
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink/70 to-transparent"
                  />
                )}
              </figure>
            );
          })}

          {count > 1 && (
            <>
              <DeckArrow
                side="left"
                tone={toneLeft}
                onPress={() => go(-1)}
                label="Ảnh trước"
              />
              <DeckArrow
                side="right"
                tone={toneRight}
                onPress={() => go(1)}
                label="Ảnh tiếp theo"
              />
            </>
          )}

          {/* attribution and beads.

              Team 07/09: "hãy để cái chrome ở dưới, không có đè lên hình."
              On a phone the deck is 5:4 and about 280px tall, and a pill plus
              a row of beads laid over it takes a third of that — of the one
              picture the page opens on. So below the card there, on the
              violet, where the violet is doing nothing anyway.

              On a desktop it stays over the photograph, which is what the
              team's own drawing of the wide layout shows: the card is 744px
              tall there and the chrome costs it nothing. */}
          {wide && <div className="absolute inset-x-0 bottom-0 z-40">{chrome}</div>}
        </div>

        {/* on a phone the chrome is under the card, not on it */}
        {!wide && <div className="mt-1">{chrome}</div>}
      </div>
    </section>
  );
}

/* ── what's in store: two lanes running against each other ─────────────── */

function StoreTile({
  product,
  onOpen,
  blocked,
}: {
  key?: string;
  product: Product;
  onOpen: (p: Product) => void;
  /** True when the gesture that just ended was a drag, not a tap. */
  blocked?: () => boolean;
}) {
  return (
    <button
      onClick={() => {
        // a flick that comes to rest over a tile must not also open it
        if (blocked?.()) return;
        onOpen(product);
      }}
      draggable={false}
      className="lab-snap-item group mr-6 w-[62vw] shrink-0 text-left sm:w-[20rem] lg:mr-10 lg:w-[20rem]"
    >
      {/* Team direction (26/08): square and rounded. Square is also the ratio
          the product photographs are actually shot at — the landscape crop
          this used to force was cutting the top and bottom off every piece. */}
      <div className="relative aspect-square overflow-hidden rounded-[1.25rem] bg-white/5 md:rounded-[1.75rem]">
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          draggable={false}
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

/* Team feedback (07/09): "Thao tác vuốt ở What's in store trên PC chưa ổn."

   The lane keeps its ambient drift, but the drift is no longer the only thing
   that can move it: the whole row is grabbable now, on a mouse, a trackpad and
   a touchscreen alike, and a flick coasts on its own velocity before rejoining
   the drift. See useMarqueeTrack for why that cannot be done in CSS.

   Hover still holds the lane still — you stop it to read a tile — but stopping
   it is no longer a dead end, because you can now push it along yourself. */
function StoreLane({
  products,
  direction,
  speed,
  onOpen,
}: {
  products: Product[];
  direction: "left" | "right";
  /** Ambient drift in px/s. */
  speed: number;
  onOpen: (p: Product) => void;
}) {
  const [held, setHeld] = useState(false);
  const lane = useMarqueeTrack({
    speed: direction === "left" ? speed : -speed,
    paused: held,
  });

  if (products.length === 0) return null;

  return (
    <div
      /* touch-pan-y, so a vertical swipe still scrolls the page: the lane only
         claims the horizontal axis. */
      className={`overflow-hidden touch-pan-y ${lane.dragging ? "cursor-grabbing" : "cursor-grab"}`}
      onPointerEnter={(e) => {
        // a finger "enters" on touch down; only a hovering cursor should hold
        if (e.pointerType === "mouse") setHeld(true);
      }}
      onPointerLeave={() => setHeld(false)}
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={() => setHeld(false)}
      {...lane.handlers}
      role="group"
      aria-roledescription="carousel"
      aria-label="Sản phẩm nổi bật"
    >
      <div ref={lane.trackRef} className="flex w-max will-change-transform">
        {[0, 1].map((copy) => (
          /* Two copies: the second covers the seam when the first has drifted
             a full width off. Only the first is measured and only the first is
             read out — the second is the same products again. */
          <div
            key={copy}
            ref={copy === 0 ? lane.spanRef : undefined}
            className="flex"
            aria-hidden={copy === 1}
          >
            {products.map((p) => (
              <StoreTile
                key={`${copy}-${p.id}`}
                product={p}
                onOpen={onOpen}
                blocked={lane.didDrag}
              />
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
        {/* Speeds in px/s rather than a loop duration: the duration a CSS
            marquee takes depends on how much content it happens to hold, so
            two lanes with different counts ran at different speeds. These are
            the same two speeds the old durations worked out to on a laptop,
            now stated directly and independent of the catalogue's length. */}
        <StoreLane
          products={twoLanes ? products.slice(0, half) : products}
          direction="left"
          speed={twoLanes ? 34 : 26}
          onOpen={onOpen}
        />
        {twoLanes && (
          <StoreLane products={products.slice(half)} direction="right" speed={28} onOpen={onOpen} />
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
      <section id="dong-how" data-surface="light" className="bg-paper py-16 text-ink md:py-24">
        {header}
        <div className="mt-10">{fan}</div>
      </section>
    );
  }

  return (
    <section id="dong-how" data-surface="light" className="bg-paper text-ink">
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

/* ── collections: a draggable track, and a bar that says how far it runs ──
   Team 26/08: "Remove scroll interaction on 'Collections' section… 1st one
   simply replace scroll with click and drag and a bar below to signal there's
   more."

   What went — the pinned run (MO-7). The section was ~3 viewports tall and
   drove a 60/30/10 window across the panels from the document's own scroll
   position: the only way to reach collection 3 was to keep scrolling the
   page, and the only way back was to scroll up through it again. Panels
   squeezed to 10% of their width on the way past, which is why each one
   needed a vertical rail to stay legible while it was a sliver.

   What replaced it — one screen, whole cards, and the same drag physics the
   district map already runs on (useDragTrack: 1:1 while held, released at the
   pointer's own velocity, landing where the flick was going, rubber-banding
   at the ends). The bar below is the one in the sketch: the page you are on
   is a wide teal pill, the others are dots.

   The second direction the team asked for — the spring tabs from the sketch
   on page 1 — is in the lab at /lab/collections/2, so the two can be looked
   at side by side before one is chosen. */

/* Panel rotation still carries the 60/30/10 ratio, but the roles have moved.
   In the pinned version the panels butted edge to edge and filled the whole
   band, so one of them could be bg-brand and still read — its neighbours drew
   its edges. Cards with gaps between them have no neighbours to do that, and
   a violet card on the violet ground simply disappears. So the violet is the
   field now (the 60), and the panels are what sits on it. */
const PANEL_TONES = [
  { fill: "bg-wave", text: "text-ink", muted: "text-ink/65" },
  { fill: "bg-paper", text: "text-ink", muted: "text-ink/60" },
  { fill: "bg-brand-deep", text: "text-paper", muted: "text-white/65" },
  { fill: "bg-ink", text: "text-paper", muted: "text-white/60" },
];

function CollectionsTrack({
  collections,
  onOpen,
}: {
  collections: HomeCollection[];
  onOpen: (p: Product) => void;
}) {
  /* How many whole cards fit before one has to be cut in half. The track
     pages by viewport width, so this also decides how many pages there are
     and therefore how many segments the bar below carries. */
  const wide = useMediaQuery("(min-width: 1024px)");
  const medium = useMediaQuery("(min-width: 640px)");
  const perPage = wide ? 3 : medium ? 2 : 1;

  /* panels = every collection plus the closing "Xem thêm" card */
  const panelCount = collections.length + 1;
  const pageCount = Math.max(1, Math.ceil(panelCount / perPage));
  const track = useDragTrack(pageCount);

  if (collections.length === 0) return null;

  const seeMoreIndex = panelCount - 1;

  const renderPanel = (i: number) => {
    const tone = PANEL_TONES[i % PANEL_TONES.length];
    const isSeeMore = i === seeMoreIndex;
    const collection = isSeeMore ? null : collections[i];
    const lead = collection?.items[0] ?? null;

    if (isSeeMore) {
      return (
        <div
          key="panel-see-more"
          className={`flex min-h-[20rem] flex-col justify-between p-6 lg:p-8 ${tone.fill} ${tone.text}`}
        >
          <span className="text-[11px] tabular-nums tracking-[0.16em] opacity-60">→</span>
          <div>
            <h3 className="display text-[clamp(1.5rem,2.4vw,2.25rem)] normal-case leading-[1.15]">
              Còn nhiều bộ sưu tập khác
            </h3>
            <Link
              to="/products"
              className="mt-5 inline-flex w-fit items-center gap-3 border-b border-current pb-1 text-sm font-semibold"
            >
              Xem thêm
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div
        key={collection!.id}
        className={`flex min-h-[20rem] flex-col p-6 lg:p-8 ${tone.fill} ${tone.text}`}
      >
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[11px] tabular-nums tracking-[0.16em] opacity-60">
            {collection!.index}
          </span>
          <span
            className={`shrink-0 whitespace-nowrap text-[11px] tabular-nums tracking-[0.16em] ${tone.muted}`}
          >
            {String(collection!.items.length).padStart(2, "0")} MÓN
          </span>
        </div>

        {/* Team 20/08: one lead piece per collection, and the name never
            wraps. A strip of six thumbnails made the panel read as another
            product row; a single object reads as a choice someone made. */}
        <h3
          className="display mt-3 truncate text-[clamp(1.35rem,2.2vw,2rem)] normal-case leading-[1.15]"
          title={collection!.name}
        >
          {collection!.name}
        </h3>

        {lead && (
          <button
            onClick={() => {
              // a flick that ends over a card must not also open it
              if (track.didDrag()) return;
              onOpen(lead);
            }}
            className="group mt-5 flex min-h-0 flex-1 flex-col text-left"
          >
            <span className="relative block min-h-0 flex-1 overflow-hidden bg-current/10">
              <img
                src={lead.images[0]}
                alt={lead.name}
                loading="lazy"
                draggable={false}
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
    );
  };

  const pages = Array.from({ length: pageCount }, (_, p) =>
    Array.from({ length: perPage }, (_, k) => p * perPage + k).filter((i) => i < panelCount)
  );

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

      <div
        ref={track.setViewport}
        {...track.handlers}
        role="group"
        aria-roledescription="carousel"
        aria-label="Bộ sưu tập"
        className={`mt-10 overflow-hidden touch-pan-y ${
          track.dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <div
          className="flex"
          style={{ transform: `translate3d(${track.x}px, 0, 0)`, willChange: "transform" }}
        >
          {pages.map((indices, p) => (
            <div key={p} className="w-full shrink-0 px-5 md:px-10">
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(${perPage}, minmax(0, 1fr))` }}
              >
                {indices.map(renderPanel)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* The bar from the sketch: current page is a wide teal pill, the rest
          are dots. Same indicator the district map carries, so "there is more
          sideways" reads the same way twice on one page. */}
      {pageCount > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3 pb-4">
          {pages.map((_, p) => (
            <button
              key={p}
              onClick={() => track.goTo(p)}
              aria-label={`Trang ${p + 1} trên ${pageCount}`}
              aria-current={p === track.page}
              className={`h-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                p === track.page ? "w-10 bg-wave" : "w-1.5 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
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
        <CollectionsTrack collections={collections} onOpen={open} />

        {/* violet → the deeper violet the map now sits on. The map used to be
            bg-ink and the team asked for that black to go (26/08), so the two
            seams either side of it move with it. */}
        <GroundBlend from="brand" to="brand-deep" />
        <DistrictMap
          routes={routes}
          onOpenRoute={(routeId) => navigate(`/discover/${routeId}`)}
          onPin={(routeId, stopId) => navigate(`/discover/${routeId}?start=${stopId}`)}
        />

        {/* No blend below it any more: the map and the collaborate band are
            both brand-deep, so there is no ground change left to ramp. */}
        <Collaborate />
      </div>
    </div>
  );
}
