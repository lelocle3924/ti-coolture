import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDown, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, StarIcon, X } from "lucide-react";
import { useAutoHideChrome, useMediaQuery, useReducedMotion } from "../lib/useAutoHideChrome";
import { useDragTrack } from "../lib/useDragTrack";
import { useImageTone, type ImageTone } from "../lib/useImageTone";
import { BendingSeam } from "../home/BendingSeam";
import { useMarqueeTrack } from "../lib/useMarqueeTrack";
import { useLoopTrack, LOOP_COPIES } from "../lib/useLoopTrack";
import { usePauseOffscreen } from "../lib/usePauseOffscreen";
import {
  formatPrice,
  PRICE_NOTE,
  useHomeData,
  LANDSCAPE_SPEC,
  type HomeCollection,
} from "../home/homeData";
import Brandmark from "../components/Brandmark";
import SaveButton from "../components/SaveButton";
import { triggerWebhook } from "../lib/dbService";
import type { Product, TouristRoute } from "../types";
import BrandSurround from "../components/BrandSurround";
import RevealFooterLayout from "../components/RevealFooter";
import { RibbonLoop, WaveBottomCropped } from "../components/BrandShapes";
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
      {/* Two lines, always — team 09/09. The question and the invitation are
          doing different jobs, and at max-w-[18ch] the break landed wherever
          the measure happened to put it: "Bạn làm đồ đẹp? Kể" / "Tí nghe" at
          some widths, one line at others. A <br> states it instead of hoping
          for it. */}
      <h2 className="display mx-auto mt-4 text-[clamp(1.9rem,4.6vw,3.5rem)] normal-case leading-[1.05]">
        Bạn làm đồ đẹp?
        <br />
        Kể Tí nghe
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
      /* pb-2 below md, not pb-7. Team 10/09: "giảm khoảng cách từ thanh
         slider dưới cái chrome chỗ hero đến title What's in store trên
         mobile. Giảm còn 1 nửa."

         That gap is two paddings, not one — 40px of it is this foot and 40px
         is the store section's head — so halving it means halving both, 20px
         each. 28px here reads as 40 because the dot row carries its own
         margin above this padding; taking 20 off leaves pb-2. Desktop keeps
         pb-7. */
      className="relative overflow-hidden bg-brand px-5 pb-2 pt-[6.5rem] md:px-10 md:pb-7 md:pt-32 lg:px-12"
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
          className="relative mx-auto w-full touch-pan-y [--hero-cap:100%] [--hero-reserve:8.25rem] md:[--hero-cap:74.6%] md:[--hero-reserve:9.75rem]"
          style={{
            /* 16:9 at every width, chosen 09/09 off the demo on
               demo/hero-deck-16-9-mobile.

               What it replaces is option C from /lab/hero (07/09): a ramp
               from 5:4 at 375px to 16:9 at 1200, so that no width existed
               where the shape jumped because the window moved a pixel. The
               ramp's reason was that a phone could not afford a 16:9 deck;
               seeing it, the team decided it can.

               Flat rather than pinned below md, and that is not a widened
               scope — it is the only continuous form. The ramp only ever
               bridged 375→1200, and ≥1200 was already 16:9. Pinning the
               phone alone would leave 1.7778 at 767px and 1.5015 at 768px —
               a jump at the breakpoint — and make a tablet narrower than both
               a phone and a desktop. So the ramp goes rather than gets a
               second exception; ≥1200 is unchanged. */
            ["--hero-ar" as string]: "1.7778",
            aspectRatio: "var(--hero-ar)",
            /* Two caps, whichever bites first.

               The height one is the original: the card may not be taller than
               the viewport less the room the chrome needs.

               The width one is new (07/09). The team's drawing puts the brand
               marks in a violet margin either side of the deck, and asks for
               the composition to be matched. Under the height cap alone that
               margin only exists on a short window — at 1440x900 the card came
               out 1322 wide and buried the surround it is supposed to sit in.
               74.6% is the width the height cap already produces at 1440x760,
               which is the shape the drawing was made at, so this changes
               nothing there and holds the same proportion on taller screens.

               --hero-cap is 100% below md: a phone has no room for a margin
               to put marks in, the surround does not draw there, and 74.6% of
               390px would be a 291px card. Desktop composition, desktop
               only. */
            maxWidth:
              "min(calc((100dvh - var(--hero-reserve)) * var(--hero-ar)), var(--hero-cap))",
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

            /* Motion proposal 08 (approved 31/08): deal the card, do not
               dissolve it.

               Every frame used to fade out where it stood, so mid-change two
               photographs occupied the same rectangle and the deck read as one
               frame crossfading rather than as a stack being dealt from.

               The frame that was on top a moment ago — the one that has just
               wrapped round to the back — now lifts off the top of the deck
               instead: 3% across, 3% up, rotated 3 degrees, fading, and drawn
               ABOVE the new front so it reads as being pulled off it. The card
               underneath rises into place on its own, which it already did.

               Only when there are more frames than stack positions. With three
               or fewer the outgoing frame is still a visible part of the
               stack, and lifting it off would delete a card from the deck. */
            const outgoing = count > 3 && rel === count - 1;

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
                    : outgoing
                      ? {
                          transform: "translate3d(3%,-3%,0) rotate(3deg) scale(1)",
                          opacity: 0,
                          // above the front card, below the attribution chrome
                          zIndex: 35,
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
  full = false,
  quiet = false,
}: {
  key?: string;
  product: Product;
  onOpen: (p: Product) => void;
  /** True when the gesture that just ended was a drag, not a tap. */
  blocked?: () => boolean;
  /** Fill the slide it is in, for the phone lane's one-per-screen paging. */
  full?: boolean;
  /**
   * Show the photograph only.
   *
   * The phone rail leaves 15% of the neighbour either side showing, and what
   * the team asked to see there is the picture — "mép phải và mép trái của
   * hình ảnh của 2 sản phẩm ở 2 bên". A caption cut off 15% in is not a
   * peek, it is a sentence with its end missing, twice, at both screen
   * edges. The space is kept so nothing moves as it fades back in.
   */
  quiet?: boolean;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        // a flick that comes to rest over a tile must not also open it
        if (blocked?.()) return;
        onOpen(product);
      }}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        onOpen(product);
      }}
      draggable={false}
      className={
        full
          ? "group block w-full text-left"
          : "lab-snap-item group mr-6 w-[62vw] shrink-0 text-left sm:w-[20rem] lg:mr-10 lg:w-[20rem]"
      }
    >
      {/* Team direction (26/08): square and rounded. Square is also the ratio
          the product photographs are actually shot at — the landscape crop
          this used to force was cutting the top and bottom off every piece. */}
      <div className="group/tile relative aspect-square overflow-hidden rounded-[1.25rem] bg-white/5 md:rounded-[1.75rem]">
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          draggable={false}
          className="h-full w-full object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
        />
        {/* Team 07/09: "ở homepage chưa có nút tim trên ảnh sản phẩm ở
            What's in store." The same control the catalogue and the product
            page carry — wherever a product photograph is, this is on it. */}
        <span className="absolute right-1 top-1 z-10">
          <SaveButton product={product} revealOnHover />
        </span>
      </div>
      <div
        className={`mt-4 flex items-baseline gap-4 border-t border-white/15 pt-3 transition-opacity duration-300 ${
          quiet ? "opacity-0" : "opacity-100"
        }`}
      >
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
    </div>
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
  offscreen,
  onOpen,
}: {
  products: Product[];
  direction: "left" | "right";
  /** Ambient drift in px/s. */
  speed: number;
  /** The section is off screen or the tab is hidden — Motion 11. */
  offscreen?: boolean;
  onOpen: (p: Product) => void;
}) {
  const [held, setHeld] = useState(false);
  const lane = useMarqueeTrack({
    speed: direction === "left" ? speed : -speed,
    paused: held || !!offscreen,
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


/* ── the phone lane: one product at a time, endlessly ────────────────────
   Team 07/09: "nếu có 10 sản phẩm featured trên What's in store, thì vuốt
   sang phải 10 lần sẽ qua sản phẩm 2,…,10 rồi quay trở về đúng sản phẩm đầu
   tiên, vuốt thêm 10 lần nữa thì vẫn quay lại chỗ xuất phát."

   Yes, and this is it. What was in the way was the mechanism: the lane was a
   native `overflow-x: auto` container with the last product rotated to the
   front of the list. That looks like a loop standing still — the last product
   does sit to the left of the first — but a scroll container has a finite
   scrollWidth, so one swipe left hits scrollLeft 0 and stops. Reordering the
   list cannot fix that; the browser will not scroll to content that is not
   there.

   useLoopTrack lays the list out three times, keeps the index in the middle
   copy, and folds it back by ±count once the spring has settled. The fold is
   invisible because index i and index i+count are the same pixels. See the
   note on the hook.

   The desktop lanes keep the marquee: two drifting rows are the shape that
   section has, and there is no "current product" there to page between. */
/** The share of the screen one step travels: one photograph plus one gap. */
const SLIDE = 0.65;
/** Where its slide starts, which is (1 - SLIDE) / 2 — the peek, symmetric. */
const PEEK = 0.175;

function LoopingStoreLane({
  products,
  onOpen,
}: {
  products: Product[];
  onOpen: (p: Product) => void;
}) {
  /* Team 08/09: "ảnh 1 sản phẩm chỉ chiếm 60% chiều ngang, 15% each cho mép
     phải và mép trái của hình ảnh của 2 sản phẩm ở 2 bên, 5% each cho
     spacing." Those five figures add to the screen exactly once, and they are
     the whole geometry of this rail:

         │ 15% │5%│        60%        │5%│ 15% │
         └ prev┘  └───── current ─────┘  └ next┘

     There are two gaps on screen, not four, which is what makes the five
     figures add to 100 — so one step travels one photograph plus one gap,
     60 + 5 = 65% of the viewport. The slide box below is that 65% carrying
     half a gap either side, which leaves the photograph at 60% and puts a
     full 5% between it and its neighbour. */
  const track = useLoopTrack(products.length, {
    response: 0.55,
    decelerationRate: 0.992,
    maxPagesPerFlick: 1,
    slide: SLIDE,
    lead: PEEK,
  });
  const laid = Array.from({ length: LOOP_COPIES }, () => products).flat();

  if (products.length === 0) return null;

  return (
    <div>
      <div
        ref={track.setViewport}
        {...track.handlers}
        /* No padding on the viewport: useLoopTrack measures its step from
           clientWidth, which includes padding, so a padded viewport would
           step further than a slide is wide and drift out of true. The gutter
           goes on the slide. */
        className={`overflow-hidden touch-pan-y ${
          track.dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        role="group"
        aria-roledescription="carousel"
        aria-label="Sản phẩm nổi bật"
      >
        <div
          className="flex"
          style={{ transform: `translate3d(${track.x}px, 0, 0)`, willChange: "transform" }}
        >
          {laid.map((p, i) => (
            <div
              key={`${i}-${p.id}`}
              /* Percentages, not rem: both resolve against the flex
                 container, which is the viewport, so the rail holds the
                 60/15/5 split at every screen width. */
              className="w-[65%] shrink-0 px-[2.5%]"
              /* Only the middle copy is read out. The other two are the same
                 products again, there to cover the fold. */
              aria-hidden={i < products.length || i >= products.length * 2}
            >
              <StoreTile
                product={p}
                onOpen={onOpen}
                blocked={track.didDrag}
                full
                quiet={i % products.length !== track.page}
              />
            </div>
          ))}
        </div>
      </div>

      {/* At one product per screen there is nothing else on screen saying
          there is more, so the beads carry it. No ends to disable. */}
      <div className="mt-5 flex items-center justify-center gap-2 px-5">
        {products.map((p, i) => (
          <button
            key={p.id}
            onClick={() => track.goTo(i)}
            aria-label={`Xem sản phẩm ${i + 1}`}
            aria-current={i === track.page}
            className={`h-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              i === track.page ? "w-7 bg-wave" : "w-1.5 bg-white/30"
            }`}
          />
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
  /* Motion 11: the lanes drift forever, so they stop when the section is off
     screen or the tab is hidden. Nothing changes on screen.

     The proposal did this with `[data-marquee-paused] .lab-marquee` in CSS,
     which stopped working when the CSS marquee was replaced by
     useMarqueeTrack (07/09) — there is no .lab-marquee left to select. The
     state is handed to the lane instead, which already knows how to hold
     still because hovering does the same thing. */
  const { ref: sectionRef, paused } = usePauseOffscreen<HTMLElement>();

  return (
    <section
      ref={sectionRef}
      id="dong-store"
      /* pb is max(4rem, 7.875%) — 7.875% is half the collapsed seam band, so
         the band never reaches the price note; the 4rem floor keeps a sane gap
         on a phone, where half a band is only ~30px. It reads larger than the
         old md:pb-24, but the band no longer adds its own ~113px on top, so
         the gap from the note down to the seam roughly halves. */
      /* pt-5 below md — the other half of the 10/09 gap. See the note on
         the hero section's pb. */
      className="bg-brand pb-[max(4rem,7.875%)] pt-5 text-paper md:pt-12"
    >
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
        {twoLanes ? (
          <>
            {/* Speeds in px/s rather than a loop duration: the duration a CSS
                marquee takes depends on how much content it happens to hold,
                so two lanes with different counts ran at different speeds.
                These are the same two speeds the old durations worked out to
                on a laptop, now stated directly and independent of the
                catalogue's length. */}
            <StoreLane
              products={products.slice(0, half)}
              direction="left"
              speed={34}
              offscreen={paused}
              onOpen={onOpen}
            />
            <StoreLane
              products={products.slice(half)}
              direction="right"
              speed={28}
              offscreen={paused}
              onOpen={onOpen}
            />
          </>
        ) : (
          /* One product per screen on a phone, and endless. Two stacked
             marquees eat the screen and neither can be read while both are
             moving (20/08); a single drifting one still gives you no way to
             go back to the product you just passed. */
          <LoopingStoreLane products={products} onOpen={onOpen} />
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

/* ── the marks around "Cách đặt hàng" ─────────────────────────────────────
   Ported verbatim from the hand-tuned build at /lab/how (04/09). The numbers
   are the team's own, not re-derived: ribbon 32% of the width, left -19%,
   hanging below the foot of the section; crest 25% of the width, right
   aligned, at its own 486:266 ratio.

   The one thing that could not be copied literally is the ribbon's vertical
   offset. The lab writes it `bottom: -22%`, and a percentage bottom resolves
   against the CONTAINER's height — 685px in the lab's section, but 100dvh in
   the pinned pane, which would drop the mark much further out of frame. So it
   is expressed as a translate instead: measured at 1440px the lab hangs the
   ribbon 270px below the foot, which is 58.9% of the mark's own 458px height,
   and a translate percentage resolves against the element's own box. Same
   picture, in a box of any height. */

/* The seam's depth, as a fraction of its width. Both modes read it, and the
   sections' head/foot padding is derived from it (7.875% = half a band at
   BAND_FACTOR 2.1), so it lives in one place. */
const SEAM_SAGITTA = 0.075;

function HowMarks() {
  return (
    <>
      {/* Team 09/09: "trên giao diện mobile, cái loop ở chỗ Cách đặt hàng bị
          khuất bởi các thẻ steps. Phóng to 1.5 lần, canh khoảng cách để loop
          không bị che khuất."

          Two numbers change, and only below md — the desktop composition is
          the lab's and is not in question.

          32% → 48% is the 1.5×. And the drop shrinks from 40% to 12%: at 40%
          most of the mark hung below the section's foot, where the section's
          own overflow-hidden simply cut it off, so scaling it up would have
          made a bigger thing more of which was invisible. At 12% the mark
          sits inside the band instead, and the section's foot padding is
          what opens that band — see pb-[46%] below, which is where the
          "canh khoảng cách" half of the note lives.

          The drop travels as a custom property because it is in a style
          prop, which has no breakpoints; Tailwind's arbitrary-property
          syntax does. */}
      <RibbonLoop
        className="pointer-events-none absolute bottom-0 left-[-19%] z-0 w-[48%] max-w-[30rem] [--loop-drop:12%] md:w-[32%] md:[--loop-drop:40%]"
        style={{ transform: "translateY(var(--loop-drop)) scaleX(-1)" }}
        ribbon="var(--color-wave)"
        dot="var(--color-brand)"
        blink
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[-1px] z-0"
      >
        <WaveBottomCropped fill="var(--color-brand)" ratio={0.25} />
      </div>
    </>
  );
}

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
            {/* 33dvh -> 36dvh (and the rails 13rem -> 13.5rem, 22rem -> 23rem).
                Growing the cards is the only lever that shrinks the empty band
                above AND below at once, since both are half of whatever the
                content does not use. Kept modest on purpose: this pane is
                sized in dvh precisely because a rem-sized version clipped its
                last row on short Windows laptops. */}
            <div
              className={`flex h-full flex-col rounded-[1.75rem] p-6 ring-4 ring-paper md:min-h-[clamp(13.5rem,36dvh,23rem)] md:p-[clamp(1.15rem,2.4dvh,2rem)] ${
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
    <div className="relative z-10 px-5 pt-5 text-center md:px-0">
      <h2 className="display text-[clamp(1.75rem,min(5.6vw,7.5dvh),4.5rem)] normal-case leading-none text-ink">
        Cách đặt hàng
      </h2>
    </div>
  );

  /* Same note as the pinned pane below, applied where there is no pin to
     centre anything: the padding above the title and below the last card is
     simply smaller. py-16/24 -> pt-11/14 and pb-12/16, and the heading keeps a
     clear gap to the fan rather than the pinned layout's old tuck. */
  if (!pinned) {
    return (
      <>
      <BendingSeam
        sagittaRatio={SEAM_SAGITTA}
        above="var(--color-brand)"
        below="var(--color-paper)"
        collapse
      />
      <section
        id="dong-how"
        data-surface="light"
        /* pb clears the crest exactly rather than by guess: the crest is 25%
           of the width at 486:266, so it stands 0.25/1.827 = 13.7% of the
           width tall. In the lab the crest simply follows the cards in normal
           flow; here it is absolute, so the padding has to stand in for it.

           Below md it has a second thing to clear, and that one is larger.
           The ribbon is 48% of the width and drops 12% of its own height, so
           it reaches 0.88 × 48% = 42.2% of the width above the foot — and
           the step cards end where this padding starts. 46% leaves the mark
           a little under 4% of clear air below the last card; anything less
           and the cards are back on top of it, which is the 09/09 report.
           Percentages of the width throughout, so the clearance holds from a
           320px phone to a tablet. */
        className="relative overflow-hidden bg-paper pb-[46%] pt-[max(2.75rem,7.875%)] text-ink md:pb-[14%]"
      >
        <HowMarks />
        <div className="relative z-10">
          {header}
          <div className="mt-8">{fan}</div>
        </div>
      </section>
      </>
    );
  }

  return (
    <section id="dong-how" data-surface="light" className="bg-paper text-ink">
      <div ref={wrapRef} style={{ height: runHeight }}>
        {/* Everything in this pane is sized from dvh, not rem. Pinned to the
            viewport height with rem-sized content, it fitted a 900px MacBook
            and clipped its last row on every shorter Windows laptop — which is
            the vertical overflow the team reported. */}
        {/* Spacing reworked 31/08: "thu nhỏ khoảng trống trên title và dưới các
            thẻ steps, đưa 'cách đặt hàng' lên cao xíu, đừng quá sát với các
            thẻ."

            Measured before, at 1440x900: 291px of nothing above the title,
            228px below the step counter, and the title sitting -8px into the
            cards. 519px of a 900px screen was empty while the one thing that
            was tight was the one gap that should not have been.

            The content was centred in the pinned pane, because at the time
            both empty bands were (viewport - content)/2 and neither could be
            removed without breaking the pin.

            Centring is wrong now, and 04/09 caught it: the seam above the
            section ends up 241px from the title on the homepage against 55px
            in the lab, purely because the pane centres what the lab lets sit
            at the top. The foot of the pane is no longer empty either — the
            crest and the ribbon occupy it — so there is nothing left for the
            lower band to do. Top-align instead, with the lab's own head
            clearance, and the seam meets the title the same way in both.
            The clearance answers to two things at once, so it is a max().
            6.5rem clears the floating header, which sits at y 20-93px in px
            rather than dvh and so cannot be expressed as a percentage. 7.875%
            is half the collapsed seam band, which the title has to stay below
            or the downward bulge runs under it. Whichever is larger wins:
            the header governs up to ~1320px, the band above that. */}
        {/* flow-root, so the pane is its own block formatting context.
            Without it the seam's negative top margin collapses INTO the pane
            instead of lifting the seam above it, and the whole composition
            drops half a band. The pane used to get that context for free from
            overflow-hidden; that has moved to the inner element, so the pane
            has to ask for it. */}
        <div className="sticky top-0 h-[100dvh] flow-root">
          {/* The seam belongs to the pane, not to the wrapper.

              It was a sibling of the pane, sticking on its own at -half a
              band. That held the gap during the lock, but the two had
              different release points: the pane lets go when the wrapper's
              foot reaches the bottom of the screen, while the seam's own
              sticky range ran on almost to the foot of the wrapper. So the
              cards scrolled away and the violet edge of "Chưa biết mua gì?"
              came up while the seam was still nailed to the top of the screen
              (07/09).

              As a child it cannot drift: it sticks when the pane sticks, and
              scrolls away with it at exactly the same moment.

              Which is why the pane is now two elements. The overflow-hidden
              has to stay — it is what crops the ribbon's overhang at the foot
              — but it would also crop the seam's upper half, and that half is
              where the white bulges up into the violet on the way in. So the
              clip moves to the inner element and the seam sits outside it. */}
          <BendingSeam
            sagittaRatio={SEAM_SAGITTA}
            above="var(--color-brand)"
            below="var(--color-paper)"
            collapse
          />
          {/* `relative` is load-bearing, not decoration (07/09).

              overflow-hidden clips a descendant only when the clipping box is
              also that descendant's containing block, and an absolutely
              positioned element takes its containing block from the nearest
              *positioned* ancestor. Without `relative` here this div clipped
              nothing absolute: the ribbon resolved against a positioned
              ancestor further up and its tail carried on past the foot of the
              white, over the violet of "Chưa biết mua gì?" — 183px of it at
              1440. The non-pinned branch of this section already had
              `relative` and already clipped correctly, which is why only the
              pinned path showed it. */}
          <div className="relative flex h-full flex-col justify-start overflow-hidden pt-[max(6.5rem,7.875%)]">
          {/* Inside the pane, not at the foot of the tall wrapper.

              Team 04/09: while the page is held, the straight violet edge of
              "Chưa biết mua gì?" must not show — only the wave and the ribbon
              coming up. Putting the marks in the pane does exactly that: they
              ride the sticky pane at the bottom of the screen for the whole
              pin, while the violet section itself is still below the fold and
              only arrives once the pin lets go. At that moment the pane's foot
              and the wrapper's foot are the same line, so the crest meets the
              violet with nothing between them. */}
          <HowMarks />
          {header}
          {/* The fan used to tuck -8px under the heading, layering its cards
              over the title the way the reference does. The 31/08 note asks
              for the opposite — "đừng quá sát với các thẻ" — so the tuck is
              gone and the heading gets real clearance. */}
            <div className="relative z-10 mt-[clamp(1rem,3dvh,2rem)]">{fan}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── hidden gems ────────────────────────────────────────────────────────
   A persistent tab on the right edge opening the editor's pick. UX-TASKS 2.3
   asks the tab to hide on scroll-down, so it rides the same chrome hook as
   the nav — inverted, per the 26/08 direction (see below).

   Team 07/09 (a): "Đổi motion của thẻ Hidden gem từ appear thành slide từ mép
   phải ra." It used to fade — lab-plate-in, 1.1s of opacity and nothing else,
   with the card unmounted on close so there was no exit at all. Nothing said
   where the card came from, least of all that it came from the tab.

   Team 07/09 (b), after seeing the three answers at /lab/hidden-gem: "chọn
   option A cho PC, option C cho mobile … viền màu teal của bản thân cái card
   phải có độ dày ít nhất 3px."

   So the two shapes ship side by side, and the split is not a compromise —
   each is the one that works at its own width:

     · Desktop is A, DẤU TRANG. The chip is welded to the card's leading
       corner and the whole object slides in from beyond the right edge as one
       rigid body. One transform, so the two can never be seen apart, and the
       chip is the handle both ways.
     · Phones are C, NGÔI SAO ĐI THEO. A 19rem object parked at half height
       covers what you are reading on a 390px screen, and an edge-docked card
       has nowhere to dock that is not over the text. So the card comes up
       from the bottom and the star flies from the edge into its badge corner
       — the mark is what carries the link, and the card keeps a shape a phone
       can hold.

   Both are one transition read in two directions rather than two keyframes,
   so interrupting either reverses it from where it is; and both mount a frame
   before they are shown, because an element born at its resting place has
   nothing to transition from. */

/* Enter is longer than exit: arriving is the part worth watching. */
const GEM_IN = 520;
const GEM_OUT = 320;

/** A's chip, and C's star at rest, are the same 48×56 tab. */
const GEM_TAB = { w: 48, h: 56 };
/** C's star once it has landed on the card, and the badge slot's inset. */
const GEM_STAR = { w: 28, h: 28 };
const GEM_BADGE_INSET = 12;
/** Where C's card rests. Stated once, because the star's landing point is
    derived from it and a second copy in a class name would drift. */
const GEM_CARD_INSET = { bottom: 24, right: 16 };

function GemCardBody({
  gem,
  onOpenProduct,
  onClose,
}: {
  gem: { product: Product; note: string };
  onOpenProduct: () => void;
  /** Omitted on A, where the chip is the close control. */
  onClose?: () => void;
}) {
  return (
    <>
      {/* Square, because that is the ratio the product photographs are shot
          at — the same 26/08 decision the catalogue tiles and What's in store
          are built on. This box was 16:9, which cropped the top and bottom
          off every gem. It went unnoticed for as long as the gems pointed at
          placeholder blocks: any crop of a flat grey block looks like any
          other. Real photographs made it visible the same day they landed. */}
      <div className="relative aspect-square overflow-hidden bg-paper-warm">
        <img
          src={gem.product.images[0]}
          alt={gem.product.name}
          className="h-full w-full object-cover"
        />
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-paper backdrop-blur-md transition-colors hover:bg-black"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <button
        onClick={onOpenProduct}
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
    </>
  );
}

/* ── A · DẤU TRANG — desktop ──────────────────────────────────────────────
   One body, docked to the edge. Closed, the object is parked off the right
   with only its chip showing; open, it slides left as one piece. The card is
   square on the right because that is what makes it read as attached to the
   page's edge rather than floating near it.

   The teal outline is 3px at the team's request (07/09) — it was 2 in the
   study. At 2 it reads as a hairline that happens to be teal; at 3 it reads
   as the chip's own colour continuing round the card, which is the job it is
   doing. */
function GemBookmark({
  gem,
  open,
  parked,
  onToggle,
  onOpenProduct,
  reduced,
}: {
  gem: { product: Product; note: string };
  open: boolean;
  /** Closed but on the edge, chip showing. False means gone entirely. */
  parked: boolean;
  onToggle: () => void;
  onOpenProduct: () => void;
  reduced: boolean;
}) {
  /* Three rest positions, one element, one transform. Team 08/09: "Tôi muốn
     vị trí của lưỡi ngôi sao nhất quán. Khi đóng thẻ vào thì cũng chưa được
     liền mạch."

     Both notes had the same cause: there used to be a separate parked tab
     that was swapped for this object on open and swapped back on close. Two
     elements cannot be continuous with each other, so closing popped; and the
     two were centred on different things, so the chip jumped. */
  const x = open ? "0px" : parked ? `calc(100% - ${GEM_TAB.w}px)` : "100%";

  return (
    <div
      className="fixed right-0 top-1/2 z-50 flex w-[21rem] items-center will-change-transform"
      style={{
        /* The chip's centre is on the viewport's midline in every one of the
           three states — which is what "nhất quán" (08/09) asks for. It used
           to get there by hanging the whole object from the chip, so the card
           grew downward from the midline and had half a screen to do it in.
           A square photograph (09/09) made the card taller than that half and
           its bottom edge went under the fold.

           items-center plus a -50% here gets the same chip position out of a
           different arrangement: the object is centred on the midline and the
           chip is centred within it, so the card grows in both directions and
           has the whole screen rather than half of it.

           The vertical half lives in the transform, not in a -translate-y
           utility: Tailwind v4 compiles those to the standalone `translate`
           property, which composes with `transform` rather than being
           overridden by it. */
        transform: `translate3d(${x}, -50%, 0)`,
        transition: reduced ? "none" : `transform ${open ? GEM_IN : GEM_OUT}ms var(--ease-brand)`,
      }}
    >
      {/* the chip — the handle, and the only thing showing when closed */}
      <button
        onClick={onToggle}
        aria-expanded={open}
        aria-hidden={!parked && !open}
        tabIndex={parked || open ? 0 : -1}
        aria-label={open ? "Đóng viên ngọc ẩn" : "Viên ngọc ẩn — xem sản phẩm Tí chọn"}
        className="grid shrink-0 place-items-center rounded-l-2xl bg-wave text-ink shadow-2xl transition-transform duration-300 active:scale-95"
        style={{ width: GEM_TAB.w, height: GEM_TAB.h }}
      >
        <StarIcon className="h-6 w-6" />
      </button>

      {/* The cap is the last guard: on a window too short for the card even
          centred, the card scrolls rather than running off the edge. Nothing
          scrolls at ordinary heights. */}
      <div
        aria-hidden={!open}
        className="max-h-[calc(100dvh-2rem)] min-w-0 flex-1 overflow-y-auto bg-paper text-ink shadow-[0_25px_60px_rgba(18,8,31,0.4)] ring-[3px] ring-wave"
      >
        <GemCardBody gem={gem} onOpenProduct={onOpenProduct} />
      </div>
    </div>
  );
}

/* ── C · NGÔI SAO ĐI THEO — phones ────────────────────────────────────────
   The link is the star itself: it flies from the edge to the card's badge
   corner and becomes the "✦ Tí chọn" chip, and the card rises under it.
   Closing sends it back to the edge. Same idea src/lib/continuity already
   uses between pages — the mark is the constant and everything else is
   staging around it. */
function GemTravellingStar({
  gem,
  open,
  parked,
  onToggle,
  onOpenProduct,
  reduced,
}: {
  gem: { product: Product; note: string };
  open: boolean;
  /** Closed but on the edge. False means the nav has taken it away. */
  parked: boolean;
  onToggle: () => void;
  onOpenProduct: () => void;
  reduced: boolean;
}) {
  const card = useRef<HTMLDivElement>(null);
  /* Where the badge slot actually is. The card's height depends on how long
     the shop's name and the editor's note run, so a hardcoded landing point
     is wrong for every gem but the one it was tuned on. */
  const [slot, setSlot] = useState({ right: 0, top: 0 });

  useLayoutEffect(() => {
    const measure = () => {
      const c = card.current;
      if (!c) return;
      /* Derived from the viewport and the card's own offsetWidth/Height, not
         from a rect. A rect folds in the transform, and the card is still
         carrying its closed translateY when this first runs — measuring it
         then landed the star 14px below the badge slot every time. offsetWidth
         and offsetHeight ignore transforms, so the answer is the same before
         and after the card has arrived. */
      setSlot({
        right: GEM_CARD_INSET.right + c.offsetWidth - GEM_BADGE_INSET - GEM_STAR.w,
        top: window.innerHeight - GEM_CARD_INSET.bottom - c.offsetHeight + GEM_BADGE_INSET,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open]);

  const landed = open && slot.top > 0;
  const dur = open ? GEM_IN : GEM_OUT;
  const travel = reduced
    ? "none"
    : `right ${dur}ms var(--ease-brand), top ${dur}ms var(--ease-brand), height ${dur}ms var(--ease-brand), width ${dur}ms var(--ease-brand), border-radius ${dur}ms ease`;

  return (
    <>
      <div
        ref={card}
        role="dialog"
        aria-label="Viên ngọc ẩn"
        /* Same cap as the desktop card. This one grows upward from the
           bottom inset rather than downward, so it runs out of room at the
           top instead — the guard is the same either way. */
        className="fixed z-50 max-h-[calc(100dvh-2rem)] w-[min(340px,calc(100vw-2rem))] overflow-y-auto rounded-[1.5rem] bg-paper text-ink shadow-[0_25px_60px_rgba(18,8,31,0.4)] ring-[3px] ring-wave will-change-transform"
        style={{
          bottom: GEM_CARD_INSET.bottom,
          right: GEM_CARD_INSET.right,
          transform: open ? "translateY(0)" : "translateY(14px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: reduced
            ? "none"
            : `transform ${open ? GEM_IN : GEM_OUT}ms var(--ease-brand) ${open ? 90 : 0}ms, opacity ${open ? 260 : GEM_OUT}ms ease ${open ? 90 : 0}ms`,
        }}
      >
        <GemCardBody gem={gem} onOpenProduct={onOpenProduct} onClose={onToggle} />
      </div>

      {/* the mark — one element, two homes */}
      <button
        onClick={onToggle}
        aria-expanded={open}
        aria-hidden={!parked && !open}
        tabIndex={parked || open ? 0 : -1}
        aria-label={open ? "Đóng viên ngọc ẩn" : "Viên ngọc ẩn — xem sản phẩm Tí chọn"}
        className="fixed z-[51] grid place-items-center bg-wave text-ink shadow-2xl will-change-transform"
        style={
          landed
            ? {
                right: slot.right,
                top: slot.top,
                width: GEM_STAR.w,
                height: GEM_STAR.h,
                borderRadius: 999,
                transition: travel,
              }
            : {
                /* Parked on the edge, or pushed off it while the nav is up.
                   Same element, same transition — the tab leaving with the
                   nav is the same movement as the star coming home. */
                right: parked ? 0 : -GEM_TAB.w,
                top: "50%",
                marginTop: -GEM_TAB.h / 2,
                width: GEM_TAB.w,
                height: GEM_TAB.h,
                borderRadius: "1rem 0 0 1rem",
                transition: travel,
              }
        }
      >
        <StarIcon className={landed ? "h-3.5 w-3.5" : "h-6 w-6"} />
      </button>
    </>
  );
}

/** A different index from the one showing. Falls back when there is only one. */
function anotherGem(current: number | null, count: number): number {
  if (count <= 1) return 0;
  const pool = Array.from({ length: count }, (_, i) => i).filter((i) => i !== current);
  return pool[Math.floor(Math.random() * pool.length)];
}

function HiddenGems({ gems }: { gems: Array<{ product: Product; note: string }> }) {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const wide = useMediaQuery("(min-width: 768px)");
  const [open, setOpen] = useState(false);

  /* Team 09/09: "thẻ hidden gem phải được refresh 1 sản phẩm mới ngẫu nhiên
     mỗi khi người dùng tắt đi và mở ra lại. Sản phẩm hiện ban đầu cũng là
     ngẫu nhiên."

     Null until the gems land, because they arrive from a fetch: seeding the
     state with Math.random() * 0 on the first render would pin it to index 0,
     which is the fixed pick this replaces.

     The re-pick happens on the way *open*, not on the way closed — the card
     is on screen while it closes, and swapping the product mid-animation
     would show the change happening. Behind a closed card nobody sees it
     arrive.

     The first open is the exception: it shows the seed, because that seed is
     the random pick the note asks for and the card starts closed, so a
     re-pick on the first open would mean it was never seen at all. */
  const [index, setIndex] = useState<number | null>(null);
  const seen = useRef(false);

  useEffect(() => {
    if (index === null && gems.length > 0) setIndex(anotherGem(null, gems.length));
  }, [gems.length, index]);

  // Team direction (26/08): the tab does the OPPOSITE of the nav. Scrolling
  // down hides the nav and pushes this out; scrolling up brings the nav back
  // and takes this away — the two never occupy the screen at the same time.
  // This deliberately reverses UX-TASKS 2.3, which had the tab hiding with the
  // rest of the chrome.
  const { hidden } = useAutoHideChrome({ locked: open });
  const gem = index === null ? undefined : gems[index];

  const toggle = useCallback(() => {
    if (open) {
      setOpen(false);
      return;
    }
    /* The next index is computed here rather than inside a state updater:
       updaters run twice under StrictMode, and this one both picks a random
       value and reports it. */
    const next = seen.current || index === null ? anotherGem(index, gems.length) : index;
    seen.current = true;
    setIndex(next);
    const opening = gems[next];
    if (opening) triggerWebhook("CURATED_GEM_OPENED", { productId: opening.product.id });
    setOpen(true);
  }, [gems, index, open]);

  const openProduct = useCallback(() => {
    if (!gem) return;
    triggerWebhook("CURATED_GEM_CLICKED", { productId: gem.product.id });
    navigate(`/products/${gem.product.id}`, { viewTransition: true });
  }, [gem, navigate]);

  if (!gem) return null;

  /* No separate parked tab any more, and nothing mounts or unmounts.

     Team 08/09: "Khi đóng thẻ vào thì cũng chưa được liền mạch." It could not
     be: closing animated one element out and then swapped in a different one
     at a different offset. Each shape owns all three of its rest positions
     now — gone, parked on the edge, open — so opening, closing and the nav
     taking the tab away are the same transform running between three values.
     Keeping the object mounted is also what lets it be interrupted: pressing
     the chip mid-close reverses from wherever it is. */
  const props = {
    gem,
    open,
    parked: hidden,
    onToggle: toggle,
    onOpenProduct: openProduct,
    reduced,
  };

  return wide ? <GemBookmark {...props} /> : <GemTravellingStar {...props} />;
}

/* ── collections: spring tabs ───────────────────────────────────────────
   Team 07/09: "Implement Collections option 2 trong lab."

   Direction 2 from /lab/collections, built to the sketch on page 1 of the
   26/08 feedback: the collections are a horizontal accordion. Closed ones
   stand as narrow spines with the name set vertically, like books on a shelf;
   the one you press springs open and takes the room the others give up.

   What it replaces — the drag track (direction 1), which had been running
   here since 26/08. Both replaced the same thing before that: the pinned run
   (MO-7), a section three viewports tall whose only control was the page's
   own scrollbar.

   Two things differ from the lab build, and both are because this is a
   homepage section rather than a specimen:

     · One collection is always open on desktop. In the lab a second press
       closes the panel, which is right for something you are inspecting; on
       the page it leaves four equal panels each showing a spine and 300px of
       nothing, and the section reads as broken. Phones keep the toggle: the
       row is a stacked accordion there, closing is the ordinary gesture, and
       an all-closed list still reads as a list.
     · The row keeps the "Xem thêm" route through to the catalogue that the
       drag track carried as its last card. It is a line under the row rather
       than a fifth spine — a spine that is not a collection would break the
       one thing the shelf is saying.

   The spring is --ease-brand on flex-grow, which overshoots slightly on the
   way open; that overshoot is the "springs open" the sketch names. The
   contents ride in on a curve that only decelerates, so one gesture does not
   read as two. See home.css. */

/* A closed spine keeps the colour of the panel it opens into — that is what
   makes the row read as a row of collections rather than as decoration.

   The sketch's literal palette is teal / violet / white on a white page. Here
   the section is the site's violet field, so the bright brand violet is the
   one colour a panel cannot take: at 3.25rem wide a violet spine on violet
   ground is not a spine, it is a gap. brand-deep stands in for it and stays
   in the violet family. */
const PANEL_TONES = [
  { fill: "bg-wave", text: "text-ink", spine: "text-ink", tile: "bg-ink/10", muted: "text-ink/65" },
  { fill: "bg-brand-deep", text: "text-paper", spine: "text-wave", tile: "bg-white/15", muted: "text-white/65" },
  { fill: "bg-paper", text: "text-ink", spine: "text-brand", tile: "bg-ink/8", muted: "text-ink/60" },
  { fill: "bg-ink", text: "text-paper", spine: "text-wave", tile: "bg-white/12", muted: "text-white/60" },
];

/* The three pieces on show inside an open collection, and the way to the
   rest of them.

   Team 07/09: "Nếu collection có từ 4 sản phẩm trở lên, cũng cần có 1 thanh
   trượt ở ngay dưới hoặc nút mũi tên để người dùng biết là collection đó còn
   thêm nữa. Tất nhiên tính năng này khác so với tính năng spring tab để
   chuyển sang xem collection khác."

   So it gets both, and it is kept visibly distinct from the spine beside it:

     · The arrows are small, inline and sit on the panel's own heading row,
       next to the count they page through. The spine is the tall coloured
       edge on the left. Nothing about the two reads the same.
     · The bar under the tiles is proportional — its width is the fraction of
       the collection currently on screen — so it says how much more there is,
       not merely that there is more.

   Both appear only at four items or more. At three there is nothing to page
   to, and an arrow that cannot move is a worse signal than no arrow. */
function CollectionShelf({
  collection,
  tone,
  onOpen,
}: {
  collection: HomeCollection;
  tone: (typeof PANEL_TONES)[number];
  onOpen: (p: Product) => void;
}) {
  const PER_PAGE = 3;
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(collection.items.length / PER_PAGE));
  const pageable = collection.items.length > PER_PAGE;

  /* A collection that is swapped for a shorter one must not stay on a page
     that no longer exists. */
  useEffect(() => {
    setPage((p) => Math.min(p, pages - 1));
  }, [pages]);

  const shown = collection.items.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="display truncate text-[clamp(1.4rem,2.2vw,2.1rem)] normal-case leading-[1.25]">
          {collection.name}
        </h3>

        <span className="flex shrink-0 items-center gap-3">
          <span className={`text-[11px] tabular-nums tracking-[0.16em] ${tone.muted}`}>
            {String(collection.items.length).padStart(2, "0")} MÓN
          </span>
          {pageable && (
            <span className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                aria-label={`Xem ${PER_PAGE} món trước của ${collection.name}`}
                className="grid h-7 w-7 place-items-center rounded-full border border-current opacity-60 transition-opacity hover:opacity-100 disabled:opacity-20"
              >
                <ArrowRight className="h-3.5 w-3.5 rotate-180" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
                disabled={page === pages - 1}
                aria-label={`Xem ${PER_PAGE} món tiếp theo của ${collection.name}`}
                className="grid h-7 w-7 place-items-center rounded-full border border-current opacity-60 transition-opacity hover:opacity-100 disabled:opacity-20"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
        </span>
      </div>

      <div className="mt-4 grid min-h-0 flex-1 grid-cols-3 gap-3">
        {shown.map((p) => (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpen(p)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              onOpen(p);
            }}
            className={`group/tile group flex min-h-0 cursor-pointer flex-col text-left ${tone.tile}`}
          >
            <span className="relative block min-h-0 flex-1 overflow-hidden">
              <img
                src={p.images[0]}
                alt={p.name}
                loading="lazy"
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
              />
              {/* everywhere a product photograph is (07/09) */}
              <span className="absolute right-0 top-0 z-10">
                <SaveButton product={p} revealOnHover />
              </span>
            </span>
            <span className="flex items-baseline justify-between gap-2 p-2">
              <span className="truncate text-xs font-medium">{p.name}</span>
              <span className={`shrink-0 text-[11px] ${tone.muted}`}>{formatPrice(p.price)}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Proportional, so it says how much more rather than only that there is
          more. Presentational — the arrows above are the control. */}
      {pageable && (
        <div aria-hidden="true" className="mt-3 h-[3px] w-full rounded-full bg-current/15">
          <div
            className="h-full rounded-full bg-current/60 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              width: `${100 / pages}%`,
              transform: `translateX(${page * 100}%)`,
            }}
          />
        </div>
      )}
    </>
  );
}

function CollectionsSpringTabs({
  collections,
  onOpen,
}: {
  collections: HomeCollection[];
  onOpen: (p: Product) => void;
}) {
  const [open, setOpen] = useState(0);
  const wide = useMediaQuery("(min-width: 768px)");

  if (collections.length === 0) return null;

  const heading = (
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
  );

  const seeMore = (
    <div className="mt-8 flex justify-center px-5 pb-4 md:px-10">
      <Link
        to="/products"
        className="group inline-flex items-center gap-3 border-b border-white/40 pb-1 text-sm font-semibold text-paper transition-colors hover:border-wave hover:text-wave"
      >
        Còn nhiều bộ sưu tập khác
        <ArrowUpRight className="h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </Link>
    </div>
  );

  /* Stacked on phones. A 3.25rem spine times four leaves nothing for the open
     panel at 390px, and the sketch's whole point is that the open one is
     wide. */
  if (!wide) {
    return (
      <section id="dong-collections" className="border-t border-white/20 bg-brand text-paper">
        {heading}
        <div className="mt-10 space-y-3 px-5">
          {collections.map((c, i) => {
            const tone = PANEL_TONES[i % PANEL_TONES.length];
            const isOpen = i === open;
            return (
              <div key={c.id} className={`${tone.fill} ${tone.text}`}>
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-baseline justify-between gap-3 p-4 text-left"
                >
                  <span className="display text-xl normal-case leading-[1.25]">{c.name}</span>
                  <span className="shrink-0 text-[11px] tabular-nums tracking-[0.16em] opacity-60">
                    {String(c.items.length).padStart(2, "0")} MÓN
                  </span>
                </button>
                {isOpen && (
                  <div className="lab-spring-contents grid grid-cols-3 gap-2 px-4 pb-4">
                    {c.items.slice(0, 3).map((p) => (
                      <div
                        key={p.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onOpen(p)}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter" && e.key !== " ") return;
                          e.preventDefault();
                          onOpen(p);
                        }}
                        aria-label={p.name}
                        className={`group/tile relative aspect-square cursor-pointer overflow-hidden ${tone.tile}`}
                      >
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          loading="lazy"
                          draggable={false}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute right-0 top-0 z-10">
                          <SaveButton product={p} revealOnHover />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {seeMore}
      </section>
    );
  }

  return (
    <section id="dong-collections" className="border-t border-white/20 bg-brand text-paper">
      {heading}

      {/* One row, panels sharing it by flex-grow. The open one takes the room
          the closed spines give up, so nothing is ever mid-air — which is what
          makes it read as one mechanism rather than four panels animating. */}
      <div className="mt-10 flex h-[clamp(22rem,52dvh,29rem)] gap-1 overflow-hidden px-5 md:px-10">
        {collections.map((c, i) => {
          const tone = PANEL_TONES[i % PANEL_TONES.length];
          const isOpen = i === open;

          return (
            <div
              key={c.id}
              className={`lab-spring-panel relative flex overflow-hidden ${tone.fill} ${tone.text}`}
              style={{ ["--lab-grow" as string]: isOpen ? 10 : 1 }}
            >
              {/* The spine is the control, and it stays put when the panel
                  opens — so the thing you pressed is still under your cursor.
                  Pressing the open one again does nothing: see the note above
                  on why the page cannot afford an all-closed row. */}
              <button
                onClick={() => setOpen(i)}
                aria-expanded={isOpen}
                aria-label={`${c.name} — ${c.items.length} món`}
                className={`flex w-[3.25rem] shrink-0 flex-col items-center justify-between py-5 ${tone.spine}`}
              >
                <span className="text-[11px] tabular-nums tracking-[0.16em] opacity-70">
                  {c.index}
                </span>
                <span className="lab-spine-label text-[11px] font-semibold uppercase tracking-[0.22em]">
                  {c.name}
                </span>
                <span aria-hidden="true" className="h-5 w-px bg-current opacity-30" />
              </button>

              {isOpen && (
                <div className="lab-spring-contents flex min-w-0 flex-1 flex-col py-5 pr-5">
                  <CollectionShelf collection={c} tone={tone} onOpen={onOpen} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {seeMore}
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


/* ── page ───────────────────────────────────────────────────────────────── */

export default function Homepage() {
  const navigate = useNavigate();
  const { loading, error, reload, heroFrames, popular, collections, routes, gems } = useHomeData();

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
      {/* content sheet — opaque, scrolls over the stationary footer */}
      <RevealFooterLayout sheet="bg-brand">
        <div>
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
        {/* The seam that used to sit here is inside HowItWorks now: it has to
            stick with the pin, and only a child of the pinned wrapper can. */}
        <HowItWorks />

        {/* white → violet. The guidelines also offer a chapter-front device
            (flat field + ribbon, see BrandChapterDivider) but using it here
            would put a "Bộ sưu tập" title back above a section whose whole
            point is that it opens on "Chưa biết mua gì?" — so the wave, which
            is the book's transition device, carries the change of ground. */}
        {/* white → violet */}
        {/* No gradient into "Chưa biết mua gì?" any more. The crest inside
            HowItWorks is the whole transition now — it rises out of this
            section's own violet, so the two grounds meet on the shape rather
            than on a fade. */}
        <CollectionsSpringTabs collections={collections} onOpen={open} />

        {/* violet → the deeper violet the map now sits on. The map used to be
            bg-ink and the team asked for that black to go (26/08), so the two
            seams either side of it move with it. */}
        <GroundBlend from="brand" to="brand-deep" />
        {/* One pin, and the whole island is the way through — 08/09: "Khi
            user click vào bất cứ đâu trên bản đồ đó, sẽ redirect sang
            /discover." It opens the region the list has selected, so the
            choice made here survives the navigation. */}
        <DistrictMap
          routes={routes}
          onOpenRoute={(routeId) => navigate(`/discover/${routeId}`)}
        />

        {/* No blend below it any more: the map and the collaborate band are
            both brand-deep, so there is no ground change left to ramp. */}
        <Collaborate />
        </div>
      </RevealFooterLayout>
    </div>
  );
}
