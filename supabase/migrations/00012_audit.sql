-- ============ AUDIT ============
-- V1 chỉ ghi `delete` và `publish` — đây là bảo hiểm phục hồi khi xoá nhầm,
-- không phải công cụ giám sát.

-- FIX (BE plans Lỗi 1): actor_id references staff_members(user_id),
-- NOT the nonexistent admin_users(id) from SRS §4.2 line 520.
CREATE TABLE audit_logs (
  id          bigserial PRIMARY KEY,
  actor_id    uuid REFERENCES staff_members(user_id),
  action      text NOT NULL,            -- 'product.publish', 'shop.delete'
  entity_type text NOT NULL,
  entity_id   uuid,
  before_data jsonb,
  after_data  jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity ON audit_logs (entity_type, entity_id, created_at DESC);
