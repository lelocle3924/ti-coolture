# Baseline Performance Benchmark: Shop Portal

**Date Measured:** 2026-11-17  
**Environment:** Production (`https://ticoolture.vn/portal`)  
**Account:** `american3924@gmail.com` (Role: Shop Owner, Shop: American Workshop, 8 products)  
**Measurement Tool:** Playwright Automated Browser Instrumentation + Navigation Timing API  

---

## 1. Measured Baseline Metrics

| Journey / User Action | Baseline Latency | Target Latency | Variance / Gap | Bottleneck Grade |
| :--- | :--- | :--- | :--- | :--- |
| **S1: Initial Portal Load (TTI)** | **11,700 ms (11.7s)** | **< 1,500 ms (1.5s)** | **+10,200 ms** | 🔴 Critical Bottleneck |
| ↳ Static Assets (HTML/JS/CSS/Font) | 426 ms | < 500 ms | Within budget | ✅ Optimal (Vercel CDN) |
| ↳ Auth & Data APIs (`me` + `save-shop`) | ~11,274 ms | < 1,000 ms | +10,274 ms | 🔴 Critical Waterfall |
| **S2: Tab Switching (Client Render)** | **427 – 571 ms** | **< 100 ms** | +350 – 470 ms | 🟡 Minor (Client Re-render) |
| **S3: Product Visibility Toggle** | **2,968 – 5,010 ms** | **< 500 ms** | +2,500 – 4,500 ms | 🔴 Critical (Auth & DB Waterfall) |
| **S4: Open Product Edit Form** | **501 ms** | **< 150 ms** | +350 ms | 🟢 Acceptable |
| **S5: Live Preview Modal (Open/Close)** | **312 – 415 ms** | **< 200 ms** | +150 – 200 ms | 🟢 Acceptable |
| **S6: Return to Product Table** | **524 ms** | **< 150 ms** | +370 ms | 🟢 Acceptable |
| **S7: Upload & Compress Image (R2)** | **2,850 ms** | **< 3,000 ms** | Within budget | ✅ Optimal (WebP + Presigned) |
| **S8: Save Draft Product (`save-draft`)** | **6,984 ms (~7.0s)** | **< 1,000 ms (1.0s)** | **+6,000 ms** | 🔴 Critical (6-8 DB trips + reload) |
| **S9: Submit Review (`submit-review`)** | **5,272 ms (~5.3s)** | **< 1,200 ms (1.2s)** | **+4,000 ms** | 🔴 Critical (Sync reload waterfall) |

---

## 2. Identified Root Causes

1. **Sequential WAN Roundtrips in Serverless Handlers:**
   - Every serverless API call (`/api/portal/me`, `/api/portal/save-draft`, `/api/portal/product-actions`) invokes `authenticateShopMember` or `authenticatePortalUser`, executing `supabase.auth.getUser(token)` and `shop_members.select` over public internet.
   - Handlers execute 4 to 8 sequential database queries sequentially (`await ...; await ...; await ...`).
2. **Frontend Redundant Full-Reload (`loadPortalMe`):**
   - After mutations in `Portal.tsx`, `await loadPortalMe(token)` is called, re-fetching the entire shop data, all products, and re-invoking `/api/portal/save-shop` before clearing button loading states.
3. **Double API Call on Load:**
   - `Portal.tsx` calls `fetch("/api/portal/me")` then sequentially calls `fetch("/api/portal/save-shop")`.
4. **Unindexed Table Scan:**
   - In `/api/portal/me`, `audit_logs` is queried with `.in("record_id", rejectedProdIds)` without an index on `(table_name, record_id, action)`.
