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
