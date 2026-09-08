import { useMemo, useState, type ReactNode } from "react";
import { Camera, Landmark, ShoppingBag, Utensils } from "lucide-react";
import { islandBlobs, planFor, pointsAlongRoute } from "./homeData";
import "./home.css";
import type { TouristRoute } from "../types";

/**
 * The map block.
 *
 * Direction 2 from /lab/map — "Kề: danh sách quận cạnh đảo" — picked by the
 * team on 08/09 ("redesign bản đồ và trang /discover theo hướng 2 trong
 * lab"). The carousel goes with it. The districts used to sit behind arrows,
 * dots and a drag, and none of those said what the other districts *were*;
 * they are a list beside the island now, all three named and on screen at
 * once, and the list is the control. There is nothing left to swipe, so there
 * is nothing left to explain.
 *
 * The same note rewrites the map itself:
 *
 *   · 65% of the page wide on a desktop, 75% on a phone, at its own ratio,
 *     with no padding either side taking that width back.
 *   · On the homepage: one pin, unnumbered, bobbing — and a tap anywhere on
 *     the island goes to /discover.
 *   · On /discover: one pin per kind of place rather than per stop. Tapping
 *     one scrolls to that list and marks the pin.
 *
 * Which is why this file exports two maps rather than taking a variant. They
 * share a layout and an island and agree on nothing else: one chooses a
 * region and leaves, the other stays on the page and filters it. The old
 * `variant` prop was already carrying that split, and had started to carry a
 * second one — which ground, which heading level — on top of it.
 */

/* ── the kinds of place ───────────────────────────────────────────────────
   ⚠ PLACEHOLDER TAXONOMY. Team 08/09: "mỗi pin là 1 category điểm đến khác
   nhau (tạm thời để 4 pin là Ăn uống, Tham quan, Chụp ảnh, Mua sắm)" — the
   four below are that temporary set, stated once so the map and /discover
   cannot drift apart. `route_stops` carries no category column yet, so a pin
   names a kind of place rather than pointing at one; see pointsAlongRoute in
   homeData for where they are put and why. When the column lands, the pins
   move onto their stops and this list comes out of the dataset. */

export const DISCOVER_CATEGORIES = [
  { id: "an-uong", name: "Ăn uống", Icon: Utensils },
  { id: "tham-quan", name: "Tham quan", Icon: Landmark },
  { id: "chup-anh", name: "Chụp ảnh", Icon: Camera },
  { id: "mua-sam", name: "Mua sắm", Icon: ShoppingBag },
] as const;

export type DiscoverCategory = (typeof DISCOVER_CATEGORIES)[number];

/* ── shared parts ─────────────────────────────────────────────────────── */

/**
 * The "kề" arrangement: an index on the left, the island on the right.
 *
 * 35/65 with no gap and no padding on the grid itself, so the island column
 * *is* the 65% the team asked for — the list carries the page gutter on its
 * own side and the island runs out to the edge of the page. Any padding here
 * would come off the map's width, which is the thing 08/09 asks not to happen
 * ("nhớ xoá margin hay padding ở 2 bên").
 *
 * On a phone the two stack and the island takes 75%, centred.
 */
function KeLayout({ index, island }: { index: ReactNode; island: ReactNode }) {
  return (
    <div className="md:grid md:grid-cols-[minmax(0,35fr)_minmax(0,65fr)] md:items-center">
      <div className="px-5 md:px-10">{index}</div>
      <div className="mx-auto mt-8 w-[75%] md:mx-0 md:mt-0 md:w-full">{island}</div>
    </div>
  );
}

/**
 * The landmass, with whatever pins the caller puts on it.
 *
 * A pin is placed as a percentage of this box while the island is drawn in an
 * 800×600 viewBox, so the two only agree when the SVG fills the box exactly —
 * hence preserveAspectRatio="none". The box carries the artwork's own 4:3, so
 * "none" neither letterboxes nor stretches; it just keeps the pin maths
 * exact. That is also the whole of "giữ nguyên aspect ratio": the width is
 * set, the height follows from 4:3, and nothing squashes the drawing to fit.
 */
function IslandFrame({ route, children }: { route: TouristRoute; children: ReactNode }) {
  const plan = planFor(route.id);
  const island = islandBlobs(route.stops);
  const clipId = `ti-island-clip-${route.id}`;

  return (
    <div className="relative aspect-[4/3] w-full">
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
        {/* One landmass derived from the stops, so every pin stands on land.
            The blobs share a fill, so they merge into a single silhouette
            instead of stacking edges. */}
        <g fill="var(--color-wave)">
          {island.map((b, i) => (
            <ellipse key={i} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} />
          ))}
        </g>
        <g clipPath={`url(#${clipId})`}>
          {plan.shapes.map((d, i) => (
            <path key={i} d={d} fill="var(--color-wave-ink)" fillOpacity={0.16 + i * 0.05} />
          ))}
          {/* The waterway — a geographic hint, not a route. It is what is left
              after the connecting line went (07/09) and it is deliberately
              kept: it joins nothing, it just stops the island reading as a
              flat teal shape. */}
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
      {children}
    </div>
  );
}

/** The teardrop itself, tip at the bottom of its own box. */
function Teardrop({ fill, children }: { fill: string; children?: ReactNode }) {
  return (
    <span className="relative block h-11 w-8 md:h-14 md:w-10">
      <svg
        viewBox="0 0 40 52"
        aria-hidden="true"
        className="h-full w-full drop-shadow-[0_6px_10px_rgba(18,8,31,0.45)]"
      >
        <path
          d="M20 0C31 0 40 9 40 20c0 12-13 24-18 31a2.5 2.5 0 0 1-4 0C13 44 0 32 0 20 0 9 9 0 20 0Z"
          fill={fill}
          className="transition-[fill] duration-300"
        />
      </svg>
      {children}
    </span>
  );
}

/* ── the homepage map ─────────────────────────────────────────────────── */

export default function DistrictMap({
  routes,
  onOpenRoute,
  heading = "Khám phá Sài Gòn",
}: {
  routes: TouristRoute[];
  /** The island was tapped — open this region on /discover. */
  onOpenRoute: (routeId: string) => void;
  heading?: string;
}) {
  /* Null until someone picks, because `routes` arrives empty on the first
     render — seeding the state from routes[0] would lock the map to whatever
     was there before the fetch resolved. */
  const [picked, setPicked] = useState<string | null>(null);
  const route = routes.find((r) => r.id === picked) ?? routes[0];

  /* One pin, in the middle of the walk. Team 08/09: "trên đó chỉ có 1 pin đại
     diện, không đánh số gì hết" — it stands for the region, so it belongs
     where the region is rather than on any one stop, and there is no order
     left for it to number. */
  const centre = useMemo(() => (route ? pointsAlongRoute(route.stops, 1)[0] : null), [route]);

  if (!route || !centre) return null;
  const plan = planFor(route.id);

  return (
    /* Ground stays brand-deep (26/08: "DO NOT use black background,
       especially for this section") — the island is teal and the pin is
       white, and both need a dark field to read on. */
    <section id="dong-map" className="bg-brand-deep py-12 text-paper md:py-16">
      <KeLayout
        index={
          <>
            <h2 className="display text-[clamp(1.75rem,3.4vw,3rem)] normal-case leading-[1.15] text-wave">
              {heading}
            </h2>

            {/* Every region named and on screen. This is the control that
                replaced the arrows and the dots: you can see what the other
                two are before deciding to look at one. */}
            <ul className="mt-6 border-t border-white/15">
              {routes.map((r, i) => {
                const on = r.id === route.id;
                return (
                  <li key={r.id} className="border-b border-white/15">
                    <button
                      type="button"
                      onClick={() => setPicked(r.id)}
                      aria-current={on}
                      className={`flex w-full items-center gap-3 py-3.5 text-left transition-colors ${
                        on ? "text-wave" : "text-white/65 hover:text-paper"
                      }`}
                    >
                      <span className="w-6 shrink-0 text-[11px] tabular-nums tracking-[0.14em] opacity-60">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {/* The region, and nothing else. The stop count and the
                          walking distance came off on 08/09. */}
                      <span className="min-w-0 flex-1 truncate text-lg font-medium">
                        {planFor(r.id).region}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`h-px shrink-0 bg-current transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                          on ? "w-8" : "w-0"
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        }
        island={
          /* A real button this time. The island used to be a clickable div
             because it had buttons inside it — one per stop — and a button
             inside a button is invalid HTML that React refuses to hydrate.
             It carries one decorative pin now and no controls, so the whole
             map can be the control it already behaved like, and the "Mở lộ
             trình…" link that existed to give the keyboard a way in is not
             needed any more (08/09: Xoá dòng "Mở lộ trình Quận 5 · Chợ Lớn"). */
          <button
            type="button"
            onClick={() => onOpenRoute(route.id)}
            aria-label={`Xem ${plan.region} trên trang Khám phá`}
            className="group block w-full cursor-pointer"
          >
            <IslandFrame route={route}>
              {/* Keyed on the region so the bob restarts where the island
                  changes — otherwise the pin appears to stay put while the
                  ground under it swaps. */}
              <span
                key={route.id}
                style={{ left: `${centre.x}%`, top: `${centre.y}%` }}
                className="ti-pin-bob absolute z-10 block"
              >
                <Teardrop fill="var(--color-paper)">
                  {/* A dot, not a number: nothing is being counted. */}
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-[30%] h-2 w-2 -translate-x-1/2 rounded-full bg-brand md:h-2.5 md:w-2.5"
                  />
                </Teardrop>
              </span>
            </IslandFrame>
          </button>
        }
      />
    </section>
  );
}

/* ── the /discover map ────────────────────────────────────────────────── */

/**
 * The same island, pinned by kind of place instead of by stop.
 *
 * Team 08/09: "Người dùng bấm vào pin sẽ kéo trang xuống dưới chỗ phần list
 * địa điểm, đồng thời pin đó trên map được phóng lớn 15% hoặc đổi màu để
 * người dùng biết mình đang xem category nào." Both marks, not one — the
 * scroll takes the pin off screen, so it has to be findable again when you
 * come back up, and 15% on its own is easy to miss at this size.
 *
 * The colour it changes to is the brand violet, not the teal the list uses
 * for the same state. Teal is what the island is drawn in, so a teal pin on
 * it disappears — which is what the first build of this did. Each mark takes
 * the strongest colour available on the ground it sits on: teal on the violet
 * field beside the map, violet on the teal island.
 *
 * The names are not on the pins. They are in the list beside them, which is
 * direction 2's whole argument, and it keeps four labels off an island where
 * they would collide wherever two stops sit close together.
 */
export function CategoryMap({
  route,
  activeId,
  onSelect,
}: {
  route: TouristRoute;
  activeId: string;
  onSelect: (categoryId: string) => void;
}) {
  const points = useMemo(
    () => pointsAlongRoute(route.stops, DISCOVER_CATEGORIES.length),
    [route]
  );

  return (
    <KeLayout
      index={
        <ul className="border-t border-white/15">
          {DISCOVER_CATEGORIES.map((c) => {
            const on = c.id === activeId;
            return (
              <li key={c.id} className="border-b border-white/15">
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  aria-current={on}
                  className={`flex w-full items-center gap-3 py-3.5 text-left transition-colors ${
                    on ? "text-wave" : "text-white/65 hover:text-paper"
                  }`}
                >
                  <c.Icon aria-hidden="true" className="h-4 w-4 shrink-0 opacity-80" />
                  <span className="min-w-0 flex-1 truncate text-lg font-medium">{c.name}</span>
                  <span
                    aria-hidden="true"
                    className={`h-px shrink-0 bg-current transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      on ? "w-8" : "w-0"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      }
      island={
        <IslandFrame route={route}>
          {DISCOVER_CATEGORIES.map((c, i) => {
            const at = points[i] ?? { x: 50, y: 50 };
            const on = c.id === activeId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c.id)}
                aria-label={`Xem địa điểm ${c.name}`}
                aria-current={on}
                style={{
                  left: `${at.x}%`,
                  top: `${at.y}%`,
                  /* The scale composes with the tip offset rather than
                     replacing it, and origin-bottom keeps the tip on its
                     coordinate while the pin grows. */
                  transform: `translate(-50%, -100%) scale(${on ? 1.15 : 1})`,
                }}
                className="absolute z-10 block origin-bottom transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              >
                <Teardrop fill={on ? "var(--color-brand)" : "var(--color-paper)"}>
                  <c.Icon
                    aria-hidden="true"
                    className={`absolute left-1/2 top-[30%] h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 transition-colors duration-300 md:h-4 md:w-4 ${
                      on ? "text-paper" : "text-ink"
                    }`}
                  />
                </Teardrop>
              </button>
            );
          })}
        </IslandFrame>
      }
    />
  );
}
