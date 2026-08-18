# TÍ COOLTURE — UX Foundations v0.2.1

**Changed:** 18/08/2026, after team feedback. v0.1 got several things wrong; those are corrected below and marked.

**Tags:** `[SRS]` from SRS v1.1 or the brand doc · `[TEAM]` decided 18/08 · `[DERIVED]` inferred by me · `[OPEN]` still needs an answer

---

## 0. CORRECTIONS TO v0.1

Four things I had wrong. Recorded rather than quietly edited, because two of them changed what got drawn.

### 0.1 The map is not the reason the site exists `[TEAM]`

I wrote that the route map was "the project's reason to exist" and drew its stops as shops to go and buy from. Both wrong.

The map shows **places worth visiting** — somewhere to eat, look at things, spend an afternoon. It is not a directory of Tí Coolture shops, and **most featured shops have no physical premises at all**. It's an added-value feature that gives a visitor a reason to stay and to come back. That's a good reason to build it. It isn't the site's purpose.

Consequences that actually changed screens:
- A stop is a destination, so the primary action is **Mở bản đồ**, not "browse this shop's products"
- Only the minority of stops that are a Tí shop with a physical address get a secondary catalogue link
- Drawing every stop as a shop card would have promised something the data can't deliver

What survives: SRS §8.5's internal analytics value, in a cleaner form. Ranking which places get opened tells you where attention is concentrated in the city — the input for deciding where **Tí's own** future store might sit. A signal about neighbourhoods, not about individual venues.

### 0.2 Animations are a feature, not a hazard `[TEAM]`

v0.1 story X2 read "I want animations suppressed", which framed motion as something to minimise. Wrong emphasis. Motion carries feedback and visual life, and this site's proposition is taste — a flat, motionless interface would undersell it.

The correction is a real distinction rather than a compromise. `prefers-reduced-motion` in SRS §6.4 is an **OS-level setting** that a small minority deliberately turn on, usually for vestibular disorders. It doesn't mean "default to no animation". It means: build the animated version, and provide a reduced path for people who've asked their operating system for one. In practice that's usually replacing a transition with an instant state change — the interface still does the thing, it just doesn't travel there.

### 0.3 Tap target ≠ big button `[TEAM]`

44×44px is a minimum **touch area**, not a minimum visual size. A 24px icon with 10px padding each side is a 44px target that looks like a 24px icon. Where padding would break the layout, an invisible expanded hit area does the same job.

The failure this rule guards against is small targets crowded together — an 18px close button flush against an 18px share button. Not "make things big".

### 0.4 Search belongs in the header only `[TEAM]`

v0.1 and v0.2 both drew a search field in the homepage body, under the hero, plus the icon in the header. Redundant. **Header only** — the ⌕ icon is the sole entry point on mobile, opening the full-screen overlay. No field in the page body on any screen.

Two things follow, and one is worth watching.

It buys back roughly 76px above the fold on the homepage, which is most of a product card. The carousel now sits directly under the hero and is visible on a 360×780 screen without scrolling.

The cost is discoverability: an icon is less findable than a field. That mostly affects people who arrive already knowing what they want — a smaller group than P1, so the trade is reasonable, and because the header returns on any upward scroll, search is never more than one gesture from anywhere. But it does slightly reduce the volume of `search_logs` and zero-result data, and §8.3 group C calls that the gold mine. Worth checking in the first fortnight rather than assuming it's fine — if query volume looks thin, a single "Tìm gì đó?" prompt inside the empty carousel state would recover some of it without putting a field back.

The feature itself is unchanged: HP-02 stays P0, live suggestions, 250ms debounce, diacritic-insensitive. Only its position moves — worth noting in `DECISIONS.md` since SRS §5.1 places it in the homepage body.

One accessibility consequence: an icon-only control needs an accessible name (`aria-label="Tìm kiếm"`) and a real 44px target, which at a 22px glyph means 11px of padding each side. Desktop is unaffected — its header already carries a full field.

### 0.5 The bottom-tab-bar argument was weak `[TEAM]`

I argued against bottom tabs partly because Hidden Gems (right edge) and ORDER NOW (bottom edge) both claim chrome. They never appear on the same page — Hidden Gems is browse-context, ORDER NOW is product-page. Argument withdrawn.

The recommendation stands on the remaining reason, which was always the stronger one: SEO is the primary growth channel `[SRS D3]`, so most sessions land **deep**. Bottom tabs assume an app-shaped session that starts at home and stays inside. Breadcrumbs plus a top bar serve deep landings better.

---

## 1. 👤 PERSONAS

### P1 — Linh, 24 · "The taste-hunter" · PRIMARY (≈60%)

Marketing exec, District 3. Gen Z 18–30 `[SRS §2]`. iPhone, 90% mobile, one hand. Vietnamese. Arrives via Google, a Threads share, or an Instagram bio link.

**Goal.** Find a gift with actual taste, or something not from a chain store. No product in mind — a *feeling* in mind. `[DERIVED from brand doc: "tìm một món quà thực sự có gu"]`

**Frustration.** Instagram discovery is exhausting: saves posts, loses them, forgets which account sold what.

**What this forces:**
- Browses without a query — category chips are her real navigation → why AP-06 keeps them visible
- Saves 5–10, buys 1, days later → the wishlist is a *return* mechanism
- Won't fill a form, won't make an account → validates D2
- Leaves for Instagram to buy and may not come back → outbound is the end of our funnel, to be measured rather than prevented `[SRS §8]`

**Anti-goal:** not comparison-shopping on price. Price bands are for budget fit, not for finding the cheapest.

### P2 — Daniel, 33 · "The intentional tourist" · SECONDARY (≈25%)

Visitor from Singapore/Australia/EU, four days in HCMC `[SRS §2]`. Phone, roaming, often offline between stops. English. Arrives via Google or a travel blog.

**Goal.** Bring home something that isn't airport-souvenir tat, and spend his days somewhere better than the tourist strip.

**Revised in v0.2:** he is *not* primarily using the map to go and buy from Tí's shops — most have nowhere to go. He uses it to plan an afternoon, and buys online like everyone else. The map earns its place by making the site worth returning to, not by driving retail footfall.

**What this forces:** EN toggle findable in three seconds · stops need address, hours and a working handoff to a real maps app · he's time-boxed, so a route needs distance and stop count before he'll start it · screenshots things, doesn't wishlist.

### P3 — Vy, 27 · "The maker who needs to be seen" · TERTIARY (≈10%)

Two-person ceramics/print brand, ~3k Instagram followers, plateaued.

**Goal.** Reach buyers outside her follower set `[SRS §0]`. And quietly: to be *selected*, because selection is status `[brand doc — Curation]`.

**What this forces:**
- She judges whether to join by looking at **another brand's shop page** → `/shop/[slug]` is a sales page for partners, not just a browse page
- `/hop-tac` leads with the contact action `[TEAM]` — someone who's already decided shouldn't have to read the pitch
- She's now also a **content supplier for the hero**, which raises the stakes on the image spec (§5)
- UTM matters because it's her proof the traffic is real `[SRS §8.4]`

### P4 — Tài, admin · INTERNAL

Team member doing content entry. Laptop only. Every shop, product and image in V1 passes through his hands.

**Changed in v0.2:** the job is no longer copy-paste from a Google Form. It's **reviewing a queue** — approve, request changes, or reject, with a templated email reply and a live preview of the shop page `[TEAM]`. Materially different screen, and a materially different skill: judgement rather than transcription.

**What this forces:** automated asset checks so he isn't opening every file · a real component preview rather than a mock · a third outcome beyond approve/reject (§3, Flow H).

---

## 2. 📝 USER STORIES

### Linh (P1)

| # | Story | SRS |
|---|---|---|
| L1 | As a browser with nothing specific in mind, I want a rotating selection on the homepage, so I can start without typing. | HP-03 |
| L2 | As someone who types without diacritics, I want "tui vai" to find "Túi vải". | HP-02 |
| L3 | As a browser, I want one-tap category filtering while scrolling. | AP-02, AP-06 |
| L4 | As a budget-conscious shopper, I want price bands. | AP-04 |
| L5 | As someone avoiding certain materials, I want to filter by material. | AP-03 |
| L6 | As a shopper hitting zero results, I want to know which filter to loosen, and see alternatives. | AP-07 |
| L7 | As a visual shopper, I want large swipeable images. | PD-01 |
| L8 | As someone who buys days later, I want to save without an account. | PD-06 |
| L9 | As someone ready to buy, I want the shop's own channel reachable from anywhere on the page. | PD-02 |
| L10 | As someone messaging a shop, I want the enquiry pre-written. | PD-03 |
| L11 | As a browser, I want related products so a dead end becomes another option. | PD-07 |
| L12 | ~~Wishlist reachable from every page~~ | **Dropped** `[TEAM]`. It's a drawer, so it's in the header on every page by definition. Nothing to specify. |
| L13 | As someone who just saved something, I want visible confirmation that it saved and where it lives. `[TEAM]` | PD-06 |
| L14 | As a visitor, I want more of the page visible as I read, and the navigation back the moment I want it. `[TEAM]` | — |
| L15 | As someone who wants to search, I want one predictable place to do it, on every page. `[TEAM]` | HP-02 |

### Daniel (P2)

| # | Story | SRS |
|---|---|---|
| D1 | As a non-Vietnamese speaker, I want to switch to English immediately. | §6.3 |
| D2 | As a visitor, I want to browse places by district and see one area at a time. `[TEAM]` | HP-04 |
| D3 | As a phone user, I want the map not to hijack my scroll. | §5.8 |
| D4 | As someone standing on the street, I want a stop to open in my maps app with that exact place queried. `[TEAM confirmed]` | §8.5 |
| D5 | As a time-boxed visitor, I want a route's stop count and distance before I commit. | — |
| D6 | As a discoverer, I want to stumble on things I wasn't looking for. | HP-05 |
| D7 | As a phone user, I want the Hidden Gems panel never to open by itself. | HP-05 |
| D8 | As someone exploring, I want to open one route, close it, and open another without the map getting cluttered. `[TEAM]` | HP-04 |

### Vy (P3)

| # | Story | SRS |
|---|---|---|
| V1 | As a brand owner, I want to see how another brand is presented before applying. | SD-01–03 |
| V2 | As a maker, I want my story shown, not just my products. | SD-02 |
| V3 | As someone who's already decided, I want to contact Tí without reading a pitch first. `[TEAM]` | §5.6 |
| V4 | As a partner, I want Tí's traffic visible in my own analytics. | §8.4 |
| V5 | As a partner, I want my hero image credited and linked back to me. `[DERIVED]` | HP-01 |
| V6 | As an applicant, I want to know what's missing rather than just being rejected. `[TEAM]` | — |

### Tài (P4)

| # | Story | SRS |
|---|---|---|
| A1 | As an admin, I want submissions to arrive in a queue automatically instead of being copied by hand. `[TEAM]` | — |
| A2 | As a reviewer, I want to preview the real shop page with the submitted assets before approving. `[TEAM]` | SD-01 |
| A3 | As a reviewer, I want images auto-flagged when they're too small or the wrong ratio. `[TEAM]` | — |
| A4 | As a reviewer, I want to reply with a templated email without leaving the CMS. `[TEAM]` | — |
| A5 | As an admin, I want to place route pins by clicking a district map. | AD-05 |
| A6 | As an admin, I want to change the carousel rule and Hidden Gems mode without a deploy. | AD-12 |
| A7 | As an admin, I want products ranked by outbound CTR, not views. | §8.3 B |
| A8 | As an admin, I want zero-result searches **and** what those visitors said they wanted. | §8.3 C |

### Cross-cutting

| # | Story | SRS |
|---|---|---|
| X1 | As a keyboard user, I want every control reachable with visible focus. | §6.4 |
| X2 | **Rewritten.** As a visitor, I want motion that gives feedback and makes the interface feel alive — and if I've set reduced-motion in my OS, I want the same functionality without the travel. | §6.4 |
| X3 | **Rewritten.** As a phone user, I want targets that are comfortably hittable and not crowded together — achieved with padding and hit areas, not by inflating buttons. | §6.4 |
| X4 | As someone arriving via a shared filtered link, I want the filters actually applied. | AP-01 |

---

## 3. 🗺️ USER FLOWS

Eight. Flow D rewritten; Flow H new.

### FLOW A — Discovery → outbound ⭐ PRIMARY CONVERSION

```
 ENTRY (SEO · social · direct)
        │
        ▼
 ┌─────────────────────────────────┐
 │  HOMEPAGE  /                    │
 │  hero loop · carousel · map     │
 │  (search = header icon only)    │
 └──┬──────────┬──────────┬────────┘
    │ ⌕ header │ browse   │ gems
    ▼          ▼          ▼
 M2 overlay   /san-pham ◀── filter loop (AP-02…06)
    │           │
    └─────┬─────┘
          ▼
 ┌─────────────────────────────────┐
 │  PRODUCT  /san-pham/[slug]      │
 │  gallery · info                 │
 │  ┌───────────────────────────┐  │
 │  │  ♡  │  ORDER NOW  sticky  │  │ ← always visible [TEAM]
 │  └───────────────────────────┘  │
 └──┬──────────┬──────────┬────────┘
    │ ♡        │ shop     │ ORDER NOW
    ▼          ▼          ▼
 toast ✓   /shop/[slug]  log click_event + UTM   (fire-and-forget)
 + drawer                 │
                          ▼
                copy-message modal (PD-03, optional)
                          │
                          ▼
                 ╔══════════════════╗
                 ║ EXIT → IG/TikTok ║   funnel ends
                 ╚══════════════════╝
```

Three things that make or break this:
1. **ORDER NOW permanently visible** `[TEAM]` — confirmed, and the highest-leverage layout decision on the site, since outbound CTR is what §8.3 group B rests on
2. The event write must not block navigation — `sendBeacon` or equivalent
3. `target="_blank"` means the tab survives; don't show a "you're leaving" interstitial

### FLOW B — Zero-result search ⭐ REVISED

```
type ─▶ debounce 250ms ─▶ ≥2 chars ─▶ query
                                       │
                          ┌────────────┴────────────┐
                     results > 0                results = 0
                          │                          │
                    ≤8 suggestions        ┌──────────────────────────┐
                                          │ EMPTY STATE              │
                                          │ • removable filter chips │
                                          │ • "Bạn đang tìm SẢN PHẨM │
                                          │    gì?"   ← product only │
                                          │ • 4 suggestions          │
                                          └──────────┬───────────────┘
                                                     ▼
                                    write BOTH, privately:
                                      search_logs.query         what they typed
                                      demand_notes.description  what they meant
                                                     ▼
                                    admin dashboard shows them paired
```

**Product only, never the shop name** `[TEAM]`. Asking which shop sells it inverts the site's purpose — the whole point is that the visitor doesn't need to know. Prompt and placeholder both steer toward describing the object.

**Both rows, not one.** They answer different questions. The query says what people typed; the description says what they meant. "nến thơm" alone doesn't tell you soy-wax, unscented or gift-boxed — and that difference is what determines which shop you go and recruit. Private, never displayed.

`[OPEN]` One legal check: free text is user-submitted. Private and unattributed so exposure is low, but the retention period should be written into `/bao-mat` rather than left implicit `[SRS §9]`.

### FLOW C — Filter & browse on mobile

Unchanged. Category chips always visible (one tap); material, price and sort in a bottom sheet with a batched "Áp dụng"; URL updates so the result is shareable and indexable. Chrome does **not** auto-hide while the sheet is open.

### FLOW D — Map discovery ⭐ REWRITTEN

```
 HOMEPAGE section  ──or──  /kham-pha
        │
        ▼  map_district_view
 ┌──────────────────────────────────────────┐
 │  DISTRICT CAROUSEL                       │
 │  ‹ Quận 1 ›      swipe or arrows         │
 │  ┌────────────────────────────────────┐  │
 │  │  district map image                │  │
 │  │   ○      ○         ○               │  │ ← scattered start points
 │  │        ○     ○                     │  │
 │  └────────────────────────────────────┘  │
 │  + text list of start points below       │ ← a11y + SEO + fallback
 └──────────────────┬───────────────────────┘
                    │ tap a start point → route_open
                    ▼
 ┌──────────────────────────────────────────┐
 │  ROUTE OPEN                              │
 │  ①──②──③──④   polyline, others faded     │
 │  name · 4 stops · ~1.8 km                │
 │  ordered stop list beneath               │
 │  tap ① again → close                     │
 │  open another → the first closes         │
 └──────────────────┬───────────────────────┘
                    │ tap a stop → route_stop_click
                    ▼
 ┌──────────────────────────────────────────┐
 │  STOP SHEET                              │
 │  name · type · hours · address           │
 │  [ Mở bản đồ ↗ ]   [ Chia sẻ ]           │
 │  [ Xem shop trên Tí ✦ ]  only if it is   │
 │  ‹ stop 1     2/4     stop 3 ›           │
 └──────────────────┬───────────────────────┘
                    ▼ route_stop_external
              Google Maps, queried by name + address
```

**Why the district split makes this work on mobile.** SRS §5.8 rejected a tappable map because a city-wide view puts pins at ~8px, under the 44px minimum, and because zooming enough to hit one destroys the overview. One district at 336px is roughly a 3× zoom — pins reach a usable size while the whole area stays visible. The objection is resolved by the concept rather than worked around. Worth recording in `DECISIONS.md`, because §5.8 currently reads as if tappable maps were rejected outright.

**Mở bản đồ** opens Google Maps with the place name plus full address as the query, not raw coordinates `[TEAM]`. A name resolves to the business card with hours and reviews; coordinates drop a bare pin.

`[OPEN]` **Schema implications for Lộc.** The SRS models a flat `routes` + `route_stops` pair with percentage coordinates. This concept needs three things it doesn't have: a **district** to group maps by, with one background image each; a **start point** per route, where several routes can share one start; and a **place** record independent of any shop, since most stops aren't shops. Percentage coordinates still work but are now relative to a district image — so the pin editor (AD-05) needs a district selector.

`[OPEN]` **Analytics implications.** §8.5's funnel assumed a single route everyone sees. Now a route is opened deliberately, so the useful sequence is `map_district_view → route_open → route_stop_click → route_stop_external`, and drop-off is measured *within* an opened route. Which districts get swiped to is itself a signal.

### FLOW E — Wishlist (revised)

```
 tap ♡ ─▶ write localStorage ─▶ ✓ green tick toast, ~3s
                                 "Đã lưu vào Wishlist
                                  Lưu trên thiết bị này"    [Xem]
                                        │
 header ♡ ─────────────────────────────▶ DRAWER   (no page — IA-4)
                                        │
                        first open ─▶ informational card, dismissible:
                        "Danh sách lưu trên thiết bị này.
                         Sắp tới sẽ có tài khoản để đồng bộ."
                                        │
                        empty ─▶ "Chưa lưu gì cả" + [Khám phá sản phẩm]
```

Informational, not cautionary `[TEAM]`. No alarm icon, no "you will lose this". State where the list lives and what's coming. Show once on first open; don't repeat every session.

### FLOW F — Partner acquisition (revised)

```
 nav/footer "Hợp tác" ─▶ /hop-tac
                            │
              ┌─────────────┴──────────────┐
              │ [ Liên hệ với Tí ]   ← first, above the fold
              │ what you get               │
              │ what Tí looks for          │
              │ example shop page ─────────┼─▶ /shop/[slug]
              └─────────────┬──────────────┘
                            ▼
                   Google Form → Sheets → Flow H
```

Contact first `[TEAM]`. The example shop sits at the bottom as proof, and is **temporary by design**: once `/shop` has enough brands it can go, since the index does the job better. Note it in `DECISIONS.md` so it's removed deliberately rather than forgotten.

### FLOW G — Admin publishes a product

Unchanged: login + 2FA → create → drag-drop images (≤8), set cover → category, materials, price, story → save hidden → preview → toggle visible → `audit_logs`.

### FLOW H — Shop intake & approval ⭐ NEW `[TEAM]`

```
 Vy fills Google Form
        │
        ▼
 Google Sheets row
        │
        ▼  automatic sync
 ┌──────────────────────────────────────────┐
 │  ADMIN QUEUE  /admin/duyet               │
 │  pending list · newest first             │
 │        │                                 │
 │        ▼                                 │
 │  submission detail                       │
 │   • live preview of the shop page,       │
 │     mobile + desktop, real component     │
 │   • submitted images, auto-flagged for   │
 │     size and aspect ratio                │
 │        │                                 │
 │   ┌────┴───────┬──────────────┐          │
 │   ▼            ▼              ▼          │
 │ DUYỆT       CẦN SỬA        TỪ CHỐI       │
 │   │            │              │          │
 │   │       email: what's    email:        │
 │   │       missing; stays   reason;       │
 │   │       in queue         archived      │
 │   ▼                                      │
 │ creates shop record (hidden)             │
 │ + templated approval email               │
 └──────────────────┬───────────────────────┘
                    ▼
 admin adds products (Flow G) → toggle visible → live
```

**Three outcomes, not two.** "Cần sửa" is the one that matters in practice: most submissions won't be rejected, they'll be missing an image or a story. A binary forces you to either publish something weak or turn away a willing partner.

`[OPEN]` **Scope warning, and it's a real one.** SRS §1 lists a moderation pipeline (Pending / Approved / Rejected) under **V2, gated on legal advice**. What's described here *is* that pipeline.

The legal part is fine: the concern behind that gating was shop **accounts** and self-upload. Neither exists here — submissions arrive by form, a human decides — so classification risk stays exactly where D1 put it.

The build cost is the problem. A Sheets sync, a queue UI, an asset checker, an email template system and a three-state machine are not in the V1 estimate, against a 31/08 launch with one beginner developer `[SRS §0.2]`. My recommendation: **ship the queue reading from Sheets plus the approve action; leave templated email as a manual send until September.** That captures the actual point — no more copy-paste — and defers the fiddliest part. Decide this explicitly rather than discovering it on the 28th.

---

## 4. 🗂️ INFORMATION ARCHITECTURE

### 4.1 Sitemap

```
/                              Homepage
/san-pham                      All products
  /san-pham/[slug]             Product
/shop                          All shops        ✔ IA-2 in for V1
  /shop/[slug]                 Shop
/kham-pha                      Map              ✔ IA-1 both: homepage section + page
  ?quan=[slug]                 District state
/blog                          Blog index
  /blog/chu-de/[slug]          Topic archive    ✔ IA-3 real URLs
  /blog/[slug]                 Post
/gioi-thieu · /faq · /hop-tac  About cluster
/dieu-khoan · /bao-mat         Legal (footer)
♡ drawer                       Wishlist         ✔ IA-4 drawer only, no page
/404 · /500
/admin                         noindex · queue · CRUD × 6 · analytics
```

### 4.2 Navigation

**Primary (5):** Sản phẩm · Shop · Khám phá · Blog · Về Tí
**Utilities:** search · wishlist (count) · VI/EN

**Search is a header utility and nothing else** `[TEAM]`. No field in any page body — mobile gets the ⌕ icon opening a full-screen overlay, desktop gets an inline field in the bar. See §0.4.

**Mobile: sticky top bar that hides on scroll-down and returns on scroll-up** `[TEAM]`, plus a drawer menu. Not bottom tabs — see §0.5.

**Scroll behaviour** `[TEAM]`, since it now governs every screen:

| State | Chrome |
|---|---|
| Idle / scrolling up | Header + category chips visible |
| Scrolling down | Both translate off-screen together |
| Bottom of page | Content sheet slides up over a full-viewport footer |

Header and chips move **as one block**. Splitting them turns one gesture into two reveals, which reads as jitter.

Four guards, or this becomes a bug report:
- Never hide while a filter sheet, drawer or modal is open
- Reveal immediately if a keyboard user tabs to a hidden control
- Ignore scrolls under ~8px so a thumb tremor doesn't flicker the bar
- Under `prefers-reduced-motion`, snap instead of easing — it still hides, it just doesn't travel

**Reveal footer** `[TEAM, per reference video]`. A fixed full-viewport underlay; content scrolls over it. Because it now has real room it should carry the whole sitemap — it's the only reliable surface for `/hop-tac` and `/faq`.

`[OPEN]` Three implementation notes: the content sheet needs an opaque background or the footer shows through mid-scroll; it needs `margin-bottom` equal to the footer height or the last row is unreachable; and use `100dvh` not `100vh`, or iOS Safari's address bar makes the footer taller than the visible area. On the product page the footer and the sticky ORDER NOW bar share a corner — ORDER NOW stays on top, and that corner should be checked on a real device before it's locked.

**Breadcrumbs** on product, shop and blog detail. `BreadcrumbList` JSON-LD is required `[SRS §6.2]` and structured data that doesn't match visible content is a penalty risk, so the visible breadcrumb isn't optional.

### 4.3 Categories `[TEAM]` — resolved

Thời trang · Sản phẩm sáng tạo · Văn phòng phẩm · Quà tặng · Nhà cửa · Body care · Giải trí

Two are long enough to matter. "Sản phẩm sáng tạo" and "Văn phòng phẩm" run roughly 130px and 105px as chips, so at 360px only about two and a half fit. Correct behaviour for a scroll strip — but it makes the first two positions valuable.

`[OPEN]` Order chips by catalogue volume rather than alphabetically, once entry is done.

### 4.4 IA decisions — all closed

| # | Question | Answer |
|---|---|---|
| IA-1 | Map: homepage section or own page? | **Both** |
| IA-2 | `/shop` index in V1? | **Yes** |
| IA-3 | Blog topics: chips or URLs? | **Real URLs** |
| IA-4 | Wishlist: page or drawer? | **Drawer only** |
| IA-5 | The 7 categories | **Resolved** — see 4.3 |
| IA-6 | Nav label for the map | `Khám phá` |

---

## 5. HERO IMAGE SPEC `[TEAM]` — new, and time-sensitive

The hero is a looped sequence: Tí Coolture's own image first, then shop-submitted images. Shops send them to get their brand on the front of the site.

This is the most time-sensitive open item in the document, because **shops need the brief before they start sending files**, and re-collecting images from a dozen partners later is expensive and damages goodwill.

**(a) One canonical ratio.** Portrait **4:5** works at both ends — mobile shows it whole, desktop centre-crops to a wide band. Asking for two crops gives more control but doubles the ask on every shop, and shops are doing this as a favour.

**(b) A safe zone.** Nothing meaningful within ~15% of the top or bottom edge, or desktop cropping will decapitate it.

**(c) A quality floor.** Suggest ≥1600×2000, sRGB, and **no text baked into the image** — it can't be translated for the EN build, and it won't survive cropping.

`[OPEN]` **Attribution.** The wireframe shows a credit pill naming the shop and linking to them. That's a real incentive for shops to send good images, and it gives the slot a measurable outcome instead of being decoration. Not in the SRS — needs a yes/no.

**Technical, for Lộc:** only frame ① loads eagerly, the rest lazily, or the loop wrecks HP-01's LCP < 2.5s target. Pause under `prefers-reduced-motion`. If a cycle runs faster than 5s, WCAG expects a visible pause control.

---

## 6. STILL OPEN

1. **Hero image spec** — ratio, resolution, safe zone, credit link. Blocks the brief to shops. §5.
2. **Price band boundaries in VNĐ.** AP-04 says five bands; nobody has written the numbers.
3. **Districts and map assets** — how many, which ones, who sources each image. Appendix A question 4 since SRS v1.0, and now it blocks a headline feature.
4. **Admin intake scope for V1** — full pipeline, or queue + approve now and templated email in September. Flow H.
5. **Route/place schema** — district grouping, start points, shop-independent places. Flow D.
6. **Category chip order** on mobile.
7. **Retention wording** for demand-note free text in `/bao-mat`. Flow B.
8. **Route analytics events** — replace §8.5's funnel with the opened-route version.
9. **Search volume after launch** — if header-only search suppresses query volume, §8.3 group C thins out. Check at two weeks. §0.4.

---

## 7. GIVEN VS. INFERRED

**From the SRS / brand doc:** every requirement ID and acceptance criterion · the mobile filter pattern · Hidden Gems behaviour and its measurement plan · the analytics groups · all URL paths · the actor model · the audience band · "discovery not transaction".

**From the team, 18/08:** search as a header-only utility · the map's purpose and the district-carousel concept · the hero loop · header and chip auto-hide · the reveal footer · wishlist as drawer with a green-tick toast · product-only demand capture · the Sheets → queue → email admin pipeline · all six IA answers · the 7 categories · contact-first on `/hop-tac` · the corrections in §0.

**Still mine, and therefore still worth challenging:** the four persona narratives · story phrasing · the flow diagrams · nav labels and breadcrumb trails · the hero spec numbers in §5 · the three-outcome review state · the schema and analytics implications in Flow D · the V1 scope recommendation in Flow H.

Personas remain inference-based, not research-based. Validate them before they harden into assumptions.
