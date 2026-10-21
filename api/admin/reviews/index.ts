import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateStaffMember } from "../../_lib/supabaseAuth.js";
import { getSupabaseAdmin } from "../../_lib/supabaseAdmin.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  try {
    const authHeader = req.headers.authorization;
    const staff = await authenticateStaffMember(authHeader);

    const supabase = getSupabaseAdmin();

    // GET: Fetch all products with images, shops, categories for Admin review
    if (req.method === "GET") {
      const { data: products, error: prodErr } = await supabase
        .from("products")
        .select("*, shops(id, name, slug, contact_email), product_images(*), categories(name_vi)")
        .order("created_at", { ascending: false });

      if (prodErr) throw prodErr;

      const { data: shops, error: shopErr } = await supabase
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

      if (shopErr) throw shopErr;

      return res.status(200).json({
        success: true,
        products: products || [],
        shops: shops || [],
      });
    }

    // POST: Approve or Reject a product review (gộp từ reviews/action)
    if (req.method === "POST") {
      const { productId, action, rejectReason } = req.body || {};

      if (!productId || typeof productId !== "string") {
        return res.status(400).json({
          success: false,
          error: "Mã định danh sản phẩm (productId) là bắt buộc.",
        });
      }

      if (action !== "approve" && action !== "reject") {
        return res.status(400).json({
          success: false,
          error: "Hành động (action) phải là 'approve' hoặc 'reject'.",
        });
      }

      // 1. Lấy thông tin sản phẩm
      const { data: product, error: fetchErr } = await supabase
        .from("products")
        .select("id, name_vi, shop_id, status")
        .eq("id", productId)
        .single();

      if (fetchErr || !product) {
        return res.status(404).json({
          success: false,
          error: "Không tìm thấy sản phẩm cần xét duyệt.",
        });
      }

      const nowIso = new Date().toISOString();

      if (action === "approve") {
        const { error: prodErr } = await supabase
          .from("products")
          .update({
            status: "published",
            published_at: nowIso,
            updated_at: nowIso,
          })
          .eq("id", productId);

        if (prodErr) throw new Error("Lỗi khi duyệt sản phẩm: " + prodErr.message);

        // Tự động kích hoạt shop nếu shop chưa được xuất bản
        await supabase
          .from("shops")
          .update({ status: "published", updated_at: nowIso })
          .eq("id", product.shop_id)
          .eq("status", "draft");

        // Ghi audit log
        await supabase.from("audit_logs").insert({
          actor_id: staff.userId,
          action: "publish",
          table_name: "products",
          record_id: productId,
          new_data: { status: "published", published_at: nowIso },
        });

        return res.status(200).json({
          success: true,
          message: `Đã duyệt và xuất bản sản phẩm "${product.name_vi}" thành công.`,
          status: "published",
        });
      } else {
        const { error: prodErr } = await supabase
          .from("products")
          .update({
            status: "rejected",
            updated_at: nowIso,
          })
          .eq("id", productId);

        if (prodErr) throw new Error("Lỗi khi từ chối sản phẩm: " + prodErr.message);

        // Ghi audit log
        await supabase.from("audit_logs").insert({
          actor_id: staff.userId,
          action: "reject",
          table_name: "products",
          record_id: productId,
          new_data: { status: "rejected", reject_reason: rejectReason || null },
        });

        return res.status(200).json({
          success: true,
          message: `Đã từ chối xét duyệt sản phẩm "${product.name_vi}".`,
          status: "rejected",
          rejectReason: rejectReason || null,
        });
      }
    }
  } catch (err: any) {
    console.error("[admin/reviews] Error:", err.message);

    const isClientError =
      err.message.includes("bắt buộc") ||
      err.message.includes("không có quyền") ||
      err.message.includes("Không tìm thấy");

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      error: err.message || "Lỗi xử lý yêu cầu xét duyệt.",
    });
  }
}
