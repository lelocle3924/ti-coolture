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

    // POST: Cấp quyền Admin/Staff cho một Gmail khác
    if (req.method === "POST") {
      if (staff.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "Chỉ quản trị viên cấp cao (Admin) mới có quyền cấp/tước quyền staff.",
        });
      }

      const { email, role, fullName } = req.body || {};
      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ success: false, error: "Email không hợp lệ." });
      }

      const targetEmail = email.toLowerCase().trim();
      const targetRole = ["admin", "moderator", "viewer"].includes(role) ? role : "viewer";

      // 1. Tìm user trong auth.users nếu đã từng đăng nhập
      let existingUid: string | null = null;
      try {
        const { data: userList } = await supabase.auth.admin.listUsers();
        const existingUser = userList?.users?.find(
          (u: any) => (u.email || "").toLowerCase() === targetEmail
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
            email: targetEmail,
            full_name: fullName?.trim() || targetEmail.split("@")[0],
            role: targetRole,
            is_active: true,
          },
          { onConflict: "email" }
        );

      if (upsertErr) throw upsertErr;

      return res.status(200).json({
        success: true,
        message: `Đã cấp quyền ${targetRole} thành công cho ${targetEmail}.`,
      });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  } catch (err: any) {
    console.error("[admin/staff] Error:", err.message);
    return res.status(500).json({ success: false, error: err.message || "Lỗi xử lý quyền staff." });
  }
}
