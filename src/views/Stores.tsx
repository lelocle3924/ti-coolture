import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  MapPin, ExternalLink, ChevronRight, Store, 
  Sparkles, ArrowRight, ArrowUpRight, ShieldCheck, Heart, Search 
} from "lucide-react";
import { fetchStores, fetchProducts } from "../lib/dbService";
import { StoreProfile, Product } from "../types";
import { ArcTopRight, RibbonLoop, ContinuousWave, PaperBackgroundExtender } from "../components/BrandShapes";
import { vtShopLogo, vtShopCover, vtProductImage, withDirectionalTransition } from "../lib/viewTransitions";

const DISTRICT_HUBS = [
  "Tất cả khu vực",
  "Quận 1",
  "Quận 3",
  "Thảo Điền / TP. Thủ Đức",
  "Phố cổ Hà Nội",
  "Tây Hồ, Hà Nội",
  "Đà Nẵng & Hội An",
  "Đà Lạt",
  "Bát Tràng"
];

export default function Stores() {
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedHub, setSelectedHub] = useState("Tất cả khu vực");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [allStores, allProducts] = await Promise.all([
        fetchStores(),
        fetchProducts("Approved")
      ]);
      setStores(allStores);
      setProducts(allProducts);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleHubSelect = (hub: string) => {
    const currentIdx = DISTRICT_HUBS.indexOf(selectedHub);
    const nextIdx = DISTRICT_HUBS.indexOf(hub);
    const dir = nextIdx >= currentIdx ? "forward" : "backward";

    withDirectionalTransition(dir, () => {
      setSelectedHub(hub);
    });
  };

  const filteredStores = stores.filter(store => {
    if (selectedHub !== "Tất cả khu vực") {
      const matchDistrict = (store.address || "").toLowerCase().includes(selectedHub.toLowerCase());
      if (!matchDistrict) return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchName = store.name.toLowerCase().includes(query);
      const matchDesc = (store.bio || "").toLowerCase().includes(query);
      const matchAddr = (store.address || "").toLowerCase().includes(query);
      if (!matchName && !matchDesc && !matchAddr) return false;
    }
    return true;
  });

  return (
    <div className="min-h-[100dvh] bg-brand text-ink pb-28 select-none relative overflow-x-hidden w-full">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <ContinuousWave pageIndex={2} />
        <PaperBackgroundExtender />
      </div>

      {/* ============ HERO SECTION ============ */}
      <section className="bg-transparent text-paper pt-10 md:pt-14 pb-12 md:pb-16 px-4 md:px-8 relative overflow-hidden z-10">
        <ArcTopRight
          className="pointer-events-none absolute -right-16 -top-16 z-0 opacity-15"
          style={{ width: "clamp(18rem, 40vw, 32rem)" }}
          fill="var(--color-wave)"
        />

        <div className="max-w-7xl mx-auto relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3.5 py-1 text-[11px] font-semibold text-wave backdrop-blur-md border border-white/15">
            <Store className="w-3.5 h-3.5 text-wave" />
            <span className="tracking-wider uppercase">DANH BẠ XƯỞNG CHẾ TÁC VIỆT</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <h1 className="display text-3xl md:text-5xl normal-case font-medium leading-tight text-paper">
                Không gian nghệ nhân & Local Brand
              </h1>
              <p className="text-xs md:text-sm text-white/85 max-w-xl leading-relaxed">
                Khám phá những xưởng gốm, xưởng may thủ công, studio thiết kế và xưởng trang sức độc lập khắp các thành phố.
              </p>
            </div>

            <div className="text-xs text-white/75 bg-black/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shrink-0">
              Hiện có <strong className="text-wave font-bold text-base">{stores.length}</strong> xưởng đăng ký hoạt động
            </div>
          </div>
        </div>

        {/* Negative Transition Seam removed */}
      </section>

      <div data-surface="light" className="max-w-7xl mx-auto px-4 md:px-8 mt-2 space-y-6 relative z-10">

        {/* Breadcrumbs */}
        <nav className="text-[11px] text-ink/60 flex items-center gap-1.5 font-medium">
          <Link to="/" viewTransition className="hover:text-brand transition-colors">Trang chủ</Link>
          <span>›</span>
          <span className="text-ink font-semibold">Danh bạ xưởng</span>
        </nav>

        {/* DOUBLE-BEZEL DISTRICT HUBS FILTER (§4.3) */}
        <div className="p-1.5 rounded-[2rem] bg-black/5 ring-1 ring-black/5">
          <div className="rounded-[1.625rem] bg-paper p-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
            {DISTRICT_HUBS.map((hub) => {
              const isActive = selectedHub === hub;
              return (
                <button
                  key={hub}
                  onClick={() => handleHubSelect(hub)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center gap-1.5 ${
                    isActive
                      ? "bg-brand text-paper shadow-md shadow-brand/20 scale-[1.02]"
                      : "text-ink/75 hover:text-ink hover:bg-black/5"
                  }`}
                >
                  <MapPin className="w-3 h-3 opacity-60" />
                  <span>{hub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Counter Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <span className="text-xs text-ink/60 font-medium">
            Hiển thị <strong className="text-ink font-bold">{filteredStores.length}</strong> xưởng thủ công
          </span>

          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên xưởng, phong cách..."
              className="w-full bg-paper border border-ink/10 rounded-full pl-9 pr-4 py-2 text-xs text-ink focus:outline-none focus:border-brand shadow-xs"
            />
          </div>
        </div>

        {/* ============ DOUBLE-BEZEL ATELIER CARDS GRID ============ */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-2 rounded-[2.5rem] bg-black/5">
                <div className="rounded-[2.125rem] bg-paper p-5 space-y-4 animate-pulse">
                  <div className="aspect-[16/9] rounded-2xl bg-paper-warm" />
                  <div className="h-4 w-1/2 bg-paper-warm rounded" />
                  <div className="h-3 w-3/4 bg-paper-warm rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="max-w-md mx-auto my-12 p-2 rounded-[2.5rem] bg-black/5">
            <div className="bg-paper rounded-[2.125rem] p-8 text-center space-y-3">
              <Store className="w-10 h-10 text-brand mx-auto opacity-40" />
              <h3 className="display text-xl font-medium">Không tìm thấy xưởng phù hợp</h3>
              <p className="text-xs text-ink/60">Thử tìm kiếm với khu vực hoặc từ khoá khác nhé.</p>
              <button
                onClick={() => { setSelectedHub("Tất cả khu vực"); setSearchQuery(""); }}
                className="px-5 py-2 rounded-full bg-brand text-paper text-xs font-semibold"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {filteredStores.map((store) => {
              const storeProducts = products.filter(p => p.storeId === store.id).slice(0, 3);
              const mapUrl = store.address
                ? store.address.startsWith("http")
                  ? store.address
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`
                : null;

              return (
                <div
                  key={store.id}
                  className="rev hover-elastic p-1.5 rounded-[2.25rem] bg-black/5 ring-1 ring-black/5 hover:ring-brand/40 group flex flex-col cursor-pointer"
                >
                  <div className="rounded-[1.875rem] bg-paper p-5 flex flex-col justify-between h-full space-y-4 border border-ink/5 overflow-hidden">
                    
                    {/* Atelier Cover Banner Viewport with Shared View Transition Name */}
                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-paper-warm">
                      <img
                        src={store.coverUrl || store.logoUrl || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600"}
                        alt={store.name}
                        referrerPolicy="no-referrer"
                        style={{ viewTransitionName: vtShopCover(store.id) }}
                        className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110"
                      />

                      {/* Studio Logo Seal Overlay */}
                      <div className="absolute bottom-3 left-3 p-1 rounded-full bg-paper/95 backdrop-blur-md shadow-md">
                        <img
                          src={store.logoUrl || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=80"}
                          alt={`${store.name} logo`}
                          referrerPolicy="no-referrer"
                          style={{ viewTransitionName: vtShopLogo(store.id) }}
                          className="w-10 h-10 rounded-full object-cover border border-ink/10"
                        />
                      </div>

                      {/* Verification Badge */}
                      <div className="absolute top-3 right-3 bg-brand/90 backdrop-blur-md text-paper text-[10px] font-semibold px-2.5 py-1 rounded-full border border-white/15 shadow-xs flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-wave" />
                        <span>Tí Verified</span>
                      </div>
                    </div>

                    {/* Atelier Identity & Story */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <Link 
                          to={`/stores/${store.id}`}
                          viewTransition
                          className="font-medium text-lg text-ink group-hover:text-brand transition-colors line-clamp-1"
                        >
                          {store.name}
                        </Link>
                      </div>

                      <p className="text-xs text-ink/70 line-clamp-2 leading-relaxed italic">
                        "{store.bio || "Không gian chế tác thủ công độc lập."}"
                      </p>

                      {store.address && (
                        <div className="flex items-center justify-between text-[11px] text-ink/60 pt-1">
                          <span className="truncate max-w-[200px] flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-brand shrink-0" />
                            <span>{store.address}</span>
                          </span>

                          {mapUrl && (
                            <a
                              href={mapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand hover:underline font-semibold flex items-center gap-0.5 shrink-0"
                            >
                              <span>Mở bản đồ</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Featured Wares Preview Tray */}
                    {storeProducts.length > 0 && (
                      <div className="pt-3 border-t border-ink/5 space-y-1.5">
                        <span className="label text-ink/50 text-[9px] block">TÁC PHẨM TIÊU BIỂU TỪ XƯỞNG:</span>
                        <div className="grid grid-cols-3 gap-2">
                          {storeProducts.map((prod) => (
                            <Link
                              key={prod.id}
                              to={`/products/${prod.id}`}
                              viewTransition
                              className="aspect-square rounded-xl overflow-hidden bg-paper-warm border border-ink/5 hover:border-brand transition-all block group/thumb"
                            >
                              <img
                                src={prod.images?.[0]}
                                alt={prod.name}
                                referrerPolicy="no-referrer"
                                style={{ viewTransitionName: vtProductImage(prod.id) }}
                                className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300"
                              />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Button-in-Button CTA */}
                    <div className="pt-2">
                      <Link
                        to={`/stores/${store.id}`}
                        viewTransition
                        className="group/btn w-full py-2.5 px-5 rounded-full bg-paper-warm hover:bg-brand text-ink hover:text-paper text-xs font-semibold transition-all duration-300 flex items-center justify-between border border-ink/10 shadow-xs"
                      >
                        <span>Ghé thăm xưởng</span>
                        <div className="w-6 h-6 rounded-full bg-black/5 group-hover/btn:bg-white/20 flex items-center justify-center transition-transform group-hover/btn:translate-x-1">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </Link>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ============ FLOW F: MAKER RECRUITMENT BANNER ============ */}
        <div className="p-2 rounded-[2.5rem] bg-brand text-paper mt-16 relative overflow-hidden shadow-2xl">
          <RibbonLoop
            className="pointer-events-none absolute -right-12 -bottom-12 z-0 opacity-15"
            style={{ width: "20rem" }}
            ribbon="var(--color-wave)"
            dot="var(--color-paper)"
          />

          <div className="bg-brand-deep/60 backdrop-blur-md rounded-[2.125rem] p-8 md:p-12 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/10">
            <div className="max-w-xl space-y-2">
              <span className="label text-wave text-xs font-semibold block">DÀNH CHO NGHỆ NHÂN & LOCAL BRAND</span>
              <h2 className="display text-2xl md:text-4xl normal-case font-medium text-paper leading-snug">
                Bạn sở hữu xưởng chế tác thủ công?
              </h2>
              <p className="text-xs md:text-sm text-white/80 leading-relaxed">
                Đăng ký gian trưng bày trên Tí Coolture hoàn toàn miễn phí. Tiếp cận cộng đồng yêu nghệ thuật thủ công và kết nối trực tiếp khách hàng về mạng xã hội của xưởng.
              </p>
            </div>

            <Link
              to="/auth-gateway"
              viewTransition
              className="group inline-flex items-center gap-3 rounded-full bg-paper pl-6 pr-2 py-2.5 text-brand label font-semibold hover:bg-wave hover:text-ink transition-all duration-300 shrink-0 shadow-lg"
            >
              <span>Đăng ký mở xưởng</span>
              <div className="w-8 h-8 rounded-full bg-brand/10 group-hover:bg-ink group-hover:text-wave flex items-center justify-center transition-all group-hover:translate-x-1">
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
