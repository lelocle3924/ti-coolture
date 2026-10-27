import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Sparkles, Sun, Moon, Eye, Palette } from "lucide-react";
import { fetchStores, fetchProductsStore } from "../lib/dbService";
import type { Product, StoreProfile } from "../types";
import { ShopView } from "../views/ShopDisplay";
import "./lab.css";

const DEMO_STORE: StoreProfile = {
  id: "ti-coolture",
  name: "Tí Coolture",
  slug: "ti-coolture",
  vibe: "Mỗi người một Tí chất riêng",
  story:
    "Tí Coolture là platform kết nối các shop sáng tạo, thủ công độc lập tại Việt Nam với cộng đồng yêu mến văn hoá địa phương.",
  area: "Quận 1, TP. Hồ Chí Minh",
  address: "26 Lý Tự Trọng, Bến Nghé, Quận 1, TP.HCM",
  phone: "0901234567",
  logoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
  coverUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600",
  socials: {
    instagram: "https://instagram.com/ticoolture",
    facebook: "https://facebook.com/ticoolture",
    tiktok: "https://tiktok.com/@ticoolture",
  },
};

const DEMO_PRODUCTS: Product[] = [
  {
    id: "demo-p1",
    storeId: "ti-coolture",
    name: "Túi Tote Canvas Hoạ Tiết Thuyền Tí",
    price: 280000,
    category: "Phụ kiện",
    images: [
      "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800",
      "https://images.unsplash.com/photo-1597484662317-c9314187d965?w=800",
    ],
  },
  {
    id: "demo-p2",
    storeId: "ti-coolture",
    name: "Áo Phông Cotton In Nổi Biểu Tượng Sóng Biển",
    price: 350000,
    category: "Thời trang",
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800",
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800",
    ],
  },
  {
    id: "demo-p3",
    storeId: "ti-coolture",
    name: "Ly Gốm Men Hoả Biến Độc Bản Sài Gòn",
    price: 220000,
    category: "Gốm sứ",
    images: [
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800",
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800",
    ],
  },
  {
    id: "demo-p4",
    storeId: "ti-coolture",
    name: "Nón Bucket Thêu Logo Chớp Mắt Tí",
    price: 260000,
    category: "Phụ kiện",
    images: [
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800",
    ],
  },
  {
    id: "demo-p5",
    storeId: "ti-coolture",
    name: "Khăn Bandana Lụa Hoạ Tiết Bản Đồ Quận 1",
    price: 195000,
    category: "Thời trang",
    images: [
      "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800",
    ],
  },
  {
    id: "demo-p6",
    storeId: "ti-coolture",
    name: "Sổ Tay Bìa Vải Dệt Thủ Công Tí Notes",
    price: 150000,
    category: "Văn phòng phẩm",
    images: [
      "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800",
    ],
  },
];

type MotifMode = "hero" | "default";
type ThemeMode = "default" | "black" | "obsidian";

export default function ShopHeroStudies() {
  const [motif, setMotif] = useState<MotifMode>("hero");
  const [theme, setTheme] = useState<ThemeMode>("black");
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("ti-coolture");
  const [store, setStore] = useState<StoreProfile>(DEMO_STORE);
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);

  useEffect(() => {
    fetchStores().then((all) => {
      if (all && all.length > 0) {
        setStores(all);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedStoreId === "ti-coolture") {
      setStore(DEMO_STORE);
      setProducts(DEMO_PRODUCTS);
      return;
    }
    const found = stores.find((s) => s.id === selectedStoreId || s.slug === selectedStoreId);
    if (found) {
      setStore(found);
      fetchProductsStore(found.id).then((p) => {
        setProducts(p && p.length > 0 ? p : DEMO_PRODUCTS);
      });
    }
  }, [selectedStoreId, stores]);

  const liveStoreUrl = `/stores/${store.slug || store.id}?motif=${motif}&theme=${theme}`;

  return (
    <div className="min-h-[100dvh] bg-[#0c0714] text-paper">
      {/* ── Top Header Bar ── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#12081f]/90 backdrop-blur-md px-5 py-3.5 md:px-8">
        <div className="mx-auto flex max-w-[96rem] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/lab"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-paper/60 hover:text-wave transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              LAB 10
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-sm font-semibold tracking-wide text-wave">
              Port Nền Hero & Nền Đen Cho Trang Shop
            </span>
          </div>

          {/* Controls Toolbar */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs">
            {/* Motif selector */}
            <div className="flex items-center rounded-full bg-black/40 p-1 ring-1 ring-white/10">
              <button
                type="button"
                onClick={() => setMotif("hero")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold transition-all ${
                  motif === "hero"
                    ? "bg-wave text-ink shadow-[0_2px_10px_rgba(57,214,207,0.3)]"
                    : "text-paper/70 hover:text-paper"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                Hero Motif (Plate + Sóng + Mắt)
              </button>
              <button
                type="button"
                onClick={() => setMotif("default")}
                className={`rounded-full px-3 py-1 font-semibold transition-all ${
                  motif === "default"
                    ? "bg-wave text-ink shadow-[0_2px_10px_rgba(57,214,207,0.3)]"
                    : "text-paper/70 hover:text-paper"
                }`}
              >
                Default
              </button>
            </div>

            {/* Theme / Background ground */}
            <div className="flex items-center rounded-full bg-black/40 p-1 ring-1 ring-white/10">
              <button
                type="button"
                onClick={() => setTheme("black")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold transition-all ${
                  theme === "black"
                    ? "bg-paper text-ink shadow-[0_2px_10px_rgba(255,255,255,0.2)]"
                    : "text-paper/70 hover:text-paper"
                }`}
              >
                <Moon className="h-3 w-3" />
                Đen thuần (#000)
              </button>
              <button
                type="button"
                onClick={() => setTheme("obsidian")}
                className={`rounded-full px-3 py-1 font-semibold transition-all ${
                  theme === "obsidian"
                    ? "bg-[#251340] text-wave ring-1 ring-wave/40"
                    : "text-paper/70 hover:text-paper"
                }`}
              >
                Obsidian
              </button>
              <button
                type="button"
                onClick={() => setTheme("default")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold transition-all ${
                  theme === "default"
                    ? "bg-brand text-paper"
                    : "text-paper/70 hover:text-paper"
                }`}
              >
                <Palette className="h-3 w-3" />
                Tím thương hiệu
              </button>
            </div>

            {/* Store switcher */}
            {stores.length > 0 && (
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-paper ring-1 ring-white/10 focus:outline-none focus:ring-wave"
              >
                <option value="ti-coolture">Shop mẫu: Tí Coolture</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}

            {/* Viewport width */}
            <div className="hidden lg:flex items-center rounded-full bg-black/40 p-1 ring-1 ring-white/10">
              <button
                type="button"
                onClick={() => setViewport("desktop")}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  viewport === "desktop" ? "bg-white/20 text-paper" : "text-paper/60 hover:text-paper"
                }`}
              >
                100%
              </button>
              <button
                type="button"
                onClick={() => setViewport("tablet")}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  viewport === "tablet" ? "bg-white/20 text-paper" : "text-paper/60 hover:text-paper"
                }`}
              >
                Tablet (768)
              </button>
              <button
                type="button"
                onClick={() => setViewport("mobile")}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  viewport === "mobile" ? "bg-white/20 text-paper" : "text-paper/60 hover:text-paper"
                }`}
              >
                Phone (390)
              </button>
            </div>

            {/* Direct link to live shop */}
            <Link
              to={liveStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-wave/20 px-3 py-1 text-xs font-bold text-wave ring-1 ring-wave/40 hover:bg-wave hover:text-ink transition-all"
            >
              <span>Xem link thật</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Explanation Banner ── */}
      <div className="border-b border-white/10 bg-[#160a27] px-5 py-4 md:px-8">
        <div className="mx-auto max-w-[96rem]">
          <h2 className="text-base font-bold text-wave flex items-center gap-2">
            <span>LAB 10: Thử nghiệm thẩm mỹ trang Shop Display</span>
          </h2>
          <p className="mt-1 text-xs text-white/70 leading-relaxed max-w-[85ch]">
            <strong>1. Port Hero Motif:</strong> Chuyển mảng trắng bên trái cắt bằng element cong{" "}
            <code className="text-wave">WaveOnEnd</code>, con sóng chuyển động động{" "}
            <code className="text-wave">HeroWave</code> chạy ngang mép dưới, và con mắt chớp{" "}
            <code className="text-wave">RibbonLoop</code> ở góc trên bên phải sang trang shop. Ảnh bìa shop nằm ở vị trí tương tự deck hero.
            <br />
            <strong>2. Nền đen tăng tương phản:</strong> Thử chuyển nền trang shop thành màu đen thuần (#000000) hoặc đen obsidian (#0c0714), giúp ảnh sản phẩm và thẻ profile nổi bật rực rỡ.
          </p>
        </div>
      </div>

      {/* ── Preview Stage ── */}
      <main className="py-6 px-3 md:px-6 flex justify-center">
        <div
          className={`transition-all duration-300 overflow-hidden ${
            viewport === "mobile"
              ? "w-[390px] rounded-[36px] shadow-[0_0_50px_rgba(0,0,0,0.8)] ring-1 ring-white/20"
              : viewport === "tablet"
              ? "w-[768px] rounded-[28px] shadow-[0_0_50px_rgba(0,0,0,0.8)] ring-1 ring-white/20"
              : "w-full"
          }`}
        >
          <ShopView
            store={store}
            products={products}
            heroMotif={motif === "hero"}
            theme={theme}
            isPreview={true}
          />
        </div>
      </main>
    </div>
  );
}
