import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateStaffMember } from "../../_lib/supabaseAuth.js";
import { getSupabaseAdmin } from "../../_lib/supabaseAdmin.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const authHeader = req.headers.authorization;
    const staff = await authenticateStaffMember(authHeader);

    const supabase = getSupabaseAdmin();

    // GET: List all staff members
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("staff_members")
        .select("user_id, email, full_name, role, is_active, created_at")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return res.status(200).json({ success: true, staff: data || [] });
    }

    // POST: Cấp quyền hoặc tước quyền Staff/Admin
    if (req.method === "POST" || req.method === "DELETE") {
      if (staff.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "Chỉ quản trị viên cấp cao (Admin) mới có quyền cấp/tước quyền staff.",
        });
      }

      const { action, targetUserId, targetEmail, email, role, fullName } = req.body || {};

      // SUB-ACTION: REVOKE STAFF
      if (action === "revoke" || req.method === "DELETE") {
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
        } else if (email) {
          query = query.eq("email", email.toLowerCase().trim());
        } else {
          return res.status(400).json({ success: false, error: "Thiếu thông tin người dùng cần tước quyền." });
        }

        const { error } = await query;
        if (error) throw error;

        return res.status(200).json({
          success: true,
          message: "Đã thu hồi quyền quản trị thành công.",
        });
      }

      // SUB-ACTION: GRANT / INVITE STAFF
      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ success: false, error: "Email không hợp lệ." });
      }

      const cleanEmail = email.toLowerCase().trim();
      const targetRole = ["admin", "moderator", "viewer"].includes(role) ? role : "viewer";

      // 0. RÀNG BUỘC 1 GMAIL = 1 ROLE DUY NHẤT: Không cấp quyền Admin cho Gmail đang giữ vai trò Shop
      const { data: existingShopInvite } = await supabase
        .from("shop_invitations")
        .select("id, shops(name)")
        .eq("invited_email", cleanEmail)
        .neq("status", "revoked")
        .maybeSingle();

      if (existingShopInvite) {
        const shopName = (existingShopInvite.shops as any)?.name || "một shop đối tác";
        return res.status(400).json({
          success: false,
          error: `Email ${cleanEmail} đã được đăng ký vai trò Đối tác Shop ("${shopName}"). Mỗi tài khoản Gmail chỉ được đăng ký duy nhất 1 vai trò!`,
        });
      }

      // 1. Tìm user trong auth.users nếu đã từng đăng nhập
      let existingUid: string | null = null;
      try {
        const { data: userList } = await supabase.auth.admin.listUsers();
        const existingUser = userList?.users?.find(
          (u: any) => (u.email || "").toLowerCase() === cleanEmail
        );
        if (existingUser) existingUid = existingUser.id;
      } catch (e) {
        console.warn("Could not list auth users, proceeding with email-only staff grant:", e);
      }

      // 2. Upsert vào staff_members theo email
      const { error: upsertErr } = await supabase
        .from("staff_members")
        .upsert(
          {
            user_id: existingUid,
            email: cleanEmail,
            full_name: fullName?.trim() || cleanEmail.split("@")[0],
            role: targetRole,
            is_active: true,
          },
          { onConflict: "email" }
        );

      if (upsertErr) throw upsertErr;

      return res.status(200).json({
        success: true,
        message: `Đã cấp quyền ${targetRole} thành công cho ${cleanEmail}.`,
      });
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  } catch (err: any) {
    console.error("[admin/staff] Error:", err.message);
    return res.status(500).json({ success: false, error: err.message || "Lỗi xử lý quyền staff." });
  }
}
