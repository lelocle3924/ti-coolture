/* No @types/react in this project — see the note in labShared.tsx. */
import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search, X } from "lucide-react";
import { LabShell, LabFrame, Spec } from "./labShared";
import { formatPrice, useHomeData } from "../home/homeData";
import Brandmark from "../components/Brandmark";
import type { Product } from "../types";

/**
 * The search bar — three motion proposals.
 *
 * Team 07/09: "Thêm 3 đề xuất motion cho thanh tìm kiếm. Hiện tại quá basic."
 *
 * Correct, and it is worth being precise about *how* basic, because that is
 * what the three proposals are answering. src/components/Header.tsx renders
 * `{searchOpen && <SearchOverlay …/>}`. There is no transition of any kind:
 * the scrim, the blur and the whole panel are painted in one frame when the
 * state flips, and they vanish in one frame when it flips back. Nothing
 * connects the magnifier you pressed to the panel you got, and the results
 * list appears fully formed under the caret.
 *
 * So the three below are not three ways to fade the same modal in. Each one
 * takes a different position on what search *is* on this site:
 *
 *   A — it is the button you pressed, opened out. Origin-matched.
 *   B — it is part of the nav, pulled down out of it. Not a modal at all.
 *   C — it is a modal, and modals are allowed; make the modal good.
 *
 * Every number under each study is the number in the code beside it.
 *
 * Nothing here is imported by src/views.
 */

/* ── shared furniture ─────────────────────────────────────────────────────
   Each study runs inside a stage rather than over the real page: a fixed box
   with its own violet ground, a real nav pill and some page under it, so the
   motion is judged against the chrome it will actually run over. The overlays
   are `absolute` to the stage, which is why none of them can use `fixed`. */

const STAGE_H = 400;

function Stage({
  children,
  onBackdrop,
}: {
  children: React.ReactNode;
  onBackdrop?: () => void;
}) {
  return (
    <div
      className="relative w-full overflow-hidden bg-brand"
      style={{ height: STAGE_H }}
      onClick={onBackdrop}
    >
      {/* something to blur, so a scrim reads as a scrim */}
      <div className="absolute inset-x-0 bottom-0 grid grid-cols-4 gap-3 p-5 opacity-70">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-2xl bg-white/12" />
        ))}
      </div>
      {children}
    </div>
  );
}

/** The nav pill, at the size and material Header.tsx gives it. */
function Pill({
  onSearch,
  searchRef,
  dimmed = false,
}: {
  onSearch: () => void;
  searchRef?: (el: HTMLButtonElement | null) => void;
  /** True while the field has taken the button's job. */
  dimmed?: boolean;
}) {
  return (
    <div className="absolute inset-x-3 top-3 z-30">
      <div className="flex items-center gap-2 rounded-full bg-ink/50 px-2 py-2 ring-1 ring-white/12 backdrop-blur-xl">
        <span className="shrink-0 px-3 py-1.5">
          <Brandmark className="h-auto w-[64px]" body="var(--color-paper)" />
        </span>
        {/* The stage is 544px wide while the page around it is not, so the
            pill's own sm: breakpoints would fire on the page's width and
            wrap the nav inside the box. Sized to the stage instead, and the
            "Mở shop" button is left out: it is not part of what the search
            motion has to be judged against. */}
        <span className="mx-auto flex gap-0.5 whitespace-nowrap text-[13px] font-semibold text-wave/80">
          <span className="rounded-full px-3 py-2">Sản phẩm</span>
          <span className="rounded-full px-3 py-2">Shop</span>
          <span className="rounded-full px-3 py-2">Khám phá</span>
        </span>
        <span className="flex items-center gap-1">
          <button
            ref={searchRef}
            onClick={(e) => {
              e.stopPropagation();
              onSearch();
            }}
            aria-label="Tìm kiếm"
            className="grid h-11 w-11 place-items-center rounded-full text-paper/85 transition-opacity duration-200 hover:bg-white/10"
            style={{ opacity: dimmed ? 0 : 1 }}
          >
            <Search className="h-[18px] w-[18px]" />
          </button>
        </span>
      </div>
    </div>
  );
}

/** The field and its hits — identical in all three, so only motion differs. */
function Field({
  query,
  setQuery,
  onClose,
  autoFocus = true,
}: {
  query: string;
  setQuery: (v: string) => void;
  onClose: () => void;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  return (
    <div className="flex items-center gap-3 border-b border-ink/12 px-5 py-4">
      <Search className="h-4 w-4 shrink-0 text-ink/40" />
      <input
        ref={ref}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tìm sản phẩm, shop…"
        className="w-full bg-transparent text-base text-ink outline-none placeholder:text-ink/35"
      />
      <button onClick={onClose} aria-label="Đóng tìm kiếm">
        <X className="h-4 w-4 text-ink/45" />
      </button>
    </div>
  );
}

function Hits({
  hits,
  stagger,
  runKey,
}: {
  hits: Product[];
  /** ms between one row and the next; 0 renders them all at once. */
  stagger: number;
  /** changes whenever the list changes, so the stagger replays */
  runKey: string;
}) {
  if (hits.length === 0) return null;
  return (
    <ul>
      {hits.map((p, i) => (
        <li
          key={`${runKey}-${p.id}`}
          className={stagger > 0 ? "lab-search-hit" : undefined}
          style={stagger > 0 ? { animationDelay: `${i * stagger}ms` } : undefined}
        >
          <span className="flex items-center gap-3 px-5 py-2.5">
            <img src={p.images[0]} alt="" className="h-9 w-9 rounded-lg object-cover" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-ink">{p.name}</span>
              <span className="block text-[11px] text-ink/50">{p.storeName}</span>
            </span>
            <span className="shrink-0 text-[11px] text-ink/55">{formatPrice(p.price)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Diacritic-insensitive, as Header.tsx does it. */
function useHits(products: Product[], query: string) {
  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
  const q = norm(query.trim());
  /* Three, not the eight the real overlay shows: the stage is 400px tall and
     a list that runs off the bottom of it makes every study look clipped
     rather than making any of them look different from the others. */
  if (!q) return products.slice(0, 3);
  return products.filter((p) => norm(`${p.name} ${p.storeName}`).includes(q)).slice(0, 3);
}

/* ── A · the button, opened out ───────────────────────────────────────────
   The panel's transform-origin is set to the magnifier's own centre, measured
   from the panel's box on the frame it opens. So the panel does not merely
   appear near the button — it grows out of exactly that point, and collapses
   back into it. The button fades as the panel takes over, because two
   magnifiers on screen at once reads as a copy rather than as a move. */

function StudyOrigin({ products }: { products: Product[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [origin, setOrigin] = useState("100% 0%");
  const btn = useRef<HTMLButtonElement | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const hits = useHits(products, query);

  /* Measured before paint, so the first frame of the animation already has
     the right origin — set it in an effect and the panel scales from its own
     corner for one frame first. */
  useLayoutEffect(() => {
    if (!open) return;
    const b = btn.current?.getBoundingClientRect();
    const p = panel.current?.getBoundingClientRect();
    if (!b || !p) return;
    setOrigin(`${b.left + b.width / 2 - p.left}px ${b.top + b.height / 2 - p.top}px`);
  }, [open]);

  return (
    <Stage onBackdrop={() => setOpen(false)}>
      <Pill onSearch={() => setOpen(true)} searchRef={(el) => (btn.current = el)} dimmed={open} />
      {open && (
        <>
          <div className="lab-search-scrim absolute inset-0 z-20 bg-ink/70 backdrop-blur-md" />
          <div
            ref={panel}
            onClick={(e) => e.stopPropagation()}
            className="lab-search-grow absolute inset-x-5 top-[4.75rem] z-30 overflow-hidden rounded-[1.25rem] bg-paper shadow-[0_30px_70px_rgba(18,8,31,0.45)]"
            style={{ transformOrigin: origin }}
          >
            <Field query={query} setQuery={setQuery} onClose={() => setOpen(false)} />
            <Hits hits={hits} stagger={0} runKey={query} />
          </div>
        </>
      )}
    </Stage>
  );
}

/* ── B · pulled down out of the nav ───────────────────────────────────────
   No modal. The bar is a second pill that lives behind the nav and slides out
   from under it, so search reads as part of the chrome rather than as a
   surface laid over the page. Transform only: the bar is already at its full
   height and is clipped by the strip it slides inside, so nothing reflows —
   which is the rule /lab/motion sets out ("nothing animates a property that
   costs layout").

   The page keeps a light wash rather than a scrim, because nothing here is
   modal: the page underneath is still yours to look at. */

function StudyDrawer({ products }: { products: Product[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const hits = useHits(products, query);

  return (
    <Stage onBackdrop={() => setOpen(false)}>
      {/* the clipping strip: tall enough for the bar, and the nav sits on it */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 h-[22rem] overflow-hidden">
        <div
          className="pointer-events-auto mt-[3.9rem] overflow-hidden rounded-[1.25rem] bg-paper shadow-[0_24px_50px_rgba(18,8,31,0.35)]"
          onClick={(e) => e.stopPropagation()}
          style={{
            transform: open ? "translateY(0)" : "translateY(calc(-100% - 4rem))",
            opacity: open ? 1 : 0,
            transition:
              "transform 520ms cubic-bezier(0.16,1,0.3,1), opacity 200ms ease" +
              (open ? "" : " 120ms"),
          }}
        >
          <Field query={query} setQuery={setQuery} onClose={() => setOpen(false)} autoFocus={open} />
          <Hits hits={hits} stagger={0} runKey={query} />
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-ink/35 transition-opacity duration-500"
        style={{ opacity: open ? 1 : 0 }}
      />
      <Pill onSearch={() => setOpen(true)} dimmed={open} />
    </Stage>
  );
}

/* ── C · the modal, done properly ─────────────────────────────────────────
   Keeps the shape that ships today and spends the motion where a search modal
   actually earns it: the scrim ramps its blur instead of arriving fully
   frosted, the panel drops a short distance on the brand spring, and the hits
   arrive as a group rather than as a wall — 45ms apart, which is a stagger you
   feel and do not wait for.

   The one that costs least to adopt, and the only one that survives a page
   where the nav is hidden (the pill hides on scroll-down; A and B both need
   it on screen). */

function StudyModal({ products }: { products: Product[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const hits = useHits(products, query);

  return (
    <Stage onBackdrop={() => setOpen(false)}>
      <Pill onSearch={() => setOpen(true)} />
      {open && (
        <>
          <div className="lab-search-scrim absolute inset-0 z-20 bg-ink/70" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="lab-search-drop absolute inset-x-5 top-[5.5rem] z-30 overflow-hidden rounded-[1.25rem] bg-paper shadow-[0_30px_70px_rgba(18,8,31,0.45)]"
          >
            <Field query={query} setQuery={setQuery} onClose={() => setOpen(false)} />
            <Hits hits={hits} stagger={45} runKey={query} />
          </div>
        </>
      )}
    </Stage>
  );
}

/* ── page ─────────────────────────────────────────────────────────────────── */

const STUDIES = [
  {
    id: "A",
    name: "NỞ RA TỪ NÚT",
    meta: "transform-origin = tâm nút kính lúp · 380ms · scale 0.72 → 1",
    Study: StudyOrigin,
    spec: {
      property: "transform (scale + translate), opacity",
      duration: "380ms mở · 240ms đóng",
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      trigger: "bấm nút kính lúp",
    },
    idea:
      "Bảng tìm kiếm mọc ra đúng từ điểm bạn vừa bấm. transform-origin được đo từ tâm nút kính lúp so với hộp của bảng ngay trước khi vẽ khung đầu tiên, nên đây là một chuyển động thật chứ không phải bảng hiện ra gần nút. Nút mờ đi khi bảng nhận việc — hai cái kính lúp cùng lúc đọc thành 'sao chép' chứ không phải 'di chuyển'.",
    risk:
      "Trên điện thoại nút nằm sát mép phải, nên bảng nở ra lệch hẳn về một góc. Và nav ẩn khi cuộn xuống: lúc đó không còn điểm gốc nào để nở ra, phải rơi về phương án C.",
    best: "Khi muốn người dùng thấy rõ mình vừa bấm cái gì — mạnh nhất trên desktop.",
  },
  {
    id: "B",
    name: "KÉO RA TỪ NAV",
    meta: "translateY(-100% → 0) · 520ms · không có layout reflow",
    Study: StudyDrawer,
    spec: {
      property: "transform: translateY, opacity",
      duration: "520ms",
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      trigger: "bấm nút kính lúp",
    },
    idea:
      "Không có modal. Thanh tìm kiếm là một viên thứ hai nằm sau nav và trượt ra từ dưới nó, nên tìm kiếm đọc như một phần của thanh điều hướng chứ không phải một lớp phủ lên trang. Chỉ dùng transform: thanh đã sẵn đủ chiều cao và bị cắt bởi dải chứa nó, nên không có gì reflow — đúng luật /lab/motion đặt ra.",
    risk:
      "Trang phía sau chỉ bị làm tối nhẹ chứ không bị chặn, nên phải quyết: bấm ra ngoài là đóng hay là thao tác với trang? Và cũng như A, nav ẩn khi cuộn xuống thì không kéo ra từ đâu được.",
    best: "Khi muốn tìm kiếm là công cụ thường trực, không phải một cửa sổ phải đóng lại.",
  },
  {
    id: "C",
    name: "MODAL, LÀM CHO TỬ TẾ",
    meta: "blur 0 → 12px · bảng rơi 22px · kết quả lệch 45ms",
    Study: StudyModal,
    spec: {
      property: "opacity + backdrop-filter (rèm), transform (bảng, kết quả)",
      duration: "300ms rèm · 420ms bảng · 260ms mỗi dòng",
      easing: "ease-out rèm · var(--ease-brand) bảng",
      trigger: "bấm nút kính lúp · mỗi lần danh sách kết quả đổi",
    },
    idea:
      "Giữ nguyên hình dạng đang chạy, chỉ tiêu chuyển động vào đúng ba chỗ modal tìm kiếm xứng đáng: rèm dâng độ mờ thay vì hiện ra đã đóng băng sẵn, bảng rơi xuống 22px trên spring của brand, và kết quả đến theo nhóm chứ không phải một bức tường — cách nhau 45ms, đủ để cảm thấy mà không phải chờ.",
    risk:
      "Vẫn là một cửa sổ phủ lên trang, nên không trả lời được câu 'nó đến từ đâu'. Đây là phương án ít tham vọng nhất trong ba cái.",
    best:
      "Rẻ nhất để áp dụng, và là phương án duy nhất còn đúng khi nav đã ẩn — A và B đều cần nút kính lúp còn trên màn hình.",
  },
];

export default function SearchMotionStudies() {
  const { loading, popular } = useHomeData();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading && popular.length > 0) setReady(true);
  }, [loading, popular]);

  return (
    <LabShell
      eyebrow="05 · TÌM KIẾM"
      title="Ba đề xuất chuyển động cho thanh tìm kiếm"
      notes={
        <>
          <p>
            Feedback 07/09: “Thêm 3 đề xuất motion cho thanh tìm kiếm. Hiện tại quá
            basic.” Đúng — và đáng nói rõ là basic đến mức nào, vì đó chính là thứ ba
            phương án dưới đây đang trả lời.
          </p>
          <p>
            <code>Header.tsx</code> render <code>{"{searchOpen && <SearchOverlay/>}"}</code>.
            Không có transition nào cả: rèm, blur và toàn bộ bảng được vẽ trong một
            khung hình khi state đổi, và biến mất trong một khung hình khi state đổi
            lại. Không có gì nối cái nút bạn vừa bấm với cái bảng bạn nhận được.
          </p>
          <p>
            Nên đây không phải ba cách fade cùng một modal. Mỗi phương án đứng ở một
            lập trường khác nhau về việc <em>tìm kiếm là cái gì</em> trên trang này.
            Bấm thử vào nút kính lúp trong từng khung.
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
                  <div className="w-full max-w-[34rem] shrink-0 overflow-hidden rounded-[1.5rem] ring-1 ring-ink/12">
                    <Study products={popular} />
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

          <LabFrame label="ĐỀ XUẤT" meta="chọn một, tôi gộp vào Header.tsx">
            <div className="mx-auto max-w-[70ch] px-5 pb-20 text-sm leading-relaxed text-ink/75 md:px-10">
              <p>
                <strong className="text-ink">A — Nở ra từ nút</strong> là phương án tôi
                đề xuất, kèm <strong className="text-ink">C</strong> làm dự phòng. Chúng
                không loại trừ nhau: A cần nút kính lúp còn trên màn hình, mà nav thì ẩn
                khi cuộn xuống, nên C là thứ chạy trong đúng những lúc A không chạy
                được. Một dòng điều kiện, hai chuyển động, không có trạng thái nào bị
                bỏ trống.
              </p>
              <p className="mt-3">
                <strong className="text-ink">B</strong> là phương án đẹp nhất về mặt ý
                niệm — tìm kiếm thành một phần của chrome — nhưng nó đổi cả hành vi chứ
                không chỉ chuyển động, và câu hỏi “bấm ra ngoài thì đóng hay không” phải
                được trả lời trước khi dựng, chứ không phải sau.
              </p>
              <p className="mt-3 text-ink/55">
                Cả ba đều dừng hoàn toàn khi máy đặt{" "}
                <code>prefers-reduced-motion</code>: bảng hiện ra, không nở, không rơi,
                không lệch dòng.
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
