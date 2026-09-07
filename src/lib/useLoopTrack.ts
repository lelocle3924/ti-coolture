import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useAutoHideChrome";

/* ═══════════════════════════════════════════════════════════════════════════
   A paged track with no ends.

   Team 07/09: "nếu có 10 sản phẩm featured trên What's in store, thì vuốt sang
   phải 10 lần sẽ qua sản phẩm 2,3,…,10 rồi quay trở về đúng sản phẩm đầu tiên
   … Nói cho tôi biết bạn làm được không, hay có lý do technical nào đang ngăn
   bạn."

   It is doable, and what was stopping it was the mechanism rather than
   anything fundamental. The phone rail was a native `overflow-x: auto`
   container with the last product moved to the front of the list. That gets
   you the *look* of a loop at rest — the last product sits to the left of the
   first — but a scroll container has a finite scrollWidth, so one swipe left
   reaches scrollLeft 0 and there is nothing further to scroll to. No amount of
   reordering fixes it: the browser will not scroll past content that is not
   there.

   Two mechanisms can actually loop:

     · Recycle on the fly — move the tile that just left the far side round to
       the other end. Correct, and it fights the platform's scroll anchoring
       the whole time.
     · Repeat the list and move the *window*. Simpler, and the one used here.

   The track renders COPIES copies of the list and keeps its index inside the
   middle one. Stepping past either end of that copy is an ordinary animated
   step into the neighbouring copy; once the spring settles, the index is
   folded back by ±count and the offset is jumped by the matching multiple of
   the slide width. The jump is invisible by construction, because the pixels
   at index i and index i+count are the same pixels.

   The physics are useDragTrack's, unchanged — 1:1 while held, released at the
   pointer's own velocity, landing where the flick is going. What is gone is
   the clamp, and with it the rubber-band: there is no edge left to resist at.
   ═══════════════════════════════════════════════════════════════════════════ */

/** How many times the list is laid out. Three: one on screen, one either side. */
export const LOOP_COPIES = 3;

/** Apple's projection: where a flick comes to rest. */
function project(velocity: number, decelerationRate: number): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

export interface LoopTrackOptions {
  /** Spring response in seconds. Higher is calmer. */
  response?: number;
  /** Fed to the momentum projection; lower shortens the throw. */
  decelerationRate?: number;
  /** Cap on how many slides one flick may cross. */
  maxPagesPerFlick?: number;
}

export interface LoopTrack {
  /** Current offset in px; negative moves the track left. */
  x: number;
  /** Logical slide, always 0…count-1. */
  page: number;
  dragging: boolean;
  /** Go to a logical slide, by the shortest way round. */
  goTo: (page: number) => void;
  next: () => void;
  prev: () => void;
  handlers: {
    onPointerDown: (e: { pointerId: number; clientX: number; currentTarget: Element }) => void;
  };
  setViewport: (el: HTMLElement | null) => void;
  /** True when the last gesture was a drag, so a click can be ignored. */
  didDrag: () => boolean;
}

export function useLoopTrack(count: number, options: LoopTrackOptions = {}): LoopTrack {
  const { response = 0.5, decelerationRate = 0.992, maxPagesPerFlick = 1 } = options;
  const reduced = useReducedMotion();

  const [x, setX] = useState(0);
  const [page, setPage] = useState(0);
  const [dragging, setDragging] = useState(false);

  const viewportRef = useRef<HTMLElement | null>(null);
  const widthRef = useRef(1);
  const xRef = useRef(0);
  const velRef = useRef(0);
  const frameRef = useRef(0);
  const targetRef = useRef(0);
  /** The virtual index — unbounded during a gesture, folded back on settle. */
  const viRef = useRef(count);
  const movedRef = useRef(false);
  const countRef = useRef(count);
  countRef.current = count;

  const setViewport = useCallback((el: HTMLElement | null) => {
    viewportRef.current = el;
    if (el) widthRef.current = el.clientWidth || 1;
  }, []);

  /** Put the offset where the current virtual index says, with no animation. */
  const settleAt = useCallback((vi: number) => {
    const at = -vi * widthRef.current;
    xRef.current = at;
    targetRef.current = at;
    setX(at);
  }, []);

  useEffect(() => {
    const measure = () => {
      const el = viewportRef.current;
      if (!el) return;
      widthRef.current = el.clientWidth || 1;
      settleAt(viRef.current);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [settleAt]);

  /* Start in the middle copy whenever the list length changes. */
  useEffect(() => {
    viRef.current = count;
    setPage(0);
    settleAt(count);
  }, [count, settleAt]);

  const stop = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
  }, []);

  /**
   * Fold the virtual index back into the middle copy.
   *
   * Called only once the spring has come to rest, and only ever by a whole
   * number of copies, so the offset it jumps to is showing the same pixels it
   * was already showing.
   */
  const normalise = useCallback(() => {
    const n = countRef.current;
    if (n < 1) return;
    let vi = viRef.current;
    while (vi >= 2 * n) vi -= n;
    while (vi < n) vi += n;
    if (vi === viRef.current) return;
    viRef.current = vi;
    settleAt(vi);
  }, [settleAt]);

  /** Critically damped spring, run from the live value. */
  const springTo = useCallback(
    (target: number, initialVelocity = 0) => {
      stop();
      targetRef.current = target;

      if (reduced) {
        xRef.current = target;
        velRef.current = 0;
        setX(target);
        normalise();
        return;
      }

      velRef.current = initialVelocity;
      const omega = (2 * Math.PI) / response;
      let last = performance.now();

      const tick = (now: number) => {
        const dt = Math.min(0.032, (now - last) / 1000);
        last = now;

        const displacement = xRef.current - targetRef.current;
        const accel = -2 * omega * velRef.current - omega * omega * displacement;
        velRef.current += accel * dt;
        xRef.current += velRef.current * dt;

        if (Math.abs(xRef.current - targetRef.current) < 0.4 && Math.abs(velRef.current) < 12) {
          xRef.current = targetRef.current;
          velRef.current = 0;
          setX(xRef.current);
          frameRef.current = 0;
          // the fold happens here, where nothing is moving to give it away
          normalise();
          return;
        }

        setX(xRef.current);
        frameRef.current = requestAnimationFrame(tick);
      };

      frameRef.current = requestAnimationFrame(tick);
    },
    [normalise, reduced, response, stop]
  );

  /** Travel to a virtual index. No clamp — that is the whole point. */
  const goToVirtual = useCallback(
    (vi: number, velocity = 0) => {
      viRef.current = vi;
      const n = countRef.current;
      setPage(n > 0 ? ((vi % n) + n) % n : 0);
      springTo(-vi * widthRef.current, velocity);
    },
    [springTo]
  );

  const goTo = useCallback(
    (target: number) => {
      const n = countRef.current;
      if (n < 1) return;
      const here = viRef.current;
      const current = ((here % n) + n) % n;
      /* The shortest way round, so picking the first dot from the last slide
         steps forward by one rather than winding all the way back. */
      let delta = (((target - current) % n) + n) % n;
      if (delta > n / 2) delta -= n;
      goToVirtual(here + delta);
    },
    [goToVirtual]
  );

  const onPointerDown = useCallback(
    (e: { pointerId: number; clientX: number; currentTarget: Element }) => {
      if (countRef.current < 2) return;
      const el = e.currentTarget as HTMLElement;
      stop();
      setDragging(true);

      const startX = e.clientX;
      const startOffset = xRef.current;
      const width = widthRef.current;
      const startVi = viRef.current;

      let history: Array<{ t: number; x: number }> = [{ t: performance.now(), x: startX }];
      let moved = false;
      movedRef.current = false;

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        if (!moved && Math.abs(dx) < 8) return;

        if (!moved) {
          /* Capture only once the gesture is really a drag. A captured
             pointer retargets its click to the capture element, so taking it
             on the press would stop any tile inside the track being opened. */
          try {
            el.setPointerCapture(ev.pointerId);
          } catch {
            /* capture is a nicety; moves still bubble here without it */
          }
        }

        moved = true;
        movedRef.current = true;

        // no clamp and no rubber-band: there is no edge to resist at
        xRef.current = startOffset + dx;
        setX(xRef.current);

        const now = performance.now();
        history.push({ t: now, x: ev.clientX });
        history = history.filter((h) => now - h.t < 90);
      };

      const onUp = (ev: PointerEvent) => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onUp);
        el.removeEventListener("pointercancel", onUp);
        try {
          el.releasePointerCapture(ev.pointerId);
        } catch {
          /* already released */
        }
        setDragging(false);
        if (!moved) return;

        const now = performance.now();
        const first = history[0];
        const dt = Math.max(1, now - first.t);
        const velocity = ((ev.clientX - first.x) / dt) * 1000; // px/s

        const projected = xRef.current + project(velocity, decelerationRate);
        let target = Math.round(-projected / width);
        // one flick may cross at most maxPagesPerFlick slides
        const delta = Math.max(
          -maxPagesPerFlick,
          Math.min(maxPagesPerFlick, target - startVi)
        );
        target = startVi + delta;

        goToVirtual(target, velocity);
      };

      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointercancel", onUp);
    },
    [decelerationRate, goToVirtual, maxPagesPerFlick, stop]
  );

  useEffect(() => stop, [stop]);

  return {
    x,
    page,
    dragging,
    goTo,
    next: () => goToVirtual(viRef.current + 1),
    prev: () => goToVirtual(viRef.current - 1),
    handlers: { onPointerDown },
    setViewport,
    didDrag: () => movedRef.current,
  };
}
