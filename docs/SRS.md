# TÍ COOLTURE — Software Requirements Specification

**Phiên bản:** 1.1 (draft)
**Ngày:** 10/08/2026
**Thay đổi so với v1.0:** tách vai trò staff/shop (M2), gộp bảng còn 15 (M4.2), thêm `site_settings` + `featured_items` cho carousel cấu hình được (HP-03), bản đồ mobile đổi sang hybrid (HP-04), Hidden Gems dùng cờ thay A/B test (HP-05), thang màu teal (M10.1), bỏ dedupe lúc ghi (M8.2), thêm tracking bản đồ (M8.5)
**Chủ sở hữu kỹ thuật:** Lộc
**Team:** Lộc, Hưng, Minh, Tài, Thịnh
**Trạng thái:** Chờ team review và chốt

---

## 0. TÓM TẮT ĐIỀU HÀNH

Tí Coolture là **catalogue quảng bá được tuyển chọn** (curated advertisement catalogue) cho local brand và artist tại TP.HCM. Website trưng bày sản phẩm và điều hướng người dùng sang kênh social chính thức của thương hiệu. **Website vĩnh viễn không xử lý giao dịch, thanh toán hay giỏ hàng.**

Mục tiêu kép của dự án:
1. **Đối ngoại:** giúp local brand tiếp cận khách ngoài tệp follower sẵn có; giúp Gen Z và du khách khám phá sản phẩm có gu mà không phải mò socials hàng giờ.
2. **Đối nội (quan trọng không kém):** thu thập dữ liệu nhu cầu thị trường làm tiền đề mở cửa hàng vật lý.

Mục tiêu 2 đặt ra yêu cầu kỹ thuật đặc thù: hệ thống đo lường phải nắm bắt **ý định mua**, không chỉ lưu lượng truy cập. Xem Mục 8.

### 0.1 Ba quyết định kiến trúc nền tảng

| # | Quyết định | Lý do |
|---|---|---|
| D1 | **V1 không có tài khoản shop.** Shop gửi thông tin qua Google Form, admin nhập vào CMS. | Cắt ~60% khối lượng code; giảm mạnh rủi ro bị xếp vào "nền tảng TMĐT trung gian"; đảm bảo chất lượng ảnh/nội dung ngay từ ngày đầu; đúng với core value "Curation". |
| D2 | **V1 không có tài khoản người dùng.** Wishlist lưu bằng `localStorage`. | Không thu thập dữ liệu cá nhân → gần như miễn nghĩa vụ Luật BVDLCN cho bản launch; cắt toàn bộ auth, email verify, reset password. |
| D3 | **Server-side rendering bắt buộc.** Không làm SPA. | SEO là kênh tăng trưởng chính của một nền tảng khám phá. Không SSR = không index = không traffic. |

### 0.2 Ràng buộc

| Ràng buộc | Giá trị |
|---|---|
| Nhân lực code | 1 người (Lộc), trình độ beginner, chưa từng deploy |
| Cố vấn kỹ thuật | 1 người ngoài team, hỏi không thường xuyên |
| Deadline demo UX/UI | Thứ Tư 12/08/2026 |
| Deadline demo web | Thứ Tư 19/08/2026 |
| Deadline public | 31/08/2026 |
| Budget code + design | ~6.500.000 VNĐ |
| Budget vận hành | ~500.000 VNĐ/tháng |
| Quỹ tổng | 25.000.000 VNĐ |

**Đánh giá rủi ro timeline:** Scope trong SRS này vẫn là *rất* căng cho 1 người trong 22 ngày. Mục 12 có phương án cắt tiếp nếu chậm tiến độ. Nguyên tắc: **thà launch 5 tính năng hoàn chỉnh còn hơn 15 tính năng dở dang.**

---

## 1. PHẠM VI THEO PHIÊN BẢN

### V1 — Public Launch (mục tiêu 31/08/2026)

**CÓ:**
- Trang chủ: hero, search, carousel sản phẩm, hidden gems drawer, bản đồ route khám phá
- Trang tất cả sản phẩm: lọc theo danh mục / chất liệu / khoảng giá, sắp xếp
- Trang tất cả shop
- Trang chi tiết shop: story, gallery, social links, sản phẩm
- Trang chi tiết sản phẩm: gallery ảnh, thông tin, nút Order Now dẫn sang social
- Wishlist local (không cần đăng nhập)
- Blog: bài viết, danh mục chủ đề, reactions
- Trang About Us, FAQ
- Trang Điều khoản sử dụng, Chính sách bảo mật
- Song ngữ Việt / Anh (giao diện; nội dung ưu tiên tiếng Việt)
- Admin CMS: 1 tài khoản admin, CRUD shop / sản phẩm / bài viết / route / hidden gems
- Analytics dashboard cho admin
- Export CSV/Excel

**KHÔNG CÓ (dời sang sau):**
- Tài khoản shop, tự đăng ký, tự upload, moderation pipeline
- Tài khoản user, đăng nhập Google, verify email, reset password
- Followed shops, notification feed
- Reactions/comment do user đăng nhập
- Report vi phạm

### V1.5 — Tháng 9/2026
- Tài khoản user (Google OAuth + email/password, bắt buộc verify)
- Wishlist đồng bộ cloud, migrate từ localStorage
- Followed shops + notification feed
- Chức năng báo cáo nội dung vi phạm
- Trang "Xuất dữ liệu của tôi" và "Xóa tài khoản" (bắt buộc theo Luật BVDLCN)

### V2 — Q4/2026, chỉ triển khai SAU KHI có ý kiến pháp lý
- Tài khoản shop, tự đăng ký, tự upload sản phẩm
- Moderation pipeline (Pending / Approved / Rejected)
- Xác thực danh tính người bán
- Hệ thống tiếp nhận phản ánh, khiếu nại
- Đăng ký nền tảng TMĐT với cơ quan nhà nước

---

## 2. NGƯỜI DÙNG & USE CASE

| Actor | Mô tả | V1 |
|---|---|---|
| **Khách (Guest)** | Gen Z 18–30, du khách nước ngoài. Không đăng nhập. | ✅ |
| **Admin** | Thành viên team. Toàn quyền. | ✅ |
| **Moderator** | Quyền hạn chế: duyệt nội dung, không xóa shop, không xem analytics tài chính. | ✅ (build sẵn schema, chưa dùng) |
| **Shop** | Đối tác. V1 không có tài khoản, tương tác qua Google Form + email. | V2 |
| **User đăng nhập** | Có wishlist đồng bộ, follow shop. | V1.5 |

> **Lưu ý về Moderator:** theo yêu cầu 4.4, schema và middleware phân quyền được thiết kế 3 vai trò ngay từ đầu (`admin`, `moderator`, `viewer`), nhưng UI V1 chỉ mở cho `admin`. Thêm vai trò sau chỉ là bật cờ, không phải migrate database.

---

## 3. KIẾN TRÚC & TECH STACK

### 3.1 Stack

| Lớp | Công nghệ | Chi phí | Lý do |
|---|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | 0 | SSR sẵn cho SEO; hệ sinh thái lớn nhất → AI hỗ trợ tốt nhất |
| CSS | **Tailwind CSS + shadcn/ui** | 0 | Code component thuộc về bạn, sửa thoải mái theo brand |
| Database | **Supabase (PostgreSQL)** | 0 (free tier) | Postgres thật, có `unaccent`/`pg_trgm` cho search tiếng Việt, RLS, Auth sẵn cho V1.5 |
| Ảnh | **Cloudflare R2 + Next/Image** | 0 (10GB free, egress free) | Supabase Storage free chỉ 1GB — không đủ cho ảnh sản phẩm |
| Hosting | **Vercel** | 0 (Hobby) → xem 3.2 | Deploy 1 lệnh, phù hợp người mới |
| Bản đồ | **SVG tự vẽ + react-zoom-pan-pinch** | 0 | Yêu cầu 7.1 không cần Google Maps API |
| Email | **Resend** | 0 (3.000 mail/tháng) | V1 chỉ cần form liên hệ |
| Analytics | **Bảng tự build + Vercel Analytics** | 0 | Dữ liệu là tài sản của dự án, phải nằm trong DB của bạn |
| Monitoring | **Sentry** | 0 (free tier) | Bắt lỗi production |
| Domain | **ticoolture.vn** | ~750k/năm | |

**Tổng chi phí vận hành dự kiến: ~65.000 VNĐ/tháng** (chỉ domain phân bổ). Dư budget lớn.

### 3.2 Cảnh báo hosting

Vercel **Hobby plan cấm sử dụng cho mục đích thương mại**. Website hiện tại không thu tiền → có thể lập luận là phi thương mại. Nhưng nếu triển khai ý tưởng "bán slot Hidden Gems" (7.5), bạn **bắt buộc** nâng lên Pro ($20/tháng ≈ 520k — vừa hết budget vận hành).

Phương án dự phòng nếu cần: Cloudflare Pages (free, không giới hạn thương mại) — cấu hình khó hơn, chỉ đổi khi thực sự cần.

### 3.3 Môi trường

| Môi trường | Nhánh Git | Supabase project | URL |
|---|---|---|---|
| Development | `dev` | `ticoolture-dev` | localhost |
| Staging | `staging` | `ticoolture-dev` | `staging.ticoolture.vn` |
| Production | `main` | `ticoolture-prod` | `ticoolture.vn` |

Quy tắc: **không bao giờ push thẳng lên `main`**. Merge từ `staging` sau khi test.
Backup: Supabase daily backup + `pg_dump` thủ công hàng tuần lưu Google Drive.

---

## 4. DATA MODEL

**15 bảng.** Xếp theo mức độ cần thiết:

- **Tầng 1 — không thể bỏ (9):** `shops`, `products`, `product_images`, `categories`, `staff_members`, `click_events`, `blog_posts`, `routes`, `route_stops`. Mỗi bảng là một quan hệ 1-nhiều thật; gộp lại nghĩa là nhét mảng vào cột và mất khả năng lọc/sắp xếp/index.
- **Tầng 2 — rẻ và xứng đáng (5):** `shop_socials` (validate whitelist từng dòng), `materials` + `product_materials` (**lý do quyết định là song ngữ** — `text[]` không lưu được cặp vi/en và facet sẽ vỡ vụn vì gõ tay), `search_logs` (ROI cao nhất schema), `shop_monthly_reports` (lý do dự án tồn tại).
- **Tầng 3 — hạ tầm (3):** `site_settings` + `featured_items` (gộp Hidden Gems và carousel làm một), `blog_reactions` (P1), `audit_logs` (P1, V1 chỉ ghi `delete` và `publish` — đây là **bảo hiểm phục hồi** khi xoá nhầm, không phải công cụ giám sát).
- **Đã cắt so với v1.0:** `product_variants` → cột JSONB; `hidden_gem_slots` → gộp vào `featured_items`.

### 4.1 ERD

```
PHÂN QUYỀN — hai trục tách biệt
┌───────────────┐        ┌──────────────┐        ┌───────────────┐
│ staff_members │───────>│  auth.users  │<───────│ shop_members  │
│ (toàn cục)    │        └──────────────┘        │ (có phạm vi)  │
│ admin/mod/view│                                │ + shop_id     │
└───────────────┘                                └───────┬───────┘
                                                         │
NỘI DUNG                    ┌─────────────┐              │
                            │ categories  │              │
                            └──────┬──────┘              │
                                   │ 1                   │
                                   │ n                   ▼
┌─────────────┐  1          n ┌────┴────────┐  1     n ┌──────────────────┐
│    shops    ├───────────────┤  products   ├──────────┤ product_images   │
└──────┬──────┘               └──┬───────┬──┘          └──────────────────┘
       │ 1                       │ n     │ n
       │ n                       │       └──────────┐
┌──────┴──────────┐    ┌─────────┴──────────┐  ┌────┴────────┐
│  shop_socials   │    │ product_materials  ├─n┤  materials  │
└─────────────────┘    └────────────────────┘  └─────────────┘
   (variants = cột JSONB trên products, không phải bảng)

KHÁM PHÁ                              CẤU HÌNH
┌─────────────┐  1    n ┌──────────────┐   ┌────────────────┐
│   routes    ├─────────┤ route_stops  │   │ site_settings  │
└─────────────┘         └──────────────┘   └────────────────┘
┌──────────────┐ 1   n ┌─────────────┐     ┌────────────────┐
│ blog_topics  ├───────┤ blog_posts  │     │ featured_items │
└──────────────┘       └──────┬──────┘     │ carousel + gems│
                              │ n          └────────────────┘
                     ┌────────┴────────┐
                     │ blog_reactions  │
                     └─────────────────┘

ĐO LƯỜNG
┌─────────────────┐  ┌──────────────┐  ┌──────────────────────┐
│  click_events   │  │ search_logs  │  │ shop_monthly_reports │
│ +route_id       │  │ (khoảng      │  │ ← chìa khoá chống    │
│ +route_stop_id  │  │  trống nhu   │  │   "data đểu"         │
└─────────────────┘  │  cầu)        │  └──────────────────────┘
┌─────────────────┐  └──────────────┘
│   audit_logs    │
└─────────────────┘
```

### 4.2 Schema SQL

```sql
-- ============ EXTENSIONS ============
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS unaccent;   -- tìm "non la" ra "nón lá"
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- fuzzy match, chịu lỗi chính tả

-- Text search config tiếng Việt: bỏ dấu rồi index
CREATE TEXT SEARCH CONFIGURATION vi (COPY = simple);
ALTER TEXT SEARCH CONFIGURATION vi
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, simple;

-- ============ ENUMS ============
CREATE TYPE admin_role      AS ENUM ('admin', 'moderator', 'viewer');
CREATE TYPE publish_status  AS ENUM ('draft', 'published', 'hidden', 'archived');
CREATE TYPE social_platform AS ENUM
  ('instagram','tiktok','facebook','threads','shopee','website','zalo');
CREATE TYPE click_target    AS ENUM
  ('product_view','shop_view','order_now','wishlist_add','social_link',
   'route_view','route_stop_click','route_stop_external',
   'map_interacted','map_fullscreen_open',
   'gem_tab_impression','gem_tab_click','gem_view','gem_outbound');

-- ============ PHÂN QUYỀN: MÔ HÌNH HAI TRỤC ============
-- Trục 1 = nhân sự nội bộ, quyền TOÀN CỤC (áp lên mọi nội dung)
-- Trục 2 = đối tác shop, quyền CÓ PHẠM VI (chỉ nội dung của chính họ)
-- KHÔNG gộp hai trục vào một enum: policy RLS không viết gọn được,
-- và một bug gán nhầm enum sẽ biến shop thành moderator.

CREATE TABLE staff_members (
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text UNIQUE NOT NULL,
  full_name   text NOT NULL,
  role        admin_role NOT NULL DEFAULT 'viewer',
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- V1: bảng rỗng, không có UI. V2: bật lên là dùng ngay, không cần migrate.
CREATE TYPE shop_role AS ENUM ('owner', 'editor');

CREATE TABLE shop_members (
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id    uuid REFERENCES shops(id)      ON DELETE CASCADE,
  shop_role  shop_role NOT NULL DEFAULT 'owner',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, shop_id)
);
-- Ràng buộc 4.5 (không thể vừa là shop vừa là user cùng email)
-- được cưỡng chế ở tầng ứng dụng, không phải ở DB.

-- ============ TAXONOMY ============
CREATE TABLE categories (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        text UNIQUE NOT NULL,      -- 'thoi-trang-phu-kien'
  name_vi     text NOT NULL,
  name_en     text NOT NULL,
  icon        text,                      -- tên icon Lucide
  sort_order  int  NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true
);

CREATE TABLE materials (
  id       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug     text UNIQUE NOT NULL,
  name_vi  text NOT NULL,
  name_en  text NOT NULL
);

-- ============ SHOPS ============
CREATE TABLE shops (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug              text UNIQUE NOT NULL,
  name              text NOT NULL,
  tagline_vi        text,
  tagline_en        text,
  story_vi          text,               -- Markdown, PHẢI sanitize khi render
  story_en          text,
  -- LƯU Ý: các cột *_url lưu KEY trên object storage, không phải URL đầy đủ.
  -- Ví dụ: 'shops/kho-muc/logo.webp'. Code ghép domain CDN lúc render.
  -- Đổi CDN domain sau này = sửa 1 dòng config, không phải UPDATE 5.000 dòng.
  -- Tuyệt đối KHÔNG trỏ vào CDN Instagram/Facebook của shop: họ chặn hotlink,
  -- URL hết hạn, và shop đổi ảnh là site vỡ.
  logo_url          text,
  cover_url         text,
  contact_email     text,
  is_online_only    boolean NOT NULL DEFAULT true,
  address           text,               -- chỉ khi có cơ sở vật lý
  area_tag          text,               -- 'Chợ Lớn', 'Thủ Đức', ... (tự định nghĩa)
  status            publish_status NOT NULL DEFAULT 'draft',
  is_featured       boolean NOT NULL DEFAULT false,
  -- Trường compliance, để trống ở V1, dùng khi lên V2
  legal_name        text,
  tax_code          text,
  business_reg_no   text,
  identity_verified boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE shop_socials (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id    uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  platform   social_platform NOT NULL,
  url        text NOT NULL,             -- PHẢI validate whitelist domain
  handle     text,                      -- '@khomuc'
  is_visible boolean NOT NULL DEFAULT true,
  UNIQUE (shop_id, platform)
);

-- ============ PRODUCTS ============
CREATE TABLE products (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id        uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  category_id    uuid NOT NULL REFERENCES categories(id),
  slug           text UNIQUE NOT NULL,
  name_vi        text NOT NULL,
  name_en        text,
  short_desc_vi  text,
  short_desc_en  text,
  story_vi       text,                  -- "story behind this item"
  story_en       text,
  price_vnd      integer,               -- NULL = "Liên hệ shop"
  price_note_vi  text DEFAULT 'Giá tham khảo, giá cuối do shop quyết định',
  price_updated_at date,
  dimensions     text,                  -- '20 x 30 cm'
  status         publish_status NOT NULL DEFAULT 'draft',
  is_featured    boolean NOT NULL DEFAULT false,
  published_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  -- Cột search, tự cập nhật
  search_vector  tsvector GENERATED ALWAYS AS (
    to_tsvector('vi',
      coalesce(name_vi,'') || ' ' ||
      coalesce(name_en,'') || ' ' ||
      coalesce(short_desc_vi,''))
  ) STORED
);

CREATE INDEX idx_products_search  ON products USING GIN (search_vector);
CREATE INDEX idx_products_trgm    ON products USING GIN (name_vi gin_trgm_ops);
CREATE INDEX idx_products_status  ON products (status, published_at DESC);
CREATE INDEX idx_products_shop    ON products (shop_id);
CREATE INDEX idx_products_price   ON products (price_vnd);

CREATE TABLE product_images (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         text NOT NULL,
  alt_vi      text,                     -- bắt buộc điền, phục vụ a11y + SEO
  alt_en      text,
  is_cover    boolean NOT NULL DEFAULT false,
  sort_order  int NOT NULL DEFAULT 0,
  width       int,
  height      int
);

-- Biến thể lưu dạng JSONB trên products (không phải bảng riêng):
-- biến thể chỉ để HIỂN THỊ, không bao giờ được lọc/sắp xếp theo (xem 5.5).
-- ALTER TABLE products ADD COLUMN variants jsonb DEFAULT '[]'::jsonb;
-- Ví dụ: [{"type":"size","values":[{"vi":"Nhỏ","en":"Small"},...]},
--         {"type":"color","values":[{"vi":"Đỏ","en":"Red"},...]}]

CREATE TABLE product_materials (
  product_id  uuid REFERENCES products(id) ON DELETE CASCADE,
  material_id uuid REFERENCES materials(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, material_id)
);

-- ============ ROUTES (bản đồ khám phá) ============
CREATE TABLE routes (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug         text UNIQUE NOT NULL,
  title_vi     text NOT NULL,
  title_en     text,
  description_vi text,
  description_en text,
  cover_url    text,
  duration_min int,
  status       publish_status NOT NULL DEFAULT 'draft',
  sort_order   int NOT NULL DEFAULT 0
);

CREATE TABLE route_stops (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id     uuid NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  stop_number  int NOT NULL,
  name_vi      text NOT NULL,
  name_en      text,
  description_vi text,
  description_en text,
  address      text,
  map_x        numeric NOT NULL,        -- toạ độ % trên SVG, KHÔNG phải lat/lng
  map_y        numeric NOT NULL,
  image_url    text,
  external_url text,                    -- Google Maps link, mở tab mới
  shop_id      uuid REFERENCES shops(id) ON DELETE SET NULL,  -- optional
  UNIQUE (route_id, stop_number)
);

-- ============ BLOG ============
CREATE TABLE blog_topics (
  id       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug     text UNIQUE NOT NULL,
  name_vi  text NOT NULL,
  name_en  text
);

CREATE TABLE blog_posts (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id     uuid REFERENCES blog_topics(id),
  author_id    uuid REFERENCES admin_users(id),
  slug         text UNIQUE NOT NULL,
  title_vi     text NOT NULL,
  title_en     text,
  excerpt_vi   text,
  excerpt_en   text,
  body_vi      text,                    -- Markdown, sanitize khi render
  body_en      text,
  cover_url    text,
  reading_min  int,
  is_featured  boolean NOT NULL DEFAULT false,
  status       publish_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE blog_reactions (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id       uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  reaction      text NOT NULL,          -- 'love' | 'wow' | 'inspiring'
  visitor_hash  text NOT NULL,          -- SHA256(ip + ua + salt ngày) — KHÔNG lưu IP
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, reaction, visitor_hash)
);

-- ============ CẤU HÌNH SITE + DANH SÁCH TUYỂN CHỌN ============
CREATE TYPE carousel_rule AS ENUM
  ('random', 'most_clicked', 'curated', 'curated_fill');

CREATE TABLE site_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_by uuid REFERENCES staff_members(user_id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Giá trị khởi tạo:
-- 'homepage_carousel' → {"rule":"curated_fill","limit":10,"window_days":7}
-- 'hidden_gems'       → {"mode":"tab_only","rotate_sec":60,
--                        "auto_open_scroll_pct":40,"auto_open_delay_sec":20}

-- Một bảng phục vụ cả carousel trang chủ lẫn Hidden Gems
CREATE TABLE featured_items (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_key   text NOT NULL,      -- 'homepage_carousel' | 'hidden_gems'
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  shop_id    uuid REFERENCES shops(id)    ON DELETE CASCADE,
  note_vi    text,
  note_en    text,
  starts_at  timestamptz,
  ends_at    timestamptz,
  sort_order int NOT NULL DEFAULT 0,
  CHECK (product_id IS NOT NULL OR shop_id IS NOT NULL)
);
CREATE INDEX idx_featured_list ON featured_items (list_key, sort_order);

-- ============ ANALYTICS ============
CREATE TABLE click_events (
  id            bigserial PRIMARY KEY,
  target_type   click_target NOT NULL,
  product_id    uuid REFERENCES products(id)     ON DELETE CASCADE,
  shop_id       uuid REFERENCES shops(id)        ON DELETE CASCADE,
  route_id      uuid REFERENCES routes(id)       ON DELETE CASCADE,
  route_stop_id uuid REFERENCES route_stops(id)  ON DELETE CASCADE,
  stop_number   int,                    -- denormalize để phân tích rơi rụng
  platform      social_platform,        -- chỉ khi target = order_now/social_link
  visitor_hash  text NOT NULL,          -- ẩn danh, xoay salt mỗi ngày
  session_id    text NOT NULL,
  referrer_host text,
  device_type   text,                   -- 'mobile' | 'tablet' | 'desktop'
  locale        text,                   -- 'vi' | 'en'
  is_bot        boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_click_target ON click_events (target_type, created_at DESC);
CREATE INDEX idx_click_prod   ON click_events (product_id, created_at DESC);
CREATE INDEX idx_click_route  ON click_events (route_id, stop_number);

-- KHÔNG có unique index khử trùng lặp. Ghi mọi sự kiện, khử trùng lặp
-- lúc ĐỌC (xem 8.2). Cửa sổ thời gian là tham số phân tích, không phải
-- quyết định phá huỷ dữ liệu.

CREATE TABLE search_logs (
  id            bigserial PRIMARY KEY,
  query         text NOT NULL,
  normalized    text NOT NULL,          -- unaccent + lower
  result_count  int  NOT NULL,
  clicked_result boolean NOT NULL DEFAULT false,
  locale        text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_search_zero ON search_logs (normalized) WHERE result_count = 0;

-- ============ VÒNG PHẢN HỒI CHỐNG "DATA ĐỂU" ============
CREATE TABLE shop_monthly_reports (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id          uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  period_month     date NOT NULL,       -- luôn là ngày 01
  orders_reported  int,                 -- shop tự khai
  revenue_reported bigint,
  best_seller_note text,
  submitted_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_id, period_month)
);

-- ============ AUDIT ============
CREATE TABLE audit_logs (
  id          bigserial PRIMARY KEY,
  actor_id    uuid REFERENCES admin_users(id),
  action      text NOT NULL,            -- 'product.publish', 'shop.delete'
  entity_type text NOT NULL,
  entity_id   uuid,
  before_data jsonb,
  after_data  jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity ON audit_logs (entity_type, entity_id, created_at DESC);
```

### 4.3 Row Level Security

Bật RLS trên **mọi** bảng. Nguyên tắc:

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Khách chỉ đọc được nội dung đã publish
CREATE POLICY public_read_published ON products
  FOR SELECT USING (status = 'published');

-- Ghi/sửa/xóa chỉ qua service role ở server, không bao giờ từ client
```

**Khi lên V2 (shop tự upload), policy sẽ có dạng — và đây chính là lý do phải tách hai trục:**

```sql
-- Nhân sự: quyền toàn cục, không cần điều kiện phạm vi
CREATE POLICY staff_write ON products FOR ALL
  USING (EXISTS (SELECT 1 FROM staff_members s
                 WHERE s.user_id = auth.uid()
                   AND s.role IN ('admin','moderator')
                   AND s.is_active));

-- Shop: quyền có phạm vi, bắt buộc khớp shop_id
CREATE POLICY shop_write ON products FOR ALL
  USING (EXISTS (SELECT 1 FROM shop_members m
                 WHERE m.user_id = auth.uid()
                   AND m.shop_id = products.shop_id));
```

Nếu gộp `shop` vào cùng enum với `admin`, hai policy trên phải viết chung một biểu thức — vừa khó đọc vừa dễ sai, và một bug gán nhầm giá trị enum sẽ trao quyền toàn cục cho shop.

**Quy tắc tuyệt đối:** `SUPABASE_SERVICE_ROLE_KEY` chỉ tồn tại trong Server Actions / Route Handlers. Không bao giờ đặt tiền tố `NEXT_PUBLIC_` cho nó — làm vậy là công khai chìa khóa toàn bộ database.

---

## 5. ĐẶC TẢ CHỨC NĂNG

Ký hiệu ưu tiên: **P0** = bắt buộc launch · **P1** = nên có · **P2** = cắt được.

### 5.1 Trang chủ (`/`)

| ID | Yêu cầu | Ưu tiên | Acceptance criteria |
|---|---|---|---|
| HP-01 | Hero banner: logo, tuyên ngôn thương hiệu, CTA | P0 | Hiển thị đúng trên viewport 360px; LCP < 2.5s |
| HP-02 | Thanh tìm kiếm live | P0 | Gõ ≥2 ký tự → hiện tối đa 8 gợi ý sau 250ms debounce; "non la" ra "Nón lá"; có trạng thái không kết quả |
| HP-03 | Carousel "What's in Store" — **rule cấu hình được** | P0 | Admin chọn 1 trong 4 rule qua `site_settings`: `random` / `most_clicked` (cửa sổ ngày cấu hình được) / `curated` (admin ghim thủ công) / `curated_fill` (ghim N + tự lấp bằng most_clicked). **Mặc định `curated_fill`** vì ngày launch chưa có dữ liệu click. Bắt buộc có fallback: nếu thiếu sản phẩm thì lấp bằng mới nhất — carousel không bao giờ trống. Loop vô tận; vuốt trên mobile; nút trái/phải desktop |
| HP-04 | Bản đồ route khám phá — **Carousel các quận** | P1 | *Chung:* Hiển thị bản đồ theo dạng carousel, mỗi slide là một quận/khu vực có bản đồ riêng. Trên bản đồ có các pin đánh dấu địa điểm. Nhấp vào một pin sẽ chuyển hướng đến trang Khám phá (subpage) hiển thị lộ trình chi tiết theo hướng liệt kê, điểm bắt đầu là pin vừa chọn. Bối cảnh giống hero section, lướt qua để chuyển quận. |
| HP-05 | Drawer "Hidden Gems" — **tab thu gọn** | P1 (tab) / P2 (auto-open) | Đóng drawer → thu về **tab nhỏ ở mép phải**, chạm để mở lại. Tab rộng ≤32px, đặt ở 60–70% chiều cao màn hình, tự ẩn khi cuộn xuống. *Mobile:* tab luôn hiện, **không** tự mở. *Desktop:* tự mở khi cuộn quá 40% hoặc sau 20s (**không** dùng timer 3s). **Không đổi nội dung khi drawer đang mở** — chỉ đổi khi đóng hoặc lúc mở lại. Hành vi điều khiển bằng cờ `site_settings['hidden_gems']` = `off\|tab_only\|auto_open` |
| HP-06 | Curated Collections | P2 | Admin tạo bộ sưu tập chủ đề |
| HP-07 | Footer | P0 | Email liên hệ, link Điều khoản + Chính sách bảo mật, copyright, chuyển ngôn ngữ |

> **HP-05 quan trọng:** drawer tự bung ra là mẫu thiết kế dễ gây khó chịu. Bắt buộc: không tự mở trên mobile, không tự mở lại nếu user đã đóng.

### 5.2 Tất cả sản phẩm (`/san-pham`)

| ID | Yêu cầu | Ưu tiên | Acceptance criteria |
|---|---|---|---|
| AP-01 | Lưới sản phẩm phân trang | P0 | 24 sp/trang; SSR; URL chứa toàn bộ state filter (chia sẻ được, index được) |
| AP-02 | Lọc theo danh mục | P0 | 7 danh mục; chọn nhiều; số lượng kết quả hiện cạnh mỗi mục |
| AP-03 | Lọc theo chất liệu | P0 | Chọn nhiều |
| AP-04 | Lọc theo khoảng giá | P1 | 5 khoảng cố định; sản phẩm không có giá gom vào nhóm "Liên hệ" |
| AP-05 | Sắp xếp | P0 | Mới nhất / Phổ biến / Giá tăng / Giá giảm |
| AP-06 | Filter trên mobile — **mẫu lai** | P0 | Danh mục = chip cuộn ngang **luôn hiện** (facet dùng nhiều nhất, 1 chạm). Chất liệu + giá + sắp xếp = **bottom sheet** có nút "Áp dụng" gộp request. Badge hiện số filter đang bật. Nếu tổng control > 15 → đổi sang overlay toàn màn hình |
| AP-07 | Empty state | P0 | Khi 0 kết quả: gợi ý xoá bớt filter + 4 sản phẩm gợi ý |

### 5.3 Trang shop (`/shop/[slug]`)

| ID | Yêu cầu | Ưu tiên | Acceptance criteria |
|---|---|---|---|
| SD-01 | Hero: logo, ảnh cover, tagline | P0 | Ảnh cover 21:9 desktop, 3:2 mobile |
| SD-02 | Brand story | P0 | Render Markdown đã sanitize |
| SD-03 | Card social | P0 | Chỉ hiện platform có link và `is_visible = true`; hover animation; `target="_blank" rel="noopener noreferrer"`; kèm UTM |
| SD-04 | "Popular now" của shop | P1 | 6 sản phẩm nhiều click nhất |
| SD-05 | Toàn bộ sản phẩm của shop | P0 | Có phân trang |
| SD-06 | Lưu shop | P2 (V1.5) | |

### 5.4 Trang sản phẩm (`/san-pham/[slug]`)

| ID | Yêu cầu | Ưu tiên | Acceptance criteria |
|---|---|---|---|
| PD-01 | Gallery ảnh | P0 | Ảnh chính vuông + thumbnail dọc (desktop) / vuốt ngang (mobile); lightbox toàn màn hình; điều hướng bằng phím; **tối đa 8 ảnh ở V1** (xem ghi chú) |
| PD-02 | Khối ORDER NOW | P0 | Nút cho từng platform shop có đăng ký; click ghi `click_events` rồi mở tab mới kèm UTM |
| PD-03 | Auto-copy tin nhắn | P1 | Modal hiện tin nhắn đã soạn + nút Copy; **có textarea chọn tay làm fallback**; báo thành công/thất bại rõ ràng |
| PD-04 | Thông tin sản phẩm | P0 | Tên, giá tham khảo + ghi chú + ngày cập nhật, chất liệu, kích thước, biến thể, story |
| PD-05 | Logo shop dẫn về trang shop | P0 | |
| PD-06 | Thêm vào wishlist | P0 | Lưu `localStorage`; icon đổi trạng thái; hoạt động khi không đăng nhập |
| PD-07 | Sản phẩm liên quan | P1 | 4 sản phẩm cùng danh mục |

> **PD-01 — Giới hạn ảnh:** bạn yêu cầu 20 ảnh/sản phẩm (5.3). Về kỹ thuật thì được, nhưng: (a) free tier storage sẽ hết rất nhanh, (b) không ai xem quá ảnh thứ 6, (c) 20 ảnh × 200 sản phẩm = 4.000 ảnh cần admin xử lý thủ công trong 22 ngày. **V1 giới hạn 8, schema không giới hạn** — nâng lên bất cứ lúc nào.

> **PD-03 — Ràng buộc kỹ thuật:** `navigator.clipboard.write()` yêu cầu HTTPS và thao tác trực tiếp của người dùng. Safari iOS đặc biệt khó tính. Fallback textarea là **bắt buộc**, không phải tuỳ chọn.

### 5.5 Blog (`/blog`)

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| BL-01 | 1–3 bài nổi bật dạng banner lớn | P0 |
| BL-02 | Khám phá theo chủ đề — **admin CRUD được** | P0 |
| BL-03 | Bài mới nhất, phân trang | P0 |
| BL-04 | Trang chi tiết bài viết | P0 |
| BL-05 | Reactions (love / wow / inspiring) | P1 |
| BL-06 | Chèn card sản phẩm vào giữa bài | P1 |

Chủ đề khởi tạo: Câu chuyện thương hiệu · Triển lãm & Hội chợ · Khởi nghiệp sáng tạo · Xu hướng tiêu dùng · Du lịch mua sắm · Đặc sản TP.HCM · Thủ công mỹ nghệ

**Vòng đời chủ đề (đây là lý do `blog_topics` là bảng chứ không phải enum — enum muốn thêm giá trị phải chạy migration):**
- Thêm/sửa/xoá chủ đề trong admin, không cần deploy
- **Slug khoá lại** sau khi chủ đề có bài published. Đổi tên hiển thị thì sửa `name_vi`, slug giữ nguyên — nếu không, mọi link đã share sẽ 404
- Xoá chủ đề đang có bài: `ON DELETE SET NULL`, kèm cảnh báo "Chủ đề này có N bài viết". **Tuyệt đối không CASCADE** — sẽ xoá mất bài viết
- Ưu tiên `is_active = false` thay vì xoá thật: ẩn khỏi menu nhưng URL cũ vẫn sống

### 5.6 Trang tĩnh

| Trang | Nội dung | Ưu tiên |
|---|---|---|
| `/gioi-thieu` | Brand story, Vision, Mission, 4 Core Values (lấy từ `TÍ_COOLTURE.pdf`), team | P0 |
| `/faq` | Vì sao chọn nền tảng, lợi ích, cách shop tham gia | P0 |
| `/dieu-khoan` | Điều khoản sử dụng | P0 (pháp lý) |
| `/bao-mat` | Chính sách bảo mật | P0 (pháp lý) |
| `/hop-tac` | Link Google Form đăng ký làm shop đối tác | P0 |
| `/404`, `/500` | Trang lỗi thiết kế đúng brand | P0 |

### 5.7 Admin CMS (`/admin`)

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| AD-01 | Đăng nhập (Supabase Auth, email + password, bắt buộc 2FA) | P0 |
| AD-02 | CRUD shop | P0 |
| AD-03 | CRUD sản phẩm + upload nhiều ảnh, kéo thả sắp xếp, chọn ảnh cover | P0 |
| AD-04 | CRUD bài blog, soạn thảo Markdown, preview | P0 |
| AD-05 | **Trình sửa bản đồ route** — click nền để thêm pin, kéo để di chuyển, sửa thứ tự stop, xoá pin, preview giống trang public | P1 |
| AD-06 | Quản lý Hidden Gems | P1 |
| AD-07 | Bật/tắt hiển thị shop, sản phẩm | P0 |
| AD-08 | Dashboard analytics (xem Mục 8) | P0 |
| AD-09 | Export CSV/Excel | P1 |
| AD-10 | Nhật ký audit | P1 |
| AD-11 | Nhập báo cáo tháng của shop | P1 |
| AD-12 | Sửa `site_settings`: rule carousel, chế độ Hidden Gems | P1 |
| AD-13 | CRUD chủ đề blog (`is_active`, `sort_order`) | P1 |

### 5.8 Ghi chú kỹ thuật — Bản đồ route

**Toạ độ lưu dạng phần trăm, không phải pixel.** Pin đặt bằng `position:absolute; left:{map_x}%; top:{map_y}%` trong container `position:relative` chứa ảnh nền. Admin click → `map_x = (clientX - rect.left) / rect.width * 100`. Cách này tránh phải thao tác hệ toạ độ SVG, và cho phép thay/đổi kích thước bản đồ mà pin vẫn đúng chỗ.

**Vì sao mobile không giữ nguyên bản đồ pan/zoom:**
1. *Xung đột cử chỉ* — bản đồ pan nằm giữa trang cuộn dọc sẽ nuốt thao tác vuốt của người dùng.
2. *Vùng chạm* — bản đồ TP.HCM vừa màn 360px thì pin còn ~8px, dưới ngưỡng 44×44px.
3. *Mất ngữ cảnh* — zoom đủ to để bấm được pin thì không còn thấy toàn tuyến, mà toàn tuyến chính là giá trị của route.
4. *Nhãn chữ* — tên địa điểm không đọc được ở tỷ lệ vừa màn hình.

Bản thu nhỏ tĩnh giữ ngữ cảnh không gian, danh sách giữ khả năng thao tác, modal fullscreen dành cho người thật sự muốn khám phá.

### 5.9 Ghi chú kỹ thuật — Hidden Gems: đo lường thay vì A/B test

Với lưu lượng dự kiến (vài trăm phiên/tuần lúc launch), một phép thử A/B đúng chuẩn cần ~1.000+ phiên mỗi nhánh và sẽ chạy nhiều tháng mà không kết luận được. Thay bằng **cờ cấu hình + đọc phễu**:

```
gem_tab_impression → gem_tab_click → gem_view → gem_outbound
```

Quy trình: chạy `tab_only` 2 tuần → chạy `auto_open` 2 tuần → so tỷ lệ. Admin đổi cờ trong CMS, không cần deploy lại.
**Ngưỡng quyết định:** nếu `gem_tab_click / gem_tab_impression` < 2% sau 4 tuần → đặt cờ về `off`.

---

## 6. YÊU CẦU PHI CHỨC NĂNG

### 6.1 Hiệu năng

| Chỉ số | Ngưỡng |
|---|---|
| LCP (mobile, 4G) | < 2,5s |
| CLS | < 0,1 |
| INP | < 200ms |
| Kích thước JS trang chủ | < 200KB gzip |
| Ảnh | WebP/AVIF, cạnh dài tối đa 1600px, lazy load ngoài viewport |

### 6.2 SEO — hạng mục P0, không phải "làm sau"

- SSR toàn bộ trang công khai
- Metadata động: title, description, canonical cho mọi sản phẩm/shop/bài viết
- OG image động cho từng sản phẩm
- JSON-LD: `Product` (kèm `offers.url` trỏ về social của shop), `Organization`, `BreadcrumbList`, `Article`
- `sitemap.xml` tự sinh, `robots.txt`
- Slug tiếng Việt không dấu: `nón-lá-mộc-chay` → `non-la-moc-chay`
- `hreflang` cho vi/en

### 6.3 Đa ngôn ngữ

- Thư viện: `next-intl`
- Cấu trúc URL: `/` (vi, mặc định) và `/en/`
- **Nội dung**: tiếng Việt bắt buộc, tiếng Anh tuỳ chọn. Thiếu bản EN → fallback về VI kèm nhãn nhỏ "Vietnamese only". Không dùng máy dịch tự động cho brand story.
- **Giao diện**: dịch 100%

### 6.4 Accessibility (WCAG 2.1 AA)

**Ràng buộc màu bắt buộc:**

| Màu | Tương phản trên nền trắng | Được dùng cho |
|---|---|---|
| `#7520F7` tím | ~6,3:1 ✅ | Chữ, link, nút, mọi thứ |
| `#39D6CF` teal-300 | ~1,8:1 ❌ | **CHỈ** mảng nền, đường kẻ, hình trang trí. **Không bao giờ** dùng cho chữ hoặc icon trên nền trắng |
| `#0E9B94` teal-500 | ~3,4:1 ⚠️ | Viền, icon ≥24px, tiêu đề ≥24px. Không dùng cho chữ thường |
| `#0B7C77` teal-700 | ~5,0:1 ✅ | Chữ, link, nút — bậc teal an toàn chính |
| `#064F4B` teal-900 | ~9,4:1 ✅ | Chữ trên nền teal-100 |
| Chữ đen trên nền teal-300 | ~11,7:1 ✅ | Được — cách dùng màu brand tốt nhất |

Yêu cầu khác: mọi ảnh có `alt`; điều hướng đầy đủ bằng bàn phím; focus ring rõ ràng; vùng chạm ≥44×44px; hỗ trợ `prefers-reduced-motion`.

### 6.5 Trình duyệt

Chrome/Edge/Safari/Firefox 2 phiên bản gần nhất, Safari iOS 16+, Chrome Android. **Mobile-first**: thiết kế 360px trước, mở rộng dần lên.

---

## 7. BẢO MẬT

### 7.1 Checklist bắt buộc trước launch

- [ ] `SUPABASE_SERVICE_ROLE_KEY` chỉ ở server, không có tiền tố `NEXT_PUBLIC_`
- [ ] RLS bật trên mọi bảng, có policy tường minh
- [ ] Toàn bộ input validate bằng Zod **ở server** (client validate chỉ để UX)
- [ ] Markdown sanitize bằng `rehype-sanitize` trước khi render — **không dùng `dangerouslySetInnerHTML` chưa lọc**
- [ ] URL social validate: chỉ `https:`, host phải nằm trong whitelist
- [ ] Upload ảnh: kiểm tra magic bytes (không tin `Content-Type`), giới hạn 5MB, re-encode để xóa EXIF (ảnh điện thoại chứa GPS)
- [ ] Rate limit: search 30 req/phút/IP, admin login 5 lần/15 phút
- [ ] Security headers: CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] Bật 2FA cho tài khoản admin
- [ ] Bật Dependabot
- [ ] Xoá toàn bộ dữ liệu seed/test trước khi lên production
- [ ] Trang admin có `noindex`
- [ ] Sentry đã cấu hình, tắt gửi PII

### 7.2 Whitelist domain social

```
instagram.com · www.instagram.com
tiktok.com    · www.tiktok.com · vt.tiktok.com
facebook.com  · www.facebook.com · fb.com · m.me
threads.net   · www.threads.net · threads.com
shopee.vn
zalo.me       · chat.zalo.me
```
Domain khác → chỉ admin duyệt thủ công mới thêm được.

---

## 8. ĐO LƯỜNG — CHỐNG "DATA ĐỂU"

Đây là mục quan trọng nhất của SRS, vì mục tiêu dài hạn của dự án là mở cửa hàng vật lý dựa trên dữ liệu này.

### 8.1 Vấn đề

Lượt view và lượt click **không** đo được ý định mua. Một sản phẩm nhiều view có thể chỉ vì ảnh đẹp, được đặt ở vị trí tốt trên trang chủ, hoặc được share trên Threads. Chọn hàng cho cửa hàng vật lý dựa trên view = lỗ.

### 8.2 Định nghĩa sự kiện (giải quyết B4)

| Sự kiện | Định nghĩa |
|---|---|
| `product_view` | Trang chi tiết render, sản phẩm hiện trong viewport ≥1s |
| `order_now` | Click nút social ở trang sản phẩm |
| `wishlist_add` | Bấm lưu |
| `shop_view` | Trang shop render |

**Nguyên tắc: ghi mọi sự kiện, khử trùng lặp lúc ĐỌC.**

```sql
SELECT product_id,
       COUNT(DISTINCT (visitor_hash, created_at::date)) AS unique_views,
       COUNT(*)                                          AS raw_views
FROM click_events
WHERE target_type = 'product_view'
  AND is_bot = false
  AND created_at > now() - interval '7 days'
GROUP BY product_id;
```

Lý do không khử trùng lặp lúc ghi:
- **Cửa sổ thời gian trở thành tham số phân tích chứ không phải quyết định phá huỷ dữ liệu.** Muốn thử 12h thay vì 24h? Đổi query. Nếu chặn ở tầng ghi, dữ liệu mất vĩnh viễn.
- **Giữ được tín hiệu mạnh nhất:** người xem sản phẩm buổi sáng rồi quay lại buổi tối. Đó là chỉ dấu ý định mua rõ nhất trên site, và unique index sẽ xoá nó.
- Chi phí không đáng kể: vài nghìn dòng/tháng ở quy mô hiện tại.

**Vì sao mặc định phân tích là 24h:** `visitor_hash = SHA256(ip + user_agent + salt_của_ngày)`. Salt xoay mỗi 24h, nên hash chỉ ổn định trong phạm vi một ngày. Cửa sổ ngắn hơn đòi hỏi định danh sống lâu hơn — mà điều đó đẩy dữ liệu vào phạm vi dữ liệu cá nhân theo Luật BVDLCN. Thiết kế riêng tư quyết định con số này.

**Chống spam chuyển sang tầng khác:** rate limit API (≤100 sự kiện/phiên), lọc user-agent bot, cờ `is_bot`. Xếp hạng luôn dùng `COUNT(DISTINCT visitor_hash per day)` → bot F5 1.000 lần vẫn chỉ tính 1.

### 8.3 Chỉ số dashboard (trả lời 11.2)

**Nhóm A — Sức khoẻ traffic**
- Khách duy nhất theo tuần (chỉ số thành công chính, 11.1)
- Khách quay lại / khách mới
- Nguồn traffic
- Tỉ lệ mobile / desktop
- Tỉ lệ ngôn ngữ vi / en (đo giá trị của việc làm bản EN)

**Nhóm B — Ý định mua ⭐ quan trọng nhất**
- **Outbound CTR** = `order_now` ÷ `product_view` cho từng sản phẩm ← *chỉ số gần nhất với "muốn mua"*
- **Save rate** = `wishlist_add` ÷ `product_view`
- Xếp hạng sản phẩm theo **outbound CTR**, không phải theo lượt view
- Outbound CTR theo danh mục → danh mục nào nên nhập cho cửa hàng vật lý
- Phân bổ theo platform (TikTok vs Instagram vs Facebook)

**Nhóm C — Khoảng trống nhu cầu**
- **Top truy vấn tìm kiếm trả về 0 kết quả** ← *mỏ vàng: người ta muốn gì mà chưa ai bán*
- Filter được dùng nhiều nhất
- Sản phẩm nhiều view nhưng CTR thấp → vấn đề ở ảnh, giá hay mô tả?

**Nhóm D — Vòng phản hồi thực tế**
- Số đơn shop tự khai theo tháng, đối chiếu với outbound click
- **Tỉ lệ chuyển đổi ngầm** = đơn khai ÷ outbound click → hệ số hiệu chỉnh cho toàn bộ dữ liệu

**Nhóm E — Vận hành**
- Số shop hoạt động, sản phẩm mới/tuần
- Sản phẩm không có click nào trong 30 ngày

### 8.4 UTM — bắt buộc từ ngày đầu

Mọi link ra ngoài phải mang:
```
?utm_source=ticoolture&utm_medium=referral
&utm_campaign=product&utm_content=<product_slug>
```
Lợi ích kép: (1) shop tự thấy traffic từ bạn trong analytics của họ → tăng uy tín khi mời shop mới; (2) tạo được bằng chứng khách quan để đối chiếu với dữ liệu nội bộ.

### 8.5 Đo lường bản đồ route

| Chỉ số | Cách tính | Giá trị |
|---|---|---|
| Phễu route | `route_view → route_stop_click → route_stop_external` | Route có thật sự dẫn người ta đi không |
| **Rơi rụng theo `stop_number`** | Số click giảm dần theo thứ tự stop | Nếu ai cũng dừng ở stop 3 → route quá dài, cắt còn 4–5 điểm |
| Số stop click TB/phiên | | Route hấp dẫn hay chỉ là hình trang trí |
| **Top stop toàn site** | Xếp hạng `route_stop_click` | ⭐ Dữ liệu trực tiếp cho quyết định chọn vị trí cửa hàng vật lý |
| `map_interacted` mobile vs desktop | Tỷ lệ phiên có tương tác | Kiểm chứng quyết định hybrid ở 5.8 |

**Không log toạ độ pan/zoom liên tục.** Ghi đúng **một** sự kiện `map_interacted` cho mỗi phiên — chỉ cần biết có/không tương tác, không cần biết kéo đi đâu. Log liên tục sinh hàng nghìn dòng vô dụng mỗi phiên.

---

## 9. TUÂN THỦ PHÁP LÝ

> ⚠️ **Không phải tư vấn pháp lý.** Đây là checklist rủi ro để bạn mang đi hỏi luật sư.

### 9.1 Tình trạng

Luật Thương mại điện tử 2025 (Luật số 122/2025/QH15) có hiệu lực từ 01/7/2026. Luật Bảo vệ dữ liệu cá nhân (Luật số 91/2025/QH15) có hiệu lực từ 01/01/2026. Cả hai đều đang áp dụng.

Với kiến trúc D1 + D2 (không tài khoản shop, không tài khoản user), Tí Coolture V1 ở vị thế của một **website giới thiệu/quảng bá do chủ quản tự vận hành nội dung**, không phải nền tảng trung gian. Đây là vị thế rủi ro thấp hơn đáng kể. **Nhưng phải được luật sư xác nhận.**

### 9.2 Việc phải làm trước launch

- [ ] Đăng Điều khoản sử dụng + Chính sách bảo mật, tiếng Việt, vị trí dễ thấy
- [ ] Công khai thông tin chủ quản: tên tổ chức/nhóm, email liên hệ
- [ ] Ghi rõ trên mọi trang sản phẩm: **"Tí Coolture không bán hàng và không xử lý giao dịch. Mọi giao dịch diễn ra trực tiếp giữa bạn và thương hiệu."**
- [ ] Ghi rõ giá là **giá tham khảo**, kèm ngày cập nhật
- [ ] Có kênh tiếp nhận phản ánh (email là đủ cho V1)
- [ ] Ký thoả thuận đơn giản với từng shop: cho phép Tí Coolture sử dụng hình ảnh và thông tin sản phẩm
- [ ] Kiểm tra bản quyền toàn bộ ảnh dùng trên site
- [ ] Xác minh license webfont (xem 11.2)

### 9.3 Việc phải làm trước V1.5 (mở tài khoản user)

- [ ] Consent banner thật, mặc định từ chối cookie không thiết yếu
- [ ] Chức năng xuất dữ liệu cá nhân
- [ ] Chức năng xóa tài khoản (xóa thật, không chỉ ẩn)
- [ ] Ghi log consent
- [ ] Quyết định vị trí lưu trữ dữ liệu (xem 9.4)

### 9.4 Vấn đề chưa rõ — cần hỏi luật sư

1. Khoản 3 Điều 14 Luật TMĐT 2025 miễn trừ những trường hợp nào? Tí Coolture có thuộc diện miễn trừ không?
2. Website giới thiệu sản phẩm bên thứ ba, có hiển thị giá, không có chức năng đặt hàng — có phải làm thủ tục thông báo/đăng ký không?
3. Nghị định 248/2026/NĐ-CP hướng dẫn thi hành có quy định gì áp dụng cho mô hình này?
4. Nghĩa vụ lưu trữ dữ liệu trong nước theo Nghị định 53/2022 có phát sinh với quy mô này không? (Hiểu biết hiện tại: nghĩa vụ phát sinh khi có yêu cầu bằng văn bản từ Bộ Công an, không tự động — **cần xác minh**)
5. Nhóm 5 người không có pháp nhân thì ai chịu trách nhiệm pháp lý cho website?

**Câu 5 là câu quan trọng nhất và nên hỏi ngay tuần này.**

---

## 11. RỦI RO ĐÃ BIẾT

| # | Rủi ro | Mức độ | Giảm thiểu |
|---|---|---|---|
| R1 | Timeline 22 ngày, 1 dev beginner | **Rất cao** | Phương án cắt scope ở Mục 12; chấp nhận lùi ngày public |
| R2 | Chưa có ý kiến pháp lý | **Cao** | Hỏi luật sư trong tuần này; kiến trúc D1/D2 đã giảm rủi ro |
| R3 | License font DFVN không rõ | Trung bình | Không nhúng web; chỉ dùng trong logo đã vector hóa |
| R4 | Thiếu shop và ảnh chất lượng khi launch | **Cao** | Bắt đầu tuyển shop **song song** với code, không đợi web xong |
| R5 | Không có traffic sau launch | **Cao** | SEO là P0; blog 10 bài tháng đầu; xin shop cross-post |
| R6 | "Data đểu" | Trung bình | Mục 8: đo outbound CTR + UTM + báo cáo tháng của shop |
| R7 | Vercel Hobby cấm dùng thương mại | Thấp | Xem 3.2 |
| R8 | Bus factor = 1 | **Cao** | Repo trên GitHub org chung, không phải tài khoản cá nhân; README hướng dẫn setup; ít nhất 1 người khác biết cách deploy |

---

## 12. LỊCH TRÌNH

### Giai đoạn 1 — Design (09/8 → 12/8)

| Ngày | Việc |
|---|---|
| CN 09/8 | Chốt SRS. Tạo `tokens.css`. Xuất logo/họa tiết dạng SVG. Mua domain. |
| T2 10/8 | Hi-fi mobile + desktop: Trang chủ, Trang sản phẩm |
| T3 11/8 | Hi-fi: Danh sách sản phẩm, Trang shop, Blog. Empty/error/loading state |
| **T4 12/8** | **Demo UX/UI** |

### Giai đoạn 2 — Build (13/8 → 19/8)

| Ngày | Việc |
|---|---|
| T5 13/8 | Khởi tạo dự án, Supabase, schema, deploy staging |
| T6 14/8 | Design system trong code: shadcn theme, component cơ bản |
| T7–CN 15–17/8 | Trang chủ, danh sách sản phẩm, trang sản phẩm, trang shop |
| T2 18/8 | Admin CMS: CRUD shop + sản phẩm + upload ảnh |
| T3 19/8 sáng | Analytics, seed 10 shop / 40 sản phẩm thật |
| **T4 19/8** | **Demo web** |

*Chạy song song 13/8 → 19/8: Hưng/Tài/Minh/Thịnh tuyển shop, thu thập ảnh và thông tin, viết blog.*

### Giai đoạn 3 — Hoàn thiện & Launch (20/8 → 31/8)

| Ngày | Việc |
|---|---|
| 20–21/8 | Blog, bản đồ route, Hidden Gems |
| 22–23/8 | Bản tiếng Anh, SEO, sitemap, JSON-LD |
| 24–25/8 | Trang tĩnh, Điều khoản, Chính sách bảo mật |
| 26–27/8 | Test bảo mật (Mục 7), Lighthouse, test mobile thật |
| 28–29/8 | Nhập nội dung: mục tiêu 20+ shop, 100+ sản phẩm, 5 bài blog |
| 30/8 | Soft launch, mời shop và bạn bè test |
| **31/8** | **Public launch** |

### Phương án cắt scope nếu chậm

Cắt theo thứ tự này, dừng khi kịp tiến độ:
1. Bản đồ route → dời sang tháng 9 (nặng nhất, giá trị thấp nhất ở launch)
2. Bản tiếng Anh → dời (chỉ dịch trang chủ + About)
3. Hidden Gems drawer → dời
4. Blog → launch với 2 bài thay vì 5
5. Auto-copy tin nhắn → chỉ để nút social, bỏ modal

**Không bao giờ cắt:** SEO, trang pháp lý, security checklist, mobile layout.

---

## 13. ĐỊNH NGHĨA HOÀN THÀNH

Một tính năng được coi là xong khi:
- [ ] Hoạt động trên mobile 360px và desktop 1440px
- [ ] Có empty state, loading state, error state
- [ ] Toàn bộ chữ đã qua hệ thống i18n (không hardcode)
- [ ] Đã tự kiểm accessibility: điều hướng bàn phím, alt text, tương phản
- [ ] Input được validate ở server
- [ ] Đã deploy lên staging và test tay
- [ ] Không có lỗi trong console

---

## PHỤ LỤC A — Câu hỏi còn mở

0. ~~Vai trò shop có gánh được không~~ → đã giải quyết bằng mô hình hai trục (4.2)
1. Số shop và sản phẩm mục tiêu khi launch? (câu 2.3 — cần con số để lập kế hoạch nhập liệu) **← ưu tiên cao nhất**
2. Có tự động chặn từ khóa cấm không? (câu 6.3 — đề xuất: chưa cần ở V1 vì admin tự nhập toàn bộ nội dung)
3. Chức năng report vi phạm? (câu 6.5 — đề xuất: dời sang V1.5 cùng tài khoản user; V1 dùng email là đủ)
4. Khu vực trên bản đồ chia thành mấy cụm và tên gì?
5. Ai là người thứ hai biết cách deploy? (rủi ro R8)
6. Repo đặt ở GitHub organization nào?

---

*Tài liệu này là bản draft. Mọi mục đánh dấu ⚠️ cần xác minh trước khi triển khai.*
