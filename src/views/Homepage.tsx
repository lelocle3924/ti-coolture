import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Search, 
  MapPin, 
  Map, 
  Filter, 
  X, 
  Compass, 
  ArrowRight, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  Volume2, 
  RotateCcw,
  AlertTriangle,
  Edit,
  Plus,
  Trash2,
  Save,
  Upload,
  Link2
} from "lucide-react";
import { fetchProducts, fetchTouristRoutes, triggerWebhook, incrementProductClick } from "../lib/dbService";
import { Product, TouristRoute, RouteStop } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../lib/useAuth";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ImageUploader } from "../components/ImageUploader";

export default function Homepage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  // State Management
  const [products, setProducts] = useState<Product[]>([]);
  const [routes, setRoutes] = useState<TouristRoute[]>([]);
  const [loading, setLoading] = useState(true);

  // What's In Store Carousel State
  const [carouselIndex, setCarouselIndex] = useState(0);

  const topTenProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, 10);
  }, [products]);

  const visibleProducts = useMemo(() => {
    if (topTenProducts.length === 0) return [];
    const result = [];
    for (let i = 0; i < 4; i++) {
      const idx = (carouselIndex + i) % topTenProducts.length;
      result.push(topTenProducts[idx]);
    }
    return result;
  }, [topTenProducts, carouselIndex]);

  const handlePrevSlide = () => {
    if (topTenProducts.length === 0) return;
    setCarouselIndex((prev) => (prev === 0 ? topTenProducts.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    if (topTenProducts.length === 0) return;
    setCarouselIndex((prev) => (prev + 1) % topTenProducts.length);
  };

  // Homepage Banner Customization States
  const [bannerBg, setBannerBg] = useState("https://images.unsplash.com/photo-1555181126-cf46a03827c0?w=1600");
  const [bannerMainText, setBannerMainText] = useState("Hành trình kết nối di sản thủ công Việt Nam với không gian sống hiện đại");
  const [bannerSubText, setBannerSubText] = useState("Connecting timeless traditional Vietnamese craftsmanship with contemporary creative spaces and boutique design houses.");
  const [isEditingBanner, setIsEditingBanner] = useState(false);

  // Active Route Editing States Sync
  const [activeRouteMapUrl, setActiveRouteMapUrl] = useState("");
  const [activeRouteName, setActiveRouteName] = useState("");
  const [activeRouteStops, setActiveRouteStops] = useState<RouteStop[]>([]);
  const [isEditingRoute, setIsEditingRoute] = useState(false);
  const [isAddingPin, setIsAddingPin] = useState(false);
  
  // New pin form states
  const [newPinX, setNewPinX] = useState(50);
  const [newPinY, setNewPinY] = useState(50);
  const [newPinName, setNewPinName] = useState("");
  const [newPinAddress, setNewPinAddress] = useState("");
  const [newPinDescription, setNewPinDescription] = useState("");

  // Search & Session tracking
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [previousSearches, setPreviousSearches] = useState<string[]>(() => {
    const saved = sessionStorage.getItem("t_coolture_searches");
    return saved ? JSON.parse(saved) : [];
  });

  // Price Filters
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null);

  // Routes Map State
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);

  // Random Curated Product Popup State
  const [curatedProduct, setCuratedProduct] = useState<Product | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isGemOpen, setIsGemOpen] = useState(true);

  // Sync route edit states when selectedRoute changes
  const activeRoute = routes.find(r => r.id === selectedRouteId);

  useEffect(() => {
    if (activeRoute) {
      setActiveRouteMapUrl(activeRoute.mapImageUrl || "");
      setActiveRouteName(activeRoute.name || "");
      setActiveRouteStops(activeRoute.stops || []);
    }
  }, [selectedRouteId, routes]);

  // Load Data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const approvedProducts = await fetchProducts("Approved");
      setProducts(approvedProducts);

      if (approvedProducts.length > 0) {
        const randomIndex = Math.floor(Math.random() * approvedProducts.length);
        setCuratedProduct(approvedProducts[randomIndex]);
        setShowPopup(true);
      }

      const touristRoutes = await fetchTouristRoutes();
      setRoutes(touristRoutes);
      if (touristRoutes.length > 0) {
        setSelectedRouteId(touristRoutes[0].id);
        if (touristRoutes[0].stops.length > 0) {
          setSelectedStop(touristRoutes[0].stops[0]);
        }
      }

      // Fetch Homepage Banner Settings
      try {
        const bannerRef = doc(db, "settings", "homepage_banner");
        const bannerSnap = await getDoc(bannerRef);
        if (bannerSnap.exists()) {
          const data = bannerSnap.data();
          if (data.bgUrl) setBannerBg(data.bgUrl);
          if (data.mainTitle) setBannerMainText(data.mainTitle);
          if (data.subTitle) setBannerSubText(data.subTitle);
        }
      } catch (err) {
        console.error("Error loading homepage banner settings:", err);
      }

      setLoading(false);
    }
    loadData();
  }, []);

  // Periodic random popups logic
  useEffect(() => {
    if (products.length === 0) return;

    // Trigger random popups every 30 seconds (30,000 ms)
    const interval = setInterval(() => {
      triggerRandomPopup();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [products]);

  const triggerRandomPopup = () => {
    if (products.length === 0) return;
    const randomIndex = Math.floor(Math.random() * products.length);
    const randomProd = products[randomIndex];
    setCuratedProduct(randomProd);
    setShowPopup(true);

    // Trigger simulated webhook for curated pop-up display log
    triggerWebhook("CURATED_POPUP_DISPLAYED", {
      productId: randomProd.id,
      productName: randomProd.name,
      price: randomProd.price,
      storeName: randomProd.storeName,
      timestamp: new Date().toISOString()
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // Add to session tracking
    if (!previousSearches.includes(query)) {
      const updated = [query, ...previousSearches].slice(0, 5); // Keep last 5 searches
      setPreviousSearches(updated);
      sessionStorage.setItem("t_coolture_searches", JSON.stringify(updated));
    }
  };

  const handleClearSearches = () => {
    setPreviousSearches([]);
    sessionStorage.removeItem("t_coolture_searches");
  };

  const handleSearchClick = (term: string) => {
    setSearchQuery(term);
  };

  // Price range matching helpers
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

  // Filtering products
  const filteredProducts = products.filter(prod => {
    const matchesSearch = searchQuery 
      ? prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        prod.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.storeName.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesSearch && matchesPrice(prod.price);
  });

  return (
    <div className="min-h-screen bg-neutral-100 select-none relative flex flex-col">
      
      {/* 1. HERO BANNER SECTION (Quote & Background image) */}
      <section 
        className="relative h-[550px] flex flex-col justify-center items-center text-center px-6 border-b-4 border-black bg-cover bg-center"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url('${bannerBg}')` 
        }}
      >
        {profile?.role === "Admin" && (
          <button
            onClick={() => setIsEditingBanner(true)}
            className="absolute top-4 right-4 bg-yellow-400 hover:bg-yellow-500 text-black border-2 border-black font-mono text-xs font-bold uppercase py-1.5 px-3 flex items-center space-x-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all z-30"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Banner</span>
          </button>
        )}

        <div className="max-w-3xl space-y-8">
          <span className="font-mono text-xs uppercase text-emerald-400 tracking-widest font-bold">
            // TÍ COOLTURE CULTURAL HERITAGE
          </span>
          <h1 className="font-display font-black text-3xl md:text-5xl text-white uppercase tracking-tight leading-none drop-shadow-md">
            {bannerMainText}
          </h1>
          <p className="font-mono text-xs md:text-sm text-neutral-300 max-w-2xl mx-auto uppercase tracking-wide leading-relaxed">
            "{bannerSubText}"
          </p>
        </div>
      </section>

      {/* 1.5 ADMIN EDIT BANNER MODAL */}
      <AnimatePresence>
        {isEditingBanner && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-4 border-black p-6 w-full max-w-lg shadow-[8px_8px_0px_0px_#000000] space-y-4 font-mono text-xs text-black"
            >
              <div className="flex justify-between items-center border-b-2 border-black pb-2">
                <h3 className="font-display font-black text-sm uppercase">EDIT HERO BANNER</h3>
                <button onClick={() => setIsEditingBanner(false)} className="p-1 hover:bg-neutral-100 border border-black">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 bg-neutral-50 p-3 border-2 border-dashed border-neutral-300">
                <div className="space-y-1">
                  <label className="block font-bold uppercase text-[10px]">Background Image</label>
                  <ImageUploader 
                    id="banner-image-upload"
                    onUploadComplete={(url) => setBannerBg(url)}
                  />
                  <input 
                    type="text" 
                    value={bannerBg}
                    onChange={(e) => setBannerBg(e.target.value)}
                    placeholder="Or paste image URL here..."
                    className="w-full border-2 border-black p-2 font-mono text-xs focus:outline-none bg-white mt-1"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold uppercase text-[10px]">Main Heading Text</label>
                  <textarea 
                    value={bannerMainText}
                    onChange={(e) => setBannerMainText(e.target.value)}
                    rows={3}
                    placeholder="Enter main heading..."
                    className="w-full border-2 border-black p-2 font-mono text-xs focus:outline-none bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold uppercase text-[10px]">Subtext Below</label>
                  <textarea 
                    value={bannerSubText}
                    onChange={(e) => setBannerSubText(e.target.value)}
                    rows={3}
                    placeholder="Enter subtext..."
                    className="w-full border-2 border-black p-2 font-mono text-xs focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button 
                  onClick={() => setIsEditingBanner(false)}
                  className="px-4 py-2 border-2 border-black hover:bg-neutral-100 uppercase font-bold text-[10px]"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const bannerRef = doc(db, "settings", "homepage_banner");
                      await setDoc(bannerRef, {
                        bgUrl: bannerBg,
                        mainTitle: bannerMainText,
                        subTitle: bannerSubText
                      });
                      setIsEditingBanner(false);
                      triggerWebhook("HOMEPAGE_BANNER_UPDATED", {
                        bgUrl: bannerBg,
                        mainTitle: bannerMainText,
                        subTitle: bannerSubText
                      });
                    } catch (err) {
                      console.error("Error saving banner:", err);
                    }
                  }}
                  className="px-4 py-2 bg-black text-white hover:bg-neutral-800 border-2 border-black uppercase font-bold text-[10px] flex items-center space-x-1"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Settings</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. WHAT'S IN STORE SECTION (Immediate next) */}
      <section id="whats-in-store" className="py-12 px-4 md:px-8 max-w-7xl mx-auto w-full border-b-4 border-black">
        <div className="border-b-4 border-black pb-4 mb-8 text-center">
          <h2 className="font-display font-black text-2xl md:text-3xl uppercase tracking-tight text-black mx-auto">
            What's In Store
          </h2>
        </div>
        
        {/* Carousel Component */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <span className="font-mono text-xs animate-pulse text-neutral-500">
              FETCHING POPULAR PRODUCTS...
            </span>
          </div>
        ) : topTenProducts.length === 0 ? (
          <div className="border-4 border-black p-12 text-center bg-white space-y-3 shadow-[4px_4px_0px_0px_#000000]">
            <p className="font-mono text-xs font-bold uppercase text-neutral-500">No products available</p>
          </div>
        ) : (
          <div className="relative flex items-center px-4 md:px-12 w-full">
            {/* Left Scroll Arrow */}
            <button
              onClick={handlePrevSlide}
              className="absolute left-0 z-10 p-3 border-4 border-black bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all font-bold"
              aria-label="Previous Products"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Carousel Viewport */}
            <div className="overflow-hidden w-full py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 transition-all duration-300">
                {visibleProducts.map((prod) => (
                  <Link
                    key={prod.id}
                    to={`/products/${prod.id}`}
                    onClick={async () => {
                      await incrementProductClick(prod.id);
                    }}
                    className="group bg-white border-4 border-black hover:shadow-[8px_8px_0px_0px_#000000] transition-all flex flex-col h-full"
                    id={`product-card-${prod.id}`}
                  >
                    {/* Square main product image, transitions to secondary image on hover */}
                    <div className="aspect-square border-b-4 border-black bg-neutral-100 overflow-hidden relative">
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
                      <span className="absolute top-2 left-2 bg-white text-black text-[9px] font-mono font-bold px-1.5 py-0.5 border-2 border-black uppercase">
                        {prod.category}
                      </span>
                      {/* Popularity indicator */}
                      {profile?.role === "Admin" && (
                        <span className="absolute bottom-2 right-2 bg-yellow-400 text-black text-[9px] font-mono font-bold px-1.5 py-0.5 border-2 border-black uppercase flex items-center space-x-1">
                          <span>🔥 {prod.clicks || 0} clicks</span>
                        </span>
                      )}
                    </div>

                    {/* Product descriptions */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center space-x-1.5 mb-1.5">
                          {prod.storeLogo && (
                            <img
                              src={prod.storeLogo}
                              alt={prod.storeName}
                              className="w-4 h-4 rounded-full border border-black object-cover"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <span className="font-mono text-[10px] text-neutral-500 uppercase">
                            {prod.storeName}
                          </span>
                        </div>
                        <h3 className="font-display font-bold text-sm text-black group-hover:underline uppercase leading-snug line-clamp-2">
                          {prod.name}
                        </h3>
                      </div>

                      <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
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
            </div>

            {/* Right Scroll Arrow */}
            <button
              onClick={handleNextSlide}
              className="absolute right-0 z-10 p-3 border-4 border-black bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all font-bold"
              aria-label="Next Products"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </section>

      {/* 3. CULTURAL ROUTE EXPLORER SECTION (Comes last) */}
      <section id="route-explorer" className="py-12 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="border-b-4 border-black pb-4 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="font-display font-black text-2xl md:text-3xl uppercase tracking-tight flex items-center space-x-2 text-black">
              <Map className="w-6 h-6 shrink-0" />
              <span>Cultural Route Explorer</span>
            </h2>
            <p className="text-xs font-mono text-neutral-500 uppercase mt-1">
              Explore bespoke heritage walks
            </p>
          </div>

          {profile?.role === "Admin" && activeRoute && (
            <button
              onClick={() => {
                setIsEditingRoute(!isEditingRoute);
                setIsAddingPin(false);
              }}
              className="bg-yellow-400 hover:bg-yellow-500 text-black border-2 border-black font-mono text-xs font-bold uppercase py-1.5 px-3 flex items-center space-x-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all z-10 shrink-0"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>{isEditingRoute ? "EXIT MAP EDITOR" : "EDIT ACTIVE ROUTE MAP"}</span>
            </button>
          )}
        </div>

        {/* Route Swappable Cards Map block */}
        <div className="bg-white border-4 border-black p-4 md:p-8 shadow-[6px_6px_0px_0px_#000000] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-black pb-3 gap-4">
            <span className="font-mono text-xs font-bold uppercase text-neutral-500">
              SELECT CURATED PATHWAY:
            </span>
            
            {/* Route switches */}
            <div className="flex border-2 border-black self-start sm:self-auto bg-neutral-100 flex-wrap">
              {routes.map((route) => {
                const isActive = selectedRouteId === route.id;
                return (
                  <button
                    key={route.id}
                    onClick={() => {
                      setSelectedRouteId(route.id);
                      if (route.stops.length > 0) {
                        setSelectedStop(route.stops[0]);
                      }
                      triggerWebhook("TOURIST_ROUTE_SELECTED", {
                        routeId: route.id,
                        routeName: route.name,
                        stopCount: route.stops.length
                      });
                    }}
                    className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase transition-all ${
                      isActive ? "bg-black text-white" : "hover:bg-neutral-200 text-black"
                    }`}
                  >
                    {route.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Admin editing top settings */}
          {isEditingRoute && (
            <div className="bg-yellow-50 border-2 border-black p-4 font-mono text-xs text-black space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center space-x-2 text-yellow-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-bold uppercase">Route Editor Mode Active</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold uppercase text-[10px]">Route Display Name</label>
                  <input
                    type="text"
                    value={activeRouteName}
                    onChange={(e) => setActiveRouteName(e.target.value)}
                    className="w-full border-2 border-black p-2 font-mono text-xs focus:outline-none bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold uppercase text-[10px]">Map Image background Upload / URL</label>
                  <ImageUploader 
                    id="route-map-upload"
                    onUploadComplete={(url) => setActiveRouteMapUrl(url)}
                  />
                  <input
                    type="text"
                    value={activeRouteMapUrl}
                    onChange={(e) => setActiveRouteMapUrl(e.target.value)}
                    placeholder="Or paste map image URL..."
                    className="w-full border-2 border-black p-2 font-mono text-xs focus:outline-none bg-white mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {activeRoute ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Visual Brutalist Map Mockup */}
              <div 
                onClick={(e) => {
                  if (profile?.role !== "Admin" || !isEditingRoute) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                  const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                  setNewPinX(x);
                  setNewPinY(y);
                  setIsAddingPin(true);
                }}
                className={`lg:col-span-7 border-4 border-black bg-neutral-50 h-72 md:h-[450px] relative overflow-hidden flex items-center justify-center p-4 transition-all ${
                  isEditingRoute ? "cursor-crosshair border-yellow-500 bg-neutral-100" : ""
                }`}
              >
                {/* Background Map Image or Grid lines */}
                {activeRouteMapUrl ? (
                  <img 
                    src={activeRouteMapUrl} 
                    alt="Route Map schema" 
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:16px_16px]"></div>
                )}
                
                {/* Connected Path Graphic lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <polyline
                    points={(isEditingRoute ? activeRouteStops : activeRoute.stops).map(s => `${s.x}%,${s.y}%`).join(" ")}
                    fill="none"
                    stroke="#000"
                    strokeWidth="3"
                    strokeDasharray="4,4"
                  />
                </svg>

                {/* Stops pins on canvas map */}
                {(isEditingRoute ? activeRouteStops : activeRoute.stops).map((stop, idx) => {
                  const isSelected = selectedStop?.id === stop.id;
                  return (
                    <button
                      key={stop.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStop(stop);
                      }}
                      style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-10"
                    >
                      {/* Ring */}
                      <div className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center transition-all ${
                        isSelected ? "bg-black text-white scale-125" : "bg-white hover:bg-neutral-200 text-black shadow-xs"
                      }`}>
                        <span className="font-mono text-[10px] font-bold">{idx + 1}</span>
                      </div>
                      {/* Tooltip text on map */}
                      <span className="absolute left-1/2 -translate-x-1/2 top-9 bg-black text-white text-[8px] font-mono px-1 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase">
                        {stop.name}
                      </span>
                    </button>
                  );
                })}

                {isEditingRoute && (
                  <div className="absolute top-2 left-2 bg-yellow-400 text-black border border-black font-mono text-[9px] font-bold px-2 py-1 uppercase tracking-wider z-20 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                    PIN MODE: Click map schematic to drop a pin
                  </div>
                )}
              </div>

              {/* Stop Specific Information Sidebar details */}
              <div className="lg:col-span-5 flex flex-col justify-between border-4 border-black p-6 bg-neutral-50 space-y-6">
                
                {isEditingRoute ? (
                  /* Route stops administrator / inline editor */
                  <div className="space-y-4 flex-1 flex flex-col justify-between">
                    
                    {isAddingPin ? (
                      /* Adding stop form */
                      <div className="space-y-3 font-mono text-black border-2 border-black p-3 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex justify-between items-center border-b border-black pb-1.5">
                          <span className="text-[10px] font-bold text-yellow-600 uppercase">ADD PIN ({newPinX}%, {newPinY}%)</span>
                          <button 
                            type="button"
                            onClick={() => setIsAddingPin(false)}
                            className="text-[9px] font-bold uppercase text-neutral-400 hover:text-black"
                          >
                            Cancel
                          </button>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[9px] font-bold uppercase">Stop Name *</label>
                          <input 
                            type="text"
                            value={newPinName}
                            onChange={(e) => setNewPinName(e.target.value)}
                            placeholder="e.g. Traditional Craft Boutique"
                            className="w-full border-2 border-black p-1.5 text-xs bg-neutral-50 font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[9px] font-bold uppercase">Maps link / Address *</label>
                          <input 
                            type="text"
                            value={newPinAddress}
                            onChange={(e) => setNewPinAddress(e.target.value)}
                            placeholder="Address text or full google maps link..."
                            className="w-full border-2 border-black p-1.5 text-xs bg-neutral-50 font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[9px] font-bold uppercase">Description *</label>
                          <textarea 
                            value={newPinDescription}
                            onChange={(e) => setNewPinDescription(e.target.value)}
                            placeholder="Artisan history or details..."
                            rows={3}
                            className="w-full border-2 border-black p-1.5 text-xs bg-neutral-50 font-mono"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!newPinName.trim() || !newPinAddress.trim()) {
                              alert("Name and Address/Maps URL are required!");
                              return;
                            }
                            const newStop: RouteStop = {
                              id: "stop_" + Date.now(),
                              name: newPinName.trim(),
                              address: newPinAddress.trim(),
                              description: newPinDescription.trim(),
                              x: newPinX,
                              y: newPinY
                            };
                            setActiveRouteStops([...activeRouteStops, newStop]);
                            setNewPinName("");
                            setNewPinAddress("");
                            setNewPinDescription("");
                            setIsAddingPin(false);
                          }}
                          className="w-full py-2 bg-black text-white hover:bg-neutral-800 border-2 border-black uppercase text-[10px] font-bold flex items-center justify-center space-x-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Stop Pin Checkpoint</span>
                        </button>
                      </div>
                    ) : (
                      /* Stop manager scroll view */
                      <div className="space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
                          <span className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider block border-b border-neutral-200 pb-1.5">
                            MANAGE TIMELINE STOPS
                          </span>

                          {activeRouteStops.length === 0 ? (
                            <p className="text-xs text-neutral-400 italic">No pins placed yet. Click on the map schematic to drop a checkpoint pin!</p>
                          ) : (
                            <div className="space-y-3">
                              {activeRouteStops.map((stop, idx) => (
                                <div key={stop.id} className="border-2 border-black p-2.5 bg-white space-y-1.5 relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold">STOP #{idx + 1}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = activeRouteStops.filter(s => s.id !== stop.id);
                                        setActiveRouteStops(updated);
                                      }}
                                      className="text-red-500 hover:text-red-700 p-1 border border-transparent hover:border-red-500"
                                      title="Delete stop pin"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <input 
                                    type="text"
                                    value={stop.name}
                                    onChange={(e) => {
                                      const updated = activeRouteStops.map(s => s.id === stop.id ? { ...s, name: e.target.value } : s);
                                      setActiveRouteStops(updated);
                                    }}
                                    placeholder="Stop Name..."
                                    className="w-full border border-black p-1 text-[11px] font-mono focus:outline-none"
                                  />

                                  <input 
                                    type="text"
                                    value={stop.address}
                                    onChange={(e) => {
                                      const updated = activeRouteStops.map(s => s.id === stop.id ? { ...s, address: e.target.value } : s);
                                      setActiveRouteStops(updated);
                                    }}
                                    placeholder="Maps link or Address..."
                                    className="w-full border border-black p-1 text-[11px] font-mono focus:outline-none"
                                  />

                                  <textarea 
                                    value={stop.description}
                                    onChange={(e) => {
                                      const updated = activeRouteStops.map(s => s.id === stop.id ? { ...s, description: e.target.value } : s);
                                      setActiveRouteStops(updated);
                                    }}
                                    placeholder="Description..."
                                    rows={2}
                                    className="w-full border border-black p-1 text-[11px] font-mono focus:outline-none"
                                  />

                                  <div className="grid grid-cols-2 gap-2 text-[8px] font-mono text-neutral-400 uppercase">
                                    <div>X: <input type="number" value={stop.x} onChange={(e) => {
                                      const updated = activeRouteStops.map(s => s.id === stop.id ? { ...s, x: Number(e.target.value) } : s);
                                      setActiveRouteStops(updated);
                                    }} className="w-10 border border-black p-0.5 ml-1 text-center font-mono text-black" />%</div>
                                    <div>Y: <input type="number" value={stop.y} onChange={(e) => {
                                      const updated = activeRouteStops.map(s => s.id === stop.id ? { ...s, y: Number(e.target.value) } : s);
                                      setActiveRouteStops(updated);
                                    }} className="w-10 border border-black p-0.5 ml-1 text-center font-mono text-black" />%</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t-2 border-black flex space-x-2">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const routeRef = doc(db, "routes", activeRoute.id);
                                const updatedRouteData = {
                                  id: activeRoute.id,
                                  name: activeRouteName,
                                  description: activeRoute.description || "",
                                  mapImageUrl: activeRouteMapUrl,
                                  stops: activeRouteStops
                                };
                                await setDoc(routeRef, updatedRouteData);

                                setRoutes(routes.map(r => r.id === activeRoute.id ? updatedRouteData : r));
                                setIsEditingRoute(false);
                                if (activeRouteStops.length > 0) {
                                  setSelectedStop(activeRouteStops[0]);
                                } else {
                                  setSelectedStop(null);
                                }

                                triggerWebhook("TOURIST_ROUTE_UPDATED", {
                                  routeId: activeRoute.id,
                                  routeName: activeRouteName,
                                  stopsCount: activeRouteStops.length,
                                  timestamp: new Date().toISOString()
                                });
                              } catch (err) {
                                console.error("Error saving route changes:", err);
                              }
                            }}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-[10px] border-2 border-black flex items-center justify-center space-x-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Route Changes</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingRoute(false);
                              setIsAddingPin(false);
                              setActiveRouteName(activeRoute.name || "");
                              setActiveRouteMapUrl(activeRoute.mapImageUrl || "");
                              setActiveRouteStops(activeRoute.stops || []);
                            }}
                            className="px-3 py-2 bg-white hover:bg-neutral-100 text-black border-2 border-black text-[10px] uppercase font-bold"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standard read-only timeline */
                  <>
                    <div className="space-y-4">
                      <span className="font-mono text-[9px] uppercase font-bold text-neutral-400 tracking-widest block">
                        ROUTE TIMELINE // LOCAL VISITS
                      </span>
                      
                      {selectedStop ? (
                        <div className="space-y-3">
                          <div className="flex items-start space-x-1.5">
                            <MapPin className="w-4 h-4 text-black shrink-0 mt-0.5" />
                            <h3 className="font-display font-black text-base uppercase text-black leading-tight">
                              {selectedStop.name}
                            </h3>
                          </div>
                          <div className="font-mono text-[10px] text-neutral-500 uppercase leading-normal">
                            <a 
                              href={selectedStop.address.startsWith("http") ? selectedStop.address : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedStop.address)}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="hover:underline text-emerald-600 font-bold flex items-center gap-1"
                            >
                              {selectedStop.address} ↗
                            </a>
                          </div>
                          <p className="text-xs text-neutral-700 leading-relaxed pt-2">
                            {selectedStop.description}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-400 italic">
                          Select a numerical checkpoint pin on the schematic to reveal details.
                        </p>
                      )}
                    </div>

                    {/* Steps Progress List */}
                    <div className="border-t-2 border-black pt-4">
                      <p className="font-mono text-[9px] font-bold uppercase text-neutral-400 mb-2">
                        STOPS TIMELINE
                      </p>
                      <div className="flex flex-col space-y-1">
                        {activeRoute.stops.map((stop, idx) => {
                          const isSelected = selectedStop?.id === stop.id;
                          return (
                            <button
                              key={stop.id}
                              onClick={() => setSelectedStop(stop)}
                              className={`text-left text-[11px] font-mono px-2 py-1.5 flex items-center justify-between border border-transparent transition-all ${
                                isSelected ? "bg-black text-white font-bold border-black" : "hover:bg-neutral-200 text-black"
                              }`}
                            >
                              <span>{idx + 1}. {stop.name}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

              </div>

            </div>
          ) : (
            <p className="text-center text-xs font-mono text-neutral-400 animate-pulse py-12">
              Loading cultural map data...
            </p>
          )}
        </div>

        {/* Global Footer element */}
        <footer className="mt-16 pt-8 border-t-2 border-black flex flex-col md:flex-row justify-between items-center text-[10px] font-mono text-neutral-500 uppercase gap-4">
          <span>© 2026 TÍ COOLTURE TRADING PLATFORM</span>
          <div className="flex space-x-4">
            <Link to="/auth-gateway" className="hover:text-black hover:underline">Auth Portal</Link>
            <Link to="/shop-dashboard" className="hover:text-black hover:underline">Artisan Panel</Link>
            <span>v1.0.0-MVP</span>
          </div>
        </footer>
      </section>

      {/* 4. RANDOM CURATED PRODUCT POP-UP GEMS (Toggle window on the lower third of the right side) */}
      <AnimatePresence>
        {isGemOpen && curatedProduct && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-1/3 right-6 z-40 w-80 bg-white border-4 border-black shadow-[6px_6px_0px_0px_#000000] p-4 flex flex-col space-y-3 font-sans text-black"
          >
            {/* Popup Header */}
            <div className="flex justify-between items-start border-b border-black pb-2">
              <div className="flex items-center space-x-1.5 text-black">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-black" />
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider">
                  ARTISAN GEM HIGHLIGHT
                </span>
              </div>
              <button
                onClick={() => {
                  setIsGemOpen(false);
                  triggerWebhook("CURATED_POPUP_MINIMIZED", { productId: curatedProduct.id });
                }}
                className="p-0.5 hover:bg-neutral-200 border border-transparent hover:border-black"
                title="Minimize gem"
              >
                <X className="w-3.5 h-3.5 text-black" />
              </button>
            </div>

            {/* Popup Body */}
            <div className="flex space-x-3">
              <img
                src={curatedProduct.images[0]}
                alt={curatedProduct.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 object-cover border-2 border-black flex-shrink-0"
              />
              <div className="space-y-1 overflow-hidden">
                <p className="font-mono text-[9px] text-neutral-400 uppercase truncate">
                  {curatedProduct.storeName}
                </p>
                <h4 className="font-display font-bold text-xs uppercase leading-tight line-clamp-2 text-black">
                  {curatedProduct.name}
                </h4>
                <p className="font-mono text-[10px] font-bold text-black">
                  {curatedProduct.price.toLocaleString()} {curatedProduct.currency}
                </p>
              </div>
            </div>

            {/* Popup Action */}
            <div className="flex space-x-2 pt-1">
              <button
                onClick={() => {
                  triggerWebhook("CURATED_POPUP_CLICKED", {
                    productId: curatedProduct.id,
                    productName: curatedProduct.name,
                    storeId: curatedProduct.storeId,
                    storeName: curatedProduct.storeName
                  });
                  navigate(`/products/${curatedProduct.id}`);
                }}
                className="flex-1 bg-black text-white hover:bg-white hover:text-black border border-black py-1.5 text-[10px] font-mono font-bold uppercase transition-all text-center flex items-center justify-center space-x-1"
              >
                <span>EXPLORE GEM</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gem Toggle Trigger when minimized */}
      {!isGemOpen && curatedProduct && (
        <button
          onClick={() => setIsGemOpen(true)}
          className="fixed bottom-1/3 right-6 z-40 bg-black text-white hover:bg-neutral-800 border-4 border-black shadow-[4px_4px_0px_0px_#000000] px-4 py-2.5 font-mono text-xs font-bold uppercase flex items-center space-x-2 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-yellow-400 animate-bounce" />
          <span>Show Explore Gem 💎</span>
        </button>
      )}

    </div>
  );
}
