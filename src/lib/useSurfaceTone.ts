import { useEffect, useState, type RefObject } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   What kind of ground is currently under the floating header.

   Team feedback (26/08): the pill blurs whatever is behind it, so it has to
   pick its own material and its own logo colours from that ground — teal and
   white over a dark one, the mark's original teal and violet over a light one.

   Why sections declare their tone rather than the header sampling pixels:
   the white ground on /products, /stores and /discover is not a background
   colour at all. It is the ContinuousWave SVG and PaperBackgroundExtender,
   both `pointer-events-none` and both painted over a `bg-brand` parent. Hit
   testing (elementFromPoint) skips pointer-events:none elements, so it would
   report violet the whole way down the page and the pill would never turn.
   Reading a computed background-color has the same problem from the other
   side — it would find the violet parent.

   So a section that owns a ground says so with `data-surface="light|dark"`,
   and this walks those rects against the pill's own middle. Explicit, cheap,
   and it reads correctly over photographs and SVG grounds alike.

   Unannotated pages fall back to `dark`, which is what every page looked like
   before this existed.
   ═══════════════════════════════════════════════════════════════════════════ */

export type SurfaceTone = "light" | "dark";

export function useSurfaceTone(
  probeRef: RefObject<HTMLElement | null>,
  fallback: SurfaceTone = "dark"
): SurfaceTone {
  const [tone, setTone] = useState<SurfaceTone>(fallback);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const probe = probeRef.current;
      if (!probe) return;

      /* The pill's own middle, measured rather than assumed — the bar sits at
         a different offset on mobile and moves while it hides — plus a lead.

         Motion proposal 07 (approved 31/08): the tone has to follow the
         ground, not a clock. Probing exactly at the middle means the swap
         begins only once the boundary is already halfway across the pill, and
         with a colour transition on top of that the contrast is briefly wrong
         in the worst way — violet type on a dark ground. Probing 40px ahead of
         the middle starts the change before the boundary arrives, so the
         transition finishes about when the eye says it should. */
      const box = probe.getBoundingClientRect();
      const LEAD = 40;
      const y = box.top + box.height / 2 + LEAD;

      let found: SurfaceTone | null = null;

      for (const el of document.querySelectorAll<HTMLElement>("[data-surface]")) {
        const value = el.dataset.surface;
        if (value !== "light" && value !== "dark") continue;
        // never read the header's own material as if it were the ground
        if (probe.contains(el) || el.contains(probe)) continue;

        const rect = el.getBoundingClientRect();
        if (rect.height === 0) continue;
        // last match in document order wins, so a nested ground beats its parent
        if (y >= rect.top && y < rect.bottom) found = value;
      }

      setTone(found ?? fallback);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    /* Grounds arrive after their data does — the catalogue on /products only
       exists once fetchProducts resolves — so re-probe when the tree changes.
       Every path funnels through the same rAF, so a burst of mutations costs
       one measurement. */
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, [probeRef, fallback]);

  return tone;
}
