/**
 * Labelled placeholder block, per docs/03-CONTENT-PACK.md Part C.
 *
 * docs/01-ART-DIRECTION-BRIEF.md §8 bans stock photography outright, so an
 * unfilled image slot renders as a --paper-warm block carrying its ratio
 * label rather than a borrowed photo.
 *
 * Lifted out of seed.ts so the catalogue extension can use it without the
 * two modules importing each other.
 */
export function placeholderImage(
  label: string,
  ratio: "1:1" | "21:9" | "3:2" = "1:1"
): string {
  const [w, h] = ratio === "1:1" ? [1200, 1200] : ratio === "21:9" ? [2100, 900] : [1600, 1067];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
<rect width="${w}" height="${h}" fill="#FAF8FF"/>
<rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="none" stroke="#12081F" stroke-opacity=".12" stroke-width="2"/>
<path d="M0 ${h * 0.62}c${w * 0.18} -${h * 0.09} ${w * 0.3} ${h * 0.07} ${w * 0.47} ${h * 0.02}s${w * 0.28} -${h * 0.09} ${w * 0.53} -${h * 0.02}" fill="none" stroke="#39D6CF" stroke-width="${Math.round(w / 90)}"/>
<text x="50%" y="46%" text-anchor="middle" fill="#12081F" fill-opacity=".55" font-family="Alexandria, sans-serif" font-size="${Math.round(w / 26)}" letter-spacing="${w / 300}">${label}</text>
<text x="50%" y="53%" text-anchor="middle" fill="#12081F" fill-opacity=".35" font-family="Alexandria, sans-serif" font-size="${Math.round(w / 38)}">${w}×${h}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
