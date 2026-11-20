import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateShopMember } from "../_lib/supabaseAuth.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { deleteCache } from "../_lib/redis.js";

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
    const { action, productId, hidden, isOutOfStock, requestId } = req.body || {};

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
        if (updateErr?.message?.includes("is_out_of_stock")) {
          throw new Error("Tính năng kho hàng yêu cầu chạy migration 00022_add_product_stock_status.sql trên Supabase.");
        }
        throw new Error(updateErr?.message || "Không tìm thấy sản phẩm thuộc quyền quản lý của shop.");
      }

      await deleteCache("catalog:v1").catch((err) =>
        console.warn("[portal/product-actions] Redis cache purge warning:", err)
      );

      return res.status(200).json({
        success: true,
        message: isHidden
          ? `Đã ẩn sản phẩm "${updatedProd.name_vi}" khỏi website chính.`
          : `Đã bật hiển thị cho sản phẩm "${updatedProd.name_vi}".`,
        product: updatedProd,
      });
    }

    // 2. ACTION: TOGGLE PRODUCT STOCK STATUS (CÒN HÀNG / TẠM HẾT HÀNG)
    if (action === "toggle_stock" || (productId && typeof isOutOfStock !== "undefined")) {
      if (!productId || typeof productId !== "string") {
        return res.status(400).json({
          success: false,
          error: "Thiếu mã sản phẩm cần thay đổi trạng thái kho hàng.",
        });
      }

      const outOfStock = Boolean(isOutOfStock);
      const { data: updatedProd, error: updateErr } = await supabase
        .from("products")
        .update({
          is_out_of_stock: outOfStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId)
        .eq("shop_id", shopContext.shopId)
        .select("id, name_vi, is_out_of_stock, status")
        .single();

      if (updateErr || !updatedProd) {
        if (updateErr?.message?.includes("is_out_of_stock")) {
          throw new Error("Tính năng kho hàng yêu cầu chạy migration 00022_add_product_stock_status.sql trên Supabase.");
        }
        throw new Error(updateErr?.message || "Không tìm thấy sản phẩm thuộc quyền quản lý của shop.");
      }

      await deleteCache("catalog:v1").catch((err) =>
        console.warn("[portal/product-actions] Redis cache purge warning:", err)
      );

      try {
        await supabase.from("audit_logs").insert({
          user_id: shopContext.userId,
          action: "toggle_product_stock",
          table_name: "products",
          record_id: productId,
          old_data: { is_out_of_stock: !outOfStock },
          new_data: { is_out_of_stock: outOfStock },
        });
      } catch (logErr) {
        console.warn("[portal/product-actions] Audit log error:", logErr);
      }

      return res.status(200).json({
        success: true,
        message: outOfStock
          ? `Đã chuyển sản phẩm "${updatedProd.name_vi}" sang trạng thái tạm hết hàng.`
          : `Đã chuyển sản phẩm "${updatedProd.name_vi}" sang trạng thái còn hàng.`,
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

      // Ghi audit log
      try {
        await supabase.from("audit_logs").insert({
          user_id: shopContext.userId,
          action: "cancel_upload_request",
          table_name: "products",
          record_id: productId,
          old_data: { status: "pending_review" },
          new_data: { status: "draft" },
        });
      } catch (logErr) {
        console.warn("[portal/product-actions] Audit log error:", logErr);
      }

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

    // 4. ACTION: HARD DELETE PRODUCT (XÓA VĨNH VIỄN SẢN PHẨM - HỖ TRỢ ĐƠN & HÀNG LOẠT)
    if (action === "delete_product") {
      const idsToDelete: string[] = Array.isArray(productIds) && productIds.length > 0
        ? productIds.filter((id) => typeof id === "string")
        : productId && typeof productId === "string"
        ? [productId]
        : [];

      if (idsToDelete.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Thiếu mã sản phẩm cần xóa (productId hoặc productIds).",
        });
      }

      // Xác thực các sản phẩm thuộc quyền sở hữu của shop
      const { data: prodsToDelete, error: fetchErr } = await supabase
        .from("products")
        .select("id, name_vi, shop_id, status")
        .in("id", idsToDelete)
        .eq("shop_id", shopContext.shopId);

      if (fetchErr) throw fetchErr;

      if (!prodsToDelete || prodsToDelete.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Không tìm thấy sản phẩm hợp lệ thuộc quyền quản lý của shop để xóa.",
        });
      }

      const validIds = prodsToDelete.map((p) => p.id);

      // Xóa các dữ liệu phụ thuộc
      await supabase.from("product_images").delete().in("product_id", validIds);
      await supabase.from("product_edit_requests").delete().in("product_id", validIds);
      await supabase.from("featured_items").delete().in("product_id", validIds);

      // Xóa sản phẩm
      const { error: deleteErr } = await supabase
        .from("products")
        .delete()
        .in("id", validIds)
        .eq("shop_id", shopContext.shopId);

      if (deleteErr) throw deleteErr;

      await deleteCache("catalog:v1").catch((err) =>
        console.warn("[portal/product-actions] Redis cache purge warning:", err)
      );

      try {
        await supabase.from("audit_logs").insert(
          prodsToDelete.map((p) => ({
            user_id: shopContext.userId,
            action: "delete_product",
            table_name: "products",
            record_id: p.id,
            old_data: p,
          }))
        );
      } catch (logErr) {
        console.warn("[portal/product-actions] Audit log error:", logErr);
      }

      return res.status(200).json({
        success: true,
        deletedCount: validIds.length,
        deletedIds: validIds,
        message: validIds.length === 1
          ? `Đã xóa vĩnh viễn sản phẩm "${prodsToDelete[0].name_vi}".`
          : `Đã xóa vĩnh viễn ${validIds.length} sản phẩm thành công.`,
      });
    }

    return res.status(400).json({
      success: false,
      error: "Hành động (action) không hợp lệ. Hỗ trợ 'toggle_visibility', 'toggle_stock', 'cancel_upload_request', 'cancel_edit_request' hoặc 'delete_product'.",
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
