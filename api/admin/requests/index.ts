import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateStaffMember } from "../../_lib/supabaseAuth.js";
import { getSupabaseAdmin } from "../../_lib/supabaseAdmin.js";
import { sendShopApprovalEmail } from "../../_lib/mailer.js";
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

    // GET: List all partner requests from main website
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("partner_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return res.status(200).json({ success: true, requests: data || [] });
    }

    // POST: Review request (Approve & Grant Shop, Reject, Resend Email, or Test Email)
    if (req.method === "POST") {
      const { requestId, action, notes, testEmail } = req.body || {};

      // SUB-ACTION: TEST EMAIL CONFIGURATION
      if (action === "test_email") {
        const recipient = (testEmail || staff.userEmail || "").trim();
        if (!recipient || !recipient.includes("@")) {
          return res.status(400).json({ success: false, error: "Email nhận thử nghiệm không hợp lệ." });
        }

        const mailResult = await sendShopApprovalEmail({
          shopName: "Shop Demo Tí Coolture",
          toEmail: recipient,
        });

        return res.status(200).json({
          success: mailResult.success,
          message: mailResult.success
            ? `Đã gửi email thử nghiệm thành công tới ${recipient}!`
            : `Gửi mail thất bại: ${mailResult.error || "Lỗi cấu hình mail."}`,
          mailStatus: mailResult,
        });
      }

      if (!requestId || !["approve", "reject", "resend_email"].includes(action)) {
        return res.status(400).json({ success: false, error: "Tham số không hợp lệ." });
      }

      // Fetch request details
      const { data: requestItem, error: fetchErr } = await supabase
        .from("partner_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (fetchErr || !requestItem) {
        return res.status(404).json({ success: false, error: "Không tìm thấy yêu cầu đối tác." });
      }

      const email = requestItem.applicant_email.toLowerCase().trim();
      const publicDomain = (process.env.VITE_SITE_URL || "https://ticoolture.vn").replace(/\/+$/, "");
      const portalUrl = `${publicDomain}/portal`;

      // SUB-ACTION: RESEND EMAIL LINK PORTAL
      if (action === "resend_email") {
        const mailResult = await sendShopApprovalEmail({
          shopName: requestItem.shop_name.trim(),
          toEmail: email,
          portalUrl,
        });

        return res.status(200).json({
          success: mailResult.success,
          message: mailResult.success
            ? `Đã gửi lại link Portal thành công tới email ${email}!`
            : `Gửi mail thất bại: ${mailResult.error || "Lỗi cấu hình mail."}`,
          error: mailResult.success ? undefined : (mailResult.error || "Lỗi cấu hình mail."),
          mailStatus: mailResult,
        });
      }

      if (requestItem.status !== "pending") {
        return res.status(409).json({
          success: false,
          error: "Yêu cầu này không còn ở trạng thái chờ duyệt.",
        });
      }

      if (action === "reject") {
        const { error: rejectErr } = await supabase
          .from("partner_requests")
          .update({
            status: "rejected",
            reviewed_by: staff.userId,
            reviewed_at: new Date().toISOString(),
            notes: notes || "Không phù hợp tiêu chí tuyển chọn tại thời điểm này.",
          })
          .eq("id", requestId);

        if (rejectErr) throw rejectErr;

        return res.status(200).json({
          success: true,
          message: `Đã từ chối yêu cầu của shop "${requestItem.shop_name}".`,
        });
      }

      // APPROVE ACTION:
      // Kiểm tra nếu đây là yêu cầu CẬP NHẬT PROFILE shop
      let profilePayload: any = null;
      try {
        if (requestItem.notes) {
          const parsed = JSON.parse(requestItem.notes);
          if (parsed && parsed.type === "profile_update") {
            profilePayload = parsed;
          }
        }
      } catch {}

      if (profilePayload && profilePayload.shop_id) {
        const { error: approveProfileErr } = await supabase.rpc(
          "approve_shop_profile_request",
          { p_request_id: requestId, p_staff_user_id: staff.userId }
        );
        if (approveProfileErr) throw approveProfileErr;

        return res.status(200).json({
          success: true,
          message: `Đã duyệt và áp dụng cập nhật profile cho shop "${requestItem.shop_name}"!`,
        });
      }

      // 1. Ràng buộc 1 Gmail = 1 Role duy nhất
      const { data: existingStaff } = await supabase
        .from("staff_members")
        .select("id, role")
        .eq("email", email)
        .eq("is_active", true)
        .maybeSingle();

      if (existingStaff) {
        return res.status(400).json({
          success: false,
          error: `Email ${email} đã được đăng ký vai trò Ban Quản Trị (Admin). Mỗi tài khoản Gmail chỉ được đăng ký duy nhất 1 vai trò!`,
        });
      }

      // Ràng buộc 1 Gmail = 1 Shop
      const { data: existingInvite } = await supabase
        .from("shop_invitations")
        .select("id, status, shops(name)")
        .eq("invited_email", email)
        .neq("status", "revoked")
        .maybeSingle();

      if (existingInvite) {
        const existingShop = (existingInvite.shops as any)?.name || "một shop khác";
        return res.status(400).json({
          success: false,
          error: `Email ${email} đã được cấp quyền quản lý cho shop "${existingShop}". Mỗi tài khoản Gmail chỉ được mở 1 shop duy nhất.`,
        });
      }

      // 2. Tạo shop mới
      const baseSlug = slugify(requestItem.shop_name);
      const uniqueSuffix = crypto.randomBytes(2).toString("hex");
      const shopSlug = `${baseSlug}-${uniqueSuffix}`;

      const { data: newShop, error: createShopErr } = await supabase
        .from("shops")
        .insert({
          name: requestItem.shop_name.trim(),
          slug: shopSlug,
          contact_email: email,
          story_vi: requestItem.description || null,
          status: "published",
        })
        .select("id")
        .single();

      if (createShopErr || !newShop) {
        throw new Error("Không thể tạo shop mới: " + (createShopErr?.message || ""));
      }

      // 3. Cấp quyền shop_invitations
      await supabase
        .from("shop_invitations")
        .upsert(
          {
            shop_id: newShop.id,
            invited_email: email,
            shop_role: "owner",
            status: "pending",
            created_by: staff.userId,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "invited_email" }
        );

      // 4. Đánh dấu request approved
      await supabase
        .from("partner_requests")
        .update({
          status: "approved",
          reviewed_by: staff.userId,
          reviewed_at: new Date().toISOString(),
          notes: notes || "Đã duyệt và cấp quyền mở shop thành công.",
        })
        .eq("id", requestId);

      // 5. Gửi automail cho shop
      const mailResult = await sendShopApprovalEmail({
        shopName: requestItem.shop_name.trim(),
        toEmail: email,
        portalUrl,
      });

      const message = mailResult.success
        ? `Đã duyệt, cấp quyền và tự động gửi email link Portal cho ${email} thành công!`
        : `Đã duyệt và cấp quyền shop thành công. (Lưu ý: Tự động gửi email chưa hoàn tất: ${mailResult.error || "Chưa gửi được mail"})`;

      return res.status(200).json({
        success: true,
        message,
        mailStatus: mailResult,
      });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  } catch (err: any) {
    console.error("[admin/requests] Error:", err.message);
    return res.status(500).json({ success: false, error: err.message || "Lỗi xử lý yêu cầu đối tác." });
  }
}
