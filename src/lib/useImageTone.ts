import { useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   How bright the photograph is, at the edge where a control sits.

   Team 07/09 asked for chevrons on the hero deck with "no button, just the
   stroke", and for the two of them to be able to differ in colour "miễn là dễ
   thấy" — as long as they are easy to see. With no button behind them there is
   no material to guarantee contrast, so the only way to keep a bare stroke
   legible over an arbitrary photograph is to measure the photograph.

   Two things make this exact rather than a guess:

     · The strip measured is the strip that is actually on screen. The deck is
       object-cover, so a box narrower than the source crops the sides; the
       visible source rectangle is derived from the two ratios rather than
       assumed to be the whole image.
     · Only the middle band of the height is sampled, because that is where
       the chevron is. A dark sky over a bright street would otherwise average
       out to nothing useful.

   Every hero image is same-origin (src/assets and /shop-photos), so the
   canvas is readable. If a remote one is ever added the read throws, and the
   fallback is "dark" — a light stroke, which is the safer default over a
   photograph of unknown brightness.
   ═══════════════════════════════════════════════════════════════════════════ */

/** The ground under a control: "dark" wants a light mark on it, and vice versa. */
export type ImageTone = "light" | "dark";

/** Rec. 709 luma of one sRGB pixel, 0–1. */
function luma(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/**
 * Which colour the ground calls for.
 *
 * "light" means a bright ground, which wants the dark chevron.
 *
 * The obvious rule here is the wrong one. Comparing the flat WCAG contrast of
 * white against ink puts the crossover at a ground luminance of about 0.22,
 * which would give a dark arrow to almost every photograph on the page — and
 * it is wrong because the chevron is not a flat colour. It carries a
 * drop-shadow in the opposite tone, so what is actually on screen is a white
 * stroke with a dark halo, or a dark stroke with a light one. A haloed white
 * stroke holds up far past where a bare one stops, which is why every video
 * player and gallery on the web uses one over unknown imagery.
 *
 * So white is the incumbent, and the dark chevron is for grounds that are
 * genuinely bright — the case where even a halo cannot save a white stroke.
 * 0.6 is where that begins: above it the mean is nearer paper than to any
 * mid-tone, and the shop's own photograph is doing the work of a light plate.
 */
function verdict(groundLuma: number): ImageTone {
  return groundLuma > 0.6 ? "light" : "dark";
}

/**
 * Mean brightness of one edge of `img` as it is cropped into a box of
 * `boxRatio`, or null if the pixels cannot be read.
 */
function sampleEdge(
  img: HTMLImageElement,
  boxRatio: number,
  side: "left" | "right"
): number | null {
  const sw = img.naturalWidth;
  const sh = img.naturalHeight;
  if (!sw || !sh) return null;

  const sourceRatio = sw / sh;

  /* What object-cover leaves visible. A box narrower than the source keeps a
     centred band of its width; a box wider keeps a centred band of its
     height. */
  let vx = 0;
  let vy = 0;
  let vw = sw;
  let vh = sh;
  if (boxRatio < sourceRatio) {
    vw = sh * boxRatio;
    vx = (sw - vw) / 2;
  } else {
    vh = sw / boxRatio;
    vy = (sh - vh) / 2;
  }

  /* The chevron's own patch: the outer 18% of the visible width, and the
     middle 40% of its height. */
  const stripW = vw * 0.18;
  const sx = side === "left" ? vx : vx + vw - stripW;
  const sy = vy + vh * 0.3;
  const sHeight = vh * 0.4;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, sx, sy, stripW, sHeight, 0, 0, 8, 8);
    const { data } = ctx.getImageData(0, 0, 8, 8);

    let total = 0;
    for (let i = 0; i < data.length; i += 4) {
      total += luma(data[i], data[i + 1], data[i + 2]);
    }
    return total / (data.length / 4);
  } catch {
    /* tainted canvas — a cross-origin frame was added */
    return null;
  }
}

/**
 * The tone under a control sitting at `side` of `img`.
 *
 * Pass the element, not a URL: the deck already has the image decoded and on
 * screen, and loading a second copy to measure it would double every request.
 */
export function useImageTone(
  img: HTMLImageElement | null,
  boxRatio: number,
  side: "left" | "right",
  /** Changes whenever the frame does, so the measurement is retaken. */
  key: string
): ImageTone {
  const [tone, setTone] = useState<ImageTone>("dark");

  useEffect(() => {
    if (!img) return;
    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      const mean = sampleEdge(img, boxRatio, side);
      setTone(mean === null ? "dark" : verdict(mean));
    };

    if (img.complete && img.naturalWidth > 0) {
      measure();
    } else {
      img.addEventListener("load", measure, { once: true });
    }

    return () => {
      cancelled = true;
      img.removeEventListener("load", measure);
    };
  }, [img, boxRatio, side, key]);

  return tone;
}
