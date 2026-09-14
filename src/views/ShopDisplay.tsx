import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { fetchProductsStore, fetchStoreById } from "../lib/dbService";
import type { Product, StoreProfile } from "../types";
import { NO_TRANSACTION, PRICE_NOTE } from "../lib/continuity";
import { ArcTopRight, RibbonLoop } from "../components/BrandShapes";
import { useMediaQuery } from "../lib/useAutoHideChrome";
import { Dropdown, PRICE_BANDS, ProductCard, SORTS } from "./Products";
import "./shop.css";

/**
 * Trang shop — /stores/:storeId
 *
 * Redrawn to the team's 13/09 drawing. It replaces the split ("Chia đôi",
 * 09/09): the drawing puts the shop's photograph whole across the top, the
 * shop's face on its lower edge and the ways to reach the shop straight under
 * it, so a visitor meets who the shop is and where to find it before anything
 * else — and then the products, with as little text as the page can manage.
 *
 * Read end to end, the note asks for:
 *
 *   · less: no district, no email, no "hình thức", no "Theo dõi shop";
 *   · the way back to the directory as an arrow alone;
 *   · the arc on the left and the blinking loop on the right, fixed to the
 *     screen while the page scrolls under them, the arc turned -150°;
 *   · nav, cover, avatar, name, up to four platform buttons (a platform the
 *     shop does not use is simply absent, the rest start from the left), the
 *     shop's own words;
 *   · on a phone, the platform links in a bar floating at the bottom.
 *
 * The unit. "Lấy chiều cao của chữ 'o' trong chữ 'Shop' trên nav bar là 10":
 * the nav sets its links at 14px Alexandria 600, whose o measures 547.46/1000
 * em overshoot to overshoot, 7.66px. The gap from the nav pill to the cover
 * and the avatar's ring are each one of those (--u). The drawing itself
 * measures both at about 1.8u; asked on 13/09, the team chose the written
 * rule, so the drawing governs everything the rule does not state.
 *
 * Measured off the drawing, a 1118×538 frame of a ~1536×739 viewport (its nav
 * pill, a real 1152px max-w-6xl, is 839 of it):
 *
 *     column    702 of 1118                      → 60rem
 *     cover     702 × 256, top corners ~10       → 2.742 : 1, 14px top, square foot
 *     avatar    photo Ø114.6, centre 90 in       → 16.3% of the column, centred at 12.8%
 *     name      cap 23, left edge on the ring,   → 45px, from the ring, centred in the
 *               centred under the cover            ring's lower half
 *     buttons   4 × 160, gap 17, 53 tall, flush  → 2.4% gap, 7.6% tall, 20px bold,
 *               under the ring                     starting at the ring's foot
 *               Threads #191919 · Instagram #FF6AC0→#FFA38D→#FFDC5B
 *               Facebook #004AAD · TikTok #343333
 *     text      3 lines at 21.5, "…xem thêm"     → 20px / 1.5, the control inline
 *     ground    violet to the cover's foot, then → a ramp of 17.25rem at 1536
 *               a ~200 ramp to paper
 *
 * On a phone, which the drawing does not show: the cover goes 16:9 (2.742:1
 * at 358px is a 130px sliver), the avatar and the name keep their places with
 * floors under their sizes, and the buttons move into the floating bar.
 */

/* The two marks, fitted the way the hero's were: each mark's real path drawn
   over the drawing at the brief's rotation, placement kept where its
   silhouette best overlaps the drawing's teal (IoU 0.978 arc, 0.987 loop).

   They are fixed to the screen, so the screen is what they are placed
   against: on a desktop, the centre of each mark's box and its width in
   percent of the viewport, exactly as measured, with a floor so a narrow
   window cannot shrink them to a smudge.

   A phone has no margin beside the column to hold them, and the drawing does
   not show one. The first answer pushed them out to the screen's edges and
   left them fixed there, so the page scrolled a crescent of arc past the
   shop's words and a length of ribbon across the grid and the price note —
   the "2 cái element đang bị lỗi hiển thị" of 14/09. On a phone the loop now
   belongs to the header instead: it scrolls with the page, comes out from
   behind the cover's lower right corner beside the shop's name with its eye
   on the violet, and is gone by the time the products arrive. The arc has no
   room of its own there — tried behind the cover, round the avatar and beside
   the product count, it crossed the photograph, the face or the words every
   time — so it is the desktop's alone. */
const SHOP_MARKS = {
  wide: {
    arc: { left: "-1.34%", top: "41.9%", width: "max(31.2%, 15rem)" },
    loop: { left: "100.54%", top: "15.15%", width: "max(33.3%, 16rem)" },
  },
  phone: {
    // just inside the right edge, half a rem above the cover's foot
    loop: {
      left: "calc(100% - 0.375rem)",
      top: "calc(var(--pill) + var(--u) + var(--cover-h) - 0.5rem)",
      width: "9.5rem",
    },
  },
} as const;

/** The loop's eye, below the loop's centre, in loop widths — at -90°. */
const EYE_BELOW_CENTRE = 0.275;

/* In the order the drawing gives them. Brand colours, because a button that
   says INSTAGRAM in Instagram's colours is found before it is read. */
const PLATFORMS = [
  { key: "threads", label: "Threads", fill: "bg-[#191919]" },
  { key: "instagram", label: "Instagram", fill: "bg-[linear-gradient(90deg,#ff6ac0,#ffa38d,#ffdc5b)]" },
  { key: "facebook", label: "Facebook", fill: "bg-[#004aad]" },
  { key: "tiktok", label: "TikTok", fill: "bg-[#343333]" },
] as const;

interface Channel {
  key: string;
  label: string;
  fill: string;
  href: string;
}

function channelsOf(store: StoreProfile): Channel[] {
  return PLATFORMS.flatMap((platform) => {
    const url = store.socials?.[platform.key];
    if (!url) return [];
    const base = url.startsWith("http") ? url : `https://${url}`;
    const href = `${base}${base.includes("?") ? "&" : "?"}utm_source=ticoolture&utm_medium=shop`;
    return [{ ...platform, href }];
  });
}

function useShopPage(storeId: string | undefined) {
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!storeId) return;
    setResolved(false);
    fetchStoreById(storeId).then(async (s) => {
      if (!alive) return;
      setStore(s);
      setResolved(true);
      if (!s) return;
      const rows = await fetchProductsStore(s.id);
      if (alive) setProducts(rows);
    });
    return () => {
      alive = false;
    };
  }, [storeId]);

  return { store, products, resolved };
}

/**
 * The arc and the loop, fixed to the screen — on a desktop. A phone gets the
 * loop alone, pinned to the header (see SHOP_MARKS).
 *
 * Painted between the page's ground and its content: the root is clipped
 * (clip-path: inset(0)), which contains a fixed descendant's painting the way
 * overflow cannot, so the marks end with the page instead of riding over the
 * footer.
 *
 * The loop's pupil is white while the eye looks onto the violet and turns
 * violet once it looks onto paper, as the drawing shows it in both places —
 * a white dot on white would be an eye with nothing in it. The switch is at
 * the middle of the ramp, where neither colour is the ground.
 */
function ShopMarks({ coverRef }: { coverRef: { current: HTMLElement | null } }) {
  const wide = useMediaQuery("(min-width: 768px)");
  const loopRef = useRef<HTMLDivElement>(null);
  const [onPaper, setOnPaper] = useState(false);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const cover = coverRef.current;
      const loop = loopRef.current;
      if (!cover || !loop) return;
      /* Read off the rendered loop rather than re-derived from the
         placement: the box turns about its centre, so the centre of its
         bounding rect is the centre of the mark, and offsetWidth is its
         unturned width. */
      const box = loop.getBoundingClientRect();
      const eyeY = box.top + box.height / 2 + EYE_BELOW_CENTRE * loop.offsetWidth;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      // the same clamp as --ramp on the page root
      const ramp = Math.min(17.25 * rem, Math.max(11 * rem, 0.18 * window.innerWidth));
      setOnPaper(cover.getBoundingClientRect().bottom + ramp / 2 < eyeY);
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
  }, [coverRef, wide]);

  const place = (at: { left: string; top: string; width: string }, rotate: number) => ({
    left: at.left,
    top: at.top,
    width: at.width,
    transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
  });

  const loop = (
    <RibbonLoop
      className="ti-shop-loop w-full"
      ribbon="var(--color-wave)"
      dot={onPaper ? "var(--color-brand)" : "var(--color-paper)"}
      blink
    />
  );

  if (!wide) {
    /* Pinned to the page, not the screen, in a box that clips what runs past
       the right edge. The root's clip-path hides that part from view but
       still counts it as overflow, and a phone would scroll sideways to it. */
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
        <div ref={loopRef} className="absolute" style={place(SHOP_MARKS.phone.loop, -90)}>
          {loop}
        </div>
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="pointer-events-none">
      <div className="fixed z-[1]" style={place(SHOP_MARKS.wide.arc, -150)}>
        <ArcTopRight className="w-full" fill="var(--color-wave)" />
      </div>
      <div ref={loopRef} className="fixed z-[1]" style={place(SHOP_MARKS.wide.loop, -90)}>
        {loop}
      </div>
    </div>
  );
}

/**
 * The shop's own words, three lines, with the way to the rest at the end of
 * the third — inline, as drawn, rather than a control under the paragraph.
 *
 * The control is floated into the last clamped line (see .ti-shop-intro in
 * shop.css) and only exists when the words actually overflow, measured, so a
 * one-line tagline never offers to expand.
 */
function ShopIntro({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    const check = () => setOverflows(el.scrollHeight - el.clientHeight > 2);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, open]);

  return (
    <div className={`flex ${className}`}>
      <p ref={ref} className={`ti-shop-intro min-w-0 ${open ? "" : "is-clamped"}`}>
        {!open && overflows && (
          <button type="button" onClick={() => setOpen(true)} className="ti-shop-intro-more">
            … xem thêm
          </button>
        )}
        {text}
        {open && (
          <>
            {" "}
            <button type="button" onClick={() => setOpen(false)} className="ti-shop-intro-less">
              Thu gọn
            </button>
          </>
        )}
      </p>
    </div>
  );
}

/* The column every block of the page shares: 60rem, with a gutter that
   narrows on a phone. It is also the container the page's cqw units read. */
const COLUMN = "@container mx-auto w-[min(60rem,calc(100%_-_2rem))] md:w-[min(60rem,calc(100%_-_4rem))]";

export default function ShopDisplay() {
  const { storeId } = useParams<{ storeId: string }>();
  const { store, products, resolved } = useShopPage(storeId);
  const wide = useMediaQuery("(min-width: 768px)");
  const coverRef = useRef<HTMLDivElement>(null);

  const [band, setBand] = useState("all");
  const [material, setMaterial] = useState("all");
  const [sort, setSort] = useState("newest");

  /* Filters built from this shop's own products. The catalogue's lists are
     about the whole site; a shop with four candles does not need a "Gốm"
     option that empties the page. */
  const materials = useMemo(
    () =>
      Array.from(
        new Set<string>(products.map((p) => p.material).filter((m): m is string => !!m))
      ).sort((a, b) => a.localeCompare(b, "vi")),
    [products]
  );
  const bands = useMemo(
    () =>
      PRICE_BANDS.filter(
        (b) =>
          b.id === "all" ||
          products.some((p) => p.price >= (b.min ?? 0) && p.price <= (b.max ?? Infinity))
      ),
    [products]
  );
  const shown = useMemo(() => {
    const chosen = PRICE_BANDS.find((b) => b.id === band);
    return products
      .filter(
        (p) =>
          band === "all" ||
          !chosen ||
          (p.price >= (chosen.min ?? 0) && p.price <= (chosen.max ?? Infinity))
      )
      .filter((p) => material === "all" || p.material === material)
      .sort((a, b) =>
        sort === "price-asc" ? a.price - b.price : sort === "price-desc" ? b.price - a.price : 0
      );
  }, [products, band, material, sort]);

  if (!store) {
    return resolved ? (
      <div
        data-surface="dark"
        className="-mt-24 grid min-h-[70dvh] place-items-center bg-brand px-6 pt-24 text-center text-paper md:-mt-28 md:pt-28"
      >
        <div className="space-y-4">
          <h1 className="display text-2xl normal-case">Không tìm thấy shop</h1>
          <Link
            to="/stores"
            className="inline-block rounded-full bg-paper px-5 py-2.5 text-xs font-semibold text-ink"
          >
            Về danh bạ shop
          </Link>
        </div>
      </div>
    ) : (
      <div data-surface="dark" className="-mt-24 min-h-[70dvh] bg-brand md:-mt-28" />
    );
  }

  const channels = channelsOf(store);
  const intro = store.story || store.vibe || store.description || "";
  const clearFilters = () => {
    setBand("all");
    setMaterial("all");
    setSort("newest");
  };

  return (
    <>
      {/* The page root carries the ground, so the marks can sit between it
          and the content. The shell clears the floating pill with pt-24; the
          negative margin gives that back so the violet runs to y=0, as on
          /products, /stores and /discover.

          The ground is violet down to the cover's foot and then ramps to
          paper. The foot is computed rather than measured — the pill's own
          bottom, one unit, and the cover's height at its ratio — so the ramp
          starts on the first paint; --col is the column's width as the page
          lays it out. */}
      <div
        className="ti-shop relative -mt-24 pb-28 text-ink md:-mt-28 md:pb-24 [--pill:81px] md:[--pill:93px] [--col:calc(100vw_-_2rem)] md:[--col:min(60rem,calc(100vw_-_4rem))] [--cover-h:calc(var(--col)*9/16)] md:[--cover-h:calc(var(--col)*256/702)]"
        style={{
          ["--u" as string]: "calc(0.875rem * 0.5475)",
          ["--ramp" as string]: "clamp(11rem, 18vw, 17.25rem)",
          clipPath: "inset(0)",
          background:
            "linear-gradient(to bottom, var(--color-brand) 0, var(--color-brand) calc(var(--pill) + var(--u) + var(--cover-h)), var(--color-paper) calc(var(--pill) + var(--u) + var(--cover-h) + var(--ramp)))",
        }}
      >
        <ShopMarks coverRef={coverRef} />

        <div className="relative z-[2]">
          <header data-surface="dark" className="pt-[calc(var(--pill)_+_var(--u))]">
            <div
              className={COLUMN}
              style={{
                ["--avatar" as string]: "clamp(5.5rem, 16.3cqw, 10rem)",
                ["--avatar-outer" as string]: "calc(var(--avatar) + 2 * var(--u))",
                ["--avatar-x" as string]: "max(12.8cqw, calc(var(--avatar-outer) / 2 + 0.75rem))",
              }}
            >
              <div className="relative">
                {/* The photograph, whole, one unit under the pill. */}
                <div
                  ref={coverRef}
                  className="aspect-[16/9] overflow-hidden rounded-[0.875rem] bg-brand-deep md:aspect-[702/256]"
                  style={{
                    maskImage:
                      "radial-gradient(circle at var(--avatar-x) 100%, transparent calc(var(--avatar-outer) / 2), black calc(var(--avatar-outer) / 2 + 0.5px))",
                    WebkitMaskImage:
                      "radial-gradient(circle at var(--avatar-x) 100%, transparent calc(var(--avatar-outer) / 2), black calc(var(--avatar-outer) / 2 + 0.5px))",
                  }}
                >
                  {store.coverUrl && (
                    <img
                      src={store.coverUrl}
                      alt={`Ảnh bìa của ${store.name}`}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                {/* Centre on the cover's foot; the ring is one unit of the
                    page's own violet, so it reads as the ground reaching round
                    the face rather than as a border drawn on it.

                    Padding rather than a border: a border's width is snapped
                    to whole pixels, so 7.66px drew as 7, while padding is
                    laid out at the width it is given. */}
                <div
                  className="absolute bottom-0 z-10 rounded-full bg-transparent"
                  style={{
                    left: "var(--avatar-x)",
                    width: "var(--avatar-outer)",
                    height: "var(--avatar-outer)",
                    padding: "var(--u)",
                    transform: "translate(-50%, 50%)",
                  }}
                >
                  <div className="h-full w-full overflow-hidden rounded-full bg-brand-deep">
                    {store.logoUrl && (
                      <img src={store.logoUrl} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                </div>
              </div>

              {/* The name starts where the ring ends and sits in the ring's
                  lower half, as drawn; the row is exactly that half tall, so
                  whatever follows starts at the ring's foot. On a phone it
                  also stops short of the loop at the right edge (14/09). */}
              <div
                className="flex items-center pr-16 md:pr-0"
                style={{
                  minHeight: "calc(var(--avatar-outer) / 2)",
                  paddingLeft: "calc(var(--avatar-x) + var(--avatar-outer) / 2)",
                }}
              >
                <h1 className="display py-1 text-[length:clamp(1.5rem,4.7cqw,2.85rem)] normal-case leading-[1.2] text-wave">
                  {store.name}
                </h1>
              </div>
            </div>
          </header>

          <div data-surface="light" className={COLUMN}>
            {/* "4 nút nằm ngay dưới viền dưới của ảnh đại diện" — flush under
                the ring. The grid keeps four columns whatever is present, so
                a shop on one platform gets one button in the first column
                rather than one button stretched across the page. On a phone
                these live in the floating bar instead. */}
            {channels.length > 0 && (
              <ul className="hidden grid-cols-4 gap-[2.4cqw] md:grid">
                {channels.map((channel) => (
                  <li key={channel.key}>
                    <a
                      href={channel.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`grid h-[7.6cqw] min-h-12 place-items-center rounded-[0.7rem] text-[length:clamp(0.875rem,2.1cqw,1.25rem)] font-bold uppercase tracking-[0.04em] text-paper [text-shadow:0_1px_3px_rgba(18,8,31,0.45)] transition-[filter] duration-200 hover:brightness-110 ${channel.fill}`}
                    >
                      {channel.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {intro && (
              <ShopIntro
                text={intro}
                className="mt-4 text-base font-medium text-ink md:mt-[1.125rem] md:text-[length:clamp(1.0625rem,2.1cqw,1.25rem)]"
              />
            )}

            {/* ── everything the shop has ─────────────────────────────── */}
            <section aria-label={`Sản phẩm của ${store.name}`} className="mt-12 md:mt-14">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-medium text-brand md:text-xl">
                  {shown.length} sản phẩm
                </h2>
                {products.length > 0 && (
                  /* Right-aligned at every width, so each dropdown's list —
                     which opens from its right edge — has the room to its
                     left that it needs. Wrapping rather than scrolling, so
                     no clipping container can cut the list off. */
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Dropdown
                      label="Giá"
                      value={band}
                      options={bands.map((b) => ({ id: b.id, label: b.label }))}
                      onChange={setBand}
                    />
                    <Dropdown
                      label="Chất liệu"
                      value={material}
                      options={[
                        { id: "all", label: "Tất cả" },
                        ...materials.map((m) => ({ id: m, label: m })),
                      ]}
                      onChange={setMaterial}
                    />
                    <Dropdown label="Sắp xếp" value={sort} options={SORTS} onChange={setSort} />
                  </div>
                )}
              </div>

              {products.length === 0 ? (
                <p className="py-12 text-center text-sm text-ink/55">
                  Shop chưa đăng sản phẩm nào lên Tí.
                </p>
              ) : shown.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-ink/55">Không có món nào khớp bộ lọc này.</p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-3 text-xs font-semibold text-brand underline underline-offset-4"
                  >
                    Xoá bộ lọc
                  </button>
                </div>
              ) : (
                /* The catalogue's own card, so a product looks the same here
                   as on /products — which is what the drawing shows. */
                <div className="mt-5 grid grid-cols-2 gap-x-1 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
                  {shown.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      ratio={1}
                      dense={!wide}
                      onSaved={() => {}}
                    />
                  ))}
                </div>
              )}

              {products.length > 0 && (
                <p className="mt-10 text-center text-xs leading-relaxed text-ink/50">
                  {PRICE_NOTE} · {NO_TRANSACTION}
                </p>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* "Trên mobile: thanh floating ở dưới chứa link đến social media của
          shop." Outside the clipped root, or the page's own clip would cut it
          off as the footer comes up.

          14/09: the buttons sat in a tray of the nav's dark glass, and on the
          page's white that tray read as a thick grey outline round them — the
          other thing on the phone page that looked broken. They float on
          their own now, each with a soft shadow and a hairline of light to
          lift it off paper and violet alike. One platform is one button of
          its own width, centred, rather than a bar across the screen; more
          share the width. */}
      {channels.length > 0 && (
        <nav
          aria-label={`Kênh của ${store.name}`}
          className="pointer-events-none fixed inset-x-4 bottom-[max(0.875rem,env(safe-area-inset-bottom))] z-40 flex justify-center md:hidden"
        >
          <ul className={`pointer-events-auto flex gap-2 ${channels.length > 1 ? "w-full" : ""}`}>
            {channels.map((channel) => (
              /* flex-auto, not equal shares: INSTAGRAM is nine letters and
                 THREADS seven, and four equal quarters of a phone cut the
                 longest label against its own edges. */
              <li key={channel.key} className={channels.length > 1 ? "min-w-0 flex-auto" : ""}>
                <a
                  href={channel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`grid h-12 place-items-center rounded-full font-bold uppercase text-paper shadow-[0_10px_24px_-10px_rgba(18,8,31,0.65),inset_0_0_0_1px_rgba(255,255,255,0.22)] [text-shadow:0_1px_3px_rgba(18,8,31,0.45)] ${
                    channels.length > 1
                      ? "px-3 text-[11px] tracking-[0.04em]"
                      : "min-w-[13rem] px-10 text-[13px] tracking-[0.08em]"
                  } ${channel.fill}`}
                >
                  {channel.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
