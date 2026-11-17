# Phase 1 Data Model: Shop Product Out-of-Stock Toggle

**Branch**: `002-product-stock-toggle` | **Date**: 2026-11-17

## Database Schema Changes (Supabase PostgreSQL)

### 1. `products` Table Alteration

```sql
-- Migration: 00022_add_product_stock_status.sql

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_out_of_stock boolean NOT NULL DEFAULT false;

-- Compound index for catalog discovery and stock sorting
CREATE INDEX IF NOT EXISTS idx_products_stock_discovery 
  ON products (status, product_hidden, shop_hidden, is_out_of_stock);

COMMENT ON COLUMN products.is_out_of_stock IS 'True if the shop marked this product as temporarily out of stock.';
```

### 2. Search RPC Function Update (`search_products`)

The `search_products` function return table and ordering are updated to include `is_out_of_stock`:

```sql
-- In search_products return table:
RETURNS TABLE (
  id uuid,
  shop_id uuid,
  shop_name text,
  ...
  is_featured boolean,
  is_out_of_stock boolean,  -- NEW RETURN COLUMN
  status publish_status,
  published_at timestamptz,
  rank_score real,
  total_count bigint
)

-- In ORDER BY clause:
ORDER BY
  mp.is_out_of_stock ASC, -- Prioritize in-stock products
  CASE WHEN sort_by = 'price_asc' THEN mp.price_vnd END ASC NULLS LAST,
  CASE WHEN sort_by = 'price_desc' THEN mp.price_vnd END DESC NULLS LAST,
  CASE WHEN sort_by = 'newest' THEN mp.published_at END DESC NULLS LAST,
  CASE WHEN sort_by = 'relevance' OR sort_by IS NULL THEN mp.rank_score END DESC,
  mp.published_at DESC NULLS LAST
```

---

## TypeScript Contracts (`src/types.ts`)

```typescript
export interface Product {
  id: string;
  storeId: string;
  storeName: string;
  storeLogo?: string;
  name: string;
  price: number;
  currency: string; // "VND"
  description: string;
  images: string[];
  category: string;
  categorySlug: string;
  categoryGroup: string;
  categoryGroupSlug: string;
  variants: string[];
  material?: string;
  size?: string;
  brand?: string;
  story?: string;
  clicks: number;
  views?: number;
  deleteRequested?: boolean;
  status: "Pending" | "Approved" | "Rejected";
  rejectionReason?: string;
  createdAt: string;
  hidden?: boolean;
  isOutOfStock?: boolean; // NEW: true when product is marked out of stock by shop
}
```

---

## API Request / Response Contract

### `POST /api/portal/product-actions`

#### Request Payload
```json
{
  "action": "toggle_stock",
  "productId": "43015f60-5a0a-4fa4-a212-70b86a877ff1",
  "isOutOfStock": true
}
```

#### Response Payload (200 OK)
```json
{
  "success": true,
  "message": "Đã cập nhật trạng thái hết hàng cho sản phẩm \"Bình gốm mộc\".",
  "product": {
    "id": "43015f60-5a0a-4fa4-a212-70b86a877ff1",
    "name_vi": "Bình gốm mộc",
    "is_out_of_stock": true,
    "status": "published"
  }
}
```
