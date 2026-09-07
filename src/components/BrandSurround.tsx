import { ArcTopRight, RibbonLoop } from "./BrandShapes";

/**
 * The identity layer that sits in the violet field around the hero.
 *
 * Rebuilt 07/09 to the team's own drawing, and every number below is measured
 * off it rather than judged by eye. The drawing was sampled at 200dpi, the
 * violet field found in it, and each mark's bounding box expressed as a
 * percentage of that field:
 *
 *     mark          left     top    width   height
 *     white strip    0.0    22.5      7.5     51.8
 *     arc           -1.1    71.1     14.6     30.7
 *     ribbon        86.9    -2.6     14.3     34.6
 *
 * Those are the six-figure targets this file is tuned to; src/lab has the
 * comparison shot. Percentages, not pixels, so the composition holds its
 * proportions at any width and a browser zoom takes the marks with it —
 * "khi zoom in hoặc out trên PC thì cũng phóng to, thu nhỏ theo luôn".
 *
 * What it replaced: an arc bled off the left, the ribbon loop off the right,
 * and a repeating looping line threaded between them. That run is gone at the
 * team's request — "hãy bỏ cái đường xoắn loop teal đi".
 *
 * The composition the drawing asks for, in the order it is stacked:
 *
 *   · Left — a white rectangle; the brand's bottom wave laid over it, turned a
 *     quarter turn anticlockwise so the wave becomes a vertical edge and eats
 *     the plate back to a strip; then the arc over both, sweeping down out of
 *     the bottom-left corner.
 *   · Top right — the ribbon loop at twice its old size, turned the same
 *     quarter turn so it slants down into the frame, pushed out until only the
 *     eye and one tail are inside. The section clips the rest, which is what
 *     "phần nào của cái ribbon nằm ngoài nền tím thì biến mất khỏi tầm nhìn"
 *     asks for.
 *
 * Two rules carried over unchanged, because both are constraints rather than
 * preferences:
 *
 * · Nothing here animates. The hero deck is the moving thing on this screen
 *   and a drifting background would be a second. (The loop can blink — see
 *   BrandShapes — but that is for the seam above "Chưa biết mua gì?", where
 *   nothing else is moving. Not here.)
 * · Everything is aria-hidden and pointer-events-none. These marks carry no
 *   information — the wordmark in the nav does that — so they must not appear
 *   in the accessibility tree or intercept a click.
 */

/* The measured geometry, kept together so the drawing and the code can be
   diffed against each other without reading the JSX. All values are
   percentages of the hero section. */
const PLATE = { left: 0, top: 21.4, width: 9.9, height: 54 };
const ARC = { left: -8.0, top: 69.5, width: 67.0 };
const LOOP = { right: -18.0, top: -13.5, width: 32.4 };

/**
 * The brand's bottom wave, stood on end.
 *
 * The asset is a 1920×698 band whose top edge is the wave and whose body
 * fills downward. Turned a quarter turn anticlockwise the body fills to the
 * right and the wave becomes a vertical edge, which is what carves the white
 * plate behind it back into the strip in the drawing.
 *
 * Drawn rather than imported as an <img> for two reasons: the fill can be the
 * violet token rather than the asset's baked #7520f7, and preserveAspectRatio
 * can be released — the strip is far narrower than 1920:698, and the wave has
 * to stretch to it rather than crop.
 */
function WaveOnEnd({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 698 1920"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
    >
      {/* Rotate the path inside the SVG rather than rotating the element, so
          the box stays axis-aligned and can be sized in plain percentages. */}
      <g transform="translate(0, 1920) rotate(-90)">
        <path
          fill="var(--color-brand)"
          d="M-1.95,318.33s476.18-70.31,773.39,147,348.35-159.13,572.06-157.87,242.89,113.12,345.16,161.06S1567.21,35,1922,.87V698.63H-1.95Z"
        />
      </g>
    </svg>
  );
}

export default function BrandSurround({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* ── left: the white plate, cut back by the wave ──────────────────
          The plate is wider than the white that survives: the wave's violet
          body covers its right side, and what is left is the strip the
          drawing shows. That is why PLATE.width (15.4) is about twice the
          7.5 the measurement asks for. */}
      <div
        className="absolute"
        style={{
          left: `${PLATE.left}%`,
          top: `${PLATE.top}%`,
          width: `${PLATE.width}%`,
          height: `${PLATE.height}%`,
        }}
      >
        <div className="absolute inset-0 bg-paper" />
        {/* -inset-px: the wave is violet drawn over a white plate, and at the
            plate's own border the two antialias together into a hairline of
            white — which showed as a faint rectangle around the whole block.
            Bleeding the wave a pixel past the plate leaves nothing to blend. */}
        <WaveOnEnd className="absolute -inset-px h-[calc(100%+2px)] w-[calc(100%+2px)]" />
      </div>

      {/* ── left: the arc over both ──────────────────────────────────────
          Sized by width, so its own 555:597 ratio sets the height. It is
          pushed down and left far enough that only the descending limb is
          inside the field — the rest leaves through the bottom-left corner,
          which is what the drawing shows. */}
      <ArcTopRight
        className="absolute rotate-180"
        style={{
          left: `${ARC.left}%`,
          top: `${ARC.top}%`,
          width: `${ARC.width}%`,
        }}
        fill="var(--color-wave)"
      />

      {/* ── top right: the loop, twice the size, a quarter turn anticlockwise
          The offsets are not arbitrary. The deck covers everything but a
          narrow band above it and a margin either side, so the only place the
          eye can be seen whole is the top-right corner beside the nav pill.
          These push the loop until the eye lands there and let the tail bleed
          off; the section's own overflow-hidden makes the clip literal. */}
      <RibbonLoop
        className="absolute"
        style={{
          right: `${LOOP.right}%`,
          top: `${LOOP.top}%`,
          width: `${LOOP.width}%`,
          transform: "rotate(-90deg)",
        }}
        ribbon="var(--color-wave)"
        dot="var(--color-paper)"
      />
    </div>
  );
}
