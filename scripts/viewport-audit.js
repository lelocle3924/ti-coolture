/**
 * Viewport audit — runs the site at a matrix of real device sizes and reports
 * anything that overflows.
 *
 * Two classes of failure are checked:
 *   · horizontal — document wider than the viewport (a sideways scrollbar)
 *   · vertical   — a section that pins itself to the viewport height whose own
 *                  content is taller than that, so the bottom is unreachable
 *
 * The second is the one the team reported: it looks right on a 1440x900
 * MacBook and clips on a shorter Windows laptop.
 */

const SIZES = [
  // desktop / laptop — content-area heights, i.e. after browser chrome
  { name: "1920x1080 @100%", w: 1920, h: 960 },
  { name: "1920x1080 @125%", w: 1536, h: 760 },
  { name: "1920x1080 @150%", w: 1280, h: 620 },
  { name: "1600x900", w: 1600, h: 772 },
  { name: "1536x864", w: 1536, h: 738 },
  { name: "1440x900 MacBook", w: 1440, h: 790 },
  { name: "1366x768", w: 1366, h: 640 },
  { name: "1280x800", w: 1280, h: 672 },
  { name: "1280x720", w: 1280, h: 592 },
  // tablets
  { name: "iPad landscape", w: 1024, h: 700 },
  { name: "iPad Air portrait", w: 820, h: 1080 },
  { name: "iPad mini portrait", w: 768, h: 950 },
  // phones
  { name: "iPhone Pro Max", w: 430, h: 830 },
  { name: "Pixel 7", w: 412, h: 810 },
  { name: "iPhone 14/15", w: 390, h: 750 },
  { name: "Galaxy S", w: 360, h: 700 },
  { name: "iPhone SE", w: 375, h: 560 },
];

const PAGES = [
  { name: "home", path: "/" },
  { name: "products", path: "/products" },
  { name: "product", path: "/products/prod-dia-men-ran-song-nuoc" },
  { name: "stores", path: "/stores" },
  { name: "shop", path: "/stores/shop-gom-mu-u" },
  { name: "about", path: "/about" },
  { name: "open-shop", path: "/open-shop" },
  { name: "discover", path: "/discover" },
];

/** Runs inside the page. Returns every overflow it can see. */
const PROBE = `(() => {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const problems = [];

  // horizontal: does the document scroll sideways?
  const docW = document.documentElement.scrollWidth;
  if (docW > vw + 1) {
    // find the widest offenders so the report names something fixable
    const wide = [...document.querySelectorAll('body *')]
      .map(el => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && (r.right > vw + 1 || r.left < -1))
      .filter(({ el }) => getComputedStyle(el).position !== 'fixed')
      .slice(0, 3)
      .map(({ el, r }) => el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ').slice(0,3).join('.') + ' [' + Math.round(r.left) + '→' + Math.round(r.right) + ']');
    problems.push({ kind: 'horizontal', detail: 'doc ' + docW + 'px > viewport ' + vw + 'px', who: wide });
  }

  // vertical: a viewport-locked box whose content does not fit inside it
  const locked = [...document.querySelectorAll('body *')].filter(el => {
    if (el.hasAttribute('data-camera-window')) return false;
    const cs = getComputedStyle(el);
    const h = el.getBoundingClientRect().height;
    // sticky/pinned panes and anything sized to ~the viewport
    return (cs.position === 'sticky' || cs.position === 'fixed' || Math.abs(h - vh) < 2) && h > vh * 0.85;
  });

  for (const el of locked) {
    if (el.scrollHeight > el.clientHeight + 2 && getComputedStyle(el).overflowY === 'hidden') {
      problems.push({
        kind: 'vertical-clipped',
        detail: el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ').slice(0,3).join('.') +
          ' content ' + el.scrollHeight + 'px in ' + el.clientHeight + 'px',
      });
    }
  }

  // any element whose bottom is below the fold *inside* a pinned pane
  for (const el of locked) {
    const box = el.getBoundingClientRect();
    for (const kid of el.children) {
      const k = kid.getBoundingClientRect();
      if (k.height > 0 && k.bottom > box.bottom + 2) {
        problems.push({
          kind: 'vertical-spill',
          detail: (kid.tagName.toLowerCase()) + ' spills ' + Math.round(k.bottom - box.bottom) + 'px past its pinned parent',
        });
        break;
      }
    }
  }

  return problems;
})()`;

module.exports = { SIZES, PAGES, PROBE };
