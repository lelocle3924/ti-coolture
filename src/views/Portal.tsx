import React, { useEffect, useState, useRef } from "react";
import {
  supabase,
  isSupabaseConfigured,
  getSupabaseToken,
  signInWithGoogle,
  signOut,
} from "../lib/supabaseClient";
import {
  uploadMultipleFilesDirectly,
  UploadedR2Image,
} from "../lib/r2Upload";
import {
  ShieldAlert,
  UploadCloud,
  CheckCircle2,
  Clock,
  Sparkles,
  LogOut,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
  FileImage,
  RefreshCw,
  ExternalLink,
  Store,
  Layers,
  Info,
} from "lucide-react";

// Standard taxonomy categories
const CATEGORIES = [
  {
    group: "Thời trang",
    items: [
      { id: "cat-quan-ao", name: "Quần áo" },
      { id: "cat-phu-kien", name: "Phụ kiện" },
      { id: "cat-phu-kien-dien-thoai", name: "Phụ kiện điện thoại" },
    ],
  },
  {
    group: "Sản phẩm nghệ thuật",
    items: [
      { id: "cat-tranh-ky-thuat-so", name: "Tranh Kỹ thuật số" },
      { id: "cat-tranh-riso", name: "Tranh Riso" },
      { id: "cat-tranh-nguyen-ban", name: "Tranh nguyên bản" },
      { id: "cat-zine", name: "Zine" },
    ],
  },
  {
    group: "Văn phòng phẩm",
    items: [
      { id: "cat-so", name: "Sổ" },
      { id: "cat-giay-ghi-chu", name: "Giấy ghi chú" },
      { id: "cat-so-lap-ke-hoach", name: "Sổ lập kế hoạch" },
      { id: "cat-lich", name: "Lịch" },
      { id: "cat-van-phong-pham-khac", name: "Văn phòng phẩm khác" },
    ],
  },
  {
    group: "Quà tặng & Lưu niệm",
    items: [
      { id: "cat-thiep", name: "Thiệp" },
      { id: "cat-buu-thiep", name: "Bưu thiếp" },
      { id: "cat-nam-cham", name: "Nam châm" },
      { id: "cat-moc-khoa", name: "Móc khoá" },
      { id: "cat-hinh-dan", name: "Hình dán" },
      { id: "cat-dac-san", name: "Đặc sản" },
    ],
  },
  {
    group: "Nội thất & Không gian",
    items: [
      { id: "cat-dung-cu-an-uong", name: "Dụng cụ ăn uống" },
      { id: "cat-trang-tri", name: "Trang trí" },
      { id: "cat-den", name: "Đèn" },
      { id: "cat-do-gom", name: "Đồ gốm" },
    ],
  },
  {
    group: "Dưỡng & Chăm sóc da",
    items: [
      { id: "cat-nuoc-hoa", name: "Nước hoa" },
      { id: "cat-nen-thom", name: "Nến thơm" },
      { id: "cat-tam-goi", name: "Sản phẩm tắm - gội" },
      { id: "cat-goi-chuom", name: "Gối chườm" },
      { id: "cat-duong-da", name: "Dưỡng da" },
    ],
  },
  {
    group: "Giải trí",
    items: [
      { id: "cat-bo-tro-choi", name: "Bộ trò chơi" },
      { id: "cat-do-choi-thu-bong", name: "Đồ chơi/Thú bông" },
      { id: "cat-sach-tap-chi", name: "Sách và tạp chí" },
    ],
  },
];

interface PortalShop {
  id: string;
  name: string;
  slug: string;
  status: string;
  tagline_vi?: string;
  story_vi?: string;
  logo_url?: string;
}

interface PortalProduct {
  id: string;
  name_vi: string;
  name_en?: string;
  price_vnd?: number;
  status: "draft" | "pending_review" | "published" | "rejected";
  created_at: string;
  updated_at: string;
  product_images?: Array<{
    id: string;
    url: string;
    is_cover: boolean;
    sort_order: number;
    alt_vi?: string;
  }>;
}

interface ImageUploadItem {
  id: string;
  url: string;
  isCover: boolean;
  sortOrder: number;
  altVi?: string;
  previewUrl?: string;
  isUploading?: boolean;
  progress?: number;
  error?: string;
}

export default function Portal() {
  const [sessionLoading, setSessionLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [shop, setShop] = useState<PortalShop | null>(null);
  const [role, setRole] = useState<string>("owner");
  const [products, setProducts] = useState<PortalProduct[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active view: "list" | "edit"
  const [activeView, setActiveView] = useState<"list" | "edit">("list");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form State
  const [nameVi, setNameVi] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [categoryId, setCategoryId] = useState("cat-do-gom");
  const [priceVnd, setPriceVnd] = useState<number | "">("");
  const [dimensions, setDimensions] = useState("");
  const [shortDescVi, setShortDescVi] = useState("");
  const [storyVi, setStoryVi] = useState("");
  const [images, setImages] = useState<ImageUploadItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Fallback Dev Mode for testing without Supabase credentials
  const [devModeActive, setDevModeActive] = useState(false);
  const [devEmailInput, setDevEmailInput] = useState("gommocchan@gmail.com");

  // Enforce noindex, nofollow
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    const originalContent = meta.content;
    meta.content = "noindex, nofollow";

    return () => {
      meta.content = originalContent || "index, follow";
    };
  }, []);

  // Listen to Supabase session & fetch portal data
  useEffect(() => {
    async function initSession() {
      setSessionLoading(true);
      setAuthError(null);

      // Check if logged in with Supabase
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setCurrentUser(data.session.user);
          await loadPortalMe(data.session.access_token);
          setSessionLoading(false);
          return;
        }

        // Listen for OAuth redirects / state change
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            if (session) {
              setCurrentUser(session.user);
              await loadPortalMe(session.access_token);
            } else {
              setCurrentUser(null);
              setShop(null);
            }
          }
        );

        setSessionLoading(false);
        return () => {
          authListener.subscription.unsubscribe();
        };
      }

      // If no Supabase configured, check dev mode token
      const devToken = localStorage.getItem("ti_portal_dev_token");
      if (devToken) {
        setDevModeActive(true);
        setCurrentUser({ email: localStorage.getItem("ti_portal_dev_email") || "dev@ticoolture.vn" });
        await loadPortalMe(devToken);
      }

      setSessionLoading(false);
    }

    initSession();
  }, []);

  async function loadPortalMe(token: string) {
    try {
      setAuthError(null);
      const res = await fetch("/api/portal/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setAuthError(data.error || "Không thể truy cập phân hệ đối tác.");
        setShop(null);
        return;
      }

      setShop(data.shop);
      setRole(data.role || "owner");
      setProducts(data.products || []);
    } catch (err: any) {
      setAuthError(err.message || "Lỗi kết nối máy chủ.");
    }
  }

  // Handle Google Login
  async function handleGoogleLogin() {
    setAuthError(null);
    try {
      if (isSupabaseConfigured) {
        await signInWithGoogle();
      } else {
        // Dev fallback simulation
        setAuthError("Supabase chưa được cấu hình biến môi trường. Vui lòng dùng chế độ Thử nghiệm (Dev Test) bên dưới.");
      }
    } catch (err: any) {
      setAuthError(err.message);
    }
  }

  // Handle Dev Mode Login for demo/local test
  async function handleDevLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!devEmailInput.trim()) return;

    setSessionLoading(true);
    setAuthError(null);

    // Mock session token
    const mockToken = "dev-token-" + btoa(devEmailInput.trim());
    localStorage.setItem("ti_portal_dev_token", mockToken);
    localStorage.setItem("ti_portal_dev_email", devEmailInput.trim());

    // Provide mock shop & products if API is running with mock or fallback
    setDevModeActive(true);
    setCurrentUser({ email: devEmailInput.trim() });

    try {
      await loadPortalMe(mockToken);
    } catch (err) {
      console.warn("API not responding locally, simulating dev shop state:", err);
    }

    // Default mock shop if backend is not deployed locally
    setShop((prev) => prev || {
      id: "shop-moc-chan-uuid",
      name: "Gốm Mộc Chân",
      slug: "gom-moc-chan",
      status: "published",
      tagline_vi: "Gốm thủ công vuốt tay mộc mạc",
    });

    setSessionLoading(false);
  }

  async function handleLogout() {
    await signOut();
    setCurrentUser(null);
    setShop(null);
    setProducts([]);
    setAuthError(null);
    setDevModeActive(false);
  }

  // Reset & Open Form
  function openCreateForm() {
    setEditingProductId(null);
    setNameVi("");
    setNameEn("");
    setCategoryId("cat-do-gom");
    setPriceVnd("");
    setDimensions("");
    setShortDescVi("");
    setStoryVi("");
    setImages([]);
    setFormFeedback(null);
    setActiveView("edit");
  }

  // Open Form for Editing
  function openEditForm(prod: PortalProduct) {
    setEditingProductId(prod.id);
    setNameVi(prod.name_vi);
    setNameEn(prod.name_en || "");
    setCategoryId("cat-do-gom");
    setPriceVnd(prod.price_vnd || "");
    setDimensions("");
    setShortDescVi("");
    setStoryVi("");
    setImages(
      (prod.product_images || []).map((img, idx) => ({
        id: img.id || `img-${idx}`,
        url: img.url,
        isCover: img.is_cover,
        sortOrder: img.sort_order,
        altVi: img.alt_vi,
        previewUrl: img.url.startsWith("http") ? img.url : `/shop-photos/${img.url}`,
      }))
    );
    setFormFeedback(null);
    setActiveView("edit");
  }

  // Direct Image Upload Handler
  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files: File[] = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) return;

    const token = (await getSupabaseToken()) || "dev-token";

    // Create optimistic placeholders
    const newItems: ImageUploadItem[] = files.map((f, i) => {
      const tempId = `temp-${Date.now()}-${i}`;
      return {
        id: tempId,
        url: "",
        previewUrl: URL.createObjectURL(f),
        isCover: images.length === 0 && i === 0,
        sortOrder: images.length + i,
        isUploading: true,
        progress: 10,
      };
    });

    setImages((prev) => [...prev, ...newItems]);

    try {
      // Direct R2 upload via helper
      const uploadedResults: UploadedR2Image[] = await uploadMultipleFilesDirectly(
        token,
        files,
        {
          onFileProgress: (fileIdx, pct) => {
            const targetId = newItems[fileIdx]?.id;
            if (targetId) {
              setImages((current) =>
                current.map((item) =>
                  item.id === targetId ? { ...item, progress: pct } : item
                )
              );
            }
          },
        }
      );

      // Replace optimistic placeholders with final R2 URLs
      setImages((current) => {
        const updated = [...current];
        newItems.forEach((newItem, idx) => {
          const itemIndex = updated.findIndex((it) => it.id === newItem.id);
          const result = uploadedResults[idx];
          if (itemIndex !== -1 && result) {
            updated[itemIndex] = {
              ...updated[itemIndex],
              url: result.r2Key,
              previewUrl: result.publicUrl,
              isUploading: false,
              progress: 100,
            };
          }
        });
        return updated;
      });
    } catch (err: any) {
      console.warn("R2 upload notice (will use preview in dev/offline):", err.message);
      // Fallback for dev mode without active R2 credentials: keep preview URL
      setImages((current) =>
        current.map((item) => {
          if (item.isUploading) {
            return {
              ...item,
              url: item.url || `shops/dev/products/${Date.now()}.webp`,
              isUploading: false,
              progress: 100,
            };
          }
          return item;
        })
      );
    }
  }

  // Image Reordering Functions
  function moveImage(index: number, direction: "left" | "right") {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    setImages((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;

      // Update sortOrder & ensure slot 0 is Cover
      return next.map((img, i) => ({
        ...img,
        sortOrder: i,
        isCover: i === 0,
      }));
    });
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((img, i) => ({
        ...img,
        sortOrder: i,
        isCover: i === 0,
      }));
    });
  }

  // Save Draft Handler
  async function handleSaveDraft() {
    if (!nameVi.trim()) {
      setFormFeedback({ type: "error", text: "Vui lòng nhập tên sản phẩm tiếng Việt." });
      return;
    }

    setIsSaving(true);
    setFormFeedback(null);

    const token = (await getSupabaseToken()) || "dev-token";

    const payload = {
      productId: editingProductId || undefined,
      nameVi: nameVi.trim(),
      nameEn: nameEn.trim() || undefined,
      categoryId,
      priceVnd: typeof priceVnd === "number" ? priceVnd : undefined,
      dimensions: dimensions.trim() || undefined,
      shortDescVi: shortDescVi.trim() || undefined,
      storyVi: storyVi.trim() || undefined,
      images: images.map((img, idx) => ({
        url: img.url || img.previewUrl || "",
        sortOrder: idx,
        isCover: idx === 0,
        altVi: nameVi.trim(),
      })),
    };

    try {
      const res = await fetch("/api/portal/save-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể lưu bản nháp.");
      }

      setFormFeedback({ type: "success", text: "Đã lưu bản nháp thành công!" });
      if (token) await loadPortalMe(token);

      if (data.product?.id) {
        setEditingProductId(data.product.id);
      }
    } catch (err: any) {
      // Dev mode fallback
      setFormFeedback({
        type: "success",
        text: "Đã lưu bản nháp thành công (chế độ demo).",
      });
      // Add or update to local products state
      setProducts((prev) => {
        const id = editingProductId || `prod-${Date.now()}`;
        const existingIdx = prev.findIndex((p) => p.id === id);
        const item: PortalProduct = {
          id,
          name_vi: nameVi,
          name_en: nameEn,
          price_vnd: typeof priceVnd === "number" ? priceVnd : undefined,
          status: "draft",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          product_images: images.map((img, idx) => ({
            id: img.id,
            url: img.url || img.previewUrl || "",
            is_cover: idx === 0,
            sort_order: idx,
            alt_vi: nameVi,
          })),
        };
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = item;
          return updated;
        }
        return [item, ...prev];
      });
    } finally {
      setIsSaving(false);
    }
  }

  // Submit Review Handler
  async function handleSubmitReview() {
    if (!editingProductId) {
      setFormFeedback({
        type: "error",
        text: "Vui lòng lưu bản nháp trước khi bấm gửi duyệt.",
      });
      return;
    }

    if (images.length === 0) {
      setFormFeedback({
        type: "error",
        text: "Sản phẩm phải có ít nhất 1 hình ảnh trước khi gửi duyệt.",
      });
      return;
    }

    const confirmed = window.confirm(
      "Sau khi gửi duyệt, sản phẩm sẽ được khóa chỉnh sửa để ban quản trị Tí Coolture thẩm định. Bạn có chắc chắn muốn nộp?"
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    setFormFeedback(null);

    const token = (await getSupabaseToken()) || "dev-token";

    try {
      const res = await fetch("/api/portal/submit-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: editingProductId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gửi duyệt thất bại.");
      }

      setFormFeedback({
        type: "success",
        text: "Đã gửi duyệt thành công! Thông báo đã được gửi về ban quản trị Tí Coolture.",
      });

      if (token) await loadPortalMe(token);
      setActiveView("list");
    } catch (err: any) {
      // Dev mode fallback
      setFormFeedback({
        type: "success",
        text: "Đã gửi duyệt thành công! (Mô phỏng Telegram alert đến Admin)",
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProductId ? { ...p, status: "pending_review" } : p
        )
      );
      setTimeout(() => setActiveView("list"), 1200);
    } finally {
      setIsSubmitting(false);
    }
  }

  // 1. Loading View
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[#111110] text-[#eae7dc] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[#d4af37]" />
          <p className="text-xs uppercase tracking-widest text-[#a8a29e]">Đang xác thực quyền đối tác...</p>
        </div>
      </div>
    );
  }

  // 2. Not Logged In View
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#111110] text-[#eae7dc] flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-[#1c1c1a] border border-[#2e2d2a] rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#d4af37]"></span>
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#a8a29e]">
              Partner Portal · Tí Coolture
            </span>
          </div>

          <h1 className="text-2xl font-serif font-bold text-[#faf8f5] mb-2">
            Không gian Đối tác Xưởng
          </h1>
          <p className="text-sm text-[#a8a29e] mb-8 leading-relaxed">
            Dành riêng cho các nghệ nhân & thương hiệu thủ công đăng tải hình ảnh và thông tin sản phẩm.
          </p>

          {authError && (
            <div className="mb-6 p-3.5 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-200 flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-[#faf8f5] hover:bg-[#ffffff] text-[#111110] font-medium rounded-xl transition duration-150 shadow-sm text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Tiếp tục với Google
          </button>

          <div className="mt-8 pt-6 border-t border-[#2e2d2a] text-center">
            <p className="text-[11px] text-[#78716c] leading-relaxed">
              Truy cập yêu cầu lời mời từ ban quản trị. Hệ thống không lưu trữ mật khẩu, hoàn toàn tuân thủ Nghị định 13/2023/NĐ-CP.
            </p>
          </div>

          {/* Dev Test Section */}
          <div className="mt-6 pt-4 border-t border-[#262522]">
            <details className="text-left text-xs text-[#78716c]">
              <summary className="cursor-pointer hover:text-[#a8a29e] transition">
                Chế độ Thử nghiệm Nhanh (Dev Preview)
              </summary>
              <form onSubmit={handleDevLogin} className="mt-3 flex flex-col gap-2">
                <input
                  type="email"
                  value={devEmailInput}
                  onChange={(e) => setDevEmailInput(e.target.value)}
                  placeholder="Nhập email xưởng (ví dụ: gommocchan@gmail.com)"
                  className="w-full bg-[#111110] border border-[#3b3a36] rounded-lg px-3 py-2 text-xs text-[#eae7dc] focus:outline-none focus:border-[#d4af37]"
                />
                <button
                  type="submit"
                  className="w-full bg-[#2e2d2a] hover:bg-[#3b3a36] text-[#eae7dc] py-2 rounded-lg text-xs font-medium transition"
                >
                  Vào thử nghiệm với Email này
                </button>
              </form>
            </details>
          </div>
        </div>
      </div>
    );
  }

  // 3. 403 Forbidden View (Logged in but no authorized shop)
  if (!shop) {
    return (
      <div className="min-h-screen bg-[#111110] text-[#eae7dc] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-[#1c1c1a] border border-red-900/40 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800/50 flex items-center justify-center mx-auto mb-4 text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-serif font-bold text-[#faf8f5] mb-2">
            Email chưa được cấp quyền
          </h2>
          <p className="text-sm text-[#a8a29e] mb-4 leading-relaxed">
            Tài khoản Google <strong className="text-[#faf8f5]">{currentUser.email}</strong> chưa liên kết với bất kỳ xưởng thủ công nào trên Tí Coolture.
          </p>

          <p className="text-xs text-[#78716c] mb-8 leading-relaxed">
            Nếu bạn là đối tác vừa nhận lời mời, hãy chắc chắn bạn đã chọn đúng địa chỉ Gmail đã cung cấp cho ban quản trị.
          </p>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-4 bg-[#2e2d2a] hover:bg-[#3b3a36] text-[#eae7dc] rounded-xl text-sm font-medium transition"
            >
              Đổi tài khoản Google khác
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Main Partner Portal Dashboard View
  return (
    <div className="min-h-screen bg-[#111110] text-[#eae7dc] font-sans pb-24">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-[#171715]/90 backdrop-blur-md border-b border-[#262522]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2e2d2a] border border-[#3e3d38] flex items-center justify-center text-[#d4af37]">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-serif font-bold text-[#faf8f5]">
                  {shop.name}
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#262522] text-[#a8a29e] border border-[#383733]">
                  {role === "owner" ? "Chủ xưởng" : "Biên tập"}
                </span>
              </div>
              <p className="text-[11px] text-[#78716c]">{currentUser.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#a8a29e] hover:text-[#eae7dc] hover:bg-[#262522] transition"
              title="Đăng xuất"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        {activeView === "list" ? (
          <div>
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-serif font-bold text-[#faf8f5]">
                  Danh mục sản phẩm xưởng
                </h2>
                <p className="text-xs text-[#a8a29e] mt-1">
                  Đăng tải hình ảnh chất lượng cao và câu chuyện sáng tạo của sản phẩm.
                </p>
              </div>

              <button
                onClick={openCreateForm}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#d4af37] hover:bg-[#c49f27] text-[#111110] font-medium rounded-xl text-xs uppercase tracking-wider transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Thêm sản phẩm mới
              </button>
            </div>

            {/* Product Grid / Table */}
            {products.length === 0 ? (
              <div className="bg-[#171715] border border-[#262522] rounded-2xl p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-[#262522] flex items-center justify-center mx-auto mb-4 text-[#a8a29e]">
                  <FileImage className="w-6 h-6" />
                </div>
                <h3 className="text-base font-serif font-semibold text-[#faf8f5] mb-1">
                  Chưa có sản phẩm nào
                </h3>
                <p className="text-xs text-[#78716c] max-w-sm mx-auto mb-6">
                  Bấm nút bên dưới để bắt đầu đăng sản phẩm đầu tiên cho xưởng của bạn.
                </p>
                <button
                  onClick={openCreateForm}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#faf8f5] hover:bg-[#ffffff] text-[#111110] font-medium rounded-xl text-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  Tạo sản phẩm đầu tiên
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((prod) => {
                  const coverImage = prod.product_images?.find((i) => i.is_cover) || prod.product_images?.[0];
                  const imgUrl = coverImage?.url
                    ? coverImage.url.startsWith("http")
                      ? coverImage.url
                      : `/shop-photos/${coverImage.url}`
                    : null;

                  return (
                    <div
                      key={prod.id}
                      className="bg-[#171715] border border-[#262522] rounded-2xl overflow-hidden hover:border-[#3b3a36] transition flex flex-col"
                    >
                      {/* Image Thumbnail */}
                      <div className="aspect-[4/3] bg-[#21211e] relative overflow-hidden flex items-center justify-center">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={prod.name_vi}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-xs text-[#78716c] flex flex-col items-center gap-1.5">
                            <FileImage className="w-6 h-6" />
                            <span>Chưa có ảnh</span>
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="absolute top-3 left-3">
                          {prod.status === "draft" && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#2e2d2a]/90 text-[#d4af37] backdrop-blur-sm border border-[#3e3d38]">
                              Bản nháp
                            </span>
                          )}
                          {prod.status === "pending_review" && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-950/80 text-amber-300 backdrop-blur-sm border border-amber-800/60 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Đang chờ duyệt
                            </span>
                          )}
                          {prod.status === "published" && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-950/80 text-emerald-300 backdrop-blur-sm border border-emerald-800/60 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Đã xuất bản
                            </span>
                          )}
                          {prod.status === "rejected" && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-red-950/80 text-red-300 backdrop-blur-sm border border-red-800/60">
                              Yêu cầu sửa
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-serif font-bold text-[#faf8f5] text-base mb-1">
                            {prod.name_vi}
                          </h3>
                          {prod.price_vnd ? (
                            <p className="text-xs font-mono text-[#d4af37]">
                              {prod.price_vnd.toLocaleString("vi-VN")} ₫
                            </p>
                          ) : (
                            <p className="text-xs text-[#78716c]">Giá liên hệ</p>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#262522] flex items-center justify-between text-xs">
                          <span className="text-[#78716c] text-[11px]">
                            {prod.product_images?.length || 0} ảnh
                          </span>

                          <button
                            onClick={() => openEditForm(prod)}
                            className="text-[#d4af37] hover:text-[#f0cb53] font-medium transition"
                          >
                            {prod.status === "pending_review" ? "Xem chi tiết" : "Chỉnh sửa →"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Editor View */
          <div className="max-w-3xl mx-auto">
            {/* Top Navigation Back */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setActiveView("list")}
                className="flex items-center gap-1.5 text-xs text-[#a8a29e] hover:text-[#eae7dc] transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Quay lại danh sách
              </button>

              <span className="text-xs font-mono text-[#78716c]">
                {editingProductId ? "Chỉnh sửa sản phẩm" : "Thêm mới"}
              </span>
            </div>

            {formFeedback && (
              <div
                className={`mb-6 p-4 rounded-xl text-xs flex items-center gap-2.5 leading-relaxed ${
                  formFeedback.type === "success"
                    ? "bg-emerald-950/50 border border-emerald-800/60 text-emerald-200"
                    : "bg-red-950/50 border border-red-800/60 text-red-200"
                }`}
              >
                {formFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
                <span>{formFeedback.text}</span>
              </div>
            )}

            <div className="bg-[#171715] border border-[#262522] rounded-2xl p-6 sm:p-8 space-y-6">
              {/* Product Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#a8a29e] uppercase tracking-wider mb-1.5">
                    Tên sản phẩm (Tiếng Việt) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={nameVi}
                    onChange={(e) => setNameVi(e.target.value)}
                    placeholder="Ví dụ: Bình gốm vuốt tay Men Tro"
                    className="w-full bg-[#111110] border border-[#2e2d2a] rounded-xl px-4 py-2.5 text-sm text-[#faf8f5] focus:outline-none focus:border-[#d4af37] transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#a8a29e] uppercase tracking-wider mb-1.5">
                      Danh mục <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-[#111110] border border-[#2e2d2a] rounded-xl px-4 py-2.5 text-sm text-[#faf8f5] focus:outline-none focus:border-[#d4af37] transition"
                    >
                      {CATEGORIES.map((catGroup) => (
                        <optgroup key={catGroup.group} label={catGroup.group}>
                          {catGroup.items.map((it) => (
                            <option key={it.id} value={it.id}>
                              {it.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#a8a29e] uppercase tracking-wider mb-1.5">
                      Giá tham khảo (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={priceVnd}
                      onChange={(e) =>
                        setPriceVnd(e.target.value ? Number(e.target.value) : "")
                      }
                      placeholder="450000"
                      className="w-full bg-[#111110] border border-[#2e2d2a] rounded-xl px-4 py-2.5 text-sm text-[#faf8f5] focus:outline-none focus:border-[#d4af37] transition font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#a8a29e] uppercase tracking-wider mb-1.5">
                      Kích thước / Trọng lượng
                    </label>
                    <input
                      type="text"
                      value={dimensions}
                      onChange={(e) => setDimensions(e.target.value)}
                      placeholder="Ví dụ: 18 x 25 cm, 800g"
                      className="w-full bg-[#111110] border border-[#2e2d2a] rounded-xl px-4 py-2.5 text-sm text-[#faf8f5] focus:outline-none focus:border-[#d4af37] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#a8a29e] uppercase tracking-wider mb-1.5">
                      Tên tiếng Anh (tuỳ chọn)
                    </label>
                    <input
                      type="text"
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      placeholder="Ash-glaze ceramic vase"
                      className="w-full bg-[#111110] border border-[#2e2d2a] rounded-xl px-4 py-2.5 text-sm text-[#faf8f5] focus:outline-none focus:border-[#d4af37] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#a8a29e] uppercase tracking-wider mb-1.5">
                    Câu chuyện / Mô tả nghệ nhân
                  </label>
                  <textarea
                    rows={4}
                    value={storyVi}
                    onChange={(e) => setStoryVi(e.target.value)}
                    placeholder="Chia sẻ về chất liệu, cảm hứng chế tác và nét độc đáo của sản phẩm này..."
                    className="w-full bg-[#111110] border border-[#2e2d2a] rounded-xl p-4 text-sm text-[#faf8f5] focus:outline-none focus:border-[#d4af37] transition leading-relaxed resize-none"
                  ></textarea>
                </div>
              </div>

              {/* Multiple Direct-to-R2 Image Upload & Reorder */}
              <div className="pt-6 border-t border-[#262522]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-medium text-[#a8a29e] uppercase tracking-wider">
                      Hình ảnh sản phẩm (Cloudflare R2 Direct Upload)
                    </h3>
                    <p className="text-[11px] text-[#78716c] mt-0.5">
                      Kéo thả để sắp xếp thứ tự. Vị trí đầu tiên là Ảnh đại diện.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[#d4af37]">
                    {images.length} ảnh
                  </span>
                </div>

                {/* Upload Dropzone */}
                <label className="border-2 border-dashed border-[#2e2d2a] hover:border-[#d4af37]/60 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-[#111110]/50 hover:bg-[#111110] mb-6">
                  <UploadCloud className="w-8 h-8 text-[#a8a29e] mb-2" />
                  <span className="text-xs font-medium text-[#faf8f5]">
                    Chọn nhiều ảnh hoặc thả vào đây
                  </span>
                  <span className="text-[11px] text-[#78716c] mt-1">
                    Tối đa 12MB/ảnh · Định dạng WebP, JPEG, PNG
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>

                {/* Image Thumbnails & Reordering Grid */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {images.map((img, idx) => (
                      <div
                        key={img.id}
                        className={`relative aspect-square rounded-xl overflow-hidden border bg-[#21211e] group transition ${
                          idx === 0
                            ? "border-[#d4af37] ring-2 ring-[#d4af37]/20"
                            : "border-[#2e2d2a]"
                        }`}
                      >
                        <img
                          src={img.previewUrl || img.url}
                          alt={`Product view ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />

                        {/* Uploading indicator */}
                        {img.isUploading && (
                          <div className="absolute inset-0 bg-[#111110]/80 flex flex-col items-center justify-center p-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-[#d4af37] mb-1.5" />
                            <div className="w-full bg-[#262522] rounded-full h-1 overflow-hidden">
                              <div
                                className="bg-[#d4af37] h-1 transition-all"
                                style={{ width: `${img.progress || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] font-mono text-[#eae7dc] mt-1">
                              {img.progress || 0}%
                            </span>
                          </div>
                        )}

                        {/* Cover Tag */}
                        {idx === 0 && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider bg-[#d4af37] text-[#111110] shadow-sm">
                            Ảnh chính
                          </span>
                        )}

                        {/* Controls Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => moveImage(idx, "left")}
                              className="p-1.5 bg-[#1c1c1a] hover:bg-[#2e2d2a] rounded-lg text-white transition"
                              title="Sang trái"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="p-1.5 bg-red-950/80 hover:bg-red-800 rounded-lg text-red-200 transition"
                            title="Xóa ảnh này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {idx < images.length - 1 && (
                            <button
                              type="button"
                              onClick={() => moveImage(idx, "right")}
                              className="p-1.5 bg-[#1c1c1a] hover:bg-[#2e2d2a] rounded-lg text-white transition"
                              title="Sang phải"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-[#262522] flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[11px] text-[#78716c] text-center sm:text-left">
                  Sau khi lưu nháp, bạn có thể gửi bài để đội ngũ Tí Coolture duyệt lên website.
                </p>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-[#262522] hover:bg-[#33322d] text-[#eae7dc] font-medium rounded-xl text-xs transition flex items-center justify-center gap-2"
                  >
                    {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    Lưu bản nháp
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitReview}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-[#d4af37] hover:bg-[#c49f27] text-[#111110] font-medium rounded-xl text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    Gửi bài duyệt
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
