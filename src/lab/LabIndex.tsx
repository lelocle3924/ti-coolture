import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import "./lab.css";

/**
 * The lab index.
 *
 * The lab was deleted on 26/08 once Direction C was folded into the homepage
 * (commit a64504b). It is back because the 26/08 feedback asks for options
 * rather than answers in two places — "Try 2 new directions" for Collections,
 * "Give 3 options" for the map — and because motion proposals are easier to
 * judge next to each other than to read about.
 *
 * Nothing in src/lab is imported by src/views, and /lab is not linked from the
 * site's navigation. It is a place to look at things, not part of the site.
 */

const STUDIES = [
  {
    to: "/lab/search",
    n: "01",
    title: "Thanh tìm kiếm — ba đề xuất chuyển động",
    body: "Nở ra từ nút, kéo ra từ nav, hoặc modal làm cho tử tế. Bấm thử được cả ba.",
    meta: "3 phương án · toàn site",
  },
  {
    to: "/lab/map",
    n: "02",
    title: "Bản đồ — ba phương án",
    body: "Băng, Kề, Chồng. Cả ba vừa một màn hình, không nền đen, không câu hướng dẫn.",
    meta: "3 phương án · trang chủ + /discover",
  },
  {
    to: "/lab/discover",
    n: "03",
    title: "Khám phá — năm hướng, dựng lại từ UX",
    body: "Năm câu trả lời khác nhau cho “người vào trang này định làm gì”, mỗi hướng có bản vẽ PC và mobile ở kích thước thật.",
    meta: "5 hướng · PC + mobile · /discover",
  },
  {
    to: "/lab/shop-colour",
    n: "04",
    title: "Trang shop — ba cách phối màu",
    body: "Nền trắng, violet và teal mỗi màu ≥20%, và không một lớp phủ nào lên ảnh của shop. Tỉ lệ được đo thật.",
    meta: "3 phương án · /stores/[slug]",
  },
];

export default function LabIndex() {
  return (
    <div className="min-h-[100dvh] bg-paper text-ink">
      <div className="mx-auto max-w-[70rem] px-5 py-14 md:px-10 md:py-20">
        <p className="label text-brand">TÍ COOLTURE · LAB</p>
        <h1 className="display mt-2 text-[clamp(2.25rem,6vw,4.5rem)] normal-case leading-[1.15]">
          Chỗ để so sánh
        </h1>
        <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-ink/70">
          Feedback 26/08 hỏi phương án ở hai chỗ — hai hướng cho Bộ sưu tập, ba cho
          bản đồ — nên chúng nằm cạnh nhau ở đây thay vì phải chọn trước. Mọi thứ
          dùng dữ liệu thật. Không có gì trong <code>src/lab</code> được site import.
        </p>

        <ul className="mt-12 border-t border-ink/12">
          {STUDIES.map((s) => (
            <li key={s.to} className="border-b border-ink/12">
              <Link
                to={s.to}
                className="group flex flex-wrap items-baseline gap-x-6 gap-y-2 py-6 transition-colors hover:text-brand"
              >
                <span className="text-[11px] tabular-nums tracking-[0.16em] text-ink/35">
                  {s.n}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="display block text-[clamp(1.35rem,3vw,2.1rem)] normal-case leading-[1.25]">
                    {s.title}
                  </span>
                  <span className="mt-1.5 block max-w-[58ch] text-sm leading-relaxed text-ink/65">
                    {s.body}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="text-[11px] tracking-[0.14em] text-ink/40">{s.meta}</span>
                  <ArrowUpRight className="h-5 w-5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1 group-hover:-translate-y-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          to="/"
          className="mt-12 inline-flex items-center gap-2 border-b border-ink/25 pb-1 text-sm font-medium transition-colors hover:border-brand hover:text-brand"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
