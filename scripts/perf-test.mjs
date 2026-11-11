import { chromium } from "@playwright/test";

const TARGET_URL = process.env.TARGET_URL || "https://ticoolture.vn";

const ROUTES = [
  { name: "Homepage", path: "/" },
  { name: "Products", path: "/products" },
  { name: "Stores", path: "/stores" },
];

async function testRoute(browser, route, isMobile = false) {
  const context = await browser.newContext({
    viewport: isMobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    userAgent: isMobile
      ? "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"
      : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    deviceScaleFactor: isMobile ? 3 : 1,
    isMobile: isMobile,
    hasTouch: isMobile,
  });

  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  // Strictly disable cache so it's a 100% fresh new visitor
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await context.clearCookies();

  const consoleLogs = [];
  page.on("console", (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
    });
  });

  page.on("pageerror", (err) => {
    consoleLogs.push({
      type: "pageerror",
      text: err.message,
      stack: err.stack,
    });
  });

  const networkRequests = [];
  page.on("requestfinished", async (req) => {
    try {
      const res = await req.response();
      const timing = req.timing();
      const headers = res ? res.headers() : {};
      const contentLength = headers["content-length"] ? parseInt(headers["content-length"], 10) : 0;
      networkRequests.push({
        url: req.url(),
        method: req.method(),
        resourceType: req.resourceType(),
        status: res ? res.status() : 0,
        contentLength,
        duration: timing ? Math.round(timing.responseEnd) : null,
      });
    } catch (e) {
      // ignore
    }
  });

  page.on("requestfailed", (req) => {
    networkRequests.push({
      url: req.url(),
      method: req.method(),
      resourceType: req.resourceType(),
      status: "FAILED",
      error: req.failure()?.errorText || "unknown",
    });
  });

  const url = `${TARGET_URL}${route.path}`;
  const startNavigation = Date.now();
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  const totalNavigationTime = Date.now() - startNavigation;

  // Measure Web Vitals & Navigation Timings via PerformanceObserver
  const metrics = await page.evaluate(async () => {
    return new Promise((resolve) => {
      let lcp = null;
      let fcp = null;
      let cls = 0;

      const po = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.entryType === "paint" && entry.name === "first-contentful-paint") {
            fcp = Math.round(entry.startTime);
          }
          if (entry.entryType === "largest-contentful-paint") {
            lcp = {
              startTime: Math.round(entry.startTime),
              size: entry.size,
              element: entry.element ? entry.element.tagName + (entry.element.className ? `.${entry.element.className.replace(/\s+/g, ".")}` : "") : null,
              url: entry.url || null,
            };
          }
          if (entry.entryType === "layout-shift" && !entry.hadRecentInput) {
            cls += entry.value;
          }
        }
      });

      try {
        po.observe({ type: "paint", buffered: true });
        po.observe({ type: "largest-contentful-paint", buffered: true });
        po.observe({ type: "layout-shift", buffered: true });
      } catch (e) {}

      setTimeout(() => {
        const navEntries = performance.getEntriesByType("navigation");
        const nav = navEntries.length ? navEntries[0] : null;
        resolve({
          ttfb: nav ? Math.round(nav.responseStart - nav.requestStart) : null,
          domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
          loadEvent: nav ? Math.round(nav.loadEventEnd) : null,
          fcp,
          lcp,
          cls: Number(cls.toFixed(4)),
        });
      }, 500);
    });
  });

  await context.close();

  return {
    route: route.name,
    path: route.path,
    device: isMobile ? "Mobile (iPhone 14)" : "Desktop (1440x900)",
    totalNavigationTime,
    metrics,
    consoleLogs,
    networkRequests,
  };
}

async function main() {
  console.log(`Starting Performance Audit on: ${TARGET_URL} (No Cache / Fresh User)...`);
  const browser = await chromium.launch({ channel: "msedge", headless: true });

  const results = [];

  for (const route of ROUTES) {
    console.log(`Testing Desktop: ${route.name}...`);
    const deskRes = await testRoute(browser, route, false);
    results.push(deskRes);

    console.log(`Testing Mobile: ${route.name}...`);
    const mobRes = await testRoute(browser, route, true);
    results.push(mobRes);
  }

  await browser.close();

  // Print Summary
  console.log("\n==================== PERFORMANCE REPORT SUMMARY ====================");
  for (const res of results) {
    console.log(`\n--- [${res.device}] ${res.route} (${res.path}) ---`);
    console.log(`  Total Navigation Time: ${res.totalNavigationTime}ms`);
    console.log(`  TTFB: ${res.metrics.ttfb}ms | DCL: ${res.metrics.domContentLoaded}ms | Load: ${res.metrics.loadEvent}ms`);
    console.log(`  FCP: ${res.metrics.fcp}ms | LCP: ${res.metrics.lcp ? res.metrics.lcp.startTime + "ms" : "N/A"}`);
    if (res.metrics.lcp) {
      console.log(`    LCP Element: ${res.metrics.lcp.element || "N/A"}`);
      console.log(`    LCP Url: ${res.metrics.lcp.url || "none"}`);
    }
    console.log(`  CLS: ${res.metrics.cls}`);

    const reqs = res.networkRequests;
    const totalRequests = reqs.length;
    let totalBytes = 0;
    const byType = {};
    const apiCalls = [];

    for (const r of reqs) {
      const type = r.resourceType || "other";
      byType[type] = (byType[type] || 0) + 1;
      totalBytes += r.contentLength || 0;
      if (r.url.includes("supabase.co") || r.url.includes("/api/")) {
        apiCalls.push({ url: r.url.substring(0, 80) + "...", status: r.status, duration: r.duration });
      }
    }

    console.log(`  Requests: ${totalRequests} total | Total Body Size: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Breakdown by type:`, byType);

    if (apiCalls.length > 0) {
      console.log(`  Supabase / API Calls (${apiCalls.length}):`);
      apiCalls.forEach((api) => console.log(`    - [${api.status}] ${api.url} (${api.duration}ms)`));
    }

    const failed = reqs.filter((r) => r.status === "FAILED" || (typeof r.status === "number" && r.status >= 400));
    if (failed.length > 0) {
      console.log(`  ⚠️ FAILED / ERROR REQUESTS (${failed.length}):`);
      failed.forEach((f) => console.log(`    - [${f.status}] ${f.url} : ${f.error || ""}`));
    } else {
      console.log(`  ✅ Failed Requests: 0`);
    }

    const errors = res.consoleLogs.filter((l) => l.type === "error" || l.type === "pageerror");
    if (errors.length > 0) {
      console.log(`  ⚠️ CONSOLE ERRORS (${errors.length}):`);
      errors.forEach((e) => console.log(`    - [${e.type}] ${e.text}`));
    } else {
      console.log(`  ✅ Console Errors: 0`);
    }
  }
}

main().catch(console.error);
