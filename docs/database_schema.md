# Database Schema Documentation: Tí Coolture

This document details the NoSQL document models, structures, and virtual relationships of the Firebase Firestore database running in our application.

---

## 1. Schema Architecture Overview
While Firestore is a NoSQL schema-less document store, Tí Coolture enforces structured data contracts across five major root collections to ensure visual consistency, type-safety, and seamless join simulation.

```
                  +------------------------+
                  |         users          |
                  +------------------------+
                  | id (Auth UID)          |
                  | wishlist [] --------------> (Ref: products.id)
                  | followedShops [] ---------> (Ref: stores.id)
                  +------------------------+
                              |
                              | (One-to-One / Store Owner)
                              v
   +-------------------------------------------------------+
   |                        stores                         |
   +-------------------------------------------------------+
   | id (Custom slug, e.g. 'store_clay_craft')             |
   | userId (Owner UID)                                    |
   | socials: { facebook, instagram, zalo, etc. }          |
   | registered: boolean                                   |
   | status: "Pending" | "Approved" | "Rejected"           |
   +-------------------------------------------------------+
                              |
                              | (One-to-Many / Products)
                              v
   +-------------------------------------------------------+
   |                       products                        |
   +-------------------------------------------------------+
   | id (Custom slug, e.g. 'prod_ceramic_set')             |
   | storeId (Ref: stores.id)                              |
   | clicks: number (Incremental metric)                   |
   | views: number (Incremental metric)                    |
   | status: "Pending" | "Approved" | "Rejected"           |
   +-------------------------------------------------------+

   +------------------------+      +------------------------+
   |         routes         |      |     button_clicks      |
   +------------------------+      +------------------------+
   | id                     |      | id (URI encoded key)   |
   | name                   |      | buttonText             |
   | stops: [ { x, y } ]    |      | clicks                 |
   +------------------------+      +------------------------+
```

---

## 2. Collections & Document Structures

### 2.1 Collection: `users`
* **Purpose:** Manages user accounts, application roles, and engagement records (bookmarks/favorites/follows).
* **Document ID:** Matches the user's authentic Firebase Authentication UID (e.g., `o8g8uH3bB9c...`).

#### Schema Fields
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique user UID. |
| `email` | `string` | User primary contact email. |
| `role` | `string` | Access tier: `"User"`, `"Shop"`, or `"Admin"`. |
| `wishlist` | `string[]` | Array of bookmarked `Product.id` strings. |
| `wishlistNotes` | `map<string, string>` | Optional product notes keyed by `Product.id`. |
| `wishlistPriceAlerts`| `map<string, number>` | Target price trigger points keyed by `Product.id`. |
| `followedShops` | `string[]` | Array of followed `Store.id` strings. |
| `createdAt` | `string` | ISO 8601 creation timestamp. |

---

### 2.2 Collection: `stores`
* **Purpose:** Represents individual registered cultural boutique shops.
* **Document ID:** Explicitly assigned custom slug or auto-generated string (e.g., `store_clay_craft`).

#### Schema Fields
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique store slug. |
| `userId` | `string` | Relates to `users.id` (shop owner account). |
| `name` | `string` | Brand display name. |
| `logoUrl` | `string` | High-quality circular profile logo link. |
| `coverUrl` | `string` | Wide landscape cover graphic link. |
| `story` | `string` | Long-form brand narrative (biography/craft). |
| `vibe` | `string` | Aesthetic keywords describing store look. |
| `phone` | `string` | Public telephone contact. |
| `email` | `string` | Shared public mailbox. |
| `address` | `string` | Street address of the brick-and-mortar storefront. |
| `taxId` | `string` | Formal commercial Vietnamese Tax ID. |
| `socials` | `map` | Facebook, Instagram, TikTok, Threads, Zalo link strings. |
| `socialToggles` | `map<string, bool>` | Configuration map showing which social options are public. |
| `registered` | `boolean` | State flag showing if registration is finalized. |
| `status` | `string` | Moderation state: `"Pending"`, `"Approved"`, `"Rejected"`. |
| `rejectionReason` | `string`| Message explaining moderator rejection guidelines. |
| `createdAt` | `string` | ISO 8601 creation timestamp. |

---

### 2.3 Collection: `products`
* **Purpose:** Individual crafted items showcasing cultural heritage.
* **Document ID:** Assigned craft slug or auto-generated Firestore ID (e.g., `prod_ceramic_set`).

#### Schema Fields
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Product identifier slug. |
| `storeId` | `string` | Relates to `stores.id` (Parent store hosting item). |
| `storeName` | `string` | Cached store name (flat join for read optimization). |
| `storeLogo` | `string` | Cached store logo link. |
| `name` | `string` | Product label. |
| `price` | `number` | Numerical product price value. |
| `currency` | `string` | ISO currency code (e.g. `"VND"`). |
| `description` | `string` | Full contextual description of the product. |
| `images` | `string[]` | Ordered image links. Element 0 represents the main thumbnail. |
| `category` | `string` | Item category (e.g., `"Tableware"`, `"Home Decor"`). |
| `variants` | `string[]` | Available sizes, materials, or style selections. |
| `material` | `string` | Fine details of craft substance (e.g., `"Terracotta clay"`). |
| `size` | `string` | Physical sizing guidelines. |
| `brand` | `string` | Brand signature identifier. |
| `story` | `string` | Narrative detailing the making of this curated item. |
| `clicks` | `number` | Count of clicks. Utilized for "Popular Now" sorting. |
| `views` | `number` | Incremental land count on details views. |
| `deleteRequested` | `boolean` | Marked for cleanup approval by owner. |
| `status` | `string` | Moderation state: `"Pending"`, `"Approved"`, `"Rejected"`. |
| `rejectionReason` | `string`| Explanation block compiled by Admin. |
| `createdAt` | `string` | ISO 8601 creation timestamp. |

---

### 2.4 Collection: `routes`
* **Purpose:** Coordinates for curated heritage tourist trails.
* **Document ID:** Auto-generated ID or route slug.

#### Schema Fields
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique route ID. |
| `name` | `string` | Title of the exploration route. |
| `description` | `string` | Informational text describing the trail focus. |
| `mapImageUrl` | `string` | Background map asset link. |
| `stops` | `array<map>` | Ordered list of location nodes: `{ id, name, address, description, x, y }`. |

---

### 2.5 Collection: `button_clicks`
* **Purpose:** Unified event tracking data.
* **Document ID:** Dynamic string compiled as: `encodeURIComponent(`${pagePath}_${buttonText}`)`.

#### Schema Fields
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `buttonText` | `string` | Semantic, parsed button action name. |
| `pagePath` | `string` | Exact active pathname routing when clicked. |
| `clicks` | `number` | Sum of total interactions across all platform sessions. |
| `lastClickedAt` | `string` | ISO 8601 timestamp of most recent trigger. |

---

## 3. Indexes & Constraints
* **Atomic Telemetry Increments:** Click and view metrics MUST be written via Firestore `FieldValue.increment()` to avoid collision write locks when multiple clients interact with the same hot product simultaneously.
* **Reference Integrity:** Since Firestore does not support native foreign key constraints, relational correctness (e.g., propagating a store name change to product records) is handled at the service layer in `src/lib/dbService.ts`.
