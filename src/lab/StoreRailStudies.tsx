/* No @types/react in the project, so the React namespace has to be pulled in
   explicitly before React.ReactNode resolves — same note as labShared.tsx. */
import type React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { LabShell, LabFrame } from "./labShared";
import { useHomeData, formatPrice, PRICE_NOTE } from "../home/homeData";
import { useDragTrack } from "../lib/useDragTrack";
import type { Product } from "../types";
import "../home/home.css";

/**
 * What's in store — the catalogue strip on a phone.
 *
 * Team 31/08: "Rework kích cỡ của ảnh sản phẩm ở 'What's in store' cho mobile
 * thật kỹ, cũng như swipe interaction sao cho thuận tiện." The 31/08 PDF adds,
 * for the product grid: "không để nhiều khoảng trắng, luôn để sp sau lấp ló.
 * Tham khảo layout của shopee."
 *
 * What ships today is neither reworked nor swipeable. The lane is a CSS
 * marquee inside a container with overflow-x: hidden — there is no scroll
 * container and no pointer handler, so there is nothing to push; and the
 * pause rule keys off :hover, which a touch tap sets and holds, so the one
 * gesture available stops the lane instead of moving it.
 *
 * That much is a bug and is being fixed on fix/homepage-store-mobile-swipe.
 * What is *not* settled is the question underneath it: on a phone, is this
 * section a lane you push, a grid you scan, or one product at a time? The
 * three studies below are that question, not three sets of numbers.
 *
 * References
 *   · 21st "Snap Carousel" (ddoemonn, id 23559) — a headless snap hook with
 *     momentum flicking, peek edges and slide indicators. Its landing rule is
 *     `clamp(round(projected), anchor − maxFlick, anchor + maxFlick)` with
 *     momentum 0.14 and maxFlick 1, which is the same shape as the project's
 *     own useDragTrack once its throw is tuned down. Direction C is built on
 *     that, in the project's idiom rather than on motion/react.
 *   · 21st "Product Image Card" (ruixen.ui) — the tight, image-led product
 *     tile that Direction B's grid uses.
 *   · The project's own src/lib/useDragTrack.ts, built to Apple's fluid
 *     interface rules, which already does 1:1 tracking, velocity handoff and
 *     rubber-banding.
 *
 * Held fixed across all three, so the comparison is about the model and not
 * about styling: real Approved products through useHomeData, the square photo
 * crop the team chose on 26/08, shop name + product name + price on every
 * tile, PRICE_NOTE verbatim, brand tokens only, and reduced motion honoured.
 *
 * Nothing in src/lab is imported by src/views.
 */

const PHONE_W = 375;
const PHONE_H = 812;

/** A 375×812 phone, so each model is judged at the size it is argued about. */
function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[2rem] bg-brand ring-1 ring-ink/15"
      style={{ width: PHONE_W, height: PHONE_H }}
    >
      {/* Content stacks from the top and stops where it stops. Nothing is
          stretched to fill the 812px, because how much of the screen a model
          actually takes is one of the things being compared — A is short, B
          runs past the fold, C sits in between. */}
      <div className="flex h-full flex-col pt-6">
        <div className="px-5 text-center">
          <h2 className="display text-[2rem] normal-case leading-none text-paper">
            What&rsquo;s in store
          </h2>
        </div>
        <div className="mt-7">{children}</div>
        <p className="px-5 pt-5 text-center text-[11px] text-white/50">{PRICE_NOTE}</p>
      </div>
    </div>
  );
}

/* ── the tile ─────────────────────────────────────────────────────────────
   One tile, three sizes, so the studies differ on how many fit rather than on
   how a product is drawn. The caption stacks — shop, then name on up to two
   lines, then price — because at any of these widths the single baseline row
   that ships today cuts an ordinary Vietnamese product name mid-word. */

function Tile({
  product,
  width,
  nameLines = 2,
}: {
  key?: string;
  product: Product;
  /** CSS width for this study's tile. */
  width: string;
  nameLines?: 1 | 2;
}) {
  return (
    <div className="shrink-0 text-left" style={{ width }}>
      <div className="relative aspect-square overflow-hidden rounded-[1.25rem] bg-white/5">
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="mt-3 border-t border-white/15 pt-2.5">
        <span className="block truncate text-[10px] tracking-[0.16em] text-white/70">
          {product.storeName.toUpperCase()}
        </span>
        <span
          className={`mt-1 block text-[14px] font-medium leading-snug text-paper ${
            nameLines === 1 ? "line-clamp-1" : "line-clamp-2"
          }`}
        >
          {product.name}
        </span>
        <span className="mt-1 block text-[13px] tabular-nums text-white/70">
          {formatPrice(product.price)}
        </span>
      </div>
    </div>
  );
}

/* ── A · RÁP — the rail ───────────────────────────────────────────────────
   The platform's own scroller. Push it and it goes where you pushed it; let
   go and the OS carries it. No JavaScript in the gesture path at all, which
   is the point: nothing that can drop a frame under a finger. */

function StudyRail({ products }: { products: Product[] }) {
  return (
    <Phone>
      <div
        className="ti-rail lab-no-scrollbar flex items-start gap-3 overflow-x-auto px-5"
        role="group"
        aria-roledescription="carousel"
        aria-label="Sản phẩm đang có"
      >
        {products.map((p) => (
          /* 217px, not 58vw: inside the lab the phone is a 375px box on a
             desktop page, so vw would measure the wrong viewport. 58% of 375
             is what the shipped rule computes to on a real phone. */
          <Tile key={p.id} product={p} width="217px" />
        ))}
      </div>
    </Phone>
  );
}

/* ── B · QUẦY — the counter ───────────────────────────────────────────────
   Stops being a lane. Two up, tight gutters, the next row cut by the fold so
   it is visibly a column that continues — the "lấp ló" the PDF asks for, in
   the vertical axis the phone already scrolls. No horizontal gesture exists,
   so none can fail. */

function StudyGrid({ products }: { products: Product[] }) {
  return (
    <Phone>
      {/* No scroll container and no clipping of its own: the grid simply runs
          past the bottom of the phone and the frame cuts it, which is the
          "lấp ló" the PDF is describing — a column that visibly continues. */}
      <div className="px-5">
        <div className="grid grid-cols-2 gap-x-3 gap-y-5">
          {products.map((p) => (
            <Tile key={p.id} product={p} width="100%" />
          ))}
        </div>
        <div className="py-5 text-center">
          <span className="inline-flex items-center gap-2 border-b border-white/40 pb-1 text-[13px] text-paper">
            Xem tất cả sản phẩm
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Phone>
  );
}

/* ── C · THẺ — the deck ───────────────────────────────────────────────────
   One product at a time, big, on the project's own spring.

   The landing rule is 21st's Snap Carousel translated into useDragTrack's
   options: a short throw and a hard cap of one card per flick, so the deck
   always stops on the card next to the one you were looking at. Dots and
   arrows are present because at one card per screen there is otherwise
   nothing on screen saying there is more. */

function StudyDeck({ products }: { products: Product[] }) {
  const items = products.slice(0, 8);
  const track = useDragTrack(items.length, {
    response: 0.6,
    decelerationRate: 0.992,
    maxPagesPerFlick: 1,
  });

  return (
    <Phone>
      <div>
        <div
          ref={track.setViewport}
          {...track.handlers}
          /* No padding on the viewport itself. useDragTrack measures the page
             step from el.clientWidth, which includes padding, so a padded
             viewport would step 375px over 335px slides and drift further out
             of true with every page. The gutter goes on the slide instead. */
          /* An explicit height rather than flex-1, so the deck takes the room
             its own card needs — a 335px square plus the caption — instead of
             being stretched to whatever is left of the phone. */
          className={`h-[26.5rem] overflow-hidden touch-pan-y ${
            track.dragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          role="group"
          aria-roledescription="carousel"
          aria-label="Sản phẩm đang có"
        >
          <div
            className="flex h-full"
            style={{ transform: `translate3d(${track.x}px, 0, 0)`, willChange: "transform" }}
          >
            {items.map((p) => (
              <div key={p.id} className="w-full shrink-0 px-5">
                <Tile product={p} width="100%" nameLines={1} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-5 pt-4">
          <div className="flex items-center gap-2">
            {items.map((p, i) => (
              <button
                key={p.id}
                onClick={() => track.goTo(i)}
                aria-label={`Xem sản phẩm ${i + 1}`}
                aria-current={i === track.page}
                className={`h-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  i === track.page ? "w-7 bg-wave" : "w-1.5 bg-white/30"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={track.prev}
              disabled={track.page === 0}
              aria-label="Sản phẩm trước"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/25 text-paper transition-colors hover:border-wave hover:text-wave disabled:opacity-25"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
            </button>
            <button
              onClick={track.next}
              disabled={track.page === items.length - 1}
              aria-label="Sản phẩm sau"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/25 text-paper transition-colors hover:border-wave hover:text-wave disabled:opacity-25"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </Phone>
  );
}

/* ── page ─────────────────────────────────────────────────────────────────── */

const STUDIES = [
  {
    id: "A",
    name: "RÁP — băng đẩy",
    meta: "cuộn ngang của hệ điều hành · 58vw · ~1,7 thẻ/màn",
    Study: StudyRail,
    idea:
      "Trả cử chỉ về cho hệ điều hành. Không có JavaScript nào nằm trên đường đi của ngón tay — đẩy tới đâu chạy tới đó, thả ra thì OS lo quán tính và rubber-band. Thẻ sau luôn ló ra ~125px nên nhìn là biết còn nữa.",
    diffs: [
      "Điều hướng: cuộn ngang thật, không phải transform do JS lái",
      "Mật độ: ~1,7 thẻ/màn — vừa đủ để so hai món cạnh nhau",
      "Chrome: không có dot, không có mũi tên",
    ],
    risk:
      "Không có dot cũng không có mũi tên, nên affordance chỉ nằm ở phần thẻ sau bị cắt — người xem có thể không nhận ra kéo được. Cuộn ngang lồng trong trang cuộn dọc cũng dễ bắt nhầm trục nếu touch-action đặt sai.",
    best: "Khi mục tiêu là lướt nhanh qua nhiều món, và độ tin cậy của cử chỉ là ưu tiên số một.",
    refs: "21st Snap Carousel (peek edges) · .lab-snap-x sẵn có",
  },
  {
    id: "B",
    name: "QUẦY — lưới hai cột",
    meta: "cuộn dọc · 2 cột · 4+ món/màn · theo PDF 31/08",
    Study: StudyGrid,
    idea:
      "Bỏ hẳn cái băng. Hai cột, gutter hẹp, hàng sau bị fold cắt ngang nên rõ ràng là một cột còn tiếp — đúng \"lấp ló\" mà PDF nói, nhưng theo trục dọc mà điện thoại vốn đã cuộn. Đây là layout Shopee mà PDF 31/08 dẫn chiếu.",
    diffs: [
      "Điều hướng: bỏ hoàn toàn cử chỉ ngang — không có gì để hỏng",
      "Mật độ: cao nhất, 4+ món hiện cùng lúc",
      "Nhấn mạnh: so sánh nhiều món, thay vì ngắm từng món",
    ],
    risk:
      "Section thôi không còn là 'băng chạy' nữa — mất luôn chữ ký hai lane ngược chiều trên mobile, và bắt đầu giẫm chân /products. Trang chủ cũng dài thêm đáng kể.",
    best: "Khi trang chủ cần bán được độ rộng của catalogue, và khi lo nhất là cử chỉ vuốt không đáng tin.",
    refs: "PDF 31/08 (\"tham khảo layout của shopee\") · 21st Product Image Card",
  },
  {
    id: "C",
    name: "THẺ — từng món một",
    meta: "spring có kiểm soát · 1 thẻ/màn · dot + mũi tên + bàn phím",
    Study: StudyDeck,
    idea:
      "Mỗi lần một món, ảnh lớn. Dùng đúng useDragTrack của project nhưng siết lại theo luật của Snap Carousel bên 21st: throw ngắn, và chặn cứng một thẻ mỗi lần vuốt, nên deck luôn dừng ở thẻ ngay cạnh thẻ đang xem — không bao giờ trượt qua ba món.",
    diffs: [
      "Điều hướng: phân trang có kiểm soát, không phải cuộn tự do",
      "Mật độ: thấp nhất, 1 thẻ/màn, ảnh to nhất",
      "Chrome: có dot, có mũi tên, và điều khiển được bằng bàn phím",
    ],
    risk:
      "Chậm nhất để lướt: 8 món là 8 lần vuốt. Ảnh to mỗi màn cũng nặng dữ liệu hơn. Và đây là hướng duy nhất đặt JS trở lại đường đi của ngón tay — tức là hướng duy nhất có thể tái diễn đúng lỗi 31/08 nếu render bị chậm.",
    best: "Khi trang chủ là chỗ trưng bày chứ không phải chỗ tra catalogue, và mỗi món xứng đáng được nhìn kỹ.",
    refs: "21st Snap Carousel id 23559 (momentum .14, maxFlick 1) · useDragTrack",
  },
];

export default function StoreRailStudies() {
  const { loading, popular } = useHomeData();

  return (
    <LabShell
      eyebrow="05 · WHAT'S IN STORE"
      title="Băng sản phẩm trên điện thoại"
      notes={
        <>
          <p>
            Feedback 31/08 hỏi hai thứ: rework kích cỡ ảnh sản phẩm cho mobile, và
            swipe cho thuận tiện. Còn PDF thì nói thêm về grid — "không để nhiều
            khoảng trắng, luôn để sp sau lấp ló, tham khảo layout của shopee".
          </p>
          <p>
            Phần <em>hỏng</em> thì đã rõ và đang sửa ở nhánh riêng: lane hiện tại là
            một marquee CSS nằm trong <code>overflow-x: hidden</code>, nên không hề
            có gì để kéo; và rule pause bám <code>:hover</code>, thứ mà một cú chạm
            sẽ set rồi giữ luôn — nên cử chỉ duy nhất có được lại thành nút dừng.
          </p>
          <p>
            Phần <strong>chưa ngã ngũ</strong> là câu hỏi nằm dưới nó: trên điện
            thoại, khu này là một băng để đẩy, một lưới để quét, hay từng món một?
            Ba phương án dưới đây là ba câu trả lời cho câu đó — khác nhau ở mô hình
            điều hướng, mật độ và chrome, chứ không phải khác nhau ở con số.
          </p>
          <p className="text-ink/55">
            Giữ cố định ở cả ba: sản phẩm Approved thật, ảnh vuông theo quyết định
            26/08, tên shop + tên món + giá trên mọi thẻ, PRICE_NOTE nguyên văn, chỉ
            dùng token brand, và tôn trọng prefers-reduced-motion.
          </p>
        </>
      }
    >
      {loading || popular.length === 0 ? (
        <div className="mx-auto max-w-[92rem] px-5 py-16 text-sm text-ink/50 md:px-10">
          Đang tải sản phẩm thật…
        </div>
      ) : (
        <>
          {STUDIES.map(({ id, name, meta, Study, idea, diffs, risk, best, refs }) => (
            <LabFrame key={id} label={`${id} · ${name}`} meta={meta}>
              <div className="mx-auto max-w-[92rem] px-5 pb-12 md:px-10">
                <div className="flex flex-wrap items-start gap-8">
                  <Study products={popular} />

                  <div className="min-w-[18rem] flex-1 space-y-4">
                    <div>
                      <p className="label text-ink/45">Ý TƯỞNG</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink/75">{idea}</p>
                    </div>
                    <div>
                      <p className="label text-ink/45">KHÁC Ở ĐÂU</p>
                      <ul className="mt-1 space-y-1 text-sm leading-relaxed text-ink/75">
                        {diffs.map((d) => (
                          <li key={d} className="flex gap-2">
                            <span className="text-brand">·</span>
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="label text-ink/45">RỦI RO</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink/75">{risk}</p>
                    </div>
                    <div>
                      <p className="label text-ink/45">HỢP KHI</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink/75">{best}</p>
                    </div>
                    <div>
                      <p className="label text-ink/45">THAM CHIẾU</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink/60">{refs}</p>
                    </div>
                  </div>
                </div>
              </div>
            </LabFrame>
          ))}

          <LabFrame label="ĐỀ XUẤT" meta="chọn một, tôi gộp vào Homepage">
            <div className="mx-auto max-w-[70ch] px-5 pb-20 text-sm leading-relaxed text-ink/75 md:px-10">
              <p>
                <strong className="text-ink">A — Ráp</strong> là phương án tôi đề
                xuất, và lý do là rủi ro chứ không phải thẩm mỹ. Feedback 31/08 là
                một cử chỉ <em>không chạy được</em>; A là phương án duy nhất bỏ hẳn
                JavaScript ra khỏi đường đi của ngón tay, nên nó cũng là phương án
                duy nhất không thể tái diễn đúng lỗi đó. C đưa JS trở lại — vẫn tốt,
                nhưng là thứ vừa mới hỏng.
              </p>
              <p className="mt-3">
                A cũng giữ được khu này đúng bản chất một <em>băng</em>, tức là vẫn
                cùng ngôn ngữ với hai lane ngược chiều trên desktop. Rủi ro thật của
                A là affordance: không dot, không mũi tên. Nếu team thấy lo, thêm một
                hàng dot vào A rẻ hơn nhiều so với đổi sang C.
              </p>
              <p className="mt-3">
                <strong className="text-ink">B — Quầy</strong> đáng chọn nếu team đọc
                ý "tham khảo layout của shopee" trong PDF là dành cho <em>chính khu
                này</em> chứ không riêng trang /products. Nó cho mật độ cao nhất và
                không có cử chỉ nào để hỏng — nhưng đổi lại mất chữ ký băng chạy trên
                mobile, và bắt đầu giẫm chân /products.
              </p>
              <p className="mt-6">
                <Link to="/lab" className="font-semibold text-brand hover:underline">
                  ← Về Lab
                </Link>
              </p>
            </div>
          </LabFrame>
        </>
      )}
    </LabShell>
  );
}
