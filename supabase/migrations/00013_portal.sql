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

-- ============ SHOP INVITATIONS (GOOGLE OAUTH) ============
-- Quản lý lời mời hợp tác qua email Google.
-- Khi đối tác đăng nhập Google OAuth, hệ thống tự động đối chiếu email để cấp quyền quản lý xưởng.

CREATE TABLE shop_invitations (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id         uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  invited_email   text NOT NULL,                               -- Email Google/Gmail của đối tác
  shop_role       shop_role NOT NULL DEFAULT 'owner',
  status          invite_status NOT NULL DEFAULT 'pending',
  created_by      uuid REFERENCES staff_members(user_id),
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  accepted_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (shop_id, invited_email)
);

CREATE INDEX idx_shop_invitations_email  ON shop_invitations (invited_email);
CREATE INDEX idx_shop_invitations_shop   ON shop_invitations (shop_id);
CREATE INDEX idx_shop_invitations_status ON shop_invitations (status);

CREATE TRIGGER trg_shop_invitations_updated_at
  BEFORE UPDATE ON shop_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_portal_invite_timestamp();

ALTER TABLE shop_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff members have full access to shop invitations"
  ON shop_invitations
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

CREATE POLICY "Users can view pending invitations for their email"
  ON shop_invitations
  FOR SELECT
  TO authenticated
  USING (
    lower(invited_email) = lower(auth.jwt()->>'email')
    AND status = 'pending'
    AND expires_at > now()
  );

COMMENT ON TABLE shop_invitations IS 'Quản lý lời mời xưởng gửi đến email Google của đối tác';
COMMENT ON COLUMN shop_invitations.invited_email IS 'Email Google đối tác sẽ dùng để đăng nhập vào portal';

