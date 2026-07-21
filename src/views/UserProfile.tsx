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
  updateMessageTemplate,
  incrementProductClick,
  logApprovalActivity,
  fetchApprovalLogs
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
  const [activeAdminTab, setActiveAdminTab] = useState<"Registrations" | "Products" | "Analytics" | "AllShops" | "AllProducts" | "DeleteRequests">("Registrations");
  const [allPendingProducts, setAllPendingProducts] = useState<Product[]>([]);
  const [allPendingStores, setAllPendingStores] = useState<StoreProfile[]>([]);
  const [allStoresList, setAllStoresList] = useState<StoreProfile[]>([]);
  const [allProductsList, setAllProductsList] = useState<Product[]>([]);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [moderationLogs, setModerationLogs] = useState<any[]>([]);
  const [adminTemplate, setAdminTemplate] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [saveTemplateSuccess, setSaveTemplateSuccess] = useState(false);

  // Dynamic ticking countdown state
  const [timerTick, setTimerTick] = useState(0);
  useEffect(() => {
    if (activeAdminTab === "AllShops") {
      const interval = setInterval(() => {
        setTimerTick(t => t + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeAdminTab]);

  const getTimerRemaining = (scheduledStr: string) => {
    const diff = new Date(scheduledStr).getTime() - Date.now();
    if (diff <= 0) return "Ready for deletion";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s remaining`;
  };

  const handleToggleHideStore = async (storeId: string, currentHidden: boolean) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "stores", storeId), {
        hidden: !currentHidden
      });
      await loadProfileMetrics();
      alert(`Shop has been successfully ${!currentHidden ? "hidden" : "shown"}!`);
    } catch (err) {
      console.error(err);
      alert("Error toggling shop visibility.");
    }
  };

  const handleTriggerStoreDeleteTimer = async (storeId: string) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const deleteScheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await updateDoc(doc(db, "stores", storeId), {
        deleteScheduledAt
      });
      await loadProfileMetrics();
      alert("Deletion timer initiated. This shop is scheduled to be deleted in 24 hours.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelStoreDelete = async (storeId: string) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const storeRef = doc(db, "stores", storeId);
      await updateDoc(storeRef, {
        deleteScheduledAt: null
      });
      await loadProfileMetrics();
      alert("Deletion schedule canceled.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleImmediateStoreDelete = async (storeId: string) => {
    if (!window.confirm("Are you sure you want to delete this shop and all of its products immediately? This action is permanent and cannot be undone.")) return;
    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "stores", storeId));
      
      const { fetchProductsStore } = await import("../lib/dbService");
      const prods = await fetchProductsStore(storeId);
      for (const p of prods) {
        await deleteDoc(doc(db, "products", p.id));
      }

      await loadProfileMetrics();
      alert("Shop and all its products have been deleted successfully.");
    } catch (err) {
      console.error(err);
      alert("Error deleting shop.");
    }
  };

  const handleToggleHideProduct = async (productId: string, currentHidden: boolean) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "products", productId), {
        hidden: !currentHidden
      });
      await loadProfileMetrics();
      alert(`Product has been successfully ${!currentHidden ? "hidden" : "shown"}!`);
    } catch (err) {
      console.error(err);
      alert("Error toggling product visibility.");
    }
  };

  const handleImmediateProductDelete = async (productId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this product?")) return;
    try {
      await permanentlyDeleteProduct(productId);
      await loadProfileMetrics();
      alert("Product permanently deleted.");
    } catch (err) {
      console.error(err);
      alert("Error deleting product.");
    }
  };

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
        setAllProductsList(allProds);

        // 3. Fetch pending stores
        const allStores = await fetchStores();
        setAllPendingStores(allStores.filter(s => s.status === "Pending" && s.registered));
        setAllStoresList(allStores.filter(s => s.registered));

        // 4. Fetch message template
        const t = await fetchMessageTemplate();
        setAdminTemplate(t);

        // 5. Fetch approval activity logs
        const logs = await fetchApprovalLogs();
        setModerationLogs(logs);

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

      await logApprovalActivity({
        productId,
        productName: targetProduct?.name || "Unknown Product",
        storeId: targetProduct?.storeId || "",
        storeName: targetProduct?.storeName || "",
        activity: isDeleteRequest 
          ? (status === "Approved" ? "Deletion Request Approved (Permanently Deleted)" : "Deletion Request Rejected")
          : `Product ${status}`,
        actor: user?.email || "Admin",
        reason: reason || undefined
      });

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

      // Refresh lists, logs, and analytics immediately!
      const allProds = await fetchAllProducts();
      setAllPendingProducts(allProds.filter(p => p.status === "Pending"));

      const logs = await fetchApprovalLogs();
      setModerationLogs(logs);

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

    const targetStore = allPendingStores.find(s => s.id === storeId);

    try {
      await moderateStore(storeId, status, reason);

      await logApprovalActivity({
        productId: "",
        productName: "",
        storeId: storeId,
        storeName: targetStore?.name || "Unknown Store",
        activity: `Store Registration ${status}`,
        actor: user?.email || "Admin",
        reason: reason || undefined
      });

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

      // Refresh lists, logs, and analytics immediately!
      const allStores = await fetchStores();
      setAllPendingStores(allStores.filter(s => s.status === "Pending" && s.registered));

      const logs = await fetchApprovalLogs();
      setModerationLogs(logs);

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
          <div className="lg:col-span-8 space-y-6">
            
            {/* Admin Tab Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] select-none">
              <button
                onClick={() => setActiveAdminTab("Registrations")}
                className={`py-3 text-[10px] font-mono font-bold uppercase transition-all border-b lg:border-b-0 border-r-2 border-black flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 ${
                  activeAdminTab === "Registrations" ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100"
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Registrations ({allPendingStores.length})</span>
              </button>
              <button
                onClick={() => setActiveAdminTab("Products")}
                className={`py-3 text-[10px] font-mono font-bold uppercase transition-all border-b lg:border-b-0 border-r-2 border-black flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 ${
                  activeAdminTab === "Products" ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Product Queue ({allPendingProducts.length})</span>
              </button>
              <button
                onClick={() => setActiveAdminTab("AllShops")}
                className={`py-3 text-[10px] font-mono font-bold uppercase transition-all border-b lg:border-b-0 border-r-2 border-black flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 ${
                  activeAdminTab === "AllShops" ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Manage Shops</span>
              </button>
              <button
                onClick={() => setActiveAdminTab("AllProducts")}
                className={`py-3 text-[10px] font-mono font-bold uppercase transition-all border-b border-r-2 border-black flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 ${
                  activeAdminTab === "AllProducts" ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100"
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Manage Products</span>
              </button>
              <button
                onClick={() => setActiveAdminTab("DeleteRequests")}
                className={`py-3 text-[10px] font-mono font-bold uppercase transition-all border-b border-r-2 sm:border-r-0 lg:border-r-2 border-black flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 ${
                  activeAdminTab === "DeleteRequests" ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100"
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Requests ({allStoresList.filter(s => s.accountDeleteRequested).length})</span>
              </button>
              <button
                onClick={() => setActiveAdminTab("Analytics")}
                className={`py-3 text-[10px] font-mono font-bold uppercase transition-all flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 ${
                  activeAdminTab === "Analytics" ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Analytics</span>
              </button>
            </div>

            {/* Tab 1: Pending Boutique Registrations */}
            {activeAdminTab === "Registrations" && (
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
            )}

            {/* Tab 2: Pending Product Queue */}
            {activeAdminTab === "Products" && (
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
            )}

            {/* Tab 3: Analytics Section: Global Button Click Tracker */}
            {activeAdminTab === "Analytics" && (
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
            )}

            {/* Tab 4: All Shops management */}
            {activeAdminTab === "AllShops" && (
              <div className="space-y-4">
                <div className="border-b-2 border-black pb-2 flex justify-between items-center">
                  <h2 className="font-display font-black text-sm uppercase text-black tracking-tight flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Quản lý tất cả Shops ({allStoresList.length})</span>
                  </h2>
                  <button 
                    onClick={loadProfileMetrics}
                    className="p-1 border border-black bg-white hover:bg-neutral-100 font-mono text-[10px] uppercase font-bold flex items-center space-x-1 shadow-[2px_2px_0px_0px_#000000]"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>REFRESH</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {allStoresList.map((store) => {
                    const hasTimer = !!store.deleteScheduledAt;
                    return (
                      <div 
                        key={store.id} 
                        className={`bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000000] space-y-3 ${
                          store.hidden ? "opacity-75 bg-neutral-50" : ""
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-200 pb-2 gap-2">
                          <div className="flex items-center space-x-3">
                            {store.logoUrl && (
                              <img 
                                src={store.logoUrl} 
                                alt={store.name} 
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 rounded-full border border-black object-cover"
                              />
                            )}
                            <div>
                              <h3 className="font-display font-bold text-sm uppercase text-black">{store.name}</h3>
                              <p className="font-mono text-[9px] text-neutral-400 uppercase">Store ID: {store.id}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {store.hidden && (
                              <span className="font-mono text-[9px] font-bold text-neutral-600 bg-neutral-100 border border-neutral-300 px-2 py-0.5 uppercase">
                                Đang Ẩn (Hidden)
                              </span>
                            )}
                            <span className={`font-mono text-[9px] font-bold border px-2 py-0.5 uppercase ${
                              store.status === "Approved" ? "text-emerald-700 bg-emerald-50 border-emerald-300" :
                              store.status === "Pending" ? "text-amber-700 bg-amber-50 border-amber-300" :
                              "text-red-700 bg-red-50 border-red-300"
                            }`}>
                              {store.status || "Unverified"}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs font-mono text-neutral-600">
                          <div>
                            <span className="text-neutral-400 block uppercase text-[8px]">Owner Email</span>
                            <span className="font-bold text-black break-all">{store.email}</span>
                          </div>
                          <div>
                            <span className="text-neutral-400 block uppercase text-[8px]">Address</span>
                            <span className="text-black truncate block">{store.address || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-neutral-400 block uppercase text-[8px]">Tax ID</span>
                            <span className="text-black">{store.taxId || "N/A"}</span>
                          </div>
                        </div>

                        {/* Store Deletion Timer Display */}
                        {hasTimer && (
                          <div className="bg-red-50 border border-red-500 p-2 text-xs font-mono text-red-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div>
                              <span className="font-bold uppercase text-[10px]">⏰ Timer 24h Đã Kích Hoạt</span>
                              <p className="text-[11px] font-sans text-neutral-700">
                                Thời gian còn lại: <span className="font-mono font-bold text-red-600">{getTimerRemaining(store.deleteScheduledAt!)}</span>
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleImmediateStoreDelete(store.id)}
                                className="px-2.5 py-1 bg-red-600 text-white hover:bg-red-700 border border-black font-mono text-[10px] font-bold uppercase transition-all shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[0.5px] hover:translate-y-[0.5px]"
                              >
                                Xoá Ngay
                              </button>
                              <button
                                onClick={() => handleCancelStoreDelete(store.id)}
                                className="px-2.5 py-1 bg-white text-black hover:bg-neutral-100 border border-black font-mono text-[10px] font-bold uppercase transition-all shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[0.5px] hover:translate-y-[0.5px]"
                              >
                                Huỷ Xoá
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Shop Actions */}
                        <div className="flex gap-2 pt-2 border-t border-neutral-100 justify-end">
                          <button
                            onClick={() => handleToggleHideStore(store.id, !!store.hidden)}
                            className="px-3 py-1 border border-black bg-white hover:bg-neutral-100 font-mono text-[10px] uppercase font-bold transition-all shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-y-0.5"
                          >
                            {store.hidden ? "Hiện Shop" : "Ẩn Shop"}
                          </button>

                          {!hasTimer && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Bạn có chắc muốn bắt đầu đếm ngược 24 tiếng để xoá shop "${store.name}" và toàn bộ sản phẩm?`)) {
                                  handleTriggerStoreDeleteTimer(store.id);
                                }
                              }}
                              className="px-3 py-1 border border-black bg-red-100 hover:bg-red-200 text-red-800 font-mono text-[10px] uppercase font-bold transition-all shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-y-0.5"
                            >
                              Xoá Shop
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {allStoresList.length === 0 && (
                    <p className="font-mono text-xs text-neutral-400 text-center py-6">Không tìm thấy shop nào.</p>
                  )}
                </div>
              </div>
            )}

            {/* Tab 5: All Products management */}
            {activeAdminTab === "AllProducts" && (
              <div className="space-y-4">
                <div className="border-b-2 border-black pb-2 flex justify-between items-center">
                  <h2 className="font-display font-black text-sm uppercase text-black tracking-tight flex items-center space-x-2">
                    <Tag className="w-4 h-4" />
                    <span>Quản lý tất cả Products ({allProductsList.length})</span>
                  </h2>
                  <button 
                    onClick={loadProfileMetrics}
                    className="p-1 border border-black bg-white hover:bg-neutral-100 font-mono text-[10px] uppercase font-bold flex items-center space-x-1 shadow-[2px_2px_0px_0px_#000000]"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>REFRESH</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {allProductsList.map((product) => (
                    <div 
                      key={product.id} 
                      className={`bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000000] space-y-3 ${
                        product.hidden ? "opacity-75 bg-neutral-50" : ""
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-200 pb-2 gap-2">
                        <div className="flex items-center space-x-3">
                          {product.images?.[0] && (
                            <img 
                              src={product.images[0]} 
                              alt={product.name} 
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 border border-black object-cover"
                            />
                          )}
                          <div>
                            <h3 className="font-display font-bold text-sm uppercase text-black">{product.name}</h3>
                            <span className="font-mono text-[9px] text-neutral-400 uppercase">Shop: {product.storeName}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 items-center">
                          {product.hidden && (
                            <span className="font-mono text-[9px] font-bold text-neutral-600 bg-neutral-100 border border-neutral-300 px-2 py-0.5 uppercase">
                              Đang Ẩn (Hidden)
                            </span>
                          )}
                          <span className={`font-mono text-[9px] font-bold border px-2 py-0.5 uppercase ${
                            product.status === "Approved" ? "text-emerald-700 bg-emerald-50 border-emerald-300" :
                            product.status === "Pending" ? "text-amber-700 bg-amber-50 border-amber-300" :
                            "text-red-700 bg-red-50 border-red-300"
                          }`}>
                            {product.status || "Unapproved"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono text-neutral-600">
                        <div>
                          <span className="text-neutral-400 block uppercase text-[8px]">Price</span>
                          <span className="font-bold text-black">{product.price.toLocaleString()} VND</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block uppercase text-[8px]">Category</span>
                          <span className="text-black">{product.category}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block uppercase text-[8px]">Material</span>
                          <span className="text-black">{product.material || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block uppercase text-[8px]">Brand</span>
                          <span className="text-black">{product.brand || "N/A"}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-neutral-100 justify-end">
                        <button
                          onClick={() => handleToggleHideProduct(product.id, !!product.hidden)}
                          className="px-3 py-1 border border-black bg-white hover:bg-neutral-100 font-mono text-[10px] uppercase font-bold transition-all shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-y-0.5"
                        >
                          {product.hidden ? "Hiện Sản Phẩm" : "Ẩn Sản Phẩm"}
                        </button>

                        <button
                          onClick={() => handleImmediateProductDelete(product.id)}
                          className="px-3 py-1 border border-black bg-red-100 hover:bg-red-200 text-red-800 font-mono text-[10px] uppercase font-bold transition-all shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-y-0.5"
                        >
                          Xoá Vĩnh Viễn
                        </button>
                      </div>
                    </div>
                  ))}

                  {allProductsList.length === 0 && (
                    <p className="font-mono text-xs text-neutral-400 text-center py-6">Không tìm thấy sản phẩm nào.</p>
                  )}
                </div>
              </div>
            )}

            {/* Tab 6: Deletion requests */}
            {activeAdminTab === "DeleteRequests" && (
              <div className="space-y-4">
                <div className="border-b-2 border-black pb-2 flex justify-between items-center">
                  <h2 className="font-display font-black text-sm uppercase text-black tracking-tight flex items-center space-x-2">
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span>Yêu cầu xoá tài khoản ({allStoresList.filter(s => s.accountDeleteRequested).length})</span>
                  </h2>
                  <button 
                    onClick={loadProfileMetrics}
                    className="p-1 border border-black bg-white hover:bg-neutral-100 font-mono text-[10px] uppercase font-bold flex items-center space-x-1 shadow-[2px_2px_0px_0px_#000000]"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>REFRESH</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {allStoresList.filter(s => s.accountDeleteRequested).map((store) => (
                    <div 
                      key={store.id} 
                      className="bg-red-50 border-4 border-red-500 p-4 shadow-[4px_4px_0px_0px_#000000] space-y-3"
                    >
                      <div className="flex justify-between items-center border-b border-red-200 pb-2">
                        <div className="flex items-center space-x-3">
                          {store.logoUrl && (
                            <img 
                              src={store.logoUrl} 
                              alt={store.name} 
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-full border border-black object-cover"
                            />
                          )}
                          <div>
                            <h3 className="font-display font-bold text-sm uppercase text-red-950">{store.name}</h3>
                            <p className="font-mono text-[9px] text-red-700 uppercase">Store ID: {store.id}</p>
                          </div>
                        </div>
                        <span className="font-mono text-[9px] font-bold text-red-700 bg-white border border-red-300 px-2 py-0.5 uppercase">
                          CẦN DUYỆT XOÁ (Delete Requested)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono text-red-900">
                        <div>
                          <span className="text-red-700 block uppercase text-[8px]">Owner Email</span>
                          <span className="font-bold break-all">{store.email}</span>
                        </div>
                        <div>
                          <span className="text-red-700 block uppercase text-[8px]">Tax ID</span>
                          <span>{store.taxId || "N/A"}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-red-200 justify-end">
                        <button
                          onClick={async () => {
                            if (window.confirm(`Bạn có chắc chắn muốn CHẤP THUẬN yêu cầu xoá cửa hàng "${store.name}" và toàn bộ sản phẩm của họ vĩnh viễn không?`)) {
                              await handleImmediateStoreDelete(store.id);
                            }
                          }}
                          className="px-3 py-1 border border-black bg-red-600 hover:bg-red-700 text-white font-mono text-[10px] uppercase font-bold transition-all shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-y-0.5"
                        >
                          Đồng Ý Xoá
                        </button>

                        <button
                          onClick={async () => {
                            if (window.confirm(`Bạn có chắc chắn muốn TỪ CHỐI yêu cầu xoá tài khoản này?`)) {
                              try {
                                const { doc, updateDoc } = await import("firebase/firestore");
                                await updateDoc(doc(db, "stores", store.id), {
                                  accountDeleteRequested: false
                                });
                                await loadProfileMetrics();
                                alert("Đã từ chối yêu cầu xoá tài khoản.");
                              } catch (err) {
                                console.error(err);
                              }
                            }
                          }}
                          className="px-3 py-1 border border-black bg-white hover:bg-neutral-100 text-black font-mono text-[10px] uppercase font-bold transition-all shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-y-0.5"
                        >
                          Từ Chối
                        </button>
                      </div>
                    </div>
                  ))}

                  {allStoresList.filter(s => s.accountDeleteRequested).length === 0 && (
                    <p className="font-mono text-xs text-neutral-400 text-center py-6">Không có yêu cầu xoá tài khoản nào đang chờ duyệt.</p>
                  )}
                </div>
              </div>
            )}

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
                <div className="space-y-3 font-mono text-[10px] max-h-[400px] overflow-y-auto pr-1">
                  {moderationLogs.map((log, idx) => (
                    <div key={idx} className="border-b border-neutral-100 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold uppercase text-[9px] ${
                          log.activity.includes("Approved") || log.activity.includes("approved")
                            ? "text-emerald-600"
                            : log.activity.includes("Rejected") || log.activity.includes("rejected") || log.activity.includes("Declined")
                            ? "text-red-600"
                            : "text-blue-600"
                        }`}>
                          [{log.activity}]
                        </span>
                        <span className="text-neutral-400 font-bold text-[9px]">
                          {new Date(log.timestamp).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      {log.productName ? (
                        <p className="text-black font-bold mt-1 text-[11px] font-sans">Product: {log.productName}</p>
                      ) : log.storeName ? (
                        <p className="text-black font-bold mt-1 text-[11px] font-sans">Store: {log.storeName}</p>
                      ) : null}
                      {log.reason && <p className="text-red-500 mt-1 uppercase text-[9px] bg-red-50 p-1 border border-red-100">Reason: {log.reason}</p>}
                      <p className="text-neutral-400 text-[8px] uppercase mt-0.5">By: {log.actor}</p>
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
                            <Link 
                              to={`/products/${prod.id}`}
                              onClick={async () => {
                                await incrementProductClick(prod.id);
                              }}
                            >
                              {prod.name}
                            </Link>
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
                            onClick={async () => {
                              await incrementProductClick(prod.id);
                            }}
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
