/* No @types/react in this project — see the note in labShared.tsx. */
import type React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LabShell, LabFrame, Spec } from "./labShared";
import { formatPrice, useHomeData } from "../home/homeData";
import SaveButton from "../components/SaveButton";
import type { Product } from "../types";

/**
 * The save control on a browsing surface — show it, or wait to be asked.
 *
 * Team 07/09: "Thêm lab để đánh giá 2 option: ở What's in store và Collections
 * chỉ hiện nút tim khi hover chuột lên trên. Ở mobile thì ẩn nút tim ở what's
 * in store hoặc hiện ra."
 *
 * Two questions, and they are not the same question, which is why the page
 * asks them separately:
 *
 *   · On a desktop, is the heart always there, or does it arrive on hover?
 *     Hover is a real affordance there and the answer is a matter of how
 *     loud the row should be at rest.
 *   · On a phone there is no hover, so "reveal on hover" is not an option —
 *     it is either always visible or absent. That is a different trade: an
 *     absent control is not quieter, it is missing.
 *
 * Both options use the shipped control (src/components/SaveButton.tsx) over
 * real catalogue data, so what is being compared is the rule, not a mock.
 */

const TILE = "relative aspect-square overflow-hidden rounded-[1.25rem] bg-white/5";

function Tile({
  product,
  reveal,
  hidden,
}: {
  key?: string;
  product: Product;
  reveal: boolean;
  hidden?: boolean;
}) {
  return (
    <div className="group/tile w-full">
      <div className={TILE}>
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        {!hidden && (
          <span className="absolute right-1 top-1 z-10">
            <SaveButton product={product} revealOnHover={reveal} />
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-3 border-t border-white/15 pt-2">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[10px] tracking-[0.16em] text-white/70">
            {product.storeName.toUpperCase()}
          </span>
          <span className="mt-0.5 block truncate text-sm font-medium text-paper">
            {product.name}
          </span>
        </span>
        <span className="shrink-0 text-xs tabular-nums text-white/70">
          {formatPrice(product.price)}
        </span>
      </div>
    </div>
  );
}

/** A slice of the violet section the row really sits in. */
function Row({
  products,
  reveal,
  hidden,
  columns = 3,
}: {
  products: Product[];
  reveal: boolean;
  hidden?: boolean;
  columns?: number;
}) {
  return (
    <div className="bg-brand p-6">
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {products.map((p) => (
          <Tile key={p.id} product={p} reveal={reveal} hidden={hidden} />
        ))}
      </div>
    </div>
  );
}

/** A 390px phone, so the mobile question is judged at the size it is about. */
function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[2rem] bg-brand ring-1 ring-ink/15"
      style={{ width: 390 }}
    >
      {children}
    </div>
  );
}

export default function HeartStudies() {
  const { loading, popular } = useHomeData();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading && popular.length > 0) setReady(true);
  }, [loading, popular]);

  const three = popular.slice(0, 3);
  const one = popular.slice(0, 1);

  return (
    <LabShell
      eyebrow="07 · NÚT LƯU"
      title="Hiện nút tim, hay đợi được hỏi"
      notes={
        <>
          <p>
            Feedback 07/09: “ở What's in store và Collections chỉ hiện nút tim khi
            hover chuột lên trên. Ở mobile thì ẩn nút tim ở what's in store hoặc hiện
            ra.”
          </p>
          <p>
            Đây là <em>hai</em> câu hỏi khác nhau, nên trang này tách chúng ra. Trên
            desktop có hover thật, nên câu hỏi là hàng sản phẩm nên “ồn” đến đâu lúc
            đứng yên. Trên điện thoại không có hover, nên “hiện khi hover” không phải
            một lựa chọn — chỉ còn hiện hoặc không có. Và không có thì không phải là
            yên tĩnh hơn, mà là thiếu.
          </p>
          <p className="text-ink/55">
            Cả hai phương án đều dùng đúng nút đang chạy trên site
            (<code>SaveButton</code>) với dữ liệu thật, nên thứ đang so là quy tắc chứ
            không phải một bản mô phỏng. Rê chuột vào hàng bên dưới để thấy khác biệt.
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
          <LabFrame
            label="DESKTOP · A — LUÔN HIỆN"
            meta="nút nằm sẵn trên mọi ảnh · không phụ thuộc con trỏ"
          >
            <div className="mx-auto max-w-[92rem] px-5 pb-10 md:px-10">
              <div className="flex flex-wrap items-start gap-8">
                <div className="w-full max-w-[34rem] overflow-hidden rounded-[1.5rem] ring-1 ring-ink/12">
                  <Row products={three} reveal={false} />
                </div>
                <div className="min-w-[18rem] flex-1 space-y-4">
                  <div>
                    <p className="label text-ink/45">Ý TƯỞNG</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink/75">
                      Nút là một phần của thẻ, không phải một thứ phải đi tìm. Người dùng
                      thấy ngay là món này lưu được, và quy tắc giống hệt nhau trên mọi
                      khổ máy — cùng một chỗ, cùng một hình, desktop hay điện thoại.
                    </p>
                  </div>
                  <div>
                    <p className="label text-ink/45">RỦI RO</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink/75">
                      Mười thẻ là mười trái tim. Ở What's in store hai làn chạy liên tục
                      thì mười chấm trắng đó đi theo, và hàng sản phẩm đang là thứ ồn nhất
                      màn hình chứ không phải ảnh của shop.
                    </p>
                  </div>
                  <Spec
                    property="opacity: 1 (không đổi)"
                    duration="—"
                    easing="—"
                    trigger="luôn hiện"
                  />
                </div>
              </div>
            </div>
          </LabFrame>

          <LabFrame
            label="DESKTOP · B — HIỆN KHI HOVER"
            meta="opacity 0 → 1 · 300ms · giữ hiện khi đã lưu và khi focus bàn phím"
          >
            <div className="mx-auto max-w-[92rem] px-5 pb-10 md:px-10">
              <div className="flex flex-wrap items-start gap-8">
                <div className="w-full max-w-[34rem] overflow-hidden rounded-[1.5rem] ring-1 ring-ink/12">
                  <Row products={three} reveal />
                </div>
                <div className="min-w-[18rem] flex-1 space-y-4">
                  <div>
                    <p className="label text-ink/45">Ý TƯỞNG</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink/75">
                      Hàng sản phẩm đứng yên thì chỉ có ảnh và giá. Nút xuất hiện đúng trên
                      thẻ con trỏ đang chỉ vào — mỗi lúc chỉ một cái, nên nó là một hành
                      động đang được đề nghị chứ không phải mười cái nhãn.
                    </p>
                  </div>
                  <div>
                    <p className="label text-ink/45">RỦI RO</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink/75">
                      Thứ không thấy thì không tồn tại: người dùng lần đầu có thể không
                      biết là lưu được. Và quy tắc này chỉ đúng trên desktop, nên hành vi
                      trên hai khổ máy khác nhau — phải trả lời câu hỏi mobile bên dưới
                      chứ không bỏ trống.
                    </p>
                  </div>
                  <div>
                    <p className="label text-ink/45">ĐÃ XỬ LÝ</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink/75">
                      Thẻ <strong className="text-ink">đã lưu</strong> thì nút không ẩn đi —
                      nếu ẩn thì trạng thái đã lưu cũng biến mất theo, và người dùng không
                      có cách nào thấy mình đã lưu món nào. Nút cũng hiện khi được focus
                      bằng bàn phím, vì Tab không tạo ra hover.
                    </p>
                  </div>
                  <Spec
                    property="opacity"
                    duration="300ms"
                    easing="ease"
                    trigger="hover trên thẻ · focus bàn phím · hoặc đã lưu"
                  />
                </div>
              </div>
            </div>
          </LabFrame>

          <LabFrame
            label="MOBILE · HIỆN HAY ẨN"
            meta="không có hover ở đây — chỉ còn hai đầu"
          >
            <div className="mx-auto max-w-[92rem] px-5 pb-14 md:px-10">
              <div className="flex flex-wrap items-start gap-8">
                <div className="flex gap-5">
                  <div>
                    <p className="label mb-2 text-ink/45">HIỆN</p>
                    <Phone>
                      <Row products={one} reveal={false} columns={1} />
                    </Phone>
                  </div>
                  <div>
                    <p className="label mb-2 text-ink/45">ẨN</p>
                    <Phone>
                      <Row products={one} reveal={false} hidden columns={1} />
                    </Phone>
                  </div>
                </div>

                <div className="min-w-[18rem] flex-1 space-y-4">
                  <div>
                    <p className="label text-ink/45">ĐÁNH ĐỔI</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink/75">
                      Ẩn nút trên điện thoại thì cách duy nhất để lưu là mở trang sản phẩm
                      rồi lưu ở đó — thêm một lần điều hướng và một lần quay lại cho mỗi
                      món. Ở khổ một sản phẩm một màn hình như What's in store hiện tại,
                      cái thẻ đã to sẵn nên một nút 44px ở góc không hề chật.
                    </p>
                  </div>
                  <div>
                    <p className="label text-ink/45">ĐỀ XUẤT</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink/75">
                      <strong className="text-ink">Hiện</strong>. Đây là chỗ duy nhất trên
                      điện thoại lưu được mà không phải rời khỏi trang chủ.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </LabFrame>

          <LabFrame label="ĐỀ XUẤT" meta="chọn một, tôi gộp vào code chính">
            <div className="mx-auto max-w-[70ch] px-5 pb-20 text-sm leading-relaxed text-ink/75 md:px-10">
              <p>
                <strong className="text-ink">B trên desktop, hiện trên mobile.</strong> Hai
                khổ máy khác nhau ở đây không phải là thiếu nhất quán — hover là một
                affordance chỉ tồn tại ở một bên, và quy tắc “hiện khi con trỏ chỉ vào” tự
                nó suy ra thành “luôn hiện” ở nơi không có con trỏ.
              </p>
              <p className="mt-3">
                Lý do nghiêng về B: What's in store là hai làn <em>đang chạy</em>. Mười
                trái tim trắng trôi ngang màn hình cạnh tranh trực tiếp với chính những
                tấm ảnh mà section đó tồn tại để khoe. Ở Collections thì nhẹ hơn vì chỉ có
                ba thẻ đứng yên, nhưng cùng một quy tắc ở cả hai chỗ vẫn tốt hơn là hai
                quy tắc.
              </p>
              <p className="mt-3 text-ink/55">
                Bản đang chạy trên nhánh <code>fix/products-wishlist-tap</code> là A (luôn
                hiện) ở mọi nơi. Đổi sang B là một prop:{" "}
                <code>revealOnHover</code>.
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
