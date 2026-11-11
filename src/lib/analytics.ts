import { TrackingPayload, OutboundPlatform } from "../types";

const VISITED_KEY = "ti_visited_before";

/**
 * Detects device category from window viewport width.
 */
export function getDeviceType(): "mobile" | "desktop" | "tablet" {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width <= 1024) return "tablet";
  return "desktop";
}

/**
 * Categorizes referrer host into high-level acquisition channels.
 */
export function getReferrerSource(): "organic" | "social" | "direct" | "referral" | "other" {
  if (typeof window === "undefined" || !document.referrer) return "direct";

  try {
    const refUrl = new URL(document.referrer);
    const host = refUrl.hostname.toLowerCase();
    const curHost = window.location.hostname.toLowerCase();

    if (host === curHost) return "direct";

    // Search engines
    if (
      host.includes("google") ||
      host.includes("bing") ||
      host.includes("yahoo") ||
      host.includes("duckduckgo") ||
      host.includes("coccoc")
    ) {
      return "organic";
    }

    // Social networks
    if (
      host.includes("facebook") ||
      host.includes("instagram") ||
      host.includes("tiktok") ||
      host.includes("threads") ||
      host.includes("twitter") ||
      host.includes("x.com") ||
      host.includes("t.co") ||
      host.includes("zalo") ||
      host.includes("youtube")
    ) {
      return "social";
    }

    return "referral";
  } catch {
    return "other";
  }
}

/**
 * Checks if the browser has visited Tí Coolture before.
 * Completely client-side, zero personal identifier or IP transmission.
 */
export function checkIsNewVisitor(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const hasVisited = localStorage.getItem(VISITED_KEY);
    if (!hasVisited) {
      localStorage.setItem(VISITED_KEY, "1");
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Dispatches an anonymous tracking event via navigator.sendBeacon or fetch with keepalive.
 * Fire-and-forget: never throws or blocks UI thread.
 */
export function sendTrackingEvent(event: Partial<TrackingPayload> & { type: TrackingPayload["type"] }): void {
  if (typeof window === "undefined") return;

  try {
    const payload: TrackingPayload = {
      deviceType: getDeviceType(),
      referrerSource: getReferrerSource(),
      isNewVisitor: checkIsNewVisitor(),
      ...event,
    };

    const endpoint = "/api/analytics?action=track";
    const body = JSON.stringify(payload);

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      const sent = navigator.sendBeacon(endpoint, blob);
      if (sent) return;
    }

    // Fallback to fetch with keepalive
    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
      keepalive: true,
    }).catch(() => {
      // Intentionally ignore network errors for tracking
    });
  } catch {
    // Fail silently to never degrade user experience
  }
}

// ============ CONVENIENCE HELPERS ============

let lastTrackedPath = "";

export function trackPageView(targetUrl?: string): void {
  const currentPath = targetUrl || (typeof window !== "undefined" ? window.location.pathname : "");
  // Debounce consecutive calls to the same route within a tick
  if (currentPath && currentPath === lastTrackedPath) return;
  lastTrackedPath = currentPath;

  sendTrackingEvent({
    type: "page_view",
    targetUrl: currentPath,
  });
}

export function trackProductView(productId: string, shopId?: string): void {
  if (!productId) return;
  sendTrackingEvent({
    type: "product_view",
    productId,
    shopId,
  });
}

export function trackShopView(shopId: string): void {
  if (!shopId) return;
  sendTrackingEvent({
    type: "shop_view",
    shopId,
  });
}

export function trackWishlistToggle(productId: string, delta: 1 | -1): void {
  if (!productId) return;
  sendTrackingEvent({
    type: "wishlist_toggle",
    productId,
    favoriteDelta: delta,
  });
}

export function trackOutboundClick(
  shopId: string,
  platform: OutboundPlatform,
  targetUrl?: string,
  productId?: string
): void {
  if (!shopId) return;
  sendTrackingEvent({
    type: "outbound_click",
    shopId,
    platform,
    targetUrl,
    productId,
  });
}

export function trackSearchQuery(searchQuery: string): void {
  const cleaned = searchQuery.trim();
  if (!cleaned || cleaned.length < 2) return;
  sendTrackingEvent({
    type: "search_query",
    searchQuery: cleaned,
  });
}
