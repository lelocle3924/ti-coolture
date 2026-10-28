/**
 * Telegram Bot Notification Helper for Tí Coolture Admin Alerts.
 * Designed to be completely resilient: never fails or crashes the parent API if
 * Telegram is unconfigured or experiences network issues.
 */

export interface ProductSubmissionNotification {
  shopName: string;
  shopEmail: string;
  productName: string;
  productId: string;
  imageCount: number;
  priceVnd?: number | null;
}

/**
 * Formats a number to Vietnamese Dong string (e.g. 450.000 đ)
 */
function formatVND(amount?: number | null): string {
  if (amount === undefined || amount === null) return "Liên hệ shop";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

/**
 * Sends a notification message to the Admin Telegram Bot.
 */
export async function notifyAdminProductSubmission(
  payload: ProductSubmissionNotification
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const rawChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!botToken || !rawChatId) {
    console.info(
      "[Telegram] Skipping notification: TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID not configured."
    );
    return false;
  }

  const chatIds = rawChatId.split(",").map((c) => c.trim()).filter(Boolean);
  const publicDomain = (process.env.VITE_SITE_URL || "https://ticoolture.vn").replace(/\/+$/, "");
  const previewUrl = `${publicDomain}/admin/preview/product/${payload.productId}`;

  const message = [
    `🔔 *[TÍ COOLTURE] SẢN PHẨM MỚI CHỜ DUYỆT*`,
    ``,
    `🏪 *Shop:* ${payload.shopName}`,
    `📧 *Email đối tác:* \`${payload.shopEmail}\``,
    `📦 *Sản phẩm:* *${payload.productName}*`,
    `💰 *Giá niêm yết:* ${formatVND(payload.priceVnd)}`,
    `🖼 *Số lượng ảnh:* ${payload.imageCount} ảnh`,
    ``,
    `👉 [Bấm vào đây để xem trước và duyệt](${previewUrl})`,
  ].join("\n");

  try {
    await Promise.all(
      chatIds.map((cid) =>
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: cid,
            text: message,
            parse_mode: "Markdown",
            disable_web_page_preview: false,
          }),
        })
      )
    );
    return true;
  } catch (err: any) {
    console.error("[Telegram] Network error sending notification:", err.message);
    return false;
  }
}

export interface ShopProfileUpdateNotification {
  shopName: string;
  shopEmail: string;
  updatedFields: string[];
}

/**
 * Sends Telegram notification when a shop submits a profile change request.
 */
export async function notifyAdminShopProfileUpdate(
  payload: ShopProfileUpdateNotification
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const rawChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!botToken || !rawChatId) return false;

  const chatIds = rawChatId.split(",").map((c) => c.trim()).filter(Boolean);
  const message = [
    `🔔 *[TÍ COOLTURE] SHOP CẬP NHẬT PROFILE CHỜ DUYỆT*`,
    ``,
    `🏪 *Shop:* ${payload.shopName}`,
    `📧 *Email đối tác:* \`${payload.shopEmail}\``,
    `📝 *Các mục đã chỉnh sửa:* ${payload.updatedFields.join(", ")}`,
    ``,
    `👉 Vui lòng vào Portal Admin (tab "Yêu cầu đối tác") để thẩm định và bấm duyệt.`,
  ].join("\n");

  try {
    await Promise.all(
      chatIds.map((cid) =>
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: cid,
            text: message,
            parse_mode: "Markdown",
            disable_web_page_preview: false,
          }),
        })
      )
    );
    return true;
  } catch (err: any) {
    console.error("[Telegram] Error sending profile update notification:", err.message);
    return false;
  }
}
