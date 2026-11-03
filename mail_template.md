# Mẫu Email Thông Báo Duyệt Đăng Ký Shop (Tí Coolture)

## 1. Đánh giá Template ban đầu
- **Ưu điểm:** Giọng văn gần gũi, xưng "Tí", tôn trọng đối tác, làm rõ chính sách đồng hành miễn phí.
- **Điểm cần cải tiến:**
  1. *Ngữ cảnh:* Bản cũ ghi *"email của bạn đã được xác nhận thành công"*. Cần sửa thành *"đơn đăng ký mở shop của bạn đã được duyệt thành công"* để khớp với luồng thực tế (Admin Tí duyệt hồ sơ tuyển chọn sau khi shop đăng ký ở `/open-shop`).
  2. *Phương thức đăng nhập:* Hệ thống Tí Coolture Portal xác thực qua **Google Login**. Cần có lưu ý quan trọng: *Bắt buộc dùng đúng tài khoản Gmail đã đăng ký* để tránh trường hợp shop đăng nhập bằng Gmail khác rồi bị báo lỗi "Email chưa được cấp quyền".
  3. *Đường link:* Điền link chuẩn của Portal: `https://ticoolture.vn/portal`.

---

## 2. Bản Mẫu Nội Dung Hoàn Thiện (Markdown / Plain Text)

**Tiêu đề:** `[Tí Coolture] Chúc mừng! Đơn đăng ký mở shop "{{shop_name}}" đã được duyệt thành công 🎉`

```text
Chào {{shop_name}},

Tí xin chúc mừng và thông báo rằng đơn đăng ký mở shop của bạn đã được đội ngũ Tí Coolture phê duyệt chính thức! 🎉

Vậy là shop đã hoàn tất bước xét duyệt hồ sơ và chính thức có thể bắt đầu hành trình đồng hành cùng Tí Coolture rồi!

Giờ đây, bạn có thể truy cập trang quản lý shop (Portal) để thiết lập thông tin thương hiệu, đăng tải và chỉnh sửa các sản phẩm sáng tạo của mình. Tí sẽ giúp sản phẩm của shop có thêm cơ hội tiếp cận cộng đồng yêu thích local brand và nghệ sĩ sáng tạo Việt Nam, hoàn toàn miễn phí.

👉 TRUY CẬP TRANG QUẢN LÝ SHOP:
https://ticoolture.vn/portal

💡 LƯU Ý KHI ĐĂNG NHẬP:
Khi truy cập trang quản lý, vui lòng bấm "Đăng nhập bằng Google" và chọn đúng tài khoản Gmail ({{applicant_email}}) mà shop đã dùng để đăng ký để được hệ thống tự động nhận diện quyền quản lý.

Tí rất vui khi có bạn đồng hành và hy vọng sẽ cùng shop đưa những sản phẩm sáng tạo Việt đến gần hơn với mọi người.

Thân mến,
Tí Coolture Team
Nơi tuyển chọn local brand và artist Việt
Website: https://ticoolture.vn
```

---

## 3. Bản Mẫu Giao Diện HTML (Automated Email)
Hệ thống tự động sử dụng template HTML chuẩn email tại `api/_lib/mailer.ts`:
- Tone màu: Đỏ cam đất thương hiệu Tí Coolture (`#c2410c` & `#ea580c`).
- Nút bấm Call-To-Action (CTA): Nổi bật, dễ bấm trên điện thoại di động.
- Khung lưu ý đăng nhập: Nổi bật màu vàng hổ phách (`amber`), chống nhầm tài khoản Google.

```

---

## 3. Bản Mẫu Giao Diện HTML (Automated Email)
Hệ thống tự động sử dụng template HTML chuẩn email tại `api/_lib/mailer.ts`:
- Tone màu: Đỏ cam đất thương hiệu Tí Coolture (`#c2410c` & `#ea580c`).
- Nút bấm Call-To-Action (CTA): Nổi bật, dễ bấm trên điện thoại di động.
- Khung lưu ý đăng nhập: Nổi bật màu vàng hổ phách (`amber`), chống nhầm tài khoản Google.