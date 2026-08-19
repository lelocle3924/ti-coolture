import { Link } from "react-router-dom";
import Brandmark from "./Brandmark";

/**
 * Four-column footer, structure taken from the Lovable mockup
 * (description + email · Khám phá · Thông tin · legal row with VI/EN).
 * Rendered on ink rather than the mockup's pale ground, per the brand
 * guidelines' violet/ink dominance.
 */
export default function Footer() {
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
              href="mailto:hello@ticoolture.vn"
              className="mt-4 inline-flex items-center min-h-11 text-sm text-wave hover:underline"
            >
              hello@ticoolture.vn
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
                { to: "/blog", label: "Tạp chí" },
                { to: "/#lotrinh", label: "Lộ trình khám phá" },
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
              {["Về Tí", "Hợp tác với Tí", "Điều khoản sử dụng", "Chính sách bảo mật"].map((label) => (
                <li key={label}>
                  <span className="inline-flex items-center min-h-11 text-sm text-white/50" title="Chưa có trang này">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/12 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0 text-xs text-white/55">© 2026 Tí Coolture</p>
          <p className="m-0 text-xs text-white/55">
            Tí Coolture không bán hàng và không xử lý giao dịch.
          </p>
        </div>

        
      </div>
    </footer>
  );
}
