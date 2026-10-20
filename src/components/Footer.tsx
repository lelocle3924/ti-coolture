import { useState } from "react";
import { Link } from "react-router-dom";
import Brandmark from "./Brandmark";
import PartnerApplyModal from "./PartnerApplyModal";

/**
 * Four-column footer, structure taken from the Lovable mockup
 * (description + email · Khám phá · Thông tin · legal row with VI/EN).
 * Rendered on ink rather than the mockup's pale ground, per the brand
 * guidelines' violet/ink dominance.
 */
export default function Footer() {
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  return (
    <footer className="bg-ink text-paper border-t border-white/10">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="grid gap-10 md:grid-cols-4 md:gap-8">
          <div className="md:col-span-2 md:max-w-sm">
            <Brandmark className="w-[104px] h-auto"  />
            <p className="mt-5 text-sm leading-relaxed text-white/80">
              Nơi tuyển chọn local brand và artist Việt.
            </p>
            <a
              href="mailto:creativespace.ticoolture@gmail.com"
              className="mt-4 inline-flex items-center min-h-11 text-sm text-wave hover:underline"
            >
              creativespace.ticoolture@gmail.com
            </a>
          </div>

          <nav aria-labelledby="footer-explore">
            <h2 id="footer-explore" className="label text-white/55">
              Khám phá
            </h2>
            <ul className="mt-4 space-y-1">
              {[
                { to: "/products", label: "Sản phẩm" },
                { to: "/stores", label: "Shop" },
                { to: "/discover", label: "Khám phá" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="inline-flex items-center min-h-11 text-sm text-white/86 hover:text-wave transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-info">
            <h2 id="footer-info" className="label text-white/55">
              Thông tin
            </h2>
            <ul className="mt-4 space-y-1">
              <li>
                <Link
                  to="/about"
                  className="inline-flex items-center min-h-11 text-sm text-white/86 hover:text-wave transition-colors"
                >
                  Về Tí
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="inline-flex items-center min-h-11 text-sm text-white/86 hover:text-wave transition-colors"
                >
                  Điều khoản &amp; Điều kiện
                </Link>
              </li>
              <li>
                <Link
                  to="/open-shop"
                  className="inline-flex items-center min-h-11 text-sm text-wave hover:underline font-medium cursor-pointer"
                >
                  Hợp tác với Tí (Mở shop)
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/12 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0 text-xs text-white/55">© 2026 Tí Coolture</p>
          <p className="m-0 text-xs text-white/55">
            Tí Coolture không bán hàng và không xử lý giao dịch.
          </p>
        </div>

        <PartnerApplyModal isOpen={isApplyOpen} onClose={() => setIsApplyOpen(false)} />
      </div>
    </footer>
  );
}
