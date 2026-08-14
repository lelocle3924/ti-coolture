# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

**Current (interim):** React 19 + Vite 6 + Tailwind 4, frontend only. `npm run dev` runs plain Vite on port 5173. There is no database and no backend: Firebase (Firestore/Auth/Storage) and the Express server were deleted on 2026-08-14.

**Target (per `docs/SRS.md` §3.1):** Next.js 15 App Router + TypeScript · Supabase (PostgreSQL) · Cloudflare R2 for images · Vercel hosting · Resend for mail · Sentry. The current React/Vite app is a staging ground for that migration, not the destination.

Data is served from `src/lib/mock/` — placeholder content shaped like the SRS Postgres schema — through the single adapter at `src/lib/dbService.ts`. That adapter is the seam the Supabase client replaces.

`mockup-mobile.html` and `mockup-desktop.html` at the project root are **visual specification artifacts**, not the site. They are the reference the React views are built against. The brand foundation lives in `src/index.css` (tokens + self-hosted `@font-face`); fonts are in `fonts/`.

## Users

**Primary — the visitor.** Vietnamese Gen Z, 18–28, plus foreign visitors to Ho Chi Minh City, looking for a gift or object "with real taste" (`có gu`). They are design-literate, live on Instagram, and recognise a template instantly. They arrive to discover, not to transact.

**Present but out of scope for this build:** shop owners (who submit and manage their listings) and admins (who approve or reject shops and products). Both exist in the product's full requirements and in the prior implementation's role model (`User | Shop | Admin`), but this build ships the public visitor catalogue only.

## Product Purpose

Tí Coolture is a **curated catalogue** that gathers, selects, and tells the stories of Vietnamese local brands and artists — so that small creative names get discovered by more people, and so that visitors can find genuinely good work without hunting across scattered Instagram accounts and marketplaces.

It is not a marketplace. There is no cart, no checkout, no "Buy" button. A successful session ends with the visitor clicking through to a brand's own Instagram / TikTok, or copying a prepared message to send the shop. Success is measured by discovery and handoff, not by orders.

## Positioning

Curation is the mechanism: appearing on Tí Coolture is meant to read as a signal of taste, quality, and trustworthiness within the creative community. A neighbouring product could copy a product grid; it could not truthfully copy "we selected these, and we don't sell anything."

The stated ambition is a "universe of local creativity" — the first place someone thinks of when looking for inspiration, a new local brand, an interesting artist, or a gift with taste. Four core values carry that: Creativity, Curation, Connection, Community.

## Operating Context

- Discovery happens on phones, mid-scroll, often between Instagram sessions. Mobile is the real usage scene, not a secondary breakpoint.
- The city itself is part of the product: Ho Chi Minh City neighbourhoods (Chợ Lớn, Thủ Đức, Quận 1) anchor the "city routes" feature — walkable multi-stop discovery itineraries.
- Handoff to the shop is manual by design: the visitor copies a pre-written message and pastes it into the shop's Instagram. Tí Coolture never sits in the middle of the transaction.
- Content is editorial: a journal of long-form pieces about makers sits alongside the catalogue.

## Capabilities and Constraints

**In scope for this build (public catalogue):**
- Homepage
- Product listing with narrowing (filters, sort, search with suggestion dropdown)
- Product detail, ending in the message-the-shop handoff and social links
- Shop pages
- Explore / city routes with numbered stops on a map (static, non-pannable on mobile)
- Journal listing
- "Hidden Gems" — an editor's-pick surface reachable from a persistent right-edge tab
- Saved / wishlist
- Empty, error, loading, and 404 states
- Language switch VI | EN

**Explicitly not built:** cart, checkout, payment, order handling, shop dashboard, admin moderation, authentication.

**Language:** Vietnamese is primary. The VI|EN switch is functional; EN ships where `docs/03-CONTENT-PACK.md` provides it (nav, hero, section labels, buttons, price note, disclaimer) and falls back to VI elsewhere. **Open item:** full EN body content is not written yet.

**Mandatory copy that must appear wherever it applies:**
- Price note, everywhere a price is shown: prices are reference only, updated 08/2026, final price is set by the shop.
- Disclaimer, on every product page: Tí Coolture does not sell and does not process transactions; all exchanges happen directly between the visitor and the brand.

**Terminology:** "Tạp chí" (journal), not "Blog". "Tí" is the brand's own word for the sliver of individual character every maker carries.

## Brand Commitments

- **Name:** Tí Coolture. Contact address on record: hello@ticoolture.vn.
- **Logo system:** a boat cutting through waves; the fingerprint marks a unique imprint; the boat's eye is vision. Source assets live in `src/assets/brand/` — `logo-full-color.svg`, `logo-green.svg`, `logo-purple.svg`, `logo-monochrome.svg`, plus the supporting marks `brand-wave-bottom.svg`, `brand-ribbon-loop.svg`, `brand-arc-top-right.svg`. In the app they are inlined as recolourable React components (`src/components/Brandmark.tsx`, `src/components/BrandShapes.tsx`) so one path set serves violet, white and ink grounds.
- **Brand guidelines:** `docs/BRAND-GUIDELINES-TÍ-COOLTURE.pdf` (authoritative, includes the 60% white / 30% violet / 10% teal ratio).
- **Binding art direction:** `docs/01-ART-DIRECTION-BRIEF.md` v1.0 (2026-08-10) is a pinned brief — palette, typography, layout stance, the single wave signature element, motion budget, and an explicit anti-brief. Treat it as the visual authority for this project; do not redirect it toward a different taste.
- **Voice:** natural Vietnamese, not translated-from-English. Short sentences, active verbs. Button labels stay identical across a flow ("Lưu" → "Đã lưu"). Empty states are invitations, never apologies. Reference table in `docs/01-ART-DIRECTION-BRIEF.md` §9.
- **Three adjectives the work must earn:** sắc sảo (sharp-edited), thủ công (handmade), đang chuyển động (in motion).

## Evidence on Hand

- **Real:** brand story, core values, vision, mission (`docs/TÍ COOLTURE key values.txt`); the full logo and graphic system; brand guidelines PDF; interface copy in VI and partial EN (`docs/03-CONTENT-PACK.md` Part A); image specs (Part C); requirements documents `docs/Reqs.pdf` and `docs/SRS Revised.pdf`.
- **Not real — must not ship:** every shop name, product name, price, city route, and Hidden Gems quote in `docs/03-CONTENT-PACK.md` Part B is invented placeholder material. **User decision (2026-08-14, superseding 2026-08-12):** this invented data is now loaded as the app's development dataset, in `src/lib/mock/seed.ts`, so the UI can be built against realistic content. It remains invented and must be replaced with real shops before any public demo. Product imagery stays as labelled placeholder blocks — no stock photography.
- **Absent — never fabricate:** real partner shops, real artists, testimonials, user counts, press, awards, photography. No stock photography either; per the brief, an unfilled image slot is a solid `--paper-warm` block carrying its ratio label (e.g. `ẢNH SẢN PHẨM 1:1`).

## Product Principles

1. **Curated, not comprehensive.** Fewer things, chosen well. Volume is the marketplace's argument, not ours.
2. **The site ends at the brand's doorstep.** Every path terminates in a handoff to the maker — never in a transaction we pretend to own.
3. **Editorial over commercial.** It should read as an art magazine that happens to give directions, not as a storefront.
4. **Handmade must look handmade.** The design carries a maker's fingerprint; anything that looks mould-pressed contradicts the product it presents.
5. **Say what is true, including the limits.** Reference prices, no transactions, no invented brands — stated plainly, in the interface, not buried.

## Accessibility & Inclusion

- Vietnamese diacritics must render correctly in every typeface used, at every weight — verify before committing to a display font.
- Teal is a surface and ornament colour only; it never carries text. The darker `teal-ink` step is the only teal permitted for reading.
- The curved-baseline treatment permitted for section labels requires a matching `aria-label` so screen readers get the plain string.
- Motion respects `prefers-reduced-motion`: the wave drift and all scroll-triggered movement stop entirely.
