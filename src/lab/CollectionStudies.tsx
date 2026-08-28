import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { formatPrice, useHomeData, type HomeCollection } from "../home/homeData";
import { useDragTrack } from "../lib/useDragTrack";
import { useMediaQuery } from "../lib/useAutoHideChrome";
import type { Product } from "../types";
import { LabShell, LabFrame } from "./labShared";

/* ═══════════════════════════════════════════════════════════════════════════
   COLLECTIONS — the two directions the team asked for on 26/08

   "Remove scroll interaction on 'Collections' section. Try 2 new directions.
    1st one simply replace scroll with click and drag and a bar below like
    this to signal there's more. 2nd option follows rough sketch below, where
    Collections act like spring tabs, springs open when clicked on."

   Both replace the same thing: the pinned run (MO-7), which made the section
   three viewports tall and drove a 60/30/10 window from the document's own
   scroll position.
   ═══════════════════════════════════════════════════════════════════════════ */

/* Card tones. The violet is the field both directions sit on, so no panel
   takes it — a violet card on violet ground has no edges. */
const TONES = [
  { fill: "bg-wave", text: "text-ink", muted: "text-ink/65" },
  { fill: "bg-paper", text: "text-ink", muted: "text-ink/60" },
  { fill: "bg-brand-deep", text: "text-paper", muted: "text-white/65" },
  { fill: "bg-ink", text: "text-paper", muted: "text-white/60" },
];

function LeadPiece({
  lead,
  muted,
  onOpen,
  blocked,
}: {
  lead: Product;
  muted: string;
  onOpen: (p: Product) => void;
  blocked?: () => boolean;
}) {
  return (
    <button
      onClick={() => {
        if (blocked?.()) return;
        onOpen(lead);
      }}
      className="group mt-5 flex min-h-0 flex-1 flex-col text-left"
    >
      <span className="relative block min-h-0 flex-1 overflow-hidden bg-current/10">
        <img
          src={lead.images[0]}
          alt={lead.name}
          loading="lazy"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
        />
      </span>
      <span className="mt-3 flex items-baseline justify-between gap-4">
        <span className="truncate text-base font-medium">{lead.name}</span>
        <span className={`shrink-0 whitespace-nowrap text-sm ${muted}`}>
          {formatPrice(lead.price)}
        </span>
      </span>
    </button>
  );
}

/* ── direction 1 — drag, with a bar that says how far it runs ───────────── */

export function CollectionsDragged({
  collections,
  onOpen,
}: {
  collections: HomeCollection[];
  onOpen: (p: Product) => void;
}) {
  const wide = useMediaQuery("(min-width: 1024px)");
  const medium = useMediaQuery("(min-width: 640px)");
  const perPage = wide ? 3 : medium ? 2 : 1;

  const panelCount = collections.length + 1;
  const pageCount = Math.max(1, Math.ceil(panelCount / perPage));
  const track = useDragTrack(pageCount);

  if (collections.length === 0) return null;
  const seeMoreIndex = panelCount - 1;

  const pages = Array.from({ length: pageCount }, (_, p) =>
    Array.from({ length: perPage }, (_, k) => p * perPage + k).filter((i) => i < panelCount)
  );

  return (
    <section className="bg-brand py-12 text-paper">
      <div
        ref={track.setViewport}
        {...track.handlers}
        role="group"
        aria-roledescription="carousel"
        aria-label="Bộ sưu tập"
        className={`overflow-hidden touch-pan-y ${track.dragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        <div
          className="flex"
          style={{ transform: `translate3d(${track.x}px, 0, 0)`, willChange: "transform" }}
        >
          {pages.map((indices, p) => (
            <div key={p} className="w-full shrink-0 px-5 md:px-10">
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(${perPage}, minmax(0, 1fr))` }}
              >
                {indices.map((i) => {
                  const tone = TONES[i % TONES.length];
                  if (i === seeMoreIndex) {
                    return (
                      <div
                        key="see-more"
                        className={`flex min-h-[19rem] flex-col justify-between p-6 ${tone.fill} ${tone.text}`}
                      >
                        <span className="text-[11px] tracking-[0.16em] opacity-60">→</span>
                        <div>
                          <h3 className="display text-[clamp(1.4rem,2.2vw,2rem)] normal-case leading-[1.15]">
                            Còn nhiều bộ sưu tập khác
                          </h3>
                          <Link
                            to="/products"
                            className="mt-4 inline-flex w-fit items-center gap-2 border-b border-current pb-1 text-sm font-semibold"
                          >
                            Xem thêm
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    );
                  }
                  const c = collections[i];
                  const lead = c.items[0] ?? null;
                  return (
                    <div
                      key={c.id}
                      className={`flex min-h-[19rem] flex-col p-6 ${tone.fill} ${tone.text}`}
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-[11px] tracking-[0.16em] opacity-60">{c.index}</span>
                        <span className={`text-[11px] tracking-[0.16em] ${tone.muted}`}>
                          {String(c.items.length).padStart(2, "0")} MÓN
                        </span>
                      </div>
                      <h3 className="display mt-3 truncate text-[clamp(1.3rem,2vw,1.85rem)] normal-case leading-[1.15]">
                        {c.name}
                      </h3>
                      {lead && (
                        <LeadPiece
                          lead={lead}
                          muted={tone.muted}
                          onOpen={onOpen}
                          blocked={track.didDrag}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {pageCount > 1 && (
        <div className="mt-7 flex items-center justify-center gap-3">
          {pages.map((_, p) => (
            <button
              key={p}
              onClick={() => track.goTo(p)}
              aria-label={`Trang ${p + 1} trên ${pageCount}`}
              aria-current={p === track.page}
              className={`h-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                p === track.page ? "w-10 bg-wave" : "w-1.5 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ── direction 2 — spring tabs, after the sketch ────────────────────────── */

/* A closed spine keeps the colour of the panel it opens into — that is what
   makes the row read as a row of collections rather than as decoration, and
   it is the part of the sketch that matters most.

   The sketch's literal palette is teal / violet / white, but it draws them on
   a white page. Here the section is the site's violet field, so the bright
   brand violet is the one colour a panel cannot take: at 3.25rem wide a
   violet spine on violet ground is not a spine, it is a gap. brand-deep
   stands in for it and stays in the violet family. */
const SPRING_TONES = [
  { fill: "bg-wave", text: "text-ink", spine: "text-ink", tile: "bg-ink/10" },
  { fill: "bg-brand-deep", text: "text-paper", spine: "text-wave", tile: "bg-white/15" },
  { fill: "bg-paper", text: "text-ink", spine: "text-brand", tile: "bg-ink/8" },
  { fill: "bg-ink", text: "text-paper", spine: "text-wave", tile: "bg-white/12" },
];

export function CollectionsSpringTabs({
  collections,
  onOpen,
}: {
  collections: HomeCollection[];
  onOpen: (p: Product) => void;
}) {
  const [open, setOpen] = useState(0);
  const wide = useMediaQuery("(min-width: 768px)");

  if (collections.length === 0) return null;

  /* Stacked on phones. A 3.25rem spine times four leaves nothing for the open
     panel at 390px, and the sketch's whole point is that the open one is
     wide. */
  if (!wide) {
    return (
      <section className="bg-brand px-5 py-12">
        <div className="space-y-3">
          {collections.map((c, i) => {
            const tone = SPRING_TONES[i % SPRING_TONES.length];
            const isOpen = i === open;
            return (
              <div key={c.id} className={`${tone.fill} ${tone.text}`}>
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-baseline justify-between gap-3 p-4 text-left"
                >
                  <span className="display text-xl normal-case leading-[1.25]">{c.name}</span>
                  <span className="shrink-0 text-[11px] tracking-[0.16em] opacity-60">
                    {String(c.items.length).padStart(2, "0")} MÓN
                  </span>
                </button>
                {isOpen && (
                  <div className="lab-spring-contents grid grid-cols-3 gap-2 px-4 pb-4">
                    {c.items.slice(0, 3).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => onOpen(p)}
                        className={`aspect-square overflow-hidden ${tone.tile}`}
                      >
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-brand px-5 py-12 md:px-10">
      {/* One row, panels sharing it by flex-grow. The open one takes the room
          the closed spines give up, so nothing is ever mid-air — which is what
          makes it read as one mechanism rather than four panels animating. */}
      <div className="flex h-[26rem] gap-1 overflow-hidden">
        {collections.map((c, i) => {
          const tone = SPRING_TONES[i % SPRING_TONES.length];
          const isOpen = i === open;

          return (
            <div
              key={c.id}
              className={`lab-spring-panel relative flex overflow-hidden ${tone.fill} ${tone.text}`}
              style={{ ["--lab-grow" as string]: isOpen ? 10 : 1 }}
            >
              {/* The spine is the control, and it stays put when the panel
                  opens — so the thing you pressed is still under your cursor
                  and pressing it again closes it. */}
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                aria-label={`${c.name} — ${c.items.length} món`}
                className={`flex w-[3.25rem] shrink-0 flex-col items-center justify-between py-5 ${tone.spine}`}
              >
                <span className="text-[11px] tabular-nums tracking-[0.16em] opacity-70">
                  {c.index}
                </span>
                <span className="lab-spine-label text-[11px] font-semibold tracking-[0.22em] uppercase">
                  {c.name}
                </span>
                <span aria-hidden="true" className="h-5 w-px bg-current opacity-30" />
              </button>

              {isOpen && (
                <div className="lab-spring-contents flex min-w-0 flex-1 flex-col py-5 pr-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="display truncate text-[clamp(1.4rem,2.2vw,2.1rem)] normal-case leading-[1.25]">
                      {c.name}
                    </h3>
                    <span className="shrink-0 text-[11px] tracking-[0.16em] opacity-60">
                      {String(c.items.length).padStart(2, "0")} MÓN
                    </span>
                  </div>

                  <div className="mt-4 grid min-h-0 flex-1 grid-cols-3 gap-3">
                    {c.items.slice(0, 3).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => onOpen(p)}
                        className={`group flex min-h-0 flex-col text-left ${tone.tile}`}
                      >
                        <span className="relative block min-h-0 flex-1 overflow-hidden">
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                          />
                        </span>
                        <span className="truncate p-2 text-xs font-medium">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── the page ───────────────────────────────────────────────────────────── */

export default function CollectionStudies() {
  const { collections } = useHomeData();
  const noop = () => {};

  return (
    <LabShell
      eyebrow="TRANG CHỦ · BỘ SƯU TẬP"
      title="Hai hướng thay cho pinned scroll"
      notes={
        <>
          <p>
            Cả hai đều thay cùng một thứ: pinned run (MO-7) khiến section cao ~3
            màn hình và điều khiển cửa sổ 60/30/10 bằng scroll của cả trang.
          </p>
          <p>
            Hướng 1 đang chạy trên trang chủ. Hướng 2 dựng theo sketch trong
            feedback 26/08. Cả hai dùng cùng dữ liệu thật.
          </p>
        </>
      }
    >
      <LabFrame
        label="Hướng 1 · Kéo thả + thanh chỉ vị trí"
        meta="useDragTrack · 3 thẻ ở lg, 2 ở sm, 1 ở mobile · thanh = trang hiện tại"
      >
        <CollectionsDragged collections={collections} onOpen={noop} />
      </LabFrame>

      <LabFrame
        label="Hướng 2 · Spring tabs"
        meta="flex-grow 1 → 10 · 620ms · var(--ease-brand) · gáy đứng giữ nguyên khi mở"
      >
        <CollectionsSpringTabs collections={collections} onOpen={noop} />
      </LabFrame>

      <div className="mx-auto max-w-[70ch] px-5 py-10 text-sm leading-relaxed text-ink/70 md:px-10">
        <p className="label text-ink/50">ĐÁNH ĐỔI</p>
        <ul className="mt-3 space-y-2">
          <li>
            <strong className="text-ink">Hướng 1</strong> cho thấy nhiều bộ sưu tập
            cùng lúc và đọc được ngay; đổi lại mỗi bộ chỉ khoe được một món.
          </li>
          <li>
            <strong className="text-ink">Hướng 2</strong> cho ba món của bộ đang mở
            và có một cử chỉ đáng nhớ; đổi lại ba bộ còn lại thu về gáy chữ đứng,
            và tên bộ sưu tập dài sẽ bị cắt ở gáy.
          </li>
          <li>
            Hướng 2 cần tên ngắn. Với “Collection 1…4” placeholder thì ổn; tên thật
            dài hơn nên đo lại trước khi chốt.
          </li>
        </ul>
      </div>
    </LabShell>
  );
}
