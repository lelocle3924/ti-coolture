/* No @types/react in this project — see the note in labShared.tsx. */
import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, StarIcon, X } from "lucide-react";
import { LabShell, LabFrame, Spec } from "./labShared";
import { formatPrice, useHomeData } from "../home/homeData";
import type { Product } from "../types";

/**
 * Viên ngọc ẩn — three ways to make the card and the star tab one object.
 *
 * Team 07/09: "Đưa 3 option redesign thẻ full để liên kết thẻ full và tab
 * ngôi sao (1 tiềm năng là trượt ra như 1 bookmark dính liền với mép phải như
 * trong hình.) LƯU Ý là tôi cần kỹ năng thiết kế của bạn, chứ không phải nghe
 * theo tôi 1 cách mù quáng."
 *
 * So: the sketch is here as A, built properly rather than approximated — and
 * the note is taken at its word, which means saying where I think it costs
 * something, and putting two other answers beside it that pay differently.
 *
 * What is actually broken today is worth naming, because all three fix it and
 * they fix it differently. The tab is a teal 48×56 chip fixed to the right
 * edge at 50% height. The card is a 340px white panel at bottom-6 right-6.
 * They share no edge, no colour, no corner and no position, and the tab is
 * unmounted the moment the card appears. Nothing on screen says the second
 * came out of the first.
 *
 * Three different things can carry that link:
 *
 *   A — a shared body.   The tab is welded to the card; one object moves.
 *   B — a shared origin. The card is unrolled out of the tab's own edge.
 *   C — a shared mark.   The star travels and becomes the card's badge.
 *
 * Each demo runs in a stage rather than over the real page, so the object can
 * be opened and closed as often as it takes to judge.
 *
 * Nothing here is imported by src/views.
 */

const STAGE_H = 380;

/** A slice of page for the object to sit on the edge of. */
function Stage({
  children,
  /** C measures the card against this box to find where the star lands. */
  innerRef,
}: {
  children: React.ReactNode;
  innerRef?: { current: HTMLDivElement | null };
}) {
  return (
    <div
      ref={innerRef}
      className="relative w-full overflow-hidden bg-brand"
      style={{ height: STAGE_H }}
    >
      <div className="absolute inset-0 grid grid-cols-3 gap-4 p-6 opacity-60">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white/10" />
        ))}
      </div>
      {children}
    </div>
  );
}

/** The body of the card. Identical in all three, so only the join differs. */
function GemBody({
  gem,
  onClose,
  /** A — the star is on the tab, so the badge would say it twice. */
  badge = true,
  tone = "paper",
}: {
  gem: { product: Product; note: string };
  /** Omitted where the tab itself is the close control (B). */
  onClose?: () => void;
  badge?: boolean;
  tone?: "paper" | "wave";
}) {
  return (
    <>
      <div className="relative aspect-video overflow-hidden bg-paper-warm">
        <img
          src={gem.product.images[0]}
          alt={gem.product.name}
          className="h-full w-full object-cover"
        />
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/55 text-paper backdrop-blur-md transition-colors hover:bg-black"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {badge && (
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
              tone === "wave" ? "bg-wave text-ink" : "bg-brand text-paper"
            }`}
          >
            ✦ Tí chọn
          </span>
        )}
      </div>

      <div className="space-y-1.5 p-4 text-left">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-[11px] font-semibold uppercase tracking-wider text-brand">
            {gem.product.storeName}
          </span>
          <span className="shrink-0 text-sm font-bold text-ink">
            {formatPrice(gem.product.price)}
          </span>
        </div>
        <h4 className="line-clamp-1 text-base font-medium leading-snug text-ink">
          {gem.product.name}
        </h4>
        <p className="line-clamp-2 text-xs italic text-ink/70">
          &ldquo;{gem.note || "Tác phẩm được ban biên tập Tí tuyển chọn."}&rdquo;
        </p>
        <span className="flex items-center justify-between pt-1.5 text-xs font-semibold text-brand">
          Xem tác phẩm
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </>
  );
}

/* ── A · DẤU TRANG — one body, welded to the edge ─────────────────────────
   The sketch from page 2 of the feedback, built as drawn: the star tab is not
   near the card, it is part of it — the card's own leading corner, sticking
   out past its left edge the way a bookmark's tongue sticks out of a book.
   Closed, the whole object is parked off the right edge with only the tongue
   showing. Open, the object slides left as one rigid body.

   Being one body is the whole argument. There is a single transform, so the
   two can never be seen apart, and pressing the tongue when it is open pushes
   the object back out — the same handle, both ways.

   The card is edge-flush: square on the right, rounded on the left. That is
   what makes the sketch read as an object attached to the page's edge rather
   than a floating card that happens to be near it. It is also the cost — see
   the risk note. */

function StudyBookmark({ gem }: { gem: { product: Product; note: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <Stage>
      {/* No -translate-y-1/2 here. Tailwind v4 compiles that to the standalone
          `translate` property, which composes with `transform` instead of
          being overridden by it — the object landed a whole height too high.
          The vertical centring is part of the inline transform instead. */}
      <div
        /* items-start, so the tongue is a chip at the card's leading corner
           rather than a full-height slab down its side. That is what the
           sketch draws, and it is also what makes the closed state read as a
           bookmark peeking out rather than as a teal bar bolted to the page. */
        className="absolute right-0 top-1/2 z-30 flex w-[19rem] items-start will-change-transform"
        style={{
          transform: open
            ? "translate3d(0, -50%, 0)"
            : "translate3d(calc(100% - 3rem), -50%, 0)",
          transition: "transform 560ms var(--ease-brand)",
        }}
      >
        {/* the tongue — the handle, and the only thing showing when closed */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Đóng viên ngọc ẩn" : "Viên ngọc ẩn — xem sản phẩm Tí chọn"}
          className="grid h-14 w-12 shrink-0 place-items-center rounded-l-2xl bg-wave text-ink"
        >
          <StarIcon className="h-6 w-6" />
        </button>
        {/* Square on the right: the card is attached to the edge, not near it.
            The teal outline is the sketch's own — it is what stops the chip
            reading as a separate object stuck to a white panel. */}
        <div className="min-w-0 flex-1 overflow-hidden rounded-l-none bg-paper shadow-[0_20px_50px_rgba(18,8,31,0.4)] ring-2 ring-wave">
          <GemBody gem={gem} onClose={() => setOpen(false)} badge={false} />
        </div>
      </div>
    </Stage>
  );
}

/* ── B · MỞ RA TỪ TAB — one origin, unrolled ──────────────────────────────
   The tab does not move at all. The card is revealed out of its left edge:
   the panel's transform-origin is the tab's own edge and it scales from 0 on
   x only, so the card is literally unrolled out of the chip, the way a blind
   comes down out of its housing.

   scaleX would stretch the photograph, so what scales is a clipping wrapper
   and the contents inside it counter-scale — the card's own layout never
   distorts, only the window onto it grows. That is the difference between an
   unroll and a squash, and it is the whole reason this is worth building
   rather than faking with a width transition (which would relayout the
   photograph on every frame).

   The tab keeps its position and becomes the close control, so the thing you
   pressed is still exactly where you left it. */

function StudyUnroll({ gem }: { gem: { product: Product; note: string } }) {
  const [open, setOpen] = useState(false);
  const CARD_W = 272; // px — the width the wrapper unrolls to

  return (
    <Stage>
      <div
        className="absolute right-0 top-1/2 z-30 flex items-center"
        style={{ transform: "translateY(-50%)" }}
      >
        {/* the window: scales on x from the tab's edge */}
        <div
          className="overflow-hidden will-change-transform"
          style={{
            width: CARD_W,
            transformOrigin: "100% 50%",
            transform: `scaleX(${open ? 1 : 0})`,
            transition: "transform 520ms var(--ease-brand)",
          }}
        >
          {/* the contents: counter-scaled, so only the window grows */}
          <div
            className="overflow-hidden rounded-l-[1.25rem] bg-paper shadow-[0_20px_50px_rgba(18,8,31,0.4)]"
            style={{
              width: CARD_W,
              transformOrigin: "100% 50%",
              transform: `scaleX(${open ? 1 : 12})`,
              transition: "transform 520ms var(--ease-brand)",
            }}
          >
            {/* No close button on the image: the tab is the close control,
                and two of them on one card is one too many. */}
            <GemBody gem={gem} badge tone="wave" />
          </div>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Đóng viên ngọc ẩn" : "Viên ngọc ẩn — xem sản phẩm Tí chọn"}
          className="grid h-14 w-12 shrink-0 place-items-center rounded-l-2xl bg-wave text-ink shadow-2xl"
          style={{
            /* the housing squares off against the card while it is open, so
               the two read as one piece rather than a chip beside a panel */
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
          }}
        >
          {open ? <X className="h-5 w-5" /> : <StarIcon className="h-6 w-6" />}
        </button>
      </div>
    </Stage>
  );
}

/* ── C · NGÔI SAO ĐI THEO — one mark, carried ─────────────────────────────
   Neither body nor origin: the link is the star itself. The tab's star flies
   from the edge to the card's badge and becomes the "✦ Tí chọn" chip, while
   the card comes up under it. Closing sends the star back to the edge.

   This is the site's own language rather than a new one — src/lib/continuity
   already moves a product's photograph between pages so the object survives
   the navigation. The gem is the same idea at a smaller scale: the mark is
   the constant, and everything else is staging around it.

   It is also the only one of the three that does not tie the card to the
   right edge, which is why it is the only one that can keep the card's
   present shape and position. */

/** The star's resting size at each end, in px. */
const STAR_PARKED = { w: 48, h: 56 };
const STAR_LANDED = { w: 28, h: 28 };
/** Inset of the badge slot from the card's own top-left corner. */
const BADGE_INSET = 12;

function StudyTravellingStar({ gem }: { gem: { product: Product; note: string } }) {
  const [open, setOpen] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  /* Where the badge slot actually is, measured rather than guessed. The card's
     height depends on how long the shop's name and the editor's note run, so a
     hardcoded landing point is wrong for every gem but the one it was tuned
     on — which is exactly what it was. */
  const [slot, setSlot] = useState({ right: 268, top: 96 });

  useLayoutEffect(() => {
    const measure = () => {
      const s = stage.current;
      const c = card.current;
      if (!s || !c) return;
      /* offsetLeft/offsetTop, not getBoundingClientRect: the card carries a
         12px translate while it is closed, and a rect would fold that into
         the measurement and land the star 12px low. The stage is the offset
         parent, so these are already stage coordinates. */
      setSlot({
        right: s.offsetWidth - (c.offsetLeft + BADGE_INSET) - STAR_LANDED.w,
        top: c.offsetTop + BADGE_INSET,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const at = open
    ? { right: slot.right, top: `${slot.top}px`, ty: "0%", ...STAR_LANDED }
    : { right: 0, top: "50%", ty: "-50%", ...STAR_PARKED };

  return (
    <Stage innerRef={stage}>
      <div
        ref={card}
        className="absolute bottom-4 right-4 z-20 w-[17rem] overflow-hidden rounded-[1.5rem] bg-paper shadow-[0_20px_50px_rgba(18,8,31,0.4)] will-change-transform"
        style={{
          transform: open ? "translateY(0)" : "translateY(12px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "transform 480ms var(--ease-brand) 90ms, opacity 260ms ease 90ms",
        }}
      >
        <GemBody gem={gem} onClose={() => setOpen(false)} badge={false} />
      </div>

      {/* the mark — one element, two homes */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Đóng viên ngọc ẩn" : "Viên ngọc ẩn — xem sản phẩm Tí chọn"}
        className="absolute z-30 grid place-items-center bg-wave text-ink shadow-2xl will-change-transform"
        style={{
          right: at.right,
          top: at.top,
          transform: `translateY(${at.ty})`,
          height: at.h,
          width: at.w,
          borderRadius: open ? 999 : "1rem 0 0 1rem",
          transition:
            "right 520ms var(--ease-brand), top 520ms var(--ease-brand), height 520ms var(--ease-brand), width 520ms var(--ease-brand), border-radius 520ms ease, transform 520ms var(--ease-brand)",
        }}
      >
        <StarIcon className={open ? "h-3.5 w-3.5" : "h-6 w-6"} />
      </button>
    </Stage>
  );
}

/* ── page ─────────────────────────────────────────────────────────────────── */

const STUDIES = [
  {
    id: "A",
    name: "DẤU TRANG — một thân, dính vào mép",
    meta: "1 transform · 560ms · thẻ vuông cạnh phải · lưỡi 3rem thò ra",
    Study: StudyBookmark,
    spec: {
      property: "transform: translateX",
      duration: "560ms cả vào lẫn ra",
      easing: "var(--ease-brand)",
      trigger: "bấm lưỡi dấu trang (cùng một nút cho cả mở và đóng)",
    },
    idea:
      "Đúng sketch trong feedback, dựng thật chứ không phỏng theo: tab ngôi sao không nằm cạnh thẻ, nó LÀ một phần của thẻ — cái lưỡi thò ra khỏi mép trái, như lưỡi dấu trang thò ra khỏi cuốn sách. Đóng thì cả khối đậu ngoài mép phải, chỉ còn cái lưỡi. Mở thì cả khối trượt vào như một vật cứng. Chỉ có một transform, nên không đời nào thấy hai thứ rời nhau.",
    risk:
      "Thẻ phải vuông cạnh phải để đọc ra 'dính vào mép trang' — mà cả site đang nói bằng thẻ bo tròn nổi trên nền. Đây là chỗ duy nhất phá luật đó, và nó sẽ là chỗ duy nhất trên site trông như vậy. Trên điện thoại 19rem là gần nửa màn hình, và khối này đậu ở giữa chiều cao nên che đúng phần đang đọc. Ngoài ra bỏ badge '✦ Tí chọn' vì ngôi sao đã nói rồi — nói hai lần là thừa.",
    best: "Khi muốn quan hệ tab ↔ thẻ là thứ không thể hiểu nhầm. Mạnh nhất trên desktop.",
  },
  {
    id: "B",
    name: "MỞ RA TỪ TAB — một gốc, cuộn ra",
    meta: "scaleX 0 → 1 quanh mép tab · 520ms · nội dung phản-scale",
    Study: StudyUnroll,
    spec: {
      property: "transform: scaleX (khung), scaleX nghịch đảo (nội dung)",
      duration: "520ms",
      easing: "var(--ease-brand)",
      trigger: "bấm tab · tab đổi thành nút đóng khi đang mở",
    },
    idea:
      "Tab đứng yên hoàn toàn. Thẻ được lộ ra từ chính mép trái của nó: transform-origin đặt ở mép tab, scale theo trục x, nên thẻ đúng nghĩa được cuộn ra khỏi cái chip — như mành cuốn hạ xuống khỏi hộp của nó. Cái scale nằm ở khung cắt, còn nội dung bên trong phản-scale ngược lại, nên bố cục thẻ không hề méo, chỉ có ô cửa nhìn vào nó lớn dần.",
    risk:
      "Phản-scale nghĩa là hai transform phải khớp từng khung hình; lệch easing một chút là chữ bị 'thở'. Và vì tab không di chuyển, người dùng có thể không nhận ra tab đã đổi vai thành nút đóng — cần đổi icon ngôi sao thành dấu X, tức là mất luôn ngôi sao trong lúc mở.",
    best: "Khi muốn giữ tab đứng yên: thứ bạn vừa bấm vẫn nằm nguyên dưới con trỏ.",
  },
  {
    id: "C",
    name: "NGÔI SAO ĐI THEO — một dấu, mang theo",
    meta: "ngôi sao bay từ mép vào góc thẻ · 520ms · thẻ giữ nguyên hình dạng hiện tại",
    Study: StudyTravellingStar,
    spec: {
      property: "right / top / width / height / border-radius trên chính con dấu",
      duration: "520ms ngôi sao · 480ms thẻ, trễ 90ms",
      easing: "var(--ease-brand)",
      trigger: "bấm ngôi sao (cùng một phần tử ở cả hai vị trí)",
    },
    idea:
      "Không phải thân chung, cũng không phải gốc chung — sợi dây ở đây là chính ngôi sao. Nó bay từ mép phải vào đúng chỗ badge trên thẻ và trở thành cái chip '✦ Tí chọn', còn thẻ dâng lên phía dưới nó. Đóng thì ngôi sao bay ngược về mép. Đây là ngôn ngữ sẵn có của site chứ không phải ngôn ngữ mới: src/lib/continuity đã chuyển ảnh sản phẩm giữa hai trang để vật thể sống sót qua điều hướng.",
    risk:
      "Là phương án 'khéo' nhất, nên cũng là phương án dễ trông như một mẹo nhất nếu xem lần thứ hai mươi. Và nó animate right/top/width/height — bốn thuộc tính tốn layout, đúng thứ /lab/motion cấm; chấp nhận được vì đây là một phần tử 48px nằm trên lớp riêng, nhưng phải nói ra chứ không giấu.",
    best:
      "Khi muốn giữ nguyên hình dạng và vị trí thẻ đang chạy — phương án duy nhất trong ba cái không trói thẻ vào mép phải.",
  },
];

export default function HiddenGemStudies() {
  const { loading, gems } = useHomeData();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading && gems.length > 0) setReady(true);
  }, [loading, gems]);

  return (
    <LabShell
      eyebrow="06 · VIÊN NGỌC ẨN"
      title="Ba cách để thẻ và tab ngôi sao thành một vật"
      notes={
        <>
          <p>
            Feedback 07/09 yêu cầu ba phương án redesign thẻ full để liên kết nó với
            tab ngôi sao, kèm ghi chú: “tôi cần kỹ năng thiết kế của bạn, chứ không
            phải nghe theo tôi 1 cách mù quáng”. Nên sketch nằm ở đây, dựng đúng như
            vẽ — và ghi chú kia cũng được nghe: chỗ nào nó phải trả giá, tôi nói ra,
            và đặt cạnh hai câu trả lời khác trả giá theo cách khác.
          </p>
          <p>
            Cái đang hỏng hôm nay đáng gọi tên, vì cả ba đều sửa nó theo ba đường
            khác nhau. Tab là chip teal 48×56 gắn mép phải ở nửa chiều cao. Thẻ là
            panel trắng 340px ở <code>bottom-6 right-6</code>. Hai thứ không chung
            cạnh, không chung màu, không chung góc, không chung vị trí — và tab bị
            gỡ khỏi DOM ngay khi thẻ hiện ra. Không có gì trên màn hình nói rằng cái
            thứ hai chui ra từ cái thứ nhất.
          </p>
          <p>
            Ba thứ khác nhau có thể gánh sợi dây đó:{" "}
            <strong className="text-ink">một thân chung</strong> (A),{" "}
            <strong className="text-ink">một gốc chung</strong> (B),{" "}
            <strong className="text-ink">một con dấu chung</strong> (C). Bấm thử
            trong từng khung; mở đóng bao nhiêu lần cũng được.
          </p>
          <p className="text-ink/55">
            Chuyển động vào/ra mép phải đã chốt rồi và đã nằm trong nhánh{" "}
            <code>fix/homepage-hidden-gem-slide</code>. Trang này chỉ hỏi{" "}
            <em>hình dạng</em>.
          </p>
        </>
      }
    >
      {!ready ? (
        <div className="mx-auto max-w-[92rem] px-5 py-16 text-sm text-ink/50 md:px-10">
          Đang tải dữ liệu thật…
        </div>
      ) : (
        <>
          {STUDIES.map(({ id, name, meta, Study, spec, idea, risk, best }) => (
            <LabFrame key={id} label={`${id} · ${name}`} meta={meta}>
              <div className="mx-auto max-w-[92rem] px-5 pb-12 md:px-10">
                <div className="flex flex-wrap items-start gap-8">
                  <div className="w-full max-w-[30rem] shrink-0 overflow-hidden rounded-[1.5rem] ring-1 ring-ink/12">
                    <Study gem={gems[0]} />
                  </div>

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
                    <Spec {...spec} />
                  </div>
                </div>
              </div>
            </LabFrame>
          ))}

          <LabFrame label="ĐỀ XUẤT" meta="chọn một, tôi gộp vào Homepage">
            <div className="mx-auto max-w-[70ch] px-5 pb-20 text-sm leading-relaxed text-ink/75 md:px-10">
              <p>
                <strong className="text-ink">A — Dấu trang</strong> là phương án tôi đề
                xuất, và tôi nghĩ trực giác trong sketch là đúng: quan hệ giữa tab và
                thẻ nên là quan hệ vật lý, không phải quan hệ được gợi ý. Một thân, một
                transform, một cái tay cầm dùng cho cả mở lẫn đóng — không có trạng thái
                nào để hiểu nhầm.
              </p>
              <p className="mt-3">
                Nhưng nói thẳng chỗ nó phải trả giá, vì đó là điều được yêu cầu. Thẻ
                phải vuông cạnh phải mới đọc ra “dính vào mép trang”, mà cả site đang
                nói bằng thẻ bo tròn nổi trên nền — đây sẽ là chỗ duy nhất trông khác.
                Tôi cho rằng đánh đổi đó xứng đáng: viên ngọc ẩn <em>nên</em> là vật lạ
                trên trang, đó là toàn bộ lý do nó tồn tại. Còn trên điện thoại thì
                không: 19rem chiếm gần nửa màn hình và khối đậu giữa chiều cao che đúng
                phần đang đọc, nên ở khổ đó tôi sẽ cho khối trượt lên từ mép dưới thay
                vì mép phải, giữ nguyên cái lưỡi làm tay cầm.
              </p>
              <p className="mt-3">
                <strong className="text-ink">C — Ngôi sao đi theo</strong> là phương án
                tôi chọn nếu team muốn giữ nguyên hình dạng thẻ hiện tại. Nó là phương
                án duy nhất không trói thẻ vào mép phải, và nó dùng đúng ngôn ngữ
                continuity mà site đã có sẵn.{" "}
                <strong className="text-ink">B</strong> là phương án tôi thấy đẹp nhất
                khi chạy và yếu nhất khi đứng yên — mở ra rồi thì tab không còn là ngôi
                sao nữa, mà ngôi sao chính là thứ đang phải liên kết hai vật.
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
