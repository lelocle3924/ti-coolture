import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ArcTopRight, RibbonLoop } from "../components/BrandShapes";
import { useReducedMotion } from "./useAutoHideChrome";

/* ═══════════════════════════════════════════════════════════════════════════
   BRAND DEVICE LAYER

   Source: docs/BRAND-GUIDELINES-TÍ-COOLTURE.pdf, read 19/08. The three marks
   and what the book says they mean:

     · brand-ribbon-loop  (p15, "dấu hiệu nhận diện")
       The knot with the negative-space eye/fish. "Sự giao thoa" — crossing,
       intersection — and the emblem painted on a Vietnamese fishing boat,
       carrying the idea of reaching far.

     · brand-arc-top-right (p15)
       "Đường cong thể hiện sự kết nối" — the curve means connection.

     · brand-wave-bottom  (p16, "dấu hiệu phụ trợ")
       The current: the market, its churn, the creative environment around it.
       A boat cannot sail without water. Combined with the logo it also reads
       as a launchpad, lifting makers up and outward.

   Two rules the book is explicit about and every variant here obeys:

     · Ratio (p13): 60% violet #7520F7, 30% white #FFFFFF, 10% teal #39D6CF.
       Note there is no black in the ratio — the 30% is white, and ink is a
       text colour rather than a ground.
     · Restraint (p17): "cần tiết chế độ to của dấu hiệu tránh tranh chấp" —
       hold the marks back in size so they never compete with the logo or the
       type, and keep them clear of the logo's safe area.
   ═══════════════════════════════════════════════════════════════════════════ */

export type BrandVariant = "none" | "c1" | "c2" | "c3";

export const BrandContext = createContext<BrandVariant>("none");
export const useBrand = () => useContext(BrandContext);

/** Ground tokens the seam can bridge between. */
type Ground = "brand" | "brand-deep" | "paper" | "ink" | "wave";

const GROUND_VAR: Record<Ground, string> = {
  brand: "var(--color-brand)",
  "brand-deep": "var(--color-brand-deep)",
  paper: "var(--color-paper)",
  ink: "var(--color-ink)",
  wave: "var(--color-wave)",
};

/* ── scroll position, shared by the motion-driven devices ──────────────── */

function useScrollY(): number {
  const [y, setY] = useState(0);
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setY(window.scrollY);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return y;
}

/** How far an element has travelled through the viewport, −1 … 1. */
function useElementProgress(ref: { current: HTMLElement | null }): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const span = rect.height + window.innerHeight || 1;
        setP(Math.min(1, Math.max(0, (window.innerHeight - rect.top) / span)) * 2 - 1);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [ref]);
  return p;
}

/* ── the wave, used as the seam between two grounds ────────────────────── */

/**
 * The real `brand-wave-bottom` path (1920×698), placed at the foot of a
 * section and filled with the *next* section's ground, so the next section
 * reads as rising into this one — the composition the guidelines use on the
 * cover and on every application page.
 *
 * C2 lets the crest drift with scroll, because the book describes the wave as
 * a current rather than a fixed edge ("luôn linh hoạt, chuyển động").
 */
/** The closed fill, and the same curve as an open path for the crest line. */
const WAVE_FILL =
  "M-1.95,318.33s476.18-70.31,773.39,147,348.35-159.13,572.06-157.87,242.89,113.12,345.16,161.06S1567.21,35,1922,.87V698.63H-1.95Z";
const WAVE_CREST =
  "M-1.95,318.33s476.18-70.31,773.39,147,348.35-159.13,572.06-157.87,242.89,113.12,345.16,161.06S1567.21,35,1922,.87";

export function BrandWaveSeam({
  to,
  height = "7vw",
  className = "",
  /** Teal hairline along the crest — the only thing that reads when the wave
      bridges two grounds of the same colour, as it does under the hero. */
  crest = false,
}: {
  to: Ground;
  height?: string;
  className?: string;
  crest?: boolean;
}) {
  const variant = useBrand();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const progress = useElementProgress(ref);

  if (variant === "none") return null;

  const drift = variant === "c1" || reduced ? 0 : progress * 4;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none relative w-full overflow-hidden ${className}`}
      style={{ height, marginBottom: -1 }}
    >
      <svg
        viewBox="0 0 1920 698"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        style={{
          transform: `translateX(${drift}%) scaleX(1.12)`,
          transformOrigin: "50% 100%",
        }}
      >
        <path fill={GROUND_VAR[to]} d={WAVE_FILL} />
        {crest && (
          <path
            d={WAVE_CREST}
            fill="none"
            stroke="var(--color-wave)"
            strokeWidth="10"
            vectorEffect="non-scaling-stroke"
            opacity="0.85"
          />
        )}
      </svg>
    </div>
  );
}

/* ── the arc: connection ───────────────────────────────────────────────── */

/**
 * Bleeds off the top-right corner, as on the guidelines cover. Held to a
 * fraction of the viewport so it never crowds the wordmark in the nav — the
 * clear-space rule on p17.
 *
 * C2 turns it into a connector that closes as the page advances: the arc is
 * the mark for "sự kết nối", so it earns its keep by reporting how far the
 * visitor has come.
 */
export function BrandArcCorner({ className = "" }: { className?: string }) {
  const variant = useBrand();
  const reduced = useReducedMotion();
  const y = useScrollY();

  if (variant === "none") return null;

  const spin = variant === "c1" || reduced ? 0 : Math.min(24, y / 90);

  return (
    <ArcTopRight
      className={`pointer-events-none absolute right-0 top-0 z-0 ${className}`}
      style={{
        width: "clamp(9rem, 22vw, 22rem)",
        transform: `translate(28%, -24%) rotate(${spin}deg)`,
        transformOrigin: "50% 50%",
        opacity: variant === "c3" ? 0.9 : 0.75,
      }}
      fill="var(--color-wave)"
    />
  );
}

/* ── the ribbon: crossing, and reaching far ────────────────────────────── */

/**
 * Sits astride a seam, the way the cover sets it across the wave's edge.
 * C2 draws it in on first sight rather than having it simply be there.
 */
export function BrandRibbonMark({
  className = "",
  width = "clamp(7rem, 14vw, 15rem)",
  dot = "var(--color-brand)",
}: {
  className?: string;
  width?: string;
  dot?: string;
}) {
  const variant = useBrand();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (variant === "c1" || reduced) {
      setSeen(true);
      return;
    }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    const failsafe = window.setTimeout(() => setSeen(true), 5000);
    return () => {
      io.disconnect();
      window.clearTimeout(failsafe);
    };
  }, [variant, reduced]);

  if (variant === "none") return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute z-10 ${className}`}
      style={{
        width,
        opacity: seen ? 1 : 0,
        transform: seen ? "translateY(0) rotate(0deg)" : "translateY(18px) rotate(-6deg)",
        transition: reduced ? "none" : "opacity 700ms ease, transform 900ms cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <RibbonLoop ribbon="var(--color-wave)" dot={dot} />
    </div>
  );
}

/* ── C3 · the wave as the page's progress ──────────────────────────────── */

/**
 * C3 replaces the progress rail with a rising tide: the brand wave fills from
 * the foot of the screen as the page is read. The book calls the wave a
 * launchpad that lifts things up, so letting it rise with the reader is the
 * literal reading of that line.
 *
 * Deliberately low-contrast and behind everything — it is ambient, not chrome.
 */
export function BrandTideProgress({ progress }: { progress: number }) {
  const variant = useBrand();
  if (variant !== "c3") return null;

  const height = 4 + progress * 26; // vh

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-0 overflow-hidden"
      style={{ height: `${height}vh` }}
    >
      <svg
        viewBox="0 0 1920 698"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <path
          fill="var(--color-wave)"
          fillOpacity="0.16"
          d="M-1.95,318.33s476.18-70.31,773.39,147,348.35-159.13,572.06-157.87,242.89,113.12,345.16,161.06S1567.21,35,1922,.87V698.63H-1.95Z"
        />
      </svg>
    </div>
  );
}

/* ── C3 · the ribbon's eye as an aperture ──────────────────────────────── */

/**
 * The eye is the ribbon's negative space — the part the book singles out as
 * the emblem's meaning. C3 promotes it from ornament to structure: the hero
 * frame is seen *through* it.
 *
 * Returns a clip-path id to hang on an element, plus the <defs> to render.
 * Falls back to no clipping wherever the variant is not C3, so the image is
 * never cropped by a device the visitor cannot see.
 */
export const RIBBON_EYE_CLIP_ID = "lab-ribbon-eye-clip";

export function BrandRibbonEyeDefs() {
  const variant = useBrand();
  if (variant !== "c3") return null;

  return (
    <svg aria-hidden="true" className="pointer-events-none absolute h-0 w-0">
      <defs>
        <clipPath id={RIBBON_EYE_CLIP_ID} clipPathUnits="objectBoundingBox">
          {/* the eye, traced from the ribbon's negative space and normalised */}
          <path d="M0,0.5 C0.16,0.12 0.42,0 0.62,0 C0.84,0 1,0.2 1,0.5 C1,0.8 0.84,1 0.62,1 C0.42,1 0.16,0.88 0,0.5 Z" />
        </clipPath>
      </defs>
    </svg>
  );
}

/* ── section divider, after the guidelines' own chapter pages ──────────── */

/**
 * Pages 3, 10, 12 and 14 of the book all use one device to open a chapter: a
 * flat field of a brand colour with the ribbon drawn large in white, bleeding
 * off the right edge, and the chapter title small in the top-left. C1 borrows
 * it verbatim; C3 lets the field carry a title at display size.
 */
export function BrandChapterDivider({
  label,
  sub,
  ground = "brand",
}: {
  label: string;
  sub?: string;
  ground?: Ground;
}) {
  const variant = useBrand();
  if (variant === "none") return null;

  const onLight = ground === "paper" || ground === "wave";
  const ink = onLight ? "text-ink" : "text-paper";

  return (
    <section
      aria-label={label}
      className="relative overflow-hidden"
      style={{ backgroundColor: GROUND_VAR[ground] }}
    >
      <div className={`relative z-10 px-5 py-14 md:px-10 md:py-20 xl:px-24 ${ink}`}>
        <p className="text-[11px] tracking-[0.22em] opacity-70">{label.toUpperCase()}</p>
        {sub && (
          <p
            className={`display mt-3 max-w-[18ch] text-[clamp(1.75rem,4vw,3rem)] normal-case leading-[1.05] ${
              variant === "c3" ? "" : "opacity-90"
            }`}
          >
            {sub}
          </p>
        )}
      </div>

      <RibbonLoop
        className="pointer-events-none absolute right-0 top-1/2 z-0 -translate-y-1/2 translate-x-[22%]"
        style={{ width: "clamp(8rem, 20vw, 20rem)", opacity: onLight ? 0.9 : 0.55 }}
        ribbon={onLight ? "var(--color-wave)" : "var(--color-paper)"}
        dot={onLight ? "var(--color-brand)" : "var(--color-wave)"}
      />
    </section>
  );
}
