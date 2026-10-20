import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateStaffMember } from "../../_lib/supabaseAuth.js";
import { getSupabaseAdmin } from "../../_lib/supabaseAdmin.js";
import crypto from "crypto";

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const authHeader = req.headers.authorization;
    const staff = await authenticateStaffMember(authHeader);

    const supabase = getSupabaseAdmin();

    // GET: List all invitations and shop permissions
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("shop_invitations")
        .select(`
          id,
          invited_email,
          shop_role,
          status,
          created_at,
          expires_at,
          accepted_at,
          shops (
            id,
            name,
            slug,
            status
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return res.status(200).json({ success: true, invitations: data || [] });
    }

    // POST: Cấp quyền mở shop cho 1 Gmail (Ràng buộc: 1 Gmail = 1 Shop)
    if (req.method === "POST") {
      const { email, shopId, shopName, role } = req.body || {};

      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({
          success: false,
          error: "Email Google của đối tác không hợp lệ.",
        });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const assignedRole = role === "editor" ? "editor" : "owner";

      // 1. RÀNG BUỘC: 1 GMAIL = 1 ROLE DUY NHẤT (Không được vừa là Admin vừa là Shop)
      const { data: existingStaff } = await supabase
        .from("staff_members")
        .select("id, role")
        .eq("email", normalizedEmail)
        .eq("is_active", true)
        .maybeSingle();

      if (existingStaff) {
        return res.status(400).json({
          success: false,
          error: `Email ${normalizedEmail} đã được đăng ký vai trò Ban Quản Trị (Admin). Mỗi tài khoản Gmail chỉ được đăng ký duy nhất 1 vai trò!`,
        });
      }

      // RÀNG BUỘC: 1 GMAIL = 1 SHOP DUY NHẤT
      const { data: existingInvite } = await supabase
        .from("shop_invitations")
        .select("id, shop_id, status, shops(name)")
        .eq("invited_email", normalizedEmail)
        .neq("status", "revoked")
        .maybeSingle();

      if (existingInvite) {
        const existingShopName = (existingInvite.shops as any)?.name || "một xưởng khác";
        return res.status(400).json({
          success: false,
          error: `Email ${normalizedEmail} đã được cấp quyền quản lý cho xưởng "${existingShopName}". Mỗi tài khoản Gmail chỉ được liên kết 1 xưởng duy nhất.`,
        });
      }

      let targetShopId = shopId;

      // 2. Nếu admin nhập tên shop mới thay vì chọn shop có sẵn
      if (!targetShopId && shopName) {
        const baseSlug = slugify(shopName);
        const uniqueSuffix = crypto.randomBytes(2).toString("hex");
        const shopSlug = `${baseSlug}-${uniqueSuffix}`;

        const { data: newShop, error: createShopErr } = await supabase
          .from("shops")
          .insert({
            name: shopName.trim(),
            slug: shopSlug,
            contact_email: normalizedEmail,
            status: "published",
          })
          .select("id")
          .single();

        if (createShopErr || !newShop) {
          throw new Error("Không thể tạo xưởng mới: " + (createShopErr?.message || ""));
        }
        targetShopId = newShop.id;
      }

      if (!targetShopId) {
        return res.status(400).json({
          success: false,
          error: "Vui lòng chọn xưởng có sẵn hoặc nhập tên xưởng mới.",
        });
      }

      // 3. Tạo bản ghi lời mời
      const { data: invite, error: inviteErr } = await supabase
        .from("shop_invitations")
        .upsert(
          {
            shop_id: targetShopId,
            invited_email: normalizedEmail,
            shop_role: assignedRole,
            status: "pending",
            created_by: staff.userId,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "invited_email" }
        )
        .select(`
          id,
          shop_id,
          invited_email,
          shop_role,
          status,
          shops ( name )
        `)
        .single();

      if (inviteErr || !invite) {
        throw new Error("Lỗi khi cấp quyền shop: " + (inviteErr?.message || ""));
      }

      const grantedShopName = (invite.shops as any)?.name || "";

      return res.status(200).json({
        success: true,
        message: `Đã cấp quyền mở xưởng "${grantedShopName}" thành công cho ${normalizedEmail}.`,
        invitation: invite,
      });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  } catch (err: any) {
    console.error("[admin/portal/invite] Error:", err.message);
    return res.status(500).json({
      success: false,
      error: err.message || "Không thể cấp quyền xưởng.",
    });
  }
}
