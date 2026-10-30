-- 00019_add_products_reject_reason.sql
-- Bổ sung cột reject_reason cho bảng products để lưu trữ lý do từ chối / phản hồi chỉnh sửa từ BQT

ALTER TABLE products ADD COLUMN IF NOT EXISTS reject_reason text;

