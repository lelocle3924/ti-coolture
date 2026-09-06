import { useEffect, useRef, useState } from "react";

/**
 * The bending seam between two grounds.
 *
 * Team 31/08: the boundary between "What's in store" and "Cách đặt hàng"
 * should bend rather than fade. While the seam sits low on screen the ground
 * below bulges UP into the one above; crossing the middle of the viewport it
 * flattens; near the top the ground above has bulged DOWN into the one below.
 * One boundary, inverting as it travels.
 *
 * Lives in src/home rather than src/lab because both the homepage and the lab
 * study draw it, and they have to stay the same drawing — this was proven in
 * the lab at /lab/how and then folded in, so there is exactly one copy of the
 * geometry.
 */

/* ── the bending seam ─────────────────────────────────────────────────────
   One quadratic across the band. `bend` runs -1 → +1 as the seam travels from
   the bottom of the viewport to the top, and the apex offset is bend × the
   sagitta, so the curve inverts through flat exactly at the middle of the
   screen. */

const VB_W = 1000;

/* Band height as a multiple of the sagitta. The curve's extremes are exactly
   ±sagitta from the flat line, so 2.0 is the floor; 2.1 leaves a hair of slack
   without turning the band into a slab of dead whitespace. It was 2.4, which
   put 22px of nothing beyond each extreme at 1440px — and since the band sits
   between two sections, every one of those pixels was pushing them apart. */
const BAND_FACTOR = 2.1;

export function useSeamBend(ref: { current: HTMLElement | null }) {
  const [bend, setBend] = useState(-1);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const middle = rect.top + rect.height / 2;
      /* 1 while the seam sits on the bottom edge of the screen, 0 at the top.
         Guard the viewport height: a 0 would make this NaN. */
      const vh = window.innerHeight || 1;
      const t = middle / vh;
      setBend(Math.max(-1, Math.min(1, 1 - 2 * t)));
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ref]);

  return bend;
}

export function BendingSeam({
  sagittaRatio,
  above,
  below,
  onMeasure,
  collapse = false,
}: {
  /** Deepest bend as a fraction of the seam's own width. */
  sagittaRatio: number;
  /**
   * Take the band out of the flow so it costs no vertical space.
   *
   * The band is (2.1 × sagitta) tall with the flat line across its middle, so
   * in normal flow it holds the two sections half a band apart on each side —
   * ~113px each at 1440px, on top of whatever padding they already have. That
   * was most of the gap the team called out on 06/09.
   *
   * Pulling half a band off each margin collapses that to zero and lets the
   * seam paint ACROSS the join instead: its purple upper half lands on the
   * purple section above, its white lower half on the white one below, and
   * both halves are already the colour they cover. The only thing the
   * neighbours then have to promise is enough padding of their own that the
   * band never reaches their content — hence the max(..., 7.875%) paddings on
   * both sides, 7.875% being exactly half a band.
   */
  collapse?: boolean;
  /** Colour of the section above — this is what the path paints. */
  above: string;
  /** Colour of the section below — the band's own ground. */
  below: string;
  onMeasure?: (m: { widthPx: number; sagittaPx: number }) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const bend = useSeamBend(ref);

  /* Everything below is in viewBox units, and the band's aspect ratio is set
     from the same numbers — so the drawn shape is width-independent. */
  const sagitta = VB_W * sagittaRatio;
  const height = sagitta * BAND_FACTOR;
  const edge = height / 2;
  const apexOffset = sagitta * bend;
  // a quadratic's apex sits halfway between its endpoints and its control
  const control = edge + apexOffset * 2;

  /* A ResizeObserver, not a window resize listener: the width control narrows
     the column through React state, which never fires a window resize — so a
     listener kept reporting 1440px while the seam was actually 375px wide, and
     the readout that exists to prove the ratio was the one thing lying about
     it. */
  useEffect(() => {
    if (!onMeasure) return;
    const el = ref.current;
    if (!el) return;

    const report = () => {
      const w = el.getBoundingClientRect().width;
      onMeasure({ widthPx: Math.round(w), sagittaPx: Math.round(w * sagittaRatio) });
    };

    const observer = new ResizeObserver(report);
    observer.observe(el);
    report();
    return () => observer.disconnect();
  }, [onMeasure, sagittaRatio]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none relative w-full"
      style={{
        aspectRatio: String(VB_W / height),
        background: below,
        /* Margin percentages resolve against the containing block's WIDTH, and
           the band is that width — so half the band's height is exactly
           (sagittaRatio × BAND_FACTOR / 2) of it, at any size. */
        ...(collapse
          ? {
              marginTop: `-${((sagittaRatio * BAND_FACTOR) / 2) * 100}%`,
              marginBottom: `-${((sagittaRatio * BAND_FACTOR) / 2) * 100}%`,
              // paints over the section that follows, which comes later in the
              // DOM and would otherwise cover the downward bulge with its own
              // background
              zIndex: 1,
            }
          : { marginTop: -1, marginBottom: -1 }),
      }}
    >
      <svg
        viewBox={`0 0 ${VB_W} ${height}`}
        preserveAspectRatio="none"
        className="absolute inset-0 block h-full w-full"
      >
        <path
          fill={above}
          d={`M0,0 L${VB_W},0 L${VB_W},${edge} Q${VB_W / 2},${control} 0,${edge} Z`}
        />
      </svg>
    </div>
  );
}
