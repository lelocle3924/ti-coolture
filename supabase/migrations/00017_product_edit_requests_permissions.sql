-- 00017_product_edit_requests_permissions.sql
-- Cấp quyền bảng và cấu hình RLS cho product_edit_requests

-- 1. Grant table privileges to service_role and authenticated
GRANT ALL ON TABLE product_edit_requests TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE product_edit_requests TO authenticated;

-- 2. Configure RLS Policies
ALTER TABLE product_edit_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff members have full access to product edit requests" ON product_edit_requests;
CREATE POLICY "Staff members have full access to product edit requests"
  ON product_edit_requests FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_members
      WHERE staff_members.user_id = auth.uid() AND staff_members.is_active = true
    )
  );

DROP POLICY IF EXISTS "Shop members view own shop edit requests" ON product_edit_requests;
CREATE POLICY "Shop members view own shop edit requests"
  ON product_edit_requests FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shop_members
      WHERE shop_members.shop_id = product_edit_requests.shop_id
        AND shop_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Shop members insert own shop edit requests" ON product_edit_requests;
CREATE POLICY "Shop members insert own shop edit requests"
  ON product_edit_requests FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shop_members
      WHERE shop_members.shop_id = product_edit_requests.shop_id
        AND shop_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Shop members update own shop edit requests" ON product_edit_requests;
CREATE POLICY "Shop members update own shop edit requests"
  ON product_edit_requests FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shop_members
      WHERE shop_members.shop_id = product_edit_requests.shop_id
        AND shop_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shop_members
      WHERE shop_members.shop_id = product_edit_requests.shop_id
        AND shop_members.user_id = auth.uid()
    )
  );
