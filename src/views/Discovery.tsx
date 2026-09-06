import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { fetchTouristRoutes } from "../lib/dbService";
import { TouristRoute } from "../types";
import { Compass, ArrowUpRight, MapPin } from "lucide-react";
import { ArcTopRight, RibbonLoop, WaveBlog } from "../components/BrandShapes";
import Breadcrumbs from "../components/Breadcrumbs";
import DistrictMap from "../home/DistrictMap";

/**
 * Khám phá — /discover and /discover/:routeId
 *
 * Team 07/09: "Trang /discover cần overhaul lại visual. Dù vẫn giữ cái map từ
 * bên homepage đem sang, nhưng vẫn phải hài hoà hơn."
 *
 * The map stays. What was making the page unharmonious was not the map itself
 * but everything around it — the page ran five grounds top to bottom with a
 * hard cut at every join:
 *
 *     violet hero → a 60px sliver of white → a deep-violet slab for the map
 *     → white for the stops → the footer's ink
 *
 * A white band that thin between two violet fields does not read as a ground,
 * it reads as a seam that went wrong; and the map arriving as its own darker
 * slab, hard-edged on both sides, cut the page in half exactly where the
 * itinerary was meant to begin. The site's own rule is the opposite of this —
 * "NEVER allow abrupt transitions, always aim for CONTINUITY" (20/08).
 *
 * So the page is two grounds now, with one seam between them, and the seam is
 * the brand wave this page was already using:
 *
 *     violet — the route's name, its description, and the map
 *     ~ wave ~
 *     paper — the trail, and the stops
 *
 * The map moved *into* the hero rather than after it, which is also where it
 * belongs by function: it is the chooser. You pick a district on it, and the
 * itinerary below is the answer. Having it sit between the breadcrumb and the
 * stops put the chooser in the middle of the thing it chooses.
 *
 * The stops were rebuilt in the language the rest of the site is written in —
 * hairline rules and a full-width row, no floating cards. They had been four
 * bordered chips adrift in a half-empty column, each with its own shadow on
 * hover, which is the one thing the direction says the site does not do
 * ("Nothing sits in a card; hairlines and full-bleed colour fields carry the
 * structure instead").
 */

/** How long a stop stays marked after you arrive on it from a pin. */
const FLASH_MS = 2200;

function StopRow({
  stop,
  index,
  flashed,
}: {
  key?: string;
  stop: TouristRoute["stops"][number];
  index: number;
  /** Arrived here from a pin — hold a mark on it long enough to be found. */
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
  const navigate = useNavigate();
  const { routeId } = useParams();
  const [searchParams] = useSearchParams();
  const startStopId = searchParams.get("start");

  const [routes, setRoutes] = useState<TouristRoute[]>([]);
  const [loading, setLoading] = useState(true);
  /** Which stop is currently marked, if any. */
  const [flash, setFlash] = useState<string | null>(null);

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

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), FLASH_MS);
    return () => clearTimeout(timer);
  }, [flash]);

  useEffect(() => {
    if (loading || !route || !startStopId) return;
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

  return (
    /* The same move /products and /stores make: the negative margin cancels
       the shell's pt-24 pill clearance on the element that clips, so the
       violet runs to y=0 and the header does not sit on a strip of the
       shell's ink. */
    <div className="relative w-full overflow-x-hidden bg-paper text-ink md:-mt-28 -mt-24">
      {/* ═══ violet: where you are, and where you can go ═══════════════════
          One field from the top of the page through the map and into the
          wave. The map is inside this section on purpose — it is the chooser,
          and the itinerary under the wave is what it chooses. */}
      <section data-surface="dark" className="relative z-10 overflow-hidden bg-brand text-paper">
        <ArcTopRight
          className="pointer-events-none absolute -right-20 -top-24 z-0 opacity-15"
          style={{ width: "clamp(16rem, 34vw, 28rem)" }}
          fill="var(--color-wave)"
        />
        <RibbonLoop
          className="pointer-events-none absolute -left-28 bottom-0 z-0 opacity-[0.12]"
          style={{ width: "clamp(16rem, 30vw, 24rem)" }}
          ribbon="var(--color-paper)"
          dot="var(--color-wave)"
        />

        <div className="relative z-10 mx-auto max-w-4xl px-5 pb-2 pt-24 md:px-8 md:pt-28">
          {/* leading-[1.25] rather than .display's 1.02 — see index.css on how
              far Vietnamese uppercase reaches in DFVN. */}
          <h1 className="display text-4xl font-medium normal-case leading-[1.25] text-paper md:text-6xl">
            {route.name}
          </h1>

          <p className="mt-3 max-w-[54ch] text-base leading-relaxed text-white/80 md:text-lg">
            {route.description ||
              "Khám phá những xưởng thủ công và địa điểm văn hoá đặc sắc trên tuyến đường này."}
          </p>
        </div>

        {/* The same district map the homepage carries (26/08), in its inline
            variant so it brings no ground of its own. Here a pin does not
            navigate — the stop it names is already on this page, so it scrolls
            to it and marks it, the way arriving with ?start= does. */}
        <div className="relative z-10">
          <DistrictMap
            routes={routes}
            heading="Chọn quận khác"
            variant="inline"
            onOpenRoute={(id) => navigate(`/discover/${id}`)}
            onPin={(id, stopId) => {
              if (id !== route.id) {
                navigate(`/discover/${id}?start=${stopId}`);
                return;
              }
              revealStop(stopId);
            }}
          />
        </div>

        <div className="relative z-10 -mb-px h-[clamp(2.5rem,5vw,4.5rem)] overflow-hidden">
          <WaveBlog className="absolute inset-x-0 bottom-0" fill="var(--color-paper)" />
        </div>
      </section>

      {/* ═══ paper: the itinerary ═════════════════════════════════════════ */}
      <div data-surface="light" className="relative z-10 pb-16 md:pb-24">
        <div className="mx-auto max-w-4xl px-5 md:px-8">
          <Breadcrumbs
            className="mt-2"
            trail={[
              { label: "Trang chủ", to: "/" },
              { label: "Khám phá", to: "/discover" },
              { label: route.name },
            ]}
          />

          <div className="mt-10 flex items-baseline justify-between gap-4 md:mt-14">
            <h2 className="display text-[clamp(1.5rem,3.4vw,2.4rem)] normal-case leading-[1.15] text-ink">
              Đi theo thứ tự này
            </h2>
            <span className="label shrink-0 text-ink/45">
              {String(route.stops.length).padStart(2, "0")} điểm
            </span>
          </div>

          {route.stops.length === 0 ? (
            <p className="mt-8 border-t border-ink/12 py-10 text-sm text-ink/55">
              Lộ trình này chưa có điểm dừng nào.
            </p>
          ) : (
            /* The rules do the work. The last row closes the list, so the
               block reads as one table of stops rather than four objects. */
            <ul className="mt-6 border-b border-ink/12">
              {route.stops.map((stop, i) => (
                <StopRow key={stop.id} stop={stop} index={i} flashed={flash === stop.id} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
