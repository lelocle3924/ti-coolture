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
