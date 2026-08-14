# Data Layer Specification — Tí Coolture

**Cập nhật:** 14/08/2026 · **Trạng thái:** frontend-only, chưa có backend

> Bản trước của tài liệu này mô tả REST endpoint của Express server và lớp
> Firestore. **Cả hai đã bị xoá ngày 14/08/2026.** Tài liệu này mô tả đúng
> những gì đang chạy trong code.

---

## 1. Tình trạng hiện tại

Ứng dụng chạy **thuần frontend**: React 19 + Vite 6 + Tailwind 4, `npm run dev`
mở Vite ở cổng `5173`. Không có database, không có API server, không có auth
backend.

Stack đích (theo `SRS.md` §3.1) là **Next.js 15 App Router + Supabase
(PostgreSQL) + Cloudflare R2 + Vercel**. Bản React/Vite hiện tại là bước đệm để
dựng giao diện trước khi chuyển sang đó.

| Lớp | Hiện tại | Đích (SRS §3.1) |
|---|---|---|
| Framework | React 19 + Vite 6 | Next.js 15 (App Router) |
| Dữ liệu | in-memory mock (`src/lib/mock/`) | Supabase (PostgreSQL) |
| Ảnh | SVG data-URI sinh tại chỗ | Cloudflare R2 + Next/Image |
| Auth | localStorage giả lập | Supabase Auth (2FA, AD-01) |
| Email | chưa có | Resend |
| Hosting | chưa có | Vercel |

---

## 2. Kiến trúc dữ liệu

```
src/views/*          ← chỉ biết kiểu camelCase trong src/types.ts
      │
      ▼
src/lib/dbService.ts ← ADAPTER — điểm nối duy nhất
      │
      ▼
src/lib/mock/        ← schema.ts (kiểu hàng) + seed.ts (dữ liệu)
```

**`src/lib/mock/schema.ts`** khai báo kiểu hàng **đúng theo schema Postgres**
trong `SRS.md` §4: snake_case, song ngữ `*_vi` / `*_en`, `price_vnd`,
`publish_status`, `map_x` / `map_y`, cột ảnh lưu **key** chứ không phải URL đầy
đủ.

**`src/lib/dbService.ts`** là adapter duy nhất giữa hình dạng hàng đó và kiểu
camelCase mà các view dùng. Khi Supabase vào, chỉ file này đổi — các view giữ
nguyên. Đây là toàn bộ nội dung của bước migration.

### Bảng đang có trong mock store

| Bảng | Nguồn | Ghi chú |
|---|---|---|
| `categories` | SRS §4 | 6 ngành hàng |
| `materials` | SRS §4 | |
| `shops` | SRS §4 | 6 shop giả định |
| `shop_socials` | SRS §4 | |
| `products` | SRS §4 | 12 sản phẩm giả định |
| `product_images` | SRS §4 | ảnh placeholder dạng data-URI |
| `product_materials` | SRS §4 | |
| `routes` / `route_stops` | SRS §4 | 3 lộ trình, toạ độ `map_x/map_y` theo % |
| `featured_items` | SRS §4 | Hidden Gems (`placement: 'hidden_gem'`) |
| `blog_topics` / `blog_posts` | SRS §4 | 3 bài tạp chí |
| `site_settings` | SRS §4 | mẫu tin nhắn gửi shop |
| `click_events` | SRS §4 | thay cho analytics |
| `collections` / `collection_products` | **chưa có trong SRS** | xem §4 |

---

## 3. API của adapter (`src/lib/dbService.ts`)

Tất cả đều là `async`, trả về Promise, có độ trễ giả lập ~120ms để lộ trạng thái
loading thật.

### Đọc

| Hàm | Trả về |
|---|---|
| `fetchProducts(status?, opts?)` | `Product[]` — mặc định `"Approved"` |
| `fetchAllProducts()` | `Product[]` |
| `fetchProductById(id)` | `Product \| null` |
| `fetchProductsStore(storeId)` | `Product[]` |
| `fetchStores()` | `StoreProfile[]` |
| `fetchStoreById(id)` | `StoreProfile \| null` |
| `fetchTouristRoutes(opts?)` | `TouristRoute[]` |
| `fetchHiddenGems()` | `{ product, note }[]` |
| `fetchCollections()` | `Collection[]` |
| `fetchBlogPosts()` | `BlogPost[]` |
| `fetchMessageTemplate()` | `string` |
| `findUserByEmail(email)` | `UserProfile \| null` |
| `countWishlistHolders(productId)` | `number` |
| `fetchButtonClickStats()` | `ButtonClickStat[]` |
| `fetchApprovalLogs(storeId?)` | `[]` — chưa có audit log |

**`opts.throwOnError`** — mặc định các hàm nuốt lỗi và trả mảng rỗng (hành vi
lịch sử). Truyền `{ throwOnError: true }` để hàm ném lỗi, dành cho màn hình cần
phân biệt **"không tải được"** với **"chưa có gì"**. Homepage dùng cờ này; nếu
không, lỗi tải sẽ hiện thành trạng thái rỗng — nói sai sự thật với người dùng.

### Ghi — **chỉ trong bộ nhớ, mất khi reload**

`createProduct` · `updateProduct` · `moderateProduct` · `requestDeleteProduct` ·
`permanentlyDeleteProduct` · `upsertStoreProfile` · `moderateStore` ·
`deleteStore` · `toggleWishlist` · `saveWishlistNote` · `toggleFollowShop` ·
`updateMessageTemplate` · `getOrCreateUserProfile` · `resetUserPassword`

Hồ sơ người dùng và wishlist lưu ở `localStorage`; sửa sản phẩm và shop chỉ tồn
tại trong phiên làm việc.

### Sự kiện

`triggerWebhook(action, payload)` — **no-op**, chỉ `console.debug`. Endpoint
`POST /api/webhooks/trigger` và `GET /api/webhooks/logs` đã bị xoá cùng
`server.ts`. Giữ lại chữ ký hàm để các lời gọi hiện có không phải sửa cho tới
khi backend mới định nghĩa hệ sự kiện của nó.

`incrementProductClick` / `incrementProductView` / `recordButtonClick` ghi vào
bảng `click_events` trong bộ nhớ.

---

## 4. Nợ kỹ thuật cần xử lý khi lên Supabase

1. **`collections` / `collection_products` chưa có trong SRS §4.** Được mô hình
   hoá theo đúng quy ước của các bảng khác trong `src/lib/mock/schema.ts` để có
   thể bê thẳng vào migration. Cần bổ sung vào SRS trước khi viết migration.
2. **Auth là giả.** `AuthProvider` giữ phiên trong `localStorage`,
   `AuthGateway` chấp nhận mọi cặp email/mật khẩu. Không xác thực ai cả — không
   được lên production.
3. **Dữ liệu là giả định.** Toàn bộ shop, sản phẩm, giá, lộ trình trong
   `src/lib/mock/seed.ts` lấy từ `03-CONTENT-PACK.md` Phần B và **do người viết
   bịa ra**. Phải thay bằng shop thật trước bản demo công khai.
4. **Ảnh là khối placeholder** sinh bằng SVG data-URI, đúng quy cách Phần C của
   content pack. Khi có R2, thay bằng key ảnh thật.
5. **Chưa có trang chi tiết bài viết.** `/blog` mới là trang danh sách.
