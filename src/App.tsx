import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import Header from "./components/Header";
import Homepage from "./views/Homepage";
import ShopDisplay from "./views/ShopDisplay";
import ProductDetail from "./views/ProductDetail";
import ShopDashboard from "./views/ShopDashboard";
import UserProfile from "./views/UserProfile";
import AuthGateway from "./views/AuthGateway";
import Products from "./views/Products";
import Stores from "./views/Stores";
import About from "./views/About";
import Discovery from "./views/Discovery";
import OpenShop from "./views/OpenShop";
import LabIndex from "./lab/LabIndex";
import DiscoverStudies from "./lab/DiscoverStudies";
import CollectionStudies from "./lab/CollectionStudies";
import MapStudies from "./lab/MapStudies";
import MotionStudies from "./lab/MotionStudies";
import Footer from "./components/Footer";
import { useEffect } from "react";
import { recordButtonClick } from "./lib/dbService";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ButtonClickTracker() {
  const location = useLocation();

  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const button = target.closest("button");

      if (button) {
        // Extract direct text
        let text = button.innerText.trim();

        // If no direct text, try standard attributes
        if (!text) {
          text = button.getAttribute("aria-label") ||
                 button.getAttribute("title") ||
                 button.getAttribute("name") ||
                 "";
        }

        // If still no label, check if we have a structured ID
        if (!text && button.id) {
          text = button.id
            .replace(/^btn-/, "")
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, c => c.toUpperCase());
        }

        // If still no label, detect Lucide / SVG icons
        if (!text) {
          const svg = button.querySelector("svg");
          if (svg) {
            const classes = Array.from(svg.classList);
            const lucideClass = classes.find(cls => cls.startsWith("lucide-"));
            if (lucideClass) {
              const iconName = lucideClass.replace("lucide-", "").replace(/-/g, " ");
              text = `${iconName.charAt(0).toUpperCase() + iconName.slice(1)} Button`;
            } else {
              text = "Icon Button";
            }
          }
        }

        // If still no label, check for inner images
        if (!text) {
          const img = button.querySelector("img");
          if (img) {
            text = (img.getAttribute("alt") || "Image") + " Button";
          }
        }

        // Fallback context based naming (e.g. Action inside card)
        if (!text) {
          const parentCard = button.closest(".group, [id*='card'], .border-2, .border-4");
          const heading = parentCard?.querySelector("h1, h2, h3, h4, h5");
          if (heading && heading.textContent) {
            text = `Action on ${heading.textContent.trim()}`;
          }
        }

        // Ultimate fallback
        if (!text) {
          text = "unlabeled button";
        }

        const path = location.pathname;
        recordButtonClick(text, path);
      }
    };

    document.addEventListener("click", handleGlobalClick, true);
    return () => {
      document.removeEventListener("click", handleGlobalClick, true);
    };
  }, [location.pathname]);

  return null;
}

/**
 * The public site.
 *
 * The header is outside <Routes> because it is now one pill shared by every
 * page (26/08) — the homepage used to ship its own chrome and no longer does.
 *
 * The homepage renders its own reveal footer (the MO-4 treatment that is part
 * of the direction that was chosen), so the shared footer is suppressed there
 * and there only.
 */
function SiteShell() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  /* The lab is a place to look at things, not part of the site: it carries no
     shared chrome, because half of what it is comparing sits at the top of a
     page and the nav pill would be in the way. It is not linked from the nav
     either — you get there by typing /lab. */
  const isLab = pathname === "/lab" || pathname.startsWith("/lab/");

  return (
    <div className="min-h-screen bg-ink flex flex-col justify-between selection:bg-wave selection:text-ink font-sans text-ink">
      {!isLab && <Header />}
      {/* The nav is a floating pill, so it sits over the page rather than
          pushing it down. Every page therefore needs the pill's height cleared
          at the top — except the homepage, whose hero owns that space and puts
          the deck under the pill on purpose. */}
      <div className={`flex-grow ${isHome || isLab ? "" : "pt-24 md:pt-28"}`}>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/products" element={<Products />} />
          <Route path="/stores" element={<Stores />} />
          <Route path="/stores/:storeId" element={<ShopDisplay />} />
          <Route path="/products/:productId" element={<ProductDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/open-shop" element={<OpenShop />} />
          <Route path="/discover" element={<Discovery />} />
          <Route path="/discover/:routeId" element={<Discovery />} />
          <Route path="/shop-dashboard" element={<ShopDashboard />} />
          <Route path="/user-profile" element={<UserProfile />} />
          <Route path="/auth-gateway" element={<AuthGateway />} />

          {/* Exploration. Rebuilt 28/08 for the two Collections directions and
              the three map options the 26/08 feedback asks for. */}
          <Route path="/lab" element={<LabIndex />} />
          <Route path="/lab/discover" element={<DiscoverStudies />} />
          <Route path="/lab/collections" element={<CollectionStudies />} />
          <Route path="/lab/map" element={<MapStudies />} />
          <Route path="/lab/motion" element={<MotionStudies />} />

          {/* Renamed 26/08. Kept as redirects so anything already shared or
              bookmarked still lands, rather than bouncing to the homepage. */}
          <Route path="/kham-pha" element={<Navigate to="/discover" replace />} />
          <Route path="/kham-pha/:routeId" element={<RedirectRoute to="/discover" />} />
          <Route path="/tui-minh" element={<Navigate to="/about" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {!isHome && !isLab && <Footer />}
    </div>
  );
}

/** Carries the :routeId across a rename so a deep link keeps its district. */
function RedirectRoute({ to }: { to: string }) {
  const { pathname, search } = useLocation();
  const tail = pathname.split("/").filter(Boolean).slice(1).join("/");
  return <Navigate to={`${to}${tail ? `/${tail}` : ""}${search}`} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <ButtonClickTracker />
        <SiteShell />
      </BrowserRouter>
    </AuthProvider>
  );
}
