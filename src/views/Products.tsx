import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Filter, ChevronRight, RotateCcw, Sparkles } from "lucide-react";
import { fetchProducts, incrementProductClick } from "../lib/dbService";
import { Product } from "../types";
import { useAuth } from "../lib/useAuth";

const formatPrice = (value: number) =>
  value > 0 ? `${value.toLocaleString("vi-VN")}₫` : "Liên hệ";

export default function Products() {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const approvedProducts = await fetchProducts("Approved");
      setProducts(approvedProducts);
      setLoading(false);
    }
    loadData();
  }, []);

  const matchesPrice = (price: number) => {
    if (!selectedPriceRange) return true;
    switch (selectedPriceRange) {
      case "under-100": return price < 100000;
      case "100-200": return price >= 100000 && price <= 200000;
      case "200-300": return price >= 200000 && price <= 300000;
      case "300-500": return price >= 300000 && price <= 500000;
      case "500-1m": return price >= 500000 && price <= 1000000;
      case "over-1m": return price > 1000000;
      default: return true;
    }
  };

  const filteredProducts = products.filter(prod => {
    const matchesSearch = q 
      ? prod.name.toLowerCase().includes(q.toLowerCase()) || 
        prod.category.toLowerCase().includes(q.toLowerCase()) ||
        prod.storeName.toLowerCase().includes(q.toLowerCase()) ||
        (prod.material && prod.material.toLowerCase().includes(q.toLowerCase()))
      : true;
    return matchesSearch && matchesPrice(prod.price);
  });

  return (
    <div className="min-h-screen bg-paper-warm text-ink pb-20 select-none">
      {/* Header Banner */}
      <div className="bg-brand text-paper py-12 md:py-16 px-5 md:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-wave backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" /> Tuyển chọn thủ công & nghệ thuật
          </span>
          <h1 className="display mt-3 text-3xl md:text-5xl leading-tight normal-case">
            Sản phẩm & Tác phẩm
          </h1>
          <p className="mt-2 text-sm md:text-base text-white/80 max-w-xl leading-relaxed">
            Những sáng tạo độc bản, trang sức, thời trang và phụ kiện từ nghệ nhân và xưởng thiết kế Việt Nam.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 md:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* FILTERS SIDEBAR */}
        <aside className="lg:col-span-3 bg-paper border border-ink/10 rounded-2xl p-6 shadow-sm space-y-6" id="products-filter-sidebar">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <h2 className="label text-ink font-semibold flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-brand" />
              <span>Bộ lọc giá</span>
            </h2>
            {selectedPriceRange && (
              <button
                onClick={() => setSelectedPriceRange(null)}
                className="text-xs text-brand hover:text-brand-deep font-medium transition-colors"
              >
                Xoá lọc
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {[
              { id: "under-100", label: "Dưới 100.000₫" },
              { id: "100-200", label: "100.000₫ - 200.000₫" },
              { id: "200-300", label: "200.000₫ - 300.000₫" },
              { id: "300-500", label: "300.000₫ - 500.000₫" },
              { id: "500-1m", label: "500.000₫ - 1.000.000₫" },
              { id: "over-1m", label: "Trên 1.000.000₫" }
            ].map((range) => {
              const isSelected = selectedPriceRange === range.id;
              return (
                <button
                  key={range.id}
                  onClick={() => setSelectedPriceRange(isSelected ? null : range.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                    isSelected 
                      ? "bg-brand text-paper shadow-sm" 
                      : "bg-paper-warm text-ink hover:bg-ink/5"
                  }`}
                >
                  <span>{range.label}</span>
                  {isSelected && <span className="text-wave">✓</span>}
                </button>
              );
            })}
          </div>

          {q && (
            <div className="pt-4 border-t border-ink/10 space-y-2">
              <span className="label text-ink/60 font-semibold block">
                Từ khoá đang tìm
              </span>
              <div className="flex items-center justify-between bg-wave/15 text-wave-ink rounded-xl px-3 py-2 text-xs font-medium">
                <span className="truncate pr-2">"{q}"</span>
                <button 
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.delete("q");
                    setSearchParams(params);
                  }}
                  className="font-bold text-ink/60 hover:text-ink transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* PRODUCTS GRID */}
        <main className="lg:col-span-9 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink/60">
              Hiển thị <span className="font-semibold text-ink">{filteredProducts.length}</span> sản phẩm
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-paper rounded-2xl border border-ink/10 p-3 animate-pulse space-y-3">
                  <div className="aspect-square rounded-xl bg-paper-warm" />
                  <div className="h-3 w-1/3 rounded bg-paper-warm" />
                  <div className="h-4 w-3/4 rounded bg-paper-warm" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-paper rounded-2xl border border-ink/10 p-12 text-center space-y-4 shadow-sm">
              <p className="text-base font-medium text-ink">Không tìm thấy sản phẩm phù hợp</p>
              <p className="text-xs text-ink/60 max-w-sm mx-auto">
                Thử thay đổi từ khoá tìm kiếm hoặc thiết lập lại bộ lọc giá.
              </p>
              <button
                onClick={() => {
                  setSelectedPriceRange(null);
                  const params = new URLSearchParams(searchParams);
                  params.delete("q");
                  setSearchParams(params);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-paper label transition-all hover:bg-brand-deep"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Xoá tất cả bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((prod) => (
                <Link
                  key={prod.id}
                  to={`/products/${prod.id}`}
                  onClick={async () => {
                    await incrementProductClick(prod.id);
                  }}
                  className="group bg-paper rounded-2xl border border-ink/10 hover:border-brand/30 hover:shadow-[0_12px_32px_rgba(117,32,247,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden"
                >
                  <div className="aspect-square bg-paper-warm overflow-hidden relative">
                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      referrerPolicy="no-referrer"
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                        prod.images[1] ? "group-hover:opacity-0" : "group-hover:scale-105"
                      }`}
                    />
                    {prod.images[1] && (
                      <img
                        src={prod.images[1]}
                        alt={`${prod.name} xem thêm`}
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      />
                    )}
                    <span className="absolute top-3 left-3 bg-paper/90 backdrop-blur-sm text-ink text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-ink/5 shadow-xs">
                      {prod.category}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center space-x-1.5 mb-1">
                        {prod.storeLogo && (
                          <img
                            src={prod.storeLogo}
                            alt={prod.storeName}
                            referrerPolicy="no-referrer"
                            className="w-4 h-4 rounded-full border border-ink/10"
                          />
                        )}
                        <span className="label text-wave-ink font-semibold truncate">
                          {prod.storeName}
                        </span>
                      </div>
                      <h3 className="font-medium text-base text-ink group-hover:text-brand transition-colors line-clamp-2 leading-snug">
                        {prod.name}
                      </h3>
                    </div>

                    <div className="pt-3 border-t border-ink/5 flex items-center justify-between">
                      <span className="text-sm font-semibold text-brand tabular-nums">
                        {formatPrice(prod.price)}
                      </span>
                      <span className="text-xs font-semibold text-ink/50 group-hover:text-brand flex items-center gap-0.5 transition-colors">
                        Khám phá
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
