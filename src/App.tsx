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
import Blog from "./views/Blog";
import Discovery from "./views/Discovery";
import Footer from "./components/Footer";
import LabIndex from "./lab/LabIndex";
import DirectionA from "./lab/DirectionA";
import DirectionB from "./lab/DirectionB";
import DirectionC from "./lab/DirectionC";
import DirectionC4 from "./lab/DirectionC4";
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

/** The public site, with the shared header and footer around it. */
function SiteShell() {
  return (
    <div className="min-h-screen bg-ink flex flex-col justify-between selection:bg-wave selection:text-ink font-sans text-ink">
      <Header />
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/products" element={<Products />} />
          <Route path="/stores" element={<Stores />} />
          <Route path="/tui-minh" element={<Blog />} />
          <Route path="/kham-pha" element={<Discovery />} />
          <Route path="/kham-pha/:routeId" element={<Discovery />} />
          <Route path="/stores/:storeId" element={<ShopDisplay />} />
          <Route path="/products/:productId" element={<ProductDetail />} />
          <Route path="/shop-dashboard" element={<ShopDashboard />} />
          <Route path="/user-profile" element={<UserProfile />} />
          <Route path="/auth-gateway" element={<AuthGateway />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <ButtonClickTracker />
        <Routes>
          {/* Design exploration — each direction ships its own chrome, so these
              routes render outside the shared Header/Footer shell. Delete
              src/lab/ and these four routes once a direction is chosen. */}
          <Route path="/lab" element={<LabIndex />} />
          <Route path="/lab/a" element={<DirectionA />} />
          <Route path="/lab/b" element={<DirectionB />} />
          <Route path="/lab/c" element={<DirectionC />} />

          {/* Brand-device studies on top of C — same page, three readings of
              the marks in src/assets/brand. See src/lab/brandLayers.tsx. */}
          <Route path="/lab/c1" element={<DirectionC brand="c1" />} />
          <Route path="/lab/c2" element={<DirectionC brand="c2" />} />
          <Route path="/lab/c3" element={<DirectionC brand="c3" />} />

          {/* C4 — the page as a single travelled line. Not a variant of C:
              a different structure entirely. */}
          <Route path="/lab/c4" element={<DirectionC4 />} />

          <Route path="*" element={<SiteShell />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
