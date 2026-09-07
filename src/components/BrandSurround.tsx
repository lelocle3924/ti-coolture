import { ArcTopRight, RibbonLoop } from "./BrandShapes";

/**
 * The identity layer that sits in the violet field around the hero.
 *
 * Rebuilt 07/09 to the team's own drawing. What it replaced: an arc bled off
 * the left, the ribbon loop off the right, and a repeating looping line
 * threaded between them ("đường xoắn loop teal") — that run is gone at the
 * team's request, and the two marks that stay are re-placed.
 *
 * The composition the drawing asks for:
 *
 *   · Top right — the ribbon loop at twice its old size, rotated a quarter
 *     turn anticlockwise so it slants down into the frame, and pushed far
 *     enough out that its tail leaves the violet entirely.
 *   · Left — a white rectangle, the brand's bottom wave laid over it turned
 *     the same quarter turn anticlockwise so the wave runs vertically, and
 *     the arc over both.
 *
 * Everything is sized in vw, so the marks keep their proportion to the field
 * rather than to the text, and a browser zoom scales them with the page —
 * "khi zoom in hoặc out trên PC thì cũng phóng to, thu nhỏ theo luôn".
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

/**
 * The brand's bottom wave, stood on end.
 *
 * The asset is a 1920×698 band whose top edge is the wave and whose body
 * fills downward. Turned a quarter turn anticlockwise the body fills leftward
 * and the wave becomes a vertical edge, which is what carves the white plate
 * behind it into the shape in the drawing.
 *
 * It is drawn rather than imported as an <img> so the fill can be the violet
 * token rather than the asset's baked #7520f7, and so preserveAspectRatio can
 * be released — the strip is much narrower than 1920:698 and the wave has to
 * stretch to it rather than crop.
 */
function WaveOnEnd({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 698 1920"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
    >
      {/* Rotate the path inside the SVG instead of rotating the HTML element */}
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
      {/* 
        h-[50dvh]: height is half the page
        aspect-[698/1920]: auto-calculates width to perfectly preserve the wave's proportion
        top-1/2 -translate-y-1/2: vertically centers it
      */}
      <div className="absolute left-0 top-1/2 h-[75dvh] -translate-y-1/2 aspect-[698/1920] overflow-hidden">
        {/* These just fill the perfectly-sized container */}
        <div className="absolute inset-0.5 bg-paper" />
        <WaveOnEnd className="absolute inset-0 w-full h-full" />
        
        {/* Switched to percentages so the arc scales automatically with the block */}
        {/* <ArcTopRight
          className="absolute top-[46%] -left-[27%] w-[100%] rotate-220"
          fill="var(--color-wave)"
        /> */}
      </div>


      {/* ── top right: the loop, twice the size, a quarter turn anticlockwise ──
          The offsets are not arbitrary. The deck covers everything but a
          120px band above it and a narrow margin either side, so the only
          place the eye can actually be seen is the top-right corner beside
          the nav pill. These push the loop until the eye lands there and let
          the rest bleed off — "phần nào của cái ribbon nằm ngoài nền tím thì
          biến mất khỏi tầm nhìn" — which the section's own overflow-hidden
          makes literal. */}
      <RibbonLoop
        className="absolute -right-[22vw] -top-[22.5vw] w-[34vw]"
        style={{ transform: "rotate(-90deg)" }}
        ribbon="var(--color-wave)"
        dot="var(--color-paper)"
      />
    </div>
  );
}
