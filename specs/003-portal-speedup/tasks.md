# Tasks: Shop Portal Performance & Responsiveness Optimization

**Input**: Design documents from `specs/003-portal-speedup/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/portal-api-extensions.yaml`, `quickstart.md`, `baseline-benchmark.md`  
**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Phase 1: Setup (Database & Data Contracts)

**Purpose**: Database backfill migration and contract alignment.

- [x] T001 [P] Create database migration `supabase/migrations/00023_backfill_reject_reasons.sql` to backfill `reject_reason` from `audit_logs` into `products.reject_reason` and add index `idx_audit_logs_table_action_record`
- [x] T002 [P] Verify `PortalProduct` interface in `src/views/Portal.tsx` matches the full product entity returned by optimized endpoints

---

## Phase 2: Foundational (Auth Caching & API Consolidation)

**Purpose**: Core serverless optimization eliminating WAN roundtrips on every request.

- [x] T003 In `api/_lib/supabaseAuth.ts`, implement Upstash Redis caching for `authenticateShopMember` and `authenticatePortalUser` using SHA-256 token hashing, 60-second TTL, and fail-open try/catch fallback
- [x] T004 In `api/portal/me.ts`, add `pendingProfileRequest` query into the existing `Promise.all` block and return it in the JSON response
- [x] T005 In `api/portal/me.ts`, remove the unindexed runtime query to `audit_logs` and read `reject_reason` directly from `products.reject_reason`

**Checkpoint**: Core backend infrastructure ready. User story implementation can now begin.

---

## Phase 3: User Story 1 - Instant Product Save & Submit Feedback (Priority: P1) 🎯 MVP

**Goal**: Reduce Save Draft from 7.0s to < 1.0s and Submit Review from 5.3s to < 1.2s by eliminating redundant full reloads and returning complete product entities.

**Independent Test**: Edit a product in `/portal` and click "Lưu bản nháp". Verify button spinner unlocks in < 1.0s, local product list updates immediately with images, and `loadPortalMe` is NOT called.

- [x] T006 [US1] In `api/portal/save-draft.ts`, return the complete sanitized product entity (including `product_images` with their UUIDs) in the JSON response
- [x] T007 [US1] In `src/views/Portal.tsx`, update `handleSaveDraft` to merge the returned product directly into `products` state locally and delete `await loadPortalMe(token)`
- [x] T008 [US1] In `src/views/Portal.tsx`, update `handleSubmitReview` to update local product status to `pending_review` directly and delete `await loadPortalMe(token)`
- [x] T009 [US1] In `src/views/Portal.tsx`, update `handleCancelUploadRequest` and `handleCancelEditRequest` to update local state directly and delete `await loadPortalMe(token)`

**Checkpoint**: User Story 1 MVP complete. Product creation and editing unblocks in < 1.0s.

---

## Phase 4: User Story 2 - Sub-1.5s Initial Portal Load (Priority: P1)

**Goal**: Reduce Initial Portal Load from 11.7s to < 1.5s warm / < 2.5s cold by eliminating the secondary `/api/portal/save-shop` request and leveraging consolidated payload.

**Independent Test**: Navigate to `/portal`. Verify that `/api/portal/save-shop` is NOT called on load, `pendingProfileRequest` is read directly from `/api/portal/me`, and dashboard renders in < 1.5s.

- [x] T010 [US2] In `src/views/Portal.tsx`, update `loadPortalMe` to read `data.pendingProfileRequest` directly from the `/api/portal/me` response and eliminate the secondary waterfall call
- [x] T011 [US2] In `src/views/Portal.tsx`, remove dead code for `loadPendingProfileRequest` or convert to a fallback-only helper

**Checkpoint**: User Stories 1 and 2 functional. Initial load and save operations are snappy.

---

## Phase 5: User Story 3 - Rapid Action Mutations via Short-Lived Auth Cache (Priority: P2)

**Goal**: Reduce Stock and Visibility toggles to < 400ms using the 60s Redis auth cache.

**Independent Test**: Rapidly click visibility toggle or stock toggle on product row. Confirm subsequent requests complete in < 400ms without auth WAN overhead.

- [x] T012 [US3] Verify `handleShopToggleProductVisibility` and `handleShopToggleStock` in `src/views/Portal.tsx` update optimistically and complete network sync in < 400ms
- [x] T013 [US3] In `api/portal/product-actions.ts`, confirm auth resolution uses Redis cache on repeat calls

---

## Phase 6: Polish, Quality Gates & DevLog

**Purpose**: Strict verification against Constitution rules, linting, and post-optimization benchmarking.

- [x] T014 Run strict type check (`npm run lint` / `tsc --noEmit`) to confirm 0 compilation errors across entire project
- [x] T015 Verify total serverless functions count in `api/` remains strictly $\le 12$
- [x] T016 Run Playwright browser benchmark to measure post-optimization latency and compare against `baseline-benchmark.md`
- [x] T017 Record optimization results, root cause analysis, and lessons learned in `devlog/2026-11-17.md`
