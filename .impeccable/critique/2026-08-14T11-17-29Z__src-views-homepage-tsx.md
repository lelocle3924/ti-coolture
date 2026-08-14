---
target: Homepage + Header/Footer shell
total_score: 20
max_score: 36
na_heuristics: 10
p0_count: 1
p1_count: 4
timestamp: 2026-08-14T11-17-29Z
slug: src-views-homepage-tsx
---
Method: dual-agent (A: afe3636bf81629e37 · B: aa9ed21b36e8e2e58)

Target: Homepage + persistent chrome — `src/views/Homepage.tsx`, `src/components/Header.tsx`, `src/components/Footer.tsx`. Mode: **Persuade**. Live inspection at `http://localhost:5173/`, desktop 1440×900 and mobile 390×844.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | FilmStrip has skeleton + error + retry; routes and collections have neither, and selecting a route never displays its name. |
| 2 | Match System / Real World | 3 | Voice is genuinely natural Vietnamese, but the primary CTA ships "Khám phá ngay" — listed by name in the brief's don't-write column. |
| 3 | User Control and Freedom | 3 | Pause/play + drag-scrub on the strip is real control (WCAG 2.2.2 honoured); the pulsing gem star can't be dismissed, and `App.tsx:123` silently redirects every unknown URL home. |
| 4 | Consistency and Standards | 2 | Three different numbered-circle systems within 300px meaning three different things; radius runs 2 → 6 → 8 → 16 → 9999px on one page. |
| 5 | Error Prevention | 2 | The gem card prints a price with no mandatory price-reference note; heart and account icons route to `/auth-gateway`, a surface PRODUCT.md declares not built. |
| 6 | Recognition Rather Than Recall | 1 | Routes are chosen by bare digits `1 2 3`; the names exist only in a `title` attribute (`Homepage.tsx:223`). |
| 7 | Flexibility and Efficiency | 2 | Not n/a — an accelerator layer genuinely exists: recent searches persist (`Header.tsx:29`) but only in `sessionStorage`, and the wishlist accelerator dead-ends at a login wall. |
| 8 | Aesthetic and Minimalist Design | 2 | The page's largest surface — ~1,000px of collections grid — is four identical grey rectangles plus a featured card with ~200px of empty violet inside its own border. |
| 9 | Error Recovery | 3 | Load-error copy matches the content pack verbatim with working retry (`Homepage.tsx:136-146`); `fetchCollections()` has no error branch, so failure renders a heading over nothing. |
| 10 | Help and Documentation | n/a | Persuade surface with no documentation surface; the one thing needing explanation (Tí doesn't sell) is already in the hero subline. |
| **Total** | | **20/36** | **Acceptable (56%)** — significant improvements needed |

Heuristic 10 scored `n/a`; the applicable maximum is 36.

**Cognitive load: 6 of 8 failures → CRITICAL.** Failed: single focus (four sections of equal weight plus a permanently pulsing star), grouping (three identical numbered-circle treatments within 300px, two of them duplicate controls for the same action), visual hierarchy (the optically largest element on the page is a grey placeholder, and the hero caps at 56px against the brief's 112px), one-thing-at-a-time (strip crawls at 34px/s while the star pulses at 2.4s, permanently and simultaneously), minimal choices (**every** decision point exceeds 4 — header desktop 9 controls, route section 13, footer 9; ~35 interactive elements page-total), and working memory (route identity carried only by a digit, absent from UI and URL). Passed: chunking and progressive disclosure.

## Design Specificity Verdict

**Partially authored, with a generic spine.** Three elements could not be lifted into another product; almost everything between them could.

**LLM assessment.** The fingerprint is real and it lives in exactly three places: the **film strip** (`FilmStrip.tsx`), the **wave-as-negative-space horizon** (`BrandShapes.tsx:47` — the fill is the colour of the *next* section, so white cuts into violet rather than being drawn on it), and the **labelled placeholder blocks** (`seed.ts:19`, printing their exact ratio spec instead of faking photography). Those three are the product's principles rendered as pixels.

The rest is a 2024 marketing homepage: centred section headline → horizontal card rail → 3-column grid with a featured 2-span → floating bottom-right promo card with pulsing badge → four-column footer. Strip the violet and the wordmark and the middle 60% is a SaaS template with the nouns changed.

Worse, the two most brand-specific ideas in the brief are the ones diluted. **The curator's voice is fetched and thrown away** — `Homepage.tsx:26` types `note: string` into state, `seed.ts:259` holds the quote, and the card at `Homepage.tsx:416-433` renders image/name/shop/price and never the note. The one surface that proves "we selected these" ships as an anonymous product card. **The wave has become wallpaper** — brief §6 specifies one device doing three jobs; it is now also drawn inside every placeholder image (`seed.ts:24`), so five instances share one viewport at the collections grid.

And the homepage **never names a single brand.** Products, categories, collections, routes — but not one shop presented as a shop. For a product whose stated purpose is that small creative names get discovered, that is a positioning failure, not a layout one.

**Deterministic scan.** The CLI detector exited **0 — clean, zero findings** on all three files. The in-page overlay is where the evidence is: **22 findings across 18 elements**.

- `low-contrast` ×4 — `#39d6cf` on `#7520f7` = **3.5:1** (needs 4.5:1), all four "2 sản phẩm" labels at `Homepage.tsx:372`. **True positive**, and brief §3 forbids it independently of WCAG.
- `ai-color-palette` ×13 — teal carrying readable text at `Homepage.tsx:180, 295, 314, 329` and `Footer.tsx:23`. The rule's own naming ("cyan neon on dark") is a generic-AI heuristic that mismatches a brand teal, but the underlying call is the exact §3 prohibition. **True positive.** The detector correctly did *not* flag the hero "Tí" span, which appendix §B explicitly mandates as teal.
- `kicker-above-heading` ×1 — `Homepage.tsx:180` "Lộ trình khám phá" over `:182` "Hành trình khám phá". **True positive on redundancy, not on the device** — the brief sanctions section kickers; it does not sanction saying the same thing twice.
- `image-hover-transform` ×4 — `Homepage.tsx:362` `group-hover:scale-[1.03]`. **False positive.** Brief §7 mandates it verbatim, including the easing used.

A full DOM sweep found **15 elements computing to `#39D6CF`**, one of which (the hero "Tí") is brief-sanctioned; the other 14 are text using `--teal` where §3 requires `--teal-ink`.

**Visual overlays.** Mutation preflight passed and injection succeeded, so the overlay ran in-page and reported the 22 findings above. The live server on port 8400 was stopped and verified down (port probe + process check) before reporting, so **the overlay is no longer visible in your browser** — the console findings are transcribed above instead.

**Clean signals worth stating:** 0 console errors and 0 warnings on load. Heading outline is correct — 30 headings, exactly one `h1`, no skipped levels. Focus indicators are real on all 10 first-focusable elements: `outline-width: 1.6px solid`, context-coloured, `box-shadow: none` — the outline is the sole ring and it works. The 4 collection images with `alt=""` are a **false positive**: each is decorative inside an `<a>` whose `<h3>` already names the collection.

## Overall Impression

Someone with genuine craft built the film strip, and someone with a deadline built everything around it. `CELL_WIDTH = SPROCKET_PITCH * 5` is a decision no template makes; four grey rectangles printing "1600×1067" across a thousand pixels of scroll is a decision every unfinished project makes. The page has a fingerprint and a filler, and right now the filler occupies more screen.

The single biggest opportunity is **Hidden Gems**. The curator's note is already fetched, already written in three voices in `seed.ts`, and already designed as a full section in `mockup-desktop.html:912-935`. Shipping it as a rounded-16px drop-shadowed product card with a price and no note is the whole thesis of the product — curation, not commerce — inverted on the exact surface built to prove it.

## What's Working

1. **The film strip's sprocket math.** `FilmStrip.tsx:27-28` — `CELL_WIDTH = SPROCKET_PITCH * 5`. Because the cell is an exact multiple of the pitch, perforations stay evenly spaced *across cell seams*. That one constant is the difference between "film-strip motif" and "film strip". Compounded by `line-clamp-2 h-10` at `:204`, which locks the name box so a long Vietnamese title can't lift one frame and break the strip's horizon — a defect anticipated and designed out.

2. **Crawl and drag share one offset.** `FilmStrip.tsx:68-116` — both inputs write `offset.current` and call `apply()` directly rather than routing through state. That is why scrubbing feels alive and why the two inputs can't fight each other. It also ships a visible pause control, satisfying WCAG 2.2.2 on an auto-moving carousel, which almost nobody does.

3. **The horizon is negative space, not decoration.** `BrandShapes.tsx:47` documents it: the `fill` is the colour of the *next* section. The result reads as one continuous sheet being cut, which is why the hero→products transition is the best moment on the page. The comment at `BrandShapes.tsx:22` also correctly rejects `preserveAspectRatio="none"` — whoever wrote this understood that squashing the viewBox produces a different curve, not a scaled one.

## Priority Issues

### [P0] Hidden Gems ships the product and discards the curation

**Why it matters:** Three brief violations plus a hard content requirement, all on one 320px card — and it is the surface that exists to prove the product's thesis. `Homepage.tsx:26` fetches `note`; `:416-433` renders name/shop/price and never it. Only `gems[0]` is ever touched (`:35`), so two of three curator quotes are unreachable. The card is `rounded-2xl` + `shadow-[0_20px_60px_...]` (`:400`) — brief §8's banned "bo góc 12px + đổ bóng mềm… Đó là Shopee" — and it prints `480.000₫` (`:430`) with **no price-reference note**, which PRODUCT.md makes mandatory wherever a price appears.

**Fix:** Render `gem.note` as the card's headline in a `<blockquote>` (Alexandria 400 / 1.0625rem); demote name·shop·price to a single caption line; radius → 6px; replace the drop shadow with a 1px `ink/12%` hairline; add a shared `<PriceNote>` component and render it here and everywhere else a price appears.

**Suggested command:** `/impeccable harden`

### [P1] Teal carries text in 14 places; four fail WCAG outright

**Why it matters:** A palette rule stated twice in two authoritative documents (brief §3: *"teal là để nhìn, teal-ink là để đọc"*; PRODUCT.md under Accessibility), broken in the persistent chrome. Measured `#39D6CF` on `--color-brand #7520F7` = **3.5:1**. The four `2 sản phẩm` labels at `Homepage.tsx:372` are 11px at that ratio; `Header.tsx:82` applies the same on hover to 11px nav links; `Header.tsx:238` to suggestion shop names. The rest (`Homepage.tsx:180, 274, 295, 301, 314, 329, 366`; `Footer.tsx:23, 43`) pass numerically on darker grounds but still break the rule. `FilmStrip.tsx:199` already gets it right with `text-wave-ink`.

**Fix:** `text-wave` → `text-wave-ink` on light grounds; on violet grounds use `text-paper` and let teal carry the rule or underline beneath the text, not the glyphs. Leave the hero "Tí" alone — appendix §B mandates it.

**Suggested command:** `/impeccable colorize`

### [P1] The collections grid gives the largest surface to the emptiest content

**Why it matters:** This is the emotional valley, and it is structural rather than cosmetic. `Homepage.tsx:348-376` spends ~1,000px of scroll on four identical `ẢNH BÌA BỘ SƯU TẬP / 1600×1067` blocks. The featured card's `lg:col-span-2 lg:row-span-2` (`:354`) leaves ~200px of empty violet *inside its own border* because its content doesn't fill two rows; the fourth card orphans with ~950px of void beside it. The `1600×1067` label is a 3:2 article-cover spec printed inside a 16:10 frame. No empty or error branch exists, so a failed `fetchCollections()` (`:49`, no `throwOnError`) renders the heading over nothing. Meanwhile the content that actually exists gets 230px cells.

**Fix:** Drop `row-span-2`; use an asymmetric 2-up. Until real cover art exists, render collections typographically — title, description, count on violet with a hairline — rather than as four grey rectangles. Add an empty branch.

**Suggested command:** `/impeccable layout`

### [P1] The hero's authored object was dropped and nothing replaced it

**Why it matters:** The first screen has to carry the page's only job, and it currently carries an h1-sized line, a clipped ornament, and ~140px of dead violet. `mockup-desktop.html:679-687` contains a drawn ceramic vessel (ink body, teal crackle lines, honest `role="img"` aria-label) filling the hero's right side — the mockup's answer to the no-stock-photography rule. `Homepage.tsx:107-115` replaces it with a `RibbonLoop` translated 16% off-canvas, reading as a teal squiggle with a white dot; at 390px it runs directly through the "Xem tất cả shop" button zone. The headline at `:78` is `clamp(1.75rem, 5.2vw, 3.5rem)` — 28→56px against brief §4's `clamp(3rem, 9vw, 7rem)` and *"chữ hero phải to đến mức hơi khó chịu"*.

**Fix:** Restore the mockup's authored object at column 8 → bleed; push the ribbon behind it or delete it; hero to `clamp(2.5rem, 7vw, 5.5rem)` at `line-height: 1.18`.

**Suggested command:** `/impeccable bolder`

### [P1] Routes are chosen by naked digits, and mobile loses the language switch

**Why it matters:** Two separate recall failures in the same breath. `Homepage.tsx:218-227` makes the tab's entire content `{idx + 1}`; the route name lives only in `title={route.name}`. Nothing in the UI or URL records which route is open, so refresh resets to route 1 and the reading is unshareable. Brief §8 bans decorative 01/02/03 *except for genuine ordered sequences* — three parallel routes are a set, not a sequence, so the banned pattern is applied to exactly the wrong list while the stops (a real sequence) get the identical treatment 40px away. Separately, `Header.tsx:117` is `hidden sm:flex` and the drawer (`:252-264`) omits it, so **the VI/EN switch does not exist below 640px** — on the stated real usage scene, for an audience half made of foreign visitors. It is also a `<span>`, not a control.

**Fix:** Label route tabs with names ("Vòng Chợ Lớn", "Sáng tạo Thủ Đức", "Một buổi chiều Quận 1"); reserve numbering for stops; put the route id in the URL. Add the language switch to the mobile drawer and make it a real `<button>`.

**Suggested command:** `/impeccable adapt`

## Persona Red Flags

**Jordan (Confused First-Timer)**
- Four icon-only controls in the header with no visible labels (`Header.tsx:100-158`); the heart and person icons both land on `/auth-gateway` — a login wall on a catalogue PRODUCT.md says has no authentication.
- "TRANG CHỦ" sits in the nav while he is on the homepage; the active state is `text-paper` vs `text-white/70` at 11px — indistinguishable from a broken link.
- Route tabs "1 2 3": he cannot tell what he is choosing between before choosing.
- A pulsing, glowing, unlabelled star pinned to the right edge. He will not touch it.
- No success confirmation after any action; clicking a film frame just navigates.

**Casey (Distracted Mobile User)**
- **Measured at 390×844: 12 of 58 interactive elements are under 44×44.** All four header buttons are exactly 40×40 (`Header.tsx:102, 111, 125` + menu), clustered at the top of an 844px screen — the farthest point from her thumb. The four map pins are 40×40. The worst two are the Hidden Gems star at **21.4×24** and its close button at **20.3×27**.
- The VI/EN switch is absent below 640px.
- The ribbon crosses the "Xem tất cả shop" CTA at 390px — decoration in the tap path of a primary control.
- The strip crawls at 34px/s with no hover on touch: her target moves between decision and tap.
- Recent searches live in `sessionStorage` (`Header.tsx:29`) — closing the tab loses them.
- The gem star is `fixed` at 50% viewport height on the right edge, permanently in the right-thumb path.

**Riley (Deliberate Stress Tester)**
- `/anything` silently redirects to `/` (`App.tsx:123`) with no message, despite `docs/03-CONTENT-PACK.md:79` already having the 404 copy written. Looks like it worked; didn't.
- `fetchCollections()` and `fetchHiddenGems()` (`Homepage.tsx:49-50`) omit `throwOnError`, so a failure renders the "Bộ sưu tập" heading over an empty grid — a section that looks fine and contains nothing.
- Refresh mid-flow resets to route 1 / stop 1 (`Homepage.tsx:56-59`); nothing is in the URL.
- `<Link to="/#lotrinh">` in `Footer.tsx:38` does not scroll to the anchor on a cold load from another route.
- Long Vietnamese strings: the strip clamps correctly (`FilmStrip.tsx:204`), but collection titles and stop names are unclamped and will reflow the pin list.

**Mai (project-specific — 23, HCMC, design student, follows local ceramicists on IG, screenshots typography she likes)**
*Behaviors:* judges a site in under two seconds from the hero and one card; reverse-image-searches anything that looks like stock; shares screenshots of good type.
*What actually broke:*
- The gem card — 16px radius, soft drop shadow, pill badge — is Shopee's product card, and it is the surface labelled "curated". She clocks it instantly.
- Four identical grey rectangles printing "1600×1067" read as a Figma file shipped to production, not as an editorial choice.
- "Khám phá ngay" is influencer-caption Vietnamese; her own brief lists it by name in the don't-write column.
- The cropped teal ribbon reads as a blob — §8's enumerated "AI-made" tell.
- She came for names. The homepage gives her categories.

## Minor Observations

- **`.display` line-height collides diacritics on any wrap.** `index.css:61` sets `1.02` directly beneath a comment measuring uppercase Vietnamese at ~1.18em. Measured in DFVN at 100px: `Ẫ` ascends 98, `Ộ` descends 17 → 1.15em of ink in a 1.02em box. A two-line "LỘ TRÌNH KHÁM PHÁ" at 40px puts the dot under `Ộ` on the acute of the line below. Set `1.2` and tighten with margin.
- **The map polyline is straight, not a wave.** `Homepage.tsx:252-257` uses a plain `<polyline>`; brief §6 job 3 and appendix §A both keep the wave for the map, and `mockup-desktop.html:860` draws it as a curve.
- **`.draw` is dead CSS.** `index.css:114-118` defines the second half of brief §7's staged load moment. No element carries the class, so the wave horizon just appears.
- **"Từ tạp chí" is absent** from the homepage though `mockup-desktop.html:941-960` builds it and "Tạp chí" is in the nav. Editorial-over-commercial is a stated principle with zero homepage representation.
- **"Khám phá" is missing from the nav entirely** (`mockup-desktop.html:650` has it); city routes are reachable only by scrolling or a footer anchor.
- **Kicker and heading say the same thing twice** — `Homepage.tsx:180` "Lộ trình khám phá" over `:182` "Hành trình khám phá". The detector flagged this independently.
- **The mockup's honesty affordance was removed.** Every mockup section carries a visible `Nội dung mẫu` tag; the build ships invented shop names unmarked (only `Blog.tsx:85` retains it), while PRODUCT.md requires they be replaced before any public demo.
- **Half the footer is inert** — `Footer.tsx:57-63` renders four entries as grey `<span>`s with a native `title`.
- **Both section h2s are dead-centred** (`Homepage.tsx:120, 344`) against brief §5's "bố cục bất đối xứng có chủ đích".
- **No saved state on film frames** — brief §10 requires the product card in three states (default, hover, saved); `mockup-desktop.html:701` has the `aria-pressed` save button. The build has hover only.

## Questions to Consider

1. The homepage never names a single brand — products, categories, collections, routes, but not one shop presented *as* a shop. If curation is the product and handoff is the goal, why is there no path from this page to any maker?
2. Three curator quotes sit in `seed.ts` and none reach the screen. Was Hidden Gems built as a feature, or as a decoration that happens to be clickable?
3. The wave was specified as one device doing three jobs. It now also lives inside every placeholder image — five instances per screen at the collections grid. At what count does a signature become a texture?
4. If the collections had no cover art *forever*, would you still build them as a grid of image cards — or is the grid there because grids are what homepages have?
5. The appendix flipped the brief's 60% white to 60% violet on the guidelines' authority. On a phone in Saigon daylight, with full-bleed `#7520F7` and teal text at 3.5:1, has that ratio been verified on a real screen — or inherited from a PDF?
6. "Khám phá ngay" appears by name in the brief's don't-write column. What process allowed it into the primary CTA, and what else did that process wave through?
