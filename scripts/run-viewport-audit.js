/**
 * Run the viewport audit against a running dev server.
 *
 *   npm run dev        # in one terminal
 *   node scripts/run-viewport-audit.js
 *
 * Reports any page that scrolls sideways, or any viewport-locked section whose
 * own content does not fit inside it — the failure that looked fine on a
 * MacBook and clipped on shorter Windows laptops (see devlog/2026-08-26.md).
 */
const { chromium } = require("playwright");
const { SIZES, PAGES, PROBE } = require("./viewport-audit.js");

const BASE = "http://localhost:5173";

(async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage();
  const findings = [];

  for (const size of SIZES) {
    await page.setViewportSize({ width: size.w, height: size.h });
    for (const p of PAGES) {
      await page.goto(BASE + p.path, { waitUntil: "networkidle" }).catch(() => {});
      await page.waitForTimeout(320);
      let problems = [];
      try {
        problems = await page.evaluate(PROBE);
      } catch (e) {
        problems = [{ kind: "probe-error", detail: String(e).slice(0, 120) }];
      }
      for (const pr of problems) {
        findings.push({ size: size.name, page: p.name, ...pr });
      }
    }
  }

  await browser.close();

  if (!findings.length) {
    console.log("CLEAN — no overflow at any size.");
    return;
  }

  const byKind = {};
  for (const f of findings) (byKind[f.kind] ||= []).push(f);

  for (const [kind, rows] of Object.entries(byKind)) {
    console.log("\n=== " + kind + " (" + rows.length + ") ===");
    for (const r of rows.slice(0, 40)) {
      console.log(`  ${r.size.padEnd(20)} ${r.page.padEnd(11)} ${r.detail}`);
      if (r.who) r.who.forEach((w) => console.log("      · " + w));
    }
    if (rows.length > 40) console.log(`  … ${rows.length - 40} more`);
  }
})();
