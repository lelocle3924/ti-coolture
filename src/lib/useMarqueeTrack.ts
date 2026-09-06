import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useAutoHideChrome";

/* ═══════════════════════════════════════════════════════════════════════════
   A lane that drifts on its own AND can be grabbed.

   Team feedback: "Thao tác vuốt ở What's in store trên PC chưa ổn." It was
   not unpolished — it did not exist. What's in store was a pure CSS marquee
   (`.lab-marquee`, animation from 0 to -50%) inside an `overflow-hidden` box:
   nothing to drag, nothing to wheel, and a hover that froze the lane under
   the cursor with no way to move it yourself. On a phone the same lane could
   not be swiped either.

   The problem the CSS version cannot solve is that a keyframe animation owns
   the transform outright. You cannot add a pointer offset to it, so drag and
   drift cannot coexist — which is why this takes the transform over and
   drives it from one rAF loop instead.

   The rules are the ones useDragTrack already follows (Apple, "Designing
   Fluid Interfaces"), minus paging — a marquee has no pages to land on:

     · 1:1 tracking while held, from wherever the lane happens to be.
     · Velocity handoff on release: the flick's own speed becomes the lane's,
       so there is no seam between dragging and coasting.
     · The coast decays back into the ambient drift rather than to a stop, so
       the lane returns to what it was doing instead of dying under your hand.
     · Endless in both directions: the offset wraps modulo one copy's width,
       so a hard flick backwards is as valid as one forwards.

   The transform is written straight to the node, never through React state.
   Two lanes at 60fps would otherwise re-render the whole section — including
   every product tile — sixty times a second, which is exactly the cost the
   CSS version was avoiding by staying on the compositor.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface MarqueeTrack {
  /** The element that moves. Holds two copies of the lane's contents. */
  trackRef: (el: HTMLDivElement | null) => void;
  /** One copy of the contents. Its width is the distance the loop repeats over. */
  spanRef: (el: HTMLDivElement | null) => void;
  /** Spread onto the element that owns the gesture. */
  handlers: {
    onPointerDown: (e: { pointerId: number; clientX: number; currentTarget: Element }) => void;
  };
  dragging: boolean;
  /** True when the last gesture moved the lane, so a click can be ignored. */
  didDrag: () => boolean;
}

export function useMarqueeTrack({
  /** Ambient speed in px/s. Positive drifts the contents left. */
  speed,
  /** Held still — hover, or focus inside the lane. */
  paused = false,
}: {
  speed: number;
  paused?: boolean;
}): MarqueeTrack {
  const reduced = useReducedMotion();
  const [dragging, setDragging] = useState(false);

  const trackEl = useRef<HTMLDivElement | null>(null);
  const spanEl = useRef<HTMLDivElement | null>(null);

  /* How far the lane has travelled, in px, always kept inside one copy's
     width so it never grows large enough to lose float precision. */
  const offset = useRef(0);
  const velocity = useRef(0);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const pausedRef = useRef(paused);
  const speedRef = useRef(speed);
  const reducedRef = useRef(reduced);

  pausedRef.current = paused;
  speedRef.current = speed;
  reducedRef.current = reduced;

  const trackRef = useCallback((el: HTMLDivElement | null) => {
    trackEl.current = el;
  }, []);
  const spanRef = useCallback((el: HTMLDivElement | null) => {
    spanEl.current = el;
  }, []);

  /* One loop for the life of the lane. It is cheap when nothing is happening
     — a width read and a transform write — and it is the only place the
     transform is ever set, so drag and drift can never fight over it. */
  useEffect(() => {
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const span = spanEl.current?.offsetWidth ?? 0;

      if (!draggingRef.current && span > 0) {
        const drift = reducedRef.current || pausedRef.current ? 0 : speedRef.current;

        /* Coast, then rejoin the drift. The residue of the flick decays with
           a time constant of ~0.28s; what is left underneath it is the lane's
           own speed, so a flick fades back into the drift rather than into a
           stop. Reduced motion has no drift to rejoin, so it decays to rest. */
        velocity.current = drift + (velocity.current - drift) * Math.exp(-dt / 0.28);
        if (Math.abs(velocity.current - drift) < 0.5) velocity.current = drift;

        offset.current += velocity.current * dt;
      }

      if (span > 0) {
        // wrap into [0, span) so the second copy always covers the seam
        offset.current = ((offset.current % span) + span) % span;
        const node = trackEl.current;
        if (node) node.style.transform = `translate3d(${-offset.current}px, 0, 0)`;
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const onPointerDown = useCallback(
    (e: { pointerId: number; clientX: number; currentTarget: Element }) => {
      const el = e.currentTarget as HTMLElement;
      const startX = e.clientX;
      const startOffset = offset.current;

      draggingRef.current = true;
      movedRef.current = false;
      setDragging(true);
      velocity.current = 0;

      /* Short history, so the release velocity reflects the last few
         milliseconds rather than the whole gesture. */
      let history: Array<{ t: number; x: number }> = [{ t: performance.now(), x: startX }];
      let moved = false;

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        if (!moved && Math.abs(dx) < 8) return; // hysteresis before committing

        if (!moved) {
          /* Capture only once the gesture is really a drag, never on the
             press itself. A captured pointer retargets its `click` to the
             capture element, so capturing at pointerdown would send every
             click to this lane instead of to the tile under the finger —
             the tiles would stop opening. Deferring it past the 8px
             threshold means a tap is an ordinary click on the tile, and a
             drag is the only thing the lane swallows. */
          try {
            el.setPointerCapture(ev.pointerId);
          } catch {
            /* capture is a nicety; moves still bubble here without it */
          }
        }

        moved = true;
        movedRef.current = true;

        // dragging right (dx > 0) pulls the contents back, so offset falls
        offset.current = startOffset - dx;

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
        draggingRef.current = false;
        setDragging(false);

        if (!moved) return;

        const now = performance.now();
        const first = history[0];
        const dt = Math.max(1, now - first.t);
        const pointerVelocity = ((ev.clientX - first.x) / dt) * 1000; // px/s

        /* Capped: a hard flick on a trackpad reports several thousand px/s,
           and a lane that crosses its whole contents in one coast reads as a
           glitch rather than as momentum. */
        velocity.current = Math.max(-2600, Math.min(2600, -pointerVelocity));
      };

      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointercancel", onUp);
    },
    []
  );

  return {
    trackRef,
    spanRef,
    handlers: { onPointerDown },
    dragging,
    didDrag: () => movedRef.current,
  };
}
