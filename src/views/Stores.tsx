import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Sparkles, ChevronRight, Store as StoreIcon } from "lucide-react";
import { fetchStores } from "../lib/dbService";
import { StoreProfile } from "../types";

export default function Stores() {
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStores() {
      setLoading(true);
      const allStores = await fetchStores();
      setStores(allStores.filter(s => s.registered && s.name && s.status === "Approved" && !s.hidden));
      setLoading(false);
    }
    loadStores();
  }, []);

  return (
    <div className="min-h-screen bg-paper-warm text-ink pb-20 select-none">
      {/* Header Banner */}
      <div className="bg-brand text-paper py-12 md:py-16 px-5 md:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-wave backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" /> Không gian văn hoá & xưởng sáng tạo
          </span>
          <h1 className="display mt-3 text-3xl md:text-5xl leading-tight normal-case">
            Local Brands & Art Studios
          </h1>
          <p className="mt-2 text-sm md:text-base text-white/80 max-w-xl leading-relaxed">
            Khám phá những xưởng thủ công, boutique sáng tạo và phòng tranh nghệ thuật độc đáo khắp Việt Nam.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 md:px-8 mt-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-paper rounded-2xl border border-ink/10 p-4 animate-pulse space-y-4">
                <div className="h-44 rounded-xl bg-paper-warm" />
                <div className="h-4 w-1/2 rounded bg-paper-warm" />
                <div className="h-3 w-3/4 rounded bg-paper-warm" />
              </div>
            ))}
          </div>
        ) : stores.length === 0 ? (
          <div className="bg-paper rounded-2xl border border-ink/10 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
            <StoreIcon className="w-8 h-8 mx-auto text-brand" />
            <p className="text-base font-medium text-ink">Chưa có cửa hàng nào được đăng ký</p>
            <p className="text-xs text-ink/60">
              Hãy quay lại sau khi cộng đồng các nghệ nhân và local brand hoàn tất đăng ký nhé.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stores.map((store) => (
              <div 
                key={store.id} 
                className="group bg-paper rounded-2xl border border-ink/10 hover:border-brand/30 hover:shadow-[0_12px_32px_rgba(117,32,247,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm"
              >
                {/* Cover Image & Avatar */}
                <div className="h-44 bg-paper-warm relative overflow-hidden">
                  <img 
                    src={store.coverUrl || "https://images.unsplash.com/photo-1565192647048-f997ded87958?w=500"} 
                    alt={store.name} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Logo overlay */}
                  <div className="absolute -bottom-4 left-6">
                    <img 
                      src={store.logoUrl || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=100"} 
                      alt={`${store.name} logo`} 
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-full border-2 border-paper bg-paper object-cover shadow-md"
                    />
                  </div>

                  <div className="absolute top-3 right-3 bg-paper/90 backdrop-blur-sm text-wave-ink text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-ink/5 shadow-xs">
                    {store.vibe || "Artisan Studio"}
                  </div>
                </div>

                {/* Shop info */}
                <div className="p-6 pt-7 flex-1 flex flex-col justify-between space-y-5">
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-medium text-lg text-ink group-hover:text-brand transition-colors leading-snug">
                        {store.name}
                      </h3>
                      <p className="text-xs text-ink/60 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                        <span className="truncate">{store.address}</span>
                      </p>
                    </div>

                    <p className="text-xs text-ink/70 line-clamp-3 leading-relaxed">
                      {store.description || [store.story, store.vibe].filter(Boolean).join("\n\n") || "Không gian tuyển chọn các tác phẩm thủ công, thiết kế và văn hoá bản địa."}
                    </p>
                  </div>

                  {/* Visit button */}
                  <div className="border-t border-ink/5 pt-4 flex items-center justify-between">
                    <span className="label text-wave-ink font-semibold">
                      Made in VN
                    </span>
                    <Link 
                      to={`/stores/${store.id}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-paper text-xs font-semibold hover:bg-brand-deep transition-all hover:scale-105 active:scale-95 shadow-sm"
                    >
                      <span>Ghé thăm</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
