# Phase 0 Research: Shop Portal Performance & Responsiveness

**Branch**: `003-portal-speedup` | **Date**: 2026-11-17

## Technical Architecture & Optimization Decisions

### 1. Eliminating Frontend Full Reload Waterfalls

* **Current Bottleneck**:
  In `src/views/Portal.tsx`:
  - After `saveDraft` resolves, line 2675 calls `await loadPortalMe(token)`.
  - After `submitReview` resolves, line 2904 calls `await loadPortalMe(token)`.
  - After `cancelUploadRequest` resolves, line 2283 calls `await loadPortalMe(token)`.
  - After `cancelEditRequest` resolves, line 2251 calls `await loadPortalMe(token)`.
  Every mutation awaits `loadPortalMe()`, which fires `/api/portal/me` and `/api/portal/save-shop`, taking another 10+ seconds.
* **Architecture Decision**:
  - `POST /api/portal/save-draft` returns the full `PortalProduct` object (including `product_images`).
  - Frontend updates local React state (`setProducts(prev => ...)`) directly with the returned object.
  - Delete `await loadPortalMe(token)` from mutation callbacks.
  - Button state unblocks immediately upon the write API returning (~800ms vs 7,000ms).

### 2. Consolidating Initial Portal Data & Eliminating `/api/portal/save-shop`

* **Current Bottleneck**:
  When a shop loads `/portal`, `loadPortalMe` runs:
  ```ts
  const res = await fetch("/api/portal/me");
  // ... then:
  await loadPendingProfileRequest(token); // calls fetch("/api/portal/save-shop")
  ```
* **Architecture Decision**:
  - In `api/portal/me.ts`, include `pendingProfileRequest` query directly inside the existing `Promise.all` alongside shops, products, and edit requests:
    ```ts
    const [shopRes, socialsRes, productsRes, editReqsRes, pendingProfileRes] = await Promise.all([
      // ...
      supabase
        .from("shop_profile_requests")
        .select("*")
        .eq("shop_id", portalUser.shopId)
        .eq("status", "pending")
        .maybeSingle()
    ]);
    ```
  - Return `pendingProfileRequest` in the JSON response of `/api/portal/me`.
  - In `Portal.tsx`, delete the secondary `fetch("/api/portal/save-shop")` call on page load.
  - Result: Saves 1 HTTP roundtrip and 1 serverless invocation on initial page load.

### 3. Serverless Auth Session Cache with Upstash Redis

* **Current Bottleneck**:
  Every serverless invocation runs `authenticateShopMember` or `authenticatePortalUser`:
  - `supabase.auth.getUser(token)`: ~400 – 700ms over WAN.
  - `shop_members` select query: ~300 – 600ms over WAN.
  - Overhead before handler code even executes: **800ms – 1,300ms**.
* **Architecture Decision**:
  - Use `crypto.createHash('sha256').update(token).digest('hex')` to generate safe cache key: `auth_session:<hash>`.
  - Check `getCache<AuthenticatedShopContext>(key)` from `api/_lib/redis.ts`.
  - If cached: Return immediately in **~20ms**!
  - If cache miss: Validate with Supabase Auth, fetch shop membership, store in Redis with TTL = **60 seconds**.
  - **Fail-Open Protection**: Wrap in `try/catch` with 150ms timeout; if Redis errors or quota is reached, gracefully fall back to direct Supabase Auth without failing the request.
  - **Revocation Safety**: 60s TTL provides the ideal balance between high responsiveness and rapid permission revocation.

### 4. Database Optimization: Backfill & Eliminate `audit_logs` Scan

* **Current Bottleneck**:
  In `api/portal/me.ts`:
  ```ts
  const { data: auditData } = await supabase
    .from("audit_logs")
    .select("record_id, new_data, created_at")
    .eq("table_name", "products")
    .eq("action", "reject")
    .in("record_id", rejectedProdIds)
    .order("created_at", { ascending: false });
  ```
  `audit_logs` has no compound index on `(table_name, action, record_id)` and table scans cause severe latency.
* **Architecture Decision**:
  - Migration `00023_backfill_reject_reasons.sql`: Run a one-time backfill SQL copying `new_data->>'reject_reason'` into `products.reject_reason` for all historical rejected products.
  - Remove the runtime `audit_logs` query from `api/portal/me.ts`.
  - Result: Saves an entire database scan on every portal load.
