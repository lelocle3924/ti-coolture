-- ============ BLOG ============

CREATE TABLE blog_topics (
  id       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug     text UNIQUE NOT NULL,
  name_vi  text NOT NULL,
  name_en  text,
  sort_order int NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true
);

-- FIX (BE plans Lỗi 1): author_id references staff_members(user_id),
-- NOT the nonexistent admin_users table from SRS §4.2 line 411.
CREATE TABLE blog_posts (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id     uuid REFERENCES blog_topics(id) ON DELETE SET NULL,
  author_id    uuid REFERENCES staff_members(user_id),
  slug         text UNIQUE NOT NULL,
  title_vi     text NOT NULL,
  title_en     text,
  excerpt_vi   text,
  excerpt_en   text,
  body_vi      text,                    -- Markdown, sanitize khi render
  body_en      text,
  cover_url    text,                    -- R2 key
  reading_min  int,
  is_featured  boolean NOT NULL DEFAULT false,
  status       publish_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE blog_reactions (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id       uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  reaction      text NOT NULL,          -- 'love' | 'wow' | 'inspiring'
  visitor_hash  text NOT NULL,          -- SHA256(ip + ua + salt ngày) — KHÔNG lưu IP
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, reaction, visitor_hash)
);
