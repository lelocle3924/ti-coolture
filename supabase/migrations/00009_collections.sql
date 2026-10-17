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
