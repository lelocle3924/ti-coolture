-- ============ ANALYTICS DAILY ROLLUPS & ATOMIC COUNTERS ============
-- Supports fast admin performance dashboards and conversion funnel reporting without full table scans.

-- 1. Atomic counters on products and shops
ALTER TABLE products ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS favorite_count integer NOT NULL DEFAULT 0;

ALTER TABLE shops ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS outbound_click_count integer NOT NULL DEFAULT 0;

-- 2. Daily aggregate rollups table
CREATE TABLE IF NOT EXISTS analytics_daily_metrics (
  metric_date          date PRIMARY KEY,
  total_visitors       integer NOT NULL DEFAULT 0,
  total_page_views     integer NOT NULL DEFAULT 0,
  new_visitors         integer NOT NULL DEFAULT 0,
  returning_visitors   integer NOT NULL DEFAULT 0,
  mobile_sessions      integer NOT NULL DEFAULT 0,
  desktop_sessions     integer NOT NULL DEFAULT 0,
  tablet_sessions      integer NOT NULL DEFAULT 0,
  traffic_sources      jsonb NOT NULL DEFAULT '{}'::jsonb,
  category_views       jsonb NOT NULL DEFAULT '{}'::jsonb,
  catalog_browsers     integer NOT NULL DEFAULT 0,
  detail_viewers       integer NOT NULL DEFAULT 0,
  wishlist_engagements integer NOT NULL DEFAULT 0,
  outbound_conversions integer NOT NULL DEFAULT 0,
  outbound_by_platform jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_metrics_date ON analytics_daily_metrics (metric_date DESC);

-- 3. Atomic favorite count update RPC (ensuring favorite_count >= 0)
CREATE OR REPLACE FUNCTION increment_product_favorite(
  p_product_id uuid,
  p_delta integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_count integer;
BEGIN
  UPDATE products
  SET favorite_count = GREATEST(0, COALESCE(favorite_count, 0) + p_delta)
  WHERE id = p_product_id
  RETURNING favorite_count INTO v_new_count;

  RETURN COALESCE(v_new_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION increment_product_favorite(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_product_favorite(uuid, integer) TO service_role, anon, authenticated;

-- 4. Atomic product view count update RPC
CREATE OR REPLACE FUNCTION increment_product_view(
  p_product_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_count integer;
BEGIN
  UPDATE products
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = p_product_id
  RETURNING view_count INTO v_new_count;

  RETURN COALESCE(v_new_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION increment_product_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_product_view(uuid) TO service_role, anon, authenticated;

-- 5. Atomic shop view & outbound click update RPC
CREATE OR REPLACE FUNCTION increment_shop_metric(
  p_shop_id uuid,
  p_is_outbound boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_is_outbound THEN
    UPDATE shops
    SET outbound_click_count = COALESCE(outbound_click_count, 0) + 1
    WHERE id = p_shop_id;
  ELSE
    UPDATE shops
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = p_shop_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION increment_shop_metric(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_shop_metric(uuid, boolean) TO service_role, anon, authenticated;
