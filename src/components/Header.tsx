import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight, Menu, Search, X } from "lucide-react";
import Brandmark from "./Brandmark";
import { useAutoHideChrome } from "../lib/useAutoHideChrome";
import { useSurfaceTone } from "../lib/useSurfaceTone";
import { fetchProducts } from "../lib/dbService";
import type { Product } from "../types";

/**
 * The site's navigation — one component, every page.
 *
 * Shape is Direction A's floating capsule: the bar does not span the window,
 * it is a pill that sits over whatever the page's own ground happens to be.
 * That is why it carries its own dark material rather than relying on a
 * violet header band: /products and /stores run on paper, the homepage opens
 * on a photograph, and the pill has to read on both.
 *
 * Behaviour is the settled one from docs/UX-TASKS.md 1.1 and the team's
 * 19/08 note: hides on scroll-down, returns on scroll-up, 8px threshold,
 * never hides in the top zone, held open while a drawer or the search
 * overlay is open.
 *
 * Colour is not fixed (26/08 feedback). The pill takes its material and its
 * marks from whatever ground it happens to be over — see useSurfaceTone.
 */

/* `hidden` keeps a link routable but off the bar. /about is hidden at the
   team's request (26/08) until that page is past its rough state; deleting
   the entry instead would lose the label and the ordering, and /about is
   still reachable — the footer links it and /tui-minh still redirects. */
const NAV = [
  { to: "/products", label: "Sản phẩm" },
  { to: "/stores", label: "Shop" },
  { to: "/discover", label: "Khám phá" },
  { to: "/about", label: "Tụi mình", hidden: true },
];

const VISIBLE_NAV = NAV.filter((link) => !link.hidden);

/* The two materials the pill can wear. Both stay translucent so the blur is
   still doing the work — the ground reads through either one. */
const TONE = {
  dark: {
    /* Lighter than the old solid slab (26/08): the bar should look like the
       ground it covers, not like a black bar laid on top of it. */
    pill: "bg-ink/50 ring-1 ring-white/12 shadow-[0_18px_40px_-22px_rgba(18,8,31,0.9)]",
    pillTop: "bg-ink/55 ring-1 ring-white/10",
    body: "var(--color-paper)",
    idle: "text-wave/80 hover:bg-white/10 hover:text-wave",
    active: "bg-paper text-ink",
    icon: "text-paper/85 hover:bg-white/10 hover:text-wave",
    burger: "text-paper hover:bg-white/10",
  },
  light: {
    pill: "bg-paper/70 ring-1 ring-ink/10 shadow-[0_18px_40px_-24px_rgba(18,8,31,0.45)]",
    pillTop: "bg-paper/60 ring-1 ring-ink/8",
    body: "var(--color-brand)",
    idle: "text-brand/85 hover:bg-brand/10 hover:text-brand",
    active: "bg-brand text-paper",
    icon: "text-ink/65 hover:bg-brand/10 hover:text-brand",
    burger: "text-ink/80 hover:bg-brand/10",
  },
} as const;

/**
 * The chrome's scroll state, published for anything that has to move with it
 * or against it. The Hidden Gems tab reads this and does the opposite: the
 * team asked for the tab to appear exactly when the nav goes away.
 */
export function useChromeHidden(locked = false) {
  return useAutoHideChrome({ locked });
}

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts("Approved").then(setProducts).catch(() => setProducts([]));
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Diacritic-insensitive, per UX-TASKS 3.1 — "ao dai" has to find "áo dài".
  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");

  const hits = useMemo(() => {
    if (!query.trim()) return [];
    const q = norm(query);
    return products
      .filter((p) => norm(`${p.name} ${p.storeName} ${p.category}`).includes(q))
      .slice(0, 8);
  }, [query, products]);

  return (
    <div
      role="dialog"
      aria-label="Tìm kiếm"
      className="fixed inset-0 z-[70] bg-ink/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-auto mt-[12vh] w-[min(46rem,calc(100vw-2rem))] overflow-hidden rounded-[1.5rem] bg-paper text-ink shadow-[0_40px_90px_rgba(18,8,31,0.5)]"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!query.trim()) return;
            navigate(`/products?q=${encodeURIComponent(query.trim())}`);
            onClose();
          }}
          className="flex items-center gap-3 border-b border-ink/12 px-5 py-4"
        >
          <Search className="h-4 w-4 shrink-0 text-ink/40" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm sản phẩm, shop…"
            className="w-full bg-transparent text-base outline-none placeholder:text-ink/35"
          />
          <button type="button" onClick={onClose} aria-label="Đóng tìm kiếm">
            <X className="h-4 w-4 text-ink/45" />
          </button>
        </form>

        {hits.length > 0 && (
          <ul className="max-h-[52vh] overflow-y-auto">
            {hits.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/products/${p.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-paper-warm"
                >
                  <img src={p.images?.[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{p.name}</span>
                    <span className="block text-[11px] text-ink/50">{p.storeName}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-brand" />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {query.trim() && hits.length === 0 && (
          <p className="px-5 py-6 text-sm text-ink/55">Chưa tìm thấy gì khớp với “{query}”.</p>
        )}
      </div>
    </div>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { hidden, atTop } = useAutoHideChrome({ locked: menuOpen || searchOpen });
  const location = useLocation();

  const pillRef = useRef<HTMLDivElement>(null);
  const tone = TONE[useSurfaceTone(pillRef)];

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 px-3 pt-3 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:px-6 md:pt-5"
        style={{ transform: hidden ? "translateY(-140%)" : "translateY(0)" }}
      >
        <div
          ref={pillRef}
          className={`mx-auto flex max-w-6xl items-center gap-2 rounded-full px-2 py-2 transition-all duration-500 md:gap-4 md:px-3 ${
            atTop ? `${tone.pillTop} backdrop-blur-md` : `${tone.pill} backdrop-blur-xl`
          }`}
        >
          <Link
            to="/"
            aria-label="Tí Coolture — trang chủ"
            className="shrink-0 rounded-full px-3 py-1.5 transition-transform duration-300 hover:scale-105"
          >
            {/* The teal group never moves. Only the COOLTURE lettering swaps:
                white so it survives a dark ground, the mark's own violet once
                there is a light one to sit on. */}
            <Brandmark className="h-auto w-[68px] md:w-[74px]" body={tone.body} />
          </Link>

          <nav className="mx-auto hidden items-center gap-1 md:flex" aria-label="Điều hướng chính">
            {VISIBLE_NAV.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-semibold transition-all duration-500 ${
                    isActive ? tone.active : tone.idle
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Tìm kiếm"
              aria-haspopup="dialog"
              className={`grid h-11 w-11 place-items-center rounded-full transition-colors duration-500 ${tone.icon}`}
            >
              <Search className="h-[18px] w-[18px]" />
            </button>

            <Link
              to="/open-shop"
              className="hidden items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-paper transition-transform duration-300 hover:scale-105 sm:inline-flex"
            >
              Mở shop
              <ArrowUpRight className="h-4 w-4" />
            </Link>

            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
              className={`grid h-11 w-11 place-items-center rounded-full transition-colors duration-500 md:hidden ${tone.burger}`}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="mx-auto mt-2 max-w-6xl rounded-[1.75rem] bg-brand-deep/95 px-5 py-3 backdrop-blur-xl md:hidden">
            {VISIBLE_NAV.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-16 items-center justify-between border-b border-white/12 text-paper last:border-b-0"
              >
                <span className="display text-3xl normal-case">{link.label}</span>
                <ArrowUpRight className="h-5 w-5 text-wave" />
              </Link>
            ))}
            <Link
              to="/open-shop"
              onClick={() => setMenuOpen(false)}
              className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-paper px-5 text-sm font-bold text-ink"
            >
              Mở shop trên Tí
              <ArrowUpRight className="h-4 w-4 text-brand" />
            </Link>
          </div>
        )}
      </header>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
