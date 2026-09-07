import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import Brandmark from "./Brandmark";
import { useReducedMotion } from "../lib/useAutoHideChrome";

/**
 * The reveal footer, and the sheet that uncovers it.
 *
 * wireframes.html MO-4, and the homepage's since 26/08. Team 08/09: "mọi trang
 * /products/[slug], /products, /stores, /discover đều phải có reveal footer
 * giống với homepage", so it moved out of src/views/Homepage.tsx and became a
 * layout anything can wrap itself in.
 *
 * It is three pieces that only work together, which is why they live in one
 * file and are handed out as one component rather than three:
 *
 *   · a stationary full-viewport underlay, fixed to the bottom at z-0;
 *   · a content sheet above it carrying an OPAQUE ground and a bottom margin
 *     equal to the footer's height — the margin is what makes room to scroll
 *     the sheet off, and the opacity is what stops the footer showing through
 *     the page;
 *   · a scrub, driven by how far the sheet's bottom edge has travelled past
 *     the fold, which fades and lifts the wordmark.
 *
 * The one thing a caller has to get right is the sheet's ground. It defaults
 * to paper because every subpage ends on paper; the homepage passes its
 * violet.
 */

/* ── reveal footer ──────────────────────────────────────────────────────
   wireframes.html MO-4. Stationary full-viewport underlay; the content sheet
   above carries an opaque background and a bottom margin equal to the footer
   height. The wordmark is the brand lockup as SVG — vector, so the diacritic
   cannot clip — scrubbing opacity 0.25 → 1 and translateY 26 → 0. */

const SITEMAP = [
  { to: "/products", label: "Sản phẩm" },
  { to: "/stores", label: "Shop" },
  { to: "/kham-pha", label: "Khám phá" },
  { to: "/about", label: "Tạp chí" },
  { to: "/gioi-thieu", label: "Về Tí" },
  { to: "/hop-tac", label: "Hợp tác" },
  { to: "/faq", label: "FAQ" },
  { to: "/dieu-khoan", label: "Điều khoản" },
  { to: "/bao-mat", label: "Bảo mật" },
];

/* Structural ref type — the project has no @types/react, so `React.RefObject`
   has no namespace to resolve against. */
/** How much of the stationary footer the content sheet has uncovered, 0 → 1. */
function useRevealProgress(sheetRef: { current: HTMLDivElement | null }): number {
  const [reveal, setReveal] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setReveal(1);
      return;
    }
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const sheet = sheetRef.current;
        if (!sheet) return;
        const bottom = sheet.getBoundingClientRect().bottom;
        const vh = window.innerHeight || 1;
        setReveal(Math.min(1, Math.max(0, 1 - bottom / vh)));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced, sheetRef]);

  return reveal;
}

function RevealFooter({ reveal }: { reveal: number }) {
  return (
    <footer
      /* pt and pb are dvh-derived for the same reason the pinned How-it-works
         pane is: at 560px of viewport the rem-sized version put the legal row
         below the fold with no way to reach it. */
      className="fixed inset-x-0 bottom-0 z-0 flex h-[100dvh] flex-col justify-between overflow-hidden bg-brand px-5 pb-[clamp(0.85rem,6dvh,4rem)] pt-[clamp(3.75rem,11dvh,6.5rem)] text-paper md:px-10 xl:px-24"
      aria-label="Chân trang"
    >
      <div className="grid gap-[clamp(0.75rem,3.5dvh,2.5rem)] sm:grid-cols-2 lg:grid-cols-[1fr_auto]">
        <div className="max-w-sm">
          <p className="text-sm leading-relaxed text-white/80">
            Nơi tuyển chọn local brand và artist Việt.
          </p>
          <a
            href="mailto:hello@ticoolture.vn"
            className="mt-4 inline-flex min-h-11 items-center text-sm text-paper underline underline-offset-4 decoration-white/40 hover:decoration-paper"
          >
            hello@ticoolture.vn
          </a>
        </div>

        <nav aria-label="Sơ đồ trang">
          <ul className="grid grid-cols-2 gap-x-10 sm:grid-cols-3">
            {SITEMAP.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="inline-flex min-h-11 items-center text-sm text-white/85 transition-colors hover:text-wave"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* The lockup, scrubbed — vector, so Í can never clip.
          Sized off the room left in the panel rather than off viewport width:
          at 1440px a full-width lockup is 878px tall and pushes the legal row
          out of a 900px footer. flex-1 + min-h-0 lets it take what is left and
          no more, which also keeps the bottom clearance the spec asks for. */}
      <div
        className="flex min-h-0 flex-1 items-center justify-center py-[clamp(0.25rem,2.5dvh,2rem)]"
        style={{
          opacity: 0.25 + reveal * 0.75,
          transform: `translateY(${(1 - reveal) * 26}px)`,
          willChange: "opacity, transform",
        }}
      >
        <Brandmark
          className="h-full max-h-full w-auto max-w-full"
          body="var(--color-paper)"
          wave="var(--color-wave)"
          title="Tí Coolture"
        />
      </div>

      <div className="mt-[clamp(0.75rem,3dvh,2rem)] flex flex-col gap-[clamp(0.4rem,1.4dvh,0.75rem)] border-t border-white/20 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 text-xs text-white/60">© 2026 Tí Coolture</p>
        <p className="m-0 text-xs text-white/60">
          Tí Coolture không bán hàng và không xử lý giao dịch.
        </p>
        <p className="m-0 text-xs text-white/60">
          <span className="text-paper">VI</span> / EN
        </p>
      </div>
    </footer>
  );
}


/* ── the layout ──────────────────────────────────────────────── */

export default function RevealFooterLayout({
  children,
  /** The sheet's ground. It must be opaque, or the footer reads through it. */
  sheet = "bg-paper",
}: {
  children: ReactNode;
  sheet?: string;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const reveal = useRevealProgress(sheetRef);

  return (
    <>
      <RevealFooter reveal={reveal} />
      {/* The bottom margin must equal the footer's height, or the last row of
          the footer is unreachable (UX-FOUNDATIONS §4.2, open note 2). */}
      <div ref={sheetRef} className={`relative z-10 ${sheet}`} style={{ marginBottom: "100dvh" }}>
        {children}
      </div>
    </>
  );
}
