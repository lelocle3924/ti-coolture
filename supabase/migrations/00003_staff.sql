-- ============ PHÂN QUYỀN: MÔ HÌNH HAI TRỤC ============
-- Trục 1 = nhân sự nội bộ, quyền TOÀN CỤC (áp lên mọi nội dung)
-- Trục 2 = đối tác shop, quyền CÓ PHẠM VI (chỉ nội dung của chính họ)
--
-- KHÔNG gộp hai trục vào một enum: policy RLS không viết gọn được,
-- và một bug gán nhầm enum sẽ biến shop thành moderator.

CREATE TABLE staff_members (
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text UNIQUE NOT NULL,
  full_name   text NOT NULL,
  role        admin_role NOT NULL DEFAULT 'viewer',
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
