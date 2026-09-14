import { useEffect } from "react";
import { animate, splitText, spring, stagger, utils, type JSAnimation } from "animejs";

/* ═══════════════════════════════════════════════════════════════════════════
   TITLES THAT ARRIVE

   Team 14/09, choosing from /lab/titles: "tiêu đề chọn kiểu thứ 3, áp dụng
   ở mọi trang trừ một sản phẩm và một shop, nhịp 1x". Effect 03, "Bật từng
   từ": each word of a title pops up from under half its size, tilted a few
   degrees one way or the other, and settles on a spring, 85ms after the word
   before it.

   It runs the way the study ran it, because the study is where it was judged:

     · The pages do not know. Titles are found in the DOM — every h1 and h2 set
       in the display face under the element this is given, including ones
       that render after their data — and each is held at opacity 0 until a
       third of it is on screen.
     · anime.js' splitText cuts a title into words. Those spans stand in for
       React's own text nodes only while the title is moving; once it has
       settled, the very nodes React rendered are put back, so React can go on
       updating the title. Only titles made of text and line breaks are
       touched, so there is nothing else inside them React could reach for in
       the meantime.
     · The animation is built in the splitter's addEffect, which runs once the
       split exists, and the title is shown in the same step as its first
       frame — never before it.
     · Reduced motion leaves titles as they are. So does a page arriving by a
       continuity Back, which is being put back the way it was left.
   ═══════════════════════════════════════════════════════════════════════════ */

const TITLES = "h1.display, h2.display";
/** Set while a title waits to come on screen; index.css holds it at opacity 0. */
const WAITING = "data-title-wait";
/** The longest a title may stay hidden waiting for a split that never comes. */
const GIVE_UP_MS = 4000;

/** Text and line breaks only — nothing inside that React would reach for. */
function isPlainTitle(el: Element) {
  return Array.from(el.childNodes).every(
    (node) => node.nodeType === Node.TEXT_NODE || (node as Element).tagName === "BR"
  );
}

interface Playing {
  finished: Promise<void>;
  /** Stop, and hand the title back exactly as React rendered it. */
  revert: () => void;
}

function popWords(el: HTMLElement): Playing {
  const original = Array.from(el.childNodes);
  let settle = () => {};
  const finished = new Promise<void>((resolve) => {
    settle = resolve;
  });
  const giveUp = window.setTimeout(() => settle(), GIVE_UP_MS);

  const splitter = splitText(el, { words: true, accessible: true });
  splitter.addEffect((self: { words: HTMLElement[] }) => {
    utils.set(self.words, { opacity: 0, scale: 0.45, rotate: () => utils.random(-12, 12) });
    const anim: JSAnimation = animate(self.words, {
      opacity: { to: 1, duration: 220, ease: "out(2)" },
      scale: 1,
      rotate: 0,
      ease: spring({ bounce: 0.45, duration: 650 }),
      delay: stagger(85),
    });
    el.removeAttribute(WAITING);
    void anim.then(() => settle());
    return anim;
  });

  return {
    finished,
    revert: () => {
      window.clearTimeout(giveUp);
      splitter.revert();
      // a split still waiting on the fonts finds nothing left to split
      splitter.html = "";
      el.replaceChildren(...original);
      el.removeAttribute(WAITING);
    },
  };
}

/**
 * Pops in every title under `rootRef` as it comes into view, while `enabled`.
 * Turning it off hands back any title still moving, untouched.
 */
export function useTitleEntrance(rootRef: { current: HTMLElement | null }, enabled: boolean) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /** Titles waiting (null) or moving; a title leaves once it has settled. */
    const live = new Map<HTMLElement, Playing | null>();
    const done = new WeakSet<HTMLElement>();
    let alive = true;

    const play = (el: HTMLElement) => {
      if (!alive || !live.has(el) || live.get(el) || !el.isConnected) return;
      const run = popWords(el);
      live.set(el, run);
      void run.finished.then(() => {
        if (live.get(el) !== run) return;
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
      if (live.has(el) || done.has(el) || !isPlainTitle(el)) return;
      // a continuity Back is putting the page back as it was left
      if (document.documentElement.getAttribute("data-vt-kind") === "continuity") {
        done.add(el);
        return;
      }
      live.set(el, null);
      el.setAttribute(WAITING, "");
      observer.observe(el);
    };

    const scan = (node: Node) => {
      if (!(node instanceof Element)) return;
      if (node.matches(TITLES)) register(node as HTMLElement);
      node.querySelectorAll<HTMLElement>(TITLES).forEach(register);
    };

    scan(root);

    const mutations = new MutationObserver((records) => {
      let removed = false;
      for (const record of records) {
        record.addedNodes.forEach(scan);
        if (record.removedNodes.length) removed = true;
      }
      if (!removed) return;
      for (const [el, run] of live) {
        if (el.isConnected) continue;
        observer.unobserve(el);
        run?.revert();
        live.delete(el);
      }
    });
    mutations.observe(root, { childList: true, subtree: true });

    return () => {
      alive = false;
      mutations.disconnect();
      observer.disconnect();
      for (const [el, run] of live) {
        run?.revert();
        el.removeAttribute(WAITING);
      }
      live.clear();
    };
  }, [rootRef, enabled]);
}
