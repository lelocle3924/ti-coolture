import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import Brandmark from "../components/Brandmark";
import { RibbonLoop } from "../components/BrandShapes";
import { useReducedMotion } from "./useAutoHideChrome";
import { formatPrice, islandBlobs, planFor, PRICE_NOTE, useLabData } from "./labData";
import type { Product } from "../types";
import "./lab.css";

/* ═══════════════════════════════════════════════════════════════════════════
   DIRECTION C4 — "MỘT NÉT" (one stroke)

   The brief: keep the colour and keep waves and loops central. Change
   everything else. So the thing that goes is the page itself.

   C stacks full-width sections and you scroll past them. C4 has no sections,
   no bands, no rows, no grid and no nav bar. There is one continuous line
   drawn across a space much larger than the screen, and everything the site
   has to say is pinned to a point on that line. Scrolling does not move the
   page down — it moves *you* along the line, and the world slides under a
   fixed viewfinder. The line behind you is drawn; the line ahead is faint.

   Waves and loops stay central and do the structural work: the wave is the
   road, and the ribbon's knot marks each place worth stopping.

   Motion follows the fluid-interface rules — the camera is a critically
   damped follow rather than a hard bind to scrollTop, so travel is smooth,
   arrives without a snap, and can be reversed at any moment without a jump.
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

interface Stop {
  /** Position along the road, 0 → 1. */
  at: number;
  kind: "chapter" | "product" | "step" | "collection" | "map" | "end";
  payload?: unknown;
}

interface Placed extends Stop {
  x: number;
  y: number;
  /** Which side of the road the card hangs off. */
  side: 1 | -1;
}

const STEPS = [
  { n: "01", title: "Chọn món bạn ưng", body: "Lướt qua sản phẩm từ các local brand Tí tuyển chọn." },
  { n: "02", title: "Bấm ORDER NOW", body: "Mỗi shop bán trên kênh riêng. Chọn kênh bạn hay dùng." },
  { n: "03", title: "Dán tin nhắn có sẵn", body: "Tí soạn sẵn tên món kèm link. Qua shop chỉ việc gửi." },
  { n: "04", title: "Shop nhắn lại", body: "Giá, còn hàng, ship — bạn chốt thẳng với shop." },
];

const CHAPTERS = [
  { at: 0.015, label: "MỞ ĐẦU", title: "Mỗi người một TÍ chất riêng" },
  { at: 0.2, label: "TRONG KHO", title: "Tí đang giữ gì" },
  { at: 0.45, label: "CÁCH ĐẶT", title: "Bốn bước, không giỏ hàng" },
  { at: 0.66, label: "BỘ SƯU TẬP", title: "Chưa biết mua gì?" },
  { at: 0.86, label: "BẢN ĐỒ", title: "Khám phá Sài Gòn" },
];

export default function DirectionC4() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const { loading, error, reload, heroFrames, popular, collections, routes } = useLabData();

  const pathRef = useRef<SVGPathElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const [size, setSize] = useState({ w: 1440, h: 900 });
  const [progress, setProgress] = useState(0);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [roadLength, setRoadLength] = useState(1);
  const [camera, setCamera] = useState({ x: 0, y: 0 });

  /* world is a tall canvas; the viewport is a window onto it */
  const world = useMemo(
    () => ({ w: Math.max(720, size.w * 1.9), h: Math.max(4200, size.h * 7.5) }),
    [size]
  );
  const road = useMemo(() => buildRoad(world.w, world.h, 3.4), [world]);

  useEffect(() => {
    const measure = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  /* ── stops: fixed in world space, so they are computed once per layout ── */
  const stops = useMemo<Stop[]>(() => {
    const out: Stop[] = CHAPTERS.map((c) => ({ at: c.at, kind: "chapter", payload: c }));

    popular.slice(0, 6).forEach((p, i) => {
      out.push({ at: 0.24 + i * 0.032, kind: "product", payload: p });
    });
    STEPS.forEach((s, i) => {
      out.push({ at: 0.49 + i * 0.036, kind: "step", payload: s });
    });
    collections.slice(0, 4).forEach((c, i) => {
      out.push({ at: 0.7 + i * 0.036, kind: "collection", payload: c });
    });
    if (routes[0]) out.push({ at: 0.9, kind: "map", payload: routes[0] });
    out.push({ at: 0.985, kind: "end" });

    return out.sort((a, b) => a.at - b.at);
  }, [popular, collections, routes]);

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

  const open = useCallback(
    (p: Product) => navigate(`/products/${p.id}`, { viewTransition: true }),
    [navigate]
  );

  /* A phone has no room to hang a card beside the road: at 390px a card
     offset sideways from the centre runs straight off the edge. There the
     card centres on the road instead and sits below the bead, which keeps the
     traveller visible and the text on screen. */
  const narrow = size.w < 768;

  /* the viewfinder sits a little above centre, so what is ahead has room */
  const anchorX = size.w / 2;
  const anchorY = size.h * (narrow ? 0.3 : 0.52);
  const drawn = progress * roadLength;

  const active = placed.reduce(
    (best, s, i) => (Math.abs(s.at - progress) < Math.abs(placed[best]?.at - progress) ? i : best),
    0
  );
  const activeChapter =
    [...CHAPTERS].reverse().find((c) => progress >= c.at - 0.02) ?? CHAPTERS[0];

  return (
    <div className="bg-brand text-paper" style={{ fontFamily: "var(--font-sans)" }}>
      {/* the scroller only exists to give the journey a length */}
      <div ref={scrollerRef} style={{ height: `${Math.max(500, stops.length * 62)}vh` }} />

      {/* ── the viewfinder ─────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
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
                  transform: `translate(${s.side > 0 ? "-118%" : "18%"}, -62%) rotate(${
                    i * 24
                  }deg)`,
                }}
                ribbon="var(--color-wave)"
                dot="var(--color-paper)"
              />
            ))}

          {/* ── the stops ───────────────────────────────────────────────── */}
          {placed.map((s, i) => {
            const near = Math.abs(s.at - progress);
            const shown = near < 0.075;
            const t = Math.max(0, 1 - near / 0.075);
            /* On a phone the card rides the camera's own column rather than
               its stop's point on the road. The wave swings wider than a 390px
               screen, so a neighbouring stop's x is often half a viewport away
               and the card would sit half off the edge. Pinning x to the camera
               keeps every visible card centred; the road still carries it
               vertically. */
            const style = {
              left: narrow ? camera.x : s.x,
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
                  <h2 className="display mt-3 text-[clamp(2rem,5.6vw,4.5rem)] normal-case leading-[1.02]">
                    {c.title}
                  </h2>
                </div>
              );
            }

            if (s.kind === "product") {
              const p = s.payload as Product;
              return (
                <button
                  key={`p-${i}`}
                  onClick={() => open(p)}
                  className={`absolute w-[min(64vw,22rem)] text-left ${
                    shown ? "pointer-events-auto" : "pointer-events-none"
                  }`}
                  style={style}
                >
                  <span className="block aspect-video overflow-hidden bg-white/10">
                    <img src={p.images[0]} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                  </span>
                  <span className="mt-3 block truncate text-[11px] tracking-[0.16em] text-wave">
                    {p.storeName.toUpperCase()}
                  </span>
                  <span className="mt-1 flex items-baseline justify-between gap-3">
                    <span className="truncate text-lg font-medium">{p.name}</span>
                    <span className="shrink-0 text-sm text-white/70">{formatPrice(p.price)}</span>
                  </span>
                </button>
              );
            }

            if (s.kind === "step") {
              const st = s.payload as (typeof STEPS)[number];
              return (
                <div key={`s-${i}`} className="absolute w-[min(70vw,26rem)]" style={style}>
                  <p className="display text-[clamp(2.5rem,6vw,4rem)] normal-case leading-none text-wave">
                    {st.n}.
                  </p>
                  <h3 className="display mt-2 text-[clamp(1.3rem,2.6vw,2rem)] normal-case leading-[1.05]">
                    {st.title}
                  </h3>
                  <p className="mt-3 text-[13px] leading-relaxed text-white/70">{st.body}</p>
                </div>
              );
            }

            if (s.kind === "collection") {
              const c = s.payload as (typeof collections)[number];
              const lead = c.items[0];
              return (
                <button
                  key={`k-${i}`}
                  onClick={() => lead && open(lead)}
                  className={`absolute w-[min(70vw,24rem)] text-left ${
                    shown ? "pointer-events-auto" : "pointer-events-none"
                  }`}
                  style={style}
                >
                  <span className="block truncate text-[clamp(1.4rem,3vw,2.25rem)] font-medium">
                    {c.name}
                  </span>
                  {lead && (
                    <span className="mt-3 block aspect-video overflow-hidden bg-white/10">
                      <img src={lead.images[0]} alt={lead.name} loading="lazy" className="h-full w-full object-cover" />
                    </span>
                  )}
                  <span className="mt-2 block truncate text-sm text-white/70">
                    {c.items.length} món · {lead ? lead.name : ""}
                  </span>
                </button>
              );
            }

            if (s.kind === "map") {
              const route = s.payload as (typeof routes)[number];
              const plan = planFor(route.id);
              const island = islandBlobs(route.stops);
              return (
                <button
                  key={`m-${i}`}
                  onClick={() => navigate(`/kham-pha/${route.id}`, { viewTransition: true })}
                  className={`absolute w-[min(80vw,32rem)] text-left ${
                    shown ? "pointer-events-auto" : "pointer-events-none"
                  }`}
                  style={style}
                >
                  <span className="block text-[11px] tracking-[0.2em] text-wave">
                    {plan.district.toUpperCase()} · {route.stops.length} ĐIỂM
                  </span>
                  <svg viewBox="0 0 800 600" className="mt-3 block w-full" aria-hidden="true">
                    <g fill="var(--color-wave)">
                      {island.map((b, bi) => (
                        <ellipse key={bi} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} />
                      ))}
                    </g>
                    <path d={plan.axis} fill="none" stroke="var(--color-brand)" strokeWidth="20" strokeLinecap="round" />
                  </svg>
                  <span className="mt-3 inline-flex items-center gap-2 border-b border-white/40 pb-1 text-sm">
                    Mở lộ trình <ArrowUpRight className="h-4 w-4" />
                  </span>
                </button>
              );
            }

            return (
              <div key={`e-${i}`} className="absolute w-[min(78vw,30rem)]" style={style}>
                <h2 className="display text-[clamp(1.9rem,4.6vw,3.25rem)] normal-case leading-[1.05]">
                  Bạn làm đồ đẹp? Kể Tí nghe
                </h2>
                <Link
                  to="/tui-minh"
                  className="pointer-events-auto mt-5 inline-flex items-center gap-3 rounded-full bg-paper py-2 pl-6 pr-2 text-sm font-semibold text-ink"
                >
                  Hợp tác với tụi mình
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

      {/* ── chrome: no bar. A mark, a chapter, a distance. ───────────────── */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-start justify-between p-5 md:p-8">
        <Link to="/lab/c4" className="pointer-events-auto" aria-label="Tí Coolture">
          <Brandmark className="h-auto w-[68px]" body="var(--color-paper)" />
        </Link>
        <div className="text-right">
          <p className="text-[11px] tracking-[0.28em] text-wave">{activeChapter.label}</p>
          <p className="mt-1 text-[11px] tabular-nums tracking-[0.2em] text-white/55">
            {String(Math.round(progress * 100)).padStart(3, "0")} / 100
          </p>
        </div>
      </header>

      {/* the only other chrome: how far along the road you are */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-5 pb-5 md:px-8 md:pb-8">
        <div className="relative h-px w-full bg-white/20">
          <span
            className="absolute inset-y-0 left-0 bg-wave"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="mt-3 text-center text-[11px] tracking-[0.18em] text-white/45">
          {PRICE_NOTE}
        </p>
      </div>

      {(loading || error) && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-brand text-center">
          {loading ? (
            <p className="text-sm tracking-[0.2em] text-white/70">ĐANG MỞ ĐƯỜNG…</p>
          ) : (
            <div>
              <p className="text-sm">Không tải được dữ liệu.</p>
              <button onClick={reload} className="mt-3 text-sm text-wave underline underline-offset-4">
                Thử lại
              </button>
            </div>
          )}
        </div>
      )}

      {/* the hero frame travels with the first chapter, behind everything */}
      {heroFrames[0] && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
          style={{ opacity: Math.max(0, 1 - progress * 9) }}
        >
          <img src={heroFrames[0].src} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-brand/85 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-brand/40 via-transparent to-brand" />
        </div>
      )}
    </div>
  );
}
