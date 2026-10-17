-- ============ ENUMS ============
-- All custom enum types used across the schema.

CREATE TYPE admin_role          AS ENUM ('admin', 'moderator', 'viewer');
CREATE TYPE publish_status      AS ENUM ('draft', 'pending_review', 'published', 'rejected', 'hidden', 'archived');
CREATE TYPE portal_invite_status AS ENUM ('active', 'locked_pending', 'completed', 'revoked');
CREATE TYPE social_platform     AS ENUM
  ('instagram','tiktok','facebook','threads','shopee','website','zalo');
CREATE TYPE click_target        AS ENUM
  ('product_view','shop_view','order_now','wishlist_add','social_link',
   'route_view','route_stop_click','route_stop_external',
   'map_interacted','map_fullscreen_open',
   'gem_tab_impression','gem_tab_click','gem_view','gem_outbound');
CREATE TYPE carousel_rule       AS ENUM
  ('random', 'most_clicked', 'curated', 'curated_fill');
CREATE TYPE shop_role           AS ENUM ('owner', 'editor');
CREATE TYPE invite_status       AS ENUM ('pending', 'accepted', 'revoked');


