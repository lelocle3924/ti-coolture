import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateShopMember } from "../_lib/supabaseAuth.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { notifyAdminShopProfileUpdate } from "../_lib/telegram.js";

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

    const {
      name,
      taglineVi,
      storyVi,
      address,
      areaTag,
      contactEmail,
      logoUrl,
      coverUrl,
      socials,
    } = req.body || {};

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "Tên xưởng là bắt buộc (tối thiểu 2 ký tự).",
      });
    }

    const supabase = getSupabaseAdmin();

    const updatePayload: Record<string, any> = {
      name: name.trim(),
      tagline_vi: taglineVi?.trim() || null,
      story_vi: storyVi?.trim() || null,
      address: address?.trim() || null,
      area_tag: areaTag?.trim() || null,
      contact_email: contactEmail?.trim() || null,
      logo_url: logoUrl || null,
      cover_url: coverUrl || null,
      updated_at: new Date().toISOString(),
    };

    // Thu thập danh sách các trường được chỉnh sửa
    const updatedFields: string[] = [];
    if (name) updatedFields.push("Tên xưởng");
    if (taglineVi) updatedFields.push("Khẩu hiệu");
    if (storyVi) updatedFields.push("Câu chuyện");
    if (address) updatedFields.push("Địa chỉ");
    if (logoUrl) updatedFields.push("Ảnh đại diện (Logo)");
    if (coverUrl) updatedFields.push("Ảnh bìa");
    if (socials && Object.values(socials).some((v) => Boolean(v))) updatedFields.push("Mạng xã hội");

    const requestPayload = {
      type: "profile_update",
      shop_id: shopContext.shopId,
      ...updatePayload,
      socials: socials || {},
    };

    // 1. Tạo yêu cầu duyệt cập nhật profile trong partner_requests
    const { error: reqErr } = await supabase.from("partner_requests").insert({
      shop_name: name.trim(),
      applicant_email: shopContext.userEmail,
      applicant_name: shopContext.shopName,
      phone_or_zalo: contactEmail || null,
      category: areaTag || "Chung",
      description: `[CẬP NHẬT PROFILE] Thay đổi: ${updatedFields.join(", ")}`,
      notes: JSON.stringify(requestPayload),
      status: "pending",
    });

    if (reqErr) {
      console.warn("[save-shop] Error creating profile request, fallback direct:", reqErr);
      // Fallback nếu bảng không nhận: ghi trực tiếp
      await supabase.from("shops").update(updatePayload).eq("id", shopContext.shopId);
    }

    // 2. Gửi thông báo duyệt qua Telegram Bot cho Admin
    try {
      await notifyAdminShopProfileUpdate({
        shopName: name.trim(),
        shopEmail: shopContext.userEmail,
        updatedFields: updatedFields.length > 0 ? updatedFields : ["Thông tin chung"],
      });
    } catch (teleErr) {
      console.warn("[save-shop] Telegram notification error:", teleErr);
    }

    return res.status(200).json({
      success: true,
      pendingApproval: true,
      message: "Yêu cầu cập nhật hồ sơ xưởng đã được gửi tới Ban Quản Trị để duyệt. Thông báo đã gửi qua Telegram!",
      shop: {
        id: shopContext.shopId,
        name: name.trim(),
        ...updatePayload,
      },
    });
  } catch (err: any) {
    console.error("[save-shop] Error:", err.message);
    const isClientError =
      err.message.includes("bắt buộc") ||
      err.message.includes("chưa được cấp quyền");

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      error: err.message || "Không thể lưu thông tin xưởng.",
    });
  }
}
