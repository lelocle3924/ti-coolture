/**
 * Continuity transition — a product photograph travelling from wherever it was
 * pressed into the hero of its product page, and back into its card on Back —
 * plus the reading helpers that go with it.
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
 *
 * And on Back (14/09 — "Hiệu ứng khi Back chưa chạy"). The first attempt was a
 * hook in the app's root with no dependencies, so it ran once, when the app
 * mounted, and never met a Back; and nothing started a transition on Back to
 * begin with. The router answers a popstate the moment it arrives, before any
 * snapshot could be taken, and the list it returns to has not fetched its
 * cards by then. So:
 *
 *   4. A press leaves a note against the history entry it leaves — which
 *      product, which photograph, where on the screen (rememberDeparture).
 *   5. A popstate that arrives at an entry with a note, from that product's
 *      page, with its hero on screen, is held back from the router. The hero
 *      is named, the old snapshot taken, and only inside the update callback
 *      is the popstate handed on (onPopState). The browser's own scroll
 *      restoration has to be off for this (SmartScrollRestoration, App.tsx):
 *      it scrolls the page being left the instant the popstate fires, which
 *      is before that snapshot is taken.
 *   6. The new snapshot waits, up to RETURN_CAP_MS, for the list to render,
 *      the scroll to be back where it was and the card's photograph to be
 *      ready; the visible copy nearest the press is named and the photograph
 *      flies back into it.
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

/** The longest the new snapshot may wait for the page a Back returns to. It
 *  fetches its cards first, so it is given a little longer than a landing. */
const RETURN_CAP_MS = 600;

/** The change in flight, if any: where it is heading, and how the product
 *  page tells the transition it may take the new snapshot. */
let landing: { productId: string; ready: () => void } | null = null;

/** Which run owns the cleanup, so a second press cannot be tidied away by the
 *  first one finishing. */
let currentRun = 0;

interface ViewTransitionLike {
  ready: Promise<void>;
  finished: Promise<void>;
  skipTransition: () => void;
}

type StartViewTransition = (update: () => Promise<void>) => ViewTransitionLike;

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

/** The box that clips a photograph — its rounded frame — or else its parent. */
function clippingFrame(image: HTMLImageElement): HTMLElement | null {
  for (let parent = image.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
    const style = window.getComputedStyle(parent);
    if (style.overflow === "hidden" || style.overflowX === "hidden" || style.overflowY === "hidden") {
      return parent;
    }
  }
  return image.parentElement;
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
  return image ? clippingFrame(image) : null;
}

/* ── the transition ─────────────────────────────────────────────────────── */

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

  // the note a Back will look for, against the entry this press is leaving
  const src = product.images?.[0];
  if (src) {
    const box = image.getBoundingClientRect();
    rememberDeparture(entryKey(), {
      productId: product.id,
      src,
      x: box.left + box.width / 2,
      y: box.top + box.height / 2,
    });
  }

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

  // a skipped transition rejects `ready`; the navigation has happened anyway
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

/* ── and back ───────────────────────────────────────────────────────────── */

/** What a press left behind, against the history entry it left. */
interface Departure {
  productId: string;
  /** The card's photograph, images[0] — whichever one the hero shows by then. */
  src: string;
  /** The centre of the pressed frame, in the viewport, at the press. */
  x: number;
  y: number;
}

/* In sessionStorage rather than in memory: history entries outlive a reload,
   and a Back from a reloaded product page should still find its card. */
const DEPARTURES_KEY = "ti-continuity-departures";
const DEPARTURES_KEPT = 40;

/**
 * The router's key for the history entry on screen — "default" for the entry
 * the tab opened on, which is what the router itself calls that one, and so
 * the name SmartScrollRestoration saved its scroll position under.
 */
function entryKey(): string {
  const state = window.history.state as { key?: unknown } | null;
  return typeof state?.key === "string" ? state.key : "default";
}

function readDepartures(): Array<[string, Departure]> {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(DEPARTURES_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as Array<[string, Departure]>) : [];
  } catch {
    return [];
  }
}

function rememberDeparture(key: string, departure: Departure) {
  const kept = readDepartures().filter(([k]) => k !== key);
  kept.push([key, departure]);
  try {
    sessionStorage.setItem(DEPARTURES_KEY, JSON.stringify(kept.slice(-DEPARTURES_KEPT)));
  } catch {
    /* storage full or blocked: that Back simply will not fly */
  }
}

function departureFor(key: string): Departure | null {
  return readDepartures().find(([k]) => k === key)?.[1] ?? null;
}

function onScreen(el: Element) {
  const box = el.getBoundingClientRect();
  return (
    box.width > 0 &&
    box.bottom > 0 &&
    box.right > 0 &&
    box.top < window.innerHeight &&
    box.left < window.innerWidth
  );
}

/** Where SmartScrollRestoration saved an entry's scroll, if it did. */
function savedScroll(key: string): number | null {
  try {
    const y = parseInt(sessionStorage.getItem(`scroll-${key}`) ?? "", 10);
    return Number.isFinite(y) ? y : null;
  } catch {
    return null;
  }
}

/**
 * Puts the page back where it was left, as far as it can yet go. True once
 * the saved position is reachable.
 *
 * SmartScrollRestoration does the same in a layout effect and retries from a
 * ResizeObserver, but observers do not run while a transition is holding
 * rendering, and a list that fetches its cards starts out too short to
 * scroll that far.
 */
function restoreScroll(target: number | null) {
  if (target === null) return true;
  const reachable = document.documentElement.scrollHeight - window.innerHeight;
  const y = Math.max(0, Math.min(target, reachable));
  if (Math.abs(window.scrollY - y) > 1) window.scrollTo(0, y);
  return reachable >= target - 1;
}

/**
 * The card to land in: the visible copy of the photograph nearest to where
 * the press was. Nearest, because a page can show one product twice — the
 * homepage lanes carry two copies of every tile, and a lane does not keep its
 * offset across the visit.
 */
function findReturnFrame(departure: Departure) {
  let best: { frame: HTMLElement; image: HTMLImageElement } | null = null;
  let bestDistance = Infinity;
  for (const image of document.querySelectorAll("img")) {
    if (image.getAttribute("src") !== departure.src) continue;
    const frame = clippingFrame(image);
    if (!frame || !onScreen(frame)) continue;
    const box = frame.getBoundingClientRect();
    const distance = Math.hypot(
      box.left + box.width / 2 - departure.x,
      box.top + box.height / 2 - departure.y
    );
    if (distance < bestDistance) {
      best = { frame, image };
      bestDistance = distance;
    }
  }
  return best;
}

function isOpaque(colour: string) {
  if (!colour || colour === "transparent") return false;
  const alpha =
    colour.match(/\/\s*([\d.]+)(%?)\s*\)$/) ?? colour.match(/^rgba\((?:[^,]+,){3}\s*([\d.]+)()\s*\)$/);
  if (!alpha) return true;
  return parseFloat(alpha[1]) >= (alpha[2] === "%" ? 99 : 0.99);
}

/**
 * The first solid colour at or behind an element. On the way in the ground
 * between the two pages is paper, because every press lands on the product
 * page's paper; a Back lands on whatever its card sits on — the homepage's
 * violet as much as the catalogue's paper — so it takes this instead.
 */
function groundAt(el: Element | null) {
  for (let node = el; node; node = node.parentElement) {
    const colour = window.getComputedStyle(node).backgroundColor;
    if (isOpaque(colour)) return colour;
  }
  return "";
}

/**
 * Keeps the router from starting a view transition of its own while a Back
 * is already inside one.
 *
 * React Router gives a POP a transition whenever the path it returns to has
 * ever used a `viewTransition` link — one press of a catalogue card's shop
 * link is enough, and it remembers for the rest of the session. Its
 * startViewTransition would skip this transition halfway through its update.
 * For that window a call runs its update at once with no transition round
 * it, which is all the router needs: its update commits the page, and the
 * transition already running is what animates it.
 */
function holdRouterTransitions() {
  const doc = document as unknown as Record<string, unknown>;
  Object.defineProperty(doc, "startViewTransition", {
    configurable: true,
    writable: true,
    value: (update?: () => unknown) => {
      const done = Promise.resolve()
        .then(() => update?.())
        .then(
          () => undefined,
          () => undefined
        );
      return { ready: done, finished: done, updateCallbackDone: done, skipTransition() {} };
    },
  });
  return () => {
    delete doc.startViewTransition;
  };
}

/** The Back in flight, if any. */
let returning: { cancelled: boolean; transition: ViewTransitionLike | null } | null = null;
/** Set while a held popstate is handed on, so the listener lets it through. */
let handingOn = false;

function onPopState(event: PopStateEvent) {
  if (handingOn) return;

  /* A second Back before the first has landed: the router takes both steps
     at once, and nothing waits any longer for a card that will not come. */
  if (returning) {
    returning.cancelled = true;
    returning.transition?.skipTransition();
    returning = null;
    return;
  }

  const start = (document as unknown as { startViewTransition?: StartViewTransition })
    .startViewTransition;
  if (typeof start !== "function") return;
  // a swipe the browser has already animated needs no second animation
  if ((event as PopStateEvent & { hasUAVisualTransition?: boolean }).hasUAVisualTransition) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const key = entryKey();
  const departure = departureFor(key);
  const hero = document.querySelector<HTMLElement>("[data-ti-hero-frame]");
  if (!departure || !hero || hero.dataset.tiHeroFrame !== departure.productId || !onScreen(hero)) {
    return;
  }

  // the router hears this one from inside the transition, below
  event.stopImmediatePropagation();

  const run = ++currentRun;
  landing?.ready();
  const flight: { cancelled: boolean; transition: ViewTransitionLike | null } = {
    cancelled: false,
    transition: null,
  };
  returning = flight;

  nameHero(hero);
  const html = document.documentElement;
  html.setAttribute("data-vt-kind", "continuity");

  const transition = start.call(
    document,
    () =>
      new Promise<void>((resolve) => {
        if (flight.cancelled) {
          resolve();
          return;
        }

        const release = holdRouterTransitions();
        handingOn = true;
        try {
          window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
        } finally {
          handingOn = false;
        }

        const began = performance.now();
        const target = savedScroll(key);
        const land = (frame: HTMLElement | null) => {
          release();
          if (frame) nameHero(frame);
          const ground = groundAt(
            frame?.parentElement ??
              document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)
          );
          if (ground) html.style.setProperty("--ti-vt-ground", ground);
          resolve();
        };

        const tick = () => {
          if (flight.cancelled) return land(null);
          const late = performance.now() - began > RETURN_CAP_MS;
          /* Nothing to look for until the router has taken the product page
             down: its hero can be showing the very photograph being sought. */
          if (hero.isConnected) {
            if (late) return land(null);
          } else {
            const settled = restoreScroll(target);
            const found = findReturnFrame(departure);
            // a lazy image off screen when the list was left has not loaded
            if (found && found.image.loading === "lazy") found.image.loading = "eager";
            const decoded = !!found && found.image.complete && found.image.naturalWidth > 0;
            if (found && settled && decoded) return land(found.frame);
            if (late) return land(found?.frame ?? null);
          }
          window.setTimeout(tick, 16);
        };
        tick();
      })
  );
  flight.transition = transition;

  transition.ready.catch(() => {});
  transition.finished.finally(() => {
    if (returning === flight) returning = null;
    if (run !== currentRun) return;
    html.removeAttribute("data-vt-kind");
    html.style.removeProperty("--ti-vt-ground");
    clearHeroNames();
  });
}

/* Installed as the module loads, which is before the router exists, and in
   the capture phase, which runs ahead of the router's own listener on window
   either way. Replaced rather than doubled when the module hot-reloads. */
if (typeof window !== "undefined") {
  const slot = window as unknown as { __tiContinuityPop?: (event: PopStateEvent) => void };
  if (slot.__tiContinuityPop) window.removeEventListener("popstate", slot.__tiContinuityPop, true);
  slot.__tiContinuityPop = onPopState;
  window.addEventListener("popstate", onPopState, true);
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
