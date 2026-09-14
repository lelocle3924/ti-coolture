/* The project ships no @types/react, so the namespace has to be pulled in
   explicitly before React.ReactNode resolves — same reason labShared does. */
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, SlidersHorizontal, X } from "lucide-react";
import Header from "../components/Header";
import { ChannelButtonsOverride, type ChannelButtonsProps } from "../views/ShopDisplay";
import { useMediaQuery } from "../lib/useAutoHideChrome";
import "./lab.css";

/* ═══════════════════════════════════════════════════════════════════════════
   THE SHOP PAGE'S PLATFORM BUTTONS — one brand colour, logos for words (15/09)

     "Thiết kế lại các nút để nhìn đỡ quê (đưa vào lab)"
     "thiết kế lại nút cho 4 nền tảng đều dùng chung màu, lấy từ màu của brand
      mình ra, không follow màu của nền tảng nữa"
     "tôi cũng thích ý kiến dùng icon logo của nền tảng MXH thay vì chữ"

   What made the row look cheap was four brand liveries fighting under one
   shop's face — Threads black, an Instagram sunset, Facebook blue, TikTok
   grey — with the names shouted in capitals and a text shadow to keep them
   legible on all four. The shop is what the page is about; the buttons are
   the way out to it, and they should read as one piece of Tí Coolture.

   So every option here gives the four the same skin and lets the platform's
   own mark say which is which. The marks are Simple Icons' paths (CC0), drawn
   filled in currentColor and scaled so the solid Facebook disc does not
   outweigh Instagram's outline.

   This page IS the shop page — the real ShopDisplay, the real header, the
   demo shops with four, three, two and one platforms — with the buttons
   swapped through ChannelButtonsOverride, which is null on the site. The
   switches, kept in the URL so a combination can be sent as a link:

     · Màu — the skin, from the brand's own four colours:
         Violet  the site's call-to-action colour (the header's "Mở shop"),
                 white marks. The default: these are the page's action, and
                 the way the brand already says "go".
         Trắng   paper chips with violet marks, a violet hairline and a soft
                 violet shadow; they fill violet under the pointer.
         Mực     ink with teal marks — the darkest, most editorial option.
                 Names, when shown, are white: teal never carries text.
         Teal    the brand's 10% accent as the fill, ink marks.
       and "Màu nền tảng (cũ)", which is the site as it stands.
     · Nội dung — the mark alone (the default, per the note), or the mark
       with the platform's name in sentence case. On a phone, names only fit
       beside the marks for one or two platforms; with three or four they
       drop and the marks carry it alone.
     · Dáng — the drawing's four equal tiles under the avatar ring, or round
       buttons sized to what they hold.
     · Shop — a shop with 4, 3, 2 or 1 platforms.
   ═══════════════════════════════════════════════════════════════════════════ */

type Tone = "violet" | "paper" | "ink" | "teal" | "current";
type Content = "icon" | "both";
type Shape = "drawn" | "round";

interface StudyOptions {
  tone: Tone;
  content: Content;
  shape: Shape;
}

const DEFAULTS: StudyOptions = { tone: "violet", content: "icon", shape: "drawn" };

function readOptions(params: URLSearchParams): StudyOptions {
  const pick = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
    const value = params.get(key);
    return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
  };
  return {
    tone: pick<Tone>("tone", ["violet", "paper", "ink", "teal", "current"], DEFAULTS.tone),
    content: pick<Content>("content", ["icon", "both"], DEFAULTS.content),
    shape: pick<Shape>("shape", ["drawn", "round"], DEFAULTS.shape),
  };
}

const Options = createContext<StudyOptions>(DEFAULTS);

/** The four demo shops, by how many platforms each carries. */
const SHOPS: Array<[string, string]> = [
  ["shop-tap-hoa-tieng-viet", "4 kênh"],
  ["shop-nom-vn", "3 kênh"],
  ["shop-ga-con-studios", "2 kênh"],
  ["shop-lo-stuff", "1 kênh"],
];

/* ── the marks ──────────────────────────────────────────────────────────── */

/* Simple Icons 13.21 (CC0-1.0). `scale` evens out their optical weight: the
   Facebook mark is a solid disc and reads larger than Instagram's outlined
   square at the same box, so it comes down the most. */
const GLYPHS: Record<string, { d: string; scale: number }> = {
  threads: {
    scale: 0.92,
    d: "M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z",
  },
  instagram: {
    scale: 0.92,
    d: "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077",
  },
  facebook: {
    scale: 0.88,
    d: "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
  },
  tiktok: {
    scale: 0.96,
    d: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
  },
};

function Glyph({ platform, className }: { platform: string; className?: string }) {
  const glyph = GLYPHS[platform];
  if (!glyph) return null;
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor" className={className}>
      <path d={glyph.d} transform={`translate(12 12) scale(${glyph.scale}) translate(-12 -12)`} />
    </svg>
  );
}

/* ── the skins ──────────────────────────────────────────────────────────── */

/* One fill, one mark colour, one hover per tone. Two shadows each: the row
   sits on the page, where a low shadow and a top light are enough; the
   phone's bar floats over whatever scrolls under it and needs a real lift. */
const TONES: Record<Exclude<Tone, "current">, { skin: string; row: string; bar: string; name: string }> = {
  violet: {
    skin: "bg-brand text-paper hover:bg-brand-deep",
    row: "shadow-[0_10px_20px_-14px_rgba(58,10,128,0.9),inset_0_1px_0_rgba(255,255,255,0.22)]",
    bar: "shadow-[0_14px_28px_-12px_rgba(40,8,90,0.7),inset_0_1px_0_rgba(255,255,255,0.22)]",
    name: "",
  },
  paper: {
    skin: "bg-paper text-brand hover:bg-brand hover:text-paper",
    row: "shadow-[0_12px_24px_-16px_rgba(58,10,128,0.75),inset_0_0_0_1px_rgba(117,32,247,0.16)]",
    bar: "shadow-[0_14px_30px_-12px_rgba(40,8,90,0.45),inset_0_0_0_1px_rgba(117,32,247,0.16)]",
    name: "text-ink group-hover/ch:text-paper",
  },
  ink: {
    skin: "bg-ink text-wave hover:bg-[#241338]",
    row: "shadow-[0_12px_24px_-14px_rgba(18,8,31,0.9),inset_0_1px_0_rgba(255,255,255,0.08)]",
    bar: "shadow-[0_14px_30px_-12px_rgba(18,8,31,0.7),inset_0_1px_0_rgba(255,255,255,0.1)]",
    name: "text-paper",
  },
  teal: {
    skin: "bg-wave text-ink hover:bg-[#62e0da]",
    row: "shadow-[0_10px_20px_-14px_rgba(11,124,119,0.95),inset_0_1px_0_rgba(255,255,255,0.4)]",
    bar: "shadow-[0_14px_28px_-12px_rgba(11,90,86,0.6),inset_0_1px_0_rgba(255,255,255,0.4)]",
    name: "",
  },
};

/* Lift on hover, settle on press; nothing moves for reduced motion. */
const MOTION =
  "group/ch transition-[background-color,color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] active:duration-100 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-wave motion-reduce:transition-colors motion-reduce:hover:translate-y-0";

/** The buttons as the study draws them. Mounted by ChannelButtonsOverride. */
function StudyButtons({ channels, placement, shopName }: ChannelButtonsProps) {
  const options = useContext(Options);
  if (options.tone === "current") return null;
  const tone = TONES[options.tone];
  const drawn = options.shape === "drawn";

  if (placement === "row") {
    const withName = options.content === "both";
    return (
      <ul className={drawn ? "hidden grid-cols-4 gap-[2.4cqw] md:grid" : "hidden flex-wrap gap-3 md:flex"}>
        {channels.map((channel) => (
          <li key={channel.key}>
            <a
              href={channel.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${channel.label} của ${shopName}`}
              className={`${MOTION} flex items-center justify-center font-semibold ${tone.skin} ${tone.row} ${
                drawn
                  ? "h-[7.6cqw] min-h-12 gap-[0.6em] rounded-[0.875rem] text-[length:clamp(0.9375rem,1.75cqw,1.125rem)]"
                  : `h-14 gap-2.5 rounded-full text-base ${withName ? "pl-4 pr-5" : "w-14"}`
              }`}
            >
              <Glyph
                platform={channel.key}
                /* Alone in a drawn tile the mark has the whole tile to hold, and at
                   the name's size it read as a tile with nothing in it. */
                className={
                  !drawn
                    ? "h-6 w-6 shrink-0"
                    : withName
                      ? "h-[clamp(1.375rem,2.6cqw,1.75rem)] w-[clamp(1.375rem,2.6cqw,1.75rem)] shrink-0"
                      : "h-[clamp(1.75rem,3.4cqw,2.25rem)] w-[clamp(1.75rem,3.4cqw,2.25rem)] shrink-0"
                }
              />
              {withName && <span className={tone.name}>{channel.label}</span>}
            </a>
          </li>
        ))}
      </ul>
    );
  }

  /* The phone's floating bar. Names only where they fit: one or two
     platforms. */
  const withName = options.content === "both" && channels.length <= 2;
  const many = channels.length > 1;
  return (
    <ul className={`pointer-events-auto flex ${drawn ? `gap-2 ${many ? "w-full" : ""}` : "gap-3"}`}>
      {channels.map((channel) => (
        <li key={channel.key} className={drawn && many ? "min-w-0 flex-1" : ""}>
          <a
            href={channel.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${channel.label} của ${shopName}`}
            className={`${MOTION} flex h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold ${tone.skin} ${tone.bar} ${
              drawn ? (many ? "px-3" : "min-w-[13rem] px-8") : withName ? "pl-3.5 pr-4" : "w-12"
            }`}
          >
            <Glyph platform={channel.key} className="h-[1.375rem] w-[1.375rem] shrink-0" />
            {withName && <span className={tone.name}>{channel.label}</span>}
          </a>
        </li>
      ))}
    </ul>
  );
}

/* ── the panel ──────────────────────────────────────────────────────────── */

const GROUPS: Array<{ key: keyof StudyOptions; label: string; choices: Array<[string, string]> }> = [
  {
    key: "tone",
    label: "Màu",
    choices: [["violet", "Violet"], ["paper", "Trắng"], ["ink", "Mực"], ["teal", "Teal"], ["current", "Màu nền tảng (cũ)"]],
  },
  { key: "content", label: "Nội dung", choices: [["icon", "Chỉ icon"], ["both", "Icon + tên"]] },
  { key: "shape", label: "Dáng", choices: [["drawn", "Ô theo bản vẽ"], ["round", "Tròn gọn"]] },
];

/* `key` is declared because the project ships no @types/react — see labShared. */
function Chip({ on, onClick, children }: { key?: string; on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
        on ? "bg-wave text-ink" : "bg-white/10 text-paper/85 hover:bg-white/20"
      }`}
    >
      {children}
    </button>
  );
}

function Controls({
  options,
  onChange,
  shop,
  onShop,
}: {
  options: StudyOptions;
  onChange: (patch: Partial<StudyOptions>) => void;
  shop: string;
  onShop: (storeId: string) => void;
}) {
  const wide = useMediaQuery("(min-width: 768px)");
  const [open, setOpen] = useState(true);
  // folded on a phone, where an open panel would sit on the bar it controls
  useEffect(() => setOpen(wide), [wide]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-4 z-[65] inline-flex items-center gap-2 rounded-full bg-ink/85 px-4 py-2.5 text-xs font-semibold text-paper shadow-[0_18px_40px_-18px_rgba(18,8,31,0.85)] ring-1 ring-white/10 backdrop-blur-md md:bottom-4"
      >
        <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-wave" />
        Lab · nút kênh
      </button>
    );
  }

  return (
    <div
      role="region"
      aria-label="Công tắc thử nghiệm cho nút kênh ở trang shop"
      className="fixed bottom-4 left-4 z-[65] w-[min(22rem,calc(100vw-2rem))] rounded-[1.25rem] bg-ink/85 p-4 text-paper shadow-[0_24px_48px_-24px_rgba(18,8,31,0.9)] ring-1 ring-white/10 backdrop-blur-md"
    >
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/lab"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.12em] text-white/55 transition-colors hover:text-wave"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          LAB
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Thu gọn bảng công tắc"
          className="grid h-8 w-8 place-items-center rounded-full text-paper/70 transition-colors hover:bg-white/10"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {GROUPS.map((group) => {
          const muted = group.key !== "tone" && options.tone === "current";
          return (
            <fieldset key={group.key} disabled={muted} className={muted ? "opacity-40" : ""}>
              <legend className="text-[11px] tracking-[0.12em] text-white/55">{group.label}</legend>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {group.choices.map(([value, label]) => (
                  <Chip
                    key={value}
                    on={options[group.key] === value}
                    onClick={() => onChange({ [group.key]: value } as Partial<StudyOptions>)}
                  >
                    {label}
                  </Chip>
                ))}
              </div>
            </fieldset>
          );
        })}
        <fieldset>
          <legend className="text-[11px] tracking-[0.12em] text-white/55">Shop</legend>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {SHOPS.map(([id, label]) => (
              <Chip key={id} on={shop === id} onClick={() => onShop(id)}>
                {label}
              </Chip>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  );
}

/* ── the page ───────────────────────────────────────────────────────────── */

export default function ShopChannelStudies() {
  const [params, setParams] = useSearchParams();
  const options = readOptions(params);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const shop = pathname.split("/").filter(Boolean).pop() ?? "";

  const change = (patch: Partial<StudyOptions>) => {
    const next = { ...options, ...patch };
    setParams({ tone: next.tone, content: next.content, shape: next.shape }, { replace: true });
  };

  return (
    <Options.Provider value={options}>
      <ChannelButtonsOverride.Provider value={options.tone === "current" ? null : StudyButtons}>
        {/* /lab carries no site chrome, so the study brings the real header,
            and the clearance the shell gives every other page. */}
        <Header />
        <div className="pt-24 md:pt-28">
          <Outlet />
        </div>
        <Controls
          options={options}
          onChange={change}
          shop={shop}
          onShop={(id) => navigate(`/lab/shop-buttons/${id}?${params.toString()}`, { replace: true })}
        />
      </ChannelButtonsOverride.Provider>
    </Options.Provider>
  );
}
