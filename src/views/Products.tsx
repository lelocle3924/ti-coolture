import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Filter, ChevronRight, RotateCcw, AlertTriangle } from "lucide-react";
import { fetchProducts } from "../lib/dbService";
import { Product } from "../types";
import { useAuth } from "../lib/useAuth";

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

  // Price range matching helper
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

  // Filtering products
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
    <div className="min-h-screen bg-neutral-100 p-4 md:p-8 select-none max-w-7xl mx-auto">
      
      {/* Title section */}
      <div className="border-b-4 border-black pb-4 mb-8">
        <h1 className="font-display font-black text-2xl md:text-3xl uppercase tracking-tight">
          ARTISAN GALLERY
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* FILTERS SIDEBAR */}
        <aside className="lg:col-span-3 bg-white border-4 border-black p-6 shadow-[4px_4px_0px_0px_#000000] space-y-6" id="products-filter-sidebar">
          <div className="border-b-2 border-black pb-3">
            <h2 className="font-display font-black text-xs uppercase tracking-wider flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5" />
              <span>FILTERS</span>
            </h2>
          </div>

          {/* Pricing check/radio blocks */}
          <div className="space-y-2">
            {[
              { id: "under-100", label: "Under 100k VND" },
              { id: "100-200", label: "100k - 200k VND" },
              { id: "200-300", label: "200k - 300k VND" },
              { id: "300-500", label: "300k - 500k VND" },
              { id: "500-1m", label: "500k - 1M VND" },
              { id: "over-1m", label: "Over 1M VND" }
            ].map((range) => {
              const isSelected = selectedPriceRange === range.id;
              return (
                <button
                  key={range.id}
                  onClick={() => setSelectedPriceRange(isSelected ? null : range.id)}
                  className={`w-full text-left p-2.5 font-mono text-[11px] font-bold border-2 border-black uppercase flex items-center justify-between transition-all duration-100 ${
                    isSelected ? "bg-black text-white" : "bg-neutral-50 hover:bg-neutral-200 text-black"
                  }`}
                >
                  <span>{range.label}</span>
                  {isSelected && <span className="font-mono text-xs">●</span>}
                </button>
              );
            })}
            
            {selectedPriceRange && (
              <button
                onClick={() => setSelectedPriceRange(null)}
                className="w-full text-center py-2 bg-neutral-100 hover:bg-neutral-200 text-black text-[10px] font-mono uppercase font-bold border border-black mt-2"
              >
                RESET FILTERS [X]
              </button>
            )}
          </div>

          {/* Search state context indicators */}
          {q && (
            <div className="pt-4 border-t border-neutral-200 space-y-2">
              <span className="font-mono text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                ACTIVE SEARCH
              </span>
              <div className="flex items-center justify-between bg-neutral-100 border border-black p-2 font-mono text-[11px]">
                <span className="truncate pr-2">"{q}"</span>
                <button 
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.delete("q");
                    setSearchParams(params);
                  }}
                  className="font-bold hover:text-red-500 font-sans"
                >
                  ×
                </button>
              </div>
            </div>
          )}

        </aside>

        {/* PRODUCTS GRID */}
        <main className="lg:col-span-9 space-y-6">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <span className="font-mono text-xs animate-pulse text-neutral-500">
                FETCHING PRODUCTS DATABASE...
              </span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="border-4 border-black p-12 text-center bg-white space-y-3 shadow-[4px_4px_0px_0px_#000000]">
              <AlertTriangle className="w-8 h-8 mx-auto text-neutral-500" />
              <p className="font-mono text-xs font-bold uppercase">No matching products found</p>
              <p className="text-[11px] text-neutral-400 font-mono uppercase">
                Try modifying your query or resetting the price filter parameters.
              </p>
              <button
                onClick={() => {
                  setSelectedPriceRange(null);
                  const params = new URLSearchParams(searchParams);
                  params.delete("q");
                  setSearchParams(params);
                }}
                className="px-4 py-2 border-2 border-black bg-black text-white font-mono text-[10px] font-bold hover:bg-white hover:text-black transition-all uppercase"
              >
                RESET ALL FILTERS
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((prod) => (
                <Link
                  key={prod.id}
                  to={`/products/${prod.id}`}
                  className="group bg-white border-2 border-black hover:shadow-[4px_4px_0px_0px_#000000] transition-all flex flex-col h-full"
                >
                  {/* Square main product image, switching to second image on hover */}
                  <div className="aspect-square border-b-2 border-black bg-neutral-100 overflow-hidden relative">
                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      referrerPolicy="no-referrer"
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${
                        prod.images[1] ? "group-hover:opacity-0" : ""
                      }`}
                    />
                    {prod.images[1] && (
                      <img
                        src={prod.images[1]}
                        alt={`${prod.name} hover view`}
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-300"
                      />
                    )}
                    <span className="absolute top-2 left-2 bg-white text-black text-[9px] font-mono font-bold px-1.5 py-0.5 border border-black uppercase">
                      {prod.category}
                    </span>
                  </div>

                  {/* Product details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center space-x-1.5 mb-1.5">
                        {prod.storeLogo && (
                          <img
                            src={prod.storeLogo}
                            alt={prod.storeName}
                            referrerPolicy="no-referrer"
                            className="w-4 h-4 rounded-full border border-black"
                          />
                        )}
                        <span className="font-mono text-[10px] text-neutral-500 uppercase">
                          {prod.storeName}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-sm text-black group-hover:underline uppercase leading-snug line-clamp-2">
                        {prod.name}
                      </h3>
                    </div>

                    {profile?.role === "Admin" && (
                      <div className="pt-2 border-t border-dashed border-neutral-200 flex justify-between text-[10px] font-mono text-neutral-500 uppercase">
                        <span>seen by: {prod.views || 0}</span>
                        <span>{prod.clicks || 0} clicks</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-black">
                        {prod.price.toLocaleString()} {prod.currency}
                      </span>
                      <div className="flex items-center text-[10px] font-mono text-neutral-400 group-hover:text-black font-bold uppercase transition-colors">
                        <span>EXPLORE</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-1 transition-transform" />
                      </div>
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
