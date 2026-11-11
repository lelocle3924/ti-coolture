# Quickstart & Verification Guide: Admin Performance & Conversion Dashboard

**Feature**: `001-admin-performance-dashboard`  
**Date**: 2026-11-11  

---

## 1. Prerequisites

- Node.js >= 18.x
- Local development server running (`npm run dev`)
- Supabase local/remote instance configured in `.env.local`
- Valid Admin Bearer token (or development bypass: `ADMIN_TOKEN`)

---

## 2. Setup & Environment

Ensure `.env.local` contains:
```bash
ADMIN_TOKEN=test_admin_token_local
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

Run database migration:
```bash
# Execute incremental analytics migration
npx supabase migration up
# Or apply 00021_analytics_daily_rollups.sql directly
```

---

## 3. Verification Scenarios

### Scenario 1: Anonymous Ingestion & Tracking Beacons
**Goal**: Verify client events transmit anonymously without IP storage or cookie consent barriers.

1. **Simulate a Page View & First Visit**:
   ```bash
   curl -X POST http://localhost:5173/api/analytics?action=track \
     -H "Content-Type: application/json" \
     -d '{
       "type": "page_view",
       "isNewVisitor": true,
       "deviceType": "mobile",
       "referrerSource": "social"
     }'
   ```
   **Expected Outcome**: Returns HTTP 200 `{"ok": true}`. In database `click_events`, event is recorded with `is_new_visitor = true` and `device_type = 'mobile'`. Zero PII or IP stored.

2. **Simulate a Favorite Increment**:
   ```bash
   curl -X POST http://localhost:5173/api/analytics?action=track \
     -H "Content-Type: application/json" \
     -d '{
       "type": "wishlist_toggle",
       "productId": "00000000-0000-0000-0000-000000000002",
       "favoriteDelta": 1
     }'
   ```
   **Expected Outcome**: Returns HTTP 200 `{"ok": true}`. `favorite_count` for product increments atomically.

3. **Simulate an Outbound Conversion Click**:
   ```bash
   curl -X POST http://localhost:5173/api/analytics?action=track \
     -H "Content-Type: application/json" \
     -d '{
       "type": "outbound_click",
       "shopId": "80cac062-e9f3-4d7a-880f-268d12097828",
       "platform": "instagram"
     }'
   ```
   **Expected Outcome**: Returns HTTP 200 `{"ok": true}`. Outbound conversion counter increments.

---

### Scenario 2: Admin Dashboard & Funnel Metrics Retrieval
**Goal**: Verify admin dashboard data returns aggregated KPIs, charts, and 5-stage conversion funnel.

1. **Query Overview without Authorization**:
   ```bash
   curl -i http://localhost:5173/api/analytics?action=overview
   ```
   **Expected Outcome**: Returns HTTP 401 Unauthorized.

2. **Query Overview with Admin Authorization**:
   ```bash
   curl -X GET "http://localhost:5173/api/analytics?action=overview&period=30d" \
     -H "Authorization: Bearer test_admin_token_local"
   ```
   **Expected Outcome**: Returns HTTP 200 with JSON matching [contracts/analytics-api.yaml](contracts/analytics-api.yaml):
   - `kpis` (totalVisitors, totalPageViews, activeShops, totalListedProducts)
   - `visitorsOverTime` (daily time-series)
   - `newVsReturning` (ratio breakdown)
   - `devices` (mobile, desktop, tablet percentages)
   - `topProductsViewed` & `topProductsFavorited` (Top 10 arrays)
   - `conversionFunnel` (5 stages with drop-off rates and overall conversion rate)

---

### Scenario 3: End-to-End UI Validation in Admin Portal
**Goal**: Confirm visual presentation and interactive date filtering in the browser.

1. Open browser to `http://localhost:5173/portal`.
2. Sign in as Admin or use dev bypass.
3. Select the **"Tổng quan" (Dashboard)** tab.
4. Verify:
   - Summary metric cards display values and percentage comparisons.
   - Line chart renders visitors over time with toggle between daily/weekly/monthly views.
   - Donut charts render for new vs. returning visitors and traffic sources.
   - Leaderboard tables show top viewed products, favorited products, and top shops.
   - Funnel widget displays all 5 stages and calculates conversion percentages.
   - Date picker filters update all components dynamically.

---

## 4. Quality & Lint Gates

Before committing changes, execute:
```bash
# 1. Strict TypeScript check
npm run lint

# 2. Serverless function count verification (<= 12 files in api/)
powershell -Command "(Get-ChildItem -File api -Recurse | Where-Object { $_.FullName -notmatch '_lib' }).Count"

# 3. Terminology check (Zero occurrences of forbidden term)
git grep -i "xưởng"
```
