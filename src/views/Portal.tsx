import React, { useEffect, useState } from "react";
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
  getDataSourceMode,
  setDataSourceMode,
  DataSourceMode,
  resolveImageUrl,
  isSandboxEnabled,
  setSandboxEnabled,
  setSandboxOverrides,
  clearSandboxOverrides,
} from "../lib/dbService";
import {
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  Clock,
  Sparkles,
  LogOut,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileImage,
  RefreshCw,
  Store,
  KeyRound,
  Users,
  Layers,
  UserCheck,
  UserX,
  Send,
  Inbox,
  ExternalLink,
  XCircle,
  Check,
  Eye,
  X,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  MapPin,
  Mail,
  FileText,
  Globe,
  Save,
  Upload,
  Link2,
  Heart,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import PlatformGlyph from "../components/PlatformGlyph";
import { ArcTopRight, RibbonLoop } from "../components/BrandShapes";

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

function getCategoryName(catId: string): string {
  for (const group of CATEGORIES) {
    for (const item of group.items) {
      if (item.id === catId) return item.name;
    }
  }
  return "Chung";
}

interface PortalShop {
  id: string;
  name: string;
  slug: string;
  status: string;
  tagline_vi?: string;
  story_vi?: string;
  logo_url?: string;
  cover_url?: string;
  address?: string;
  area_tag?: string;
  contact_email?: string;
  socials?: any;
}

interface PortalProduct {
  id: string;
  name_vi: string;
  name_en?: string;
  category_id?: string;
  price_vnd?: number;
  dimensions?: string;
  material?: string;
  short_desc_vi?: string;
  story_vi?: string;
  variants?: any[];
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

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

interface PartnerRequest {
  id: string;
  shop_name: string;
  applicant_email: string;
  applicant_name?: string;
  phone_or_zalo?: string;
  social_link?: string;
  category?: string;
  description?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

interface ShopInvitation {
  id: string;
  invited_email: string;
  shop_role: string;
  status: "pending" | "accepted" | "revoked";
  created_at: string;
  shops?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface StaffMember {
  user_id?: string;
  email: string;
  full_name: string;
  role: "admin" | "moderator" | "viewer";
  is_active: boolean;
}

export default function Portal() {
  const [sessionLoading, setSessionLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [shop, setShop] = useState<PortalShop | null>(null);
  const [role, setRole] = useState<string>("owner");
  const [isAdmin, setIsAdmin] = useState(false);
  const [dataMode, setDataMode] = useState<DataSourceMode>(() => getDataSourceMode());
  const [sandboxMode, setSandboxMode] = useState<boolean>(() => isSandboxEnabled());
  const [adminTab, setAdminTab] = useState<"requests" | "reviews" | "shops" | "staff">("requests");
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [reviewFilter, setReviewFilter] = useState<"pending_review" | "published" | "all">("pending_review");
  const [products, setProducts] = useState<PortalProduct[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [bypassToken, setBypassToken] = useState(import.meta.env.VITE_ADMIN_TOKEN || "");

  // Admin Management State
  const [partnerRequests, setPartnerRequests] = useState<PartnerRequest[]>([]);
  const [invitations, setInvitations] = useState<ShopInvitation[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [adminShops, setAdminShops] = useState<any[]>([]);
  const [expandedShopId, setExpandedShopId] = useState<string | null>(null);
  const [newShopEmail, setNewShopEmail] = useState("");
  const [newShopName, setNewShopName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<"admin" | "moderator" | "viewer">("admin");
  const [adminFeedback, setAdminFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  const [activePreviewImg, setActivePreviewImg] = useState<number>(0);

  // Active view for products: "list" | "edit"
  const [activeView, setActiveView] = useState<"list" | "edit">("list");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form State
  const [nameVi, setNameVi] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [categoryId, setCategoryId] = useState("cat-do-gom");
  const [priceVnd, setPriceVnd] = useState<number | "">("");
  const [material, setMaterial] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [shortDescVi, setShortDescVi] = useState("");
  const [storyVi, setStoryVi] = useState("");
  const [images, setImages] = useState<ImageUploadItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Shop Partner Tabs & Profile Form State
  const [partnerTab, setPartnerTab] = useState<"storefront" | "products">("storefront");
  const [shopName, setShopName] = useState("");
  const [shopTaglineVi, setShopTaglineVi] = useState("");
  const [shopStoryVi, setShopStoryVi] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopAreaTag, setShopAreaTag] = useState("");
  const [shopContactEmail, setShopContactEmail] = useState("");
  const [shopLogoUrl, setShopLogoUrl] = useState("");
  const [shopCoverUrl, setShopCoverUrl] = useState("");
  const [shopSocials, setShopSocials] = useState<Record<string, string>>({});
  const [isSavingShop, setIsSavingShop] = useState(false);
  const [shopFeedback, setShopFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Preview Modal State ("store" | "product" | null)
  const [previewModal, setPreviewModal] = useState<"store" | "product" | null>(null);

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

  function getInitialRequests(): PartnerRequest[] {
    const local = localStorage.getItem("ti_partner_requests");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return [
      {
        id: "req-1",
        shop_name: "Gốm Đất Đỏ",
        applicant_email: "gomdatdo.craft@gmail.com",
        applicant_name: "Nguyễn Văn Đất",
        phone_or_zalo: "0901234567",
        social_link: "instagram.com/gomdatdo",
        category: "Đồ gốm",
        description: "Shop gốm thủ công đất đỏ Sa Huỳnh nung củi truyền thống.",
        status: "pending",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: "req-2",
        shop_name: "Tiệm Da Thật Khâu Tay",
        applicant_email: "tiemdathat.sg@gmail.com",
        applicant_name: "Trần Thị Thu Thảo",
        phone_or_zalo: "0987654321",
        social_link: "instagram.com/tiemdathat",
        category: "Phụ kiện & Đồ da",
        description: "Ví, túi xách, bao passport da bò sáp may tay bằng chỉ sáp Ý.",
        status: "pending",
        created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: "req-3",
        shop_name: "Mây Tre Đan Xứ Quảng",
        applicant_email: "maytredan.craft@gmail.com",
        applicant_name: "Lê Quang Huy",
        phone_or_zalo: "0912888999",
        social_link: "tiktok.com/@maytredan",
        category: "Trang trí",
        description: "Đèn lồng mây tre đan thủ công mỹ nghệ xuất khẩu.",
        status: "pending",
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
    ];
  }

  // Listen to Supabase session & fetch portal data
  useEffect(() => {
    async function initSession() {
      setSessionLoading(true);
      setAuthError(null);

      // 0. ADMIN_TOKEN Bypass Check (Dev Mode only)
      if (import.meta.env.DEV) {
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get("admin_token");
        const storedToken = typeof localStorage !== "undefined" ? localStorage.getItem("ti_admin_bypass_token") : null;
        const validToken = import.meta.env.VITE_ADMIN_TOKEN;
        if (!validToken) return;

        if ((urlToken && urlToken.trim() === validToken) || (storedToken && storedToken.trim() === validToken)) {
          localStorage.setItem("ti_admin_bypass_token", validToken);
          const adminUser: any = {
            id: "00000000-0000-0000-0000-000000000001",
            email: "admin@ti-coolture.local",
            user_metadata: { full_name: "Super Admin (Bypass)" },
          };
          setCurrentUser(adminUser);
          setIsAdmin(true);
          setRole("admin");
          await loadAdminData();
          setSessionLoading(false);
          return;
        }
      }

      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setCurrentUser(data.session.user);
          await loadPortalMe(data.session.access_token, data.session.user);
          setSessionLoading(false);
          return;
        }

        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            if (session) {
              setCurrentUser(session.user);
              await loadPortalMe(session.access_token, session.user);
            } else {
              setCurrentUser(null);
              setShop(null);
              setIsAdmin(false);
            }
          }
        );

        setSessionLoading(false);
        return () => {
          authListener.subscription.unsubscribe();
        };
      }

      setSessionLoading(false);
    }

    initSession();
  }, []);

  function populateShopState(shopData: any) {
    if (!shopData) return;
    setShopName(shopData.name || "");
    setShopTaglineVi(shopData.tagline_vi || "");
    setShopStoryVi(shopData.story_vi || "");
    setShopAddress(shopData.address || shopData.area_tag || "");
    setShopAreaTag(shopData.area_tag || "");
    setShopContactEmail(shopData.contact_email || "");
    setShopLogoUrl(shopData.logo_url || "");
    setShopCoverUrl(shopData.cover_url || "");
    if (shopData.socials && Array.isArray(shopData.socials)) {
      const socMap: Record<string, string> = {};
      shopData.socials.forEach((s: any) => {
        if (s.platform && s.url) socMap[s.platform] = s.url;
      });
      setShopSocials(socMap);
    } else if (shopData.socials && typeof shopData.socials === "object") {
      setShopSocials(shopData.socials);
    }
  }

  async function loadPortalMe(token: string, userObj?: any) {
    try {
      setAuthError(null);
      const email = (userObj?.email || currentUser?.email || "").toLowerCase().trim();

      // Super admin email check
      const isSuperAdminEmail = email === "locle30092004@gmail.com";

      // 1. Try Backend API
      try {
        const res = await fetch("/api/portal/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          const data = await res.json();
          if (data.success) {
            setShop(data.shop);
            populateShopState(data.shop);
            setRole(data.role || "owner");
            setProducts(data.products || []);
            setIsAdmin(Boolean(data.isAdmin || isSuperAdminEmail));
            if (data.isAdmin || isSuperAdminEmail) {
              await loadAdminData();
            }
            return;
          }
        }
      } catch (e) {
        console.warn("Backend API not reachable locally, querying Supabase directly.");
      }

      // 2. Direct Supabase Query
      if (supabase) {
        const { data: staffMember } = await supabase
          .from("staff_members")
          .select("role, full_name, is_active")
          .eq("email", email)
          .eq("is_active", true)
          .maybeSingle();

        if (staffMember || isSuperAdminEmail) {
          setIsAdmin(true);
          setRole(staffMember?.role || "admin");
          await loadAdminData();
          return;
        }

        // Check existing shop membership
        const { data: shopMember } = await supabase
          .from("shop_members")
          .select("shop_role, shops(*)")
          .eq("user_id", userObj?.id)
          .maybeSingle();

        if (shopMember && shopMember.shops) {
          const shopData = shopMember.shops as any;
          setShop(shopData);
          populateShopState(shopData);
          setRole(shopMember.shop_role);
          setIsAdmin(false);

          // Fetch products of this shop
          const { data: dbProds } = await supabase
            .from("products")
            .select("*, product_images(*)")
            .eq("shop_id", shopData.id)
            .order("updated_at", { ascending: false });
          if (dbProds) setProducts(dbProds as any);

          // Fetch socials of this shop
          const { data: dbSocs } = await supabase
            .from("shop_socials")
            .select("platform, url")
            .eq("shop_id", shopData.id);
          if (dbSocs) {
            const sm: Record<string, string> = {};
            dbSocs.forEach((s: any) => {
              if (s.platform && s.url) sm[s.platform] = s.url;
            });
            setShopSocials(sm);
          }
          return;
        }

        // Auto-linking: Check if partner has an active invitation by email
        const { data: invite } = await supabase
          .from("shop_invitations")
          .select("id, shop_id, shop_role, status, shops(*)")
          .eq("invited_email", email)
          .eq("status", "pending")
          .maybeSingle();

        if (invite && invite.shops) {
          // 1. Create shop_members row
          await supabase.from("shop_members").insert({
            user_id: userObj.id,
            shop_id: invite.shop_id,
            shop_role: invite.shop_role,
          });

          // 2. Mark invitation accepted
          await supabase
            .from("shop_invitations")
            .update({ status: "accepted", accepted_at: new Date().toISOString() })
            .eq("id", invite.id);

          const shopData = invite.shops as any;
          setShop(shopData);
          populateShopState(shopData);
          setRole(invite.shop_role);
          setIsAdmin(false);
          return;
        }
      }

      // 3. Super Admin bypass
      if (isSuperAdminEmail) {
        setIsAdmin(true);
        setRole("admin");
        await loadAdminData();
        return;
      }

      setAuthError("Email chưa được cấp quyền quản lý shop nào trên Tí Coolture.");
      setShop(null);
      setIsAdmin(false);
    } catch (err: any) {
      setAuthError(err.message || "Lỗi kết nối máy chủ.");
    }
  }

  async function loadAdminData() {
    const token = (await getSupabaseToken()) || (typeof localStorage !== "undefined" ? localStorage.getItem("ti_admin_bypass_token") : null) || "dev-token";

    // 1. Try Backend API first for Reviews & Shops (uses service role key, works on both Localhost & Production)
    let apiReviewsLoaded = false;
    try {
      const res = await fetch("/api/admin/reviews", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.products)) setPendingReviews(data.products);
          if (Array.isArray(data.shops)) setAdminShops(data.shops);
          apiReviewsLoaded = true;
        }
      }
    } catch (e) {
      console.warn("Could not load reviews from /api/admin/reviews:", e);
    }

    // 2. Try Backend API for Partner Requests
    let requests = getInitialRequests();
    let apiRequestsLoaded = false;
    try {
      const res = await fetch("/api/admin/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.requests) && data.requests.length > 0) {
          requests = data.requests;
          apiRequestsLoaded = true;
        }
      }
    } catch (e) {
      console.warn("Could not load requests from /api/admin/requests:", e);
    }

    if (!apiRequestsLoaded && supabase) {
      try {
        const { data: dbReqs } = await supabase
          .from("partner_requests")
          .select("*")
          .order("created_at", { ascending: false });
        if (dbReqs && dbReqs.length > 0) {
          requests = dbReqs;
        }
      } catch (e) {
        console.warn("Could not fetch partner_requests from Supabase:", e);
      }
    }
    setPartnerRequests(requests);

    // 2. Load Invitations
    let invs: ShopInvitation[] = [
      {
        id: "inv-1",
        invited_email: "gommocchan@gmail.com",
        shop_role: "owner",
        status: "accepted",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        shops: { id: "s-1", name: "Gốm Mộc Chân", slug: "gom-moc-chan" },
      },
      {
        id: "inv-2",
        invited_email: "gaconstudios@gmail.com",
        shop_role: "owner",
        status: "pending",
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        shops: { id: "s-2", name: "Gà con Studios", slug: "ga-con-studios" },
      },
    ];
    if (supabase) {
      try {
        const { data: dbInvs } = await supabase
          .from("shop_invitations")
          .select("id, invited_email, shop_role, status, created_at, shops(id, name, slug)")
          .order("created_at", { ascending: false });
        if (dbInvs && dbInvs.length > 0) {
          invs = dbInvs as any;
        }
      } catch (e) {
        console.warn("Could not fetch shop_invitations from Supabase:", e);
      }
    }
    setInvitations(invs);

    // 3. Load Staff
    let staff: StaffMember[] = [
      {
        user_id: "u-loc",
        email: "locle30092004@gmail.com",
        full_name: "Lộc Lê (Super Admin)",
        role: "admin",
        is_active: true,
      },
    ];
    if (supabase) {
      try {
        const { data: dbStaff } = await supabase
          .from("staff_members")
          .select("user_id, email, full_name, role, is_active")
          .order("created_at", { ascending: true });
        if (dbStaff && dbStaff.length > 0) {
          staff = dbStaff as any;
        }
      } catch (e) {
        console.warn("Could not fetch staff_members from Supabase:", e);
      }
    }
    setStaffList(staff);

    // 4. Load Products for Review (Fallback)
    if (!apiReviewsLoaded && supabase) {
      try {
        const { data: revData } = await supabase
          .from("products")
          .select("*, shops(id, name, slug, contact_email), product_images(*), categories(name_vi)")
          .order("created_at", { ascending: false });
        if (revData) {
          setPendingReviews(revData);
        }
      } catch (e) {
        console.warn("Could not fetch products for review from Supabase:", e);
      }
    }

    // 5. Load All Shops & their Products for Admin Visibility Management (Fallback)
    if (!apiReviewsLoaded && supabase) {
      try {
        const { data: dbShops } = await supabase
          .from("shops")
          .select(`
            id,
            name,
            slug,
            status,
            contact_email,
            address,
            area_tag,
            logo_url,
            cover_url,
            created_at,
            products (
              id,
              name_vi,
              price_vnd,
              status,
              category_id,
              product_images (
                id,
                url,
                is_cover
              )
            )
          `)
          .order("created_at", { ascending: false });

        if (dbShops) {
          setAdminShops(dbShops);
        }
      } catch (e) {
        console.warn("Could not fetch shops with products for admin:", e);
      }
    }
  }

  function handleToggleDataMode(mode: DataSourceMode) {
    setDataMode(mode);
    setDataSourceMode(mode);
    setAdminFeedback({
      type: "success",
      text: mode === "real"
        ? "ĐÃ BẬT CHẾ ĐỘ DỮ LIỆU THẬT (Supabase DB). Website chính đang hiển thị các shop và hình ảnh thật đã duyệt!"
        : "ĐÃ BẬT CHẾ ĐỘ DỮ LIỆU DEMO (MOCK 13 SHOP). Website chính đang hiển thị dữ liệu demo mẫu.",
    });
  }

  async function handleReviewAction(productId: string, action: "approve" | "reject", productName: string) {
    if (!window.confirm(action === "approve"
      ? `Bạn có chắc muốn DUYỆT và xuất bản sản phẩm "${productName}" lên website chính?`
      : `Bạn có chắc muốn TỪ CHỐI sản phẩm "${productName}"?`)) return;

    setIsSubmittingAdmin(true);
    setAdminFeedback(null);

    // Sandbox Mode Check
    if (sandboxMode) {
      const newStatus = action === "approve" ? "published" : "rejected";
      setSandboxOverrides({ products: { [productId]: newStatus } });
      setPendingReviews((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p))
      );
      setAdminFeedback({
        type: "success",
        text: `[SANDBOX LOCAL] Đã ${action === "approve" ? "duyệt" : "từ chối"} thử nghiệm sản phẩm "${productName}" (chỉ lưu trên localhost, không chạm database thật)!`,
      });
      setIsSubmittingAdmin(false);
      return;
    }

    const token = (await getSupabaseToken()) || "dev-token";

    // 1. Try serverless API
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPendingReviews((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, status: action === "approve" ? "published" : "rejected" } : p))
        );
        setAdminFeedback({
          type: "success",
          text: action === "approve"
            ? `Đã duyệt và xuất bản sản phẩm "${productName}" lên website!`
            : `Đã từ chối xét duyệt sản phẩm "${productName}".`,
        });
        setIsSubmittingAdmin(false);
        return;
      }
    } catch (e) {
      console.warn("Backend API not reachable locally, trying direct Supabase:", e);
    }

    // 2. Direct Supabase
    if (supabase) {
      try {
        const newStatus = action === "approve" ? "published" : "rejected";
        const nowIso = new Date().toISOString();
        const { error: prodErr } = await supabase
          .from("products")
          .update({
            status: newStatus,
            published_at: action === "approve" ? nowIso : null,
            updated_at: nowIso,
          })
          .eq("id", productId);

        if (prodErr) throw prodErr;

        if (action === "approve") {
          const prod = pendingReviews.find((p) => p.id === productId);
          if (prod?.shop_id) {
            await supabase.from("shops").update({ status: "published", updated_at: nowIso }).eq("id", prod.shop_id);
          }
        }

        setPendingReviews((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p))
        );
        setAdminFeedback({
          type: "success",
          text: action === "approve"
            ? `Đã duyệt và xuất bản sản phẩm "${productName}" lên website!`
            : `Đã từ chối xét duyệt sản phẩm "${productName}".`,
        });
      } catch (err: any) {
        setAdminFeedback({ type: "error", text: "Lỗi duyệt sản phẩm: " + err.message });
      }
    }

    setIsSubmittingAdmin(false);
  }

  // Admin Action: Toggle Show/Hide Shop (also toggles all products of the shop)
  async function handleToggleShopStatus(shopId: string, currentStatus: string, shopName: string) {
    const isCurrentlyPublished = currentStatus === "published";
    const newStatus = isCurrentlyPublished ? "hidden" : "published";

    const confirmMsg = isCurrentlyPublished
      ? `Bạn có chắc muốn ẨN shop "${shopName}"?\nThao tác này sẽ tự động ẨN TOÀN BỘ sản phẩm của shop trên website chính.`
      : `Bạn có chắc muốn HIỂN THỊ lại shop "${shopName}" trên website chính?`;

    if (!window.confirm(confirmMsg)) return;

    setIsSubmittingAdmin(true);
    setAdminFeedback(null);

    if (sandboxMode) {
      const shopObj = adminShops.find((s) => s.id === shopId);
      const prodOverrides = (shopObj?.products || []).reduce(
        (acc: any, p: any) => ({ ...acc, [p.id]: newStatus === "hidden" ? "hidden" : "published" }),
        {}
      );
      setSandboxOverrides({
        shops: { [shopId]: newStatus as any },
        ...(newStatus === "hidden" ? { products: prodOverrides } : {}),
      });
      setAdminShops((prev) =>
        prev.map((s) => {
          if (s.id !== shopId) return s;
          const updatedProds =
            newStatus === "hidden"
              ? (s.products || []).map((p: any) => ({ ...p, status: "hidden" }))
              : s.products;
          return { ...s, status: newStatus, products: updatedProds };
        })
      );
      setPendingReviews((prev) =>
        prev.map((p) => {
          if (p.shop_id === shopId && newStatus === "hidden") {
            return { ...p, status: "hidden" };
          }
          return p;
        })
      );
      setAdminFeedback({
        type: "success",
        text: isCurrentlyPublished
          ? `[SANDBOX LOCAL] Đã ẩn shop "${shopName}" trên localhost!`
          : `[SANDBOX LOCAL] Đã mở hiển thị shop "${shopName}" trên localhost!`,
      });
      setIsSubmittingAdmin(false);
      return;
    }

    try {
      const now = new Date().toISOString();
      if (supabase) {
        // 1. Update shop status
        const { error: sErr } = await supabase
          .from("shops")
          .update({ status: newStatus, updated_at: now })
          .eq("id", shopId);
        if (sErr) throw sErr;

        // 2. If hiding shop, hide ALL products of this shop!
        if (newStatus === "hidden") {
          const { error: pErr } = await supabase
            .from("products")
            .update({ status: "hidden", updated_at: now })
            .eq("shop_id", shopId);
          if (pErr) throw pErr;
        }
      }

      // Update local admin state
      setAdminShops((prev) =>
        prev.map((s) => {
          if (s.id !== shopId) return s;
          const updatedProds =
            newStatus === "hidden"
              ? (s.products || []).map((p: any) => ({ ...p, status: "hidden" }))
              : s.products;
          return { ...s, status: newStatus, products: updatedProds };
        })
      );

      // Also update pendingReviews
      setPendingReviews((prev) =>
        prev.map((p) => {
          if (p.shop_id === shopId && newStatus === "hidden") {
            return { ...p, status: "hidden" };
          }
          return p;
        })
      );

      setAdminFeedback({
        type: "success",
        text: isCurrentlyPublished
          ? `Đã ẩn shop "${shopName}" và toàn bộ sản phẩm của shop khỏi website!`
          : `Đã mở hiển thị lại shop "${shopName}" trên website chính!`,
      });
    } catch (err: any) {
      setAdminFeedback({
        type: "error",
        text: "Lỗi cập nhật trạng thái shop: " + (err.message || ""),
      });
    } finally {
      setIsSubmittingAdmin(false);
    }
  }

  // Admin Action: Toggle Show/Hide Individual Product
  async function handleToggleProductStatus(productId: string, currentStatus: string, productName: string) {
    const isCurrentlyPublished = currentStatus === "published";
    const newStatus = isCurrentlyPublished ? "hidden" : "published";

    const confirmMsg = isCurrentlyPublished
      ? `Bạn có chắc muốn ẨN sản phẩm "${productName}" khỏi website chính?`
      : `Bạn có chắc muốn HIỂN THỊ / XUẤT BẢN sản phẩm "${productName}" lên website chính?`;

    if (!window.confirm(confirmMsg)) return;

    setIsSubmittingAdmin(true);
    setAdminFeedback(null);

    if (sandboxMode) {
      setSandboxOverrides({ products: { [productId]: newStatus as any } });
      setPendingReviews((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p))
      );
      setAdminShops((prev) =>
        prev.map((s) => ({
          ...s,
          products: (s.products || []).map((p: any) =>
            p.id === productId ? { ...p, status: newStatus } : p
          ),
        }))
      );
      setAdminFeedback({
        type: "success",
        text: isCurrentlyPublished
          ? `[SANDBOX LOCAL] Đã ẩn sản phẩm "${productName}" trên localhost!`
          : `[SANDBOX LOCAL] Đã hiển thị sản phẩm "${productName}" trên localhost!`,
      });
      setIsSubmittingAdmin(false);
      return;
    }

    try {
      const now = new Date().toISOString();
      if (supabase) {
        const { error: pErr } = await supabase
          .from("products")
          .update({
            status: newStatus,
            published_at: newStatus === "published" ? now : null,
            updated_at: now,
          })
          .eq("id", productId);
        if (pErr) throw pErr;
      }

      // Update pendingReviews list
      setPendingReviews((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p))
      );

      // Update adminShops list
      setAdminShops((prev) =>
        prev.map((s) => ({
          ...s,
          products: (s.products || []).map((p: any) =>
            p.id === productId ? { ...p, status: newStatus } : p
          ),
        }))
      );

      setAdminFeedback({
        type: "success",
        text: isCurrentlyPublished
          ? `Đã ẩn sản phẩm "${productName}" khỏi website!`
          : `Đã hiển thị sản phẩm "${productName}" lên website!`,
      });
    } catch (err: any) {
      setAdminFeedback({
        type: "error",
        text: "Lỗi cập nhật trạng thái sản phẩm: " + (err.message || ""),
      });
    } finally {
      setIsSubmittingAdmin(false);
    }
  }

  // Handle Google Login
  async function handleGoogleLogin() {
    setAuthError(null);
    try {
      if (isSupabaseConfigured) {
        await signInWithGoogle();
      } else {
        setAuthError("Chưa có biến môi trường VITE_SUPABASE_URL trong .env.local.");
      }
    } catch (err: any) {
      setAuthError(err.message || "Lỗi khi kích hoạt Google OAuth.");
    }
  }

  async function handleBypassLogin(tokenInput?: string) {
    const input = (tokenInput || bypassToken || "").trim();
    const validAdminToken = import.meta.env.VITE_ADMIN_TOKEN;

    if (!validAdminToken || input !== validAdminToken) {
      setAuthError("Admin Token không chính xác. Vui lòng kiểm tra biến ADMIN_TOKEN trong .env.local.");
      return;
    }

    localStorage.setItem("ti_admin_bypass_token", validAdminToken);
    const adminUser: any = {
      id: "00000000-0000-0000-0000-000000000001",
      email: "admin@ti-coolture.local",
      user_metadata: { full_name: "Super Admin (Bypass)" },
    };
    setCurrentUser(adminUser);
    setIsAdmin(true);
    setRole("admin");
    setAuthError(null);
    await loadAdminData();
  }

  async function handleLogout() {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("ti_admin_bypass_token");
    }
    await signOut();
    setCurrentUser(null);
    setShop(null);
    setIsAdmin(false);
    setProducts([]);
    setAuthError(null);
  }

  // Admin Action: Approve Partner Request from Main Website (Enforcing 1 Gmail = 1 Role)
  async function handleApproveRequest(reqItem: PartnerRequest) {
    const email = reqItem.applicant_email.toLowerCase().trim();

    // Check 1 Gmail = 1 Role: Không được là Admin
    if (staffList.some((s) => s.email.toLowerCase() === email && s.is_active)) {
      setAdminFeedback({
        type: "error",
        text: `Email ${email} đã được đăng ký vai trò Ban Quản Trị (Admin). Mỗi tài khoản Gmail chỉ được đăng ký duy nhất 1 vai trò!`,
      });
      return;
    }

    // Check 1 Gmail = 1 Shop
    if (invitations.some((inv) => inv.invited_email.toLowerCase() === email && inv.status !== "revoked")) {
      setAdminFeedback({
        type: "error",
        text: `Email ${email} đã được cấp quyền quản lý cho một shop khác. Mỗi tài khoản Gmail chỉ được mở 1 shop duy nhất theo quy định!`,
      });
      return;
    }

    setIsSubmittingAdmin(true);
    setAdminFeedback(null);

    if (sandboxMode) {
      setPartnerRequests((prev) =>
        prev.map((r) => (r.id === reqItem.id ? { ...r, status: "approved" } : r))
      );
      setAdminFeedback({
        type: "success",
        text: `[SANDBOX LOCAL] Đã duyệt thử nghiệm yêu cầu "${reqItem.shop_name}" (chỉ lưu trên localhost, không thay đổi database thật)!`,
      });
      setIsSubmittingAdmin(false);
      return;
    }

    const token = (await getSupabaseToken()) || "dev-token";

    // 1. Try Backend API
    try {
      const res = await fetch("/api/admin/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId: reqItem.id,
          action: "approve",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPartnerRequests((prev) =>
          prev.map((r) => (r.id === reqItem.id ? { ...r, status: "approved" } : r))
        );
        await loadAdminData();
        setAdminFeedback({
          type: "success",
          text: `Đã duyệt và cấp quyền mở shop "${reqItem.shop_name}" cho ${email} thành công!`,
        });
        setIsSubmittingAdmin(false);
        return;
      }
    } catch (e) {
      console.warn("Backend API not reachable, falling back to direct Supabase or local state:", e);
    }

    // 2. Direct Supabase
    if (supabase) {
      try {
        const slug = slugify(reqItem.shop_name) + "-" + Math.random().toString(36).substring(2, 6);
        const { data: newShop } = await supabase
          .from("shops")
          .insert({
            name: reqItem.shop_name.trim(),
            slug,
            contact_email: email,
            story_vi: reqItem.description,
            status: "published",
          })
          .select("id, name, slug")
          .single();

        if (newShop) {
          const { data: newInv } = await supabase
            .from("shop_invitations")
            .insert({
              shop_id: newShop.id,
              invited_email: email,
              shop_role: "owner",
              status: "pending",
            })
            .select("id, invited_email, shop_role, status, created_at")
            .single();

          await supabase
            .from("partner_requests")
            .update({ status: "approved", reviewed_at: new Date().toISOString() })
            .eq("id", reqItem.id);

          setPartnerRequests((prev) =>
            prev.map((r) => (r.id === reqItem.id ? { ...r, status: "approved" } : r))
          );
          if (newInv) {
            setInvitations((prev) => [{ ...newInv, shops: newShop }, ...prev]);
          }
          setAdminFeedback({
            type: "success",
            text: `Đã duyệt yêu cầu và cấp quyền mở shop "${reqItem.shop_name}" cho ${email} (1 Gmail = 1 Shop)!`,
          });
          setIsSubmittingAdmin(false);
          return;
        }
      } catch (err: any) {
        console.warn("Direct Supabase approve error:", err);
      }
    }

    // 3. Local fallback
    setPartnerRequests((prev) =>
      prev.map((r) => (r.id === reqItem.id ? { ...r, status: "approved" } : r))
    );
    setInvitations((prev) => [
      {
        id: `inv-${Date.now()}`,
        invited_email: email,
        shop_role: "owner",
        status: "pending",
        created_at: new Date().toISOString(),
        shops: {
          id: `shop-${Date.now()}`,
          name: reqItem.shop_name.trim(),
          slug: slugify(reqItem.shop_name),
        },
      },
      ...prev,
    ]);
    setAdminFeedback({
      type: "success",
      text: `Đã duyệt yêu cầu và cấp quyền mở shop "${reqItem.shop_name}" cho ${email} (1 Gmail = 1 Shop)!`,
    });
    setIsSubmittingAdmin(false);
  }

  // Admin Action: Reject Partner Request
  async function handleRejectRequest(reqItem: PartnerRequest) {
    if (!window.confirm(`Bạn có chắc chắn muốn từ chối yêu cầu mở shop của "${reqItem.shop_name}"?`)) return;

    if (supabase) {
      try {
        await supabase
          .from("partner_requests")
          .update({ status: "rejected", reviewed_at: new Date().toISOString() })
          .eq("id", reqItem.id);
      } catch (e) {
        console.warn("Reject request error:", e);
      }
    }

    setPartnerRequests((prev) =>
      prev.map((r) => (r.id === reqItem.id ? { ...r, status: "rejected" } : r))
    );
    setAdminFeedback({
      type: "success",
      text: `Đã từ chối yêu cầu của shop "${reqItem.shop_name}".`,
    });
  }

  // Admin Action: Grant Shop Permission to Gmail (1 Gmail = 1 Shop)
  async function handleGrantShop(e: React.FormEvent) {
    e.preventDefault();
    if (!newShopEmail.trim() || !newShopName.trim()) {
      setAdminFeedback({ type: "error", text: "Vui lòng nhập đầy đủ Email và Tên shop." });
      return;
    }

    const email = newShopEmail.toLowerCase().trim();

    // Check 1 Gmail = 1 Role: Không được là Admin
    if (staffList.some((s) => s.email.toLowerCase() === email && s.is_active)) {
      setAdminFeedback({
        type: "error",
        text: `Email ${email} đã được đăng ký vai trò Ban Quản Trị (Admin). Mỗi tài khoản Gmail chỉ được đăng ký duy nhất 1 vai trò!`,
      });
      return;
    }

    // Check 1 Gmail = 1 Shop rule locally
    if (invitations.some((inv) => inv.invited_email.toLowerCase() === email && inv.status !== "revoked")) {
      setAdminFeedback({
        type: "error",
        text: `Email ${email} đã được cấp quyền mở shop. Mỗi tài khoản Gmail chỉ được mở 1 shop duy nhất theo quy định!`,
      });
      return;
    }

    setIsSubmittingAdmin(true);
    setAdminFeedback(null);

    const token = (await getSupabaseToken()) || "dev-token";

    // 1. Try Backend API
    try {
      const res = await fetch("/api/admin/portal/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          shopName: newShopName.trim(),
          role: "owner",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAdminFeedback({ type: "success", text: `Đã cấp quyền shop "${newShopName}" cho ${email} thành công!` });
        setNewShopEmail("");
        setNewShopName("");
        await loadAdminData();
        setIsSubmittingAdmin(false);
        return;
      }
    } catch (err: any) {
      console.warn("Backend API not reachable, falling back to direct Supabase or local state:", err);
    }

    // 2. Direct Supabase
    if (supabase) {
      try {
        const slug = slugify(newShopName) + "-" + Math.random().toString(36).substring(2, 6);
        const { data: newShop } = await supabase
          .from("shops")
          .insert({
            name: newShopName.trim(),
            slug,
            contact_email: email,
            status: "published",
          })
          .select("id, name, slug")
          .single();

        if (newShop) {
          const { data: newInv } = await supabase
            .from("shop_invitations")
            .insert({
              shop_id: newShop.id,
              invited_email: email,
              shop_role: "owner",
              status: "pending",
            })
            .select("id, invited_email, shop_role, status, created_at")
            .single();

          if (newInv) {
            setInvitations((prev) => [{ ...newInv, shops: newShop }, ...prev]);
          }
          setAdminFeedback({
            type: "success",
            text: `Đã cấp quyền shop "${newShopName}" cho ${email} (1 Gmail = 1 Shop)!`,
          });
          setNewShopEmail("");
          setNewShopName("");
          setIsSubmittingAdmin(false);
          return;
        }
      } catch (e) {
        console.warn("Direct Supabase grant shop error:", e);
      }
    }

    // 3. Local state fallback
    setInvitations((prev) => [
      {
        id: `inv-${Date.now()}`,
        invited_email: email,
        shop_role: "owner",
        status: "pending",
        created_at: new Date().toISOString(),
        shops: {
          id: `shop-${Date.now()}`,
          name: newShopName.trim(),
          slug: slugify(newShopName),
        },
      },
      ...prev,
    ]);
    setAdminFeedback({
      type: "success",
      text: `Đã cấp quyền shop "${newShopName}" cho ${email} (1 Gmail = 1 Shop)!`,
    });
    setNewShopEmail("");
    setNewShopName("");
    setIsSubmittingAdmin(false);
  }

  // Admin Action: Revoke Shop Permission
  async function handleRevokeShop(inviteId: string, email: string) {
    if (!window.confirm(`Bạn có chắc chắn muốn thu hồi quyền mở shop của ${email}?`)) return;

    const token = (await getSupabaseToken()) || "dev-token";
    try {
      await fetch("/api/admin/portal/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteId, email }),
      });
    } catch (e) {
      console.warn("Revoke API fallback:", e);
    }

    if (supabase) {
      try {
        await supabase
          .from("shop_invitations")
          .update({ status: "revoked" })
          .eq("id", inviteId);
      } catch (e) {}
    }

    setInvitations((prev) =>
      prev.map((inv) => (inv.id === inviteId ? { ...inv, status: "revoked" } : inv))
    );
    setAdminFeedback({ type: "success", text: `Đã thu hồi quyền shop của ${email}.` });
  }

  // Admin Action: Add New Admin / Staff
  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!newStaffEmail.trim()) {
      setAdminFeedback({ type: "error", text: "Vui lòng nhập Email Google cần cấp quyền admin." });
      return;
    }

    const email = newStaffEmail.toLowerCase().trim();

    // Check 1 Gmail = 1 Role: Không được là Shop
    if (invitations.some((inv) => inv.invited_email.toLowerCase() === email && inv.status !== "revoked")) {
      setAdminFeedback({
        type: "error",
        text: `Email ${email} đã được đăng ký vai trò Đối tác Shop. Mỗi tài khoản Gmail chỉ được đăng ký duy nhất 1 vai trò!`,
      });
      return;
    }

    setIsSubmittingAdmin(true);
    setAdminFeedback(null);

    const token = (await getSupabaseToken()) || "dev-token";

    // 1. Try Backend API
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          role: newStaffRole,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAdminFeedback({ type: "success", text: `Đã cấp quyền ${newStaffRole} cho ${email}!` });
        setNewStaffEmail("");
        await loadAdminData();
        setIsSubmittingAdmin(false);
        return;
      }
    } catch (err: any) {
      console.warn("Backend API not reachable, falling back to direct Supabase or local state:", err);
    }

    // 2. Direct Supabase
    if (supabase) {
      try {
        const { error } = await supabase
          .from("staff_members")
          .upsert(
            {
              email,
              full_name: email.split("@")[0],
              role: newStaffRole,
              is_active: true,
            },
            { onConflict: "email" }
          );

        if (!error) {
          setStaffList((prev) => {
            const exists = prev.some((s) => s.email.toLowerCase() === email);
            if (exists) {
              return prev.map((s) => (s.email.toLowerCase() === email ? { ...s, role: newStaffRole, is_active: true } : s));
            }
            return [
              ...prev,
              {
                user_id: "",
                email,
                full_name: email.split("@")[0],
                role: newStaffRole,
                is_active: true,
              },
            ];
          });
          setAdminFeedback({ type: "success", text: `Đã cấp quyền ${newStaffRole} cho ${email} thành công!` });
          setNewStaffEmail("");
          setIsSubmittingAdmin(false);
          return;
        }
      } catch (e) {
        console.warn("Direct Supabase add staff error:", e);
      }
    }

    // 3. Local state fallback
    setStaffList((prev) => [
      ...prev,
      {
        user_id: `u-${Date.now()}`,
        email,
        full_name: email.split("@")[0],
        role: newStaffRole,
        is_active: true,
      },
    ]);
    setAdminFeedback({ type: "success", text: `Đã cấp quyền ${newStaffRole} cho ${email} thành công!` });
    setNewStaffEmail("");
    setIsSubmittingAdmin(false);
  }

  // Admin Action: Revoke Admin / Staff Privileges
  async function handleRevokeStaff(targetEmail: string) {
    if (targetEmail.toLowerCase() === currentUser?.email?.toLowerCase()) {
      alert("Không thể tự tước quyền admin của chính mình!");
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn tước quyền admin của ${targetEmail}?`)) return;

    const token = (await getSupabaseToken()) || "dev-token";
    try {
      await fetch("/api/admin/staff/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetEmail }),
      });
    } catch (e) {
      console.warn("Revoke staff API fallback:", e);
    }

    if (supabase) {
      try {
        await supabase
          .from("staff_members")
          .update({ is_active: false })
          .eq("email", targetEmail.toLowerCase().trim());
      } catch (e) {}
    }

    setStaffList((prev) => prev.filter((s) => s.email.toLowerCase() !== targetEmail.toLowerCase()));
    setAdminFeedback({ type: "success", text: `Đã tước quyền quản trị của ${targetEmail}.` });
  }

  // Reset & Open Form
  function openCreateForm() {
    setEditingProductId(null);
    setNameVi("");
    setNameEn("");
    setCategoryId("cat-do-gom");
    setPriceVnd("");
    setMaterial("");
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
    setCategoryId(prod.category_id || "cat-do-gom");
    setPriceVnd(typeof prod.price_vnd === "number" ? prod.price_vnd : "");
    const matVal = prod.material || (Array.isArray(prod.variants) ? prod.variants.find((v: any) => v.type === "material")?.value : "") || "";
    setMaterial(matVal);
    setDimensions(prod.dimensions || "");
    setShortDescVi(prod.short_desc_vi || "");
    setStoryVi(prod.story_vi || "");
    setImages(
      (prod.product_images || []).map((img, idx) => ({
        id: img.id || `img-${idx}`,
        url: img.url,
        isCover: img.is_cover,
        sortOrder: img.sort_order,
        altVi: img.alt_vi,
        previewUrl: resolveImageUrl(img.url),
      }))
    );
    setFormFeedback(null);
    setActiveView("edit");
  }

  // Shop Profile Save Handler
  async function handleSaveShopProfile() {
    if (!shopName.trim()) {
      setShopFeedback({ type: "error", text: "Vui lòng nhập tên shop." });
      return;
    }

    setIsSavingShop(true);
    setShopFeedback(null);
    const token = (await getSupabaseToken()) || "dev-token";

    const payload = {
      name: shopName.trim(),
      taglineVi: shopTaglineVi.trim(),
      storyVi: shopStoryVi.trim(),
      address: shopAddress.trim(),
      areaTag: shopAreaTag.trim(),
      contactEmail: shopContactEmail.trim(),
      logoUrl: shopLogoUrl,
      coverUrl: shopCoverUrl,
      socials: shopSocials,
    };

    try {
      const res = await fetch("/api/portal/save-shop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể lưu thông tin shop.");
      }
      setShopFeedback({ type: "success", text: "Đã lưu thông tin shop thành công!" });
      setShop((prev: any) => ({
        ...prev,
        name: payload.name,
        tagline_vi: payload.taglineVi,
        story_vi: payload.storyVi,
        address: payload.address,
        area_tag: payload.areaTag,
        logo_url: payload.logoUrl,
        cover_url: payload.coverUrl,
      }));
    } catch (err: any) {
      if (supabase && shop?.id) {
        try {
          await supabase
            .from("shops")
            .update({
              name: payload.name,
              tagline_vi: payload.taglineVi || null,
              story_vi: payload.storyVi || null,
              address: payload.address || null,
              area_tag: payload.areaTag || null,
              logo_url: payload.logoUrl || null,
              cover_url: payload.coverUrl || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", shop.id);

          const platforms = ["instagram", "tiktok", "facebook", "threads", "website", "zalo"];
          for (const p of platforms) {
            const url = shopSocials[p]?.trim();
            if (url) {
              await supabase.from("shop_socials").upsert(
                {
                  shop_id: shop.id,
                  platform: p,
                  url,
                  is_visible: true,
                },
                { onConflict: "shop_id,platform" }
              );
            }
          }
        } catch (dbErr) {
          console.warn("Direct Supabase shop update error:", dbErr);
        }
      }
      setShopFeedback({ type: "success", text: "Đã lưu thông tin shop thành công!" });
      setShop((prev: any) => ({
        ...prev,
        name: payload.name,
        tagline_vi: payload.taglineVi,
        story_vi: payload.storyVi,
        address: payload.address,
        area_tag: payload.areaTag,
        logo_url: payload.logoUrl,
        cover_url: payload.coverUrl,
      }));
    } finally {
      setIsSavingShop(false);
    }
  }

  // Upload shop cover image
  async function handleUploadCover(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    const token = (await getSupabaseToken()) || "dev-token";
    try {
      const results = await uploadMultipleFilesDirectly(token, [file]);
      if (results[0]?.r2Key) {
        setShopCoverUrl(results[0].r2Key);
      } else {
        setShopCoverUrl(URL.createObjectURL(file));
      }
    } catch {
      setShopCoverUrl(URL.createObjectURL(file));
    } finally {
      setIsUploadingCover(false);
    }
  }

  // Upload shop logo
  async function handleUploadLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    const token = (await getSupabaseToken()) || "dev-token";
    try {
      const results = await uploadMultipleFilesDirectly(token, [file]);
      if (results[0]?.r2Key) {
        setShopLogoUrl(results[0].r2Key);
      } else {
        setShopLogoUrl(URL.createObjectURL(file));
      }
    } catch {
      setShopLogoUrl(URL.createObjectURL(file));
    } finally {
      setIsUploadingLogo(false);
    }
  }

  // Direct Image Upload Handler
  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files: File[] = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) return;

    const token = (await getSupabaseToken()) || "dev-token";

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
      console.warn("R2 upload fallback (offline preview):", err.message);
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

  function moveImage(index: number, direction: "left" | "right") {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    setImages((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;

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

  async function handleSaveDraft(): Promise<string | null> {
    if (!nameVi.trim()) {
      setFormFeedback({ type: "error", text: "Vui lòng nhập tên sản phẩm tiếng Việt." });
      return null;
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
      variants: material.trim() ? [{ type: "material", value: material.trim() }] : [],
      shortDescVi: shortDescVi.trim() || undefined,
      storyVi: storyVi.trim() || undefined,
      images: images.map((img, idx) => ({
        url: img.url || img.previewUrl || "",
        sortOrder: idx,
        isCover: idx === 0,
        altVi: nameVi.trim(),
      })),
    };

    let savedId: string | null = editingProductId || null;

    // 1. Try Backend API
    try {
      const res = await fetch("/api/portal/save-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success && data.product?.id) {
          savedId = data.product.id;
          setEditingProductId(savedId);
          setFormFeedback({ type: "success", text: "Đã lưu bản nháp thành công!" });
          if (token) await loadPortalMe(token);
          setIsSaving(false);
          return savedId;
        }
      }
    } catch (err: any) {
      console.warn("Backend save-draft endpoint unavailable or failed, falling back to direct Supabase:", err);
    }

    // 2. Direct Supabase Fallback
    if (supabase && shop?.id) {
      try {
        const cleanSlug = categoryId.replace(/^cat-/, "");
        let resolvedCatId = categoryId;
        const isCatUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId);
        if (!isCatUuid) {
          const { data: cat } = await supabase
            .from("categories")
            .select("id")
            .or(`slug.eq.${cleanSlug},slug.eq.${categoryId}`)
            .maybeSingle();
          if (cat?.id) {
            resolvedCatId = cat.id;
          } else {
            const { data: firstCat } = await supabase.from("categories").select("id").limit(1).maybeSingle();
            if (firstCat?.id) resolvedCatId = firstCat.id;
          }
        }

        const now = new Date().toISOString();
        if (savedId) {
          const { error: updErr } = await supabase
            .from("products")
            .update({
              name_vi: nameVi.trim(),
              name_en: nameEn.trim() || null,
              category_id: resolvedCatId,
              price_vnd: typeof priceVnd === "number" ? priceVnd : null,
              dimensions: dimensions.trim() || null,
              short_desc_vi: shortDescVi.trim() || null,
              story_vi: storyVi.trim() || null,
              variants: material.trim() ? [{ type: "material", value: material.trim() }] : [],
              updated_at: now,
            })
            .eq("id", savedId);

          if (updErr) throw updErr;
        } else {
          const slug = slugify(nameVi.trim()) + "-" + Math.random().toString(36).substring(2, 7);
          const { data: newProd, error: insErr } = await supabase
            .from("products")
            .insert({
              shop_id: shop.id,
              category_id: resolvedCatId,
              slug,
              name_vi: nameVi.trim(),
              name_en: nameEn.trim() || null,
              price_vnd: typeof priceVnd === "number" ? priceVnd : null,
              dimensions: dimensions.trim() || null,
              short_desc_vi: shortDescVi.trim() || null,
              story_vi: storyVi.trim() || null,
              variants: material.trim() ? [{ type: "material", value: material.trim() }] : [],
              status: "draft",
              created_at: now,
              updated_at: now,
            })
            .select("id")
            .single();

          if (insErr || !newProd) throw insErr || new Error("Không thể tạo sản phẩm mới");
          savedId = newProd.id;
        }

        if (savedId && images.length > 0) {
          await supabase.from("product_images").delete().eq("product_id", savedId);
          const imgRows = images.map((img, idx) => ({
            product_id: savedId,
            url: img.url || img.previewUrl || "",
            is_cover: idx === 0,
            sort_order: idx,
            alt_vi: nameVi.trim(),
          }));
          await supabase.from("product_images").insert(imgRows);
        }

        setEditingProductId(savedId);
        setFormFeedback({ type: "success", text: "Đã lưu bản nháp thành công vào cơ sở dữ liệu!" });
        if (token) await loadPortalMe(token);
        setIsSaving(false);
        return savedId;
      } catch (err: any) {
        console.warn("Direct Supabase save failed:", err);
      }
    }

    // 3. Fallback to Local State
    if (!savedId) {
      savedId = `prod-${Date.now()}`;
    }
    setEditingProductId(savedId);
    setProducts((prev) => {
      const existingIdx = prev.findIndex((p) => p.id === savedId);
      const item: PortalProduct = {
        id: savedId!,
        name_vi: nameVi,
        name_en: nameEn,
        category_id: categoryId,
        price_vnd: typeof priceVnd === "number" ? priceVnd : undefined,
        material: material.trim() || undefined,
        dimensions: dimensions.trim() || undefined,
        short_desc_vi: shortDescVi.trim() || undefined,
        story_vi: storyVi.trim() || undefined,
        variants: material.trim() ? [{ type: "material", value: material.trim() }] : [],
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

    setFormFeedback({
      type: "success",
      text: "Đã lưu bản nháp thành công!",
    });
    setIsSaving(false);
    return savedId;
  }

  async function handleSubmitReview() {
    let targetId = editingProductId;

    // If product draft is not yet saved, auto-save first so the partner is not blocked!
    if (!targetId) {
      if (!nameVi.trim()) {
        setFormFeedback({
          type: "error",
          text: "Vui lòng nhập tên sản phẩm tiếng Việt trước khi bấm gửi duyệt.",
        });
        return;
      }
      targetId = await handleSaveDraft();
      if (!targetId) {
        setFormFeedback({
          type: "error",
          text: "Không thể lưu sản phẩm. Vui lòng kiểm tra lại thông tin.",
        });
        return;
      }
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

    // 1. Try Backend API
    try {
      const res = await fetch("/api/portal/submit-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: targetId }),
      });

      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          setFormFeedback({
            type: "success",
            text: "Đã gửi duyệt thành công! Thông báo đã được gửi về ban quản trị.",
          });
          if (token) await loadPortalMe(token);
          setActiveView("list");
          setIsSubmitting(false);
          return;
        }
      }
    } catch (err: any) {
      console.warn("Backend submit-review API unreachable, using direct Supabase:", err);
    }

    // 2. Direct Supabase
    if (supabase && targetId) {
      try {
        await supabase
          .from("products")
          .update({
            status: "pending_review",
            updated_at: new Date().toISOString(),
          })
          .eq("id", targetId);

        setFormFeedback({
          type: "success",
          text: "Đã gửi duyệt thành công! Sản phẩm đang chờ ban quản trị thẩm định.",
        });
        setProducts((prev) =>
          prev.map((p) => (p.id === targetId ? { ...p, status: "pending_review" } : p))
        );
        setTimeout(() => setActiveView("list"), 1200);
        setIsSubmitting(false);
        return;
      } catch (err: any) {
        console.warn("Direct Supabase submit-review failed:", err);
      }
    }

    // 3. Fallback
    setFormFeedback({
      type: "success",
      text: "Đã gửi duyệt thành công! (Trạng thái: Đang chờ duyệt)",
    });
    setProducts((prev) =>
      prev.map((p) =>
        p.id === targetId ? { ...p, status: "pending_review" } : p
      )
    );
    setTimeout(() => setActiveView("list"), 1200);
    setIsSubmitting(false);
  }

  // 1. Loading View
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[#12081f] text-[#faf8ff] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[#39d6cf]" />
          <p className="text-xs uppercase tracking-widest text-[#a39ab8]">Đang tải Cổng Đối tác...</p>
        </div>
      </div>
    );
  }

  // 2. Not Logged In View
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#12081f] text-[#faf8ff] flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-[#181224] border border-[#2e2344] rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#39d6cf]"></span>
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#a39ab8]">
              Partner Portal · Tí Coolture
            </span>
          </div>

          <h1 className="text-2xl font-serif font-bold text-white mb-2">
            Đăng nhập Cổng Đối tác
          </h1>
          <p className="text-sm text-[#a39ab8] mb-8 leading-relaxed">
            Dành riêng cho các nghệ nhân & local brand đăng tải hình ảnh và sản phẩm lên catalogue.
          </p>

          {authError && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-200 flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-zinc-100 text-[#12081f] font-semibold rounded-xl transition duration-150 shadow-sm text-sm"
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

          {/* ADMIN TOKEN BYPASS FOR DEV/ADMIN (chỉ xuất hiện trong dev mode) */}
          {import.meta.env.DEV && (
            <div className="mt-6 pt-6 border-t border-[#2e2344]">
              <div className="flex items-center gap-2 mb-3">
                <KeyRound className="w-4 h-4 text-[#39d6cf]" />
                <span className="text-xs font-semibold text-white">Bypass Đăng nhập Admin (Dev Mode)</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={bypassToken}
                  onChange={(e) => setBypassToken(e.target.value)}
                  placeholder="Nhập ADMIN_TOKEN..."
                  className="flex-1 bg-[#23173d] border border-[#3b2a60] rounded-xl px-3 py-2 text-xs text-white placeholder-[#7b7194] focus:outline-none focus:border-[#39d6cf]"
                />
                <button
                  onClick={() => handleBypassLogin()}
                  className="px-4 py-2 bg-[#7520f7] hover:bg-[#5a12c6] text-white text-xs font-medium rounded-xl transition shadow-sm whitespace-nowrap"
                >
                  Vào Admin
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-[#2e2344] text-center">
            <p className="text-[11px] text-[#7b7194] leading-relaxed">
              Truy cập yêu cầu lời mời từ ban quản trị. Hệ thống không lưu trữ mật khẩu, tuân thủ Nghị định 13/2023/NĐ-CP.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. 403 Forbidden View (Only if neither a shop partner NOR an admin)
  if (!shop && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#12081f] text-[#faf8ff] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-[#181224] border border-red-900/40 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800/50 flex items-center justify-center mx-auto mb-4 text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-serif font-bold text-white mb-2">
            Email chưa được cấp quyền
          </h2>
          <p className="text-sm text-[#a39ab8] mb-4 leading-relaxed">
            Tài khoản Google <strong className="text-white">{currentUser.email}</strong> chưa liên kết với bất kỳ shop nào trên Tí Coolture.
          </p>

          <p className="text-xs text-[#7b7194] mb-8 leading-relaxed">
            Nếu bạn là đối tác vừa nhận lời mời, hãy chắc chắn bạn đã chọn đúng địa chỉ Gmail đã cung cấp cho ban quản trị.
          </p>

          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-[#7520f7] hover:bg-[#5a12c6] text-white rounded-xl text-sm font-medium transition shadow-sm"
          >
            Đổi tài khoản Google khác
          </button>
        </div>
      </div>
    );
  }

  // 4. Main Portal (Partner Dashboard or Admin Hub)
  return (
    <div className="min-h-screen bg-[#12081f] text-[#faf8ff] font-sans pb-24">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-[#181224]/90 backdrop-blur-md border-b border-[#2e2344]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#23173d] border border-[#3b2a60] flex items-center justify-center text-[#39d6cf]">
              {isAdmin ? <ShieldCheck className="w-4 h-4 text-[#7520f7]" /> : <Store className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-serif font-bold text-white">
                  {isAdmin ? "Ban Quản Trị Tí Coolture" : shop?.name}
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#23173d] text-[#39d6cf] border border-[#3b2a60]">
                  {isAdmin ? "Super Admin" : role === "owner" ? "Chủ shop" : "Biên tập"}
                </span>
              </div>
              <p className="text-[11px] text-[#a39ab8]">{currentUser.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#a39ab8] hover:text-white hover:bg-[#23173d] transition"
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
        {/* ADMIN MANAGEMENT CONSOLE */}
        {isAdmin ? (
          <div>
            {/* Admin Header & Navigation Tabs */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                  <span>Trung tâm Quản trị Admin</span>
                  <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-[#7520f7]/20 text-[#39d6cf] border border-[#7520f7]/40">
                    Admin Console
                  </span>
                </h2>
                <p className="text-xs text-[#a39ab8] mt-1">
                  Quản lý shop đối tác, duyệt hình ảnh sản phẩm thực tế và phân quyền ban quản trị.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Data Mode Switcher */}
                <div className="flex items-center gap-2 p-1.5 bg-[#181224] rounded-xl border border-[#2e2344]">
                  <div className="flex items-center gap-1.5 px-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#39d6cf]" />
                    <span className="text-[11px] font-medium text-[#a39ab8]">Nguồn dữ liệu:</span>
                  </div>
                  <div className="flex items-center bg-[#12081f] p-1 rounded-lg border border-[#2e2344]">
                    <button
                      type="button"
                      onClick={() => handleToggleDataMode("mock")}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                        dataMode === "mock"
                          ? "bg-amber-500 text-black shadow-sm"
                          : "text-[#a39ab8] hover:text-white"
                      }`}
                    >
                      Demo (13 Shop)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleDataMode("real")}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                        dataMode === "real"
                          ? "bg-[#39d6cf] text-[#12081f] shadow-sm"
                          : "text-[#a39ab8] hover:text-white"
                      }`}
                    >
                      Thật (Supabase)
                    </button>
                  </div>
                </div>

                {/* Sandbox Mode Switcher (Dev Mode Only) */}
                {import.meta.env.DEV && (
                  <div className="flex items-center gap-2 p-1.5 bg-[#181224] rounded-xl border border-[#2e2344]">
                    <div className="flex items-center gap-1.5 px-2">
                      <ShieldAlert className={`w-3.5 h-3.5 ${sandboxMode ? "text-amber-400" : "text-[#a39ab8]"}`} />
                      <span className="text-[11px] font-medium text-[#a39ab8]">Sandbox Local:</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const next = !sandboxMode;
                          setSandboxMode(next);
                          setSandboxEnabled(next);
                          setAdminFeedback({
                            type: "success",
                            text: next
                              ? "ĐÃ BẬT CHẾ ĐỘ SANDBOX! Mọi thao tác duyệt/ẩn/hiện chỉ tác động trên máy localhost này, không chạm Supabase thật."
                              : "ĐÃ TẮT SANDBOX. Các thao tác duyệt sẽ ghi trực tiếp vào Supabase.",
                          });
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                          sandboxMode
                            ? "bg-amber-400 text-black shadow-sm font-bold"
                            : "bg-[#12081f] text-[#a39ab8] border border-[#2e2344] hover:text-white"
                        }`}
                        title="Khi Bật: Mọi thay đổi của Admin chỉ lưu trên trình duyệt của máy bạn"
                      >
                        {sandboxMode ? "BẬT 🛡️" : "TẮT"}
                      </button>
                      {sandboxMode && (
                        <button
                          type="button"
                          onClick={() => {
                            clearSandboxOverrides();
                            loadAdminData();
                            setAdminFeedback({
                              type: "success",
                              text: "Đã xóa toàn bộ dữ liệu ghi đè thử nghiệm của Sandbox!",
                            });
                          }}
                          className="px-2 py-1 rounded-md text-[11px] text-[#a39ab8] hover:text-red-400 hover:bg-[#23173d] transition"
                          title="Xóa dữ liệu test sandbox"
                        >
                          Xóa test
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sub-navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-[#2e2344] pb-4">
              <button
                onClick={() => setAdminTab("requests")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition ${
                  adminTab === "requests"
                    ? "bg-[#7520f7] text-white"
                    : "text-[#a39ab8] hover:text-white hover:bg-[#181224] border border-[#2e2344]"
                }`}
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>Yêu cầu mở Shop</span>
                {partnerRequests.filter((r) => r.status === "pending").length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-[#39d6cf] text-[#12081f] text-[10px] font-bold rounded-full">
                    {partnerRequests.filter((r) => r.status === "pending").length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setAdminTab("reviews")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition ${
                  adminTab === "reviews"
                    ? "bg-[#7520f7] text-white"
                    : "text-[#a39ab8] hover:text-white hover:bg-[#181224] border border-[#2e2344]"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Duyệt sản phẩm mới</span>
                {pendingReviews.filter((r) => r.status === "pending_review").length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-amber-400 text-black text-[10px] font-bold rounded-full animate-pulse">
                    {pendingReviews.filter((r) => r.status === "pending_review").length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setAdminTab("shops")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition ${
                  adminTab === "shops"
                    ? "bg-[#7520f7] text-white"
                    : "text-[#a39ab8] hover:text-white hover:bg-[#181224] border border-[#2e2344]"
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Đối tác Shop</span>
              </button>

              <button
                onClick={() => setAdminTab("staff")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition ${
                  adminTab === "staff"
                    ? "bg-[#7520f7] text-white"
                    : "text-[#a39ab8] hover:text-white hover:bg-[#181224] border border-[#2e2344]"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Quyền Admin</span>
              </button>
            </div>

            {adminFeedback && (
              <div
                className={`mb-6 p-4 rounded-xl text-xs flex items-center gap-2.5 leading-relaxed ${
                  adminFeedback.type === "success"
                    ? "bg-[#23173d] border border-[#39d6cf]/50 text-[#39d6cf]"
                    : "bg-red-950/50 border border-red-800/60 text-red-200"
                }`}
              >
                {adminFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-[#39d6cf] flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
                <span>{adminFeedback.text}</span>
              </div>
            )}

            {/* TAB 0: YÊU CẦU MỞ SHOP TỪ WEB CHÍNH */}
            {adminTab === "requests" && (
              <div className="space-y-6">
                <div className="bg-[#181224] border border-[#2e2344] rounded-2xl p-6 sm:p-7 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Inbox className="w-5 h-5 text-[#39d6cf]" />
                      <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wider">
                        Đơn đăng ký mở Shop từ Website chính
                      </h3>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#23173d] text-[#39d6cf] border border-[#3b2a60]">
                      {partnerRequests.filter((r) => r.status === "pending").length} đơn chờ duyệt
                    </span>
                  </div>
                  <p className="text-xs text-[#a39ab8] leading-relaxed">
                    Xem xét hồ sơ nghệ nhân nộp từ website. Bấm <strong>"Duyệt & Cấp quyền"</strong> để tự động tạo shop và cấp quyền truy cập Portal cho Gmail đăng ký (Ràng buộc: <strong>1 Gmail = 1 Shop</strong>).
                  </p>
                </div>

                {/* Danh sách yêu cầu */}
                <div className="space-y-4">
                  {partnerRequests.length === 0 ? (
                    <div className="bg-[#181224] border border-[#2e2344] rounded-2xl p-12 text-center text-[#7b7194]">
                      <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Chưa có yêu cầu mở shop nào.</p>
                    </div>
                  ) : (
                    partnerRequests.map((req) => (
                      <div
                        key={req.id}
                        className="bg-[#181224] border border-[#2e2344] rounded-2xl p-6 transition hover:border-[#3b2a60] shadow-md"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-[#2e2344]">
                          <div>
                            <div className="flex items-center gap-2.5">
                              <h4 className="text-base font-serif font-bold text-white">
                                {req.shop_name}
                              </h4>
                              {req.category && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#23173d] text-[#39d6cf] border border-[#3b2a60]">
                                  {req.category}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#7b7194] mt-0.5">
                              Gửi ngày: {new Date(req.created_at).toLocaleDateString("vi-VN")} lúc {new Date(req.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>

                          <div>
                            {req.status === "approved" ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Đã duyệt & Cấp quyền
                              </span>
                            ) : req.status === "rejected" ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-950/80 text-red-300 border border-red-800/60">
                                <XCircle className="w-3.5 h-3.5" />
                                Đã từ chối
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#23173d] text-[#39d6cf] border border-[#3b2a60]">
                                <Clock className="w-3.5 h-3.5" />
                                Chờ duyệt mở shop
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Chi tiết đơn đăng ký */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-xs">
                          <div>
                            <span className="text-[#7b7194] block text-[11px]">Gmail đăng ký:</span>
                            <span className="font-mono text-white font-medium break-all">
                              {req.applicant_email}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#7b7194] block text-[11px]">Người đại diện / SĐT:</span>
                            <span className="text-[#faf8ff]">
                              {req.applicant_name || "—"} {req.phone_or_zalo ? `(${req.phone_or_zalo})` : ""}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#7b7194] block text-[11px]">Mạng xã hội:</span>
                            {req.social_link ? (
                              <a
                                href={req.social_link.startsWith("http") ? req.social_link : `https://${req.social_link}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#39d6cf] hover:underline inline-flex items-center gap-1"
                              >
                                <span>{req.social_link}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-[#7b7194]">—</span>
                            )}
                          </div>
                        </div>

                        {req.description && (
                          <div className="bg-[#12081f] p-3.5 rounded-xl border border-[#2e2344] mb-4 text-xs text-[#a39ab8] leading-relaxed">
                            <span className="font-medium text-white block mb-1">Mô tả sản phẩm & shop:</span>
                            {req.description}
                          </div>
                        )}

                        {/* Thao tác duyệt */}
                        {req.status === "pending" && (
                          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2e2344]">
                            <button
                              type="button"
                              onClick={() => handleRejectRequest(req)}
                              disabled={isSubmittingAdmin}
                              className="px-4 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-xl transition"
                            >
                              Từ chối
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveRequest(req)}
                              disabled={isSubmittingAdmin}
                              className="px-4 py-2 bg-[#7520f7] hover:bg-[#5a12c6] text-white text-xs font-semibold rounded-xl uppercase tracking-wider transition shadow-sm flex items-center gap-1.5"
                            >
                              {isSubmittingAdmin ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              Duyệt & Cấp quyền Shop
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: DUYỆT SẢN PHẨM MỚI TỪ SHOP */}
            {adminTab === "reviews" && (
              <div className="space-y-6">
                <div className="bg-[#181224] border border-[#2e2344] rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#39d6cf]" />
                      <span>Danh sách Sản phẩm gửi duyệt</span>
                    </h3>
                    <p className="text-xs text-[#a39ab8] mt-1">
                      Các sản phẩm do đối tác shop tải ảnh và gửi lên, chờ Admin duyệt để hiển thị ra website chính.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 bg-[#12081f] p-1 rounded-xl border border-[#2e2344]">
                    <button
                      type="button"
                      onClick={() => setReviewFilter("pending_review")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        reviewFilter === "pending_review"
                          ? "bg-amber-500 text-black font-semibold shadow-sm"
                          : "text-[#a39ab8] hover:text-white"
                      }`}
                    >
                      Chờ duyệt ({pendingReviews.filter((r) => r.status === "pending_review").length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewFilter("published")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        reviewFilter === "published"
                          ? "bg-emerald-500 text-black font-semibold shadow-sm"
                          : "text-[#a39ab8] hover:text-white"
                      }`}
                    >
                      Đã xuất bản ({pendingReviews.filter((r) => r.status === "published").length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewFilter("all")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        reviewFilter === "all"
                          ? "bg-[#7520f7] text-white font-semibold shadow-sm"
                          : "text-[#a39ab8] hover:text-white"
                      }`}
                    >
                      Tất cả ({pendingReviews.length})
                    </button>
                  </div>
                </div>

                {/* Review Products List */}
                <div className="space-y-4">
                  {pendingReviews
                    .filter((p) => (reviewFilter === "all" ? true : p.status === reviewFilter))
                    .length === 0 ? (
                    <div className="bg-[#181224] border border-[#2e2344] rounded-2xl p-12 text-center">
                      <FileImage className="w-8 h-8 text-[#a39ab8] mx-auto mb-3 opacity-40" />
                      <p className="text-sm text-white font-medium">Không có sản phẩm nào trong mục này</p>
                      <p className="text-xs text-[#a39ab8] mt-1">
                        Khi các shop đối tác nộp bài duyệt, sản phẩm sẽ xuất hiện ở đây ngay lập tức.
                      </p>
                    </div>
                  ) : (
                    pendingReviews
                      .filter((p) => (reviewFilter === "all" ? true : p.status === reviewFilter))
                      .map((prod) => {
                        const coverImg = (prod.product_images || []).find((i: any) => i.is_cover) || prod.product_images?.[0];
                        return (
                          <div
                            key={prod.id}
                            className="bg-[#181224] border border-[#2e2344] rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col md:flex-row gap-6 items-start"
                          >
                            {/* Images Gallery */}
                            <div className="w-full md:w-56 flex-shrink-0">
                              <div className="w-full aspect-square rounded-xl bg-[#12081f] border border-[#2e2344] overflow-hidden relative">
                                {coverImg?.url ? (
                                  <img
                                    src={resolveImageUrl(coverImg.url)}
                                    alt={prod.name_vi}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs text-[#a39ab8]">
                                    Chưa có ảnh
                                  </div>
                                )}
                                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-mono bg-black/70 text-white backdrop-blur-sm">
                                  {prod.product_images?.length || 0} ảnh
                                </span>
                              </div>

                              {/* Thumbnail preview strip */}
                              {prod.product_images && prod.product_images.length > 1 && (
                                <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                                  {prod.product_images.slice(0, 5).map((img: any, idx: number) => (
                                    <div
                                      key={img.id || idx}
                                      className="w-10 h-10 rounded-md bg-[#12081f] border border-[#2e2344] overflow-hidden flex-shrink-0"
                                    >
                                      <img
                                        src={resolveImageUrl(img.url)}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 space-y-2.5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-base font-serif font-bold text-white">
                                    {prod.name_vi}
                                  </h4>
                                  {prod.name_en && (
                                    <span className="text-xs text-[#a39ab8] italic">({prod.name_en})</span>
                                  )}
                                </div>

                                {/* Status badge */}
                                {prod.status === "pending_review" && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    Đang chờ duyệt
                                  </span>
                                )}
                                {prod.status === "published" && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                    Đang hiển thị trên web
                                  </span>
                                )}
                                {prod.status === "rejected" && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                    Bị từ chối
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#a39ab8]">
                                <span>🏪 Shop: <strong className="text-white">{prod.shops?.name || "Chưa rõ"}</strong></span>
                                <span>📧 {prod.shops?.contact_email}</span>
                                <span>📂 Danh mục: <strong className="text-white">{prod.categories?.name_vi || "Chung"}</strong></span>
                              </div>

                              <div className="flex items-baseline gap-3 text-sm">
                                <span className="font-mono font-bold text-[#39d6cf]">
                                  {prod.price_vnd
                                    ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(prod.price_vnd)
                                    : "Liên hệ shop"}
                                </span>
                                {prod.dimensions && (
                                  <span className="text-xs text-[#a39ab8]">Kích thước: {prod.dimensions}</span>
                                )}
                              </div>

                              {prod.short_desc_vi && (
                                <p className="text-xs text-white/80 leading-relaxed bg-[#12081f]/60 p-2.5 rounded-xl border border-[#2e2344]">
                                  {prod.short_desc_vi}
                                </p>
                              )}

                              {prod.story_vi && (
                                <p className="text-xs text-[#a39ab8] italic line-clamp-2">
                                  " {prod.story_vi} "
                                </p>
                              )}

                              {/* Review Actions */}
                              <div className="pt-3 border-t border-[#2e2344] flex flex-wrap items-center justify-end gap-3">
                                {/* Toggle Individual Product Hide/Show Button */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleProductStatus(prod.id, prod.status, prod.name_vi)}
                                  disabled={isSubmittingAdmin}
                                  className={`px-3.5 py-2 text-xs font-medium rounded-xl transition flex items-center gap-1.5 ${
                                    prod.status === "hidden"
                                      ? "bg-[#39d6cf]/20 text-[#39d6cf] border border-[#39d6cf]/40 hover:bg-[#39d6cf]/30"
                                      : "bg-amber-950/40 text-amber-300 border border-amber-800/60 hover:bg-amber-900/40"
                                  }`}
                                >
                                  {prod.status === "hidden" ? (
                                    <>
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Hiện sản phẩm</span>
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff className="w-3.5 h-3.5" />
                                      <span>Ẩn sản phẩm</span>
                                    </>
                                  )}
                                </button>

                                {prod.status !== "published" && (
                                  <button
                                    type="button"
                                    onClick={() => handleReviewAction(prod.id, "approve", prod.name_vi)}
                                    disabled={isSubmittingAdmin}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl uppercase tracking-wider transition shadow flex items-center gap-1.5"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Phê duyệt xuất bản</span>
                                  </button>
                                )}

                                {prod.status !== "rejected" && (
                                  <button
                                    type="button"
                                    onClick={() => handleReviewAction(prod.id, "reject", prod.name_vi)}
                                    disabled={isSubmittingAdmin}
                                    className="px-4 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/60 rounded-xl transition"
                                  >
                                    Từ chối bài duyệt
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            )}
            {adminTab === "shops" && (
              <div className="space-y-8">
                {/* 1. QUẢN LÝ ẨN / HIỆN SHOP & TOÀN BỘ SẢN PHẨM */}
                <div className="bg-[#181224] border border-[#2e2344] rounded-2xl p-6 sm:p-7 shadow-lg space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2e2344] pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Store className="w-5 h-5 text-[#39d6cf]" />
                        <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wider">
                          Quản lý Ẩn / Hiện Shop & Sản phẩm
                        </h3>
                      </div>
                      <p className="text-xs text-[#a39ab8] mt-1">
                        Khi <strong>Ẩn Shop</strong>, toàn bộ sản phẩm của shop đó sẽ tự động bị ẩn khỏi website chính. Admin cũng có thể ẩn/hiện riêng lẻ từng sản phẩm.
                      </p>
                    </div>
                    <span className="text-xs font-mono px-3 py-1 bg-[#23173d] text-[#39d6cf] border border-[#3b2a60] rounded-full self-start sm:self-auto">
                      {adminShops.length} shop trong hệ thống
                    </span>
                  </div>

                  {/* List of Shops */}
                  <div className="space-y-4">
                    {adminShops.length === 0 ? (
                      <div className="text-center py-8 text-xs text-[#a39ab8]">
                        Đang tải danh sách shop hoặc chưa có shop nào...
                      </div>
                    ) : (
                      adminShops.map((s) => {
                        const isExpanded = expandedShopId === s.id;
                        const shopProds = s.products || [];
                        const isShopPublished = s.status === "published";

                        return (
                          <div
                            key={s.id}
                            className="bg-[#12081f] border border-[#2e2344] rounded-xl overflow-hidden transition"
                          >
                            {/* Shop Summary Row */}
                            <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-[#23173d] border border-[#3b2a60] overflow-hidden flex items-center justify-center flex-shrink-0">
                                  {s.logo_url ? (
                                    <img src={resolveImageUrl(s.logo_url)} alt={s.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <Store className="w-5 h-5 text-[#39d6cf]" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-serif font-bold text-white">
                                      {s.name}
                                    </h4>
                                    <span className="text-[11px] font-mono text-[#a39ab8]">
                                      (/stores/{s.slug})
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-[#a39ab8] mt-0.5">
                                    <span>{s.contact_email || "Chưa có email"}</span>
                                    <span>•</span>
                                    <span>{shopProds.length} sản phẩm</span>
                                    {s.address && (
                                      <>
                                        <span>•</span>
                                        <span>{s.address}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Controls */}
                              <div className="flex flex-wrap items-center gap-2.5">
                                {/* Status badge */}
                                {s.status === "published" ? (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                    Đang hiển thị
                                  </span>
                                ) : s.status === "hidden" ? (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                    Đang ẩn (toàn bộ sản phẩm ẩn)
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    Bản nháp ({s.status})
                                  </span>
                                )}

                                {/* Toggle Shop Status */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleShopStatus(s.id, s.status, s.name)}
                                  disabled={isSubmittingAdmin}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                                    isShopPublished
                                      ? "bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-800/60"
                                      : "bg-emerald-600 hover:bg-emerald-500 text-white"
                                  }`}
                                >
                                  {isShopPublished ? (
                                    <>
                                      <EyeOff className="w-3.5 h-3.5" />
                                      <span>Ẩn Shop</span>
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Hiện Shop</span>
                                    </>
                                  )}
                                </button>

                                {/* Toggle Expand Products */}
                                <button
                                  type="button"
                                  onClick={() => setExpandedShopId(isExpanded ? null : s.id)}
                                  className="px-3 py-1.5 bg-[#23173d] hover:bg-[#322056] text-white border border-[#3b2a60] rounded-lg text-xs font-medium transition flex items-center gap-1.5"
                                >
                                  <span>{shopProds.length} sản phẩm</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>

                            {/* Expanded Products List */}
                            {isExpanded && (
                              <div className="border-t border-[#2e2344] bg-[#181224]/70 p-4 sm:p-5 space-y-3">
                                <div className="flex items-center justify-between text-xs text-[#a39ab8] pb-1">
                                  <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
                                    Sản phẩm của {s.name}
                                  </span>
                                  <span>Bấm nút bên phải để Ẩn / Hiện từng sản phẩm riêng biệt</span>
                                </div>

                                {shopProds.length === 0 ? (
                                  <p className="text-xs text-[#7b7194] italic py-2">
                                    Shop này chưa có sản phẩm nào.
                                  </p>
                                ) : (
                                  <div className="divide-y divide-[#2e2344] border border-[#2e2344] rounded-xl overflow-hidden bg-[#12081f]">
                                    {shopProds.map((prod: any) => {
                                      const pCover = (prod.product_images || []).find((i: any) => i.is_cover) || prod.product_images?.[0];
                                      const isProdPublished = prod.status === "published";

                                      return (
                                        <div
                                          key={prod.id}
                                          className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#23173d]/30 transition"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-[#23173d] overflow-hidden border border-[#2e2344] flex-shrink-0">
                                              {pCover?.url ? (
                                                <img
                                                  src={resolveImageUrl(pCover.url)}
                                                  alt=""
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : (
                                                <FileImage className="w-4 h-4 text-[#7b7194] m-auto" />
                                              )}
                                            </div>
                                            <div>
                                              <div className="text-xs font-semibold text-white">
                                                {prod.name_vi}
                                              </div>
                                              <div className="text-[11px] font-mono text-[#39d6cf]">
                                                {prod.price_vnd ? `${prod.price_vnd.toLocaleString("vi-VN")} ₫` : "Giá liên hệ"}
                                              </div>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-3 self-end sm:self-auto">
                                            {/* Product status badge */}
                                            {prod.status === "published" ? (
                                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                                Hiển thị
                                              </span>
                                            ) : prod.status === "hidden" ? (
                                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                                Đang ẩn
                                              </span>
                                            ) : (
                                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                                {prod.status}
                                              </span>
                                            )}

                                            {/* Toggle Product Status */}
                                            <button
                                              type="button"
                                              onClick={() => handleToggleProductStatus(prod.id, prod.status, prod.name_vi)}
                                              disabled={isSubmittingAdmin}
                                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                                                isProdPublished
                                                  ? "bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-800/60"
                                                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
                                              }`}
                                            >
                                              {isProdPublished ? (
                                                <>
                                                  <EyeOff className="w-3 h-3" />
                                                  <span>Ẩn</span>
                                                </>
                                              ) : (
                                                <>
                                                  <Eye className="w-3 h-3" />
                                                  <span>Hiện</span>
                                                </>
                                              )}
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 2. CẤP QUYỀN MỞ SHOP CHO GMAIL MỚI */}
                <div className="bg-[#181224] border border-[#2e2344] rounded-2xl p-6 sm:p-7 shadow-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <UserCheck className="w-4 h-4 text-[#39d6cf]" />
                    <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wider">
                      Cấp quyền mở Shop cho Gmail mới (1 Gmail = 1 Shop)
                    </h3>
                  </div>

                  <form onSubmit={handleGrantShop} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#a39ab8] mb-1.5">
                        Email Google của đối tác *
                      </label>
                      <input
                        type="email"
                        value={newShopEmail}
                        onChange={(e) => setNewShopEmail(e.target.value)}
                        placeholder="doitac@gmail.com"
                        className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#a39ab8] mb-1.5">
                        Tên Shop / Thương hiệu *
                      </label>
                      <input
                        type="text"
                        value={newShopName}
                        onChange={(e) => setNewShopName(e.target.value)}
                        placeholder="Ví dụ: Gốm Mộc Chân"
                        className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition"
                        required
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={isSubmittingAdmin}
                        className="w-full py-2.5 px-4 bg-[#7520f7] hover:bg-[#5a12c6] text-white font-medium rounded-xl text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2"
                      >
                        {isSubmittingAdmin ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Cấp quyền Shop
                      </button>
                    </div>
                  </form>
                </div>

                {/* Danh sách shop đã cấp quyền */}
                <div className="bg-[#181224] border border-[#2e2344] rounded-2xl overflow-hidden shadow-lg">
                  <div className="px-6 py-4 border-b border-[#2e2344] flex items-center justify-between">
                    <h3 className="text-xs font-serif font-bold text-white uppercase tracking-wider">
                      Danh sách đối tác shop đã cấp quyền
                    </h3>
                    <span className="text-xs font-mono text-[#39d6cf]">
                      {invitations.length} shop
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#12081f] text-[#a39ab8] uppercase tracking-wider text-[11px] border-b border-[#2e2344]">
                        <tr>
                          <th className="py-3 px-6">Email Google đối tác</th>
                          <th className="py-3 px-6">Tên Shop</th>
                          <th className="py-3 px-6">Trạng thái</th>
                          <th className="py-3 px-6 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2e2344] text-[#faf8ff]">
                        {invitations.map((inv) => (
                          <tr key={inv.id} className="hover:bg-[#23173d]/40 transition">
                            <td className="py-4 px-6 font-mono text-white">
                              {inv.invited_email}
                            </td>
                            <td className="py-4 px-6 font-medium text-[#39d6cf]">
                              {inv.shops?.name || "Chưa gắn tên"}
                            </td>
                            <td className="py-4 px-6">
                              {inv.status === "accepted" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Đã đăng nhập
                                </span>
                              ) : inv.status === "pending" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#23173d] text-[#39d6cf] border border-[#3b2a60]">
                                  <Clock className="w-3 h-3" />
                                  Đang chờ đăng nhập
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-red-950/80 text-red-300 border border-red-800/60">
                                  Đã thu hồi
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right">
                              {inv.status !== "revoked" && (
                                <button
                                  onClick={() => handleRevokeShop(inv.id, inv.invited_email)}
                                  className="text-xs text-red-400 hover:text-red-300 transition"
                                >
                                  Thu hồi quyền
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: QUẢN LÝ QUYỀN ADMIN / STAFF */}
            {adminTab === "staff" && (
              <div className="space-y-8">
                {/* Form cấp quyền admin */}
                <div className="bg-[#181224] border border-[#2e2344] rounded-2xl p-6 sm:p-7 shadow-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-4 h-4 text-[#7520f7]" />
                    <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wider">
                      Cấp quyền Admin / Staff cho tài khoản Google khác
                    </h3>
                  </div>

                  <form onSubmit={handleAddStaff} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#a39ab8] mb-1.5">
                        Email Google nhân sự *
                      </label>
                      <input
                        type="email"
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        placeholder="admin2@gmail.com"
                        className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#a39ab8] mb-1.5">
                        Vai trò phân quyền *
                      </label>
                      <select
                        value={newStaffRole}
                        onChange={(e: any) => setNewStaffRole(e.target.value)}
                        className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition"
                      >
                        <option value="admin">Quản trị viên tối cao (Admin)</option>
                        <option value="moderator">Kiểm duyệt viên (Moderator)</option>
                        <option value="viewer">Chỉ xem (Viewer)</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={isSubmittingAdmin}
                        className="w-full py-2.5 px-4 bg-[#7520f7] hover:bg-[#5a12c6] text-white font-medium rounded-xl text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2"
                      >
                        {isSubmittingAdmin ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                        Cấp quyền Staff
                      </button>
                    </div>
                  </form>
                </div>

                {/* Danh sách Admin / Staff */}
                <div className="bg-[#181224] border border-[#2e2344] rounded-2xl overflow-hidden shadow-lg">
                  <div className="px-6 py-4 border-b border-[#2e2344] flex items-center justify-between">
                    <h3 className="text-xs font-serif font-bold text-white uppercase tracking-wider">
                      Danh sách nhân sự quản trị hệ thống
                    </h3>
                    <span className="text-xs font-mono text-[#7520f7]">
                      {staffList.length} người
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#12081f] text-[#a39ab8] uppercase tracking-wider text-[11px] border-b border-[#2e2344]">
                        <tr>
                          <th className="py-3 px-6">Email Google</th>
                          <th className="py-3 px-6">Họ tên / Nhãn</th>
                          <th className="py-3 px-6">Vai trò</th>
                          <th className="py-3 px-6 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2e2344] text-[#faf8ff]">
                        {staffList.map((st) => (
                          <tr key={st.user_id} className="hover:bg-[#23173d]/40 transition">
                            <td className="py-4 px-6 font-mono text-white">
                              {st.email}
                            </td>
                            <td className="py-4 px-6">
                              {st.full_name}
                            </td>
                            <td className="py-4 px-6">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#23173d] text-[#39d6cf] border border-[#3b2a60]">
                                {st.role === "admin" ? "Admin tối cao" : st.role === "moderator" ? "Moderator" : "Viewer"}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              {st.email.toLowerCase() !== currentUser?.email?.toLowerCase() ? (
                                <button
                                  onClick={() => handleRevokeStaff(st.email)}
                                  className="text-xs text-red-400 hover:text-red-300 transition"
                                >
                                  Tước quyền Admin
                                </button>
                              ) : (
                                <span className="text-[11px] text-[#7b7194] italic">
                                  (Tài khoản của bạn)
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* REGULAR PARTNER SHOP DASHBOARD */
          <div className="space-y-6">
            {/* Tab Navigation for Shop Partner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2e2344] pb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPartnerTab("storefront");
                    setActiveView("list");
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                    partnerTab === "storefront"
                      ? "bg-[#7520f7] text-white shadow-sm"
                      : "text-[#a39ab8] hover:text-white hover:bg-[#181224] border border-[#2e2344]"
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>Trang chủ shop</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPartnerTab("products")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                    partnerTab === "products"
                      ? "bg-[#7520f7] text-white shadow-sm"
                      : "text-[#a39ab8] hover:text-white hover:bg-[#181224] border border-[#2e2344]"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Quản lý sản phẩm</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#12081f] text-[#39d6cf] border border-[#3b2a60]">
                    {products.length}
                  </span>
                </button>
              </div>

              {partnerTab === "storefront" && (
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPreviewModal("store")}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[#181224] hover:bg-[#23173d] text-[#39d6cf] border border-[#39d6cf]/30 hover:border-[#39d6cf] rounded-xl text-xs font-medium transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem trước trang shop (Preview)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveShopProfile}
                    disabled={isSavingShop}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#7520f7] hover:bg-[#5a12c6] text-white rounded-xl text-xs font-medium transition shadow-sm disabled:opacity-50"
                  >
                    {isSavingShop ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Lưu thông tin shop</span>
                  </button>
                </div>
              )}
            </div>

            {/* Feedback message for shop info */}
            {shopFeedback && (
              <div
                className={`p-4 rounded-xl text-xs flex items-center gap-2.5 leading-relaxed ${
                  shopFeedback.type === "success"
                    ? "bg-[#23173d] border border-[#39d6cf]/50 text-[#39d6cf]"
                    : "bg-red-950/50 border border-red-800/60 text-red-200"
                }`}
              >
                {shopFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-[#39d6cf] flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
                <span>{shopFeedback.text}</span>
              </div>
            )}

            {/* TAB 1: TRANG CHỦ SHOP (STOREFRONT) */}
            {partnerTab === "storefront" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-serif font-bold text-white">
                    Chỉnh sửa trang chủ shop (Storefront)
                  </h2>
                  <p className="text-xs text-[#a39ab8] mt-1">
                    Mọi thông tin hiển thị trên trang <span className="font-mono text-[#39d6cf]">/stores/{shop?.slug || "..."}</span> có thể được cập nhật tại đây và xem trước ngay lập tức.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Cover & Logo Imagery */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Cover Image Upload Card */}
                    <div className="bg-[#181224] border border-[#2e2344] rounded-2xl p-5 shadow-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-[#39d6cf]" />
                          Ảnh bìa shop (Cover)
                        </label>
                        <span className="text-[10px] font-mono text-[#a39ab8]">Tỷ lệ 2.74 : 1</span>
                      </div>

                      <div className="aspect-[2.74/1] bg-[#12081f] rounded-xl overflow-hidden border border-[#2e2344] relative flex items-center justify-center group">
                        {shopCoverUrl ? (
                          <img
                            src={resolveImageUrl(shopCoverUrl)}
                            alt="Cover shop"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-3 text-xs text-[#7b7194]">
                            <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                            <span>Chưa có ảnh bìa</span>
                          </div>
                        )}

                        {isUploadingCover && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <RefreshCw className="w-5 h-5 text-[#39d6cf] animate-spin" />
                          </div>
                        )}
                      </div>

                      <p className="text-[11px] text-[#7b7194] leading-relaxed">
                        Khuyên dùng ảnh ngang chất lượng cao, kích thước 1400×510px.
                      </p>

                      <div>
                        <label className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-[#23173d] hover:bg-[#322056] text-[#39d6cf] text-xs font-medium rounded-xl cursor-pointer border border-[#3b2a60] transition">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploadingCover ? "Đang tải ảnh..." : "Đổi ảnh bìa mới"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUploadCover}
                            disabled={isUploadingCover}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Logo / Avatar Upload Card */}
                    <div className="bg-[#181224] border border-[#2e2344] rounded-2xl p-5 shadow-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-[#39d6cf]" />
                          Logo / Ảnh đại diện
                        </label>
                        <span className="text-[10px] font-mono text-[#a39ab8]">Vuông / Tròn</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-[#12081f] border border-[#2e2344] overflow-hidden flex items-center justify-center flex-shrink-0 relative group">
                          {shopLogoUrl ? (
                            <img
                              src={resolveImageUrl(shopLogoUrl)}
                              alt="Logo shop"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Store className="w-8 h-8 text-[#7b7194]" />
                          )}

                          {isUploadingLogo && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <RefreshCw className="w-4 h-4 text-[#39d6cf] animate-spin" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-2">
                          <p className="text-[11px] text-[#7b7194] leading-relaxed">
                            Logo thương hiệu hoặc ảnh chân dung nghệ nhân (400×400px).
                          </p>
                          <label className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-[#23173d] hover:bg-[#322056] text-[#39d6cf] text-xs font-medium rounded-xl cursor-pointer border border-[#3b2a60] transition">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{isUploadingLogo ? "Đang tải..." : "Đổi logo"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleUploadLogo}
                              disabled={isUploadingLogo}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Text & Social Channels */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="bg-[#181224] border border-[#2e2344] rounded-2xl p-6 shadow-lg space-y-4">
                      <h3 className="text-xs font-semibold text-white uppercase tracking-wider border-b border-[#2e2344] pb-3">
                        Thông tin hiển thị shop
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-[#a39ab8] mb-1.5">
                            Tên shop *
                          </label>
                          <input
                            type="text"
                            value={shopName}
                            onChange={(e) => setShopName(e.target.value)}
                            placeholder="Gà Con Studios"
                            className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#a39ab8] mb-1.5">
                            Khẩu hiệu / Tagline ngắn
                          </label>
                          <input
                            type="text"
                            value={shopTaglineVi}
                            onChange={(e) => setShopTaglineVi(e.target.value)}
                            placeholder="Túi da bò khâu tay dùng mỗi ngày"
                            className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-[#a39ab8] mb-1.5">
                            Địa chỉ / Khu vực cơ sở (Quận / Huyện)
                          </label>
                          <input
                            type="text"
                            value={shopAddress}
                            onChange={(e) => setShopAddress(e.target.value)}
                            placeholder="Quận 3, TP. Hồ Chí Minh"
                            className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#a39ab8] mb-1.5">
                            Email liên hệ (nội bộ hoặc công khai)
                          </label>
                          <input
                            type="email"
                            value={shopContactEmail}
                            onChange={(e) => setShopContactEmail(e.target.value)}
                            placeholder="contact@gaconstudios.vn"
                            className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#a39ab8] mb-1.5">
                          Câu chuyện sáng tạo / Lời giới thiệu của shop
                        </label>
                        <textarea
                          rows={4}
                          value={shopStoryVi}
                          onChange={(e) => setShopStoryVi(e.target.value)}
                          placeholder="Gà Con Studios làm túi để đeo mỗi ngày chứ không phải để cất trong tủ. Da lộn nâu, da đỏ gạch, da mận chín — chất nào cũng được chọn vì nó đẹp lên theo thời gian..."
                          className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition leading-relaxed"
                        />
                        <p className="text-[11px] text-[#7b7194] mt-1">
                          Hiển thị nổi bật ngay bên dưới ảnh bìa và nút mạng xã hội.
                        </p>
                      </div>
                    </div>

                    {/* Social Media Links */}
                    <div className="bg-[#181224] border border-[#2e2344] rounded-2xl p-6 shadow-lg space-y-4">
                      <div>
                        <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                          Kênh liên hệ & Mạng xã hội của shop
                        </h3>
                        <p className="text-[11px] text-[#7b7194] mt-0.5">
                          Kênh nào để trống sẽ tự động ẩn nút trên trang chủ của shop.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-[#a39ab8] mb-1.5 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                            Instagram (URL hoặc @handle)
                          </label>
                          <input
                            type="text"
                            value={shopSocials.instagram || ""}
                            onChange={(e) =>
                              setShopSocials((prev) => ({ ...prev, instagram: e.target.value }))
                            }
                            placeholder="instagram.com/gaconstudios"
                            className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#a39ab8] mb-1.5 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                            TikTok (URL hoặc @handle)
                          </label>
                          <input
                            type="text"
                            value={shopSocials.tiktok || ""}
                            onChange={(e) =>
                              setShopSocials((prev) => ({ ...prev, tiktok: e.target.value }))
                            }
                            placeholder="tiktok.com/@gaconstudios"
                            className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#a39ab8] mb-1.5 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            Facebook (URL trang)
                          </label>
                          <input
                            type="text"
                            value={shopSocials.facebook || ""}
                            onChange={(e) =>
                              setShopSocials((prev) => ({ ...prev, facebook: e.target.value }))
                            }
                            placeholder="facebook.com/gaconstudios"
                            className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#a39ab8] mb-1.5 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                            Threads (URL hoặc @handle)
                          </label>
                          <input
                            type="text"
                            value={shopSocials.threads || ""}
                            onChange={(e) =>
                              setShopSocials((prev) => ({ ...prev, threads: e.target.value }))
                            }
                            placeholder="threads.net/@gaconstudios"
                            className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#a39ab8] mb-1.5 flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-emerald-400" />
                            Website riêng (nếu có)
                          </label>
                          <input
                            type="text"
                            value={shopSocials.website || ""}
                            onChange={(e) =>
                              setShopSocials((prev) => ({ ...prev, website: e.target.value }))
                            }
                            placeholder="https://gaconstudios.vn"
                            className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#a39ab8] mb-1.5 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                            Zalo (SĐT hoặc link chat)
                          </label>
                          <input
                            type="text"
                            value={shopSocials.zalo || ""}
                            onChange={(e) =>
                              setShopSocials((prev) => ({ ...prev, zalo: e.target.value }))
                            }
                            placeholder="0901234567"
                            className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition"
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-[#2e2344] flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setPreviewModal("store")}
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#181224] hover:bg-[#23173d] text-[#39d6cf] border border-[#39d6cf]/30 hover:border-[#39d6cf] rounded-xl text-xs font-medium transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem trước giao diện</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveShopProfile}
                          disabled={isSavingShop}
                          className="flex items-center gap-1.5 px-5 py-2.5 bg-[#7520f7] hover:bg-[#5a12c6] text-white rounded-xl text-xs font-medium transition shadow-sm disabled:opacity-50"
                        >
                          {isSavingShop ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          <span>Lưu thông tin shop</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: QUẢN LÝ SẢN PHẨM (PRODUCTS) */}
            {partnerTab === "products" && (
              <div>
                {/* 2.1 LIST VIEW: EACH PRODUCT IS 1 ROW */}
                {activeView === "list" && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-serif font-bold text-white">
                          Danh mục sản phẩm ({products.length})
                        </h2>
                        <p className="text-xs text-[#a39ab8] mt-1">
                          Mỗi sản phẩm hiển thị một dòng. Bấm vào dòng sản phẩm để chỉnh sửa chi tiết.
                        </p>
                      </div>

                      <button
                        onClick={openCreateForm}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#7520f7] hover:bg-[#5a12c6] text-white font-medium rounded-xl text-xs uppercase tracking-wider transition shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Thêm sản phẩm mới
                      </button>
                    </div>

                    {products.length === 0 ? (
                      <div className="bg-[#181224] border border-[#2e2344] rounded-2xl p-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-[#23173d] flex items-center justify-center mx-auto mb-4 text-[#a39ab8]">
                          <FileImage className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-serif font-semibold text-white mb-1">
                          Chưa có sản phẩm nào
                        </h3>
                        <p className="text-xs text-[#7b7194] max-w-sm mx-auto mb-6">
                          Bấm nút bên dưới để bắt đầu đăng sản phẩm đầu tiên cho shop của bạn.
                        </p>
                        <button
                          onClick={openCreateForm}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#7520f7] hover:bg-[#5a12c6] text-white font-medium rounded-xl text-xs transition"
                        >
                          <Plus className="w-4 h-4" />
                          Tạo sản phẩm đầu tiên
                        </button>
                      </div>
                    ) : (
                      <div className="bg-[#181224] border border-[#2e2344] rounded-2xl overflow-hidden shadow-lg">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[#12081f] text-[#a39ab8] uppercase tracking-wider text-[11px] border-b border-[#2e2344]">
                              <tr>
                                <th className="py-3 px-5">Sản phẩm</th>
                                <th className="py-3 px-4">Danh mục</th>
                                <th className="py-3 px-4">Giá niêm yết</th>
                                <th className="py-3 px-4">Hình ảnh</th>
                                <th className="py-3 px-4">Trạng thái</th>
                                <th className="py-3 px-5 text-right">Thao tác</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2e2344]">
                              {products.map((prod) => {
                                const cover =
                                  prod.product_images?.find((i) => i.is_cover) ||
                                  prod.product_images?.[0];
                                const imgUrl = cover?.url ? resolveImageUrl(cover.url) : null;

                                return (
                                  <tr
                                    key={prod.id}
                                    onClick={() => openEditForm(prod)}
                                    className="hover:bg-[#23173d]/60 cursor-pointer transition group"
                                  >
                                    <td className="py-3.5 px-5">
                                      <div className="flex items-center gap-3.5">
                                        <div className="w-12 h-12 rounded-xl bg-[#23173d] overflow-hidden flex-shrink-0 border border-[#3b2a60] flex items-center justify-center">
                                          {imgUrl ? (
                                            <img
                                              src={imgUrl}
                                              alt={prod.name_vi}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <FileImage className="w-5 h-5 text-[#7b7194]" />
                                          )}
                                        </div>
                                        <div>
                                          <div className="font-serif font-bold text-white text-sm group-hover:text-[#39d6cf] transition">
                                            {prod.name_vi}
                                          </div>
                                          {prod.name_en && (
                                            <div className="text-[11px] text-[#7b7194]">
                                              {prod.name_en}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </td>

                                    <td className="py-3.5 px-4">
                                      <span className="px-2 py-0.5 rounded-md text-[11px] bg-[#12081f] text-[#a39ab8] border border-[#2e2344]">
                                        {getCategoryName(prod.category_id || "")}
                                      </span>
                                    </td>

                                    <td className="py-3.5 px-4 font-mono font-medium text-white">
                                      {prod.price_vnd ? (
                                        <span className="text-[#39d6cf]">
                                          {prod.price_vnd.toLocaleString("vi-VN")} ₫
                                        </span>
                                      ) : (
                                        <span className="text-[#7b7194]">Giá liên hệ</span>
                                      )}
                                    </td>

                                    <td className="py-3.5 px-4 text-[#a39ab8]">
                                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#23173d] text-[#a39ab8]">
                                        {prod.product_images?.length || 0} ảnh
                                      </span>
                                    </td>

                                    <td className="py-3.5 px-4">
                                      {prod.status === "draft" && (
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#12081f] text-[#a39ab8] border border-[#3b2a60]">
                                          Bản nháp
                                        </span>
                                      )}
                                      {prod.status === "pending_review" && (
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#23173d] text-[#39d6cf] border border-[#39d6cf]/40 flex items-center gap-1 w-max">
                                          <Clock className="w-3 h-3" />
                                          Đang chờ duyệt
                                        </span>
                                      )}
                                      {prod.status === "published" && (
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 flex items-center gap-1 w-max">
                                          <CheckCircle2 className="w-3 h-3" />
                                          Đã xuất bản
                                        </span>
                                      )}
                                      {prod.status === "rejected" && (
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-red-950/80 text-red-300 border border-red-800/60 w-max">
                                          Yêu cầu sửa
                                        </span>
                                      )}
                                    </td>

                                    <td className="py-3.5 px-5 text-right">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditForm(prod);
                                        }}
                                        className="text-xs text-[#39d6cf] group-hover:text-white font-medium transition"
                                      >
                                        Chỉnh sửa →
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2.2 EDIT VIEW: FULL DETAIL EDITING + PREVIEW BUTTON */}
                {activeView === "edit" && (
                  <div className="space-y-6">
                    {/* Navigation and Actions Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2e2344] pb-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveView("list")}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-[#a39ab8] hover:text-white hover:bg-[#23173d] border border-[#2e2344] transition"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Quay lại danh sách</span>
                        </button>
                        <h2 className="text-lg font-serif font-bold text-white">
                          {editingProductId ? `Chỉnh sửa: ${nameVi || "Sản phẩm"}` : "Thêm sản phẩm mới"}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setPreviewModal("product")}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#181224] hover:bg-[#23173d] text-[#39d6cf] border border-[#39d6cf]/40 hover:border-[#39d6cf] rounded-xl text-xs font-medium transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem trước sản phẩm (Preview)</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveDraft}
                          disabled={isSaving}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#23173d] hover:bg-[#322056] text-white rounded-xl text-xs font-medium border border-[#3b2a60] transition disabled:opacity-50"
                        >
                          {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          <span>Lưu bản nháp</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSubmitReview}
                          disabled={isSubmitting}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#7520f7] hover:bg-[#5a12c6] text-white rounded-xl text-xs font-medium transition shadow-sm disabled:opacity-50"
                        >
                          {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          <span>Gửi duyệt</span>
                        </button>
                      </div>
                    </div>

                    {formFeedback && (
                      <div
                        className={`p-4 rounded-xl text-xs flex items-center gap-2.5 leading-relaxed ${
                          formFeedback.type === "success"
                            ? "bg-[#23173d] border border-[#39d6cf]/50 text-[#39d6cf]"
                            : "bg-red-950/50 border border-red-800/60 text-red-200"
                        }`}
                      >
                        {formFeedback.type === "success" ? (
                          <CheckCircle2 className="w-4 h-4 text-[#39d6cf] flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        )}
                        <span>{formFeedback.text}</span>
                      </div>
                    )}

                    {/* Edit Form */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: General Info */}
                      <div className="lg:col-span-2 space-y-6">
                        <div className="bg-[#181224] border border-[#2e2344] rounded-2xl p-6 shadow-lg space-y-4">
                          <h3 className="text-xs font-semibold text-white uppercase tracking-wider border-b border-[#2e2344] pb-3">
                            Thông tin sản phẩm
                          </h3>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-[#a39ab8] mb-1.5">
                                Tên sản phẩm (Tiếng Việt) *
                              </label>
                              <input
                                type="text"
                                value={nameVi}
                                onChange={(e) => setNameVi(e.target.value)}
                                placeholder="Túi đeo vai da lộn nâu khoá cài"
                                className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-[#a39ab8] mb-1.5">
                                Tên tiếng Anh (tuỳ chọn)
                              </label>
                              <input
                                type="text"
                                value={nameEn}
                                onChange={(e) => setNameEn(e.target.value)}
                                placeholder="Brown Suede Buckle Shoulder Bag"
                                className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-[#a39ab8] mb-1.5">
                                Danh mục sản phẩm *
                              </label>
                              <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition"
                              >
                                {CATEGORIES.map((grp) => (
                                  <optgroup key={grp.group} label={grp.group}>
                                    {grp.items.map((item) => (
                                      <option key={item.id} value={item.id}>
                                        {item.name}
                                      </option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-[#a39ab8] mb-1.5">
                                Giá bán (VNĐ)
                              </label>
                              <input
                                type="number"
                                value={priceVnd}
                                onChange={(e) =>
                                  setPriceVnd(e.target.value ? Number(e.target.value) : "")
                                }
                                placeholder="890000 (để trống nếu 'Giá liên hệ')"
                                className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition font-mono"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-[#a39ab8] mb-1.5">
                                Chất liệu (hiển thị trên trang sản phẩm)
                              </label>
                              <input
                                type="text"
                                value={material}
                                onChange={(e) => setMaterial(e.target.value)}
                                placeholder="Da thật, Gốm nung củi, Vải canvas..."
                                className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-[#a39ab8] mb-1.5">
                                Kích thước (hiển thị trên trang sản phẩm)
                              </label>
                              <input
                                type="text"
                                value={dimensions}
                                onChange={(e) => setDimensions(e.target.value)}
                                placeholder="25 x 18 x 7 cm (hoặc — nếu không áp dụng)"
                                className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-[#a39ab8] mb-1.5">
                              Mô tả sản phẩm (ngắn gọn)
                            </label>
                            <textarea
                              rows={3}
                              value={shortDescVi}
                              onChange={(e) => setShortDescVi(e.target.value)}
                              placeholder="Túi đeo vai da lộn nâu khoá cài — phù hợp mang đi làm, dạo phố hàng ngày..."
                              className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition leading-relaxed"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-[#a39ab8] mb-1.5">
                              Câu chuyện sản phẩm / Ghi chú sáng tạo (Story)
                            </label>
                            <textarea
                              rows={4}
                              value={storyVi}
                              onChange={(e) => setStoryVi(e.target.value)}
                              placeholder="Chi tiết về quá trình làm ra sản phẩm, nguồn gốc nguyên vật liệu hoặc cảm hứng thiết kế..."
                              className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition leading-relaxed"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right: Images Management */}
                      <div className="lg:col-span-1 space-y-6">
                        <div className="bg-[#181224] border border-[#2e2344] rounded-2xl p-6 shadow-lg space-y-4">
                          <div className="flex items-center justify-between border-b border-[#2e2344] pb-3">
                            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                              Hình ảnh ({images.length})
                            </h3>
                            <span className="text-[10px] text-[#39d6cf] font-mono">
                              Ảnh đầu là ảnh bìa
                            </span>
                          </div>

                          {/* Upload Dropzone */}
                          <div>
                            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#2e2344] hover:border-[#7520f7] rounded-xl cursor-pointer bg-[#12081f] transition group text-center">
                              <UploadCloud className="w-8 h-8 text-[#a39ab8] group-hover:text-[#39d6cf] transition mb-2" />
                              <span className="text-xs text-white font-medium">
                                Tải hình ảnh sản phẩm
                              </span>
                              <span className="text-[11px] text-[#7b7194] mt-1">
                                Hỗ trợ JPG, PNG, WebP (Tối đa 10MB)
                              </span>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {/* Image List */}
                          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                            {images.map((img, idx) => (
                              <div
                                key={img.id}
                                className="flex items-center gap-3 p-2.5 bg-[#12081f] border border-[#2e2344] rounded-xl"
                              >
                                <div className="w-14 h-14 rounded-lg bg-[#23173d] overflow-hidden flex-shrink-0 relative border border-[#3b2a60]">
                                  {img.previewUrl || img.url ? (
                                    <img
                                      src={img.previewUrl || resolveImageUrl(img.url)}
                                      alt={`Ảnh ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <FileImage className="w-5 h-5 text-[#7b7194] m-auto" />
                                  )}
                                  {idx === 0 && (
                                    <span className="absolute bottom-0 inset-x-0 bg-[#7520f7] text-white text-[9px] font-bold text-center py-0.5">
                                      Bìa
                                    </span>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="text-[11px] text-white truncate font-medium">
                                    Ảnh {idx + 1}
                                  </div>
                                  <div className="text-[10px] text-[#7b7194]">
                                    {img.isUploading ? `Đang tải: ${img.progress}%` : "Sẵn sàng"}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  {idx > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => moveImage(idx, "left")}
                                      className="p-1 hover:bg-[#23173d] rounded text-[#a39ab8] hover:text-white"
                                      title="Di chuyển lên đầu"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {idx < images.length - 1 && (
                                    <button
                                      type="button"
                                      onClick={() => moveImage(idx, "right")}
                                      className="p-1 hover:bg-[#23173d] rounded text-[#a39ab8] hover:text-white"
                                      title="Di chuyển xuống"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="p-1 hover:bg-red-950/50 rounded text-[#a39ab8] hover:text-red-400"
                                    title="Xóa ảnh"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Save/Submit Actions */}
                    <div className="pt-4 border-t border-[#2e2344] flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setPreviewModal("product")}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-[#181224] hover:bg-[#23173d] text-[#39d6cf] border border-[#39d6cf]/40 hover:border-[#39d6cf] rounded-xl text-xs font-medium transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem trước sản phẩm (Preview)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-[#23173d] hover:bg-[#322056] text-white rounded-xl text-xs font-medium border border-[#3b2a60] transition disabled:opacity-50"
                      >
                        {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span>Lưu bản nháp</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSubmitReview}
                        disabled={isSubmitting}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-[#7520f7] hover:bg-[#5a12c6] text-white rounded-xl text-xs font-medium transition shadow-sm disabled:opacity-50"
                      >
                        {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>Gửi duyệt cho Tí Coolture</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* =========================================================================
          LIVE PREVIEW MODAL (STOREFRONT OR PRODUCT)
          Replicates actual appearance on /stores/[slug] or /products/[slug]
          ========================================================================= */}
      {previewModal && (
        <div
          className={`fixed inset-0 z-50 overflow-y-auto ${
            previewModal === "product" ? "bg-paper text-ink" : "bg-[#0d0714]/95 backdrop-blur-md text-white"
          }`}
        >
          {/* Top Sticky Header */}
          <div
            className={`sticky top-0 z-50 px-4 sm:px-6 py-3 flex items-center justify-between border-b shadow-md transition-colors ${
              previewModal === "product"
                ? "bg-paper/95 backdrop-blur-md border-ink/10 text-ink"
                : "bg-[#181224] border-[#2e2344] text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${previewModal === "product" ? "bg-brand" : "bg-[#39d6cf]"}`}></span>
              <span className={`text-xs font-mono font-bold ${previewModal === "product" ? "text-brand" : "text-[#39d6cf]"}`}>
                CHẾ ĐỘ XEM TRƯỚC (LIVE PREVIEW)
              </span>
              <span className={`text-xs hidden sm:inline ${previewModal === "product" ? "text-ink/60" : "text-[#a39ab8]"}`}>
                · {previewModal === "store" ? `Trang chủ shop (/stores/${shop?.slug || "xem-truoc"})` : `Chi tiết sản phẩm (/products/${editingProductId || "xem-truoc"})`}
              </span>
            </div>

            <button
              onClick={() => {
                setPreviewModal(null);
                setActivePreviewImg(0);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition shadow-sm ${
                previewModal === "product"
                  ? "bg-paper hover:bg-paper-warm text-ink border-ink/15 hover:border-ink/30"
                  : "bg-[#23173d] hover:bg-[#322056] text-white border-[#3b2a60]"
              }`}
            >
              <X className="w-4 h-4" />
              <span>Đóng bản xem trước</span>
            </button>
          </div>

          {/* STORE PREVIEW */}
          {previewModal === "store" && (
            <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 font-sans">
              {/* Header Box mimicking ShopDisplay.tsx */}
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#2a124e] to-[#12081f] border border-[#2e2344] p-6 sm:p-8">
                {/* 2.74:1 Cover banner */}
                <div className="aspect-[2.74/1] w-full bg-[#181224] rounded-2xl overflow-hidden border border-white/10 relative shadow-2xl">
                  {shopCoverUrl ? (
                    <img
                      src={resolveImageUrl(shopCoverUrl)}
                      alt={shopName || "Cover shop"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">
                      Chưa có ảnh bìa (Hiển thị tỷ lệ 2.74:1)
                    </div>
                  )}
                </div>

                {/* Avatar and Info Row */}
                <div className="relative -mt-10 sm:-mt-14 px-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="flex items-end gap-4">
                    <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-[#181224] bg-[#23173d] overflow-hidden shadow-2xl flex-shrink-0">
                      {shopLogoUrl ? (
                        <img
                          src={resolveImageUrl(shopLogoUrl)}
                          alt={shopName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#39d6cf] font-bold text-xl">
                          {shopName ? shopName[0] : "X"}
                        </div>
                      )}
                    </div>

                    <div className="pb-1">
                      <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                        {shopName || "Tên shop"}
                      </h1>
                      {shopTaglineVi && (
                        <p className="text-xs sm:text-sm text-[#39d6cf] font-medium mt-0.5">
                          {shopTaglineVi}
                        </p>
                      )}
                      {shopAddress && (
                        <p className="text-[11px] text-[#a39ab8] flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-[#a39ab8]" />
                          <span>{shopAddress}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Social Buttons (white discs matching ShopDisplay.tsx design) */}
                  <div className="flex items-center gap-2 pb-1 flex-wrap">
                    {Object.entries(shopSocials)
                      .filter(([, url]) => typeof url === "string" && Boolean(url.trim()))
                      .map(([platform, url]) => {
                        const href = typeof url === "string" && url.startsWith("http") ? url : `https://${url}`;
                        return (
                          <a
                            key={platform}
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="w-10 h-10 rounded-full bg-white hover:bg-[#7520f7] text-[#7520f7] hover:text-white flex items-center justify-center shadow-lg transition"
                            title={platform}
                          >
                            <PlatformGlyph platform={platform} className="w-5 h-5" />
                          </a>
                        );
                      })}
                  </div>
                </div>

                {/* Story text */}
                {shopStoryVi && (
                  <div className="mt-6 pt-6 border-t border-white/10 px-4 text-xs sm:text-sm text-white/80 leading-relaxed font-sans max-w-3xl whitespace-pre-line">
                    {shopStoryVi}
                  </div>
                )}
              </div>

              {/* Products Grid in Storefront Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#2e2344] pb-3">
                  <h3 className="text-base font-serif font-bold text-white">
                    {products.length} sản phẩm từ {shopName || "shop"}
                  </h3>
                </div>

                {products.length === 0 ? (
                  <div className="text-center py-12 text-xs text-[#a39ab8] bg-[#181224] rounded-2xl border border-[#2e2344]">
                    Shop chưa có sản phẩm nào. Hãy tạo sản phẩm bên Tab Quản lý sản phẩm.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((p) => {
                      const cov = p.product_images?.find((i) => i.is_cover) || p.product_images?.[0];
                      const covUrl = cov?.url ? resolveImageUrl(cov.url) : null;
                      return (
                        <div
                          key={p.id}
                          className="bg-[#181224] border border-[#2e2344] rounded-2xl overflow-hidden shadow group"
                        >
                          <div className="aspect-square bg-[#23173d] overflow-hidden flex items-center justify-center">
                            {covUrl ? (
                              <img src={covUrl} alt={p.name_vi} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                            ) : (
                              <FileImage className="w-6 h-6 text-[#7b7194]" />
                            )}
                          </div>
                          <div className="p-3">
                            <h4 className="text-xs font-serif font-bold text-white truncate">
                              {p.name_vi}
                            </h4>
                            <p className="text-[11px] font-mono text-[#39d6cf] font-medium mt-1">
                              {p.price_vnd ? `${p.price_vnd.toLocaleString("vi-VN")} ₫` : "Giá liên hệ"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PRODUCT DETAIL PREVIEW (EXACTLY REPLICATING MAIN WEBSITE ProductDetail.tsx) */}
          {previewModal === "product" && (
            <div data-surface="light" className="min-h-screen bg-paper text-ink relative overflow-hidden py-8 font-sans">
              {/* Brand Shapes background decoration — authentic motif from web */}
              <ArcTopRight
                className="pointer-events-none absolute -right-24 -top-24 z-0 opacity-15"
                style={{ width: "clamp(18rem, 38vw, 32rem)" }}
                fill="var(--color-wave)"
              />
              <RibbonLoop
                className="pointer-events-none absolute -left-20 bottom-10 z-0 opacity-15"
                style={{ width: "clamp(18rem, 38vw, 32rem)" }}
                ribbon="var(--color-wave)"
                dot="var(--color-paper)"
              />

              <div className="relative z-10 max-w-6xl mx-auto px-5 md:px-8 space-y-6">
                {/* Breadcrumbs */}
                <nav className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink opacity-60">
                  <span>Sản phẩm</span>
                  <span>›</span>
                  <span>{getCategoryName(categoryId)}</span>
                  <span>›</span>
                  <span className="opacity-90 font-medium text-ink">{nameVi || "Tên sản phẩm"}</span>
                </nav>

                {/* Main 2-column Detail View */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 pb-16">
                  {/* Left: Product Images Gallery ("The Plate") */}
                  <section className="lg:col-span-7">
                    <div className="lg:sticky lg:top-20">
                      <div className="flex gap-3">
                        {/* Desktop Vertical Thumbnails */}
                        {images.length > 1 && (
                          <div className="hidden w-16 shrink-0 flex-col gap-2 md:flex">
                            {images.map((img, idx) => (
                              <button
                                key={img.id || idx}
                                type="button"
                                onClick={() => setActivePreviewImg(idx)}
                                aria-label={`Ảnh ${idx + 1}`}
                                className={`aspect-square overflow-hidden rounded-xl border transition-all ${
                                  activePreviewImg === idx
                                    ? "border-brand ring-2 ring-brand/30 shadow-sm"
                                    : "border-ink/12 opacity-60 hover:opacity-100"
                                }`}
                              >
                                <img
                                  src={img.previewUrl || resolveImageUrl(img.url)}
                                  alt={`Thumbnail ${idx + 1}`}
                                  className="h-full w-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Main Hero Frame with rounded-[1.75rem] and bg-paper-warm */}
                        <figure className="min-w-0 flex-1">
                          <div className="aspect-square overflow-hidden rounded-[1.75rem] bg-paper-warm border border-ink/10 shadow-sm flex items-center justify-center">
                            {images[activePreviewImg]?.previewUrl || images[activePreviewImg]?.url ? (
                              <img
                                src={images[activePreviewImg].previewUrl || resolveImageUrl(images[activePreviewImg].url)}
                                alt={nameVi || "Sản phẩm"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex flex-col items-center justify-center text-ink/40 gap-2">
                                <FileImage className="w-10 h-10 opacity-30" />
                                <span className="text-xs">Chưa có hình ảnh nào</span>
                              </div>
                            )}
                          </div>
                          <figcaption className="pt-2 text-[11px] text-ink/45">
                            Ảnh {images.length > 0 ? activePreviewImg + 1 : 0}/{Math.max(1, images.length)} · ảnh hiển thị mẫu trên web
                          </figcaption>
                        </figure>
                      </div>

                      {/* Mobile Horizontal Thumbnails */}
                      {images.length > 1 && (
                        <div className="mt-3 flex gap-2 overflow-x-auto md:hidden pb-1">
                          {images.map((img, idx) => (
                            <button
                              key={img.id || idx}
                              type="button"
                              onClick={() => setActivePreviewImg(idx)}
                              className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border transition-all ${
                                activePreviewImg === idx ? "border-brand ring-2 ring-brand/30" : "border-ink/12 opacity-70"
                              }`}
                            >
                              <img
                                src={img.previewUrl || resolveImageUrl(img.url)}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Right: The Reading Column matching ProductDetail.tsx */}
                  <section className="space-y-7 lg:col-span-5">
                    {/* Shop header tag with Logo and Save Button */}
                    <div className="flex items-center justify-between gap-4 border-b border-ink/12 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 border border-ink/10 bg-paper-warm rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm">
                          {shopLogoUrl ? (
                            <img src={resolveImageUrl(shopLogoUrl)} alt={shopName} className="h-full w-full object-cover" />
                          ) : (
                            <Store className="w-4 h-4 text-brand" />
                          )}
                        </div>
                        <span className="text-sm font-semibold text-ink">
                          {shopName || shop?.name || "Tên shop"}
                        </span>
                      </div>
                      <div className="w-9 h-9 rounded-full border border-ink/10 flex items-center justify-center text-ink/40">
                        <Heart className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Title & Price */}
                    <div className="space-y-2">
                      <h1
                        className="text-3xl md:text-4xl font-bold leading-tight normal-case text-ink"
                        style={{ fontFamily: '"Alexandria", system-ui, sans-serif' }}
                      >
                        {nameVi || "Tên sản phẩm"}
                      </h1>
                      {nameEn && (
                        <p className="text-xs text-ink/50 italic">{nameEn}</p>
                      )}

                      <div className="pt-2">
                        <p className="text-2xl font-bold text-brand">
                          {typeof priceVnd === "number" && priceVnd > 0 ? `${priceVnd.toLocaleString("vi-VN")} ₫` : "Giá liên hệ"}
                        </p>
                        <p className="text-[11px] text-ink/50 mt-0.5">
                          Giá tham khảo, giá cuối do shop quyết định
                        </p>
                      </div>
                    </div>

                    {/* Short Description */}
                    {shortDescVi && (
                      <div className="space-y-2">
                        <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink/45">Mô tả</h2>
                        <p className="text-sm leading-relaxed text-ink/80 whitespace-pre-line">
                          {shortDescVi}
                        </p>
                      </div>
                    )}

                    {/* Spec Table */}
                    <div className="border-t border-ink/12">
                      <dl className="text-xs">
                        <div className="py-2.5 flex items-baseline justify-between gap-4 border-b border-ink/12">
                          <dt className="text-[11px] uppercase tracking-wider text-ink/50">Chất liệu</dt>
                          <dd className="font-medium text-ink text-right">{material || "—"}</dd>
                        </div>
                        <div className="py-2.5 flex items-baseline justify-between gap-4 border-b border-ink/12">
                          <dt className="text-[11px] uppercase tracking-wider text-ink/50">Kích thước</dt>
                          <dd className="font-medium text-ink text-right">{dimensions || "—"}</dd>
                        </div>
                        <div className="py-2.5 flex items-baseline justify-between gap-4 border-b border-ink/12">
                          <dt className="text-[11px] uppercase tracking-wider text-ink/50">Danh mục</dt>
                          <dd className="font-medium text-ink text-right">{getCategoryName(categoryId)}</dd>
                        </div>
                        <div className="py-2.5 flex items-baseline justify-between gap-4 border-b border-ink/12">
                          <dt className="text-[11px] uppercase tracking-wider text-ink/50">Shop</dt>
                          <dd className="font-medium text-ink text-right">{shopName || shop?.name || "—"}</dd>
                        </div>
                        <div className="py-2.5 flex items-baseline justify-between gap-4 border-b border-ink/12">
                          <dt className="text-[11px] uppercase tracking-wider text-ink/50">Khu vực</dt>
                          <dd className="font-medium text-ink text-right">{shopAddress || shop?.address || "—"}</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Action Button */}
                    <div className="space-y-2 pt-2">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between border border-brand bg-brand px-5 py-3.5 text-xs font-semibold text-paper transition-colors hover:bg-brand-deep rounded-xl shadow-md"
                      >
                        <span>Nhắn shop để đặt</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                      <p className="text-[11px] leading-relaxed text-ink/50 text-center">
                        Tí Coolture không bán hàng và không xử lý giao dịch.
                      </p>
                    </div>

                    {/* Story Section */}
                    {storyVi && (
                      <div className="border border-ink/12 bg-paper-warm rounded-2xl p-4 sm:p-5 space-y-1.5 shadow-sm">
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-brand">
                          Câu chuyện sản phẩm
                        </h3>
                        <p className="text-xs text-ink/80 leading-relaxed whitespace-pre-line">
                          {storyVi}
                        </p>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
