# TÍ COOLTURE — UX Implementation Task List (v0.2.1 Match)

Derived from `UX-FOUNDATIONS.md`, `wireframes.html` (v0.2), and `motion-directions.html`.

---

## Phase 1: Core Layout & Navigation Chrome

- [ ] **1.1 Auto-Hiding Header & Category Strip (S1, S2, M11)**
  - Unify Header + Category chips into a single block that translates off-screen together on scroll-down.
  - Re-reveal immediately on scroll-up (>8px scroll threshold) or keyboard focus.
  - Guard: Never hide while drawers, filter sheets, or modals are open.
  - Support `prefers-reduced-motion` (instant snap instead of ease transition).
  - Add drawer navigation (M11) with 5 primary links (`Sản phẩm`, `Shop`, `Khám phá`, `Blog`, `Về Tí`), `Hợp tác`, `FAQ`, and `VI | EN` switcher.

- [ ] **1.2 Full-Viewport Reveal Footer (S3, HP-07)**
  - Implement fixed full-viewport underlay (`100dvh`) with animated rising wordmark `TÍ` (scroll-linked).
  - Set main content sheet with opaque background and `margin-bottom` matching footer height.
  - Ensure proper diacritic headroom for `TÍ` (`line-height: 1.18`, padding).
  - Include full sitemap links (`/san-pham`, `/shop`, `/kham-pha`, `/blog`, `/gioi-thieu`, `/faq`, `/hop-tac`, `/dieu-khoan`, `/bao-mat`).

- [ ] **1.3 View Transitions & Native CSS Motion Engine (Tier 1 Motion)**
  - Add `@view-transition { navigation: auto; }` for MPA cross-page transitions.
  - Assign `view-transition-name: product-{slug}` between product card and detail page hero image.
  - Implement native CSS staggered card reveals (`animation-timeline: view()`, 26px lift) strictly below the fold.
  - Implement reading scroll progress bar for blog/brand stories (`animation-timeline: scroll()`).
  - Implement pure CSS scroll-snap carousels (`scroll-snap-type: x mandatory; scroll-snap-stop: always`).

---

## Phase 2: Homepage (`/`) & Shared Components

- [ ] **2.1 Looped Hero Section (M1, D1, §5)**
  - Looped sequence: Tí Coolture image first, followed by curated partner images.
  - Format support: 4:5 portrait ratio on mobile, center-cropped band on desktop (15% safe zone).
  - Add partner attribution pill linking to `/shop/[slug]`.
  - Lazy load all frames except frame 1 (LCP budget < 2.5s); pause on `prefers-reduced-motion`.

- [ ] **2.2 What's In Store Carousel (HP-03, D6)**
  - Native CSS scroll-snap row positioned directly under hero.
  - 84% card width peek on mobile + explicit arrow controls.

- [ ] **2.3 Hidden Gems Drawer & Tab (M10, HP-05)**
  - Collapsible side tab (≤32px, 60–70% viewport height).
  - Hides on scroll-down; tap opens side drawer with 3 curated items.
  - Never auto-opens on mobile; freeze content while drawer is open; reroll on close/reopen.
  - Track analytics: `gem_tab_impression → gem_tab_click → gem_view → gem_outbound`.

---

## Phase 3: Search, Filter & Catalog System

- [ ] **3.1 Header-Only Search Overlay (M2, HP-02)**
  - Remove all in-body search inputs; ⌕ header icon is sole mobile entry point (44x44px tap target).
  - Full-screen search overlay on mobile; inline input in desktop header.
  - 250ms debounce, diacritic-insensitive live suggestions (max 8 items: products first, shops second).
  - Recent searches saved in `localStorage`.

- [ ] **3.2 Catalog & Bottom Sheet Filters (M3, M4, D2, AP-01..07)**
  - Category strip: 7 standard categories (`Thời trang`, `Sản phẩm sáng tạo`, `Văn phòng phẩm`, `Quà tặng`, `Nhà cửa`, `Body care`, `Giải trí`).
  - Mobile bottom sheet filter (M4): multi-select materials, price bands, sorting.
  - Live result count displayed on apply button before committing; sync filters to shareable URL params.
  - Desktop catalog (D2): sticky sidebar filters with counts + active filter removal chips.
  - Standard 24 items per page with crawlable pagination (`‹ 1 2 ... 9 ›`).

- [ ] **3.3 Zero-Result Recovery & Private Demand Capture (M5, Flow B, §8.3 C)**
  - Display individually removable filter constraint chips.
  - Private feedback prompt: *"Bạn đang tìm SẢN PHẨM gì?"* with descriptive example (never asking for shop name).
  - Log paired data privately: `search_logs.query` (typed text) + `demand_notes.description` (intended object).
  - Display 4 fallback suggested products.

---

## Phase 4: Product Detail, Outbound & Wishlist

- [ ] **4.1 Product Detail Screen (M6, D3, PD-01..07)**
  - 1:1 image gallery (swipe on mobile, vertical thumbnail strip on desktop, fullscreen lightbox, max 8 images).
  - Prominent shop identity header above product name.
  - Product story, material specs, dimensions, variants, related products.
  - Sticky bottom `ORDER NOW` bar permanently visible on mobile (sits above reveal footer).

- [ ] **4.2 Outbound Conversion & Message Modal (M7, PD-02, PD-03, §8.4)**
  - `ORDER NOW` triggers non-blocking fire-and-forget `click_events` logging with UTM params.
  - Pre-composed inquiry modal (M7) with product name & URL.
  - Selectable fallback `textarea` + clipboard copy + external launch to Instagram/TikTok.

- [ ] **4.3 Wishlist Drawer (M8, IA-4, PD-06)**
  - `♡` tap writes to `localStorage` and shows a 3-second green tick toast.
  - Header `♡` opens slide-over drawer (no `/wishlist` full page).
  - Dismissible first-time info card: *"Danh sách lưu trên thiết bị này..."*.
  - Empty state with CTA linking back to `/san-pham`.

---

## Phase 5: Map & Exploration Experience (`/kham-pha`)

- [ ] **5.1 District Carousel & Overview (MAP1, Flow D, HP-04)**
  - Homepage section and standalone page `/kham-pha?quan=[slug]`.
  - District carousel with swipe + arrow controls.
  - District map graphic with starting point hotspots.
  - Accessible / SEO crawlable text list of starting points below map.

- [ ] **5.2 Route Display & Interaction (MAP2)**
  - Tapping a start point renders route with dashed polyline and numbered stops.
  - Display route metadata: route name, stop count, estimated walking distance (~1.8 km).
  - Dim inactive pins; tapping start point again closes route; opening new route closes previous.

- [ ] **5.3 Stop Detail Sheet (MAP3)**
  - Slide-up bottom sheet with stop name, type, operating hours, full address, and image.
  - Primary button: **Mở bản đồ ↗** (opens Google Maps search with name + full address).
  - Secondary conditional link: **Xem shop trên Tí ✦** (only if stop has a registered Tí shop).
  - In-sheet previous/next navigation (`‹ Điểm 1 | 2/4 | Điểm 3 ›`).
  - Analytics: track `map_district_view → route_open → route_stop_click → route_stop_external`.

---

## Phase 6: Brand & Static Pages

- [ ] **6.1 Shop Detail & Index (M9, IA-2, SD-01..05)**
  - `/shop` index page: grid of curated brands.
  - `/shop/[slug]`: 3:2 mobile / 21:9 desktop cover image, shop avatar, social links with UTM, brand story, popular items carousel, all products grid.

- [ ] **6.2 Partnership Page (M12, Flow F, §5.6)**
  - `/hop-tac`: Contact CTA button placed prominently above the fold.
  - "What you get" and "What Tí looks for" value props.
  - Example shop preview card at bottom (temporary proof).

- [ ] **6.3 Static & Legal Pages**
  - `/gioi-thieu`, `/faq`.
  - `/dieu-khoan`, `/bao-mat` (explicit retention clause for private demand-note feedback).

---

## Phase 7: Admin Intake, CMS & Analytics Dashboard

- [ ] **7.1 Shop Submission Queue (A1, Flow H, §1)**
  - Route `/admin/duyet` syncing from Google Sheets intake.
  - Live real-component shop preview (Mobile & Desktop).
  - Automated image asset validation (flags <1200px resolution or wrong aspect ratio).
  - 3-state review actions: `Duyệt` (creates hidden shop record), `Cần sửa`, `Từ chối`.
  - V1 scope: Queue + approve action; templated email drafting.

- [ ] **7.2 Analytics Dashboard (A2, §8.3, §8.5)**
  - Product ranking by **Outbound CTR** (not raw views), flagging high-view/low-CTR items.
  - Zero-result search query paired with user demand note descriptions.
  - District & map stop click frequency ranking.
