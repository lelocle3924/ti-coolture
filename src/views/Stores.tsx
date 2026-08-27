import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Store, ArrowRight, ArrowUpRight, Search } from "lucide-react";
import { fetchStores, fetchProducts } from "../lib/dbService";
import { StoreProfile, Product } from "../types";
import { ArcTopRight, RibbonLoop, WaveStores } from "../components/BrandShapes";
import Breadcrumbs from "../components/Breadcrumbs";
import { vtShopLogo, vtShopCover, vtProductImage } from "../lib/viewTransitions";

export default function Stores() {
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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

  const filteredStores = stores.filter(store => {
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
    /* Same reason as /products: the negative margin belongs on the clipping
       element, so the violet reaches y=0 and the header pill floats on it
       instead of on the shell's ink. */
    <div className="min-h-[100dvh] -mt-24 bg-paper text-ink pb-28 select-none relative overflow-x-hidden w-full md:-mt-28">

      {/* ============ HERO ============
          Team 26/08: "distinct from /products, yet still united in design
          language. Use the brand identity elements more heavily."

          United: violet band from y=0, one title, a wave seam into paper,
          breadcrumb below it on the paper.

          Distinct: /products is centred and quiet with a single arc. This one
          is off-axis — the title sits left and the marks do the composing.
          The ribbon (the boat's line, the mark the guidelines call the
          brand's own gesture) runs large off the right edge, the arc closes
          the bottom-left, and the seam is WaveStores' double ripple rather
          than the products swell. */}
      <section data-surface="dark" className="relative z-10 overflow-hidden bg-brand text-paper">
        <RibbonLoop
          className="pointer-events-none absolute -right-24 -top-16 z-0 opacity-20"
          style={{ width: "clamp(20rem, 44vw, 38rem)" }}
          ribbon="var(--color-wave)"
          dot="var(--color-paper)"
        />
        <ArcTopRight
          className="pointer-events-none absolute -left-24 -bottom-24 z-0 rotate-180 opacity-15"
          style={{ width: "clamp(14rem, 28vw, 22rem)" }}
          fill="var(--color-paper)"
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-4 md:px-8 md:pt-28 md:pb-6">
          {/* leading-[1.25] rather than .display's 1.02 — see index.css on
              how far Vietnamese uppercase reaches in DFVN. */}
          <h1 className="display max-w-3xl text-4xl normal-case font-medium leading-[1.25] text-paper md:text-6xl">
            Các bạn đồng hành
          </h1>
        </div>

        <div className="relative z-10 -mb-px h-[clamp(2.5rem,5vw,4.5rem)] overflow-hidden">
          <WaveStores className="absolute inset-x-0 bottom-0" fill="var(--color-paper)" />
        </div>
      </section>

      <div data-surface="light" className="max-w-7xl mx-auto px-4 md:px-8 mt-2 space-y-6 relative z-10">

        <Breadcrumbs
          trail={[{ label: "Trang chủ", to: "/" }, { label: "Các bạn đồng hành" }]}
        />

        {/* Search only. The district-hub filter strip came out on 26/08
            ("Remove filters for stores"); search stays, because it is how you
            find a shop by name rather than how you narrow a list. */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              <div
                key={i}
                className="rounded-[1.875rem] border border-ink/10 bg-paper p-5 space-y-4 animate-pulse"
              >
                <div className="aspect-[16/9] rounded-2xl bg-paper-warm" />
                <div className="h-4 w-1/2 bg-paper-warm rounded" />
                <div className="h-3 w-3/4 bg-paper-warm rounded" />
              </div>
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="max-w-md mx-auto my-12 rounded-[1.875rem] border border-ink/10 bg-paper p-8 text-center space-y-3">
            <Store className="w-10 h-10 text-brand mx-auto opacity-40" />
            <h3 className="display text-xl font-medium">Không tìm thấy xưởng phù hợp</h3>
            <p className="text-xs text-ink/60">Thử tìm với từ khoá khác nhé.</p>
            <button
              onClick={() => setSearchQuery("")}
              className="px-5 py-2 rounded-full bg-brand text-paper text-xs font-semibold"
            >
              Xoá tìm kiếm
            </button>
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
                /* One border, not two (26/08). Was a bg-black/5 bezel with a
                   ring wrapped around a card that also had its own border —
                   three edges reading as two. */
                <div
                  key={store.id}
                  className="rev hover-elastic rounded-[1.875rem] bg-paper p-5 flex flex-col justify-between h-full space-y-4 border border-ink/10 hover:border-brand/40 group cursor-pointer overflow-hidden"
                >

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

                      {/* "Tí Verified" badge removed 26/08 — every shop on the
                          page is vetted, so a badge on all of them said
                          nothing and only crowded the cover. */}
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
