# Phase 0 Research: Shop Product Out-of-Stock Toggle

**Branch**: `002-product-stock-toggle` | **Date**: 2026-11-17

## Technical Architecture & Design Decisions

### 1. Database Schema & Migration Strategy

* **Decision**: Add column `is_out_of_stock boolean NOT NULL DEFAULT false` to the `products` table in Supabase.
* **Migration file**: `supabase/migrations/00022_add_product_stock_status.sql`.
* **Rationale**:
  * Default `false` guarantees 100% backward compatibility for all existing products.
  * Simple boolean aligns with Tí Coolture's curation model where creator shops toggle on/off availability rather than maintaining high-volume real-time SKU inventory.
  * Index on `(status, is_out_of_stock)` facilitates high-performance catalog querying and sorting.
* **RPC Function (`search_products`)**:
  * Update `search_products` to return `is_out_of_stock boolean`.
  * Update `ORDER BY` to place `is_out_of_stock ASC` first before secondary sort criteria (relevance, price, date).

### 2. Serverless API & Vercel Budget (<= 12 Functions)

* **Constraint**: Vercel Hobby tier allows a maximum of 12 serverless functions in `api/`. The repository currently has exactly 12 functions:
  1. `api/analytics.ts`
  2. `api/catalog.ts`
  3. `api/admin/portal/invite.ts`
  4. `api/admin/requests/index.ts`
  5. `api/admin/reviews/index.ts`
  6. `api/admin/staff/index.ts`
  7. `api/portal/me.ts`
  8. `api/portal/product-actions.ts`
  9. `api/portal/save-draft.ts`
  10. `api/portal/save-shop.ts`
  11. `api/portal/submit-review.ts`
  12. `api/portal/upload-ticket.ts`
* **Decision**: Extend `api/portal/product-actions.ts` to support `action: "toggle_stock"`.
* **Zero New Serverless Files**: No new `.ts` files added under `api/`, maintaining the count strictly at 12/12.

### 3. Multi-Tier Cache Invalidation

* **Problem**: `api/catalog.ts` caches the full public catalog in Upstash Redis (`catalog:v1`, TTL 300s) and CDN Edge (`s-maxage=300`). If a shop toggles stock in the Portal, visitors could see stale stock information for up to 5 minutes.
* **Solution**:
  1. In `api/portal/product-actions.ts`, upon successful DB update, call `deleteCache("catalog:v1")` from `api/_lib/redis.ts`.
  2. In the client application (`src/lib/dbService.ts`), invalidate the in-memory SWR cache `products_Approved`.
  3. Result: When public visitors browse or navigate, fresh stock status is reflected immediately (< 2s).

### 4. Public Web Presentation & UX Decisions

* **Decision 1 - Product Detail CTA & Message**:
  * User decision: Label CTA as **"Nhắn shop để hỏi"** (Message shop to ask) when `isOutOfStock` is true.
  * Inquiry text customized to restock inquiry:
    *"Chào [Shop]! Mình thấy sản phẩm "[Tên sản phẩm]" trên Tí Coolture đang tạm hết hàng, cho mình hỏi dự kiến khi nào shop có hàng lại ạ? Cảm ơn shop!"*
  * Preserves lead generation and conversion pipeline for local shops.
* **Decision 2 - Product Card Visuals**:
  * User decision: Badge "Tạm hết hàng" / "Hết hàng" on the card.
  * Product thumbnail image container applies `opacity-80` to subtly dim depleted items while keeping creative details legible.
* **Decision 3 - Catalog Sorting**:
  * User decision: Automatically deprioritize out-of-stock items to the bottom of the list across catalog views (`/products`, `/stores/:slug`).
  * In-stock items sort first (`is_out_of_stock = false`), followed by out-of-stock items (`is_out_of_stock = true`), maintaining secondary sort order within each partition.

### 5. Terminology & UI Guardrails

* Strictly enforce "shop" across all UI labels, code, and comments; strictly ban "xưởng".
* Protect `/about` navigation guardrails.
