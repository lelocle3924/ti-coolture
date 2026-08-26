import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { fetchTouristRoutes } from "../lib/dbService";
import { TouristRoute, RouteStop } from "../types";
import { ArrowLeft, Compass, ArrowUpRight, MapPin } from "lucide-react";
import { ContinuousWave, PaperBackgroundExtender } from "../components/BrandShapes";
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
    <div className="min-h-[100dvh] bg-brand text-ink pb-0 select-none relative overflow-x-hidden w-full">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <ContinuousWave pageIndex={3} />
        <PaperBackgroundExtender />
      </div>

      <div className="bg-transparent pt-10 md:pt-14 pb-12 md:pb-16 relative z-10 text-paper">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Bản đồ chính</span>
          </Link>
          
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-wave mb-4 backdrop-blur-md border border-white/15">
            <Compass className="w-3.5 h-3.5" />
            <span className="tracking-wider uppercase">LỘ TRÌNH KHÁM PHÁ</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-medium leading-tight text-paper display normal-case mb-4">
            {route.name}
          </h1>
          
          <p className="text-lg text-white/80 leading-relaxed">
            {route.description || "Khám phá những xưởng thủ công và địa điểm văn hoá đặc sắc trên tuyến đường này."}
          </p>
        </div>
      </div>

      {/* The same district map the homepage carries (26/08). Here a pin does
          not navigate — the stop it names is already on this page, so it
          scrolls to it and flashes it, the way arriving with ?start= does. */}
      <div className="relative z-10">
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

      <div className="py-12 md:py-20 relative z-10">
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
