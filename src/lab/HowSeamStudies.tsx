/* No @types/react in the project, so the React namespace has to be pulled in
   explicitly before React.CSSProperties resolves — same note as labShared.tsx. */
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LabShell, LabFrame } from "./labShared";
import { RibbonLoop, WaveBottomCropped } from "../components/BrandShapes";

/**
 * "Cách đặt hàng" — the two seams around it.
 *
 * Team 31/08: the section reads well after the spacing pass but sits empty,
 * and the two gradient blends on either side of it are doing nothing. Two
 * replacements, both about how one ground becomes the next:
 *
 *   · Above, into "What's in store": the boundary itself bends. While the
 *     seam is low on screen the white below bulges UP into the violet; as it
 *     crosses the middle of the viewport it flattens to a straight line; by
 *     the time it is near the top the violet has bulged DOWN into the white.
 *     One boundary, inverting as it travels — the effect in the reference
 *     clip, where a white ground becomes a beige one.
 *
 *   · Below, into "Chưa biết mua gì?": no gradient and no motion, just the
 *     brand's cropped wave rising through the seam.
 *
 * The constraint that shapes the whole thing: "tỉ lệ cong phải đồng nhất ở
 * bản mobile và bản PC". A seam whose height is a fixed number of pixels
 * cannot do that — at 375px a 160px band is a deep scoop, at 1440px it is a
 * faint ripple. So the band carries an aspect *ratio* instead, its viewBox
 * matches that ratio, and preserveAspectRatio="none" is therefore a no-op
 * rather than a distortion. The curve is then the same shape at every width by
 * construction, and the readout under the demo measures it rather than
 * claiming it.
 *
 * Nothing in src/lab is imported by src/views.
 */

/* The four steps are a local const in Homepage.tsx rather than shared data, so
   they are copied here. Copy, not import: src/lab must not reach into
   src/views. */
const HOW_STEPS = [
  {
    n: "01",
    title: "Chọn món bạn ưng",
    body: "Lướt qua sản phẩm từ các local brand Tí tuyển chọn. Thấy món hợp gu thì mở ra xem kỹ hơn.",
  },
  {
    n: "02",
    title: "Bấm ORDER NOW, chọn kênh",
    body: "Mỗi shop bán trên kênh riêng — Instagram, TikTok hay Facebook. Chọn kênh bạn hay dùng.",
  },
  {
    n: "03",
    title: "Dán tin nhắn có sẵn",
    body: "Tí soạn sẵn tên món kèm link và copy vào máy bạn. Qua shop chỉ việc dán rồi gửi.",
  },
  {
    n: "04",
    title: "Shop nhắn lại cho bạn",
    body: "Giá, còn hàng hay không, ship thế nào — bạn chốt trực tiếp với shop. Tí không giữ tiền, không qua trung gian.",
  },
];

/* ── the bending seam ─────────────────────────────────────────────────────
   One quadratic across the band. `bend` runs -1 → +1 as the seam travels from
   the bottom of the viewport to the top, and the apex offset is bend × the
   sagitta, so the curve inverts through flat exactly at the middle of the
   screen. */

const VB_W = 1000;

function useSeamBend(ref: { current: HTMLElement | null }) {
  const [bend, setBend] = useState(-1);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const middle = rect.top + rect.height / 2;
      /* 1 while the seam sits on the bottom edge of the screen, 0 at the top.
         Guard the viewport height: a 0 would make this NaN. */
      const vh = window.innerHeight || 1;
      const t = middle / vh;
      setBend(Math.max(-1, Math.min(1, 1 - 2 * t)));
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ref]);

  return bend;
}

function BendingSeam({
  sagittaRatio,
  above,
  below,
  onMeasure,
}: {
  /** Deepest bend as a fraction of the seam's own width. */
  sagittaRatio: number;
  /** Colour of the section above — this is what the path paints. */
  above: string;
  /** Colour of the section below — the band's own ground. */
  below: string;
  onMeasure?: (m: { widthPx: number; sagittaPx: number }) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const bend = useSeamBend(ref);

  /* Everything below is in viewBox units, and the band's aspect ratio is set
     from the same numbers — so the drawn shape is width-independent. */
  const sagitta = VB_W * sagittaRatio;
  const height = sagitta * 2.4; // room for the full swing either side of flat
  const edge = height / 2;
  const apexOffset = sagitta * bend;
  // a quadratic's apex sits halfway between its endpoints and its control
  const control = edge + apexOffset * 2;

  /* A ResizeObserver, not a window resize listener: the width control narrows
     the column through React state, which never fires a window resize — so a
     listener kept reporting 1440px while the seam was actually 375px wide, and
     the readout that exists to prove the ratio was the one thing lying about
     it. */
  useEffect(() => {
    if (!onMeasure) return;
    const el = ref.current;
    if (!el) return;

    const report = () => {
      const w = el.getBoundingClientRect().width;
      onMeasure({ widthPx: Math.round(w), sagittaPx: Math.round(w * sagittaRatio) });
    };

    const observer = new ResizeObserver(report);
    observer.observe(el);
    report();
    return () => observer.disconnect();
  }, [onMeasure, sagittaRatio]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none relative w-full"
      style={{
        aspectRatio: String(VB_W / height),
        background: below,
        // hairline insurance against subpixel gaps at the section joins
        marginTop: -1,
        marginBottom: -1,
      }}
    >
      <svg
        viewBox={`0 0 ${VB_W} ${height}`}
        preserveAspectRatio="none"
        className="absolute inset-0 block h-full w-full"
      >
        <path
          fill={above}
          d={`M0,0 L${VB_W},0 L${VB_W},${edge} Q${VB_W / 2},${control} 0,${edge} Z`}
        />
      </svg>
    </div>
  );
}

/* ── the section itself ───────────────────────────────────────────────────── */

function HowSection({
  crestRatio,
  colWidth,
}: {
  crestRatio: number;
  /* The column the section is actually being drawn in.

     Tailwind's md: variants key off the VIEWPORT, so inside a 375px preview
     column on a 1440px screen they still resolve to the desktop layout — the
     first pass at this page put four desktop cards in a phone-wide column and
     ran them off both edges. The fan therefore takes its breakpoint and its
     overlap from the column it is in, not from the window. */
  colWidth: number;
}) {
  const narrow = colWidth < 768;
  const overlap = Math.round(colWidth * 0.07);
  const cardWidth = Math.round(colWidth * 0.26);
  return (
    <section className="relative overflow-hidden bg-paper text-ink">
      {/* The brand loop itself, not a redrawing of it.

          An earlier pass lifted the eye's sub-path out and filled it teal.
          That inverted the mark: in the artwork the almond is a HOLE with the
          violet dot inside it, and the teal is the band running around it —
          which is the colour inversion the 04/09 note caught. Rendering the
          real path keeps the hole, so the section's own white shows through.

          Mirrored, per the same note: the artwork points its loop up-left with
          the tail sweeping right, and the mock has it the other way round.

          Layer rule: brand marks go UNDER the content. z-0 here against z-10
          on the column below — the canva mock had this the other way round,
          which is only an artefact of how it was assembled. */}
      {/* Anchored to the section's bottom edge and nudged with a transform,
          not with `bottom: -14%`. A percentage offset resolves against the
          section's HEIGHT, and this section is roughly twice as tall on a
          phone as on a desktop — so the same -14% dropped the mark clean off
          the bottom of the mobile column. A translate percentage resolves
          against the mark's own box, so it sits the same way at every width. */}
      <RibbonLoop
        className="pointer-events-none absolute bottom-0 left-[-14%] z-0 w-[32%] max-w-[30rem]"
        style={{ transform: "translateY(26%) scaleX(-1)" }}
        ribbon="var(--color-wave)"
        dot="var(--color-brand)"
      />

      <div className="relative z-10 px-5 pb-14 pt-11 md:px-10 md:pb-20 md:pt-14">
        <div className="text-center">
          <h2 className="display text-[clamp(1.75rem,min(5.6vw,7.5dvh),4.5rem)] normal-case leading-none text-ink">
            Cách đặt hàng
          </h2>
        </div>

        <ol
          className={`mt-8 flex ${
            narrow ? "flex-col items-stretch" : "mt-10 flex-row justify-center"
          }`}
        >
          {HOW_STEPS.map((step, i) => (
            <li
              key={step.n}
              className="relative"
              style={{
                zIndex: i + 1,
                marginTop: narrow && i > 0 ? -20 : undefined,
                marginLeft: !narrow && i > 0 ? -overlap : undefined,
                width: narrow ? undefined : cardWidth,
                maxWidth: narrow ? undefined : "27rem",
              }}
            >
              <div
                className={`flex h-full flex-col rounded-[1.75rem] p-6 ring-4 ring-paper ${
                  i % 2 === 0 ? "bg-brand" : "bg-brand-deep"
                } text-paper`}
                style={{
                  minHeight: narrow ? undefined : "clamp(13.5rem, 36dvh, 23rem)",
                  // the overlap is eaten by the neighbour, so give the text back
                  // exactly what the negative margin took
                  paddingRight:
                    !narrow && i < HOW_STEPS.length - 1 ? overlap + 24 : undefined,
                }}
              >
                <h3 className="display text-[clamp(1.25rem,min(2.3vw,3.2dvh),2rem)] normal-case leading-[1.05]">
                  {step.title}
                </h3>
                <p
                  className="display mt-[clamp(0.5rem,1.6dvh,1rem)] text-[clamp(2rem,min(4.2vw,5.5dvh),3.5rem)] normal-case leading-none text-wave"
                  aria-hidden="true"
                >
                  {step.n}.
                </p>
                <p className="mt-[clamp(0.75rem,2.2dvh,1.5rem)] max-w-[32ch] text-[13px] leading-relaxed text-white/75">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* The seam into "Chưa biết mua gì?": no gradient, no motion, just the
          next ground's crest coming up through it. */}
      <WaveBottomCropped
        className="relative z-0 -mb-px block"
        fill="var(--color-brand)"
        ratio={crestRatio}
      />
    </section>
  );
}

/* ── page ─────────────────────────────────────────────────────────────────── */

const WIDTHS = [
  { id: "full", label: "PC · full", px: 0 },
  { id: "tablet", label: "768px", px: 768 },
  { id: "phone", label: "375px", px: 375 },
];

const CURVES = [
  { id: "soft", label: "Nhẹ · 0.05", value: 0.05 },
  { id: "mid", label: "Vừa · 0.075", value: 0.075 },
  { id: "deep", label: "Sâu · 0.10", value: 0.1 },
];

export default function HowSeamStudies() {
  const [width, setWidth] = useState(WIDTHS[0]);
  const [curve, setCurve] = useState(CURVES[1]);
  const [crestRatio, setCrestRatio] = useState(0.24);
  const [measured, setMeasured] = useState<{ widthPx: number; sagittaPx: number } | null>(null);

  /* "PC · full" means the real viewport; the other two are simulated columns.
     Either way the section needs the number, because its own breakpoint has to
     follow the column rather than the window. */
  const [viewportWidth, setViewportWidth] = useState(1440);
  useEffect(() => {
    const sync = () => setViewportWidth(window.innerWidth);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);
  const colWidth = width.px || viewportWidth;

  const frame: React.CSSProperties = width.px
    ? { maxWidth: width.px, marginInline: "auto" }
    : {};

  return (
    <LabShell
      eyebrow="06 · CÁCH ĐẶT HÀNG"
      title="Hai đường ranh giới quanh phần Cách đặt hàng"
      notes={
        <>
          <p>
            Feedback 31/08: phần này sau khi chỉnh spacing thì ổn, nhưng trống.
            Hai gradient hai bên đang không làm gì cả — thay cả hai.
          </p>
          <p>
            <strong>Trên</strong> (từ "What's in store"): chính đường ranh giới
            uốn. Khi seam còn thấp trên màn hình thì phần trắng bên dưới{" "}
            <em>vồng lên</em> vào nền tím; qua giữa màn hình nó thành đường
            thẳng; lên gần đỉnh thì nền tím <em>vồng xuống</em> vào phần trắng.
            Một đường ranh giới, tự lộn ngược khi đi qua màn hình.
          </p>
          <p>
            <strong>Dưới</strong> (sang "Chưa biết mua gì?"): bỏ gradient, không
            animation, chỉ có <code>brand-wave-bottom-cropped</code> nhô lên qua
            ranh giới.
          </p>
          <p className="text-ink/55">
            Ràng buộc quyết định cách làm: <em>"tỉ lệ cong phải đồng nhất ở bản
            mobile và bản PC"</em>. Một dải cao cố định theo pixel không làm được
            — 160px ở màn 375px là một cái hõm sâu, ở 1440px là gợn sóng. Nên dải
            mang <strong>tỉ lệ</strong>, viewBox khớp đúng tỉ lệ đó, và{" "}
            <code>preserveAspectRatio="none"</code> vì thế không méo gì cả. Đổi
            bề ngang bên dưới rồi xem số đo tự kiểm chứng.
          </p>
        </>
      }
    >
      <LabFrame
        label="ĐIỀU KHIỂN"
        meta="đổi bề ngang để kiểm tra tỉ lệ cong có đổi không"
      >
        <div className="mx-auto max-w-[92rem] px-5 pb-6 md:px-10">
          <div className="flex flex-wrap items-start gap-x-10 gap-y-5">
            <div>
              <p className="label text-ink/45">BỀ NGANG</p>
              <div className="mt-2 flex gap-2">
                {WIDTHS.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setWidth(w)}
                    className={`rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
                      w.id === width.id
                        ? "border-brand bg-brand text-paper"
                        : "border-ink/15 text-ink/70 hover:border-brand hover:text-brand"
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="label text-ink/45">ĐỘ CONG (sagitta / bề ngang)</p>
              <div className="mt-2 flex gap-2">
                {CURVES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCurve(c)}
                    className={`rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
                      c.id === curve.id
                        ? "border-brand bg-brand text-paper"
                        : "border-ink/15 text-ink/70 hover:border-brand hover:text-brand"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="label text-ink/45">SÓNG DƯỚI (phần cắt / bề ngang)</p>
              <div className="mt-2 flex gap-2">
                {[0.18, 0.24, 0.3].map((r) => (
                  <button
                    key={r}
                    onClick={() => setCrestRatio(r)}
                    className={`rounded-full border px-3 py-1.5 text-[12px] tabular-nums transition-colors ${
                      r === crestRatio
                        ? "border-brand bg-brand text-paper"
                        : "border-ink/15 text-ink/70 hover:border-brand hover:text-brand"
                    }`}
                  >
                    {r.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {measured && (
            <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] sm:grid-cols-4">
              {[
                ["Bề ngang seam", `${measured.widthPx}px`],
                ["Độ cong tối đa", `${measured.sagittaPx}px`],
                [
                  "Tỉ lệ đo được",
                  (measured.sagittaPx / Math.max(1, measured.widthPx)).toFixed(3),
                ],
                ["Đặt ra", curve.value.toFixed(3)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="uppercase tracking-[0.12em] text-ink/40">{k}</dt>
                  <dd className="mt-0.5 font-medium text-ink/80">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          <p className="mt-4 max-w-[70ch] text-sm leading-relaxed text-ink/60">
            Cuộn qua khối bên dưới để thấy ranh giới trên lộn từ vồng lên → thẳng
            → vồng xuống. "Tỉ lệ đo được" phải giữ nguyên khi đổi bề ngang — đó
            là toàn bộ mục đích của cách dựng này.
          </p>
        </div>
      </LabFrame>

      {/* The demo runs in normal page flow so the seam reads real scroll
          position. The width control only narrows the column, which is exactly
          what makes the ratio testable. */}
      <div style={frame} className="border-t border-ink/10">
        <section className="relative bg-brand px-5 pb-24 pt-16 text-paper md:px-10 md:pb-32">
          <h2 className="display text-center text-[clamp(2rem,5.6vw,4.5rem)] normal-case leading-none">
            What&rsquo;s in store
          </h2>
          <p className="mx-auto mt-4 max-w-[46ch] text-center text-sm text-white/70">
            (khối giả lập — chỉ để có nền tím phía trên đường ranh giới)
          </p>
        </section>

        <BendingSeam
          sagittaRatio={curve.value}
          above="var(--color-brand)"
          below="var(--color-paper)"
          onMeasure={setMeasured}
        />

        <HowSection crestRatio={crestRatio} colWidth={colWidth} />

        <section className="relative bg-brand px-5 pb-32 pt-16 text-paper md:px-10">
          <h2 className="display text-center text-[clamp(2rem,5.6vw,4.5rem)] normal-case leading-none">
            Chưa biết mua gì?
          </h2>
          <p className="mx-auto mt-4 max-w-[46ch] text-center text-sm text-white/70">
            (khối giả lập — nền tím phía dưới, sóng ở trên nhô lên từ đây)
          </p>
        </section>
      </div>

      <LabFrame label="GHI CHÚ" meta="chốt xong tôi gộp vào Homepage">
        <div className="mx-auto max-w-[70ch] px-5 pb-20 text-sm leading-relaxed text-ink/75 md:px-10">
          <p>
            Hai <code>GroundBlend</code> quanh <code>HowItWorks</code> trong{" "}
            <code>src/views/Homepage.tsx</code> là chỗ sẽ thay: cái trên thành{" "}
            <code>BendingSeam</code>, cái dưới thành{" "}
            <code>WaveBottomCropped</code> (đã thêm vào{" "}
            <code>BrandShapes.tsx</code>).
          </p>
          <p className="mt-3">
            Ribbon loop đặt <code>z-0</code>, thẻ steps <code>z-10</code> — theo
            đúng quy tắc anh nói: element brand nằm dưới layer nội dung chính.
            Bản canva để ribbon đè lên thẻ chỉ là do thứ tự layer lúc dựng.
          </p>
          <p className="mt-3">
            Phần này dựng bản thẻ <em>không pin</em> cho dễ quan sát seam. Bản
            đang chạy trên desktop có pin cuộn — seam nằm ở đầu section nên nó
            uốn xong trước khi pin bắt đầu, không đụng nhau.
          </p>
          <p className="mt-6">
            <Link to="/lab" className="font-semibold text-brand hover:underline">
              ← Về Lab
            </Link>
          </p>
        </div>
      </LabFrame>
    </LabShell>
  );
}
