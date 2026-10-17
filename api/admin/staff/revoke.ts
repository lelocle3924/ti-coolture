import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateStaffMember } from "../../_lib/supabaseAuth.js";
import { getSupabaseAdmin } from "../../_lib/supabaseAdmin.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  try {
    const authHeader = req.headers.authorization;
    const staff = await authenticateStaffMember(authHeader);

    if (staff.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Chỉ quản trị viên cấp cao (Admin) mới có quyền tước quyền staff.",
      });
    }

    const { targetUserId, targetEmail } = req.body || {};
    const supabase = getSupabaseAdmin();

    // Không được tự tước quyền của chính mình
    if (targetUserId === staff.userId || (targetEmail && targetEmail.toLowerCase() === staff.userEmail.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: "Không thể tự tước quyền quản trị của chính tài khoản đang đăng nhập.",
      });
    }

    let query = supabase.from("staff_members").update({ is_active: false });
    if (targetUserId) {
      query = query.eq("user_id", targetUserId);
    } else if (targetEmail) {
      query = query.eq("email", targetEmail.toLowerCase().trim());
    } else {
      return res.status(400).json({ success: false, error: "Thiếu thông tin người dùng cần tước quyền." });
    }

    const { error } = await query;
    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Đã thu hồi quyền quản trị thành công.",
    });
  } catch (err: any) {
    console.error("[admin/staff/revoke] Error:", err.message);
    return res.status(500).json({ success: false, error: err.message || "Lỗi tước quyền staff." });
  }
}
