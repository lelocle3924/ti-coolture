# Mẫu Email Thông Báo Duyệt Đăng Ký Shop (Tí Coolture)

## 1. Chuẩn Brand Guidelines Tí Coolture
Căn cứ theo tài liệu nhận diện `BRAND-GUIDELINES-TI-COOLTURE.pdf` & `src/index.css`:
- **Tỷ lệ màu chuẩn:** **Violet 60%** · **White/Paper 30%** · **Teal 10%**
- **Mã màu chính:**
  - `Violet Brand`: `#7520f7` (Deep: `#5a12c6`) — Màu chủ đạo của nút CTA, tiêu đề, nhận diện.
  - `Teal / Wave Accent`: `#39d6cf` (Ink: `#0b7c77`) — Màu điểm nhấn, divider và phụ đề.
  - `Dark Ink`: `#12081f` — Nền header, màu chữ nội dung.
  - `Paper Warm`: `#faf8ff` (White: `#ffffff`) — Nền email và nền thẻ nội dung.
- **Phông chữ:** `Alexandria`, sans-serif.

---

## 2. Bản Mẫu Nội Dung (Markdown / Plain Text)

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
- **Giao diện tinh gọn:** Bỏ header banner tối màu, bắt đầu thẳng vào nội dung thông báo trên nền trắng thanh lịch.
- **Nút CTA:** Violet thương hiệu `#7520f7`, bo tròn pill 9999px, đổ bóng tím thương hiệu.
- **Khung lưu ý:** Viền tím `#7520f7`, nền `#f7f4fd` dịu mắt, làm nổi bật Gmail đăng nhập.
