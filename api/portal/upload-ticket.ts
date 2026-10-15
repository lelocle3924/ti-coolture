import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateShopMember } from "../_lib/supabaseAuth.js";
import { verifyPortalToken } from "../_lib/supabaseAdmin.js";
import { createPresignedUploadUrls, type FileUploadRequest } from "../_lib/r2.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

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
    const authHeader = req.headers.authorization;

    // 1. Xác thực danh tính: Ưu tiên Google OAuth JWT, fallback qua Token nếu có
    let shopId: string;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const shopContext = await authenticateShopMember(authHeader);
      shopId = shopContext.shopId;
    } else if (token && typeof token === "string") {
      const invite = await verifyPortalToken(token);
      shopId = invite.shop_id;
    } else {
      return res.status(401).json({
        success: false,
        error: "Yêu cầu đăng nhập tài khoản Google để tải ảnh lên.",
      });
    }

    // 2. Kiểm tra danh sách tệp tin
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

    // 3. Chuẩn hóa danh sách file
    const uploadRequests: FileUploadRequest[] = files.map((f: any) => ({
      name: String(f.name || "unnamed.webp"),
      type: String(f.type || "image/webp"),
      size: Number(f.size || 0),
    }));

    // 4. Sinh Presigned PUT URLs từ Cloudflare R2
    const tickets = await createPresignedUploadUrls(shopId, uploadRequests);

    return res.status(200).json({
      success: true,
      shopId,
      tickets,
    });
  } catch (err: any) {
    console.error("[upload-ticket] Error:", err.message);

    const isClientError =
      err.message.includes("không hợp lệ") ||
      err.message.includes("hết hạn") ||
      err.message.includes("chưa được cấp quyền") ||
      err.message.includes("đăng nhập") ||
      err.message.includes("not allowed") ||
      err.message.includes("exceeds");

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      error: err.message || "Không thể khởi tạo vé tải ảnh lên R2.",
    });
  }
}
