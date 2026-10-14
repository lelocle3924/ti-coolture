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
