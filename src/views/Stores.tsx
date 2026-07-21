import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Sparkles, ChevronRight, Store } from "lucide-react";
import { fetchStores } from "../lib/dbService";
import { StoreProfile } from "../types";

export default function Stores() {
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStores() {
      setLoading(true);
      const allStores = await fetchStores();
      // Filter out stores that are not completed registrations, have no name, or are not approved
      setStores(allStores.filter(s => s.registered && s.name && s.status === "Approved" && !s.hidden));
      setLoading(false);
    }
    loadStores();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-100 p-4 md:p-8 select-none max-w-7xl mx-auto">
      
      {/* Page Title */}
      <div className="border-b-4 border-black pb-4 mb-8">
        <h1 className="font-display font-black text-2xl md:text-3xl uppercase tracking-tight">
          CULTURAL STORES
        </h1>
        <p className="font-mono text-xs text-neutral-500 uppercase mt-1">
          Explore artisanal workshops, design collectives, and heritage galleries in Vietnam
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <span className="font-mono text-xs animate-pulse text-neutral-500">
            CONNECTING HERITAGE BOUTIQUES...
          </span>
        </div>
      ) : stores.length === 0 ? (
        <div className="border-4 border-black p-12 text-center bg-white space-y-3 shadow-[4px_4px_0px_0px_#000000]">
          <Store className="w-8 h-8 mx-auto text-neutral-500" />
          <p className="font-mono text-xs font-bold uppercase">No boutiques registered yet</p>
          <p className="text-[11px] text-neutral-400 font-mono uppercase">
            Check back later as our community of traditional creators registers on the platform.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stores.map((store) => (
            <div 
              key={store.id} 
              className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_#000000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Wallpaper Cover Image */}
              <div className="h-40 bg-neutral-200 relative border-b-4 border-black">
                <img 
                  src={store.coverUrl || "https://images.unsplash.com/photo-1565192647048-f997ded87958?w=500"} 
                  alt={store.name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                
                {/* Circular Logo overlay */}
                <div className="absolute -bottom-6 left-6">
                  <img 
                    src={store.logoUrl || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=100"} 
                    alt={`${store.name} logo`} 
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-full border-4 border-black bg-white object-cover shadow-sm"
                  />
                </div>

                <div className="absolute top-2 right-2 bg-black text-white text-[9px] font-mono px-2 py-0.5 border border-white uppercase">
                  {store.vibe || "Artisan Boutique"}
                </div>
              </div>

              {/* Shop info text */}
              <div className="p-6 pt-10 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-display font-black text-lg uppercase leading-tight">
                      {store.name}
                    </h3>
                    <p className="text-[10px] font-mono text-neutral-400 uppercase flex items-center space-x-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">{store.address}</span>
                    </p>
                  </div>

                  <p className="text-xs text-neutral-600 line-clamp-3 italic">
                    "{store.description || [store.story, store.vibe].filter(Boolean).join("\n\n") || "A fine boutique showcasing cultural crafts, design works, and authentic materials."}"
                  </p>
                </div>

                {/* Visit button */}
                <div className="border-t border-neutral-100 pt-4 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
                    // CO-CREATED IN VN
                  </span>
                  <Link 
                    to={`/stores/${store.id}`}
                    className="px-4 py-2 border-2 border-black bg-black text-white font-mono text-xs font-bold hover:bg-white hover:text-black transition-all flex items-center space-x-1 uppercase"
                  >
                    <span>ENTER SHOP</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
