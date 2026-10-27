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

      const { data: productEditRequests, error: editErr } = await supabase
        .from("product_edit_requests")
        .select(`
          id,
          product_id,
          shop_id,
          proposed_data,
          status,
          created_at,
          products (
            *,
            shops(id, name, slug, contact_email),
            product_images(*),
            categories(name_vi)
          )
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (editErr) throw editErr;

      return res.status(200).json({
        success: true,
        products: products || [],
        shops: shops || [],
        productEditRequests: productEditRequests || [],
      });
    }

    // POST: Approve or Reject a product review (gộp từ reviews/action)
    if (req.method === "POST") {
      if (staff.role === "viewer") {
        return res.status(403).json({
          success: false,
          error: "Tài khoản chỉ có quyền xem, không thể thay đổi trạng thái.",
        });
      }

      const { productId, action, rejectReason } = req.body || {};

      if (action === "toggle_product" || action === "toggle_shop") {
        const visible = req.body?.visible;
        const recordId = action === "toggle_product" ? productId : req.body?.shopId;
        if (typeof recordId !== "string" || typeof visible !== "boolean") {
          return res.status(400).json({
            success: false,
            error: "Thiếu mã shop/sản phẩm hoặc trạng thái hiển thị không hợp lệ.",
          });
        }

        const now = new Date().toISOString();
        let nextStatus: string;

        if (action === "toggle_product") {
          const { data: product, error: productErr } = await supabase
            .from("products")
            .select("id, shop_id, status")
            .eq("id", recordId)
            .single();
          if (productErr || !product) {
            return res.status(404).json({ success: false, error: "Không tìm thấy sản phẩm." });
          }
          if (product.status !== "published" && product.status !== "hidden") {
            return res.status(409).json({
              success: false,
              error: "Chỉ có thể ẩn hoặc hiện sản phẩm đã xuất bản.",
            });
          }
          if (visible) {
            const { data: parentShop, error: shopErr } = await supabase
              .from("shops")
              .select("status")
              .eq("id", product.shop_id)
              .single();
            if (shopErr) throw shopErr;
            if (parentShop.status !== "published") {
              return res.status(409).json({
                success: false,
                error: "Cần hiển thị shop trước khi hiện sản phẩm.",
              });
            }
          }

          nextStatus = visible ? "published" : "hidden";
          const { data: updatedProduct, error: updateErr } = await supabase
            .from("products")
            .update({
              status: nextStatus,
              updated_at: now,
            })
            .eq("id", recordId)
            .eq("status", product.status)
            .select("id")
            .maybeSingle();
          if (updateErr) throw updateErr;
          if (!updatedProduct) {
            return res.status(409).json({
              success: false,
              error: "Trạng thái sản phẩm vừa thay đổi. Vui lòng tải lại danh sách.",
            });
          }
        } else {
          const { data: shop, error: shopErr } = await supabase
            .from("shops")
            .select("id, status")
            .eq("id", recordId)
            .single();
          if (shopErr || !shop) {
            return res.status(404).json({ success: false, error: "Không tìm thấy shop." });
          }
          if (shop.status !== "published" && shop.status !== "hidden") {
            return res.status(409).json({
              success: false,
              error: "Chỉ có thể ẩn hoặc hiện shop đã xuất bản.",
            });
          }

          nextStatus = visible ? "published" : "hidden";
          const { data: updatedShop, error: updateErr } = await supabase
            .from("shops")
            .update({ status: nextStatus, updated_at: now })
            .eq("id", recordId)
            .eq("status", shop.status)
            .select("id")
            .maybeSingle();
          if (updateErr) throw updateErr;
          if (!updatedShop) {
            return res.status(409).json({
              success: false,
              error: "Trạng thái shop vừa thay đổi. Vui lòng tải lại danh sách.",
            });
          }
        }

        return res.status(200).json({
          success: true,
          status: nextStatus,
          message: action === "toggle_product"
            ? `Đã ${visible ? "hiện" : "ẩn"} sản phẩm.`
            : `Đã ${visible ? "hiện" : "ẩn"} shop.`,
        });
      }

      if (action === "approve_edit" || action === "reject_edit") {
        const { editRequestId, rejectReason: editRejectReason } = req.body || {};
        if (typeof editRequestId !== "string") {
          return res.status(400).json({
            success: false,
            error: "Mã yêu cầu chỉnh sửa là bắt buộc.",
          });
        }

        const { data: result, error: reviewErr } = await supabase.rpc(
          "review_product_edit_request",
          {
            p_request_id: editRequestId,
            p_action: action === "approve_edit" ? "approve" : "reject",
            p_staff_user_id: staff.userId,
            p_reject_reason: editRejectReason || null,
          }
        );
        if (reviewErr) throw reviewErr;

        return res.status(200).json({
          success: true,
          status: result?.status || (action === "approve_edit" ? "approved" : "rejected"),
          message: action === "approve_edit"
            ? "Đã duyệt và áp dụng yêu cầu chỉnh sửa sản phẩm."
            : "Đã từ chối yêu cầu chỉnh sửa sản phẩm.",
        });
      }

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
