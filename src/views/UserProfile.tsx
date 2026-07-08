import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { 
  fetchProductById, 
  fetchStoreById, 
  toggleWishlist, 
  toggleFollowShop, 
  triggerWebhook,
  fetchButtonClickStats,
  ButtonClickStat,
  fetchAllProducts,
  fetchStores,
  moderateProduct,
  moderateStore,
  permanentlyDeleteProduct,
  updateProduct,
  fetchMessageTemplate,
  updateMessageTemplate
} from "../lib/dbService";
import { Product, StoreProfile } from "../types";
import { 
  Heart, 
  MapPin, 
  Tag, 
  Bell, 
  FileText, 
  User, 
  Compass, 
  Store, 
  Trash2, 
  ChevronRight,
  MessageSquare,
  AlertCircle,
  BarChart3,
  MousePointer,
  ShieldCheck,
  Check,
  X,
  Clock,
  RefreshCw,
  Layers,
  Shield
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

type WishlistFilter = "All" | "WatchLater" | "Sale" | "OutOfStock";

export default function UserProfile() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [followedStores, setFollowedStores] = useState<StoreProfile[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [clickStats, setClickStats] = useState<ButtonClickStat[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Admin specific states
  const [allPendingProducts, setAllPendingProducts] = useState<Product[]>([]);
  const [allPendingStores, setAllPendingStores] = useState<StoreProfile[]>([]);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [moderationLogs, setModerationLogs] = useState<any[]>([]);
  const [adminTemplate, setAdminTemplate] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [saveTemplateSuccess, setSaveTemplateSuccess] = useState(false);

  // Custom filter on Wishlist
  const [activeWishlistFilter, setActiveWishlistFilter] = useState<WishlistFilter>("All");

  // Redirect if guest
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth-gateway");
    }
  }, [user, authLoading]);

  // Fetch wishlist products and followed stores OR Admin Moderation Deck & Analytics
  const loadProfileMetrics = async () => {
    if (!profile) return;
    setLoadingData(true);

    try {
      if (profile.role === "Admin") {
        setLoadingStats(true);

        // 1. Fetch button click stats
        const stats = await fetchButtonClickStats();
        setClickStats(stats);

        // 2. Fetch pending products
        const allProds = await fetchAllProducts();
        setAllPendingProducts(allProds.filter(p => p.status === "Pending"));

        // 3. Fetch pending stores
        const allStores = await fetchStores();
        setAllPendingStores(allStores.filter(s => s.status === "Pending" && s.registered));

        // 4. Fetch message template
        const t = await fetchMessageTemplate();
        setAdminTemplate(t);

        setLoadingStats(false);
      } else {
        // 1. Fetch wishlist products
        const pPromises = (profile.wishlist || []).map(async (pId) => {
          return await fetchProductById(pId);
        });
        const pResults = await Promise.all(pPromises);
        setWishlistItems(pResults.filter((p): p is Product => p !== null));

        // 2. Fetch followed stores
        const sPromises = (profile.followedShops || []).map(async (sId) => {
          return await fetchStoreById(sId);
        });
        const sResults = await Promise.all(sPromises);
        setFollowedStores(sResults.filter((s): s is StoreProfile => s !== null));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (profile) {
      loadProfileMetrics();
    }
  }, [profile]);

  const handleAdminModerate = async (productId: string, status: "Approved" | "Rejected") => {
    const reason = rejectionReasons[productId] || "";
    if (status === "Rejected" && !reason) {
      alert("Please specify a reason.");
      return;
    }

    const targetProduct = allPendingProducts.find(p => p.id === productId);
    const isDeleteRequest = targetProduct?.deleteRequested === true;

    try {
      if (isDeleteRequest) {
        if (status === "Approved") {
          await permanentlyDeleteProduct(productId);
        } else {
          await updateProduct(productId, { status: "Approved", deleteRequested: false });
        }
      } else {
        await moderateProduct(productId, status, reason);
      }

      const logMsg = {
        productId,
        status: isDeleteRequest && status === "Approved" ? "Deleted" : status,
        reason,
        moderatedBy: user?.email,
        timestamp: new Date().toISOString()
      };
      setModerationLogs([logMsg, ...moderationLogs]);

      triggerWebhook("PRODUCT_MODERATION_ACTION", {
        productId,
        status: isDeleteRequest && status === "Approved" ? "Deleted" : status,
        reason,
        moderatorEmail: user?.email,
        timestamp: new Date().toISOString()
      });

      // Clear states
      const updatedReasons = { ...rejectionReasons };
      delete updatedReasons[productId];
      setRejectionReasons(updatedReasons);

      // Refresh lists and analytics immediately!
      const allProds = await fetchAllProducts();
      setAllPendingProducts(allProds.filter(p => p.status === "Pending"));

      const stats = await fetchButtonClickStats();
      setClickStats(stats);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminModerateStore = async (storeId: string, status: "Approved" | "Rejected") => {
    const reason = rejectionReasons[storeId] || "";
    if (status === "Rejected" && !reason) {
      alert("Please specify a reason for rejecting the store profile.");
      return;
    }

    try {
      await moderateStore(storeId, status, reason);

      const logMsg = {
        productId: `store:${storeId}`,
        status: status === "Approved" ? "Store Approved" : "Store Rejected",
        reason,
        moderatedBy: user?.email,
        timestamp: new Date().toISOString()
      };
      setModerationLogs([logMsg, ...moderationLogs]);

      triggerWebhook("STORE_MODERATION_ACTION", {
        storeId,
        status,
        reason,
        moderatorEmail: user?.email,
        timestamp: new Date().toISOString()
      });

      // Clear states
      const updatedReasons = { ...rejectionReasons };
      delete updatedReasons[storeId];
      setRejectionReasons(updatedReasons);

      // Refresh lists and analytics immediately!
      const allStores = await fetchStores();
      setAllPendingStores(allStores.filter(s => s.status === "Pending" && s.registered));

      const stats = await fetchButtonClickStats();
      setClickStats(stats);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    try {
      await updateMessageTemplate(adminTemplate);
      setSaveTemplateSuccess(true);
      setTimeout(() => setSaveTemplateSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleRemoveWishlist = async (productId: string) => {
    if (!user) return;
    const newWishlist = await toggleWishlist(user.uid, productId);
    await refreshProfile();
    
    // Trigger webhook log
    triggerWebhook("WISHLIST_REMOVED_FROM_PROFILE", {
      userId: user.uid,
      productId,
      timestamp: new Date().toISOString()
    });
  };

  const handleUnfollowStore = async (storeId: string) => {
    if (!user) return;
    await toggleFollowShop(user.uid, storeId);
    await refreshProfile();

    // Trigger webhook log
    triggerWebhook("STORE_UNFOLLOWED_FROM_PROFILE", {
      userId: user.uid,
      storeId,
      timestamp: new Date().toISOString()
    });
  };

  // Mock announcement alerts list for followed shops (Page 5 Reference: Menu thông báo riêng của từng shop: Hình 3)
  const getMockNotification = (storeName: string) => {
    const alerts: Record<string, string> = {
      "Tí Clay Craft": "🔥 New wood-fired unglazed cups and dark clay vases are coming off the Biên Hòa kiln this Friday! Use coupon TICOOLTURE10 for early access.",
      "Saigon Weaver": "🧶 Ethnic minority weavers in our Highlands studio just completed a batch of midnight indigo tote bags. Exclusive pre-sale live now.",
    };
    return alerts[storeName] || "✨ New items uploaded and awaiting moderation review. Visit our boutique catalog for updates.";
  };

  // Wishlist Filtering Mock Logic
  const getFilteredWishlist = () => {
    switch (activeWishlistFilter) {
      case "WatchLater":
        // Simulated: return products that have the word "Vase" or "Tea" or simply alternate items
        return wishlistItems.filter((_, idx) => idx % 2 === 1);
      case "Sale":
        // Simulated price drops (simulate items with -15% tags or similar)
        return wishlistItems.filter(p => p.price < 400000);
      case "OutOfStock":
        // Simulated: Return empty or 1 mock item
        return [];
      default:
        return wishlistItems;
    }
  };

  const displayedWishlist = getFilteredWishlist();

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-neutral-100 font-mono text-xs">
        <span className="animate-pulse text-neutral-500">SYNCHRONIZING EXPLORER PROFILE...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 p-4 md:p-8 select-none space-y-8 font-sans">
      
      {/* Header Profile summary */}
      <div className="bg-white border-4 border-black p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-[6px_6px_0px_0px_#000000]">
        <div className="flex items-center space-x-3">
          <div className="p-2 border-2 border-black bg-neutral-100">
            {profile?.role === "Admin" ? (
              <Shield className="w-8 h-8 text-black" />
            ) : (
              <User className="w-8 h-8 text-black" />
            )}
          </div>
          <div>
            <span className="font-mono text-[9px] text-neutral-400 font-bold uppercase tracking-widest block">
              {profile?.role === "Admin" ? "// ADMIN SECURITY CREDENTIALS" : "// EXPLORER CREDENTIALS"}
            </span>
            <h1 className="font-display font-black text-xl uppercase tracking-tight text-black">
              {user?.email}
            </h1>
            <p className="text-xs font-mono text-neutral-500 uppercase mt-0.5">
              Profile Role: {profile?.role || "User"} • Registered on Tí Coolture
            </p>
          </div>
        </div>

        <Link 
          to="/" 
          className="px-4 py-2 bg-black text-white hover:bg-white hover:text-black border-2 border-black font-mono text-xs font-bold uppercase transition-all flex items-center space-x-1.5"
        >
          <Compass className="w-4 h-4" />
          <span>Launch Hub</span>
        </Link>
      </div>

      {profile?.role === "Admin" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main content: Boutiques & Products Queues + Analytics (Left 8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Queue 1: Pending Boutique Registrations */}
            <div className="space-y-4">
              <div className="border-b-2 border-black pb-2 flex justify-between items-center">
                <h2 className="font-display font-black text-sm uppercase text-black tracking-tight flex items-center space-x-2">
                  <Store className="w-4 h-4" />
                  <span>Pending Boutique Registrations ({allPendingStores.length})</span>
                </h2>
                <button 
                  onClick={loadProfileMetrics}
                  className="p-1 border border-black bg-white hover:bg-neutral-100 font-mono text-[10px] uppercase font-bold flex items-center space-x-1 shadow-[2px_2px_0px_0px_#000000]"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>REFRESH STREAM</span>
                </button>
              </div>

              {allPendingStores.length === 0 ? (
                <div className="border-2 border-dashed border-neutral-400 bg-white p-6 text-center text-neutral-400 shadow-[2px_2px_0px_0px_#000000]">
                  <Store className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                  <p className="font-mono text-[10px] uppercase font-bold text-black">No pending store registrations</p>
                  <p className="text-[9px] font-mono mt-0.5">All boutiques are verified and active.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {allPendingStores.map((pendingStore) => (
                    <div 
                      key={pendingStore.id} 
                      className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_0px_#000000] space-y-4"
                    >
                      <div className="flex items-start justify-between border-b border-neutral-200 pb-3">
                        <div className="flex items-center space-x-2">
                          {pendingStore.logoUrl && (
                            <img 
                              src={pendingStore.logoUrl} 
                              alt={pendingStore.name} 
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-full border border-black object-cover"
                            />
                          )}
                          <div>
                            <span className="font-mono text-[9px] text-neutral-400 uppercase block">SUBMITTED ON {new Date(pendingStore.createdAt).toLocaleDateString()}</span>
                            <h3 className="font-display font-bold text-sm uppercase text-black">{pendingStore.name}</h3>
                          </div>
                        </div>
                        <span className="font-mono text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-300 px-2 py-0.5 uppercase">
                          Awaiting Approval
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                        <div>
                          <span className="text-neutral-400 block uppercase text-[9px]">Owner Email</span>
                          <span className="font-bold text-black break-all">{pendingStore.email}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block uppercase text-[9px]">Tax ID (Mã Số Thuế)</span>
                          <span className="font-bold text-black">{pendingStore.taxId}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block uppercase text-[9px]">Contact Phone</span>
                          <span className="font-bold text-black">{pendingStore.phone}</span>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-neutral-400 block uppercase text-[9px]">Physical Address</span>
                          <span className="font-bold text-black">{pendingStore.address}</span>
                        </div>
                        <div className="md:col-span-2 border-t border-dashed border-neutral-200 pt-2">
                          <span className="text-neutral-400 block uppercase text-[9px]">Boutique Description</span>
                          <p className="text-neutral-700 italic font-sans text-xs mt-1 leading-relaxed">
                            {pendingStore.description || pendingStore.story || "No description provided."}
                          </p>
                        </div>
                      </div>

                      {/* Store Moderation Actions */}
                      <div className="pt-4 border-t border-neutral-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <div className="md:col-span-6">
                          <input
                            type="text"
                            placeholder="Rejection Reason (Required if Declining: e.g. 'Invalid Tax ID')"
                            value={rejectionReasons[pendingStore.id] || ""}
                            onChange={(e) => setRejectionReasons({
                              ...rejectionReasons,
                              [pendingStore.id]: e.target.value
                            })}
                            className="w-full border-2 border-black p-2 font-mono text-[11px] focus:outline-none"
                          />
                        </div>
                        <div className="md:col-span-6 flex space-x-2">
                          {/* Decline button */}
                          <button
                            onClick={() => handleAdminModerateStore(pendingStore.id, "Rejected")}
                            className="flex-1 bg-white hover:bg-red-50 text-red-600 border-2 border-red-600 py-2 text-[10px] font-bold uppercase transition-all flex items-center justify-center space-x-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>DECLINE STORE</span>
                          </button>
                          {/* Quick Approve button */}
                          <button
                            onClick={() => handleAdminModerateStore(pendingStore.id, "Approved")}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-700 py-2 text-[10px] font-bold uppercase transition-all flex items-center justify-center space-x-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>APPROVE STORE</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Queue 2: Pending Product Queue */}
            <div className="space-y-4">
              <div className="border-b-2 border-black pb-2 flex justify-between items-center">
                <h2 className="font-display font-black text-sm uppercase text-black tracking-tight flex items-center space-x-2">
                  <Layers className="w-4 h-4" />
                  <span>Pending Product Queue ({allPendingProducts.length})</span>
                </h2>
              </div>

              {allPendingProducts.length === 0 ? (
                <div className="border-2 border-dashed border-neutral-400 bg-white p-12 text-center text-neutral-400 shadow-[2px_2px_0px_0px_#000000]">
                  <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-mono text-xs uppercase font-bold text-black">All queues cleared!</p>
                  <p className="text-[11px] font-mono mt-1">No products are currently awaiting moderation checks.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {allPendingProducts.map((prod) => (
                    <div 
                      key={prod.id} 
                      className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_0px_#000000] space-y-4"
                    >
                      <div className="flex items-start justify-between border-b border-neutral-200 pb-3">
                        <div>
                          <span className="font-mono text-[9px] text-neutral-400 uppercase">SUBMITTED BY {prod.storeName.toUpperCase()}</span>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display font-bold text-base uppercase text-black">{prod.name}</h3>
                            {prod.deleteRequested && (
                              <span className="bg-red-100 text-red-800 border border-red-300 font-mono text-[9px] font-bold px-1.5 py-0.5 uppercase shrink-0 animate-pulse">
                                🚨 DELETION REQUEST
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-mono text-xs font-bold text-neutral-700 bg-neutral-100 border border-neutral-300 px-2 py-0.5 uppercase">
                          {prod.category}
                        </span>
                      </div>

                      <div className="flex flex-col md:flex-row gap-4">
                        <img 
                          src={prod.images[0]} 
                          alt={prod.name} 
                          referrerPolicy="no-referrer"
                          className="w-24 h-24 object-cover border-2 border-black flex-shrink-0" 
                        />

                        <div className="space-y-2 flex-1 text-xs">
                          <div>
                            <span className="font-mono text-[9px] text-neutral-400 uppercase">PRICE STRUCTURE</span>
                            <p className="font-mono font-bold text-black text-sm">{prod.price.toLocaleString()} VND</p>
                          </div>
                          <div>
                            <span className="font-mono text-[9px] text-neutral-400 uppercase">MATERIAL & COMPOSITION</span>
                            <p className="font-mono uppercase font-bold text-black">{prod.material || "Unspecified"}</p>
                          </div>
                          <div>
                            <span className="font-mono text-[9px] text-neutral-400 uppercase">NARRATIVE</span>
                            <p className="text-neutral-600 italic line-clamp-2">{prod.description}</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-neutral-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <div className="md:col-span-6">
                          <input
                            type="text"
                            placeholder="Rejection Reason (Required if Declining: e.g. 'Photos blurry')"
                            value={rejectionReasons[prod.id] || ""}
                            onChange={(e) => setRejectionReasons({
                              ...rejectionReasons,
                              [prod.id]: e.target.value
                            })}
                            className="w-full border-2 border-black p-2 font-mono text-[11px] focus:outline-none"
                          />
                        </div>
                        <div className="md:col-span-6 flex space-x-2">
                          <button
                            onClick={() => handleAdminModerate(prod.id, "Rejected")}
                            className="flex-1 bg-white hover:bg-red-50 text-red-600 border-2 border-red-600 py-2 text-[10px] font-bold uppercase transition-all flex items-center justify-center space-x-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{prod.deleteRequested ? "DECLINE REMOVAL" : "DECLINE"}</span>
                          </button>
                          <button
                            onClick={() => handleAdminModerate(prod.id, "Approved")}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-700 py-2 text-[10px] font-bold uppercase transition-all flex items-center justify-center space-x-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{prod.deleteRequested ? "APPROVE REMOVAL" : "QUICK APPROVE"}</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Analytics Section: Global Button Click Tracker */}
            <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
              <div className="border-b-4 border-black pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-display font-black text-lg uppercase text-black tracking-tight flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                    <span>Admin Analytics: Global Button Click Tracker</span>
                  </h2>
                  <p className="text-[11px] font-mono text-neutral-500 uppercase mt-0.5">
                    Real-time count of clicks on all button elements across every page
                  </p>
                </div>
                <button
                  onClick={async () => {
                    setLoadingStats(true);
                    const stats = await fetchButtonClickStats();
                    setClickStats(stats);
                    setLoadingStats(false);
                  }}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black border-2 border-black font-mono text-xs font-bold uppercase py-1.5 px-3 flex items-center space-x-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all shrink-0"
                >
                  <span>Refresh Stats</span>
                </button>
              </div>

              {loadingStats ? (
                <div className="text-center py-12 font-mono text-xs text-neutral-500 animate-pulse">
                  LOADING BUTTON CLICK TELEMETRY...
                </div>
              ) : clickStats.length === 0 ? (
                <p className="font-mono text-xs text-neutral-400 italic">No button click telemetry recorded yet. Go click some buttons!</p>
              ) : (
                <div className="overflow-x-auto border-2 border-black">
                  <table className="w-full text-left border-collapse font-mono text-xs text-black">
                    <thead>
                      <tr className="bg-neutral-100 border-b-2 border-black">
                        <th className="p-3 uppercase font-bold border-r-2 border-black">Button Label / Text</th>
                        <th className="p-3 uppercase font-bold border-r-2 border-black">Page Path</th>
                        <th className="p-3 uppercase font-bold border-r-2 border-black text-center">Clicks</th>
                        <th className="p-3 uppercase font-bold">Last Clicked At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clickStats.map((stat) => (
                        <tr key={stat.id} className="border-b border-neutral-300 hover:bg-neutral-50 transition-colors">
                          <td className="p-3 font-bold border-r-2 border-black flex items-center space-x-2">
                            <MousePointer className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span className="truncate max-w-xs sm:max-w-md">{stat.buttonText}</span>
                          </td>
                          <td className="p-3 border-r-2 border-black text-neutral-600">
                            <code>{stat.pagePath}</code>
                          </td>
                          <td className="p-3 border-r-2 border-black text-center font-bold text-emerald-600">
                            {stat.clicks}
                          </td>
                          <td className="p-3 text-neutral-400 text-[10px]">
                            {new Date(stat.lastClickedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* Sidebar: History Audit Logs & Message Compiler settings (Right 4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <h2 className="font-display font-black text-sm uppercase text-black tracking-tight border-b-2 border-black pb-2 flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Action History Audit</span>
            </h2>
            <div className="bg-white border-4 border-black p-4 space-y-4 shadow-[4px_4px_0px_0px_#000000] min-h-[180px]">
              {moderationLogs.length === 0 ? (
                <p className="font-mono text-[10px] text-neutral-400 italic">No operations logged in active session.</p>
              ) : (
                <div className="space-y-3 font-mono text-[10px]">
                  {moderationLogs.map((log, idx) => (
                    <div key={idx} className="border-b border-neutral-100 pb-2">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold uppercase ${
                          log.status === "Approved" || log.status === "Store Approved" ? "text-emerald-600" : "text-red-600"
                        }`}>
                          [{log.status}]
                        </span>
                        <span className="text-neutral-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-black font-bold mt-1 uppercase">ID: {log.productId}</p>
                      {log.reason && <p className="text-red-500 mt-0.5">Reason: {log.reason}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message Template compiler control box */}
            <div className="bg-white border-4 border-black p-4 space-y-4 shadow-[4px_4px_0px_0px_#000000]">
              <div className="border-b-2 border-black pb-1">
                <h3 className="font-display font-black text-xs uppercase text-black">
                  Message Compiler Settings
                </h3>
                <p className="text-[10px] font-mono text-neutral-400 uppercase mt-0.5">
                  Template for social purchasing prompts
                </p>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <label className="block text-[9px] font-bold text-neutral-500 uppercase">
                  Template string (use {"{product_name}"} dynamically)
                </label>
                <textarea
                  value={adminTemplate}
                  onChange={(e) => setAdminTemplate(e.target.value)}
                  className="w-full border-2 border-black p-1.5 font-mono text-[11px] focus:outline-none h-20 bg-neutral-50"
                  placeholder="Hi, I saw your product {product_name} on Tí Coolture and want to buy it"
                />

                <button
                  onClick={handleSaveTemplate}
                  disabled={savingTemplate}
                  className="w-full py-1.5 bg-black text-white hover:bg-neutral-800 border-2 border-black font-bold uppercase text-[10px] tracking-wide transition-all"
                >
                  {savingTemplate ? "SAVING CONFIGS..." : "SAVE MESSAGE TEMPLATE"}
                </button>

                {saveTemplateSuccess && (
                  <p className="text-[9px] text-emerald-600 font-bold uppercase text-center mt-1">
                    ✓ Template successfully synchronized!
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 1. WISHLIST SECTION (Left 8 columns) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="border-b-4 border-black pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display font-black text-lg uppercase text-black tracking-tight">
                  Your Curated Wishlist ({wishlistItems.length})
                </h2>
                <p className="text-[11px] font-mono text-neutral-500 uppercase mt-0.5">
                  Manage price warning thresholds and annotations
                </p>
              </div>

              {/* Custom filters for lists (Page 5 specifications: Tất cả sản phẩm đã lưu, Xem sau, Đang giảm giá, Đã hết hàng) */}
              <div className="flex flex-wrap border-2 border-black bg-white font-mono text-[9px] font-bold uppercase">
                {([
                  { id: "All", label: "All Saved" },
                  { id: "WatchLater", label: "Watch Later" },
                  { id: "Sale", label: "Price Drop" },
                  { id: "OutOfStock", label: "Out of Stock" }
                ] as const).map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveWishlistFilter(filter.id)}
                    className={`px-2.5 py-1.5 border-r border-black last:border-0 hover:bg-neutral-100 transition-colors ${
                      activeWishlistFilter === filter.id ? "bg-black text-white hover:bg-black" : "text-black"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {displayedWishlist.length === 0 ? (
              <div className="border-2 border-dashed border-neutral-400 bg-white p-12 text-center text-neutral-400">
                <Heart className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="font-mono text-xs uppercase font-bold text-black">Wishlist is currently empty</p>
                <p className="text-[11px] font-mono mt-1">Explore the homepage and tap hearts to save artisan creations.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {displayedWishlist.map((prod) => {
                  const note = profile?.wishlistNotes?.[prod.id] || "";
                  const alertPrice = profile?.wishlistPriceAlerts?.[prod.id] || prod.price;
                  const hasPriceAlertWarning = prod.price <= alertPrice;

                  return (
                    <div 
                      key={prod.id} 
                      className="bg-white border-4 border-black p-4 md:p-6 shadow-[4px_4px_0px_0px_#000000] grid grid-cols-1 md:grid-cols-12 gap-6 relative"
                      id={`wishlist-item-${prod.id}`}
                    >
                      {/* Image Block */}
                      <div className="md:col-span-3 aspect-square border-2 border-black bg-neutral-100 overflow-hidden">
                        <img 
                          src={prod.images[0]} 
                          alt={prod.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                      </div>

                      {/* Meta & Location Origins Details */}
                      <div className="md:col-span-5 space-y-3">
                        <div>
                          <span className="font-mono text-[9px] uppercase font-bold text-neutral-400 block">{prod.storeName}</span>
                          <h3 className="font-display font-black text-base uppercase text-black hover:underline">
                            <Link to={`/products/${prod.id}`}>{prod.name}</Link>
                          </h3>
                        </div>

                        {/* Location Origin details */}
                        <div className="flex items-center space-x-1 font-mono text-[10px] text-neutral-500 uppercase">
                          <MapPin className="w-3.5 h-3.5 text-black shrink-0" />
                          <span>Source: {prod.brand || prod.storeName} Workshop</span>
                        </div>

                        {/* Personal Custom Annotation */}
                        {note && (
                          <div className="bg-neutral-50 border border-neutral-300 p-2.5 space-y-1">
                            <span className="font-mono text-[9px] uppercase font-bold text-neutral-400 flex items-center space-x-1">
                              <FileText className="w-3 h-3 text-black" />
                              <span>Your Custom Note</span>
                            </span>
                            <p className="text-neutral-700 text-xs italic">"{note}"</p>
                          </div>
                        )}
                      </div>

                      {/* Price structure warnings alerts (Page 5 Reference: Location details and price alerts) */}
                      <div className="md:col-span-4 border-t-2 md:border-t-0 md:border-l-2 border-black pt-4 md:pt-0 md:pl-6 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <span className="font-mono text-[9px] uppercase font-bold text-neutral-400 block">PRICING PROFILE</span>
                          <p className="font-mono font-black text-black text-base">{prod.price.toLocaleString()} VND</p>
                          
                          {/* Price alert target indicators */}
                          {alertPrice > 0 && (
                            <div className="flex items-center space-x-1 font-mono text-[10px]">
                              <Bell className="w-3.5 h-3.5 text-black shrink-0" />
                              <span className="text-neutral-500">Alert threshold:</span>
                              <span className="text-black font-bold">{alertPrice.toLocaleString()} VND</span>
                            </div>
                          )}

                          {/* Price Warnings status indicator */}
                          {hasPriceAlertWarning && (
                            <span className="inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[8px] font-mono font-bold uppercase">
                              ✓ Targets met / Discount alert active
                            </span>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <Link
                            to={`/products/${prod.id}`}
                            className="flex-1 text-center py-1.5 border border-black bg-black text-white hover:bg-white hover:text-black font-mono text-[10px] font-bold uppercase transition-all"
                          >
                            Explore Details
                          </Link>
                          <button
                            onClick={() => handleRemoveWishlist(prod.id)}
                            className="p-1.5 border border-red-600 hover:bg-red-50 text-red-600"
                            title="Remove from wishlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. FOLLOWED PAGES SECTION (Right 4 columns) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="border-b-4 border-black pb-3">
              <h2 className="font-display font-black text-lg uppercase text-black tracking-tight">
                Followed Artisan Pages ({followedStores.length})
              </h2>
              <p className="text-[11px] font-mono text-neutral-500 uppercase mt-0.5">
                Direct telemetry from registered boutiques
              </p>
            </div>

            {followedStores.length === 0 ? (
              <div className="border-2 border-dashed border-neutral-400 bg-white p-6 text-center text-neutral-400">
                <Store className="w-6 h-6 text-neutral-300 mx-auto mb-1.5" />
                <p className="font-mono text-[10px] uppercase font-bold text-black">No boutique followed</p>
                <p className="text-[9px] font-mono mt-1">Tap Follow on any store page to track artisan channels.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {followedStores.map((store) => (
                  <div 
                    key={store.id} 
                    className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_#000000] space-y-4"
                    id={`followed-shop-${store.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <img src={store.logoUrl} className="w-8 h-8 rounded-full border border-black" referrerPolicy="no-referrer" />
                        <h4 className="font-display font-black text-xs uppercase text-black hover:underline">
                          <Link to={`/stores/${store.id}`}>{store.name}</Link>
                        </h4>
                      </div>
                      <button
                        onClick={() => handleUnfollowStore(store.id)}
                        className="text-[9px] font-mono text-neutral-400 hover:text-red-500 uppercase underline"
                      >
                        Unfollow
                      </button>
                    </div>

                    {/* Mock announcements / special notifications from each shop (Page 5 Reference: Menu thông báo riêng của từng shop) */}
                    <div className="bg-neutral-50 border border-neutral-200 p-3 space-y-2">
                      <span className="font-mono text-[9px] uppercase font-bold text-black flex items-center space-x-1">
                        <MessageSquare className="w-3 h-3 text-neutral-500" />
                        <span>Artisan Broadcaster</span>
                      </span>
                      <p className="text-[11px] text-neutral-600 leading-relaxed font-sans italic">
                        {getMockNotification(store.name)}
                      </p>
                    </div>

                    <Link
                      to={`/stores/${store.id}`}
                      className="w-full block text-center py-1.5 border border-black text-[10px] font-mono font-bold uppercase hover:bg-black hover:text-white transition-all bg-white text-black"
                    >
                      Enter Showroom →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
