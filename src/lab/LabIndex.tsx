import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import Brandmark from "../components/Brandmark";
import "./lab.css";

/**
 * Comparison sheet for the three exploration directions.
 *
 * Everything below the fixed constraints is what the team is choosing between.
 * Once a direction is picked, the other two folders come out and the decision
 * gets recorded in .21st/design.json.
 */

const FIXED = [
  "React 19 + Vite + Tailwind 4, same build",
  "Tokens from src/index.css — no new colours, no new faces",
  "Data through src/lib/dbService.ts (same products, shops, routes)",
  "Nav hides on scroll down, returns on scroll up (8px threshold)",
  "Hero loop opens on the Tí frame, then shop-submitted 16:9 frames",
  "Landscape thumbnails everywhere a shop image appears",
  "A gift / collection surface on every homepage",
  "District map carousel, one map per district",
  "Price note + no-transaction stance kept verbatim",
  "prefers-reduced-motion stops every scroll-driven and looping animation",
];

const DIRECTIONS = [
  {
    slug: "a",
    name: "SẠP",
    en: "The Stall",
    reference: "partakefoods.com",
    idea:
      "A joyful street stall. Everything is present at once, everything answers back when touched. Loud violet, chunky rounded forms, spring physics.",
    effect: "Visitor feels invited in and starts tapping immediately.",
    differences: [
      "Navigation: floating capsule that lands with a spring overshoot",
      "Catalogue: two counter-running marquee lanes that never stop",
      "Gifts: split panels that push each other on hover (1.6 / 0.7 flex)",
      "Map: board-game beads; the picked bead becomes stop 01",
      "Density: high — three surfaces visible per screen",
    ],
    risk: "Continuous marquee motion is the biggest attention tax of the three; it pauses on hover and stops under reduced motion, but it is always running otherwise.",
    bestFor: "Instagram traffic landing mid-scroll, wanting to see many things fast.",
    swatch: ["#7520f7", "#39d6cf", "#12081f"],
    tone: "bg-brand text-paper",
  },
  {
    slug: "b",
    name: "HỒ SƠ",
    en: "The Archive",
    reference: "objectandarchive.com",
    idea:
      "A curator's archive. Paper ground, hairline rules, running index numbers, museum captions. The catalogue is a table of contents, not a grid.",
    effect: "Visitor reads the selection as authored and trustworthy.",
    differences: [
      "Navigation: chrome thins to a hairline index; the rule is the progress bar",
      "Catalogue: numbered index rows with leader dots; hover summons the plate",
      "Gifts: two labelled cabinet drawers as caption-led filmstrips",
      "Map: survey plan paged by district; route prints as a contents list",
      "Density: highest text density, lowest chroma — violet used once, as punctuation",
    ],
    risk: "Leans on reading. Small type and low-contrast hairlines need a size audit before it ships; the index row is the only route to a product on desktop.",
    bestFor: "Making curation itself the argument — press, partner shops, the 'why we exist' case.",
    swatch: ["#ffffff", "#12081f", "#0b7c77"],
    tone: "bg-paper text-ink ring-1 ring-ink/12",
  },
  {
    slug: "c",
    name: "DÒNG",
    en: "The Current",
    reference: "readymag · bangkokartcity · dontboardme",
    revised: true,
    idea:
      "One continuous motion, nothing in a card. Hairlines and full-bleed colour fields carry the structure; scroll drives the collections track and the footer reveal.",
    effect: "Visitor keeps scrolling because the page keeps turning itself.",
    differences: [
      "Colour: violet-dominant per 60 / 30 / 10 — one white section, one ink section",
      "Navigation: glass bar + a spine index that flips to ink over the white band",
      "Catalogue: A's two counter-running marquee lanes, cardless",
      "How it works: four cards overlapping ~27%, revealing in sequence on scroll",
      "Collections: four numbered placeholders on a pinned 60 / 30 / 10 track",
      "Map: one strip after collections; island + pins + arrows, the map is the link",
      "Hidden Gems: right-edge tab from the live site, hiding with the chrome",
      "Footer: MO-4 reveal — stationary underlay, wordmark scrubs 0.25 → 1",
    ],
    risk: "The pinned collections track takes over scroll on desktop — disabled below 1024px and under reduced motion. With four collections the last one never reaches 60%; the window ends on Xem thêm as specified.",
    bestFor: "The base the team picked — cardless, and now carrying A's marquee and collection look.",
    swatch: ["#12081f", "#39d6cf", "#7520f7"],
    tone: "bg-ink text-paper",
  },
];

/* Brand-device studies. Same page as C; what differs is how much of the
   identity system in src/assets/brand is doing structural work, and how much
   invention sits on top of it. */
const BRAND_STUDIES = [
  {
    slug: "c1",
    name: "C1 · ĐÚNG SÁCH",
    en: "By the book",
    invention: "0%",
    idea:
      "The three marks placed exactly as the guidelines compose them: arc bled off the top-right, the wave as every change of ground, the ribbon astride the hero seam. Nothing moves.",
    differences: [
      "brand-arc-top-right bleeds off the hero corner, held clear of the wordmark (p17)",
      "brand-wave-bottom replaces the house curve at every seam, with a teal crest line",
      "brand-ribbon-loop sits across the hero seam, exactly as on the cover",
    ],
    risk: "Most faithful and least surprising. The marks are decoration here — they carry no information.",
  },
  {
    slug: "c2",
    name: "C2 · DÒNG CHẢY",
    en: "The current",
    invention: "25%",
    idea:
      "The same three marks, but the book says the wave is a current and that art is never rigid — so the devices answer to scroll instead of sitting still.",
    differences: [
      "The wave crest drifts as the section passes, so the seam reads as water",
      "The arc rotates with scroll — it is the mark for connection, so it reports progress",
      "The ribbon draws itself in on first sight rather than simply being there",
    ],
    risk: "Motion on decorative marks competes with the page's own scroll-driven sections; it stops entirely under reduced motion.",
  },
  {
    slug: "c3",
    name: "C3 · BỆ PHÓNG",
    en: "The launchpad",
    invention: "75%",
    idea:
      "Built from what the marks mean rather than how they look. The wave is a launchpad that lifts makers up (p16) and the ribbon's negative-space eye is where the emblem's meaning sits (p15) — so both are promoted from ornament to structure.",
    differences: [
      "The catalogue rides the wave — tiles sit on a crest instead of a straight row",
      "The ribbon's eye becomes an aperture: the next shop in the hero loop is seen through it",
      "The page's progress is a rising tide rather than a bar",
    ],
    risk: "The furthest from the book's literal compositions; the eye aperture is a new shape derived from the mark, not one of its drawings. Worth a check with whoever owns the identity.",
  },
];

export default function LabIndex() {
  return (
    <div className="min-h-[100dvh] bg-paper-warm px-5 py-12 font-sans text-ink md:px-10 md:py-16">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-ink/12 pb-6">
          <Brandmark className="h-auto w-[96px]" body="var(--color-ink)" wave="var(--color-wave-ink)" />
          <h1 className="display mt-6 text-[clamp(2rem,6vw,4rem)] normal-case leading-none">
            Ba hướng đi
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink/70">
            Ba hướng thiết kế cho trang chủ, dựng thật trên cùng dữ liệu và cùng bộ token. Tất cả
            đều đã có phản hồi của team: nav tự ẩn, hero loop ảnh shop gửi, bộ sưu tập, thumbnail
            ngang, và bản đồ quận dạng carousel. Bản C đã sửa theo góp ý 19/08 — lấy thêm marquee
            và cách trình bày bộ sưu tập từ bản A, thêm phần &ldquo;Cách đặt hàng&rdquo;, đổi bản
            đồ thành một dải, và dựng footer lộ ra theo MO-4.
          </p>
        </header>

        <section className="mt-10">
          <h2 className="label text-ink/50">Giữ nguyên ở cả ba</h2>
          <ul className="mt-4 grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
            {FIXED.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-ink/75">
                <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-wave-ink" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 space-y-6">
          {DIRECTIONS.map((d) => (
            <article key={d.slug} className={`overflow-hidden rounded-3xl ${d.tone}`}>
              <div className="grid gap-6 p-6 md:grid-cols-[1fr_1.4fr] md:gap-10 md:p-9">
                <div>
                  {/* neutral pill so a violet chip stays visible on the
                      violet card and a white chip on the paper one */}
                  <div className="inline-flex items-center gap-2 rounded-full bg-paper-warm px-2.5 py-2 ring-1 ring-ink/10">
                    {d.swatch.map((c) => (
                      <span
                        key={c}
                        className="h-5 w-5 rounded-full ring-1 ring-ink/15"
                        style={{ backgroundColor: c }}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <p className="display mt-5 flex flex-wrap items-baseline gap-x-3 text-[clamp(2rem,5vw,3.5rem)] normal-case leading-none">
                    {d.name}
                    {d.revised && (
                      <span className="rounded-full border border-current/40 px-3 py-1 font-sans text-[11px] tracking-[0.14em] opacity-80">
                        ĐÃ SỬA 19/08
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm opacity-60">
                    {d.en} · tham chiếu {d.reference}
                  </p>
                  <p className="mt-5 text-sm leading-relaxed opacity-85">{d.idea}</p>
                  <p className="mt-3 text-sm leading-relaxed opacity-65">
                    <strong className="font-semibold opacity-100">Hiệu quả mong muốn:</strong>{" "}
                    {d.effect}
                  </p>

                  <Link
                    to={`/lab/${d.slug}`}
                    className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full border border-current/30 px-6 text-sm font-semibold transition-colors hover:border-current"
                  >
                    Xem bản dựng {d.slug.toUpperCase()}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="text-sm">
                  <p className="label opacity-55">Khác biệt có chủ đích</p>
                  <ul className="mt-3 space-y-1.5">
                    {d.differences.map((line) => (
                      <li key={line} className="flex gap-2.5 leading-relaxed opacity-85">
                        <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-40" />
                        {line}
                      </li>
                    ))}
                  </ul>

                  <p className="label mt-6 opacity-55">Rủi ro</p>
                  <p className="mt-2 leading-relaxed opacity-75">{d.risk}</p>

                  <p className="label mt-6 opacity-55">Hợp nhất khi</p>
                  <p className="mt-2 leading-relaxed opacity-75">{d.bestFor}</p>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-16">
          <div className="border-b border-ink/12 pb-4">
            <h2 className="display text-[clamp(1.5rem,4vw,2.5rem)] normal-case leading-none">
              Nhận diện thương hiệu trên bản C
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/70">
              Cùng một trang C, ba cách đưa ba dấu hiệu trong{" "}
              <code className="text-ink">src/assets/brand</code> vào giao diện — ribbon, arc và
              wave. Khác nhau ở chỗ dấu hiệu chỉ để trang trí, hay thật sự gánh việc.
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {BRAND_STUDIES.map((b) => (
              <article
                key={b.slug}
                className="flex flex-col rounded-2xl bg-paper p-6 ring-1 ring-ink/12"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="display text-[clamp(1.1rem,2.2vw,1.5rem)] normal-case leading-none">
                    {b.name}
                  </p>
                  <span className="shrink-0 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
                    {b.invention}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink/50">{b.en}</p>
                <p className="mt-4 text-sm leading-relaxed text-ink/80">{b.idea}</p>

                <ul className="mt-4 space-y-1.5">
                  {b.differences.map((d) => (
                    <li key={d} className="flex gap-2.5 text-[13px] leading-relaxed text-ink/70">
                      <span
                        aria-hidden="true"
                        className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-wave-ink"
                      />
                      {d}
                    </li>
                  ))}
                </ul>

                <p className="mt-4 text-[13px] leading-relaxed text-ink/55">{b.risk}</p>

                <Link
                  to={`/lab/${b.slug}`}
                  className="mt-6 inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-ink/25 px-5 text-sm font-semibold transition-colors hover:border-ink"
                >
                  Xem {b.slug.toUpperCase()}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-ink/60">
            Tỷ lệ màu trong sách là <strong className="text-ink">60% tím · 30% trắng · 10% teal</strong>{" "}
            (trang 13) — không có màu đen trong tỷ lệ. Cả ba bản trên vẫn giữ nguyên nền của bản C
            để so sánh đúng phần dấu hiệu; nếu team muốn bám sát sách hơn nữa thì phần nền đen hiện
            tại nên đổi sang trắng.
          </p>
        </section>

        <footer className="mt-14 border-t border-ink/12 pt-6 text-sm text-ink/60">
          <p>
            Dữ liệu vẫn là dữ liệu giả trong <code className="text-ink">src/lib/mock/seed.ts</code>.
            Ảnh ngang của shop hiện là ô trống có ghi rõ tỷ lệ cần nộp — đúng như yêu cầu team đặt
            ra cho các shop.
          </p>
          <p className="mt-3">
            Chọn xong một hướng, hai hướng còn lại sẽ được gỡ khỏi{" "}
            <code className="text-ink">src/lab/</code> và quyết định được ghi vào{" "}
            <code className="text-ink">.21st/design.json</code>.
          </p>
        </footer>
      </div>
    </div>
  );
}
