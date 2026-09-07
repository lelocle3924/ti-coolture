import type React from "react";
import { useId } from "react";

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
 * The cropped flow wave — verbatim from
 * src/assets/brand/brand-wave-bottom-cropped.svg.
 *
 * Sits at the foot of a light section as the crest of the *next*, violet one
 * pushing up into it. Team 31/08: between "Cách đặt hàng" and "Chưa biết mua
 * gì?", drop the gradient and let this rise through the seam instead. No
 * motion — it is a shape, not a transition.
 *
 * The artwork is 495×268 and keeps that ratio. Full-bleed it is therefore
 * 0.54 × the width tall — 780px on a 1440px screen — which is far more band
 * than the seam wants, so the wrapper crops the top and the crest is what
 * shows. That is the "một phần element nhô lên" of the 31/08 note: a part of
 * the shape coming up through the seam, not the whole thing squashed into a
 * strip.
 *
 * An earlier pass did squash it with preserveAspectRatio="none" to control the
 * band height. Team 04/09: keep the ratio and fill the remainder with the
 * ground instead — white left over on the left is fine. Cropping does exactly
 * that, and the crop is set as a fraction of the width, so the shape still
 * lands identically at 375px and 1440px.
 */
export function WaveBottomCropped({
  className = "",
  fill = "var(--color-brand)",
  ratio = 0.24,
}: {
  className?: string;
  fill?: string;
  /** Visible band height as a fraction of its width. The artwork keeps its
      own 495:268 and is cropped to this, bottom-aligned. */
  ratio?: number;
}) {
  return (
    <div
      className={`pointer-events-none relative ${className}`}
      aria-hidden="true"
      style={{ width: `${ratio * 100}%`, marginLeft: "auto" }}
    >
      {/* width controlled by ratio, natural aspect ratio maintained by svg */}
      <svg
        viewBox="0 0 486 266.05"
        className="block h-auto w-full"
      >
        <path
          fill={fill}
          d="M487.95 266.032H0C78.1202 262.714 113.21 152.866 198.693 153.348C310.55 153.978 320.141 209.927 371.277 233.905C410.95 254.5 310.551 17.0709 487.95 0V266.032Z"
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

/**
 * The seam under the /products hero — one long rise, left to right.
 *
 * Team 08/09: "ranh giới chỗ nền ở hero của chỗ này xiên vẹo, cong không cong
 * hẳn, thẳng không thẳng hẳn."
 *
 * Fair. The old path ran dead flat at y=160 from x=0 to x=1000 and only then
 * lifted, and the band that shows it is capped at 4.5rem — which crops the
 * viewBox to roughly y=104–200. So the flat half sat below the crop and the
 * rise cut across it: a straight line that was not straight, drawn by a curve
 * that was never seen curving.
 *
 * This one does its whole travel inside the visible window. It leaves the
 * left edge near the bottom of the band, climbs to the top of it by the two
 * thirds mark, and eases back down — so the eye reads one deliberate swell
 * rather than a slope of indeterminate intent.
 */
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
        d="M0 190 C 380 190, 700 112, 1120 110 C 1450 108, 1690 146, 1920 156 L1920 200 L0 200 Z"
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
  blink = false,
}: {
  /* declared because the project has no @types/react, so TS checks key as an
     ordinary prop rather than a reserved one */
  key?: string;
  className?: string;
  style?: React.CSSProperties;
  ribbon?: string;
  dot?: string;
  /**
   * Let the loop blink. Team 04/09: the loop reads as an eye, so give it the
   * one thing an eye does — twice in a second, then six seconds of stillness.
   *
   * Rebuilt 07/09. It used to be one lid scaled on Y, which shuts an eye
   * along a horizontal line; this eye is not horizontal. Its two tips are the
   * anchors of the almond — (85.4, 69.87) and (229.76, 183.66) in the mark's
   * own 700×695 space — so its axis runs at 38.25° below horizontal, not the
   * 45° the note estimated, and its centre is (157.58, 126.77).
   *
   * It is two lids now, as asked: the eye's opening is split along that axis,
   * each half parked outside the eye on its own side, and both travel
   * perpendicular to the axis to meet on it. The pupil sits 0.5 units off
   * that same line — measured, not assumed — so the lids close over it
   * exactly rather than beside it.
   */
  blink?: boolean;
}) {
  /* Two loops can share a page (the hero and the seam), and two clipPaths
     cannot share an id — the second would be ignored and its lids would spill
     over the ribbon. */
  const eyeClipId = useId();

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
      {blink && (
        <>
          <defs>
            {/* Everything the lids do is clipped to the eye's own opening, so
                a lid parked "outside the eye" is genuinely invisible and no
                lid can ever spill onto the ribbon. */}
            <clipPath id={eyeClipId}>
              <path d="M85.4,69.87s67.36-22.82,114.07,60.79l30.29,53S88.48,175.34,85.4,69.87Z" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${eyeClipId})`}>
            {/* Rotated onto the eye's own axis, so "perpendicular to the
                centre line" is a plain translateY in here. The rects are
                deliberately larger than the opening — the clip decides what
                shows, so their size only has to be generous. */}
            <g transform="translate(157.58 126.77) rotate(38.25)">
              <rect className="ti-eye-lid-a" x="-140" y="-130" width="280" height="130" fill={ribbon} />
              <rect className="ti-eye-lid-b" x="-140" y="0" width="280" height="130" fill={ribbon} />
            </g>
          </g>
        </>
      )}
    </svg>
  );
}

export function RibbonCorner({
  className = "",
  style,
  ribbon = "var(--color-wave)",
  dot = "var(--color-brand)",
}: {
  className?: string;
  style?: React.CSSProperties;
  ribbon?: string;
  dot?: string;
}) {
  return (
    <svg viewBox="0 0 700 695" aria-hidden="true" style={style} className={`block ${className}`}>
      <path fill={ribbon} d="M109.77 91.54C110.437 90.5467 111.147 89.5467 111.9 88.54C111.034 89.4193 110.315 90.4323 109.77 91.54ZM109.77 91.54C110.437 90.5467 111.147 89.5467 111.9 88.54C111.034 89.4193 110.315 90.4323 109.77 91.54Z" />
      <path fill={ribbon} d="M109.77 91.51C110.437 90.5167 111.147 89.5167 111.9 88.51C111.031 89.3984 110.312 90.4216 109.77 91.54V91.51ZM109.77 91.51C110.437 90.5167 111.147 89.5167 111.9 88.51C111.031 89.3984 110.312 90.4216 109.77 91.54V91.51ZM111.9 88.51C111.034 89.3893 110.315 90.4023 109.77 91.51C110.423 90.5433 111.133 89.5433 111.9 88.51Z" />
      <path fill={ribbon} d="M161.93 4.76999C77.16 -8.94001 41.32 44.57 34.13 84.33C26.9666 123.943 35.3773 226.378 230.815 242.632L289.75 242.299V169.77C289.75 169.77 246.7 18.48 161.93 4.76999ZM85.4 69.87C85.4 69.87 152.76 47.05 199.47 130.66L229.76 183.66C229.76 183.66 88.48 175.34 85.4 69.87Z" />
      <path fill={dot} d="M133.62 97.27C133.527 100.557 132.157 103.678 129.799 105.97C127.442 108.262 124.283 109.545 120.995 109.545C117.707 109.545 114.548 108.262 112.191 105.97C109.833 103.678 108.463 100.557 108.37 97.27C108.367 95.3236 108.827 93.4044 109.71 91.67C109.715 91.6212 109.736 91.5754 109.77 91.54C110.315 90.4323 111.034 89.4193 111.9 88.54C113.645 86.7237 115.894 85.4712 118.357 84.9437C120.82 84.4162 123.384 84.6377 125.72 85.5799C128.056 86.522 130.057 88.1416 131.465 90.2303C132.873 92.319 133.623 94.7812 133.62 97.3V97.27Z" />
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
