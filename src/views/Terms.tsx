import { ArcTopRight, RibbonLoop } from "../components/BrandShapes";
import Breadcrumbs from "../components/Breadcrumbs";
import PolicyContent from "../components/PolicyContent";

export default function Terms() {
  return (
    <div className="min-h-[calc(100dvh+6rem)] md:min-h-[calc(100dvh+7rem)] -mt-24 bg-paper text-ink pb-28 relative overflow-x-hidden w-full md:-mt-28">
      {/* Hero section */}
      <section data-surface="dark" className="relative z-10 overflow-hidden bg-brand text-paper">
        <RibbonLoop
          className="pointer-events-none absolute -right-24 -top-16 z-0 opacity-20"
          style={{ width: "clamp(20rem, 44vw, 38rem)" }}
          ribbon="var(--color-wave)"
          dot="var(--color-paper)"
        />
        <ArcTopRight
          className="pointer-events-none absolute -left-24 -bottom-24 z-0 rotate-180 opacity-15"
          style={{ width: "clamp(14rem, 28vw, 22rem)" }}
          fill="var(--color-paper)"
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-10 pt-[121px] md:px-8 md:pb-14 md:pt-[149px]">
          <h1 className="display mx-auto max-w-3xl text-center text-3xl normal-case font-medium leading-[1.25] text-paper md:text-5xl">
            Điều khoản &amp; Chính sách
          </h1>
          <p className="mt-3 text-center text-xs md:text-sm text-white/75 max-w-xl mx-auto">
            Minh bạch, rõ ràng và tôn trọng sự riêng tư của người xem và các đối tác đồng hành cùng Tí.
          </p>
        </div>
      </section>

      {/* Main content body */}
      <div data-surface="light" className="max-w-4xl mx-auto px-4 md:px-8 mt-6 space-y-6 relative z-10">
        <Breadcrumbs
          trail={[{ label: "Trang chủ", to: "/" }, { label: "Điều khoản & Chính sách" }]}
        />

        <div className="rounded-[2rem] border border-ink/10 bg-paper p-6 md:p-12 shadow-sm">
          <PolicyContent initialTab="terms" showTabs={true} />
        </div>
      </div>
    </div>
  );
}
