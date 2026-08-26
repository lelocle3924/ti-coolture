import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { RibbonLoop } from "../components/BrandShapes";
import { useReducedMotion } from "../lib/useAutoHideChrome";
import "../home/home.css";

/* ═══════════════════════════════════════════════════════════════════════════
   TỤI MÌNH — the About page

   Built on the "MỘT NÉT" (one stroke) mechanic explored as homepage direction
   C4 and chosen 26/08 for this page instead. src/lab/DirectionC4.tsx is gone;
   the road machinery lives here now.

   The idea: no sections, no bands, no grid. One continuous line is drawn
   across a space much larger than the screen, and everything the page has to
   say is pinned to a point on that line. Scrolling does not move the page
   down — it moves *you* along the line while the world slides under a fixed
   viewfinder. The line behind you is drawn; the line ahead is faint.

   Waves and loops do the structural work: the wave is the road, and the
   ribbon's knot marks each place worth stopping.

   Motion follows the fluid-interface rules — the camera is a critically
   damped follow rather than a hard bind to scrollTop, so travel is smooth,
   arrives without a snap, and reverses without a jump.

   ⚠ COPY IS NOT WRITTEN YET. Every chapter title and passage below is a
   labelled placeholder the team will replace. They are deliberately short and
   obviously provisional rather than invented history — nothing here claims
   anything about Tí that has not been agreed. The blog listing that used to
   sit on this page is gone, as asked; blog posts have no home in the nav for
   now.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── the road ──────────────────────────────────────────────────────────── */

/**
 * A descending wave, sampled and then smoothed through the midpoints so the
 * curve has no corners. Generated rather than hand-drawn so the amplitude can
 * follow the viewport instead of fighting it.
 */
function buildRoad(width: number, height: number, cycles: number): string {
  const cx = width / 2;
  const amplitude = width * 0.3;
  const steps = Math.max(24, cycles * 12);

  const pts = Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    return { x: cx + Math.sin(t * cycles * Math.PI * 2) * amplitude, y: t * height };
  });

  const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  });

  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const m = mid(pts[i], pts[i + 1]);
    d += ` Q${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)} ${m.x.toFixed(1)},${m.y.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  d += ` L${last.x.toFixed(1)},${last.y.toFixed(1)}`;
  return d;
}

/* ── what is pinned to the road ────────────────────────────────────────── */

interface Stop {
  /** Position along the road, 0 → 1. */
  at: number;
  kind: "chapter" | "passage" | "end";
  payload?: unknown;
}

interface Placed extends Stop {
  x: number;
  y: number;
  /** Which side of the road the card hangs off. */
  side: 1 | -1;
}

/** ⚠ PLACEHOLDER — chapter headings the team will rewrite. */
const CHAPTERS = [
  { at: 0.015, label: "MỞ ĐẦU", title: "Tụi mình là ai" },
  { at: 0.24, label: "VÌ SAO", title: "Tí bắt đầu từ đâu" },
  { at: 0.48, label: "CÁCH LÀM", title: "Tí chọn shop thế nào" },
  { at: 0.72, label: "NGUYÊN TẮC", title: "Tí không bán hàng" },
];

/** ⚠ PLACEHOLDER — one passage per chapter, marked so nobody ships them. */
const PASSAGES: Array<{ at: number; note: string }> = [
  { at: 0.1, note: "Đoạn mở đầu — team viết sau." },
  { at: 0.34, note: "Câu chuyện bắt đầu — team viết sau." },
  { at: 0.58, note: "Tiêu chí tuyển chọn — team viết sau." },
  { at: 0.82, note: "Cam kết không giao dịch — team viết sau." },
];

export default function About() {
  const reduced = useReducedMotion();

  const pathRef = useRef<SVGPathElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const [size, setSize] = useState({ w: 1440, h: 900 });
  const [progress, setProgress] = useState(0);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [roadLength, setRoadLength] = useState(1);
  const [camera, setCamera] = useState({ x: 0, y: 0 });

  /* world is a tall canvas; the viewport is a window onto it */
  const world = useMemo(
    () => ({ w: Math.max(720, size.w * 1.9), h: Math.max(3600, size.h * 6) }),
    [size]
  );
  const road = useMemo(() => buildRoad(world.w, world.h, 3.4), [world]);

  useEffect(() => {
    const measure = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const stops = useMemo<Stop[]>(
    () =>
      [
        ...CHAPTERS.map((c) => ({ at: c.at, kind: "chapter" as const, payload: c })),
        ...PASSAGES.map((p) => ({ at: p.at, kind: "passage" as const, payload: p })),
        { at: 0.965, kind: "end" as const },
      ].sort((a, b) => a.at - b.at),
    []
  );

  /* place every stop on the road once the path exists */
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    let total = 0;
    try {
      total = path.getTotalLength();
    } catch {
      return;
    }
    if (!total) return;
    setRoadLength(total);

    setPlaced(
      stops.map((s) => {
        const pt = path.getPointAtLength(s.at * total);
        /* Hang the card on whichever side of the road has room. Alternating
           blindly pushed cards off-screen wherever the wave had already swung
           that way; the camera centres on the road, so the safe side is always
           the one back toward the middle of the world. */
        const side: 1 | -1 = pt.x > world.w / 2 ? -1 : 1;
        return { ...s, x: pt.x, y: pt.y, side };
      })
    );
  }, [stops, road, world]);

  /* ── travel: scroll drives a target, a spring follows it ─────────────── */
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const el = scrollerRef.current;
        if (!el) return;
        const max = el.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  /* Critically damped follow. Binding the camera straight to scrollTop reads
     as mechanical; letting it chase the target keeps arrival soft and lets a
     reversal blend instead of snapping. */
  const target = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const path = pathRef.current;
    if (!path || !roadLength) return;
    const pt = path.getPointAtLength(progress * roadLength);
    target.current = { x: pt.x, y: pt.y };
  }, [progress, roadLength]);

  useEffect(() => {
    if (reduced) {
      setCamera(target.current);
      return;
    }
    let frame = 0;
    let vx = 0;
    let vy = 0;
    let last = performance.now();
    const omega = (2 * Math.PI) / 0.5;

    const tick = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      setCamera((c) => {
        const ax = -2 * omega * vx - omega * omega * (c.x - target.current.x);
        const ay = -2 * omega * vy - omega * omega * (c.y - target.current.y);
        vx += ax * dt;
        vy += ay * dt;
        return { x: c.x + vx * dt, y: c.y + vy * dt };
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced]);

  /* A phone has no room to hang a card beside the road: at 390px a card
     offset sideways from the centre runs straight off the edge. There the
     card centres on the road instead and sits below the bead, which keeps the
     traveller visible and the text on screen. */
  const narrow = size.w < 768;

  /* the viewfinder sits a little above centre, so what is ahead has room */
  const anchorX = size.w / 2;
  const anchorY = size.h * (narrow ? 0.32 : 0.52);
  const drawn = progress * roadLength;

  const activeChapter =
    [...CHAPTERS].reverse().find((c) => progress >= c.at - 0.02) ?? CHAPTERS[0];

  return (
    <div className="bg-brand text-paper" style={{ fontFamily: "var(--font-sans)" }}>
      {/* the scroller only exists to give the journey a length */}
      <div ref={scrollerRef} style={{ height: `${Math.max(420, stops.length * 58)}vh` }} />

      {/* ── the viewfinder ─────────────────────────────────────────────── */}
      <div data-camera-window className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
        <div
          className="absolute left-0 top-0"
          style={{
            width: world.w,
            height: world.h,
            transform: `translate3d(${anchorX - camera.x}px, ${anchorY - camera.y}px, 0)`,
            willChange: "transform",
          }}
        >
          {/* the road */}
          <svg
            width={world.w}
            height={world.h}
            viewBox={`0 0 ${world.w} ${world.h}`}
            className="absolute inset-0 overflow-visible"
            aria-hidden="true"
          >
            {/* ahead: faint */}
            <path
              ref={pathRef}
              d={road}
              fill="none"
              stroke="var(--color-paper)"
              strokeOpacity="0.3"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* behind: drawn */}
            <path
              d={road}
              fill="none"
              stroke="var(--color-wave)"
              strokeWidth="6"
              strokeLinecap="round"
              style={{
                strokeDasharray: roadLength,
                strokeDashoffset: roadLength - drawn,
              }}
            />
          </svg>

          {/* the knots — the ribbon marks each chapter */}
          {placed
            .filter((s) => s.kind === "chapter")
            .map((s, i) => (
              <RibbonLoop
                key={`knot-${i}`}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: s.x,
                  top: s.y,
                  width: "clamp(7rem, 12vw, 13rem)",
                  opacity: 0.3,
                  transform: `translate(${s.side > 0 ? "-118%" : "18%"}, -62%) rotate(${i * 24}deg)`,
                }}
                ribbon="var(--color-wave)"
                dot="var(--color-paper)"
              />
            ))}

          {/* ── the stops ───────────────────────────────────────────────── */}
          {placed.map((s, i) => {
            const near = Math.abs(s.at - progress);
            const shown = near < 0.085;
            const t = Math.max(0, 1 - near / 0.085);
            /* Every card rides the camera's own column rather than its stop's
               point on the road. The wave swings wider than the viewport at
               every width — not just on a phone — so a stop whose x sits out
               near the crest put its card half off the edge, which is what was
               happening to the chapter headings. Pinning x to the camera keeps
               every visible card on screen; the side offset below still throws
               it left or right, and the road still carries it vertically. */
            const style = {
              left: camera.x,
              top: s.y,
              opacity: reduced ? 1 : t,
              transform: `translate(calc(-50% + ${narrow ? 0 : s.side * 17}vw), calc(-50% + ${
                narrow ? 16 : 0
              }vh + ${(1 - t) * 26}px))`,
              transition: reduced ? "none" : "opacity 260ms linear",
            } as const;

            if (s.kind === "chapter") {
              const c = s.payload as (typeof CHAPTERS)[number];
              return (
                <div key={`c-${i}`} className="absolute w-[min(78vw,34rem)]" style={style}>
                  <p className="text-[11px] tracking-[0.28em] text-wave">{c.label}</p>
                  <h2 className="display mt-3 text-[clamp(1.9rem,5.2vw,4.25rem)] normal-case leading-[1.02]">
                    {c.title}
                  </h2>
                </div>
              );
            }

            if (s.kind === "passage") {
              const p = s.payload as (typeof PASSAGES)[number];
              return (
                <div key={`p-${i}`} className="absolute w-[min(74vw,30rem)]" style={style}>
                  {/* The empty measure is the point: it shows the team exactly
                      how much room the copy has on the road before it is
                      written, rather than pretending with filler prose. */}
                  <div className="border-l-2 border-wave/50 pl-5">
                    <p className="text-[11px] tracking-[0.22em] text-wave/80">CHỜ NỘI DUNG</p>
                    <p className="mt-3 text-lg leading-relaxed text-white/70">{p.note}</p>
                    <p className="mt-4 text-[11px] leading-relaxed text-white/35">
                      Khoảng 60–90 từ vừa khung này.
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div key={`e-${i}`} className="absolute w-[min(78vw,30rem)]" style={style}>
                <h2 className="display text-[clamp(1.8rem,4.4vw,3rem)] normal-case leading-[1.05]">
                  Bạn làm đồ đẹp? Kể Tí nghe
                </h2>
                <Link
                  to="/open-shop"
                  className={`mt-5 inline-flex items-center gap-3 rounded-full bg-paper py-2 pl-6 pr-2 text-sm font-semibold text-ink ${
                    shown ? "pointer-events-auto" : "pointer-events-none"
                  }`}
                >
                  Mở shop trên Tí
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-paper">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </Link>
              </div>
            );
          })}
        </div>

        {/* the traveller — a bead pinned to the viewfinder, on the line */}
        <span
          aria-hidden="true"
          className="absolute h-4 w-4 rounded-full bg-paper ring-4 ring-wave"
          style={{ left: anchorX, top: anchorY, transform: "translate(-50%, -50%)" }}
        />
      </div>

      {/* Chapter and distance. The wordmark is not repeated here — the shared
          nav pill carries it on every page now. */}
      <div className="pointer-events-none fixed right-5 top-28 z-20 text-right md:right-8 md:top-28">
        <p className="text-[11px] tracking-[0.28em] text-wave">{activeChapter.label}</p>
        <p className="mt-1 text-[11px] tabular-nums tracking-[0.2em] text-white/55">
          {String(Math.round(progress * 100)).padStart(3, "0")} / 100
        </p>
      </div>

      {/* how far along the road you are */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-5 pb-5 md:px-8 md:pb-8">
        <div className="relative h-px w-full bg-white/20">
          <span
            className="absolute inset-y-0 left-0 bg-wave"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
