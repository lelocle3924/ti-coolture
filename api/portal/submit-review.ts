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

    // 3. Kiểm tra trạng thái hiện tại
    if (product.status === "pending_review") {
      return res.status(400).json({
        success: false,
        error: "Sản phẩm này đã được gửi duyệt trước đó và đang chờ ban quản trị xử lý.",
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

    // 5. Cập nhật trạng thái sang pending_review
    const { error: updateErr } = await supabase
      .from("products")
      .update({
        status: "pending_review",
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (updateErr) {
      throw new Error("Lỗi khi cập nhật trạng thái sản phẩm: " + updateErr.message);
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
