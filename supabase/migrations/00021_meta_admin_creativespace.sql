-- =========================================================================
-- Migration 00021: Add META ADMIN creativespace.ticoolture@gmail.com
-- Ensure shops.hero_image_url schema is synced & PostgREST cache refreshed
-- =========================================================================

-- 1. Ensure column hero_image_url exists on shops
ALTER TABLE shops ADD COLUMN IF NOT EXISTS hero_image_url text;

-- 2. Upsert Meta Admin creativespace.ticoolture@gmail.com into staff_members
INSERT INTO staff_members (user_id, email, full_name, role, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE lower(email) = 'creativespace.ticoolture@gmail.com' LIMIT 1),
  'creativespace.ticoolture@gmail.com',
  'Meta Admin (Creative Space)',
  'admin',
  true
)
ON CONFLICT (email) DO UPDATE
SET role = 'admin',
    is_active = true,
    full_name = 'Meta Admin (Creative Space)';

-- 3. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
