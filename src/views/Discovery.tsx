import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { fetchTouristRoutes } from "../lib/dbService";
import { TouristRoute, RouteStop } from "../types";
import { Compass, ArrowUpRight, MapPin } from "lucide-react";
import { ArcTopRight, RibbonLoop, WaveBlog } from "../components/BrandShapes";
import Breadcrumbs from "../components/Breadcrumbs";
import DistrictMap from "../home/DistrictMap";

export default function Discovery() {
  const navigate = useNavigate();
  const { routeId } = useParams();
  const [searchParams] = useSearchParams();
  const startStopId = searchParams.get("start");

  const [routes, setRoutes] = useState<TouristRoute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTouristRoutes()
      .then((data) => {
        setRoutes(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const route = routeId ? routes.find((r) => r.id === routeId) : routes[0];

  useEffect(() => {
    if (!loading && route && startStopId) {
      setTimeout(() => {
        const el = document.getElementById(`stop-${startStopId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-4", "ring-brand", "ring-offset-4");
          setTimeout(() => el.classList.remove("ring-4", "ring-brand", "ring-offset-4"), 2000);
        }
      }, 300);
    }
  }, [loading, route, startStopId]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-paper text-ink">
        <Compass className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!route) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-paper text-ink">
        <p>Không tìm thấy lộ trình.</p>
        <Link to="/" className="mt-4 text-brand font-semibold hover:underline">
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    /* Same move as /products and /stores: the negative margin cancels the
       shell's pt-24 pill clearance on the element that clips, so the violet
       runs to y=0 and the header stops sitting on the shell's ink — the black
       band at the top of the 26/08 screenshot. */
    <div className="min-h-[100dvh] -mt-24 bg-paper text-ink pb-0 select-none relative overflow-x-hidden w-full md:-mt-28">

      {/* ============ HERO ============
          Third variation on the one language: violet from y=0, one title, a
          wave seam into paper, breadcrumb underneath on the paper. /products
          is centred behind an arc, /stores is off-axis behind the ribbon;
          this one keeps the route's own name wide and centre-left with both
          marks low and quiet, and closes on WaveBlog's asymmetric ascent —
          the third of the three curves BrandShapes already carries. */}
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

        <div className="relative z-10 mx-auto max-w-3xl px-5 pt-24 pb-5 md:px-8 md:pt-28 md:pb-7">
          {/* leading-[1.25] rather than .display's 1.02 — see index.css on how
              far Vietnamese uppercase reaches in DFVN. */}
          <h1 className="display text-4xl font-medium leading-[1.25] text-paper normal-case md:text-6xl">
            {route.name}
          </h1>

          <p className="mt-3 text-base leading-relaxed text-white/80 md:text-lg">
            {route.description || "Khám phá những xưởng thủ công và địa điểm văn hoá đặc sắc trên tuyến đường này."}
          </p>
        </div>

        <div className="relative z-10 -mb-px h-[clamp(2.5rem,5vw,4.5rem)] overflow-hidden">
          <WaveBlog className="absolute inset-x-0 bottom-0" fill="var(--color-paper)" />
        </div>
      </section>

      {/* The trail replaces both the "Quay lại Bản đồ chính" back link and the
          "LỘ TRÌNH KHÁM PHÁ" pill (26/08): the crumb already says where you
          are and gives you the way back, in the style the other subpages use. */}
      <div data-surface="light" className="relative z-10 mx-auto mt-2 max-w-3xl px-5 md:px-8">
        <Breadcrumbs
          trail={[
            { label: "Trang chủ", to: "/" },
            { label: "Khám phá", to: "/discover" },
            { label: route.name },
          ]}
        />
      </div>

      {/* The same district map the homepage carries (26/08). Here a pin does
          not navigate — the stop it names is already on this page, so it
          scrolls to it and flashes it, the way arriving with ?start= does. */}
      <div className="relative z-10 mt-6">
        <DistrictMap
          routes={routes}
          heading="Chọn quận"
          onOpenRoute={(id) => navigate(`/discover/${id}`)}
          onPin={(id, stopId) => {
            if (id !== route.id) {
              navigate(`/discover/${id}?start=${stopId}`);
              return;
            }
            const el = document.getElementById(`stop-${stopId}`);
            if (!el) return;
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("ring-4", "ring-brand", "ring-offset-4");
            setTimeout(() => el.classList.remove("ring-4", "ring-brand", "ring-offset-4"), 2000);
          }}
        />
      </div>

      <div data-surface="light" className="py-12 md:py-20 relative z-10">
        <div className="mx-auto max-w-3xl px-5 md:px-8 space-y-8 relative">
          
          {/* Vertical connecting line */}
          <div className="absolute left-9 top-4 bottom-4 w-px bg-brand/20 md:left-12"></div>

          {route.stops.map((stop, idx) => (
            <div
              id={`stop-${stop.id}`}
              key={stop.id}
              className="relative flex gap-6 md:gap-8 items-start group transition-all duration-500 rounded-2xl p-4 -ml-4 hover:bg-paper-warm hover:shadow-md"
            >
              <div className="relative z-10 shrink-0 w-10 h-10 rounded-full bg-paper border-2 border-brand text-brand grid place-items-center font-bold text-sm shadow-sm group-hover:bg-brand group-hover:text-paper transition-colors">
                {idx + 1}
              </div>
              
              <div className="pt-1.5 flex-1">
                <h3 className="text-xl font-bold text-ink mb-2 group-hover:text-brand transition-colors">
                  {stop.name}
                </h3>
                
                {stop.description && (
                  <p className="text-ink/75 leading-relaxed mb-4 text-sm md:text-base">
                    {stop.description}
                  </p>
                )}

                {stop.address && (
                  <div className="flex items-center gap-2 text-sm text-ink/60 bg-white border border-ink/10 rounded-lg p-3 inline-flex flex-wrap">
                    <MapPin className="w-4 h-4 text-brand shrink-0" />
                    <span>{stop.address}</span>
                    <a
                      href={
                        stop.address.startsWith("http")
                          ? stop.address
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.address)}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                    >
                      <span>Mở bản đồ</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}
