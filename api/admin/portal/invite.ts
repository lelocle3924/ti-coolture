import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateStaffMember } from "../../_lib/supabaseAuth.js";
import { getSupabaseAdmin } from "../../_lib/supabaseAdmin.js";

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
    const staff = await authenticateStaffMember(authHeader);

    const { shopId, email, role } = req.body || {};

    if (!shopId || typeof shopId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Mã định danh xưởng (shopId) là bắt buộc.",
      });
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({
        success: false,
        error: "Email Google của đối tác không hợp lệ.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const assignedRole = role === "editor" ? "editor" : "owner";

    const supabase = getSupabaseAdmin();

    // 1. Kiểm tra shop có tồn tại không
    const { data: shop, error: shopErr } = await supabase
      .from("shops")
      .select("id, name, slug")
      .eq("id", shopId)
      .single();

    if (shopErr || !shop) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy xưởng tương ứng trong hệ thống.",
      });
    }

    // 2. Tạo hoặc làm mới bản ghi shop_invitations
    const { data: invite, error: inviteErr } = await supabase
      .from("shop_invitations")
      .upsert(
        {
          shop_id: shopId,
          invited_email: normalizedEmail,
          shop_role: assignedRole,
          status: "pending",
          created_by: staff.userId,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 ngày
          updated_at: new Date().toISOString(),
        },
        { onConflict: "shop_id,invited_email" }
      )
      .select("id, shop_id, invited_email, shop_role, status, expires_at")
      .single();

    if (inviteErr || !invite) {
      throw new Error("Lỗi lưu lời mời đối tác: " + (inviteErr?.message || ""));
    }

    const publicDomain = (process.env.VITE_SITE_URL || "https://ticoolture.vn").replace(/\/+$/, "");
    const portalUrl = `${publicDomain}/portal`;

    return res.status(200).json({
      success: true,
      message: `Đã cấp quyền truy cập cho email ${normalizedEmail} vào xưởng "${shop.name}".`,
      invitation: invite,
      portalUrl,
    });
  } catch (err: any) {
    console.error("[admin/portal/invite] Error:", err.message);

    const isClientError =
      err.message.includes("không hợp lệ") ||
      err.message.includes("không có quyền") ||
      err.message.includes("Không tìm thấy");

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      error: err.message || "Không thể cấp quyền truy cập portal.",
    });
  }
}
