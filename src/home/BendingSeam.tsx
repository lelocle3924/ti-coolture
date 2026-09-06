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
}: {
  /** Deepest bend as a fraction of the seam's own width. */
  sagittaRatio: number;
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
  const height = sagitta * 2.4; // room for the full swing either side of flat
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
        // hairline insurance against subpixel gaps at the section joins
        marginTop: -1,
        marginBottom: -1,
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
