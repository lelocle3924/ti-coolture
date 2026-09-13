import { useMemo, useState, type ReactNode } from "react";
import { ArrowRight, Camera, Landmark, ShoppingBag, Utensils } from "lucide-react";
import { islandBlobs, planFor, pointsAlongRoute } from "./homeData";
import { ArcTopRight, RibbonLoop } from "../components/BrandShapes";
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
function KeLayout({
  index,
  island,
  islandFirst = false,
  align = "center",
}: {
  index: ReactNode;
  island: ReactNode;
  /**
   * Phone only: put the map above the column beside it.
   *
   * Team 09/09 for /discover — "Trên mobile, để map nằm trên và list địa điểm
   * nằm dưới." The homepage used to keep the other order, because its column
   * opened with the section's heading and a map above it would have been a
   * section with no name. Since 13/09 the heading sits centred over the whole
   * section, as on /discover, so both maps come first.
   *
   * order-* on a phone and order-none at md, so the grid places by DOM order
   * on a desktop and the index stays in the first column.
   */
  islandFirst?: boolean;
  /**
   * Where the column sits against the island.
   *
   * "start" is /discover (09/09) — "mép trên list địa điểm để ngang với mép
   * trên bản đồ" — and, since 13/09, the homepage, which took that layout
   * whole. "center" is what the homepage did before: a three-line list on
   * the middle of a tall map, which is what left its title floating halfway
   * down an empty field.
   */
  align?: "center" | "start";
}) {
  return (
    <div
      className={`flex flex-col md:grid md:grid-cols-[minmax(0,35fr)_minmax(0,65fr)] ${
        align === "start" ? "md:items-start" : "md:items-center"
      }`}
    >
      <div
        className={`px-5 md:order-none md:px-10 ${
          islandFirst ? "order-2 mt-8 md:mt-0" : "order-1"
        }`}
      >
        {index}
      </div>
      <div
        className={`mx-auto w-[75%] md:order-none md:mx-0 md:w-full ${
          islandFirst ? "order-1" : "order-2 mt-8 md:mt-0"
        }`}
      >
        {island}
      </div>
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

/* ── the arrows on the map's edges ─────────────────────────────────────── */

/**
 * Previous and next region, on the island's own edges.
 *
 * /discover's 09/09 note put them there ("Thêm 2 nút mũi tên 2 bên cái map để
 * đổi giữa các quận"), and 13/09 carries that layout onto the homepage whole,
 * so both maps draw the same pair from here rather than two copies.
 *
 * They belong to the map, not to a control strip under it. The map runs out
 * to the page edge on its right, so the forward arrow comes inside; the back
 * one has violet to its left and can sit off the island.
 */
function MapArrows({ onStep }: { onStep: (delta: number) => void }) {
  return (
    <>
      {[-1, 1].map((delta) => (
        <button
          key={delta}
          type="button"
          onClick={() => onStep(delta)}
          aria-label={delta < 0 ? "Vùng trước" : "Vùng sau"}
          className={`absolute top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-paper transition-colors hover:text-wave md:h-14 md:w-14 ${
            delta < 0 ? "left-0 md:-left-3" : "right-1 md:right-4"
          }`}
        >
          <ArrowRight
            aria-hidden="true"
            className={`h-7 w-7 drop-shadow-[0_2px_6px_rgba(18,8,31,0.45)] md:h-9 md:w-9 ${
              delta < 0 ? "rotate-180" : ""
            }`}
            strokeWidth={2.5}
          />
        </button>
      ))}
    </>
  );
}

/**
 * The marks /discover composes its field with, at the same size, place and
 * weight: the arc off the top-right corner, the ribbon loop off the bottom-left.
 * 13/09: "Nền của map ở homepage bị trống… Đem cái element trang trí giống
 * bên trang /discover sang." They came off the homepage again later the same
 * day (see HomeDistrictMap), so /discover is their one user; kept here beside
 * the map they were drawn for.
 */
export function DiscoverMarks() {
  return (
    <>
      <ArcTopRight
        className="pointer-events-none absolute -right-20 -top-24 z-0 opacity-[0.3]"
        style={{ width: "clamp(16rem, 34vw, 28rem)" }}
        fill="var(--color-wave)"
      />
      <RibbonLoop
        className="pointer-events-none absolute -left-28 bottom-0 z-0 opacity-[0.3] -scale-x-100"
        style={{ width: "clamp(16rem, 30vw, 24rem)" }}
        ribbon="var(--color-wave)"
        dot="var(--color-paper)"
      />
    </>
  );
}

/* ── the homepage map ─────────────────────────────────────────────────── */

/**
 * /discover's layout, with the three maps in the column instead of the places.
 *
 * Team 13/09, read end to end:
 *
 *   · "Nền của map ở homepage bị trống" — the field carried /discover's two
 *     marks for one round. 13/09 took them off again: "bỏ giúp tôi 2 cái
 *     element là brand loop với cái arc top right ở homepage đi, nhìn lạc
 *     lõng quá".
 *   · "Cho title Khám phá thành phố lên trên, căn giữa" — the heading left
 *     the column and is centred over the whole section, with the region's
 *     name under it, reading off the selection the way /discover's does.
 *   · "Mang y nguyên layout của trang /discover… Chỉ khác nhau ở chỗ là: phần
 *     bên trái ở homepage hiện 3 cái bản đồ" — the same KeLayout, the same
 *     island pulled up into its own empty top, the same arrows on its edges,
 *     the same map-first order on a phone. The column is the list of the
 *     three maps by name, and only by name (asked 13/09): the 01/02/03 that
 *     used to number them came off with the rest of the old row.
 *   · "Empty space từ cuối phần collections đến title và map… quá nhiều" —
 *     most of it was the 10vh ramp into brand-deep above the section plus a
 *     title centred halfway down a tall map. The ramp is gone and the section
 *     opens on the collections' own violet with the title at its top.
 *
 * The ground still has to arrive at brand-deep, because the collaborate band
 * below is brand-deep and 20/08 asked that no two grounds meet on a hard
 * edge. So the ramp happens inside this section, under the island, where it
 * costs no height.
 */
export default function DistrictMap({
  routes,
  onOpenRoute,
  heading = "Khám phá thành phố",
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

  /* Wraps, as on /discover. */
  const step = (delta: number) => {
    const here = routes.findIndex((r) => r.id === route.id);
    const next = routes[(here + delta + routes.length) % routes.length];
    if (next) setPicked(next.id);
  };

  return (
    <section
      id="dong-map"
      data-surface="dark"
      className="relative overflow-hidden pb-12 pt-12 text-paper md:pb-16 md:pt-16"
      style={{
        background:
          "linear-gradient(to bottom, var(--color-brand) 55%, var(--color-brand-deep) 100%)",
      }}
    >
      <div className="relative z-20 mx-auto max-w-4xl px-5 text-center md:px-8">
        {/* The homepage's own heading scale rather than /discover's h1, so
            this title sits in the same step as "What's in store" and "Chưa
            biết mua gì?" above it. leading-[1.25] for the stacked marks on
            PHỐ — see index.css on how far Vietnamese uppercase reaches. */}
        <h2 className="display text-[clamp(2rem,5.6vw,4.5rem)] normal-case leading-[1.25] text-paper">
          {heading}
        </h2>
        <p key={route.id} className="lab-plate-in mt-3 text-base tracking-[0.12em] text-wave md:text-lg">
          {plan.region}
        </p>
      </div>

      <div className="relative z-10 mt-2 md:mt-4">
        <KeLayout
          islandFirst
          align="start"
          index={
            /* The three maps, by name. Hairlines on the violet and the row
               measure of /discover's place list; the selected one takes the
               teal and the short rule, which is what says this list is the
               control for the map beside it. */
            <ul className="border-t border-white/15">
              {routes.map((r) => {
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
                      <span className="min-w-0 flex-1 truncate text-base font-medium leading-snug md:text-lg">
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
          }
          island={
            /* Pulled up by its own empty top, exactly as on /discover — see
               the note on CategoryMap for the 10.9%. */
            <div className="relative -mt-[10.9%]">
              <MapArrows onStep={step} />

              {/* A real button. The island carries one decorative pin and no
                  controls — the arrows are its siblings, not its children —
                  so the whole map can be the control it behaves like. */}
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
            </div>
          }
        />
      </div>
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
 * The names are not on the pins, and as of 09/09 they are not written out at
 * all: "List 4 loại địa điểm thì không cần ghi vì người dùng có thể nhìn icon
 * trên map và hiểu." So the column beside the island belongs to the caller —
 * on /discover it holds the places of whichever kind is picked, which is what
 * used to sit on a white ground below the fold.
 *
 * The arrows are the other half of that note. The region list went with
 * "chọn quận khác" on 08/09 and left /discover with no way to change region
 * at all; two chevrons on the map's own edges give it back without putting a
 * second list on the page.
 */
export function CategoryMap({
  route,
  activeId,
  onSelect,
  onStep,
  aside,
}: {
  route: TouristRoute;
  activeId: string;
  onSelect: (categoryId: string) => void;
  /** Move to the previous (-1) or next (+1) region. Wraps. */
  onStep: (delta: number) => void;
  /** What sits beside the map — the places of the picked kind. */
  aside: ReactNode;
}) {
  const points = useMemo(
    () => pointsAlongRoute(route.stops, DISCOVER_CATEGORIES.length),
    [route]
  );

  return (
    <KeLayout
      islandFirst
      align="start"
      index={aside}
      island={
        /* The island is pulled up by the height of its own empty top.
           islandBlobs never reaches the top of the 4:3 box — the highest stop
           on any of the three regions sits about an eighth of the way down —
           so the box carries a band of nothing above the artwork. Pulling the
           island rather than the whole block is what lets the column beside
           it top-align to the *picture* (09/09: "mép trên list địa điểm để
           ngang với mép trên bản đồ") instead of to the box.

           10.9% of this column, measured: the column is 65% of the page on a
           desktop and 75% on a phone, the box is three quarters of that, and
           the empty band is about an eighth of the box. It is a percentage so
           it holds at every width; it is off by up to ~28px on the two
           regions whose highest stop sits a little lower, which is the price
           of one number for three hand-placed maps. */
        <div className="relative -mt-[10.9%]">
          <MapArrows onStep={onStep} />

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
        </div>
      }
    />
  );
}
