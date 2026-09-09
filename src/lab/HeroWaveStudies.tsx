/* The project ships no @types/react, so the namespace has to be pulled in
   explicitly before React.ReactNode resolves — same reason labShared does. */
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import BrandSurround from "../components/BrandSurround";
import { useReducedMotion } from "../lib/useAutoHideChrome";
import { usePauseOffscreen } from "../lib/usePauseOffscreen";
import { LabShell, LabFrame, Spec } from "./labShared";

/* ═══════════════════════════════════════════════════════════════════════════
   THE HERO WAVE — three motions for one curve (09/09)

   "Hiện tại cái arc đang chỉ vào hư vô. Tôi muốn bạn vẽ 1 đường lượn sóng chạy
    từ bên trái màn hình sang bên phải."

   The arc in BrandSurround sweeps out of the bottom-left corner and points at
   nothing — it is a fragment of a shape whose rest is off the page, so the eye
   follows it out of the frame and finds no reason for the trip. A band that
   crosses the whole hero has the opposite problem to solve: it has to be worth
   looking at for the two seconds before the deck takes over, and then stop
   asking.

   The three options below differ on the two axes that decide that:

     · WHEN it moves — once on arrival, or for as long as you are on the page.
     · WHAT moves — the amount of curve shown, the curve itself, or its height.

   Everything else is deliberately identical, so the comparison is only about
   motion: same drawn curve, same teal, same thickness rule, same placement
   behind the deck, same behaviour under prefers-reduced-motion.

   ── on the drawing ───────────────────────────────────────────────────────
   The band is a STROKE, not a filled shape, and that is the load-bearing
   decision here. A filled band would need two edges drawn and kept parallel;
   a stroked centreline gets the second edge for free, keeps its thickness
   exactly constant however sharply the curve turns, and — the reason it
   matters for option 1 — can be drawn on with stroke-dashoffset, where the
   leading edge is the round cap sweeping right. That is the "nét bút" the
   note asks for, and it is one property on one element.

   vector-effect="non-scaling-stroke" is what lets the thickness be stated in
   screen pixels while the curve itself is stretched to whatever width the
   page is. Without it the band would thin out on a narrow window, because
   preserveAspectRatio="none" scales the stroke with the geometry.

   Thickness is 17% of the page height on a desktop and 5% on a phone, per the
   note. On the real page those are `vh`; in these frames they are the same
   fractions of the mock's own height, so what you see is what the page gets.

   ── references ───────────────────────────────────────────────────────────
   21st: Wave Path (@efferd, id 6000) — the setAttribute-in-rAF pattern used
   by options 2 and 3, rather than React state per frame. Line Draw SVG
   (@pulkitxm, id 18352) — getTotalLength + dasharray for option 1, done here
   without GSAP, which the project does not ship.
   ═══════════════════════════════════════════════════════════════════════════ */

const VIEW_W = 1200;
const VIEW_H = 120;

/**
 * The curve, drawn by hand rather than sampled from a sine.
 *
 * Eleven points across a 1200×120 box. It enters below the middle, climbs to
 * a crest a third of the way in, falls to a trough at about two thirds, then
 * rises again and settles a little above where it came in — which is the
 * asymmetry that stops it reading as a maths wave. The first and last x sit
 * outside the box so both round caps are off-screen and the band runs off
 * both edges.
 *
 * The right end was 22 units higher on the first pass, which put it through
 * the ribbon loop in the top-right corner. Two marks crossing there is one
 * too many for a corner that already carries the eye and the nav pill.
 */
const NODE_X = [-60, 70, 200, 330, 460, 590, 720, 850, 980, 1110, 1260];
const NODE_Y = [70, 66, 46, 34, 44, 74, 94, 88, 62, 48, 52];

/**
 * A smooth cubic through every sample — Catmull-Rom, converted to Béziers.
 *
 * Through the points rather than near them, because the points are the drawing
 * and options 2 and 3 both work by moving them. Tension 1/6 is the standard
 * uniform form; the endpoints reuse their neighbour so the curve does not
 * flick at the ends.
 */
function pathThrough(xs: number[], ys: number[]): string {
  const n = xs.length;
  const at = (i: number) => {
    const j = Math.max(0, Math.min(n - 1, i));
    return { x: xs[j], y: ys[j] };
  };

  let d = `M${xs[0].toFixed(1)} ${ys[0].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(
      1
    )} ${p2.y.toFixed(1)}`;
  }
  return d;
}

const RESTING_D = pathThrough(NODE_X, NODE_Y);

/**
 * How long the path is *on screen*, in CSS pixels.
 *
 * getTotalLength() answers in user units, and here the two are not the same
 * number twice over: preserveAspectRatio="none" scales x and y by different
 * factors, and vector-effect="non-scaling-stroke" makes the dash pattern be
 * measured in screen pixels rather than user ones. Feeding the user-unit
 * length to stroke-dasharray left the desktop band 534px short of the right
 * edge — it drew, stopped early, and the last third of the wave was simply
 * missing.
 *
 * There is no API for the rendered length, so it is walked: 200 samples
 * through the screen CTM, summed. Once per arming, on a curve that is smooth
 * at this scale, and the polyline slightly under-reports, which is why the
 * result is nudged up by a percent — an over-long dash still covers the whole
 * path, an under-long one cuts it.
 */
function screenLength(el: SVGPathElement): number {
  const m = el.getScreenCTM();
  const total = el.getTotalLength();
  if (!m) return total;

  const STEPS = 200;
  let len = 0;
  let px = 0;
  let py = 0;

  for (let i = 0; i <= STEPS; i++) {
    const pt = el.getPointAtLength((i / STEPS) * total);
    const x = m.a * pt.x + m.c * pt.y + m.e;
    const y = m.b * pt.x + m.d * pt.y + m.f;
    if (i > 0) len += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }

  return len * 1.01;
}

/**
 * The band itself. Everything above it in the mock is scenery.
 *
 * Sized and placed off three custom properties the frame sets, so the same
 * component draws the desktop and the phone without knowing which it is in.
 */
function WaveBand({ pathRef, d }: { pathRef: { current: SVGPathElement | null }; d: string }) {
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 overflow-visible"
      style={{ top: "var(--wave-top)", height: "var(--wave-travel)" }}
    >
      <path
        ref={pathRef}
        d={d}
        fill="none"
        stroke="var(--color-wave)"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        style={{ strokeWidth: "var(--wave-band)" }}
      />
    </svg>
  );
}

/**
 * One rAF loop, shared by the two ambient options.
 *
 * Time accumulates in a ref rather than in the effect, so pausing off screen
 * holds the wave where it is instead of snapping it back to t = 0 when the
 * section scrolls into view again — the same rule the marquee lanes follow.
 * The draw callback also lives in a ref, so a re-render never restarts the
 * loop.
 */
function useWaveFrame(active: boolean, draw: (t: number) => void) {
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const clock = useRef(0);

  useEffect(() => {
    // one frame while paused, so the wave is drawn rather than blank
    drawRef.current(clock.current);
    if (!active) return;

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      // capped, so a backgrounded tab does not resume with one huge step
      clock.current += Math.min(0.05, (now - last) / 1000);
      last = now;
      drawRef.current(clock.current);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

/* ── option 1 — NÉT BÚT: the stroke draws itself ─────────────────────────
   "khi load page hoặc kéo từ dưới lên đến chỗ hero, đường cong chạy theo
    đường cố định từ trái sang phải, kiểu như có một nét bút vẽ ra đường cong
    đó vậy. Độ dày của con sóng là cố định."

   The curve never changes. stroke-dasharray is set to the path's own length
   and the offset walks from that length to zero, which uncovers the band left
   to right with the round cap as the nib. One property, one transition, no
   frame loop at all — and once it has landed the section costs nothing for
   the rest of the visit.

   Armed by an IntersectionObserver rather than on mount, because the note
   asks for both entrances: a page load with the hero already on screen fires
   it immediately, and a scroll back up to the hero fires it then. */

function WaveDraw({ replay }: {
  /* declared, not inherited: with no @types/react there is no
     JSX.IntrinsicAttributes to carry `key`, and this goes in an array */
  key?: string;
  replay: number;
}) {
  const ref = useRef<SVGPathElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduced) {
      // no drawing, but the band still has to be there
      el.style.transition = "none";
      el.style.strokeDasharray = "none";
      el.style.strokeDashoffset = "0";
      return;
    }

    let drawn = false;

    const arm = () => {
      const len = screenLength(el);
      el.style.strokeDasharray = String(len);
      el.style.strokeDashoffset = String(len);
    };

    el.style.transition = "none";
    arm();
    // commit the reset before the transition is attached, or there is nothing
    // to transition *from* and the band simply appears
    void el.getBoundingClientRect();

    /* The window can change width between arming and firing, and the dash is
       measured in screen pixels — so re-measure until the draw actually
       starts. After it, the dash comes off entirely (below) and resizing is
       no longer this component's problem. */
    const onResize = () => {
      if (!drawn) arm();
    };
    window.addEventListener("resize", onResize);

    /* Once it has landed, drop the dash pattern. The resting state is then a
       plain continuous stroke — no pattern to keep in step with a resize, and
       nothing left for this study to recompute. */
    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName !== "stroke-dashoffset") return;
      el.style.transition = "none";
      el.style.strokeDasharray = "none";
      el.style.strokeDashoffset = "0";
    };
    el.addEventListener("transitionend", onEnd);

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry?.isIntersecting) return;
        drawn = true;
        el.style.transition = "stroke-dashoffset 1700ms cubic-bezier(0.16, 1, 0.3, 1)";
        el.style.strokeDashoffset = "0";
        io.disconnect();
      },
      { threshold: 0.2 }
    );

    io.observe(el);
    return () => {
      io.disconnect();
      window.removeEventListener("resize", onResize);
      el.removeEventListener("transitionend", onEnd);
    };
  }, [reduced, replay]);

  return <WaveBand pathRef={ref} d={RESTING_D} />;
}

/* ── option 2 — DÒNG CHẢY: a long curve pulled through the window ────────
   "con sóng hiện đầy đủ, luôn 'chảy' từ trái sang phải, thay đổi đường cong,
    kiểu như bản thân nó là 1 đường cong dài được loop lại với chính nó."

   Which is exactly what this is, and the loop is exact rather than
   approximate. Every harmonic below has the same integer multiplier on the
   position and on the phase, so the whole sum is one function of (u + shift):
   advancing the shift translates a fixed periodic curve sideways, and at
   shift = 1 the window is showing the same pixels it started on. Nothing
   crossfades and there is no seam to hide.

   The curve appears to change because a straight one is being dragged past a
   fixed window — the change is the window's, not the curve's.

   ⚠ What that costs, and it is the one real difference between this option
   and the other two: a translating curve puts every height at every x
   eventually, so the right-hand end WILL rise into the ribbon loop in the
   top-right corner, and the two are the same teal — they fuse into one shape
   for a few seconds each loop and the loop stops reading as the loop.
   Options 1 and 3 keep a hand-placed resting shape, so their right end can be
   held below it and is. If this option is the one, either the loop moves up
   or the band needs a ceiling on its last fifth — and a ceiling is a taper,
   which is the one thing this option cannot have without stopping being a
   translation. */

/* Amplitudes sum to 33 about a centre of 64, which is the drawn curve's own
   envelope (34…94) to within a unit. The two options have to swing the same
   amount or the comparison is about loudness rather than about motion. */
const FLOW_CENTRE = 64;
const FLOW_HARMONICS = [
  { k: 1, amp: 20, phase: 0 },
  { k: 2, amp: 9, phase: 0.27 },
  { k: 3, amp: 4, phase: 0.63 },
];

/** One loop every 1 / FLOW_SPEED seconds — 18s, slow enough to be scenery. */
const FLOW_SPEED = 0.055;

/** More samples than the drawn curve has nodes: the harmonics need resolving. */
const FLOW_SAMPLES = 17;

function flowY(u: number, shift: number): number {
  let y = FLOW_CENTRE;
  for (const h of FLOW_HARMONICS) {
    y += h.amp * Math.sin(2 * Math.PI * (h.k * (u + shift) + h.phase));
  }
  return y;
}

function WaveFlow() {
  const ref = useRef<SVGPathElement>(null);
  const reduced = useReducedMotion();
  const { ref: hostRef, paused } = usePauseOffscreen<HTMLDivElement>();

  const draw = useCallback((t: number) => {
    const el = ref.current;
    if (!el) return;

    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i < FLOW_SAMPLES; i++) {
      const u = i / (FLOW_SAMPLES - 1);
      xs.push(-60 + u * (VIEW_W + 120));
      ys.push(flowY(u, t * FLOW_SPEED));
    }
    // straight to the attribute: React state at 60fps would re-render the
    // whole study three times a frame for a value only the path reads
    el.setAttribute("d", pathThrough(xs, ys));
  }, []);

  useWaveFrame(!reduced && !paused, draw);

  /* A real box, not `display: contents`: usePauseOffscreen measures this
     element, and an element with no box measures 0×0 — the observer would
     report it off screen for good and the wave would never move. */
  return (
    <div ref={hostRef} className="pointer-events-none absolute inset-0">
      <WaveBand pathRef={ref} d={RESTING_D} />
    </div>
  );
}

/* ── option 3 — SÓNG BIỂN: the band swells where the sea is deepest ──────
   "2 đầu mút của nó chuyển động lên xuống ngẫu nhiên với biên độ nhỏ, còn
    đoạn giữa thì nhảy lên nhảy xuống cao thấp ngẫu nhiên với biên độ lớn hơn,
    kiểu như sóng trên biển."

   The amplitude envelope is the whole idea: a sine bell across the width, so
   the ends barely move and the middle travels six times as far. That is what
   a rope held at both ends does, and it is why this reads as water rather
   than as a banner flapping.

   "Ngẫu nhiên" is two sines at an irrational-looking frequency ratio, per
   node, rather than Math.random(). Random values would need smoothing anyway,
   and this way the motion is continuous by construction, never repeats
   visibly, and is identical on every machine — a screenshot can be compared
   against another screenshot. */

const SEA_SPEED = 0.9;

/** 4 units at the ends, 28 in the middle. The exponent flattens the shoulders. */
function seaAmplitude(i: number, n: number): number {
  return 4 + 24 * Math.pow(Math.sin((Math.PI * i) / (n - 1)), 1.4);
}

function seaNoise(t: number, i: number): number {
  return 0.62 * Math.sin(t * 0.83 + i * 1.7) + 0.38 * Math.sin(t * 1.27 + i * 2.9 + 1.1);
}

function WaveSea() {
  const ref = useRef<SVGPathElement>(null);
  const reduced = useReducedMotion();
  const { ref: hostRef, paused } = usePauseOffscreen<HTMLDivElement>();

  const draw = useCallback((t: number) => {
    const el = ref.current;
    if (!el) return;

    const n = NODE_X.length;
    const ys = NODE_Y.map((base, i) => base + seaAmplitude(i, n) * seaNoise(t * SEA_SPEED, i));
    el.setAttribute("d", pathThrough(NODE_X, ys));
  }, []);

  useWaveFrame(!reduced && !paused, draw);

  return (
    <div ref={hostRef} className="pointer-events-none absolute inset-0">
      <WaveBand pathRef={ref} d={RESTING_D} />
    </div>
  );
}

/* ── the frame the options are judged in ────────────────────────────────
   The real marks, not a lookalike: BrandSurround with its arc turned off is
   the plate, the stood-on-end wave and the ribbon loop exactly as the
   homepage draws them, so what is being compared is the band against the
   composition it has to live in.

   The deck is a stand-in. It only has to occupy the right rectangle, because
   the question the note is asking — what shows either side of it, and how
   much of the band the deck eats — is a question about area, not about
   photographs. */

function HeroMock({
  wave,
  deck,
  phone = false,
}: {
  wave: React.ReactNode;
  deck: boolean;
  phone?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-brand ${
        phone ? "h-[700px] w-[390px] rounded-[2rem]" : "h-[560px] w-full rounded-[1.5rem]"
      }`}
      /* Fractions of this frame's own height, which is what the page states
         in vh: 17% on a desktop, 5% on a phone. */
      style={{
        ["--wave-band" as string]: phone ? "35px" : "95px",
        ["--wave-travel" as string]: phone ? "22%" : "30%",
        /* Lower than the middle on purpose: the band should cross the deck's
           bottom third and run out under it, not cut it in half. */
        ["--wave-top" as string]: phone ? "44%" : "46%",
      }}
    >
      <BrandSurround arc={false} />
      {wave}

      {deck && (
        <div
          className={`absolute inset-x-0 z-10 mx-auto ${
            phone ? "top-[92px] w-[330px]" : "top-[76px] w-[min(78%,52rem)]"
          }`}
        >
          <div
            className={`grid place-items-center rounded-[1.5rem] border border-ink/10 bg-paper ${
              phone ? "aspect-[5/4]" : "aspect-video"
            }`}
          >
            <span className="display text-[clamp(1.5rem,4vw,3rem)] normal-case leading-none text-ink/25">
              Tí Coolture
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── the study ──────────────────────────────────────────────────────────── */

const OPTIONS = [
  {
    slug: "net-but",
    label: "Phương án 1 · Nét bút — vẽ ra một lần rồi đứng yên",
    meta: "stroke-dashoffset · 1 thuộc tính · 0 rAF",
    body:
      "Đường cong cố định. Khi hero vào tầm nhìn, dải sóng được “vẽ” từ trái sang phải, đầu bút là chính cái bo tròn ở mũi nét. Vẽ xong là thôi — phần còn lại của phiên truy cập không tốn gì.",
    spec: {
      property: "stroke-dashoffset",
      duration: "1700ms",
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      trigger: "IntersectionObserver 20%",
    },
  },
  {
    slug: "dong-chay",
    label: "Phương án 2 · Dòng chảy — đường cong dài kéo qua khung",
    meta: "3 sóng hài · 17 điểm/khung hình · lặp kín 18s",
    body:
      "Sóng hiện đầy đủ ngay, và trôi mãi sang phải. Ba sóng hài đều cùng hệ số cho vị trí và pha, nên tổng của chúng là một đường cong tuần hoàn bị kéo ngang — hết 18 giây là về đúng chỗ cũ, không có mối nối nào phải giấu. Cái giá phải trả: đường cong trôi thì chỗ nào cũng có lúc lên cao, nên đầu bên phải sẽ chạm vào ribbon loop ở góc trên — cùng màu teal nên hai hình dính vào nhau vài giây mỗi vòng. Chọn phương án này thì hoặc dời loop lên, hoặc phải bóp biên độ ở một phần năm cuối — mà bóp thì không còn là “kéo ngang” nữa.",
    spec: {
      property: "d (rAF)",
      duration: "18s / vòng",
      easing: "tuyến tính",
      trigger: "liên tục, dừng khi khuất",
    },
  },
  {
    slug: "song-bien",
    label: "Phương án 3 · Sóng biển — hai đầu ghìm, giữa nhồi",
    meta: "11 điểm · biên độ 4→28 · nhiễu tất định",
    body:
      "Sóng hiện đầy đủ, hai đầu mút chỉ nhấp nhẹ còn đoạn giữa nhồi lên xuống gấp sáu lần. Đường bao biên độ là một hình chuông ngang — đúng cái mà một sợi dây bị giữ hai đầu làm, và là lý do nó đọc ra “nước” chứ không phải “băng rôn”.",
    spec: {
      property: "d (rAF)",
      duration: "không lặp thấy được",
      easing: "tổng 2 sin/điểm",
      trigger: "liên tục, dừng khi khuất",
    },
  },
];

export default function HeroWaveStudies() {
  const [deck, setDeck] = useState(true);
  const [replay, setReplay] = useState(0);

  const waves = [<WaveDraw key="draw" replay={replay} />, <WaveFlow key="flow" />, <WaveSea key="sea" />];

  return (
    <LabShell
      eyebrow="09/09 · HERO"
      title="Con sóng — ba kiểu chuyển động"
      notes={
        <>
          <p>
            Cái arc teal ở góc dưới trái đang chỉ vào hư vô, nên nó được thay bằng một
            dải sóng chạy suốt từ mép trái sang mép phải. Cả ba phương án dùng{" "}
            <strong className="text-ink">cùng một đường cong</strong>, cùng độ dày, cùng
            vị trí sau deck — khác nhau đúng ở chỗ chuyển động, để so được.
          </p>
          <p>
            Dải sóng là một <strong className="text-ink">nét stroke</strong>, không phải
            hình được tô. Nhờ vậy độ dày luôn cố định dù đường cong bẻ gắt tới đâu, và
            phương án 1 mới vẽ được bằng <code>stroke-dashoffset</code>. Độ dày: 17% chiều
            cao trang trên PC, 5% trên mobile.
          </p>
        </>
      }
    >
      <div className="mx-auto flex max-w-[92rem] flex-wrap items-center gap-3 px-5 pb-4 md:px-10">
        <button
          onClick={() => setDeck((d) => !d)}
          className="rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold transition-colors hover:border-brand hover:text-brand"
        >
          {deck ? "Ẩn deck — chỉ xem sóng" : "Hiện deck — như người dùng thấy"}
        </button>
        <button
          onClick={() => setReplay((r) => r + 1)}
          className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold transition-colors hover:border-brand hover:text-brand"
        >
          <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
          Vẽ lại phương án 1
        </button>
      </div>

      {OPTIONS.map((o, i) => (
        <LabFrame key={o.slug} label={o.label} meta={o.meta}>
          <div className="mx-auto max-w-[92rem] px-5 pb-12 md:px-10">
            <HeroMock wave={waves[i]} deck={deck} />

            <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,390px)_minmax(0,1fr)]">
              <div className="justify-self-start overflow-hidden rounded-[2rem]">
                {/* the same option again at 5% thickness, which is a different
                    proposal in practice: a 35px band reads as a ribbon where a
                    95px one reads as a field */}
                <HeroMock wave={waves[i]} deck={deck} phone />
              </div>

              <div>
                <p className="max-w-[62ch] text-sm leading-relaxed text-ink/75">{o.body}</p>
                <Spec {...o.spec} />
              </div>
            </div>
          </div>
        </LabFrame>
      ))}
    </LabShell>
  );
}
