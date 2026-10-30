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
    let editRequestsData: any[] = [];

    // If user has a shop attached, fetch details & products & edit requests
    if (portalUser.shopId) {
      const [shopRes, socialsRes, productsRes, editReqsRes] = await Promise.all([
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
            product_hidden,
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
        supabase
          .from("product_edit_requests")
          .select(`
            id,
            product_id,
            shop_id,
            proposed_data,
            status,
            reject_reason,
            reviewed_at,
            created_at,
            updated_at,
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
          .eq("shop_id", portalUser.shopId)
          .order("created_at", { ascending: false }),
      ]);

      shopData = shopRes.data;
      if (shopData && socialsRes.data) {
        (shopData as any).socials = socialsRes.data;
      }

      const rawProducts = productsRes.data || [];
      const rejectedProdIds = rawProducts
        .filter((p: any) => p.status === "rejected")
        .map((p: any) => p.id);

      let auditReasonsMap: Record<string, string> = {};
      if (rejectedProdIds.length > 0) {
        try {
          const { data: auditData } = await supabase
            .from("audit_logs")
            .select("record_id, new_data, created_at")
            .eq("table_name", "products")
            .eq("action", "reject")
            .in("record_id", rejectedProdIds)
            .order("created_at", { ascending: false });

          if (Array.isArray(auditData)) {
            for (const log of auditData) {
              if (log.record_id && !auditReasonsMap[log.record_id] && log.new_data?.reject_reason) {
                auditReasonsMap[log.record_id] = log.new_data.reject_reason;
              }
            }
          }
        } catch (auditErr) {
          console.warn("[portal/me] Failed to query audit_logs for reject reasons:", auditErr);
        }
      }

      productsData = rawProducts.map((p: any) => ({
        ...p,
        reject_reason: p.reject_reason || auditReasonsMap[p.id] || null,
      }));

      editRequestsData = editReqsRes.data || [];
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
      productEditRequests: editRequestsData,
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
