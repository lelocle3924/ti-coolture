import React from "react";
import { useNavigate } from "react-router-dom";
import { incrementProductClick } from "../lib/dbService";
import { Product } from "../types";
import { CoverflowCarousel } from "./ui/coverflow-carousel";

const formatPrice = (value: number) =>
  value > 0 ? `${value.toLocaleString("vi-VN")}₫` : "Liên hệ";

export default function FilmStrip({ products }: { products: Product[] }) {
  const navigate = useNavigate();

  if (products.length === 0) return null;

  const slides = products.map((prod) => ({
    src: prod.images[0],
    alt: prod.name,
    title: prod.name,
    subtitle: prod.storeName,
    meta: [
      { label: "Giá", value: formatPrice(prod.price) },
      { label: "Danh mục", value: prod.category },
    ],
  }));

  const handleSlideClick = (index: number) => {
    const prod = products[index];
    if (prod) {
      incrementProductClick(prod.id);
      navigate(`/products/${prod.id}`, { viewTransition: true });
    }
  };

  return (
    <div className="w-full relative py-2">
      <CoverflowCarousel
        slides={slides}
        showCaption
        showNavigation
        showPagination
        onSlideClick={handleSlideClick}
        cardClassName="cursor-pointer"
      />
    </div>
  );
}
