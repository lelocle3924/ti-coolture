-- 00018_increase_price_vnd_and_safe_review.sql
-- Nâng cấp kiểu dữ liệu price_vnd thành bigint để chống lỗi integer out of range
-- và cập nhật function review_product_edit_request

ALTER TABLE products ALTER COLUMN price_vnd TYPE bigint;

CREATE OR REPLACE FUNCTION review_product_edit_request(
  p_request_id uuid,
  p_action text,
  p_staff_user_id uuid,
  p_reject_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  edit_request product_edit_requests%ROWTYPE;
  current_status publish_status;
  proposal jsonb;
  now_value timestamptz := now();
  parsed_price bigint;
BEGIN
  IF p_action NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Invalid action';
  END IF;

  SELECT * INTO edit_request
  FROM product_edit_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND OR edit_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Yêu cầu chỉnh sửa không còn ở trạng thái chờ duyệt.';
  END IF;

  IF p_action = 'reject' THEN
    UPDATE product_edit_requests
    SET status = 'rejected',
        reject_reason = p_reject_reason,
        reviewed_by = p_staff_user_id,
        reviewed_at = now_value,
        updated_at = now_value
    WHERE id = p_request_id;

    RETURN jsonb_build_object('status', 'rejected');
  END IF;

  SELECT status INTO current_status
  FROM products
  WHERE id = edit_request.product_id
    AND shop_id = edit_request.shop_id
  FOR UPDATE;

  IF NOT FOUND OR current_status NOT IN ('published', 'hidden') THEN
    RAISE EXCEPTION 'Không thể cập nhật sản phẩm không còn được xuất bản.';
  END IF;

  proposal := edit_request.proposed_data;

  -- An toàn ép kiểu và giới hạn trần 500.000.000 VNĐ
  IF proposal->>'price_vnd' IS NOT NULL AND proposal->>'price_vnd' <> '' THEN
    parsed_price := LEAST(GREATEST((proposal->>'price_vnd')::bigint, 0), 500000000);
  ELSE
    parsed_price := NULL;
  END IF;

  UPDATE products
  SET name_vi = proposal->>'name_vi',
      name_en = proposal->>'name_en',
      category_id = (proposal->>'category_id')::uuid,
      short_desc_vi = proposal->>'short_desc_vi',
      short_desc_en = proposal->>'short_desc_en',
      story_vi = proposal->>'story_vi',
      story_en = proposal->>'story_en',
      price_vnd = parsed_price,
      price_note_vi = proposal->>'price_note_vi',
      dimensions = proposal->>'dimensions',
      variants = COALESCE(proposal->'variants', '[]'::jsonb),
      updated_at = now_value
  WHERE id = edit_request.product_id;

  DELETE FROM product_images WHERE product_id = edit_request.product_id;
  INSERT INTO product_images (
    product_id, url, is_cover, sort_order, alt_vi, alt_en, width, height
  )
  SELECT
    edit_request.product_id,
    image->>'url',
    COALESCE((image->>'is_cover')::boolean, false),
    COALESCE((image->>'sort_order')::integer, image_index - 1),
    image->>'alt_vi',
    image->>'alt_en',
    NULLIF(image->>'width', '')::integer,
    NULLIF(image->>'height', '')::integer
  FROM jsonb_array_elements(COALESCE(proposal->'images', '[]'::jsonb))
    WITH ORDINALITY AS item(image, image_index);

  UPDATE product_edit_requests
  SET status = 'approved',
      reviewed_by = p_staff_user_id,
      reviewed_at = now_value,
      updated_at = now_value
  WHERE id = p_request_id;

  RETURN jsonb_build_object('status', 'approved');
END;
$$;

REVOKE ALL ON FUNCTION review_product_edit_request(uuid, text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION review_product_edit_request(uuid, text, uuid, text) TO service_role;
