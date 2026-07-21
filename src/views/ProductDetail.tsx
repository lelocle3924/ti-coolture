import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  fetchProductById, 
  triggerWebhook, 
  toggleWishlist, 
  saveWishlistNote,
  incrementProductView
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
  Maximize2
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Gallery state
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isEnlarged, setIsEnlarged] = useState(false);

  // Wishlist customizations
  const [isSaved, setIsSaved] = useState(false);
  const [wishlistNote, setWishlistNote] = useState("");
  const [savingCustomization, setSavingCustomization] = useState(false);
  const [customizationSavedMessage, setCustomizationSavedMessage] = useState(false);

  // Social custom states
  const [msgTemplate, setMsgTemplate] = useState("Hi, I saw your product {product_name} on Tí Coolture and want to buy it");
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
        // Increment the view count when user lands on product detail page
        incrementProductView(productId);
        
        // Fetch store details to get actual socials for ORDER NOW links
        const storeRef = doc(db, "stores", prodData.storeId);
        const storeSnap = await getDoc(storeRef);
        if (storeSnap.exists()) {
          setStore({ id: storeSnap.id, ...storeSnap.data() } as StoreProfile);
        }
      }
      setLoading(false);
    }
    loadProduct();
  }, [productId]);

  // Wishlist initialization
  useEffect(() => {
    if (profile && product) {
      const saved = profile.wishlist?.includes(product.id) || false;
      setIsSaved(saved);
      setWishlistNote(profile.wishlistNotes?.[product.id] || "");
    }
  }, [profile, product]);

  // Load custom template and wishlist count
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

  useEffect(() => {
    async function loadWishlistCount() {
      if (profile?.role === "Admin" && product) {
        try {
          const { collection, query, where, getDocs } = await import("firebase/firestore");
          const q = query(collection(db, "profiles"), where("wishlist", "array-contains", product.id));
          const snap = await getDocs(q);
          setWishlistCount(snap.size);
        } catch (err) {
          console.error("Error loading wishlist count: ", err);
        }
      }
    }
    loadWishlistCount();
  }, [profile, product]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEnlarged) return;
      if (e.key === "Escape") {
        setIsEnlarged(false);
      } else if (e.key === "ArrowLeft") {
        traverseGallery("up");
      } else if (e.key === "ArrowRight") {
        traverseGallery("down");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEnlarged, product]);

  const handleWishlistToggle = async () => {
    if (!user) {
      navigate("/auth-gateway");
      return;
    }
    if (!product) return;

    const newWishlist = await toggleWishlist(user.uid, product.id);
    await refreshProfile();
    setIsSaved(newWishlist.includes(product.id));

    // Webhook dispatch
    triggerWebhook("WISHLIST_TOGGLED", {
      userId: user.uid,
      userEmail: user.email,
      productId: product.id,
      productName: product.name,
      price: product.price,
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

    // Webhook dispatch
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
    const url = directUrl || "https://facebook.com"; // fallback
    const compiled = getCompiledMessage();
    
    try {
      await navigator.clipboard.writeText(compiled);
      setCopiedSuccess(true);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      setCopiedSuccess(false);
    }

    setSocialPopup({ platform, url });

    // Webhook Telemetry
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
      <div className="min-h-screen flex justify-center items-center bg-neutral-100 font-mono text-xs">
        <span className="animate-pulse text-neutral-500">RESOLVING CULTURAL METRICS...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-100 p-8 text-center space-y-4">
        <h2 className="font-display font-black text-lg uppercase">[ERROR: PRODUCT RETRIEVAL FAILURE]</h2>
        <p className="font-mono text-xs text-neutral-500">The cultural item may have been unlisted or is awaiting moderator approval.</p>
        <Link to="/" className="px-4 py-2 border-2 border-black bg-black text-white hover:bg-white hover:text-black transition-all text-xs font-bold uppercase font-mono">
          Return to Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 p-4 md:p-8 select-none space-y-6">

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* 1. PRODUCT GALLERY (Left 7 columns - Vertical Thumbnail + Main Image Grid) */}
        <div className="lg:col-span-7 bg-white border-4 border-black p-4 flex flex-col md:flex-row gap-4 shadow-[6px_6px_0px_0px_#000000]">
          
          {/* Vertical thumbnails on left side of gallery */}
          <div className="flex flex-row md:flex-col justify-start md:justify-between items-center gap-2 md:w-20 order-2 md:order-1">
            <button 
              onClick={() => traverseGallery("up")}
              className="p-1 border border-black hover:bg-black hover:text-white transition-colors hidden md:block"
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
                    className={`w-14 aspect-square border-2 transition-all flex-shrink-0 ${
                      isActive ? "border-black scale-105" : "border-neutral-300 hover:border-black"
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
              className="p-1 border border-black hover:bg-black hover:text-white transition-colors hidden md:block"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Main big square image */}
          <div 
            onClick={() => setIsEnlarged(true)}
            className="flex-1 aspect-square border-2 border-black bg-neutral-50 relative order-1 md:order-2 overflow-hidden cursor-zoom-in group"
            title="Click to enlarge image to full screen"
          >
            <img 
              src={product.images[activeImageIdx]} 
              alt={product.name} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
            />
            {/* Hover overlay with Enlarge button */}
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="bg-black/80 text-white font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-2 border border-white/20 flex items-center space-x-2 shadow-lg scale-95 group-hover:scale-100 transition-transform duration-200">
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Enlarge Image</span>
              </span>
            </div>
          </div>
        </div>

        {/* 2. ORDER NOW & DESCRIPTION PANEL (Right 5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Info Card */}
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000000] space-y-6">
            
            {/* Store link circle logo */}
            <div className="flex items-center space-x-3 border-b-2 border-black pb-4">
              <Link to={`/stores/${product.storeId}`} className="shrink-0">
                <img 
                  src={product.storeLogo || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=100"} 
                  alt={product.storeName}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full border-2 border-black hover:scale-105 transition-transform" 
                />
              </Link>
              <div>
                <span className="font-mono text-[9px] text-neutral-400 font-bold uppercase tracking-widest block">CURATED STORE</span>
                <Link 
                  to={`/stores/${product.storeId}`}
                  className="font-display font-bold text-sm text-black hover:underline uppercase block"
                >
                  {product.storeName}
                </Link>
              </div>
            </div>

            {/* Product Meta details */}
            <div className="space-y-2">
              <span className="px-2 py-0.5 bg-black text-white text-[9px] font-mono font-bold uppercase">
                {product.category}
              </span>
              <div className="flex items-center justify-between gap-4">
                <h1 className="font-display font-black text-xl md:text-2xl uppercase tracking-tight text-black leading-tight flex-1">
                  {product.name}
                </h1>
                <button
                  onClick={handleWishlistToggle}
                  className={`p-2 border-2 border-black transition-colors shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                    isSaved ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100"
                  }`}
                  title={isSaved ? "Remove from wishlist" : "Save to wishlist"}
                >
                  <Heart className={`w-5 h-5 ${isSaved ? "fill-white" : ""}`} />
                </button>
              </div>
              <p className="font-mono text-lg font-black text-black">
                {product.price.toLocaleString()} {product.currency}
              </p>

              {/* Admin metrics indicator */}
              {profile?.role === "Admin" && (
                <div className="mt-2 bg-yellow-50 border-2 border-yellow-300 p-2 text-yellow-900 font-mono text-[10px] uppercase font-bold flex flex-wrap gap-x-4 gap-y-1">
                  <span>👁️ seen by: {product.views || 0}</span>
                  <span>🖱️ {product.clicks || 0} clicks</span>
                  <span>❤️ saved by: {wishlistCount}</span>
                </div>
              )}
            </div>

            {/* Direct Social Grid */}
            <div className="border-t-2 border-black pt-4 space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {/* TikTok button */}
                <button
                  onClick={() => handleSocialClick("TikTok", store?.socials.tiktok)}
                  className="bg-[#000000] hover:bg-white text-white hover:text-black border border-black p-2 text-center transition-all flex flex-col items-center justify-center space-y-1"
                >
                  <span className="font-sans font-black text-[9px]">TIKTOK</span>
                </button>

                {/* Facebook button */}
                <button
                  onClick={() => handleSocialClick("Facebook", store?.socials.facebook)}
                  className="bg-[#3b5998] hover:bg-white text-white hover:text-[#3b5998] border border-[#3b5998] p-2 text-center transition-all flex flex-col items-center justify-center space-y-1"
                >
                  <Facebook className="w-3.5 h-3.5" />
                  <span className="font-sans font-black text-[9px]">FACEBOOK</span>
                </button>

                {/* Instagram button */}
                <button
                  onClick={() => handleSocialClick("Instagram", store?.socials.instagram)}
                  className="bg-[#e1306c] hover:bg-white text-white hover:text-[#e1306c] border border-[#e1306c] p-2 text-center transition-all flex flex-col items-center justify-center space-y-1"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span className="font-sans font-black text-[9px]">INSTAGRAM</span>
                </button>

                {/* Threads button */}
                <button
                  onClick={() => handleSocialClick("Threads", store?.socials.threads)}
                  className="bg-neutral-800 hover:bg-white text-white hover:text-black border border-black p-2 text-center transition-all flex flex-col items-center justify-center space-y-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="font-sans font-black text-[9px]">THREADS</span>
                </button>
              </div>
            </div>

            {/* Description Narrative */}
            <div className="border-t border-neutral-200 pt-4">
              <p className="text-xs text-neutral-700 leading-relaxed font-sans">{product.description}</p>
            </div>

            {/* Details spec grid */}
            <div className="border-t border-neutral-200 pt-4 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-[10px]">
              {product.material && (
                <div>
                  <span className="text-neutral-400 uppercase">MATERIAL</span>
                  <p className="text-black font-bold uppercase">{product.material}</p>
                </div>
              )}
              {product.size && (
                <div>
                  <span className="text-neutral-400 uppercase">DIMENSION</span>
                  <p className="text-black font-bold uppercase">{product.size}</p>
                </div>
              )}
              {product.brand && (
                <div>
                  <span className="text-neutral-400 uppercase">BRAND ORIGIN</span>
                  <p className="text-black font-bold uppercase">{product.brand}</p>
                </div>
              )}
            </div>

          </div>

          {/* 3. USER SANDBOX: SAVE TO WISHLIST NOTES (Only shown if explorer) */}
          <div className="bg-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_#000000] space-y-4">
            <div className="border-b-2 border-black pb-2">
              <h3 className="font-display font-black text-xs uppercase text-black">
                MY NOTES
              </h3>
            </div>

            {!user ? (
              <div className="p-2 bg-neutral-50 border border-neutral-300 font-mono text-[10px] text-neutral-500 text-center uppercase">
                <p>Log in as Explorer to write personal notes.</p>
                <Link to="/auth-gateway" className="underline font-bold text-black hover:text-neutral-700 block mt-1">
                  PORTAL ACCESS →
                </Link>
              </div>
            ) : (
              <div className="space-y-4 font-mono text-xs">
                {isSaved ? (
                  <div className="space-y-3">
                    {/* Notes annotation */}
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1 flex items-center space-x-1">
                        <FileText className="w-3.5 h-3.5 text-black" />
                        <span>MY NOTES</span>
                      </label>
                      <textarea
                        value={wishlistNote}
                        onChange={(e) => setWishlistNote(e.target.value)}
                        placeholder="Add a custom note (e.g., 'Pairs with concrete dining room table')"
                        className="w-full border border-black p-1.5 text-[11px] font-sans focus:outline-none focus:bg-neutral-50 h-16"
                      />
                    </div>

                    {/* Submit settings */}
                    <button
                      onClick={handleSaveCustomizations}
                      disabled={savingCustomization}
                      className="w-full py-1.5 bg-black text-white hover:bg-neutral-800 border border-black text-[10px] font-bold uppercase transition-all flex items-center justify-center space-x-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>{savingCustomization ? "SAVING..." : "SAVE NOTES"}</span>
                    </button>

                    {customizationSavedMessage && (
                      <p className="text-[9px] text-emerald-600 text-center font-bold">
                        ✓ Personal notes successfully updated in Firestore!
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-2 text-neutral-400 text-[10px] italic uppercase leading-snug">
                    <p>Click the heart symbol next to the product name above to save this item to your wishlist and enable custom notes.</p>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Social Popup Modal */}
      {socialPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border-4 border-black p-6 w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center font-mono text-xs space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b-2 border-black pb-2 text-left flex justify-between items-center">
              <h3 className="font-display font-black text-xs uppercase text-black">
                CONNECT TO STORE OWNER
              </h3>
              <button 
                onClick={() => setSocialPopup(null)}
                className="p-1 border-2 border-black hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-left font-sans text-xs text-neutral-700 leading-relaxed">
              We have compiled a purchase request and <span className="font-bold text-emerald-600">automatically copied it to your clipboard</span>. You can paste it directly when you message the shop owner on {socialPopup.platform}!
            </p>

            <div className="bg-neutral-50 border-2 border-dashed border-neutral-400 p-3 text-left italic text-neutral-600 break-words font-mono text-[11px]">
              "{getCompiledMessage()}"
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  window.open(socialPopup.url, "_blank", "noopener,noreferrer");
                  setSocialPopup(null);
                }}
                className="w-full bg-black text-white hover:bg-neutral-800 border-2 border-black py-2 px-4 font-bold uppercase text-[11px] tracking-wider transition-all"
              >
                PROCEED TO {socialPopup.platform} & PASTE MESSAGE
              </button>
              <button
                onClick={() => setSocialPopup(null)}
                className="w-full bg-white hover:bg-neutral-100 text-black border-2 border-black py-2 px-4 font-bold uppercase text-[11px] tracking-wider transition-all"
              >
                STAY HERE / CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Enlarged Lightbox Modal */}
      {isEnlarged && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-[9999] transition-opacity duration-300 animate-in fade-in"
          onClick={() => setIsEnlarged(false)}
        >
          {/* Close button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsEnlarged(false);
            }}
            className="absolute top-6 right-6 p-2 bg-black/50 hover:bg-black text-white border border-neutral-700 hover:border-white transition-all rounded-full z-10"
            aria-label="Close fullscreen view"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Left Arrow Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              traverseGallery("up");
            }}
            className="absolute left-4 md:left-6 p-4 bg-black/50 hover:bg-black text-white border border-neutral-700 hover:border-white transition-all rounded-full flex items-center justify-center shadow-lg z-10"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Main Enlarged Image container */}
          <div 
            className="max-w-[85vw] max-h-[85vh] flex flex-col items-center justify-center relative select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={product.images[activeImageIdx]} 
              alt={`${product.name} Enlarged View`}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[75vh] object-contain border-2 border-white shadow-2xl" 
            />
            {/* Image counter indicator */}
            <div className="mt-4 font-mono text-xs uppercase text-neutral-400 bg-neutral-900 px-3 py-1 border border-neutral-800 tracking-wider">
              Image {activeImageIdx + 1} of {product.images.length}
            </div>
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              traverseGallery("down");
            }}
            className="absolute right-4 md:right-6 p-4 bg-black/50 hover:bg-black text-white border border-neutral-700 hover:border-white transition-all rounded-full flex items-center justify-center shadow-lg z-10"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

    </div>
  );
}
