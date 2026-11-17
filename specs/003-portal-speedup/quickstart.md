# Quickstart & Verification Guide: Shop Portal Speedup

**Branch**: `003-portal-speedup` | **Date**: 2026-11-17

## Verification Goals
1. Initial portal load completes in **< 1.5s** (warm) / **< 2.5s** (cold).
2. Save draft completes in **< 1.0s** (down from 7.0s).
3. Submit review completes in **< 1.2s** (down from 5.3s).
4. No data desync: images, IDs, and statuses update seamlessly on the UI.

---

## Step-by-Step Test Scenarios

### Step 1: Database Migration Check
Run migration `00023_backfill_reject_reasons.sql` and verify historical backfill:
```sql
SELECT count(*) FROM products WHERE status = 'rejected' AND reject_reason IS NOT NULL;
```

---

### Step 2: Initial Load & Single-API Verification
1. Open DevTools Network tab, filter by `portal`.
2. Navigate to `https://ticoolture.vn/portal` (or local `http://localhost:5173/portal`).
3. Verify:
   - `/api/portal/me` returns `200 OK` with `pendingProfileRequest` present in the response.
   - `/api/portal/save-shop` is **NOT** invoked on initial page load.
   - Initial load TTI is < 1.5s.

---

### Step 3: Save Draft Speed & Data Integrity Test
1. In Portal, open a product or click "Thêm sản phẩm mới".
2. Edit a field (e.g. name or price).
3. Open DevTools Network tab and click "Lưu bản nháp".
4. Verify:
   - Request to `/api/portal/save-draft` returns in < 1,000 ms.
   - Button spinner unlocks immediately upon response.
   - `loadPortalMe` is **NOT** fired.
   - Product table/state contains the updated product without blank images.

---

### Step 4: Auth Session Redis Cache Verification
1. Execute two quick mutations in succession (e.g. toggle stock twice).
2. Verify the second request completes in < 400ms due to Redis auth session caching.

---

### Step 5: TypeScript & Vercel Budget Gate
```bash
# 1. Strict lint check
npm run lint

# 2. Serverless functions count (must remain <= 12)
(Get-ChildItem -Recurse api -Filter "*.ts" | Where-Object { $_.DirectoryName -notmatch "_lib" }).Count
```
*Expected*: 0 compilation errors. Exact file count = 12.
