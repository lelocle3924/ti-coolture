import { useCallback, useEffect, useRef } from "react";
import { useReducedMotion } from "../lib/useAutoHideChrome";
import { usePauseOffscreen } from "../lib/usePauseOffscreen";

/**
 * The band that crosses the hero.
 *
 * Direction C from /lab/hero-wave — "Sóng biển" — chosen by the team on
 * 09/09. It replaces the teal arc that used to sweep out of the bottom-left
 * corner: "hiện tại cái arc đang chỉ vào hư vô", which it did, being a
 * fragment of a shape whose rest was off the page.
 *
 * ── the drawing ─────────────────────────────────────────────────────────
 * A stroke, not a filled shape. A filled band needs two edges drawn and kept
 * parallel; a stroked centreline gets its second edge for free and holds its
 * thickness exactly constant however sharply the curve turns — which is what
 * "độ dày của con sóng" being a single number requires.
 *
 * vector-effect="non-scaling-stroke" is what lets that thickness be stated in
 * screen units while the curve itself stretches to whatever width the page
 * is. Without it the band would thin out on a narrow window, because
 * preserveAspectRatio="none" scales the stroke along with the geometry.
 *
 * ── where it sits, and why exactly there ────────────────────────────────
 * Team 09/09: "điểm chính giữa của điểm nút bên mép trái của nó trùng với
 * cạnh dưới của element WaveOnEnd của BrandSurround, điểm bên phải thì cùng
 * độ cao đó. Mục đích là để cho điểm mút của wave che đi cạnh trắng."
 *
 * BrandSurround's white plate runs from 21.4% to 75.4% of the hero, and the
 * wave stood on end is bled a pixel past it — so the plate finishes on a
 * white horizontal edge at 75.4%, against violet, with nothing to explain it.
 * Both ends of this band are pinned to that line, and the band is thick
 * enough that the edge is inside it at every point of the animation.
 *
 * The pinning is arithmetic rather than a guess. The curve lives in a
 * 1200×120 box placed at TOP% of the hero with HEIGHT% of its height, so an
 * end node at y = END lands at
 *
 *     TOP + (END / 120) × HEIGHT   =   59.4 + (64/120) × 30   =   75.4%
 *
 * Change any one of the three and the identity has to be re-solved; PLATE in
 * BrandSurround is the number it has to come out to.
 *
 * ── the motion ──────────────────────────────────────────────────────────
 * "2 đầu mút của nó chuyển động lên xuống ngẫu nhiên với biên độ nhỏ, còn
 * đoạn giữa thì nhảy lên nhảy xuống cao thấp ngẫu nhiên với biên độ lớn hơn,
 * kiểu như sóng trên biển."
 *
 * The amplitude envelope is the whole idea: a bell across the width, so the
 * ends barely move and the middle travels seven times as far. That is what a
 * rope held at both ends does, and it is why this reads as water rather than
 * as a banner. It is also why the ends can be pinned at all — they are the
 * quiet part of the motion by construction.
 *
 * "Ngẫu nhiên" is two sines per node at an irrational-looking frequency
 * ratio, not Math.random(). Random values would need smoothing anyway, and
 * this way the motion is continuous by construction, never visibly repeats,
 * and is identical on every machine, so one screenshot can be compared to
 * another.
 */

const VIEW_W = 1200;
const VIEW_H = 120;

/** Where the box sits in the hero, and how much of it the curve may cross. */
const TOP = 59.4;
const HEIGHT = 30;

/** The y both ends rest at. TOP + (END/120)·HEIGHT = 75.4% — the plate's foot. */
const END = 64;

/**
 * The curve. Eleven nodes; the first and last pair share END, so the band
 * arrives at both screen edges level and its round caps are off-screen.
 */
const NODE_X = [-90, 0, 150, 300, 450, 600, 750, 900, 1050, 1200, 1290];
const NODE_Y = [END, END, 44, 32, 46, 76, 94, 84, 58, END, END];

/** 4 units at the ends, 28 in the middle. The exponent flattens the shoulders. */
function amplitude(i: number, n: number): number {
  return 4 + 24 * Math.pow(Math.sin((Math.PI * i) / (n - 1)), 1.4);
}

function noise(t: number, i: number): number {
  return 0.62 * Math.sin(t * 0.83 + i * 1.7) + 0.38 * Math.sin(t * 1.27 + i * 2.9 + 1.1);
}

/**
 * A smooth cubic through every node — Catmull-Rom, converted to Béziers.
 *
 * Through the points rather than near them, because the points are what the
 * sea moves. Tension 1/6 is the standard uniform form; the ends reuse their
 * neighbour so the curve does not flick where it leaves the screen.
 */
function pathThrough(xs: number[], ys: number[]): string {
  const n = xs.length;
  const at = (i: number) => {
    const j = Math.max(0, Math.min(n - 1, i));
    return { x: xs[j], y: ys[j] };
  };

  let d = `M${xs[0].toFixed(1)} ${ys[0].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    d +=
      ` C${(p1.x + (p2.x - p0.x) / 6).toFixed(1)} ${(p1.y + (p2.y - p0.y) / 6).toFixed(1)}` +
      ` ${(p2.x - (p3.x - p1.x) / 6).toFixed(1)} ${(p2.y - (p3.y - p1.y) / 6).toFixed(1)}` +
      ` ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

const RESTING_D = pathThrough(NODE_X, NODE_Y);

/** How fast the sea runs. */
const SPEED = 0.9;

export default function HeroWave({ className = "" }: { className?: string }) {
  const pathRef = useRef<SVGPathElement>(null);
  const reduced = useReducedMotion();
  const { ref: host, paused } = usePauseOffscreen<HTMLDivElement>();

  /* Time lives in a ref rather than in the effect, so scrolling the hero out
     of view and back holds the sea where it was instead of snapping it to
     t = 0 — the same rule the marquee lanes follow. */
  const clock = useRef(0);

  const draw = useCallback((t: number) => {
    const el = pathRef.current;
    if (!el) return;
    const n = NODE_X.length;
    const ys = NODE_Y.map((base, i) => base + amplitude(i, n) * noise(t * SPEED, i));
    // straight to the attribute: React state at 60fps would re-render the
    // whole homepage three times a frame for a value only the path reads
    el.setAttribute("d", pathThrough(NODE_X, ys));
  }, []);

  useEffect(() => {
    if (reduced || paused) return;

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      // capped, so a backgrounded tab does not resume with one huge step
      clock.current += Math.min(0.05, (now - last) / 1000);
      last = now;
      draw(clock.current);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [draw, paused, reduced]);

  return (
    /* A real box, not `display: contents`: usePauseOffscreen measures this
       element, and an element with no box measures 0×0 — the observer would
       report it off screen for good and the sea would never move. */
    <div ref={host} aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="absolute inset-x-0 overflow-visible"
        style={{ top: `${TOP}%`, height: `${HEIGHT}%` }}
      >
        <path
          ref={pathRef}
          d={RESTING_D}
          fill="none"
          stroke="var(--color-wave)"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          /* 5% of the page height on a phone, 17% on a desktop — the middle
             of the 15–20% the note allows. */
          className="[stroke-width:5vh] md:[stroke-width:17vh]"
        />
      </svg>
    </div>
  );
}
