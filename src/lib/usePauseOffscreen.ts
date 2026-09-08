import { useEffect, useRef, useState } from "react";

/**
 * True whenever a looping animation inside `ref` is not worth running — motion
 * proposal 11 (/lab/motion, approved 31/08).
 *
 * The What's in store lanes run 46s and 58s on infinite loops and only stop on
 * hover. They kept running once the section had scrolled away and while the
 * tab was in the background: battery spent, and the compositor kept busy, for
 * something nobody can see.
 *
 * Nothing changes visually. The section simply stops moving when it is off
 * screen or the tab is hidden, and picks up where it left off — pausing an
 * animation holds its position rather than resetting it.
 */
export function usePauseOffscreen<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let onScreen = true;
    const sync = () => setPaused(!onScreen || document.hidden);

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        onScreen = entry.isIntersecting;
        sync();
      },
      // any sliver of the section counts as visible
      { threshold: 0 }
    );

    observer.observe(el);
    document.addEventListener("visibilitychange", sync);
    sync();

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return { ref, paused };
}
