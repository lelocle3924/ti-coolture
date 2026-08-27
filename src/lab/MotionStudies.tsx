/* No @types/react in this project — see the note in labShared.tsx. */
import type React from "react";
import { useState } from "react";
import { ArrowUpRight, RotateCcw, StarIcon } from "lucide-react";
import { LabShell, Spec, type SpecProps } from "./labShared";

/* ═══════════════════════════════════════════════════════════════════════════
   MOTION — proposals, one per component

   The site's current position is written down in src/index.css: "Over-
   Exaggerated Motion & Spring Physics — Authority: /animate over-exaggerate
   all motion." Everything below takes that as the starting point rather than
   arguing with it. The proposals are the places where the exaggeration is
   costing more than it returns, and they are specific: property, duration,
   easing, trigger.

   Three things decide every call here:

     1. Motion that repeats is judged at the hundredth time, not the first.
        A product grid is 77 cards; a hover that pops 10px and overshoots is
        charming once and seasick at scale.
     2. Nothing animates a property that costs layout. transform and opacity
        only. letter-spacing, width and height on a scroll timeline are the
        expensive ones the site currently has.
     3. Anything that loops forever has to earn it, because it never stops
        asking for attention and the visitor cannot look away from it.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── A/B demo scaffold ──────────────────────────────────────────────────── */

function Replay({ children }: { children: (key: number) => React.ReactNode }) {
  const [n, setN] = useState(0);
  return (
    <div>
      {children(n)}
      <button
        onClick={() => setN((v) => v + 1)}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink/15 px-3 py-1.5 text-[11px] font-semibold text-ink/70 transition-colors hover:border-brand hover:text-brand"
      >
        <RotateCcw className="h-3 w-3" />
        Chạy lại
      </button>
    </div>
  );
}

function Study({
  n,
  component,
  title,
  now,
  proposal,
  spec,
  demo,
}: {
  n: string;
  component: string;
  title: string;
  now: React.ReactNode;
  proposal: React.ReactNode;
  spec?: SpecProps;
  demo?: React.ReactNode;
}) {
  return (
    <article className="border-t border-ink/10 py-8">
      <div className="mx-auto grid max-w-[92rem] gap-6 px-5 md:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] md:px-10">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="text-[11px] tabular-nums tracking-[0.16em] text-ink/35">{n}</span>
            <span className="label text-brand">{component}</span>
          </div>
          <h3 className="display mt-1.5 text-[clamp(1.15rem,2vw,1.6rem)] normal-case leading-[1.25]">
            {title}
          </h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="label text-ink/40">HIỆN TẠI</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/70">{now}</p>
            </div>
            <div>
              <p className="label text-wave-ink">ĐỀ XUẤT</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/80">{proposal}</p>
            </div>
          </div>

          {spec && <Spec {...spec} />}
        </div>

        {demo && <div className="min-w-0">{demo}</div>}
      </div>
    </article>
  );
}

/* ── the page ───────────────────────────────────────────────────────────── */

export default function MotionStudies() {
  return (
    <LabShell
      eyebrow="TOÀN SITE"
      title="Đề xuất chuyển động cho từng component"
      notes={
        <>
          <p>
            Điểm xuất phát là dòng ghi trong <code className="text-ink">src/index.css</code>:
            “over-exaggerate all motion”. Dưới đây không cãi lại nguyên tắc đó — chỉ
            chỉ ra chỗ nào cái giá đang cao hơn cái được, kèm số cụ thể.
          </p>
          <p>
            Ba tiêu chí: chuyển động lặp lại phải chịu được lần thứ một trăm; chỉ
            animate <code className="text-ink">transform</code> và{" "}
            <code className="text-ink">opacity</code>; và thứ gì chạy vô hạn thì phải
            xứng đáng, vì nó không bao giờ ngừng đòi chú ý.
          </p>
        </>
      }
    >
      <Study
        n="01"
        component="Product / Store card · .hover-elastic"
        title="Hover đang nhảy 10px trên lưới 77 thẻ"
        now={
          <>
            <code>translateY(-10px) scale(1.035)</code> trong 450ms với đường cong
            vọt quá (0.34, 1.56, 0.64, 1), kèm hai lớp box-shadow tím và teal. Lướt
            ngang một hàng bốn thẻ là bốn lần nảy chồng lên nhau.
          </>
        }
        proposal={
          <>
            Giữ nảy cho nút, bỏ nảy cho thẻ. <code>translateY(-4px)</code> không
            scale, 220ms, ease-out thường. Ảnh bên trong vẫn được phóng nhẹ — đó mới
            là thứ đáng nhìn, và nó nằm trong khung nên không đẩy hàng xóm.
          </>
        }
        spec={{
          property: "transform, box-shadow",
          duration: "220ms",
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          trigger: "hover / focus-visible",
        }}
        demo={
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Hiện tại", cls: "lab-demo-card-now" },
              { label: "Đề xuất", cls: "lab-demo-card-next" },
            ].map((v) => (
              <div key={v.label}>
                <p className="label mb-2 text-ink/40">{v.label}</p>
                <div
                  className={`group aspect-[4/5] overflow-hidden border border-ink/10 bg-paper-warm ${
                    v.cls === "lab-demo-card-now"
                      ? "hover-elastic"
                      : "transition-transform duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1"
                  }`}
                >
                  <div className="grid h-full place-items-center text-[11px] text-ink/40">
                    rê chuột
                  </div>
                </div>
              </div>
            ))}
          </div>
        }
      />

      <Study
        n="02"
        component="Grid reveal · .rev"
        title="Cả lưới vào một lúc, không phải xếp hàng"
        now={
          <>
            <code>animation-range</code> chia theo <code>nth-child(2n)</code> và{" "}
            <code>(3n)</code>, nên thứ tự vào phụ thuộc vị trí trong DOM chứ không
            phải vị trí trên màn hình. Ở lưới bốn cột, thẻ 1 và 3 vào cùng nhau còn
            thẻ 2 và 4 lệch đi — đọc như lỗi hơn là như nhịp.
          </>
        }
        proposal={
          <>
            Một đợt cho cả hàng đang lộ ra, trễ 45ms giữa các thẻ và dừng ở thẻ thứ
            tư. Tổng độ trễ không vượt 180ms: quá mức đó thì thẻ cuối cùng đến sau
            khi mắt đã đọc xong thẻ đầu.
          </>
        }
        spec={{
          property: "transform, opacity",
          duration: "460ms",
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          trigger: "IntersectionObserver, một lần",
        }}
        demo={
          <Replay>
            {(k) => (
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Trễ 180ms/thẻ", cls: "lab-stagger lab-stagger--slow" },
                  { label: "Trễ 45ms/thẻ", cls: "lab-stagger" },
                ].map((v) => (
                  <div key={v.label}>
                    <p className="label mb-2 text-ink/40">{v.label}</p>
                    <div key={k} className={`grid grid-cols-2 gap-2 ${v.cls}`}>
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="aspect-square bg-brand/12" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Replay>
        }
      />

      <Study
        n="03"
        component="Hidden Gems · .gem-star"
        title="Ngôi sao đang nhấp nháy vô hạn"
        now={
          <>
            <code>gem-pulse</code> chạy 2s lặp mãi: scale 0.75 → 1.45, xoay −10° →
            15°, và ba lớp drop-shadow phát sáng. Nó nằm cố định ở mép phải suốt cả
            trang, nên không bao giờ ra khỏi tầm mắt ngoại vi.
          </>
        }
        proposal={
          <>
            Đập ba nhịp rồi nghỉ. Lặp lại chỉ khi tab được focus lại hoặc khi nội
            dung gem đổi — tức là khi thật sự có tin mới. Bỏ hai lớp drop-shadow
            ngoài; một lớp là đủ và rẻ hơn nhiều khi lặp.
          </>
        }
        spec={{
          property: "transform, filter (1 lớp)",
          duration: "1.6s × 3, rồi dừng",
          easing: "var(--ease-brand)",
          trigger: "mount + khi gem đổi",
        }}
        demo={
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Hiện tại (vô hạn)", cls: "gem-star" },
              { label: "Đề xuất (3 nhịp)", cls: "" },
            ].map((v) => (
              <div key={v.label}>
                <p className="label mb-2 text-ink/40">{v.label}</p>
                <div className="grid h-24 place-items-center bg-ink">
                  <StarIcon
                    className={`h-6 w-6 fill-wave text-wave ${v.cls}`}
                    style={
                      v.cls
                        ? undefined
                        : { animation: "gem-pulse 1.6s var(--ease-brand) 3" }
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        }
      />

      <Study
        n="04"
        component="Reveal footer · .footer-wordmark"
        title="Chữ ký cuối trang đang animate letter-spacing"
        now={
          <>
            <code>wm-rise</code> chạy <code>letter-spacing 0.1em → −0.04em</code>{" "}
            trên một scroll timeline, ở cỡ chữ tới 15rem. letter-spacing buộc trình
            duyệt dựng lại dòng chữ mỗi khung hình — đúng loại thuộc tính đắt nhất,
            ở đúng chỗ chữ to nhất.
          </>
        }
        proposal={
          <>
            Giữ nguyên hiệu ứng nhìn thấy, đổi cách làm: đặt letter-spacing cố định
            ở giá trị cuối và scrub <code>transform: scaleX()</code> từ 1.06 → 1.
            Mắt đọc ra cùng một chuyển động, nhưng nó chạy trên compositor.
          </>
        }
        spec={{
          property: "transform, opacity",
          duration: "scroll-linked",
          easing: "linear (scrub)",
          trigger: "animation-timeline: view()",
        }}
      />

      <Study
        n="05"
        component="View transitions · index.css"
        title="Chuyển trang đang vọt quá hai lần"
        now={
          <>
            <code>::view-transition-new(root)</code> vào bằng{" "}
            <code>scale(1.04) → 1</code> với đường cong vọt quá, 450–480ms, và
            group timing để 520ms. Với điều hướng lọc/sắp xếp thì cả trang nảy mỗi
            lần bấm một chip.
          </>
        }
        proposal={
          <>
            Vọt quá dành cho thứ do người dùng trực tiếp kéo. Chuyển trang thì đi
            thẳng: 260ms ease-out, không scale, chỉ trượt 24px theo hướng. Và không
            chạy view transition cho đổi bộ lọc — đó là cập nhật danh sách, không
            phải rời trang.
          </>
        }
        spec={{
          property: "transform, opacity",
          duration: "260ms",
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          trigger: "điều hướng thật, không phải đổi filter",
        }}
        demo={
          <Replay>
            {(k) => (
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Linear 620ms", cls: "lab-demo-before" },
                  { label: "Ease-out 520ms", cls: "lab-demo-after" },
                ].map((v) => (
                  <div key={v.label}>
                    <p className="label mb-2 text-ink/40">{v.label}</p>
                    <div className="h-24 overflow-hidden bg-paper-warm">
                      <div key={k} className={`h-full ${v.cls} bg-brand/15`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Replay>
        }
      />

      <Study
        n="06"
        component="District map · ghim"
        title="Ghim đang xuất hiện, chưa cắm xuống"
        now={
          <>
            Đổi quận thì đảo trượt còn ghim chỉ hiện ra cùng lúc với nó. Không có gì
            nói rằng ghim thuộc về mặt đất bên dưới.
          </>
        }
        proposal={
          <>
            Thả ghim theo thứ tự lộ trình, trễ 70ms mỗi cái, nảy nhẹ khi chạm đất.
            Bốn ghim xong trong 480ms — vẫn kịp trước khi người xem kịp nhìn sang.
            Đây cũng là cách chỉ ra thứ tự các điểm mà không cần viết ra.
          </>
        }
        spec={{
          property: "transform, opacity",
          duration: "480ms, trễ 70ms/ghim",
          easing: "var(--ease-brand)",
          trigger: "khi quận đang xem đổi",
        }}
      />

      <Study
        n="07"
        component="Header · pill"
        title="Đổi tông nền cần bám theo nền, không theo đồng hồ"
        now={
          <>
            Tông sáng/tối đổi trong 500ms bằng <code>transition-colors</code>. Cuộn
            nhanh qua ranh giới hai section thì màu chạy sau nội dung khoảng nửa
            giây, và ở đúng khoảnh khắc đó chữ tím nằm trên nền tối.
          </>
        }
        proposal={
          <>
            Rút xuống 220ms và bắt đầu sớm hơn: dùng ngưỡng ở giữa pill thay vì mép
            dưới, để tông đổi khi ranh giới còn cách 40px. Ngắn hơn thì độ tương
            phản không bao giờ sai quá một khung hình.
          </>
        }
        spec={{
          property: "background-color, color, fill",
          duration: "220ms",
          easing: "linear",
          trigger: "data-surface đi qua tâm pill − 40px",
        }}
      />

      <Study
        n="08"
        component="Hero deck"
        title="Bộ bài đang đổi ảnh, chưa chia bài"
        now={
          <>
            Frame vào bằng transform + opacity trong 760ms. Frame cũ mờ đi tại chỗ,
            nên hai ảnh chồng nhau ở giữa quá trình và đống bài trông như một khung
            duy nhất đang crossfade.
          </>
        }
        proposal={
          <>
            Frame cũ trượt ra khỏi đỉnh đống bài (lệch 3%, xoay 3°, mờ dần) trong
            khi frame dưới nhích lên — như rút một lá khỏi cỗ bài. Cùng độ dài, khác
            ở chỗ hai lá không bao giờ chiếm cùng một chỗ.
          </>
        }
        spec={{
          property: "transform, opacity",
          duration: "760ms",
          easing: "var(--ease-brand)",
          trigger: "auto 5s / bấm chấm",
        }}
      />

      <Study
        n="09"
        component="Collections · spring tabs"
        title="Nội dung phải đến sau khi panel có chỗ"
        now={
          <>
            Bản dựng đầu cho tiles vào cùng lúc với panel. Trong khi{" "}
            <code>flex-grow</code> còn chạy thì lưới ba cột đang reflow, nên tiles
            vừa hiện vừa nhảy.
          </>
        }
        proposal={
          <>
            Trễ nội dung 180ms — panel đã lấy được phần lớn chiều rộng thì tiles mới
            vào. Đây là cách hiện tại trong <code>lab.css</code>, và là lý do bản
            dựng ở /lab/collections mượt hơn.
          </>
        }
        spec={{
          property: "flex-grow, sau đó transform + opacity",
          duration: "620ms panel, 380ms nội dung",
          easing: "var(--ease-brand)",
          trigger: "bấm vào gáy",
        }}
      />

      <Study
        n="10"
        component="Toast · wishlist"
        title="Toast đang vào bằng fade, ra bằng biến mất"
        now={
          <>
            <code>animate-fade-in</code> khi vào, rồi bị gỡ khỏi DOM sau 2500ms —
            không có animation ra. Nó nháy tắt.
          </>
        }
        proposal={
          <>
            Vào từ mép phải (translateX 24px → 0, 260ms), ra ngược lại trong 180ms
            rồi mới unmount. Đường ra ngắn hơn đường vào: thứ đang rời đi không cần
            được nhìn kỹ.
          </>
        }
        spec={{
          property: "transform, opacity",
          duration: "260ms vào / 180ms ra",
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          trigger: "thêm/bớt wishlist",
        }}
      />

      <Study
        n="11"
        component="Marquee · What's in store"
        title="Hai làn chạy mãi, kể cả khi không ai nhìn"
        now={
          <>
            Hai làn chạy 46s và 58s vô hạn, chỉ dừng khi hover. Chúng vẫn chạy khi
            section đã cuộn qua — tốn pin và giữ compositor bận không vì gì.
          </>
        }
        proposal={
          <>
            Dừng khi section ra khỏi khung nhìn (IntersectionObserver →{" "}
            <code>animation-play-state</code>), và khi tab bị ẩn. Không đổi gì về
            mặt nhìn thấy; chỉ là nó ngừng chạy khi không ai xem.
          </>
        }
        spec={{
          property: "animation-play-state",
          duration: "—",
          easing: "—",
          trigger: "IntersectionObserver + visibilitychange",
        }}
      />

      <Study
        n="12"
        component="Buttons · .btn-pop"
        title="scale 1.09 là quá nhiều cho nút trong dòng chữ"
        now={
          <>
            <code>scale(1.09) translateY(-3px)</code> khi hover, <code>0.92</code>{" "}
            khi nhấn. Ở một nút chính trong hero thì hợp; ở nút nhỏ nằm trong đoạn
            văn thì nó đẩy dòng chữ xung quanh.
          </>
        }
        proposal={
          <>
            Giữ <code>.btn-pop</code> cho CTA chính. Thêm{" "}
            <code>.btn-pop--quiet</code> cho nút phụ: scale 1.03, không dịch, 160ms.
            Cùng một ngôn ngữ, khác âm lượng.
          </>
        }
        spec={{
          property: "transform",
          duration: "160ms",
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          trigger: "hover / active",
        }}
      />

      <div className="mx-auto max-w-[70ch] border-t border-ink/10 px-5 py-10 text-sm leading-relaxed text-ink/70 md:px-10">
        <p className="label text-ink/50">CHUNG</p>
        <ul className="mt-3 space-y-2">
          <li>
            Mọi thứ ở trên đều phải nằm sau{" "}
            <code className="text-ink">prefers-reduced-motion</code>. Hiện{" "}
            <code className="text-ink">index.css</code> đã có guard nhưng thiếu{" "}
            <code className="text-ink">.hover-elastic</code>, <code className="text-ink">.btn-pop</code>{" "}
            và <code className="text-ink">.snap-strip &gt; *</code>.
          </li>
          <li>
            Ba độ dài cho cả site thay vì mười: 160ms (phản hồi trực tiếp), 260ms
            (đổi trạng thái), 480ms (thứ gì đó đi vào). Mọi con số khác phải có lý do
            viết ra.
          </li>
          <li>
            Một đường cong cho thứ do người dùng kéo (spring, có vọt quá) và một cho
            mọi thứ còn lại (<code className="text-ink">cubic-bezier(0.16, 1, 0.3, 1)</code>,
            không vọt).
          </li>
        </ul>

        <a
          href="/lab"
          className="mt-6 inline-flex items-center gap-2 border-b border-ink/30 pb-1 text-sm font-medium transition-colors hover:border-brand hover:text-brand"
        >
          Về Lab
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </LabShell>
  );
}
