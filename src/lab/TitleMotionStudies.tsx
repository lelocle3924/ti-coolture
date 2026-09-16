import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import {
  animate,
  createTimeline,
  scrambleText,
  splitText,
  spring,
  stagger,
  utils,
  type JSAnimation,
  type TextSplitterParams,
  type Timeline,
} from "animejs";
import Header from "../components/Header";
import RevealFooterLayout from "../components/RevealFooter";
import { useReducedMotion } from "../lib/useAutoHideChrome";
import { LabChoices, LabPanel } from "./labShared";

/* ═══════════════════════════════════════════════════════════════════════════
   TITLES THAT ARRIVE — fourteen ways, with anime.js (14/09)

   "thử nghiệm với animejs để thêm hiệu ứng vào các chữ xuất hiện trên các
    trang ở cấp độ title. thử nghiệm thật nhiều option vào (ít nhất 10)"

   Judged on the pages themselves. /lab/titles mounts the real views — the
   homepage, the catalogue, a product, the shop directory, a shop, /discover —
   under the real header, and plays the chosen effect on every title-level
   heading (an h1 or h2 set in the display face) as it comes into view. The
   panel changes the effect, the page and the pace in place and keeps them in
   the URL, so a combination can be sent as a link. "Tắt" is the site today.

   How a title is animated without the page knowing about it:

     · Nothing in src/views changes. The study finds the headings in the DOM —
       with a MutationObserver, so a title that renders after its data loads
       is found too — holds each at opacity 0 until a third of it is on
       screen, and then plays.
     · anime.js' splitText cuts the heading into lines, words or characters.
       Those spans stand in for React's own text nodes, so when the effect has
       finished the very nodes React rendered are put back, not a copy of the
       markup, and React can go on updating the heading afterwards — /discover's
       "Địa điểm …" changes with the pin. Only headings made of text and line
       breaks are touched, so there is nothing else in them React could reach
       for while they are split.
     · Every animation is built inside the splitter's addEffect, never straight
       after splitText returns. A split by lines is not there yet at that
       moment — splitText waits for document.fonts.ready first — so an
       animation built on the spot had no targets, and the late split then
       landed on a heading already handed back, leaving it cut up for good.
       The title is shown only once its effect has set the first frame.
     · Anything that rides out of a clip is clipped with clip-path, reaching
       0.3em past the line: Vietnamese capitals stand ~1.18em tall (see
       .display in index.css), and a clip the height of the line would shave
       the marks off Ả and Ố for as long as the animation runs. Its travel is
       measured to clear that reach.
     · Reduced motion plays nothing, as the brief asks of every entrance.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── the effects ───────────────────────────────────────────────────────── */

type Anim = JSAnimation | Timeline;

interface Parts {
  chars: HTMLElement[];
  words: HTMLElement[];
  lines: HTMLElement[];
}

interface Effect {
  id: string;
  name: string;
  /** One line for the panel: what the visitor sees. */
  note: string;
  split: TextSplitterParams;
  /** Sets the first frame on the parts and returns the animation. */
  build: (parts: Parts, el: HTMLElement, rate: number) => Anim;
}

interface Playing {
  finished: Promise<void>;
  /** Stop, and hand the heading back exactly as React rendered it. */
  revert: () => void;
}

/** The longest a title may wait, hidden, for a split that never comes. */
const GIVE_UP_MS = 4000;

function playEffect(el: HTMLElement, effect: Effect, rate: number): Playing {
  const original = Array.from(el.childNodes);
  let settle = () => {};
  const finished = new Promise<void>((resolve) => {
    settle = resolve;
  });
  const giveUp = window.setTimeout(() => settle(), GIVE_UP_MS);

  const splitter = splitText(el, { accessible: true, ...effect.split });
  // runs as soon as the split exists — at once for words and characters,
  // after document.fonts.ready for lines — and again if a resize re-splits
  splitter.addEffect((self: Parts) => {
    const anim = effect.build({ chars: self.chars, words: self.words, lines: self.lines }, el, rate);
    el.removeAttribute("data-tm-wait");
    void anim.then(() => settle());
    return anim;
  });

  return {
    finished,
    revert: () => {
      window.clearTimeout(giveUp);
      splitter.revert();
      // a split still waiting on fonts.ready finds nothing left to split
      splitter.html = "";
      el.replaceChildren(...original);
      el.removeAttribute("data-tm-wait");
    },
  };
}

const MARKS = 0.3;

function fontSize(el: HTMLElement) {
  return parseFloat(window.getComputedStyle(el).fontSize) || 16;
}

/** Swap each part's overflow clip for one that leaves room for the marks. */
function roomForMarks(parts: HTMLElement[]) {
  for (const part of parts) {
    const clip = part.parentElement;
    if (!clip) continue;
    clip.style.overflow = "visible";
    clip.style.clipPath = `inset(-${MARKS}em -0.08em)`;
  }
}

/** How far a part has to drop to be clear of its clip, marks and all. */
function clearOf(el: HTMLElement) {
  const reach = (MARKS + 0.05) * fontSize(el);
  return (part: HTMLElement) => part.offsetHeight + reach;
}

function sameColour(computed: string, colour: string) {
  const probe = document.createElement("span");
  probe.style.color = colour;
  document.body.appendChild(probe);
  const resolved = window.getComputedStyle(probe).color;
  probe.remove();
  return resolved === computed;
}

const EFFECTS: Effect[] = [
  {
    id: "rise",
    name: "Trồi lên",
    note: "Từng chữ trồi lên từ sau một đường cắt — rất nhanh, rồi chậm dần vào chỗ.",
    split: { chars: { wrap: "clip" } },
    build: ({ chars }, el, rate) => {
      roomForMarks(chars);
      utils.set(chars, { y: clearOf(el) });
      return animate(chars, { y: 0, duration: 760, delay: stagger(22), ease: "out(4)", playbackRate: rate });
    },
  },
  {
    id: "lines",
    name: "Trượt từng dòng",
    note: "Cả dòng trượt lên một lượt, dòng sau theo dòng trước — như lật sang trang mới.",
    split: { lines: { wrap: "clip" } },
    build: ({ lines }, el, rate) => {
      roomForMarks(lines);
      utils.set(lines, { y: clearOf(el) });
      return animate(lines, { y: 0, duration: 900, delay: stagger(130), ease: "out(4)", playbackRate: rate });
    },
  },
  {
    id: "pop",
    name: "Bật từng từ",
    note: "Mỗi từ bật ra từ nhỏ xíu, hơi nghiêng, nảy một nhịp lò xo rồi đứng yên.",
    split: { words: true },
    build: ({ words }, _el, rate) => {
      utils.set(words, { opacity: 0, scale: 0.45, rotate: () => utils.random(-12, 12) });
      return animate(words, {
        opacity: { to: 1, duration: 220, ease: "out(2)" },
        scale: 1,
        rotate: 0,
        ease: spring({ bounce: 0.45, duration: 650 }),
        delay: stagger(85),
        playbackRate: rate,
      });
    },
  },
  {
    id: "wave",
    name: "Gợn sóng",
    note: "Chữ nhô lên rồi hạ xuống thành một con sóng chạy từ trái sang phải — dải sóng của hero, bằng chữ.",
    split: { chars: true },
    build: ({ chars }, _el, rate) => {
      utils.set(chars, { opacity: 0, y: "0.45em" });
      return animate(chars, {
        opacity: { to: 1, duration: 240, ease: "out(2)" },
        y: [
          { to: "-0.3em", duration: 320, ease: "out(3)" },
          { to: "0em", duration: 560, ease: "inOut(2)" },
        ],
        delay: stagger(36),
        playbackRate: rate,
      });
    },
  },
  {
    id: "scramble",
    name: "Xáo chữ",
    note: "Ký tự ngẫu nhiên chạy qua từng từ rồi dừng đúng chữ — kiểu bảng giờ tàu ở ga.",
    split: { words: true },
    build: ({ words }, _el, rate) => {
      // a scrambling word keeps the width of the word it will become
      for (const word of words) {
        word.style.minWidth = `${word.getBoundingClientRect().width}px`;
        word.style.whiteSpace = "nowrap";
      }
      utils.set(words, { opacity: 0 });
      return animate(words, {
        opacity: { to: 1, duration: 1, delay: stagger(110) },
        textContent: scrambleText({
          chars: "uppercase",
          revealRate: 30,
          settleDuration: 420,
          perturbation: 0.5,
          delay: (_target, index) => (index ?? 0) * 110,
        }),
        playbackRate: rate,
      });
    },
  },
  {
    id: "curtain",
    name: "Rèm teal",
    note: "Một dải teal quét qua từng dòng; chữ đã nằm sẵn phía sau khi dải rút đi.",
    split: { lines: true },
    build: ({ lines }, el, rate) => {
      const align = window.getComputedStyle(el).textAlign;
      const curtains = lines.map((line) => {
        // the line hugs its words, so the curtain does too
        line.style.position = "relative";
        line.style.width = "fit-content";
        if (align === "center") line.style.marginInline = "auto";
        else if (align === "right" || align === "end") line.style.marginLeft = "auto";
        line.style.color = "transparent";
        const curtain = document.createElement("span");
        curtain.setAttribute("aria-hidden", "true");
        curtain.style.cssText =
          "position:absolute;inset:-0.04em -0.14em;background:var(--color-wave);transform:scaleX(0);transform-origin:0 50%;pointer-events:none;";
        line.appendChild(curtain);
        return curtain;
      });
      const timeline = createTimeline({ playbackRate: rate });
      lines.forEach((line, i) => {
        const at = i * 140;
        const curtain = curtains[i];
        timeline
          .add(curtain, { scaleX: 1, duration: 420, ease: "inOut(3)" }, at)
          .call(() => {
            line.style.color = "";
            curtain.style.transformOrigin = "100% 50%";
          }, at + 430)
          .add(curtain, { scaleX: 0, duration: 460, ease: "inOut(3)" }, at + 440);
      });
      return timeline;
    },
  },
  {
    id: "blink",
    name: "Mắt chớp",
    note: "Chữ mở ra từ giữa theo chiều dọc rồi chớp một cái — như con mắt trên dải loop.",
    split: { chars: true },
    build: ({ chars }, _el, rate) => {
      utils.set(chars, { opacity: 0, scaleY: 0 });
      return animate(chars, {
        opacity: { to: 1, duration: 120, ease: "linear" },
        scaleY: [
          { to: 1, duration: 380, ease: "out(3)" },
          { to: 0.08, duration: 110, ease: "in(2)", delay: 300 },
          { to: 1, duration: 220, ease: "out(2)" },
        ],
        delay: stagger(24, { from: "center" }),
        playbackRate: rate,
      });
    },
  },
  {
    id: "type",
    name: "Gõ phím",
    note: "Từng chữ hiện ra sau một con trỏ teal; gõ xong, con trỏ nháy hai lần rồi đi.",
    split: { chars: true },
    build: ({ chars }, _el, rate) => {
      utils.set(chars, { opacity: 0 });
      const caret = document.createElement("span");
      caret.setAttribute("aria-hidden", "true");
      // takes no room: its margin gives back the width it adds
      caret.style.cssText =
        "display:inline-block;width:0.09em;height:0.92em;margin-right:-0.09em;vertical-align:-0.06em;background:var(--color-wave);";
      chars[0]?.before(caret);
      const step = 55;
      const timeline = createTimeline({ playbackRate: rate });
      chars.forEach((char, i) => {
        timeline.call(() => {
          char.style.opacity = "1";
          char.after(caret);
        }, 120 + i * step);
      });
      return timeline.add(
        caret,
        {
          opacity: [
            { to: 0, duration: 160 },
            { to: 1, duration: 160, delay: 140 },
            { to: 0, duration: 160, delay: 140 },
            { to: 1, duration: 160, delay: 140 },
            { to: 0, duration: 160, delay: 140 },
          ],
          ease: "linear",
        },
        120 + chars.length * step + 160
      );
    },
  },
  {
    id: "drop",
    name: "Rơi & nảy",
    note: "Chữ rơi xuống theo thứ tự ngẫu nhiên, nghiêng lệch, nảy lò xo khi chạm dòng.",
    split: { chars: true },
    build: ({ chars }, _el, rate) => {
      utils.set(chars, { opacity: 0, y: "-1.2em", rotate: () => utils.random(-28, 28) });
      return animate(chars, {
        opacity: { to: 1, duration: 160, ease: "linear" },
        y: "0em",
        rotate: 0,
        ease: spring({ bounce: 0.55, duration: 750 }),
        delay: stagger(36, { from: "random" }),
        playbackRate: rate,
      });
    },
  },
  {
    id: "blur",
    name: "Mờ về nét",
    note: "Chữ từ nhoè và hơi lệch phải trôi về chỗ, rõ dần — dịu nhất trong cả bộ.",
    split: { chars: true },
    build: ({ chars }, _el, rate) => {
      utils.set(chars, { opacity: 0, filter: "blur(12px)", x: "0.35em" });
      return animate(chars, {
        opacity: 1,
        filter: "blur(0px)",
        x: "0em",
        duration: 950,
        delay: stagger(26),
        ease: "out(3)",
        playbackRate: rate,
      });
    },
  },
  {
    id: "flip",
    name: "Lật 3D",
    note: "Mỗi chữ lật từ nằm ngửa dựng đứng lên quanh chân chữ, như bảng lật số.",
    split: { chars: true },
    build: ({ chars, words }, _el, rate) => {
      // the depth lives on the words the characters sit in, which go with the split
      for (const word of words) word.style.perspective = "10em";
      utils.set(chars, { opacity: 0, rotateX: -100, transformOrigin: "50% 100%" });
      return animate(chars, {
        opacity: { to: 1, duration: 200, ease: "linear" },
        rotateX: 0,
        duration: 820,
        delay: stagger(28),
        ease: "out(3)",
        playbackRate: rate,
      });
    },
  },
  {
    id: "gather",
    name: "Tụ lại",
    note: "Chữ bay vào từ mọi hướng, vừa xoay vừa lớn dần, tụ về đúng chỗ.",
    split: { chars: true },
    build: ({ chars }, _el, rate) => {
      utils.set(chars, {
        opacity: 0,
        scale: 0.3,
        x: () => `${utils.random(-3, 3, 2)}em`,
        y: () => `${utils.random(-2, 2, 2)}em`,
        rotate: () => utils.random(-140, 140),
      });
      return animate(chars, {
        opacity: { to: 1, duration: 320, ease: "linear" },
        scale: 1,
        x: "0em",
        y: "0em",
        rotate: 0,
        duration: 1100,
        delay: stagger(18, { from: "random" }),
        ease: "out(4)",
        playbackRate: rate,
      });
    },
  },
  {
    id: "roll",
    name: "Cuộn số",
    note: "Mỗi chữ cuộn qua một vòng như đồng hồ đếm số và dừng đúng mặt chữ.",
    split: { chars: { wrap: "clip", clone: "bottom" } },
    build: ({ chars }, el, rate) => {
      roomForMarks(chars);
      const gap = (MARKS + 0.05) * fontSize(el);
      // the copy waits below the reach of the marks, not just below the line
      for (const char of chars) {
        const copy = char.querySelector<HTMLElement>("[inert]");
        if (copy) copy.style.top = `calc(100% + ${gap}px)`;
      }
      const step = (char: HTMLElement) => char.offsetHeight + gap;
      utils.set(chars, { y: step });
      return animate(chars, {
        y: (char: HTMLElement) => -step(char),
        duration: 1000,
        delay: stagger(30),
        ease: "inOut(3)",
        playbackRate: rate,
      });
    },
  },
  {
    id: "ink",
    name: "Mực teal",
    note: "Chữ hiện lên màu teal, phồng nhẹ rồi ngấm dần về màu thật của tiêu đề.",
    split: { chars: true },
    build: ({ chars }, el, rate) => {
      const final = window.getComputedStyle(el).color;
      const tokens = window.getComputedStyle(document.documentElement);
      const wave = tokens.getPropertyValue("--color-wave").trim() || "#39d6cf";
      const paper = tokens.getPropertyValue("--color-paper").trim() || "#ffffff";
      // a title that is already teal — a shop's name — inks in from paper
      const start = sameColour(final, wave) ? paper : wave;
      utils.set(chars, { opacity: 0, color: start, y: "0.2em" });
      return animate(chars, {
        opacity: { to: 1, duration: 160, ease: "linear" },
        y: { to: "0em", duration: 520, ease: "out(3)" },
        scale: [
          { to: 1.16, duration: 180, ease: "out(2)" },
          { to: 1, duration: 380, ease: "inOut(2)" },
        ],
        color: { to: final, duration: 700, ease: "inOut(2)" },
        delay: stagger(30),
        playbackRate: rate,
      });
    },
  },
];

/* ── finding and playing the titles ────────────────────────────────────── */

const TITLES = "h1.display, h2.display";

/** Text and line breaks only — nothing inside that React would reach for. */
function isPlainTitle(el: Element) {
  return Array.from(el.childNodes).every(
    (node) => node.nodeType === Node.TEXT_NODE || (node as Element).tagName === "BR"
  );
}

function useTitleMotion(
  rootRef: { current: HTMLElement | null },
  effect: Effect | null,
  rate: number,
  replay: number,
  onCount: (count: number) => void
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const active = effect && !reduced ? effect : null;
    const live = new Map<HTMLElement, { playing: Playing | null }>();
    const done = new WeakSet<HTMLElement>();
    let alive = true;

    const play = (el: HTMLElement) => {
      const state = live.get(el);
      if (!alive || !active || !state || state.playing || !el.isConnected) return;
      const run = playEffect(el, active, rate);
      state.playing = run;
      void run.finished.then(() => {
        if (live.get(el) !== state || state.playing !== run) return;
        run.revert();
        live.delete(el);
        done.add(el);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          observer.unobserve(el);
          void document.fonts.ready.then(() => play(el));
        }
      },
      { threshold: 0.35 }
    );

    const register = (el: HTMLElement) => {
      if (!active || live.has(el) || done.has(el) || !isPlainTitle(el)) return;
      live.set(el, { playing: null });
      el.setAttribute("data-tm-wait", "");
      observer.observe(el);
    };

    const scan = (node: Node) => {
      if (!(node instanceof Element)) return;
      if (node.matches(TITLES)) register(node as HTMLElement);
      node.querySelectorAll<HTMLElement>(TITLES).forEach(register);
    };

    const count = () => onCount(root.querySelectorAll(TITLES).length);

    scan(root);
    count();

    const mutations = new MutationObserver((records) => {
      let removed = false;
      for (const record of records) {
        record.addedNodes.forEach(scan);
        if (record.removedNodes.length) removed = true;
      }
      if (removed) {
        for (const [el, state] of live) {
          if (el.isConnected) continue;
          observer.unobserve(el);
          state.playing?.revert();
          live.delete(el);
        }
      }
      count();
    });
    mutations.observe(root, { childList: true, subtree: true });

    return () => {
      alive = false;
      mutations.disconnect();
      observer.disconnect();
      for (const [el, state] of live) {
        state.playing?.revert();
        el.removeAttribute("data-tm-wait");
      }
      live.clear();
    };
  }, [rootRef, effect, rate, replay, onCount]);
}

/* ── the page ───────────────────────────────────────────────────────────── */

const PAGES = [
  ["home", "Trang chủ", ""],
  ["products", "Sản phẩm", "products"],
  ["product", "Một sản phẩm", "products/prod-tui-deo-vai-da-lon-nau-khoa-cai"],
  ["stores", "Danh bạ shop", "stores"],
  ["shop", "Một shop", "stores/shop-ga-con-studios"],
  ["discover", "Khám phá", "discover"],
] as const;
type PageId = (typeof PAGES)[number][0];

const PAGE_CHOICES = PAGES.map(([id, label]) => [id, label] as const);

function pageOf(pathname: string): PageId {
  const rest = pathname.replace(/^\/lab\/titles\/?/, "");
  if (rest === "") return "home";
  if (rest === "products") return "products";
  if (rest.startsWith("products/")) return "product";
  if (rest === "stores") return "stores";
  if (rest.startsWith("stores/")) return "shop";
  return "discover";
}

const RATES = [
  ["0.5", "Chậm ½×"],
  ["1", "Vừa 1×"],
  ["1.5", "Nhanh 1.5×"],
] as const;
type Rate = (typeof RATES)[number][0];

const FX_CHOICES: ReadonlyArray<readonly [string, string]> = [
  ["off", "00 · Tắt (như site)"],
  ...EFFECTS.map((effect, i) => [effect.id, `${String(i + 1).padStart(2, "0")} · ${effect.name}`] as const),
];

/** The last choice, for when a page rewrites the query string — the
    catalogue's filters replace it wholesale. */
let remembered: { fx: string; rate: Rate } = { fx: "rise", rate: "1" };

export default function TitleMotionStudies() {
  const [params, setParams] = useSearchParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const page = pageOf(pathname);
  const reduced = useReducedMotion();

  const fxParam = params.get("fx");
  const fx =
    fxParam === "off" || EFFECTS.some((effect) => effect.id === fxParam) ? (fxParam as string) : remembered.fx;
  const rateParam = params.get("rate");
  const rate = (RATES.some(([value]) => value === rateParam) ? rateParam : remembered.rate) as Rate;
  const effect = EFFECTS.find((candidate) => candidate.id === fx) ?? null;

  useEffect(() => {
    remembered = { fx, rate };
  }, [fx, rate]);

  const rootRef = useRef<HTMLDivElement>(null);
  const [replay, setReplay] = useState(0);
  const [count, setCount] = useState(0);
  useTitleMotion(rootRef, effect, Number(rate), replay, setCount);

  const setQuery = (next: { fx?: string; rate?: Rate }) =>
    setParams(
      (current) => {
        const merged = new URLSearchParams(current);
        merged.set("fx", next.fx ?? fx);
        merged.set("rate", next.rate ?? rate);
        return merged;
      },
      { replace: true }
    );

  const goTo = (id: PageId) => {
    const path = PAGES.find(([candidate]) => candidate === id)?.[2] ?? "";
    navigate({ pathname: `/lab/titles${path ? `/${path}` : ""}`, search: `?fx=${fx}&rate=${rate}` });
  };

  return (
    <>
      <style>{"[data-tm-wait]{opacity:0!important}"}</style>
      {/* /lab carries no site chrome, so the study brings the real header. */}
      <Header />
      {/* One wrapper whatever the page, so the observers keep their root.
          Off the homepage it gives back what SiteShell gives those pages and
          /lab paths do not get: the clearance under the pill, and the reveal
          footer. */}
      <div ref={rootRef} className={page === "home" ? "" : "pt-24 md:pt-28"}>
        {page === "home" ? (
          <Outlet />
        ) : (
          <RevealFooterLayout>
            <Outlet />
          </RevealFooterLayout>
        )}
      </div>

      <LabPanel
        label="Lab · tiêu đề"
        actions={
          <button
            type="button"
            onClick={() => setReplay((n) => n + 1)}
            disabled={!effect}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-paper/85 transition-colors hover:bg-white/10 disabled:opacity-40"
          >
            <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
            Chạy lại
          </button>
        }
      >
        <LabChoices
          label="Hiệu ứng"
          value={fx}
          choices={FX_CHOICES}
          columns
          onChange={(value) => setQuery({ fx: value })}
        />
        <p className="text-[11px] leading-relaxed text-white/65">
          {effect ? effect.note : "Tiêu đề hiện ra như site đang chạy — không có hiệu ứng."}
        </p>
        <LabChoices label="Trang" value={page} choices={PAGE_CHOICES} onChange={goTo} />
        <LabChoices
          label="Nhịp"
          value={rate}
          choices={RATES}
          disabled={!effect}
          onChange={(value) => setQuery({ rate: value })}
        />
        <p className="text-[11px] leading-relaxed text-white/45">
          {count} tiêu đề h1/h2 trên trang này. Mỗi tiêu đề chạy một lần khi cuộn tới; “Chạy lại”
          cho chạy lại những tiêu đề đang trong khung hình.
          {reduced ? " Máy đang bật giảm chuyển động nên hiệu ứng không chạy." : ""}
        </p>
      </LabPanel>
    </>
  );
}
