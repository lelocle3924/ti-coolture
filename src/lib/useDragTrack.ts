import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useAutoHideChrome";

/* ═══════════════════════════════════════════════════════════════════════════
   A draggable, flickable track — pointer, touch, or buttons.

   Built to the rules in Apple's "Designing Fluid Interfaces":

     · 1:1 tracking. The track stays glued to the pointer for the whole
       gesture, offset from wherever it was grabbed. Pointer capture keeps it
       tracking after the pointer leaves the element.
     · Velocity handoff. The spring starts at the pointer's release velocity,
       so there is no seam between dragging and animating.
     · Momentum projection. The landing page is chosen from where the flick is
       *going*, using the exponential-decay projection Apple ships, not from
       where the finger happened to leave the glass.
     · Interruptible. Every animation runs from the live on-screen value, so a
       moving track can be grabbed mid-flight and reversed without a jump.
     · Rubber-banding. Past the first and last page the track still follows,
       with progressive resistance, instead of hitting a wall.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Apple's projection: where a flick comes to rest. */
function project(velocity: number, decelerationRate = 0.998): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** Progressive resistance past an edge. */
function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

export interface DragTrackOptions {
  /**
   * Spring response in seconds — the time the landing takes to resolve.
   * Higher is calmer. Default 0.42, which is the value every track shipped
   * with until 31/08.
   */
  response?: number;
  /**
   * Apple's deceleration rate, fed to the momentum projection. The projection
   * is velocity/1000 * r / (1 - r), so the default 0.998 multiplies release
   * velocity by ~0.5 and a hard flick throws the track a long way. Lower
   * values shorten the throw sharply.
   */
  decelerationRate?: number;
  /**
   * Cap on how many pages a single flick may cross. Without it a fast swipe
   * can skip several pages, which is the part that reads as the track
   * "drifting" past you rather than following you.
   */
  maxPagesPerFlick?: number;
}

export interface DragTrack {
  /** Current offset in px; negative moves the track left. */
  x: number;
  /** Page currently settled on / heading to. */
  page: number;
  dragging: boolean;
  goTo: (page: number) => void;
  next: () => void;
  prev: () => void;
  /** Spread onto the draggable element. */
  handlers: {
    onPointerDown: (e: { pointerId: number; clientX: number; currentTarget: Element }) => void;
  };
  /** Attach to the element that owns the gesture. */
  setViewport: (el: HTMLElement | null) => void;
  /** True when the last gesture was a drag, so a click can be ignored. */
  didDrag: () => boolean;
}

export function useDragTrack(pageCount: number, options: DragTrackOptions = {}): DragTrack {
  const {
    response = 0.42,
    decelerationRate = 0.998,
    maxPagesPerFlick = Infinity,
  } = options;

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
  const pageRef = useRef(0);
  const movedRef = useRef(false);

  const setViewport = useCallback((el: HTMLElement | null) => {
    viewportRef.current = el;
    if (el) widthRef.current = el.clientWidth || 1;
  }, []);

  useEffect(() => {
    const measure = () => {
      const el = viewportRef.current;
      if (!el) return;
      widthRef.current = el.clientWidth || 1;
      // keep the settled page pinned to its slot when the viewport resizes
      const snapped = -pageRef.current * widthRef.current;
      xRef.current = snapped;
      targetRef.current = snapped;
      setX(snapped);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const stop = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
  }, []);

  /** Critically damped spring, run from the live value. Response per options. */
  const springTo = useCallback(
    (target: number, initialVelocity = 0) => {
      stop();
      targetRef.current = target;

      if (reduced) {
        xRef.current = target;
        velRef.current = 0;
        setX(target);
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
          return;
        }

        setX(xRef.current);
        frameRef.current = requestAnimationFrame(tick);
      };

      frameRef.current = requestAnimationFrame(tick);
    },
    [reduced, response, stop]
  );

  const goTo = useCallback(
    (next: number, velocity = 0) => {
      const clamped = Math.max(0, Math.min(pageCount - 1, next));
      pageRef.current = clamped;
      setPage(clamped);
      springTo(-clamped * widthRef.current, velocity);
    },
    [pageCount, springTo]
  );

  const onPointerDown = useCallback(
    (e: { pointerId: number; clientX: number; currentTarget: Element }) => {
      const el = e.currentTarget as HTMLElement;
      // Grab a moving track from wherever it is right now — never from target.
      stop();
      setDragging(true);

      const startX = e.clientX;
      const startOffset = xRef.current;
      const width = widthRef.current;

      /* Short history, so release velocity reflects the last few milliseconds
         rather than the whole gesture. */
      let history: Array<{ t: number; x: number }> = [{ t: performance.now(), x: startX }];
      let moved = false;
      movedRef.current = false;

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        if (!moved && Math.abs(dx) < 8) return; // hysteresis before committing

        if (!moved) {
          /* Capture is taken here, at the moment the gesture becomes a drag,
             and never on the press itself.

             Per the Pointer Events spec a captured pointer dispatches its
             `click` at the capture element, so capturing on pointerdown sent
             every click inside the viewport to this container instead of to
             the button that was pressed. Nothing inside a track could be
             opened: not a collection card on the homepage, not a pin or an
             island on the district map. Deferring capture past the 8px
             threshold leaves a tap as an ordinary click on its own target,
             while a real drag still gets capture and still has its trailing
             click swallowed by the didDrag() guard callers already use. */
          try {
            el.setPointerCapture(ev.pointerId);
          } catch {
            /* capture is a nicety; moves still bubble here without it */
          }
        }

        moved = true;
        movedRef.current = true;

        let nextX = startOffset + dx;
        const min = -(pageCount - 1) * width;
        const max = 0;
        if (nextX > max) nextX = max + rubberband(nextX - max, width);
        else if (nextX < min) nextX = min - rubberband(min - nextX, width);

        xRef.current = nextX;
        setX(nextX);

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

        // Land where the flick is going, not where the finger stopped.
        const projected = xRef.current + project(velocity, decelerationRate);
        const wanted = Math.round(-projected / width);

        /* ...but no further than the flick is allowed to carry. A track that
           crosses three pages on one swipe stops reading as something you are
           moving and starts reading as something moving on its own. */
        const from = pageRef.current;
        const target = Math.max(
          from - maxPagesPerFlick,
          Math.min(from + maxPagesPerFlick, wanted)
        );
        goTo(target, velocity);
      };

      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointercancel", onUp);
    },
    [decelerationRate, goTo, maxPagesPerFlick, pageCount, stop]
  );

  useEffect(() => stop, [stop]);

  return {
    x,
    page,
    dragging,
    goTo: (p: number) => goTo(p),
    next: () => goTo(pageRef.current + 1),
    prev: () => goTo(pageRef.current - 1),
    handlers: { onPointerDown },
    setViewport,
    didDrag: () => movedRef.current,
  };
}
