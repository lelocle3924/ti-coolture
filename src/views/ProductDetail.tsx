import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  fetchProductById, 
  triggerWebhook, 
  toggleWishlist, 
  saveWishlistNote, 
  incrementProductView,
  fetchStoreById,
} from "../lib/dbService";
import { useAuth } from "../lib/useAuth";
import { Product, StoreProfile } from "../types";
import { 
  Heart, 
  FileText, 
  ChevronUp, 
  ChevronDown, 
  Send,
  Instagram, 
  Facebook, 
  MessageCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Sparkles
} from "lucide-react";

const formatPrice = (value: number) =>
  value > 0 ? `${value.toLocaleString("vi-VN")}₫` : "Liên hệ";

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isEnlarged, setIsEnlarged] = useState(false);

  const [isSaved, setIsSaved] = useState(false);
  const [wishlistNote, setWishlistNote] = useState("");
  const [savingCustomization, setSavingCustomization] = useState(false);
  const [customizationSavedMessage, setCustomizationSavedMessage] = useState(false);

  const [msgTemplate, setMsgTemplate] = useState("Chào bạn, mình thấy sản phẩm {product_name} trên Tí Coolture và muốn đặt mua.");
  const [socialPopup, setSocialPopup] = useState<{ platform: string; url: string } | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [wishlistCount, setWishlistCount] = useState<number>(0);

  useEffect(() => {
    async function loadProduct() {
      if (!productId) return;
      setLoading(true);
      const prodData = await fetchProductById(productId);
      if (prodData) {
        setProduct(prodData);
        incrementProductView(productId);
        
        const storeData = await fetchStoreById(prodData.storeId);
        if (storeData) {
          setStore(storeData);
        }
      }
      setLoading(false);
    }
    loadProduct();
  }, [productId]);

  useEffect(() => {
    if (profile && product) {
      const saved = profile.wishlist?.includes(product.id) || false;
      setIsSaved(saved);
      setWishlistNote(profile.wishlistNotes?.[product.id] || "");
    }
  }, [profile, product]);

  useEffect(() => {
    async function loadTemplate() {
      try {
        const { fetchMessageTemplate } = await import("../lib/dbService");
        const templateStr = await fetchMessageTemplate();
        setMsgTemplate(templateStr);
      } catch (err) {
        console.error("Error loading template: ", err);
      }
    }
    loadTemplate();
  }, []);

  const handleWishlistToggle = async () => {
    if (!user) {
      navigate("/auth-gateway");
      return;
    }
    if (!product) return;

    const newWishlist = await toggleWishlist(user.uid, product.id);
    setIsSaved(newWishlist.includes(product.id));
    await refreshProfile();

    triggerWebhook("WISHLIST_TOGGLED", {
      userId: user.uid,
      productId: product.id,
      savedState: newWishlist.includes(product.id),
      timestamp: new Date().toISOString()
    });
  };

  const handleSaveCustomizations = async () => {
    if (!user || !product) return;
    setSavingCustomization(true);
    
    await saveWishlistNote(user.uid, product.id, wishlistNote);
    await refreshProfile();
    
    setSavingCustomization(false);
    setCustomizationSavedMessage(true);
    setTimeout(() => setCustomizationSavedMessage(false), 3000);

    triggerWebhook("WISHLIST_CUSTOMIZATION_SAVED", {
      userId: user.uid,
      productId: product.id,
      note: wishlistNote,
      timestamp: new Date().toISOString()
    });
  };

  const getCompiledMessage = () => {
    if (!product) return "";
    return msgTemplate.replace(/{product_name}/g, product.name);
  };

  const handleSocialClick = async (platform: string, directUrl?: string) => {
    if (!product) return;
    const url = directUrl || "https://facebook.com";
    const compiled = getCompiledMessage();
    
    try {
      await navigator.clipboard.writeText(compiled);
      setCopiedSuccess(true);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      setCopiedSuccess(false);
    }

    setSocialPopup({ platform, url });

    triggerWebhook("ORDER_NOW_CLICKED", {
      userId: user?.uid || "anonymous",
      userEmail: user?.email || "anonymous",
      productId: product.id,
      productName: product.name,
      price: product.price,
      storeId: product.storeId,
      storeName: product.storeName,
      platform,
      url,
      timestamp: new Date().toISOString()
    });
  };

  const traverseGallery = (direction: "up" | "down") => {
    if (!product) return;
    const len = product.images.length;
    if (direction === "up") {
      setActiveImageIdx((prev) => (prev === 0 ? len - 1 : prev - 1));
    } else {
      setActiveImageIdx((prev) => (prev === len - 1 ? 0 : prev + 1));
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex justify-center items-center bg-paper-warm">
        <span className="text-sm font-medium animate-pulse text-brand">Đang tải tác phẩm...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-paper-warm p-8 text-center space-y-4">
        <h2 className="display text-2xl normal-case text-ink">Không tìm thấy sản phẩm</h2>
        <p className="text-sm text-ink/60">Tác phẩm này có thể đã được gỡ hoặc đang chờ kiểm duyệt.</p>
        <Link to="/" className="inline-flex items-center rounded-full bg-brand px-6 py-2.5 text-paper label hover:bg-brand-deep transition-all">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-warm text-ink p-4 md:p-8 pb-20 select-none space-y-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* 1. PRODUCT GALLERY (Left 7 columns) */}
        <div className="lg:col-span-7 bg-paper rounded-2xl border border-ink/10 p-4 md:p-6 flex flex-col md:flex-row gap-4 shadow-sm">
          {/* Thumbnails */}
          <div className="flex flex-row md:flex-col justify-start md:justify-between items-center gap-2 md:w-20 order-2 md:order-1">
            <button 
              onClick={() => traverseGallery("up")}
              className="p-2 rounded-lg text-ink/60 hover:text-ink hover:bg-paper-warm transition-colors hidden md:block"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
              {product.images.map((imgUrl, idx) => {
                const isActive = activeImageIdx === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-14 aspect-square rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                      isActive ? "border-brand ring-2 ring-brand/20 scale-105" : "border-ink/10 hover:border-ink/30"
                    }`}
                  >
                    <img 
                      src={imgUrl} 
                      alt={`${product.name} Thumbnail ${idx + 1}`} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                  </button>
                );
              })}
            </div>

            <button 
              onClick={() => traverseGallery("down")}
              className="p-2 rounded-lg text-ink/60 hover:text-ink hover:bg-paper-warm transition-colors hidden md:block"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Main big image */}
          <div 
            onClick={() => setIsEnlarged(true)}
            className="flex-1 aspect-square rounded-xl bg-paper-warm relative order-1 md:order-2 overflow-hidden cursor-zoom-in group border border-ink/5"
            title="Nhấn để phóng to ảnh"
          >
            <img 
              src={product.images[activeImageIdx]} 
              alt={product.name} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-ink/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="bg-paper/90 backdrop-blur-sm text-ink text-xs font-semibold px-3 py-1.5 rounded-full border border-ink/10 flex items-center gap-1.5 shadow-md">
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Xem ảnh lớn</span>
              </span>
            </div>
          </div>
        </div>

        {/* 2. ORDER NOW & DETAILS (Right 5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Info Card */}
          <div className="bg-paper rounded-2xl border border-ink/10 p-6 shadow-sm space-y-6">
            
            {/* Store link */}
            <div className="flex items-center space-x-3 border-b border-ink/5 pb-4">
              <Link to={`/stores/${product.storeId}`} className="shrink-0">
                <img 
                  src={product.storeLogo || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=100"} 
                  alt={product.storeName}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full border border-ink/10 object-cover hover:scale-105 transition-transform" 
                />
              </Link>
              <div>
                <span className="label text-wave-ink font-semibold block">Nghệ nhân / Local Brand</span>
                <Link 
                  to={`/stores/${product.storeId}`}
                  className="font-medium text-base text-ink hover:text-brand transition-colors block leading-tight"
                >
                  {product.storeName}
                </Link>
              </div>
            </div>

            {/* Product Meta */}
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-wave/20 px-3 py-0.5 text-xs font-semibold text-wave-ink">
                {product.category}
              </span>
              <div className="flex items-start justify-between gap-4">
                <h1 className="font-medium text-2xl md:text-3xl text-ink leading-tight flex-1">
                  {product.name}
                </h1>
                <button
                  onClick={handleWishlistToggle}
                  className={`p-2.5 rounded-full border transition-all shrink-0 ${
                    isSaved ? "bg-red-50 border-red-200 text-red-500" : "bg-paper-warm border-ink/10 text-ink/60 hover:text-red-500"
                  }`}
                  title={isSaved ? "Bỏ lưu khỏi danh sách" : "Lưu vào danh sách yêu thích"}
                >
                  <Heart className={`w-5 h-5 ${isSaved ? "fill-red-500" : ""}`} />
                </button>
              </div>
              <p className="text-2xl font-semibold text-brand tabular-nums">
                {formatPrice(product.price)}
              </p>
            </div>

            {/* Direct Social Ordering */}
            <div className="border-t border-ink/5 pt-5 space-y-3">
              <span className="label text-ink/70 font-semibold block">
                Liên hệ đặt mua trực tiếp
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSocialClick("Facebook", store?.socials.facebook)}
                  className="bg-[#1877f2] hover:bg-[#166fe5] text-paper rounded-xl p-3 text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-xs hover:scale-[1.02] active:scale-98"
                >
                  <Facebook className="w-4 h-4" />
                  <span>Facebook</span>
                </button>

                <button
                  onClick={() => handleSocialClick("Instagram", store?.socials.instagram)}
                  className="bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af] text-paper rounded-xl p-3 text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-xs hover:scale-[1.02] active:scale-98"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </button>

                <button
                  onClick={() => handleSocialClick("TikTok", store?.socials.tiktok)}
                  className="bg-ink hover:bg-ink/80 text-paper rounded-xl p-3 text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-xs hover:scale-[1.02] active:scale-98"
                >
                  <span>TikTok Shop</span>
                </button>

                <button
                  onClick={() => handleSocialClick("Threads", store?.socials.threads)}
                  className="bg-paper-warm hover:bg-ink/5 text-ink border border-ink/10 rounded-xl p-3 text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-xs hover:scale-[1.02] active:scale-98"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Threads</span>
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-ink/5 pt-4">
              <p className="text-xs md:text-sm text-ink/75 leading-relaxed">{product.description}</p>
            </div>

            {/* Specs */}
            <div className="border-t border-ink/5 pt-4 grid grid-cols-2 gap-3 text-xs">
              {product.material && (
                <div className="rounded-xl bg-paper-warm p-3 border border-ink/5">
                  <span className="label text-ink/50 text-[10px] block">Chất liệu</span>
                  <p className="font-semibold text-ink mt-0.5">{product.material}</p>
                </div>
              )}
              {product.size && (
                <div className="rounded-xl bg-paper-warm p-3 border border-ink/5">
                  <span className="label text-ink/50 text-[10px] block">Kích thước</span>
                  <p className="font-semibold text-ink mt-0.5">{product.size}</p>
                </div>
              )}
              {product.brand && (
                <div className="rounded-xl bg-paper-warm p-3 border border-ink/5 col-span-2">
                  <span className="label text-ink/50 text-[10px] block">Nguồn gốc thương hiệu</span>
                  <p className="font-semibold text-ink mt-0.5">{product.brand}</p>
                </div>
              )}
            </div>
          </div>

          {/* 3. WISHLIST NOTES */}
          <div className="bg-paper rounded-2xl border border-ink/10 p-6 shadow-sm space-y-4">
            <h3 className="label text-ink font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand" />
              <span>Ghi chú cá nhân</span>
            </h3>

            {!user ? (
              <div className="p-4 bg-paper-warm rounded-xl text-xs text-ink/70 text-center space-y-2">
                <p>Đăng nhập để viết ghi chú riêng cho món đồ này.</p>
                <Link to="/auth-gateway" className="inline-block font-semibold text-brand hover:underline">
                  Đăng nhập ngay →
                </Link>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {isSaved ? (
                  <div className="space-y-3">
                    <textarea
                      value={wishlistNote}
                      onChange={(e) => setWishlistNote(e.target.value)}
                      placeholder="Ví dụ: Phối với bàn ăn phòng khách, mua tặng sinh nhật..."
                      className="w-full rounded-xl border border-ink/10 p-3 text-xs bg-paper-warm focus:outline-none focus:ring-2 focus:ring-brand/20 h-20 leading-relaxed"
                    />
                    <button
                      onClick={handleSaveCustomizations}
                      disabled={savingCustomization}
                      className="w-full py-2.5 rounded-full bg-brand text-paper hover:bg-brand-deep text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{savingCustomization ? "Đang lưu..." : "Lưu ghi chú"}</span>
                    </button>
                    {customizationSavedMessage && (
                      <p className="text-xs text-emerald-600 text-center font-medium">
                        ✓ Đã lưu ghi chú thành công!
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-center py-2 text-ink/50 text-xs italic">
                    Nhấn biểu tượng trái tim ở trên để lưu sản phẩm và viết ghi chú.
                  </p>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Social Popup Modal */}
      {socialPopup && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-paper rounded-2xl border border-ink/10 p-6 w-full max-w-md shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="border-b border-ink/10 pb-3 text-left flex justify-between items-center">
              <h3 className="font-medium text-base text-ink">
                Kết nối với chủ tiệm
              </h3>
              <button 
                onClick={() => setSocialPopup(null)}
                className="p-1 rounded-lg text-ink/60 hover:text-ink hover:bg-paper-warm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-left text-xs text-ink/75 leading-relaxed">
              Tí đã soạn sẵn tin nhắn đặt hàng và <span className="font-semibold text-wave-ink">tự động sao chép vào bộ nhớ tạm</span>. Bạn chỉ cần dán vào khung chat khi mở {socialPopup.platform}!
            </p>

            <div className="bg-paper-warm rounded-xl border border-ink/5 p-3 text-left italic text-ink/80 text-xs break-words">
              "{getCompiledMessage()}"
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  window.open(socialPopup.url, "_blank", "noopener,noreferrer");
                  setSocialPopup(null);
                }}
                className="w-full rounded-full bg-brand text-paper hover:bg-brand-deep py-2.5 px-4 font-semibold text-xs transition-all shadow-md shadow-brand/20"
              >
                Mở {socialPopup.platform} & Dán tin nhắn
              </button>
              <button
                onClick={() => setSocialPopup(null)}
                className="w-full rounded-full bg-paper-warm hover:bg-ink/5 text-ink/70 py-2.5 px-4 font-semibold text-xs transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {isEnlarged && (
        <div 
          className="fixed inset-0 bg-ink/95 backdrop-blur-md flex items-center justify-center p-4 z-[9999] transition-opacity duration-300 animate-in fade-in"
          onClick={() => setIsEnlarged(false)}
        >
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsEnlarged(false);
            }}
            className="absolute top-6 right-6 p-2 bg-paper/10 hover:bg-paper/20 text-paper rounded-full transition-all z-10"
            aria-label="Đóng xem toàn màn hình"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              traverseGallery("up");
            }}
            className="absolute left-4 md:left-6 p-3 bg-paper/10 hover:bg-paper/20 text-paper rounded-full transition-all z-10"
            aria-label="Ảnh trước"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div 
            className="max-w-[85vw] max-h-[85vh] flex flex-col items-center justify-center relative select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={product.images[activeImageIdx]} 
              alt={`${product.name} Phóng to`}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl" 
            />
            <div className="mt-4 text-xs text-white/70 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
              Ảnh {activeImageIdx + 1} / {product.images.length}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              traverseGallery("down");
            }}
            className="absolute right-4 md:right-6 p-3 bg-paper/10 hover:bg-paper/20 text-paper rounded-full transition-all z-10"
            aria-label="Ảnh kế tiếp"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
