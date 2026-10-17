-- ============ EXTENSIONS ============
-- Required for UUID generation, Vietnamese search, and fuzzy matching.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS unaccent;   -- tìm "non la" ra "nón lá"
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- fuzzy match, chịu lỗi chính tả

-- Text search config tiếng Việt: bỏ dấu rồi index
CREATE TEXT SEARCH CONFIGURATION vi (COPY = simple);
ALTER TEXT SEARCH CONFIGURATION vi
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, simple;
