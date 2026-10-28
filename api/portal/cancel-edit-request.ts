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

    const { requestId } = req.body || {};
    if (!requestId || typeof requestId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Thiếu mã yêu cầu chỉnh sửa cần thu hồi.",
      });
    }

    const supabase = getSupabaseAdmin();

    // Verify ownership
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

    // Delete request record so shop can start fresh
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
  } catch (err: any) {
    console.error("[portal/cancel-edit-request] Error:", err.message);
    return res.status(500).json({
      success: false,
      error: err.message || "Không thể thu hồi yêu cầu chỉnh sửa.",
    });
  }
}
