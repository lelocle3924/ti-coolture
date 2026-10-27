-- ============ 00001_extensions.sql ============

-- ============ EXTENSIONS ============
-- Required for UUID generation, Vietnamese search, and fuzzy matching.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS unaccent;   -- tìm "non la" ra "nón lá"
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- fuzzy match, chịu lỗi chính tả

-- Text search config tiếng Việt: bỏ dấu rồi index
CREATE TEXT SEARCH CONFIGURATION vi (COPY = simple);
ALTER TEXT SEARCH CONFIGURATION vi
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, simple;

-- ============ 00002_enums.sql ============

-- ============ ENUMS ============
-- All custom enum types used across the schema.

CREATE TYPE admin_role          AS ENUM ('admin', 'moderator', 'viewer');
CREATE TYPE publish_status      AS ENUM ('draft', 'pending_review', 'published', 'rejected', 'hidden', 'archived');
CREATE TYPE portal_invite_status AS ENUM ('active', 'locked_pending', 'completed', 'revoked');
CREATE TYPE social_platform     AS ENUM
  ('instagram','tiktok','facebook','threads','shopee','website','zalo');
CREATE TYPE click_target        AS ENUM
  ('product_view','shop_view','order_now','wishlist_add','social_link',
   'route_view','route_stop_click','route_stop_external',
   'map_interacted','map_fullscreen_open',
   'gem_tab_impression','gem_tab_click','gem_view','gem_outbound');
CREATE TYPE carousel_rule       AS ENUM
  ('random', 'most_clicked', 'curated', 'curated_fill');
CREATE TYPE shop_role           AS ENUM ('owner', 'editor');
CREATE TYPE invite_status       AS ENUM ('pending', 'accepted', 'revoked');

-- ============ 00003_staff.sql ============

-- ============ PHÂN QUYỀN: MÔ HÌNH HAI TRỤC ============
-- Trục 1 = nhân sự nội bộ, quyền TOÀN CỤC (áp lên mọi nội dung)
-- Trục 2 = đối tác shop, quyền CÓ PHẠM VI (chỉ nội dung của chính họ)
--
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

-- ============ 00004_taxonomy.sql ============

-- ============ TAXONOMY ============
-- Two-level product taxonomy: groups (parent_id IS NULL) and kinds (parent_id = group.id).
-- A product is always filed against a leaf (kind); the group is derived from here.
-- parent_id was added after SRS v1.1 (team taxonomy session 08/09/2026).

CREATE TABLE categories (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        text UNIQUE NOT NULL,      -- 'thoi-trang-phu-kien'
  name_vi     text NOT NULL,
  name_en     text NOT NULL,
  icon        text,                      -- tên icon Lucide
  parent_id   uuid REFERENCES categories(id) ON DELETE SET NULL,
  sort_order  int  NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true
);

CREATE TABLE materials (
  id       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug     text UNIQUE NOT NULL,
  name_vi  text NOT NULL,
  name_en  text NOT NULL
);

-- ============ 00005_shops.sql ============

-- ============ SHOPS ============
-- FIX (BE plans Lỗi 2): shops MUST be created before shop_members.
-- Original SRS §4.2 had shop_members before shops — FK would fail.

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

-- V1: bảng rỗng, không có UI. V2: bật lên là dùng ngay, không cần migrate.
-- FIX (BE plans Lỗi 2): This table now correctly comes AFTER shops.
CREATE TABLE shop_members (
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id    uuid REFERENCES shops(id)      ON DELETE CASCADE,
  shop_role  shop_role NOT NULL DEFAULT 'owner',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, shop_id)
);
-- Ràng buộc 4.5 (không thể vừa là shop vừa là user cùng email)
-- được cưỡng chế ở tầng ứng dụng, không phải ở DB.

-- ============ 00006_products.sql ============

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
  product_hidden boolean NOT NULL DEFAULT false,
  shop_hidden    boolean NOT NULL DEFAULT false,
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
  url         text NOT NULL,            -- R2 key, e.g. 'products/{id}/full.webp'
  alt_vi      text,                     -- bắt buộc điền, phục vụ a11y + SEO
  alt_en      text,
  is_cover    boolean NOT NULL DEFAULT false,
  sort_order  int NOT NULL DEFAULT 0,
  width       int,
  height      int
);

-- Biến thể lưu dạng JSONB trên products (không phải bảng riêng):
-- biến thể chỉ để HIỂN THỊ, không bao giờ được lọc/sắp xếp theo (xem SRS 5.5).
-- ALTER TABLE products ADD COLUMN variants jsonb DEFAULT '[]'::jsonb;

CREATE TABLE product_materials (
  product_id  uuid REFERENCES products(id) ON DELETE CASCADE,
  material_id uuid REFERENCES materials(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, material_id)
);

-- ============ 00007_routes.sql ============

-- ============ ROUTES (bản đồ khám phá) ============

CREATE TABLE routes (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug         text UNIQUE NOT NULL,
  title_vi     text NOT NULL,
  title_en     text,
  description_vi text,
  description_en text,
  cover_url    text,                    -- R2 key
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
  image_url    text,                    -- R2 key
  external_url text,                    -- Google Maps link, mở tab mới
  -- Multi-category support: a stop can be both "café" and "shop".
  -- Stored as text[] matching mock schema RouteStopRow.categories.
  categories   text[] NOT NULL DEFAULT '{}',
  shop_id      uuid REFERENCES shops(id) ON DELETE SET NULL,  -- optional
  UNIQUE (route_id, stop_number)
);

-- ============ 00008_blog.sql ============

-- ============ BLOG ============

CREATE TABLE blog_topics (
  id       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug     text UNIQUE NOT NULL,
  name_vi  text NOT NULL,
  name_en  text,
  sort_order int NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true
);

-- FIX (BE plans Lỗi 1): author_id references staff_members(user_id),
-- NOT the nonexistent admin_users table from SRS §4.2 line 411.
CREATE TABLE blog_posts (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id     uuid REFERENCES blog_topics(id) ON DELETE SET NULL,
  author_id    uuid REFERENCES staff_members(user_id),
  slug         text UNIQUE NOT NULL,
  title_vi     text NOT NULL,
  title_en     text,
  excerpt_vi   text,
  excerpt_en   text,
  body_vi      text,                    -- Markdown, sanitize khi render
  body_en      text,
  cover_url    text,                    -- R2 key
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

-- ============ 00009_collections.sql ============

-- ============ COLLECTIONS ============
-- FIX (BE plans Lỗi 3): These tables exist in mock/schema.ts and are used
-- by the Homepage "Collections" section, but were MISSING from SRS §4.
-- Decision: add to migration (curated collections are a core UI feature).

CREATE TABLE collections (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug           text UNIQUE NOT NULL,
  title_vi       text NOT NULL,
  title_en       text,
  description_vi text,
  description_en text,
  cover_url      text,                  -- R2 key
  sort_order     int NOT NULL DEFAULT 0,
  status         publish_status NOT NULL DEFAULT 'draft'
);

CREATE TABLE collection_products (
  collection_id  uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  product_id     uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order     int NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, product_id)
);

-- ============ 00010_config.sql ============

-- ============ CẤU HÌNH SITE + DANH SÁCH TUYỂN CHỌN ============

CREATE TABLE site_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_by uuid REFERENCES staff_members(user_id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

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

-- ============ 00011_analytics.sql ============

-- ============ ANALYTICS ============
-- SRS §8: ghi mọi sự kiện, khử trùng lặp lúc ĐỌC, không lúc ghi.

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
-- lúc ĐỌC (SRS §8.2). Cửa sổ thời gian là tham số phân tích, không phải
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

-- ============ 00012_audit.sql ============

-- ============ AUDIT ============
-- V1 chỉ ghi `delete` và `publish` — đây là bảo hiểm phục hồi khi xoá nhầm,
-- không phải công cụ giám sát.

-- FIX (BE plans Lỗi 1): actor_id references staff_members(user_id),
-- NOT the nonexistent admin_users(id) from SRS §4.2 line 520.
CREATE TABLE audit_logs (
  id          bigserial PRIMARY KEY,
  actor_id    uuid REFERENCES staff_members(user_id),
  action      text NOT NULL,            -- 'product.publish', 'shop.delete'
  entity_type text NOT NULL,
  entity_id   uuid,
  before_data jsonb,
  after_data  jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity ON audit_logs (entity_type, entity_id, created_at DESC);

-- ============ 00013_portal.sql ============

-- ============ PARTNER ONBOARDING PORTAL ============
-- Phân hệ cổng đối tác: Đăng ký & nộp sản phẩm không cần mật khẩu (Magic Token).
-- Thiết kế theo docs/BACKEND-SRS.md §3.1 & §3.2.
--
-- Đặc điểm:
-- 1. Token mã hoá (token_hash) cấp độc quyền bởi team Tí Coolture.
-- 2. State machine: active -> locked_pending -> completed / revoked.
-- 3. Tự động khoá quyền sửa khi shop bấm "Gửi duyệt" (locked_pending).
-- 4. Tuyệt đối không lưu mật khẩu hay PII cá nhân nhạy cảm (tuân thủ NĐ 13/2023/NĐ-CP).

CREATE TABLE portal_invites (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id         uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  token_hash      text UNIQUE NOT NULL,                       -- SHA-256 hash của secret token
  passcode        varchar(6),                                  -- Mã PIN 6 số tuỳ chọn (lớp bảo mật 2)
  status          portal_invite_status NOT NULL DEFAULT 'active',
  created_by      uuid REFERENCES staff_members(user_id),      -- Staff tạo lời mời
  expires_at      timestamptz NOT NULL,                        -- Hạn dùng link (mặc định now() + 14 ngày)
  submitted_at    timestamptz,                                 -- Thời điểm shop bấm gửi duyệt
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,          -- Ghi chú, tên đại diện shop, số ĐT liên hệ
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_portal_invite_expiry CHECK (expires_at > created_at)
);

-- ============ INDEXES ============
CREATE INDEX idx_portal_invites_token   ON portal_invites (token_hash);
CREATE INDEX idx_portal_invites_shop    ON portal_invites (shop_id);
CREATE INDEX idx_portal_invites_status  ON portal_invites (status);
CREATE INDEX idx_portal_invites_expiry  ON portal_invites (expires_at) WHERE status = 'active';

-- ============ LIÊN KẾT PRODUCTS VỚI PORTAL INVITES ============
-- Cho phép truy vết sản phẩm được khởi tạo/cập nhật qua phiên mời nào
ALTER TABLE products ADD COLUMN IF NOT EXISTS portal_invite_id uuid REFERENCES portal_invites(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_portal_invite ON products (portal_invite_id);


-- ============ TRIGGER: AUTO UPDATE updated_at ============
CREATE OR REPLACE FUNCTION update_portal_invite_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_portal_invites_updated_at
  BEFORE UPDATE ON portal_invites
  FOR EACH ROW
  EXECUTE FUNCTION update_portal_invite_timestamp();

-- ============ ROW LEVEL SECURITY (RLS) ============
ALTER TABLE portal_invites ENABLE ROW LEVEL SECURITY;

-- 1. Staff members (admin/moderator) có toàn quyền quản lý lời mời
CREATE POLICY "Staff members have full access to portal invites"
  ON portal_invites
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_members
      WHERE staff_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_members
      WHERE staff_members.user_id = auth.uid()
        AND staff_members.role IN ('admin', 'moderator')
    )
  );

-- 2. Client vãng lai / Portal chỉ đọc được invite nếu đang active và chưa hết hạn
-- Thao tác xác thực thực tế được xử lý an toàn qua Serverless Function (/api/portal/verify-token)
CREATE POLICY "Public read active invite by exact token hash"
  ON portal_invites
  FOR SELECT
  TO anon
  USING (
    status IN ('active', 'locked_pending')
    AND expires_at > now()
  );

-- ============ SHOP INVITATIONS (GOOGLE OAUTH) ============
-- Quản lý lời mời hợp tác qua email Google.
-- Khi đối tác đăng nhập Google OAuth, hệ thống tự động đối chiếu email để cấp quyền quản lý xưởng.

CREATE TABLE shop_invitations (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id         uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  invited_email   text NOT NULL,                               -- Email Google/Gmail của đối tác
  shop_role       shop_role NOT NULL DEFAULT 'owner',
  status          invite_status NOT NULL DEFAULT 'pending',
  created_by      uuid REFERENCES staff_members(user_id),
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  accepted_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (shop_id, invited_email)
);

CREATE INDEX idx_shop_invitations_email  ON shop_invitations (invited_email);
CREATE INDEX idx_shop_invitations_shop   ON shop_invitations (shop_id);
CREATE INDEX idx_shop_invitations_status ON shop_invitations (status);

CREATE TRIGGER trg_shop_invitations_updated_at
  BEFORE UPDATE ON shop_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_portal_invite_timestamp();

ALTER TABLE shop_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff members have full access to shop invitations"
  ON shop_invitations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_members
      WHERE staff_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_members
      WHERE staff_members.user_id = auth.uid()
        AND staff_members.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Users can view pending invitations for their email"
  ON shop_invitations
  FOR SELECT
  TO authenticated
  USING (
    lower(invited_email) = lower(auth.jwt()->>'email')
    AND status = 'pending'
    AND expires_at > now()
  );

COMMENT ON TABLE shop_invitations IS 'Quản lý lời mời xưởng gửi đến email Google của đối tác';
COMMENT ON COLUMN shop_invitations.invited_email IS 'Email Google đối tác sẽ dùng để đăng nhập vào portal';

-- ============ FUZZY & FULL-TEXT HYBRID SEARCH ============
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text AS $$
  SELECT public.unaccent($1);
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

CREATE INDEX IF NOT EXISTS idx_products_name_vi_unaccent_trgm
  ON products USING GIN (public.immutable_unaccent(lower(name_vi)) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_shops_name_unaccent_trgm
  ON shops USING GIN (public.immutable_unaccent(lower(name)) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_categories_name_unaccent_trgm
  ON categories USING GIN (public.immutable_unaccent(lower(name_vi)) gin_trgm_ops);

CREATE OR REPLACE FUNCTION search_products(
  search_term text DEFAULT NULL,
  filter_category_slug text DEFAULT NULL,
  filter_shop_id uuid DEFAULT NULL,
  filter_min_price int DEFAULT NULL,
  filter_max_price int DEFAULT NULL,
  sort_by text DEFAULT 'relevance',
  page_limit int DEFAULT 24,
  page_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  shop_id uuid,
  shop_name text,
  shop_slug text,
  shop_logo_url text,
  category_id uuid,
  category_name_vi text,
  category_name_en text,
  category_slug text,
  category_group_name_vi text,
  category_group_slug text,
  slug text,
  name_vi text,
  name_en text,
  short_desc_vi text,
  short_desc_en text,
  story_vi text,
  price_vnd int,
  price_note_vi text,
  dimensions text,
  cover_image_url text,
  images jsonb,
  is_featured boolean,
  status publish_status,
  published_at timestamptz,
  rank_score real,
  total_count bigint
) AS $$
DECLARE
  v_query_clean text := trim(COALESCE(search_term, ''));
  v_query_unaccent text := public.immutable_unaccent(lower(v_query_clean));
  v_tsquery tsquery;
BEGIN
  IF v_query_clean <> '' THEN
    v_tsquery := plainto_tsquery('vi', v_query_clean);
  END IF;

  RETURN QUERY
  WITH matched_products AS (
    SELECT
      p.id,
      p.shop_id,
      s.name AS shop_name,
      s.slug AS shop_slug,
      s.logo_url AS shop_logo_url,
      p.category_id,
      c.name_vi AS category_name_vi,
      c.name_en AS category_name_en,
      c.slug AS category_slug,
      COALESCE(parent_c.name_vi, c.name_vi) AS category_group_name_vi,
      COALESCE(parent_c.slug, c.slug) AS category_group_slug,
      p.slug,
      p.name_vi,
      p.name_en,
      p.short_desc_vi,
      p.short_desc_en,
      p.story_vi,
      p.price_vnd,
      p.price_note_vi,
      p.dimensions,
      (
        SELECT pi.url
        FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.is_cover DESC, pi.sort_order ASC
        LIMIT 1
      ) AS cover_image_url,
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'url', pi.url,
              'alt_vi', pi.alt_vi,
              'is_cover', pi.is_cover,
              'sort_order', pi.sort_order
            ) ORDER BY pi.is_cover DESC, pi.sort_order ASC
          )
          FROM product_images pi
          WHERE pi.product_id = p.id
        ),
        '[]'::jsonb
      ) AS images,
      p.is_featured,
      p.status,
      p.published_at,
      CASE
        WHEN v_query_clean = '' THEN 1.0::real
        ELSE (
          COALESCE(ts_rank_cd(p.search_vector, v_tsquery), 0.0)::real * 3.0
          + similarity(public.immutable_unaccent(lower(p.name_vi)), v_query_unaccent)::real * 4.0
          + word_similarity(v_query_unaccent, public.immutable_unaccent(lower(p.name_vi)))::real * 2.5
          + word_similarity(v_query_unaccent, public.immutable_unaccent(lower(s.name)))::real * 2.0
          + word_similarity(v_query_unaccent, public.immutable_unaccent(lower(c.name_vi)))::real * 1.5
        )
      END AS rank_score
    FROM products p
    JOIN shops s ON s.id = p.shop_id
    JOIN categories c ON c.id = p.category_id
    LEFT JOIN categories parent_c ON parent_c.id = c.parent_id
    WHERE
      p.status = 'published'
      AND s.status = 'published'
      AND p.product_hidden = false
      AND p.shop_hidden = false
      AND (filter_shop_id IS NULL OR p.shop_id = filter_shop_id)
      AND (filter_min_price IS NULL OR p.price_vnd >= filter_min_price)
      AND (filter_max_price IS NULL OR p.price_vnd <= filter_max_price)
      AND (
        filter_category_slug IS NULL
        OR c.slug = filter_category_slug
        OR parent_c.slug = filter_category_slug
      )
      AND (
        v_query_clean = ''
        OR (v_tsquery IS NOT NULL AND p.search_vector @@ v_tsquery)
        OR (public.immutable_unaccent(lower(p.name_vi)) % v_query_unaccent)
        OR (word_similarity(v_query_unaccent, public.immutable_unaccent(lower(p.name_vi))) > 0.3)
        OR (word_similarity(v_query_unaccent, public.immutable_unaccent(lower(s.name))) > 0.35)
        OR (word_similarity(v_query_unaccent, public.immutable_unaccent(lower(c.name_vi))) > 0.35)
        OR (public.immutable_unaccent(lower(p.name_vi)) ILIKE '%' || v_query_unaccent || '%')
      )
  ),
  counted AS (
    SELECT COUNT(*) AS total_rows FROM matched_products
  )
  SELECT
    mp.id,
    mp.shop_id,
    mp.shop_name,
    mp.shop_slug,
    mp.shop_logo_url,
    mp.category_id,
    mp.category_name_vi,
    mp.category_name_en,
    mp.category_slug,
    mp.category_group_name_vi,
    mp.category_group_slug,
    mp.slug,
    mp.name_vi,
    mp.name_en,
    mp.short_desc_vi,
    mp.short_desc_en,
    mp.story_vi,
    mp.price_vnd,
    mp.price_note_vi,
    mp.dimensions,
    mp.cover_image_url,
    mp.images,
    mp.is_featured,
    mp.status,
    mp.published_at,
    mp.rank_score,
    c.total_rows AS total_count
  FROM matched_products mp
  CROSS JOIN counted c
  ORDER BY
    CASE WHEN sort_by = 'price_asc' THEN mp.price_vnd END ASC NULLS LAST,
    CASE WHEN sort_by = 'price_desc' THEN mp.price_vnd END DESC NULLS LAST,
    CASE WHEN sort_by = 'newest' THEN mp.published_at END DESC NULLS LAST,
    CASE WHEN sort_by = 'relevance' OR sort_by IS NULL THEN mp.rank_score END DESC,
    mp.published_at DESC NULLS LAST
  LIMIT page_limit
  OFFSET page_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION search_products(text, text, uuid, int, int, text, int, int) TO anon, authenticated;

CREATE OR REPLACE FUNCTION set_shop_visibility(
  p_shop_id uuid,
  p_visible boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_status publish_status;
BEGIN
  SELECT status INTO current_status
  FROM shops
  WHERE id = p_shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy shop.';
  END IF;

  IF current_status NOT IN ('published', 'hidden') THEN
    RAISE EXCEPTION 'Chỉ có thể ẩn hoặc hiện shop đã xuất bản.';
  END IF;

  UPDATE shops
  SET status = CASE WHEN p_visible THEN 'published'::publish_status ELSE 'hidden'::publish_status END,
      updated_at = now()
  WHERE id = p_shop_id;

  UPDATE products
  SET shop_hidden = NOT p_visible,
      updated_at = now()
  WHERE shop_id = p_shop_id;
END;
$$;

REVOKE ALL ON FUNCTION set_shop_visibility(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION set_shop_visibility(uuid, boolean) TO service_role;
