# Phase 1 Data Model: Shop Portal Performance & Responsiveness

**Branch**: `003-portal-speedup` | **Date**: 2026-11-17

## Database Schema & Migration

### Migration `00023_backfill_reject_reasons.sql`

```sql
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

-- 2. Compound index on audit_logs for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_action_record
  ON audit_logs (table_name, action, record_id);
```

---

## Redis Cache Model (Upstash)

### Auth Session Key: `auth_session:<sha256(token)>`

* **Key Format**: `auth_session:` followed by hex-encoded SHA-256 hash of the Bearer token.
* **TTL**: 60 seconds.
* **Value Schema**:
```json
{
  "userId": "9ca20278-5873-4607-b00c-742ac14e9728",
  "userEmail": "american3924@gmail.com",
  "isAdmin": false,
  "adminRole": null,
  "staffName": null,
  "shopId": "80cac062-e9f3-4d7a-880f-268d12097828",
  "shopName": "American Workshop",
  "shopSlug": "american-workshop",
  "shopStatus": "published",
  "role": "owner",
  "cachedAt": 1763428900000
}
```

---

## API Contract Extensions

### 1. `POST /api/portal/save-draft`

#### Enhanced Response Payload (200 OK)
Returns the complete product record to prevent client state desync:
```json
{
  "success": true,
  "message": "Lưu bản nháp thành công.",
  "product": {
    "id": "50adbe75-f6fd-48c1-b533-f105fac398f9",
    "slug": "tui-canvas-thu-cong-test-perf",
    "name_vi": "Túi Canvas Thủ Công Test Perf",
    "name_en": null,
    "price_vnd": 250000,
    "category_id": "c92015f6-5a0a-4fa4-a212-70b86a877ff1",
    "short_desc_vi": "Sản phẩm thử nghiệm hiệu năng đăng tải của shop.",
    "story_vi": null,
    "dimensions": null,
    "status": "draft",
    "product_hidden": false,
    "is_out_of_stock": false,
    "created_at": "2026-11-17T22:30:00.000Z",
    "updated_at": "2026-11-17T22:30:00.000Z",
    "product_images": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "url": "https://pub-eb634fe5fce842bfb049a6bc69cf067d.r2.dev/products/...",
        "is_cover": true,
        "sort_order": 0,
        "alt_vi": "Túi Canvas Thủ Công Test Perf"
      }
    ]
  }
}
```

### 2. `GET /api/portal/me`

#### Enhanced Response Payload (200 OK)
Includes `pendingProfileRequest` directly in the payload:
```json
{
  "success": true,
  "user": { ... },
  "shop": { ... },
  "role": "owner",
  "products": [ ... ],
  "productEditRequests": [ ... ],
  "pendingProfileRequest": null
}
```
