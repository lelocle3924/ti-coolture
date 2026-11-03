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

const targetEmail = process.argv[2] || envVars["shop_gmail"] || "american3924@gmail.com";
const user = envVars["SMTP_USER"] || envVars["shop_gmail"];
const pass = envVars["SMTP_PASS"] || envVars["shop_password"];
const host = envVars["SMTP_HOST"] || "smtp.gmail.com";
const port = Number(envVars["SMTP_PORT"] || 465);

console.log("=== KIỂM TRA HỆ THỐNG GỬI EMAIL TÍ COOLTURE ===");
console.log("- Người gửi (SMTP User):", user || "[Chưa cấu hình]");
console.log("- Mật khẩu:", pass ? "****** (độ dài: " + pass.length + " ký tự)" : "[Chưa cấu hình]");
console.log("- SMTP Host:", host, ":", port);
console.log("- Email người nhận test:", targetEmail);
console.log("-------------------------------------------------");

if (!user || !pass) {
  console.error("❌ LỖI: Chưa có thông tin tài khoản gửi email (shop_gmail / shop_password) trong .env.local");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
});

try {
  console.log("⏳ Đang xác thực thông tin kết nối tới Google SMTP...");
  await transporter.verify();
  console.log("✅ Kết nối máy chủ SMTP thành công!");

  console.log(`⏳ Đang gửi email thử nghiệm đến ${targetEmail}...`);
  const info = await transporter.sendMail({
    from: `"Tí Coolture" <${user}>`,
    to: targetEmail,
    subject: `[Tí Coolture] Kiểm tra tính năng AutoMail Duyệt Shop 🎉`,
    text: `Chào bạn, đây là email kiểm tra hệ thống automail của Tí Coolture gửi tới ${targetEmail}. Tính năng đã sẵn sàng hoạt động!`,
    html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; max-width: 500px;">
      <h2 style="color: #c2410c;">Kiểm tra hệ thống AutoMail thành công! 🎉</h2>
      <p>Hệ thống tự động gửi link Portal khi duyệt shop đã được kết nối và hoạt động trơn tru.</p>
      <p><strong>Người nhận:</strong> ${targetEmail}</p>
    </div>`,
  });

  console.log("🎉 GỬI EMAIL THÀNH CÔNG!");
  console.log("- Message ID:", info.messageId);
} catch (err) {
  console.error("❌ GỬI MAIL THẤT BẠI:", err.message);
  if (err.message.includes("535-5.7.8")) {
    console.log("\n💡 NGUYÊN NHÂN & CÁCH KHẮC PHỤC:");
    console.log("Tài khoản Gmail của bạn đang bật bảo mật Google hoặc chưa cấp 'Mật khẩu ứng dụng'.");
    console.log("1. Truy cập https://myaccount.google.com/apppasswords");
    console.log("2. Đặt tên ứng dụng (ví dụ: 'Ti Coolture Mailer') rồi nhấn 'Tạo'.");
    console.log("3. Copy mã 16 ký tự vừa tạo dán vào `shop_password=\"xxxx xxxx xxxx xxxx\"` trong .env.local");
    console.log("4. Chạy lại lệnh này để kiểm tra!");
  }
}

