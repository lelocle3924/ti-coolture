# Feature Specification: Shop Portal Performance & Responsiveness Optimization

**Feature Branch**: `003-portal-speedup`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "Tối ưu hiệu năng Shop Portal dựa trên kết quả đo benchmark thực tế: đưa initial load từ 11.7s về <1.5s, lưu nháp từ 7s về <1s, xóa bỏ các chuỗi waterfall và reload thừa thãi, kèm phản biện rủi ro."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Instant Product Save & Submit Feedback (Priority: P1) 🎯 MVP

As a shop owner, when I click "Lưu bản nháp" (Save Draft) or "Gửi duyệt" (Submit Review), I want the action to confirm and release the button spinner in under 1.0 second without freezing the UI or reloading the entire portal database, so that my product creation flow is fluid and responsive.

**Why this priority**: Highest friction point identified during live benchmarking (saving draft took 7.0s and submitting took 5.3s). Directly eliminates shop frustration during catalog updates.

**Independent Test**: In `/portal`, open product editor, edit a field or add an image, click "Lưu bản nháp". Measure that the button unlocks with success feedback in < 1.0s, the product table contains the updated item with full images, and no redundant `/api/portal/me` request is initiated.

**Acceptance Scenarios**:

1. **Given** a shop owner saving a draft in `/portal`, **When** clicking "Lưu bản nháp", **Then** the API returns within 800ms with the full product object (including `product_images`), the client merges the updated product directly into local React state, the button unlocks immediately, and `loadPortalMe()` is NOT called.
2. **Given** a shop owner submitting a product for review, **When** clicking "Gửi duyệt", **Then** the product status updates to `pending_review` in local state within 1.0s and view returns to list without a full page reload.
3. **Given** a network failure during save, **When** the API call errors, **Then** an inline error banner displays without data loss from the form inputs.

---

### User Story 2 - Sub-1.5s Initial Portal Load (Priority: P1)

As a shop owner navigating to `/portal`, I want the dashboard to load within 1.2s (warm) / 2.5s (cold start) instead of 11.7s, so that I can immediately see my products and manage my shop.

**Why this priority**: Initial load took 11.7s during baseline measurement due to sequential API waterfalls and unindexed table scans.

**Independent Test**: Clear browser cache, navigate to `https://ticoolture.vn/portal`. Measure time until "Đang tải Cổng Đối tác..." disappears and dashboard renders. Verify `/api/portal/save-shop` is not called as a separate waterfall.

**Acceptance Scenarios**:

1. **Given** an authenticated shop owner opening `/portal`, **When** the page initializes, **Then** `/api/portal/me` returns `shop`, `products`, `productEditRequests`, AND `pendingProfileRequest` in a single response payload.
2. **Given** the portal loading sequence, **When** `/api/portal/me` resolves, **Then** the client immediately renders the dashboard without firing a secondary request to `/api/portal/save-shop`.
3. **Given** products with rejected status, **When** `/api/portal/me` loads, **Then** reject reasons are read directly from `products.reject_reason` in 0ms without querying the large `audit_logs` table.

---

### User Story 3 - Rapid Action Mutations via Short-Lived Auth Cache (Priority: P2)

As a shop owner toggling stock status, product visibility, or editing settings, I want these operations to complete in < 400ms without repeated 1.5s authentication roundtrips to Supabase Auth.

**Why this priority**: Toggle actions took 3.0s – 5.0s during baseline measurement because each request re-authenticates via public internet HTTP to Supabase Auth.

**Independent Test**: Rapidly click product visibility toggle. Verify that subsequent API calls resolve in < 400ms due to Redis auth session caching.

**Acceptance Scenarios**:

1. **Given** an incoming request with a valid Bearer token, **When** `authenticateShopMember` is called, **Then** it checks Upstash Redis for `auth_session:<sha256(token)>`. If found, it returns the verified `shopContext` in < 30ms.
2. **Given** an auth cache miss or expired session (> 60s), **When** verifying token, **Then** it fetches from Supabase Auth and caches the result for 60 seconds.
3. **Given** an Upstash Redis outage or rate limit error, **When** checking cache, **Then** the handler gracefully catches the error and falls back to direct Supabase Auth verification without failing the user request.

---

### Edge Cases

- **Data Desync Prevention**: `save-draft.ts` MUST return the complete product entity (with resolved category name, images array, timestamps) so the frontend state remains 100% complete without re-fetching.
- **Quota & Fail-Open Protection**: All Redis operations in `_lib/supabaseAuth.ts` must have a 200ms timeout / try-catch so Redis degradations never cause HTTP 500 errors.
- **Revocation Window**: Auth cache TTL is strictly 60 seconds to balance sub-second performance with timely permission revocation.
- **Historical Data Compatibility**: Database migration backfills `products.reject_reason` from `audit_logs` for all historical rejected products before runtime code relies on it.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `POST /api/portal/save-draft` MUST return the full sanitized product record including `product_images` with their database IDs.
- **FR-002**: Frontend `src/views/Portal.tsx` MUST update local React state directly upon draft save and review submission, eliminating `await loadPortalMe(token)` after mutations.
- **FR-003**: `GET /api/portal/me` MUST include `pendingProfileRequest` directly in its JSON response; `Portal.tsx` MUST NOT call `/api/portal/save-shop` on initial load.
- **FR-004**: `api/_lib/supabaseAuth.ts` MUST cache authenticated shop context in Upstash Redis (`auth_session:<sha256>`) with a 60-second TTL and resilient try-catch fallback.
- **FR-005**: Migration `supabase/migrations/00023_backfill_reject_reasons.sql` MUST copy historical rejection reasons from `audit_logs` into `products.reject_reason`.
- **FR-006**: `/api/portal/me` MUST remove runtime queries to `audit_logs` and read `products.reject_reason` directly.
- **FR-007**: Total serverless functions in `api/` MUST remain strictly $\le 12$ (no new files created).
- **FR-008**: Strictly enforce "shop" terminology across all code, logs, and UI; ban "xưởng".

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: "Lưu bản nháp" (Save Draft) latency drops from **6,984 ms** to **< 1,000 ms** (7x speedup).
- **SC-002**: "Gửi duyệt" (Submit Review) latency drops from **5,272 ms** to **< 1,200 ms** (4.5x speedup).
- **SC-003**: Initial Portal Load drops from **11.7 s** to **< 1.5 s** (warm) / **< 2.5 s** (cold start).
- **SC-004**: Stock and Visibility toggles drop from **3.0s – 5.0s** to **< 400 ms**.
- **SC-005**: Zero compilation errors (`npm run lint` passes strictly).
- **SC-006**: Total serverless function file count in `api/` remains exactly 12.
