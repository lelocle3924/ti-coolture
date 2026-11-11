# Technical Research & Architecture Decisions: Admin Performance & Conversion Dashboard

**Feature**: `001-admin-performance-dashboard`  
**Date**: 2026-11-11  
**Status**: Resolved  

---

## 1. Analytics Event Ingestion & Client Tracking

### Context & Challenge
The platform needs to capture page views, product views, shop clicks, search queries, favorites, and outbound conversion clicks across desktop and mobile devices without degrading client Largest Contentful Paint (LCP < 2.5s) or blocking user interaction.

### Decision
- Implement a lightweight tracking utility `src/lib/analytics.ts` that uses `navigator.sendBeacon` (with fallback to `fetch(..., { keepalive: true })`).
- Requests are dispatched asynchronously to a single serverless endpoint `api/analytics.ts?action=track`.
- Events are decoupled from UI rendering: tracking calls fire during `useEffect` or button click handlers without waiting for responses (`fire-and-forget`).

### Rationale
- `navigator.sendBeacon` and `keepalive` ensure events (especially outbound link clicks where users leave the site) reliably transmit even as the tab unloads.
- Minimal bundle overhead (< 2KB client code) avoids bundle bloat.
- Prevents database connection exhaustion by centralizing intake through the serverless API.

### Alternatives Considered
- **Direct Supabase client inserts**: Rejected because public anon keys allowing direct table inserts bypass rate limiting, lack server-side validation, and expose database connection limits.
- **Third-party SaaS (Google Analytics 4 / PostHog)**: Rejected because client requirements and user specification document mandate lightweight, privacy-first internal tracking without cookie banners and without third-party vendor scripts.

---

## 2. Privacy-First Visitor Counting & New vs. Returning Identification

### Context & Challenge
Tracking unique visitors and new vs. returning visitor breakdown usually involves cookies, IP logging, or fingerprinting, which triggers GDPR / ePrivacy banner requirements and privacy policy concerns.

### Decision
- Use client-side `localStorage` flag `ti_visited_before`:
  1. On session start / first route change, the client checks `localStorage.getItem('ti_visited_before')`.
  2. If absent: Flag visit as `is_new: true`, then write `localStorage.setItem('ti_visited_before', '1')`.
  3. If present: Flag visit as `is_new: false` (returning visitor).
  4. Transmit only the boolean indicator (`is_new: boolean`) and device category (`mobile` | `desktop` | `tablet`) to the server.
  5. Zero storage of IP address, hardware fingerprint, or personal identifier.
- Synchronize public Privacy Policy (`Policy.md`, `Terms.tsx`) to state clearly that visitor counts are anonymous estimates based on local browser state.

### Rationale
- Completely eliminates the need for annoying cookie consent popups.
- Matches the legal recommendations specified in `Tí Coolture - Dashboard.md`.
- Gracefully handles browser clearing as an acceptable statistical estimate.

### Alternatives Considered
- **IP Address Hashing with Daily Salt**: Rejected because even hashed IP addresses are considered pseudonymous personal data under strict privacy standards and can be blocked by modern privacy browsers.
- **Canvas / Audio Fingerprinting**: Strictly rejected due to privacy invasiveness and high error rates across iOS Safari.

---

## 3. Product Favoriting Counter (+1 / -1) Architecture

### Context & Challenge
Currently, user wishlists live on the client device (or user profile). To display "Top 10 Most Favorited Products" without querying private user lists, the server needs aggregate counts.

### Decision
- Maintain an atomic aggregate counter (`favorite_count` in products table or an analytics counter table).
- When a visitor toggles the heart icon (in `ProductCard` or `ProductDetail`), client triggers `trackFavoriteDelta(productId, +1 | -1)`.
- Backend executes atomic Postgres increment: `favorite_count = GREATEST(0, favorite_count + delta)` to prevent negative values.

### Rationale
- Constant-time O(1) reads for top favorited products leaderboard.
- Total privacy: Server knows total favorites for a product, but never knows which anonymous visitor clicked it.

### Alternatives Considered
- **Count rows in a favorites junction table**: Rejected because non-logged-in users store favorites in browser storage, so a server database would miss anonymous user favorites.

---

## 4. End-to-End Funnel Conversion Rate Calculation

### Context & Challenge
Tí Coolture is a discovery platform promoting local shops and Vietnamese creative brands. Users do not complete checkout on-platform; they discover products and convert by visiting the shop's external channels (Shopee, Instagram, Zalo, TikTok, Facebook, or Website).

### Decision
- Formalize a 5-step conversion funnel:
  1. **Step 1 - Total Visitors**: Distinct visitor sessions tracked via anonymous visit pings.
  2. **Step 2 - Catalog Discovery**: Visitors who navigate into `/products`, `/stores`, or discovery filters.
  3. **Step 3 - High-Intent View**: Visitors viewing a specific `ProductDetail` or `ShopDisplay` page.
  4. **Step 4 - Wishlist Engagement**: Visitors adding at least one item to their favorites.
  5. **Step 5 - Outbound Referral**: Visitors clicking an outbound shop link (Social, Shopee, Zalo, Order Now).
- Conversion Rate Calculation:
  - **Macro Funnel Conversion Rate** = `(Outbound Referrals / Total Visitors) * 100%`
  - **Step-by-Step Transition Rate** = `(Stage[i] / Stage[i-1]) * 100%`
  - **Channel Attribution Breakdown**: Percentage split of outbound clicks across Instagram, Shopee, Zalo, TikTok, Website.

### Rationale
- Accurately captures the true commercial value Tí Coolture delivers to participating shops.
- Measurable, auditable, and technology-agnostic.

---

## 5. Vercel Serverless Function & Cache Architecture

### Context & Challenge
- Constitution Principle V enforces: Maximum 12 Serverless Functions in `api/`.
- Current function count is 11.
- Dashboard queries over thousands of events could cause cold starts, latency spikes, and Supabase CPU bottlenecks.

### Decision
- Consolidate all analytics endpoints into a single handler: `api/analytics.ts`.
  - `POST /api/analytics?action=track`: Ingest client tracking beacons (public, rate-limited, fast-ack).
  - `POST /api/analytics?action=batch`: Ingest multiple batched events.
  - `GET /api/analytics?action=overview`: Fetch admin dashboard summary KPIs, charts, and leaderboards (requires Admin Bearer token).
  - `GET /api/analytics?action=funnel`: Fetch 5-stage funnel breakdown and channel metrics (requires Admin Bearer token).
- Multi-tier Caching:
  - Dashboard responses cached in Upstash Redis with a 5-minute TTL (`s-maxage=300`).
  - Stale-while-revalidate headers (`stale-while-revalidate=600`) ensure instant responses for admins.
  - Total Serverless Functions in `api/`: $11 + 1 = 12$ (strictly within the Vercel Hobby limit).

---

## 6. Database Schema & Migration Strategy

### Context & Challenge
Need to store daily rollup metrics and individual click events efficiently while maintaining backwards compatibility.

### Decision
- Leverage existing `click_events` and `search_logs` tables in `00011_analytics.sql`.
- Add an incremental migration `00021_analytics_daily_rollups.sql`:
  - `analytics_daily_metrics`: Stores daily pre-aggregated counters (`date`, `visitors`, `page_views`, `new_visitors`, `returning_visitors`, `mobile_views`, `desktop_views`, `tablet_views`, `outbound_clicks`, `wishlist_adds`).
  - Adds atomic `favorite_count` and `view_count` integers to `products` (with zero-default fallback).
  - Adds atomic `view_count` and `outbound_click_count` to `shops`.
  - Migration includes safe fallback columns to prevent breaking existing production queries.

---

## Summary of Architectural Approvals

| Concern | Architectural Resolution | Constitution Principle Aligned |
| :--- | :--- | :--- |
| **Strict Terminology** | Strictly use "shop", zero occurrences of "xưởng" | Principle IV |
| **Vercel Hobby Limit** | Single consolidated router `api/analytics.ts` (12/12 functions) | Principle V |
| **Performance & Latency** | Redis 5-min cache + pre-aggregated daily rollups | Principle I & V |
| **Privacy & Legal** | Anonymous client flag, zero PII, zero IP, Policy synced | Principle II & Legal |
| **Schema Evolution** | Non-breaking SQL migration `00021_analytics_daily_rollups.sql` | Principle III |
