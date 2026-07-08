import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  fetchStoreById, 
  fetchProductsStore, 
  triggerWebhook, 
  toggleFollowShop, 
  incrementProductClick 
} from "../lib/dbService";
import { useAuth } from "../lib/useAuth";
import { StoreProfile, Product } from "../types";
import { 
  Instagram, 
  Facebook, 
  Heart, 
  Mail, 
  MapPin, 
  ArrowLeft, 
  Filter, 
  ChevronRight,
  TrendingUp,
  MessageCircle
} from "lucide-react";

export default function ShopDisplay() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  const [store, setStore] = useState<StoreProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null);

  useEffect(() => {
    async function loadStoreData() {
      if (!storeId) return;
      setLoading(true);
      const storeData = await fetchStoreById(storeId);
      if (storeData) {
        setStore(storeData);
        const storeProducts = await fetchProductsStore(storeId);
        // Only show approved products for public view
        setProducts(storeProducts.filter(p => p.status === "Approved"));
      }
      setLoading(false);
    }
    loadStoreData();
  }, [storeId]);

  const handleFollowToggle = async () => {
    if (!user) {
      navigate("/auth-gateway");
      return;
    }
    if (!store) return;

    const newFollowed = await toggleFollowShop(user.uid, store.id);
    await refreshProfile();
    
    // Trigger simulated webhook
    triggerWebhook("SHOP_FOLLOWED_TOGGLE", {
      userId: user.uid,
      userEmail: user.email,
      storeId: store.id,
      storeName: store.name,
      followedState: newFollowed.includes(store.id),
      timestamp: new Date().toISOString()
    });
  };

  const handleSocialClick = (platform: string, url?: string) => {
    if (!url || !store) return;

    // Trigger webhook telemetry
    triggerWebhook("SOCIAL_LINK_CLICKED", {
      userId: user?.uid || "anonymous",
      userEmail: user?.email || "anonymous",
      storeId: store.id,
      storeName: store.name,
      platform,
      url,
      timestamp: new Date().toISOString()
    });

    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Pricing filter logic
  const matchesPrice = (price: number) => {
    if (!selectedPriceRange) return true;
    switch (selectedPriceRange) {
      case "under-100": return price < 100000;
      case "100-200": return price >= 100000 && price <= 200000;
      case "200-300": return price >= 200000 && price <= 300000;
      case "300-500": return price >= 300000 && price <= 500000;
      case "500-1m": return price >= 500000 && price <= 1000000;
      case "over-1m": return price > 1000000;
      default: return true;
    }
  };

  const filteredProducts = products.filter(p => matchesPrice(p.price));

  // "Popular Now" - highest clicked items (top 3)
  const popularProducts = [...products]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 3);

  const isFollowing = profile?.followedShops?.includes(store?.id || "") || false;
  const isAuthorizedToView = !store || store.status === "Approved" || (user && store.userId === user.uid) || profile?.role === "Admin";

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-neutral-100 font-mono text-xs">
        <span className="animate-pulse text-neutral-500">SYNCHRONIZING ARTISAN REGISTRY...</span>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-100 p-8 text-center space-y-4">
        <h2 className="font-display font-black text-lg uppercase">[ERROR: STORE NOT FOUND]</h2>
        <p className="font-mono text-xs text-neutral-500">The store you are looking for may have expired or been unlinked.</p>
        <Link to="/" className="px-4 py-2 border-2 border-black bg-black text-white hover:bg-white hover:text-black transition-all text-xs font-bold uppercase font-mono">
          Return to Hub
        </Link>
      </div>
    );
  }

  if (!isAuthorizedToView) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-100 p-8 text-center space-y-6">
        <div className="bg-white border-4 border-black p-8 max-w-md mx-auto shadow-[6px_6px_0px_0px_#000000] space-y-4">
          <div className="w-12 h-12 bg-amber-100 border-2 border-amber-500 rounded-full flex items-center justify-center mx-auto text-amber-600 text-lg">
            🔒
          </div>
          <h2 className="font-display font-black text-sm uppercase text-black">Boutique Verification Pending</h2>
          <p className="font-sans text-xs text-neutral-600 leading-relaxed">
            The traditional craft boutique <span className="font-bold">"{store?.name}"</span> is currently undergoing verification or has been temporarily deactivated by the administrative team.
          </p>
          <div className="pt-2">
            <Link to="/stores" className="inline-block px-4 py-2 bg-black text-white hover:bg-neutral-800 border-2 border-black transition-all text-[10px] font-bold uppercase font-mono tracking-wider">
              Explore Active Boutiques
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 select-none p-4 md:p-8 max-w-7xl mx-auto space-y-12">
      
      {/* 1. TOP HEADER NAVIGATION AND ACTION ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-4">
        <Link 
          to="/" 
          className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-neutral-500 hover:text-black uppercase underline"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>BACK TO HUB</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleFollowToggle}
            className={`px-6 py-1.5 border-2 border-black font-mono text-xs font-bold uppercase transition-all duration-100 flex items-center justify-center space-x-2 ${
              isFollowing ? "bg-black text-white" : "bg-white text-black hover:bg-black hover:text-white"
            }`}
          >
            <Heart className={`w-4 h-4 ${isFollowing ? "fill-white" : ""}`} />
            <span>{isFollowing ? "FOLLOWED" : "FOLLOW STORE"}</span>
          </button>
        </div>
      </div>

      {/* 2. SHOP HERO STORY INTRO */}
      <section className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_#000000] overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Cover image left / top - fixed to 4:3 aspect ratio */}
        <div className="md:col-span-5 aspect-[4/3] w-full border-b-4 md:border-b-0 md:border-r-4 border-black bg-neutral-100 flex items-center justify-center overflow-hidden">
          <img 
            src={store.coverUrl || "https://images.unsplash.com/photo-1565192647048-f997ded87958?w=500"} 
            alt={store.name} 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover" 
          />
        </div>

        {/* Description right */}
        <div className="md:col-span-7 p-6 md:p-8 flex flex-col justify-between space-y-6 overflow-hidden">
          <div className="space-y-4 w-full max-w-full">
            <div className="flex items-start space-x-3 w-full">
              <img 
                src={store.logoUrl || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=100"} 
                alt={store.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full border-2 border-black object-cover shrink-0" 
              />
              <div className="w-full">
                <h1 className="font-display font-black text-xl md:text-2xl uppercase text-black leading-tight">{store.name}</h1>
                <p className="text-[10px] font-mono text-neutral-500 uppercase flex items-center space-x-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-neutral-400" />
                  <span>{store.address}</span>
                </p>

                {/* Social links directly underneath the shop name */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {store.socials?.facebook && store.socialToggles?.facebook && (
                    <button
                      onClick={() => handleSocialClick("Facebook", store.socials.facebook)}
                      className="border border-black bg-white hover:bg-black hover:text-white text-black p-1 md:p-1.5 transition-all text-[9px] font-bold font-mono flex items-center space-x-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-none"
                    >
                      <Facebook className="w-3 h-3" />
                      <span>FACEBOOK</span>
                    </button>
                  )}
                  {store.socials?.instagram && store.socialToggles?.instagram && (
                    <button
                      onClick={() => handleSocialClick("Instagram", store.socials.instagram)}
                      className="border border-black bg-white hover:bg-black hover:text-white text-black p-1 md:p-1.5 transition-all text-[9px] font-bold font-mono flex items-center space-x-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-none"
                    >
                      <Instagram className="w-3 h-3" />
                      <span>INSTAGRAM</span>
                    </button>
                  )}
                  {store.socials?.tiktok && store.socialToggles?.tiktok && (
                    <button
                      onClick={() => handleSocialClick("TikTok", store.socials.tiktok)}
                      className="border border-black bg-white hover:bg-black hover:text-white text-black p-1 md:p-1.5 transition-all text-[9px] font-bold font-mono flex items-center space-x-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-none"
                    >
                      <span className="text-[9px] font-bold">TikTok</span>
                    </button>
                  )}
                  {store.socials?.threads && store.socialToggles?.threads && (
                    <button
                      onClick={() => handleSocialClick("Threads", store.socials.threads)}
                      className="border border-black bg-white hover:bg-black hover:text-white text-black p-1 md:p-1.5 transition-all text-[9px] font-bold font-mono flex items-center space-x-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-none"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>THREADS</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Combined description text box with dynamic word wrap */}
            <div className="border-t border-neutral-200 pt-3 w-full max-w-full">
              <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-wrap break-words">
                {store.description || [store.story, store.vibe].filter(Boolean).join("\n\n") || "A boutique dedicated to preserving local design aesthetics and material integrity."}
              </p>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-neutral-300 pt-4 flex flex-wrap gap-4 text-xs font-mono">
            <div className="flex items-center space-x-1">
              <Mail className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-[10px] lowercase">{store.email}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. POPULAR NOW SECTION */}
      <section className="space-y-4">
        <div className="border-b-2 border-black pb-2 flex items-center justify-between">
          <h3 className="font-display font-black text-sm uppercase tracking-tight flex items-center space-x-1.5 text-black">
            <TrendingUp className="w-4 h-4 text-black" />
            <span>Popular Now</span>
          </h3>
          <span className="font-mono text-[10px] text-neutral-400 font-bold uppercase">
            Most visited showcase pieces
          </span>
        </div>

        {popularProducts.length === 0 ? (
          <p className="text-xs font-mono text-neutral-400 italic py-4 uppercase">No visitor logs recorded yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {popularProducts.map((prod) => (
              <div 
                key={prod.id} 
                className="group bg-white border-2 border-black p-3 space-y-3 relative overflow-hidden hover:shadow-[4px_4px_0px_0px_#000000] transition-all"
              >
                {/* Image overlay transitions on hover to second gallery image */}
                <div className="aspect-video relative overflow-hidden border border-black">
                  <img 
                    src={prod.images[0]} 
                    alt={prod.name} 
                    referrerPolicy="no-referrer"
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${
                      prod.images[1] ? "group-hover:opacity-0" : ""
                    }`} 
                  />
                  {prod.images[1] && (
                    <img
                      src={prod.images[1]}
                      alt={`${prod.name} secondary view`}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-300"
                    />
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-xs uppercase line-clamp-1">{prod.name}</h4>
                  <p className="font-mono text-[10px] text-neutral-400 uppercase">{prod.category}</p>
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-mono text-xs font-bold">{prod.price.toLocaleString()} VND</span>
                    <span className="font-mono text-[9px] bg-neutral-100 px-1 border border-neutral-300 uppercase">
                      🔥 {prod.clicks} Clicks
                    </span>
                  </div>
                </div>
                <Link 
                  to={`/products/${prod.id}`}
                  onClick={async () => {
                    await incrementProductClick(prod.id);
                  }}
                  className="absolute inset-0 bg-transparent"
                  title={`View ${prod.name}`}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. WHAT'S IN STORE GRID (With Filter right next to it) */}
      <section className="space-y-6">
        <div className="border-b-4 border-black pb-3 flex justify-between items-center">
          <h3 className="font-display font-black text-lg uppercase text-black">
            Catalog
          </h3>
          <span className="font-mono text-xs bg-black text-white px-3 py-1 uppercase border border-black font-bold shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            {filteredProducts.length} Items Listed
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Filters Sidebar, only next to products display grid */}
          <aside className="lg:col-span-3 bg-white border-4 border-black p-6 shadow-[4px_4px_0px_0px_#000000] space-y-4" id="shop-filter-sidebar">
            <div className="border-b-2 border-black pb-2 flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-black" />
              <h4 className="font-display font-black text-xs uppercase tracking-wider text-black">
                FILTERS
              </h4>
            </div>
            
            <div className="space-y-1.5">
              {[
                { id: "under-100", label: "Under 100k VND" },
                { id: "100-200", label: "100k - 200k VND" },
                { id: "200-300", label: "200k - 300k VND" },
                { id: "300-500", label: "300k - 500k VND" },
                { id: "500-1m", label: "500k - 1M VND" },
                { id: "over-1m", label: "Over 1M VND" }
              ].map((range) => {
                const isSelected = selectedPriceRange === range.id;
                return (
                  <button
                    key={range.id}
                    onClick={() => setSelectedPriceRange(isSelected ? null : range.id)}
                    className={`w-full text-left px-2.5 py-2 font-mono text-[10px] font-bold border-2 border-black uppercase flex items-center justify-between transition-all ${
                      isSelected ? "bg-black text-white" : "bg-neutral-50 hover:bg-neutral-100 text-black"
                    }`}
                  >
                    <span>{range.label}</span>
                    {isSelected && <span className="font-mono text-xs">●</span>}
                  </button>
                );
              })}
            </div>
            {selectedPriceRange && (
              <button
                onClick={() => setSelectedPriceRange(null)}
                className="w-full text-center py-2 bg-neutral-100 hover:bg-neutral-200 text-[10px] font-mono uppercase font-bold border border-black mt-2"
              >
                RESET FILTERS [X]
              </button>
            )}
          </aside>

          {/* Product Listing */}
          <div className="lg:col-span-9">
            {filteredProducts.length === 0 ? (
              <div className="border-4 border-black p-12 text-center bg-white shadow-[4px_4px_0px_0px_#000000]">
                <p className="font-mono text-xs text-neutral-500 uppercase font-bold">
                  No products found matching pricing filters
                </p>
                <button
                  onClick={() => setSelectedPriceRange(null)}
                  className="mt-3 px-4 py-2 border-2 border-black bg-black text-white font-mono text-[10px] font-bold hover:bg-white hover:text-black uppercase"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((prod) => (
                  <Link
                    key={prod.id}
                    to={`/products/${prod.id}`}
                    onClick={async () => {
                      await incrementProductClick(prod.id);
                    }}
                    className="group bg-white border-2 border-black hover:shadow-[4px_4px_0px_0px_#000000] transition-all flex flex-col justify-between"
                  >
                    {/* Square image switching on hover */}
                    <div className="aspect-square bg-neutral-100 overflow-hidden relative border-b-2 border-black">
                      <img 
                        src={prod.images[0]} 
                        alt={prod.name} 
                        referrerPolicy="no-referrer"
                        className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${
                          prod.images[1] ? "group-hover:opacity-0" : ""
                        }`} 
                      />
                      {prod.images[1] && (
                        <img
                          src={prod.images[1]}
                          alt={`${prod.name} secondary view`}
                          referrerPolicy="no-referrer"
                          className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-300"
                        />
                      )}
                      <span className="absolute top-2 left-2 bg-white text-black text-[9px] font-mono px-1.5 py-0.5 border border-black uppercase font-bold">
                        {prod.category}
                      </span>
                    </div>

                    <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="font-display font-black text-sm text-black group-hover:underline uppercase leading-snug line-clamp-2">
                          {prod.name}
                        </h4>
                        <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed mt-1">{prod.description}</p>
                      </div>
                      <div className="pt-2 border-t border-neutral-100 flex justify-between items-center">
                        <span className="font-mono text-xs font-bold text-black">
                          {prod.price.toLocaleString()} {prod.currency}
                        </span>
                        <div className="flex items-center text-[10px] font-mono text-neutral-400 group-hover:text-black font-bold uppercase transition-colors">
                          <span>EXPLORE</span>
                          <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>

    </div>
  );
}
