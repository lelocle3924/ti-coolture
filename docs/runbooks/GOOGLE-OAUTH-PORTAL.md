# TÍ COOLTURE — RUNBOOK: GOOGLE OAUTH PORTAL & REVIEW FLOW

**Tài liệu:** Hướng dẫn cấu hình Google OAuth, API Backend Phân hệ Portal và Quy trình Duyệt bài  
**Mã phân hệ:** BE-STEP-3  
**Phiên bản:** 1.0  
**Tác giả:** AI Agent under supervision of Lộc  
**Ngày:** 15/10/2026  

---

## 1. TỔNG QUAN KIẾN TRÚC & QUYẾT ĐỊNH THAY ĐỔI

### 1.1 Vì sao chuyển sang Google OAuth thay cho Magic Token?
1. **Trải nghiệm mượt mà, không ma sát (Zero Friction):** Hầu hết các chủ xưởng, nghệ nhân tại Việt Nam đều đã đăng nhập sẵn tài khoản Google trên điện thoại hoặc trình duyệt máy tính. Thay vì phải copy/paste hay ghi nhớ chuỗi token dài dễ mất, đối tác chỉ cần bấm **"Tiếp tục với Google"** 1 chạm là vào thẳng Dashboard quản lý xưởng.
2. **Không lo lộ token qua chia sẻ link:** Token dạng URL query param có nguy cơ bị lộ khi forward tin nhắn. Google OAuth ràng buộc danh tính chặt chẽ vào chính tài khoản Google được cấp phép.
3. **Pháp lý tối giản (Tuân thủ triệt để Nghị định 13/2023/NĐ-CP):** Hệ thống Tí Coolture không lưu trữ mật khẩu (hashed password), không lưu trữ thông tin nhận dạng nhạy cảm. Quá trình bảo mật 2 lớp (2FA) do Google trực tiếp đảm bảo.
4. **Hạ tầng sẵn sàng cho tương lai (Future-proof):** Cơ chế Google OAuth trên Supabase này sẽ được **tái sử dụng nguyên vẹn** khi kích hoạt tính năng tài khoản người dùng cuối (khách mua hàng đồng bộ wishlist, đánh giá nghệ nhân).

---

## 2. HƯỚNG DẪN CẤU HÌNH GOOGLE OAUTH TRÊN SUPABASE

### Bước 1: Tạo Google OAuth Client ID
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Tạo một Project mới (hoặc chọn project hiện có): `Ti-Coolture-App`.
3. Vào **APIs & Services** > **OAuth consent screen**:
   * User Type: Chọn **External** > Bấm *Create*.
   * App name: `Tí Coolture Partner Portal`
   * User support email: Email của bạn (admin).
   * Developer contact information: Email của bạn.
   * Scopes: Chọn `.../auth/userinfo.email` và `.../auth/userinfo.profile`.
4. Vào **APIs & Services** > **Credentials** > Bấm **Create Credentials** > Chọn **OAuth client ID**:
   * Application type: **Web application**.
   * Name: `Ti Coolture Supabase Auth`.
   * **Authorized JavaScript origins:**
     * `https://<YOUR-PROJECT-REF>.supabase.co`
     * `https://ticoolture.vn`
     * `http://localhost:5173` (cho môi trường dev)
   * **Authorized redirect URIs:**
     * `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`
5. Bấm **Create**, sau đó copy lại:
   * **Client ID**
   * **Client Secret**

---

### Bước 2: Bật Google Provider trong Supabase Dashboard
1. Đăng nhập [Supabase Dashboard](https://supabase.com/dashboard) > Chọn Project của bạn.
2. Điều hướng tới **Authentication** > **Providers**.
3. Tìm **Google** trong danh sách và bật công tắc **Enable Sign in with Google**.
4. Dán **Client ID** và **Client Secret** vừa lấy từ Google Console.
5. Bấm **Save**.

---

## 3. CƠ CHẾ AUTO-LINKING & BẢO VỆ PHÂN QUYỀN

```
Chủ xưởng đăng nhập Google
           │
           ▼
Supabase cấp JWT (Email: gommocchan@gmail.com)
           │
           ▼
Gọi API: GET /api/portal/me
           │
           ├─► 1. Đã có trong `shop_members`? ──────► [ HỢP LỆ: Vào Dashboard ]
           │
           ├─► 2. Có trong `shop_invitations`? ─────► [ TỰ ĐỘNG GÁN shop_members ]
           │      (status = 'pending')                      └─► [ Vào Dashboard ]
           │
           └─► 3. Không thuộc bảng nào? ────────────► [ CHẶN: 403 Forbidden ]
                                                           "Email chưa được cấp quyền"
```

* **Tránh rò rỉ dữ liệu:** Ngay cả khi một người dùng vãng lai biết được URL bí mật `/portal` và đăng nhập bằng Google cá nhân của họ, hệ thống sẽ từ chối ngay lập tức vì email đó không có trong danh sách xưởng.
* **Quyền riêng tư tuyệt đối giữa các xưởng:** Mỗi shop chỉ có thể đọc và sửa dữ liệu sản phẩm thuộc đúng `shop_id` của chính họ.

---

## 4. CHI TIẾT CÁC ENDPOINT BACKEND (VERCEL SERVERLESS)

### 4.1 `GET /api/portal/me`
* **Mục đích:** Xác thực phiên làm việc Google OAuth, tự động kích hoạt lời mời (nếu là lần đầu đăng nhập), trả về thông tin xưởng và danh sách sản phẩm nháp hiện có.
* **Header:** `Authorization: Bearer <SUPABASE_ACCESS_TOKEN>`
* **Response Thành công (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "c1a2b3c4-...",
    "email": "gommocchan@gmail.com"
  },
  "shop": {
    "id": "3f9e8a1b-...",
    "name": "Gốm Mộc Chân",
    "slug": "gom-moc-chan",
    "status": "published"
  },
  "role": "owner",
  "products": []
}
```

---

### 4.2 `POST /api/portal/upload-ticket`
* **Mục đích:** Cấp vé Presigned PUT URLs từ Cloudflare R2 để tải ảnh trực tiếp từ trình duyệt.
* **Header:** `Authorization: Bearer <SUPABASE_ACCESS_TOKEN>`
* **Body:**
```json
{
  "files": [
    { "name": "binh-hoa-1.webp", "type": "image/webp", "size": 1542000 }
  ]
}
```
* **Response (200 OK):** Trả về danh sách `uploadUrl`, `r2Key`, `publicUrl`.

---

### 4.3 `POST /api/portal/save-draft`
* **Mục đích:** Lưu nháp sản phẩm, cập nhật giá, mô tả và thứ tự sắp xếp kéo thả ảnh (`product_images`).
* **Header:** `Authorization: Bearer <SUPABASE_ACCESS_TOKEN>`
* **Body:**
```json
{
  "productId": "optional-uuid-neu-cap-nhat",
  "nameVi": "Bình gốm Men Tro vuốt tay",
  "categoryId": "c92a1b3c-...",
  "priceVnd": 450000,
  "dimensions": "18 x 25 cm",
  "images": [
    {
      "url": "shops/gom-moc-chan/products/172890123-a1b2.webp",
      "sortOrder": 0,
      "isCover": true,
      "altVi": "Ảnh chính bình gốm Men Tro"
    }
  ]
}
```

---

### 4.4 `POST /api/portal/submit-review`
* **Mục đích:** Đổi trạng thái sản phẩm sang `pending_review` (khóa sửa tạm thời) và bắn Webhook thông báo Telegram cho Admin.
* **Header:** `Authorization: Bearer <SUPABASE_ACCESS_TOKEN>`
* **Body:** `{ "productId": "prod-uuid" }`
* **Response:** `{ "success": true, "status": "pending_review" }`

---

### 4.5 `POST /api/admin/portal/invite` (Dành cho Admin)
* **Mục đích:** Cấp quyền quản lý xưởng cho một tài khoản Google Email.
* **Header:** `Authorization: Bearer <ADMIN_STAFF_TOKEN>`
* **Body:**
```json
{
  "shopId": "3f9e8a1b-...",
  "email": "doitac@gmail.com",
  "role": "owner"
}
```

---

### 4.6 `POST /api/admin/reviews/action` (Dành cho Admin)
* **Mục đích:** Phê duyệt (`published`) hoặc Từ chối (`rejected`) sản phẩm.
* **Header:** `Authorization: Bearer <ADMIN_STAFF_TOKEN>`
* **Body:**
```json
{
  "productId": "prod-uuid",
  "action": "approve"
}
```

---

## 5. HƯỚNG DẪN CẤU HÌNH TELEGRAM BOT CHO ADMIN

Khi đối tác bấm **"Gửi bài duyệt"**, hệ thống sẽ tự động gửi tin nhắn báo về Telegram riêng của bạn:

1. Mở ứng dụng Telegram, tìm bot `@BotFather`.
2. Gõ `/newbot`, đặt tên bot (ví dụ: `TiCooltureAlertBot`) và username bot (ví dụ: `ticoolture_alert_bot`).
3. Nhận được **Bot Token** (dạng: `7123456789:AAH...`).
4. Để lấy **Chat ID** của chính bạn:
   * Tìm bot `@userinfobot` trên Telegram > Bấm `/start` > Nhận được số `Id` của bạn (ví dụ: `123456789`).
   * Gửi 1 tin nhắn bất kỳ (ví dụ: "Hello") vào bot bạn vừa tạo để mở kênh nhận tin.
5. Cấu hình vào file `.env.local` hoặc Vercel Environment Variables:
   ```env
   TELEGRAM_BOT_TOKEN=7123456789:AAH...
   TELEGRAM_ADMIN_CHAT_ID=123456789
   ```

---

## 6. SỰ CỐ THƯỜNG GẶP & CÁCH XỬ LÝ (RUNBOOK)

| Tình huống sự cố | Nguyên nhân gốc | Cách khắc phục tức thời |
|---|---|---|
| **Shop đăng nhập bị báo "Email chưa được cấp quyền"** | Shop đăng nhập bằng một tài khoản Gmail cá nhân khác với email đã đăng ký với team. | Hướng dẫn shop đăng xuất và chọn đúng tài khoản Google được mời, hoặc Admin vào dashboard chạy lại API `/api/admin/portal/invite` để thêm email mới của shop. |
| **Không nhận được tin nhắn Telegram khi shop nộp bài** | `TELEGRAM_BOT_TOKEN` chưa cấu hình, hoặc bạn chưa từng bấm `/start` với bot. | Mở bot trên Telegram, bấm `/start`, kiểm tra lại biến môi trường trên Vercel. Code đã được thiết kế resilient (không bao giờ làm sập API nếu Telegram lỗi). |
| **Lỗi `redirect_uri_mismatch` từ Google** | URL callback trong Google Cloud Console chưa khớp với Supabase Auth. | Kiểm tra lại mục **Authorized redirect URIs** trên Google Cloud Console, đảm bảo có `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`. |
| **Shop không thể sửa sản phẩm** | Sản phẩm đang ở trạng thái `pending_review` (đang chờ duyệt). | Đây là tính năng an toàn có chủ đích. Nếu cần sửa, Admin chỉ cần bấm Từ chối (`rejected`) trên trang quản trị để mở lại quyền sửa cho shop. |
