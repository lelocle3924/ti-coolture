# Implementation Plan: Shop Product Out-of-Stock Toggle & Multi-Page Web Reflection

**Branch**: `002-product-stock-toggle` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-product-stock-toggle/spec.md`

---

## Summary

Enable local creator shops to manage product stock status with an instant toggle button in `/portal`. When a shop marks a product as "Tạm hết hàng" (Out of stock), the status reflects immediately across all storefront surfaces:
1. **Product Cards** across Homepage, Catalog (`/products`), Shop page (`/stores/:slug`), and Wishlist render a "Tạm hết hàng" badge and apply `opacity-80` to image containers.
2. **Catalog Sorting** automatically deprioritizes out-of-stock items to the bottom of the listings.
3. **Product Detail Page** (`/products/:id`) displays the out-of-stock badge, changes the action button to **"Nhắn shop để hỏi"**, and sets up a restock inquiry message.

The technical approach adds a backwards-compatible column `is_out_of_stock` to `products`, consolidates the backend toggle into the existing `api/portal/product-actions.ts` endpoint (maintaining Vercel's $\le 12$ serverless function budget), automatically purges the Upstash Redis catalog cache upon update, and updates client-side SWR and sorting logic.

---

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js >= 18.x  
**Primary Dependencies**: React 18, Vite, Tailwind CSS, Lucide React, Upstash Redis (`@upstash/redis`), Supabase Client (`@supabase/supabase-js`)  
**Storage**: PostgreSQL (Supabase) + Upstash Redis cache (`catalog:v1`)  
**Testing**: Strict TypeScript type checking (`tsc --noEmit`), Playwright E2E verification, API curl checks  
**Target Platform**: Vercel Serverless Functions + Client SPA (Vite/React)  
**Project Type**: Web Application (React SPA + Serverless REST API)  
**Performance Goals**:
- Toggle optimistic UI response: < 100ms
- API persistence and Redis cache purge: < 1.0s
- Public storefront reflection: < 2.0s
**Constraints**:
- **Vercel Hobby Limit**: Maximum 12 Serverless Functions in `api/`. Consolidated into existing `api/portal/product-actions.ts`. Exactly 12/12.
- **Strict Terminology**: Always use "shop", strictly ban "xưởng".
- **Navigation Guardrail**: Keep `/about` link hidden from public navigation.
- **Defensive Fallback**: Handle missing column gracefully during migration rollout (`row.is_out_of_stock ?? false`).

---

## Constitution Check

*GATE: Must pass before implementation.*

| Principle / Gate | Requirement | Status | Verification Detail |
| :--- | :--- | :--- | :--- |
| **I. Type Safety & Architecture** | Strict TypeScript; no `any` without justification; decoupled services | **PASS** | `isOutOfStock` added to `Product` interface in `src/types.ts`; clean separation between UI and API |
| **II. Quality Gates** | `npm run lint` passes zero errors; runtime health | **PASS** | Will be strictly validated via `npm run lint` before commit |
| **III. Schema Evolution** | Non-breaking changes; defensive fallbacks; numbered migration | **PASS** | Migration `00022_add_product_stock_status.sql` uses `ADD COLUMN IF NOT EXISTS ... DEFAULT false` |
| **IV. Domain Terminology** | Enforce "shop"; strictly ban "xưởng" | **PASS** | All code, copy, UI labels ("Nhắn shop để hỏi"), and docs use "shop" exclusively |
| **V. Infra & Limits** | Max 12 Serverless Functions; multi-tier caching (Redis + Edge) | **PASS** | Handled in existing `api/portal/product-actions.ts` (12 functions maintained); Redis cache purged on toggle |
| **VI. Continuous DevLog** | Devlog entry in `devlog/YYYY-MM-DD.md` with Root Cause / Retrospective | **PASS** | To be recorded in `devlog/2026-11-17.md` upon completion |
| **UI Constraints** | Protect incomplete pages (`/about` hidden); Portals for overlays | **PASS** | Inquiry modals use standard clean overlay behavior; no links to `/about` added |

---

## Project Structure

### Documentation (this feature)

```text
specs/002-product-stock-toggle/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan (this file)
├── research.md          # Technical research & architecture decisions (Phase 0)
├── data-model.md        # Database entities & schema definitions (Phase 1)
├── quickstart.md        # Runnable verification guide (Phase 1)
├── contracts/           # API contracts (Phase 1)
│   └── product-actions-api.yaml
└── tasks.md             # Implementation tasks (/speckit-tasks)
```

### Source Code Targets

```text
supabase/migrations/
└── 00022_add_product_stock_status.sql      # Schema migration + search_products update

api/
├── portal/
│   └── product-actions.ts                   # Add toggle_stock action + Redis cache purge
└── _lib/
    └── redis.ts                             # deleteCache("catalog:v1")

src/
├── types.ts                                 # Add isOutOfStock to Product interface
├── lib/
│   └── dbService.ts                         # Map is_out_of_stock, invalidate SWR cache, sort helpers
└── views/
    ├── Portal.tsx                           # Add stock toggle button to shop inventory table
    ├── Products.tsx                         # Badge, opacity-80, auto-sort out of stock to bottom
    ├── ProductDetail.tsx                    # Badge, "Nhắn shop để hỏi" CTA, restock inquiry message
    ├── Homepage.tsx                         # Badge + opacity-80 on homepage product tiles
    ├── ShopDisplay.tsx                      # Badge + opacity-80 on shop showcase
    └── Wishlist.tsx                         # Badge + opacity-80 on saved items
```

---

## Implementation Steps & Milestones

### Milestone 1: Database & API Foundation
1. Create `supabase/migrations/00022_add_product_stock_status.sql`.
2. Update `api/portal/product-actions.ts` to support `action: "toggle_stock"`.
3. Call `deleteCache("catalog:v1")` inside `product-actions.ts` on success.
4. Update `src/types.ts` to include `isOutOfStock?: boolean` in `Product`.
5. Update `mapProductRowToProduct` in `src/lib/dbService.ts` to map `is_out_of_stock`.

### Milestone 2: Shop Portal Stock Toggle UI
1. In `src/views/Portal.tsx`, add `is_out_of_stock` to product state and table columns.
2. Add toggle button in product row: "Còn hàng" (green) vs "Tạm hết hàng" (amber/slate).
3. Connect button to optimistic UI state update + `POST /api/portal/product-actions`.
4. Include audit logging and rollback handling on API errors.

### Milestone 3: Public Product Cards & Sorting
1. Update `src/views/Products.tsx`:
   - Auto-sort logic: in-stock items first, out-of-stock items bottom.
   - Render badge "Tạm hết hàng" on cards where `product.isOutOfStock === true`.
   - Apply `opacity-80` to thumbnail container.
2. Update `src/views/Homepage.tsx`, `src/views/ShopDisplay.tsx`, and `src/views/Wishlist.tsx` to render the badge and `opacity-80`.

### Milestone 4: Product Detail Page (`ProductDetail.tsx`)
1. Render "Tạm hết hàng" badge adjacent to product price.
2. When `product.isOutOfStock` is true:
   - Change CTA label to **"Nhắn shop để hỏi"**.
   - Change inquiry message body to ask about restock schedule.

### Milestone 5: Verification & DevLog
1. Run `npm run lint` (`tsc --noEmit`) to verify 0 compilation errors.
2. Verify total serverless functions in `api/` does not exceed 12.
3. Test complete flow from Portal toggle to public card and detail page.
4. Record summary and retrospective in `devlog/2026-11-17.md`.
