import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateShopMember } from "../_lib/supabaseAuth.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { notifyAdminProductSubmission } from "../_lib/telegram.js";

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

    const { productId } = req.body || {};

    if (!productId || typeof productId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Thiếu mã định danh sản phẩm (productId).",
      });
    }

    const supabase = getSupabaseAdmin();

    // 1. Lấy thông tin sản phẩm và danh sách ảnh
    const { data: product, error: fetchErr } = await supabase
      .from("products")
      .select(`
        id,
        name_vi,
        price_vnd,
        shop_id,
        status,
        product_images ( id )
      `)
      .eq("id", productId)
      .single();

    if (fetchErr || !product) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy sản phẩm cần gửi duyệt.",
      });
    }

    // 2. Kiểm tra quyền sở hữu
    if (product.shop_id !== shopContext.shopId) {
      return res.status(403).json({
        success: false,
        error: "Bạn không có quyền gửi duyệt sản phẩm này.",
      });
    }

    if (product.status === "published" || product.status === "hidden") {
      const { data: editRequest, error: editFetchErr } = await supabase
        .from("product_edit_requests")
        .select("id, status, proposed_data")
        .eq("product_id", productId)
        .eq("shop_id", shopContext.shopId)
        .eq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (editFetchErr) throw editFetchErr;

      if (!editRequest) {
        const { data: pendingEdit, error: pendingFetchErr } = await supabase
          .from("product_edit_requests")
          .select("id")
          .eq("product_id", productId)
          .eq("status", "pending")
          .maybeSingle();
        if (pendingFetchErr) throw pendingFetchErr;
        if (pendingEdit) {
          return res.status(200).json({
            success: true,
            alreadySubmitted: true,
            message: "Yêu cầu chỉnh sửa sản phẩm đang chờ ban quản trị xử lý.",
            status: "pending_review",
          });
        }

        return res.status(400).json({
          success: false,
          error: "Vui lòng lưu thay đổi trước khi gửi yêu cầu chỉnh sửa.",
        });
      }

      const proposedImages = editRequest.proposed_data?.images;
      if (!Array.isArray(proposedImages) || proposedImages.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Sản phẩm phải có ít nhất 1 hình ảnh trước khi gửi yêu cầu chỉnh sửa.",
        });
      }

      if (typeof editRequest.proposed_data?.price_vnd === "number" && editRequest.proposed_data.price_vnd > 500_000_000) {
        return res.status(400).json({
          success: false,
          error: "Giá sản phẩm không được vượt quá 500.000.000 ₫.",
        });
      }

      const { data: submittedEdit, error: submitEditErr } = await supabase
        .from("product_edit_requests")
        .update({ status: "pending", updated_at: new Date().toISOString() })
        .eq("id", editRequest.id)
        .eq("status", "draft")
        .select("id")
        .maybeSingle();

      if (submitEditErr) throw submitEditErr;
      if (!submittedEdit) {
        return res.status(409).json({
          success: false,
          error: "Yêu cầu chỉnh sửa đã thay đổi. Vui lòng tải lại trang.",
        });
      }

      notifyAdminProductSubmission({
        shopName: shopContext.shopName,
        shopEmail: shopContext.userEmail,
        productName: editRequest.proposed_data.name_vi || product.name_vi,
        productId: product.id,
        imageCount: proposedImages.length,
        priceVnd: editRequest.proposed_data.price_vnd,
      }).catch((err) => {
        console.warn("[submit-review] Failed to send Telegram alert:", err);
      });

      return res.status(200).json({
        success: true,
        message: "Yêu cầu chỉnh sửa đã được gửi duyệt. Phiên bản đang xuất bản vẫn được giữ nguyên.",
        status: "pending_review",
        editRequest: true,
      });
    }

    // 3. Kiểm tra trạng thái hiện tại
    if (product.status === "pending_review") {
      return res.status(200).json({
        success: true,
        alreadySubmitted: true,
        message: "Sản phẩm đã được gửi duyệt và đang chờ ban quản trị xử lý.",
        status: "pending_review",
      });
    }

    if (product.status === "published") {
      return res.status(400).json({
        success: false,
        error: "Sản phẩm này đã được xuất bản chính thức trên website.",
      });
    }

    // 4. Kiểm tra điều kiện tối thiểu: Phải có ít nhất 1 hình ảnh
    const imageCount = Array.isArray(product.product_images) ? product.product_images.length : 0;
    if (imageCount === 0) {
      return res.status(400).json({
        success: false,
        error: "Sản phẩm phải có ít nhất 1 hình ảnh trước khi gửi duyệt.",
      });
    }

    if (typeof product.price_vnd === "number" && product.price_vnd > 500_000_000) {
      return res.status(400).json({
        success: false,
        error: "Giá sản phẩm không được vượt quá 500.000.000 ₫.",
      });
    }

    // 5. Cập nhật trạng thái sang pending_review
    const { data: updatedProduct, error: updateErr } = await supabase
      .from("products")
      .update({
        status: "pending_review",
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .eq("status", product.status)
      .select("id")
      .maybeSingle();

    if (updateErr) {
      throw new Error("Lỗi khi cập nhật trạng thái sản phẩm: " + updateErr.message);
    }

    if (!updatedProduct) {
      const { data: latestProduct, error: latestErr } = await supabase
        .from("products")
        .select("status")
        .eq("id", productId)
        .single();

      if (latestErr) throw latestErr;
      if (latestProduct.status === "pending_review") {
        return res.status(200).json({
          success: true,
          alreadySubmitted: true,
          message: "Sản phẩm đã được gửi duyệt và đang chờ ban quản trị xử lý.",
          status: "pending_review",
        });
      }

      return res.status(409).json({
        success: false,
        error: "Trạng thái sản phẩm đã thay đổi. Vui lòng tải lại danh sách.",
      });
    }

    // 6. Gửi thông báo Telegram cho Admin (Bất đồng bộ, không chặn luồng response)
    notifyAdminProductSubmission({
      shopName: shopContext.shopName,
      shopEmail: shopContext.userEmail,
      productName: product.name_vi,
      productId: product.id,
      imageCount,
      priceVnd: product.price_vnd,
    }).catch((err) => {
      console.warn("[submit-review] Failed to send Telegram alert:", err);
    });

    return res.status(200).json({
      success: true,
      message: "Sản phẩm đã được gửi duyệt thành công! Đội ngũ Tí Coolture sẽ thẩm định sớm nhất.",
      status: "pending_review",
    });
  } catch (err: any) {
    console.error("[submit-review] Error:", err.message);

    const isClientError =
      err.message.includes("không tìm thấy") ||
      err.message.includes("ít nhất 1 hình ảnh") ||
      err.message.includes("đã được gửi duyệt");

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      error: err.message || "Không thể gửi duyệt sản phẩm.",
    });
  }
}
