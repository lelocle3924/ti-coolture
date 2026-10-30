import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateShopMember } from "../_lib/supabaseAuth.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed. Sử dụng phương thức POST.",
    });
  }

  try {
    const authHeader = req.headers.authorization;
    const shopContext = await authenticateShopMember(authHeader);
    const supabase = getSupabaseAdmin();
    const { action, productId, hidden, requestId } = req.body || {};

    // 1. ACTION: TOGGLE PRODUCT VISIBILITY (ẨN / HIỆN SẢN PHẨM)
    if (action === "toggle_visibility" || (productId && typeof hidden !== "undefined")) {
      if (!productId || typeof productId !== "string") {
        return res.status(400).json({
          success: false,
          error: "Thiếu mã sản phẩm cần thay đổi trạng thái ẩn/hiện.",
        });
      }

      const isHidden = Boolean(hidden);
      const { data: updatedProd, error: updateErr } = await supabase
        .from("products")
        .update({
          product_hidden: isHidden,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId)
        .eq("shop_id", shopContext.shopId)
        .select("id, name_vi, product_hidden, status")
        .single();

      if (updateErr || !updatedProd) {
        throw new Error(updateErr?.message || "Không tìm thấy sản phẩm thuộc quyền quản lý của shop.");
      }

      return res.status(200).json({
        success: true,
        message: isHidden
          ? `Đã ẩn sản phẩm "${updatedProd.name_vi}" khỏi website chính.`
          : `Đã bật hiển thị cho sản phẩm "${updatedProd.name_vi}".`,
        product: updatedProd,
      });
    }

    // 2. ACTION: CANCEL UPLOAD REQUEST (THU HỒI YÊU CẦU ĐĂNG SẢN PHẨM MỚI)
    if (action === "cancel_upload_request") {
      if (!productId || typeof productId !== "string") {
        return res.status(400).json({
          success: false,
          error: "Thiếu mã sản phẩm cần thu hồi yêu cầu đăng.",
        });
      }

      const { data: existingProd, error: fetchErr } = await supabase
        .from("products")
        .select("id, name_vi, shop_id, status")
        .eq("id", productId)
        .single();

      if (fetchErr || !existingProd) {
        return res.status(404).json({
          success: false,
          error: "Không tìm thấy sản phẩm cần thu hồi.",
        });
      }

      if (existingProd.shop_id !== shopContext.shopId) {
        return res.status(403).json({
          success: false,
          error: "Bạn không có quyền thu hồi sản phẩm của shop khác.",
        });
      }

      if (existingProd.status !== "pending_review") {
        return res.status(400).json({
          success: false,
          error:
            existingProd.status === "published"
              ? "Sản phẩm đã được duyệt và xuất bản, không thể thu hồi."
              : "Sản phẩm không ở trạng thái chờ duyệt.",
        });
      }

      const { error: updateErr } = await supabase
        .from("products")
        .update({
          status: "draft",
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId)
        .eq("shop_id", shopContext.shopId);

      if (updateErr) throw updateErr;

      return res.status(200).json({
        success: true,
        message: `Đã thu hồi yêu cầu đăng sản phẩm "${existingProd.name_vi}". Sản phẩm đã được chuyển về bản nháp.`,
      });
    }

    // 3. ACTION: CANCEL / WITHDRAW EDIT REQUEST (THU HỒI YÊU CẦU CHỈNH SỬA)
    if (action === "cancel_edit_request" || requestId) {
      if (!requestId || typeof requestId !== "string") {
        return res.status(400).json({
          success: false,
          error: "Thiếu mã yêu cầu chỉnh sửa cần thu hồi.",
        });
      }

      const { data: existingReq, error: fetchErr } = await supabase
        .from("product_edit_requests")
        .select("id, shop_id, status")
        .eq("id", requestId)
        .single();

      if (fetchErr || !existingReq) {
        return res.status(404).json({
          success: false,
          error: "Không tìm thấy yêu cầu chỉnh sửa cần thu hồi.",
        });
      }

      if (existingReq.shop_id !== shopContext.shopId) {
        return res.status(403).json({
          success: false,
          error: "Bạn không có quyền thu hồi yêu cầu chỉnh sửa của shop khác.",
        });
      }

      if (existingReq.status === "approved") {
        return res.status(400).json({
          success: false,
          error: "Yêu cầu chỉnh sửa này đã được duyệt và áp dụng, không thể thu hồi.",
        });
      }

      const { error: deleteErr } = await supabase
        .from("product_edit_requests")
        .delete()
        .eq("id", requestId)
        .eq("shop_id", shopContext.shopId);

      if (deleteErr) throw deleteErr;

      return res.status(200).json({
        success: true,
        message: "Đã thu hồi yêu cầu chỉnh sửa thành công.",
      });
    }

    return res.status(400).json({
      success: false,
      error: "Hành động (action) không hợp lệ. Hỗ trợ 'toggle_visibility', 'cancel_upload_request' hoặc 'cancel_edit_request'.",
    });
  } catch (err: any) {
    console.error("[portal/product-actions] Error:", err.message);
    const isClientError =
      err.message.includes("bắt buộc") ||
      err.message.includes("chưa được cấp quyền") ||
      err.message.includes("Thiếu mã");

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      error: err.message || "Không thể thực hiện thao tác trên sản phẩm.",
    });
  }
}
