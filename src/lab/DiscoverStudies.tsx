/* No @types/react in this project — see the note in labShared.tsx. */
import type React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Clock, MapPin, Route as RouteIcon } from "lucide-react";
import { LabShell, LabFrame } from "./labShared";
import { fetchTouristRoutes } from "../lib/dbService";
import { islandBlobs, planFor } from "../home/homeData";
import type { TouristRoute } from "../types";

/**
 * /discover — five directions, taken from the top.
 *
 * Team 08/09: "cho tôi 5 hướng đi để đại tu phần nhìn của trang /discover. Bỏ
 * hết mọi thứ và đi lại từ bước lên ý tưởng UX, UI như thế nào cho đến ra
 * high-fidelity drafts, cho cả PC và mobile."
 *
 * So this is not five skins. Each direction starts from a different answer to
 * one question — what is a visitor on this page actually trying to do? — and
 * the layout follows from that answer rather than the other way round.
 *
 *   The page has to carry four things: which district you are in, where its
 *   stops are, what each stop is, and how to get to one. Today it presents
 *   them in that order and gives them equal weight, which is why it reads as
 *   a list of parts rather than as a thing with a purpose.
 *
 * Five different bets on the purpose:
 *
 *   A · LỘ TRÌNH        you came to walk it. The sequence leads; the map is a
 *                       locator that follows you down the page.
 *   B · BẢN ĐỒ LÀ TRANG you came to look at where things are. The map is the
 *                       interface, and the stops are things you tap on it.
 *   C · THẺ ĐIỂM        you came to be tempted. Each stop is a photograph
 *                       first and an address second.
 *   D · TẠP CHÍ         you came for Tí's opinion. The route is an article.
 *   E · BẢNG QUẬN       you have not chosen a district yet — which is the one
 *                       job today's page hides at the bottom of a carousel.
 *
 * Two constraints every direction obeys, both from the team:
 *
 *   · No curve on the ground join. "Cái đầu tiên tôi muốn bạn bỏ là cái
 *     đường cong rồi chuyển sang thẳng… là cái ranh giới chuyển giữa nền
 *     violet và nền trắng, không phải đường cong trên hình quận" (08/09). The
 *     wave seam is gone from all five; the island keeps its own curves.
 *   · Colour rebalanced the way the shop-page note asks for: paper is the
 *     ground, violet is a block with a job rather than a wash, teal does the
 *     wayfinding. "màu sắc vẫn chưa ok" has been said twice, and both times
 *     about a page that was mostly violet with white underneath it.
 *
 * Every draft is real DOM at real size, scaled down to fit — 1280×820 for the
 * desktop and 390×820 for the phone, both at the same scale so the two are
 * honestly comparable. Real routes, real stops, real addresses.
 *
 * Nothing here is imported by src/views.
 */

const PC = { w: 1280, h: 820 };
const PHONE = { w: 390, h: 820 };
const SCALE = 0.45;

/* ── a small, honest map ──────────────────────────────────────────────────
   The same island the real map draws. The point of these drafts is where the
   map sits and what it sits on, not the artwork. */
function MiniMap({
  route,
  className = "",
  pinSize = 22,
  active,
}: {
  route: TouristRoute;
  className?: string;
  pinSize?: number;
  /** Index of the stop to mark, if any. */
  active?: number;
}) {
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
          style={{
            left: `${stop.x}%`,
            top: `${stop.y}%`,
            width: pinSize,
            height: pinSize,
            fontSize: pinSize * 0.5,
          }}
          className={`absolute grid -translate-x-1/2 -translate-y-full place-items-center rounded-full font-bold shadow ${
            active === i ? "bg-brand text-paper ring-2 ring-paper" : "bg-paper text-ink"
          }`}
        >
          {i + 1}
        </span>
      ))}
    </div>
  );
}

/** A draft at true size, scaled to fit the page. */
function Draft({
  size,
  label,
  children,
}: {
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

/** The nav pill, so every draft is judged with the chrome it will carry. */
function Chrome({ tone = "onPaper" }: { tone?: "onPaper" | "onViolet" }) {
  return (
    <div className="absolute inset-x-6 top-5 z-30 flex h-14 items-center gap-4 rounded-full bg-ink/50 px-5 backdrop-blur-md">
      <span className="text-sm font-black text-paper">TÍ COOLTURE</span>
      <span className="ml-auto flex gap-4 text-[13px] font-semibold text-wave/85">
        <span>Sản phẩm</span>
        <span>Shop</span>
        <span className={tone === "onViolet" ? "text-paper" : "text-paper"}>Khám phá</span>
      </span>
    </div>
  );
}

const meta = (route: TouristRoute) => {
  const plan = planFor(route.id);
  return { district: plan.district, walk: plan.walk, count: route.stops.length };
};

/* ═══════════════════════════════════════════════════════════════════════════
   A · LỘ TRÌNH — you came to walk it
   ═══════════════════════════════════════════════════════════════════════════
   UX premise: the visitor has already chosen; what they need is the order,
   the distance and the next address. So the sequence is the page and the map
   is a locator that stays with them — sticky on a desktop, a collapsed bar on
   a phone. The violet is a single summary block at the top left, not a field
   the page sits in. */

function A_Desktop({ route }: { route: TouristRoute }) {
  const m = meta(route);
  return (
    <div className="relative h-full w-full bg-paper">
      <Chrome />
      <div className="grid h-full grid-cols-[380px_1fr]">
        {/* the violet block: everything you need before you set off */}
        <aside className="flex flex-col gap-6 bg-brand px-9 pb-9 pt-28 text-paper">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-wave">
              {m.district.toUpperCase()}
            </p>
            <h1 className="display mt-2 text-4xl normal-case leading-[1.15]">{route.name}</h1>
          </div>
          <div className="flex gap-6 border-y border-white/25 py-4 text-[13px]">
            <span className="flex items-center gap-2">
              <RouteIcon className="h-4 w-4 text-wave" /> {m.count} điểm
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-wave" /> {m.walk}
            </span>
          </div>
          <MiniMap route={route} className="h-48 w-full" pinSize={22} />
          <p className="text-[13px] leading-relaxed text-white/80">{route.description}</p>
        </aside>

        {/* the walk itself */}
        <div className="overflow-hidden px-12 pt-28">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-ink/40">ĐI THEO THỨ TỰ</p>
          <ol className="mt-5">
            {route.stops.map((s, i) => (
              <li key={s.id} className="flex gap-6 border-t border-ink/12 py-6">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-wave text-base font-black text-ink">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold text-ink">{s.name}</h3>
                  <p className="mt-1.5 flex items-center gap-2 text-[13px] text-ink/55">
                    <MapPin className="h-3.5 w-3.5 text-brand" />
                    {s.address}
                  </p>
                </div>
                <span className="ml-auto self-center text-[12px] font-semibold text-brand">
                  Mở bản đồ ↗
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function A_Phone({ route }: { route: TouristRoute }) {
  const m = meta(route);
  return (
    <div className="relative h-full w-full bg-paper">
      <div className="bg-brand px-6 pb-6 pt-24 text-paper">
        <p className="text-[12px] font-semibold tracking-[0.2em] text-wave">
          {m.district.toUpperCase()}
        </p>
        <h1 className="display mt-2 text-4xl normal-case leading-[1.15]">{route.name}</h1>
        <div className="mt-5 flex gap-5 text-[14px]">
          <span className="flex items-center gap-2">
            <RouteIcon className="h-4 w-4 text-wave" /> {m.count} điểm
          </span>
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-wave" /> {m.walk}
          </span>
        </div>
      </div>
      {/* the map collapses to a strip you can open, so the walk starts above
          the fold instead of below a full-height island */}
      <div className="flex items-center gap-4 border-b border-ink/12 bg-paper px-6 py-3">
        <MiniMap route={route} className="h-12 w-20" pinSize={14} />
        <span className="text-[13px] font-semibold text-ink/70">Xem bản đồ lộ trình</span>
        <ArrowRight className="ml-auto h-4 w-4 text-brand" />
      </div>
      <ol className="px-6">
        {route.stops.map((s, i) => (
          <li key={s.id} className="flex gap-4 border-b border-ink/12 py-5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-wave text-[15px] font-black text-ink">
              {i + 1}
            </span>
            <div className="min-w-0">
              <h3 className="text-[17px] font-semibold leading-snug text-ink">{s.name}</h3>
              <p className="mt-1 text-[13px] text-ink/55">{s.address}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   B · BẢN ĐỒ LÀ TRANG — you came to look at where things are
   ═══════════════════════════════════════════════════════════════════════════
   UX premise: the map is not an illustration of the page, it is the page.
   Stops are pins you press and the detail arrives beside them. This is how
   every map app already behaves, so nothing has to be learned — and it is the
   only direction where the district's shape does real work rather than
   decorating a header. */

function B_Desktop({ route }: { route: TouristRoute }) {
  const m = meta(route);
  const s = route.stops[1] ?? route.stops[0];
  return (
    <div className="relative h-full w-full bg-brand-deep">
      <Chrome tone="onViolet" />
      <MiniMap route={route} className="absolute inset-0 h-full w-full opacity-90" pinSize={34} active={1} />
      {/* one panel, on paper, over the map */}
      <aside className="absolute bottom-8 left-8 top-28 w-[400px] rounded-[1rem] bg-paper p-8 shadow-2xl">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-brand">
          {m.district.toUpperCase()} · {m.walk}
        </p>
        <h1 className="display mt-2 text-3xl normal-case leading-[1.15] text-ink">{route.name}</h1>
        <div className="mt-6 border-t-4 border-wave pt-5">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-ink/40">ĐIỂM 02</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">{s.name}</h2>
          <p className="mt-2 flex items-center gap-2 text-[13px] text-ink/60">
            <MapPin className="h-4 w-4 text-brand" />
            {s.address}
          </p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-[13px] font-bold text-paper">
            Mở bản đồ <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
        <ul className="mt-7 space-y-1 border-t border-ink/12 pt-4">
          {route.stops.map((st, i) => (
            <li
              key={st.id}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] ${
                i === 1 ? "bg-wave/25 font-semibold text-ink" : "text-ink/60"
              }`}
            >
              <span className="tabular-nums text-ink/40">0{i + 1}</span>
              <span className="truncate">{st.name}</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

function B_Phone({ route }: { route: TouristRoute }) {
  const s = route.stops[1] ?? route.stops[0];
  return (
    <div className="relative h-full w-full bg-brand-deep">
      <MiniMap route={route} className="absolute inset-0 h-[62%] w-full" pinSize={30} active={1} />
      <div className="absolute inset-x-0 top-20 px-5">
        <span className="inline-block rounded-full bg-paper px-4 py-2 text-[13px] font-bold text-ink shadow">
          {route.name}
        </span>
      </div>
      {/* the sheet: one stop at a time, swiped, synced with the pin above */}
      <div className="absolute inset-x-0 bottom-0 h-[42%] rounded-t-[1.5rem] bg-paper px-6 pt-5">
        <span className="mx-auto block h-1 w-10 rounded-full bg-ink/20" />
        <p className="mt-5 text-[12px] font-semibold tracking-[0.2em] text-brand">ĐIỂM 02 / 0{route.stops.length}</p>
        <h2 className="mt-2 text-2xl font-semibold leading-snug text-ink">{s.name}</h2>
        <p className="mt-2 flex items-center gap-2 text-[14px] text-ink/60">
          <MapPin className="h-4 w-4 shrink-0 text-brand" />
          {s.address}
        </p>
        <div className="mt-5 flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-[14px] font-bold text-paper">
            Mở bản đồ <ArrowUpRight className="h-4 w-4" />
          </span>
          <span className="flex gap-1.5">
            {route.stops.map((st, i) => (
              <span
                key={st.id}
                className={`h-1.5 rounded-full ${i === 1 ? "w-6 bg-brand" : "w-1.5 bg-ink/20"}`}
              />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   C · THẺ ĐIỂM — you came to be tempted
   ═══════════════════════════════════════════════════════════════════════════
   UX premise: /discover sits next to a catalogue of beautiful objects, and it
   is the only page on the site that shows none. Give every stop a photograph
   and the page starts selling the outing instead of describing it. The route
   becomes a deck you move through rather than a list you scan. */

function StopCard({
  index,
  name,
  address,
  tall = false,
}: {
  /* declared because the project has no @types/react — see labShared.tsx */
  key?: string;
  index: number;
  name: string;
  address: string;
  tall?: boolean;
}) {
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-[0.9rem] bg-paper ring-1 ring-ink/10">
      <div
        className={`relative ${tall ? "h-56" : "h-40"} bg-brand-deep`}
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,.08) 0 14px, transparent 14px 28px)",
        }}
      >
        <span className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-wave text-[13px] font-black text-ink">
          {index}
        </span>
        <span className="absolute bottom-3 left-3 text-[10px] font-semibold tracking-[0.16em] text-white/60">
          ẢNH ĐIỂM DỪNG · 4:3
        </span>
      </div>
      <div className="p-4">
        <h3 className="truncate text-[16px] font-semibold text-ink">{name}</h3>
        <p className="mt-1 truncate text-[12px] text-ink/55">{address}</p>
      </div>
    </article>
  );
}

function C_Desktop({ route }: { route: TouristRoute }) {
  const m = meta(route);
  return (
    <div className="relative h-full w-full bg-paper">
      <Chrome />
      <div className="flex items-end gap-8 border-b-4 border-wave px-12 pb-6 pt-28">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-brand">
            {m.district.toUpperCase()} · {m.count} ĐIỂM · {m.walk}
          </p>
          <h1 className="display mt-2 text-5xl normal-case leading-[1.1] text-ink">{route.name}</h1>
        </div>
        <MiniMap route={route} className="ml-auto h-28 w-44" pinSize={18} />
      </div>
      <div className="grid grid-cols-3 gap-6 px-12 pt-8">
        {route.stops.slice(0, 3).map((s, i) => (
          <StopCard key={s.id} index={i + 1} name={s.name} address={s.address} tall />
        ))}
      </div>
      <p className="px-12 pt-6 text-[13px] font-semibold text-brand">
        Còn {Math.max(0, route.stops.length - 3)} điểm nữa ↓
      </p>
    </div>
  );
}

function C_Phone({ route }: { route: TouristRoute }) {
  const m = meta(route);
  return (
    <div className="relative h-full w-full bg-paper">
      <div className="border-b-4 border-wave px-6 pb-5 pt-24">
        <p className="text-[12px] font-semibold tracking-[0.2em] text-brand">
          {m.district.toUpperCase()} · {m.walk}
        </p>
        <h1 className="display mt-2 text-[2.1rem] normal-case leading-[1.1] text-ink">
          {route.name}
        </h1>
      </div>
      <div className="space-y-5 px-6 pt-6">
        {route.stops.slice(0, 2).map((s, i) => (
          <StopCard key={s.id} index={i + 1} name={s.name} address={s.address} tall />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   D · TẠP CHÍ — you came for Tí's opinion
   ═══════════════════════════════════════════════════════════════════════════
   UX premise: the site's own words are that Tí "chọn, viết, và đưa shop lên
   trang chủ". If the curation is the product, a route is an article and the
   stops are its sections. This is the only direction that gives the writing
   room, and the only one that would need copy before it could ship. */

function D_Desktop({ route }: { route: TouristRoute }) {
  const m = meta(route);
  return (
    <div className="relative h-full w-full bg-paper">
      <Chrome />
      <div className="mx-auto max-w-[900px] px-10 pt-28">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-brand">
          KHÁM PHÁ · {m.district.toUpperCase()}
        </p>
        <h1 className="display mt-4 text-[3.4rem] normal-case leading-[1.05] text-ink">
          {route.name}
        </h1>
        <p className="mt-5 max-w-[62ch] text-[17px] leading-relaxed text-ink/70">
          {route.description}
        </p>
        <div className="mt-8 flex items-center gap-5 border-y border-ink/15 py-3 text-[12px] text-ink/50">
          <span>{m.count} điểm</span>
          <span>·</span>
          <span>{m.walk}</span>
          <span className="ml-auto">Bài viết của ban biên tập Tí</span>
        </div>

        <div className="mt-9 grid grid-cols-[1fr_260px] gap-10">
          <div>
            {route.stops.slice(0, 2).map((s, i) => (
              <section key={s.id} className="mb-8">
                <h2 className="text-[13px] font-semibold tracking-[0.18em] text-brand">
                  0{i + 1} — {s.name.toUpperCase()}
                </h2>
                <p className="mt-3 text-[15px] leading-[1.75] text-ink/75">
                  Chỗ này Tí ghé vào một chiều mưa, và ở lại lâu hơn dự định. Đoạn viết thật sẽ
                  nằm ở đây — vài câu về vì sao điểm dừng này có mặt trong lộ trình, chứ không
                  phải một dòng địa chỉ.
                </p>
                <p className="mt-3 text-[13px] text-ink/50">{s.address}</p>
              </section>
            ))}
          </div>
          <aside className="border-l border-ink/15 pl-6">
            <MiniMap route={route} className="h-32 w-full" pinSize={16} />
            <ol className="mt-5 space-y-2 text-[13px]">
              {route.stops.map((s, i) => (
                <li key={s.id} className="flex gap-3 text-ink/60">
                  <span className="tabular-nums text-brand">0{i + 1}</span>
                  <span className="truncate">{s.name}</span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </div>
    </div>
  );
}

function D_Phone({ route }: { route: TouristRoute }) {
  const m = meta(route);
  const s = route.stops[0];
  return (
    <div className="relative h-full w-full bg-paper px-6 pt-24">
      <p className="text-[12px] font-semibold tracking-[0.24em] text-brand">
        KHÁM PHÁ · {m.district.toUpperCase()}
      </p>
      <h1 className="display mt-3 text-[2.4rem] normal-case leading-[1.05] text-ink">
        {route.name}
      </h1>
      <p className="mt-4 text-[16px] leading-relaxed text-ink/70">{route.description}</p>
      <div className="mt-6 flex items-center gap-4 border-y border-ink/15 py-3 text-[12px] text-ink/50">
        <span>{m.count} điểm</span>
        <span>·</span>
        <span>{m.walk}</span>
      </div>
      <section className="mt-7">
        <h2 className="text-[13px] font-semibold tracking-[0.18em] text-brand">
          01 — {s.name.toUpperCase()}
        </h2>
        <p className="mt-3 text-[15px] leading-[1.75] text-ink/75">
          Chỗ này Tí ghé vào một chiều mưa, và ở lại lâu hơn dự định. Đoạn viết thật sẽ nằm ở
          đây — vài câu về vì sao điểm dừng này có mặt trong lộ trình.
        </p>
        <p className="mt-3 text-[13px] text-ink/50">{s.address}</p>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   E · BẢNG QUẬN — you have not chosen yet
   ═══════════════════════════════════════════════════════════════════════════
   UX premise: today's page opens on one district and hides the others inside
   a carousel, which assumes a choice the visitor has usually not made. This
   one puts every district on screen at once and lets the comparison be the
   page. Choosing is the job; the route detail is one tap away. */

function DistrictColumn({ route, lead = false }: { key?: string; route: TouristRoute; lead?: boolean }) {
  const m = meta(route);
  return (
    <div
      className={`flex min-w-0 flex-col rounded-[0.9rem] p-6 ${
        lead ? "bg-brand text-paper" : "bg-paper text-ink ring-1 ring-ink/12"
      }`}
    >
      <p
        className={`text-[11px] font-semibold tracking-[0.2em] ${
          lead ? "text-wave" : "text-brand"
        }`}
      >
        {m.district.toUpperCase()}
      </p>
      <h3 className="display mt-2 text-2xl normal-case leading-[1.15]">{route.name}</h3>
      <MiniMap route={route} className="mt-4 h-28 w-full" pinSize={16} />
      <ol className={`mt-4 space-y-1.5 text-[13px] ${lead ? "text-white/80" : "text-ink/65"}`}>
        {route.stops.slice(0, 4).map((s, i) => (
          <li key={s.id} className="flex gap-2.5">
            <span className={`tabular-nums ${lead ? "text-wave" : "text-brand"}`}>0{i + 1}</span>
            <span className="truncate">{s.name}</span>
          </li>
        ))}
      </ol>
      <span
        className={`mt-5 inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold ${
          lead ? "bg-paper text-ink" : "bg-brand text-paper"
        }`}
      >
        {m.count} điểm · {m.walk} <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </div>
  );
}

function E_Desktop({ routes }: { routes: TouristRoute[] }) {
  return (
    <div className="relative h-full w-full bg-paper-warm">
      <Chrome />
      <div className="px-12 pt-28">
        <h1 className="display text-[2.6rem] normal-case leading-[1.1] text-ink">
          Sài Gòn có {routes.length} vòng để đi
        </h1>
        <p className="mt-3 max-w-[60ch] text-[15px] text-ink/60">
          Chọn một quận. Mỗi vòng là nửa ngày đi bộ, ghé xưởng và những chỗ Tí thấy đáng dừng.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-6 px-12 pt-8">
        {routes.slice(0, 3).map((r, i) => (
          <DistrictColumn key={r.id} route={r} lead={i === 0} />
        ))}
      </div>
    </div>
  );
}

function E_Phone({ routes }: { routes: TouristRoute[] }) {
  return (
    <div className="relative h-full w-full bg-paper-warm px-6 pt-24">
      <h1 className="display text-[2.1rem] normal-case leading-[1.1] text-ink">
        Sài Gòn có {routes.length} vòng để đi
      </h1>
      <p className="mt-3 text-[14px] text-ink/60">
        Chọn một quận. Vuốt ngang để xem các vòng khác.
      </p>
      <div className="mt-6 flex gap-4 overflow-hidden">
        <div className="w-[270px] shrink-0">
          <DistrictColumn route={routes[0]} lead />
        </div>
        <div className="w-[270px] shrink-0">
          {routes[1] && <DistrictColumn route={routes[1]} />}
        </div>
      </div>
    </div>
  );
}

/* ── page ─────────────────────────────────────────────────────────────────── */

const STUDIES = [
  {
    id: "A",
    name: "LỘ TRÌNH — bạn đến để đi",
    meta: "cột violet cố định · bản đồ đi theo · danh sách là trang",
    ux: "Người dùng đã chọn quận rồi; thứ họ cần là thứ tự, quãng đường và địa chỉ điểm tiếp theo. Nên chuỗi điểm dừng LÀ trang, còn bản đồ tụt xuống vai trò định vị và bám theo khi cuộn. Trên điện thoại bản đồ thu thành một thanh mở được, để điểm số 1 nằm trên màn hình đầu tiên chứ không nằm dưới một hòn đảo cao nguyên màn.",
    colour:
      "Violet thành một khối có việc — bảng tóm tắt bên trái — chứ không phải nền trải cả trang. Phần đọc nằm trên giấy trắng. Teal là số thứ tự, tức là thứ dẫn đường.",
    risk: "Ít cảm xúc nhất trong năm hướng. Nếu lộ trình chỉ có 4 điểm và không có ảnh, cột phải sẽ trông trống ở màn rộng.",
    best: "Khi /discover được dùng lúc đang đi, trên đường.",
    Desktop: A_Desktop,
    Phone: A_Phone,
  },
  {
    id: "B",
    name: "BẢN ĐỒ LÀ TRANG — bạn đến để xem chỗ nào ở đâu",
    meta: "bản đồ toàn khung · panel giấy đè lên · sheet trượt trên mobile",
    ux: "Bản đồ không minh hoạ cho trang, bản đồ LÀ trang. Điểm dừng là thứ bấm được trên đó, chi tiết hiện ngay cạnh. Không phải học gì cả vì mọi app bản đồ đều thế. Đây cũng là hướng duy nhất mà hình dạng quận làm việc thật, thay vì trang trí cho một cái header.",
    colour:
      "Nền là violet đậm để đảo teal và pin trắng đọc được — đúng lý do bản đồ vốn cần nền tối. Toàn bộ chữ nằm trên một tấm giấy trắng đè lên, nên không có chỗ nào chữ phải nằm trên ảnh bản đồ.",
    risk: "Bản đồ hiện tại là hình minh hoạ chứ không phải bản đồ thật, không có tỉ lệ, không có tên đường. Hướng này hứa nhiều hơn cái bản đồ đang có — hoặc phải nâng cấp bản đồ, hoặc phải nói rõ đây là sơ đồ.",
    best: "Khi bản đồ được đầu tư thành bản đồ thật.",
    Desktop: B_Desktop,
    Phone: B_Phone,
  },
  {
    id: "C",
    name: "THẺ ĐIỂM — bạn đến để bị dụ",
    meta: "mỗi điểm một tấm ảnh · lưới 3 cột · kẻ teal 4px thay cho sóng",
    ux: "/discover nằm cạnh một catalogue toàn đồ đẹp, mà lại là trang duy nhất không có tấm ảnh nào. Cho mỗi điểm dừng một tấm ảnh thì trang bắt đầu mời chào thay vì mô tả. Lộ trình thành một cỗ bài để lướt.",
    colour:
      "Giấy trắng là nền, ảnh mang màu, teal là một đường kẻ 4px thay cho chỗ sóng cũ — thẳng, và là ranh giới thật giữa đầu trang và thân trang.",
    risk: "Cần ảnh cho từng điểm dừng, mà dữ liệu hiện chưa có. Đây là hướng tốn công nội dung nhất; không có ảnh thì nó tệ hơn hướng A.",
    best: "Khi có ngân sách chụp ảnh cho các điểm dừng.",
    Desktop: C_Desktop,
    Phone: C_Phone,
  },
  {
    id: "D",
    name: "TẠP CHÍ — bạn đến để nghe Tí kể",
    meta: "một cột chữ rộng · mục lục dính bên phải · không có khối màu lớn",
    ux: "Site tự nói Tí “chọn, viết, và đưa shop lên trang chủ”. Nếu sự tuyển chọn mới là sản phẩm thì một lộ trình là một bài viết, còn điểm dừng là các mục của nó. Đây là hướng duy nhất cho phần chữ có chỗ thở.",
    colour:
      "Gần như toàn giấy. Violet chỉ còn trong chữ và số thứ tự; teal gần như vắng mặt. Đây là hướng xa palette 60/30/10 nhất — cố ý, để team thấy đầu kia của thang.",
    risk: "Cần bài viết thật cho từng điểm dừng, mà hiện `description` của stop đang rỗng. Không có chữ thì hướng này không tồn tại.",
    best: "Khi ban biên tập có người viết.",
    Desktop: D_Desktop,
    Phone: D_Phone,
  },
  {
    id: "E",
    name: "BẢNG QUẬN — bạn còn chưa chọn quận nào",
    meta: "cả 3 quận cùng lúc · một cột violet dẫn · so sánh là trang",
    ux: "Trang hiện tại mở ra ở một quận và giấu các quận khác trong carousel — tức là giả định người dùng đã chọn, mà thường thì chưa. Hướng này đặt cả ba quận lên màn hình cùng lúc và để việc so sánh trở thành nội dung chính. Chọn xong mới vào chi tiết.",
    colour:
      "Nền giấy ấm, mỗi quận một thẻ. Quận đang dẫn là khối violet, hai quận còn lại là giấy viền mảnh — violet trở thành cách nói “cái này trước”, không phải nền mặc định.",
    risk: "Đẩy chi tiết lộ trình xuống một lớp nữa. Với người đã biết mình muốn quận nào thì đây là một bước thừa; cần nhớ lựa chọn gần nhất.",
    best: "Khi phần lớn lượt vào /discover là từ trang chủ, chưa chọn gì.",
    Desktop: E_Desktop,
    Phone: E_Phone,
  },
];

export default function DiscoverStudies() {
  const [routes, setRoutes] = useState<TouristRoute[]>([]);

  useEffect(() => {
    fetchTouristRoutes().then(setRoutes).catch(() => setRoutes([]));
  }, []);

  const route = routes[0];

  return (
    <LabShell
      eyebrow="KHÁM PHÁ · ĐẠI TU"
      title="Năm hướng cho /discover"
      notes={
        <>
          <p>
            Feedback 08/09: “cho tôi 5 hướng đi để đại tu phần nhìn của trang /discover. Bỏ
            hết mọi thứ và đi lại từ bước lên ý tưởng UX, UI như thế nào cho đến ra
            high-fidelity drafts, cho cả PC và mobile.”
          </p>
          <p>
            Nên đây không phải năm lớp sơn. Mỗi hướng bắt đầu từ một câu trả lời khác nhau
            cho đúng một câu hỏi: <strong className="text-ink">người vào trang này đang
            định làm gì?</strong> Trang hiện tại đưa ra bốn thứ — đang ở quận nào, các điểm
            nằm đâu, mỗi điểm là gì, đi tới đó thế nào — với trọng số ngang nhau, và đó là
            lý do nó đọc như một danh sách bộ phận chứ không phải một trang có mục đích.
          </p>
          <p>
            Hai ràng buộc chung cho cả năm. <strong className="text-ink">Không có đường
            cong ở ranh giới nền</strong> — sóng WaveBlog đã bị bỏ khỏi cả năm hướng; đường
            cong trên hình quận thì giữ nguyên, đúng như ghi chú 08/09 phân biệt. Và{" "}
            <strong className="text-ink">màu được cân lại</strong>: giấy là nền, violet là
            một khối có việc chứ không phải lớp phủ, teal làm việc dẫn đường.
          </p>
          <p className="text-ink/55">
            Mỗi bản vẽ là DOM thật ở kích thước thật rồi thu nhỏ — 1280×820 cho PC và
            390×820 cho điện thoại, cùng một tỉ lệ để so sánh được. Dữ liệu lộ trình,
            điểm dừng và địa chỉ đều là dữ liệu thật.
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
          {STUDIES.map(({ id, name, meta: metaLine, ux, colour, risk, best, Desktop, Phone }) => (
            <LabFrame key={id} label={`${id} · ${name}`} meta={metaLine}>
              <div className="mx-auto max-w-[92rem] px-5 pb-14 md:px-10">
                <div className="flex flex-wrap items-start gap-8">
                  {/* The drafts are fixed-width by design — they are drawn at
                      1280 and 390 and scaled, so they cannot reflow. On a
                      narrow screen the pair scrolls inside its own box rather
                      than making the whole lab page scroll sideways. */}
                  <div className="-mx-5 max-w-full shrink-0 overflow-x-auto px-5 md:mx-0 md:px-0">
                    <div className="flex w-max gap-4">
                    <Draft size={PC} label="PC · 1280×820">
                      {id === "E" ? (
                        <E_Desktop routes={routes} />
                      ) : (
                        <Desktop route={route} routes={routes} />
                      )}
                    </Draft>
                    <Draft size={PHONE} label="MOBILE · 390×820">
                      {id === "E" ? (
                        <E_Phone routes={routes} />
                      ) : (
                        <Phone route={route} routes={routes} />
                      )}
                    </Draft>
                    </div>
                  </div>

                  <div className="min-w-[20rem] flex-1 space-y-4">
                    <div>
                      <p className="label text-ink/45">Ý TƯỞNG UX</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink/75">{ux}</p>
                    </div>
                    <div>
                      <p className="label text-ink/45">MÀU & RANH GIỚI</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink/75">{colour}</p>
                    </div>
                    <div>
                      <p className="label text-ink/45">RỦI RO</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink/75">{risk}</p>
                    </div>
                    <div>
                      <p className="label text-ink/45">HỢP KHI</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink/75">{best}</p>
                    </div>
                  </div>
                </div>
              </div>
            </LabFrame>
          ))}

          <LabFrame label="ĐỀ XUẤT" meta="chọn một, tôi dựng thật">
            <div className="mx-auto max-w-[70ch] px-5 pb-20 text-sm leading-relaxed text-ink/75 md:px-10">
              <p>
                <strong className="text-ink">E rồi A</strong> là thứ tự tôi đề xuất, và
                chúng không loại trừ nhau — chúng là hai màn hình của cùng một luồng.{" "}
                <code>/discover</code> mở ra ở E, nơi việc chọn quận là nội dung chính;
                <code> /discover/:routeId</code> là A, nơi bạn đã chọn và chỉ cần đi. Đó
                cũng đúng với hai route đang có sẵn trong <code>App.tsx</code>, nên không
                phải phát minh thêm gì.
              </p>
              <p className="mt-3">
                <strong className="text-ink">B</strong> là hướng đúng nhất về mặt ý niệm và
                sai nhất về mặt dữ liệu: nó hứa một bản đồ thật, mà thứ đang có là hình
                minh hoạ không tỉ lệ, không tên đường. Đáng làm, nhưng sau khi bản đồ được
                nâng cấp.
              </p>
              <p className="mt-3">
                <strong className="text-ink">C</strong> và{" "}
                <strong className="text-ink">D</strong> đều đang thiếu nguyên liệu — C cần
                ảnh cho từng điểm dừng, D cần bài viết, mà <code>stop.description</code>
                {" "}hiện đang rỗng. Tôi để chúng ở đây vì chúng cho thấy trang này có thể
                đi xa tới đâu nếu nội dung được đầu tư, chứ không phải để chọn hôm nay.
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
