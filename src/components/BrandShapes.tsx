import type React from "react";

/**
 * The brand's supporting marks ("dấu hiệu phụ trợ"), inlined so their fills can
 * be driven per placement. Paths are verbatim from
 * src/assets/brand/brand-wave-bottom.svg, brand-ribbon-loop.svg and
 * brand-arc-top-right.svg.
 */

/**
 * The flow wave. Rendered as the WHITE negative space at the foot of the violet
 * hero, so the crest is the seam into the section below rather than a decoration
 * sitting on top of it. `fill` is therefore the colour of the *next* section.
 */
export function WaveBottom({
  className = "",
  fill = "var(--color-paper)",
}: {
  className?: string;
  fill?: string;
}) {
  /* The band is height-constrained but the curve must keep its drawn
     proportions, so the SVG renders at its natural 1920:698 ratio (width-led,
     height auto) and the wrapper crops the excess off the top. Forcing the
     viewBox to the band height instead — preserveAspectRatio="none" — flattens
     the curve into a different shape entirely. */
  return (
    <div className={`pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
      <svg viewBox="0 0 1920 698" className="absolute inset-x-0 bottom-0 block h-auto w-full">
        <path
          fill={fill}
          d="M-1.95,318.33s476.18-70.31,773.39,147,348.35-159.13,572.06-157.87,242.89,113.12,345.16,161.06S1567.21,35,1922,.87V698.63H-1.95Z"
        />
      </svg>
    </div>
  );
}

/**
 * Hero horizon — verbatim from src/assets/brand/brand-wave-bottom-extended.svg.
 *
 * Straight along the left half to x=959, then the wave breaks across the
 * bottom-right corner. Ratio 1915:349, so the band is ~18.2% of its width and
 * the curve holds its drawn proportions at any size. The source file fills
 * violet; here it is rendered as the white negative space, so `fill` is the
 * colour of the section below.
 */
export function WaveBottomExtended({
  className = "",
  fill = "var(--color-paper)",
}: {
  className?: string;
  fill?: string;
}) {
  return (
    <svg viewBox="0 0 1915 349" aria-hidden="true" className={`block h-auto w-full ${className}`}>
      <path
        fill={fill}
        d="M959 158.785C1006 157.5 1197.1 123.617 1345.71 232.31C1494.31 341.002 1519.88 152.718 1631.74 153.348C1743.6 153.978 1753.19 209.927 1804.33 233.905C1844 254.5 1743.6 17.0709 1921 0V349H959H0V158.785C0 158.785 912 160.069 959 158.785Z"
      />
    </svg>
  );
}

/** Unique curve for Products subpage - gentle swell on the right */
export function WaveProducts({
  className = "",
  fill = "var(--color-paper-warm)",
}: {
  className?: string;
  fill?: string;
}) {
  return (
    <svg viewBox="0 0 1920 200" aria-hidden="true" className={`block h-auto w-full ${className}`}>
      <path
        fill={fill}
        d="M0 160 C 600 160, 1000 160, 1400 80 C 1700 20, 1800 60, 1920 40 L1920 200 L0 200 Z"
      />
    </svg>
  );
}

/** Unique curve for Stores subpage - soft double ripple */
export function WaveStores({
  className = "",
  fill = "var(--color-paper-warm)",
}: {
  className?: string;
  fill?: string;
}) {
  return (
    <svg viewBox="0 0 1920 200" aria-hidden="true" className={`block h-auto w-full ${className}`}>
      <path
        fill={fill}
        d="M0 170 C 400 170, 700 120, 1000 140 C 1300 160, 1600 80, 1920 100 L1920 200 L0 200 Z"
      />
    </svg>
  );
}

/** Unique curve for Blog subpage - sweeping asymmetrical ascent */
export function WaveBlog({
  className = "",
  fill = "var(--color-paper-warm)",
}: {
  className?: string;
  fill?: string;
}) {
  return (
    <svg viewBox="0 0 1920 200" aria-hidden="true" className={`block h-auto w-full ${className}`}>
      <path
        fill={fill}
        d="M0 180 C 800 180, 1200 40, 1920 10 L1920 200 L0 200 Z"
      />
    </svg>
  );
}


/** The open arc — used as a corner accent, cropping off the edge it sits on. */
export function ArcTopRight({
  className = "",
  style,
  fill = "var(--color-wave)",
}: {
  className?: string;
  style?: React.CSSProperties;
  fill?: string;
}) {
  return (
    <svg viewBox="0 0 555 597" aria-hidden="true" style={style} className={`block ${className}`}>
      <path
        fill={fill}
        d="M373,512c-158.51,0-287-128.5-287-287A286.43,286.43,0,0,1,190.41,3.52H78.4A366.88,366.88,0,0,0,4.49,224.94c0,203.53,165,368.54,368.54,368.54A366.8,366.8,0,0,0,550.51,548V450.5A285.72,285.72,0,0,1,373,512Z"
      />
    </svg>
  );
}

/** The looped ribbon — the boat's line. Teal by default, dot in the accent. */
export function RibbonLoop({
  className = "",
  style,
  ribbon = "var(--color-wave)",
  dot = "var(--color-paper)",
}: {
  /* declared because the project has no @types/react, so TS checks key as an
     ordinary prop rather than a reserved one */
  key?: string;
  className?: string;
  style?: React.CSSProperties;
  ribbon?: string;
  dot?: string;
}) {
  return (
    <svg
      viewBox="0 0 700 695"
      aria-hidden="true"
      style={style}
      className={`block ${className}`}
    >
      <path
        fill={ribbon}
        d="M109.77,91.54q1-1.49,2.13-3A11.51,11.51,0,0,0,109.77,91.54Zm0,0q1-1.49,2.13-3A11.51,11.51,0,0,0,109.77,91.54ZM700.14,17.08C633.59,59.69,492.42,135.69,289.75,169.77c0,0-43.05-151.29-127.82-165S41.32,44.57,34.13,84.33,35.44,227.14,233,242.81c0,0,73,248.43-193,428.39q-18.3,12.39-36,23.85H132.89c59.4-50.36,111.6-109.93,140.55-177.74,0,0,70.62-146.72,33.92-272.57,0,0,108.35-3.83,392.78-136.68ZM85.4,69.87s67.36-22.82,114.07,60.79l30.29,53S88.48,175.34,85.4,69.87Zm26.5,18.64a11.51,11.51,0,0,0-2.13,3Q110.75,90.06,111.9,88.51Zm-2.13,3q1-1.49,2.13-3A11.51,11.51,0,0,0,109.77,91.54Zm0,0q1-1.49,2.13-3A11.51,11.51,0,0,0,109.77,91.54Z"
      />
      <path
        fill={dot}
        d="M133.62,97.27a12.63,12.63,0,0,1-25.25,0,12.3,12.3,0,0,1,1.34-5.6.22.22,0,0,1,.06-.13,11.51,11.51,0,0,1,2.13-3,12.62,12.62,0,0,1,21.72,8.76Z"
      />
    </svg>
  );
}

export function ContinuousWave({ pageIndex, className = "" }: { pageIndex: number; className?: string }) {
  return (
    <div
      className={`absolute top-0 h-[100dvh] pointer-events-none z-0 ${className}`}
      style={{
        width: "500vw",
        left: `-${pageIndex * 100}vw`,
      }}
    >
      <svg
        viewBox="0 0 5000 1000"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <path
          fill="var(--color-paper)"
          d="M 0 750 
             C 50 748, 250 672, 400 790 
             C 550 850, 580 737, 700 739 
             C 815 741, 825 778, 880 791 
             C 920 802, 815 438, 1000 400 
             C 1185 362, 1300 450, 1500 400 
             C 1700 350, 1800 400, 2000 400 
             C 2200 400, 2300 450, 2500 450 
             C 2700 450, 2800 400, 3000 400 
             C 3200 400, 3300 350, 3500 400 
             C 3700 450, 3800 400, 4000 400 
             C 4200 400, 4300 450, 4500 450 
             C 4700 450, 4800 900, 5000 900 
             L 5000 1000 
             L 0 1000 
             Z"
        />
      </svg>
    </div>
  );
}

export function PaperBackgroundExtender() {
  return (
    <div className="absolute top-[100dvh] bottom-0 left-0 w-full bg-paper pointer-events-none z-0" />
  );
}
