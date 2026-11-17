-- Migration 00023: Backfill reject_reason from audit_logs and add performance index

-- 1. Backfill historical reject reasons from audit_logs into products.reject_reason
UPDATE products p
SET reject_reason = sub.reason
FROM (
  SELECT DISTINCT ON (record_id)
    record_id,
    new_data->>'reject_reason' AS reason
  FROM audit_logs
  WHERE table_name = 'products'
    AND action = 'reject'
    AND new_data->>'reject_reason' IS NOT NULL
  ORDER BY record_id, created_at DESC
) sub
WHERE p.id = sub.record_id
  AND p.status = 'rejected'
  AND (p.reject_reason IS NULL OR p.reject_reason = '');

-- 2. Compound index on audit_logs for faster audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_action_record
  ON audit_logs (table_name, action, record_id);
