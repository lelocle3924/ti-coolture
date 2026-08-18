import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  Heart, Sparkles, MapPin, Check, Copy, ExternalLink, 
  ChevronRight, ArrowLeft, MessageCircle, AlertCircle, Maximize2, X, ShieldCheck
} from "lucide-react";
import { 
  fetchProductById, fetchStoreById, fetchProductsStore, 
  incrementProductClick, toggleWishlist, saveWishlistNote, triggerWebhook
} from "../lib/dbService";
import { Product, StoreProfile } from "../types";
import { useAuth } from "../lib/useAuth";
import { ArcTopRight, RibbonLoop } from "../components/BrandShapes";
import { vtProductImage, vtShopLogo } from "../lib/viewTransitions";

const formatPrice = (value: number) =>
  value > 0 ? `${value.toLocaleString("vi-VN")}₫` : "Liên hệ";

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const { user, profile, refreshProfile } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Wishlist & Note state (Flow E §4.3)
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistToast, setWishlistToast] = useState(false);
  const [customNote, setCustomNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Social Inquiry & Auto-Copy Modal (Flow A & §2.1 & wireframe M7)
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [selectedSocial, setSelectedSocial] = useState<{ platform: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!productId) return;
      setLoading(true);
      const prod = await fetchProductById(productId);
      if (prod) {
        setProduct(prod);

        const storeData = await fetchStoreById(prod.storeId);
        setStore(storeData);

        const storeProds = await fetchProductsStore(prod.storeId);
        setRelatedProducts(storeProds.filter(p => p.id !== prod.id).slice(0, 4));
      }
      setLoading(false);
    }
    loadData();
  }, [productId]);

  useEffect(() => {
    if (product && profile) {
      setIsWishlisted(profile.wishlist.includes(product.id));
      setCustomNote(profile.wishlistNotes?.[product.id] || "");
    }
  }, [product, profile]);

  const handleToggleWishlist = async () => {
    if (!product) return;
    const effectiveUserId = user?.uid || "guest_user";
    const nextList = await toggleWishlist(effectiveUserId, product.id);
    await refreshProfile();
    const isNow = nextList.includes(product.id);
    setIsWishlisted(isNow);
    if (isNow) {
      setWishlistToast(true);
      setTimeout(() => setWishlistToast(false), 3000);
    }
  };

  const handleSaveNote = async () => {
    if (!product) return;
    const effectiveUserId = user?.uid || "guest_user";
    setSavingNote(true);
    await saveWishlistNote(effectiveUserId, product.id, customNote);
    await refreshProfile();
    setSavingNote(false);
    setWishlistToast(true);
    setTimeout(() => setWishlistToast(false), 2500);
  };

  const generateInquiryMessage = (prod: Product, storeName: string) => {
    return `Chào ${storeName}! Mình thấy tác phẩm "${prod.name}" (mã: ${prod.id}) trên nền tảng Tí Coolture (https://ticoolture.vn/products/${prod.id}) và rất ấn tượng. Sản phẩm này hiện còn sẵn không ạ? Mình muốn được tư vấn thêm về đặt hàng. Cảm ơn shop!`;
  };

  const handleOpenSocialInquiry = (platform: string, rawUrl: string) => {
    if (!product) return;
    incrementProductClick(product.id);
    triggerWebhook("SOCIAL_OUTBOUND_CLICK", {
      productId: product.id,
      productName: product.name,
      storeId: product.storeId,
      platform,
      timestamp: new Date().toISOString()
    });

    let targetUrl = rawUrl;
    if (!targetUrl.startsWith("http")) {
      targetUrl = `https://${targetUrl}`;
    }
    const utmParam = targetUrl.includes("?") ? `&utm_source=ticoolture&utm_medium=product_detail` : `?utm_source=ticoolture&utm_medium=product_detail`;
    targetUrl = `${targetUrl}${utmParam}`;

    setSelectedSocial({ platform, url: targetUrl });
    setCopied(false);
    setCopyModalOpen(true);
  };

  const handleCopyAndLaunch = () => {
    if (!product || !selectedSocial) return;
    const msg = generateInquiryMessage(product, store?.name || "shop");
    navigator.clipboard.writeText(msg).then(() => {
      setCopied(true);
      setTimeout(() => {
        window.open(selectedSocial.url, "_blank", "noopener,noreferrer");
        setCopyModalOpen(false);
      }, 600);
    }).catch(() => {
      window.open(selectedSocial.url, "_blank", "noopener,noreferrer");
      setCopyModalOpen(false);
    });
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-paper-warm text-ink p-8 flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-3 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-ink/60">Đang chuẩn bị không gian tác phẩm...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[100dvh] bg-paper-warm text-ink p-8 flex items-center justify-center">
        <div className="max-w-md bg-paper p-8 rounded-3xl border border-ink/10 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-10 h-10 text-brand mx-auto" />
          <h2 className="display text-xl font-medium">Không tìm thấy tác phẩm</h2>
          <p className="text-xs text-ink/60">Tác phẩm này có thể đã được gỡ hoặc đường dẫn không còn chính xác.</p>
          <Link to="/products" viewTransition className="inline-block px-5 py-2.5 rounded-full bg-brand text-paper text-xs font-semibold">
            Về danh mục tác phẩm
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : ["https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800"];

  const activeImage = images[activeImageIndex] || images[0];

  return (
    <div className="min-h-[100dvh] bg-paper-warm text-ink pb-36 select-none relative">
      
      {/* Scroll Reading Progress Bar (§D1 Wireframe Spec) */}
      <div className="scroll-prog" />

      {/* ============ FLOW E: WISHLIST TOAST ============ */}
      {wishlistToast && (
        <div className="fixed bottom-24 md:bottom-8 right-6 z-50 bg-brand text-paper px-4 py-3 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3 animate-fade-in backdrop-blur-md">
          <div className="w-7 h-7 rounded-full bg-wave text-ink grid place-items-center shrink-0 font-bold">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <div>
            <p className="text-xs font-semibold">Đã cập nhật Wishlist!</p>
            <p className="text-[11px] text-white/80">Lưu trữ trên thiết bị này.</p>
          </div>
        </div>
      )}

      {/* ============ LIGHTBOX MODAL ============ */}
      {lightboxOpen && (
        <div 
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
        >
          <button 
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 text-paper hover:text-wave transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={activeImage}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}

      {/* ============ AUTO-COPY MESSAGE MODAL ============ */}
      {copyModalOpen && selectedSocial && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="p-2 rounded-[2.5rem] bg-black/10 ring-1 ring-black/10 max-w-lg w-full">
            <div className="bg-paper rounded-[2.125rem] border border-ink/10 p-6 md:p-8 shadow-2xl space-y-5 animate-scale-up">
              
              <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-brand" />
                  <h3 className="font-semibold text-sm text-ink">Tin nhắn soạn sẵn cho {store?.name}</h3>
                </div>
                <button 
                  onClick={() => setCopyModalOpen(false)}
                  className="text-ink/50 hover:text-ink transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-ink/70 leading-relaxed">
                Tí đã chuẩn bị sẵn mẫu tin nhắn kèm link sản phẩm để bạn gửi trực tiếp qua <strong>{selectedSocial.platform}</strong>:
              </p>

              <div className="bg-paper-warm border border-ink/10 rounded-2xl p-4 text-xs font-mono text-ink/80 leading-relaxed max-h-40 overflow-y-auto">
                {generateInquiryMessage(product, store?.name || "shop")}
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  onClick={handleCopyAndLaunch}
                  className="flex-1 py-3 px-5 rounded-full bg-brand text-paper text-xs font-semibold hover:bg-brand-deep transition-all duration-300 flex items-center justify-center gap-2 shadow-md shadow-brand/20"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-wave stroke-[3]" />
                      <span>Đã chép! Đang mở {selectedSocial.platform}...</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Sao chép & Mở {selectedSocial.platform} ↗</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    window.open(selectedSocial.url, "_blank", "noopener,noreferrer");
                    setCopyModalOpen(false);
                  }}
                  className="py-3 px-4 rounded-full bg-paper-warm text-ink/70 hover:text-ink text-xs font-medium transition-colors"
                >
                  Mở không cần chép
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ============ BREADCRUMB TRAIL ============ */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
        <nav className="text-[11px] text-ink/60 flex flex-wrap items-center gap-1.5 font-medium">
          <Link to="/" viewTransition className="hover:text-brand transition-colors">Trang chủ</Link>
          <span>›</span>
          <Link to="/products" viewTransition className="hover:text-brand transition-colors">Tác phẩm</Link>
          <span>›</span>
          <Link to={`/products?category=${encodeURIComponent(product.category)}`} viewTransition className="hover:text-brand transition-colors">{product.category}</Link>
          <span>›</span>
          <span className="text-ink font-semibold truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      {/* ============ EXHIBITION WORKSPACE ============ */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* LEFT COLUMN: DOUBLE-BEZEL MULTI-IMAGE VIEWPORT */}
        <section className="lg:col-span-7 space-y-4">
          
          <div className="p-2 rounded-[2.5rem] bg-black/5 ring-1 ring-black/5 shadow-inner">
            <div className="relative aspect-square bg-paper rounded-[2.125rem] border border-ink/5 overflow-hidden group shadow-sm">
              <img
                src={activeImage}
                alt={product.name}
                referrerPolicy="no-referrer"
                style={{ viewTransitionName: vtProductImage(product.id) }}
                className="zoomout w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
              />

              <button
                onClick={() => setLightboxOpen(true)}
                aria-label="Phóng to ảnh"
                className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-paper/90 backdrop-blur-md text-ink grid place-items-center shadow-lg hover:bg-brand hover:text-paper transition-all opacity-0 group-hover:opacity-100"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              <div className="absolute top-4 left-4 bg-paper/90 backdrop-blur-md text-ink text-xs font-semibold px-3.5 py-1.5 rounded-full border border-ink/5 shadow-xs">
                {product.category}
              </div>
            </div>
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-18 h-18 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                    activeImageIndex === idx 
                      ? "border-brand shadow-md scale-105" 
                      : "border-ink/10 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Double-Bezel Story & Philosophy Quote Block */}
          {product.story && (
            <div className="p-1.5 rounded-[2rem] bg-black/5 ring-1 ring-black/5 mt-6">
              <div className="bg-paper rounded-[1.625rem] p-6 md:p-8 relative overflow-hidden space-y-3">
                <RibbonLoop
                  className="pointer-events-none absolute -right-6 -bottom-6 z-0 opacity-10"
                  style={{ width: "12rem" }}
                  ribbon="var(--color-wave)"
                  dot="var(--color-paper)"
                />
                <span className="label text-wave-ink font-semibold text-xs block">
                  ✦ CÂU CHUYỆN SÁNG TÁC
                </span>
                <blockquote className="text-xs md:text-sm text-ink/80 italic leading-relaxed relative z-10">
                  "{product.story}"
                </blockquote>
              </div>
            </div>
          )}

        </section>

        {/* RIGHT COLUMN: ARTWORK DETAILS & SOCIAL ORDERING */}
        <section className="lg:col-span-5 space-y-6">
          
          <div className="p-2 rounded-[2.5rem] bg-black/5 ring-1 ring-black/5">
            <div className="bg-paper rounded-[2.125rem] p-6 md:p-8 space-y-6 shadow-sm border border-ink/5">
              
              {/* Atelier Link & Identity */}
              <div className="flex items-center justify-between border-b border-ink/10 pb-4">
                <Link 
                  to={`/stores/${product.storeId}`}
                  viewTransition
                  className="group flex items-center gap-3 hover:opacity-85 transition-opacity"
                >
                  <img
                    src={product.storeLogo || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=80"}
                    alt={product.storeName}
                    referrerPolicy="no-referrer"
                    style={{ viewTransitionName: vtShopLogo(product.storeId) }}
                    className="w-11 h-11 rounded-full border border-ink/10 object-cover shadow-xs"
                  />
                  <div>
                    <span className="label text-wave-ink text-[10px] font-semibold block">XƯỞNG CHẾ TÁC</span>
                    <p className="font-semibold text-sm text-ink group-hover:text-brand transition-colors flex items-center gap-1">
                      <span>{product.storeName}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-ink/40 group-hover:translate-x-0.5 transition-transform" />
                    </p>
                  </div>
                </Link>

                {/* Wishlist toggle */}
                <button
                  onClick={handleToggleWishlist}
                  aria-label="Lưu vào wishlist"
                  className={`w-11 h-11 rounded-full grid place-items-center transition-all duration-300 ${
                    isWishlisted 
                      ? "bg-brand text-wave shadow-md scale-105" 
                      : "bg-paper-warm text-ink/60 hover:text-brand hover:scale-105"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? "fill-wave stroke-wave" : ""}`} />
                </button>
              </div>

              {/* Title & Price */}
              <div className="space-y-2">
                <h1 className="display text-2xl md:text-3xl normal-case font-medium text-ink leading-snug">
                  {product.name}
                </h1>
                
                <div className="flex items-baseline gap-3">
                  <span className="font-bold text-2xl md:text-3xl text-brand">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-xs text-ink/60 font-medium">
                    (Giá tham khảo trực tiếp từ xưởng)
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="text-xs md:text-sm text-ink/75 leading-relaxed space-y-2">
                <p>{product.description || "Tác phẩm thủ công độc bản được hoàn thiện tinh xảo bởi nghệ nhân địa phương."}</p>
              </div>

              {/* Curious Specs Matrix */}
              <div className="bg-paper-warm rounded-2xl p-4 space-y-2.5 text-xs border border-ink/5">
                <div className="flex items-center justify-between border-b border-ink/5 pb-1.5">
                  <span className="text-ink/60">Chất liệu:</span>
                  <span className="font-semibold text-ink">{product.material || "Chế tác thủ công"}</span>
                </div>
                <div className="flex items-center justify-between border-b border-ink/5 pb-1.5">
                  <span className="text-ink/60">Kích thước:</span>
                  <span className="font-semibold text-ink">{product.size || "Tiêu chuẩn xưởng"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink/60">Xuất xứ xưởng:</span>
                  <span className="font-semibold text-ink">{store?.address || "Việt Nam"}</span>
                </div>
              </div>

              {/* DESKTOP BUTTON-IN-BUTTON SOCIAL ORDERING */}
              <div className="pt-2 space-y-3">
                <span className="label text-ink/70 text-[10px] block font-semibold uppercase tracking-wider">
                  ĐẶT HÀNG TRỰC TIẾP QUA KÊNH CỦA XƯỞNG:
                </span>

                {store?.socials && Object.values(store.socials).some(Boolean) ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    {store.socials.instagram && (
                      <button
                        onClick={() => handleOpenSocialInquiry("Instagram", store.socials.instagram!)}
                        className="group w-full py-3 px-4 rounded-full bg-paper-warm hover:bg-brand hover:text-paper text-ink text-xs font-semibold transition-all duration-300 border border-ink/10 flex items-center justify-between shadow-xs"
                      >
                        <span>Instagram</span>
                        <div className="w-6 h-6 rounded-full bg-black/5 group-hover:bg-white/20 flex items-center justify-center transition-transform group-hover:scale-110">
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      </button>
                    )}
                    {store.socials.tiktok && (
                      <button
                        onClick={() => handleOpenSocialInquiry("TikTok", store.socials.tiktok!)}
                        className="group w-full py-3 px-4 rounded-full bg-paper-warm hover:bg-brand hover:text-paper text-ink text-xs font-semibold transition-all duration-300 border border-ink/10 flex items-center justify-between shadow-xs"
                      >
                        <span>TikTok</span>
                        <div className="w-6 h-6 rounded-full bg-black/5 group-hover:bg-white/20 flex items-center justify-center transition-transform group-hover:scale-110">
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      </button>
                    )}
                    {store.socials.facebook && (
                      <button
                        onClick={() => handleOpenSocialInquiry("Facebook", store.socials.facebook!)}
                        className="group w-full py-3 px-4 rounded-full bg-paper-warm hover:bg-brand hover:text-paper text-ink text-xs font-semibold transition-all duration-300 border border-ink/10 flex items-center justify-between shadow-xs"
                      >
                        <span>Facebook</span>
                        <div className="w-6 h-6 rounded-full bg-black/5 group-hover:bg-white/20 flex items-center justify-center transition-transform group-hover:scale-110">
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      </button>
                    )}
                    {store.socials.threads && (
                      <button
                        onClick={() => handleOpenSocialInquiry("Threads", store.socials.threads!)}
                        className="group w-full py-3 px-4 rounded-full bg-paper-warm hover:bg-brand hover:text-paper text-ink text-xs font-semibold transition-all duration-300 border border-ink/10 flex items-center justify-between shadow-xs"
                      >
                        <span>Threads</span>
                        <div className="w-6 h-6 rounded-full bg-black/5 group-hover:bg-white/20 flex items-center justify-center transition-transform group-hover:scale-110">
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenSocialInquiry("Instagram", "https://instagram.com")}
                    className="w-full py-3.5 rounded-full bg-brand text-paper text-xs font-semibold hover:bg-brand-deep transition-all duration-300 flex items-center justify-center gap-2 shadow-md shadow-brand/20"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Liên hệ xưởng chế tác để đặt hàng</span>
                  </button>
                )}

                <p className="text-[11px] text-ink/50 text-center">
                  ⓘ Tí Coolture không can thiệp thanh toán. Toàn bộ tiền về trực tiếp nghệ nhân.
                </p>
              </div>

              {/* Custom Notes Section (Flow E) */}
              <div className="pt-4 border-t border-ink/10 space-y-2">
                <label className="label text-ink/70 text-[10px] block font-semibold">
                  📝 Ghi chú cá nhân cho tác phẩm này (chỉ lưu trên máy bạn):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="VD: Mua tặng sinh nhật An vào tháng 9..."
                    className="flex-1 bg-paper-warm border border-ink/10 rounded-full px-4 py-2 text-xs text-ink focus:outline-none focus:border-brand"
                  />
                  <button
                    onClick={handleSaveNote}
                    disabled={savingNote}
                    className="px-5 py-2 rounded-full bg-brand text-paper text-xs font-semibold hover:bg-brand-deep transition-all shrink-0 shadow-sm"
                  >
                    {savingNote ? "..." : "Lưu"}
                  </button>
                </div>
              </div>

            </div>
          </div>

        </section>

      </main>

      {/* ============ RELATED ARTWORKS SECTION ============ */}
      {relatedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 mt-20 space-y-6">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <div>
              <span className="label text-wave-ink text-[10px] font-semibold block">CÙNG KHÔNG GIAN SÁNG TẠO</span>
              <h2 className="display text-2xl font-medium text-ink normal-case">
                Tác phẩm khác của xưởng {store?.name}
              </h2>
            </div>
            <Link
              to={`/stores/${product.storeId}`}
              viewTransition
              className="text-xs text-brand font-semibold hover:underline flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {relatedProducts.map(rel => (
              <div key={rel.id} className="rev hover-elastic p-1.5 rounded-[2rem] bg-black/5 ring-1 ring-black/5 hover:ring-brand/40 cursor-pointer">
                <Link
                  to={`/products/${rel.id}`}
                  viewTransition
                  className="group bg-paper rounded-[1.625rem] overflow-hidden flex flex-col justify-between h-full border border-ink/5"
                >
                  <div className="aspect-square bg-paper-warm overflow-hidden">
                    <img
                      src={rel.images?.[0] || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400"}
                      alt={rel.name}
                      referrerPolicy="no-referrer"
                      style={{ viewTransitionName: vtProductImage(rel.id) }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4 space-y-1">
                    <h4 className="font-medium text-xs text-ink group-hover:text-brand transition-colors truncate">
                      {rel.name}
                    </h4>
                    <p className="font-bold text-xs text-brand">
                      {formatPrice(rel.price)}
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ MOBILE STICKY ORDER NOW BAR ============ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper/95 backdrop-blur-md border-t border-ink/10 p-3 px-4 flex items-center justify-between gap-3 shadow-[0_-8px_25px_rgba(0,0,0,0.1)]">
        
        <button
          onClick={handleToggleWishlist}
          aria-label="Lưu vào wishlist"
          className={`w-12 h-12 rounded-full grid place-items-center shrink-0 border transition-all ${
            isWishlisted 
              ? "bg-brand text-wave border-brand shadow-md" 
              : "bg-paper-warm text-ink/70 border-ink/10"
          }`}
        >
          <Heart className={`w-5 h-5 ${isWishlisted ? "fill-wave stroke-wave" : ""}`} />
        </button>

        <button
          onClick={() => {
            const firstSocial = store?.socials?.instagram 
              ? { platform: "Instagram", url: store.socials.instagram }
              : store?.socials?.tiktok 
              ? { platform: "TikTok", url: store.socials.tiktok }
              : store?.socials?.facebook 
              ? { platform: "Facebook", url: store.socials.facebook }
              : { platform: "Instagram", url: "https://instagram.com" };
            handleOpenSocialInquiry(firstSocial.platform, firstSocial.url);
          }}
          className="flex-1 min-h-12 rounded-full bg-brand text-paper text-xs font-semibold label hover:bg-brand-deep transition-all shadow-md shadow-brand/20 flex items-center justify-center gap-2"
        >
          <span>ORDER NOW ▸ Nhắn xưởng {formatPrice(product.price)}</span>
        </button>

      </div>

    </div>
  );
}
