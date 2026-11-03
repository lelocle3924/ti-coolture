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
const targetEmail = process.argv[2] || envVars["shop_gmail"] || "creativespace.ticoolture@gmail.com";

console.log("=== KIỂM TRA HỆ THỐNG GỬI EMAIL TÍ COOLTURE ===");
console.log("- Người nhận thử nghiệm:", targetEmail);

// KÊNH 1: RESEND API
if (resendApiKey) {
  console.log("- Phương thức: Resend API (Key:", resendApiKey.slice(0, 6) + "...)");
  const fromEmail = envVars["MAIL_FROM"] || "Tí Coolture <onboarding@resend.dev>";
  console.log("- From:", fromEmail);
  console.log("⏳ Đang gửi mail qua Resend...");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [targetEmail],
        subject: "[Tí Coolture] Kiểm tra gửi mail Resend thành công 🎉",
        html: `<div style="font-family: sans-serif; padding: 24px; border: 1px solid #e7e5e4; border-radius: 12px; max-width: 500px;">
          <h2 style="color: #c2410c; margin-top: 0;">Resend đã kết nối thành công! 🎉</h2>
          <p>Hệ thống tự động gửi link Portal duyệt shop đã sẵn sàng.</p>
          <p><strong>Người nhận:</strong> ${targetEmail}</p>
        </div>`,
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
    if (err.message.includes("validation_error") || err.message.includes("domain")) {
      console.log("\n💡 LƯU Ý RESEND SANDBOX:");
      console.log("- Ở chế độ chưa add Domain, Resend chỉ cho phép gửi từ 'onboarding@resend.dev'");
      console.log("- Và chỉ cho phép gửi đến chính email bạn dùng tạo tài khoản Resend.");
      console.log("- Để gửi cho mọi shop: Vào Resend -> Domains -> Add domain ticoolture.vn");
    }
    process.exit(1);
  }
}

// KÊNH 2: SMTP / GMAIL
const user = envVars["SMTP_USER"] || envVars["shop_gmail"];
const pass = envVars["SMTP_PASS"] || envVars["shop_password"];
const host = envVars["SMTP_HOST"] || "smtp.gmail.com";
const port = Number(envVars["SMTP_PORT"] || 465);

console.log("- Phương thức: Google SMTP");
console.log("- Người gửi:", user || "[Chưa cấu hình]");
console.log("- Mật khẩu:", pass ? "****** (độ dài: " + pass.length + " ký tự)" : "[Chưa cấu hình]");

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
    subject: `[Tí Coolture] Kiểm tra AutoMail Duyệt Shop 🎉`,
    html: `<h2>Kiểm tra AutoMail thành công! 🎉</h2><p>Đã gửi tới: ${targetEmail}</p>`,
  });
  console.log("🎉 GỬI EMAIL THÀNH CÔNG! ID:", info.messageId);
} catch (err) {
  console.error("❌ GỬI MAIL THẤT BẠI:", err.message);
}
