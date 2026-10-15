import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateShopMember } from "../_lib/supabaseAuth.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow GET and OPTIONS
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
    const shopContext = await authenticateShopMember(authHeader);

    const supabase = getSupabaseAdmin();

    // Fetch shop details and existing products (draft & pending_review)
    const [shopRes, productsRes] = await Promise.all([
      supabase
        .from("shops")
        .select("id, name, slug, tagline_vi, story_vi, logo_url, cover_url, status, is_online_only")
        .eq("id", shopContext.shopId)
        .single(),
      supabase
        .from("products")
        .select(`
          id,
          name_vi,
          name_en,
          price_vnd,
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
        .eq("shop_id", shopContext.shopId)
        .order("updated_at", { ascending: false }),
    ]);

    return res.status(200).json({
      success: true,
      user: {
        id: shopContext.userId,
        email: shopContext.userEmail,
      },
      shop: shopRes.data || {
        id: shopContext.shopId,
        name: shopContext.shopName,
        slug: shopContext.shopSlug,
        status: shopContext.shopStatus,
      },
      role: shopContext.role,
      products: productsRes.data || [],
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
