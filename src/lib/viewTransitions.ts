/**
 * View Transitions helpers & identifier generators.
 * Authority: SPEC Continuity Transitions
 */

export function cleanIdent(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "-");
}

export function vtProductImage(productId: string): string {
  return `product-${cleanIdent(productId)}`;
}

export function vtShopLogo(shopId: string): string {
  return `shop-${cleanIdent(shopId)}`;
}

export function vtShopCover(shopId: string): string {
  return `shop-cover-${cleanIdent(shopId)}`;
}

export function vtBlogCover(blogId: string): string {
  return `blog-cover-${cleanIdent(blogId)}`;
}

/**
 * Trigger directional sibling transition (forward left / back right)
 */
export function withDirectionalTransition(
  direction: "forward" | "backward",
  callback: () => void
) {
  if (typeof document === "undefined") {
    callback();
    return;
  }

  document.documentElement.setAttribute("data-vt-dir", direction);

  if ("startViewTransition" in document) {
    (document as any).startViewTransition(() => {
      callback();
    }).finished.finally(() => {
      document.documentElement.removeAttribute("data-vt-dir");
    });
  } else {
    callback();
    setTimeout(() => {
      document.documentElement.removeAttribute("data-vt-dir");
    }, 400);
  }
}
