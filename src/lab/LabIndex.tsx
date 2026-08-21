import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import Brandmark from "../components/Brandmark";
import "./lab.css";

/**
 * Comparison sheet for the exploration directions.
 *
 * Everything below the fixed constraints is what the team is choosing between:
 * four homepage directions, plus three readings of the brand marks laid over
 * C. Once one is picked, the rest come out of src/lab/ and the decision gets
 * recorded in .21st/design.json.
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
  {
    slug: "c4",
    name: "MỘT NÉT",
    en: "One stroke",
    reference: "the brand's own wave and knot",
    idea:
      "Keep the colour, keep waves and loops central, change everything else — so what goes is the page. One line is drawn across a world larger than the screen and everything the site says is pinned to a point on it. Scrolling moves you along the line while the world slides under a fixed viewfinder.",
    effect: "Visitor is travelling somewhere rather than reading down a page.",
    differences: [
      "No sections, no bands, no rows, no grid, no nav bar",
      "The wave is the road and the ribbon's knot is the landmark — both structural, not decorative",
      "Navigation is a position on a line; the chrome is a mark, a chapter and a distance",
      "The camera is a critically damped follow, so arrival is soft and reversal blends",
      "Cards hang off whichever side of the road has room",
      "Density: one stop at a time — the lowest of any direction",
    ],
    risk: "The furthest from anything the team has approved, and the least conventional to navigate: there is no nav bar and no way to jump to a section. Desktop-verified only so far.",
    bestFor: "A launch moment or an awards entry, where being unlike other sites is the point.",
    swatch: ["#7520f7", "#39d6cf", "#ffffff"],
    tone: "bg-brand text-paper",
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

/* Subpage studies — 21/08. Four pages the team gave notes on, three
   directions each. Unlike the homepage set these are independent choices:
   picking catalogue 1 does not commit you to product 1. */
const SUBPAGE_STUDIES = [
  {
    page: "Trang sản phẩm",
    route: "/products",
    path: "catalog",
    notes:
      "Chip đầu trang là placeholder và không khớp sản phẩm nào — mọi chip đều ra 0 kết quả. Ấn chip thì cả trang giật và phóng to thu nhỏ. Bộ lọc và sắp xếp chưa đúng ngôn ngữ thiết kế. 77 sản phẩm để xem một trang hiển thị bao nhiêu.",
    options: [
      {
        n: 1,
        name: "QUẦY",
        en: "The Counter",
        idea: "Bộ lọc mở sẵn trong một cột bên trái, đếm số thật. 24 sản phẩm một trang, phân trang số.",
        differences: [
          "Bộ lọc luôn hiện — không phải mở ra mới thấy",
          "Phân trang có số, có thể chia sẻ và index được",
          "Mật độ cao nhất: 4 cột trên desktop",
        ],
        risk: "Cột bộ lọc lấy mất chiều ngang của hàng sản phẩm; trên mobile phải nằm trong bottom sheet.",
      },
      {
        n: 2,
        name: "RÁP",
        en: "The Rail",
        idea: "Một thanh mảnh duy nhất, bộ lọc mở ra bên dưới khi cần. Bấm “Xem thêm 24” thay vì đổi trang.",
        differences: [
          "Không có cột bên — sản phẩm giữ trọn chiều ngang",
          "Danh sách dài thêm, không mất vị trí đang xem",
          "Mật độ thấp nhất: 3 cột, ảnh lớn, có mô tả ngắn",
        ],
        risk: "Danh sách nối dài khó quay lại đúng chỗ và khó cho SEO hơn phân trang số.",
      },
      {
        n: 3,
        name: "MỤC LỤC",
        en: "The Index",
        idea: "Bộ lọc viết thành một câu. Xem được ở dạng mục lục đánh số hoặc dạng lưới.",
        differences: [
          "Không còn nút bấm dạng hộp — mỗi lựa chọn là một từ gạch chân trong câu",
          "Hai kiểu xem: mục lục 36 dòng/trang, hoặc lưới 24 ô/trang",
          "Ít màu nhất, chữ nhiều nhất",
        ],
        risk: "Câu lọc chỉ chọn được một giá trị mỗi loại; mục lục chỉ hợp khi người xem đã biết mình tìm gì.",
      },
    ],
  },
  {
    page: "Trang chi tiết sản phẩm",
    route: "/products/[slug]",
    path: "product",
    sample: "/prod-dia-men-ran-song-nuoc",
    notes:
      "Trang chưa có mô tả sản phẩm (dữ liệu cũng chưa có). Cần overhaul, và ảnh từ trang danh mục phải phóng vào đúng khung ảnh của trang này.",
    options: [
      {
        n: 1,
        name: "TRƯNG BÀY",
        en: "The Plate",
        idea: "Ảnh đứng yên bên trái, phần đọc chạy bên phải theo thứ tự: xưởng, tên, giá, mô tả, thông số, cách đặt.",
        differences: [
          "Ảnh dính (sticky) — luôn thấy khi đọc",
          "Mô tả gấp ở 4 dòng, có “… Xem thêm”",
          "Nút đặt nằm trong cột đọc, không nổi",
        ],
        risk: "Cột phải khá dài trên màn nhỏ; ảnh chiếm 7/12 chiều ngang nên chữ hẹp hơn hai bản kia.",
      },
      {
        n: 2,
        name: "MỞ RA",
        en: "The Unfold",
        idea: "Ảnh mở tràn màn thành khung 21:9, tên sản phẩm nằm trên ảnh. Thanh đặt hàng dính đáy ở mọi khổ màn.",
        differences: [
          "Ảnh là thứ đầu tiên và lớn nhất — hợp với continuity transition nhất",
          "Mô tả là phần thân trang, cỡ chữ lớn hơn",
          "Thanh đặt hàng luôn hiện, cả trên desktop",
        ],
        risk: "Ảnh 1:1 của xưởng bị cắt mạnh khi ép 21:9; chữ trên ảnh cần scrim đủ đậm.",
      },
      {
        n: 3,
        name: "PHIẾU",
        en: "The Tag",
        idea: "Thông số là xương sống. Hai ảnh hiện cùng lúc, không có gì để bấm qua lại.",
        differences: [
          "Không carousel, không thumbnail — ảnh bày sẵn",
          "Mô tả mở rộng tới 8 dòng mới gấp",
          "Phần đặt hàng là một “phiếu hỏi xưởng” ở cuối",
        ],
        risk: "Ảnh nhỏ hơn hai bản kia; trang đọc như hồ sơ lưu trữ hơn là trang bán.",
      },
    ],
  },
  {
    page: "Trang shop",
    route: "/stores",
    path: "shops",
    notes:
      "Chip khu vực đầu trang là placeholder — 9 chip viết tay, không chip nào khớp với 6 xưởng trong dữ liệu. Nút đăng ký mở xưởng không được đẩy sang auth gateway nữa.",
    options: [
      {
        n: 1,
        name: "DANH BẠ",
        en: "The Directory",
        idea: "Mỗi xưởng một hàng ngang, ảnh bìa 21:9 làm chính. Khu vực là một ô chọn lấy từ dữ liệu, tự ẩn khi không có gì để chọn.",
        differences: [
          "Không còn dải chip; chỉ một ô chọn + ô tìm",
          "Mỗi hàng kèm 3 ảnh sản phẩm gần nhất",
        ],
        risk: "Hàng ngang tốn chiều dọc — 6 xưởng đã dài gần hai màn hình.",
      },
      {
        n: 2,
        name: "THEO KHU",
        en: "By area",
        idea: "Khu vực là trục chính: một mục lục khu vực đứng yên bên trái, xưởng của khu bên phải, và lối ra là bản đồ lộ trình.",
        differences: [
          "Khu vực là cách đọc trang, không phải bộ lọc phụ",
          "Nối thẳng sang /kham-pha",
        ],
        risk: "Hiện mỗi khu chỉ có đúng một xưởng, nên mục lục chưa phát huy; chỉ đáng khi có 30+ xưởng.",
      },
      {
        n: 3,
        name: "TỦ",
        en: "The Cabinet",
        idea: "Hai xưởng một hàng, mỗi xưởng đã bày sẵn 4 món. Bỏ hẳn bộ lọc khu vực, chỉ giữ ô tìm.",
        differences: [
          "Thấy hàng của xưởng ngay, không cần mở trang xưởng",
          "Nền đen, ít điều khiển nhất",
        ],
        risk: "Không lọc được theo khu vực; nền đen làm ảnh placeholder xám đi.",
      },
    ],
  },
  {
    page: "Đăng ký mở xưởng",
    route: "/mo-xuong",
    path: "open",
    notes:
      "Trang mới. Không đẩy sang auth gateway, không tạo tài khoản, không mật khẩu — chỉ tên, email, số điện thoại, khu vực, kênh bán và mô tả.",
    options: [
      {
        n: 1,
        name: "MỘT TRANG",
        en: "One page",
        idea: "Toàn bộ câu hỏi hiện cùng lúc, bên cạnh là thẻ hồ sơ xưởng tự dựng theo những gì vừa điền.",
        differences: [
          "Thấy hết việc phải làm ngay từ đầu",
          "Có xem trước kết quả + phần “Tí tìm gì”",
        ],
        risk: "Nhìn dài, dễ làm người ngại điền bỏ giữa chừng.",
      },
      {
        n: 2,
        name: "BA BƯỚC",
        en: "Three steps",
        idea: "Ba màn ngắn — liên hệ, xưởng, sản phẩm — rồi xem lại toàn bộ trước khi gửi.",
        differences: [
          "Mỗi lúc chỉ hỏi 2–3 câu",
          "Có bước xem lại và sửa trước khi gửi",
        ],
        risk: "Nhiều lần bấm hơn; không thấy trước tổng khối lượng phải điền.",
      },
      {
        n: 3,
        name: "LÁ THƯ",
        en: "The Letter",
        idea: "Biểu mẫu viết thành đoạn văn có chỗ trống điền vào giữa câu.",
        differences: [
          "Ít điều khiển nhìn thấy nhất — đọc như một lời tự giới thiệu",
          "Giọng gần với thương hiệu nhất",
        ],
        risk: "Câu văn xuống dòng nhiều ở 390px; trình đọc màn hình phải dựa vào aria-label vì nhãn không hiện.",
      },
    ],
  },
];

export default function LabIndex() {
  return (
    <div className="min-h-[100dvh] bg-paper-warm px-5 py-12 font-sans text-ink md:px-10 md:py-16">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-ink/12 pb-6">
          <Brandmark className="h-auto w-[96px]" body="var(--color-ink)" wave="var(--color-wave-ink)" />
          <h1 className="display mt-6 text-[clamp(2rem,6vw,4rem)] normal-case leading-none">
            Bốn hướng đi
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink/70">
            Bốn hướng thiết kế cho trang chủ, dựng thật trên cùng dữ liệu và cùng bộ token. Tất cả
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

        <section className="mt-16">
          <div className="border-b border-ink/12 pb-4">
            <h2 className="display text-[clamp(1.5rem,4vw,2.5rem)] normal-case leading-none">
              Các trang còn lại
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink/70">
              Bốn trang team đã góp ý, mỗi trang ba hướng. Đây là bốn lựa chọn độc lập — chọn
              hướng 1 cho danh mục không buộc phải chọn hướng 1 cho trang chi tiết. Cả mười hai
              bản dùng chung dữ liệu đã mở rộng lên{" "}
              <strong className="text-ink">77 sản phẩm</strong>, bỏ hẳn hiệu ứng phóng to toàn
              trang khi bấm bộ lọc, và dùng chung một transition ảnh nối từ danh mục sang trang
              sản phẩm.
            </p>
          </div>

          <div className="mt-8 space-y-10">
            {SUBPAGE_STUDIES.map((study) => (
              <article key={study.path}>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="display text-[clamp(1.2rem,2.6vw,1.75rem)] normal-case leading-none">
                    {study.page}
                  </h3>
                  <code className="text-xs text-ink/45">{study.route}</code>
                </div>
                <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-ink/60">
                  <strong className="font-semibold text-ink/80">Góp ý:</strong> {study.notes}
                </p>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  {study.options.map((o) => (
                    <div
                      key={o.n}
                      className="flex flex-col rounded-2xl bg-paper p-5 ring-1 ring-ink/12"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="display text-[1.15rem] normal-case leading-none">
                          {o.n} · {o.name}
                        </p>
                        <span className="shrink-0 text-[11px] text-ink/45">{o.en}</span>
                      </div>
                      <p className="mt-3 text-[13px] leading-relaxed text-ink/80">{o.idea}</p>

                      <ul className="mt-3 space-y-1">
                        {o.differences.map((d) => (
                          <li key={d} className="flex gap-2 text-[13px] leading-relaxed text-ink/65">
                            <span
                              aria-hidden="true"
                              className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-wave-ink"
                            />
                            {d}
                          </li>
                        ))}
                      </ul>

                      <p className="mt-3 text-[13px] leading-relaxed text-ink/50">{o.risk}</p>

                      <Link
                        to={`/lab/${study.path}/${o.n}${study.sample ?? ""}`}
                        className="mt-5 inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-ink/25 px-5 text-sm font-semibold transition-colors hover:border-ink"
                      >
                        Xem bản {o.n}
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-14 border-t border-ink/12 pt-6 text-sm text-ink/60">
          <p>
            Dữ liệu vẫn là dữ liệu giả trong <code className="text-ink">src/lib/mock/seed.ts</code>.
            Ảnh ngang của shop hiện là ô trống có ghi rõ tỷ lệ cần nộp — đúng như yêu cầu team đặt
            ra cho các shop.
          </p>
          <p className="mt-3">
            Chọn xong một hướng, những hướng còn lại sẽ được gỡ khỏi{" "}
            <code className="text-ink">src/lab/</code> và quyết định được ghi vào{" "}
            <code className="text-ink">.21st/design.json</code>.
          </p>
        </footer>
      </div>
    </div>
  );
}
