/* No @types/react in the project, so the React namespace has to be pulled in
   explicitly before React.ReactNode resolves — same note as labShared.tsx. */
import type React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { LabShell, LabFrame } from "./labShared";
import { useHomeData, LANDSCAPE_SPEC } from "../home/homeData";

/**
 * Hero deck — aspect ratio on mobile.
 *
 * Team 31/08: "Aspect ratio của Hero deck trên mobile đang khác với trên PC.
 * Tuy nhiên hãy đưa vào lab và thí nghiệm với nhiều giải pháp khác nhau cho
 * aspect ratio, xem thế nào là tối ưu nhất cho mobile."
 *
 * The shipped deck is 4:5 on phones, 16:10 from sm, 16:9 from lg. The jump is
 * deliberate — a 16:9 card on a 375px phone is 188px tall, which is 23% of the
 * screen — but it means the frame a shop submits is not the frame a phone
 * shows, and the note is right that the two no longer agree.
 *
 * The tension is real and it does not have a free answer:
 *
 *   · Every hero image is specified 16:9 (design.json, "Every shop image slot
 *     is landscape 16:9 ≥1600px"). A phone-shaped card must therefore crop it.
 *   · object-cover on a box narrower than 16:9 crops the *sides*. At 4:5 the
 *     visitor sees 45% of the width the shop framed. Whatever is at the edges
 *     of the shop's photograph is simply not on the page.
 *   · But a true 16:9 card on a phone leaves the hero a strip, and the deck is
 *     the first thing on the site.
 *
 * So the four studies below are four different answers to "what gives", not
 * four ratios. Each one is measured, not described: the numbers under each
 * frame are computed from the rendered box, so they cannot drift from what is
 * actually on screen.
 *
 * References
 *   Pulled with the 21st CLI on 31/08, once it authenticated — the first pass
 *   at this study had none, because `21st search --context auto` was answering
 *   401 and the directions were grounded only in the project's own context.
 *
 *   Consulted at search level (component code on 21st is paid, and the day's
 *   free reads went to the Snap Carousel behind /lab/store, so none of these
 *   were opened — they informed which shapes were worth trying, not any line
 *   of the code below):
 *     · "Stacked Card Carousel" (shadcnspace, id 21516) — the closest match to
 *       the deck this study varies.
 *     · "Arc Gallery Hero Component" (minhxthanh) and "Hero Preview Walls"
 *       (ruixen.ui) — hero decks that let the frame, rather than the
 *       photograph, decide the ratio, which is what direction B does.
 *
 *   The binding constraint is the project's own and is recorded in
 *   .21st/design.json: every shop image slot is 16:9, ≥1600px.
 *
 * Nothing here is imported by src/views.
 */

const PHONE_W = 375;
const GUTTER = 20; // px-5, as the live hero uses
const CARD_W = PHONE_W - GUTTER * 2;
const SOURCE_AR = 16 / 9;

/** What object-cover keeps of a 16:9 source when the box is `ar` wide. */
function keptWidthPct(ar: number): number {
  return Math.min(1, ar / SOURCE_AR) * 100;
}

function Measure({
  ar,
  note,
  keptOverride,
}: {
  ar: number;
  note: string;
  /* Study B crops nothing, but its card ratio is not its photo ratio, so the
     kept figure cannot be derived from the card the way it can everywhere
     else. */
  keptOverride?: number;
}) {
  const h = Math.round(CARD_W / ar);
  const kept = keptOverride ?? keptWidthPct(ar);
  const screen = Math.round((h / 812) * 100);

  return (
    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] sm:grid-cols-4">
      {[
        /* trim trailing zeros *and* the dot they leave behind — 1.000 became
           "1." before this */
        ["Tỉ lệ khung", ar.toFixed(3).replace(/\.?0+$/, "") + " : 1"],
        ["Cao trên 375px", `${h}px · ${screen}% màn hình`],
        ["Giữ được của ảnh 16:9", `${kept.toFixed(0)}% chiều ngang`],
        ["Đánh đổi", note],
      ].map(([k, v]) => (
        <div key={k}>
          <dt className="uppercase tracking-[0.12em] text-ink/40">{k}</dt>
          <dd className="mt-0.5 font-medium text-ink/80">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A 375×812 phone, so every option is judged at the size it is argued about. */
function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[2rem] bg-brand ring-1 ring-ink/15"
      style={{ width: PHONE_W, height: 812 }}
    >
      {/* the header pill's clearance, so the card sits where it really sits */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-30 h-14 rounded-full bg-ink/35 backdrop-blur-md" />
      {children}
    </div>
  );
}

type Frame = ReturnType<typeof useHomeData>["heroFrames"][number];

/** The attribution pill and the beads, lifted from the live deck. */
function Chrome({
  frame,
  index,
  count,
  onPick,
  tone = "over",
}: {
  frame: Frame;
  index: number;
  count: number;
  onPick: (i: number) => void;
  /** "over" floats on the photograph; "under" sits on the violet below it. */
  tone?: "over" | "under";
}) {
  return (
    <div
      className={`flex flex-wrap items-end justify-between gap-3 ${
        tone === "over" ? "p-3" : "px-1 pt-3"
      }`}
    >
      <span className="inline-flex items-center gap-3 rounded-full bg-paper py-2 pl-2 pr-4 text-ink">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-wave text-[13px] font-black text-ink">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="text-left">
          <span className="block text-[13px] font-black leading-tight">{frame.shopName}</span>
          <span className="block text-[10px] font-medium text-ink/55">
            {frame.awaitingUpload ? `Chờ ảnh ${LANDSCAPE_SPEC}` : frame.caption}
          </span>
        </span>
        <ArrowUpRight className="h-4 w-4 text-brand" />
      </span>

      <span
        className={`flex items-center gap-2 rounded-full p-2 ${
          tone === "over" ? "bg-ink/40 backdrop-blur-md" : "bg-white/12"
        }`}
      >
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            onClick={() => onPick(i)}
            aria-label={`Ảnh ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-500 ${
              i === index ? "w-7 bg-wave" : "w-2 bg-white/45"
            }`}
          />
        ))}
      </span>
    </div>
  );
}

/** The stacked-card deck itself, at whatever ratio the study hands it. */
function Deck({
  frames,
  active,
  ar,
  /** "cover" crops to fill the card; "contain" shows the whole 16:9 frame. */
  fit = "cover",
}: {
  frames: Frame[];
  active: number;
  ar: number;
  fit?: "cover" | "contain";
}) {
  const count = frames.length;

  return (
    <div className="relative w-full" style={{ aspectRatio: String(ar) }}>
      {frames.map((f, i) => {
        const rel = (i - active + count) % count;
        const style =
          rel === 0
            ? { transform: "translate3d(0,0,0) rotate(0deg) scale(1)", opacity: 1, zIndex: 30 }
            : rel === 1
              ? {
                  transform: "translate3d(2.2%,-2.4%,0) rotate(2.2deg) scale(0.955)",
                  opacity: 1,
                  zIndex: 20,
                }
              : rel === 2
                ? {
                    transform: "translate3d(-2.2%,-4%,0) rotate(-2.4deg) scale(0.915)",
                    opacity: 1,
                    zIndex: 10,
                  }
                : { transform: "translate3d(0,-5%,0) scale(0.9)", opacity: 0, zIndex: 0 };

        return (
          <figure
            key={f.id}
            className="absolute inset-0 m-0 overflow-hidden rounded-[1.5rem] bg-brand-deep ring-1 ring-white/15"
            style={{ ...style, transition: "transform 760ms var(--ease-brand), opacity 420ms ease" }}
          >
            <img
              src={f.src}
              alt=""
              className={`h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"}`}
            />
            {rel === 0 && fit === "cover" && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink/70 to-transparent"
              />
            )}
          </figure>
        );
      })}
    </div>
  );
}

/* ── the four studies ─────────────────────────────────────────────────────
   Each is a different answer to "the source is 16:9 and the screen is not",
   and each differs from the others on more than its ratio: where the card's
   chrome lives, whether the photograph is cropped at all, and whether the
   ratio is a step or a curve. */

function StudyTrueSixteenNine({ frames }: { frames: Frame[] }) {
  const [active, setActive] = useState(0);
  return (
    <Phone>
      <div className="absolute inset-x-0 top-[6.5rem] px-5">
        <Deck frames={frames} active={active} ar={16 / 9} />
        {/* the chrome cannot overlay a 188px card without covering it, so it
            comes off the photograph and onto the violet underneath */}
        <Chrome
          frame={frames[active]}
          index={active}
          count={frames.length}
          onPick={setActive}
          tone="under"
        />
      </div>
    </Phone>
  );
}

function StudyFramedPhoto({ frames }: { frames: Frame[] }) {
  const [active, setActive] = useState(0);
  const frame = frames[active];
  return (
    <Phone>
      <div className="absolute inset-x-0 top-[6.5rem] px-5">
        {/* The card is phone-shaped, but the photograph inside it is not
            cropped: it keeps 16:9 and the violet card carries the rest. */}
        {/* Square, not 4:5. At 4:5 the uncropped 16:9 photo is 188px of a
            419px card and the violet band under it is 231px — bigger than the
            photograph, which reads as a hole rather than as a caption. A 1:1
            card puts the band at 147px: enough for the shop name, the caption
            and the beads, and nothing left over. */}
        <div
          className="relative w-full overflow-hidden rounded-[1.5rem] bg-brand-deep ring-1 ring-white/15"
          style={{ aspectRatio: "1 / 1" }}
        >
          <div className="flex h-full flex-col">
            <div className="w-full shrink-0" style={{ aspectRatio: "16 / 9" }}>
              <img src={frame.src} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-1 flex-col justify-end gap-2 p-4">
              <p className="display text-[1.5rem] normal-case leading-[1.1] text-paper">
                {frame.shopName}
              </p>
              <div className="flex items-end justify-between gap-3">
                <span className="max-w-[64%] text-[11px] leading-snug text-white/70">
                  {frame.awaitingUpload ? `Chờ ảnh ${LANDSCAPE_SPEC}` : frame.caption}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {frames.map((f, i) => (
                    <button
                      key={f.id}
                      onClick={() => setActive(i)}
                      aria-label={`Ảnh ${i + 1}`}
                      className={`h-2 rounded-full transition-all duration-500 ${
                        i === active ? "w-7 bg-wave" : "w-2 bg-white/45"
                      }`}
                    />
                  ))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Phone>
  );
}

function StudyProgressive({ frames }: { frames: Frame[] }) {
  const [active, setActive] = useState(0);
  /* 5:4 is where the interpolation lands at 375px. The rule itself is a clamp
     on the ratio rather than three breakpoint steps, so there is no jump
     between a phone, a tablet and a laptop — see the note under this frame. */
  return (
    <Phone>
      <div className="absolute inset-x-0 top-[6.5rem] px-5">
        <Deck frames={frames} active={active} ar={5 / 4} />
        <div className="absolute inset-x-5 bottom-0 translate-y-full">
          <Chrome
            frame={frames[active]}
            index={active}
            count={frames.length}
            onPick={setActive}
            tone="under"
          />
        </div>
      </div>
    </Phone>
  );
}

function StudyCurrent({ frames }: { frames: Frame[] }) {
  const [active, setActive] = useState(0);
  return (
    <Phone>
      <div className="absolute inset-x-0 top-[6.5rem] px-5">
        <div className="relative">
          <Deck frames={frames} active={active} ar={4 / 5} />
          <div className="absolute inset-x-0 bottom-0 z-40">
            <Chrome
              frame={frames[active]}
              index={active}
              count={frames.length}
              onPick={setActive}
            />
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
    name: "CHUẨN — một tỉ lệ cho mọi màn",
    ar: 16 / 9,
    meta: "16:9 ở mọi khổ · chrome nằm dưới ảnh",
    Study: StudyTrueSixteenNine,
    tradeoff: "hero chỉ cao 23% màn",
    idea:
      "Điện thoại dùng đúng tỉ lệ của PC. Shop gửi ảnh 16:9 thì người xem thấy đúng khung đó, không cắt một pixel nào. Đổi lại thẻ chỉ cao 188px trên máy 375px, nên phần chrome không thể nằm đè lên ảnh nữa mà phải xuống dưới nền tím.",
    risk:
      "Hero là thứ đầu tiên của trang mà lại mỏng nhất. Khoảng tím trống phía dưới rất nhiều — cần thêm nội dung vào đó, nếu không trang mở ra bị hụt.",
    best: "Khi ảnh shop là thứ phải giữ nguyên vẹn, và có nội dung khác lấp phần dưới.",
  },
  {
    id: "B",
    name: "KHUNG ẢNH — thẻ vuông, ảnh vẫn 16:9",
    ar: 1,
    keptOverride: 100,
    meta: "thẻ 1:1 · ảnh 16:9 bên trong · tên shop trong thẻ",
    Study: StudyFramedPhoto,
    tradeoff: "không cắt ảnh, hero cao gấp đôi A",
    idea:
      "Tách hai tỉ lệ ra: thẻ theo màn hình, ảnh theo nguồn (16:9). Dải tím còn lại trong thẻ mang tên shop và caption — đúng chỗ mà phương án A phải bỏ trống, và đúng thứ mà bản hiện tại đang phải đè lên ảnh bằng gradient tối. Người xem thấy trọn ảnh shop gửi.",
    risk:
      "Thẻ không còn là 'một tấm ảnh' mà là một tấm thiệp. Thử 4:5 trước thì dải tím cao 231px, lớn hơn cả tấm ảnh 188px, nhìn như một lỗ thủng — nên thẻ phải vuông chứ không thể cao bằng bản hiện tại. Ảnh shop tối màu sẽ lộ ranh giới ảnh / nền tím.",
    best: "Khi giữ trọn ảnh 16:9 là bắt buộc, mà hero 23% màn của A thì mỏng quá.",
  },
  {
    id: "C",
    name: "CẮT DẦN — tỉ lệ chạy theo bề ngang",
    ar: 5 / 4,
    meta: "16:9 → 5:4 liên tục, không có bước nhảy",
    Study: StudyProgressive,
    tradeoff: "cắt 30% ảnh, không có bước nhảy",
    idea:
      "Giữ nguyên cách làm hiện tại nhưng bỏ ba mốc breakpoint. Tỉ lệ là một hàm liên tục của bề ngang — aspect-ratio: clamp(1.25, (100vw - 20rem) / 30rem + 1.25, 1.7778) — nên không có chỗ nào tỉ lệ nhảy từ 16:9 xuống 4:5 chỉ vì lệch 1px.",
    risk:
      "Vẫn cắt ảnh, chỉ là cắt ít hơn 4:5 (giữ 70% thay vì 45%). Không giải quyết được việc 'khác với PC', chỉ làm cho sự khác đó mượt.",
    best: "Khi chấp nhận có cắt, nhưng muốn bỏ cảm giác gãy giữa các khổ máy.",
  },
  {
    id: "D",
    name: "HIỆN TẠI — 4:5, để đối chiếu",
    ar: 4 / 5,
    meta: "đang chạy trên production · chrome đè lên ảnh",
    Study: StudyCurrent,
    tradeoff: "cắt mất 55% bề ngang ảnh",
    idea:
      "Bản đang chạy, để ở đây làm mốc so sánh chứ không phải một đề xuất. Thẻ 4:5 lấp đầy màn, chrome đè lên ảnh với một lớp gradient tối.",
    risk:
      "object-cover trên khung hẹp hơn 16:9 thì cắt hai bên: người xem chỉ còn thấy 45% bề ngang mà shop đã căn khung. Đây chính là điều feedback 31/08 chỉ ra.",
    best: "—",
  },
];

export default function HeroRatioStudies() {
  const { loading, heroFrames } = useHomeData();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading && heroFrames.length > 0) setReady(true);
  }, [loading, heroFrames]);

  return (
    <LabShell
      eyebrow="04 · HERO DECK"
      title="Tỉ lệ khung hero trên điện thoại"
      notes={
        <>
          <p>
            Feedback 31/08: tỉ lệ hero trên điện thoại đang khác PC. Đúng — bản đang
            chạy là 4:5 ở phone, 16:10 từ sm, 16:9 từ lg.
          </p>
          <p>
            Gốc của vấn đề không phải chọn con số nào, mà là: <strong>mọi ảnh hero
            đều được quy định 16:9</strong> (design.json), trong khi màn điện thoại
            thì dọc. Khung hẹp hơn 16:9 thì <code>object-cover</code> cắt hai bên —
            ở 4:5 người xem chỉ còn thấy 45% bề ngang mà shop đã căn.
          </p>
          <p>
            Bốn phương án dưới đây là bốn cách trả lời câu "phải hy sinh cái gì",
            không phải bốn con số. Mọi số đo đều tính từ khung 375×812 thật bên
            dưới, không phải ước lượng.
          </p>
        </>
      }
    >
      {!ready ? (
        <div className="mx-auto max-w-[92rem] px-5 py-16 text-sm text-ink/50 md:px-10">
          Đang tải ảnh thật…
        </div>
      ) : (
        <>
          {STUDIES.map(({ id, name, meta, ar, Study, idea, risk, best, tradeoff, keptOverride }) => (
            <LabFrame key={id} label={`${id} · ${name}`} meta={meta}>
              <div className="mx-auto max-w-[92rem] px-5 pb-12 md:px-10">
                <div className="flex flex-wrap items-start gap-8">
                  <Study frames={heroFrames} />

                  <div className="min-w-[18rem] flex-1 space-y-4">
                    <div>
                      <p className="label text-ink/45">Ý TƯỞNG</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink/75">{idea}</p>
                    </div>
                    <div>
                      <p className="label text-ink/45">RỦI RO</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink/75">{risk}</p>
                    </div>
                    <div>
                      <p className="label text-ink/45">HỢP KHI</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink/75">{best}</p>
                    </div>
                    <Measure ar={ar} note={tradeoff} keptOverride={keptOverride} />
                  </div>
                </div>
              </div>
            </LabFrame>
          ))}

          <LabFrame label="ĐỀ XUẤT" meta="chọn một, tôi gộp vào Homepage">
            <div className="mx-auto max-w-[70ch] px-5 pb-20 text-sm leading-relaxed text-ink/75 md:px-10">
              <p>
                <strong className="text-ink">B — Khung ảnh</strong> là phương án tôi
                đề xuất. Nó là phương án duy nhất trả lời được cả hai vế của
                feedback cùng lúc: người xem trên điện thoại thấy <em>đúng khung
                16:9</em> mà shop gửi, giống hệt PC, mà hero vẫn cao bằng bản hiện
                tại nên trang không bị hụt lúc mở ra.
              </p>
              <p className="mt-3">
                Phần nền tím dưới ảnh không phải chỗ trống phải lấp — nó là chỗ đặt
                tên shop và caption, thứ mà bản hiện tại đang phải đè lên ảnh bằng
                một lớp gradient tối. Bỏ được lớp gradient đó là bớt được một thứ
                che ảnh.
              </p>
              <p className="mt-3">
                Nếu team thấy thẻ dọc kiểu "tấm thiệp" không hợp, thì{" "}
                <strong className="text-ink">C — Cắt dần</strong> là lựa chọn an
                toàn: giữ nguyên ngôn ngữ hiện tại, chỉ bỏ bước nhảy giữa các khổ
                máy và giảm phần bị cắt từ 55% xuống 30%.
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
