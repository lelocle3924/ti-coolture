import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { ArrowRight, Camera, FerrisWheel, Landmark, ShoppingBag, Utensils } from "lucide-react";
import { islandBlobs, planFor, pointsAlongRoute } from "./homeData";
import { ArcTopRight, RibbonLoop } from "../components/BrandShapes";
import HeroWave from "../components/HeroWave";
import { useMediaQuery } from "../lib/useAutoHideChrome";
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
 * On a phone the homepage has since gone back to swiping (14/09): one name
 * under the title, the island to swipe or its arrows to press, and no list.
 * See HomeDistrictMap.
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
   move onto their stops and this list comes out of the dataset.

   The fifth kind comes from the team's place list (14/09), whose key reads
   "5: Vui Chơi-Giải Trí" — archery, climbing, karting, board games, candle
   workshops. Written the way the phrase is said, "vui chơi giải trí", and
   drawn as a ferris wheel: it is the sign for a khu vui chơi, and it cannot
   be mistaken for the shopping bag beside it the way a ticket could. */

export const DISCOVER_CATEGORIES = [
  { id: "an-uong", name: "Ăn uống", Icon: Utensils },
  { id: "tham-quan", name: "Tham quan", Icon: Landmark },
  { id: "chup-anh", name: "Chụp ảnh", Icon: Camera },
  { id: "mua-sam", name: "Mua sắm", Icon: ShoppingBag },
  { id: "vui-choi", name: "Vui chơi giải trí", Icon: FerrisWheel },
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
export function KeLayout({
  index,
  island,
  islandFirst = false,
  align = "center",
  indexOnPhone = true,
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
  /**
   * Whether the column shows on a phone at all. The homepage leaves its list
   * of maps off there (14/09): the name under the title and a swipe do its
   * job, and a list under the island only pushed the section longer.
   */
  indexOnPhone?: boolean;
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
        } ${indexOnPhone ? "" : "hidden md:block"}`}
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
export function IslandFrame({ route, children }: { route: TouristRoute; children: ReactNode }) {
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
export function Teardrop({ fill, children }: { fill: string; children?: ReactNode }) {
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
export function MapArrows({ onStep }: { onStep: (delta: number) => void }) {
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

export interface DistrictMapProps {
  routes: TouristRoute[];
  /** The island was tapped — open this region on /discover. */
  onOpenRoute: (routeId: string) => void;
  heading?: string;
}

/**
 * A stand-in for the homepage's map section, for a study that has to be seen
 * inside the real homepage rather than beside it — /lab/home-map mounts the
 * Homepage view with this set. Always null on the site.
 */
export const HomeMapOverride = createContext<ComponentType<DistrictMapProps> | null>(null);

export default function DistrictMap(props: DistrictMapProps) {
  const Override = useContext(HomeMapOverride);
  return Override ? <Override {...props} /> : <HomeDistrictMap {...props} />;
}

/** The homepage map's ground: the collections' violet, ramping into
    brand-deep under the island to meet the collaborate band. */
export const MAP_GROUND =
  "linear-gradient(to bottom, var(--color-brand) 55%, var(--color-brand-deep) 100%)";

/**
 * Which region the homepage map shows, and the two ways to change it.
 *
 * Null until someone picks, because `routes` arrives empty on the first
 * render — seeding the state from routes[0] would lock the map to whatever
 * was there before the fetch resolved. `step` wraps, as on /discover.
 */
export function useRegionPicker(routes: TouristRoute[]) {
  const [picked, setPicked] = useState<string | null>(null);
  const route = routes.find((r) => r.id === picked) ?? routes[0];
  const step = (delta: number) => {
    if (!route) return;
    const here = routes.findIndex((r) => r.id === route.id);
    const next = routes[(here + delta + routes.length) % routes.length];
    if (next) setPicked(next.id);
  };
  return { route, pick: setPicked, step };
}

/**
 * The three maps, by name. Hairlines on the violet and the row measure of
 * /discover's place list; the selected one takes the teal and the short rule,
 * which is what says this list is the control for the map beside it.
 *
 * Team 14/09: "giữ text bên trái, cho text lớn hơn 1.5 lần" — 16/18px became
 * 24/27px, and the rows and the rule grew with it so the list keeps its
 * proportions rather than just its words getting bigger.
 */
export function RegionList({
  routes,
  current,
  onPick,
}: {
  routes: TouristRoute[];
  current: string;
  onPick: (routeId: string) => void;
}) {
  return (
    <ul className="border-t border-white/15">
      {routes.map((r) => {
        const on = r.id === current;
        return (
          <li key={r.id} className="border-b border-white/15">
            <button
              type="button"
              onClick={() => onPick(r.id)}
              aria-current={on}
              className={`flex w-full items-center gap-4 py-4 text-left transition-colors md:py-5 ${
                on ? "text-wave" : "text-white/65 hover:text-paper"
              }`}
            >
              <span className="min-w-0 flex-1 truncate text-2xl font-medium leading-snug md:text-[1.6875rem]">
                {planFor(r.id).region}
              </span>
              <span
                aria-hidden="true"
                className={`h-px shrink-0 bg-current transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  on ? "w-12" : "w-0"
                }`}
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The island, with its one pin, as a single button to /discover.
 *
 * A real button: the island carries one decorative pin and no controls — the
 * arrows are its siblings, not its children — so the whole map can be the
 * control it behaves like.
 */
export function HomeIsland({
  route,
  onOpenRoute,
}: {
  route: TouristRoute;
  onOpenRoute: (routeId: string) => void;
}) {
  /* One pin, in the middle of the walk. Team 08/09: "trên đó chỉ có 1 pin đại
     diện, không đánh số gì hết" — it stands for the region, so it belongs
     where the region is rather than on any one stop. */
  const centre = useMemo(() => pointsAlongRoute(route.stops, 1)[0], [route]);
  const plan = planFor(route.id);

  return (
    <button
      type="button"
      onClick={() => onOpenRoute(route.id)}
      aria-label={`Xem ${plan.region} trên trang Khám phá`}
      className="group block w-full cursor-pointer"
    >
      <IslandFrame route={route}>
        {/* Keyed on the region so the bob restarts where the island changes —
            otherwise the pin appears to stay put while the ground under it
            swaps. */}
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
  );
}

/* The arc and the wave, as /lab/home-map placed them (13/09), and how the
   phone steps region. */

/** At most the /discover copy's 28rem, never under 7.5rem — see arcWidth. */
const ARC_MAX_REM = 28;
const ARC_MIN_REM = 7.5;
/** The arc's flat top end sits 3.52 units down its 555-wide box, so the box is
    lifted by that much of its width to put the cut, not the box, on the edge. */
const ARC_CUT = 3.52 / 555;
/** The wave's box, as a share of the island's height — about the share of the
    hero the hero's own box takes. */
const WAVE_BOX = 0.36;
/** HeroWave rests both ends at y 64 of its 120-tall box… */
const WAVE_REST = 64 / 120;
/** …and the sea moves the middle of the curve up to 28 of those units. */
const WAVE_SWING = 28 / 120;
/** How far a finger has to travel across the island, sideways, to step. */
const SWIPE_PX = 40;

interface MapGeometry {
  /** The drawn land's lowest edge, from the section's top edge. */
  landBottom: number;
  /** The island's 4:3 box: its height, and its bottom from the section's top. */
  islandHeight: number;
  islandBottom: number;
  /** From the lower edge of the collections down to this section's top. */
  rise: number;
  /**
   * The arc's width in px: as wide as the room between the page's right edge
   * and the end of the title (or, on a phone, the region's name), less a
   * 16px breath, within ARC_MIN_REM and ARC_MAX_REM. At a fixed width the
   * ring ran through the centred words on a phone.
   */
  arcWidth: number;
}

/** Measures what the arc and the wave are placed from, and keeps it current. */
function useMapGeometry(sectionRef: { current: HTMLElement | null }, key: string) {
  const [geo, setGeo] = useState<MapGeometry | null>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const svg = section.querySelector<SVGSVGElement>('svg[viewBox="0 0 800 600"]');
      const land = svg?.querySelector<SVGGElement>("g[fill]");
      if (!svg || !land) return;
      const top = section.getBoundingClientRect().top;
      const box = svg.getBoundingClientRect();
      const drawn = land.getBBox();
      const scale = box.height / 600;
      // the collections: the heading, the panels, the "see more" line — the panels are second
      const panels = document.querySelector("#dong-collections > :nth-child(2)");
      // how far right the words reach — their glyphs, not their block boxes
      const reach = Array.from(section.querySelectorAll("h2, h2 + p")).reduce((edge, el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return Math.max(edge, range.getBoundingClientRect().right);
      }, 0);
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const room = document.documentElement.clientWidth - reach - 16;
      setGeo({
        landBottom: box.top - top + (drawn.y + drawn.height) * scale,
        islandHeight: box.height,
        islandBottom: box.bottom - top,
        rise: panels ? top - panels.getBoundingClientRect().bottom : 0,
        arcWidth: Math.min(ARC_MAX_REM * rem, Math.max(ARC_MIN_REM * rem, room)),
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    const observer = new ResizeObserver(schedule);
    observer.observe(section);
    const collections = document.getElementById("dong-collections");
    if (collections) observer.observe(collections);
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [sectionRef, key]);

  return geo;
}

/**
 * A sideways swipe across the island steps region — on a touch screen, where
 * there is no list beside it any more. The tap that ends a swipe is not also
 * a tap on the island, which would leave for /discover.
 */
function useSwipeStep(step: (delta: number) => void) {
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const swiped = useRef(false);

  return {
    onPointerDown: (e: { pointerType: string; pointerId: number; clientX: number; clientY: number }) => {
      if (e.pointerType === "mouse") return;
      start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
      swiped.current = false;
    },
    onPointerUp: (e: { pointerId: number; clientX: number; clientY: number }) => {
      const from = start.current;
      start.current = null;
      if (!from || from.id !== e.pointerId) return;
      const dx = e.clientX - from.x;
      const dy = e.clientY - from.y;
      // sideways, and plainly more sideways than down
      if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      swiped.current = true;
      step(dx < 0 ? 1 : -1);
    },
    onPointerCancel: () => {
      start.current = null;
    },
    onClickCapture: (e: { preventDefault: () => void; stopPropagation: () => void }) => {
      if (!swiped.current) return;
      swiped.current = false;
      e.preventDefault();
      e.stopPropagation();
    },
  };
}

/**
 * /discover's layout, with the three maps in the column instead of the places.
 *
 * Team 13/09, read end to end:
 *
 *   · "Cho title Khám phá thành phố lên trên, căn giữa" — the heading left
 *     the column and is centred over the whole section, with the region's
 *     name under it, reading off the selection the way /discover's does.
 *   · "Mang y nguyên layout của trang /discover… Chỉ khác nhau ở chỗ là: phần
 *     bên trái ở homepage hiện 3 cái bản đồ" — the same KeLayout, the same
 *     island pulled up into its own empty top, the same arrows on its edges,
 *     the same map-first order on a phone. The column is the list of the
 *     three maps by name, and only by name.
 *   · "Empty space từ cuối phần collections đến title và map… quá nhiều" —
 *     the 10vh ramp above the section is gone and the title opens it.
 *
 * Team 14/09, choosing from /lab/home-map, where the options had been tried
 * inside the real homepage:
 *
 *   · On a desktop — "chọn sóng trắng, mép dưới, làm sóng mờ đi 30%, arc bên
 *     phải mờ đi 30%, giữ text bên trái, cho text lớn hơn 1.5 lần, bỏ tên map
 *     dưới title, thu nhỏ kích cỡ map khoảng 5% để nó không bị out ra khỏi
 *     viền trang". The hero's wave runs white along the land's lowest edge at
 *     30%. The arc's flat end joins the collections' lower edge at the right,
 *     at the same 30% ("Mờ 30%" in the study). The list of maps stays on the
 *     left at one and a half times the size, and the title stands alone. The
 *     island is 95% of its column and brought in off the page's edge: land
 *     reaches past its own box by up to 10.1% of the box's width (Thủ Đức,
 *     measured: −76 to 881 of 800), so at 95% it needs 9.6% of the column
 *     plus a 1rem breath to end inside the page. That pulls its box 4.6% and
 *     1rem into the list's column, below the list.
 *   · On a phone — "bỏ text 3 tên map, người dùng thấy 1 dòng tên map ngay
 *     dưới title, vuốt trái phải hoặc bấm mũi tên để xem. Sóng dưới map, mờ
 *     30%". No list; the one line under the title names the map; a sideways
 *     swipe across the island steps region the way the arrows do, and the
 *     new island comes in from the side it was sent from.
 *
 * The ground still has to arrive at brand-deep, because the collaborate band
 * below is brand-deep and 20/08 asked that no two grounds meet on a hard
 * edge. So the ramp happens inside this section, under the island, where it
 * costs no height.
 */
export function HomeDistrictMap({
  routes,
  onOpenRoute,
  heading = "Khám phá thành phố",
}: DistrictMapProps) {
  const wide = useMediaQuery("(min-width: 768px)");
  const { route, pick, step } = useRegionPicker(routes);
  const sectionRef = useRef<HTMLElement>(null);
  const geo = useMapGeometry(sectionRef, `${route?.id}:${wide}`);
  /** Which way the last step went, so the next island arrives from that side. */
  const [travel, setTravel] = useState(0);
  const go = (delta: number) => {
    setTravel(delta);
    step(delta);
  };
  const swipe = useSwipeStep(go);

  if (!route) return null;
  const plan = planFor(route.id);

  /* The wave's resting line lies along the land's lowest edge; its box is
     placed so that line lands there. Half the band, and the sea's swing, then
     hang below the land, so the section grows by whatever of that the
     island's own foot and the section's padding do not already cover. */
  const basePad = wide ? 64 : 48;
  const boxHeight = geo ? geo.islandHeight * WAVE_BOX : 0;
  const boxTop = geo ? geo.landBottom - WAVE_REST * boxHeight : 0;
  const viewportHeight = typeof window === "undefined" ? 800 : window.innerHeight;
  const bandHalf = ((wide ? 0.17 : 0.05) * viewportHeight) / 2;
  const below = geo ? geo.islandBottom - geo.landBottom : 0;
  const extraPad = geo ? Math.max(0, bandHalf + WAVE_SWING * boxHeight + 12 - (below + basePad)) : 0;

  return (
    <section
      ref={sectionRef}
      id="dong-map"
      data-surface="dark"
      /* The arc rises out of this section's top, so only the sides clip. */
      className="relative overflow-x-clip pt-12 text-paper md:pt-16"
      style={{ background: MAP_GROUND, paddingBottom: basePad + extraPad }}
    >
      {geo && (
        <ArcTopRight
          className="pointer-events-none absolute right-0 z-[1] opacity-30"
          fill="var(--color-wave)"
          style={{ width: geo.arcWidth, top: -geo.rise - geo.arcWidth * ARC_CUT }}
        />
      )}

      {geo && (
        <HeroWave
          className="z-[2] opacity-30"
          stroke="var(--color-paper)"
          boxTop={`${boxTop}px`}
          boxHeight={`${boxHeight}px`}
        />
      )}

      <div className="relative z-20 mx-auto max-w-4xl px-5 text-center md:px-8">
        {/* The homepage's own heading scale rather than /discover's h1, so
            this title sits in the same step as "What's in store" and "Chưa
            biết mua gì?" above it. leading-[1.25] for the stacked marks on
            PHỐ — see index.css on how far Vietnamese uppercase reaches. */}
        <h2 className="display text-[clamp(2rem,5.6vw,4.5rem)] normal-case leading-[1.25] text-paper">
          {heading}
        </h2>
        {/* The phone's one line naming the map; a desktop names it in the list. */}
        <p key={route.id} className="lab-plate-in mt-3 text-lg tracking-[0.12em] text-wave md:hidden">
          {plan.region}
        </p>
      </div>

      <div className="relative z-10 mt-2 md:mt-4">
        <KeLayout
          islandFirst
          align="start"
          indexOnPhone={false}
          index={
            <RegionList
              routes={routes}
              current={route.id}
              onPick={(id) => {
                setTravel(0);
                pick(id);
              }}
            />
          }
          island={
            /* Pulled up by its own empty top, as on /discover — see the note
               on CategoryMap for the 10.9%, which on a desktop is 95% of
               itself here because the island is. touch-pan-y keeps a vertical
               swipe for the page and gives a sideways one to the map. */
            <div
              className="relative -mt-[10.9%] touch-pan-y md:-ml-[calc(4.6%+1rem)] md:-mt-[10.35%] md:w-[95%]"
              onPointerDown={swipe.onPointerDown}
              onPointerUp={swipe.onPointerUp}
              onPointerCancel={swipe.onPointerCancel}
              onClickCapture={swipe.onClickCapture}
            >
              <MapArrows onStep={go} />
              <div
                key={route.id}
                className={travel > 0 ? "ti-island-from-right" : travel < 0 ? "ti-island-from-left" : ""}
              >
                <HomeIsland route={route} onOpenRoute={onOpenRoute} />
              </div>
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
