import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyPortalToken } from "../_lib/supabaseAdmin.js";
import { createPresignedUploadUrls, type FileUploadRequest } from "../_lib/r2.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed. Sử dụng phương thức POST.",
    });
  }

  try {
    const { token, files } = req.body || {};

    // 1. Kiểm tra tham số đầu vào
    if (!token || typeof token !== "string") {
      return res.status(400).json({
        success: false,
        error: "Thiếu mã xác thực (token) của portal.",
      });
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Danh sách tệp tin (files) không hợp lệ hoặc đang để trống.",
      });
    }

    if (files.length > 10) {
      return res.status(400).json({
        success: false,
        error: "Mỗi lần chỉ được tạo vé tải lên tối đa 10 hình ảnh.",
      });
    }

    // 2. Xác thực Token đối tác
    const invite = await verifyPortalToken(token);

    // 3. Chuẩn hóa danh sách file
    const uploadRequests: FileUploadRequest[] = files.map((f: any) => ({
      name: String(f.name || "unnamed.webp"),
      type: String(f.type || "image/webp"),
      size: Number(f.size || 0),
    }));

    // 4. Sinh Presigned PUT URLs từ Cloudflare R2
    const tickets = await createPresignedUploadUrls(invite.shop_id, uploadRequests);

    return res.status(200).json({
      success: true,
      shopId: invite.shop_id,
      tickets,
    });
  } catch (err: any) {
    console.error("[upload-ticket] Error:", err.message);

    const isClientError =
      err.message.includes("không hợp lệ") ||
      err.message.includes("hết hạn") ||
      err.message.includes("not allowed") ||
      err.message.includes("exceeds");

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      error: err.message || "Không thể khởi tạo vé tải ảnh lên R2.",
    });
  }
}
