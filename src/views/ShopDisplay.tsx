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

const formatPrice = (value: number) =>
  value > 0 ? `${value.toLocaleString("vi-VN")}₫` : "Liên hệ";

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
        const isOwnerOrAdmin = (user && storeData.userId === user.uid) || (profile && profile.role === "Admin");
        setProducts(storeProducts.filter(p => p.status === "Approved" && (!p.hidden || isOwnerOrAdmin)));
      }
      setLoading(false);
    }
    loadStoreData();
  }, [storeId, user, profile]);

  const handleFollowToggle = async () => {
    if (!user) {
      navigate("/auth-gateway");
      return;
    }
    if (!store) return;

    const newFollowed = await toggleFollowShop(user.uid, store.id);
    await refreshProfile();
    
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

  const popularProducts = [...products]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 3);

  const isFollowing = profile?.followedShops?.includes(store?.id || "") || false;
  const isAuthorizedToView = !store || ((store.status === "Approved" && !store.hidden) || (user && store.userId === user.uid) || profile?.role === "Admin");

  if (loading) {
    return (
      <div className="min-h-[70vh] flex justify-center items-center bg-paper-warm">
        <span className="text-sm font-medium animate-pulse text-brand">Đang tải thông tin cửa hàng...</span>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-paper-warm p-8 text-center space-y-4">
        <h2 className="display text-2xl normal-case text-ink">Không tìm thấy cửa hàng</h2>
        <p className="text-sm text-ink/60">Cửa hàng này có thể đã dừng hoạt động hoặc chưa được kích hoạt.</p>
        <Link to="/stores" className="inline-flex items-center rounded-full bg-brand px-6 py-2.5 text-paper label hover:bg-brand-deep transition-all">
          Khám phá các shop khác
        </Link>
      </div>
    );
  }

  if (!isAuthorizedToView) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-paper-warm p-8 text-center space-y-6">
        <div className="bg-paper rounded-2xl border border-ink/10 p-8 max-w-md mx-auto shadow-sm space-y-4">
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600 text-lg">
            🔒
          </div>
          <h2 className="font-medium text-lg text-ink">Cửa hàng đang chờ xác duyệt</h2>
          <p className="text-xs text-ink/70 leading-relaxed">
            Thương hiệu thủ công <span className="font-semibold text-ink">"{store?.name}"</span> đang trong quá trình xét duyệt danh mục hoặc tạm thời đóng để cập nhật.
          </p>
          <div className="pt-2">
            <Link to="/stores" className="inline-block rounded-full bg-brand px-6 py-2.5 text-paper text-xs font-semibold hover:bg-brand-deep transition-all">
              Khám phá các boutique đang mở
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-warm text-ink select-none p-4 md:p-8 pb-20 max-w-7xl mx-auto space-y-10">
      
      {/* 1. TOP HEADER NAVIGATION AND ACTION ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink/10 pb-4">
        <Link 
          to="/stores" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/60 hover:text-brand transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tất cả cửa hàng</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleFollowToggle}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-xs ${
              isFollowing ? "bg-red-50 text-red-500 border border-red-200" : "bg-brand text-paper hover:bg-brand-deep hover:scale-105 active:scale-95"
            }`}
          >
            <Heart className={`w-4 h-4 ${isFollowing ? "fill-red-500" : ""}`} />
            <span>{isFollowing ? "Đã theo dõi" : "Theo dõi shop"}</span>
          </button>
        </div>
      </div>

      {/* 2. SHOP HERO STORY INTRO */}
      <section className="bg-paper rounded-2xl border border-ink/10 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12">
        <div className="md:col-span-5 aspect-[4/3] w-full bg-paper-warm flex items-center justify-center overflow-hidden">
          <img 
            src={store.coverUrl || "https://images.unsplash.com/photo-1565192647048-f997ded87958?w=500"} 
            alt={store.name} 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover" 
          />
        </div>

        <div className="md:col-span-7 p-6 md:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <img 
                src={store.logoUrl || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=100"} 
                alt={store.name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full border border-ink/10 object-cover shrink-0 shadow-sm" 
              />
              <div className="flex-1">
                <span className="label text-wave-ink font-semibold">
                  {store.vibe || "Artisan Boutique"}
                </span>
                <h1 className="font-medium text-2xl md:text-3xl text-ink leading-tight mt-0.5">{store.name}</h1>
                <p className="text-xs text-ink/60 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                  <span>{store.address}</span>
                </p>

                {/* Social links */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {store.socials?.facebook && store.socialToggles?.facebook && (
                    <button
                      onClick={() => handleSocialClick("Facebook", store.socials.facebook)}
                      className="bg-paper-warm hover:bg-[#1877f2] text-ink hover:text-paper border border-ink/10 rounded-full px-3 py-1 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <Facebook className="w-3.5 h-3.5" />
                      <span>Facebook</span>
                    </button>
                  )}
                  {store.socials?.instagram && store.socialToggles?.instagram && (
                    <button
                      onClick={() => handleSocialClick("Instagram", store.socials.instagram)}
                      className="bg-paper-warm hover:bg-gradient-to-tr hover:from-[#f58529] hover:via-[#dd2a7b] hover:to-[#8134af] text-ink hover:text-paper border border-ink/10 rounded-full px-3 py-1 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <Instagram className="w-3.5 h-3.5" />
                      <span>Instagram</span>
                    </button>
                  )}
                  {store.socials?.tiktok && store.socialToggles?.tiktok && (
                    <button
                      onClick={() => handleSocialClick("TikTok", store.socials.tiktok)}
                      className="bg-paper-warm hover:bg-ink text-ink hover:text-paper border border-ink/10 rounded-full px-3 py-1 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <span>TikTok</span>
                    </button>
                  )}
                  {store.socials?.threads && store.socialToggles?.threads && (
                    <button
                      onClick={() => handleSocialClick("Threads", store.socials.threads)}
                      className="bg-paper-warm hover:bg-ink text-ink hover:text-paper border border-ink/10 rounded-full px-3 py-1 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Threads</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-ink/5 pt-4">
              <p className="text-xs md:text-sm text-ink/75 leading-relaxed whitespace-pre-wrap">
                {store.description || [store.story, store.vibe].filter(Boolean).join("\n\n") || "Không gian tuyển chọn các tác phẩm thủ công, thiết kế và văn hoá bản địa."}
              </p>
            </div>
          </div>

          <div className="border-t border-ink/5 pt-3 flex items-center gap-2 text-xs text-ink/60">
            <Mail className="w-3.5 h-3.5 text-brand" />
            <span>{store.email}</span>
          </div>
        </div>
      </section>

      {/* 3. POPULAR NOW SECTION */}
      {popularProducts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-ink/10 pb-2">
            <h3 className="font-medium text-lg text-ink flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand" />
              <span>Nổi bật nhất tiệm</span>
            </h3>
            <span className="label text-wave-ink font-semibold">
              Được yêu thích
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {popularProducts.map((prod) => (
              <Link 
                key={prod.id} 
                to={`/products/${prod.id}`}
                onClick={async () => {
                  await incrementProductClick(prod.id);
                }}
                className="group bg-paper rounded-2xl border border-ink/10 p-3 space-y-3 relative overflow-hidden hover:border-brand/30 hover:shadow-[0_12px_32px_rgba(117,32,247,0.12)] hover:-translate-y-0.5 transition-all block"
              >
                <div className="aspect-video relative overflow-hidden rounded-xl bg-paper-warm">
                  <img 
                    src={prod.images[0]} 
                    alt={prod.name} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium text-sm text-ink group-hover:text-brand transition-colors line-clamp-1">{prod.name}</h4>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs font-semibold text-brand">{formatPrice(prod.price)}</span>
                    <span className="text-[11px] font-semibold text-wave-ink bg-wave/15 px-2 py-0.5 rounded-full">
                      🔥 {prod.clicks} lượt xem
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 4. CATALOG GRID WITH FILTERS */}
      <section className="space-y-6">
        <div className="border-b border-ink/10 pb-3 flex justify-between items-center">
          <h3 className="font-medium text-xl text-ink">
            Tất cả tác phẩm
          </h3>
          <span className="label text-ink/60 font-semibold">
            {filteredProducts.length} sản phẩm
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Filters Sidebar */}
          <aside className="lg:col-span-3 bg-paper rounded-2xl border border-ink/10 p-6 shadow-sm space-y-4" id="shop-filter-sidebar">
            <div className="border-b border-ink/10 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-brand" />
                <h4 className="label text-ink font-semibold">
                  Bộ lọc giá
                </h4>
              </div>
              {selectedPriceRange && (
                <button
                  onClick={() => setSelectedPriceRange(null)}
                  className="text-xs text-brand hover:text-brand-deep font-medium"
                >
                  Xoá lọc
                </button>
              )}
            </div>
            
            <div className="space-y-1.5">
              {[
                { id: "under-100", label: "Dưới 100.000₫" },
                { id: "100-200", label: "100.000₫ - 200.000₫" },
                { id: "200-300", label: "200.000₫ - 300.000₫" },
                { id: "300-500", label: "300.000₫ - 500.000₫" },
                { id: "500-1m", label: "500.000₫ - 1.000.000₫" },
                { id: "over-1m", label: "Trên 1.000.000₫" }
              ].map((range) => {
                const isSelected = selectedPriceRange === range.id;
                return (
                  <button
                    key={range.id}
                    onClick={() => setSelectedPriceRange(isSelected ? null : range.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                      isSelected ? "bg-brand text-paper shadow-sm" : "bg-paper-warm text-ink hover:bg-ink/5"
                    }`}
                  >
                    <span>{range.label}</span>
                    {isSelected && <span className="text-wave">✓</span>}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Product Listing */}
          <div className="lg:col-span-9">
            {filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-ink/10 p-12 text-center bg-paper shadow-sm space-y-3">
                <p className="text-sm font-medium text-ink">
                  Không tìm thấy sản phẩm trong tầm giá này
                </p>
                <button
                  onClick={() => setSelectedPriceRange(null)}
                  className="rounded-full bg-brand px-6 py-2 text-paper text-xs font-semibold hover:bg-brand-deep"
                >
                  Xoá bộ lọc
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
                    className="group bg-paper rounded-2xl border border-ink/10 hover:border-brand/30 hover:shadow-[0_12px_32px_rgba(117,32,247,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm"
                  >
                    <div className="aspect-square bg-paper-warm overflow-hidden relative">
                      <img 
                        src={prod.images[0]} 
                        alt={prod.name} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                      <span className="absolute top-3 left-3 bg-paper/90 backdrop-blur-sm text-ink text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-ink/5 shadow-xs">
                        {prod.category}
                      </span>
                    </div>

                    <div className="p-5 flex-grow flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="font-medium text-base text-ink group-hover:text-brand transition-colors leading-snug line-clamp-2">
                          {prod.name}
                        </h4>
                        <p className="text-xs text-ink/65 line-clamp-2 leading-relaxed mt-1">{prod.description}</p>
                      </div>
                      <div className="pt-3 border-t border-ink/5 flex justify-between items-center">
                        <span className="text-sm font-semibold text-brand">
                          {formatPrice(prod.price)}
                        </span>
                        <span className="text-xs font-semibold text-ink/50 group-hover:text-brand flex items-center gap-0.5 transition-colors">
                          Chi tiết
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
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
