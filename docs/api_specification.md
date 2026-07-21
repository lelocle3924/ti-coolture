# API Specification: Tí Coolture

This document details the backend REST endpoints and the client-side Firebase data abstraction layer (Firestore operations) that drive the application.

---

## 1. Backend REST Endpoints (Express Server)

The Node.js/Express backend listens on port `3000` and serves both static assets (in production) and a developer webhook log simulator.

### 1.1 Trigger Webhook Log
* **Endpoint:** `POST /api/webhooks/trigger`
* **Description:** Receives a payload representing an action taken on the client, formats it as an audit log entry, inserts it at the front of an in-memory queue, and returns the generated log block.
* **Content-Type:** `application/json`

#### Request Body Schema (JSON)
```json
{
  "type": "object",
  "required": ["action", "payload"],
  "properties": {
    "action": {
      "type": "string",
      "description": "The uppercase event action slug.",
      "example": "PRODUCT_SUBMITTED_FOR_MODERATION"
    },
    "payload": {
      "type": "object",
      "description": "Freeform JSON object representing specific contextual metadata.",
      "example": {
        "productId": "prod_ceramic_set",
        "productName": "Terracotta Tea Set 'Đất Đen'",
        "storeId": "store_clay_craft"
      }
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "ISO timestamp. Generates on the server if omitted."
    }
  }
}
```

#### Response (Success 200 OK)
```json
{
  "success": true,
  "log": {
    "id": "v3b4u9x",
    "action": "PRODUCT_SUBMITTED_FOR_MODERATION",
    "payload": {
      "productId": "prod_ceramic_set",
      "productName": "Terracotta Tea Set 'Đất Đen'",
      "storeId": "store_clay_craft"
    },
    "timestamp": "2026-07-14T19:22:04.123Z"
  }
}
```

---

### 1.2 Fetch Webhook Audit Logs
* **Endpoint:** `GET /api/webhooks/logs`
* **Description:** Retrieves the current chronological list of the last 100 webhook logs stored in-memory.
* **Content-Type:** `application/json`

#### Response (Success 200 OK)
```json
[
  {
    "id": "v3b4u9x",
    "action": "PRODUCT_SUBMITTED_FOR_MODERATION",
    "payload": {
      "productId": "prod_ceramic_set",
      "productName": "Terracotta Tea Set 'Đất Đen'",
      "storeId": "store_clay_craft"
    },
    "timestamp": "2026-07-14T19:22:04.123Z"
  }
]
```

---

## 2. Client-Side Firestore Operations Layer (`src/lib/dbService.ts`)

Instead of standard HTTP wrappers, major data mutations run directly over the secure Google Firestore Client SDK. Below is the API schema for these primary operations:

### 2.1 Fetch Curated Products
* **Function:** `fetchProducts(): Promise<Product[]>`
* **Description:** Retrieves all products from the Firestore `products` collection, returning them chronologically (or sorted by click metrics in discovery widgets).
* **Return Payload Structure:**
```typescript
interface Product {
  id: string;
  storeId: string;
  storeName: string;
  storeLogo?: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  images: string[];
  category: string;
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
}
```

### 2.2 Increment Product Click Counter
* **Function:** `incrementProductClick(productId: string): Promise<void>`
* **Description:** Atomic update function that increases the `clicks` metric of a given product in Firestore by exactly `1` using Firestore `increment(1)` operation. Done when a user clicks any product card.

### 2.3 Increment Product View Counter
* **Function:** `incrementProductView(productId: string): Promise<void>`
* **Description:** Atomic update function that increases the `views` metric of a given product in Firestore by exactly `1`. Called dynamically when a user loads a product's dedicated details page.

### 2.4 Record Global Button Click Stat
* **Function:** `recordButtonClick(buttonText: string, pagePath: string): Promise<void>`
* **Description:** Upserts a button click document inside the `button_clicks` collection.
* **ID generation rule:** `encodeURIComponent(`${pagePath}_${buttonText}`)` (safe key string mapping).
* **Document Update Payload:**
```json
{
  "buttonText": "Explore Details Button",
  "pagePath": "/products",
  "clicks": increment(1),
  "lastClickedAt": "2026-07-14T19:24:00.000Z"
}
```

### 2.5 Fetch Button Analytics
* **Function:** `fetchButtonClickStats(): Promise<ButtonClickStat[]>`
* **Description:** Pulls all tracked button click logs and sorts them in descending order of click counts for Admin visual panels.
