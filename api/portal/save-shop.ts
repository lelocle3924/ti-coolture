import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateShopMember } from "../_lib/supabaseAuth.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { notifyAdminShopProfileUpdate } from "../_lib/telegram.js";

interface ProfileRequestPayload {
  type: "profile_update";
  shop_id: string;
  name: string;
  tagline_vi: string | null;
  story_vi: string | null;
  address: string | null;
  area_tag: string | null;
  contact_email: string | null;
  logo_url: string | null;
  cover_url: string | null;
  socials: Record<string, string>;
}

interface ProfileRequestRow {
  id: string;
  notes: string | null;
  created_at: string;
}

function parseProfileRequest(notes: unknown): ProfileRequestPayload | null {
  if (typeof notes !== "string") return null;

  try {
    const parsed = JSON.parse(notes);
    if (
      parsed &&
      parsed.type === "profile_update" &&
      typeof parsed.shop_id === "string"
    ) {
      return {
        ...parsed,
        socials:
          parsed.socials &&
          typeof parsed.socials === "object" &&
          !Array.isArray(parsed.socials)
            ? parsed.socials
            : {},
      } as ProfileRequestPayload;
    }
  } catch {
    return null;
  }

  return null;
}

function serializeProfileRequest(payload: ProfileRequestPayload): string {
  return JSON.stringify({
    ...payload,
    socials: Object.fromEntries(
      Object.entries(payload.socials).sort(([a], [b]) => a.localeCompare(b))
    ),
  });
}

function changedFields(
  previous: ProfileRequestPayload | null,
  next: ProfileRequestPayload
): string[] {
  const fieldLabels: Array<[keyof ProfileRequestPayload, string]> = [
    ["name", "Tên shop"],
    ["tagline_vi", "Khẩu hiệu"],
    ["story_vi", "Câu chuyện"],
    ["address", "Địa chỉ"],
    ["area_tag", "Khu vực"],
    ["contact_email", "Email liên hệ"],
    ["logo_url", "Ảnh đại diện (Logo)"],
    ["cover_url", "Ảnh bìa"],
    ["socials", "Mạng xã hội"],
  ];

  return fieldLabels
    .filter(([field]) => {
      if (!previous) return Boolean(next[field]);
      if (field === "socials") {
        return serializeProfileRequest({
          ...next,
          name: "",
          tagline_vi: null,
          story_vi: null,
          address: null,
          area_tag: null,
          contact_email: null,
          logo_url: null,
          cover_url: null,
        }) !== serializeProfileRequest({
          ...previous,
          name: "",
          tagline_vi: null,
          story_vi: null,
          address: null,
          area_tag: null,
          contact_email: null,
          logo_url: null,
          cover_url: null,
        });
      }
      return previous[field] !== next[field];
    })
    .map(([, label]) => label);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (!["GET", "POST", "DELETE"].includes(req.method || "")) {
    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed. Sử dụng GET, POST hoặc DELETE.",
    });
  }

  try {
    const shopContext = await authenticateShopMember(req.headers.authorization);
    const supabase = getSupabaseAdmin();
    const { data: pendingRows, error: requestFetchError } = await supabase
      .from("partner_requests")
      .select("id, notes, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (requestFetchError) throw requestFetchError;

    const shopRequests = (pendingRows || []).filter(
      (row) => parseProfileRequest(row.notes)?.shop_id === shopContext.shopId
    ) as ProfileRequestRow[];

    if (req.method === "GET") {
      const latest = shopRequests[0];
      return res.status(200).json({
        success: true,
        request: latest
          ? { id: latest.id, created_at: latest.created_at }
          : null,
      });
    }

    if (req.method === "DELETE") {
      if (shopRequests.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Không có yêu cầu cập nhật hồ sơ đang chờ để thu hồi.",
        });
      }

      const { data: withdrawnRows, error: withdrawError } = await supabase
        .from("partner_requests")
        .update({ status: "withdrawn" })
        .in("id", shopRequests.map((request) => request.id))
        .eq("status", "pending")
        .select("id");

      if (withdrawError) throw withdrawError;
      if (!withdrawnRows || withdrawnRows.length === 0) {
        return res.status(409).json({
          success: false,
          error: "Yêu cầu đã được xử lý trước đó và không thể thu hồi.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Đã thu hồi yêu cầu cập nhật hồ sơ.",
      });
    }

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

    const nextPayload: ProfileRequestPayload = {
      type: "profile_update",
      shop_id: shopContext.shopId,
      name: name.trim(),
      tagline_vi: typeof taglineVi === "string" ? taglineVi.trim() || null : null,
      story_vi: typeof storyVi === "string" ? storyVi.trim() || null : null,
      address: typeof address === "string" ? address.trim() || null : null,
      area_tag: typeof areaTag === "string" ? areaTag.trim() || null : null,
      contact_email:
        typeof contactEmail === "string" ? contactEmail.trim() || null : null,
      logo_url: typeof logoUrl === "string" ? logoUrl || null : null,
      cover_url: typeof coverUrl === "string" ? coverUrl || null : null,
      socials:
        socials && typeof socials === "object" && !Array.isArray(socials)
          ? Object.fromEntries(
              Object.entries(socials).map(([platform, url]) => [
                platform,
                String(url || "").trim(),
              ])
            )
          : {},
    };

    const latestRequest = shopRequests[0];
    const previousPayload = latestRequest
      ? parseProfileRequest(latestRequest.notes)
      : null;
    const hasChanges =
      !previousPayload ||
      serializeProfileRequest(previousPayload) !== serializeProfileRequest(nextPayload);
    const updatedFields = changedFields(previousPayload, nextPayload);
    const submittedAt = new Date().toISOString();
    const description = `[CẬP NHẬT PROFILE] Thay đổi: ${
      updatedFields.join(", ") || "Thông tin chung"
    }`;
    const requestData = {
      shop_name: nextPayload.name,
      applicant_email: shopContext.userEmail,
      applicant_name: shopContext.shopName,
      phone_or_zalo: nextPayload.contact_email,
      category: nextPayload.area_tag || "Chung",
      description,
      notes: JSON.stringify(nextPayload),
      status: "pending",
      created_at: hasChanges ? submittedAt : latestRequest?.created_at,
    };

    let requestId = latestRequest?.id;
    let createdAt = latestRequest?.created_at;

    if (latestRequest && shopRequests.length > 1) {
      const { error: supersedeError } = await supabase
        .from("partner_requests")
        .update({ status: "superseded" })
        .in(
          "id",
          shopRequests.slice(1).map((request) => request.id)
        )
        .eq("status", "pending");
      if (supersedeError) throw supersedeError;
    }

    if (latestRequest && hasChanges) {
      const { data: updatedRequest, error: updateError } = await supabase
        .from("partner_requests")
        .update(requestData)
        .eq("id", latestRequest.id)
        .eq("status", "pending")
        .select("id, created_at")
        .single();

      if (updateError || !updatedRequest) {
        throw updateError || new Error("Yêu cầu không còn ở trạng thái chờ duyệt.");
      }

      requestId = updatedRequest.id;
      createdAt = updatedRequest.created_at;
    } else if (!latestRequest) {
      const { data: insertedRequest, error: insertError } = await supabase
        .from("partner_requests")
        .insert(requestData)
        .select("id, created_at")
        .single();

      if (insertError || !insertedRequest) {
        throw insertError || new Error("Không thể tạo yêu cầu cập nhật hồ sơ.");
      }

      requestId = insertedRequest.id;
      createdAt = insertedRequest.created_at;
    }

    if (hasChanges) {
      await notifyAdminShopProfileUpdate({
        shopName: nextPayload.name,
        shopEmail: shopContext.userEmail,
        updatedFields: updatedFields.length > 0 ? updatedFields : ["Thông tin chung"],
      });
    }

    return res.status(200).json({
      success: true,
      pendingApproval: true,
      changed: hasChanges,
      message: hasChanges
        ? "Yêu cầu cập nhật hồ sơ xưởng đã được gửi tới Ban Quản Trị để duyệt."
        : "Thông tin không thay đổi so với yêu cầu đang chờ duyệt.",
      request: requestId ? { id: requestId, created_at: createdAt } : null,
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
