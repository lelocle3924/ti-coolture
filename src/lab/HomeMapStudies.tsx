/* The project ships no @types/react, so the namespace has to be pulled in
   explicitly before React.ReactNode resolves — same reason labShared does. */
import type React from "react";
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowDown, ArrowLeft, SlidersHorizontal, X } from "lucide-react";
import Header from "../components/Header";
import HeroWave from "../components/HeroWave";
import { ArcTopRight } from "../components/BrandShapes";
import Homepage from "../views/Homepage";
import {
  HomeIsland,
  HomeMapOverride,
  KeLayout,
  MAP_GROUND,
  MapArrows,
  RegionList,
  useRegionPicker,
  type DistrictMapProps,
} from "../home/DistrictMap";
import { planFor } from "../home/homeData";
import { useMediaQuery } from "../lib/useAutoHideChrome";
import "./lab.css";

/* ═══════════════════════════════════════════════════════════════════════════
   THE HOMEPAGE MAP — a wave, an arc, and a centred map (13/09)

   "bỏ giúp tôi 2 cái element là brand loop với cái arc top right ở homepage
    đi, nhìn lạc lõng quá. Cho vào lab mấy phương án sau thử (render ra giao
    diện giống homepage luôn chứ không phải chỉ trong lab nhé)"

   So this page IS the homepage — the real Homepage view, the real header, the
   real data — with the map section swapped for a study version through
   HomeMapOverride, and a panel in the corner that changes it in place. Each
   switch is one line of the note:

     · Sóng — "cho cơn sóng giống ở hero nằm ngay dưới map, ngang với map hoặc
       ngay mép dưới map". The hero's own HeroWave: same curve, same thickness
       rule (5vh on a phone, 17vh on a desktop), same sea motion. "Ngang map"
       lays its resting line through the middle of the island's land, so the
       island sits in the water; "Mép dưới map" lays it along the land's
       lowest edge. Both are measured off the drawn land — its bounding box —
       rather than the island's 4:3 box, so they follow when the arrows change
       region.
     · Màu sóng — teal or white.
     · Arc góc phải — "giữ lại element arc top right, ngay góc phải trên cùng
       luôn, nhưng đẩy nó lên để nó nối liền với mép dưới của các collections".
       The arc as drawn, unturned. Its top end is a flat cut, so with that cut
       laid exactly on the lower edge of the collections and its right side on
       the page's edge, it reads as coming out of the shelf and down into the
       map. Mờ is the 30% the /discover copy wears; Đậm is full strength.
     · Bố cục — "bỏ mấy selector bên trái, vì đã có mũi tên rồi. center cái
       map, phóng to cỡ chữ tên map lên gấp đôi". The list goes, the island
       keeps its width and moves to the middle, and the region's name goes
       from 16/18px to 32/36px.

   The switches live in the URL, so a combination can be sent as a link.
   ═══════════════════════════════════════════════════════════════════════════ */

type Wave = "off" | "level" | "edge";
type Colour = "teal" | "white";
type Arc = "off" | "soft" | "solid";
type Layout = "centre" | "list";

interface StudyOptions {
  wave: Wave;
  colour: Colour;
  arc: Arc;
  layout: Layout;
}

/** What the page opens on: everything the note asks for, switched on. */
const DEFAULTS: StudyOptions = { wave: "level", colour: "teal", arc: "solid", layout: "centre" };

function readOptions(params: URLSearchParams): StudyOptions {
  const pick = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
    const value = params.get(key);
    return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
  };
  return {
    wave: pick<Wave>("wave", ["off", "level", "edge"], DEFAULTS.wave),
    colour: pick<Colour>("colour", ["teal", "white"], DEFAULTS.colour),
    arc: pick<Arc>("arc", ["off", "soft", "solid"], DEFAULTS.arc),
    layout: pick<Layout>("layout", ["centre", "list"], DEFAULTS.layout),
  };
}

const Options = createContext<StudyOptions>(DEFAULTS);

/**
 * How wide the arc may be. At most the /discover copy's 28rem; otherwise as
 * wide as the room between the page's right edge and the end of the title or
 * the region's name, whichever reaches further, less a 16px breath. Found on
 * a phone: at a fixed width the solid ring ran through the centred region
 * name, and teal type on the teal ring simply vanished. Never under 7.5rem,
 * which on a phone is short enough to end above the title.
 */
const ARC_MAX_REM = 28;
const ARC_MIN_REM = 7.5;
/** Its flat top end sits 3.52 units down a 555-wide box, so the box is lifted
    by that much of its own width to put the cut, not the box, on the edge. */
const ARC_CUT = 3.52 / 555;

/** The wave's box is this much of the island's height — about the share of
    the hero the hero's own box takes. */
const WAVE_BOX = 0.36;
/** HeroWave rests both ends at y 64 of its 120-tall box. */
const WAVE_REST = 64 / 120;
/** The sea moves the middle of the curve up to 28 of those 120 units. */
const WAVE_SWING = 28 / 120;

interface Geometry {
  /** The drawn land's top and bottom, from the section's top edge. */
  landTop: number;
  landBottom: number;
  /** The island's 4:3 box: its height, and its bottom from the section's top. */
  islandHeight: number;
  islandBottom: number;
  /** From the lower edge of the collections down to this section's top. */
  rise: number;
  /** The arc's width in px — see ARC_MAX_REM. */
  arcWidth: number;
}

/** The map section, as the study draws it. Mounted by HomeMapOverride. */
function StudyMap({ routes, onOpenRoute, heading = "Khám phá thành phố" }: DistrictMapProps) {
  const options = useContext(Options);
  const wide = useMediaQuery("(min-width: 768px)");
  const { route, pick, step } = useRegionPicker(routes);
  const sectionRef = useRef<HTMLElement>(null);
  const [geo, setGeo] = useState<Geometry | null>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const svg = section.querySelector<SVGSVGElement>('svg[viewBox="0 0 800 600"]');
      const land = svg?.querySelector<SVGGElement>("g[fill]");
      if (!svg || !land) return;
      const top = section.getBoundingClientRect().top;
      const box = svg.getBoundingClientRect();
      const drawn = land.getBBox();
      const scale = box.height / 600;
      // the heading, the panels and the "see more" line: the panels are second
      const panels = document.querySelector("#dong-collections > :nth-child(2)");
      // how far right the words reach — the glyphs, not their block boxes
      const reach = [...section.querySelectorAll("h2, h2 + p")].reduce((edge, el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return Math.max(edge, range.getBoundingClientRect().right);
      }, 0);
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const room = document.documentElement.clientWidth - reach - 16;
      setGeo({
        landTop: box.top - top + drawn.y * scale,
        landBottom: box.top - top + (drawn.y + drawn.height) * scale,
        islandHeight: box.height,
        islandBottom: box.bottom - top,
        rise: panels ? top - panels.getBoundingClientRect().bottom : 0,
        arcWidth: Math.min(ARC_MAX_REM * rem, Math.max(ARC_MIN_REM * rem, room)),
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    const observer = new ResizeObserver(schedule);
    observer.observe(section);
    const collections = document.getElementById("dong-collections");
    if (collections) observer.observe(collections);
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [route?.id, options.layout, options.wave, wide]);

  if (!route) return null;
  const plan = planFor(route.id);

  /* The wave. Its resting line goes through the middle of the land or along
     its foot; the box is placed so that line lands there. */
  const boxHeight = geo ? geo.islandHeight * WAVE_BOX : 0;
  const restY = geo
    ? options.wave === "edge"
      ? geo.landBottom
      : (geo.landTop + geo.landBottom) / 2
    : 0;
  const boxTop = restY - WAVE_REST * boxHeight;

  /* "Mép dưới" puts half the band, and its swing, below the land — past the
     island's foot and into the band below unless the section makes room.
     Only where the island is the last thing in the section: on a phone the
     list layout stacks the regions under it, and the band simply runs behind
     them, which is part of what that combination shows. */
  const basePad = wide ? 64 : 48;
  const bandHalf = ((wide ? 0.17 : 0.05) * (typeof window === "undefined" ? 800 : window.innerHeight)) / 2;
  const islandLast = options.layout === "centre" || wide;
  const below = geo ? geo.islandBottom - geo.landBottom : 0;
  const extraPad =
    geo && options.wave === "edge" && islandLast
      ? Math.max(0, bandHalf + WAVE_SWING * boxHeight + 12 - (below + basePad))
      : 0;

  const island = (
    /* Pulled up by its own empty top, exactly as on the homepage. */
    <div className="relative -mt-[10.9%]">
      <MapArrows onStep={step} />
      <HomeIsland route={route} onOpenRoute={onOpenRoute} />
    </div>
  );

  return (
    <section
      ref={sectionRef}
      id="dong-map"
      data-surface="dark"
      /* The arc rises out of this section's top, so only the sides clip. */
      className={`relative pt-12 text-paper md:pt-16 ${
        options.arc === "off" ? "overflow-hidden" : "overflow-x-clip"
      }`}
      style={{ background: MAP_GROUND, paddingBottom: basePad + extraPad }}
    >
      {options.arc !== "off" && geo && (
        <ArcTopRight
          className="pointer-events-none absolute right-0 z-[1] transition-opacity duration-300"
          fill="var(--color-wave)"
          style={{
            width: geo.arcWidth,
            top: -geo.rise - geo.arcWidth * ARC_CUT,
            opacity: options.arc === "soft" ? 0.3 : 1,
          }}
        />
      )}

      {options.wave !== "off" && geo && (
        <HeroWave
          className="z-[2]"
          stroke={options.colour === "white" ? "var(--color-paper)" : "var(--color-wave)"}
          boxTop={`${boxTop}px`}
          boxHeight={`${boxHeight}px`}
        />
      )}

      <div className="relative z-20 mx-auto max-w-4xl px-5 text-center md:px-8">
        <h2 className="display text-[clamp(2rem,5.6vw,4.5rem)] normal-case leading-[1.25] text-paper">
          {heading}
        </h2>
        <p
          key={route.id}
          className={`lab-plate-in mt-3 tracking-[0.12em] text-wave ${
            options.layout === "centre"
              ? "text-[2rem] leading-[1.25] md:text-[2.25rem]"
              : "text-base md:text-lg"
          }`}
        >
          {plan.region}
        </p>
      </div>

      <div className="relative z-10 mt-2 md:mt-4">
        {options.layout === "centre" ? (
          /* The island keeps the width it had beside the list — 65% of the
             page on a desktop, 75% on a phone — and moves to the middle. */
          <div className="mx-auto w-[75%] md:w-[65%]">{island}</div>
        ) : (
          <KeLayout
            islandFirst
            align="start"
            index={<RegionList routes={routes} current={route.id} onPick={pick} />}
            island={island}
          />
        )}
      </div>
    </section>
  );
}

/* ── the panel ──────────────────────────────────────────────────────────── */

const GROUPS: Array<{
  key: keyof StudyOptions;
  label: string;
  choices: Array<[string, string]>;
}> = [
  { key: "wave", label: "Sóng", choices: [["off", "Tắt"], ["level", "Ngang map"], ["edge", "Mép dưới map"]] },
  { key: "colour", label: "Màu sóng", choices: [["teal", "Xanh"], ["white", "Trắng"]] },
  { key: "arc", label: "Arc góc phải", choices: [["off", "Tắt"], ["soft", "Mờ 30%"], ["solid", "Đậm"]] },
  { key: "layout", label: "Bố cục", choices: [["centre", "Map ở giữa"], ["list", "Danh sách bên trái"]] },
];

function scrollToMap() {
  const map = document.getElementById("dong-map");
  if (!map) return false;
  // a little of the collections above it, so the arc's join is in view
  window.scrollTo({ top: window.scrollY + map.getBoundingClientRect().top - 180 });
  return true;
}

function Controls({
  options,
  onChange,
}: {
  options: StudyOptions;
  onChange: (patch: Partial<StudyOptions>) => void;
}) {
  const wide = useMediaQuery("(min-width: 768px)");
  const [open, setOpen] = useState(true);
  // folded on a phone, where an open panel would cover the map it controls
  useEffect(() => setOpen(wide), [wide]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-[65] inline-flex items-center gap-2 rounded-full bg-ink/85 px-4 py-2.5 text-xs font-semibold text-paper shadow-[0_18px_40px_-18px_rgba(18,8,31,0.85)] ring-1 ring-white/10 backdrop-blur-md"
      >
        <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-wave" />
        Lab · map
      </button>
    );
  }

  return (
    <div
      role="region"
      aria-label="Công tắc thử nghiệm cho map trang chủ"
      className="fixed bottom-4 left-4 z-[65] w-[min(21rem,calc(100vw-2rem))] rounded-[1.25rem] bg-ink/85 p-4 text-paper shadow-[0_24px_48px_-24px_rgba(18,8,31,0.9)] ring-1 ring-white/10 backdrop-blur-md"
    >
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/lab"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.12em] text-white/55 transition-colors hover:text-wave"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          LAB
        </Link>
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={scrollToMap}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-paper/85 transition-colors hover:bg-white/10"
          >
            Tới map
            <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Thu gọn bảng công tắc"
            className="grid h-8 w-8 place-items-center rounded-full text-paper/70 transition-colors hover:bg-white/10"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </span>
      </div>

      <div className="mt-3 space-y-3">
        {GROUPS.map((group) => {
          const muted = group.key === "colour" && options.wave === "off";
          return (
            <fieldset key={group.key} disabled={muted} className={muted ? "opacity-40" : ""}>
              <legend className="text-[11px] tracking-[0.12em] text-white/55">{group.label}</legend>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {group.choices.map(([value, label]) => {
                  const on = options[group.key] === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => onChange({ [group.key]: value } as Partial<StudyOptions>)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        on ? "bg-wave text-ink" : "bg-white/10 text-paper/85 hover:bg-white/20"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>
    </div>
  );
}

/* ── the page ───────────────────────────────────────────────────────────── */

export default function HomeMapStudies() {
  const [params, setParams] = useSearchParams();
  const options = readOptions(params);

  const change = (patch: Partial<StudyOptions>) => {
    const next = { ...options, ...patch };
    setParams(
      { wave: next.wave, colour: next.colour, arc: next.arc, layout: next.layout },
      { replace: true }
    );
  };

  /* Open on the map rather than on the hero: the study is at the foot of a
     long page. Tried until the section exists, since the homepage fetches
     before it draws it; the page above is still there to scroll back to. */
  useEffect(() => {
    let tries = 0;
    let timer = 0;
    const go = () => {
      if (scrollToMap() || tries++ > 50) return;
      timer = window.setTimeout(go, 120);
    };
    timer = window.setTimeout(go, 400);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <Options.Provider value={options}>
      <HomeMapOverride.Provider value={StudyMap}>
        {/* The arc rises into the collections band behind its "see more" line;
            keep that link in front of it. Lab only. */}
        <style>{"#dong-collections a { position: relative; z-index: 3; }"}</style>
        {/* /lab carries no site chrome, so the study brings the real header. */}
        <Header />
        <Homepage />
        <Controls options={options} onChange={change} />
      </HomeMapOverride.Provider>
    </Options.Provider>
  );
}
