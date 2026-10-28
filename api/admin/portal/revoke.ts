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
    await authenticateStaffMember(authHeader);

    const { inviteId, email } = req.body || {};
    const supabase = getSupabaseAdmin();

    let query = supabase.from("shop_invitations").update({ status: "revoked" });
    if (inviteId) {
      query = query.eq("id", inviteId);
    } else if (email) {
      query = query.eq("invited_email", email.toLowerCase().trim());
    } else {
      return res.status(400).json({ success: false, error: "Thiếu mã lời mời cần thu hồi." });
    }

    const { error } = await query;
    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Đã thu hồi quyền truy cập shop thành công.",
    });
  } catch (err: any) {
    console.error("[admin/portal/revoke] Error:", err.message);
    return res.status(500).json({ success: false, error: err.message || "Lỗi thu hồi quyền shop." });
  }
}
