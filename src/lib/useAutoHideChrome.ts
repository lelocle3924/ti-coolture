import { useEffect, useRef, useState } from "react";

/**
 * Team feedback (2026-08-19):
 *   "Nav bar nên tự scroll lên khi kéo xuống dưới, chỉ pop down lại khi kéo lên."
 *
 * Deliberately shared by all three exploration directions: the *behaviour* is a
 * settled decision, so the comparison isolates how each direction expresses the
 * chrome, not whether it hides.
 *
 * Matches docs/UX-TASKS.md 1.1 — 8px direction threshold, never hides in the
 * top zone, re-reveals on keyboard focus, and snaps rather than eases under
 * prefers-reduced-motion.
 */

export interface AutoHideOptions {
  /** Direction change must exceed this before the chrome reacts. */
  threshold?: number;
  /** Chrome always stays down inside this band from the top of the document. */
  topZone?: number;
  /** Hold the chrome open — pass true while a drawer, sheet or modal is open. */
  locked?: boolean;
}

export interface AutoHideState {
  /** Chrome should be translated off-screen. */
  hidden: boolean;
  /** Still inside the top zone — usually means "no background yet". */
  atTop: boolean;
  /** 0–1 document scroll progress, for progress rails. */
  progress: number;
  /** Force the chrome back down (focus handlers, skip links, anchor jumps). */
  reveal: () => void;
}

export function useAutoHideChrome({
  threshold = 8,
  topZone = 80,
  locked = false,
}: AutoHideOptions = {}): AutoHideState {
  const [hidden, setHidden] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [progress, setProgress] = useState(0);

  const lastY = useRef(0);
  const anchor = useRef(0);
  const direction = useRef<"up" | "down">("up");

  useEffect(() => {
    if (locked) setHidden(false);
  }, [locked]);

  useEffect(() => {
    lastY.current = window.scrollY;
    anchor.current = window.scrollY;

    let frame = 0;

    const measure = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      const max = document.documentElement.scrollHeight - window.innerHeight;

      setProgress(max > 0 ? Math.min(1, y / max) : 0);
      setAtTop(y <= topZone);

      const next = y > lastY.current ? "down" : y < lastY.current ? "up" : direction.current;

      // Reset the travel anchor whenever the scroll direction flips, so the
      // threshold measures distance travelled *since the turn*, not since load.
      if (next !== direction.current) {
        direction.current = next;
        anchor.current = y;
      }

      const travelled = Math.abs(y - anchor.current);

      if (locked || y <= topZone) {
        setHidden(false);
      } else if (travelled > threshold) {
        setHidden(next === "down");
      }

      lastY.current = y;
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [threshold, topZone, locked]);

  return { hidden, atTop, progress, reveal: () => setHidden(false) };
}

/**
 * Media query as state. Needed where a layout decision cannot be expressed as a
 * CSS breakpoint — inline flex ratios, or gating a scroll-driven pin to screens
 * with the room for it.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [query]);

  return matches;
}

/** True when the visitor has asked the OS to stop animating things. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return reduced;
}
