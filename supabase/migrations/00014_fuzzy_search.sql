-- ============ FUZZY & FULL-TEXT HYBRID SEARCH ============
-- Phục vụ tìm kiếm sản phẩm:
-- 1. Full-text search (tsvector + vi config tiếng Việt)
-- 2. Trigram Fuzzy match (pg_trgm): chấp nhận sai chính tả, gõ thiếu ký tự, không dấu (unaccent)
-- 3. Tìm theo cả tên sản phẩm, tên xưởng (shop), và ngành hàng (category)
-- 4. Trả về kết quả kèm total_count để phân trang trong 1 round-trip duy nhất

-- Immutable unaccent wrapper để index biểu thức
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text AS $$
  SELECT public.unaccent($1);
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

-- Đảm bảo index GIN trigram tối ưu cho tìm kiếm không dấu
CREATE INDEX IF NOT EXISTS idx_products_name_vi_unaccent_trgm
  ON products USING GIN (public.immutable_unaccent(lower(name_vi)) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_shops_name_unaccent_trgm
  ON shops USING GIN (public.immutable_unaccent(lower(name)) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_categories_name_unaccent_trgm
  ON categories USING GIN (public.immutable_unaccent(lower(name_vi)) gin_trgm_ops);

-- Hàm RPC tìm kiếm sản phẩm
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
  -- Tạo tsquery nếu có từ khoá
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
          -- 1. Full-text search rank (3.0 weight)
          COALESCE(ts_rank_cd(p.search_vector, v_tsquery), 0.0)::real * 3.0
          -- 2. Tên sản phẩm tương đồng trigram (4.0 weight)
          + similarity(public.immutable_unaccent(lower(p.name_vi)), v_query_unaccent)::real * 4.0
          -- 3. Tên sản phẩm chứa từ khoá (2.5 weight)
          + word_similarity(v_query_unaccent, public.immutable_unaccent(lower(p.name_vi)))::real * 2.5
          -- 4. Tên shop tương đồng (2.0 weight)
          + word_similarity(v_query_unaccent, public.immutable_unaccent(lower(s.name)))::real * 2.0
          -- 5. Tên ngành hàng tương đồng (1.5 weight)
          + word_similarity(v_query_unaccent, public.immutable_unaccent(lower(c.name_vi)))::real * 1.5
        )
      END AS rank_score
    FROM products p
    JOIN shops s ON s.id = p.shop_id
    JOIN categories c ON c.id = p.category_id
    LEFT JOIN categories parent_c ON parent_c.id = c.parent_id
    WHERE
      p.status = 'published'
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

-- Cấp quyền gọi hàm cho anon và authenticated
GRANT EXECUTE ON FUNCTION search_products(text, text, uuid, int, int, text, int, int) TO anon, authenticated;
