import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Pause, Play } from "lucide-react";
import { incrementProductClick } from "../lib/dbService";
import { Product } from "../types";

/**
 * "Đang có trong kho" as a 35mm film strip.
 *
 * The whole strip is one moving object: each cell carries its own film base and
 * sprocket rows, so the perforated edge travels with its frame instead of
 * sitting still behind it. Cell width is an exact multiple of the sprocket
 * pitch, which is what keeps the holes evenly spaced across cell seams.
 *
 * Position is driven in JS rather than by a CSS animation because the reel has
 * two inputs — the automatic right→left crawl and the user dragging it back and
 * forth. Both write to the same offset, so they can't fight each other.
 *
 * Motion rules:
 *   · hover or keyboard focus pauses the crawl
 *   · dragging takes over; releasing hands control back
 *   · an explicit pause control is always present (WCAG 2.2.2)
 *   · prefers-reduced-motion stops the crawl; dragging still works
 */

const FILM_BASE = "#14091f";
const SPROCKET_PITCH = 46;
const CELL_WIDTH = SPROCKET_PITCH * 5; // 230px — holes align across seams
const SPEED_PX_PER_SEC = 34;

/** One perforation, repeated along the pitch. */
const SPROCKET = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${SPROCKET_PITCH}" height="26"><rect x="9" y="5" width="28" height="16" rx="4" fill="#ffffff"/></svg>`
);

/** Photographic grain, or the base reads as flat plastic. */
const GRAIN = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="160" height="160" filter="url(#g)" opacity="0.5"/></svg>`
);

const sprocketStyle = {
  backgroundImage: `url("data:image/svg+xml,${SPROCKET}")`,
  backgroundRepeat: "repeat-x",
  backgroundSize: `${SPROCKET_PITCH}px 26px`,
};

const formatPrice = (value: number) =>
  value > 0 ? `${value.toLocaleString("vi-VN")}₫` : "Liên hệ";

export default function FilmStrip({ products }: { products: Product[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const offset = useRef(0);
  const dragging = useRef(false);
  const dragMoved = useRef(0);
  const lastX = useRef(0);

  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const passWidth = products.length * CELL_WIDTH;

  const wrap = (v: number) => ((v % passWidth) + passWidth) % passWidth;

  /* Paint the current offset. Called from the crawl loop AND directly from the
     drag handler: requestAnimationFrame is throttled in background tabs, and a
     drag that only updated state would feel dead there. */
  const apply = () => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${-offset.current}px,0,0)`;
    }
  };

  useEffect(() => {
    apply();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1); // clamp after a tab switch
      last = now;

      if (!paused && !hovering && !dragging.current) {
        offset.current = wrap(offset.current + SPEED_PX_PER_SEC * dt);
        apply();
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, hovering, passWidth]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    dragMoved.current = 0;
    lastX.current = e.clientX;
    setIsDragging(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* non-capturable pointer; dragging still tracks via move events */
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    dragMoved.current += Math.abs(dx);
    offset.current = wrap(offset.current - dx);
    apply();
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
  };

  // A drag that travelled shouldn't also open the product underneath.
  const swallowClickAfterDrag = (e: React.MouseEvent) => {
    if (dragMoved.current > 6) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  if (products.length === 0) return null;

  const reel = [...products, ...products];

  return (
    <div className="relative">
      <div
        className={`relative overflow-hidden select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        style={{ backgroundColor: FILM_BASE }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onFocusCapture={() => setHovering(true)}
        onBlurCapture={() => setHovering(false)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={swallowClickAfterDrag}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] opacity-[0.14] mix-blend-screen"
          style={{ backgroundImage: `url("data:image/svg+xml,${GRAIN}")` }}
        />

        <ul
          ref={trackRef}
          className="film-reel relative z-[2] m-0 flex list-none p-0"
          style={{ width: "max-content", willChange: "transform" }}
        >
          {reel.map((prod, i) => {
            const isClone = i >= products.length;
            return (
              <li
                key={`${prod.id}-${i}`}
                className="shrink-0"
                style={{ width: CELL_WIDTH, backgroundColor: FILM_BASE }}
                aria-hidden={isClone || undefined}
              >
                {/* perforations ride with the frame */}
                <div aria-hidden="true" className="h-[26px] w-full" style={sprocketStyle} />

                <div className="px-3 py-2.5">
                  <Link
                    to={`/products/${prod.id}`}
                    onClick={() => incrementProductClick(prod.id)}
                    id={isClone ? undefined : `product-card-${prod.id}`}
                    tabIndex={isClone ? -1 : undefined}
                    draggable={false}
                    className="group/frame block bg-paper p-2 outline-offset-4 transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.05] hover:shadow-[0_10px_30px_rgba(0,0,0,0.45)] focus-visible:scale-[1.05]"
                  >
                    <div className="aspect-square overflow-hidden bg-paper-warm">
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        loading="lazy"
                        draggable={false}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="px-0.5 pb-0.5 pt-2 text-ink">
                      <p className="m-0 label truncate text-wave-ink">{prod.storeName}</p>
                      {/* Fixed two-line box. Without it a wrapping name makes
                          the cell taller and that frame's sprocket row drops
                          below the others, breaking the film's horizon.
                          line-clamp-2 supplies the ellipsis when it overruns. */}
                      <h3 className="m-0 mt-1 line-clamp-2 h-10 overflow-hidden text-sm font-normal leading-5">
                        {prod.name}
                      </h3>
                      <p className="m-0 mt-1 text-sm font-medium tabular-nums text-brand">
                        {formatPrice(prod.price)}
                      </p>
                    </div>
                  </Link>
                </div>

                <div aria-hidden="true" className="h-[26px] w-full" style={sprocketStyle} />
              </li>
            );
          })}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => setPaused((v) => !v)}
        className="absolute right-3 top-3 z-10 inline-flex min-h-11 items-center gap-2 rounded-md bg-ink/80 px-3 label text-paper backdrop-blur-sm transition-colors hover:bg-ink"
        aria-pressed={paused}
      >
        {paused ? (
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Pause className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {paused ? "Chạy" : "Dừng"}
      </button>
    </div>
  );
}
