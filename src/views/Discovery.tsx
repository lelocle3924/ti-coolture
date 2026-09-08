import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { fetchTouristRoutes } from "../lib/dbService";
import { TouristRoute } from "../types";
import { Compass, ArrowUpRight, MapPin } from "lucide-react";
import { ArcTopRight, RibbonLoop, WaveBlog } from "../components/BrandShapes";
import Breadcrumbs from "../components/Breadcrumbs";
import { CategoryMap, DISCOVER_CATEGORIES } from "../home/DistrictMap";
import { planFor } from "../home/homeData";

/**
 * Khám phá — /discover and /discover/:routeId
 *
 * Two grounds with one seam between them, which is the shape 07/09 settled
 * on and nothing here disturbs:
 *
 *     violet — the title, the region, and the map
 *     ~ wave ~
 *     paper — the places
 *
 * What changed on 08/09 is what the page is *about*. It used to be an
 * itinerary: a named route, its length in stops and hours, and a numbered
 * walking order to follow. The team took all of that off —
 *
 *     "Trên header, chỗ ghi tên lộ trình ('Vòng chợ lớn'), giờ căn giữa và
 *      chỉ ghi 'Khám phá thành phố'. Xoá dòng '4 điểm, nửa ngày', 'chọn quận
 *      khác', 'Quận 5 · chợ lớn · 4 điểm · 1.8km', 'Mở lộ trình Quận 5 · chợ
 *      lớn'. Thay bằng 1 dòng duy nhất ghi tên vùng mà bản đồ đó thể hiện."
 *
 * — and replaced the per-stop pins with one pin per kind of place. So the
 * page is a place-finder now: it says which part of the city you are looking
 * at, and the map asks what kind of thing you want to do there. The list
 * under the wave answers that question rather than the old one, which is why
 * "Đi theo thứ tự này" has become the name of the kind you picked.
 *
 * The route is still the unit underneath, because that is what the dataset
 * has: /discover/:routeId picks the region, and the homepage map is where a
 * region is chosen. Removing "chọn quận khác" removed the in-page switch on
 * purpose.
 */

/** How long a stop stays marked after you arrive on it from a link. */
const FLASH_MS = 2200;

function StopRow({
  stop,
  index,
  flashed,
}: {
  key?: string;
  stop: TouristRoute["stops"][number];
  index: number;
  /** Arrived here from a link — hold a mark on it long enough to be found. */
  flashed: boolean;
}) {
  const mapHref = stop.address?.startsWith("http")
    ? stop.address
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.address ?? "")}`;

  return (
    <li
      id={`stop-${stop.id}`}
      /* A row, not a card: the rule above it is the only edge it has, and the
         warm paper on hover is the only fill. The arrival mark is a teal rule
         down the leading edge rather than the ring-4 offset it used to be —
         a ring needs a card to go around, and there is no card any more. */
      className="group relative scroll-mt-28 border-t border-ink/12 transition-colors duration-500 hover:bg-paper-warm"
      style={flashed ? { backgroundColor: "color-mix(in srgb, var(--color-wave) 14%, transparent)" } : undefined}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[3px] bg-wave transition-opacity duration-700"
        style={{ opacity: flashed ? 1 : 0 }}
      />

      <div className="flex gap-5 py-7 pl-4 pr-1 md:gap-8 md:py-9 md:pl-6">
        {/* The index in the display face, the way the homepage sets its step
            numbers. It is the only large mark in the row, so the eye counts
            down the column without needing a rail drawn for it. */}
        <span
          aria-hidden="true"
          className="display shrink-0 pt-0.5 text-[clamp(1.6rem,3.4vw,2.4rem)] leading-none text-brand/45 transition-colors duration-500 group-hover:text-brand"
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="text-[clamp(1.05rem,2vw,1.4rem)] font-semibold leading-snug text-ink">
            {stop.name}
          </h3>

          {stop.description && (
            <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-ink/70 md:text-[15px]">
              {stop.description}
            </p>
          )}

          {stop.address && (
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink/55">
              <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-brand" />
              <span className="min-w-0">{stop.address}</span>
              <a
                href={mapHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 border-b border-brand/40 pb-px font-semibold text-brand transition-colors hover:border-brand"
              >
                Mở bản đồ
                <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
              </a>
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

export default function Discovery() {
  const { routeId } = useParams();
  const [searchParams] = useSearchParams();
  const startStopId = searchParams.get("start");

  const [routes, setRoutes] = useState<TouristRoute[]>([]);
  const [loading, setLoading] = useState(true);
  /** Which stop is currently marked, if any. */
  const [flash, setFlash] = useState<string | null>(null);
  /** Which kind of place is being shown — null until someone picks one. */
  const [picked, setPicked] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTouristRoutes()
      .then((data) => {
        setRoutes(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const route = routeId ? routes.find((r) => r.id === routeId) : routes[0];

  /* Scroll to a stop and mark it. State rather than classList surgery, which
     is what this was: the old version added and removed ring utilities on the
     node by hand, and the removal fired on a bare setTimeout that survived
     unmount. */
  const revealStop = useCallback((stopId: string) => {
    const el = document.getElementById(`stop-${stopId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlash(stopId);
  }, []);

  /* A pin does two things at once (08/09): it brings the list it names into
     view, and it marks itself so the answer to "which one am I looking at"
     survives the scroll that hides it. */
  const selectCategory = useCallback((categoryId: string) => {
    setPicked(categoryId);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), FLASH_MS);
    return () => clearTimeout(timer);
  }, [flash]);

  /* A new region starts on its own first filled kind rather than carrying the
     last one over — declared before the ?start= effect so that one wins. */
  useEffect(() => {
    setPicked(null);
  }, [route?.id]);

  useEffect(() => {
    if (loading || !route || !startStopId) return;
    const stop = route.stops.find((s) => s.id === startStopId);
    // the row only exists while its own kind is showing, so open that first
    if (stop) setPicked(stop.category);
    // one beat for the list to paint before we scroll to a row inside it
    const timer = setTimeout(() => revealStop(startStopId), 300);
    return () => clearTimeout(timer);
  }, [loading, route, startStopId, revealStop]);

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-paper text-ink">
        <Compass className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!route) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center bg-paper text-ink">
        <p>Không tìm thấy lộ trình.</p>
        <Link to="/" className="mt-4 font-semibold text-brand hover:underline">
          Về trang chủ
        </Link>
      </div>
    );
  }

  const plan = planFor(route.id);
  /* Open on a kind this region actually has, so the page never lands on an
     empty list — the taxonomy is a placeholder and does not cover every
     region evenly. */
  const firstFilled =
    DISCOVER_CATEGORIES.find((c) => route.stops.some((s) => s.category === c.id))?.id ??
    DISCOVER_CATEGORIES[0].id;
  const activeId = picked ?? firstFilled;
  const category = DISCOVER_CATEGORIES.find((c) => c.id === activeId) ?? DISCOVER_CATEGORIES[0];
  const shown = route.stops.filter((s) => s.category === activeId);

  return (
    /* The same move /products and /stores make: the negative margin cancels
       the shell's pt-24 pill clearance on the element that clips, so the
       violet runs to y=0 and the header does not sit on a strip of the
       shell's ink. */
    <div className="relative w-full overflow-x-hidden bg-paper text-ink md:-mt-28 -mt-24">
      {/* ═══ violet: where you are, and what you can do there ═════════════ */}
      <section data-surface="dark" className="relative z-10 overflow-hidden bg-brand text-paper">
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

        {/* pt is deeper than the other pages': the title is centred now, so
            it runs under the middle of the floating nav pill rather than
            clearing it to the left the way a left-aligned h1 did. */}
        <div className="relative z-10 mx-auto max-w-4xl px-5 pt-28 text-center md:px-8 md:pt-32">
          {/* leading-[1.25] rather than .display's 1.02 — see index.css on how
              far Vietnamese uppercase reaches in DFVN. */}
          <h1 className="display text-4xl font-medium normal-case leading-[1.25] text-paper md:text-6xl">
            Khám phá thành phố
          </h1>

          {/* The one line the four removed ones were replaced by: which part
              of the city the map underneath is drawing. */}
          <p className="mt-4 text-base tracking-[0.12em] text-wave md:text-lg">{plan.region}</p>
        </div>

        {/* The map, at 65% of the page on a desktop and 75% on a phone, with
            no column padding to take that width back. */}
        <div className="relative z-10 mt-9 md:mt-12">
          <CategoryMap route={route} activeId={activeId} onSelect={selectCategory} />
        </div>

        <div className="relative z-10 mt-10 -mb-px h-[clamp(2.5rem,5vw,4.5rem)] overflow-hidden md:mt-14">
          <WaveBlog className="absolute inset-x-0 bottom-0" fill="var(--color-paper)" />
        </div>
      </section>

      {/* ═══ paper: the places ════════════════════════════════════════════ */}
      <div data-surface="light" className="relative z-10 pb-16 md:pb-24">
        <div className="mx-auto max-w-4xl px-5 md:px-8">
          <Breadcrumbs
            className="mt-2"
            trail={[
              { label: "Trang chủ", to: "/" },
              { label: "Khám phá", to: "/discover" },
              { label: plan.region },
            ]}
          />

          {/* scroll-mt clears the floating nav pill, so a pin lands the
              heading under it rather than behind it. */}
          <div ref={listRef} className="scroll-mt-24 md:scroll-mt-28">
            <div className="mt-10 flex items-baseline justify-between gap-4 md:mt-14">
              <h2 className="display text-[clamp(1.5rem,3.4vw,2.4rem)] normal-case leading-[1.15] text-ink">
                Địa điểm {category.name}
              </h2>
              <span className="label shrink-0 text-ink/45">
                {String(shown.length).padStart(2, "0")} điểm
              </span>
            </div>

            {shown.length === 0 ? (
              <p className="mt-8 border-t border-ink/12 py-10 text-sm leading-relaxed text-ink/55">
                Chưa có điểm {category.name.toLowerCase()} nào ở {plan.region}. Chọn một nhóm
                khác trên bản đồ.
              </p>
            ) : (
              /* The rules do the work. The last row closes the list, so the
                 block reads as one table of places rather than four objects. */
              <ul className="mt-6 border-b border-ink/12">
                {shown.map((stop, i) => (
                  <StopRow key={stop.id} stop={stop} index={i} flashed={flash === stop.id} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
