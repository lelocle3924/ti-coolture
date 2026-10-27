-- ==============================================================================
-- TÍ COOLTURE — DATABASE INITIALIZATION SCRIPT (VỚI ADMIN LOCLE30092004@GMAIL.COM)
-- ==============================================================================
-- Chạy toàn bộ file này trong Supabase Dashboard -> SQL Editor -> Bấm RUN.
-- Script này tự động tạo toàn bộ bảng, RLS, ràng buộc 1 Gmail = 1 Shop,
-- và gán quyền Admin tối cao cho locle30092004@gmail.com.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE admin_role          AS ENUM ('admin', 'moderator', 'viewer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE publish_status      AS ENUM ('draft', 'pending_review', 'published', 'rejected', 'hidden', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE portal_invite_status AS ENUM ('active', 'locked_pending', 'completed', 'revoked');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE social_platform     AS ENUM ('instagram','tiktok','facebook','threads','shopee','website','zalo');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE click_target        AS ENUM ('product_view','shop_view','order_now','wishlist_add','social_link','route_view','route_stop_click','route_stop_external','map_interacted','map_fullscreen_open','gem_tab_impression','gem_tab_click','gem_view','gem_outbound');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE carousel_rule       AS ENUM ('random', 'most_clicked', 'curated', 'curated_fill');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE shop_role           AS ENUM ('owner', 'editor');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE invite_status       AS ENUM ('pending', 'accepted', 'revoked');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. STAFF MEMBERS (Ban Quản Trị & Admin)
CREATE TABLE IF NOT EXISTS staff_members (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text UNIQUE NOT NULL,
  full_name   text NOT NULL DEFAULT '',
  role        admin_role NOT NULL DEFAULT 'viewer',
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Ensure email column is unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_members_email ON staff_members (email);

ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff read policy" ON staff_members;
CREATE POLICY "Staff read policy" ON staff_members
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Helper function to check admin without recursion
CREATE OR REPLACE FUNCTION is_staff_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_members WHERE user_id = uid AND role = 'admin' AND is_active = true
  );
$$;

DROP POLICY IF EXISTS "Admins can manage staff" ON staff_members;
CREATE POLICY "Admins can manage staff" ON staff_members
  FOR ALL TO authenticated
  USING (is_staff_admin(auth.uid()))
  WITH CHECK (is_staff_admin(auth.uid()));

-- 4. TAXONOMY (Danh mục & Chất liệu)
CREATE TABLE IF NOT EXISTS categories (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        text UNIQUE NOT NULL,
  name_vi     text NOT NULL,
  name_en     text NOT NULL,
  icon        text,
  parent_id   uuid REFERENCES categories(id) ON DELETE SET NULL,
  sort_order  int  NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS materials (
  id       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug     text UNIQUE NOT NULL,
  name_vi  text NOT NULL,
  name_en  text NOT NULL
);

-- 5. SHOPS & SHOP MEMBERS
CREATE TABLE IF NOT EXISTS shops (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug              text UNIQUE NOT NULL,
  name              text NOT NULL,
  tagline_vi        text,
  tagline_en        text,
  story_vi          text,
  story_en          text,
  logo_url          text,
  cover_url         text,
  contact_email     text,
  is_online_only    boolean NOT NULL DEFAULT true,
  address           text,
  area_tag          text,
  status            publish_status NOT NULL DEFAULT 'draft',
  is_featured       boolean NOT NULL DEFAULT false,
  legal_name        text,
  tax_code          text,
  business_reg_no   text,
  identity_verified boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shop_members (
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id     uuid REFERENCES shops(id) ON DELETE CASCADE,
  shop_role   shop_role NOT NULL DEFAULT 'owner',
  joined_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, shop_id)
);

CREATE TABLE IF NOT EXISTS shop_socials (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id    uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  platform   social_platform NOT NULL,
  url        text NOT NULL,
  handle     text,
  is_visible boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  UNIQUE (shop_id, platform)
);

-- 6. PRODUCTS & PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS products (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id        uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  category_id    uuid NOT NULL REFERENCES categories(id),
  slug           text UNIQUE NOT NULL,
  name_vi        text NOT NULL,
  name_en        text,
  short_desc_vi  text,
  short_desc_en  text,
  story_vi       text,
  story_en       text,
  price_vnd      int,
  price_note_vi  text DEFAULT 'Giá tham khảo, giá cuối do shop quyết định',
  dimensions     text,
  status         publish_status NOT NULL DEFAULT 'draft',
  product_hidden boolean NOT NULL DEFAULT false,
  shop_hidden    boolean NOT NULL DEFAULT false,
  is_featured    boolean NOT NULL DEFAULT false,
  variants       jsonb DEFAULT '[]'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_images (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         text NOT NULL,
  alt_vi      text,
  alt_en      text,
  is_cover    boolean NOT NULL DEFAULT false,
  sort_order  int NOT NULL DEFAULT 0,
  width       int,
  height      int
);

CREATE TABLE IF NOT EXISTS product_materials (
  product_id  uuid REFERENCES products(id) ON DELETE CASCADE,
  material_id uuid REFERENCES materials(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, material_id)
);

-- 7. SHOP INVITATIONS (1 GMAIL = 1 SHOP DUY NHẤT)
CREATE TABLE IF NOT EXISTS shop_invitations (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id         uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  invited_email   text UNIQUE NOT NULL,                       -- Ràng buộc 1 Gmail = 1 Shop
  shop_role       shop_role NOT NULL DEFAULT 'owner',
  status          invite_status NOT NULL DEFAULT 'pending',
  created_by      uuid,
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  accepted_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shop_invitations_email  ON shop_invitations (invited_email);
CREATE INDEX IF NOT EXISTS idx_shop_invitations_shop   ON shop_invitations (shop_id);

ALTER TABLE shop_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff members have full access to shop invitations" ON shop_invitations;
CREATE POLICY "Staff members have full access to shop invitations"
  ON shop_invitations FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM staff_members WHERE staff_members.user_id = auth.uid() AND staff_members.is_active = true)
  );

DROP POLICY IF EXISTS "Users can read and accept own invitations" ON shop_invitations;
CREATE POLICY "Users can read and accept own invitations"
  ON shop_invitations FOR ALL TO authenticated
  USING (lower(invited_email) = lower(auth.jwt() ->> 'email'))
  WITH CHECK (lower(invited_email) = lower(auth.jwt() ->> 'email'));

ALTER TABLE shop_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can manage own shop membership" ON shop_members;
CREATE POLICY "Members can manage own shop membership"
  ON shop_members FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Staff can read all shop members" ON shop_members;
CREATE POLICY "Staff can read all shop members"
  ON shop_members FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM staff_members WHERE staff_members.user_id = auth.uid() AND staff_members.is_active = true)
  );

-- 8. PARTNER REQUESTS (YÊU CẦU MỞ XƯỞNG TỪ WEBSITE CHÍNH)
CREATE TABLE IF NOT EXISTS partner_requests (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_name       text NOT NULL,
  applicant_email text NOT NULL,
  applicant_name  text,
  phone_or_zalo   text,
  social_link     text,
  category        text,
  description     text,
  status          text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by     uuid,
  reviewed_at     timestamptz,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE partner_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can submit partner request" ON partner_requests;
CREATE POLICY "Public can submit partner request" ON partner_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Staff view requests" ON partner_requests;
CREATE POLICY "Staff view requests" ON partner_requests
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM staff_members WHERE staff_members.user_id = auth.uid() AND staff_members.is_active = true)
  );

-- 9. GÁN QUYỀN ADMIN CHO locle30092004@gmail.com
INSERT INTO staff_members (user_id, email, full_name, role, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE lower(email) = 'locle30092004@gmail.com' LIMIT 1),
  'locle30092004@gmail.com',
  'Lộc Lê (Admin Tối Cao)',
  'admin',
  true
)
ON CONFLICT (email) DO UPDATE 
SET 
  user_id = COALESCE(EXCLUDED.user_id, staff_members.user_id),
  role = 'admin', 
  is_active = true;

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

-- 10. CHÈN MẪU MỘT SỐ XƯỞNG THỰC TẾ
INSERT INTO shops (slug, name, tagline_vi, status) VALUES
  ('gom-moc-chan', 'Gốm Mộc Chân', 'Gốm vuốt tay men tro thủ công', 'published'),
  ('ga-con-studios', 'Gà con Studios', 'Sổ tay bọc da khâu tay, mỗi cuốn một nết', 'published'),
  ('lo-stuff', 'Lọ Stuff', 'Đồ uống ủ lạnh, đóng lọ mang đi', 'published'),
  ('nen-mlem', 'Nến Mlem', 'Nến thơm đổ tay, mùi ngọt như tên gọi', 'published'),
  ('plasti-light', 'Plasti.light', 'Đèn acrylic đúc khối, ánh chuyển màu', 'published'),
  ('tap-hoa-tieng-viet', 'Tạp Hoá Tiếng Việt', 'Chữ Việt in trên mọi thứ có thể in', 'published'),
  ('thaotran-studio', 'Thaotran.studio', 'Đèn khối kim loại, đánh xước tay', 'published')
ON CONFLICT (slug) DO NOTHING;

-- 11. CHÈN MẪU YÊU CẦU MỞ XƯỞNG TỪ WEB CHÍNH CHỜ ADMIN DUYỆT
INSERT INTO partner_requests (shop_name, applicant_email, applicant_name, phone_or_zalo, social_link, category, description, status) VALUES
  ('Gốm Đất Đỏ', 'gomdatdo.craft@gmail.com', 'Nguyễn Văn Đất', '0901234567', 'instagram.com/gomdatdo', 'Đồ gốm', 'Xưởng gốm thủ công đất đỏ Sa Huỳnh nung củi truyền thống.', 'pending'),
  ('Tiệm Da Thật Khâu Tay', 'tiemdathat.sg@gmail.com', 'Trần Thị Thu Thảo', '0987654321', 'instagram.com/tiemdathat', 'Phụ kiện', 'Ví, túi xách, bao passport da bò sáp may tay bằng chỉ sáp Ý.', 'pending'),
  ('Mây Tre Đan Xứ Quảng', 'maytredan.craft@gmail.com', 'Lê Quang Huy', '0912888999', 'tiktok.com/@maytredan', 'Trang trí', 'Đèn lồng mây tre đan thủ công mỹ nghệ xuất khẩu.', 'pending')
ON CONFLICT DO NOTHING;

-- Xong!
SELECT 'KHỞI TẠO HOÀN TẤT: Admin locle30092004@gmail.com đã được cấp quyền!' as result;
