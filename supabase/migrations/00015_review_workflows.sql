CREATE TABLE IF NOT EXISTS partner_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_name text NOT NULL,
  applicant_email text NOT NULL,
  applicant_name text,
  phone_or_zalo text,
  social_link text,
  category text,
  description text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE partner_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can submit partner request" ON partner_requests;
CREATE POLICY "Public can submit partner request"
  ON partner_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Staff view requests" ON partner_requests;
CREATE POLICY "Staff view requests"
  ON partner_requests FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_members
      WHERE staff_members.user_id = auth.uid() AND staff_members.is_active = true
    )
  );

CREATE TABLE product_edit_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  proposed_data jsonb NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  reject_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS variants jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX idx_product_edit_requests_product
  ON product_edit_requests (product_id, created_at DESC);
CREATE INDEX idx_product_edit_requests_status
  ON product_edit_requests (status, created_at DESC);
CREATE UNIQUE INDEX idx_product_edit_requests_one_pending
  ON product_edit_requests (product_id)
  WHERE status = 'pending';

ALTER TABLE product_edit_requests ENABLE ROW LEVEL SECURITY;

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

  UPDATE products
  SET name_vi = proposal->>'name_vi',
      name_en = proposal->>'name_en',
      category_id = (proposal->>'category_id')::uuid,
      short_desc_vi = proposal->>'short_desc_vi',
      short_desc_en = proposal->>'short_desc_en',
      story_vi = proposal->>'story_vi',
      story_en = proposal->>'story_en',
      price_vnd = NULLIF(proposal->>'price_vnd', '')::integer,
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

CREATE OR REPLACE FUNCTION approve_shop_profile_request(
  p_request_id uuid,
  p_staff_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  request_row partner_requests%ROWTYPE;
  profile jsonb;
  shop_uuid uuid;
  social_record record;
  social_url text;
BEGIN
  SELECT * INTO request_row
  FROM partner_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND OR request_row.status <> 'pending' THEN
    RAISE EXCEPTION 'Yêu cầu cập nhật hồ sơ không còn ở trạng thái chờ duyệt.';
  END IF;

  profile := request_row.notes::jsonb;
  IF profile->>'type' <> 'profile_update' THEN
    RAISE EXCEPTION 'Yêu cầu không phải là cập nhật hồ sơ shop.';
  END IF;

  shop_uuid := (profile->>'shop_id')::uuid;

  UPDATE shops
  SET name = profile->>'name',
      tagline_vi = profile->>'tagline_vi',
      story_vi = profile->>'story_vi',
      address = profile->>'address',
      area_tag = profile->>'area_tag',
      contact_email = profile->>'contact_email',
      logo_url = profile->>'logo_url',
      cover_url = profile->>'cover_url',
      updated_at = now()
  WHERE id = shop_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy shop cần cập nhật.';
  END IF;

  FOR social_record IN
    SELECT platform::text AS platform
    FROM unnest(ARRAY['facebook', 'instagram', 'tiktok', 'threads', 'website', 'zalo']::text[]) AS platform
  LOOP
    social_url := NULLIF(BTRIM(profile->'socials'->>social_record.platform), '');
    IF social_url IS NULL THEN
      DELETE FROM shop_socials
      WHERE shop_id = shop_uuid AND platform::text = social_record.platform;
    ELSE
      INSERT INTO shop_socials (shop_id, platform, url, is_visible)
      VALUES (shop_uuid, social_record.platform::social_platform, social_url, true)
      ON CONFLICT (shop_id, platform)
      DO UPDATE SET url = EXCLUDED.url, is_visible = true;
    END IF;
  END LOOP;

  UPDATE partner_requests
  SET status = 'approved',
      reviewed_by = p_staff_user_id,
      reviewed_at = now(),
      notes = 'Đã duyệt và áp dụng thay đổi thông tin shop.'
  WHERE id = p_request_id;
END;
$$;

REVOKE ALL ON FUNCTION approve_shop_profile_request(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION approve_shop_profile_request(uuid, uuid) TO service_role;
