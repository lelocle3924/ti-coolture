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
