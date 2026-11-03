import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// 1. Tự động đọc .env.local
const envPath = path.join(rootDir, ".env.local");
const envVars = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx > -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      envVars[key] = val;
    }
  }
}

const resendApiKey = envVars["RESEND_API_KEY"] || process.env.RESEND_API_KEY;
const targetEmail = process.argv[2] || envVars["shop_gmail"] || "american3924@gmail.com";
const portalUrl = "https://ticoolture.vn/portal";

function generateShopApprovalHtml(params) {
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
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e4e0ec; overflow: hidden; box-shadow: 0 10px 30px rgba(18, 8, 31, 0.06);">
          <tr>
            <td style="padding: 40px 32px 32px;">
              <h2 style="margin: 0 0 18px; color: #7520f7; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">Hồ sơ mở shop đã được duyệt! 🎉</h2>
              <p style="margin: 0 0 14px; font-size: 15px; color: #12081f;">Chào <strong>${shopName}</strong>,</p>
              <p style="margin: 0 0 14px; font-size: 15px; color: #373042; line-height: 1.65;">Tí xin chúc mừng và thông báo rằng đơn đăng ký mở shop của bạn đã được đội ngũ Tí Coolture <strong>phê duyệt chính thức</strong>.</p>
              <p style="margin: 0 0 24px; font-size: 15px; color: #373042; line-height: 1.65;">Giờ đây, bạn đã có thể truy cập hệ thống quản trị để cập nhật câu chuyện thương hiệu, tải lên và chỉnh sửa danh mục sản phẩm của mình — <strong>hoàn toàn miễn phí</strong>. Tí sẽ giúp đưa sản phẩm của shop tiếp cận cộng đồng yêu thích sáng tạo Việt Nam.</p>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" target="_blank" style="display: inline-block; background-color: #7520f7; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 15px 32px; border-radius: 9999px; box-shadow: 0 6px 18px rgba(117, 32, 247, 0.35); letter-spacing: 0.3px;">👉 Vào Trang Quản Lý Shop</a>
                  </td>
                </tr>
              </table>
              <div style="background-color: #f7f4fd; border: 1px solid #e8dffb; border-left: 4px solid #7520f7; border-radius: 10px; padding: 16px 18px; margin: 26px 0;">
                <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #5a12c6;">💡 Lưu ý quan trọng khi đăng nhập:</p>
                <p style="margin: 0; font-size: 13px; color: #493c60; line-height: 1.6;">Khi truy cập Portal, vui lòng bấm <strong>"Đăng nhập bằng Google"</strong> và chọn đúng tài khoản Gmail <strong style="color: #7520f7;">${toEmail}</strong> (email đã dùng để đăng ký) để hệ thống tự động nhận diện và cấp quyền quản lý cho shop của bạn.</p>
              </div>
              <p style="margin: 24px 0 0; font-size: 14px; color: #493c60;">Tí rất vui khi có bạn đồng hành và hy vọng sẽ cùng shop đưa những sản phẩm sáng tạo Việt đến gần hơn với mọi người.</p>
              <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #f0ecf6;">
                <p style="margin: 0; font-size: 14px; font-weight: 700; color: #12081f;">Thân mến,<br />Đội ngũ Tí Coolture</p>
                <p style="margin: 4px 0 0; font-size: 12px; color: #7b7194; font-style: italic;">Nơi tuyển chọn local brand và artist Việt</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #faf8ff; padding: 18px 24px; text-align: center; border-top: 1px solid #e4e0ec;">
              <p style="margin: 0; font-size: 12px; color: #7b7194;">Website chính thức: <a href="https://ticoolture.vn" style="color: #7520f7; text-decoration: none; font-weight: 600;">ticoolture.vn</a></p>
              <p style="margin: 6px 0 0; font-size: 11px; color: #a39ab8;">Email này được gửi tự động khi đơn đăng ký shop của bạn được phê duyệt trên Tí Coolture.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const htmlContent = generateShopApprovalHtml({
  shopName: "Shop Demo Tí Coolture",
  toEmail: targetEmail,
  portalUrl,
});

console.log("=== KIỂM TRA HỆ THỐNG GỬI EMAIL TÍ COOLTURE ===");
console.log("- Người nhận thử nghiệm:", targetEmail);

// KÊNH 1: RESEND API
if (resendApiKey) {
  console.log("- Phương thức: Resend API");
  const rawFrom = envVars["MAIL_FROM"] || "Tí Coolture <portal@ticoolture.vn>";
  const fromEmail = rawFrom.trim().replace(/^["']|["']$/g, "");
  console.log("- From:", fromEmail);
  console.log("⏳ Đang gửi mail qua Resend...");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey.trim().replace(/^["']|["']$/g, "")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [targetEmail],
        subject: '[Tí Coolture] Chúc mừng! Đơn đăng ký mở shop "Shop Demo Tí Coolture" đã được duyệt thành công 🎉',
        html: htmlContent,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || JSON.stringify(data));
    }

    console.log("🎉 GỬI EMAIL QUA RESEND THÀNH CÔNG!");
    console.log("- Email ID:", data.id);
    process.exit(0);
  } catch (err) {
    console.error("❌ LỖI GỬI RESEND:", err.message);
    process.exit(1);
  }
}

// KÊNH 2: SMTP / GMAIL
const user = envVars["SMTP_USER"] || envVars["shop_gmail"];
const pass = envVars["SMTP_PASS"] || envVars["shop_password"];
const host = envVars["SMTP_HOST"] || "smtp.gmail.com";
const port = Number(envVars["SMTP_PORT"] || 465);

if (!user || !pass) {
  console.error("❌ LỖI: Chưa có RESEND_API_KEY hoặc tài khoản SMTP trong .env.local");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
});

try {
  console.log("⏳ Đang xác thực SMTP...");
  await transporter.verify();
  console.log("✅ Kết nối SMTP thành công!");

  const info = await transporter.sendMail({
    from: `"Tí Coolture" <${user}>`,
    to: targetEmail,
    subject: `[Tí Coolture] Chúc mừng! Đơn đăng ký mở shop đã được duyệt thành công 🎉`,
    html: htmlContent,
  });
  console.log("🎉 GỬI EMAIL THÀNH CÔNG! ID:", info.messageId);
} catch (err) {
  console.error("❌ GỬI MAIL THẤT BẠI:", err.message);
}
