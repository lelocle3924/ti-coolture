import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Search } from "lucide-react";
import { fetchProducts } from "../lib/dbService";
import type { Product } from "../types";
import { LabShell, LabFrame } from "./labShared";

/* ═══════════════════════════════════════════════════════════════════════════
   BỘ SƯU TẬP — six directions for a page that does not exist yet (09/09)

   The note, and it is a UX note rather than a visual one:

     "Phát triển từ gốc UX cho trang /collections riêng, thậm chí là
      /collections/[slug] cho từng collections cụ thể. Chỉ hiển thị collections
      ở homepage sẽ gây giới hạn số lượng sản phẩm có thể có cho 1 collection
      (cùng lắm là 10 sản phẩm)."

   ── the problem, stated ──────────────────────────────────────────────────
   A collection today exists only as one panel of the homepage's spring tabs.
   That panel is a horizontal strip inside a section that has to share a
   screen with everything else on the front page, so it holds eight tiles
   before it stops being readable. The collection is therefore not a thing
   with a size; it is a thing that fits in a strip. Everything downstream
   follows from that: an editor cannot put twenty pieces in one, cannot write
   about it, cannot link to it, and cannot say what it is for.

   So the question is not "what should the collections page look like". It is
   "what is a collection for", and there are two honest answers:

     CATALOGUE — a collection is a way of cutting the catalogue. What matters
     is what is in it, and the page's job is to show as much of that as
     possible, as fast as possible. Copy is a label.

     CURATION — a collection is an argument someone is making about a group of
     objects. What matters is why these, together. The products are the
     evidence; the writing is the point, and a collection without copy is not
     finished.

   Three directions under each, and they differ on navigation model, on how
   many products they can hold before they break, and on how much writing an
   editor has to supply per collection. Those three are the axes that decide
   the answer, so they are what the comparison is built on.

   ── what is fixed across all six ─────────────────────────────────────────
   Real Approved products through dbService. Brand tokens only. Square product
   crops. The price note wherever a price appears. Hairlines and colour
   fields, no cards and no shadows. Every draft is real DOM at 1280×820 and
   390×820, scaled to fit, so nothing reflows into a shape the real page would
   not take.

   ⚠ PLACEHOLDER CURATION. The five collections below are grouped by the
   08/09 taxonomy — Đồ gốm plus Dụng cụ ăn uống is "Gốm và bàn tay" — and
   their copy is written to be obviously generic. A real collection is chosen
   by hand; that is the whole product premise. The grouping exists so the
   directions can be judged at a realistic size, which is the note's own
   point: every one of these holds between 11 and 22 products, and the
   homepage strip holds eight.
   ═══════════════════════════════════════════════════════════════════════════ */

const SCALE = 0.52;
const DESK = { w: 1280, h: 820 };
const PHONE = { w: 390, h: 820 };

interface LabCollection {
  slug: string;
  name: string;
  /** Leaves of the 08/09 taxonomy this collection is cut from. */
  kinds: string[];
  /** One line, for a catalogue direction. */
  standfirst: string;
  /** A paragraph, for a curation direction. */
  essay: string;
}

const COLLECTIONS: LabCollection[] = [
  {
    slug: "gom-va-ban-tay",
    name: "Gốm và bàn tay",
    kinds: ["cat-do-gom", "cat-dung-cu-an-uong"],
    standfirst: "Men rạn, nung củi, không mẻ nào giống mẻ nào.",
    essay:
      "Mỗi món ở đây đi qua lửa một lần và không ai biết trước nó ra màu gì. Người làm gốm gọi đó là nước men, và cái hay là chỗ không lặp lại: hai cái chén cùng mẻ vẫn khác nhau ở vết chảy, ở độ đậm, ở đường tay. Bộ này gom lại những món để dùng hằng ngày chứ không để trưng.",
  },
  {
    slug: "muc-va-giay",
    name: "Mực và giấy",
    kinds: ["cat-tranh-nguyen-ban", "cat-tranh-riso", "cat-tranh-ky-thuat-so", "cat-zine"],
    standfirst: "In lụa, riso, zine — kéo tay từng bản.",
    essay:
      "In thủ công thì mỗi bản là một bản, không phải một bản sao. Mực chồng lớp nên có bản đậm bản nhạt, và cái lệch nửa milimet giữa hai lần kéo là thứ máy in không làm được. Bộ này là những gì các xưởng in ra trong năm — poster, zine, và vài thứ ở giữa hai cái đó.",
  },
  {
    slug: "sang-den-len",
    name: "Sáng đèn lên",
    kinds: ["cat-den"],
    standfirst: "Mica, nhôm, giấy — đèn làm tay, mỗi cái một nết sáng.",
    essay:
      "Đèn là món đồ hiếm hoi mà bạn mua cái ánh sáng chứ không mua cái vật. Bộ này gom những chiếc đèn được ghép và mài tay: vân sáng đổi theo góc nhìn, nên ảnh chụp chỉ nói được một nửa. Nửa còn lại phải bật lên mới thấy.",
  },
  {
    slug: "mui-cua-nha",
    name: "Mùi của nhà",
    kinds: ["cat-nen-thom", "cat-nuoc-hoa", "cat-tam-goi"],
    standfirst: "Nến, tinh dầu, xà phòng — nấu theo mẻ nhỏ.",
    essay:
      "Một cái nhà có mùi của nó, và phần lớn thời gian ta không để ý cho tới khi đi xa về. Bộ này là những mùi được nấu ở Sài Gòn theo mẻ nhỏ — cà phê phin, chè khúc bạch, bún bò ghế nhựa — nghĩa là mùi của chỗ này chứ không phải mùi nhập từ chỗ khác.",
  },
  {
    slug: "mang-ve-lam-qua",
    name: "Mang về làm quà",
    kinds: ["cat-moc-khoa", "cat-nam-cham", "cat-thiep", "cat-buu-thiep", "cat-dac-san"],
    standfirst: "Nhỏ, gói được, mang đi xa được.",
    essay:
      "Quà mang đi xa có hai điều kiện: đủ nhẹ để bỏ vali và đủ cụ thể để người nhận biết nó đến từ đâu. Bộ này chọn theo đúng hai điều kiện đó — móc khoá, nam châm, thiệp, và mấy lọ đặc sản đóng tay — chứ không chọn theo giá.",
  },
];

/** ⚠ PLACEHOLDER. One line per product, for the direction that needs one. */
const THREAD_LINES = [
  "Chỗ bắt đầu — món dễ dùng nhất trong bộ.",
  "Cùng một xưởng, một mẻ nung khác.",
  "Đây là chỗ màu men bắt đầu đổi.",
  "Món đắt nhất, và lý do nó đắt nằm ở mặt trong.",
  "Nếu chỉ lấy một thứ, lấy cái này.",
  "Để đóng bộ. Không bắt buộc.",
];

function useLabCollections() {
  const [rows, setRows] = useState<Product[]>([]);
  useEffect(() => {
    fetchProducts("Approved").then(setRows).catch(console.error);
  }, []);

  return useMemo(
    () =>
      COLLECTIONS.map((c) => ({
        ...c,
        items: rows.filter((p) => c.kinds.includes(`cat-${p.categorySlug}`)),
      })),
    [rows]
  );
}

type Filled = ReturnType<typeof useLabCollections>[number];

/* ── shared parts ───────────────────────────────────────────────────────── */

const price = (v: number) => (v > 0 ? `${v.toLocaleString("vi-VN")}₫` : "Liên hệ");

function Tile({ p, className = "" }: { key?: string; p: Product; className?: string }) {
  return (
    <div className={className}>
      <div className="aspect-square overflow-hidden rounded-[0.9rem] bg-black/5">
        {p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
      </div>
      <p className="mt-1.5 truncate text-[12px] font-medium text-ink">{p.name}</p>
      <p className="text-[12px] font-semibold text-brand">{price(p.price)}</p>
    </div>
  );
}

/** A collection's cover. No shop supplies one, so it is a labelled field. */
function Cover({
  c,
  className = "",
  tone = "violet",
}: {
  c: Filled;
  className?: string;
  tone?: "violet" | "teal";
}) {
  const first = c.items[0]?.images?.[0];
  return (
    <div className={`relative overflow-hidden ${tone === "teal" ? "bg-wave" : "bg-brand"} ${className}`}>
      {first && <img src={first} alt="" className="h-full w-full object-cover opacity-90" />}
    </div>
  );
}

/** The nav pill, so every draft is judged with the chrome it will carry. */
function Chrome({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={`absolute inset-x-6 top-5 z-30 flex h-14 items-center gap-4 rounded-full px-5 backdrop-blur-md ${
        dark ? "bg-ink/50" : "bg-ink/80"
      }`}
    >
      <span className="text-sm font-black text-paper">TÍ COOLTURE</span>
      <span className="ml-auto flex gap-4 text-[13px] font-semibold text-wave/85">
        <span>Sản phẩm</span>
        <span>Shop</span>
        <span className="text-paper">Bộ sưu tập</span>
        <span>Khám phá</span>
      </span>
    </div>
  );
}

function Draft({
  size,
  label,
  children,
}: {
  key?: string;
  size: { w: number; h: number };
  label: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="m-0 shrink-0">
      <div
        className="overflow-hidden rounded-[0.75rem] bg-paper ring-1 ring-ink/15"
        style={{ width: size.w * SCALE, height: size.h * SCALE }}
      >
        <div
          style={{
            width: size.w,
            height: size.h,
            transform: `scale(${SCALE})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
      <figcaption className="mt-2 text-[11px] tracking-[0.12em] text-ink/45">{label}</figcaption>
    </figure>
  );
}

/* ═══ FAMILY A · CATALOGUE ══════════════════════════════════════════════════
   A collection is a cut of the catalogue. Copy is a label. */

/* ── A1 · LƯỚI — an index of covers, then a grid ───────────────────────── */

function A1Index({ cs, phone }: { cs: Filled[]; phone?: boolean }) {
  return (
    <div className="h-full bg-paper">
      <Chrome />
      <div className={`pt-28 ${phone ? "px-5" : "px-16"}`}>
        <h1 className="display text-[2.4rem] normal-case leading-[1.1] text-ink">Bộ sưu tập</h1>
        <p className="mt-1 text-[13px] text-ink/55">{cs.length} bộ · cập nhật hằng tháng</p>

        <div className={`mt-7 grid gap-5 ${phone ? "grid-cols-1" : "grid-cols-3"}`}>
          {cs.slice(0, phone ? 2 : 6).map((c) => (
            <div key={c.slug}>
              <Cover c={c} className="aspect-[4/3] w-full rounded-[1rem]" />
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <p className="display truncate text-[1.15rem] normal-case text-ink">{c.name}</p>
                <span className="shrink-0 text-[12px] tabular-nums text-ink/45">
                  {c.items.length}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function A1Detail({ c, phone }: { c: Filled; phone?: boolean }) {
  return (
    <div className="h-full bg-paper">
      <Chrome />
      <div className={`pt-28 ${phone ? "px-5" : "px-16"}`}>
        <p className="text-[11px] tracking-[0.14em] text-ink/40">BỘ SƯU TẬP</p>
        <h1 className="display mt-1 text-[2.2rem] normal-case leading-[1.1] text-ink">{c.name}</h1>
        <p className="mt-1.5 text-[13px] text-ink/60">{c.standfirst}</p>

        {/* the catalogue's own bar, reused rather than reinvented */}
        <div className="mt-5 flex items-center justify-between gap-3 border-y border-ink/12 py-2.5">
          <span className="text-[12px] text-ink/60">
            <strong className="text-ink">{c.items.length}</strong> tác phẩm
          </span>
          <div className="flex gap-2">
            {["Giá", "Chất liệu", "Sắp xếp"].map((f) => (
              <span
                key={f}
                className="rounded-full border border-ink/15 px-3 py-1 text-[11px] text-ink/70"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        <div className={`mt-5 grid gap-4 ${phone ? "grid-cols-2" : "grid-cols-5"}`}>
          {c.items.slice(0, phone ? 6 : 15).map((p) => (
            <Tile key={p.id} p={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── A2 · KỆ — every collection as a rail on one page ───────────────────── */

function A2({ cs, phone }: { cs: Filled[]; phone?: boolean }) {
  return (
    <div className="h-full overflow-hidden bg-paper">
      <Chrome />
      <div className={`pt-28 ${phone ? "pl-5" : "pl-16"}`}>
        <h1 className="display text-[2.2rem] normal-case leading-[1.1] text-ink">Bộ sưu tập</h1>

        {cs.slice(0, 3).map((c) => (
          <div key={c.slug} className="mt-7">
            <div className={`flex items-baseline justify-between gap-4 ${phone ? "pr-5" : "pr-16"}`}>
              <div className="min-w-0">
                <p className="display truncate text-[1.35rem] normal-case text-ink">{c.name}</p>
                <p className="truncate text-[12px] text-ink/55">{c.standfirst}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-brand">
                Xem cả {c.items.length}
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>

            <div className="mt-3 flex gap-4">
              {c.items.slice(0, phone ? 3 : 7).map((p) => (
                <Tile key={p.id} p={p} className={phone ? "w-[120px] shrink-0" : "w-[150px] shrink-0"} />
              ))}
              {/* the rail is cut, and the cut is the affordance */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── A3 · BỘ LỌC — a collection is a facet on /products ─────────────────── */

function A3({ cs, phone }: { cs: Filled[]; phone?: boolean }) {
  const active = cs[1];
  return (
    <div className="h-full bg-paper">
      <Chrome />
      <div className={`pt-28 ${phone ? "px-5" : "px-16"}`}>
        <h1 className="display text-[2.2rem] normal-case leading-[1.1] text-ink">Sản phẩm</h1>

        {/* collections sit in the filter bar, beside the kinds */}
        <div className="mt-5 border-b border-ink/12 pb-3">
          <p className="text-[11px] tracking-[0.14em] text-ink/40">BỘ SƯU TẬP</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {cs.map((c) => (
              <span
                key={c.slug}
                className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                  c.slug === active?.slug ? "bg-brand text-paper" : "bg-black/5 text-ink/70"
                }`}
              >
                {c.name}
                <span className={c.slug === active?.slug ? "ml-1.5 text-paper/60" : "ml-1.5 text-ink/35"}>
                  {c.items.length}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 border-b border-ink/12 pb-3">
          <Search className="h-3.5 w-3.5 text-ink/35" />
          <span className="text-[12px] text-ink/55">
            <strong className="text-ink">{active?.items.length}</strong> tác phẩm · Mực và giấy ·
            dưới 300.000₫
          </span>
        </div>

        <div className={`mt-5 grid gap-4 ${phone ? "grid-cols-2" : "grid-cols-5"}`}>
          {(active?.items ?? []).slice(0, phone ? 6 : 15).map((p) => (
            <Tile key={p.id} p={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ FAMILY B · CURATION ═══════════════════════════════════════════════════
   A collection is an argument. The products are the evidence. */

/* ── B1 · BÀI VIẾT — the products are threaded through the prose ────────── */

function B1({ c, phone }: { c: Filled; phone?: boolean }) {
  const half = phone ? 2 : 4;
  return (
    <div className="h-full overflow-hidden bg-paper">
      <Chrome dark />
      <Cover c={c} className={phone ? "h-[220px] w-full" : "h-[300px] w-full"} />

      <div className={`${phone ? "px-5" : "mx-auto max-w-[720px] px-8"} -mt-12 relative`}>
        <div className="bg-paper pt-6">
          <p className="text-[11px] tracking-[0.14em] text-brand">BỘ SƯU TẬP · {c.items.length} MÓN</p>
          <h1 className="display mt-1.5 text-[2.2rem] normal-case leading-[1.1] text-ink">
            {c.name}
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-ink/75">{c.essay}</p>

          <div className={`mt-6 grid gap-4 ${phone ? "grid-cols-2" : "grid-cols-4"}`}>
            {c.items.slice(0, half).map((p) => (
              <Tile key={p.id} p={p} />
            ))}
          </div>

          <p className="mt-6 text-[14px] leading-relaxed text-ink/75">
            Phần sau của bộ là những món cùng xưởng nhưng khác mẻ — để cạnh nhau mới thấy chỗ
            khác nhau, và đó là lý do chúng nằm chung một trang chứ không nằm rải trong danh mục.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── B2 · BÌA & LỜI — one screen of poster, then the grid ───────────────── */

function B2({ c, phone }: { c: Filled; phone?: boolean }) {
  const hero = c.items[0];
  return (
    <div className="h-full bg-paper">
      <Chrome dark />
      <div className={`relative flex ${phone ? "h-[430px] flex-col" : "h-[480px]"} bg-brand`}>
        <div className={`flex flex-col justify-end p-8 text-paper ${phone ? "" : "w-[46%] pl-16"}`}>
          <p className="text-[11px] tracking-[0.14em] text-wave">BỘ SƯU TẬP</p>
          <h1 className="display mt-1.5 text-[2.6rem] normal-case leading-[1.05]">{c.name}</h1>
          <p className="mt-3 max-w-[34ch] text-[14px] leading-relaxed text-white/85">
            {c.standfirst} {c.essay.split(". ")[0]}.
          </p>
          <p className="mt-4 text-[12px] text-white/60">{c.items.length} món · chọn tay</p>
        </div>

        {/* one piece picked out — the collection's own argument, in an object */}
        <div className={`relative ${phone ? "h-[180px]" : "flex-1"} overflow-hidden`}>
          {hero?.images?.[0] && (
            <img src={hero.images[0]} alt="" className="h-full w-full object-cover" />
          )}
        </div>
      </div>

      <div className={`${phone ? "px-5" : "px-16"} pt-6`}>
        <div className="flex items-baseline justify-between border-b border-ink/12 pb-2.5">
          <p className="text-[12px] font-semibold text-ink">Cả bộ</p>
          <span className="text-[12px] text-ink/45">{c.items.length} món</span>
        </div>
        <div className={`mt-4 grid gap-4 ${phone ? "grid-cols-2" : "grid-cols-6"}`}>
          {c.items.slice(1, phone ? 5 : 13).map((p) => (
            <Tile key={p.id} p={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── B3 · DÒNG THỜI GIAN — the collection is a route through the pieces ─── */

function B3({ c, phone }: { c: Filled; phone?: boolean }) {
  return (
    <div className="h-full overflow-hidden bg-paper">
      <Chrome />
      <div className={`pt-28 ${phone ? "px-5" : "mx-auto max-w-[860px] px-8"}`}>
        <p className="text-[11px] tracking-[0.14em] text-brand">ĐI THEO THỨ TỰ NÀY</p>
        <h1 className="display mt-1 text-[2.2rem] normal-case leading-[1.1] text-ink">{c.name}</h1>
        <p className="mt-2 max-w-[54ch] text-[13px] leading-relaxed text-ink/65">{c.standfirst}</p>

        <ul className="mt-6 border-t border-ink/12">
          {c.items.slice(0, phone ? 3 : 4).map((p, i) => (
            <li key={p.id} className="flex gap-5 border-b border-ink/12 py-4">
              <span className="display shrink-0 pt-0.5 text-[1.6rem] leading-none text-brand/45">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[0.75rem] bg-black/5">
                {p.images?.[0] && (
                  <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-ink">{p.name}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink/65">
                  {THREAD_LINES[i % THREAD_LINES.length]}
                </p>
                <p className="mt-1 text-[13px] font-semibold text-brand">{price(p.price)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ── the study ──────────────────────────────────────────────────────────── */

interface Direction {
  slug: string;
  label: string;
  meta: string;
  idea: string;
  differs: string;
  scale: string;
  risk: string;
  render: (cs: Filled[], phone: boolean) => React.ReactNode;
}

const CATALOGUE: Direction[] = [
  {
    slug: "a1",
    label: "A1 · LƯỚI — mục lục bìa, rồi lưới sản phẩm",
    meta: "2 trang · 2 cú bấm · lên tới ~200 sản phẩm/bộ",
    idea:
      "/collections là lưới bìa; /collections/[slug] là lưới sản phẩm với đúng thanh lọc và phân trang mà /products đã có. Bộ sưu tập trở thành một trang danh mục có tên.",
    differs:
      "Điều hướng: mục lục → trang bộ. Mật độ: cao nhất trong ba hướng. Chữ: một dòng, làm nhãn.",
    scale:
      "Không giới hạn thực tế — 36 sản phẩm một trang, còn lại sang trang sau, y như /products.",
    risk:
      "Không nói được vì sao những món này nằm chung. Một bộ 15 món trông y hệt một bộ lọc, nên biên tập viên mất đi lý do tồn tại của mình.",
    render: (cs, phone) => <A1Index cs={cs} phone={phone} />,
  },
  {
    slug: "a2",
    label: "A2 · KỆ — mỗi bộ một dải, tất cả trên một trang",
    meta: "1 trang · 0 cú bấm để thấy hàng · dải cắt ở ~8 món",
    idea:
      "Không có trang mục lục. /collections là một trang cuộn, mỗi bộ một dải ngang sản phẩm; trang riêng của bộ chỉ là chỗ “xem cả 22 món” dẫn tới.",
    differs:
      "Điều hướng: không cú bấm nào để thấy sản phẩm của mọi bộ. Mật độ: rộng chứ không sâu. Chữ: một dòng, ngay trên dải.",
    scale:
      "Dải nào cũng chỉ hiện 7–8 món — chính là giới hạn mà note đang phàn nàn, chỉ khác là ở đây nó có đường thoát rõ ràng.",
    risk:
      "Lặp lại đúng vấn đề của homepage ở quy mô lớn hơn. Và ba dải ngang liên tiếp là ba lần vuốt trên điện thoại.",
    render: (cs, phone) => <A2 cs={cs} phone={phone} />,
  },
  {
    slug: "a3",
    label: "A3 · BỘ LỌC — bộ sưu tập là một facet của /products",
    meta: "0 trang mới · 1 cú bấm · cộng dồn được với giá, chất liệu, nhóm",
    idea:
      "Không có trang riêng. Bộ sưu tập là một hàng chip trong thanh lọc của /products, ?collection=slug. “Mực và giấy dưới 300k” là một URL.",
    differs:
      "Điều hướng: ở lại một trang. Mật độ: của /products. Chữ: không có chỗ nào cho chữ.",
    scale: "Không giới hạn, và là hướng duy nhất kết hợp được bộ sưu tập với các bộ lọc khác.",
    risk:
      "Bộ sưu tập thôi là một thứ có bìa, có tên, có người chọn — nó thành một ô tích. Chia sẻ được URL nhưng không chia sẻ được một trang.",
    render: (cs, phone) => <A3 cs={cs} phone={phone} />,
  },
];

const CURATION: Direction[] = [
  {
    slug: "b1",
    label: "B1 · BÀI VIẾT — sản phẩm luồn giữa đoạn văn",
    meta: "bìa tràn + ~200 chữ/bộ · sản phẩm theo khối 4",
    idea:
      "/collections/[slug] là một bài viết: bìa tràn viền, tiêu đề, đoạn mở của người biên tập, rồi sản phẩm chen vào giữa các đoạn theo khối. Mục lục là danh sách bìa kèm câu mở.",
    differs:
      "Trọng tâm: đọc. Sản phẩm là dẫn chứng đặt giữa lập luận. Bìa là ảnh, không phải lưới.",
    scale:
      "12–16 món là thoải mái. Trên 20 thì các khối sản phẩm dài hơn phần chữ và bài viết vỡ ra thành lưới có chú thích.",
    risk:
      "Mỗi bộ phải có người viết. Một bộ chưa có chữ trông như trang lỗi, chứ không phải trang trống.",
    render: (cs, phone) => <B1 c={cs[0]} phone={phone} />,
  },
  {
    slug: "b2",
    label: "B2 · BÌA & LỜI — một màn poster, rồi cả bộ",
    meta: "1 màn giới thiệu + lưới · ~40 chữ/bộ",
    idea:
      "Mở bằng một màn hình chia đôi: nửa violet mang tên và bốn mươi chữ, nửa kia là một món được chọn ra làm đại diện. Cuộn xuống là cả bộ trên lưới trắng phẳng.",
    differs:
      "Trọng tâm: ấn tượng đầu, rồi tránh đường. Chữ ít nhất trong ba hướng curation. Có một món được ưu tiên hơn hẳn.",
    scale: "Không giới hạn — phần dưới là lưới, muốn bao nhiêu cũng được.",
    risk:
      "Bốn mươi chữ phải gánh cả lập luận. Và hai nửa dễ đọc thành hai trang không liên quan nếu món đại diện chọn sai.",
    render: (cs, phone) => <B2 c={cs[0]} phone={phone} />,
  },
  {
    slug: "b3",
    label: "B3 · DÒNG THỜI GIAN — bộ là một lộ trình, không phải một túi",
    meta: "1 dòng chữ / mỗi món · đánh số · ~12 món là trần",
    idea:
      "Mỗi món là một bước có số thứ tự và một câu nói rõ vì sao nó đứng ở đó. Bộ sưu tập trở thành một lập luận có thứ tự, không phải một tập hợp.",
    differs:
      "Chữ nằm ở cấp sản phẩm chứ không ở cấp bộ. Có thứ tự, và thứ tự mang nghĩa. Không có lưới.",
    scale:
      "Trần thật là khoảng 12 món; quá đó thì thành một trang cuộn dài mà không ai đọc hết chú thích.",
    risk:
      "Tốn chữ nhất: một câu cho mỗi món, nhân với số bộ. Đây là hướng đắt nhất về mặt biên tập.",
    render: (cs, phone) => <B3 c={cs[0]} phone={phone} />,
  },
];

function Family({
  eyebrow,
  title,
  premise,
  directions,
  cs,
}: {
  eyebrow: string;
  title: string;
  premise: string;
  directions: Direction[];
  cs: Filled[];
}) {
  return (
    <>
      <div className="mx-auto max-w-[92rem] border-t-2 border-ink px-5 pb-2 pt-8 md:px-10">
        <p className="label text-brand">{eyebrow}</p>
        <h2 className="display mt-1 text-[clamp(1.6rem,3.4vw,2.4rem)] normal-case leading-[1.2]">
          {title}
        </h2>
        <p className="mt-2 max-w-[74ch] text-sm leading-relaxed text-ink/70">{premise}</p>
      </div>

      {directions.map((d) => (
        <LabFrame key={d.slug} label={d.label} meta={d.meta}>
          <div className="mx-auto max-w-[92rem] px-5 pb-10 md:px-10">
            <div className="flex flex-wrap gap-6">
              <Draft size={DESK} label="PC · 1280×820">
                {d.render(cs, false)}
              </Draft>
              <Draft size={PHONE} label="MOBILE · 390×820">
                {d.render(cs, true)}
              </Draft>

              <div className="min-w-[18rem] flex-1 space-y-3 text-sm leading-relaxed">
                <p className="text-ink/80">{d.idea}</p>
                <dl className="space-y-2 border-t border-ink/12 pt-3 text-[13px]">
                  {[
                    ["Khác ở đâu", d.differs],
                    ["Chứa được bao nhiêu", d.scale],
                    ["Rủi ro", d.risk],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[11px] uppercase tracking-[0.12em] text-ink/40">{k}</dt>
                      <dd className="mt-0.5 text-ink/70">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </LabFrame>
      ))}
    </>
  );
}

export default function CollectionStudies() {
  const cs = useLabCollections();
  if (cs.length === 0 || cs[0].items.length === 0) {
    return (
      <LabShell eyebrow="09/09 · BỘ SƯU TẬP" title="Sáu hướng cho trang bộ sưu tập">
        <p className="mx-auto max-w-[92rem] px-5 pb-16 text-sm text-ink/60 md:px-10">
          Đang tải danh mục…
        </p>
      </LabShell>
    );
  }

  return (
    <LabShell
      eyebrow="09/09 · BỘ SƯU TẬP"
      title="Sáu hướng cho trang bộ sưu tập"
      notes={
        <>
          <p>
            Bộ sưu tập hiện chỉ tồn tại như một panel trong khối tab ở trang chủ. Panel đó
            là một dải ngang phải chia màn hình với mọi thứ khác, nên nó chứa được tám ô là
            hết — <strong className="text-ink">bộ sưu tập vì thế không phải là một thứ có
            kích thước, mà là một thứ vừa cái dải</strong>. Biên tập viên không bỏ được hai
            mươi món vào, không viết được về nó, không dẫn link tới nó.
          </p>
          <p>
            Nên câu hỏi không phải “trang bộ sưu tập trông thế nào”, mà{" "}
            <strong className="text-ink">“bộ sưu tập để làm gì”</strong>. Có hai câu trả lời
            thành thật, và ba hướng dưới mỗi câu. Ba hướng đó khác nhau ở ba trục quyết định:
            mô hình điều hướng, chứa được bao nhiêu sản phẩm trước khi vỡ, và mỗi bộ tốn bao
            nhiêu chữ của người biên tập.
          </p>
          <p className="text-ink/55">
            Năm bộ trong bản vẽ được cắt từ taxonomy 08/09 và chứa từ 11 tới 22 sản phẩm
            thật — chính là điều note đang nói: dải ở trang chủ chứa tám.
          </p>
        </>
      }
    >
      <Family
        eyebrow="HƯỚNG LỚN A"
        title="CATALOGUE — bộ sưu tập là một lát cắt của danh mục"
        premise="Điều quan trọng là trong đó có gì. Việc của trang là bày ra được nhiều nhất, nhanh nhất. Chữ chỉ là nhãn. Ba hướng dưới đây khác nhau ở chỗ trang riêng của bộ có tồn tại hay không."
        directions={CATALOGUE}
        cs={cs}
      />

      <Family
        eyebrow="HƯỚNG LỚN B"
        title="CURATION — bộ sưu tập là một lập luận về một nhóm đồ vật"
        premise="Điều quan trọng là vì sao những món này đứng chung. Sản phẩm là dẫn chứng, chữ là lập luận — và một bộ không có chữ thì chưa xong. Ba hướng khác nhau ở chỗ chữ nằm ở cấp nào: cấp bài, cấp bộ, hay cấp từng món."
        directions={CURATION}
        cs={cs}
      />

      <div className="mx-auto max-w-[92rem] border-t-2 border-ink px-5 py-10 md:px-10">
        <p className="label text-brand">SO SÁNH</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-ink/20 text-[11px] uppercase tracking-[0.12em] text-ink/45">
                <th className="py-2 pr-4 font-medium">Hướng</th>
                <th className="py-2 pr-4 font-medium">Trang mới</th>
                <th className="py-2 pr-4 font-medium">Chứa được</th>
                <th className="py-2 font-medium">Chữ mỗi bộ</th>
              </tr>
            </thead>
            <tbody className="text-ink/75">
              {[
                ["A1 · Lưới", "2", "không giới hạn", "1 dòng"],
                ["A2 · Kệ", "1", "8 mỗi dải", "1 dòng"],
                ["A3 · Bộ lọc", "0", "không giới hạn", "không có"],
                ["B1 · Bài viết", "2", "12–16", "~200 chữ"],
                ["B2 · Bìa & lời", "2", "không giới hạn", "~40 chữ"],
                ["B3 · Dòng thời gian", "2", "~12", "1 câu / mỗi món"],
              ].map((row) => (
                <tr key={row[0]} className="border-b border-ink/10">
                  {row.map((cell, i) => (
                    <td key={i} className={`py-2.5 ${i < 3 ? "pr-4" : ""}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 max-w-[74ch] text-sm leading-relaxed text-ink/75">
          <strong className="text-ink">Gợi ý: A1 làm nền, B2 làm lớp trên.</strong> A1 là hướng
          duy nhất giải quyết đúng điều note nêu — bộ sưu tập có kích thước riêng, không bị
          giới hạn bởi cái dải — và nó dùng lại nguyên thanh lọc, phân trang, thẻ sản phẩm đã
          có, nên chi phí gần bằng không. B2 chồng lên A1 mà không thay nó: thêm một màn hình
          bìa và bốn mươi chữ ở đầu trang bộ, thế là A1 thành B2. Bộ nào có chữ thì lên poster,
          bộ nào chưa có thì vẫn là một trang danh mục tử tế chứ không phải một trang lỗi — mà
          đó là rủi ro lớn nhất của B1 và B3.
        </p>
        <p className="mt-3 max-w-[74ch] text-sm leading-relaxed text-ink/60">
          A3 nên làm dù chọn hướng nào: <code>?collection=</code> trong thanh lọc của /products
          là năm dòng code và nó cho phép “Mực và giấy dưới 300k”, thứ mà không hướng nào khác
          làm được. Nhưng nó không thay được trang bộ sưu tập, vì một facet không có bìa.
        </p>
      </div>
    </LabShell>
  );
}
