import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import Header from "./components/Header";
import Homepage from "./views/Homepage";
import ShopDisplay from "./views/ShopDisplay";
import ProductDetail from "./views/ProductDetail";
import ShopDashboard from "./views/ShopDashboard";
import UserProfile from "./views/UserProfile";
import AuthGateway from "./views/AuthGateway";
import Products from "./views/Products";
import Wishlist from "./views/Wishlist";
import Stores from "./views/Stores";
import About from "./views/About";
import Discovery from "./views/Discovery";
import OpenShop from "./views/OpenShop";
import LabIndex from "./lab/LabIndex";
import ShopPaletteStudies from "./lab/ShopPaletteStudies";
import DiscoverStudies from "./lab/DiscoverStudies";
import MapStudies from "./lab/MapStudies";
import SearchMotionStudies from "./lab/SearchMotionStudies";
import CollectionStudies from "./lab/CollectionStudies";
import Footer from "./components/Footer";
import RevealFooterLayout from "./components/RevealFooter";
import { useEffect, type ReactNode } from "react";
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

  /* Team 08/09: "mọi trang /products/[slug], /products, /stores, /discover đều
     phải có reveal footer giống với homepage."

     Decided here rather than in each page, so the four cannot drift apart and
     a fifth is one entry away. The homepage wraps itself, because its sheet is
     violet and it has chrome of its own to sit outside the sheet.

     /stores/:storeId is deliberately not on this list. It docks a contact rail
     to the bottom of the viewport at z-50, which would sit on top of a footer
     that is revealed by scrolling the page off — the two want the same edge.
     Worth raising separately rather than breaking one to add the other. */
  const REVEAL_FOOTER = ["/products", "/stores", "/discover"];
  const hasRevealFooter =
    !isLab &&
    REVEAL_FOOTER.some((base) => pathname === base || pathname.startsWith(`${base}/`)) &&
    !pathname.startsWith("/stores/");

  return (
    <div className="min-h-screen bg-ink flex flex-col justify-between selection:bg-wave selection:text-ink font-sans text-ink">
      {!isLab && <Header />}
      {/* The nav is a floating pill, so it sits over the page rather than
          pushing it down. Every page therefore needs the pill's height cleared
          at the top — except the homepage, whose hero owns that space and puts
          the deck under the pill on purpose. */}
      <div className={`flex-grow ${isHome || isLab ? "" : "pt-24 md:pt-28"}`}>
        <PageBody reveal={hasRevealFooter}>
          <Outlet />
        </PageBody>
      </div>
      {!isHome && !isLab && !hasRevealFooter && <Footer />}
    </div>
  );
}

/**
 * Wraps the routed page in the reveal footer, or does not.
 *
 * A component rather than a ternary around <Routes>, because duplicating the
 * route table to put a wrapper round one copy of it is how the two copies
 * start to differ.
 */
function PageBody({ reveal, children }: { reveal: boolean; children: ReactNode }) {
  if (!reveal) return <>{children}</>;
  return <RevealFooterLayout>{children}</RevealFooterLayout>;
}

/** Carries the :routeId across a rename so a deep link keeps its district. */
function RedirectRoute({ to }: { to: string }) {
  const { pathname, search } = useLocation();
  const tail = pathname.split("/").filter(Boolean).slice(1).join("/");
  return <Navigate to={`${to}${tail ? `/${tail}` : ""}${search}`} replace />;
}

/**
 * Everything under one splat route.
 *
 * The app matches its own paths with <Routes> inside SiteShell, and that does
 * not change — this is only about which kind of router is above it.
 *
 * Team 08/09 asked for the standing "view transitions are inert" finding to be
 * fixed. It was real and it was exact: <Link viewTransition> is only honoured
 * by a DATA router, and this mounted <BrowserRouter>, so all 32 uses of the
 * prop across src/ did nothing. Measured before the change — clicking a
 * product card started zero view transitions — and the only one that ever
 * fired was the whole-page slide on a filter chip, which is the "jerky zoom"
 * the team reported and which motion proposal 05 has since removed.
 *
 * createBrowserRouter puts a data router above the same tree, so a Link that
 * asks for a transition gets one, and the root cross-fade that index.css has
 * been carrying all along finally plays. ScrollToTop and ButtonClickTracker
 * move inside the route element because both read useLocation.
 */
function Root() {
  return (
    <>
      <ScrollToTop />
      <ButtonClickTracker />
      <SiteShell />
    </>
  );
}

/* A real route table, not a splat with <Routes> underneath it.

   The splat was tried first and does not work: a descendant <Routes> matches
   below the data router, so a Link's `viewTransition` never reaches the
   router that would honour it — measured at zero transitions either way.
   Declaring the routes here is what actually turns the prop on. */
const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      { index: true, element: <Homepage /> },
      { path: "products", element: <Products /> },
      { path: "products/:productId", element: <ProductDetail /> },
      { path: "wishlist", element: <Wishlist /> },
      { path: "stores", element: <Stores /> },
      { path: "stores/:storeId", element: <ShopDisplay /> },
      { path: "about", element: <About /> },
      { path: "open-shop", element: <OpenShop /> },
      { path: "discover", element: <Discovery /> },
      { path: "discover/:routeId", element: <Discovery /> },
      { path: "shop-dashboard", element: <ShopDashboard /> },
      { path: "user-profile", element: <UserProfile /> },
      { path: "auth-gateway", element: <AuthGateway /> },

      /* Exploration. Not linked from the nav — you get there by typing /lab. */
      { path: "lab", element: <LabIndex /> },
      { path: "lab/shop-colour", element: <ShopPaletteStudies /> },
      { path: "lab/discover", element: <DiscoverStudies /> },
      { path: "lab/map", element: <MapStudies /> },
      { path: "lab/search", element: <SearchMotionStudies /> },
      { path: "lab/collections", element: <CollectionStudies /> },

      /* Renamed 26/08. Kept as redirects so anything already shared or
         bookmarked still lands, rather than bouncing to the homepage. */
      { path: "kham-pha", element: <Navigate to="/discover" replace /> },
      { path: "kham-pha/:routeId", element: <RedirectRoute to="/discover" /> },
      { path: "tui-minh", element: <Navigate to="/about" replace /> },

      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
