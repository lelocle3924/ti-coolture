import { useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { islandBlobs, planFor, useHomeData } from "../home/homeData";
import { useDragTrack } from "../lib/useDragTrack";
import type { TouristRoute } from "../types";
import { LabShell, LabFrame } from "./labShared";

/* ═══════════════════════════════════════════════════════════════════════════
   THE MAP — the three options the team asked for on 26/08

   "Reduce white space from 'Quận 5 - Chợ Lớn - 4 Điểm' to the top of the map.
    This is viewing at 100% zoom, so everything should fit neatly on the page…
    Show don't tell. Remove 'kéo vuốt hoặc bấm mũi tên…' … Give 3 options.
    DO NOT use black background, especially for this section."

   All three obey the same three constraints, and differ in how they spend
   what is left:

     · the section fits inside one 900px-tall viewport
     · no black ground anywhere
     · no sentence explaining the controls

   Shared plumbing note: a pin is placed as a percentage of its box while the
   island is drawn in an 800×600 viewBox, so every island here carries
   preserveAspectRatio="none" — otherwise the artwork letterboxes inside a box
   of a different ratio and the pins drift off the stops they name.
   ═══════════════════════════════════════════════════════════════════════════ */

function Island({
  route,
  pinFill = "var(--color-paper)",
  pinInk = "text-ink",
  drop = false,
  className = "",
}: {
  /* declared because the project has no @types/react, so TS checks `key` as
     an ordinary prop rather than a reserved one (same as RibbonLoop) */
  key?: string;
  route: TouristRoute;
  /** White pins vanish on a white ground; option 2 sends violet ones instead. */
  pinFill?: string;
  pinInk?: string;
  /** Drop the pins in on mount — the motion study's proposal, shown in situ. */
  drop?: boolean;
  className?: string;
}) {
  const island = islandBlobs(route.stops);
  const plan = planFor(route.id);
  const clipId = `lab-island-${route.id}`;

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 800 600"
        preserveAspectRatio="none"
        className="h-full w-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipId}>
            {island.map((b, i) => (
              <ellipse key={i} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} />
            ))}
          </clipPath>
        </defs>
        <g fill="var(--color-wave)">
          {island.map((b, i) => (
            <ellipse key={i} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} />
          ))}
        </g>
        <g clipPath={`url(#${clipId})`}>
          {plan.shapes.map((d, i) => (
            <path key={i} d={d} fill="var(--color-wave-ink)" fillOpacity={0.16 + i * 0.05} />
          ))}
        </g>
        <path
          d={plan.axis}
          fill="none"
          stroke="var(--color-brand)"
          strokeWidth="20"
          strokeLinecap="round"
          opacity="0.85"
        />
      </svg>

      {route.stops.map((stop, i) => (
        <span
          key={stop.id}
          style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
          className={`absolute z-10 block h-9 w-7 -translate-x-1/2 -translate-y-full md:h-11 md:w-8 ${
            drop ? "lab-pin-drop" : ""
          }`}
        >
          <svg viewBox="0 0 40 52" aria-hidden="true" className="h-full w-full drop-shadow-[0_4px_8px_rgba(18,8,31,0.35)]">
            <path
              d="M20 0C31 0 40 9 40 20c0 12-13 24-18 31a2.5 2.5 0 0 1-4 0C13 44 0 32 0 20 0 9 9 0 20 0Z"
              fill={pinFill}
            />
          </svg>
          <span className={`absolute inset-x-0 top-[13%] text-center text-xs font-bold ${pinInk}`}>
            {i + 1}
          </span>
        </span>
      ))}
    </div>
  );
}

/* ── option 1 — "Băng": the strip, tightened ─────────────────────────────
   The shipped layout. Same shape as before, half the vertical rhythm, sized
   by height rather than width, on the palette's deep violet. Least change,
   least risk. */

export function MapStrip({ routes }: { routes: TouristRoute[] }) {
  const track = useDragTrack(routes.length);
  const route = routes[track.page];
  if (!route) return null;
  const plan = planFor(route.id);

  return (
    <section className="bg-brand-deep py-10 text-paper">
      <div className="px-5 text-center md:px-10">
        <h2 className="display text-[clamp(1.75rem,4.6vw,3.5rem)] normal-case leading-[1.15] text-wave">
          Khám phá Sài Gòn
        </h2>
        <p key={route.id} className="mt-2 text-[12px] tracking-[0.16em] text-white/60">
          {plan.district.toUpperCase()} · {route.stops.length} ĐIỂM · {plan.walk}
        </p>
      </div>

      <div className="relative mt-5 flex items-center gap-2 px-2 md:gap-5 md:px-8">
        <button
          onClick={track.prev}
          disabled={track.page === 0}
          aria-label="Quận trước"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/25 transition-colors hover:border-wave hover:text-wave disabled:opacity-25 md:h-12 md:w-12"
        >
          <ArrowRight className="h-5 w-5 rotate-180" />
        </button>

        <div
          ref={track.setViewport}
          {...track.handlers}
          className={`min-w-0 flex-1 overflow-hidden touch-pan-y ${
            track.dragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          <div className="flex" style={{ transform: `translate3d(${track.x}px,0,0)` }}>
            {routes.map((r) => (
              <div key={r.id} className="w-full shrink-0 px-2 md:px-6">
                <Island
                  route={r}
                  className="mx-auto aspect-[16/9] h-[clamp(12rem,38vh,21rem)] max-w-full"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={track.next}
          disabled={track.page === routes.length - 1}
          aria-label="Quận sau"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/25 transition-colors hover:border-wave hover:text-wave disabled:opacity-25 md:h-12 md:w-12"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        {routes.map((r, i) => (
          <button
            key={r.id}
            onClick={() => track.goTo(i)}
            aria-label={`Xem ${planFor(r.id).district}`}
            aria-current={i === track.page}
            className={`h-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              i === track.page ? "w-10 bg-wave" : "w-1.5 bg-white/30 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

/* ── option 2 — "Kề": the index beside the island ────────────────────────
   Districts as a numbered list on the left, the island on the right. No
   arrows, no dots, no carousel: every district is already on screen and
   named, so the control IS the list. Shortest of the three, and the only one
   where you can see what the other districts are without moving anything.

   Runs on paper, which forces the pins violet — a white teardrop on white is
   invisible. That is the option's real cost: it spends the page's one white
   section allowance here. */

export function MapIndex({ routes }: { routes: TouristRoute[] }) {
  const [active, setActive] = useState(0);
  const route = routes[active];
  if (!route) return null;
  const plan = planFor(route.id);

  return (
    <section className="bg-paper-warm py-10 text-ink">
      <div className="mx-auto grid max-w-[80rem] gap-8 px-5 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:px-10">
        <div>
          <h2 className="display text-[clamp(1.6rem,3.2vw,2.5rem)] normal-case leading-[1.15] text-wave-ink">
            Khám phá Sài Gòn
          </h2>

          <ul className="mt-5 border-t border-ink/12">
            {routes.map((r, i) => {
              const p = planFor(r.id);
              const on = i === active;
              return (
                <li key={r.id} className="border-b border-ink/12">
                  <button
                    onClick={() => setActive(i)}
                    aria-current={on}
                    className={`flex w-full items-baseline gap-3 py-3 text-left transition-colors ${
                      on ? "text-brand" : "text-ink/70 hover:text-ink"
                    }`}
                  >
                    <span className="w-6 shrink-0 text-[11px] tabular-nums tracking-[0.14em] opacity-60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-medium">{p.district}</span>
                      <span className="block text-[11px] text-ink/50">
                        {r.stops.length} điểm · {p.walk}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={`h-px shrink-0 self-center bg-current transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        on ? "w-7" : "w-0"
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          <button className="mt-5 inline-flex items-center gap-2 border-b border-ink/30 pb-1 text-sm font-medium transition-colors hover:border-brand hover:text-brand">
            Mở lộ trình {plan.district}
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        <Island
          key={route.id}
          route={route}
          pinFill="var(--color-brand)"
          pinInk="text-paper"
          drop
          className="aspect-[16/10] h-[clamp(11rem,34vh,19rem)] w-full max-w-full justify-self-center"
        />
      </div>
    </section>
  );
}

/* ── option 3 — "Chồng": the name over the island ────────────────────────
   Full-bleed island on violet with the district name set across it, and the
   stops as a row of chips below. Loudest of the three and the one that reads
   most like the rest of the homepage, where display type sits on colour
   fields. Each chip is its own way in, so a visitor can go straight to a stop
   without going through the district first.

   Also the one with the most to go wrong: the name crosses the artwork, so it
   needs the scrim behind it, and long district names will crowd the pins. */

export function MapOverlay({ routes }: { routes: TouristRoute[] }) {
  const [active, setActive] = useState(0);
  const route = routes[active];
  if (!route) return null;
  const plan = planFor(route.id);

  return (
    <section className="relative overflow-hidden bg-brand py-10 text-paper">
      <div className="relative mx-auto max-w-[80rem] px-5 md:px-10">
        <div className="relative">
          <Island
            key={route.id}
            route={route}
            drop
            className="aspect-[16/8] h-[clamp(11rem,34vh,19rem)] w-full max-w-full"
          />

          {/* The name sits over the island, so it needs its own ground — a
              top-down scrim rather than a box, or it reads as a caption stuck
              on the artwork.

              z-[5]: above the island, below the pins. At z-20 the scrim was
              washing violet over any pin that sits high on the landmass, which
              read as a disabled pin rather than as depth. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[5] bg-gradient-to-b from-brand via-brand/70 to-transparent pb-10 pt-1 text-center">
            <h2 className="display text-[clamp(1.9rem,5vw,3.75rem)] normal-case leading-[1.15]">
              {plan.district}
            </h2>
            <p className="mt-1 text-[11px] tracking-[0.18em] text-white/70">
              {route.stops.length} ĐIỂM · {plan.walk}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {routes.map((r, i) => (
            <button
              key={r.id}
              onClick={() => setActive(i)}
              aria-current={i === active}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-300 ${
                i === active
                  ? "bg-wave text-ink"
                  : "border border-white/25 text-white/75 hover:border-wave hover:text-wave"
              }`}
            >
              {planFor(r.id).district}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {route.stops.map((stop, i) => (
            <button
              key={stop.id}
              className="group inline-flex items-center gap-2 text-sm text-white/75 transition-colors hover:text-wave"
            >
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/15 text-[10px] font-bold">
                {i + 1}
              </span>
              <span className="border-b border-transparent pb-0.5 transition-colors group-hover:border-wave">
                {stop.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── the page ───────────────────────────────────────────────────────────── */

export default function MapStudies() {
  const { routes } = useHomeData();

  return (
    <LabShell
      eyebrow="TRANG CHỦ + /DISCOVER · BẢN ĐỒ"
      title="Ba phương án cho khối bản đồ"
      notes={
        <>
          <p>
            Cả ba đều vừa một màn hình 900px, không dùng nền đen, và không có câu
            “kéo vuốt hoặc bấm mũi tên…”. Khác nhau ở chỗ tiêu gì với phần còn lại.
          </p>
          <p>
            Phương án 1 đang chạy trên trang chủ và /discover. Ghim trên cả ba đều
            đã sửa lệch — xem ghi chú trong file.
          </p>
        </>
      }
    >
      <LabFrame
        label="Phương án 1 · Băng — dải ngang, thu gọn"
        meta="~620px · nền brand-deep · mũi tên + chấm · ít rủi ro nhất"
      >
        <MapStrip routes={routes} />
      </LabFrame>

      <LabFrame
        label="Phương án 2 · Kề — danh sách quận cạnh đảo"
        meta="~460px · nền paper-warm · ghim tím · không carousel"
      >
        <MapIndex routes={routes} />
      </LabFrame>

      <LabFrame
        label="Phương án 3 · Chồng — tên quận đè lên đảo"
        meta="~560px · nền brand · chip quận + chip điểm · vào thẳng từng điểm"
      >
        <MapOverlay routes={routes} />
      </LabFrame>

      <div className="mx-auto max-w-[70ch] px-5 py-10 text-sm leading-relaxed text-ink/70 md:px-10">
        <p className="label text-ink/50">ĐÁNH ĐỔI</p>
        <ul className="mt-3 space-y-2">
          <li>
            <strong className="text-ink">1 · Băng</strong> — giữ nguyên cấu trúc cũ,
            chỉ siết lại. Đổi lại vẫn phải bấm/kéo mới biết còn quận nào.
          </li>
          <li>
            <strong className="text-ink">2 · Kề</strong> — ngắn nhất, và là phương án
            duy nhất cho thấy tên tất cả các quận cùng lúc. Đổi lại nó tiêu suất
            “một section trắng” của trang chủ, và ghim phải đổi sang tím.
          </li>
          <li>
            <strong className="text-ink">3 · Chồng</strong> — hợp giọng trang chủ nhất
            và cho vào thẳng từng điểm. Đổi lại chữ đè lên artwork nên cần lớp scrim,
            và ghim nằm cao trên đảo sẽ chạm vào dải tiêu đề — ghim vẽ đè lên scrim
            nên vẫn đọc được, nhưng quận nào có điểm sát mép trên thì nên kiểm lại.
          </li>
        </ul>
      </div>
    </LabShell>
  );
}
