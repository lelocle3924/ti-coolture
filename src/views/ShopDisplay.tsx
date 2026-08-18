import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  MapPin, Sparkles, Heart, ExternalLink, ArrowRight, 
  MessageCircle, ShieldCheck, ChevronRight, Store, Check, Info
} from "lucide-react";
import { 
  fetchStoreById, fetchProductsStore, toggleWishlist, triggerWebhook, 
  incrementProductClick, toggleFollowShop 
} from "../lib/dbService";
import { StoreProfile, Product } from "../types";
import { useAuth } from "../lib/useAuth";
import { ArcTopRight, RibbonLoop } from "../components/BrandShapes";
import { vtShopLogo, vtShopCover, vtProductImage, withDirectionalTransition } from "../lib/viewTransitions";

const formatPrice = (value: number) =>
  value > 0 ? `${value.toLocaleString("vi-VN")}₫` : "Liên hệ";

export default function ShopDisplay() {
  const { storeId } = useParams<{ storeId: string }>();
  const { user, profile, refreshProfile } = useAuth();

  const [store, setStore] = useState<StoreProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!storeId) return;
      setLoading(true);
      const storeData = await fetchStoreById(storeId);
      if (storeData) {
        setStore(storeData);
        const prods = await fetchProductsStore(storeId);
        setProducts(prods);
      }
      setLoading(false);
    }
    loadData();
  }, [storeId]);

  useEffect(() => {
    if (store && profile) {
      setIsFollowing(profile.followedShops?.includes(store.id) || false);
    }
  }, [store, profile]);

  const handleFollowToggle = async () => {
    if (!store) return;
    const effectiveUserId = user?.uid || "guest_user";
    setFollowLoading(true);
    const nextList = await toggleFollowShop(effectiveUserId, store.id);
    await refreshProfile();
    setIsFollowing(nextList.includes(store.id));
    setFollowLoading(false);
  };

  const handleToggleWishlist = async (e: React.MouseEvent, prodId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const effectiveUserId = user?.uid || "guest_user";
    await toggleWishlist(effectiveUserId, prodId);
    await refreshProfile();
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-paper-warm text-ink p-8 flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-3 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-ink/60">Đang chuẩn bị không gian xưởng...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-[100dvh] bg-paper-warm text-ink p-8 flex items-center justify-center">
        <div className="max-w-md bg-paper p-8 rounded-3xl border border-ink/10 text-center space-y-4 shadow-sm">
          <Store className="w-10 h-10 text-brand mx-auto" />
          <h2 className="display text-xl font-medium">Không tìm thấy xưởng</h2>
          <p className="text-xs text-ink/60">Không gian xưởng này không tồn tại hoặc đã được gỡ khỏi hệ thống.</p>
          <Link to="/stores" viewTransition className="inline-block px-5 py-2.5 rounded-full bg-brand text-paper text-xs font-semibold">
            Xem danh bạ xưởng
          </Link>
        </div>
      </div>
    );
  }

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = activeCategory === "all"
    ? products
    : products.filter(p => p.category === activeCategory);

  const googleMapsUrl = store.address
    ? store.address.startsWith("http")
      ? store.address
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.name} ${store.address}`)}`
    : undefined;

  return (
    <div className="min-h-[100dvh] bg-paper-warm text-ink pb-36 select-none relative">
      
      {/* Scroll Reading Progress Bar (§D1 Wireframe Spec) */}
      <div className="scroll-prog" />

      {/* ============ FLAGSHIP STUDIO COVER BANNER ============ */}
      <section className="relative h-64 md:h-84 lg:h-96 w-full bg-ink/90 overflow-hidden">
        <img
          src={store.coverUrl || "https://images.unsplash.com/photo-1565192647048-f997ded87958?w=1600"}
          alt={`${store.name} cover`}
          referrerPolicy="no-referrer"
          style={{ viewTransitionName: vtShopCover(store.id) }}
          className="plx w-full h-full object-cover opacity-85"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

        <ArcTopRight
          className="pointer-events-none absolute -right-16 -top-16 z-10 opacity-20"
          style={{ width: "24rem" }}
          fill="var(--color-wave)"
        />

        <div className="absolute top-6 left-4 md:left-8 z-20">
          <nav className="text-[11px] text-white/80 flex items-center gap-1.5 font-medium bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
            <Link to="/" viewTransition className="hover:text-wave transition-colors">Trang chủ</Link>
            <span>›</span>
            <Link to="/stores" viewTransition className="hover:text-wave transition-colors">Xưởng</Link>
            <span>›</span>
            <span className="text-white font-semibold">{store.name}</span>
          </nav>
        </div>
      </section>

      {/* ============ DOUBLE-BEZEL ATELIER HEADER PROFILE ============ */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 -mt-20 md:-mt-24 relative z-20">
        
        <div className="p-2 rounded-[2.5rem] bg-black/10 ring-1 ring-black/10 shadow-2xl">
          <div className="bg-paper rounded-[2.125rem] p-6 md:p-10 space-y-6 border border-ink/5 shadow-sm">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              
              {/* Logo Seal & Identity */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <img
                  src={store.logoUrl || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=200"}
                  alt={store.name}
                  referrerPolicy="no-referrer"
                  style={{ viewTransitionName: vtShopLogo(store.id) }}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-paper shadow-xl object-cover bg-paper shrink-0"
                />

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="display text-2xl md:text-4xl normal-case font-medium text-ink leading-tight">
                      {store.name}
                    </h1>
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 text-brand px-3 py-1 text-xs font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" /> Xưởng xác thực
                    </span>
                  </div>

                  <p className="text-xs text-ink/65 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                    <span>{store.address || "Việt Nam"}</span>
                    {googleMapsUrl && (
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand hover:underline font-semibold ml-1 flex items-center gap-0.5 text-[11px]"
                      >
                        <span>Mở Google Maps ↗</span>
                      </a>
                    )}
                  </p>

                  <p className="text-xs md:text-sm text-ink/75 max-w-xl leading-relaxed pt-1">
                    {store.description || "Xưởng chế tác thủ công độc bản được chứng thực trên Tí Coolture."}
                  </p>
                </div>
              </div>

              {/* Action Bar (Follow & Contact) */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`px-6 py-2.5 rounded-full text-xs font-semibold transition-all duration-300 flex items-center gap-2 shadow-sm ${
                    isFollowing
                      ? "bg-brand/10 text-brand border border-brand/20 hover:bg-brand/15"
                      : "bg-brand text-paper hover:bg-brand-deep shadow-brand/20"
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Đang theo dõi</span>
                    </>
                  ) : (
                    <>
                      <span>+ Theo dõi xưởng</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Social channels pill tray */}
            {store.socials && Object.values(store.socials).some(Boolean) && (
              <div className="pt-4 border-t border-ink/10 flex flex-wrap items-center gap-2">
                <span className="label text-ink/50 text-[10px] mr-2">KÊNH CHÍNH THỨC:</span>
                {store.socials.instagram && (
                  <a
                    href={store.socials.instagram.startsWith("http") ? store.socials.instagram : `https://${store.socials.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-paper-warm hover:bg-brand hover:text-paper text-xs font-medium text-ink transition-colors border border-ink/5"
                  >
                    <span>Instagram</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                )}
                {store.socials.tiktok && (
                  <a
                    href={store.socials.tiktok.startsWith("http") ? store.socials.tiktok : `https://${store.socials.tiktok}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-paper-warm hover:bg-brand hover:text-paper text-xs font-medium text-ink transition-colors border border-ink/5"
                  >
                    <span>TikTok</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                )}
                {store.socials.facebook && (
                  <a
                    href={store.socials.facebook.startsWith("http") ? store.socials.facebook : `https://${store.socials.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-paper-warm hover:bg-brand hover:text-paper text-xs font-medium text-ink transition-colors border border-ink/5"
                  >
                    <span>Facebook</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                )}
                {store.socials.threads && (
                  <a
                    href={store.socials.threads.startsWith("http") ? store.socials.threads : `https://${store.socials.threads}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-paper-warm hover:bg-brand hover:text-paper text-xs font-medium text-ink transition-colors border border-ink/5"
                  >
                    <span>Threads</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                )}
              </div>
            )}

          </div>
        </div>

      </section>

      {/* ============ STUDIO STORY / PHILOSOPHY ============ */}
      {store.story && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 mt-10">
          <div className="p-1.5 rounded-[2rem] bg-black/5 ring-1 ring-black/5">
            <div className="bg-paper rounded-[1.625rem] p-6 md:p-8 relative overflow-hidden space-y-3">
              <RibbonLoop
                className="pointer-events-none absolute -right-6 -bottom-6 z-0 opacity-10"
                style={{ width: "12rem" }}
                ribbon="var(--color-wave)"
                dot="var(--color-paper)"
              />
              <span className="label text-wave-ink font-semibold text-xs block">
                ✦ TRIẾT LÝ VÀ HÀNH TRÌNH CHẾ TÁC
              </span>
              <p className="text-xs md:text-sm text-ink/80 leading-relaxed relative z-10">
                {store.story}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ============ WORKSHOP COLLECTION CATALOG ============ */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 mt-12 space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink/10 pb-4">
          <div>
            <span className="label text-wave-ink text-[10px] font-semibold block">BỘ SƯU TẬP TẠI XƯỞNG</span>
            <h2 className="display text-2xl font-medium text-ink normal-case">
              Tất cả tác phẩm ({filteredProducts.length})
            </h2>
          </div>

          {/* Categories Pill Strip with Directional Transition */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat, idx) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    const currentIdx = categories.indexOf(activeCategory);
                    const dir = idx >= currentIdx ? "forward" : "backward";
                    withDirectionalTransition(dir, () => {
                      setActiveCategory(cat);
                    });
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                    isActive
                      ? "bg-brand text-paper shadow-md shadow-brand/20"
                      : "bg-paper text-ink/75 border border-ink/10 hover:border-brand/40"
                  }`}
                >
                  {cat === "all" ? "Tất cả tác phẩm" : cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid with View Transitions */}
        {filteredProducts.length === 0 ? (
          <div className="p-2 rounded-[2.5rem] bg-black/5 max-w-md mx-auto my-8">
            <div className="bg-paper rounded-[2.125rem] p-10 text-center space-y-3">
              <Store className="w-8 h-8 text-brand mx-auto" />
              <p className="text-sm font-semibold text-ink">Xưởng chưa đăng tải tác phẩm nào trong nhóm này</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map((p) => {
              const isWish = profile?.wishlist?.includes(p.id);
              return (
                <div key={p.id} className="rev hover-elastic p-1.5 rounded-[2rem] bg-black/5 ring-1 ring-black/5 hover:ring-brand/40 group cursor-pointer">
                  <Link
                    to={`/products/${p.id}`}
                    viewTransition
                    className="group bg-paper rounded-[1.625rem] overflow-hidden flex flex-col justify-between h-full border border-ink/5"
                  >
                    <div className="aspect-square bg-paper-warm overflow-hidden relative">
                      <img
                        src={p.images?.[0] || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400"}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        style={{ viewTransitionName: vtProductImage(p.id) }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <button
                        onClick={(e) => handleToggleWishlist(e, p.id)}
                        className={`absolute top-3 right-3 w-8 h-8 rounded-full grid place-items-center transition-all ${
                          isWish ? "bg-brand text-wave shadow-md" : "bg-paper/80 text-ink/60"
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isWish ? "fill-wave stroke-wave" : ""}`} />
                      </button>
                    </div>

                    <div className="p-4 space-y-1">
                      <span className="text-[10px] text-ink/50 font-semibold uppercase tracking-wider block">{p.category}</span>
                      <h4 className="font-medium text-xs text-ink group-hover:text-brand transition-colors truncate">
                        {p.name}
                      </h4>
                      <div className="pt-2 border-t border-ink/5 flex items-center justify-between">
                        <span className="font-bold text-xs text-brand">
                          {formatPrice(p.price)}
                        </span>
                        <div className="w-6 h-6 rounded-full bg-paper-warm text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-paper transition-colors">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

      </section>

    </div>
  );
}
