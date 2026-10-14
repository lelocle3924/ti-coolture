-- ============ PARTNER ONBOARDING PORTAL ============
-- Phân hệ cổng đối tác: Đăng ký & nộp sản phẩm không cần mật khẩu (Magic Token).
-- Thiết kế theo docs/BACKEND-SRS.md §3.1 & §3.2.
--
-- Đặc điểm:
-- 1. Token mã hoá (token_hash) cấp độc quyền bởi team Tí Coolture.
-- 2. State machine: active -> locked_pending -> completed / revoked.
-- 3. Tự động khoá quyền sửa khi shop bấm "Gửi duyệt" (locked_pending).
-- 4. Tuyệt đối không lưu mật khẩu hay PII cá nhân nhạy cảm (tuân thủ NĐ 13/2023/NĐ-CP).

CREATE TABLE portal_invites (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id         uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  token_hash      text UNIQUE NOT NULL,                       -- SHA-256 hash của secret token
  passcode        varchar(6),                                  -- Mã PIN 6 số tuỳ chọn (lớp bảo mật 2)
  status          portal_invite_status NOT NULL DEFAULT 'active',
  created_by      uuid REFERENCES staff_members(user_id),      -- Staff tạo lời mời
  expires_at      timestamptz NOT NULL,                        -- Hạn dùng link (mặc định now() + 14 ngày)
  submitted_at    timestamptz,                                 -- Thời điểm shop bấm gửi duyệt
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,          -- Ghi chú, tên đại diện shop, số ĐT liên hệ
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_portal_invite_expiry CHECK (expires_at > created_at)
);

-- ============ INDEXES ============
CREATE INDEX idx_portal_invites_token   ON portal_invites (token_hash);
CREATE INDEX idx_portal_invites_shop    ON portal_invites (shop_id);
CREATE INDEX idx_portal_invites_status  ON portal_invites (status);
CREATE INDEX idx_portal_invites_expiry  ON portal_invites (expires_at) WHERE status = 'active';

-- ============ LIÊN KẾT PRODUCTS VỚI PORTAL INVITES ============
-- Cho phép truy vết sản phẩm được khởi tạo/cập nhật qua phiên mời nào
ALTER TABLE products ADD COLUMN IF NOT EXISTS portal_invite_id uuid REFERENCES portal_invites(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_portal_invite ON products (portal_invite_id);


-- ============ TRIGGER: AUTO UPDATE updated_at ============
CREATE OR REPLACE FUNCTION update_portal_invite_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_portal_invites_updated_at
  BEFORE UPDATE ON portal_invites
  FOR EACH ROW
  EXECUTE FUNCTION update_portal_invite_timestamp();

-- ============ ROW LEVEL SECURITY (RLS) ============
ALTER TABLE portal_invites ENABLE ROW LEVEL SECURITY;

-- 1. Staff members (admin/moderator) có toàn quyền quản lý lời mời
CREATE POLICY "Staff members have full access to portal invites"
  ON portal_invites
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_members
      WHERE staff_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_members
      WHERE staff_members.user_id = auth.uid()
        AND staff_members.role IN ('admin', 'moderator')
    )
  );

-- 2. Client vãng lai / Portal chỉ đọc được invite nếu đang active và chưa hết hạn
-- Thao tác xác thực thực tế được xử lý an toàn qua Serverless Function (/api/portal/verify-token)
CREATE POLICY "Public read active invite by exact token hash"
  ON portal_invites
  FOR SELECT
  TO anon
  USING (
    status IN ('active', 'locked_pending')
    AND expires_at > now()
  );

COMMENT ON TABLE portal_invites IS 'Quản lý link mời bí mật cho đối tác shop đăng sản phẩm không cần mật khẩu';
COMMENT ON COLUMN portal_invites.token_hash IS 'Chuỗi hash SHA-256 của token bí mật được gửi cho shop';
COMMENT ON COLUMN portal_invites.status IS 'Trạng thái token: active (soạn thảo), locked_pending (đã gửi chờ duyệt), completed (đã duyệt xong), revoked (thu hồi)';
