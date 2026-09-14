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
            {/* Everything the lids do is confined to the eye's opening, so a
                lid parked "outside the eye" is invisible and no lid can spill
                past the ribbon.

                Team 13/09: "thấy 1 viền trắng nhỏ (tôi nghi là do có khoảng
                cách cỡ 1px giữa con mắt và 2 cái eye lids)". Right, and not a
                gap in the geometry: the lids were clipped to EXACTLY the edge
                of the hole they cover, so two antialiased edges sat on the
                same line and each let a fraction of the ground through. That
                fraction is the white outline of the almond mid-blink.

                So the region is a mask now rather than a clipPath, because a
                mask can be stroked: the same almond, filled, plus a 14-unit
                stroke that pushes its edge 7 units out onto the ribbon. A lid
                covering that margin is teal on teal and cannot be seen, and
                the hole's edge is under solid lid instead of under a second
                antialiased one. 7 units is ~1.9px at the smallest the mark is
                drawn (a phone's "Cách đặt hàng") and the ribbon round the eye
                is 40+ units thick, so the margin never reaches its far side.

                Team 14/09, twice: "vạch màu teal nhỏ bên cạnh con mắt" on
                /stores/[slug]. The lids were rectangles 280 units long, far
                bigger than the eye, and waiting outside it they ran off the
                top of the mark. Wherever the renderer clipped that masked
                teal at an edge, one row of device pixels came through: a
                hairline along the mark's top edge, which the shop page turns
                into a vertical line beside the eye. It came and went with the
                window's width and the screen's pixel ratio — 175 rows of it
                at 1920px ×1, none at 1536px ×1 — so a first fix that only
                widened this region was checked at one ratio, looked clean,
                and was not. The region stays wide, so its own edge never
                falls on anything drawn; the lids below are what fixed it. */}
            <mask
              id={eyeClipId}
              maskUnits="userSpaceOnUse"
              x="-200"
              y="-200"
              width="1100"
              height="1095"
            >
              <path
                d="M85.4,69.87s67.36-22.82,114.07,60.79l30.29,53S88.48,175.34,85.4,69.87Z"
                fill="#fff"
                stroke="#fff"
                strokeWidth="14"
                strokeLinejoin="round"
              />
            </mask>
          </defs>
          <g mask={`url(#${eyeClipId})`}>
            {/* Rotated onto the eye's own axis, so "perpendicular to the
                centre line" is a plain translateY in here.

                Shaped to the eye, not generous rectangles (14/09 — see the
                mask's note). Each lid is the almond's own outline on its side
                of the axis: the path sampled at 800 points, turned onto this
                frame, and widened by 11 units — the mask's 7-unit stroke and 4
                to spare. Shut, a lid still covers everything the mask lets
                through; parked 40 units out, it stays at least 22 units inside
                the mark instead of running off its edge. Inside the mask the
                blink is what it was: the shapes differ only where nothing
                shows.

                They overlap by a unit either side of the axis for the same
                13/09 reason: two edges that merely touch at y=0 leave a
                hairline of ground along the shut eye. */}
            <g transform="translate(157.58 126.77) rotate(38.25)">
              <polygon
                className="ti-eye-lid-a"
                fill={ribbon}
                points="-102.9,-8.0 -96.5,-15.5 -90.1,-21.5 -83.6,-26.6 -77.2,-30.9 -70.8,-34.5 -64.3,-37.5 -57.9,-40.0 -51.5,-42.0 -45.1,-43.5 -38.6,-44.7 -32.2,-45.4 -25.8,-45.8 -19.3,-45.8 -12.9,-45.8 -6.5,-45.5 -0.1,-44.8 6.4,-43.9 12.8,-42.6 19.2,-41.1 25.7,-39.2 32.1,-37.1 38.5,-34.7 44.9,-32.1 51.4,-29.6 57.8,-27.0 64.2,-24.4 70.7,-21.8 77.1,-19.2 83.5,-16.6 89.9,-14.0 96.4,-11.4 102.8,-7.7 102.8,1.0 -102.9,1.0"
              />
              <polygon
                className="ti-eye-lid-b"
                fill={ribbon}
                points="-102.9,7.8 -96.5,14.8 -90.1,20.8 -83.6,26.0 -77.2,30.4 -70.8,34.2 -64.3,37.3 -57.9,40.0 -51.5,42.1 -45.1,43.9 -38.6,45.2 -32.2,46.1 -25.8,46.7 -19.3,46.9 -12.9,47.0 -6.5,46.9 -0.1,46.5 6.4,45.9 12.8,45.0 19.2,43.8 25.7,42.4 32.1,40.8 38.5,38.9 44.9,36.8 51.4,34.5 57.8,32.0 64.2,29.3 70.7,26.3 77.1,23.2 83.5,19.8 89.9,16.2 96.4,12.3 102.8,7.8 102.8,-1.0 -102.9,-1.0"
              />
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
