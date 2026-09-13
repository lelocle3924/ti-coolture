/**
 * Continuity transition — a product photograph travelling from wherever it was
 * pressed into the hero of its product page — plus the reading helpers that go
 * with it.
 *
 * Team 13/09: "Continuity transition ở trên cả mobile và PC đều đang khá khựng
 * và lỗi… Tôi muốn cái ảnh từ cỡ ở trang trước, phóng to/thu nhỏ, đồng thời di
 * chuyển đến đúng vị trí ở trang tiếp theo. Tất cả các element xung quanh fade
 * out, sau đó các element ở trang sau fade in."
 *
 * What was wrong, found before anything was changed:
 *
 *   · /products never travelled at all. Its cards named their photographs
 *     `product-<id>` and the product page names its hero `ti-hero`; two names
 *     that never meet are two unrelated groups, so the card's picture faded
 *     where it stood while the page crossfaded under it.
 *   · ContinuityLink snapshotted the new page too early. It wrapped
 *     navigate() in flushSync, but under the data router navigate() commits a
 *     tick later, inside a React transition — so the "new" snapshot was still
 *     the old page, and the real page arrived after the animation, as a jump.
 *   · Between the two root fades both pages were half transparent over the
 *     body's violet: a white page flashed violet on its way to a white page.
 *   · The scroll reset was a passive effect and could land after the new
 *     snapshot, so the hero's destination was measured at the old offset.
 *   · The nav was part of the page snapshot and blinked out and back.
 *
 * What happens now, on one press:
 *
 *   1. The pressed photograph is named `ti-hero` and the document is marked
 *      html[data-vt-kind="continuity"], which is what continuity.css keys on.
 *   2. startViewTransition takes the old snapshot, then navigates inside its
 *      update callback, and does not let the new snapshot be taken until the
 *      product page has mounted, named its own hero frame and decoded its
 *      photograph (useContinuityLanding). Capped at LANDING_CAP_MS, so a slow
 *      page can never hold the navigation hostage.
 *   3. continuity.css runs the choreography; the header is its own group.
 */

import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Product } from "../types";
import "./continuity.css";

/* ── formatting ─────────────────────────────────────────────────────────── */

/* Team 13/09: "Ký tự 'đ' trong chỗ hiển thị giá bị lỗi."

   The tail was U+20AB, the currency sign ₫, and Alexandria draws that one as
   a d with a bar AND an underline squeezed into the same x-height. At 500 it
   survives; at the 600 and 700 every price on the site is set in, the bar and
   the underline close up into the bowl and the glyph reads as a d with a
   smudge in it. Rendered both ways from fonts/ to check, weights 500–700.

   U+0111, the letter đ, is what Vietnamese prices are written with anyway
   ("320.000đ"), it is what the team's own drawings show, and Alexandria's đ
   is clean at every weight. DFVN Some Time Later has no ₫ at all, so a price
   in the display face would have fallen back to a system font — it has đ. */
export const formatPrice = (value: number) =>
  value > 0 ? `${value.toLocaleString("vi-VN")}đ` : "Liên hệ";

export const PRICE_NOTE = "Giá tham khảo, giá cuối do shop quyết định";
export const NO_TRANSACTION =
  "Tí Coolture không bán hàng và không xử lý giao dịch.";

/* ── data ───────────────────────────────────────────────────────────────── */

/**
 * The pressed product, kept so its page can paint the hero on its very first
 * render. Without it the page fetches first, and at the moment the browser
 * takes the new snapshot there is nothing for the photograph to travel into.
 */
const handoffCache = new Map<string, Product>();

export function readHandoff(id: string | undefined): Product | null {
  return (id && handoffCache.get(id)) || null;
}

export const HERO_NAME = "ti-hero";

/** The longest the new snapshot may wait for the product page to be ready. */
const LANDING_CAP_MS = 450;

/** The change in flight, if any: where it is heading, and how the product
 *  page tells the transition it may take the new snapshot. */
let landing: { productId: string; ready: () => void } | null = null;

/** Which run owns the cleanup, so a second press cannot be tidied away by the
 *  first one finishing. */
let currentRun = 0;

type StartViewTransition = (update: () => Promise<void>) => {
  ready: Promise<void>;
  finished: Promise<void>;
};

/**
 * Only one element may carry the name, or the browser drops the whole
 * transition — "Unexpected duplicate view-transition-name: ti-hero", and the
 * page changes with no motion at all.
 *
 * Found by the name, not only by the marker nameHero leaves (14/09). The
 * product page's hero once carried the name as a style prop, which set no
 * marker; opened directly, that page had a named hero this sweep could not
 * see, so pressing a sibling card named a second element and the transition
 * was thrown away. Anything the browser would count, this counts.
 */
function clearHeroNames(except?: Element | null) {
  document
    .querySelectorAll<HTMLElement>('[data-ti-hero], [style*="view-transition-name"]')
    .forEach((node) => {
      if (node === except) return;
      if (!node.hasAttribute("data-ti-hero") && node.style.viewTransitionName !== HERO_NAME) return;
      node.style.viewTransitionName = "";
      node.removeAttribute("data-ti-hero");
    });
}

function nameHero(el: HTMLElement) {
  clearHeroNames(el);
  el.style.viewTransitionName = HERO_NAME;
  el.setAttribute("data-ti-hero", "");
}

/* ── where a press came from ────────────────────────────────────────────── */

/**
 * The element the last press landed on.
 *
 * The homepage's tiles call back with a product and nothing else, so rather
 * than thread an element through every tile and every track they sit in, the
 * press itself is remembered here and the photograph found from it.
 */
let lastPress: Element | null = null;
let tracking = false;

function trackPresses() {
  if (tracking) return;
  tracking = true;
  document.addEventListener(
    "pointerdown",
    (e) => {
      lastPress = e.target instanceof Element ? e.target : null;
    },
    { capture: true, passive: true }
  );
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Enter" || e.key === " ") lastPress = document.activeElement;
    },
    { capture: true }
  );
}

/**
 * The product's photograph, found by walking up from where the press landed.
 *
 * Every product tile on the site draws its picture from images[0], so the
 * first visible image with that source on the way up is the one that was
 * pressed — the tile's own copy, not another copy of the same product further
 * along a looping lane, because the walk starts inside the tile.
 */
function findProductFrame(product: Product, from: Element | null): HTMLElement | null {
  const src = product.images?.[0];
  if (!src || !from) return null;
  let image: HTMLImageElement | null = null;
  let node: Element | null = from;
  for (let depth = 0; node && depth < 8; depth += 1, node = node.parentElement) {
    if (node instanceof HTMLImageElement && node.getAttribute("src") === src) {
      image = node;
      break;
    }
    for (const img of node.querySelectorAll("img")) {
      if (img.getAttribute("src") === src && img.getBoundingClientRect().width > 0) {
        image = img as HTMLImageElement;
        break;
      }
    }
    if (image) break;
  }
  
  if (!image) return null;

  let parent = image.parentElement;
  while (parent && parent !== document.body) {
    const style = window.getComputedStyle(parent);
    if (style.overflow === "hidden" || style.overflowX === "hidden" || style.overflowY === "hidden") {
      return parent;
    }
    parent = parent.parentElement;
  }
  
  return image.parentElement;
}

/* ── the transition ─────────────────────────────────────────────────────── */

/** The product we are returning from, so the list knows to catch it. */
let returningProduct: string | null = null;
let returningFrame: HTMLElement | null = null;

export function getReturningProduct() {
  return returningProduct;
}

export function openWithContinuity(
  navigate: (to: string) => void,
  product: Product,
  to: string,
  from?: Element | null
) {
  handoffCache.set(product.id, product);

  const start = (document as unknown as { startViewTransition?: StartViewTransition })
    .startViewTransition;
  const image = findProductFrame(product, from ?? lastPress);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!image || reduced || typeof start !== "function") {
    navigate(to);
    return;
  }

  const run = ++currentRun;
  landing?.ready();
  
  returningProduct = product.id;
  returningFrame = image;
  
  nameHero(image);
  const html = document.documentElement;
  html.setAttribute("data-vt-kind", "continuity");

  const transition = start.call(
    document,
    () =>
      new Promise<void>((resolve) => {
        const done = () => {
          window.clearTimeout(timer);
          if (landing?.ready === done) landing = null;
          resolve();
        };
        const timer = window.setTimeout(done, LANDING_CAP_MS);
        landing = { productId: product.id, ready: done };
        navigate(to);
      })
  );

  transition.ready.catch(() => {});
  transition.finished.finally(() => {
    if (run !== currentRun) return;
    html.removeAttribute("data-vt-kind");
    clearHeroNames();
  });
}

/** The imperative form, for tiles that call back with a product. */
export function useOpenProduct() {
  const navigate = useNavigate();
  useEffect(trackPresses, []);
  return useCallback(
    (product: Product, from?: Element | null) =>
      openWithContinuity(navigate, product, `/products/${product.id}`, from),
    [navigate]
  );
}

/**
 * The link form. A real <a>, so a modified click still opens a new tab and the
 * address still shows on hover; only a plain press is taken over.
 */
export function ContinuityLink({
  product,
  to,
  imgRef,
  className,
  style,
  title,
  children,
  onNavigate,
}: {
  /* declared because the project has no @types/react, so TS checks key as an
     ordinary prop rather than a reserved one */
  key?: string;
  product: Product;
  to: string;
  imgRef?: React.RefObject<HTMLImageElement | null>;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Leave modified clicks to the browser — new tab, new window, download.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;
    e.preventDefault();
    onNavigate?.();
    openWithContinuity(navigate, product, to, imgRef?.current ?? e.currentTarget);
  };

  return (
    <a href={to} onClick={onClick} className={className} style={style} title={title}>
      {children}
    </a>
  );
}

/**
 * The product page's half of the handshake.
 *
 * Names the hero FRAME — the rounded, clipping box, not the image inside it,
 * so the snapshot carries its corners — and lets the transition take the new
 * snapshot once the photograph is decoded. A layout effect, so it runs in the
 * commit that mounts the page, before anything can be painted or captured.
 *
 * Only when a continuity change is heading to this product. A name left on the
 * hero for good would make it a group in every other transition that leaves
 * this page, with nothing to travel into.
 */
export function useContinuityLanding(
  productId: string | undefined,
  frameRef: { current: HTMLElement | null },
  imgRef: { current: HTMLImageElement | null }
) {
  useLayoutEffect(() => {
    const arriving = landing;
    if (!arriving || !productId || arriving.productId !== productId) return;
    const frame = frameRef.current;
    const img = imgRef.current;
    if (!frame || !img) {
      arriving.ready();
      return;
    }
    nameHero(frame);
    if (img.complete && img.naturalWidth > 0) {
      arriving.ready();
      return;
    }
    img.decode().then(arriving.ready, arriving.ready);
  }, [productId, frameRef, imgRef]);
}

/**
 * The list's half of the return handshake.
 * 
 * When returning from a product page, this names the product's frame in the list
 * so the view transition has a target to land on.
 */
export function useContinuityReturn() {
  useLayoutEffect(() => {
    if (!returningProduct) return;
    
    // Find any product card matching the returning product
    // We could use returningFrame if it's still attached, but it's likely a new DOM element
    // So we search by product ID
    
    // Since we don't have a reliable data attribute for product ID on the card itself yet,
    // we can find the image by src from handoffCache, or add a data attribute.
    // The easiest is to use the handoffCache.
    const product = handoffCache.get(returningProduct);
    if (!product) return;
    
    // Find a frame that matches this product (by walking up from its image)
    const src = product.images?.[0];
    if (!src) return;
    
    let frameToName = returningFrame;
    if (!frameToName || !document.contains(frameToName)) {
      // Find the image in the new DOM
      const imgs = Array.from(document.querySelectorAll("img")).filter(
        (img) => img.getAttribute("src") === src
      );
      // Pick the one that is most likely the card (visible)
      const img = imgs.find((i) => i.getBoundingClientRect().width > 0) || imgs[0];
      if (!img) return;
      
      let parent = img.parentElement;
      while (parent && parent !== document.body) {
        const style = window.getComputedStyle(parent);
        if (style.overflow === "hidden" || style.overflowX === "hidden" || style.overflowY === "hidden") {
          frameToName = parent;
          break;
        }
        parent = parent.parentElement;
      }
      if (!frameToName) frameToName = img.parentElement;
    }
    
    if (frameToName) {
      nameHero(frameToName);
      // Clear it after the transition completes
      setTimeout(() => {
        if (frameToName) {
          frameToName.style.viewTransitionName = "";
          frameToName.removeAttribute("data-ti-hero");
        }
      }, 500);
    }
    
    returningProduct = null;
    returningFrame = null;
  }, []);
}

/* ── reading ────────────────────────────────────────────────────────────── */

/**
 * Clamped body copy with a text toggle. Measured rather than assumed: the
 * control only appears when the copy actually overflows the clamp, so short
 * descriptions do not get a "Xem thêm" that expands nothing.
 */
export function Clamp({
  text,
  lines = 4,
  className = "",
  moreLabel = "Xem thêm",
  lessLabel = "Thu gọn",
  tone = "brand",
}: {
  text: string;
  lines?: number;
  className?: string;
  moreLabel?: string;
  lessLabel?: string;
  tone?: "brand" | "paper";
}) {
  const ref = React.useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflows(el.scrollHeight - el.clientHeight > 4);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, lines]);

  return (
    <div className={className}>
      <p
        ref={ref}
        className="ti-clamp"
        style={{ WebkitLineClamp: open ? "unset" : lines, ...(open ? { display: "block" } : null) }}
      >
        {text}
      </p>
      {(overflows || open) && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`mt-1.5 text-xs font-semibold underline underline-offset-4 ${
            tone === "paper" ? "text-wave hover:text-paper" : "text-brand hover:text-brand-deep"
          }`}
        >
          {open ? lessLabel : `… ${moreLabel}`}
        </button>
      )}
    </div>
  );
}
