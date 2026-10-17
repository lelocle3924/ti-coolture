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
