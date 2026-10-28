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

    const { productId, hidden } = req.body || {};
    if (!productId || typeof productId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Thiếu mã sản phẩm cần thay đổi trạng thái ẩn/hiện.",
      });
    }

    const isHidden = Boolean(hidden);
    const supabase = getSupabaseAdmin();

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
  } catch (err: any) {
    console.error("[portal/toggle-visibility] Error:", err.message);
    const isClientError =
      err.message.includes("bắt buộc") ||
      err.message.includes("chưa được cấp quyền") ||
      err.message.includes("Thiếu mã");

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      error: err.message || "Không thể thay đổi trạng thái hiển thị của sản phẩm.",
    });
  }
}
