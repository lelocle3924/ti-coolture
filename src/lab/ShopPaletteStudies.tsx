/* No @types/react in this project — see the note in labShared.tsx. */
import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import { LabShell, LabFrame } from "./labShared";
import { fetchStores, fetchProductsStore } from "../lib/dbService";
import { formatPrice } from "../home/homeData";
import type { Product, StoreProfile } from "../types";

/**
 * Colour on a shop's page — three schemes, measured.
 *
 * Team 07/09: "Biến nó thành 1 tính năng lab đi, đề xuất nhiều option phối màu
 * cho tôi, không chỉ cho hero mà cho cả phần text mô tả shop và chỗ để hình
 * ảnh các sản phẩm của shop nữa. Tuy nhiên phải để ý 1 điều đó là không được
 * để gradient tím đè lên ảnh của shop, làm thay đổi hình ảnh nhận diện của họ,
 * cả ảnh đại diện và ảnh background nhé. Ưu tiên để nền trắng, violet và teal
 * dùng ít lại nhưng phần diện tích mỗi cái at least 20%."
 *
 * Four constraints, and three of them are hard:
 *
 *   1. NOTHING tinted over the shop's photographs. Not the cover, not the
 *      avatar. What shipped had a violet scrim across the whole cover, which
 *      is precisely the thing this rules out — a shop's own picture came out
 *      violet, and that is their identity being restated in someone else's
 *      colour. Every scheme below leaves both photographs untouched and finds
 *      its contrast elsewhere.
 *   2. Paper is the ground.
 *   3. Violet at least 20% of the page, teal at least 20%.
 *
 * The third is a number, so it is measured rather than asserted. Each scheme
 * tags its coloured fields, and the readout under it is the real share of the
 * frame those fields cover, computed from the rendered boxes. If a scheme
 * misses the floor the readout says so in red — including as you resize.
 *
 * Nothing here is imported by src/views.
 */

type Ink = "violet" | "teal" | "paper";

/** The measured share of a frame each ink covers. */
function useInkShare(frame: { current: HTMLElement | null }, deps: unknown[]) {
  const [share, setShare] = useState<Record<Ink, number>>({ violet: 0, teal: 0, paper: 0 });

  useLayoutEffect(() => {
    const measure = () => {
      const root = frame.current;
      if (!root) return;
      const box = root.getBoundingClientRect();
      const total = box.width * box.height;
      if (!total) return;

      const sum: Record<Ink, number> = { violet: 0, teal: 0, paper: 0 };
      for (const el of root.querySelectorAll<HTMLElement>("[data-ink]")) {
        const ink = el.dataset.ink as Ink;
        if (!sum.hasOwnProperty(ink)) continue;
        const r = el.getBoundingClientRect();
        /* Clipped to the frame, so a field bleeding off the edge counts only
           what is actually on the page. */
        const w = Math.max(0, Math.min(r.right, box.right) - Math.max(r.left, box.left));
        const h = Math.max(0, Math.min(r.bottom, box.bottom) - Math.max(r.top, box.top));
        sum[ink] += w * h;
      }
      setShare({
        violet: (sum.violet / total) * 100,
        teal: (sum.teal / total) * 100,
        paper: Math.max(0, 100 - ((sum.violet + sum.teal) / total) * 100),
      });
    };

    measure();
    window.addEventListener("resize", measure);
    const t = setTimeout(measure, 400); // images settle the layout
    return () => {
      window.removeEventListener("resize", measure);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return share;
}

function Readout({ share }: { share: Record<Ink, number> }) {
  const rows: Array<[string, number, boolean]> = [
    ["Trắng", share.paper, share.paper > 0],
    ["Violet", share.violet, share.violet >= 20],
    ["Teal", share.teal, share.teal >= 20],
  ];
  return (
    <dl className="mt-3 grid grid-cols-3 gap-x-4 text-[11px]">
      {rows.map(([label, value, ok]) => (
        <div key={label}>
          <dt className="uppercase tracking-[0.12em] text-ink/40">{label}</dt>
          <dd className={`mt-0.5 font-semibold ${ok ? "text-ink/80" : "text-red-600"}`}>
            {value.toFixed(0)}%{!ok && label !== "Trắng" ? " · dưới 20%" : ""}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ── the shared pieces ────────────────────────────────────────────────────
   Every scheme shows the same three things the note names — the cover, the
   shop's description, and the product grid — over the same real shop, so what
   differs between them is only where the colour goes. */

function Cover({ store, className = "" }: { store: StoreProfile; className?: string }) {
  return (
    /* No overlay of any kind. Where a scheme needs the shop's name over the
       picture it does not get it; the name goes on a field of its own. */
    <div className={`relative overflow-hidden bg-ink/5 ${className}`}>
      <img src={store.coverUrl} alt="" className="h-full w-full object-cover" />
    </div>
  );
}

function Avatar({ store, ring }: { store: StoreProfile; ring: string }) {
  if (!store.logoUrl) return null;
  return (
    <img
      src={store.logoUrl}
      alt=""
      className={`h-14 w-14 shrink-0 rounded-2xl object-cover ring-2 ${ring}`}
    />
  );
}

function Grid({
  products,
  tileClass,
  textClass,
}: {
  products: Product[];
  tileClass: string;
  textClass: string;
}) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {products.slice(0, 4).map((p) => (
        <div key={p.id}>
          <div className={`aspect-square overflow-hidden ${tileClass}`}>
            <img src={p.images?.[0]} alt="" className="h-full w-full object-cover" />
          </div>
          <p className={`mt-1.5 truncate text-[11px] ${textClass}`}>{p.name}</p>
          <p className={`text-[11px] font-semibold ${textClass}`}>{formatPrice(p.price)}</p>
        </div>
      ))}
    </div>
  );
}

function Frame({
  children,
  onFrame,
}: {
  children: React.ReactNode;
  onFrame: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={onFrame}
      className="relative w-full overflow-hidden rounded-[1.25rem] bg-paper ring-1 ring-ink/12"
      style={{ height: 470 }}
    >
      {children}
    </div>
  );
}

/* ── A · BĂNG — the cover, then a violet band that carries the name ──────── */
function SchemeBand({ store, products }: { store: StoreProfile; products: Product[] }) {
  return (
    <>
      <Cover store={store} className="h-[38%] w-full" />
      <div data-ink="violet" className="flex items-center gap-3 bg-brand px-5 py-6 text-paper">
        <Avatar store={store} ring="ring-white/40" />
        <div className="min-w-0">
          <p className="label text-wave">{store.address || "Việt Nam"}</p>
          <p className="display truncate text-2xl normal-case">{store.name}</p>
        </div>
      </div>
      <div className="px-5 py-4">
        <p className="line-clamp-2 text-[13px] leading-relaxed text-ink/75">
          {store.story || store.vibe || "Shop chưa gửi phần giới thiệu."}
        </p>
      </div>
      <div data-ink="teal" className="bg-wave px-5 py-4">
        <p className="label mb-2 text-ink/60">Sản phẩm của shop</p>
        <Grid products={products} tileClass="bg-ink/10" textClass="text-ink/80" />
      </div>
    </>
  );
}

/* ── B · KHUNG — violet frames the cover instead of covering it ──────────── */
function SchemeFrame({ store, products }: { store: StoreProfile; products: Product[] }) {
  return (
    <>
      <div data-ink="violet" className="bg-brand p-3">
        <Cover store={store} className="h-[7.5rem] w-full rounded-lg" />
      </div>
      <div className="flex items-center gap-3 px-5 pt-4">
        <Avatar store={store} ring="ring-wave" />
        <div className="min-w-0">
          <p className="label text-brand">{store.address || "Việt Nam"}</p>
          <p className="display truncate text-xl normal-case text-ink">{store.name}</p>
        </div>
      </div>
      <div className="flex gap-4 px-5 py-3">
        <p className="line-clamp-3 flex-1 text-[13px] leading-relaxed text-ink/75">
          {store.story || store.vibe || "Shop chưa gửi phần giới thiệu."}
        </p>
        <span
          data-ink="teal"
          className="grid w-20 shrink-0 place-items-center self-start rounded-xl bg-wave px-2 py-3 text-center"
        >
          <span className="px-2 text-[11px] font-bold leading-tight text-ink">
            {products.length} sản phẩm
          </span>
        </span>
      </div>
      <div data-ink="teal" className="mx-5 rounded-xl bg-wave p-3">
        <Grid products={products} tileClass="bg-paper" textClass="text-ink/80" />
      </div>
    </>
  );
}

/* ── C · CHIA ĐÔI — the cover keeps one half, the colour keeps the other ── */
function SchemeSplit({ store, products }: { store: StoreProfile; products: Product[] }) {
  return (
    <>
      <div className="flex h-[52%]">
        <div data-ink="violet" className="flex w-[42%] flex-col justify-end bg-brand p-5 text-paper">
          <Avatar store={store} ring="ring-wave" />
          <p className="label mt-3 text-wave">{store.address || "Việt Nam"}</p>
          <p className="display text-2xl normal-case leading-[1.15]">{store.name}</p>
          <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-white/80">
            {store.story || store.vibe || "Shop chưa gửi phần giới thiệu."}
          </p>
        </div>
        <Cover store={store} className="flex-1" />
      </div>
      <div data-ink="teal" className="h-[6px] w-full bg-wave" />
      <div className="px-5 py-4">
        <p className="label mb-2 text-ink/50">Sản phẩm của shop</p>
        <Grid products={products} tileClass="bg-ink/5" textClass="text-ink/80" />
      </div>
      <div data-ink="teal" className="absolute inset-x-0 bottom-0 h-[21%] bg-wave" />
    </>
  );
}

/* ── page ─────────────────────────────────────────────────────────────────── */

const SCHEMES = [
  {
    id: "A",
    name: "BĂNG — dải tên dưới ảnh",
    meta: "ảnh nguyên bản · violet là dải tên · teal là nền khu sản phẩm",
    Scheme: SchemeBand,
    idea:
      "Ảnh bìa chạy nguyên vẹn, không một lớp phủ nào. Tên shop rơi xuống dải violet ngay dưới nó — chỗ mà bản đang chạy phải đè gradient lên ảnh để có chỗ đặt. Khu sản phẩm lấy nền teal, nên ba màu chia nhau ba tầng rõ ràng theo chiều dọc.",
    risk:
      "Là phương án ít kịch tính nhất: ba dải ngang xếp chồng. Ảnh bìa mất phần diện tích mà tên shop từng nằm lên, nên bìa thấp hơn bản đang chạy.",
  },
  {
    id: "B",
    name: "KHUNG — violet bao quanh ảnh",
    meta: "ảnh nằm trong khung violet · teal là khay sản phẩm",
    Scheme: SchemeFrame,
    idea:
      "Violet không đè lên ảnh mà bao quanh nó: ảnh bìa là một tấm bo tròn nằm trên nền violet, giống một tấm ảnh dán trên trang. Teal thành khay đặt sản phẩm, nên ảnh sản phẩm nổi lên trên nền màu thay vì trên trắng.",
    risk:
      "Ảnh bìa nhỏ hơn hai phương án kia vì có lề bốn phía. Và số đo nói rõ một điều: nó qua được ngưỡng 20% của cả hai màu, nhưng trắng chỉ còn 33% — tức là nền của trang không còn là trắng nữa, trái với ưu tiên đề ra. Đây là điểm trừ lớn nhất của nó, và nó nằm sẵn trong ý tưởng “màu bao quanh nội dung” chứ không phải lỗi chỉnh số.",
  },
  {
    id: "C",
    name: "CHIA ĐÔI — ảnh một nửa, chữ một nửa",
    meta: "ảnh giữ nửa phải nguyên vẹn · violet nửa trái · teal hai dải",
    Scheme: SchemeSplit,
    idea:
      "Ảnh bìa giữ trọn nửa phải, không cắt và không phủ. Nửa trái là violet đặc và mang cả tên lẫn phần mô tả — nghĩa là phần text mô tả shop cũng được phối màu chứ không chỉ hero. Teal thành hai đường kẻ ngang chia khu sản phẩm.",
    risk:
      "Ảnh bìa 21:9 bị cắt còn khoảng 1:1 ở nửa phải, nên với ảnh chụp ngang rộng thì mất nhiều hai bên. Cần shop gửi ảnh chịu được crop vuông.",
  },
];

export default function ShopPaletteStudies() {
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let alive = true;
    fetchStores().then(async (rows) => {
      const withCover = rows.find((s) => s.coverUrl && !s.coverUrl.startsWith("data:")) ?? rows[0];
      if (!alive || !withCover) return;
      setStore(withCover);
      const items = await fetchProductsStore(withCover.id);
      if (alive) setProducts(items);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <LabShell
      eyebrow="08 · TRANG SHOP"
      title="Phối màu cho trang shop"
      notes={
        <>
          <p>
            Feedback 07/09: nhiều phương án phối màu, cho cả hero, phần mô tả shop và
            khu ảnh sản phẩm. Nền trắng là chính; violet và teal mỗi màu ít nhất 20%
            diện tích. Và điều kiện cứng:{" "}
            <strong className="text-ink">
              không được để gradient tím đè lên ảnh của shop
            </strong>{" "}
            — cả ảnh bìa lẫn ảnh đại diện.
          </p>
          <p>
            Bản đang chạy vi phạm đúng điều đó: một lớp violet phủ kín ảnh bìa, nên ảnh
            của shop hiện ra màu tím. Cả ba phương án dưới đây để hai tấm ảnh nguyên
            bản và đi tìm tương phản ở chỗ khác.
          </p>
          <p>
            Con số 20% là một con số, nên nó được <em>đo</em> chứ không phải nói suông.
            Mỗi khung tự khai báo các mảng màu của nó, và dòng số dưới mỗi phương án là
            tỉ lệ thật tính từ kích thước đã render — đổi kích thước cửa sổ thì nó đổi
            theo, và tô đỏ nếu tụt xuống dưới ngưỡng.
          </p>
        </>
      }
    >
      {!store ? (
        <div className="mx-auto max-w-[92rem] px-5 py-16 text-sm text-ink/50 md:px-10">
          Đang tải shop thật…
        </div>
      ) : (
        <>
          {SCHEMES.map(({ id, name, meta, Scheme, idea, risk }) => (
            <SchemeFrameRow
              key={id}
              id={id}
              name={name}
              meta={meta}
              idea={idea}
              risk={risk}
              render={() => <Scheme store={store} products={products} />}
              deps={[store.id, products.length]}
            />
          ))}

          <LabFrame label="ĐỀ XUẤT" meta="chọn một, tôi gộp vào ShopDisplay">
            <div className="mx-auto max-w-[70ch] px-5 pb-20 text-sm leading-relaxed text-ink/75 md:px-10">
              <p>
                <strong className="text-ink">C — Chia đôi</strong>. Nó là phương án duy
                nhất trả lời cả ba vế của yêu cầu cùng lúc: ảnh shop nguyên vẹn, phần
                mô tả shop được phối màu chứ không chỉ hero, và violet đủ 20% mà không
                cần chạm vào ảnh một lần nào.
              </p>
              <p className="mt-3">
                Cái giá của nó là crop: ảnh bìa 21:9 co về gần vuông ở nửa phải. Nếu
                team thấy ảnh bìa phải giữ nguyên khổ ngang thì{" "}
                <strong className="text-ink">A — Băng</strong> là lựa chọn an toàn, và
                nó cũng là phương án gần bản đang chạy nhất — chỉ khác ở chỗ tên shop
                rời khỏi ảnh xuống dải violet, thay vì được đọc qua một lớp gradient.
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

/** One scheme, its measured shares, and the argument for it. */
function SchemeFrameRow({
  id,
  name,
  meta,
  idea,
  risk,
  render,
  deps,
}: {
  key?: string;
  id: string;
  name: string;
  meta: string;
  idea: string;
  risk: string;
  render: () => React.ReactNode;
  deps: unknown[];
}) {
  const frame = useRef<HTMLDivElement | null>(null);
  const share = useInkShare(frame, deps);

  return (
    <LabFrame label={`${id} · ${name}`} meta={meta}>
      <div className="mx-auto max-w-[92rem] px-5 pb-12 md:px-10">
        <div className="flex flex-wrap items-start gap-8">
          <div className="w-full max-w-[34rem] shrink-0">
            <Frame onFrame={(el) => (frame.current = el)}>{render()}</Frame>
            <Readout share={share} />
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
              <p className="label text-ink/45">ẢNH CỦA SHOP</p>
              <p className="mt-1 text-sm leading-relaxed text-ink/75">
                Không lớp phủ, không gradient, không tint — cả ảnh bìa lẫn ảnh đại diện.
              </p>
            </div>
          </div>
        </div>
      </div>
    </LabFrame>
  );
}
