# Feature Specification: Admin Performance & Conversion Dashboard

**Feature Branch**: `001-admin-performance-dashboard`

**Created**: 2026-11-11

**Status**: Draft

**Input**: User description: "implement tính năng dashboard dành cho admin để tracking performance của website trong việc quảng bá sản phẩm và các shop đến người dùng, đồng thời đo lường conversion rate của funnel hiện tại."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - High-Level Website Traffic & Audience Growth (Priority: P1)

As an administrator, I want to track overall website traffic (total visitors, total page views, new vs. returning visitors, device breakdown, and traffic acquisition channels) across selected date ranges so that the team can evaluate audience acquisition and marketing reach.

**Why this priority**: Core baseline requirement. Without overall traffic visibility, performance trends and conversion benchmarks cannot be calculated.

**Independent Test**: Can be tested independently by simulating visits across different devices and referrers, then verifying aggregate counts and percentage breakdowns on the dashboard cards and charts.

**Acceptance Scenarios**:

1. **Given** an admin viewing the dashboard with a selected date range (e.g., Last 30 Days), **When** traffic data loads, **Then** the dashboard displays total visitors, total page views, comparative growth percentages vs. the previous period, and a time-series chart of daily visits split into new vs. returning visitors.
2. **Given** visitors accessing the site from mobile, desktop, or tablet devices, **When** the admin reviews the device widget, **Then** the platform displays the proportion of traffic by device type (e.g., 72% Mobile, 26% Desktop, 2% Tablet).
3. **Given** traffic originating from various marketing channels, **When** the admin views the acquisition widget, **Then** traffic is grouped into primary channels (Organic Search, Social Media, Direct, Referral, Other) with percentage shares.

---

### User Story 2 - Product Discovery & Shop Promotion Effectiveness (Priority: P1)

As an administrator, I want to monitor which products and shops receive the highest user interest (views, favorites, and profile clicks) along with trending categories and search queries so that the curation team can identify high-performing partners and spotlight emerging trends.

**Why this priority**: Directly serves Tí Coolture's mission to promote Vietnamese local shops and creative products. Curation decisions depend on these rankings.

**Independent Test**: Can be tested independently by recording views and favorites on individual product and shop pages, then confirming that the top 10 leaderboards and category distributions accurately update.

**Acceptance Scenarios**:

1. **Given** products being viewed and favorited by visitors, **When** the admin opens the Product Performance section, **Then** the dashboard displays the Top 10 Most Viewed Products and Top 10 Most Favorited Products with product title, shop name, and view/favorite counts.
2. **Given** visitors browsing shop showcases, **When** the admin opens the Shop Performance section, **Then** the dashboard displays the Top 10 Most Clicked Shops ranked by visit count.
3. **Given** visitors searching for keywords or filtering by category, **When** the admin reviews discovery metrics, **Then** the system displays the top search keywords with query frequencies and the percentage share of interest by category (e.g., Fashion, Accessories, Cosmetics, Lifestyle).

---

### User Story 3 - Full-Funnel Conversion Rate Measurement (Priority: P1)

As an administrator, I want to visualize the end-to-end promotional conversion funnel from initial visit to outbound shop referral so that I can quantify how effectively the platform converts traffic into tangible interest and leads for local shops.

**Why this priority**: Crucial business metric requested by stakeholders. Proves platform ROI and partnership value to participating shops.

**Independent Test**: Can be tested independently by following a user journey from landing -> category browse -> product detail -> clicking an outbound contact/purchase link (Instagram, Shopee, Zalo, Website), then verifying that each stage and the overall conversion rate calculate accurately.

**Acceptance Scenarios**:

1. **Given** recorded user sessions across the platform, **When** the admin inspects the Funnel widget, **Then** the system visualizes the 5 sequential stages: (1) Total Visitors, (2) Catalog/Discovery Browsers, (3) Product/Shop Viewers, (4) Wishlist/Favoriters, and (5) Outbound Referrals to Shop Channels.
2. **Given** the funnel stages, **When** viewing stage transitions, **Then** the system calculates step-by-step drop-off percentages and overall end-to-end conversion rate (Outbound Referrals / Total Visitors).
3. **Given** clicks on outbound shop channels, **When** the admin drills into referral channels, **Then** the dashboard breaks down outbound conversions by platform (Instagram, Shopee, Zalo, TikTok, Shop Website).

---

### User Story 4 - Shop Directory & Product Catalog Growth Statistics (Priority: P2)

As an administrator, I want to see macro catalog health indicators including total registered shops (approved vs. pending review), total listed products, and new products added in the timeframe so that the onboarding team can track supply growth.

**Why this priority**: Provides clear operational visibility into platform supply and onboarding pipeline health alongside consumer demand.

**Independent Test**: Can be tested independently by approving new shops and publishing products in a specific period, then verifying the counts update in the summary cards.

**Acceptance Scenarios**:

1. **Given** shops in both active and pending review states, **When** the admin views the Shop & Product Statistics summary, **Then** the system shows Total Registered Shops with explicit breakdown between approved active shops and pending applications.
2. **Given** new products published within the chosen filter date range, **When** the admin filters by that period, **Then** the system displays the exact count of new products added during that specific timeframe.

---

### User Story 5 - Privacy-Preserving Analytics & Policy Synchronization (Priority: P2)

As an administrator, I want tracking to operate anonymously without capturing personal identifiable information (PII) or IP addresses, and ensure public privacy policies accurately describe aggregated count mechanisms.

**Why this priority**: Ensures legal compliance, user trust, and friction-free experience without annoying cookie consent popups.

**Independent Test**: Can be tested independently by auditing network payloads and browser storage during tracking events, verifying zero transmission of personal identifiers, and inspecting updated Privacy Policy documentation.

**Acceptance Scenarios**:

1. **Given** a first-time visitor on the website, **When** the browser logs the visit, **Then** an anonymous client-side indicator is stored locally to distinguish returning visits without collecting IP addresses or personal IDs.
2. **Given** a visitor adding or removing a product from favorites, **When** the event is recorded, **Then** only an anonymous counter (+1 or -1) is transmitted without identifying user identity.
3. **Given** the public Privacy Policy, **When** users review data collection practices, **Then** clear language confirms that favorites and visitor metrics are aggregated anonymously without personal profiling.

---

### Edge Cases

- **Storage Reset or Incognito Mode**: When visitors clear browser storage or browse in private mode, they are counted as new visitors. The dashboard must document that new vs. returning counts represent statistical estimates.
- **Zero Traffic or Cold Start**: When viewing dates with zero recorded activity, charts and metric cards must display clean zero states without visual glitches or division-by-zero errors.
- **Negative Counter Prevention**: If a user unfavorites a product that was favorited before tracking started or multiple times, aggregate favorite counts must never drop below zero.
- **Rapid Refresh or Bot Spikes**: Automated crawler visits or repeated reloads within a short window must be throttled or filtered from inflating visitor and view metrics.
- **Incomplete Prior Period Comparison**: When comparing against a preceding timeframe where historical data does not exist, the growth percentage must display a neutral indicator (e.g., "N/A") rather than misleading figures.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an administrative dashboard view accessible only to authorized administrators.
- **FR-002**: System MUST allow filtering all dashboard metrics by standard date ranges (Today, Last 7 Days, Last 30 Days, Current Month) and custom date intervals.
- **FR-003**: System MUST display top-level KPI cards for Total Visitors, Total Page Views, Active Participating Shops, and Listed Products, including comparative percentage changes against the preceding period.
- **FR-004**: System MUST display a time-series line chart tracking daily visits, with separate trendlines for New Visitors and Returning Visitors.
- **FR-005**: System MUST display audience composition by device category (Mobile, Desktop, Tablet) and traffic acquisition source (Organic Search, Social Media, Direct, Referral, Other).
- **FR-006**: System MUST present ranked leaderboards (Top 10) for Most Viewed Products, Most Favorited Products, and Most Clicked Shops, each showing rank, item name, shop name, and interaction volume.
- **FR-007**: System MUST provide a "View All" navigation link or modal expansion for each leaderboard to inspect beyond the top 10 items.
- **FR-008**: System MUST display category interest distribution showing the percentage of views and interactions per product category.
- **FR-009**: System MUST display the top search keywords entered by visitors with search frequencies and volume trends.
- **FR-010**: System MUST track and visualize the 5-stage conversion funnel:
  1. Stage 1: Website Visitors (Total Sessions/Visitors)
  2. Stage 2: Catalog Discovery (Visitors who browsed product or shop catalog pages)
  3. Stage 3: High-Intent Consideration (Visitors who viewed specific product details or shop profiles)
  4. Stage 4: Wishlist Engagement (Visitors who saved items to favorites)
  5. Stage 5: Outbound Conversion (Visitors who clicked outbound links to contact or buy from a shop)
- **FR-011**: System MUST compute and display the conversion rate for each sequential funnel step as well as the overall conversion rate (Outbound Referrals / Total Visitors).
- **FR-012**: System MUST break down Outbound Conversions by target channel (Shopee, Instagram, Zalo, TikTok, Shop Website).
- **FR-013**: System MUST track Total Registered Shops with clear separation between Approved/Active Shops and Pending Review Applications.
- **FR-014**: System MUST calculate New Products Added dynamically based on the selected date window.
- **FR-015**: System MUST collect visitor and interaction metrics anonymously without recording IP addresses, device serials, or user personal profiles.
- **FR-016**: System MUST synchronize the public Privacy Policy documentation to clearly explain anonymous visitor counting and aggregate favorite counters.
- **FR-017**: All system text, metrics labels, and documentation MUST strictly use the entity term "shop" and NEVER use forbidden historical terms.

### Key Entities

- **TrafficSummaryMetric**: Aggregated traffic record for a given calendar day (total page views, estimated unique visitors, new visitors count, returning visitors count, mobile count, desktop count, tablet count, and traffic source counts).
- **ProductPerformanceRecord**: Performance aggregates associated with an individual product (total view count, current favorite count, and historical view count within a date window).
- **ShopPerformanceRecord**: Performance aggregates associated with an individual shop (total profile view count, outbound click-through count, active listed product count, and onboarding status).
- **OutboundConversionEvent**: Aggregated count of outbound click referrals attributed to specific shop contact/commerce channels (channel name, product context, and timestamp/day).
- **SearchKeywordMetric**: Aggregated search term frequency recorded when users query the catalog (keyword string, query count, and timestamp/day).
- **FunnelStageSnapshot**: Calculated metrics for each conversion funnel stage within a selected date window (stage name, order index, total volume, drop-off count, drop-off rate, and conversion rate).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Dashboard loads the complete analytics overview for any 30-day date range in under 2 seconds.
- **SC-002**: The 5-stage conversion funnel clearly reports conversion rates and stage drop-offs with 100% mathematical consistency (Stage N <= Stage N-1).
- **SC-003**: 100% of tracking data collection functions without storing IP addresses or personal identifiable information, eliminating the need for intrusive cookie consent banners.
- **SC-004**: Administrators can switch between preset date filters (Today, 7D, 30D, Month) and observe updated metrics within 1 second.
- **SC-005**: All top 10 leaderboards (Products, Favorites, Shops, Categories, Keywords) accurately reflect aggregated interaction data matching the selected date filter.
- **SC-006**: Zero occurrences of forbidden entity terminology across the dashboard interface, code symbols, and documentation (strictly enforcing "shop").

## Assumptions

- Target users of this dashboard are internal Tí Coolture team members with administrative privileges; shop-facing analytics will be isolated in a future phase.
- Visitor counting relies on a lightweight client-side storage indicator (`localStorage`) to distinguish new vs. returning visitors without privacy invasion; minor discrepancies caused by browser storage resets or private browsing are acceptable for business macro-trending.
- Outbound clicks (to Instagram, Shopee, Zalo, TikTok, or shop websites) serve as the terminal conversion goal for Tí Coolture, as actual purchases are fulfilled off-platform by the respective shops.
- Existing administrative authentication and role validation mechanisms are leveraged to gate dashboard access.
- Aggregated metrics are pre-calculated or indexed so that dashboard retrieval does not perform heavy unbounded database scans on every page load.
