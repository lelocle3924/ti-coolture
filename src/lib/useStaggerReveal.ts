import { useEffect, useRef } from "react";

/**
 * Grid reveal — motion proposal 02 (/lab/motion, approved 31/08).
 *
 * The reveal used to be a scroll timeline whose stagger came from
 * `:nth-child(2n)` and `(3n)` shifting `animation-range`. That keys the order
 * off a card's position in the DOM rather than its position on screen: in a
 * four-column grid, cards 1 and 3 arrived together while 2 and 4 lagged, which
 * reads as a glitch rather than as a rhythm.
 *
 * An IntersectionObserver drives it instead. Everything that crosses the
 * threshold in the same callback is one wave — on a grid, the row actually
 * coming into view — and gets 45ms of delay per card, capped at the fourth.
 * Past ~180ms of total delay the last card lands after the eye has finished
 * reading the first. Each card is unobserved once shown, so it runs once.
 *
 * Two things guard against the failure mode that matters here, which is a
 * product card left at opacity 0 for good:
 *
 *   · The hidden state is scoped to `[data-rev-ready]`, set by this hook. If
 *     the script never runs, the cards are simply visible.
 *   · A passive scroll listener sweeps for anything the observer did not
 *     report — a hash jump, a restored scroll position, or a viewport that is
 *     not delivering intersection callbacks at all. An observer only reports
 *     threshold crossings, so a card skipped between two frames would never
 *     hear about it. The sweep is a safety net, not the choreography: cards
 *     already scrolled past appear instantly, with no stagger.
 */
export function useStaggerReveal<T extends HTMLElement = HTMLDivElement>(
  /** Re-run when the rendered set changes — a filter, a sort, a fetch. */
  key?: unknown
) {
  const rootRef = useRef<T | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const items = Array.from(root.querySelectorAll(".rev")) as HTMLElement[];
    if (items.length === 0) return;

    root.setAttribute("data-rev-ready", "");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      items.forEach((el) => el.classList.add("rev-done"));
      return;
    }

    /* Hand the card back once it has arrived.
       `revup` runs with animation-fill-mode: both, and a finished animation
       still owns every property it animated — including transform, which beats
       the :hover transition in the cascade. Leaving .rev-in on meant the
       catalogue cards silently stopped lifting on hover. .rev-done keeps them
       visible and animates nothing. */
    const onAnimationEnd = (e: AnimationEvent) => {
      if (e.animationName !== "revup") return;
      const el = e.target as HTMLElement;
      el.classList.remove("rev-in");
      el.classList.add("rev-done");
      el.style.animationDelay = "";
    };
    root.addEventListener("animationend", onAnimationEnd);

    let observer: IntersectionObserver | null = null;
    let timer = 0;

    const shown = (el: HTMLElement) =>
      el.classList.contains("rev-in") || el.classList.contains("rev-done");
    const pending = () => items.filter((el) => !shown(el));

    const reveal = (el: HTMLElement, delayMs: number) => {
      el.style.animationDelay = `${delayMs}ms`;
      el.classList.add("rev-in");
      observer?.unobserve(el);
    };

    /** One wave: 45ms apart, stopping at the fourth card. */
    const revealWave = (els: HTMLElement[]) =>
      els.forEach((el, i) => reveal(el, Math.min(i, 3) * 45));

    const stopSweeping = () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };

    const sweep = () => {
      const left = pending();
      if (left.length === 0) {
        stopSweeping();
        return;
      }
      const passed: HTMLElement[] = [];
      const arrived: HTMLElement[] = [];
      for (const el of left) {
        const r = el.getBoundingClientRect();
        if (r.bottom <= 0) passed.push(el);
        else if (r.top < window.innerHeight * 0.92) arrived.push(el);
      }
      passed.forEach((el) => reveal(el, 0));
      revealWave(arrived);
    };

    function onScroll() {
      if (timer) return;
      timer = window.setTimeout(() => {
        timer = 0;
        sweep();
      }, 120);
    }

    observer = new IntersectionObserver(
      (entries) => {
        revealWave(
          entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement)
        );
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    items.forEach((el) => observer!.observe(el));
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      observer?.disconnect();
      if (timer) window.clearTimeout(timer);
      stopSweeping();
      root.removeEventListener("animationend", onAnimationEnd);
    };
  }, [key]);

  return rootRef;
}
