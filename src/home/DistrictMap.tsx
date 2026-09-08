import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useDragTrack } from "../lib/useDragTrack";
import { islandBlobs, planFor } from "./homeData";
import "./home.css";
import type { TouristRoute } from "../types";

/**
 * The district map.
 *
 * Lifted out of the homepage on 26/08 so /discover can carry the same map —
 * the team asked for one map, in two places, behaving identically. What
 * differs is only what a tap means, which is why this component navigates
 * nowhere itself and takes onOpenRoute / onPin from its parent: on the
 * homepage a pin leaves for /discover, and on /discover it selects a stop
 * without a navigation.
 */
/* ── map strip ──────────────────────────────────────────────────────────
   After bangkokartcity.org's "Discover Bangkok Art City": flat illustrated
   island on a dark ground, teardrop pins, nothing else.

   Team 20/08: the districts must be reachable by dragging with a mouse,
   swiping, or pressing the buttons — and all three must move the same way.
   So all districts live on one track and every input drives the same spring
   (see useDragTrack): 1:1 while held, released at the pointer's own velocity,
   landing on the district the flick was heading for. */

function DistrictSlide({
  route,
  plan,
  onOpen,
  onPin,
  active,
}: {
  key?: string;
  route: TouristRoute;
  plan: ReturnType<typeof planFor>;
  onOpen: () => void;
  onPin: (stopId: string) => void;
  /** True while this is the district on screen — see the pin drop below. */
  active: boolean;
}) {
  const island = islandBlobs(route.stops);
  const clipId = `ti-island-clip-${route.id}`;

  return (
    <div className="w-full shrink-0 px-2 md:px-6">
      {/* The island is clickable but is NOT a button: each pin inside it is
          one, and a button inside a button is invalid HTML that React refuses
          to hydrate. Mouse users can hit anywhere on the island; keyboard and
          screen-reader users get the pins, which are real buttons and go
          somewhere more specific anyway, plus the "Mở lộ trình" link below. */}
      <div
        onClick={onOpen}
        aria-hidden="true"
        className="group block w-full cursor-pointer"
      >
        {/* Sized by height, not by width (26/08: "everything should fit
            neatly on the page" at 100% zoom) — but it is the *width* that gets
            capped, which is the correction the hero already had to make on
            28/08.

            `aspect-[16/9]` paired with a fixed `h-` and `max-w-full` cannot
            all hold at once. On a phone the height rule won at 309px,
            aspect-ratio asked for 549px of width, `max-w-full` clamped that to
            the 239px slide, and the box came out 0.78:1 instead of 1.78:1.
            With preserveAspectRatio="none" below, the 800×600 artwork was then
            squashed to 58% of its intended width — the island that reads as
            broken in the 31/08 screenshot ("Ồ map bị lỗi").

            Capping max-width instead keeps aspect-ratio in charge: the width
            is the smaller of the column and (allowed height × ratio), and the
            height follows from it. The ratio is now 4:3 — the artwork's own —
            so "none" is a no-op rather than a distortion, and the pins, which
            are positioned as percentages of this box, land exactly on their
            stops at every size. */}
        <div
          className="relative mx-auto aspect-[4/3] w-full [--map-h:clamp(11rem,34vh,19rem)]"
          style={{ maxWidth: "calc(var(--map-h) * 4 / 3)" }}
        >
          <svg
            viewBox="0 0 800 600"
            preserveAspectRatio="none"
            className="h-full w-full overflow-visible transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02]"
            aria-hidden="true"
          >
            <defs>
              <clipPath id={clipId}>
                {island.map((b, i) => (
                  <ellipse key={i} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} />
                ))}
              </clipPath>
            </defs>
            {/* One landmass derived from the stops, so every pin stands on
                land. The blobs share a fill, so they merge into a single
                silhouette instead of stacking edges. */}
            <g fill="var(--color-wave)">
              {island.map((b, i) => (
                <ellipse key={i} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} />
              ))}
            </g>
            <g clipPath={`url(#${clipId})`}>
              {plan.shapes.map((d, i) => (
                <path key={i} d={d} fill="var(--color-wave-ink)" fillOpacity={0.16 + i * 0.05} />
              ))}
              {/* The waterway. It used to be the loudest mark on the map —
                  stroke 20, full brand violet, opacity .85, running out past
                  both edges of the island. It is a geographic hint, not a
                  route, so it sits inside the island with the rest of the
                  terrain. It is what is left after the connecting line went
                  (07/09) and it is deliberately kept: it joins nothing, it
                  just stops the island reading as a flat teal shape. */}
              <path
                d={plan.axis}
                fill="none"
                stroke="var(--color-wave-ink)"
                strokeWidth="9"
                strokeLinecap="round"
                opacity="0.28"
              />
            </g>

          </svg>

          {/* Teardrop pins, tip on the coordinate. Each pin is its own control
              (26/08): tapping one goes to /discover and opens that stop, not
              just the district. They sit above the island button, so a pin
              press never falls through to the whole-map link.

              A pin is positioned as a percentage of this box while the island
              is drawn in an 800×600 viewBox, so the two only agree when the
              SVG fills the box exactly — hence preserveAspectRatio="none"
              above. With the default "meet" the artwork letterboxed and every
              pin drifted outward from its stop. Since 31/08 the box carries
              the artwork's own 4:3, so "none" neither letterboxes nor
              stretches; it just keeps the pin maths exact. */}
          {/* Motion 06: the pins drop in along the route, 70ms apart, rather
              than arriving with the island as if painted on it.

              Keyed on `active`, so the run restarts when the carousel settles
              on this district — React remounts the span, which is the only
              reliable way to replay a CSS animation. The resting -50%/-100%
              offset moves into the keyframes with it: an animation owns every
              property it touches, so the translate utilities would be
              overridden mid-flight and snap back at the end.

              The stagger no longer has a line to walk with — the route trail
              was removed on 07/09 ("Xoá đường nối các điểm ở map") — so 70ms is
              the proposal's own figure rather than a pace matched to it. */}
          {route.stops.map((stop, i) => (
            <span
              key={`${stop.id}-${active}`}
              style={{
                left: `${stop.x}%`,
                top: `${stop.y}%`,
                animationDelay: `${i * 70}ms`,
              }}
              className="ti-pin-drop absolute z-10 block"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPin(stop.id);
                }}
                aria-label={`Điểm ${i + 1}: ${stop.name} — mở trên trang Khám phá`}
                className="group/pin relative block h-11 w-8 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 md:h-14 md:w-10"
              >
                <svg
                  viewBox="0 0 40 52"
                  aria-hidden="true"
                  className="h-full w-full drop-shadow-[0_6px_10px_rgba(18,8,31,0.45)]"
                >
                  <path
                    d="M20 0C31 0 40 9 40 20c0 12-13 24-18 31a2.5 2.5 0 0 1-4 0C13 44 0 32 0 20 0 9 9 0 20 0Z"
                    fill="var(--color-paper)"
                    className="transition-[fill] duration-300 group-hover/pin:fill-[var(--color-wave)]"
                  />
                </svg>
                <span className="absolute inset-x-0 top-[14%] text-center text-sm font-bold text-ink md:text-base">
                  {i + 1}
                </span>
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* the keyboard route into the district, and the one screen readers get */}
      <div className="mt-4 text-center">
        <button
          onClick={onOpen}
          className="inline-flex items-center gap-2 border-b border-white/40 pb-1 text-sm text-paper transition-colors hover:border-wave hover:text-wave"
        >
          Mở lộ trình {plan.district}
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function DistrictMap({
  routes,
  onOpenRoute,
  onPin,
  heading = "Khám phá Sài Gòn",
  variant = "section",
}: {
  routes: TouristRoute[];
  /** The island was tapped — open this district. */
  onOpenRoute: (routeId: string) => void;
  /** A single pin was tapped — open this stop of this district. */
  onPin: (routeId: string, stopId: string) => void;
  heading?: string;
  /**
   * "section" is the homepage: the map owns a band of the page, brings its
   * own deeper-violet ground and titles itself.
   *
   * "inline" is /discover (07/09), where the map sits *inside* the route
   * hero rather than after it. It takes no ground of its own — so the violet
   * runs unbroken from the top of the page through the map and into the wave
   * seam — and its title drops to a label, because the page already has an
   * h1 two lines above it and two display headings stacked is the noise the
   * "hài hoà hơn" note is about.
   */
  variant?: "section" | "inline";
}) {
  /* Softened on 31/08: "đang trôi khá nhanh, khiến người xem hơi nhức mắt".
     The map is a picture you read, not a list you flick through, so it now
     lands slower than the default track (0.72s against 0.42s), throws about a
     quarter as far on the same flick (deceleration 0.992 against 0.998), and
     never crosses more than one district per swipe. The collections track on
     the homepage keeps the original figures. */
  const track = useDragTrack(routes.length, {
    response: 0.72,
    decelerationRate: 0.992,
    maxPagesPerFlick: 1,
  });
  const inline = variant === "inline";

  const route = routes[track.page];
  const plan = route ? planFor(route.id) : null;
  if (!route || !plan) return null;

  return (
    /* Ground is brand-deep, not ink (26/08: "DO NOT use black background,
       especially for this section"). It stays dark on purpose — the pins are
       white teardrops and the island is teal, and both need a dark field to
       read on — but it is now the deeper violet from the palette rather than
       near-black, which also separates it from the violet section above.

       Vertical rhythm is roughly halved throughout: py-16/24 → py-10/14, the
       heading clamp tops out at 3.5rem instead of 5rem, and the gaps between
       heading, label, map and dots go from 4/10/8 to 2/5/5. That plus the
       height-led island is what brings the section under one screen. */
    <section
      id="dong-map"
      className={
        inline
          ? "pb-2 pt-4 text-paper"
          : "bg-brand-deep py-10 text-paper md:py-14"
      }
    >
      <div className="px-5 text-center md:px-10">
        {inline ? (
          <p className="label text-wave">{heading}</p>
        ) : (
          <h2 className="display text-[clamp(1.75rem,4.6vw,3.5rem)] normal-case leading-[1.15] text-wave">
            {heading}
          </h2>
        )}
        {/* the label crossfades on the key, so the district name never cuts */}
        <p
          key={route.id}
          className="lab-plate-in mt-2 text-[12px] tracking-[0.16em] text-white/60"
        >
          {plan.district.toUpperCase()} · {route.stops.length} ĐIỂM · {plan.walk}
        </p>
      </div>

      {/* Inline, the map shares the hero's column, so its arrows come in to
          sit beside the island instead of being stranded on the far edges of
          the viewport with the page's brand shapes behind them. */}
      <div
        className={`relative flex items-center gap-2 md:gap-5 ${
          inline ? "mx-auto mt-3 max-w-4xl px-2 md:px-4" : "mt-5 px-2 md:px-8"
        }`}
      >
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
          role="group"
          aria-roledescription="carousel"
          aria-label="Bản đồ các quận"
        >
          <div
            className="flex"
            style={{
              transform: `translate3d(${track.x}px, 0, 0)`,
              willChange: "transform",
            }}
          >
            {routes.map((r) => (
              <DistrictSlide
                key={r.id}
                route={r}
                plan={planFor(r.id)}
                active={r.id === route.id}
                onOpen={() => {
                  // a flick that ends over the island must not also open it
                  if (track.didDrag()) return;
                  onOpenRoute(r.id);
                }}
                onPin={(stopId) => {
                  if (track.didDrag()) return;
                  onPin(r.id, stopId);
                }}
              />
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

      {/* No caption. Team 26/08: "Show don't tell. Remove 'kéo vuốt hoặc bấm
          mũi tên…' The user can see for themselves." The arrows, the dots and
          the grab cursor are the affordance; the sentence was describing
          controls that are already on screen. */}
    </section>
  );
}