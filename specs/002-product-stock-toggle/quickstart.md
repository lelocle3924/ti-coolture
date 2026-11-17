# Quickstart & Verification Guide: Shop Product Out-of-Stock Toggle

**Branch**: `002-product-stock-toggle` | **Date**: 2026-11-17

## Prerequisites
1. Local development environment running (`npm run dev`).
2. Supabase instance migrated with `supabase/migrations/00022_add_product_stock_status.sql`.
3. Valid shop owner credentials or dev bypass token for `/portal`.

---

## Verification Steps

### Step 1: Database Migration Check
Execute SQL migration on Supabase:
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'is_out_of_stock';
```
*Expected*: Returns 1 row with `data_type = 'boolean'` and `column_default = 'false'`.

---

### Step 2: Shop Portal Stock Toggle Verification
1. Navigate to `http://localhost:5173/portal` and log in as a Shop partner.
2. Open the **"Sản phẩm" (Products)** tab.
3. Locate the new **Kho hàng (Stock)** toggle button in the product table row.
4. Click the toggle button for a published product:
   * **In Stock -> Out of Stock**: Button turns to "Tạm hết hàng", optimistic UI changes immediately, API returns `success: true`.
   * **Out of Stock -> In Stock**: Button turns back to "Còn hàng".
5. Inspect Network tab: `POST /api/portal/product-actions` with `{ action: "toggle_stock", productId: "...", isOutOfStock: true }` returns HTTP 200.

---

### Step 3: Public Catalog Reflection (`/products`)
1. Open `http://localhost:5173/products` in an incognito window.
2. Verify the product that was marked out of stock:
   * Image has `opacity-80` applied.
   * Product card displays badge "Tạm hết hàng" or "Hết hàng".
   * Product is positioned after all in-stock items in the catalog listing.

---

### Step 4: Product Detail Page & Restock Inquiry (`/products/:id`)
1. Click on the out-of-stock product card to open its detail page.
2. Verify:
   * Badge "Tạm hết hàng" displays next to the price.
   * Primary action button text reads **"Nhắn shop để hỏi"**.
   * Click the button: The modal opens with prefilled inquiry text asking the shop about restock timing.

---

### Step 5: TypeScript & Vercel Budget Gate
Run lint and verify file count:
```bash
# 1. Type check
npm run lint

# 2. Verify serverless function count in api/ (must be <= 12)
(Get-ChildItem -Recurse api -Filter "*.ts" | Where-Object { $_.DirectoryName -notmatch "_lib" }).Count
```
*Expected*: Lint passes with 0 errors. Function count is <= 12.
