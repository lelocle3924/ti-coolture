/* No @types/react in this project — see the note in labShared.tsx. */
import type React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, MapPin } from "lucide-react";
import { LabShell, LabFrame } from "./labShared";
import { fetchTouristRoutes } from "../lib/dbService";
import { islandBlobs, planFor } from "../home/homeData";
import type { TouristRoute } from "../types";

/**
 * /discover — three directions, none of them curved.
 *
 * Team 07/09: "màu sắc vẫn chưa ok. cho tính năng này vào lab và test những
 * hướng design mới. Cái đầu tiên tôi muốn bạn bỏ là cái đường cong rồi chuyển
 * sang thẳng, chẳng liên quan gì đến brand hay tổng thể còn lại."
 *
 * The curve goes first, and it is worth being exact about which curve. The
 * page closed its violet on WaveBlog — one of the three brand wave seams —
 * and used it as the join between the hero and the paper below. The note is
 * that it belongs to neither the brand's own logic nor the rest of the page,
 * and that is fair: the wave is the *book's* transition device, drawn to run
 * across a spread, and on a route page it was decoration standing where a
 * structural edge should be. Every direction below joins its grounds with a
 * straight edge.
 *
 * What is not being re-litigated: the map stays, which the 07/09 note before
 * this one settled. Each direction places it differently, but none of them
 * drops it.
 *
 * On colour, the three take different positions on the same problem — the
 * page has to carry a dark map (teal island, white pins, needs a dark field)
 * and a long stretch of reading (wants paper) without the join between them
 * reading as an accident:
 *
 *   A keeps them apart with a rule and lets the violet be a header.
 *   B stands them side by side so there is no horizontal join at all.
 *   C alternates them, so the join happens many times and stops being an event.
 *
 * Nothing here is imported by src/views.
 */

/* ── a small, honest map ──────────────────────────────────────────────────
   The same island the real map draws, at study size — the point is where the
   map sits and what it sits on, not the artwork. */
function MiniMap({ route, className = "" }: { route: TouristRoute; className?: string }) {
  const island = islandBlobs(route.stops);
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 800 600" preserveAspectRatio="none" className="h-full w-full">
        <g fill="var(--color-wave)">
          {island.map((b, i) => (
            <ellipse key={i} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} />
          ))}
        </g>
      </svg>
      {route.stops.map((stop, i) => (
        <span
          key={stop.id}
          style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
          className="absolute grid h-5 w-5 -translate-x-1/2 -translate-y-full place-items-center rounded-full bg-paper text-[10px] font-bold text-ink shadow"
        >
          {i + 1}
        </span>
      ))}
    </div>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-[1.25rem] bg-paper ring-1 ring-ink/12"
      style={{ height: 460 }}
    >
      {children}
    </div>
  );
}

/* ── A · KẺ — a header, a rule, and reading ─────────────────────────────── */
function StudyRules({ route }: { route: TouristRoute }) {
  const plan = planFor(route.id);
  return (
    <Frame>
      <div className="bg-brand px-5 pb-4 pt-5 text-paper">
        <p className="label text-wave">{plan.district.toUpperCase()} · {plan.walk}</p>
        <p className="display mt-1 text-2xl normal-case leading-[1.15]">{route.name}</p>
        <MiniMap route={route} className="mt-3 h-[7.5rem] w-full" />
      </div>
      {/* the join: a 4px teal rule, not a wave */}
      <div className="h-1 w-full bg-wave" />
      <ul className="px-5">
        {route.stops.slice(0, 4).map((stop, i) => (
          <li key={stop.id} className="flex gap-4 border-b border-ink/12 py-3 last:border-b-0">
            <span className="display shrink-0 text-lg leading-none text-brand/45">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold text-ink">{stop.name}</span>
              <span className="mt-0.5 flex items-center gap-1 text-[11px] text-ink/55">
                <MapPin className="h-3 w-3 shrink-0 text-brand" />
                <span className="truncate">{stop.address}</span>
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

/* ── B · CỘT — map left, route right, one vertical edge ─────────────────── */
function StudyColumn({ route }: { route: TouristRoute }) {
  const plan = planFor(route.id);
  return (
    <Frame>
      <div className="flex h-full">
        <div className="flex w-[44%] flex-col bg-brand p-4 text-paper">
          <p className="label text-wave">{plan.district.toUpperCase()}</p>
          <p className="display mt-1 text-xl normal-case leading-[1.15]">{route.name}</p>
          <MiniMap route={route} className="mt-3 flex-1" />
          <p className="mt-2 text-[11px] text-white/70">
            {route.stops.length} điểm · {plan.walk}
          </p>
        </div>
        {/* the join is vertical, and it is a line */}
        <div className="w-1 shrink-0 bg-wave" />
        <ul className="min-w-0 flex-1 overflow-hidden px-4 py-2">
          {route.stops.slice(0, 5).map((stop, i) => (
            <li key={stop.id} className="border-b border-ink/12 py-2.5 last:border-b-0">
              <span className="flex items-baseline gap-2">
                <span className="text-[11px] font-bold tabular-nums text-brand">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-ink">
                    {stop.name}
                  </span>
                  <span className="block truncate text-[11px] text-ink/55">{stop.address}</span>
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  );
}

/* ── C · SỌC — the grounds alternate, so no join is an event ────────────── */
function StudyBands({ route }: { route: TouristRoute }) {
  const plan = planFor(route.id);
  return (
    <Frame>
      <div className="flex items-end justify-between gap-3 bg-brand px-5 py-3 text-paper">
        <div>
          <p className="label text-wave">{plan.district.toUpperCase()}</p>
          <p className="display text-xl normal-case leading-[1.15]">{route.name}</p>
        </div>
        <MiniMap route={route} className="h-[3.75rem] w-[9rem] shrink-0" />
      </div>
      {route.stops.slice(0, 4).map((stop, i) => {
        const dark = i % 2 === 1;
        return (
          <div
            key={stop.id}
            className={`flex items-center gap-4 px-5 py-3 ${
              dark ? "bg-brand-deep text-paper" : "bg-paper text-ink"
            }`}
          >
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center text-sm font-black ${
                dark ? "bg-wave text-ink" : "bg-brand text-paper"
              }`}
            >
              {i + 1}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold">{stop.name}</span>
              <span
                className={`block truncate text-[11px] ${dark ? "text-white/60" : "text-ink/55"}`}
              >
                {stop.address}
              </span>
            </span>
          </div>
        );
      })}
    </Frame>
  );
}

/* ── page ─────────────────────────────────────────────────────────────────── */

const STUDIES = [
  {
    id: "A",
    name: "KẺ — đầu trang, một đường kẻ, rồi đọc",
    meta: "violet là đầu trang · kẻ teal 4px thay cho sóng · thân trắng",
    Study: StudyRules,
    idea:
      "Gần bản đang chạy nhất, chỉ khác ở chỗ mối nối. Sóng bị thay bằng một đường kẻ teal 4px — thẳng, mỏng, và là thứ duy nhất giữa hai nền. Violet co lại thành đúng cái đầu trang mang tên lộ trình và bản đồ, phần đọc là giấy trắng với hairline giữa các điểm, đúng ngôn ngữ /products và /stores đang dùng.",
    risk:
      "Ít tham vọng nhất. Nếu vấn đề của team không chỉ là cái đường cong mà là cả cảm giác trang này rời rạc, thì A không giải quyết được điều đó.",
  },
  {
    id: "B",
    name: "CỘT — bản đồ một bên, lộ trình một bên",
    meta: "không có mối nối ngang nào · kẻ dọc teal · bản đồ luôn nhìn thấy",
    Study: StudyColumn,
    idea:
      "Bỏ luôn câu hỏi mối nối: hai nền đứng cạnh nhau chứ không nối tiếp nhau, nên không có đường ngang nào để phải làm cong hay thẳng. Bản đồ ở lại trong tầm nhìn suốt lúc đọc danh sách điểm — hiện tại cuộn xuống là mất bản đồ, mà bản đồ mới là thứ nói bạn đang ở quận nào.",
    risk:
      "Trên điện thoại hai cột phải xếp chồng, và lúc đó mối nối ngang quay lại — nghĩa là vẫn phải trả lời câu hỏi đó, chỉ là ở khổ nhỏ. Cột phải cũng hẹp, tên điểm dài sẽ bị cắt.",
  },
  {
    id: "C",
    name: "SỌC — nền đổi qua lại theo từng điểm",
    meta: "mỗi điểm là một dải · violet / trắng xen kẽ · số trên ô vuông",
    Study: StudyBands,
    idea:
      "Nếu một mối nối là một sự kiện thì hãy làm nó xảy ra nhiều lần cho đến khi nó thôi là sự kiện. Mỗi điểm dừng là một dải chạy hết bề ngang, nền đổi qua lại giữa violet sâu và giấy, số điểm nằm trên một ô vuông màu. Không có chỗ nào là “hero rồi đến phần còn lại”.",
    risk:
      "Nhịp mạnh nhất trong ba cái, và cũng dễ mệt mắt nhất nếu lộ trình có tám điểm chứ không phải bốn. Chữ trên nền violet sâu phải kiểm tra lại tương phản ở cỡ nhỏ.",
  },
];

export default function DiscoverStudies() {
  const [routes, setRoutes] = useState<TouristRoute[]>([]);

  useEffect(() => {
    let alive = true;
    fetchTouristRoutes().then((rows) => {
      if (alive) setRoutes(rows);
    });
    return () => {
      alive = false;
    };
  }, []);

  const route = routes[0];

  return (
    <LabShell
      eyebrow="09 · KHÁM PHÁ"
      title="/discover — ba hướng, không cái nào cong"
      notes={
        <>
          <p>
            Feedback 07/09: “màu sắc vẫn chưa ok. cho tính năng này vào lab và test
            những hướng design mới. Cái đầu tiên tôi muốn bạn bỏ là cái đường cong rồi
            chuyển sang thẳng, chẳng liên quan gì đến brand hay tổng thể còn lại.”
          </p>
          <p>
            Đường cong đó là <code>WaveBlog</code>, một trong ba con sóng của bộ nhận
            diện, đang được dùng làm mối nối giữa hero và phần giấy bên dưới. Ghi chú
            trên là đúng: sóng là thiết bị chuyển trang của <em>cuốn sách</em>, vẽ để
            chạy ngang một trang đôi — đặt ở đây nó là trang trí đứng vào chỗ đáng lẽ
            phải là một cạnh cấu trúc. Cả ba hướng dưới đây nối hai nền bằng cạnh
            thẳng.
          </p>
          <p>
            Bản đồ ở lại — điều đó đã chốt ở đợt feedback trước. Ba hướng chỉ khác nhau
            ở chỗ đặt nó, và ở lập trường về cùng một vấn đề màu: trang này phải mang
            cả một bản đồ cần nền tối lẫn một đoạn đọc dài cần nền giấy, mà mối nối
            giữa hai thứ đó không được trông như một tai nạn.
          </p>
        </>
      }
    >
      {!route ? (
        <div className="mx-auto max-w-[92rem] px-5 py-16 text-sm text-ink/50 md:px-10">
          Đang tải lộ trình thật…
        </div>
      ) : (
        <>
          {STUDIES.map(({ id, name, meta, Study, idea, risk }) => (
            <LabFrame key={id} label={`${id} · ${name}`} meta={meta}>
              <div className="mx-auto max-w-[92rem] px-5 pb-12 md:px-10">
                <div className="flex flex-wrap items-start gap-8">
                  <div className="w-full max-w-[32rem] shrink-0">
                    <Study route={route} />
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
                  </div>
                </div>
              </div>
            </LabFrame>
          ))}

          <LabFrame label="ĐỀ XUẤT" meta="chọn một, tôi gộp vào Discovery">
            <div className="mx-auto max-w-[70ch] px-5 pb-20 text-sm leading-relaxed text-ink/75 md:px-10">
              <p>
                <strong className="text-ink">B — Cột</strong>. Nó là hướng duy nhất không
                phải trả lời câu hỏi mối nối trên desktop, vì nó không có mối nối ngang
                nào cả; và nó sửa một thứ mà cả A lẫn C đều không sửa — hiện tại cuộn
                xuống đọc danh sách điểm là mất bản đồ, mà bản đồ mới là thứ nói cho
                bạn biết mình đang ở quận nào.
              </p>
              <p className="mt-3">
                Cái giá là trên điện thoại hai cột phải xếp chồng, nên mối nối ngang
                quay lại ở khổ nhỏ — lúc đó dùng đúng đường kẻ của{" "}
                <strong className="text-ink">A</strong>. Nếu team muốn một hướng dùng
                chung cho mọi khổ máy thì A là câu trả lời an toàn, và nó cũng là thay
                đổi nhỏ nhất so với bản đang chạy.
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
