/**
 * Continuity transition — the shared-element morph from a product image in a
 * list to the same image on the product page, plus the reading helpers that
 * go with it.
 *
 * Two things this exists to fix, both found on 21/08:
 *
 *   · <Link viewTransition> did nothing in this app. React Router honours the
 *     prop only under a data router, and src/App.tsx mounted <BrowserRouter>
 *     + <Routes> — so every viewTransition in src/views was inert and no
 *     product image had ever travelled. Fixed on 08/09: App.tsx declares a
 *     real route table under createBrowserRouter, and a card click now starts
 *     a transition where it used to start none.
 *
 *     ContinuityLink still drives its own, and deliberately. The router's
 *     transition is a root cross-fade; this one names ONE element on each
 *     side, which is what makes a single photograph travel rather than the
 *     whole page dissolve.
 *   · The product page fetched on mount and painted a spinner first, so at
 *     the moment the browser snapshots the new DOM there was nothing to morph
 *     into. handoff() stashes the clicked product so the page can paint its
 *     hero on the first frame.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { flushSync } from "react-dom";
import type { Product } from "../types";
import "./continuity.css";

/* ── formatting ─────────────────────────────────────────────────────────── */

export const formatPrice = (value: number) =>
  value > 0 ? `${value.toLocaleString("vi-VN")}₫` : "Liên hệ";

export const PRICE_NOTE = "Giá tham khảo, giá cuối do shop quyết định";
export const NO_TRANSACTION =
  "Tí Coolture không bán hàng và không xử lý giao dịch.";

/* ── data ───────────────────────────────────────────────────────────────── */

/**
 * Continuity handoff.
 *
 * The production page already names the two images the same thing, but the
 * morph never runs: the product page fetches on mount and paints a spinner
 * first, so at the moment the browser snapshots the new DOM there is no image
 * to morph into — only the root cross-fade is left, which is the "zoom" the
 * team is seeing. Stashing the clicked product here lets the product page
 * render its hero on the first paint.
 */
const handoffCache = new Map<string, Product>();

/** The last image handed off, so the catalogue can re-adopt the name when the
 *  visitor comes back and the morph runs in reverse too. */
let lastHeroId: string | null = null;

export const HERO_NAME = "ti-hero";

/** Only one element may carry the name at a time, or the browser throws the
 *  whole transition away. */
function clearHeroNames() {
  document.querySelectorAll<HTMLElement>("[data-ti-hero]").forEach((node) => {
    node.style.viewTransitionName = "";
    node.removeAttribute("data-ti-hero");
  });
}

export function handoff(product: Product, el?: HTMLElement | null) {
  handoffCache.set(product.id, product);
  lastHeroId = product.id;
  clearHeroNames();
  if (el) {
    el.style.viewTransitionName = HERO_NAME;
    el.setAttribute("data-ti-hero", "");
  }
  document.documentElement.setAttribute("data-vt-kind", "continuity");
  window.setTimeout(() => {
    document.documentElement.removeAttribute("data-vt-kind");
    clearHeroNames();
  }, 900);
}

export function readHandoff(id: string | undefined): Product | null {
  return (id && handoffCache.get(id)) || null;
}

/**
 * The link that actually plays the transition.
 *
 * `<Link viewTransition>` does nothing in this app: the prop is only honoured
 * by a data router, and src/App.tsx mounts <BrowserRouter> + <Routes>. Every
 * `viewTransition` in src/views is therefore inert, which is why no product
 * image has ever travelled.
 *
 * It used to say that the one transition the team could see was the
 * whole-page slide withDirectionalTransition fired on a chip press. Motion
 * proposal 05 (31/08) took that off the filter chips — a filter is a list
 * update, not a page change — so that helper now has no callers.
 *
 * So drive it here: snapshot, navigate synchronously inside the callback so
 * the new page is in the DOM before the second snapshot, and let the CSS in
 * subpages.css do the rest.
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
    handoff(product, imgRef?.current ?? null);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !(document as any).startViewTransition) {
      navigate(to);
      return;
    }
    (document as any).startViewTransition(() => flushSync(() => navigate(to)));
  };

  return (
    <a href={to} onClick={onClick} className={className} style={style} title={title}>
      {children}
    </a>
  );
}

/** Props for the one card the visitor last opened — it wears the shared name
 *  so returning to the catalogue plays the same morph backwards. */
export function heroProps(productId: string) {
  return productId === lastHeroId
    ? ({ "data-ti-hero": "", style: { viewTransitionName: HERO_NAME } } as const)
    : {};
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

/* ── product image that carries the continuity name ─────────────────────── */

export function CardImage({
  product,
  className = "",
  imgRef,
}: {
  product: Product;
  className?: string;
  imgRef?: React.Ref<HTMLImageElement>;
}) {
  return (
    <img
      ref={imgRef}
      src={product.images?.[0]}
      alt={product.name}
      loading="lazy"
      className={className}
      {...heroProps(product.id)}
    />
  );
}

