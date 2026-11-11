# Implementation Plan: Admin Performance & Conversion Dashboard

**Branch**: `001-admin-performance-dashboard` | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-admin-performance-dashboard/spec.md`

---

## Summary

Build an administrative performance dashboard for Tí Coolture to track high-level traffic metrics (visitors, page views, new vs. returning, device/channel distribution), product and shop discovery performance (top 10 viewed/favorited products, top shops, categories, search keywords), and quantify the 5-stage conversion funnel ending in outbound referrals to shop commerce channels. 

The technical approach implements a lightweight, privacy-preserving tracking client using `localStorage` visitor flags without IP addresses or cookie banners, a single consolidated serverless endpoint `api/analytics.ts` (maintaining Vercel Hobby's $\le 12$ functions budget), atomic SQL counters in Supabase backed by an Upstash Redis cache (5-minute TTL), and a responsive admin dashboard UI integrated into the `/portal` Admin Hub.

---

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js >= 18.x  
**Primary Dependencies**: React 18, Vite, Tailwind CSS, Lucide React, Upstash Redis (`@upstash/redis`), Supabase Client (`@supabase/supabase-js`)  
**Storage**: PostgreSQL (Supabase) + Upstash Redis cache  
**Testing**: Strict TypeScript type checking (`tsc --noEmit`), Playwright E2E verification, API contract curl tests  
**Target Platform**: Vercel Serverless Functions + Client SPA (Vite/React)  
**Project Type**: Web Application (React SPA + Serverless REST API)  
**Performance Goals**: Dashboard overview initial load < 2.0s for any 30-day window; tracking beacon acknowledgment < 50ms without blocking UI; LCP < 2.5s  
**Constraints**: 
- Vercel Hobby Limit: Maximum 12 Serverless Functions in `api/` (exactly 1 consolidated handler `api/analytics.ts` added, reaching 12/12).
- Zero PII / IP storage: Privacy-by-design, no cookie consent popups.
- Strict Terminology: "shop" enforced across 100% of codebase, schemas, and UI; "xưởng" strictly banned.
- Navigation guardrail: `/about` page link remains strictly hidden from public navigation.  
**Scale/Scope**: ~100,000 monthly page views; 5 user stories; 1 consolidated API router (`api/analytics.ts`); 1 client tracking library (`src/lib/analytics.ts`); 1 dashboard UI view module (`src/components/admin/AnalyticsDashboard.tsx`).

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-evaluated after Phase 1 design.*

| Principle / Gate | Requirement | Status | Verification Detail |
| :--- | :--- | :--- | :--- |
| **I. Type Safety & Architecture** | Strict TypeScript; no unwarranted `any`/`@ts-ignore`; decoupled services | **PASS** | Contracts typed in `src/types.ts` and `api/analytics.ts`; clean view/API separation |
| **II. Quality Gates** | `npm run lint` zero errors; runtime health; performance budget | **PASS** | Verified type definitions; lightweight beacon payloads (< 2KB) |
| **III. Schema Evolution** | Non-breaking changes; defensive fallbacks; numbered migration | **PASS** | `00021_analytics_daily_rollups.sql` adds nullable/default columns with backward compatibility |
| **IV. Domain Terminology** | Enforce "shop"; strictly forbid "xưởng" | **PASS** | All routes, tables, components, and documentation strictly use "shop" |
| **V. Infra & Limits** | Max 12 Serverless Functions; multi-tier caching (Redis + Edge) | **PASS** | 1 consolidated API file (`api/analytics.ts`), total functions = 12; Redis 5-min TTL cache |
| **VI. Continuous DevLog** | Devlog entry in `devlog/YYYY-MM-DD.md` with Root Cause / Retrospective | **PASS** | Updated in `devlog/2026-11-11.md` |
| **UI Constraints** | Protect incomplete pages (`/about` hidden); Portals for overlays | **PASS** | Dashboard resides inside authenticated `/portal`; no link to `/about` added |

---

## Project Structure

### Documentation (this feature)

```text
specs/001-admin-performance-dashboard/
├── plan.md              # Implementation plan (/speckit-plan)
├── research.md          # Technical research & architecture decisions (Phase 0)
├── data-model.md        # Database entities & schema definitions (Phase 1)
├── quickstart.md        # Runnable verification guide (Phase 1)
├── contracts/           # API schemas and endpoint contracts (Phase 1)
│   └── analytics-api.yaml
└── checklists/
    └── requirements.md  # Quality validation checklist
```

### Source Code (repository root)

```text
api/
├── _lib/
│   ├── redis.ts                 # Existing Upstash Redis cache client
│   ├── supabaseAdmin.ts         # Supabase service role client
│   └── supabaseAuth.ts          # Bearer JWT and staff authentication helper
└── analytics.ts                 # NEW: Consolidated serverless router (POST track, GET overview/funnel)

src/
├── lib/
│   ├── analytics.ts             # NEW: Client-side tracking utility (sendBeacon, localStorage visit flag)
│   └── types.ts                 # Updated analytics contracts and response types
├── components/
│   └── admin/
│       └── AnalyticsDashboard.tsx # NEW: Admin analytics dashboard view with KPI cards, charts, leaderboards, funnel
└── views/
    ├── Portal.tsx               # Updated: Integrates "analytics" tab into Admin Hub
    ├── ProductDetail.tsx        # Updated: Dispatches product view, favorite delta, and outbound click events
    └── ShopDisplay.tsx          # Updated: Dispatches shop view and outbound social/link clicks

supabase/
└── migrations/
    └── 00021_analytics_daily_rollups.sql # NEW: Migration for daily aggregates and atomic counters
```

**Structure Decision**:
Consolidates all serverless backend analytics logic into `api/analytics.ts` to strictly satisfy the Vercel Hobby 12-function limit. Frontend UI is isolated in `src/components/admin/AnalyticsDashboard.tsx` and mounted dynamically into `src/views/Portal.tsx` when the admin selects the "Tổng quan" (Dashboard) tab.

---

## Complexity Tracking

> **Violations: None. All design decisions adhere to the Constitution.**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| :--- | :--- | :--- |
| *None* | N/A | N/A |
