import nodemailer from "nodemailer";

export interface SendShopApprovalEmailParams {
  shopName: string;
  toEmail: string;
  portalUrl?: string;
}

export interface MailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  code?: string;
}

/**
 * Tạo nội dung Plain Text từ template email duyệt mở shop
 */
export function generateShopApprovalText(params: {
  shopName: string;
  toEmail: string;
  portalUrl: string;
}): string {
  const { shopName, toEmail, portalUrl } = params;

  return `Chào ${shopName},

Tí xin thông báo rằng đơn đăng ký mở shop của bạn đã được duyệt thành công! 🎉

Vậy là shop đã hoàn tất bước xét duyệt hồ sơ và chính thức có thể bắt đầu hành trình đồng hành cùng Tí Coolture rồi!

Giờ đây, bạn có thể truy cập trang quản lý shop (Portal) để thiết lập thông tin thương hiệu, đăng tải và chỉnh sửa các sản phẩm sáng tạo của mình. Tí sẽ giúp sản phẩm của shop có thêm cơ hội tiếp cận cộng đồng yêu thích local brand và nghệ sĩ sáng tạo Việt Nam, hoàn toàn miễn phí.

👉 TRUY CẬP TRANG QUẢN LÝ SHOP:
${portalUrl}

💡 LƯU Ý KHI ĐĂNG NHẬP:
Vui lòng bấm "Đăng nhập bằng Google" và chọn đúng tài khoản Gmail (${toEmail}) mà shop đã dùng để đăng ký để được tự động nhận diện quyền quản lý shop.

Tí rất vui khi có bạn đồng hành và hy vọng sẽ cùng shop đưa những sản phẩm sáng tạo Việt đến gần hơn với mọi người.

Thân mến,
Tí Coolture Team
Nơi tuyển chọn local brand và artist Việt
Website: https://ticoolture.vn
`;
}

/**
 * Tạo nội dung HTML responsive, chuẩn brand guidelines Tí Coolture:
 * Palette: Violet #7520f7 (60%) · White/Paper #faf8ff (30%) · Teal #39d6cf (10%) · Ink #12081f
 */
export function generateShopApprovalHtml(params: {
  shopName: string;
  toEmail: string;
  portalUrl: string;
}): string {
  const { shopName, toEmail, portalUrl } = params;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Đơn đăng ký shop đã được duyệt thành công - Tí Coolture</title>
</head>
<body style="margin: 0; padding: 0; background-color: #faf8ff; font-family: 'Alexandria', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #12081f; line-height: 1.6;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #faf8ff; padding: 36px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e4e0ec; overflow: hidden; box-shadow: 0 10px 30px rgba(18, 8, 31, 0.06);">
          
          <!-- Header Banner (Dark Ink with Brand Violet & Teal accent) -->
          <tr>
            <td style="background: linear-gradient(135deg, #12081f 0%, #1e0e33 60%, #291245 100%); padding: 36px 24px; text-align: center; border-bottom: 3px solid #7520f7;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
                TÍ COOLTURE
              </h1>
              <div style="width: 36px; height: 3px; background-color: #39d6cf; margin: 10px auto 8px; border-radius: 9999px;"></div>
              <p style="margin: 0; color: #39d6cf; font-size: 13px; font-weight: 500; letter-spacing: 0.5px;">
                Nơi tuyển chọn local brand & artist Việt
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 30px;">
              <h2 style="margin: 0 0 18px; color: #7520f7; font-size: 21px; font-weight: 700; letter-spacing: -0.3px;">
                Hồ sơ mở shop đã được duyệt! 🎉
              </h2>

              <p style="margin: 0 0 14px; font-size: 15px; color: #12081f;">
                Chào <strong>${shopName}</strong>,
              </p>

              <p style="margin: 0 0 14px; font-size: 15px; color: #373042; line-height: 1.65;">
                Tí xin chúc mừng và thông báo rằng đơn đăng ký mở shop của bạn đã được đội ngũ Tí Coolture <strong>phê duyệt chính thức</strong>.
              </p>

              <p style="margin: 0 0 24px; font-size: 15px; color: #373042; line-height: 1.65;">
                Giờ đây, bạn đã có thể truy cập hệ thống quản trị để cập nhật câu chuyện thương hiệu, tải lên và chỉnh sửa danh mục sản phẩm của mình — <strong>hoàn toàn miễn phí</strong>. Tí sẽ giúp đưa sản phẩm của shop tiếp cận cộng đồng yêu thích sáng tạo Việt Nam.
              </p>

              <!-- CTA Button (Brand Violet #7520f7) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" target="_blank" style="display: inline-block; background-color: #7520f7; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 15px 32px; border-radius: 9999px; box-shadow: 0 6px 18px rgba(117, 32, 247, 0.35); letter-spacing: 0.3px;">
                      👉 Vào Trang Quản Lý Shop
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Notice Box (Violet & Teal Accented) -->
              <div style="background-color: #f7f4fd; border: 1px solid #e8dffb; border-left: 4px solid #7520f7; border-radius: 10px; padding: 16px 18px; margin: 26px 0;">
                <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #5a12c6;">
                  💡 Lưu ý quan trọng khi đăng nhập:
                </p>
                <p style="margin: 0; font-size: 13px; color: #493c60; line-height: 1.6;">
                  Khi truy cập Portal, vui lòng bấm <strong>"Đăng nhập bằng Google"</strong> và chọn đúng tài khoản Gmail <strong style="color: #7520f7;">${toEmail}</strong> (email đã dùng để đăng ký) để hệ thống tự động nhận diện và cấp quyền quản lý cho shop của bạn.
                </p>
              </div>

              <p style="margin: 24px 0 0; font-size: 14px; color: #493c60;">
                Tí rất vui khi có bạn đồng hành và hy vọng sẽ cùng shop đưa những sản phẩm sáng tạo Việt đến gần hơn với mọi người.
              </p>

              <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #f0ecf6;">
                <p style="margin: 0; font-size: 14px; font-weight: 700; color: #12081f;">
                  Thân mến,<br />
                  Đội ngũ Tí Coolture
                </p>
                <p style="margin: 4px 0 0; font-size: 12px; color: #7b7194; font-style: italic;">
                  Nơi tuyển chọn local brand và artist Việt
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #faf8ff; padding: 18px 24px; text-align: center; border-top: 1px solid #e4e0ec;">
              <p style="margin: 0; font-size: 12px; color: #7b7194;">
                Website chính thức: <a href="https://ticoolture.vn" style="color: #7520f7; text-decoration: none; font-weight: 600;">ticoolture.vn</a>
              </p>
              <p style="margin: 6px 0 0; font-size: 11px; color: #a39ab8;">
                Email này được gửi tự động khi đơn đăng ký shop của bạn được phê duyệt trên Tí Coolture.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Gửi email thông báo duyệt shop qua Nodemailer (Gmail/SMTP) hoặc Resend API
 */
export async function sendShopApprovalEmail(
  params: SendShopApprovalEmailParams
): Promise<MailSendResult> {
  const { shopName, toEmail } = params;
  const publicDomain = (params.portalUrl || process.env.VITE_SITE_URL || "https://ticoolture.vn").replace(/\/+$/, "");
  const portalUrl = publicDomain.endsWith("/portal") ? publicDomain : `${publicDomain}/portal`;

  const subject = `[Tí Coolture] Chúc mừng! Đơn đăng ký mở shop "${shopName}" đã được duyệt thành công 🎉`;
  const textContent = generateShopApprovalText({ shopName, toEmail, portalUrl });
  const htmlContent = generateShopApprovalHtml({ shopName, toEmail, portalUrl });

  // 1. Kiểm tra nếu có cấu hình Resend API
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const rawFrom = process.env.MAIL_FROM || "Tí Coolture <portal@ticoolture.vn>";
      const fromEmail = rawFrom.trim().replace(/^["']|["']$/g, "").trim();
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey.trim().replace(/^["']|["']$/g, "")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject,
          html: htmlContent,
          text: textContent,
        }),
      });

      const resData = (await res.json()) as any;
      if (!res.ok) {
        throw new Error(resData?.message || JSON.stringify(resData));
      }

      console.info(`[Mailer:Resend] Email sent to ${toEmail} (id: ${resData.id})`);
      return { success: true, messageId: resData.id };
    } catch (err: any) {
      console.error("[Mailer:Resend] Error sending email:", err.message);
      return { success: false, error: err.message, code: "RESEND_ERROR" };
    }
  }

  // 2. Cấu hình SMTP (Gmail hoặc Custom SMTP)
  const smtpUser = process.env.SMTP_USER || process.env.shop_gmail;
  const smtpPass = process.env.SMTP_PASS || process.env.shop_password;
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : smtpPort === 465;

  if (!smtpUser || !smtpPass) {
    console.warn(
      "[Mailer] Bỏ qua gửi mail: Chưa cấu hình SMTP_USER/shop_gmail hoặc SMTP_PASS/shop_password."
    );
    return {
      success: false,
      error: "Chưa cấu hình tài khoản gửi mail trong biến môi trường.",
      code: "NO_CREDENTIALS",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const senderName = process.env.SMTP_SENDER_NAME || "Tí Coolture";
    const from = process.env.MAIL_FROM || `"${senderName}" <${smtpUser}>`;

    const info = await transporter.sendMail({
      from,
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.info(`[Mailer:SMTP] Email sent successfully to ${toEmail} (messageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    let friendlyError = err.message || "Lỗi gửi mail qua SMTP";
    if (err.message && err.message.includes("535-5.7.8")) {
      friendlyError =
        "Xác thực Gmail thất bại. Tài khoản Gmail cần dùng Mật khẩu ứng dụng (App Password 16 ký tự), không dùng mật khẩu cá nhân thông thường.";
    }

    console.error("[Mailer:SMTP] Failed to send email to", toEmail, ":", err.message);
    return {
      success: false,
      error: friendlyError,
      code: "SMTP_ERROR",
    };
  }
}
