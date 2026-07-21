import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { User as UserIcon, Terminal, LogOut, Shield, Search } from "lucide-react";
import { useAuth } from "../lib/useAuth";
import WebhookTerminal from "./WebhookTerminal";
import { fetchProducts } from "../lib/dbService";

export default function Header() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [previousSearches, setPreviousSearches] = useState<string[]>(() => {
    const saved = sessionStorage.getItem("t_coolture_searches");
    return saved ? JSON.parse(saved) : [];
  });
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const approvedProducts = await fetchProducts("Approved");
        setProducts(approvedProducts);
      } catch (err) {
        console.error("Error loading search products suggestions:", err);
      }
    }
    loadProducts();
  }, []);

  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.storeName.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [searchQuery, products]);

  const handleLogoClick = (e: React.MouseEvent) => {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleUserClick = () => {
    if (user) {
      if (profile?.role === "Shop") {
        navigate("/shop-dashboard");
      } else {
        navigate("/user-profile");
      }
    } else {
      navigate("/auth-gateway");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    if (!previousSearches.includes(query)) {
      const updated = [query, ...previousSearches].slice(0, 5);
      setPreviousSearches(updated);
      sessionStorage.setItem("t_coolture_searches", JSON.stringify(updated));
    }

    navigate(`/products?q=${encodeURIComponent(query)}`);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b-4 border-black px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center select-none gap-4">
        {/* Top-left Corner Logo and Search Bar */}
        <div className="flex items-center justify-between md:justify-start space-x-4 w-full md:w-auto">
          <Link 
            to="/" 
            onClick={handleLogoClick}
            className="font-display font-black text-2xl tracking-tighter uppercase text-black hover:bg-black hover:text-white px-2 py-1 transition-all border-2 border-transparent hover:border-black shrink-0"
            id="brand-logo"
          >
            Tí Coolture
          </Link>

          {/* Global Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex border-2 border-black w-full max-w-[200px] sm:max-w-xs relative">
            <input
              type="text"
              placeholder="Search crafts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="w-full p-1.5 px-3 font-mono text-xs focus:outline-none text-black"
            />
            <button type="submit" className="bg-black text-white hover:bg-neutral-800 px-3 border-l-2 border-black font-mono text-xs font-bold uppercase transition-colors">
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* Recent Searches / Auto-matching Suggestions Dropdown under search bar when clicked */}
            {isSearchFocused && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] z-50 p-3 space-y-2 min-w-[220px]">
                {searchQuery.trim() === "" ? (
                  <>
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5">
                      <span className="font-mono text-[9px] uppercase font-bold text-neutral-400">
                        RECENT SEARCHES
                      </span>
                      {previousSearches.length > 0 && (
                        <button 
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPreviousSearches([]);
                            sessionStorage.removeItem("t_coolture_searches");
                          }}
                          className="text-[9px] font-mono text-neutral-400 hover:text-black uppercase font-bold"
                        >
                          RESET
                        </button>
                      )}
                    </div>
                    {previousSearches.length === 0 ? (
                      <p className="font-mono text-[10px] text-neutral-400 italic uppercase">
                        No recent searches
                      </p>
                    ) : (
                      <div className="flex flex-col gap-1 text-left">
                        {previousSearches.map((term, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onMouseDown={() => {
                              setSearchQuery(term);
                              navigate(`/products?q=${encodeURIComponent(term)}`);
                            }}
                            className="w-full text-left px-2 py-1 bg-neutral-100 hover:bg-black hover:text-white border border-neutral-300 hover:border-black text-[10px] font-mono transition-all uppercase truncate"
                          >
                            "{term}"
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5">
                      <span className="font-mono text-[9px] uppercase font-bold text-neutral-400">
                        MATCHING SUGGESTIONS
                      </span>
                    </div>
                    {suggestions.length === 0 ? (
                      <p className="font-mono text-[10px] text-neutral-400 italic uppercase">
                        No matches found
                      </p>
                    ) : (
                      <div className="flex flex-col gap-1.5 text-left">
                        {suggestions.map((prod) => (
                          <button
                            key={prod.id}
                            type="button"
                            onMouseDown={() => {
                              if (!previousSearches.includes(prod.name)) {
                                const updated = [prod.name, ...previousSearches].slice(0, 5);
                                setPreviousSearches(updated);
                                sessionStorage.setItem("t_coolture_searches", JSON.stringify(updated));
                              }
                              setSearchQuery("");
                              navigate(`/products/${prod.id}`);
                            }}
                            className="w-full text-left p-1.5 bg-neutral-50 hover:bg-black hover:text-white border border-neutral-200 hover:border-black transition-all flex items-center space-x-2"
                          >
                            <img
                              src={prod.images[0]}
                              alt={prod.name}
                              referrerPolicy="no-referrer"
                              className="w-6 h-6 object-cover border border-black shrink-0"
                            />
                            <div className="overflow-hidden flex-1">
                              <p className="font-sans text-[10px] font-bold truncate uppercase text-black group-hover:text-white">{prod.name}</p>
                              <p className="font-mono text-[8px] text-neutral-400 truncate uppercase">{prod.storeName} • {prod.category}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center space-x-2 md:space-x-4 w-full md:w-auto justify-end">
          {/* Navigation link: Products */}
          <Link
            to="/products"
            className="border-2 border-black px-3 py-1 text-xs font-mono font-bold uppercase hover:bg-black hover:text-white transition-all bg-white text-black"
            id="nav-products"
          >
            Products
          </Link>

          {/* Navigation link: Stores */}
          <Link
            to="/stores"
            className="border-2 border-black px-3 py-1 text-xs font-mono font-bold uppercase hover:bg-black hover:text-white transition-all bg-white text-black"
            id="nav-stores"
          >
            Stores
          </Link>

          {/* Webhooks Terminal Toggle - Only shown for Admin profile */}
          {profile?.role === "Admin" && (
            <button
              onClick={() => setTerminalOpen(true)}
              className="flex items-center space-x-1 border-2 border-black px-3 py-1 font-mono text-xs hover:bg-black hover:text-white transition-all bg-white text-black"
              id="btn-webhook-terminal"
              title="Open real-time webhooks logger terminal"
            >
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Terminal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-bold">TERMINAL</span>
            </button>
          )}

          {/* Account Button / User Icon */}
          <button
            onClick={handleUserClick}
            className="border-2 border-black p-1.5 hover:bg-black hover:text-white transition-all bg-white text-black"
            id="btn-user-profile"
            title={user ? `Profile: ${user.email}` : "Log In / Register"}
          >
            <UserIcon className="w-5 h-5" />
          </button>

          {/* Auth Display & Sign Out */}
          {user && (
            <div className="flex items-center space-x-2 border-l-2 border-neutral-300 pl-2 md:pl-4">
              <div className="hidden lg:flex flex-col text-right font-mono text-[10px]">
                <span className="font-bold truncate max-w-[120px] text-black">{user.email}</span>
                <span className="text-neutral-500 flex items-center justify-end space-x-1">
                  {profile?.role === "Admin" && <Shield className="w-2.5 h-2.5 text-neutral-800 mr-0.5 inline" />}
                  <span>{profile?.role || "User"}</span>
                </span>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
                className="p-1.5 border-2 border-transparent hover:border-black hover:bg-neutral-100 rounded-none transition-all text-neutral-700 hover:text-black"
                id="btn-signout"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Webhook Stream Logs Terminal */}
      <WebhookTerminal isOpen={terminalOpen} onClose={() => setTerminalOpen(false)} />
    </>
  );
}
