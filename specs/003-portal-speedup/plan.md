# Implementation Plan: Shop Portal Performance & Responsiveness Optimization

**Branch**: `003-portal-speedup` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-portal-speedup/spec.md` and benchmark assessment in `specs/003-portal-speedup/baseline-benchmark.md`.

---

## Summary

Optimize the Shop Portal performance across key user journeys based on live production benchmarks (where Initial Load took 11.7s, Save Draft took 7.0s, and Submit Review took 5.3s).

The technical approach:
1. **Frontend**: Eliminate the redundant `await loadPortalMe(token)` call after draft saves and review submissions; update React state locally with the full returned product entity. Remove the secondary waterfall call to `/api/portal/save-shop` on page load.
2. **Backend API**: Include `pendingProfileRequest` directly in `/api/portal/me` payload; return the full sanitized product object (including `product_images`) from `api/portal/save-draft.ts`.
3. **Auth Cache**: Cache authenticated shop session context (`shopContext`) in Upstash Redis with a 60-second TTL in `api/_lib/supabaseAuth.ts`, cutting 800ms–1,500ms of WAN auth overhead per API request.
4. **Database**: Backfill historical reject reasons from `audit_logs` into `products.reject_reason` via migration `00023_backfill_reject_reasons.sql`, removing the unindexed runtime scan of `audit_logs` in `/api/portal/me`.

---

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js >= 18.x  
**Primary Dependencies**: React 18, Vite, Tailwind CSS, Lucide React, Upstash Redis (`@upstash/redis`), Supabase Client (`@supabase/supabase-js`)  
**Storage**: PostgreSQL (Supabase) + Upstash Redis cache  
**Testing**: Playwright automated browser test, strict `tsc --noEmit` lint  
**Target Platform**: Vercel Serverless Functions + Client SPA (Vite/React)  
**Project Type**: Web Application (React SPA + Serverless REST API)  
**Performance Goals**:
- Save Draft: **< 1,000 ms** (down from 6,984 ms)
- Submit Review: **< 1,200 ms** (down from 5,272 ms)
- Initial Portal Load: **< 1,200 ms** warm / **< 2,500 ms** cold (down from 11,700 ms)
- Stock & Visibility Toggles: **< 400 ms**
**Constraints**:
- **Vercel Hobby Limit**: Maximum 12 Serverless Functions in `api/`. Zero new files added. Exactly 12/12.
- **Strict Terminology**: Always use "shop", strictly ban "xưởng".
- **Navigation Guardrail**: Keep `/about` link hidden from public navigation.
- **Fail-Open Resilience**: Redis operations MUST have try/catch so Redis outages or quota limits never cause HTTP 500 errors.

---

## Constitution Check

*GATE: Must pass before implementation.*

| Principle / Gate | Requirement | Status | Verification Detail |
| :--- | :--- | :--- | :--- |
| **I. Type Safety & Architecture** | Strict TypeScript; no unwarranted `any`; decoupled services | **PASS** | Typed contracts in `src/types.ts` and API handlers; clean component state separation |
| **II. Quality Gates** | `npm run lint` passes with 0 errors; runtime health | **PASS** | Verified via strict `tsc --noEmit` before and after changes |
| **III. Schema Evolution** | Non-breaking changes; defensive fallbacks; numbered migration | **PASS** | Migration `00023_backfill_reject_reasons.sql` is additive and idempotent |
| **IV. Domain Terminology** | Enforce "shop"; strictly ban "xưởng" | **PASS** | All routes, tables, components, and documentation strictly use "shop" |
| **V. Infra & Limits** | Max 12 Serverless Functions; multi-tier caching (Redis + Edge) | **PASS** | Modifies existing files (`me.ts`, `save-draft.ts`, `supabaseAuth.ts`); function count remains 12/12 |
| **VI. Continuous DevLog** | Devlog entry in `devlog/YYYY-MM-DD.md` with Root Cause / Retrospective | **PASS** | Recorded in `devlog/2026-11-17.md` upon completion |
| **UI Constraints** | Protect incomplete pages (`/about` hidden); Portals for overlays | **PASS** | No changes to public navigation or `/about` |

---

## Project Structure

### Documentation (this feature)

```text
specs/003-portal-speedup/
├── spec.md                   # Feature specification
├── plan.md                   # Implementation plan (this file)
├── research.md               # Technical research & architecture decisions (Phase 0)
├── data-model.md             # Database entities & schema definitions (Phase 1)
├── quickstart.md             # Runnable verification guide (Phase 1)
├── baseline-benchmark.md     # Measured baseline metrics
└── tasks.md                  # Implementation tasks (/speckit-tasks)
```

### Source Code Targets

```text
supabase/migrations/
└── 00023_backfill_reject_reasons.sql       # Historical backfill and index

api/
├── _lib/
│   └── supabaseAuth.ts                     # Upstash Redis session caching (60s TTL)
├── portal/
│   ├── me.ts                               # Add pendingProfileRequest, remove audit_logs query
│   └── save-draft.ts                       # Return full product entity with images

src/
└── views/
    └── Portal.tsx                          # Eliminate loadPortalMe() waterfall, local state merge
```

---

## Implementation Steps & Milestones

### Milestone 1: Database Migration & Clean API `/me`
1. Create `supabase/migrations/00023_backfill_reject_reasons.sql` to backfill `reject_reason` from `audit_logs` into `products.reject_reason`.
2. In `api/portal/me.ts`:
   - Add `pendingProfileRequest` query into the existing `Promise.all` block.
   - Remove the unindexed query on `audit_logs`.
   - Read `reject_reason` directly from `p.reject_reason`.
   - Return `pendingProfileRequest` in JSON response.

### Milestone 2: Upstash Redis Auth Session Cache
1. In `api/_lib/supabaseAuth.ts`:
   - Import `getCache`, `setCache` from `./redis.js`.
   - In `authenticateShopMember` and `authenticatePortalUser`, hash the Bearer token with SHA-256.
   - Check Redis cache for `auth_session:<hash>`.
   - On cache miss, verify via Supabase Auth and save to Redis with `ttlSeconds = 60`.
   - Wrap in `try/catch` for graceful fallback on Redis failure.

### Milestone 3: Return Full Product Entity in `save-draft.ts`
1. In `api/portal/save-draft.ts`:
   - After saving product and inserting images, query and return the full sanitized product record (including `product_images`).
   - Ensures the client has full metadata without needing a reload.

### Milestone 4: Frontend State Merge & Waterfall Removal in `Portal.tsx`
1. In `src/views/Portal.tsx`:
   - In `loadPortalMe`: Read `data.pendingProfileRequest` directly from `/api/portal/me` response; delete the secondary `fetch("/api/portal/save-shop")` call.
   - In `handleSaveDraft`: Upon successful API response, merge the returned `data.product` into `setProducts(prev => ...)` locally; delete `await loadPortalMe(token)`.
   - In `handleSubmitReview`: Update product status to `pending_review` in local state; delete `await loadPortalMe(token)`.
   - In `handleCancelUploadRequest` and `handleCancelEditRequest`: Update state locally; remove redundant full reloads.

### Milestone 5: Verification, Post-Optimization Benchmark & DevLog
1. Run `npm run lint` (`tsc --noEmit`) to verify 0 errors.
2. Confirm serverless functions count in `api/` = 12.
3. Run Playwright benchmark to measure post-optimization latency.
4. Record implementation details and lessons in `devlog/2026-11-17.md`.
