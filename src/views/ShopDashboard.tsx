import React, { useEffect, useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { 
  upsertStoreProfile, 
  createProduct, 
  fetchProductsStore, 
  fetchAllProducts, 
  moderateProduct, 
  triggerWebhook,
  updateProduct,
  requestDeleteProduct,
  permanentlyDeleteProduct,
  moderateStore,
  fetchStores,
  logApprovalActivity,
  fetchApprovalLogs
} from "../lib/dbService";
import { StoreProfile, Product, StoreSocials, StoreSocialToggles } from "../types";
import { 
  Store, 
  UploadCloud, 
  Share2, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  AlertCircle, 
  Clock, 
  Layers,
  ChevronRight,
  Sparkles,
  RefreshCw,
  FileText
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { ImageUploader } from "../components/ImageUploader";

type Tab = "Registration" | "Upload" | "Socials" | "Moderation";

export default function ShopDashboard() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Shop state
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Registration");

  // Tab 1: Shop Registration Form State
  const [shopName, setShopName] = useState("");
  const [shopLogo, setShopLogo] = useState("");
  const [shopCover, setShopCover] = useState("");
  const [shopStory, setShopStory] = useState("");
  const [shopVibe, setShopVibe] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopEmail, setShopEmail] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopTaxId, setShopTaxId] = useState("");
  const [submittingReg, setSubmittingReg] = useState(false);

  // Tab 2: Upload Product Form State
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState(0);
  const [prodDescription, setProdDescription] = useState("");
  const [prodCategory, setProdCategory] = useState("Tableware");
  const [prodMaterial, setProdMaterial] = useState("");
  const [prodSize, setProdSize] = useState("");
  const [prodBrand, setProdBrand] = useState("");
  const [prodStory, setProdStory] = useState("");
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [newImageInput, setNewImageInput] = useState("");
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [productSuccessMsg, setProductSuccessMsg] = useState(false);

  // Edit Product States
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState(0);
  const [editMaterial, setEditMaterial] = useState("");
  const [editSize, setEditSize] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editCategory, setEditCategory] = useState("Tableware");
  const [editDescription, setEditDescription] = useState("");
  const [editStory, setEditStory] = useState("");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editImageInput, setEditImageInput] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Tab 3: Socials Form State
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [threadsUrl, setThreadsUrl] = useState("");
  const [facebookVisible, setFacebookVisible] = useState(true);
  const [instagramVisible, setInstagramVisible] = useState(true);
  const [tiktokVisible, setTiktokVisible] = useState(true);
  const [threadsVisible, setThreadsVisible] = useState(true);
  const [savingSocials, setSavingSocials] = useState(false);

  // Admin Workspace State (If role is Admin)
  const [allPendingProducts, setAllPendingProducts] = useState<Product[]>([]);
  const [allPendingStores, setAllPendingStores] = useState<StoreProfile[]>([]);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [moderationLogs, setModerationLogs] = useState<any[]>([]);

  // Admin message template states
  const [adminTemplate, setAdminTemplate] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [saveTemplateSuccess, setSaveTemplateSuccess] = useState(false);

  // Auth Redirect guard
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth-gateway");
    }
  }, [user, authLoading]);

  // Load Store Profile and products
  const loadStoreData = async () => {
    if (!user) return;
    setLoading(true);

    const storeId = `store_${user.uid}`;
    const docRef = doc(db, "stores", storeId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const sData = { id: docSnap.id, ...docSnap.data() } as StoreProfile;
      setStore(sData);
      
      // Seed registration states
      setShopName(sData.name || "");
      setShopLogo(sData.logoUrl || "");
      setShopCover(sData.coverUrl || "");
      setShopStory("");
      setShopVibe("");
      setShopDescription(sData.description || [sData.story, sData.vibe].filter(Boolean).join("\n\n") || "");
      setShopPhone(sData.phone || "");
      setShopEmail(sData.email || sData.id + "@shop.vn");
      setShopAddress(sData.address || "");
      setShopTaxId(sData.taxId || "");

      // Seed Social states
      setFacebookUrl(sData.socials?.facebook || "");
      setInstagramUrl(sData.socials?.instagram || "");
      setTiktokUrl(sData.socials?.tiktok || "");
      setThreadsUrl(sData.socials?.threads || "");
      setFacebookVisible(sData.socialToggles?.facebook ?? true);
      setInstagramVisible(sData.socialToggles?.instagram ?? true);
      setTiktokVisible(sData.socialToggles?.tiktok ?? true);
      setThreadsVisible(sData.socialToggles?.threads ?? true);

      // Fetch store specific products
      const pData = await fetchProductsStore(storeId);
      setProducts(pData);
      
      // Set default tab for registered shops to Upload
      setActiveTab("Upload");
    } else {
      // If unregistered, pre-fill some defaults
      setShopEmail(user.email || "");
      setActiveTab("Registration");
    }

    // Fetch approval logs
    try {
      const logs = await fetchApprovalLogs(profile?.role === "Admin" ? undefined : storeId);
      setModerationLogs(logs);
    } catch (logErr) {
      console.error("Failed to load approval logs:", logErr);
    }

    // If Admin, load all products for review
    if (profile?.role === "Admin") {
      const allProds = await fetchAllProducts();
      setAllPendingProducts(allProds.filter(p => p.status === "Pending"));
      
      const allStores = await fetchStores();
      setAllPendingStores(allStores.filter(s => s.status === "Pending" && s.registered));

      const { fetchMessageTemplate } = await import("../lib/dbService");
      const t = await fetchMessageTemplate();
      setAdminTemplate(t);
    }

    setLoading(false);
  };

  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    try {
      const { updateMessageTemplate } = await import("../lib/dbService");
      await updateMessageTemplate(adminTemplate);
      setSaveTemplateSuccess(true);
      setTimeout(() => setSaveTemplateSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTemplate(false);
    }
  };

  useEffect(() => {
    if (user && profile) {
      loadStoreData();
    }
  }, [user, profile]);

  // Submit Shop Registration (Tab 1)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmittingReg(true);

    const storeId = `store_${user.uid}`;
    const storeProfileData: Partial<StoreProfile> = {
      userId: user.uid,
      name: shopName,
      logoUrl: shopLogo || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=150",
      coverUrl: shopCover || "https://images.unsplash.com/photo-1565192647048-f997ded87958?w=1000",
      story: "",
      vibe: "",
      description: shopDescription,
      phone: shopPhone,
      email: shopEmail,
      address: shopAddress,
      taxId: shopTaxId,
      registered: true,
      socials: store?.socials || { facebook: "", instagram: "", tiktok: "", threads: "" },
      socialToggles: store?.socialToggles || { facebook: true, instagram: true, tiktok: true, threads: true, website: false, zalo: false }
    };

    try {
      await upsertStoreProfile(storeId, storeProfileData);
      await refreshProfile();
      await loadStoreData();

      // Trigger webhook for shop registration
      triggerWebhook("SHOP_REGISTERED_OR_UPDATED", {
        storeId,
        storeName: shopName,
        email: shopEmail,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReg(false);
    }
  };

  // Submit Product for moderation (Tab 2)
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !user) return;

    if (Number(prodPrice) < 0) {
      alert("Product price cannot be negative.");
      return;
    }

    setSubmittingProduct(true);

    const productPayload = {
      storeId: store.id,
      storeName: store.name,
      storeLogo: store.logoUrl,
      name: prodName,
      price: Number(prodPrice),
      currency: "VND",
      description: prodDescription,
      images: prodImages,
      category: prodCategory,
      variants: ["Standard"],
      material: prodMaterial,
      size: prodSize,
      brand: prodBrand || store.name,
      story: "",
      status: "Pending" as const
    };

    try {
      const newProductId = await createProduct(productPayload);
      
      await logApprovalActivity({
        productId: newProductId,
        productName: prodName,
        storeId: store.id,
        storeName: store.name,
        activity: "Product Submitted",
        actor: user.email || store.email || "Shop Owner"
      });

      // Reset upload inputs
      setProdName("");
      setProdPrice(0);
      setProdDescription("");
      setProdMaterial("");
      setProdSize("");
      setProdStory("");
      setProdImages([]);

      setProductSuccessMsg(true);
      setTimeout(() => setProductSuccessMsg(false), 4000);

      // Refresh product list and logs
      const pData = await fetchProductsStore(store.id);
      setProducts(pData);

      const logs = await fetchApprovalLogs(store.id);
      setModerationLogs(logs);

      // Trigger webhook
      triggerWebhook("PRODUCT_SUBMITTED_FOR_MODERATION", {
        storeId: store.id,
        storeName: store.name,
        productName: prodName,
        price: prodPrice,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Submit product edit for moderation (resets status to Pending)
  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !store) return;

    if (Number(editPrice) < 0) {
      alert("Product price cannot be negative.");
      return;
    }

    setSubmittingEdit(true);
    try {
      await updateProduct(editingProduct.id, {
        name: editName,
        price: Number(editPrice),
        material: editMaterial,
        size: editSize,
        brand: editBrand || store.name,
        category: editCategory,
        description: editDescription,
        story: editStory,
        images: editImages.length > 0 ? editImages : editingProduct.images,
        deleteRequested: false // clear deletion request on edit
      });

      await logApprovalActivity({
        productId: editingProduct.id,
        productName: editName,
        storeId: store.id,
        storeName: store.name,
        activity: "Product Edited / Resubmitted",
        actor: user.email || store.email || "Shop Owner"
      });

      setEditingProduct(null);
      
      // Refresh list
      const pData = await fetchProductsStore(store.id);
      setProducts(pData);

      const logs = await fetchApprovalLogs(store.id);
      setModerationLogs(logs);
      
      triggerWebhook("PRODUCT_EDITED_BY_SHOP", {
        productId: editingProduct.id,
        storeId: store.id,
        name: editName,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleAddImage = () => {
    if (newImageInput.trim() && prodImages.length < 5) {
      setProdImages([...prodImages, newImageInput.trim()]);
      setNewImageInput("");
    }
  };

  const handleRemoveImage = (idx: number) => {
    if (prodImages.length > 1) {
      setProdImages(prodImages.filter((_, i) => i !== idx));
    }
  };

  // Move image index to change cover position
  const handleMoveImage = (idx: number, direction: "up" | "down") => {
    const list = [...prodImages];
    if (direction === "up" && idx > 0) {
      const temp = list[idx];
      list[idx] = list[idx - 1];
      list[idx - 1] = temp;
    } else if (direction === "down" && idx < list.length - 1) {
      const temp = list[idx];
      list[idx] = list[idx + 1];
      list[idx + 1] = temp;
    }
    setProdImages(list);
  };

  // Submit Social Links (Tab 3)
  const handleSocialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    setSavingSocials(true);

    const socialsPayload: StoreSocials = {
      facebook: facebookUrl,
      instagram: instagramUrl,
      tiktok: tiktokUrl,
      threads: threadsUrl
    };

    const togglesPayload: StoreSocialToggles = {
      facebook: facebookVisible,
      instagram: instagramVisible,
      tiktok: tiktokVisible,
      threads: threadsVisible,
      website: false,
      zalo: false
    };

    try {
      await upsertStoreProfile(store.id, {
        socials: socialsPayload,
        socialToggles: togglesPayload
      });
      await loadStoreData();

      // Trigger webhook
      triggerWebhook("SOCIAL_LINKS_UPDATED", {
        storeId: store.id,
        socials: socialsPayload,
        toggles: togglesPayload,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSocials(false);
    }
  };

  // Admin moderation logic
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
          // Deletion approved -> permanently delete
          await permanentlyDeleteProduct(productId);
        } else {
          // Deletion rejected -> restore approved status and clear deleteRequested
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

      // Trigger webhook
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

      // Refresh admin list
      const allProds = await fetchAllProducts();
      setAllPendingProducts(allProds.filter(p => p.status === "Pending"));
    } catch (err) {
      console.error(err);
    }
  };

  // Admin moderation logic for Stores
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

      // Trigger webhook
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

      // Refresh admin lists
      const allStores = await fetchStores();
      setAllPendingStores(allStores.filter(s => s.status === "Pending" && s.registered));
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-neutral-100 font-mono text-xs">
        <span className="animate-pulse text-neutral-500">SYNCHRONIZING ARTISAN DASHBOARD...</span>
      </div>
    );
  }

  // SPECIAL INTERFACE: REDIRECT ADMIN TO UNIFIED DASHBOARD AT USER PROFILE
  if (profile?.role === "Admin") {
    return <Navigate to="/user-profile" replace />;
  }

  // STANDARD INTERFACE: ARTISAN STORE OWNER DASHBOARD
  return (
    <div className="min-h-screen bg-neutral-100 p-4 md:p-8 select-none space-y-8 font-sans">
      
      {/* Dashboard Brand banner */}
      <div className="bg-white border-4 border-black p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-[6px_6px_0px_0px_#000000]">
        <div className="flex items-center space-x-3">
          <Store className="w-8 h-8 text-black" />
          <div>
            <span className="font-mono text-[9px] text-neutral-400 font-bold uppercase tracking-widest block">// ARTISAN DASHBOARD HUB</span>
            <h1 className="font-display font-black text-xl uppercase tracking-tight text-black">
              {store?.registered ? store.name : "Artisan Portal Registration"}
            </h1>
          </div>
        </div>

        {/* Tab Selection headers */}
        {store?.registered && (
          <div className="flex flex-wrap border-2 border-black bg-neutral-50">
            {([
              { id: "Upload", label: "UPLOAD PRODUCTS", icon: UploadCloud },
              { id: "Socials", label: "MAP SOCIALS", icon: Share2 },
              { id: "Moderation", label: "APPROVAL LOGS", icon: Layers },
              { id: "Registration", label: "STORE PROFILE", icon: Store }
            ] as const).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase transition-all flex items-center space-x-1.5 border-r border-black last:border-0 ${
                    isActive ? "bg-black text-white" : "hover:bg-neutral-200 text-black"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Registration Status Alerts */}
      {store?.registered && (
        <div className="max-w-4xl mx-auto mb-6">
          {(!store.status || store.status === "Pending") && (
            <div className="bg-amber-50 border-4 border-amber-500 p-4 font-mono text-xs text-amber-900 shadow-[4px_4px_0px_0px_#d97706] space-y-1">
              <div className="flex items-center space-x-2 font-bold">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="uppercase">📝 Store Registration Pending Approval</span>
              </div>
              <p className="font-sans text-neutral-700 leading-relaxed text-[11px]">
                Your boutique registration is currently awaiting verification and approval from the Tí Coolture Administrative team. You will be officially allowed to upload and list products once approved.
              </p>
            </div>
          )}
          {store.status === "Rejected" && (
            <div className="bg-red-50 border-4 border-red-500 p-4 font-mono text-xs text-red-900 shadow-[4px_4px_0px_0px_#dc2626] space-y-2">
              <div className="flex items-center space-x-2 font-bold">
                <X className="w-4 h-4 text-red-600 shrink-0" />
                <span className="uppercase">❌ Store Registration Declined</span>
              </div>
              <p className="font-sans text-neutral-700 leading-relaxed text-[11px]">
                The administrative team has rejected your store registration request. Please review the reason below, update your boutique credentials, and submit again for verification.
              </p>
              {store.rejectionReason && (
                <div className="bg-white border-2 border-red-200 p-2.5 text-xs font-mono text-red-800">
                  <strong className="block uppercase text-[9px] text-red-900 mb-0.5">REJECTION REASON:</strong>
                  "{store.rejectionReason}"
                </div>
              )}
            </div>
          )}
          {store.status === "Approved" && (
            <div className="bg-emerald-50 border-4 border-emerald-500 p-3 font-mono text-xs text-emerald-900 shadow-[4px_4px_0px_0px_#059669] flex items-center space-x-2 font-bold select-none text-[11px]">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="uppercase">✓ Store Registration Approved & Live</span>
            </div>
          )}
        </div>
      )}

      {/* Conditional Forms Layout */}
      <div className="max-w-4xl mx-auto">
        
        {/* If Store profile not registered, force registration form (Tab 1) */}
        {(!store?.registered || activeTab === "Registration") && (
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000000] space-y-6">
            <div className="border-b-2 border-black pb-3">
              <h2 className="font-display font-black text-base uppercase text-black">
                {store?.registered ? "Update Boutique Credentials" : "Handcrafted Boutique Registration"}
              </h2>
              <p className="text-[11px] font-mono text-neutral-500 uppercase mt-0.5">
                Fill out basic profile credentials and legal status to activate catalog listing
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase mb-1">Store / Boutique Name *</label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Tí Clay Craft"
                    className="w-full border-2 border-black p-2 font-mono text-xs focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase mb-1">Mã Số Thuế (Tax ID) *</label>
                  <input
                    type="text"
                    value={shopTaxId}
                    onChange={(e) => setShopTaxId(e.target.value)}
                    placeholder="10-digit legal tax number"
                    className="w-full border-2 border-black p-2 font-mono text-xs focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold uppercase mb-1">Logo Upload / URL *</label>
                  <ImageUploader 
                    id="shop-logo-upload"
                    onUploadComplete={(url) => setShopLogo(url)}
                  />
                  <input
                    type="text"
                    value={shopLogo}
                    onChange={(e) => setShopLogo(e.target.value)}
                    placeholder="Or paste an image URL..."
                    className="w-full border-2 border-black p-2 font-mono text-xs focus:outline-none mt-1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold uppercase mb-1">Cover Wallpaper Upload / URL *</label>
                  <ImageUploader 
                    id="shop-cover-upload"
                    onUploadComplete={(url) => setShopCover(url)}
                  />
                  <input
                    type="text"
                    value={shopCover}
                    onChange={(e) => setShopCover(e.target.value)}
                    placeholder="Or paste an image URL..."
                    className="w-full border-2 border-black p-2 font-mono text-xs focus:outline-none mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase mb-1">Contact Phone *</label>
                  <input
                    type="text"
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    placeholder="e.g. 0901234567"
                    className="w-full border-2 border-black p-2 font-mono text-xs focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase mb-1">Boutique Email *</label>
                  <input
                    type="email"
                    value={shopEmail}
                    onChange={(e) => setShopEmail(e.target.value)}
                    placeholder="artisan@ticoolture.vn"
                    className="w-full border-2 border-black p-2 font-mono text-xs focus:outline-none"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-mono font-bold uppercase mb-1">Studio physical address *</label>
                  <input
                    type="text"
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                    placeholder="12/4 Nguyen Hue, District 1, Ho Chi Minh City"
                    className="w-full border-2 border-black p-2 font-mono text-xs focus:outline-none"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-mono font-bold uppercase mb-1">Boutique Description *</label>
                  <textarea
                    value={shopDescription}
                    onChange={(e) => setShopDescription(e.target.value)}
                    placeholder="Describe your boutique - including its narrative story, history, craftsmanship, and the overall aesthetic or vibe..."
                    className="w-full border-2 border-black p-2 font-mono text-xs focus:outline-none h-32"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingReg}
                className="w-full bg-black text-white hover:bg-neutral-800 border-2 border-black p-3 font-bold uppercase text-xs tracking-wider transition-all"
              >
                {submittingReg ? "SUBMITTING CREDENTIALS..." : "SAVE & REGISTER PROFILE"}
              </button>
            </form>

            {store?.registered && (
              <div className="border-4 border-red-500 bg-red-50 p-6 mt-8 space-y-4">
                <div>
                  <h3 className="font-display font-black text-red-700 text-sm uppercase">DANGER ZONE: XOÁ TÀI KHOẢN</h3>
                  <p className="text-[11px] font-mono text-neutral-500 uppercase mt-0.5">
                    Hành động này sẽ gửi yêu cầu xoá tài khoản cửa hàng của bạn đến Quản trị viên để duyệt.
                  </p>
                </div>
                
                {store.accountDeleteRequested ? (
                  <div className="bg-white border-2 border-red-500 p-4 font-mono text-xs text-red-900 flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-red-500 shrink-0 animate-pulse" />
                    <span>YÊU CẦU XOÁ TÀI KHOẢN ĐANG CHỜ QUẢN TRỊ VIÊN DUYỆT. CỬA HÀNG SẼ BỊ XOÁ VĨNH VIỄN SAU KHI ĐƯỢC CHẤP THUẬN.</span>
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm("Bạn có chắc chắn muốn gửi yêu cầu xoá tài khoản cửa hàng này không? Cửa hàng và toàn bộ sản phẩm của bạn sẽ bị xoá vĩnh viễn.")) {
                          try {
                            const { updateDoc, doc } = await import("firebase/firestore");
                            await updateDoc(doc(db, "stores", store.id), {
                              accountDeleteRequested: true
                            });
                            alert("Yêu cầu xoá tài khoản đã được gửi thành công. Vui lòng chờ Admin phê duyệt.");
                            await loadStoreData();
                          } catch (err) {
                            console.error("Lỗi gửi yêu cầu xoá tài khoản:", err);
                          }
                        }
                      }}
                      className="px-4 py-2 border-2 border-red-600 bg-red-600 text-white font-mono text-xs font-bold uppercase hover:bg-white hover:text-red-600 transition-all shadow-[2px_2px_0px_0px_#000000]"
                    >
                      Yêu Cầu Xoá Tài Khoản (Delete Account)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Upload Products Form Layout */}
        {store?.registered && activeTab === "Upload" && (
          store.status !== "Approved" ? (
            <div className="bg-white border-4 border-black p-8 shadow-[6px_6px_0px_0px_#000000] text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
              <h2 className="font-display font-black text-lg uppercase text-black">
                UPLOAD RESTRICTED
              </h2>
              <p className="text-xs text-neutral-600 font-sans max-w-md mx-auto leading-relaxed">
                Your boutique registration is currently <span className="font-bold underline uppercase">{store.status || "Pending"}</span>. Before you can upload and list cultural products, the Tí Coolture Administrative team must approve your store credentials.
              </p>
              {store.status === "Rejected" && store.rejectionReason && (
                <div className="bg-red-50 border-2 border-red-200 p-3 text-left max-w-md mx-auto text-xs font-mono text-red-700">
                  <strong className="block uppercase text-[10px] text-red-800 mb-1">REJECTION REASON:</strong>
                  "{store.rejectionReason}"
                </div>
              )}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("Registration")}
                  className="bg-black text-white hover:bg-neutral-800 border-2 border-black py-2 px-4 text-[10px] font-bold uppercase transition-all"
                >
                  REVIEW STORE PROFILE
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000000] space-y-6">
            <div className="border-b-2 border-black pb-3">
              <h2 className="font-display font-black text-base uppercase text-black">
                Submit Product for Moderation Checklist
              </h2>
              <p className="text-[11px] font-mono text-neutral-500 uppercase mt-0.5">
                All cultural listings undergo administrative validation prior to live display
              </p>
            </div>

            {productSuccessMsg && (
              <div className="border-2 border-black bg-emerald-100 text-black p-3 text-xs font-mono">
                ✓ Product successfully registered inside moderation pipeline. Check [APPROVAL LOGS] tab to monitor status!
              </div>
            )}

            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase mb-1">Product Name / Title *</label>
                  <input
                    type="text"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="e.g. Terracotta Tea Set 'Đất Đen'"
                    className="w-full border-2 border-black p-2 font-mono text-xs focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase mb-1">Price Reference (VND) *</label>
                  <input
                    type="number"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(Math.max(0, Number(e.target.value)))}
                    min="0"
                    placeholder="e.g. 450000"
                    className="w-full border-2 border-black p-2 font-mono text-xs focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase mb-1">Material Composition *</label>
                  <input
                    type="text"
                    value={prodMaterial}
                    onChange={(e) => setProdMaterial(e.target.value)}
                    placeholder="e.g. Local terracotta clay"
                    className="w-full border-2 border-black p-2 font-mono text-xs focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase mb-1">Product Dimensions / Size *</label>
                  <input
                    type="text"
                    value={prodSize}
                    onChange={(e) => setProdSize(e.target.value)}
                    placeholder="e.g. Teapot 450ml, Cups 80ml"
                    className="w-full border-2 border-black p-2 font-mono text-xs focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase mb-1">Brand origin</label>
                  <input
                    type="text"
                    value={prodBrand}
                    onChange={(e) => setProdBrand(e.target.value)}
                    placeholder={`e.g. ${store.name}`}
                    className="w-full border-2 border-black p-2 font-mono text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase mb-1">Catalog Category *</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full border-2 border-black p-2 font-mono text-xs focus:outline-none bg-white h-[38px]"
                  >
                    <option value="Tableware">Tableware / Gốm chén bát</option>
                    <option value="Home Decor">Home Decor / Trang trí nội thất</option>
                    <option value="Accessories">Accessories / Túi, phụ kiện</option>
                    <option value="Apparel">Apparel / Trang phục thổ cẩm</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-mono font-bold uppercase mb-1">About this product *</label>
                  <textarea
                    value={prodDescription}
                    onChange={(e) => setProdDescription(e.target.value)}
                    placeholder="Combine physical description, historical techniques, ancestral origins, firing duration, and story behind this item..."
                    className="w-full border-2 border-black p-2 font-mono text-xs focus:outline-none h-32"
                    required
                  />
                </div>

                {/* Product Photos Upload Simulation (Screenshot 4 Reference) */}
                <div className="md:col-span-2 border-2 border-black p-4 bg-neutral-50 space-y-3">
                  <label className="block text-xs font-mono font-bold uppercase">Product image gallery collection (Max 5)</label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">// METHOD A: UPLOAD FILE</span>
                      <ImageUploader 
                        id="prod-gallery-upload"
                        multiple={true}
                        onUploadComplete={(url) => {
                          if (prodImages.length < 5) {
                            setProdImages([...prodImages, url]);
                          }
                        }}
                        onMultipleUploadsComplete={(urls) => {
                          const combined = [...prodImages, ...urls].slice(0, 5);
                          setProdImages(combined);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <span className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">// METHOD B: INSERT URL</span>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Insert high-resolution Image URL..."
                          value={newImageInput}
                          onChange={(e) => setNewImageInput(e.target.value)}
                          className="flex-1 border border-black p-2 font-mono text-xs bg-white h-[44px] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddImage}
                          className="px-4 bg-black text-white hover:bg-neutral-800 text-xs font-mono font-bold uppercase border border-black h-[44px] transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[10px] font-mono text-neutral-400 uppercase">* TIP: Drag & drop files on the left to instantly insert them into the gallery. Maximum of 5 photos allowed.</p>
                    </div>
                  </div>

                  {/* Thumbnail slider display with reorder arrows (Screenshot 4 specifications: option di chuyển thứ tự các ảnh) */}
                  <div className="grid grid-cols-5 gap-2 pt-2">
                    {prodImages.map((img, idx) => (
                      <div key={idx} className="border border-black p-1 bg-white flex flex-col justify-between items-center text-center">
                        <img src={img} alt={`Preview ${idx + 1}`} className="w-full aspect-square object-cover border border-neutral-200" referrerPolicy="no-referrer" />
                        <span className="font-mono text-[9px] uppercase font-bold text-neutral-400 mt-1 block">
                          {idx === 0 ? "Cover" : `Image ${idx + 1}`}
                        </span>
                        
                        {/* Reorder control arrows */}
                        <div className="flex space-x-1.5 mt-1.5">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, "up")}
                              className="text-[9px] hover:font-bold hover:underline"
                            >
                              ←
                            </button>
                          )}
                          {idx < prodImages.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, "down")}
                              className="text-[9px] hover:font-bold hover:underline"
                            >
                              →
                            </button>
                          )}
                        </div>

                        {prodImages.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="text-[9px] text-red-600 hover:font-bold mt-1.5"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingProduct}
                className="w-full bg-black text-white hover:bg-neutral-800 border-2 border-black p-3 font-bold uppercase text-xs tracking-wider transition-all"
              >
                {submittingProduct ? "DISPATCHING CULTURAL TELEMETRY..." : "DISPATCH FOR MODERATION CHECK"}
              </button>
            </form>
          </div>
          )
        )}

        {/* Tab 3: Map Social Links */}
        {store?.registered && activeTab === "Socials" && (
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000000] space-y-6">
            <div className="border-b-2 border-black pb-3">
              <h2 className="font-display font-black text-base uppercase text-black">
                Manage Social Contact Integrations
              </h2>
              <p className="text-[11px] font-mono text-neutral-500 uppercase mt-0.5">
                Link boutique accounts. Toggle visibility switches to control public exposure
              </p>
            </div>

            <form onSubmit={handleSocialsSubmit} className="space-y-4">
              <div className="space-y-4">
                {/* Facebook Input with toggle switcher */}
                <div className="border border-black p-4 bg-neutral-50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold uppercase text-black">Facebook Page Link</span>
                    <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                      <span className="font-mono text-[9px] uppercase font-bold text-neutral-400">VISIBLE</span>
                      <input
                        type="checkbox"
                        checked={facebookVisible}
                        onChange={(e) => setFacebookVisible(e.target.checked)}
                        className="w-3.5 h-3.5 accent-black cursor-pointer"
                      />
                    </label>
                  </div>
                  <input
                    type="url"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/your-clay-shop"
                    className="w-full border border-black p-2 font-mono text-xs bg-white focus:outline-none"
                  />
                </div>

                {/* Instagram Input with toggle */}
                <div className="border border-black p-4 bg-neutral-50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold uppercase text-black">Instagram Handler Link</span>
                    <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                      <span className="font-mono text-[9px] uppercase font-bold text-neutral-400">VISIBLE</span>
                      <input
                        type="checkbox"
                        checked={instagramVisible}
                        onChange={(e) => setInstagramVisible(e.target.checked)}
                        className="w-3.5 h-3.5 accent-black cursor-pointer"
                      />
                    </label>
                  </div>
                  <input
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/your-clay-shop"
                    className="w-full border border-black p-2 font-mono text-xs bg-white focus:outline-none"
                  />
                </div>

                {/* TikTok Input with toggle */}
                <div className="border border-black p-4 bg-neutral-50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold uppercase text-black">TikTok Channel Link</span>
                    <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                      <span className="font-mono text-[9px] uppercase font-bold text-neutral-400">VISIBLE</span>
                      <input
                        type="checkbox"
                        checked={tiktokVisible}
                        onChange={(e) => setTiktokVisible(e.target.checked)}
                        className="w-3.5 h-3.5 accent-black cursor-pointer"
                      />
                    </label>
                  </div>
                  <input
                    type="url"
                    value={tiktokUrl}
                    onChange={(e) => setTiktokUrl(e.target.value)}
                    placeholder="https://tiktok.com/@your-clay-shop"
                    className="w-full border border-black p-2 font-mono text-xs bg-white focus:outline-none"
                  />
                </div>

                {/* Threads Input with toggle */}
                <div className="border border-black p-4 bg-neutral-50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold uppercase text-black">Threads Account Link</span>
                    <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                      <span className="font-mono text-[9px] uppercase font-bold text-neutral-400">VISIBLE</span>
                      <input
                        type="checkbox"
                        checked={threadsVisible}
                        onChange={(e) => setThreadsVisible(e.target.checked)}
                        className="w-3.5 h-3.5 accent-black cursor-pointer"
                      />
                    </label>
                  </div>
                  <input
                    type="url"
                    value={threadsUrl}
                    onChange={(e) => setThreadsUrl(e.target.value)}
                    placeholder="https://threads.net/@your-clay-shop"
                    className="w-full border border-black p-2 font-mono text-xs bg-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingSocials}
                className="w-full bg-black text-white hover:bg-neutral-800 border-2 border-black p-3 font-bold uppercase text-xs tracking-wider transition-all"
              >
                {savingSocials ? "SAVING CONFIGURATIONS..." : "COMMIT SOCIAL CONFIGURATIONS"}
              </button>
            </form>
          </div>
        )}

        {/* Tab 4: Product Approval & Moderation log pipeline status */}
        {store?.registered && activeTab === "Moderation" && (
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000000] space-y-6">
            <div className="border-b-2 border-black pb-3">
              <h2 className="font-display font-black text-base uppercase text-black">
                Boutique Moderation Pipeline
              </h2>
              <p className="text-[11px] font-mono text-neutral-500 uppercase mt-0.5">
                Check active review stages for your uploaded items
              </p>
            </div>

            {products.length === 0 ? (
              <p className="text-xs font-mono text-neutral-400 italic py-6 text-center">No products submitted for this shop yet.</p>
            ) : (
              <div className="border-2 border-black overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px] min-w-[600px] border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 border-b-2 border-black font-bold text-black select-none">
                      <th className="p-3 border-r border-black">PRODUCT</th>
                      <th className="p-3 border-r border-black">PRICE (VND)</th>
                      <th className="p-3 border-r border-black text-center">STAGE STATE</th>
                      <th className="p-3 border-r border-black text-center">ACTIONS</th>
                      <th className="p-3">REJECTION ANALYSIS / NOTES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((prod) => (
                      <tr key={prod.id} className="border-b border-neutral-200 hover:bg-neutral-50 last:border-b-0">
                        <td className="p-3 border-r border-neutral-200 font-bold flex items-center space-x-2">
                          <img src={prod.images[0]} className="w-8 h-8 object-cover border border-black" referrerPolicy="no-referrer" />
                          <span>{prod.name}</span>
                        </td>
                        <td className="p-3 border-r border-neutral-200">{prod.price.toLocaleString()}</td>
                        
                        {/* Status indicators (Screenshot 4 specifications: Đỏ decline, vàng pending, xanh lá approved) */}
                        <td className="p-3 border-r border-neutral-200 text-center">
                          {prod.status === "Approved" && !prod.deleteRequested && (
                            <span className="inline-block px-2 py-1 text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold uppercase rounded-none">
                              🟢 APPROVED
                            </span>
                          )}
                          {prod.status === "Pending" && !prod.deleteRequested && (
                            <span className="inline-block px-2 py-1 text-[9px] bg-yellow-100 text-yellow-800 border border-yellow-300 font-bold uppercase rounded-none">
                              🟡 PENDING REVIEW
                            </span>
                          )}
                          {prod.status === "Rejected" && !prod.deleteRequested && (
                            <span className="inline-block px-2 py-1 text-[9px] bg-red-100 text-red-800 border border-red-300 font-bold uppercase rounded-none">
                              🔴 DECLINED
                            </span>
                          )}
                          {prod.deleteRequested && (
                            <span className="inline-block px-2 py-1 text-[9px] bg-orange-100 text-orange-800 border border-orange-300 font-bold uppercase rounded-none">
                              🟠 REMOVAL PENDING
                            </span>
                          )}
                        </td>

                        {/* Actions column */}
                        <td className="p-3 border-r border-neutral-200 text-center space-y-1">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingProduct(prod);
                                setEditName(prod.name);
                                setEditPrice(prod.price);
                                setEditMaterial(prod.material || "");
                                setEditSize(prod.size || "");
                                setEditBrand(prod.brand || "");
                                setEditCategory(prod.category);
                                setEditDescription(prod.description);
                                setEditStory(prod.story || "");
                                setEditImages(prod.images);
                              }}
                              className="w-20 bg-yellow-400 hover:bg-yellow-500 text-black border border-black font-mono text-[9px] font-bold uppercase py-1 px-1.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-none transition-all"
                            >
                              EDIT
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`Bạn có chắc chắn muốn xoá vĩnh viễn sản phẩm "${prod.name}" không?`)) {
                                  try {
                                    await permanentlyDeleteProduct(prod.id);
                                    await logApprovalActivity({
                                      productId: prod.id,
                                      productName: prod.name,
                                      storeId: store.id,
                                      storeName: store.name,
                                      activity: "Product Deleted",
                                      actor: user.email || store.email || "Shop Owner"
                                    });
                                    const pData = await fetchProductsStore(store.id);
                                    setProducts(pData);
                                    const logs = await fetchApprovalLogs(store.id);
                                    setModerationLogs(logs);
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }
                              }}
                              className="w-20 bg-red-500 hover:bg-red-600 text-white border border-black font-mono text-[9px] font-bold uppercase py-1 px-1.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-none transition-all"
                            >
                              DELETE
                            </button>
                          </div>
                        </td>
                        
                        <td className="p-3 text-neutral-500 font-sans text-xs">
                          {prod.deleteRequested ? (
                            <div className="text-orange-700 font-mono text-[10px] uppercase">
                              <span>⚠️ Deletion request has been submitted to Admin.</span>
                            </div>
                          ) : prod.status === "Rejected" ? (
                            <div className="bg-red-50 text-red-700 p-2 border border-red-200 font-mono text-[10px] uppercase">
                              <span className="font-bold">DECLINE FEEDBACK: </span>
                              {prod.rejectionReason || "No comments supplied."}
                            </div>
                          ) : prod.status === "Approved" ? (
                            <div className="text-emerald-700 font-mono text-[10px] uppercase">
                              <span>✓ Item successfully exposed in active marketplace catalog!</span>
                              <Link to={`/products/${prod.id}`} className="underline block mt-0.5 font-bold">VIEW PUBLIC CARD →</Link>
                            </div>
                          ) : (
                            <span className="font-mono text-[10px] text-neutral-400">Waiting for Admin scan...</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Approval & Moderation Logs History Card */}
            <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000000] space-y-4">
              <div className="border-b-2 border-black pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-display font-black text-sm uppercase text-black">
                    Approval & Moderation Activity Logs
                  </h3>
                  <p className="text-[10px] font-mono text-neutral-500 uppercase mt-0.5">
                    Chronological audit log of all submission activity and admin decisions
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const logs = await fetchApprovalLogs(store?.id);
                    setModerationLogs(logs);
                  }}
                  className="px-2 py-1 border border-black bg-neutral-100 hover:bg-neutral-200 font-mono text-[9px] font-bold uppercase transition-colors"
                >
                  Refresh Logs
                </button>
              </div>

              {moderationLogs.length === 0 ? (
                <p className="text-xs font-mono text-neutral-400 italic py-4 text-center">No activity logged yet.</p>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {moderationLogs.map((log: any) => (
                    <div key={log.id} className="border-2 border-black p-3 bg-neutral-50 font-mono text-[10px] flex justify-between items-start gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-1.5 py-0.5 font-bold uppercase text-[8px] border border-black ${
                            log.activity.includes("Approved") || log.activity.includes("approved")
                              ? "bg-emerald-100 text-emerald-800"
                              : log.activity.includes("Rejected") || log.activity.includes("rejected") || log.activity.includes("Declined") || log.activity.includes("Declined")
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {log.activity}
                          </span>
                          {log.productName && (
                            <span className="font-bold text-black font-sans text-xs">
                              Product: {log.productName}
                            </span>
                          )}
                        </div>
                        {log.reason && (
                          <div className="bg-red-50 text-red-700 p-2 border border-red-200 uppercase mt-1">
                            <span className="font-bold">Admin Feedback: </span> {log.reason}
                          </div>
                        )}
                        <div className="text-neutral-400 text-[9px] uppercase">
                          Actor: {log.actor}
                        </div>
                      </div>
                      <div className="text-right whitespace-nowrap text-neutral-500 text-[9px] font-bold font-mono">
                        {new Date(log.timestamp).toLocaleString("vi-VN")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border-4 border-black p-6 w-full max-w-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center border-b-2 border-black pb-2">
              <h3 className="font-display font-black text-sm uppercase text-black">EDIT PRODUCT DETAIL</h3>
              <button 
                onClick={() => setEditingProduct(null)}
                className="p-1 border-2 border-black bg-neutral-100 hover:bg-neutral-200"
              >
                <X className="w-4 h-4 text-black" />
              </button>
            </div>

            <form onSubmit={handleEditProductSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full border-2 border-black p-2 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Price (VND) *</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Math.max(0, Number(e.target.value)))}
                    min="0"
                    className="w-full border-2 border-black p-2 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Material Composition *</label>
                  <input
                    type="text"
                    value={editMaterial}
                    onChange={(e) => setEditMaterial(e.target.value)}
                    className="w-full border-2 border-black p-2 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Dimensions / Size *</label>
                  <input
                    type="text"
                    value={editSize}
                    onChange={(e) => setEditSize(e.target.value)}
                    className="w-full border-2 border-black p-2 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Brand origin</label>
                  <input
                    type="text"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full border-2 border-black p-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Catalog Category *</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full border-2 border-black p-2 focus:outline-none bg-white h-[38px]"
                  >
                    <option value="Tableware">Tableware / Gốm chén bát</option>
                    <option value="Home Decor">Home Decor / Trang trí nội thất</option>
                    <option value="Textiles">Textiles / Dệt may thời trang</option>
                    <option value="Accessories">Accessories / Phụ kiện thủ công</option>
                  </select>
                </div>
              </div>

              {/* Product Photos Edit Section */}
              <div className="border-2 border-black p-4 bg-neutral-50 space-y-3">
                <label className="block text-xs font-mono font-bold uppercase text-black">Product image gallery collection (Max 5)</label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">// METHOD A: UPLOAD FILE</span>
                    <ImageUploader 
                      id="edit-gallery-upload"
                      multiple={true}
                      onUploadComplete={(url) => {
                        if (editImages.length < 5) {
                          setEditImages([...editImages, url]);
                        }
                      }}
                      onMultipleUploadsComplete={(urls) => {
                        const combined = [...editImages, ...urls].slice(0, 5);
                        setEditImages(combined);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">// METHOD B: INSERT URL</span>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Insert high-resolution Image URL..."
                        value={editImageInput}
                        onChange={(e) => setEditImageInput(e.target.value)}
                        className="flex-1 border border-black p-2 font-mono text-xs bg-white h-[44px] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (editImageInput.trim() && editImages.length < 5) {
                            setEditImages([...editImages, editImageInput.trim()]);
                            setEditImageInput("");
                          }
                        }}
                        className="px-4 bg-black text-white hover:bg-neutral-800 text-xs font-mono font-bold uppercase border border-black h-[44px] transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[10px] font-mono text-neutral-400 uppercase">* TIP: Drag & drop files on the left to instantly insert them into the gallery. Maximum of 5 photos allowed.</p>
                  </div>
                </div>

                {/* Thumbnail slider display with reorder arrows */}
                <div className="grid grid-cols-5 gap-2 pt-2">
                  {editImages.map((img, idx) => (
                    <div key={idx} className="border border-black p-1 bg-white flex flex-col justify-between items-center text-center">
                      <img src={img} alt={`Preview ${idx + 1}`} className="w-full aspect-square object-cover border border-neutral-200" referrerPolicy="no-referrer" />
                      <span className="font-mono text-[9px] uppercase font-bold text-neutral-400 mt-1 block">
                        {idx === 0 ? "Cover" : `Image ${idx + 1}`}
                      </span>
                      
                      {/* Reorder control arrows */}
                      <div className="flex space-x-1.5 mt-1.5">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const list = [...editImages];
                              const temp = list[idx];
                              list[idx] = list[idx - 1];
                              list[idx - 1] = temp;
                              setEditImages(list);
                            }}
                            className="text-[9px] hover:font-bold hover:underline"
                          >
                            ←
                          </button>
                        )}
                        {idx < editImages.length - 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const list = [...editImages];
                              const temp = list[idx];
                              list[idx] = list[idx + 1];
                              list[idx + 1] = temp;
                              setEditImages(list);
                            }}
                            className="text-[9px] hover:font-bold hover:underline"
                          >
                            →
                          </button>
                        )}
                      </div>

                      {editImages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditImages(editImages.filter((_, i) => i !== idx));
                          }}
                          className="text-[9px] text-red-600 hover:font-bold mt-1.5"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1">About this product (Description) *</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full border-2 border-black p-2 focus:outline-none h-24"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="bg-white hover:bg-neutral-100 text-black border-2 border-black font-bold uppercase px-4 py-2"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="bg-black hover:bg-neutral-800 text-white border-2 border-black font-bold uppercase px-4 py-2"
                >
                  {submittingEdit ? "SAVING CHANGES..." : "SUBMIT FOR APPROVAL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
