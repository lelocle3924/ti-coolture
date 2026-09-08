import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
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
 * One screen, and the map is the screen. Everything the page can answer is
 * beside the map or on it:
 *
 *     Khám phá thành phố
 *          Chợ Lớn
 *     [ the places | ‹ the map › ]
 *     ~ wave ~
 *     paper — the breadcrumb, and the footer under it
 *
 * That shape is the 09/09 note read end to end:
 *
 *   · "Giảm khoảng cách từ Title đến ảnh map còn ⅓" — the map is pulled up
 *     into the space its own artwork was not using.
 *   · "Thêm 2 nút mũi tên 2 bên cái map để đổi giữa các quận… tên bản đồ ở
 *     trên cũng phải đổi tương ứng theo" — the arrows live on the map's edges
 *     and the region line reads off the route, so it changes with them.
 *   · "trước đó đang ở category nào thì sang bản đồ mới cũng hiện địa điểm
 *     của category đó" — changing region no longer resets the kind. A region
 *     with nothing of that kind says so rather than quietly switching.
 *   · "Đem list các địa điểm lên bên trái map… Bỏ phần list địa điểm nền
 *     trắng ở dưới luôn" — the white band below is gone; its contents are the
 *     column beside the map.
 *   · "List 4 loại địa điểm thì không cần ghi" — the category names came off
 *     with it. The pins carry them: an icon, and the picked one is violet and
 *     15% larger.
 *   · "Trên mobile, để map nằm trên và list địa điểm nằm dưới."
 */

/** How long a stop stays marked after arriving on it from a ?start= link. */
const FLASH_MS = 2200;

function PlaceRow({
  stop,
  flashed,
}: {
  key?: string;
  stop: TouristRoute["stops"][number];
  /** Arrived here from a link — hold a mark on it long enough to be found. */
  flashed: boolean;
}) {
  const mapHref = stop.address?.startsWith("http")
    ? stop.address
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.address ?? "")}`;

  return (
    <li
      id={`stop-${stop.id}`}
      /* Hairlines, on the violet. The row moved off the paper band on 09/09
         and everything that made it a light-ground row went with it. */
      className="scroll-mt-28 border-b border-white/15 transition-colors duration-500"
      style={
        flashed
          ? { backgroundColor: "color-mix(in srgb, var(--color-wave) 18%, transparent)" }
          : undefined
      }
    >
      <div className="py-3.5">
        <p className="text-base font-medium leading-snug text-paper md:text-lg">{stop.name}</p>

        {stop.address && (
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-white/60">
            <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-wave" />
            <span className="min-w-0">{stop.address}</span>
            <a
              href={mapHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 border-b border-wave/40 pb-px font-semibold text-wave transition-colors hover:border-wave"
            >
              Mở bản đồ
              <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
            </a>
          </p>
        )}
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
  /** Which kind of place is being shown — null until someone picks one. */
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    fetchTouristRoutes()
      .then((data) => {
        setRoutes(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const route = routeId ? routes.find((r) => r.id === routeId) : routes[0];

  const revealStop = useCallback((stopId: string) => {
    const el = document.getElementById(`stop-${stopId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlash(stopId);
  }, []);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), FLASH_MS);
    return () => clearTimeout(timer);
  }, [flash]);

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

  /* Open on a kind this region actually has, so a first visit never lands on
     an empty column. Once someone has picked, their pick stands — including
     across a region change, which is what the arrows are asked to preserve. */
  const firstFilled =
    DISCOVER_CATEGORIES.find((c) => route.stops.some((s) => s.category === c.id))?.id ??
    DISCOVER_CATEGORIES[0].id;
  const activeId = picked ?? firstFilled;
  const category = DISCOVER_CATEGORIES.find((c) => c.id === activeId) ?? DISCOVER_CATEGORIES[0];
  const shown = route.stops.filter((s) => s.category === activeId);

  /* Wraps, because two chevrons that grey out at the ends of a three-item
     list spend most of their life disabled. */
  const step = (delta: number) => {
    const here = routes.findIndex((r) => r.id === route.id);
    const next = routes[(here + delta + routes.length) % routes.length];
    if (next) navigate(`/discover/${next.id}`);
  };

  return (
    /* The same move /products and /stores make: the negative margin cancels
       the shell's pt-24 pill clearance on the element that clips, so the
       violet runs to y=0 and the header does not sit on a strip of the
       shell's ink. */
    <div className="relative w-full overflow-x-hidden bg-paper text-ink md:-mt-28 -mt-24">
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

        {/* pt is deeper than the other pages': the title is centred, so it
            runs under the middle of the floating nav pill rather than
            clearing it to the left the way a left-aligned h1 did. */}
        <div className="relative z-20 mx-auto max-w-4xl px-5 pt-28 text-center md:px-8 md:pt-32">
          <h1 className="display text-4xl font-medium normal-case leading-[1.25] text-paper md:text-6xl">
            Khám phá thành phố
          </h1>

          {/* The map's name. It reads off the route, so the arrows change it. */}
          <p key={route.id} className="lab-plate-in mt-3 text-base tracking-[0.12em] text-wave md:text-lg">
            {plan.region}
          </p>
        </div>

        {/* "Giảm khoảng cách từ Title đến ảnh map còn ⅓."
            Two thirds of that gap was never a margin: the island is drawn in
            a 4:3 box and its own artwork starts about an eighth of the way
            down, so there was ~90px of empty SVG under the title that no
            spacing rule could reach. The map block is pulled up by roughly
            that much instead. A percentage, not a pixel count, because the
            empty top scales with the map's width — which is 65% of the page
            on a desktop and 75% on a phone, hence the two figures. */}
        <div className="relative z-10 -mt-[6%] md:-mt-[3.6%]">
          <CategoryMap
            route={route}
            activeId={activeId}
            onSelect={setPicked}
            onStep={step}
            aside={
              <div>
                <h2 className="display text-[clamp(1.35rem,2.6vw,2rem)] normal-case leading-[1.15] text-paper">
                  Địa điểm {category.name}
                </h2>

                {shown.length === 0 ? (
                  <p className="mt-4 border-t border-white/15 py-6 text-sm leading-relaxed text-white/60">
                    Chưa có điểm {category.name.toLowerCase()} nào ở {plan.region}. Chọn ghim
                    khác trên bản đồ, hoặc đổi vùng bằng hai mũi tên.
                  </p>
                ) : (
                  <ul className="mt-4 border-t border-white/15">
                    {shown.map((stop) => (
                      <PlaceRow key={stop.id} stop={stop} flashed={flash === stop.id} />
                    ))}
                  </ul>
                )}
              </div>
            }
          />
        </div>

        <div className="relative z-10 mt-10 -mb-px h-[clamp(2.5rem,5vw,4.5rem)] overflow-hidden md:mt-14">
          <WaveBlog className="absolute inset-x-0 bottom-0" fill="var(--color-paper)" />
        </div>
      </section>

      {/* Paper, and only the trail on it. The itinerary that used to fill this
          band is beside the map now; what is left is the page's place in the
          site, which the site puts on paper under the wave everywhere else. */}
      <div data-surface="light" className="relative z-10 pb-10 md:pb-14">
        <div className="mx-auto max-w-4xl px-5 md:px-8">
          <Breadcrumbs
            className="mt-2"
            trail={[
              { label: "Trang chủ", to: "/" },
              { label: "Khám phá", to: "/discover" },
              { label: plan.region },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
