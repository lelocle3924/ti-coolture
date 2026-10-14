# TÍ COOLTURE — RUNBOOK: THIẾT LẬP CLOUDFLARE R2 & DIRECT UPLOAD

**Tài liệu:** Hướng dẫn cấu hình Cloudflare R2, Quy trình Direct Upload và Xử lý sự cố  
**Mã phân hệ:** BE-STEP-2  
**Phiên bản:** 1.0  
**Tác giả:** AI Agent under supervision of Lộc  
**Ngày:** 14/10/2026  

---

## 1. TỔNG QUAN KIẾN TRÚC & LÝ DO THIẾT KẾ

### 1.1 Vì sao sử dụng Cloudflare R2?
* **Zero Egress Bandwidth Cost:** Cloudflare R2 miễn phí 100% phí truyền tải ra ngoài (Egress Fees). Với catalogue hàng chục nghìn lượt xem ảnh sản phẩm chất lượng cao của nghệ nhân, chi phí băng thông luôn là **0 VNĐ** (trong khi AWS S3 tính ~$0.09/GB egress và Supabase Storage tính sau 2GB đầu).
* **Free Tier hào phóng:** 10 GB lưu trữ miễn phí/tháng, 1.000.000 lượt ghi (Class A), 10.000.000 lượt đọc (Class B) mỗi tháng.
* **Tương thích hoàn toàn chuẩn S3:** Sử dụng AWS S3 SDK v3 chuẩn công nghiệp.

### 1.2 Vì sao sử dụng kiến trúc Direct Upload (Presigned PUT URLs)?
```
┌────────────────┐                     ┌─────────────────────┐
│                │ 1. Request Ticket   │  Vercel Serverless  │
│                ├────────────────────►│  /api/upload-ticket │
│                │ 2. Return Presigned │  (Xác thực Token)   │
│  Shop Browser  │◄────────────────────┤                     │
│  (Partner UI)  │                     └─────────────────────┘
│                │ 3. Direct Binary Upload (PUT)
│                ├───────────────────────────────────────────┐
│                │    (Bỏ qua Serverless, không nghẽn RAM)   ▼
└────────────────┘                                  ┌────────────────┐
                                                    │ Cloudflare R2  │
                                                    │ Storage Bucket │
                                                    └────────────────┘
```
1. **Không nghẽn serverless:** Vercel serverless function có giới hạn payload tối đa 4.5 MB. Nếu shop upload 5-10 ảnh một lúc (tổng cộng 20-50 MB), việc gửi qua serverless sẽ lập tức gây sập hoặc quá tải RAM.
2. **Tốc độ tối đa:** Ảnh nhị phân được truyền trực tiếp từ máy của shop đến Edge Datacenter gần nhất của Cloudflare tại Việt Nam.

---

## 2. QUY TRÌNH THIẾT LẬP CLOUDFLARE R2 (STEP-BY-STEP)

### Bước 1: Tạo R2 Bucket
1. Đăng nhập [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Chọn menu **R2** ở thanh điều hướng bên trái.
3. Bấm nút **Create bucket**.
4. Đặt tên bucket: `ti-coolture-media`.
5. Vùng lưu trữ (Location): Chọn **Automatic** (Cloudflare tự tối ưu theo vị trí người dùng).
6. Bấm **Create bucket**.

---

### Bước 2: Cấp R2 API Token
1. Tại trang chủ R2, chọn **Manage R2 API Tokens** ở cột bên phải.
2. Bấm **Create API token**.
3. Cấu hình:
   * **Token name:** `ti-coolture-backend`
   * **Permissions:** Chọn **Object Read & Write** (cho phép đọc và ghi đối tượng).
   * **Apply to specific buckets only:** Chọn bucket `ti-coolture-media` (đảm bảo nguyên tắc đặc quyền tối thiểu).
   * **TTL (Thời hạn):** Để trống (không hết hạn) hoặc chọn thời hạn mong muốn.
4. Bấm **Create API Token**.
5. **LƯU LẠI NGAY LẬP TỨC các giá trị:**
   * **Access Key ID**
   * **Secret Access Key**
   * **Endpoint URL** (Chứa `Account ID`, dạng: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`)

---

### Bước 3: Cấu hình CORS (BẮT BUỘC để Trình duyệt Upload trực tiếp)
Nếu không cấu hình CORS, trình duyệt của shop sẽ chặn cuộc gọi PUT và báo lỗi `CORS error`.

1. Vào bucket `ti-coolture-media` vừa tạo > Chọn tab **Settings**.
2. Cuộn xuống mục **CORS Policy** > Bấm **Add CORS policy** (hoặc Edit).
3. Dán đoạn JSON cấu hình chuẩn sau:

```json
[
  {
    "AllowedOrigins": [
      "https://ticoolture.vn",
      "https://www.ticoolture.vn",
      "https://*.vercel.app",
      "http://localhost:5173",
      "http://localhost:3000"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "HEAD"
    ],
    "AllowedHeaders": [
      "Content-Type",
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```
4. Bấm **Save**.

---

### Bước 4: Cấu hình Public Domain để hiển thị ảnh ngoài Website
Để ảnh tải lên có thể xem được ngoài website:
1. Trong tab **Settings** của bucket `ti-coolture-media`.
2. Tại mục **Public access**:
   * **Cách 1 (Nhanh nhất khi dev/test):** Bật **R2.dev subdomain** (Bấm *Allow Access* > Nhập `allow`). Bạn sẽ nhận được URL dạng `https://pub-xxxxxx.r2.dev`.
   * **Cách 2 (Khuyên dùng cho Production):** Bấm **Connect Domain** > Nhập subdomain riêng: `img.ticoolture.vn`. Cloudflare sẽ tự động trỏ DNS và sinh chứng chỉ SSL trong vòng 1 phút.

---

## 3. CẤU HÌNH BIẾN MÔI TRƯỜNG (ENVIRONMENT VARIABLES)

Thêm các biến sau vào file `.env.local` (khi chạy local) và cấu hình trên **Vercel Project Settings > Environment Variables**:

| Tên biến | Ví dụ giá trị | Mô tả | Phạm vi |
|---|---|---|---|
| `R2_ACCOUNT_ID` | `a1b2c3d4e5f6...` | Cloudflare Account ID | Server-only (`api/*`) |
| `R2_ACCESS_KEY_ID` | `0123456789abcdef...` | R2 Access Key ID | Server-only (`api/*`) |
| `R2_SECRET_ACCESS_KEY` | `9876543210fedcba...` | R2 Secret Access Key | Server-only (`api/*`) |
| `R2_BUCKET_NAME` | `ti-coolture-media` | Tên Bucket R2 | Server-only (`api/*`) |
| `R2_PUBLIC_DOMAIN` | `https://img.ticoolture.vn` | Domain truy cập ảnh công khai | Server & Client |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | Supabase Service Role để xác thực Token | Server-only (`api/*`) |

---

## 4. ĐẶC TẢ API: `/api/portal/upload-ticket`

### 4.1 Request
* **Endpoint:** `POST /api/portal/upload-ticket`
* **Content-Type:** `application/json`

**Payload:**
```json
{
  "token": "tc_inv_8f9a2b3c4d5e6f7a8b9c0d1e2f3a4b5c",
  "files": [
    {
      "name": "binh-gom-men-tro-1.webp",
      "type": "image/webp",
      "size": 1542000
    },
    {
      "name": "binh-gom-chi-tiet.jpg",
      "type": "image/jpeg",
      "size": 2100500
    }
  ]
}
```

### 4.2 Response thành công (200 OK)
```json
{
  "success": true,
  "shopId": "3f9e8a1b-4c2d-4e5f-a6b7-8c9d0e1f2a3b",
  "tickets": [
    {
      "originalName": "binh-gom-men-tro-1.webp",
      "r2Key": "shops/3f9e8a1b-4c2d-4e5f-a6b7-8c9d0e1f2a3b/products/1728901234567-a1b2c3d4.webp",
      "uploadUrl": "https://<account_id>.r2.cloudflarestorage.com/ti-coolture-media/shops/...?X-Amz-Signature=...",
      "publicUrl": "https://img.ticoolture.vn/shops/3f9e8a1b-4c2d-4e5f-a6b7-8c9d0e1f2a3b/products/1728901234567-a1b2c3d4.webp",
      "contentType": "image/webp",
      "expiresInSeconds": 900
    }
  ]
}
```

### 4.3 Response lỗi (400 / 500)
```json
{
  "success": false,
  "error": "Mỗi lần chỉ được tạo vé tải lên tối đa 10 hình ảnh."
}
```

---

## 5. HƯỚNG DẪN DÙNG TRÊN FRONTEND (`src/lib/r2Upload.ts`)

Trong React component của Portal, gọi trực tiếp hàm `uploadMultipleFilesDirectly`:

```typescript
import { uploadMultipleFilesDirectly, type UploadedR2Image } from "@/lib/r2Upload";

async function handleFilesSelected(files: File[], portalToken: string) {
  try {
    const uploadedImages: UploadedR2Image[] = await uploadMultipleFilesDirectly(
      portalToken,
      files,
      {
        concurrency: 3, // Upload song song tối đa 3 ảnh cùng lúc
        onFileProgress: (fileIndex, percent) => {
          console.log(`Ảnh thứ ${fileIndex} đang tải: ${percent}%`);
        },
      }
    );

    console.log("Danh sách ảnh đã tải lên R2 thành công:", uploadedImages);
    // Lưu uploadedImages vào state để kéo thả sắp xếp thứ tự
  } catch (err: any) {
    alert("Lỗi tải ảnh: " + err.message);
  }
}
```

---

## 6. SỰ CỐ THƯỜNG GẶP & CÁCH KHẮC PHỤC (RUNBOOK)

| Mã lỗi / Hiện tượng | Nguyên nhân gốc | Cách khắc phục tức thời |
|---|---|---|
| **CORS error (No 'Access-Control-Allow-Origin')** | Chưa cấu hình hoặc cấu hình thiếu domain trong tab CORS của R2 Bucket. | Vào Cloudflare R2 > Settings > CORS Policy > Bổ sung origin đang chạy (ví dụ `http://localhost:5173` hoặc domain production). |
| **HTTP 403: SignatureDoesNotMatch** | Header `Content-Type` khi trình duyệt gửi lệnh PUT không khớp chính xác với `contentType` đã đăng ký lúc tạo ticket. | Đảm bảo client gửi `xhr.setRequestHeader("Content-Type", ticket.contentType)`. Không được gửi header lạ không có trong AllowedHeaders. |
| **HTTP 400: Link mời đã hết hạn** | Token gửi kèm đã quá thời hạn 14 ngày hoặc đã bấm gửi duyệt (`locked_pending`). | Kiểm tra bảng `portal_invites`. Nếu shop cần sửa thêm, Admin đổi status về `active` hoặc tạo token mới. |
| **Upload bị đứng ở 99%** | Kết nối mạng chập chờn hoặc file quá lớn trên mạng yếu. | Thư viện `r2Upload.ts` có cơ chế timeout và callback lỗi để người dùng bấm nút **"Thử lại"** (Retry) cho từng ảnh đơn lẻ. |
| **Lỗi 500: Missing Cloudflare R2 environment variables** | Thiếu biến môi trường trên Vercel. | Kiểm tra Vercel Dashboard > Settings > Environment Variables, đảm bảo đủ 5 biến `R2_*`. Redeploy lại project. |
