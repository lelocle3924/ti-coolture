import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticatePortalUser } from "../_lib/supabaseAuth.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed. Sử dụng GET hoặc POST.",
    });
  }

  try {
    const authHeader = req.headers.authorization;
    const portalUser = await authenticatePortalUser(authHeader);

    const supabase = getSupabaseAdmin();

    let shopData = null;
    let productsData: any[] = [];

    // If user has a shop attached, fetch details & products
    if (portalUser.shopId) {
      const [shopRes, socialsRes, productsRes] = await Promise.all([
        supabase
          .from("shops")
          .select("id, name, slug, tagline_vi, story_vi, logo_url, cover_url, status, is_online_only, address, area_tag, contact_email")
          .eq("id", portalUser.shopId)
          .single(),
        supabase
          .from("shop_socials")
          .select("platform, url, is_visible")
          .eq("shop_id", portalUser.shopId),
        supabase
          .from("products")
          .select(`
            id,
            name_vi,
            name_en,
            price_vnd,
            category_id,
            short_desc_vi,
            story_vi,
            dimensions,
            status,
            created_at,
            updated_at,
            product_images (
              id,
              url,
              is_cover,
              sort_order,
              alt_vi
            )
          `)
          .eq("shop_id", portalUser.shopId)
          .order("updated_at", { ascending: false }),
      ]);

      shopData = shopRes.data;
      if (shopData && socialsRes.data) {
        (shopData as any).socials = socialsRes.data;
      }
      productsData = productsRes.data || [];
    }

    return res.status(200).json({
      success: true,
      user: {
        id: portalUser.userId,
        email: portalUser.userEmail,
      },
      isAdmin: portalUser.isAdmin,
      adminRole: portalUser.adminRole,
      staffName: portalUser.staffName,
      shop: shopData || (portalUser.shopId ? {
        id: portalUser.shopId,
        name: portalUser.shopName,
        slug: portalUser.shopSlug,
        status: portalUser.shopStatus,
      } : null),
      role: portalUser.role,
      products: productsData,
    });
  } catch (err: any) {
    console.warn("[portal/me] Auth check failed:", err.message);

    const isAuthError =
      err.message.includes("đăng nhập") ||
      err.message.includes("chưa được cấp quyền") ||
      err.message.includes("không hợp lệ");

    return res.status(isAuthError ? 401 : 500).json({
      success: false,
      error: err.message || "Không thể xác minh danh tính đối tác.",
    });
  }
}
