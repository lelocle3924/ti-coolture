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
