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

    // 1. Cập nhật bảng shops
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

    const { error: shopErr } = await supabase
      .from("shops")
      .update(updatePayload)
      .eq("id", shopContext.shopId);

    if (shopErr) {
      throw new Error("Lỗi khi cập nhật thông tin xưởng: " + shopErr.message);
    }

    // 2. Cập nhật mạng xã hội trong shop_socials nếu có
    if (socials && typeof socials === "object") {
      const platforms = ["instagram", "tiktok", "facebook", "threads", "website", "zalo"] as const;
      for (const p of platforms) {
        const url = socials[p]?.trim();
        if (url) {
          await supabase.from("shop_socials").upsert(
            {
              shop_id: shopContext.shopId,
              platform: p,
              url,
              is_visible: true,
            },
            { onConflict: "shop_id,platform" }
          );
        } else {
          await supabase
            .from("shop_socials")
            .delete()
            .eq("shop_id", shopContext.shopId)
            .eq("platform", p);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Lưu thông tin xưởng thành công.",
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
