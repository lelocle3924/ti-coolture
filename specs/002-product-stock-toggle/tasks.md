# Tasks: Shop Product Out-of-Stock Toggle & Multi-Page Web Reflection

**Input**: Design documents from `specs/002-product-stock-toggle/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/product-actions-api.yaml`, `quickstart.md`  
**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Phase 1: Setup (Data Layer & Contracts)

**Purpose**: Update data models, database migration, and client service mapping.

- [X] T001 Define `isOutOfStock?: boolean` in `Product` interface in `src/types.ts` and `is_out_of_stock?: boolean` in `PortalProduct` in `src/views/Portal.tsx`
- [X] T002 [P] Create database migration `supabase/migrations/00022_add_product_stock_status.sql` adding `is_out_of_stock boolean NOT NULL DEFAULT false` to `products`, compound index `idx_products_stock_discovery`, and updating RPC `search_products`
- [X] T003 Update `mapProductRowToProduct` in `src/lib/dbService.ts` to map `is_out_of_stock` database column to `isOutOfStock`

---

## Phase 2: Foundational (API & Cache Invalidation)

**Purpose**: Backend action handler in existing API and Redis cache purge mechanism.

- [X] T004 Extend `api/portal/product-actions.ts` to support `action: "toggle_stock"`, validating shop ownership, updating `is_out_of_stock`, and recording audit log
- [X] T005 [P] Integrate Redis cache purge (`deleteCache("catalog:v1")` via `api/_lib/redis.ts`) in `api/portal/product-actions.ts` on successful stock toggle
- [X] T006 Add SWR cache invalidation helper in `src/lib/dbService.ts` to clear `products_Approved` on client side after toggle

**Checkpoint**: Backend API and data contracts ready. User story implementation can now begin.

---

## Phase 3: User Story 1 - Instant Stock Toggle in Shop Portal (Priority: P1) 🎯 MVP

**Goal**: Allow shop owners to instantly toggle stock status on/off for published products in `/portal` without admin approval.

**Independent Test**: Log into `/portal` as a shop partner, click the stock toggle on a product. Verify optimistic UI updates, API returns 200, and database state persists.

- [X] T007 [US1] Add `handleShopToggleStock` with optimistic UI update and error rollback in `src/views/Portal.tsx`
- [X] T008 [US1] Add "Kho hàng" (Stock) column with toggle button ("Còn hàng" / "Tạm hết hàng") in product table in `src/views/Portal.tsx`
- [X] T009 [US1] Wire toggle button to `POST /api/portal/product-actions` and verify instant action execution without admin review in `src/views/Portal.tsx`

**Checkpoint**: At this point, User Story 1 is a functional MVP allowing shops to manage inventory status.

---

## Phase 4: User Story 2 - Visual Reflection & Auto-Deprioritization on Product Cards (Priority: P1)

**Goal**: Reflect "Tạm hết hàng" status on all storefront product cards with badge, dimmed image (`opacity-80`), and auto-sort out-of-stock items to the bottom of catalog listings.

**Independent Test**: Mark a product as out of stock. Verify that on Homepage, `/products`, `/stores/:slug`, and `/wishlist`, the card displays the badge, image has `opacity-80`, and `/products` sorts out-of-stock items to the end.

- [X] T010 [P] [US2] Update catalog sorting in `src/views/Products.tsx` to automatically prioritize in-stock items first and push out-of-stock items to the bottom
- [X] T011 [P] [US2] Add "Tạm hết hàng" badge and `opacity-80` image container styling to `ProductCard` in `src/views/Products.tsx`
- [X] T012 [P] [US2] Add "Tạm hết hàng" badge and `opacity-80` styling to homepage product tiles in `src/views/Homepage.tsx`
- [X] T013 [P] [US2] Add "Tạm hết hàng" badge and `opacity-80` styling to shop showcase cards in `src/views/ShopDisplay.tsx`
- [X] T014 [P] [US2] Add "Tạm hết hàng" badge and `opacity-80` styling to saved item cards in `src/views/Wishlist.tsx`

**Checkpoint**: User Stories 1 AND 2 are complete. Public visitors see accurate, deprioritized out-of-stock products across all browsing surfaces.

---

## Phase 5: User Story 3 - Inquiring About Out-of-Stock Items on Product Detail (Priority: P2)

**Goal**: On product detail page, display out-of-stock indicator, change CTA to "Nhắn shop để hỏi", and adjust default inquiry copy to inquire about restock timeline.

**Independent Test**: Open `/products/:id` for an out-of-stock product. Confirm "Tạm hết hàng" badge displays next to price, CTA button says "Nhắn shop để hỏi", and inquiry message body asks when the shop will restock.

- [X] T015 [US3] Render "Tạm hết hàng" status badge next to price in `src/views/ProductDetail.tsx` when `product.isOutOfStock` is true
- [X] T016 [US3] Change primary action button label from "Nhắn shop để đặt" to "Nhắn shop để hỏi" in `src/views/ProductDetail.tsx` when `product.isOutOfStock` is true
- [X] T017 [US3] Update inquiry modal default message to restock inquiry copy when item is out of stock in `src/views/ProductDetail.tsx`

**Checkpoint**: All 3 user stories are fully implemented and integrated.

---

## Phase 6: Polish, Quality Gates & DevLog

**Purpose**: Strict verification against Constitution rules, type checking, and documentation.

- [X] T018 Run strict type check (`npm run lint`) to confirm 0 compilation errors across entire project
- [X] T019 Verify total serverless functions count in `api/` remains $\le 12$
- [X] T020 Record feature implementation, architectural summary, and retrospective in `devlog/2026-11-17.md`
