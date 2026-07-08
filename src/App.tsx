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
import { useEffect } from "react";
import { seedFirestoreIfEmpty } from "./lib/seeder";
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
        // Extract button text/label/title, fall back to id/type
        const text = button.innerText.trim() || 
                     button.getAttribute("aria-label") || 
                     button.getAttribute("title") || 
                     button.id || 
                     "unlabeled button";
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

export default function App() {
  // Trigger Firestore seeder to populate real database with curated items if empty
  useEffect(() => {
    seedFirestoreIfEmpty();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <ButtonClickTracker />
        <div className="min-h-screen bg-[#f5f5f5] flex flex-col justify-between selection:bg-black selection:text-white font-sans text-black">
          <Header />
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/products" element={<Products />} />
              <Route path="/stores" element={<Stores />} />
              <Route path="/stores/:storeId" element={<ShopDisplay />} />
              <Route path="/products/:productId" element={<ProductDetail />} />
              <Route path="/shop-dashboard" element={<ShopDashboard />} />
              <Route path="/user-profile" element={<UserProfile />} />
              <Route path="/auth-gateway" element={<AuthGateway />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
