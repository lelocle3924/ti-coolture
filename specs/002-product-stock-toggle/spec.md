# Feature Specification: Shop Product Out-of-Stock Toggle & Multi-Page Web Reflection

**Feature Branch**: `002-product-stock-toggle`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "Shop muốn có thể chủ động thể hiện là sản phẩm đang hết hàng, thông qua 1 nút bấm để toggle on/off trong portal. Khi toggle, status sản phẩm khi hiển thị trên tất cả các page của web cũng phải được reflect theo tương ứng.
1. Option 1: hãy ghi là 'Nhắn shop để hỏi'
2. Gắn badge và làm mờ ảnh opacity-80
3. Tự động đẩy hàng hết stock xuống cuối."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Instant Stock Toggle in Shop Portal (Priority: P1)

As a shop owner in the Portal, I want a quick on/off toggle button for each product in my inventory table so that I can instantly mark products as "Còn hàng" (In stock) or "Tạm hết hàng" (Out of stock) without requiring admin approval or waiting for review.

**Why this priority**: Core enabler for shops to manage live inventory status in real time. Without this control, shops cannot flag depleted inventory.

**Independent Test**: Log into `/portal` as a shop partner, navigate to the product list, click the stock toggle on a published product. Verify the UI updates optimistically, the backend persists `is_out_of_stock`, and the action succeeds without triggering a draft/review workflow.

**Acceptance Scenarios**:

1. **Given** a published product with `is_out_of_stock = false`, **When** the shop owner clicks the stock toggle in the Portal product table, **Then** the status immediately flips to "Tạm hết hàng", the toggle UI reflects the change (visual feedback + loading spinner), and `is_out_of_stock = true` is saved to the database.
2. **Given** an out-of-stock product (`is_out_of_stock = true`), **When** the shop owner toggles it back to in-stock, **Then** the product status returns to "Còn hàng" and public viewers can see it as available immediately.
3. **Given** a network failure during toggle, **When** the API call fails, **Then** the toggle button rolls back to its previous state and shows an error message.

---

### User Story 2 - Visual Reflection & Auto-Deprioritization on Product Cards (Priority: P1)

As a shopper browsing the website (Homepage, Catalog `/products`, Shop Profile `/stores/:slug`, Wishlist `/wishlist`), I want out-of-stock products to be clearly distinguishable with an "Hết hàng" badge, dimmed image (`opacity-80`), and automatically positioned at the end of listings so that I focus on available products first.

**Why this priority**: Essential customer browsing experience. Prevents customer disappointment from discovering a product is sold out only after clicking into it, while keeping out-of-stock creative items discoverable.

**Independent Test**: Mark a product as out of stock. Visit Homepage, `/products`, and the shop's profile page. Verify the product card shows the badge, its image has `opacity-80`, and in `/products` it is automatically sorted after all in-stock products.

**Acceptance Scenarios**:

1. **Given** products displayed on any product card grid (Homepage, Catalog, Shop display, Wishlist), **When** a product has `is_out_of_stock = true`, **Then** the card renders a clear "Hết hàng" / "Tạm hết hàng" badge on top of the image and the product thumbnail container applies `opacity-80`.
2. **Given** the Catalog page (`/products`), **When** products are sorted (by relevance, newest, or price), **Then** in-stock products appear first, followed by out-of-stock products at the end, while preserving the chosen sort order within each subgroup.
3. **Given** a shopper's wishlist (`/wishlist`), **When** a previously saved product goes out of stock, **Then** the item remains in the wishlist with the "Hết hàng" badge and `opacity-80` image styling.

---

### User Story 3 - Inquiring About Out-of-Stock Items on Product Detail Page (Priority: P2)

As a shopper viewing an out-of-stock product's detail page (`/products/:id`), I want to see an explicit out-of-stock indicator and a CTA button saying "Nhắn shop để hỏi" (instead of "Nhắn shop để đặt") so that I can inquire with the shop about restock schedules or custom orders.

**Why this priority**: Maintains lead generation and conversion channel for shops even when items are temporarily out of stock, aligning with Tí Coolture's mission to connect shoppers to local shops.

**Independent Test**: Navigate to `/products/:id` for an out-of-stock item. Verify the page displays "Tạm hết hàng" alongside the price, the primary action button is labeled "Nhắn shop để hỏi", and clicking it opens the channel dialog with prefilled restock inquiry text.

**Acceptance Scenarios**:

1. **Given** a user viewing `/products/:id` where `is_out_of_stock = true`, **When** the page loads, **Then** a "Tạm hết hàng" status badge is displayed next to the price.
2. **Given** an out-of-stock product detail page, **When** the user inspects the action button, **Then** the button text reads "Nhắn shop để hỏi" (Message shop to ask) with an external link / chat icon.
3. **Given** the user clicks "Nhắn shop để hỏi", **When** the inquiry channel modal opens, **Then** the prefilled message contains restock inquiry phrasing: *"Chào [Shop]! Mình thấy sản phẩm '[Tên sản phẩm]' trên Tí Coolture đang tạm hết hàng, cho mình hỏi dự kiến khi nào shop có hàng lại ạ? Cảm ơn shop!"*.

---

### Edge Cases

- **Redis Cache Invalidation**: When a shop toggles stock in Portal, the serverless handler MUST actively invalidate/purge the Upstash Redis key `catalog:v1` to prevent visitors from seeing stale stock status for up to 5 minutes.
- **Hidden vs Out of Stock**: If a product has `product_hidden = true` or `shop_hidden = true`, it remains completely hidden from public listings regardless of whether `is_out_of_stock` is true or false.
- **Product Drafts & Rejected Products**: Only published products can have their stock toggled for public visibility. Draft or rejected products display their respective review status.
- **Search RPC (`search_products`) Compatibility**: The PostgreSQL RPC function `search_products` must return `is_out_of_stock` and order in-stock items ahead of out-of-stock items (`ORDER BY is_out_of_stock ASC, ...`).
- **Terminology Enforcement**: All code, UI strings, database comments, and documentation MUST use "shop" and NEVER use "xưởng".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow authenticated shop members to toggle `is_out_of_stock` (true/false) for their published products in `/portal`.
- **FR-002**: Stock toggle action MUST be integrated into the existing endpoint `api/portal/product-actions.ts` using `action: "toggle_stock"` without creating new files in `api/` (maintaining <= 12 serverless functions).
- **FR-003**: System MUST invalidate Upstash Redis `catalog:v1` cache immediately upon stock status update.
- **FR-004**: Database MUST store `is_out_of_stock boolean NOT NULL DEFAULT false` in the `products` table via migration `00022_add_product_stock_status.sql`.
- **FR-005**: All product cards across Homepage, `/products`, `/stores/:slug`, and `/wishlist` MUST display an "Hết hàng" badge and apply `opacity-80` to the image when `is_out_of_stock` is true.
- **FR-006**: Product catalog (`/products`) MUST automatically partition/sort results such that all in-stock products appear before out-of-stock products.
- **FR-007**: Product detail page (`ProductDetail.tsx`) MUST render "Tạm hết hàng" badge, change main CTA to "Nhắn shop để hỏi", and adjust inquiry copy to ask about restock timing.
- **FR-008**: Client data layer (`src/lib/dbService.ts`) and TypeScript interfaces (`src/types.ts`) MUST include `isOutOfStock?: boolean` mapped directly from database row `is_out_of_stock`.

### Key Entities

- **Product**:
  - `is_out_of_stock`: boolean (default `false`) indicating whether the product is temporarily out of stock.
  - `product_hidden`: boolean (default `false`) indicating whether the product is hidden by shop/admin.
  - `shop_hidden`: boolean (default `false`) indicating whether the parent shop is hidden.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Shop owners can toggle product stock status with optimistic UI feedback in < 100ms and server persistence in < 1s.
- **SC-002**: When stock status changes, changes reflect on public web pages within 2 seconds (after Redis cache purge).
- **SC-003**: 100% of out-of-stock products display `opacity-80` and the "Hết hàng" badge across all public views.
- **SC-004**: Zero compilation or lint errors (`npm run lint` passes strictly with no errors).
- **SC-005**: Total serverless function files in `/api` remains <= 12.

## Assumptions

- Shops manage stock at product level (boolean in/out of stock), not numeric inventory count.
- Out-of-stock products remain visible for discovery, brand awareness, and restock inquiry rather than being completely hidden like `product_hidden`.
- Authentication follows existing Supabase JWT / shop member session via `authenticateShopMember`.
