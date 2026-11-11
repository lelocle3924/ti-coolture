-- ============ ADD HERO_IMAGE_URL TO SHOPS ============
-- Dedicated hero section image for shop showcased on the Homepage Hero deck.

ALTER TABLE shops ADD COLUMN IF NOT EXISTS hero_image_url text;

-- Update approve_shop_profile_request RPC to apply hero_image_url
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
      hero_image_url = COALESCE(profile->>'hero_image_url', hero_image_url),
      story_en = COALESCE(profile->>'hero_image_url', story_en),
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
