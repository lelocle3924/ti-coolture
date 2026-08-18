import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useLocation, NavLink } from "react-router-dom";
import { User as UserIcon, LogOut, Shield, Search, Heart, Menu, X } from "lucide-react";
import { useAuth } from "../lib/useAuth";
import { fetchProducts } from "../lib/dbService";
import Brandmark from "./Brandmark";

/**
 * Navigation structure follows the Lovable mockup: centred primary links with
 * an icon cluster (search, wishlist, language) on the right. Rendered on the
 * violet ground rather than the mockup's white bar.
 */
const NAV_LINKS = [
  { to: "/", label: "Trang chủ", end: true },
  { to: "/products", label: "Sản phẩm" },
  { to: "/stores", label: "Shop" },
  { to: "/kham-pha", label: "Khám phá" },
  { to: "/blog", label: "Tạp chí" },
];

export default function Header() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [previousSearches, setPreviousSearches] = useState<string[]>(() => {
    const saved = sessionStorage.getItem("t_coolture_searches");
    return saved ? JSON.parse(saved) : [];
  });
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts("Approved")
      .then(setProducts)
      .catch((err) => console.error("Error loading search suggestions:", err));
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.storeName.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [searchQuery, products]);

  const rememberSearch = (term: string) => {
    if (previousSearches.includes(term)) return;
    const updated = [term, ...previousSearches].slice(0, 5);
    setPreviousSearches(updated);
    sessionStorage.setItem("t_coolture_searches", JSON.stringify(updated));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    rememberSearch(query);
    navigate(`/products?q=${encodeURIComponent(query)}`);
  };

  const handleUserClick = () =>
    navigate(user ? (profile?.role === "Shop" ? "/shop-dashboard" : "/user-profile") : "/auth-gateway");

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative py-1 label transition-colors ${isActive ? "text-paper" : "text-white/70 hover:text-wave"}`;

  return (
    <header className="sticky top-0 z-40 bg-brand text-paper border-b border-white/20 select-none">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-3 md:px-8 md:py-4">
        <Link to="/" viewTransition className="shrink-0" aria-label="Tí Coolture — trang chủ">
          <Brandmark className="w-[72px] md:w-[80px] h-auto" body="var(--color-paper)" />
        </Link>

        <nav className="hidden md:flex items-center gap-8 mx-auto" aria-label="Điều hướng chính">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} viewTransition className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1 ml-auto md:ml-0">
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className="w-10 h-10 grid place-items-center hover:text-wave transition-colors"
            aria-label={searchOpen ? "Đóng tìm kiếm" : "Tìm kiếm"}
            aria-expanded={searchOpen}
          >
            {searchOpen ? <X className="w-[18px] h-[18px]" /> : <Search className="w-[18px] h-[18px]" />}
          </button>

          <button
            onClick={() => navigate(user ? "/user-profile" : "/auth-gateway")}
            className="w-10 h-10 grid place-items-center hover:text-wave transition-colors"
            aria-label="Sản phẩm đã lưu"
          >
            <Heart className="w-[18px] h-[18px]" />
          </button>

          <span className="hidden sm:flex items-center gap-1.5 label pl-2 pr-1 text-white/70">
            <span className="text-paper">VI</span>
            <span aria-hidden="true">/</span>
            <span title="Chưa có bản tiếng Anh">EN</span>
          </span>

          <button
            onClick={handleUserClick}
            className="w-10 h-10 grid place-items-center hover:text-wave transition-colors"
            aria-label={user ? "Tài khoản của bạn" : "Đăng nhập hoặc đăng ký"}
            title={user ? user.email : "Đăng nhập / Đăng ký"}
          >
            <UserIcon className="w-[18px] h-[18px]" />
          </button>

          {user && (
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-white/20">
              <span className="label text-white/80 flex items-center gap-1">
                {profile?.role === "Admin" && <Shield className="w-3 h-3" aria-hidden="true" />}
                {profile?.role || "User"}
              </span>
              <button
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
                className="w-9 h-9 grid place-items-center hover:text-wave transition-colors"
                aria-label="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden w-10 h-10 grid place-items-center"
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Search drawer — the mockup hides search behind the icon */}
      {searchOpen && (
        <div className="border-t border-white/20 bg-brand">
          <form
            onSubmit={handleSearchSubmit}
            role="search"
            className="mx-auto max-w-7xl px-5 py-4 md:px-8"
          >
            <div className="flex items-center gap-3 border-b border-white/30 pb-2 focus-within:border-wave transition-colors">
              <Search className="w-5 h-5 shrink-0 text-white/80" aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm sản phẩm, shop…"
                aria-label="Tìm sản phẩm hoặc shop"
                className="w-full bg-transparent py-2 text-lg text-paper placeholder:text-white/80 focus:outline-none"
              />
            </div>

            <div className="mt-4">
              {searchQuery.trim() === "" ? (
                previousSearches.length > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="label text-white/80">Tìm gần đây</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviousSearches([]);
                          sessionStorage.removeItem("t_coolture_searches");
                        }}
                        className="label text-white/80 hover:text-wave transition-colors"
                      >
                        Xoá hết
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {previousSearches.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => navigate(`/products?q=${encodeURIComponent(term)}`)}
                          className="min-h-11 px-4 border border-white/30 text-sm hover:border-paper hover:bg-white/10 transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </>
                )
              ) : suggestions.length === 0 ? (
                <p className="text-sm text-white/80">
                  Không tìm thấy “{searchQuery}”. Tí sẽ ghi nhận — biết đâu tháng sau có.
                </p>
              ) : (
                <ul className="space-y-1">
                  {suggestions.map((prod) => (
                    <li key={prod.id}>
                      <button
                        type="button"
                        onClick={() => {
                          rememberSearch(prod.name);
                          setSearchQuery("");
                          navigate(`/products/${prod.id}`);
                        }}
                        className="w-full flex items-center gap-3 p-2 text-left hover:bg-white/10 transition-colors"
                      >
                        <img
                          src={prod.images[0]}
                          alt=""
                          className="w-10 h-10 object-cover shrink-0 bg-paper-warm"
                        />
                        <span className="overflow-hidden">
                          <span className="block text-sm truncate">{prod.name}</span>
                          <span className="block label text-wave truncate">{prod.storeName}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/20 px-5 py-5">
          <nav className="flex flex-col" aria-label="Điều hướng chính">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className="display text-2xl py-2.5 border-b border-white/12"
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          {user && (
            <button
              onClick={async () => {
                await logout();
                navigate("/");
              }}
              className="label mt-5 flex items-center gap-2 text-white/80"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Đăng xuất
            </button>
          )}
        </div>
      )}
    </header>
  );
}
