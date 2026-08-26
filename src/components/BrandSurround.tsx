import { ArcTopRight, RibbonLoop } from "./BrandShapes";

/**
 * The identity layer that sits in the violet field around the hero.
 *
 * Team direction (26/08): the arc goes left, the ribbon loop goes right, both
 * at 80% opacity over the violet, with a looping line running across the page
 * between them. This replaces the three brand-device studies (C1/C2/C3) —
 * they are deleted.
 *
 * Three decisions worth stating, because each one is a constraint rather than
 * a preference:
 *
 * · Nothing here animates. The hero deck is already the one moving thing on
 *   this screen, and a drifting background would be a second — the exact
 *   "attention tax" flagged against Direction A's marquee. Static loops still
 *   read as running across the page.
 * · The run is an SVG <pattern> in userSpaceOnUse, not a repeated element or a
 *   background-image. It tiles seamlessly at any viewport width because the
 *   motif starts and ends on the same baseline with the same horizontal
 *   tangent, so the joins between tiles are invisible.
 * · Everything is aria-hidden and pointer-events-none. These marks carry no
 *   information — the wordmark in the nav does that — so they must not appear
 *   in the accessibility tree or intercept a click.
 */

/** One period of the run: a line that rises, ties a loop, and settles back.
 *  240 × 80 user units. Starts (0,46) and ends (240,46), both horizontal. */
const LOOP_PERIOD = 240;
const LOOP_HEIGHT = 80;
const LOOP_PATH =
  "M0 46 C34 46 52 46 70 40 C92 32 108 14 96 6 C86 -1 74 8 78 22 " +
  "C82 36 104 46 128 48 C160 51 200 48 240 46";

export function BrandLoopRun({
  className = "",
  stroke = "var(--color-wave)",
  opacity = 0.8,
  strokeWidth = 3,
}: {
  className?: string;
  stroke?: string;
  opacity?: number;
  strokeWidth?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      className={`block w-full ${className}`}
      height={LOOP_HEIGHT}
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity }}
    >
      <defs>
        <pattern
          id="brand-loop-run"
          patternUnits="userSpaceOnUse"
          width={LOOP_PERIOD}
          height={LOOP_HEIGHT}
        >
          <path
            d={LOOP_PATH}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </pattern>
      </defs>
      <rect width="100%" height={LOOP_HEIGHT} fill="url(#brand-loop-run)" />
    </svg>
  );
}

/**
 * The full surround: arc bleeding off the left, ribbon loop off the right,
 * and the run threaded between them.
 *
 * Sized in vw so the marks keep their proportion to the field rather than to
 * the text — on a 1366px laptop they stay marks, and they do not grow into
 * the hero deck on a wide monitor.
 */
export default function BrandSurround({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* The run threads through the violet band *below* the deck rather than
          behind it — behind the deck it would be covered at every width that
          matters, which is most of them. */}
      <div className="absolute inset-x-0 bottom-[2.5rem] hidden md:block">
        <BrandLoopRun opacity={0.8} />
      </div>
      {/* on a phone the band under the deck is too shallow, so it runs up top */}
      <div className="absolute inset-x-0 top-[4.5rem] md:hidden">
        <BrandLoopRun opacity={0.8} strokeWidth={2.5} />
      </div>

      {/* arc — left, bled off the edge, rotated so the opening faces in */}
      <ArcTopRight
        className="absolute -left-[7vw] top-[18%] rotate-180"
        style={{ width: "clamp(7rem, 13vw, 15rem)", opacity: 0.8 }}
        fill="var(--color-wave)"
      />

      {/* ribbon loop — right, the knot the run is tied with */}
      <RibbonLoop
        className="absolute -right-[6vw] bottom-[10%]"
        style={{ width: "clamp(8rem, 15vw, 18rem)", opacity: 0.8 }}
        ribbon="var(--color-wave)"
        dot="var(--color-brand)"
      />
    </div>
  );
}
